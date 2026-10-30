export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface SEORoadmapItem {
  month: number;
  focusArea: string;
  actionItems: string[];
  expectedImpact: string;
}

export class AIChatAssistant {
  public async respondToQuery(userQuery: string, auditContext?: any): Promise<string> {
    const q = userQuery.toLowerCase();

    if (q.includes('why is my seo score low') || q.includes('score low')) {
      const score = auditContext?.overallScore || 64;
      return `Your overall SEO score is currently **${score}/100**. The primary factors driving down your score are:\n\n` +
        `1. **Critical Indexability Blockers**: Missing canonical tags and robots.txt directives.\n` +
        `2. **Slow Response Latency (Core Web Vitals)**: Page response times exceeding 2.5s.\n` +
        `3. **Thin Content & Duplicate Titles**: Pages with under 300 words and missing meta descriptions.\n\n` +
        `*Recommendation*: Focus on resolving the Quick Wins listed in your Site Audit dashboard to see an immediate score boost.`;
    }

    if (q.includes('duplicate title') || q.includes('fix duplicate')) {
      return `To fix duplicate titles across your pages:\n\n` +
        `1. Ensure each URL has a unique primary target keyword.\n` +
        `2. Use dynamic title templates in Next.js/React:\n` +
        `\`\`\`tsx\n// Next.js Metadata API\nexport const metadata = {\n  title: 'Unique Page Keyword | My Brand',\n};\n\`\`\`\n` +
        `3. Add self-referencing canonical tags to differentiate parameter variations.`;
    }

    if (q.includes('schema') || q.includes('generate schema')) {
      return `Here is a production-grade **JSON-LD Schema** snippet for your target page:\n\n` +
        `\`\`\`html\n<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "SoftwareApplication",\n  "name": "AI SEO Platform",\n  "operatingSystem": "All",\n  "applicationCategory": "BusinessApplication",\n  "offers": {\n    "@type": "Offer",\n    "price": "0.00",\n    "priceCurrency": "USD"\n  }\n}\n</script>\n\`\`\``;
    }

    if (q.includes('roadmap') || q.includes('3-month')) {
      return `Here is your customized **3-Month AI SEO Strategic Roadmap**:\n\n` +
        `### 🗓️ Month 1: Technical & Foundation\n` +
        `- Fix all 404/500 broken links and canonical tags.\n` +
        `- Compress images to WebP/AVIF and optimize LCP.\n` +
        `- Implement Organization & LocalBusiness JSON-LD schema.\n\n` +
        `### 📈 Month 2: On-Page & Content Expansion\n` +
        `- Expand thin content pages (<300 words) using AI Humanizer.\n` +
        `- Eliminate keyword cannibalization on top 5 entry pages.\n` +
        `- Build internal linking clusters around core pillar pages.\n\n` +
        `### 🚀 Month 3: Authority & Competitor Conquesting\n` +
        `- Launch target keyword campaigns for identified competitor content gaps.\n` +
        `- Disavow toxic spam backlinks in Google Search Console.\n` +
        `- Monitor keyword rank velocity and refine SERP feature snippets.`;
    }

    return `I am your **AI SEO Assistant**. I can analyze your site audit data, generate JSON-LD schema, write humanized meta descriptions, audit internal links, and build 3-month strategic roadmaps. How can I help you optimize your site today?`;
  }
}
