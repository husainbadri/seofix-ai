import React from 'react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';

export const RankTrackingView: React.FC = () => {
  const ranks = [
    { keyword: 'ai seo platform', position: 3, prev: 5, change: '+2', url: '/features' },
    { keyword: 'screaming frog alternative', position: 2, prev: 4, change: '+2', url: '/comparison' },
    { keyword: 'automated seo audit tool', position: 4, prev: 4, change: '0', url: '/' },
    { keyword: 'humanized meta generator', position: 1, prev: 3, change: '+2', url: '/humanizer' },
  ];

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
        <div>
          <h3 className="text-md font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <span>Rank Tracking Velocity</span>
          </h3>
          <p className="text-xs text-slate-400">Tracking 42 keywords daily across Google US Desktop & Mobile</p>
        </div>
        <div className="flex space-x-4 text-xs">
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 block">Top 3 Rankings</span>
            <span className="text-lg font-bold text-emerald-400">14</span>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 block">Top 10 Rankings</span>
            <span className="text-lg font-bold text-indigo-400">32</span>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
            <tr>
              <th className="p-4">Tracked Keyword</th>
              <th className="p-4">Current Position</th>
              <th className="p-4">Rank Velocity</th>
              <th className="p-4">Target Page URL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {ranks.map((r) => (
              <tr key={r.keyword} className="hover:bg-slate-900/40">
                <td className="p-4 font-semibold text-slate-100">{r.keyword}</td>
                <td className="p-4 font-mono font-bold text-white">#{r.position}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 font-bold">
                    {r.change}
                  </span>
                </td>
                <td className="p-4 font-mono text-indigo-400 flex items-center space-x-1">
                  <span>{r.url}</span>
                  <ArrowUpRight className="w-3 h-3" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
