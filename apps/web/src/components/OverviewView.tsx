import React from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { ShieldCheck, Zap, FileText, Lock, Eye, AlertCircle, ArrowUpRight } from 'lucide-react';

interface OverviewProps {
  report: any;
  onNavigateTab: (tab: string) => void;
}

export const OverviewView: React.FC<OverviewProps> = ({ report, onNavigateTab }) => {
  const chartData = [
    { date: 'Jul 01', score: 62 },
    { date: 'Jul 08', score: 65 },
    { date: 'Jul 15', score: 71 },
    { date: 'Jul 22', score: 74 },
    { date: 'Aug 01', score: report?.overallScore || 78 },
  ];

  const categories = [
    { label: 'Technical SEO', score: report?.technicalScore || 82, icon: ShieldCheck, color: 'from-blue-500 to-indigo-600' },
    { label: 'Performance', score: report?.performanceScore || 70, icon: Zap, color: 'from-amber-500 to-orange-600' },
    { label: 'Content Quality', score: report?.contentScore || 85, icon: FileText, color: 'from-emerald-500 to-teal-600' },
    { label: 'Security', score: report?.securityScore || 95, icon: Lock, color: 'from-purple-500 to-indigo-600' },
    { label: 'Accessibility', score: report?.accessibilityScore || 90, icon: Eye, color: 'from-pink-500 to-rose-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Summary Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center space-x-2">
          <span>AI Executive Audit Summary</span>
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          {report?.executiveSummary || 'Comprehensive AI SEO audit active. Analyzed target domain across 25 specialized sub-skills. Identified 12 critical indexability & performance fixes to unlock organic search growth.'}
        </p>
      </motion.div>

      {/* Main Score Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Health Dial */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <h3 className="text-sm font-medium text-slate-400 mb-4">Overall SEO Health Score</h3>
          
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" className="text-slate-800" fill="transparent" />
              <circle
                cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8"
                className="text-indigo-500 transition-all duration-1000 ease-out"
                strokeDasharray={`${(report?.overallScore || 78) * 2.64} 264`}
                strokeLinecap="round" fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-extrabold text-white">{report?.overallScore || 78}</span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
          </div>

          <div className="mt-4 flex items-center space-x-4 text-xs">
            <div className="text-slate-400">Pages Crawled: <span className="text-white font-semibold">{report?.crawledPagesCount || 10}</span></div>
            <div className="text-slate-400">Issues: <span className="text-rose-400 font-semibold">{report?.totalIssuesCount || 18}</span></div>
          </div>
        </motion.div>

        {/* Score Trend Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6 rounded-2xl lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">Health Score Velocity Trend</h3>
            <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-medium">+16% this month</span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="scoreGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#64748B" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#FFF' }} />
                <Area type="monotone" dataKey="score" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#scoreGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <motion.div key={cat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * idx }} className="glass-panel p-4 rounded-xl glass-card-hover cursor-pointer" onClick={() => onNavigateTab('site-audit')}>
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${cat.color} flex items-center justify-center text-white shadow-md`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-300">{cat.score}%</span>
              </div>
              <p className="text-xs font-medium text-slate-400 mt-2">{cat.label}</p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className={`bg-gradient-to-r ${cat.color} h-full rounded-full`} style={{ width: `${cat.score}%` }} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Wins & Critical Priority Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-md font-bold text-white mb-4 flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>AI Quick Wins (High Impact, Easy Fixes)</span>
          </h3>

          <div className="space-y-3">
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Fix Missing Meta Descriptions</h4>
                <p className="text-xs text-slate-400">Boost SERP CTR on top 4 entry pages.</p>
              </div>
              <button onClick={() => onNavigateTab('humanizer')} className="flex items-center space-x-1 text-xs text-indigo-400 font-medium hover:underline">
                <span>Humanize Copy</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Add Canonical Tags to 3 Query Parameter URLs</h4>
                <p className="text-xs text-slate-400">Eliminate duplicate content indexing.</p>
              </div>
              <button onClick={() => onNavigateTab('site-audit')} className="flex items-center space-x-1 text-xs text-indigo-400 font-medium hover:underline">
                <span>View Code Fix</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-md font-bold text-white mb-4 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <span>Critical Severity Distribution</span>
          </h3>

          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl">
              <span className="block text-2xl font-extrabold text-rose-400">{report?.criticalIssuesCount || 3}</span>
              <span className="text-[11px] font-medium text-rose-300">Critical</span>
            </div>
            <div className="p-3 bg-orange-950/40 border border-orange-800/40 rounded-xl">
              <span className="block text-2xl font-extrabold text-orange-400">{report?.highIssuesCount || 5}</span>
              <span className="text-[11px] font-medium text-orange-300">High</span>
            </div>
            <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-xl">
              <span className="block text-2xl font-extrabold text-amber-400">{report?.mediumIssuesCount || 7}</span>
              <span className="text-[11px] font-medium text-amber-300">Medium</span>
            </div>
            <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-xl">
              <span className="block text-2xl font-extrabold text-blue-400">{report?.lowIssuesCount || 3}</span>
              <span className="text-[11px] font-medium text-blue-300">Low</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
