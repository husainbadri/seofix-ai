/**
 * SEOFix AI - AEOEngine (Answer Engine Optimization & Generative Engine Optimization)
 * Evaluates webpages for citation readiness in ChatGPT Search, Perplexity AI, Google AI Overviews, and Claude.
 */

export interface AIBotStatus {
  bot: string;
  name: string;
  platform: string;
  allowed: boolean;
  directive: 'Allow' | 'Disallow' | 'Default (Allowed)';
}

export interface QuestionAnswerPair {
  heading: string;
  level: string;
  extractedAnswer: string;
  wordCount: number;
  isDirectAnswer: boolean; // 35 - 65 words in first paragraph
  snippetSuitability: 'Excellent' | 'Too Long' | 'Too Short' | 'Missing';
}

export interface AEOIssue {
  id: string;
  type: 'ai_bot_blocked' | 'missing_direct_answer' | 'missing_faq_schema' | 'low_data_density' | 'no_entity_links' | 'low_table_density';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  suggestedFix: string;
  codeSnippet?: string;
  impact: 'High' | 'Medium' | 'Low';
}

export interface AEOResult {
  aeoScore: number;
  aeoScoreExact: number;
  aeoGrade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  citationPotential: 'High' | 'Medium' | 'Low';
  metrics: {
    directAnswerReadinessPct: number;
    aiBotAccessCount: number;
    aiBotTotalCount: number;
    tableCount: number;
    listCount: number;
    dataPointCount: number;
    questionHeadingCount: number;
    hasFaqSchema: boolean;
    hasHowToSchema: boolean;
    hasWikidataEntityLinks: boolean;
    schemaTypes: string[];
    avgAnswerWordCount: number;
  };
  aiBots: AIBotStatus[];
  questionAnswers: QuestionAnswerPair[];
  topCiteableSnippets: string[];
  issues: AEOIssue[];
  recommendedFaqSchema: string;
}

export class AEOEngine {
  private static KNOWN_AI_BOTS = [
    { bot: 'OAI-SearchBot', name: 'OpenAI SearchBot', platform: 'ChatGPT Search' },
    { bot: 'GPTBot', name: 'OpenAI GPTBot', platform: 'OpenAI Crawler' },
    { bot: 'PerplexityBot', name: 'PerplexityBot', platform: 'Perplexity AI' },
    { bot: 'ClaudeBot', name: 'ClaudeBot', platform: 'Anthropic Claude' },
    { bot: 'Google-Extended', name: 'Google-Extended', platform: 'Gemini Training' },
    { bot: 'CCBot', name: 'Common Crawl', platform: 'LLM Corpora' },
  ];

