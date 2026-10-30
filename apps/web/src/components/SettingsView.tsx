import React, { useState } from 'react';
import { Settings, Save, Check } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [gscSiteUrl, setGscSiteUrl] = useState('sc-domain:acme-saas.com');
  const [ga4PropertyId, setGa4PropertyId] = useState('properties/320148920');
  const [googleAdsDevToken, setGoogleAdsDevToken] = useState('AIzaSyD-sample-developer-token');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-md font-bold text-white flex items-center space-x-2 mb-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          <span>Platform Settings & API Credentials</span>
        </h3>
        <p className="text-xs text-slate-400">Configure Google API service integrations, Ads Keyword Planner developer tokens, and team workspace preferences.</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h4 className="text-sm font-bold text-white">Google API Integrations</h4>

        <div>
          <label className="text-xs text-slate-400 font-medium block mb-1">Google Search Console Site URL</label>
          <input
            type="text"
            value={gscSiteUrl}
            onChange={(e) => setGscSiteUrl(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 font-medium block mb-1">Google Analytics 4 Property ID</label>
          <input
            type="text"
            value={ga4PropertyId}
            onChange={(e) => setGa4PropertyId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 font-medium block mb-1">Google Ads Developer Token (Keyword Planner)</label>
          <input
            type="password"
            value={googleAdsDevToken}
            onChange={(e) => setGoogleAdsDevToken(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition"
        >
          {saved ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
          <span>{saved ? 'Credentials Saved!' : 'Save Integration Settings'}</span>
        </button>
      </div>
    </div>
  );
};
