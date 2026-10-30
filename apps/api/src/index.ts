import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AuditQueueWorker } from './workers/audit-worker';
import { HumanizerEngine, AIChatAssistant } from '@ai-seo/ai-engine';
import { ReportGeneratorService } from './services/report-generator';
import { GoogleSearchConsoleService, GooglePageSpeedService, GoogleKeywordPlannerAbstraction } from '@ai-seo/integrations';
import { InMemoryDbStore } from '@ai-seo/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const auditWorker = new AuditQueueWorker();
const humanizer = new HumanizerEngine();
const chatAssistant = new AIChatAssistant();
const reportService = new ReportGeneratorService();
const gscService = new GoogleSearchConsoleService();
const pagespeedService = new GooglePageSpeedService();
const keywordPlanner = new GoogleKeywordPlannerAbstraction();
const dbStore = InMemoryDbStore.getInstance();

// Seed initial project & audit data if empty
if (dbStore.projects.length === 0) {
  dbStore.projects.push({
    id: 'proj-1',
    name: 'Acme SaaS Enterprise',
    domain: 'acme-saas.com',
    targetKeywords: ['ai seo tool', 'automated crawler', 'white label seo'],
    createdAt: new Date()
  });
}

// 1. Audit Trigger Endpoint
app.post('/api/audit/run', async (req: Request, res: Response) => {
  try {
    const { domain = 'acme-saas.com', maxPages = 10, projectId = 'proj-1' } = req.body;
    const jobId = `job-${Date.now()}`;
    
    // Execute worker (runs crawler + 25 sub-skills in parallel)
    const report = await auditWorker.processCrawlJob({ jobId, projectId, domain, maxPages });
    
    return res.json({
      success: true,
      jobId,
      report
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Fetch Audit Report by JobId
app.get('/api/audit/report/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const summary = dbStore.auditSummaries.find(s => s.crawlJobId === jobId);
  const issues = dbStore.auditResults.filter(i => i.crawlJobId === jobId);

  if (!summary) {
    return res.status(404).json({ success: false, error: 'Audit job not found' });
  }

  return res.json({
    success: true,
    summary,
    issues
  });
});

// 3. Humanizer AI Endpoint
app.post('/api/ai/humanize', (req: Request, res: Response) => {
  try {
    const { text, tone = 'Conversational', targetKeywords = [] } = req.body;
    const result = humanizer.humanize(text, { tone, targetKeywords });
    
    dbStore.humanizedLogs.push({
      id: `hum-${Date.now()}`,
      originalText: text,
      humanizedText: result.humanizedText,
      burstinessScore: result.burstinessScore,
      perplexityScore: result.perplexityScore,
      createdAt: new Date()
    });

    return res.json({ success: true, result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 4. AI Chat Assistant Endpoint
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { query, auditContext } = req.body;
    const responseText = await chatAssistant.respondToQuery(query, auditContext);
    return res.json({ success: true, response: responseText });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Keyword Research Endpoint
app.get('/api/keywords/research', async (req: Request, res: Response) => {
  const q = (req.query.q as string) || 'seo audit tool';
  const seeds = [q, `${q} software`, `best ${q}`, `free ${q}`];
  const ideas = await keywordPlanner.getKeywordIdeas(seeds);
  return res.json({ success: true, keywords: ideas });
});

// 6. White-Label Report Exports (PDF & CSV)
app.post('/api/reports/white-label/pdf', async (req: Request, res: Response) => {
  try {
    const { auditReport, branding = { agencyName: 'Apex Digital Agency', brandColor: '#4F46E5' } } = req.body;
    const pdfBuffer = await reportService.generateWhiteLabelPDFBuffer(auditReport, branding);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=SEO-Audit-${auditReport.targetDomain || 'Report'}.pdf`);
    return res.send(pdfBuffer);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/reports/white-label/csv', (req: Request, res: Response) => {
  try {
    const { auditReport } = req.body;
    const csvData = reportService.generateCSV(auditReport);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=SEO-Issues-${auditReport.targetDomain || 'Audit'}.csv`);
    return res.send(csvData);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  return res.json({ status: 'ok', service: 'AI SEO Core API Engine', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 Production AI SEO Core API running on port ${PORT}`);
});
