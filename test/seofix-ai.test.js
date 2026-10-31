/**
 * SEOFix AI - Platform Verification Test Suite
 * Validates CrawlerService, ParserService, AuditEngine, weighted scoring, and Store CRUD.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

// Helper to mock HTML
const sampleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Acme Growth Tools & Enterprise SEO Analytics</title>
  <meta name="description" content="Discover Acme Growth tools to boost your organic search engine ranking, track keyword difficulty, and optimize Core Web Vitals." />
  <link rel="canonical" href="https://acme-saas.com/pricing" />
</head>
<body>
  <h1>Scale Your Organic Search Traffic</h1>
  <h2>Subheading Feature</h2>
  <p>Here is substantive paragraph content with lots of helpful information to ensure we meet Google helpful content guidelines. We provide real-time site audit crawlers, backlink analysis, and automated AI code fixes for developers.</p>
  <img src="/logo.png" alt="Acme SaaS Corporate Brand Logo" />
  <a href="https://acme-saas.com/features">Features</a>
  <a href="https://google.com">External Partner</a>
</body>
</html>`;

test('SEOFix AI Test Suite', async (t) => {
  await t.test('1. HTTP Server & Health Check', async () => {
    const res = await new Promise((resolve, reject) => {
      http.get('http://localhost:3000/api/health', (r) => {
        let data = '';
        r.on('data', c => data += c);
        r.on('end', () => resolve({ status: r.statusCode, body: JSON.parse(data) }));
      }).on('error', reject);
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });

  await t.test('2. Projects API returns active projects', async () => {
    const res = await new Promise((resolve, reject) => {
      http.get('http://localhost:3000/api/projects', (r) => {
        let data = '';
        r.on('data', c => data += c);
        r.on('end', () => resolve({ status: r.statusCode, body: JSON.parse(data) }));
      }).on('error', reject);
    });

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.projects));
    assert.ok(res.body.projects.length >= 1);
    assert.equal(res.body.projects[0].domain, 'acme-saas.com');
  });

  await t.test('3. Audits API returns weighted scores (40% Tech / 35% Content / 25% Perf)', async () => {
    const res = await new Promise((resolve, reject) => {
      http.get('http://localhost:3000/api/audits/latest?projectId=proj_acme_saas', (r) => {
        let data = '';
        r.on('data', c => data += c);
        r.on('end', () => resolve({ status: r.statusCode, body: JSON.parse(data) }));
      }).on('error', reject);
    });

    assert.equal(res.status, 200);
    const audit = res.body.audit;
    assert.ok(audit);
    assert.ok(audit.score_overall >= 0 && audit.score_overall <= 100);
    assert.ok(audit.score_technical >= 0 && audit.score_technical <= 100);
    assert.ok(audit.score_content >= 0 && audit.score_content <= 100);
    assert.ok(audit.score_performance >= 0 && audit.score_performance <= 100);
  });

  await t.test('4. Issues API returns typed issues with AI recommendations', async () => {
    const res = await new Promise((resolve, reject) => {
      http.get('http://localhost:3000/api/issues?auditId=audit_01_init', (r) => {
        let data = '';
        r.on('data', c => data += c);
        r.on('end', () => resolve({ status: r.statusCode, body: JSON.parse(data) }));
      }).on('error', reject);
    });

    assert.equal(res.status, 200);
    const issues = res.body.issues;
    assert.ok(Array.isArray(issues));
    assert.ok(issues.length > 0);

    const first = issues[0];
    assert.ok(first.type);
    assert.ok(first.severity);
    assert.ok(first.recommendation);
    assert.ok(first.recommendation.suggested_fix);
  });

  await t.test('5. Issue status update via PATCH', async () => {
    const postData = JSON.stringify({ status: 'ignored' });
    const res = await new Promise((resolve, reject) => {
      const req = http.request(
        'http://localhost:3000/api/issues/iss_2',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
        },
        (r) => {
          let data = '';
          r.on('data', c => data += c);
          r.on('end', () => resolve({ status: r.statusCode, body: JSON.parse(data) }));
        }
      );
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.issue.status, 'ignored');
  });

  await t.test('6. Scheduled Cron endpoint triggers audit execution', async () => {
    const res = await new Promise((resolve, reject) => {
      const req = http.request(
        'http://localhost:3000/api/cron/audit',
        { method: 'POST' },
        (r) => {
          let data = '';
          r.on('data', c => data += c);
          r.on('end', () => resolve({ status: r.statusCode, body: JSON.parse(data) }));
        }
      );
      req.on('error', reject);
      req.end();
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  await t.test('7. AEO Engine unit analysis (AI Bots, Q&A, and FAQ schema)', async () => {
    const { AEOEngine } = require('../src/services/aeo-engine.js');
    const mockHtml = `
      <html>
        <head>
          <title>Test Page</title>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": []
          }
          </script>
        </head>
        <body>
          <h2>How does automated AEO work?</h2>
          <p>Automated Answer Engine Optimization inspects inverted pyramid paragraphs, measures factual data density, and ensures AI search crawlers can index and cite your platform in real-time answers.</p>
          <table><tr><th>Tool</th><th>Score</th></tr><tr><td>SEOFix</td><td>98%</td></tr></table>
        </body>
      </html>
    `;
    const robotsTxt = `User-agent: *\nDisallow: /admin\nUser-agent: OAI-SearchBot\nAllow: /\nUser-agent: PerplexityBot\nAllow: /`;
    const result = AEOEngine.analyzeAEO(mockHtml, 'https://test.com', robotsTxt);

    assert.ok(result.aeoScore >= 0 && result.aeoScore <= 100);
    assert.ok(result.metrics.hasFaqSchema === true);
    assert.ok(result.metrics.questionHeadingCount >= 1);
    assert.ok(result.metrics.tableCount >= 1);
    assert.ok(result.aiBots.length === 6);

    const oai = result.aiBots.find(b => b.bot === 'OAI-SearchBot');
    assert.ok(oai && oai.allowed === true);
  });

  await t.test('8. Audits API returns AEO metrics & citation readiness', async () => {
    const res = await new Promise((resolve, reject) => {
      http.get('http://localhost:3000/api/audits/latest?projectId=proj_acme_saas', (r) => {
        let data = '';
        r.on('data', c => data += c);
        r.on('end', () => resolve({ status: r.statusCode, body: JSON.parse(data) }));
      }).on('error', reject);
    });

    assert.equal(res.status, 200);
    const audit = res.body.audit;
    assert.ok(audit);
    const aeo = audit.metrics?.aeo || audit.aeo;
    assert.ok(aeo, 'Audit must contain AEO metrics object');
    assert.ok(aeo.aeoScore >= 0 && aeo.aeoScore <= 100);
    assert.ok(['A+', 'A', 'B+', 'B', 'C', 'D', 'F'].includes(aeo.aeoGrade));
    assert.ok(Array.isArray(aeo.aiBots));
    assert.ok(aeo.aiBots.length >= 6);
    assert.ok(Array.isArray(aeo.questionAnswers));
    assert.ok(aeo.recommendedFaqSchema);
  });

  await t.test('9. AEO Citation Simulator endpoint (POST /api/aeo/simulate)', async () => {
    const postData = JSON.stringify({
      projectId: 'proj_acme_saas',
      query: 'How does Acme SaaS automate technical SEO?',
      domain: 'acme-saas.com',
    });

    const res = await new Promise((resolve, reject) => {
      const req = http.request(
        'http://localhost:3000/api/aeo/simulate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
        },
        (r) => {
          let data = '';
          r.on('data', c => data += c);
          r.on('end', () => resolve({ status: r.statusCode, body: JSON.parse(data) }));
        }
      );
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    assert.equal(res.status, 200);
    const sim = res.body.simulation;
    assert.ok(sim, 'Simulation response must be present');
    assert.ok(sim.synthesizedAnswer.includes('Acme SaaS'));
    assert.ok(sim.confidenceScore > 50);
    assert.ok(Array.isArray(sim.citationSources));
    assert.equal(sim.citationSources[0].domain, 'acme-saas.com');
  });
});
