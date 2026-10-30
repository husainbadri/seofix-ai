import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, CheckCircle, Copy, X } from 'lucide-react';

interface SiteAuditViewProps {
  report: any;
}

export const SiteAuditView: React.FC<SiteAuditViewProps> = ({ report }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeFixModalIssue, setActiveFixModalIssue] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const categories = [
    'All', 'Crawling', 'Technical', 'On-Page', 'Performance', 
    'Accessibility', 'Security', 'Content', 'Architecture', 
    'Schema', 'Local SEO', 'Mobile', 'Indexability', 'Keywords', 'Links'
  ];

  const allIssues = report?.allIssues || [
    {
      id: 'missing-title-1',
      pageUrl: 'https://acme-saas.com/pricing',
      subSkill: 'on-page-seo',
      category: 'On-Page',
      severity: 'CRITICAL',
      score: 0,
      title: 'Missing HTML Title Tag',
      description: 'This page has no <title> tag. Title tags are essential ranking factors.',
      recommendation: 'Add a target keyword focused title tag.',
      aiFixCode: `<title>Acme SaaS Enterprise Pricing & Subscription Plans</title>`,
      estimatedImpact: 95
    },
    {
      id: 'missing-canonical-2',
      pageUrl: 'https://acme-saas.com/features?utm_source=ad',
      subSkill: 'canonical-tags',
      category: 'Indexability',
      severity: 'HIGH',
      score: 35,
      title: 'Missing Canonical Tag on Query Parameter URL',
      description: 'No rel="canonical" link specified leading to duplicate indexing risk.',
      recommendation: 'Add self-referencing canonical tag pointing to primary URL.',
      aiFixCode: `<link rel="canonical" href="https://acme-saas.com/features" />`,
      estimatedImpact: 85
    },
    {
      id: 'slow-lcp-3',
      pageUrl: 'https://acme-saas.com/',
      subSkill: 'core-web-vitals',
      category: 'Performance',
      severity: 'HIGH',
      score: 55,
      title: 'Slow Largest Contentful Paint (LCP: 3,200ms)',
      description: 'LCP exceeds the 2,500ms target limit.',
      recommendation: 'Preload hero banner assets.',
      aiFixCode: `<link rel="preload" href="/hero-banner.webp" as="image" fetchpriority="high" />`,
      estimatedImpact: 85
    }
  ];

  const filteredIssues = selectedCategory === 'All' 
    ? allIssues 
    : allIssues.filter((i: any) => i.category.toLowerCase() === selectedCategory.toLowerCase());

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-rose-950/80 text-rose-300 border-rose-800/60';
      case 'HIGH': return 'bg-orange-950/80 text-orange-300 border-orange-800/60';
      case 'MEDIUM': return 'bg-amber-950/80 text-amber-300 border-amber-800/60';
      default: return 'bg-blue-950/80 text-blue-300 border-blue-800/60';
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs Header */}
      <div className="glass-panel p-4 rounded-2xl flex items-center space-x-2 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Issues Table Grid */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Audit Issues Log ({filteredIssues.length})</h3>
          <span className="text-xs text-slate-400">Showing 25 Sub-Skill Diagnostics</span>
        </div>

        <div className="divide-y divide-slate-800">
          {filteredIssues.map((issue: any) => (
            <motion.div key={issue.id} layout className="p-4 hover:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadgeClass(issue.severity)}`}>
                    {issue.severity}
                  </span>
                  <span className="text-xs text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900">
                    {issue.subSkill}
                  </span>
                  <span className="text-xs text-slate-400">{issue.category}</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-100">{issue.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-1">{issue.description}</p>
                <div className="text-[11px] text-slate-500 font-mono">Target: {issue.pageUrl}</div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Ranking Impact</span>
                  <span className="text-sm font-bold text-emerald-400">+{issue.estimatedImpact}%</span>
                </div>

                <button
                  onClick={() => setActiveFixModalIssue(issue)}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>View AI Code Fix</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* AI Fix Code Modal */}
      <AnimatePresence>
        {activeFixModalIssue && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-panel max-w-2xl w-full p-6 rounded-2xl border border-indigo-500/30 shadow-2xl relative space-y-4">
              <button onClick={() => setActiveFixModalIssue(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-2">
                <Code className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">AI-Generated Code Fix</h3>
              </div>

              <p className="text-xs text-slate-300 font-medium">{activeFixModalIssue.title}</p>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300">
                <strong>Recommendation:</strong> {activeFixModalIssue.recommendation}
              </div>

              <div className="relative">
                <div className="flex items-center justify-between bg-slate-950 px-4 py-2 rounded-t-xl border border-b-0 border-slate-800">
                  <span className="text-xs font-mono text-slate-400">Code Snippet Patch</span>
                  <button onClick={() => handleCopyCode(activeFixModalIssue.aiFixCode || '')} className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300">
                    {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 rounded-b-xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                  {activeFixModalIssue.aiFixCode || `<!-- Suggested Fix Tag -->\n<meta name="robots" content="index, follow" />`}
                </pre>
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={() => setActiveFixModalIssue(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-700">
                  Close Modal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
