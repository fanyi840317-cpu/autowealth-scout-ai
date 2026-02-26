import React, { useState } from 'react';
import { UserProfile, Language } from '../types';

interface OnboardingFlowProps {
  onComplete: (profile: UserProfile) => void;
  onDismiss?: () => void;
  language: Language;
}

const STEPS = [
  { id: 'time', title: { en: 'Availability', zh: '可用时间' } },
  { id: 'skills', title: { en: 'Skills', zh: '技能背景' } },
  { id: 'budget', title: { en: 'Budget', zh: '启动预算' } },
  { id: 'interests', title: { en: 'Interests', zh: '兴趣领域' } },
];

const OPTIONS = {
  time: [
    { id: 'full_time', label: { en: 'Full Time (40h+)', zh: '全职投入 (40h+)' } },
    { id: 'part_time', label: { en: 'Part Time (10-20h)', zh: '兼职/每天2小时' } },
    { id: 'weekends', label: { en: 'Weekends Only', zh: '仅周末' } },
  ],
  skills: [
    { id: 'coding', label: { en: 'Coding / Dev', zh: '编程开发' } },
    { id: 'design', label: { en: 'Design / UI', zh: '设计/美工' } },
    { id: 'writing', label: { en: 'Writing / Content', zh: '写作/文案' } },
    { id: 'marketing', label: { en: 'Marketing / Sales', zh: '营销/销售' } },
    { id: 'video', label: { en: 'Video / Editing', zh: '视频/剪辑' } },
    { id: 'none', label: { en: 'No Special Skills', zh: '无特殊技能' } },
  ],
  budget: [
    { id: 'zero', label: { en: '$0 (Bootstrap)', zh: '¥0 (零成本启动)' } },
    { id: 'low', label: { en: '< $1000', zh: '¥5000 以内' } },
    { id: 'high', label: { en: '$1000+', zh: '¥5000 以上' } },
  ],
  interests: [
    { id: 'ecommerce', label: { en: 'E-commerce', zh: '电商/带货' } },
    { id: 'saas', label: { en: 'SaaS / Software', zh: '软件/工具' } },
    { id: 'content', label: { en: 'Content Creation', zh: '内容创作' } },
    { id: 'service', label: { en: 'Freelance Service', zh: '技能服务/接单' } },
    { id: 'crypto', label: { en: 'Web3 / Crypto', zh: 'Web3 / 加密货币' } },
    { id: 'open', label: { en: 'Open to Anything', zh: '不限，只要赚钱' } },
  ]
};

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onDismiss, language }) => {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    skills: [],
    interests: []
  });

  const handleSelect = (value: string) => {
    const currentStepId = STEPS[step].id;
    
    if (currentStepId === 'skills' || currentStepId === 'interests') {
      // Multi-select
      const list = (profile as any)[currentStepId] || [];
      const newList = list.includes(value) 
        ? list.filter((v: string) => v !== value)
        : [...list, value];
      
      // If 'none' or 'open' is selected, clear others or exclusive logic if needed
      // For simplicity, just toggle
      setProfile(prev => ({ ...prev, [currentStepId]: newList }));
    } else {
      // Single select
      setProfile(prev => ({ ...prev, [currentStepId]: value }));
      if (step < STEPS.length - 1) {
        setTimeout(() => setStep(s => s + 1), 200);
      }
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      onComplete(profile as UserProfile);
    }
  };

  const t = {
    next: language === 'zh' ? '下一步' : 'Next',
    finish: language === 'zh' ? '开始挖掘' : 'Start Scouting',
    welcome: language === 'zh' ? '欢迎来到 AutoWealth' : 'Welcome to AutoWealth',
    subtitle: language === 'zh' ? '让我们为您定制赚钱机会' : 'Let\'s personalize your opportunities',
    select: language === 'zh' ? '请选择（可多选）' : 'Select all that apply'
  };

  const currentOptions = OPTIONS[STEPS[step].id as keyof typeof OPTIONS];
  const currentSelection = (profile as any)[STEPS[step].id];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-sky-500/30 rounded-2xl p-8 shadow-2xl shadow-sky-500/20 relative overflow-hidden">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
          <div 
            className="h-full bg-sky-500 transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        
        {/* Dismiss Button */}
        {onDismiss && (
            <button 
                onClick={onDismiss}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                title={language === 'zh' ? '关闭调查' : 'Close Survey'}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        )}

        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">{t.welcome}</h2>
            <p className="text-slate-400 text-sm">{t.subtitle}</p>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-bold text-sky-400 mb-6 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-500/20 text-xs border border-sky-500/50">
                {step + 1}
            </span>
            {STEPS[step].title[language]}
          </h3>
          
          <div className="grid grid-cols-1 gap-3">
            {currentOptions.map((opt) => {
              const isSelected = Array.isArray(currentSelection) 
                ? currentSelection.includes(opt.id)
                : currentSelection === opt.id;

              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 flex items-center justify-between group
                    ${isSelected 
                      ? 'bg-sky-500/20 border-sky-500 text-white shadow-[0_0_15px_rgba(56,189,248,0.3)]' 
                      : 'bg-slate-800/50 border-white/5 text-slate-400 hover:bg-white/5 hover:border-white/10'
                    }`}
                >
                  <span className="font-medium">{opt.label[language]}</span>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
            <div className="flex gap-1">
                {STEPS.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-sky-500' : i < step ? 'bg-sky-900' : 'bg-slate-800'}`} />
                ))}
            </div>
          <button
            onClick={handleNext}
            disabled={!currentSelection || (Array.isArray(currentSelection) && currentSelection.length === 0)}
            className="px-8 py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-sky-500/20"
          >
            {step === STEPS.length - 1 ? t.finish : t.next}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
