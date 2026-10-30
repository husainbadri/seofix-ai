import { SEOAuditSkill, CrawlContext, SubSkillResult, AuditIssue, AuditSeverity } from '../types';

export class WebsiteCrawlingSkill implements SEOAuditSkill {
  id = 'website-crawling';
  name = 'Website Crawling';
  category = 'Crawling';

  async execute(context: CrawlContext): Promise<SubSkillResult> {
    const issues: AuditIssue[] = [];
    const totalPages = context.pages.length;
    let failedPagesCount = 0;

    for (const page of context.pages) {
      if (page.statusCode >= 400) {
        failedPagesCount++;
        issues.push({
          id: `crawl-status-${page.statusCode}-${page.url}`,
          pageUrl: page.url,
          subSkill: this.id,
          category: this.category,
          severity: page.statusCode >= 500 ? AuditSeverity.CRITICAL : AuditSeverity.HIGH,
          score: 0,
          title: `Page Return HTTP Status ${page.statusCode}`,
          description: `The URL returned HTTP status code ${page.statusCode}, preventing search engine crawlers from indexing this content.`,
          recommendation: `Fix the server route or place a 301 redirect to a relevant live page.`,
          aiFixCode: `# Nginx redirect fix:\nlocation = ${new URL(page.url).pathname} {\n    return 301 /;\n}`,
          estimatedImpact: 85
        });
      }
    }

    const score = totalPages > 0 ? Math.max(0, Math.round(100 - (failedPagesCount / totalPages) * 100)) : 100;

    return {
      skillId: this.id,
      skillName: this.name,
      category: this.category,
      score,
      issues,
      metrics: { totalPagesCrawled: totalPages, failedPagesCount }
    };
  }
}

export class TechnicalSEOSkill implements SEOAuditSkill {
  id = 'technical-seo';
  name = 'Technical SEO';
  category = 'Technical';

