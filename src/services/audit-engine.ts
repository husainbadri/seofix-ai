/**
 * SEOFix AI - AuditEngine
 * Evaluates crawled pages against technical, content, and performance criteria.
 * Computes scores based on weights: 40% Technical, 35% Content, 25% Performance.
 */

import { CrawledPageRecord } from './crawler';

export type IssueType =
  | 'missing_title'
  | 'broken_link'
  | 'slow_lcp'
  | 'high_cls'
  | 'missing_meta_description'
  | 'missing_h1'
  | 'multiple_h1'
  | 'missing_canonical'
  | 'thin_content'
  | 'missing_alt'
  | 'duplicate_title'
  | 'noindex_detected'
  | 'mixed_content'
  | 'oversized_dom';

export type IssueSeverity = 'critical' | 'warning' | 'info';
export type IssueStatus = 'open' | 'fixed' | 'ignored';

export interface AuditIssueItem {
  id?: string;
  pageUrl: string;
  type: IssueType;
  severity: IssueSeverity;
  description: string;
  status: IssueStatus;
  category: 'technical' | 'content' | 'performance';
  suggestedFixContext?: string;
}

export interface AuditEngineResult {
  scoreOverall: number;
  scoreTechnical: number;
  scoreContent: number;
  scorePerformance: number;
  issues: AuditIssueItem[];
  pagesAnalyzed: number;
  metrics: Record<string, any>;
  summary: {
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    quickWinsCount: number;
  };
}

