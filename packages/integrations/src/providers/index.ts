export interface SEODataProvider {
  name: string;
  getKeywordMetrics(keywords: string[]): Promise<any[]>;
  getBacklinks(domain: string): Promise<any[]>;
  getCompetitors(domain: string): Promise<any[]>;
}

export class DataForSEOProvider implements SEODataProvider {
  name = 'DataForSEO';
  
  async getKeywordMetrics(keywords: string[]) {
    return keywords.map(kw => ({ keyword: kw, volume: 18400, difficulty: 64.2, cpc: 3.85 }));
  }

  async getBacklinks(domain: string) {
    return [{ source: 'techcrunch.com', target: `https://${domain}`, da: 92, doFollow: true }];
  }

  async getCompetitors(domain: string) {
    return [{ domain: 'semrush.com', overlap: '58.4%', commonKeywords: 1420 }];
  }
}

export class AhrefsProvider implements SEODataProvider {
  name = 'Ahrefs';

  async getKeywordMetrics(keywords: string[]) {
    return keywords.map(kw => ({ keyword: kw, volume: 16200, difficulty: 68.0, cpc: 4.10 }));
  }

  async getBacklinks(domain: string) {
    return [{ source: 'producthunt.com', target: `https://${domain}`, da: 88, doFollow: true }];
  }

  async getCompetitors(domain: string) {
    return [{ domain: 'ahrefs.com', overlap: '62.1%', commonKeywords: 1890 }];
  }
}

export class SemrushProvider implements SEODataProvider {
  name = 'Semrush';

  async getKeywordMetrics(keywords: string[]) {
    return keywords.map(kw => ({ keyword: kw, volume: 19500, difficulty: 61.5, cpc: 3.50 }));
  }

  async getBacklinks(domain: string) {
    return [{ source: 'forbes.com', target: `https://${domain}`, da: 94, doFollow: true }];
  }

  async getCompetitors(domain: string) {
    return [{ domain: 'moz.com', overlap: '54.2%', commonKeywords: 1120 }];
  }
}

export class FirecrawlProvider implements SEODataProvider {
  name = 'Firecrawl';

  async getKeywordMetrics(keywords: string[]) { return []; }
  async getBacklinks(domain: string) { return []; }
  async getCompetitors(domain: string) { return []; }
  
  async crawlSinglePage(url: string) {
    return { url, markdown: `# Crawled Content for ${url}\n\nFirecrawl structured extraction.` };
  }
}
