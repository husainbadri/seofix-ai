import React from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  SearchCheck, 
  KeyRound, 
  TrendingUp, 
  Users2, 
  Link2, 
  Bot, 
  Sparkles, 
  FileSpreadsheet, 
  Settings 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'site-audit', label: 'Site Audit (25 Skills)', icon: SearchCheck },
    { id: 'keyword-research', label: 'Keyword Research', icon: KeyRound },
    { id: 'rank-tracking', label: 'Rank Tracking', icon: TrendingUp },
    { id: 'competitors', label: 'Competitors', icon: Users2 },
    { id: 'backlinks', label: 'Backlinks', icon: Link2 },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
    { id: 'humanizer', label: 'Humanizer Studio', icon: Sparkles },
    { id: 'reports', label: 'White-Label Reports', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col h-screen sticky top-0 z-30">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-white tracking-wide">Apex<span className="text-indigo-400">SEO</span></h1>
          <p className="text-xs text-slate-400">Enterprise AI Engine</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-300">Crawler Worker Active</span>
          </div>
          <span className="text-[10px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded border border-indigo-800">v2.4</span>
        </div>
      </div>
    </aside>
  );
};
