import React from 'react';
import { Users2 } from 'lucide-react';

export const CompetitorsView: React.FC = () => {
  const competitors = [
    { domain: 'semrush.com', overlap: '64.2%', commonKeywords: 1420, traffic: '1.2M / mo' },
    { domain: 'ahrefs.com', overlap: '58.0%', commonKeywords: 1180, traffic: '980K / mo' },
    { domain: 'moz.com', overlap: '42.5%', commonKeywords: 840, traffic: '650K / mo' },
    { domain: 'sitebulb.com', overlap: '38.1%', commonKeywords: 610, traffic: '320K / mo' },
  ];

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-md font-bold text-white flex items-center space-x-2 mb-2">
          <Users2 className="w-5 h-5 text-indigo-400" />
          <span>Competitor SERP Overlap Matrix</span>
        </h3>
        <p className="text-xs text-slate-400">Identified top domain competitors competing for your organic search footprint.</p>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
            <tr>
              <th className="p-4">Competitor Domain</th>
              <th className="p-4">Keyword Overlap</th>
              <th className="p-4">Common Keywords</th>
              <th className="p-4">Est. Organic Traffic</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {competitors.map((c) => (
              <tr key={c.domain} className="hover:bg-slate-900/40">
                <td className="p-4 font-semibold text-slate-100">{c.domain}</td>
                <td className="p-4 font-mono font-bold text-indigo-400">{c.overlap}</td>
                <td className="p-4 font-mono">{c.commonKeywords.toLocaleString()}</td>
                <td className="p-4 font-mono text-emerald-400">{c.traffic}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
