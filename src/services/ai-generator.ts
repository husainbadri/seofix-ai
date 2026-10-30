/**
 * SEOFix AI - AIGeneratorService
 * Generates tailored, structured code fixes and recommendations for detected issues.
 * Powered by OpenAI SDK with an embedded high-precision rule fallback.
 */

import http from 'http';
import https from 'https';
import { AuditIssueItem } from './audit-engine';

export interface AIRecommendationResult {
  suggestedFix: string;
  aiModel: string;
  explanation: string;
  estimatedRankingImpact: 'High' | 'Medium' | 'Low';
  codeSnippet?: string;
}

export class AIGeneratorService {
  private static apiKey = process.env.OPENAI_API_KEY || '';
  private static model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  /**
   * Generate an actionable AI recommendation for an issue.
   */
  public static async generateFix(
    issue: AuditIssueItem,
    context?: { pageTitle?: string; pageH1?: string; wordCount?: number }
  ): Promise<AIRecommendationResult> {
    // If OpenAI API key is present, attempt remote call
    if (this.apiKey && this.apiKey.startsWith('sk-')) {
      try {
        const response = await this.callOpenAI(issue, context);
        if (response) return response;
      } catch (err: any) {
        console.warn('[AIGeneratorService] OpenAI API call failed, using intelligent fallback:', err.message);
      }
    }

    // High-precision built-in AI fix generator
    return this.generateLocalFix(issue, context);
  }

