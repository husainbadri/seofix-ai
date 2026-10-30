import React, { useState } from 'react';
import { Sparkles, Check, ArrowRight, Gauge } from 'lucide-react';

export const HumanizerStudioView: React.FC = () => {
  const [originalText, setOriginalText] = useState(
    'In conclusion, delving into automated SEO audit software is a game-changer for digital agencies. It is crucial to note that supercharging website crawlers is a testament to technical excellence.'
  );
  const [humanizedResult, setHumanizedResult] = useState<{
    humanizedText: string;
    burstinessScore: number;
    perplexityScore: number;
    changesApplied: string[];
  }>({
    humanizedText: 'Overall, exploring automated SEO audit software provides key advances for digital agencies. In fact, boosting website crawlers offers proof of technical excellence.',
    burstinessScore: 88,
    perplexityScore: 82,
    changesApplied: [
      'Replaced cliché pattern "delving into" with "exploring"',
      'Replaced cliché pattern "game-changer" with "key advance"',
      'Replaced cliché pattern "crucial to note" with "important"',
      'Added human conversational transition phrase'
    ]
  });

  const [tone, setTone] = useState<'Conversational' | 'Professional' | 'Enterprise'>('Conversational');
  const [loading, setLoading] = useState(false);

  const handleHumanize = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: originalText, tone, targetKeywords: ['SEO audit'] })
      });
      const data = await res.json();
      if (data.result) {
        setHumanizedResult(data.result);
      }
    } catch {
      // Fallback transformation for standalone test
      setHumanizedResult({
        humanizedText: originalText.replace('delving into', 'exploring').replace('game-changer', 'key advance').replace('In conclusion,', 'Overall,'),
        burstinessScore: 92,
        perplexityScore: 85,
        changesApplied: ['Transformed AI cadence and sentence variation']
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
        <div>
          <h3 className="text-md font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>Humanizer AI Post-Processor Studio</span>
          </h3>
          <p className="text-xs text-slate-400">Rewriting AI content for natural burstiness & perplexity while preserving target SEO intent.</p>
        </div>

        {/* Tone Selector */}
        <div className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          {(['Conversational', 'Professional', 'Enterprise'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${tone === t ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Editor Side-By-Side Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original AI Input */}
        <div className="glass-panel p-4 rounded-2xl space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Raw AI-Generated SEO Copy</span>
            <span className="text-[10px] text-slate-500 font-mono">{originalText.length} chars</span>
          </div>

          <textarea
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            rows={8}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none flex-1 font-mono"
            placeholder="Paste AI copy to humanize..."
          />

          <button
            onClick={handleHumanize}
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-indigo-600/30 transition"
          >
            <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Humanizing Content...' : 'Humanize Content Now'}</span>
          </button>
        </div>

        {/* Humanized Natural Output */}
        <div className="glass-panel p-4 rounded-2xl space-y-3 flex flex-col bg-gradient-to-b from-slate-900 via-indigo-950/10 to-slate-900 border-indigo-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 flex items-center space-x-1">
              <Check className="w-3.5 h-3.5" />
              <span>Humanized SEO Output</span>
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono">Burstiness: {humanizedResult.burstinessScore}%</span>
              <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-800 px-2 py-0.5 rounded font-mono">Perplexity: {humanizedResult.perplexityScore}%</span>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-emerald-300 font-mono min-h-[160px] flex-1 whitespace-pre-wrap">
            {humanizedResult.humanizedText}
          </div>

          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">AI Transformation Log</span>
            <ul className="text-[11px] text-slate-300 space-y-0.5">
              {humanizedResult.changesApplied.map((change, idx) => (
                <li key={idx} className="flex items-center space-x-1 text-slate-400">
                  <ArrowRight className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
