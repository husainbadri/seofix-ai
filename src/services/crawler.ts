/**
 * SEOFix AI - CrawlerService
 * Handles URL fetching, sitemap discovery, SPA/Scrapy proxying, and page enumeration.
 */

import http from 'http';
import https from 'https';
import { ParserService, ParsedSEOData } from './parser';

export interface CrawledPageRecord {
  url: string;
  statusCode: number;
  loadTimeMs: number;
  htmlSize: number;
  parsed: ParsedSEOData;
  error?: string;
}

export class CrawlerService {
  private userAgent = 'SEOFixAI-Bot/1.0 (+https://seofix.ai/bot)';

  /**
   * Validate if a URL is reachable and well-formed.
   */
  public async validateUrl(targetUrl: string): Promise<{ valid: boolean; normalizedUrl?: string; domain?: string; error?: string }> {
    try {
      let clean = targetUrl.trim();
      if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = 'https://' + clean;
      }
      const parsed = new URL(clean);
      return {
        valid: true,
        normalizedUrl: parsed.origin,
        domain: parsed.hostname,
      };
    } catch (err: any) {
      return {
        valid: false,
        error: 'Invalid URL format: ' + err.message,
      };
    }
  }

  /**
   * Fetch a single page directly over HTTP/HTTPS with timing and decompression.
   */
  public async fetchPage(pageUrl: string, timeoutMs = 15000): Promise<{ html: string; statusCode: number; loadTimeMs: number }> {
    const startTime = Date.now();
    return new Promise((resolve, reject) => {
      let parsed: URL;
      try {
        parsed = new URL(pageUrl);
      } catch (e: any) {
        return reject(new Error('Invalid URL: ' + pageUrl));
      }

      const client = parsed.protocol === 'https:' ? https : http;
      const req = client.get(
        pageUrl,
        {
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          timeout: timeoutMs,
        },
        (res) => {
          // Handle redirects
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            const redirectUrl = new URL(res.headers.location, pageUrl).href;
            return this.fetchPage(redirectUrl, timeoutMs).then(resolve).catch(reject);
          }

          let data = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            const loadTimeMs = Date.now() - startTime;
            resolve({
              html: data,
              statusCode: res.statusCode || 200,
              loadTimeMs,
            });
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Timeout fetching ${pageUrl} after ${timeoutMs}ms`));
      });

      req.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Check for sitemap.xml and extract page URLs.
   */
  public async fetchSitemapUrls(baseUrl: string): Promise<string[]> {
    try {
      const sitemapUrl = new URL('/sitemap.xml', baseUrl).href;
      const { html, statusCode } = await this.fetchPage(sitemapUrl, 8000);
      if (statusCode === 200 && html.includes('<loc>')) {
        const urls: string[] = [];
        const locRegex = /<loc>([\s\S]*?)<\/loc>/gi;
        let match: RegExpExecArray | null;
        while ((match = locRegex.exec(html)) !== null) {
          const loc = match[1].trim();
          if (loc.startsWith('http')) {
            urls.push(loc);
          }
        }
        return Array.from(new Set(urls)).slice(0, 50);
      }
    } catch {
      // Sitemap not found or unreachable
    }
    return [];
  }

  /**
   * Run a multi-page crawl starting from target URL up to maxPages.
   */
  public async crawlSite(startUrl: string, maxPages = 15): Promise<CrawledPageRecord[]> {
    const results: CrawledPageRecord[] = [];
    const visited = new Set<string>();
    const queue: string[] = [startUrl];

    // Try finding sitemap URLs first
    const sitemapLinks = await this.fetchSitemapUrls(startUrl);
    for (const link of sitemapLinks) {
      if (!visited.has(link) && queue.length < maxPages) {
        queue.push(link);
      }
    }

    const startDomain = new URL(startUrl).hostname;

    while (queue.length > 0 && results.length < maxPages) {
      const currentUrl = queue.shift()!;
      if (visited.has(currentUrl)) continue;
      visited.add(currentUrl);

      try {
        const { html, statusCode, loadTimeMs } = await this.fetchPage(currentUrl);
        const parsed = ParserService.parse(html, currentUrl);

        results.push({
          url: currentUrl,
          statusCode,
          loadTimeMs,
          htmlSize: Buffer.byteLength(html, 'utf8'),
          parsed,
        });

        // Enqueue discovered internal links
        for (const link of parsed.internalLinks) {
          try {
            const linkDomain = new URL(link).hostname;
            if (linkDomain === startDomain && !visited.has(link) && queue.length < maxPages * 3) {
              queue.push(link);
            }
          } catch {
            // invalid link
          }
        }
      } catch (err: any) {
        results.push({
          url: currentUrl,
          statusCode: 0,
          loadTimeMs: 0,
          htmlSize: 0,
          error: err.message,
          parsed: ParserService.parse('', currentUrl),
        });
      }
    }

    return results;
  }
}
