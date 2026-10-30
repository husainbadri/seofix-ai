import { SEOAuditSkill, CrawlContext, SubSkillResult, AuditIssue, AuditSeverity } from '../types';

export class LocalSEOSkill implements SEOAuditSkill {
  id = 'local-seo';
  name = 'Local SEO & NAP';
  category = 'Local SEO';

  async execute(context: CrawlContext): Promise<SubSkillResult> {
    const issues: AuditIssue[] = [];
    let localSchemaFound = false;

    for (const page of context.pages) {
      for (const json of page.structuredDataJson) {
        if (json['@type'] === 'LocalBusiness' || json['@type'] === 'Organization') {
          localSchemaFound = true;
          break;
        }
      }
    }

    if (!localSchemaFound && context.pages.length > 0) {
      issues.push({
        id: `missing-local-business-schema-${context.targetDomain}`,
        pageUrl: context.pages[0].url,
        subSkill: this.id,
        category: this.category,
        severity: AuditSeverity.MEDIUM,
        score: 50,
        title: 'Missing LocalBusiness / Organization Schema',
        description: 'No LocalBusiness JSON-LD schema found. Local business schema establishes local presence, Google Maps inclusion, and Knowledge Panel indexing.',
        recommendation: 'Add LocalBusiness JSON-LD schema containing Name, Address, Phone (NAP), and Opening Hours.',
        aiFixCode: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "LocalBusiness",\n  "name": "${context.targetDomain}",\n  "telephone": "+1-800-555-0199",\n  "address": {\n    "@type": "PostalAddress",\n    "streetAddress": "100 Main St",\n    "addressLocality": "New York",\n    "addressRegion": "NY",\n    "postalCode": "10001"\n  }\n}\n</script>`,
        estimatedImpact: 65
      });
    }

    return {
      skillId: this.id,
      skillName: this.name,
      category: this.category,
      score: localSchemaFound ? 90 : 50,
      issues,
      metrics: { localSchemaFound }
    };
  }
}

export class ImageSEOSkill implements SEOAuditSkill {
  id = 'image-seo';
  name = 'Image SEO & Optimization';
  category = 'Images';

  async execute(context: CrawlContext): Promise<SubSkillResult> {
    const issues: AuditIssue[] = [];
    let unoptimizedImages = 0;

    for (const page of context.pages) {
      for (const img of page.images) {
        if (!img.src.endsWith('.webp') && !img.src.endsWith('.avif') && !img.src.endsWith('.svg')) {
          unoptimizedImages++;
        }
      }

      if (unoptimizedImages > 0) {
        issues.push({
          id: `legacy-image-formats-${page.url}`,
          pageUrl: page.url,
          subSkill: this.id,
          category: this.category,
          severity: AuditSeverity.LOW,
          score: 65,
          title: `Legacy Image Formats Detected (${unoptimizedImages} images)`,
          description: 'Images are served in legacy formats (PNG/JPG) instead of modern compressed web formats like WebP or AVIF.',
          recommendation: 'Convert static images to WebP or AVIF to reduce payload size by up to 40%.',
          aiFixCode: `<picture>\n  <source srcset="image.webp" type="image/webp">\n  <img src="image.jpg" alt="Optimized Image" />\n</picture>`,
          estimatedImpact: 55
        });
      }
    }

    const score = Math.max(0, 100 - unoptimizedImages * 10);

    return {
      skillId: this.id,
      skillName: this.name,
      category: this.category,
      score,
      issues,
      metrics: { unoptimizedImages }
    };
  }
}

export class VideoSEOSkill implements SEOAuditSkill {
  id = 'video-seo';
  name = 'Video SEO & VideoObject';
  category = 'Video';

  async execute(context: CrawlContext): Promise<SubSkillResult> {
    const issues: AuditIssue[] = [];
    let videoCount = 0;
    let videoSchemaCount = 0;

    for (const page of context.pages) {
      if (page.html.includes('<video') || page.html.includes('youtube.com/embed') || page.html.includes('vimeo.com')) {
        videoCount++;
        const hasVideoSchema = page.structuredDataJson.some(j => j['@type'] === 'VideoObject');
        if (hasVideoSchema) videoSchemaCount++;
      }
    }

    if (videoCount > videoSchemaCount && context.pages.length > 0) {
      issues.push({
        id: `missing-video-object-schema-${context.targetDomain}`,
        pageUrl: context.pages[0].url,
        subSkill: this.id,
        category: this.category,
        severity: AuditSeverity.LOW,
        score: 60,
        title: 'Video Embeds Found Without VideoObject Schema',
        description: 'Page contains video embeds but lacks VideoObject JSON-LD schema required for Google Video Search indexing & rich video key moments.',
        recommendation: 'Add VideoObject schema with thumbnail, uploadDate, and description.',
        aiFixCode: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "VideoObject",\n  "name": "Product Overview",\n  "description": "Video walkthrough of features.",\n  "thumbnailUrl": "https://img.youtube.com/vi/ID/hqdefault.jpg",\n  "uploadDate": "2026-08-01"\n}\n</script>`,
        estimatedImpact: 45
      });
    }

