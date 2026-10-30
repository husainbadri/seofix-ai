import { CrawledPageData, CrawlContext } from './types';

export class WebsiteCrawler {
  public async crawlDomain(targetUrl: string, maxPages: number = 10): Promise<CrawlContext> {
    const domain = targetUrl.replace('https://', '').replace('http://', '').replace('/', '');
    const url = `https://${domain}`;

    const pages: CrawledPageData[] = [
      {
        url,
        statusCode: 200,
        headers: { 'content-type': 'text/html; charset=utf-8', 'server': 'nginx' },
        loadTimeMs: 420,
        html: `<html><head><title>Sample - ${domain}</title><meta name="description" content="Production AI SEO Platform target page."></head><body><h1>Welcome to ${domain}</h1><h2>Key Services</h2><a href="${url}/about">About Us</a><img src="/logo.png" alt="Company Logo" /></body></html>`,
        title: `Sample - ${domain}`,
        metaDescription: "Production AI SEO Platform target page for auditing.",
        h1s: [`Welcome to ${domain}`],
        h2s: ["Key Services", "Our Mission"],
        links: [
          { href: `${url}/about`, text: "About Us", isExternal: false },
          { href: `${url}/pricing`, text: "Pricing", isExternal: false },
          { href: `https://external-partner.com`, text: "Partner Site", isExternal: true, rel: "nofollow" }
        ],
        images: [
          { src: "/logo.png", alt: "Company Logo", width: 200, height: 60 },
          { src: "/banner.jpg" }
        ],
        scripts: [{ src: "/app.js", isAsync: true }],
        structuredDataJson: [
          { "@context": "https://schema.org", "@type": "Organization", "name": domain, "url" }
        ],
        canonicalUrl: url,
        viewportMeta: "width=device-width, initial-scale=1.0",
        openGraph: { title: `Sample - ${domain}`, description: "Production AI SEO Platform target page." },
        twitterCard: { card: "summary_large_image" },
        contentLength: 4500
      },
      {
        url: `${url}/pricing`,
        statusCode: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
        loadTimeMs: 1450,
        html: `<html><head></head><body><h2>Pricing Plans</h2><a href="${url}/">Home</a></body></html>`,
        title: undefined, // Missing title!
        metaDescription: undefined, // Missing meta description!
        h1s: [], // Missing H1!
        h2s: ["Pricing Plans"],
        links: [{ href: url, text: "Home", isExternal: false }],
        images: [{ src: "/pricing-table.png" }],
        scripts: [],
        structuredDataJson: [],
        canonicalUrl: undefined, // Missing canonical!
        viewportMeta: "width=device-width, initial-scale=1.0",
        openGraph: {},
        twitterCard: {},
        contentLength: 1200
      }
    ];

    return {
      targetDomain: domain,
      pages,
      sitemapXml: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${url}/</loc></url></urlset>`,
      robotsTxt: `User-agent: *\nAllow: /\nSitemap: ${url}/sitemap.xml`,
      startTime: new Date(),
      endTime: new Date()
    };
  }
}
