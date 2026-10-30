import React, { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';

export const KeywordResearchView: React.FC = () => {
  const [query, setQuery] = useState('ai seo audit tool');
  const [keywords] = useState([
    { keyword: 'ai seo audit tool', volume: 18400, difficulty: 64, cpc: '$4.20', intent: 'Commercial' },
    { keyword: 'automated site crawler', volume: 12100, difficulty: 48, cpc: '$3.50', intent: 'Informational' },
    { keyword: 'white label seo report generator', volume: 9400, difficulty: 52, cpc: '$6.80', intent: 'Transactional' },
    { keyword: 'core web vitals audit software', volume: 6800, difficulty: 41, cpc: '$2.90', intent: 'Commercial' },
    { keyword: 'schema generator json ld', volume: 22000, difficulty: 58, cpc: '$1.80', intent: 'Informational' },
  ]);

  return (
    <div className="space-y-6">
      {/* Search Input Card */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keyword ideas or seed topic..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-indigo-600/30 w-full md:w-auto justify-center">
          <Sparkles className="w-4 h-4" />
          <span>Research Keywords</span>
        </button>
      </div>

      {/* Keywords Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Target Keyword Ideas</h3>
          <span className="text-xs text-slate-400">Google Ads Planner & DataForSEO Plugin</span>
        </div>

        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
            <tr>
              <th className="p-4">Keyword</th>
              <th className="p-4">Search Volume</th>
              <th className="p-4">KD (Difficulty)</th>
              <th className="p-4">Est. CPC</th>
              <th className="p-4">Search Intent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {keywords.map((kw) => (
              <tr key={kw.keyword} className="hover:bg-slate-900/40">
                <td className="p-4 font-semibold text-slate-100">{kw.keyword}</td>
                <td className="p-4 font-mono">{kw.volume.toLocaleString()} / mo</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${kw.difficulty > 60 ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'}`}>
                    {kw.difficulty}%
                  </span>
                </td>
                <td className="p-4 font-mono">{kw.cpc}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-medium">
                    {kw.intent}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
