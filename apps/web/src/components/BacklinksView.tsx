import React from 'react';
import { Link2, ShieldAlert } from 'lucide-react';

export const BacklinksView: React.FC = () => {
  const backlinks = [
    { source: 'techcrunch.com/article/ai-tools', target: '/', anchor: 'AI SEO Platform', da: 92, follow: true, spam: '1%' },
    { source: 'producthunt.com/posts/apex-seo', target: '/features', anchor: 'Apex SEO', da: 88, follow: true, spam: '2%' },
    { source: 'forbes.com/sites/tech/marketing-ai', target: '/', anchor: 'automated site audit', da: 94, follow: true, spam: '0%' },
    { source: 'spamsite-directory.net/link-12', target: '/pricing', anchor: 'click here', da: 12, follow: false, spam: '84%' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium block mb-1">Domain Authority (DA)</span>
          <span className="text-3xl font-extrabold text-white">48 / 100</span>
        </div>
        <div className="glass-panel p-6 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium block mb-1">Total Referring Domains</span>
          <span className="text-3xl font-extrabold text-indigo-400">340</span>
        </div>
        <div className="glass-panel p-6 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium block mb-1">Backlink Spam Score</span>
          <span className="text-3xl font-extrabold text-emerald-400">3.2% (Healthy)</span>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Link2 className="w-4 h-4 text-indigo-400" />
            <span>Recent Referring Backlinks Log</span>
          </h3>
        </div>

        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
            <tr>
              <th className="p-4">Referring Source URL</th>
              <th className="p-4">Anchor Text</th>
              <th className="p-4">Domain Authority</th>
              <th className="p-4">Link Rel</th>
              <th className="p-4">Spam Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {backlinks.map((b) => (
              <tr key={b.source} className="hover:bg-slate-900/40">
                <td className="p-4 font-mono text-indigo-400">{b.source}</td>
                <td className="p-4 font-semibold text-slate-200">"{b.anchor}"</td>
                <td className="p-4 font-bold text-white">DA {b.da}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.follow ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                    {b.follow ? 'DoFollow' : 'NoFollow'}
                  </span>
                </td>
                <td className="p-4">
                  {parseInt(b.spam) > 50 ? (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 font-bold flex items-center space-x-1 w-fit">
                      <ShieldAlert className="w-3 h-3" />
                      <span>Toxic ({b.spam})</span>
                    </span>
                  ) : (
                    <span className="text-slate-400">{b.spam}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
