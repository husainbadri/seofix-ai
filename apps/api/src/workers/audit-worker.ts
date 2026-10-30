import { SEOAuditOrchestrator } from '@ai-seo/seo-engine';
import { InMemoryDbStore } from '@ai-seo/database';

export class AuditQueueWorker {
  private orchestrator: SEOAuditOrchestrator;
  private dbStore: InMemoryDbStore;

  constructor() {
    this.orchestrator = new SEOAuditOrchestrator();
    this.dbStore = InMemoryDbStore.getInstance();
  }

  public async processCrawlJob(jobData: { jobId: string; projectId: string; domain: string; maxPages?: number }) {
    const { jobId, projectId, domain, maxPages = 10 } = jobData;
    
    // Mark crawl job as crawling
    const jobRecord = {
      id: jobId,
      projectId,
      domain,
      status: 'CRAWLING',
      pagesCrawled: 0,
      startedAt: new Date()
    };
    this.dbStore.crawlJobs.push(jobRecord);

    try {
      // Execute 25 sub-skills audit orchestrator
      const report = await this.orchestrator.runFullAudit(domain, maxPages);

      jobRecord.status = 'COMPLETED';
      (jobRecord as any).completedAt = new Date();
      (jobRecord as any).pagesCrawled = report.crawledPagesCount;

      // Save summary
      const summaryRecord = {
        id: `summary-${jobId}`,
        projectId,
        crawlJobId: jobId,
        overallScore: report.overallScore,
        technicalScore: report.technicalScore,
        performanceScore: report.performanceScore,
        contentScore: report.contentScore,
        securityScore: report.securityScore,
        accessibilityScore: report.accessibilityScore,
        keywordScore: report.keywordScore,
        backlinkScore: report.backlinkScore,
        totalIssues: report.totalIssuesCount,
        criticalCount: report.criticalIssuesCount,
        highCount: report.highIssuesCount,
        quickWinsCount: report.quickWinsCount,
        executiveSummary: report.executiveSummary,
        createdAt: new Date()
      };
      this.dbStore.auditSummaries.push(summaryRecord);

      // Save issues
      for (const issue of report.allIssues) {
        this.dbStore.auditResults.push({
          ...issue,
          crawlJobId: jobId
        });
      }

      return report;
    } catch (err: any) {
      jobRecord.status = 'FAILED';
      (jobRecord as any).error = err.message || 'Audit execution error';
      throw err;
    }
  }
}
