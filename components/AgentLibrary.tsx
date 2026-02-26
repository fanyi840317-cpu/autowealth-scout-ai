import React from 'react';
import { AgentAsset, Language } from '../types';

interface AgentLibraryProps {
  agents: AgentAsset[];
  language: Language;
  onLaunch: (agent: AgentAsset) => void;
  onDelete: (id: string) => void;
}

const AgentLibrary: React.FC<AgentLibraryProps> = ({ agents, language, onLaunch, onDelete }) => {
  const t = {
    title: language === 'zh' ? '我的自动化资产库' : 'My Automation Vault',
    empty: language === 'zh' ? '暂无保存的 Agent。从机会详情页生成第一个！' : 'No agents saved yet. Generate your first one from an opportunity!',
    source: language === 'zh' ? '来源机会' : 'Source Opportunity',
    launch: language === 'zh' ? '启动沙箱' : 'Launch Sandbox',
    delete: language === 'zh' ? '删除' : 'Delete',
    created: language === 'zh' ? '创建于' : 'Created',
    business: language === 'zh' ? '商业蓝图' : 'Business Blueprint',
  };

  if (agents.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
        <div className="w-20 h-20 rounded-2xl border-2 border-slate-800 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
        </div>
        <p className="text-slate-400 max-w-xs">{t.empty}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
        <svg className="w-7 h-7 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path></svg>
        {t.title}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div key={agent.assetId} className="glass-panel p-5 rounded-xl border border-slate-800 hover:border-sky-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-mono bg-sky-950/50 text-sky-400 px-2 py-0.5 rounded border border-sky-900 uppercase">
                {agent.language}
              </span>
              <button 
                onClick={() => onDelete(agent.assetId)}
                className="text-slate-600 hover:text-red-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>

            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-sky-400 transition-colors truncate">
              {agent.sourceOpportunityTitle}
            </h3>
            <p className="text-[10px] text-slate-500 mb-4 uppercase tracking-wider">
              {t.created}: {new Date(agent.createdAt).toLocaleDateString()}
            </p>

            <div className="bg-slate-900/50 rounded-lg p-3 mb-4 border border-slate-800 space-y-2">
               <div>
                 <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-tighter">{t.source}</p>
                 <p className="text-xs text-slate-300 line-clamp-1">{agent.sourceOpportunityTitle}</p>
               </div>
               
               {(agent.monetizationStrategy || agent.targetUser) && (
                 <div className="pt-2 border-t border-slate-800/50">
                    <p className="text-[10px] text-sky-500 font-bold mb-1 uppercase tracking-tighter">{t.business}</p>
                    {agent.monetizationStrategy && (
                        <div className="flex items-start gap-2 mb-1">
                            <span className="text-[10px] text-green-500 font-bold shrink-0 mt-0.5">$</span>
                            <p className="text-xs text-slate-400 line-clamp-1" title={agent.monetizationStrategy}>{agent.monetizationStrategy}</p>
                        </div>
                     )}
                     {agent.targetUser && (
                        <div className="flex items-start gap-2">
                            <span className="text-[10px] text-indigo-500 font-bold shrink-0 mt-0.5">@</span>
                            <p className="text-xs text-slate-400 line-clamp-1" title={agent.targetUser}>{agent.targetUser}</p>
                        </div>
                     )}
                 </div>
               )}
            </div>

            <button 
              onClick={() => onLaunch(agent)}
              className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path></svg>
              {t.launch}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentLibrary;