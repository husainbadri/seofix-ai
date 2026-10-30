import React, { useState } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';

export const AIAssistantView: React.FC<{ auditReport?: any }> = ({ auditReport }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: `Hello! I am your **AI SEO Platform Assistant**. I have analyzed your site audit data for **${auditReport?.targetDomain || 'acme-saas.com'}**. How can I help you boost your search rankings today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    'Why is my SEO score low?',
    'How do I fix duplicate titles?',
    'Generate schema for this page.',
    'Generate a 3-month SEO roadmap.'
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const newMsgs = [...messages, { role: 'user' as const, content: textToSend }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend, auditContext: auditReport })
      });
      const data = await res.json();
      setMessages([...newMsgs, { role: 'assistant', content: data.response || 'Actionable resolution generated.' }]);
    } catch {
      setMessages([...newMsgs, { role: 'assistant', content: 'Here is your strategic SEO fix recommendation: Focus on resolving top critical issues.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 flex flex-col h-[75vh]">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-800 flex items-center space-x-3 bg-slate-900/60 rounded-t-2xl">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">AI SEO Assistant</h3>
          <p className="text-[11px] text-slate-400">Contextual Audit Engine & Strategic Planning</p>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex items-start space-x-3 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-400'}`}>
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`p-4 rounded-2xl text-xs leading-relaxed max-w-xl ${m.role === 'user' ? 'bg-indigo-600 text-white font-medium' : 'bg-slate-900 border border-slate-800 text-slate-200 whitespace-pre-wrap'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center space-x-2 text-xs text-indigo-400">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>AI generating strategic answer...</span>
          </div>
        )}
      </div>

      {/* Quick Prompt Chips */}
      <div className="px-6 py-2 border-t border-slate-800/60 flex items-center space-x-2 overflow-x-auto">
        {quickPrompts.map((qp) => (
          <button key={qp} onClick={() => handleSend(qp)} className="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-medium whitespace-nowrap transition">
            {qp}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 rounded-b-2xl flex items-center space-x-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask AI Assistant anything about your site SEO..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button onClick={() => handleSend()} className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
