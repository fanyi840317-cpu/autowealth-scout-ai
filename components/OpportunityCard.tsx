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
    action: language === 'zh' ? '深度详情' : 'DETAILS',
    firstStep: language === 'zh' ? '第一步行动' : 'FIRST STEP',
    validated: language === 'zh' ? '已验证' : 'VALIDATED'
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
        <div className="flex gap-2">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${getDifficultyStyles(opportunity.difficulty)}`}>
                {getDifficultyLabel(opportunity.difficulty)}
            </span>
            {opportunity.validationEvidence?.length > 0 && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded border uppercase text-emerald-400 border-emerald-500/20 bg-emerald-500/5 flex items-center gap-1">
                    <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    {t.validated}
                </span>
            )}
        </div>
        <div className="flex gap-1">
          <div className="w-1 h-3 bg-sky-500/30 rounded-full"></div>
          <div className="w-1 h-3 bg-sky-500/50 rounded-full"></div>
          <div className="w-1 h-3 bg-sky-500 rounded-full"></div>
        </div>
      </div>

      <h3 className="text-base font-bold text-white mb-2 leading-tight group-hover:text-sky-400 transition-colors line-clamp-2">
        {opportunity.title}
      </h3>
      
      <p className="text-[11px] text-slate-500 leading-relaxed mb-4 line-clamp-2">
        {opportunity.description}
      </p>

      {/* Validation Evidence Snippets */}
      <div className="space-y-2 mb-4">
        {opportunity.validationEvidence?.slice(0, 2).map((ev, i) => (
            <div key={i} className="flex items-start gap-2 text-[10px] text-slate-400 bg-white/5 p-1.5 rounded border border-white/5">
                <span className="text-sky-500 mt-0.5">
                    {ev.type === 'search_trend' ? '📈' : ev.type === 'competitor_count' ? '🏢' : '💡'}
                </span>
                <span className="line-clamp-2">{ev.content}</span>
            </div>
        ))}
      </div>

      <div className="mt-auto space-y-4">
        {opportunity.firstStep && (
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded p-2">
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">{t.firstStep}</p>
                <p className="text-xs text-emerald-100 line-clamp-2">{opportunity.firstStep}</p>
            </div>
        )}

        <div className="flex items-end justify-between border-t border-white/5 pt-4">
          <div>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{t.revenue}</p>
            <p className="text-sm font-mono text-slate-300 font-bold">{opportunity.estimatedMonthlyRevenue}</p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation(); // Prevent double triggering since the card also has onClick
              onClick();
            }}
            className="py-2 px-4 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-sky-500 hover:text-white hover:border-sky-400 transition-all flex items-center justify-center gap-2"
          >
            {t.action}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OpportunityCard;