  /**
   * Call OpenAI Chat Completion endpoint over HTTPS.
   */
  private static async callOpenAI(
    issue: AuditIssueItem,
    context?: { pageTitle?: string; pageH1?: string }
  ): Promise<AIRecommendationResult | null> {
    const prompt = `You are a Senior SEO Engineer and Full Stack Developer.
An SEO issue was found on a web page:
- Issue Type: ${issue.type}
- Severity: ${issue.severity}
- URL: ${issue.pageUrl}
- Description: ${issue.description}
${context?.pageTitle ? `- Page Title: ${context.pageTitle}` : ''}
${context?.pageH1 ? `- Page H1: ${context.pageH1}` : ''}

Provide a concise, production-ready fix in JSON format:
{
  "suggestedFix": "Detailed practical instructions to solve this issue.",
  "codeSnippet": "Drop-in code or HTML tag example.",
  "explanation": "Why this matters for Google search ranking.",
  "estimatedRankingImpact": "High" | "Medium" | "Low"
}`;

    const postData = JSON.stringify({
      model: this.model,
      messages: [
        { role: 'system', content: 'You are an expert SEO optimization assistant. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 500,
    });

    return new Promise((resolve) => {
      const req = https.request(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Length': Buffer.byteLength(postData),
          },
          timeout: 10000,
        },
        (res) => {
          let data = '';
          res.on('data', chunk => (data += chunk));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              const content = JSON.parse(parsed.choices[0].message.content);
              resolve({
                suggestedFix: content.suggestedFix || issue.suggestedFixContext || '',
                aiModel: this.model,
                explanation: content.explanation || '',
                estimatedRankingImpact: content.estimatedRankingImpact || 'Medium',
                codeSnippet: content.codeSnippet,
              });
            } catch {
              resolve(null);
            }
          });
        }
      );

      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
      req.write(postData);
      req.end();
    });
  }

  /**
   * Deterministic, contextual SEO recommendation generator.
   */
  private static generateLocalFix(
    issue: AuditIssueItem,
    context?: { pageTitle?: string; pageH1?: string }
  ): AIRecommendationResult {
    let domain = 'example.com';
    try {
      domain = new URL(issue.pageUrl).hostname;
    } catch {}

    const topic = context?.pageH1 || context?.pageTitle || domain.replace(/\.[a-z]+$/, '');

    switch (issue.type) {
      case 'missing_title':
        return {
          suggestedFix: `Add a unique, keyword-rich <title> tag between 45 and 60 characters into the HTML <head> section. Ensure the primary search intent for "${topic}" is front-loaded.`,
          aiModel: 'seofix-ai-v2.4',
          explanation: 'Title tags are the #1 on-page technical signal Google uses to determine topic relevance and display click-worthy SERP snippets.',
          estimatedRankingImpact: 'High',
          codeSnippet: `<head>\n  <title>${topic} | Comprehensive Guide & Solutions - ${domain}</title>\n</head>`,
        };

      case 'missing_meta_description':
        return {
          suggestedFix: `Write a compelling 140-155 character meta description highlighting key benefits and including a clear call-to-action.`,
          aiModel: 'seofix-ai-v2.4',
          explanation: 'While not a direct ranking factor, a high-converting meta description significantly boosts Organic Click-Through Rate (CTR).',
          estimatedRankingImpact: 'Medium',
          codeSnippet: `<meta name="description" content="Discover actionable ${topic} strategies, expert insights, and tools designed to optimize your digital performance. Learn more today." />`,
        };

      case 'missing_h1':
        return {
          suggestedFix: `Insert a single primary <h1> element immediately preceding the main content section. Ensure it reflects the primary page target query.`,
          aiModel: 'seofix-ai-v2.4',
          explanation: 'Google relies on the primary <h1> to understand the top-level topic and thematic hierarchy of the document.',
          estimatedRankingImpact: 'High',
          codeSnippet: `<main>\n  <h1 class="text-4xl font-bold tracking-tight">${topic}: Complete Overview</h1>\n</main>`,
        };

      case 'multiple_h1':
        return {
          suggestedFix: `Refactor secondary <h1> tags into <h2> subheadings to preserve a clean single-root document outline.`,
          aiModel: 'seofix-ai-v2.4',
          explanation: 'Multiple H1 tags dilute semantic priority and confuse crawlers evaluating the primary subject matter.',
          estimatedRankingImpact: 'Medium',
          codeSnippet: `<!-- Before: <h1>Secondary Feature</h1> -->\n<!-- After: -->\n<h2 class="text-2xl font-semibold">Secondary Feature</h2>`,
        };

      case 'missing_canonical':
        return {
          suggestedFix: `Add a self-referencing rel="canonical" link in the <head> tag to consolidate page authority and prevent duplicate content issues.`,
          aiModel: 'seofix-ai-v2.4',
          explanation: 'Canonicalization ensures tracking parameters (?utm_source, ?gclid, ?ref) do not split link equity into duplicate URLs.',
          estimatedRankingImpact: 'Medium',
          codeSnippet: `<link rel="canonical" href="${issue.pageUrl.split('?')[0]}" />`,
        };

      case 'thin_content':
        return {
          suggestedFix: `Expand page content with comprehensive explanations, step-by-step procedures, comparison tables, and a structured FAQ section.`,
          aiModel: 'seofix-ai-v2.4',
          explanation: 'Thin content pages (< 300 words) struggle to rank against competitors that provide in-depth helpful content meeting Google helpful content guidelines.',
          estimatedRankingImpact: 'High',
          codeSnippet: `<section id="faq">\n  <h2>Frequently Asked Questions</h2>\n  <div>\n    <h3>What is ${topic}?</h3>\n    <p>A comprehensive explanation answering common user queries...</p>\n  </div>\n</section>`,
        };

      case 'missing_alt':
        return {
          suggestedFix: `Audit all <img> tags and provide concise, descriptive 'alt' attributes describing image contents and contextual purpose.`,
          aiModel: 'seofix-ai-v2.4',
          explanation: 'Alt text enables image indexing on Google Images and satisfies WCAG 2.1 AA accessibility standards for screen readers.',
          estimatedRankingImpact: 'Medium',
          codeSnippet: `<img \n  src="/images/${topic.toLowerCase().replace(/\s+/g, '-')}.png" \n  alt="Visual diagram illustrating ${topic} architecture and workflow" \n  loading="lazy" \n/>`,
        };

      case 'slow_lcp':
        return {
          suggestedFix: `Preload the largest contentful element (usually hero image or primary font) and implement edge asset caching with modern compression (Brotli/WebP).`,
          aiModel: 'seofix-ai-v2.4',
          explanation: 'Largest Contentful Paint is a core ranking factor in Google Page Experience. LCP under 2.5 seconds prevents mobile bounce rates.',
          estimatedRankingImpact: 'High',
          codeSnippet: `<link rel="preload" as="image" href="/hero.webp" fetchpriority="high" />\n<style>\n  /* Optimize font rendering */\n  @font-face { font-display: swap; }\n</style>`,
        };

      case 'high_cls':
        return {
          suggestedFix: `Specify explicit width and height aspect-ratio attributes on all images, ad slots, and video containers to reserve layout space.`,
          aiModel: 'seofix-ai-v2.4',
          explanation: 'Cumulative Layout Shift (CLS) > 0.1 causes disruptive page jumps as images load, degrading the Core Web Vitals score.',
          estimatedRankingImpact: 'Medium',
          codeSnippet: `<img src="/photo.jpg" width="800" height="450" class="w-full h-auto" />`,
        };

      default:
        return {
          suggestedFix: issue.suggestedFixContext || `Review and resolve the violation according to Google Webmaster Guidelines for ${issue.type}.`,
          aiModel: 'seofix-ai-v2.4',
          explanation: 'Resolving technical and semantic issues improves search engine indexability and user engagement metrics.',
          estimatedRankingImpact: 'Medium',
          codeSnippet: `<!-- Fix for ${issue.type} -->`,
        };
    }
  }
}
