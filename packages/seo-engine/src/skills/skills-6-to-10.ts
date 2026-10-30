import { SEOAuditSkill, CrawlContext, SubSkillResult, AuditIssue, AuditSeverity } from '../types';

export class SecuritySkill implements SEOAuditSkill {
  id = 'security';
  name = 'Security & HTTPS Audit';
  category = 'Security';

  async execute(context: CrawlContext): Promise<SubSkillResult> {
    const issues: AuditIssue[] = [];
    let deduction = 0;

    for (const page of context.pages) {
      // Check HTTP vs HTTPS
      if (!page.url.startsWith('https://')) {
        deduction += 40;
        issues.push({
          id: `insecure-http-${page.url}`,
          pageUrl: page.url,
          subSkill: this.id,
          category: this.category,
          severity: AuditSeverity.CRITICAL,
          score: 0,
          title: 'Unencrypted HTTP Connection',
          description: 'Page is served over plain HTTP without TLS/SSL encryption. Chrome marks non-HTTPS sites as "Not Secure" and Google penalizes unsecure domains.',
          recommendation: 'Obtain an SSL certificate (e.g. Let\'s Encrypt) and force HTTPS 301 redirects.',
          aiFixCode: `// Express.js HTTPS Enforcer\napp.use((req, res, next) => {\n  if (req.header('x-forwarded-proto') !== 'https') {\n    res.redirect(\`https://\${req.header('host')}\${req.url}\`);\n  } else {\n    next();\n  }\n});`,
          estimatedImpact: 90
        });
      }

      // Check Security Headers
      const headers = page.headers || {};
      if (!headers['strict-transport-security']) {
        deduction += 10;
        issues.push({
          id: `missing-hsts-${page.url}`,
          pageUrl: page.url,
          subSkill: this.id,
          category: this.category,
          severity: AuditSeverity.MEDIUM,
          score: 60,
          title: 'Missing HSTS (Strict-Transport-Security) Header',
          description: 'HTTP Strict Transport Security header enforces encrypted connections to prevent man-in-the-middle attacks.',
          recommendation: 'Add "Strict-Transport-Security: max-age=31536000; includeSubDomains" header.',
          aiFixCode: `res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');`,
          estimatedImpact: 50
        });
      }
    }

    const score = Math.max(0, 100 - deduction);

    return {
      skillId: this.id,
      skillName: this.name,
      category: this.category,
      score,
      issues,
      metrics: { checkedPages: context.pages.length }
    };
  }
}

export class ContentQualitySkill implements SEOAuditSkill {
  id = 'content-quality';
  name = 'Content Quality & Readability';
  category = 'Content';

  async execute(context: CrawlContext): Promise<SubSkillResult> {
    const issues: AuditIssue[] = [];
    let deduction = 0;

    for (const page of context.pages) {
      const textLength = page.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;
      const wordCount = Math.round(textLength / 6);

      if (wordCount < 300) {
        deduction += 20;
        issues.push({
          id: `thin-content-${page.url}`,
          pageUrl: page.url,
          subSkill: this.id,
          category: this.category,
          severity: AuditSeverity.HIGH,
          score: 30,
          title: `Thin Content Detected (${wordCount} words)`,
          description: `Page contains only ~${wordCount} words. Pages under 300 words are considered thin content by Google Panda guidelines and struggle to rank for competitive terms.`,
          recommendation: 'Expand content with comprehensive topical coverage, FAQs, and valuable context.',
          aiFixCode: `<!-- Suggested Content Expansion Structure -->\n<section class="faq">\n  <h2>Frequently Asked Questions</h2>\n  <article><h3>What is this service?</h3><p>Detailed explanation...</p></article>\n</section>`,
          estimatedImpact: 85
        });
      }
    }

    const score = Math.max(0, 100 - deduction);

    return {
      skillId: this.id,
      skillName: this.name,
      category: this.category,
      score,
      issues,
      metrics: { totalPages: context.pages.length }
    };
  }
}

export class InternalLinkingSkill implements SEOAuditSkill {
  id = 'internal-linking';
  name = 'Internal Linking Architecture';
  category = 'Architecture';

