import { WebsiteCrawler } from './crawler';
import { CrawlContext, SubSkillResult, AuditIssue, AuditSeverity } from './types';
import { WebsiteCrawlingSkill, TechnicalSEOSkill, OnPageSEOSkill, PerformanceSkill, AccessibilitySkill } from './skills/skills-1-to-5';
import { SecuritySkill, ContentQualitySkill, InternalLinkingSkill, ExternalLinksSkill, StructuredDataSkill } from './skills/skills-6-to-10';
import { LocalSEOSkill, ImageSEOSkill, VideoSEOSkill, MobileSEOSkill, CoreWebVitalsSkill } from './skills/skills-11-to-15';
import { SitemapSkill, RobotsTxtSkill, CanonicalTagsSkill, RedirectsSkill, DuplicateContentSkill } from './skills/skills-16-to-20';
import { KeywordCannibalizationSkill, BrokenLinksSkill, BacklinksSkill, CompetitorAnalysisSkill, AISEORecommendationsSkill } from './skills/skills-21-to-25';

export interface ComprehensiveAuditReport {
  targetDomain: string;
  overallScore: number;
  technicalScore: number;
  performanceScore: number;
  contentScore: number;
  securityScore: number;
  accessibilityScore: number;
  keywordScore: number;
  backlinkScore: number;
  totalIssuesCount: number;
  criticalIssuesCount: number;
  highIssuesCount: number;
  mediumIssuesCount: number;
  lowIssuesCount: number;
  quickWinsCount: number;
  executiveSummary: string;
  skillResults: SubSkillResult[];
  allIssues: AuditIssue[];
  crawledPagesCount: number;
  auditDurationMs: number;
}

export class SEOAuditOrchestrator {
  private crawler: WebsiteCrawler;
  private skills: any[];

  constructor() {
    this.crawler = new WebsiteCrawler();
    this.skills = [
      new WebsiteCrawlingSkill(),
      new TechnicalSEOSkill(),
      new OnPageSEOSkill(),
      new PerformanceSkill(),
      new AccessibilitySkill(),
      new SecuritySkill(),
      new ContentQualitySkill(),
      new InternalLinkingSkill(),
      new ExternalLinksSkill(),
      new StructuredDataSkill(),
      new LocalSEOSkill(),
      new ImageSEOSkill(),
      new VideoSEOSkill(),
      new MobileSEOSkill(),
      new CoreWebVitalsSkill(),
      new SitemapSkill(),
      new RobotsTxtSkill(),
      new CanonicalTagsSkill(),
      new RedirectsSkill(),
      new DuplicateContentSkill(),
      new KeywordCannibalizationSkill(),
      new BrokenLinksSkill(),
      new BacklinksSkill(),
      new CompetitorAnalysisSkill(),
      new AISEORecommendationsSkill()
    ];
  }

  public async runFullAudit(targetUrl: string, maxPages: number = 10): Promise<ComprehensiveAuditReport> {
    const startTime = Date.now();
    
    // Step 1: Crawl domain
    const context: CrawlContext = await this.crawler.crawlDomain(targetUrl, maxPages);

    // Step 2: Execute all 25 sub-skills in parallel
    const skillPromises = this.skills.map(skill => skill.execute(context));
    const skillResults: SubSkillResult[] = await Promise.all(skillPromises);

    // Step 3: Aggregate scores & issues
    const allIssues: AuditIssue[] = skillResults.flatMap(sr => sr.issues);
    
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    for (const issue of allIssues) {
      if (issue.severity === AuditSeverity.CRITICAL) criticalCount++;
      else if (issue.severity === AuditSeverity.HIGH) highCount++;
      else if (issue.severity === AuditSeverity.MEDIUM) mediumCount++;
      else lowCount++;
    }

    const quickWins = allIssues.filter(i => i.estimatedImpact >= 75 && (i.severity === AuditSeverity.HIGH || i.severity === AuditSeverity.MEDIUM));

    // Category Score Calculators
    const getCatScore = (cat: string): number => {
      const match = skillResults.filter(sr => sr.category.toLowerCase().includes(cat.toLowerCase()));
      if (match.length === 0) return 85;
      const sum = match.reduce((acc, curr) => acc + curr.score, 0);
      return Math.round(sum / match.length);
    };

    const technicalScore = getCatScore('technical') || getCatScore('crawling');
    const performanceScore = getCatScore('performance');
    const contentScore = getCatScore('content');
    const securityScore = getCatScore('security');
    const accessibilityScore = getCatScore('accessibility');
    const keywordScore = getCatScore('keyword');
    const backlinkScore = getCatScore('off-page');

    const overallScore = Math.round(
      (technicalScore * 0.20) +
      (performanceScore * 0.20) +
      (contentScore * 0.20) +
      (securityScore * 0.15) +
      (accessibilityScore * 0.10) +
      (keywordScore * 0.10) +
      (backlinkScore * 0.05)
    );

    const executiveSummary = `Comprehensive AI SEO audit completed for domain ${context.targetDomain}. Analyzed ${context.pages.length} pages across 25 specialized SEO sub-skills. Identified ${allIssues.length} total issues (${criticalCount} critical, ${highCount} high priority). Overall health score: ${overallScore}/100. Primary optimization priority: resolve ${criticalCount} critical indexability and performance blockers.`;

    return {
      targetDomain: context.targetDomain,
      overallScore,
      technicalScore,
      performanceScore,
      contentScore,
      securityScore,
      accessibilityScore,
      keywordScore,
      backlinkScore,
      totalIssuesCount: allIssues.length,
      criticalIssuesCount: criticalCount,
      highIssuesCount: highCount,
      mediumIssuesCount: mediumCount,
      lowIssuesCount: lowCount,
      quickWinsCount: quickWins.length,
      executiveSummary,
      skillResults,
      allIssues,
      crawledPagesCount: context.pages.length,
      auditDurationMs: Date.now() - startTime
    };
  }
}
