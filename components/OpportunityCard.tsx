import React from 'react';
import { Opportunity, Difficulty, Language } from '../types';

interface OpportunityCardProps {
  opportunity: Opportunity;
  index: number;
  language: Language;
  onClick: () => void;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, index, language, onClick }) => {
  const getDifficultyStyles = (diff: Difficulty) => {
    switch (diff) {
      case Difficulty.LOW: return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
      case Difficulty.MEDIUM: return 'text-sky-400 border-sky-500/20 bg-sky-500/5';
      case Difficulty.HIGH: return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
      default: return 'text-slate-400 border-white/10 bg-white/5';
    }
  };

  const getDifficultyLabel = (diff: Difficulty) => {
    if (language !== 'zh') return diff.toUpperCase();
    switch(diff) {
        case Difficulty.LOW: return '低门槛';
        case Difficulty.MEDIUM: return '中等难度';
        case Difficulty.HIGH: return '高门槛';
        default: return diff;
    }
  };

  const t = {
    revenue: language === 'zh' ? '预估营收' : 'REVENUE',
    automation: language === 'zh' ? '自动化率' : 'AUTO_INDEX',
    action: language === 'zh' ? '深度详情' : 'DETAILS'
  };

  return (
    <div 
      onClick={onClick}
      className="glass-panel group p-5 border-white/5 hover:border-sky-500/40 hover:bg-sky-500/5 cursor-pointer transition-all relative overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-500"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Decorative Index */}
      <div className="absolute -top-2 -right-2 text-[60px] font-black text-white/[0.02] pointer-events-none group-hover:text-sky-500/[0.03] transition-colors font-mono">
        {String(index + 1).padStart(2, '0')}
      </div>

      <div className="flex justify-between items-start mb-4">
        <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${getDifficultyStyles(opportunity.difficulty)}`}>
            {getDifficultyLabel(opportunity.difficulty)}
        </span>
        <div className="flex gap-1">
          <div className="w-1 h-3 bg-sky-500/30 rounded-full"></div>
          <div className="w-1 h-3 bg-sky-500/50 rounded-full"></div>
          <div className="w-1 h-3 bg-sky-500 rounded-full"></div>
        </div>
      </div>

      <h3 className="text-base font-bold text-white mb-2 leading-tight group-hover:text-sky-400 transition-colors line-clamp-2">
        {opportunity.title}
      </h3>
      
      <p className="text-[11px] text-slate-500 leading-relaxed mb-6 line-clamp-3">
        {opportunity.description}
      </p>

      <div className="mt-auto space-y-4">
        <div className="flex items-end justify-between border-t border-white/5 pt-4">
          <div>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{t.revenue}</p>
            <p className="text-sm font-mono text-emerald-400 font-black">{opportunity.estimatedMonthlyRevenue}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{t.automation}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-sky-400 font-bold">{opportunity.automationScore}%</span>
              <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.5)]" style={{ width: `${opportunity.automationScore}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <button className="w-full py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:bg-sky-500 group-hover:text-white group-hover:border-sky-400 transition-all flex items-center justify-center gap-2">
          {t.action}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </button>
      </div>
    </div>
  );
};

export default OpportunityCard;