/**
 * SEOFix AI - Data Store & Supabase Adapter
 * Implements the 6 core entities: profiles, projects, pages, audits, issues, recommendations.
 * Falls back to an in-memory transactional store when Supabase connection is pending.
 */

import { IssueType, IssueSeverity, IssueStatus } from '../services/audit-engine';

export interface ProfileRecord {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface ProjectRecord {
  id: string;
  user_id: string;
  url: string;
  domain: string;
  status: 'active' | 'paused';
  last_audit_at: string | null;
  created_at: string;
}

export interface PageRecord {
  id: string;
  project_id: string;
  url: string;
  title: string | null;
  meta_description: string | null;
  h1: string | null;
  word_count: number;
  is_indexed: boolean;
  last_crawled_at: string;
}

export interface AuditRecord {
  id: string;
  project_id: string;
  score_overall: number;
  score_technical: number;
  score_content: number;
  score_performance: number;
  metrics: Record<string, any>;
  created_at: string;
}

export interface IssueRecord {
  id: string;
  audit_id: string;
  page_id: string | null;
  page_url?: string;
  type: IssueType;
  severity: IssueSeverity;
  description: string;
  status: IssueStatus;
  created_at: string;
  recommendation?: RecommendationRecord;
}

export interface RecommendationRecord {
  id: string;
  issue_id: string;
  suggested_fix: string;
  ai_model: string;
  created_at: string;
  code_snippet?: string;
  explanation?: string;
  estimated_ranking_impact?: string;
}

class SEOFixStore {
  private profiles = new Map<string, ProfileRecord>();
  private projects = new Map<string, ProjectRecord>();
  private pages = new Map<string, PageRecord>();
  private audits = new Map<string, AuditRecord>();
  private issues = new Map<string, IssueRecord>();
  private recommendations = new Map<string, RecommendationRecord>();

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const defaultUser: ProfileRecord = {
      id: 'usr_default_admin',
      email: 'admin@seofix.ai',
      full_name: 'Lead SEO Architect',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      created_at: new Date().toISOString(),
    };
    this.profiles.set(defaultUser.id, defaultUser);

    const defaultProject: ProjectRecord = {
      id: 'proj_acme_saas',
      user_id: defaultUser.id,
      url: 'https://acme-saas.com',
      domain: 'acme-saas.com',
      status: 'active',
      last_audit_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    };
    this.projects.set(defaultProject.id, defaultProject);

    // Seed initial audit
    const initialAudit: AuditRecord = {
      id: 'audit_01_init',
      project_id: defaultProject.id,
      score_overall: 78,
      score_technical: 82,
      score_content: 85,
      score_performance: 70,
      metrics: {
        lcp: 1850,
        cls: 0.04,
        inp: 95,
        fcp: 820,
        ttfb: 140,
        device: 'mobile',
      },
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    };
    this.audits.set(initialAudit.id, initialAudit);

    // Seed pages
    const pagesSeed = [
      { id: 'page_1', url: 'https://acme-saas.com/', title: 'Acme SaaS - Enterprise Growth & Analytics Platform', h1: 'Scale your SaaS faster with Acme', word_count: 1420 },
      { id: 'page_2', url: 'https://acme-saas.com/pricing', title: '', h1: 'Simple transparent pricing', word_count: 480 },
      { id: 'page_3', url: 'https://acme-saas.com/features', title: 'Features & Integrations - Acme SaaS', h1: 'Built for enterprise teams', word_count: 850 },
      { id: 'page_4', url: 'https://acme-saas.com/blog/seo-guide', title: 'The Modern SEO Playbook', h1: 'The Modern SEO Playbook', word_count: 210 },
    ];

    pagesSeed.forEach(p => {
      this.pages.set(p.id, {
        id: p.id,
        project_id: defaultProject.id,
        url: p.url,
        title: p.title || null,
        meta_description: p.title ? 'Discover Acme SaaS enterprise growth tools.' : null,
        h1: p.h1,
        word_count: p.word_count,
        is_indexed: true,
        last_crawled_at: new Date().toISOString(),
      });
    });

    // Seed issues
    const issuesSeed: Array<{ id: string; page_id: string; type: IssueType; severity: IssueSeverity; desc: string; fix: string }> = [
      {
        id: 'iss_1',
        page_id: 'page_2',
        type: 'missing_title',
        severity: 'critical',
        desc: 'Missing HTML <title> tag on https://acme-saas.com/pricing. Prevents search ranking & SERP display.',
        fix: '<head>\n  <title>Pricing Plans & Enterprise Tiers | Acme SaaS</title>\n</head>',
      },
      {
        id: 'iss_2',
        page_id: 'page_4',
        type: 'thin_content',
        severity: 'critical',
        desc: 'Thin content: only 210 words on https://acme-saas.com/blog/seo-guide. High risk of low-quality evaluation.',
        fix: 'Expand substantive content to 800+ words with practical case studies and FAQ section.',
      },
      {
        id: 'iss_3',
        page_id: 'page_1',
        type: 'missing_canonical',
        severity: 'warning',
        desc: 'Missing rel="canonical" link on homepage root.',
        fix: '<link rel="canonical" href="https://acme-saas.com/" />',
      },
      {
        id: 'iss_4',
        page_id: 'page_3',
        type: 'missing_alt',
        severity: 'warning',
        desc: '3 images are missing descriptive alt attributes on features page.',
        fix: '<img src="/integrations.png" alt="Acme integrations ecosystem with Slack, Stripe, and Salesforce" />',
      },
    ];