  /**
   * Run full AEO & GEO evaluation on a target page.
   */
  public static analyzeAEO(html: string, pageUrl: string, robotsTxt = ''): AEOResult {
    let domain = 'example.com';
    try { domain = new URL(pageUrl).hostname; } catch {}

    // 1. Audit AI Bot Permissions from robots.txt
    const aiBots = this.auditAIBots(robotsTxt);
    const blockedBots = aiBots.filter(b => !b.allowed);

    // 2. Headings & Question-Answer Extraction (Inverted Pyramid)
    const qaPairs = this.extractQuestionAnswers(html);
    const directAnswers = qaPairs.filter(q => q.isDirectAnswer);
    const directAnswerReadinessPct = qaPairs.length > 0 
      ? Math.round((directAnswers.length / qaPairs.length) * 100) 
      : 50;

    // 3. Information Gain & Data Structuring Metrics
    const tableCount = (html.match(/<table\b/gi) || []).length;
    const listCount = (html.match(/<(ul|ol)\b/gi) || []).length;
    
    // Find numeric figures, percentages, and currencies ($100, 45%, 1.5M, etc.)
    const cleanText = html.replace(/<[^>]+>/g, ' ');
    const dataPoints = cleanText.match(/(\$\d+[\d,.]*|\b\d+[\d,.]*%\b|\b\d+\s*(?:million|billion|trillion|users|customers|k|ms|s|gb|mb)\b)/gi) || [];
    const dataPointCount = dataPoints.length;

    // 4. Schema & Entity Graph Analysis
    const schemaBlocks: any[] = [];
    const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let sm;
    while ((sm = scriptRegex.exec(html)) !== null) {
      try { schemaBlocks.push(JSON.parse(sm[1].trim())); } catch {}
    }

    const schemaTypes: string[] = [];
    schemaBlocks.forEach(b => {
      if (b['@type']) schemaTypes.push(b['@type']);
      if (Array.isArray(b['@graph'])) {
        b['@graph'].forEach((g: any) => g['@type'] && schemaTypes.push(g['@type']));
      }
    });

    const hasFaqSchema = schemaTypes.some(t => t.toLowerCase().includes('faqpage'));
    const hasHowToSchema = schemaTypes.some(t => t.toLowerCase().includes('howto'));
    const hasWikidataEntityLinks = html.includes('wikidata.org/wiki/') || html.includes('wikipedia.org/wiki/');

    // 5. Generate Top Citeable Snippets
    const topCiteableSnippets = this.extractTopCiteableSnippets(cleanText, qaPairs);

    // 6. Evaluate AEO Score
    let score = 100.0;
    const issues: AEOIssue[] = [];

    // Check: AI Bot Access
    if (blockedBots.length > 0) {
      const names = blockedBots.map(b => b.name).join(', ');
      issues.push({
        id: 'aeo_iss_bots_blocked',
        type: 'ai_bot_blocked',
        severity: 'critical',
        title: 'AI Search Crawlers Blocked in robots.txt',
        description: `Your robots.txt disallows access to ${names}. ChatGPT Search and Perplexity cannot crawl or cite your pages.`,
        suggestedFix: 'Remove disallow rules for OAI-SearchBot and PerplexityBot in your robots.txt file.',
        codeSnippet: `# Allow AI Search Engines in robots.txt\nUser-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /`,
        impact: 'High',
      });
      score -= Math.min(30, blockedBots.length * 10);
    }

    // Check: Direct Answer Snippet Readiness
    if (qaPairs.length === 0) {
      issues.push({
        id: 'aeo_iss_no_qa',
        type: 'missing_direct_answer',
        severity: 'warning',
        title: 'Lack of Question-Based Headings',
        description: 'No question-based headings (What, How, Why, Is) were found. Answer engines rely on explicit question triggers.',
        suggestedFix: 'Rephrase section headers into natural language questions that users ask AI assistants.',
        codeSnippet: `<!-- Before: <h2>Features</h2> -->\n<!-- After: -->\n<h2>How does the platform automate technical audits?</h2>\n<p>The platform executes automated headless page crawls to inspect technical headers, DOM tags, and Core Web Vitals in real time.</p>`,
        impact: 'High',
      });
      score -= 15;
    } else if (directAnswerReadinessPct < 50) {
      issues.push({
        id: 'aeo_iss_vague_answers',
        type: 'missing_direct_answer',
        severity: 'critical',
        title: 'Vague or Buried Answers Following Headings',
        description: 'Only ' + directAnswerReadinessPct + '% of question headings have a concise direct answer (35–65 words) immediately after.',
        suggestedFix: 'Apply the inverted pyramid structure: state the direct factual answer in the first 1-2 sentences.',
        impact: 'High',
      });
      score -= 18;
    }

    // Check: FAQ Schema
    if (!hasFaqSchema) {
      issues.push({
        id: 'aeo_iss_missing_faq_schema',
        type: 'missing_faq_schema',
        severity: 'warning',
        title: 'Missing FAQPage JSON-LD Schema',
        description: 'FAQPage schema provides structured entity pairs that Google AI Overviews and SearchGPT parse directly.',
        suggestedFix: 'Embed a validated FAQPage JSON-LD block in your HTML <head>.',
        codeSnippet: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": [{\n    "@type": "Question",\n    "name": "What is ${domain}?",\n    "acceptedAnswer": {\n      "@type": "Answer",\n      "text": "${domain} provides automated enterprise auditing and AI recommendations."\n    }\n  }]\n}\n</script>`,
        impact: 'High',
      });
      score -= 14;
    }

    // Check: Entity Knowledge Graph links
    if (!hasWikidataEntityLinks) {
      issues.push({
        id: 'aeo_iss_no_entities',
        type: 'no_entity_links',
        severity: 'info',
        title: 'No Wikidata Entity Disambiguation',
        description: 'LLMs build confidence by resolving topic concepts to canonical Wikidata and Wikipedia entity URIs.',
        suggestedFix: 'Include "sameAs" properties in your JSON-LD pointing to your company or technology Wikidata IDs.',
        codeSnippet: `"sameAs": [\n  "https://www.wikidata.org/wiki/Q123456",\n  "https://en.wikipedia.org/wiki/Your_Topic"\n]`,
        impact: 'Medium',
      });
      score -= 8;
    }

    // Check: Table & Structured Data Density
    if (tableCount === 0 && listCount < 2) {
      issues.push({
        id: 'aeo_iss_low_structure',
        type: 'low_table_density',
        severity: 'info',
        title: 'Low Comparison & Table Density',
        description: 'Answer engines prioritize tabular comparisons (tables) and structured ordered lists when compiling answers.',
        suggestedFix: 'Format feature matrices, pricing tiers, and benchmark specifications into clean HTML <table> elements.',
        codeSnippet: `<table>\n  <thead>\n    <tr><th>Feature</th><th>Benefit</th><th>Benchmark</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>Audit Speed</td><td>Real-time</td><td>< 2.5s</td></tr>\n  </tbody>\n</table>`,
        impact: 'Medium',
      });
      score -= 6;
    }

    const aeoScoreExact = parseFloat(Math.max(15, Math.min(100, score)).toFixed(1));
    const aeoScore = Math.round(aeoScoreExact);

    let aeoGrade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F' = 'F';
    if (aeoScoreExact >= 92) aeoGrade = 'A+';
    else if (aeoScoreExact >= 85) aeoGrade = 'A';
    else if (aeoScoreExact >= 80) aeoGrade = 'B+';
    else if (aeoScoreExact >= 72) aeoGrade = 'B';
    else if (aeoScoreExact >= 60) aeoGrade = 'C';
    else if (aeoScoreExact >= 50) aeoGrade = 'D';

    let citationPotential: 'High' | 'Medium' | 'Low' = 'Low';
    if (aeoScore >= 75 && blockedBots.length === 0) citationPotential = 'High';
    else if (aeoScore >= 55) citationPotential = 'Medium';

    const avgAnswerWordCount = qaPairs.length > 0 
      ? Math.round(qaPairs.reduce((acc, q) => acc + q.wordCount, 0) / qaPairs.length)
      : 0;

    // Generate Recommended FAQ Schema
    const recommendedFaqSchema = this.generateRecommendedFaqSchema(domain, qaPairs);

    return {
      aeoScore,
      aeoScoreExact,
      aeoGrade,
      citationPotential,
      metrics: {
        directAnswerReadinessPct,
        aiBotAccessCount: aiBots.filter(b => b.allowed).length,
        aiBotTotalCount: aiBots.length,
        tableCount,
        listCount,
        dataPointCount,
        questionHeadingCount: qaPairs.length,
        hasFaqSchema,
        hasHowToSchema,
        hasWikidataEntityLinks,
        schemaTypes,
        avgAnswerWordCount,
      },
      aiBots,
      questionAnswers: qaPairs,
      topCiteableSnippets,
      issues,
      recommendedFaqSchema,
    };
  }

