export enum AuditSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO'
}

export interface CrawledPageData {
  url: string;
  statusCode: number;
  headers: Record<string, string>;
  loadTimeMs: number;
  html: string;
  title?: string;
  metaDescription?: string;
  h1s: string[];
  h2s: string[];
  links: Array<{ href: string; text: string; isExternal: boolean; rel?: string }>;
  images: Array<{ src: string; alt?: string; width?: number; height?: number }>;
  scripts: Array<{ src?: string; isAsync?: boolean; isDefer?: boolean }>;
  structuredDataJson: any[];
  canonicalUrl?: string;
  robotsMeta?: string;
  viewportMeta?: string;
  openGraph: Record<string, string>;
  twitterCard: Record<string, string>;
  contentLength: number;
}

export interface CrawlContext {
  targetDomain: string;
  pages: CrawledPageData[];
  sitemapXml?: string;
  robotsTxt?: string;
  startTime: Date;
  endTime?: Date;
}

export interface SubSkillResult {
  skillId: string;
  skillName: string;
  category: string;
  score: number; // 0 - 100
  issues: AuditIssue[];
  metrics: Record<string, any>;
}

export interface AuditIssue {
  id: string;
  pageUrl: string;
  subSkill: string;
  category: string;
  severity: AuditSeverity;
  score: number;
  title: string;
  description: string;
  recommendation: string;
  aiFixCode?: string;
  estimatedImpact: number; // 1 - 100
}

export interface SEOAuditSkill {
  id: string;
  name: string;
  category: string;
  execute(context: CrawlContext): Promise<SubSkillResult>;
}
