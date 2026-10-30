/**
 * SEOFix AI - ParserService
 * Uses Cheerio (and robust string matching fallback) to extract comprehensive SEO attributes from HTML.
 */

export interface ParsedSEOData {
  title: string;
  titleLength: number;
  metaDescription: string;
  metaDescriptionLength: number;
  h1List: string[];
  h2List: string[];
  canonicalUrl: string | null;
  robotsMeta: string | null;
  isNoIndex: boolean;
  isNoFollow: boolean;
  viewportMeta: string | null;
  wordCount: number;
  internalLinks: string[];
  externalLinks: string[];
  images: Array<{ src: string; alt: string; hasAlt: boolean }>;
  imagesMissingAlt: number;
  structuredDataJsonLd: any[];
  hasSchema: boolean;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  domNodeCount: number;
  rawText: string;
}

export class ParserService {
  /**
   * Parse HTML content and extract all relevant SEO elements.
   */
  public static parse(html: string, baseUrl: string): ParsedSEOData {
    let parsedBase: URL;
    try {
      parsedBase = new URL(baseUrl);
    } catch {
      parsedBase = new URL('https://example.com');
    }

    // 1. Extract Title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? this.cleanText(titleMatch[1]) : '';

    // 2. Extract Meta Description
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i) ||
                          html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["'][^>]*>/i);
    const metaDescription = metaDescMatch ? this.cleanText(metaDescMatch[1]) : '';

    // 3. Extract Headings (H1, H2)
    const h1List: string[] = [];
    const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
    let match: RegExpExecArray | null;
    while ((match = h1Regex.exec(html)) !== null) {
      const cleanH1 = this.cleanText(match[1]);
      if (cleanH1) h1List.push(cleanH1);
    }

    const h2List: string[] = [];
    const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
    while ((match = h2Regex.exec(html)) !== null) {
      const cleanH2 = this.cleanText(match[1]);
      if (cleanH2) h2List.push(cleanH2);
    }

    // 4. Extract Canonical Link
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["'][^>]*>/i) ||
                           html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["'][^>]*>/i);
    const canonicalUrl = canonicalMatch ? canonicalMatch[1].trim() : null;

    // 5. Extract Robots Meta
    const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                        html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']robots["'][^>]*>/i);
    const robotsMeta = robotsMatch ? robotsMatch[1].toLowerCase().trim() : null;
    const isNoIndex = robotsMeta ? robotsMeta.includes('noindex') : false;
    const isNoFollow = robotsMeta ? robotsMeta.includes('nofollow') : false;

    // 6. Viewport Meta
    const viewportMatch = html.match(/<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']*)["'][^>]*>/i);
    const viewportMeta = viewportMatch ? viewportMatch[1].trim() : null;

    // 7. OpenGraph Data
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/i);
    const ogTitle = ogTitleMatch ? this.cleanText(ogTitleMatch[1]) : null;

    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
    const ogDescription = ogDescMatch ? this.cleanText(ogDescMatch[1]) : null;

    const ogImgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["'][^>]*>/i);
    const ogImage = ogImgMatch ? ogImgMatch[1].trim() : null;

    // 8. Extract Links (Internal vs External)
    const internalLinksSet = new Set<string>();
    const externalLinksSet = new Set<string>();
    const linkRegex = /<a[^>]*href=["']([^"']*)["'][^>]*>/gi;
    while ((match = linkRegex.exec(html)) !== null) {
      const rawHref = match[1].trim();
      if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
        continue;
      }
      try {
        const resolved = new URL(rawHref, baseUrl);
        if (resolved.protocol === 'http:' || resolved.protocol === 'https:') {
          if (resolved.hostname === parsedBase.hostname) {
            internalLinksSet.add(resolved.href);
          } else {
            externalLinksSet.add(resolved.href);
          }
        }
      } catch {
        // ignore invalid urls
      }
    }

    // 9. Extract Images & Alt Attributes
    const images: Array<{ src: string; alt: string; hasAlt: boolean }> = [];
    let imagesMissingAlt = 0;
    const imgRegex = /<img([^>]*)>/gi;
    while ((match = imgRegex.exec(html)) !== null) {
      const imgAttrs = match[1];
      const srcMatch = imgAttrs.match(/src=["']([^"']*)["']/i);
      const altMatch = imgAttrs.match(/alt=["']([^"']*)["']/i);
      const src = srcMatch ? srcMatch[1] : '';
      const alt = altMatch ? altMatch[1].trim() : '';
      const hasAlt = !!altMatch && alt.length > 0;

      if (!hasAlt) {
        imagesMissingAlt++;
      }
      images.push({ src, alt, hasAlt });
    }

    // 10. Extract Structured Data (JSON-LD)
    const jsonLdList: any[] = [];
    const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    while ((match = scriptRegex.exec(html)) !== null) {
      try {
        const parsedJson = JSON.parse(match[1].trim());
        jsonLdList.push(parsedJson);
      } catch {
        // invalid JSON-LD block
      }
    }

    // 11. Word Count & Clean Text
    // Strip script, style, html tags
    const textWithoutScripts = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    const rawText = this.cleanText(textWithoutScripts);
    const words = rawText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Approximate DOM count
    const domNodeCount = (html.match(/<[a-zA-Z0-9-]+/g) || []).length;

    return {
      title,
      titleLength: title.length,
      metaDescription,
      metaDescriptionLength: metaDescription.length,
      h1List,
      h2List,
      canonicalUrl,
      robotsMeta,
      isNoIndex,
      isNoFollow,
      viewportMeta,
      wordCount,
      internalLinks: Array.from(internalLinksSet),
      externalLinks: Array.from(externalLinksSet),
      images,
      imagesMissingAlt,
      structuredDataJsonLd: jsonLdList,
      hasSchema: jsonLdList.length > 0,
      ogTitle,
      ogDescription,
      ogImage,
      domNodeCount,
      rawText: rawText.slice(0, 5000),
    };
  }

  private static cleanText(text: string): string {
    return text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }
}
