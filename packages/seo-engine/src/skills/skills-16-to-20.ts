import { SEOAuditSkill, CrawlContext, SubSkillResult, AuditIssue, AuditSeverity } from '../types';

export class SitemapSkill implements SEOAuditSkill {
  id = 'sitemap';
  name = 'Sitemap.xml Audit';
  category = 'Indexability';

  async execute(context: CrawlContext): Promise<SubSkillResult> {
    const issues: AuditIssue[] = [];

    if (!context.sitemapXml) {
      issues.push({
        id: `missing-sitemap-${context.targetDomain}`,
        pageUrl: `https://${context.targetDomain}/sitemap.xml`,
        subSkill: this.id,
        category: this.category,
        severity: AuditSeverity.HIGH,
        score: 30,
        title: 'Missing or Unreachable Sitemap.xml',
        description: 'No XML sitemap was found at /sitemap.xml. XML sitemaps assist search engine bots in indexing deep, newly created content efficiently.',
        recommendation: 'Generate an XML sitemap and reference it inside your robots.txt file.',
        aiFixCode: `# Next.js sitemap.ts example\nexport default function sitemap() {\n  return [\n    { url: 'https://${context.targetDomain}', lastModified: new Date() }\n  ]\n}`,
        estimatedImpact: 80
      });
    }

    return {
      skillId: this.id,
      skillName: this.name,
      category: this.category,
      score: context.sitemapXml ? 95 : 30,
      issues,
      metrics: { hasSitemap: Boolean(context.sitemapXml) }
    };
  }
}

export class RobotsTxtSkill implements SEOAuditSkill {
  id = 'robots-txt';
  name = 'Robots.txt Directives';
  category = 'Indexability';

  async execute(context: CrawlContext): Promise<SubSkillResult> {
    const issues: AuditIssue[] = [];

    if (!context.robotsTxt) {
      issues.push({
        id: `missing-robots-${context.targetDomain}`,
        pageUrl: `https://${context.targetDomain}/robots.txt`,
        subSkill: this.id,
        category: this.category,
        severity: AuditSeverity.MEDIUM,
        score: 50,
        title: 'Missing Robots.txt File',
        description: 'No robots.txt file was discovered. Crawlers rely on robots.txt for crawl budget optimization and disallow directives.',
        recommendation: 'Create a robots.txt file at your site root.',
        aiFixCode: `User-agent: *\nAllow: /\nSitemap: https://${context.targetDomain}/sitemap.xml`,
        estimatedImpact: 60
      });
    } else if (context.robotsTxt.includes('Disallow: /') && !context.robotsTxt.includes('Disallow: /admin')) {
      issues.push({
        id: `blocking-robots-${context.targetDomain}`,
        pageUrl: `https://${context.targetDomain}/robots.txt`,
        subSkill: this.id,
        category: this.category,
        severity: AuditSeverity.CRITICAL,
        score: 0,
        title: 'Entire Site Disallowed in Robots.txt',
        description: 'Robots.txt contains "Disallow: /" directive blocking all search engines from indexing the entire website.',
        recommendation: 'Remove "Disallow: /" directive to allow search engines to crawl public pages.',
        aiFixCode: `User-agent: *\nAllow: /`,
        estimatedImpact: 100
      });
    }

    return {
      skillId: this.id,
      skillName: this.name,
      category: this.category,
      score: context.robotsTxt ? 90 : 50,
      issues,
      metrics: { hasRobotsTxt: Boolean(context.robotsTxt) }
    };
  }
}

export class CanonicalTagsSkill implements SEOAuditSkill {
  id = 'canonical-tags';
  name = 'Canonical Tags Audit';
  category = 'Indexability';

  async execute(context: CrawlContext): Promise<SubSkillResult> {
    const issues: AuditIssue[] = [];
    let missingCanonicalCount = 0;

    for (const page of context.pages) {
      if (!page.canonicalUrl) {
        missingCanonicalCount++;
        issues.push({
          id: `missing-canonical-${page.url}`,
          pageUrl: page.url,
          subSkill: this.id,
          category: this.category,
          severity: AuditSeverity.HIGH,
          score: 35,
          title: 'Missing Canonical Tag',
          description: 'No rel="canonical" link tag specified. Missing canonical tags lead to duplicate content issues when URLs contain query params or tracking codes.',
          recommendation: 'Add a self-referencing rel="canonical" tag to every indexable page.',
          aiFixCode: `<link rel="canonical" href="${page.url}" />`,
          estimatedImpact: 85
        });
      }
    }

    const score = context.pages.length > 0 ? Math.max(0, Math.round(100 - (missingCanonicalCount / context.pages.length) * 80)) : 100;

    return {
      skillId: this.id,
      skillName: this.name,
      category: this.category,
      score,
      issues,
      metrics: { missingCanonicalCount }
    };
  }
}

export class RedirectsSkill implements SEOAuditSkill {
  id = 'redirects';
  name = 'Redirects & Chains';
  category = 'Technical';

  async execute(context: CrawlContext): Promise<SubSkillResult> {
    const issues: AuditIssue[] = [];
    let redirectCount = 0;

    for (const page of context.pages) {
      if (page.statusCode === 301 || page.statusCode === 302) {
        redirectCount++;
        if (page.statusCode === 302) {
          issues.push({
            id: `temp-redirect-${page.url}`,
            pageUrl: page.url,
            subSkill: this.id,
            category: this.category,
            severity: AuditSeverity.MEDIUM,
            score: 60,
            title: 'Temporary 302 Redirect Used Instead of Permanent 301',
            description: '302 temporary redirects do not pass target page PageRank equity properly compared to 301 permanent redirects.',
            recommendation: 'Update server configuration to send a 301 Permanent Redirect.',
            aiFixCode: `# Apache .htaccess 301 redirect\nRedirect 301 /old-page https://${context.targetDomain}/new-page`,
            estimatedImpact: 60
          });
        }
      }
    }

    return {
      skillId: this.id,
      skillName: this.name,
      category: this.category,
      score: redirectCount > 0 ? 80 : 100,
      issues,
      metrics: { redirectCount }
    };
  }
}

export class DuplicateContentSkill implements SEOAuditSkill {
  id = 'duplicate-content';
  name = 'Duplicate Content & MinHash';
  category = 'Content';

  async execute(context: CrawlContext): Promise<SubSkillResult> {
    const issues: AuditIssue[] = [];
    const titlesMap = new Map<string, string[]>();

    for (const page of context.pages) {
      if (page.title) {
        const existing = titlesMap.get(page.title) || [];
        existing.push(page.url);
        titlesMap.set(page.title, existing);
      }
    }

    let duplicateTitleCount = 0;
    for (const [title, urls] of titlesMap.entries()) {
      if (urls.length > 1) {
        duplicateTitleCount += urls.length;
        for (const u of urls) {
          issues.push({
            id: `dup-title-${u}`,
            pageUrl: u,
            subSkill: this.id,
            category: this.category,
            severity: AuditSeverity.HIGH,
            score: 40,
            title: `Duplicate Title Tag ("${title}")`,
            description: `Identical title tag "${title}" is shared across ${urls.length} pages: ${urls.join(', ')}.`,
            recommendation: 'Craft unique, topic-specific title tags for each page.',
            aiFixCode: `<title>${title} - Unique Section Modifier</title>`,
            estimatedImpact: 80
          });
        }
      }
    }

    const score = Math.max(0, 100 - duplicateTitleCount * 15);

    return {
      skillId: this.id,
      skillName: this.name,
      category: this.category,
      score,
      issues,
      metrics: { duplicateTitleCount }
    };
  }
}