  /**
   * Check robots.txt for AI bots permissions.
   */
  private static auditAIBots(robotsTxt: string): AIBotStatus[] {
    const lines = robotsTxt.split('\n').map(l => l.trim().toLowerCase());
    
    return this.KNOWN_AI_BOTS.map(botInfo => {
      const botKey = botInfo.bot.toLowerCase();
      let directive: 'Allow' | 'Disallow' | 'Default (Allowed)' = 'Default (Allowed)';
      let allowed = true;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith(`user-agent: ${botKey}`) || (lines[i].startsWith('user-agent: *') && directive === 'Default (Allowed)')) {
          // Check subsequent lines until next user-agent
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].startsWith('user-agent:')) break;
            if (lines[j].startsWith('disallow: /') && lines[j].length <= 12) {
              allowed = false;
              directive = 'Disallow';
            } else if (lines[j].startsWith('allow: /')) {
              allowed = true;
              directive = 'Allow';
            }
          }
        }
      }

      return {
        bot: botInfo.bot,
        name: botInfo.name,
        platform: botInfo.platform,
        allowed,
        directive,
      };
    });
  }

  /**
   * Extract question-based headings and inspect the immediate subsequent text.
   */
  private static extractQuestionAnswers(html: string): QuestionAnswerPair[] {
    const pairs: QuestionAnswerPair[] = [];
    const questionTriggers = /\b(what|how|why|is|are|can|which|does|do|where|when|best|top|guide)\b/i;

    const headingRegex = /<(h[2-3])[^>]*>([\s\S]*?)<\/\1>/gi;
    let match;

    while ((match = headingRegex.exec(html)) !== null) {
      const level = match[1].toLowerCase();
      const headingText = match[2].replace(/<[^>]+>/g, '').trim();

      if (questionTriggers.test(headingText) || headingText.includes('?')) {
        // Extract paragraph immediately following heading
        const remainingHtml = html.slice(headingRegex.lastIndex);
        const pMatch = remainingHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
        const pText = pMatch ? pMatch[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ') : '';
        const words = pText.split(/\s+/).filter(Boolean);
        const wordCount = words.length;

        const isDirect = wordCount >= 30 && wordCount <= 75;
        let suitability: 'Excellent' | 'Too Long' | 'Too Short' | 'Missing' = 'Missing';
        if (wordCount >= 30 && wordCount <= 75) suitability = 'Excellent';
        else if (wordCount > 75) suitability = 'Too Long';
        else if (wordCount > 0) suitability = 'Too Short';

        pairs.push({
          heading: headingText,
          level,
          extractedAnswer: pText.slice(0, 300) + (pText.length > 300 ? '...' : ''),
          wordCount,
          isDirectAnswer: isDirect,
          snippetSuitability: suitability,
        });
      }
    }

    return pairs.slice(0, 8);
  }

  /**
   * Extract high-information-gain factual sentences suitable for LLM quotation.
   */
  private static extractTopCiteableSnippets(cleanText: string, qaPairs: QuestionAnswerPair[]): string[] {
    const snippets: string[] = [];

    // Prioritize direct answers
    qaPairs.forEach(qa => {
      if (qa.extractedAnswer && qa.extractedAnswer.length > 40) {
        snippets.push(`"${qa.extractedAnswer}"`);
      }
    });

    if (snippets.length === 0) {
      // Find sentences containing high factual density
      const sentences = cleanText.split(/(?<=[.?!])\s+/).filter(s => s.length > 50 && s.length < 220);
      const factual = sentences.filter(s => /\d+|%|\$|features|provides|delivers/i.test(s));
      snippets.push(...factual.slice(0, 3).map(s => `"${s.trim()}"`));
    }

    return snippets.slice(0, 3);
  }

  /**
   * Build recommended Schema.org FAQPage JSON-LD.
   */
  private static generateRecommendedFaqSchema(domain: string, qaPairs: QuestionAnswerPair[]): string {
    const entities = qaPairs.slice(0, 4).map(q => {
      return {
        "@type": "Question",
        "name": q.heading,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": q.extractedAnswer || `${domain} provides complete capabilities for ${q.heading.toLowerCase()}.`
        }
      };
    });

    if (entities.length === 0) {
      entities.push({
        "@type": "Question",
        "name": `How does ${domain} optimize web performance?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${domain} uses continuous automated auditing, Core Web Vitals diagnostics, and AI-generated fixes to maintain top search rankings.`
        }
      });
    }

    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": entities
    }, null, 2);
  }
}