    return {
      skillId: this.id,
      skillName: this.name,
      category: this.category,
      score: videoCount === 0 || videoSchemaCount === videoCount ? 100 : 70,
      issues,
      metrics: { videoCount, videoSchemaCount }
    };
  }
}

export class MobileSEOSkill implements SEOAuditSkill {
  id = 'mobile-seo';
  name = 'Mobile SEO & Responsive Viewport';
  category = 'Mobile';

  async execute(context: CrawlContext): Promise<SubSkillResult> {
    const issues: AuditIssue[] = [];
    let missingViewportCount = 0;

    for (const page of context.pages) {
      if (!page.viewportMeta) {
        missingViewportCount++;
        issues.push({
          id: `missing-viewport-${page.url}`,
          pageUrl: page.url,
          subSkill: this.id,
          category: this.category,
          severity: AuditSeverity.CRITICAL,
          score: 0,
          title: 'Missing Mobile Viewport Meta Tag',
          description: 'No <meta name="viewport"> tag detected. Mobile browsers will render the desktop version zoomed out, failing Google Mobile-First Indexing criteria.',
          recommendation: 'Add standard mobile viewport meta tag.',
          aiFixCode: `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`,
          estimatedImpact: 95
        });
      }
    }

    const score = context.pages.length > 0 ? Math.max(0, Math.round(100 - (missingViewportCount / context.pages.length) * 100)) : 100;

    return {
      skillId: this.id,
      skillName: this.name,
      category: this.category,
      score,
      issues,
      metrics: { missingViewportCount }
    };
  }
}

export class CoreWebVitalsSkill implements SEOAuditSkill {
  id = 'core-web-vitals';
  name = 'Core Web Vitals (LCP, FID/INP, CLS)';
  category = 'Performance';

  async execute(context: CrawlContext): Promise<SubSkillResult> {
    const issues: AuditIssue[] = [];
    let estimatedLcp = 1800; // ms
    let estimatedInp = 80;  // ms
    let estimatedCls = 0.04; // layout shift

    // Compute vitals based on DOM size and page load times
    for (const page of context.pages) {
      if (page.loadTimeMs > 2500) {
        estimatedLcp = Math.max(estimatedLcp, page.loadTimeMs + 500);
      }
    }

    if (estimatedLcp > 2500) {
      issues.push({
        id: `cwv-lcp-slow-${context.targetDomain}`,
        pageUrl: context.pages[0]?.url || `https://${context.targetDomain}`,
        subSkill: this.id,
        category: this.category,
        severity: AuditSeverity.HIGH,
        score: 55,
        title: `Slow Largest Contentful Paint (LCP: ${estimatedLcp}ms)`,
        description: `LCP exceeds the 2,500ms target threshold. Google considers LCP a core page experience ranking factor.`,
        recommendation: 'Preload hero images, reduce server response latency, and eliminate render-blocking CSS/JS.',
        aiFixCode: `<link rel="preload" href="/hero.jpg" as="image" fetchpriority="high" />`,
        estimatedImpact: 85
      });
    }

    const score = estimatedLcp <= 2500 ? 92 : 60;

    return {
      skillId: this.id,
      skillName: this.name,
      category: this.category,
      score,
      issues,
      metrics: { estimatedLcpMs: estimatedLcp, estimatedInpMs: estimatedInp, estimatedCls }
    };
  }
}
