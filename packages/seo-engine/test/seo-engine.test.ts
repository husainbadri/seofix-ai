import { describe, it, expect } from 'vitest';
import { SEOAuditOrchestrator } from '../src/orchestrator';

describe('SEOAuditOrchestrator - 25 Sub-Skill Integration Test Suite', () => {
  it('should execute all 25 sub-skills and return a comprehensive audit report', async () => {
    const orchestrator = new SEOAuditOrchestrator();
    const report = await orchestrator.runFullAudit('acme-saas.com', 5);

    expect(report).toBeDefined();
    expect(report.targetDomain).toBe('acme-saas.com');
    expect(report.skillResults.length).toBe(25);
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.overallScore).toBeLessThanOrEqual(100);
    expect(report.executiveSummary).toContain('Acme-saas.com');
  });
});
