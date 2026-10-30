import React from 'react';
import { Play, Globe, Bell, ChevronDown } from 'lucide-react';

interface HeaderProps {
  currentDomain: string;
  onRunAudit: () => void;
  isAuditing: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentDomain, onRunAudit, isAuditing }) => {
  return (
    <header className="h-16 glass-panel border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Target Domain Selector */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          <Globe className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-slate-200">{currentDomain}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onRunAudit}
          disabled={isAuditing}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-medium shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
        >
          <Play className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
          <span>{isAuditing ? 'Auditing 25 Sub-Skills...' : 'Run Full AI Audit'}</span>
        </button>

        <button className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500" />
        </button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-indigo-500/30">
          SA
        </div>
      </div>
    </header>
  );
};
