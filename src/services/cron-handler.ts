/**
 * SEOFix AI - CronHandlerService
 * Executes recurring scheduled audits across all active projects and sends alert notifications.
 */

import { dbStore } from '../lib/store';
import { CrawlerService } from './crawler';
import { AuditEngine } from './audit-engine';
import { AIGeneratorService } from './ai-generator';
import { PageSpeedService } from './pagespeed';
import { ResendEmailService } from './resend-email';

export class CronHandlerService {
  private static crawler = new CrawlerService();

  /**
   * Run recurring audits across all active projects.
   */
  public static async executeScheduledAudits(authToken?: string): Promise<{ success: boolean; auditedProjects: number; details: any[] }> {
    const requiredSecret = process.env.CRON_SECRET;
    if (requiredSecret && authToken !== `Bearer ${requiredSecret}` && authToken !== requiredSecret) {
      throw new Error('Unauthorized: Invalid CRON_SECRET token.');
    }

    const projects = dbStore.getProjects().filter(p => p.status === 'active');
    const auditLogs: any[] = [];

    for (const project of projects) {
      try {
        console.log(`[CronHandler] Starting scheduled audit for project: ${project.domain}`);

        // 1. Crawl
        const crawledPages = await this.crawler.crawlSite(project.url, 10);

        // 2. PageSpeed Metrics
        const psi = await PageSpeedService.analyze(project.url, 'mobile');

        // 3. Run Audit
        const auditResult = AuditEngine.runAudit(crawledPages, psi);

        // Check previous score for drop alert
        const previousAudit = dbStore.getLatestAudit(project.id);
        const scoreDrop = previousAudit ? previousAudit.score_overall - auditResult.scoreOverall : 0;

        // 4. Save Audit Record
        const savedAudit = dbStore.saveAudit({
          project_id: project.id,
          score_overall: auditResult.scoreOverall,
          score_technical: auditResult.scoreTechnical,
          score_content: auditResult.scoreContent,
          score_performance: auditResult.scorePerformance,
          metrics: auditResult.metrics,
        });

        // 5. Save Pages
        for (const page of crawledPages) {
          dbStore.savePage({
            project_id: project.id,
            url: page.url,
            title: page.parsed.title || null,
            meta_description: page.parsed.metaDescription || null,
            h1: page.parsed.h1List[0] || null,
            word_count: page.parsed.wordCount,
            is_indexed: !page.parsed.isNoIndex,
          });
        }

        // 6. Save Issues & Generate Recommendations
        const criticalIssuesList: string[] = [];
        for (const issue of auditResult.issues) {
          const savedIssue = dbStore.saveIssue({
            audit_id: savedAudit.id,
            page_id: null,
            page_url: issue.pageUrl,
            type: issue.type,
            severity: issue.severity,
            description: issue.description,
            status: 'open',
          });

          if (issue.severity === 'critical') {
            criticalIssuesList.push(issue.description);
          }

          // Generate AI recommendation
          const rec = await AIGeneratorService.generateFix(issue);
          dbStore.saveRecommendation({
            issue_id: savedIssue.id,
            suggested_fix: rec.suggestedFix,
            ai_model: rec.aiModel,
            code_snippet: rec.codeSnippet,
            explanation: rec.explanation,
            estimated_ranking_impact: rec.estimatedRankingImpact,
          });
        }

        // 7. Fire Email Alert if score dropped by >= 5 points or critical issues found
        if (scoreDrop >= 5 || criticalIssuesList.length > 0) {
          await ResendEmailService.sendAuditAlert({
            to: 'admin@seofix.ai',
            projectName: project.domain,
            projectDomain: project.domain,
            scoreOverall: auditResult.scoreOverall,
            criticalIssuesCount: criticalIssuesList.length,
            criticalIssuesList: criticalIssuesList.slice(0, 5),
          });
        }

        auditLogs.push({
          projectId: project.id,
          domain: project.domain,
          scoreOverall: auditResult.scoreOverall,
          scoreDrop,
          criticalCount: criticalIssuesList.length,
        });
      } catch (err: any) {
        console.error(`[CronHandler] Failed audit for project ${project.domain}:`, err.message);
        auditLogs.push({ projectId: project.id, domain: project.domain, error: err.message });
      }
    }

    return {
      success: true,
      auditedProjects: auditLogs.length,
      details: auditLogs,
    };
  }
}