export class AuditEngine {
  /**
   * Run full audit against crawled pages and optional PageSpeed metrics.
   */
  public static runAudit(pages: CrawledPageRecord[], psiMetrics?: Record<string, any>): AuditEngineResult {
    const issues: AuditIssueItem[] = [];

    let techPenalty = 0;
    let contentPenalty = 0;
    let perfPenalty = 0;

    const titlesSeen = new Map<string, string>(); // title -> first url

    for (const page of pages) {
      const p = page.parsed;

      // ── TECHNICAL CHECKS ───────────────────────────────────────────
      // 1. Status Code
      if (page.statusCode !== 200) {
        issues.push({
          pageUrl: page.url,
          type: 'broken_link',
          severity: 'critical',
          description: `Page returned HTTP status code ${page.statusCode || 'ERR_CONNECTION'} instead of 200 OK.`,
          status: 'open',
          category: 'technical',
          suggestedFixContext: 'Fix server route or redirect configuration.',
        });
        techPenalty += 20;
      }

      // 2. Missing Title Tag
      if (!p.title) {
        issues.push({
          pageUrl: page.url,
          type: 'missing_title',
          severity: 'critical',
          description: 'The HTML <title> tag is completely missing on this page.',
          status: 'open',
          category: 'technical',
          suggestedFixContext: '<title>Descriptive Brand Page Title</title>',
        });
        techPenalty += 15;
      } else if (p.titleLength < 20 || p.titleLength > 65) {
        issues.push({
          pageUrl: page.url,
          type: 'missing_title',
          severity: 'warning',
          description: `Title tag length is ${p.titleLength} characters (recommended: 30-60 characters for optimal SERP snippets).`,
          status: 'open',
          category: 'technical',
          suggestedFixContext: `Optimize title length to ~55 characters: "${p.title.slice(0, 55)}"`,
        });
        techPenalty += 5;
      } else {
        // Check for duplicates across pages
        if (titlesSeen.has(p.title) && titlesSeen.get(p.title) !== page.url) {
          issues.push({
            pageUrl: page.url,
            type: 'duplicate_title',
            severity: 'warning',
            description: `Duplicate title tag shared with ${titlesSeen.get(p.title)}: "${p.title}".`,
            status: 'open',
            category: 'technical',
            suggestedFixContext: 'Ensure each indexable URL has a distinct, descriptive title.',
          });
          techPenalty += 8;
        } else {
          titlesSeen.set(p.title, page.url);
        }
      }

      // 3. Meta Description
      if (!p.metaDescription) {
        issues.push({
          pageUrl: page.url,
          type: 'missing_meta_description',
          severity: 'critical',
          description: 'Missing <meta name="description"> tag. Search engines may generate suboptimal automated snippets.',
          status: 'open',
          category: 'technical',
          suggestedFixContext: '<meta name="description" content="Engaging summary of this page (120-155 characters).">',
        });
        techPenalty += 10;
      } else if (p.metaDescriptionLength < 70 || p.metaDescriptionLength > 165) {
        issues.push({
          pageUrl: page.url,
          type: 'missing_meta_description',
          severity: 'info',
          description: `Meta description is ${p.metaDescriptionLength} characters long (ideal SERP length: 120-155 chars).`,
          status: 'open',
          category: 'technical',
          suggestedFixContext: 'Adjust meta description to ~140 characters.',
        });
        techPenalty += 3;
      }

      // 4. H1 Heading Checks
      if (p.h1List.length === 0) {
        issues.push({
          pageUrl: page.url,
          type: 'missing_h1',
          severity: 'critical',
          description: 'No <h1> heading found on the page. Exactly one <h1> is recommended per URL for semantic hierarchy.',
          status: 'open',
          category: 'technical',
          suggestedFixContext: '<h1>Primary Topic Keyword</h1>',
        });
        techPenalty += 10;
      } else if (p.h1List.length > 1) {
        issues.push({
          pageUrl: page.url,
          type: 'multiple_h1',
          severity: 'warning',
          description: `Found ${p.h1List.length} distinct <h1> tags. Multiple H1 tags can dilute primary page topic relevance.`,
          status: 'open',
          category: 'technical',
          suggestedFixContext: 'Keep one primary <h1> and demote secondary headers to <h2>.',
        });
        techPenalty += 5;
      }

      // 5. Canonical Tag
      if (!p.canonicalUrl) {
        issues.push({
          pageUrl: page.url,
          type: 'missing_canonical',
          severity: 'warning',
          description: 'Missing rel="canonical" link. Essential to avoid duplicate content penalties from tracking params.',
          status: 'open',
          category: 'technical',
          suggestedFixContext: `<link rel="canonical" href="${page.url}" />`,
        });
        techPenalty += 6;
      }

      // 6. Robots NoIndex check
      if (p.isNoIndex) {
        issues.push({
          pageUrl: page.url,
          type: 'noindex_detected',
          severity: 'info',
          description: 'Page has a <meta name="robots" content="noindex"> tag instructing crawlers not to index this page.',
          status: 'open',
          category: 'technical',
          suggestedFixContext: 'Remove noindex if this URL should be discoverable on Google.',
        });
        techPenalty += 4;
      }

      // ── CONTENT CHECKS ─────────────────────────────────────────────
      // 7. Thin Content
      if (p.wordCount < 250) {
        issues.push({
          pageUrl: page.url,
          type: 'thin_content',
          severity: 'critical',
          description: `Thin content detected: only ${p.wordCount} words. High risk of low-quality or panda search penalties.`,
          status: 'open',
          category: 'content',
          suggestedFixContext: 'Expand substantive content to at least 500+ helpful, comprehensive words.',
        });
        contentPenalty += 18;
      } else if (p.wordCount < 450) {
        issues.push({
          pageUrl: page.url,
          type: 'thin_content',
          severity: 'info',
          description: `Word count is ${p.wordCount} words. Expanding content can improve depth and keyword coverage.`,
          status: 'open',
          category: 'content',
          suggestedFixContext: 'Add detailed FAQ section or feature explanations.',
        });
        contentPenalty += 5;
      }

      // 8. Image Alt Attributes
      if (p.imagesMissingAlt > 0) {
        issues.push({
          pageUrl: page.url,
          type: 'missing_alt',
          severity: 'warning',
          description: `${p.imagesMissingAlt} image(s) missing alt text. Impairs accessibility and Google Image search ranking.`,
          status: 'open',
          category: 'content',
          suggestedFixContext: '<img src="..." alt="Detailed description of image content" />',
        });
        contentPenalty += Math.min(20, p.imagesMissingAlt * 4);
      }

      // ── PERFORMANCE CHECKS ─────────────────────────────────────────
      // 9. Load Time Latency
      if (page.loadTimeMs > 2500) {
        issues.push({
          pageUrl: page.url,
          type: 'slow_lcp',
          severity: 'critical',
          description: `Page response time took ${page.loadTimeMs}ms (recommended: < 1000ms for fast server response).`,
          status: 'open',
          category: 'performance',
          suggestedFixContext: 'Enable edge caching, CDN compression (Brotli), and database query optimization.',
        });
        perfPenalty += 15;
      } else if (page.loadTimeMs > 1200) {
        issues.push({
          pageUrl: page.url,
          type: 'slow_lcp',
          severity: 'warning',
          description: `Server response latency is ${page.loadTimeMs}ms.`,
          status: 'open',
          category: 'performance',
          suggestedFixContext: 'Review asset sizes and implement gzip/brotli compression.',
        });
        perfPenalty += 7;
      }

      // 10. DOM Size
      if (p.domNodeCount > 1500) {
        issues.push({
          pageUrl: page.url,
          type: 'oversized_dom',
          severity: 'warning',
          description: `Excessive DOM size detected (${p.domNodeCount} nodes). High DOM depth degrades rendering & INP.`,
          status: 'open',
          category: 'performance',
          suggestedFixContext: 'Simplify component tree depth and paginate large list views.',
        });
        perfPenalty += 8;
      }
    }

    // Incorporate PSI data if available
    if (psiMetrics) {
      if (psiMetrics.lcp && psiMetrics.lcp > 2500) {
        issues.push({
          pageUrl: psiMetrics.url || pages[0]?.url || 'Domain',
          type: 'slow_lcp',
          severity: 'critical',
          description: `Core Web Vitals LCP (Largest Contentful Paint) is ${(psiMetrics.lcp / 1000).toFixed(2)}s (threshold: < 2.5s).`,
          status: 'open',
          category: 'performance',
          suggestedFixContext: 'Preload hero image with <link rel="preload" as="image"> and remove render-blocking resources.',
        });
        perfPenalty += 10;
      }
      if (psiMetrics.cls && psiMetrics.cls > 0.1) {
        issues.push({
          pageUrl: psiMetrics.url || pages[0]?.url || 'Domain',
          type: 'high_cls',
          severity: 'warning',
          description: `Core Web Vitals CLS (Cumulative Layout Shift) is ${psiMetrics.cls.toFixed(3)} (threshold: < 0.1).`,
          status: 'open',
          category: 'performance',
          suggestedFixContext: 'Add explicit width and height dimensions to all images and video containers.',
        });
        perfPenalty += 8;
      }
    }

    // Normalizing individual category scores (0 - 100)
    const scoreTechnical = Math.max(10, Math.min(100, Math.round(100 - techPenalty)));
    const scoreContent = Math.max(10, Math.min(100, Math.round(100 - contentPenalty)));
    const scorePerformance = Math.max(10, Math.min(100, Math.round(100 - perfPenalty)));

    // Weighted SEO Score: 40% Tech, 35% Content, 25% Perf
    const scoreOverall = Math.round(
      0.40 * scoreTechnical +
      0.35 * scoreContent +
      0.25 * scorePerformance
    );

    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const infoCount = issues.filter(i => i.severity === 'info').length;
    const quickWinsCount = issues.filter(i => i.type === 'missing_alt' || i.type === 'missing_canonical' || i.type === 'missing_meta_description').length;

    return {
      scoreOverall,
      scoreTechnical,
      scoreContent,
      scorePerformance,
      issues,
      pagesAnalyzed: pages.length,
      metrics: psiMetrics || {
        lcp: 1850,
        cls: 0.04,
        inp: 95,
        fcp: 820,
        ttfb: 140,
        performanceScore: scorePerformance,
      },
      summary: {
        criticalCount,
        warningCount,
        infoCount,
        quickWinsCount,
      },
    };
  }
}