  async execute(context: CrawlContext): Promise<SubSkillResult> {
    const issues: AuditIssue[] = [];
    let orphanCount = 0;

    const incomingLinksCount = new Map<string, number>();
    for (const p of context.pages) {
      incomingLinksCount.set(p.url, 0);
    }

    for (const p of context.pages) {
      for (const link of p.links) {
        if (!link.isExternal && incomingLinksCount.has(link.href)) {
          incomingLinksCount.set(link.href, (incomingLinksCount.get(link.href) || 0) + 1);
        }
      }
    }

    for (const [url, count] of incomingLinksCount.entries()) {
      if (count === 0 && context.pages.length > 1) {
        orphanCount++;
        issues.push({
          id: `orphan-page-${url}`,
          pageUrl: url,
          subSkill: this.id,
          category: this.category,
          severity: AuditSeverity.HIGH,
          score: 20,
          title: 'Orphan Page Detected (0 Inbound Links)',
          description: 'This page is not linked to from any internal page in the crawled site structure, making it difficult for crawlers and users to discover.',
          recommendation: 'Add contextual internal links from relevant blog posts, categories, or navigation menus pointing to this URL.',
          aiFixCode: `<!-- Add to parent page HTML -->\n<p>Learn more in our <a href="${url}">related topic guide</a>.</p>`,
          estimatedImpact: 75
        });
      }
    }

    const score = context.pages.length > 0 ? Math.max(0, 100 - orphanCount * 25) : 100;

    return {
      skillId: this.id,
      skillName: this.name,
      category: this.category,
      score,
      issues,
      metrics: { orphanCount }
    };
  }
}

export class ExternalLinksSkill implements SEOAuditSkill {
  id = 'external-links';
  name = 'External Links Audit';
  category = 'Links';

  async execute(context: CrawlContext): Promise<SubSkillResult> {
    const issues: AuditIssue[] = [];
    let deduction = 0;

    for (const page of context.pages) {
      const extLinks = page.links.filter(l => l.isExternal);
      for (const link of extLinks) {
        if (!link.rel || (!link.rel.includes('nofollow') && !link.rel.includes('ugc') && link.href.includes('untrusted'))) {
          deduction += 5;
          issues.push({
            id: `untrusted-link-${page.url}-${link.href}`,
            pageUrl: page.url,
            subSkill: this.id,
            category: this.category,
            severity: AuditSeverity.LOW,
            score: 70,
            title: 'Outbound External Link Missing Nofollow / Sponsored Rel',
            description: `Outbound link to ${link.href} passes full PageRank equity without nofollow attribute.`,
            recommendation: 'Add rel="nofollow sponsored" to commercial or untrusted outbound links.',
            aiFixCode: `<a href="${link.href}" rel="nofollow noopener">External Link</a>`,
            estimatedImpact: 45
          });
        }
      }
    }

    const score = Math.max(0, 100 - deduction);

    return {
      skillId: this.id,
      skillName: this.name,
      category: this.category,
      score,
      issues,
      metrics: { totalPages: context.pages.length }
    };
  }
}

export class StructuredDataSkill implements SEOAuditSkill {
  id = 'structured-data';
  name = 'Structured Data & Schema.org';
  category = 'Schema';

  async execute(context: CrawlContext): Promise<SubSkillResult> {
    const issues: AuditIssue[] = [];
    let missingSchemaCount = 0;

    for (const page of context.pages) {
      if (page.structuredDataJson.length === 0) {
        missingSchemaCount++;
        issues.push({
          id: `missing-schema-${page.url}`,
          pageUrl: page.url,
          subSkill: this.id,
          category: this.category,
          severity: AuditSeverity.MEDIUM,
          score: 40,
          title: 'Missing JSON-LD Structured Data Schema',
          description: 'No Schema.org structured data was found on this page. Search engines use structured data for rich snippets, FAQs, and Knowledge Graph representation.',
          recommendation: 'Implement relevant JSON-LD schema (WebPage, Organization, Article, FAQPage, or Product).',
          aiFixCode: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "${page.title || 'Page Name'}",\n  "url": "${page.url}"\n}\n</script>`,
          estimatedImpact: 70
        });
      }
    }

    const score = context.pages.length > 0 ? Math.max(0, Math.round(100 - (missingSchemaCount / context.pages.length) * 50)) : 100;

    return {
      skillId: this.id,
      skillName: this.name,
      category: this.category,
      score,
      issues,
      metrics: { missingSchemaCount }
    };
  }
}
