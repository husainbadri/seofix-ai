import { AuditIssue } from '@ai-seo/seo-engine';

export interface ActionableFixRecommendation {
  issueId: string;
  issueTitle: string;
  explanation: string;
  seoImpact: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedRankingImpact: number; // 1 - 100
  aiSuggestedFix: string;
  codeSnippet?: string;
  suggestedMetadata?: {
    title?: string;
    description?: string;
    h1?: string;
  };
  suggestedSchemaJson?: string;
}

export class AIRecommendationGenerator {
  public generateFixes(issues: AuditIssue[]): ActionableFixRecommendation[] {
    return issues.map(issue => {
      const estimatedRankingImpact = Math.min(99, Math.max(20, issue.estimatedImpact + 10));

      let codeSnippet = issue.aiFixCode;
      let suggestedSchemaJson: string | undefined;

      if (issue.subSkill === 'structured-data' || issue.subSkill === 'local-seo') {
        suggestedSchemaJson = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": issue.title,
          "description": issue.description,
          "url": issue.pageUrl
        }, null, 2);
      }

      return {
        issueId: issue.id,
        issueTitle: issue.title,
        explanation: `AI Diagnostics: ${issue.description} Fix this issue to eliminate indexability or performance bottlenecks.`,
        seoImpact: issue.severity as any,
        estimatedRankingImpact,
        aiSuggestedFix: issue.recommendation,
        codeSnippet,
        suggestedMetadata: {
          title: `Optimized: ${issue.title.slice(0, 45)} | Brand`,
          description: `Actionable resolution for ${issue.title}. Boost domain indexability and search visibility.`,
          h1: issue.title
        },
        suggestedSchemaJson
      };
    });
  }
}