  async execute(context: CrawlContext): Promise<SubSkillResult> {
    const issues: AuditIssue[] = [];
    let deduction = 0;

    for (const page of context.pages) {
      const headers = page.headers || {};
      
      // Check HTTP compression
      const encoding = headers['content-encoding'] || '';
      if (!encoding.includes('gzip') && !encoding.includes('br')) {
        deduction += 10;
        issues.push({
          id: `no-compression-${page.url}`,
          pageUrl: page.url,
          subSkill: this.id,
          category: this.category,
          severity: AuditSeverity.MEDIUM,
          score: 60,
          title: 'Missing Gzip or Brotli HTTP Compression',
          description: 'The server response is not compressed using Gzip or Brotli, which increases payload size and delays render time.',
          recommendation: 'Enable Gzip or Brotli compression on your web server or CDN (Cloudflare/CloudFront).',
          aiFixCode: `// Express.js compression middleware\nimport compression from 'compression';\napp.use(compression());`,
          estimatedImpact: 65
        });
      }

      // Check Cache-Control headers
      if (!headers['cache-control']) {
        deduction += 5;
        issues.push({
          id: `no-cache-control-${page.url}`,
          pageUrl: page.url,
          subSkill: this.id,
          category: this.category,
          severity: AuditSeverity.LOW,
          score: 75,
          title: 'Missing Cache-Control Header',
          description: 'No browser caching directive found. Static assets will be refetched on every page visit.',
          recommendation: 'Set Cache-Control: public, max-age=31536000, immutable for static assets.',
          aiFixCode: `// Set Cache-Control header\nres.setHeader('Cache-Control', 'public, max-age=31536000, immutable');`,
          estimatedImpact: 40
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

export class OnPageSEOSkill implements SEOAuditSkill {
  id = 'on-page-seo';
  name = 'On-Page SEO';
  category = 'On-Page';

  async execute(context: CrawlContext): Promise<SubSkillResult> {
    const issues: AuditIssue[] = [];
    let deduction = 0;

    for (const page of context.pages) {
      // Title Tag Audit
      if (!page.title) {
        deduction += 25;
        issues.push({
          id: `missing-title-${page.url}`,
          pageUrl: page.url,
          subSkill: this.id,
          category: this.category,
          severity: AuditSeverity.CRITICAL,
          score: 0,
          title: 'Missing HTML Title Tag',
          description: 'This page has no <title> tag. The title tag is a crucial ranking factor and appears as the main headline in search results.',
          recommendation: 'Add a primary keyword-focused title tag between 50 and 60 characters.',
          aiFixCode: `<title>Primary Keyword - Brand Name</title>`,
          estimatedImpact: 95
        });
      } else if (page.title.length < 30 || page.title.length > 60) {
        deduction += 10;
        issues.push({
          id: `title-length-${page.url}`,
          pageUrl: page.url,
          subSkill: this.id,
          category: this.category,
          severity: AuditSeverity.MEDIUM,
          score: 65,
          title: `Suboptimal Title Length (${page.title.length} chars)`,
          description: `Title tag is ${page.title.length} characters long. Ideal length is 50-60 characters to avoid truncation in Google SERPs.`,
          recommendation: 'Optimize title length to be between 50 and 60 characters.',
          aiFixCode: `<title>Optimized Keyword Title for Maximum CTR</title>`,
          estimatedImpact: 60
        });
      }

      // Meta Description Audit
      if (!page.metaDescription) {
        deduction += 20;
        issues.push({
          id: `missing-meta-desc-${page.url}`,
          pageUrl: page.url,
          subSkill: this.id,
          category: this.category,
          severity: AuditSeverity.HIGH,
          score: 20,
          title: 'Missing Meta Description',
          description: 'No meta description tag was detected. Search engines will extract random snippet text, decreasing click-through rates.',
          recommendation: 'Add a compelling meta description between 120 and 160 characters with a clear call-to-action.',
          aiFixCode: `<meta name="description" content="Discover our platform features and boost your search rankings with AI automation." />`,
          estimatedImpact: 80
        });
      }

      // Heading Audit
      if (page.h1s.length === 0) {
        deduction += 15;
        issues.push({
          id: `missing-h1-${page.url}`,
          pageUrl: page.url,
          subSkill: this.id,
          category: this.category,
          severity: AuditSeverity.HIGH,
          score: 30,
          title: 'Missing H1 Tag',
          description: 'The page lacks a primary H1 heading element.',
          recommendation: 'Include exactly one descriptive H1 heading containing your target keyword.',
          aiFixCode: `<h1>Target Keyword Topic Headline</h1>`,
          estimatedImpact: 75
        });
      } else if (page.h1s.length > 1) {
        deduction += 10;
        issues.push({
          id: `multiple-h1-${page.url}`,
          pageUrl: page.url,
          subSkill: this.id,
          category: this.category,
          severity: AuditSeverity.MEDIUM,
          score: 60,
          title: `Multiple H1 Tags Found (${page.h1s.length})`,
          description: 'Multiple H1 tags dilute the primary keyword signal of the document structure.',
          recommendation: 'Ensure there is only one top-level H1 per page and downgrade secondary headings to H2/H3.',
          aiFixCode: `<h1>Primary Headline</h1>\n<h2>Secondary Section</h2>`,
          estimatedImpact: 55
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

export class PerformanceSkill implements SEOAuditSkill {
  id = 'performance';
  name = 'Performance Audit';
  category = 'Performance';

  async execute(context: CrawlContext): Promise<SubSkillResult> {
    const issues: AuditIssue[] = [];
    let totalLoadTime = 0;

    for (const page of context.pages) {
      totalLoadTime += page.loadTimeMs;

      if (page.loadTimeMs > 2500) {
        issues.push({
          id: `slow-load-${page.url}`,
          pageUrl: page.url,
          subSkill: this.id,
          category: this.category,
          severity: page.loadTimeMs > 4000 ? AuditSeverity.CRITICAL : AuditSeverity.HIGH,
          score: page.loadTimeMs > 4000 ? 25 : 55,
          title: `Slow Response Time (${page.loadTimeMs}ms)`,
          description: `Page response time exceeds recommended threshold of 2,500ms. Slow load times trigger high bounce rates and hurt Core Web Vitals.`,
          recommendation: 'Optimize server response times (TTFB), leverage CDN caching, defer render-blocking JavaScript, and compress media.',
          aiFixCode: `// Implement Next.js dynamic imports for non-critical components\nconst DynamicWidget = dynamic(() => import('./Widget'), { ssr: false });`,
          estimatedImpact: 85
        });
      }
    }

    const avgLoadTime = context.pages.length > 0 ? totalLoadTime / context.pages.length : 0;
    const score = avgLoadTime < 1000 ? 95 : avgLoadTime < 2500 ? 80 : 50;

    return {
      skillId: this.id,
      skillName: this.name,
      category: this.category,
      score,
      issues,
      metrics: { avgLoadTimeMs: Math.round(avgLoadTime) }
    };
  }
}

export class AccessibilitySkill implements SEOAuditSkill {
  id = 'accessibility';
  name = 'Accessibility (a11y)';
  category = 'Accessibility';

  async execute(context: CrawlContext): Promise<SubSkillResult> {
    const issues: AuditIssue[] = [];
    let deduction = 0;

    for (const page of context.pages) {
      // Check images missing alt tags for screen readers
      const unaltImages = page.images.filter(img => !img.alt || img.alt.trim() === '');
      if (unaltImages.length > 0) {
        deduction += Math.min(30, unaltImages.length * 5);
        issues.push({
          id: `a11y-missing-alt-${page.url}`,
          pageUrl: page.url,
          subSkill: this.id,
          category: this.category,
          severity: AuditSeverity.MEDIUM,
          score: 50,
          title: `${unaltImages.length} Images Missing Accessible Alt Text`,
          description: 'Images without descriptive alt text prevent vision-impaired users with screen readers from understanding image content.',
          recommendation: 'Provide meaningful alt descriptions for screen readers and search bots.',
          aiFixCode: `<img src="${unaltImages[0]?.src || '/image.png'}" alt="Descriptive accessible explanation of the image content" />`,
          estimatedImpact: 70
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
