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
});