    issuesSeed.forEach(iss => {
      const issueRecord: IssueRecord = {
        id: iss.id,
        audit_id: initialAudit.id,
        page_id: iss.page_id,
        page_url: this.pages.get(iss.page_id)?.url,
        type: iss.type,
        severity: iss.severity,
        description: iss.desc,
        status: 'open',
        created_at: new Date().toISOString(),
      };
      this.issues.set(iss.id, issueRecord);

      const recRecord: RecommendationRecord = {
        id: `rec_${iss.id}`,
        issue_id: iss.id,
        suggested_fix: iss.fix,
        ai_model: 'seofix-ai-v2.4',
        code_snippet: iss.fix,
        explanation: 'Fixing this directly improves topic authority and search engine comprehension.',
        estimated_ranking_impact: iss.severity === 'critical' ? 'High' : 'Medium',
        created_at: new Date().toISOString(),
      };
      this.recommendations.set(recRecord.id, recRecord);
      issueRecord.recommendation = recRecord;
    });
  }

  // --------------------------------------------------------
  // Projects
  // --------------------------------------------------------
  public getProjects(): ProjectRecord[] {
    return Array.from(this.projects.values());
  }

  public getProject(id: string): ProjectRecord | undefined {
    return this.projects.get(id);
  }

  public createProject(url: string, domain: string, userId = 'usr_default_admin'): ProjectRecord {
    const id = `proj_${Date.now()}`;
    const project: ProjectRecord = {
      id,
      user_id: userId,
      url,
      domain,
      status: 'active',
      last_audit_at: null,
      created_at: new Date().toISOString(),
    };
    this.projects.set(id, project);
    return project;
  }

  public updateProjectStatus(id: string, status: 'active' | 'paused'): ProjectRecord | undefined {
    const p = this.projects.get(id);
    if (p) {
      p.status = status;
      this.projects.set(id, p);
    }
    return p;
  }

  // --------------------------------------------------------
  // Audits
  // --------------------------------------------------------
  public getLatestAudit(projectId: string): AuditRecord | undefined {
    const projectAudits = Array.from(this.audits.values())
      .filter(a => a.project_id === projectId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return projectAudits[0];
  }

  public getAuditHistory(projectId: string): AuditRecord[] {
    return Array.from(this.audits.values())
      .filter(a => a.project_id === projectId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  public saveAudit(record: Omit<AuditRecord, 'id' | 'created_at'>): AuditRecord {
    const id = `audit_${Date.now()}`;
    const audit: AuditRecord = {
      ...record,
      id,
      created_at: new Date().toISOString(),
    };
    this.audits.set(id, audit);

    // Update project last_audit_at
    const p = this.projects.get(record.project_id);
    if (p) {
      p.last_audit_at = audit.created_at;
      this.projects.set(p.id, p);
    }

    return audit;
  }

  // --------------------------------------------------------
  // Pages
  // --------------------------------------------------------
  public getPages(projectId: string): PageRecord[] {
    return Array.from(this.pages.values()).filter(p => p.project_id === projectId);
  }

  public savePage(record: Omit<PageRecord, 'id' | 'last_crawled_at'>): PageRecord {
    // Check if url exists for project
    for (const [id, page] of this.pages.entries()) {
      if (page.project_id === record.project_id && page.url === record.url) {
        const updated = { ...page, ...record, last_crawled_at: new Date().toISOString() };
        this.pages.set(id, updated);
        return updated;
      }
    }
    const id = `page_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const page: PageRecord = {
      ...record,
      id,
      last_crawled_at: new Date().toISOString(),
    };
    this.pages.set(id, page);
    return page;
  }

  // --------------------------------------------------------
  // Issues & Recommendations
  // --------------------------------------------------------
  public getIssues(auditId: string): IssueRecord[] {
    return Array.from(this.issues.values())
      .filter(i => i.audit_id === auditId)
      .map(i => {
        // attach recommendation if available
        const rec = Array.from(this.recommendations.values()).find(r => r.issue_id === i.id);
        return { ...i, recommendation: rec };
      });
  }

  public saveIssue(record: Omit<IssueRecord, 'id' | 'created_at'>): IssueRecord {
    const id = `iss_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const issue: IssueRecord = {
      ...record,
      id,
      created_at: new Date().toISOString(),
    };
    this.issues.set(id, issue);
    return issue;
  }

  public updateIssueStatus(issueId: string, status: IssueStatus): IssueRecord | undefined {
    const issue = this.issues.get(issueId);
    if (issue) {
      issue.status = status;
      this.issues.set(issueId, issue);
    }
    return issue;
  }

  public saveRecommendation(record: Omit<RecommendationRecord, 'id' | 'created_at'>): RecommendationRecord {
    const id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const recommendation: RecommendationRecord = {
      ...record,
      id,
      created_at: new Date().toISOString(),
    };
    this.recommendations.set(id, recommendation);

    // Link to issue
    const issue = this.issues.get(record.issue_id);
    if (issue) {
      issue.recommendation = recommendation;
      this.issues.set(issue.id, issue);
    }

    return recommendation;
  }
}

export const dbStore = new SEOFixStore();
