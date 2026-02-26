import React, { useEffect, useState, useRef } from 'react';
import { Opportunity, Language, Difficulty, AgentAsset, UserProfile } from '../types';
import { generateAutomationCode, createOpportunityChat } from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';
import { generateBusinessPlan } from '../utils/monetization';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface OpportunityModalProps {
  opportunity: Opportunity | null;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onAgentSaved: (agent: AgentAsset) => void;
  userProfile?: UserProfile | null;
}

const OpportunityModal: React.FC<OpportunityModalProps> = ({ 
  opportunity, 
  isOpen, 
  onClose, 
  language,
  onAgentSaved,
  userProfile
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState<1 | 2 | 3>(1);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  
  // Chat States
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsSaved(false);
      setMessages([]);
      setActivePhase(1); // Reset to Phase 1
      setCompletedTasks([]);
      // Initialize chat session
      if (opportunity) {
        chatRef.current = createOpportunityChat(opportunity, language, userProfile || undefined);
      }
    } else {
      document.body.style.overflow = 'unset';
      setTimeout(() => {
        setError(null);
        setIsGenerating(false);
      }, 300);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, opportunity, language]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen || !opportunity) return null;

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateAutomationCode(opportunity, language);
      
      const newAsset: AgentAsset = {
        ...result,
        assetId: `agent-${Date.now()}`,
        sourceOpportunityId: opportunity.id,
        sourceOpportunityTitle: opportunity.title,
        createdAt: new Date().toISOString(),
      };

      onAgentSaved(newAsset);
      setIsSaved(true);
      // Auto advance to Phase 3 after short delay
      setTimeout(() => setActivePhase(3), 1500);
    } catch (err) {
      setError(language === 'zh' ? '生成代码失败，请重试。' : 'Failed to generate code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPlan = () => {
    const content = generateBusinessPlan(opportunity, language);
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${opportunity.title.replace(/\s+/g, '_')}_Plan.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isSending) return;

    const userMsg = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsSending(true);

    try {
      const stream = await chatRef.current.sendMessageStream({ message: userMsg });
      let fullResponse = '';
      
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        fullResponse += c.text;
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = { role: 'model', text: fullResponse };
          return newMsgs;
        });
      }
    } catch (err) {
      console.error("Chat failed:", err);
      setMessages(prev => [...prev, { role: 'model', text: language === 'zh' ? "抱歉，出了一点问题，请稍后再试。" : "Sorry, something went wrong. Please try again." }]);
    } finally {
      setIsSending(false);
    }
  };

  const t = {
    close: language === 'zh' ? '关闭' : 'Close',
    revenue: language === 'zh' ? '预估月收入' : 'Est. Monthly Revenue',
    automation: language === 'zh' ? '自动化程度' : 'Automation Level',
    difficulty: language === 'zh' ? '执行难度' : 'Difficulty',
    region: language === 'zh' ? '趋势地区' : 'Trending Region',
    plan: language === 'zh' ? '详细行动计划' : 'Execution Plan',
    analysis: language === 'zh' ? 'AI 分析' : 'AI Analysis',
    tags: language === 'zh' ? '相关标签' : 'Tags',
    low: language === 'zh' ? '低' : 'Low',
    medium: language === 'zh' ? '中' : 'Medium',
    high: language === 'zh' ? '高' : 'High',
    generateBtn: language === 'zh' ? '🛠️ 生成自动化工具脚本' : '🛠️ Generate Automation Script',
    generating: language === 'zh' ? '正在编写脚本...' : 'Writing Script...',
    savedSuccess: language === 'zh' ? '✅ 脚本已生成！正在进入运营阶段...' : '✅ Script generated! Proceeding to Operation...',
    expertTitle: language === 'zh' ? '项目执行经理' : 'Implementation Manager',
    chatPlaceholder: language === 'zh' ? '询问关于此机会的更多细节...' : 'Ask more details about this...',
    chatInitial: language === 'zh' ? '我是您的项目执行经理。我可以协助您完成账号注册、解释技术细节，或根据您的需求调整自动化脚本。请问目前需要什么帮助？' : 'I am your Project Implementation Manager. I can assist with account registration, technical details, or script customization. How can I help you today?',
    evidence: language === 'zh' ? '市场验证证据' : 'Market Validation Evidence',
    firstStep: language === 'zh' ? '立即行动：第一步' : 'Actionable First Step',
    download: language === 'zh' ? '📥 下载商业计划书' : '📥 Download Business Plan',
    // New Translations
    phase1: language === 'zh' ? '阶段 1：准备工作' : 'PHASE 1: PREPARATION',
    phase1Title: language === 'zh' ? '准备工作' : 'PREPARATION',
    phase2: language === 'zh' ? '阶段 2：部署工具' : 'PHASE 2: DEPLOYMENT',
    phase2Title: language === 'zh' ? '部署工具' : 'DEPLOYMENT',
    phase3: language === 'zh' ? '阶段 3：运营执行' : 'PHASE 3: OPERATION',
    phase3Title: language === 'zh' ? '运营执行' : 'OPERATION',
    investment: language === 'zh' ? '所需投入' : 'REQUIRED INVESTMENT',
    time: language === 'zh' ? '时间投入' : 'Time Commitment',
    budget: language === 'zh' ? '预算' : 'Budget',
    accounts: language === 'zh' ? '准备清单' : 'Prerequisites Checklist',
    engineCore: language === 'zh' ? '商业引擎核心' : 'Business Engine Core',
    engineDesc: language === 'zh' ? '该脚本将自动化执行：' : 'This script will automate:',
    inputData: language === 'zh' ? '输入 (数据源)' : 'INPUT (DATA SOURCES)',
    outputData: language === 'zh' ? '输出 (交付物)' : 'OUTPUT (DELIVERABLE)',
    manualWorkflow: language === 'zh' ? '人工操作流程' : 'Manual Workflow',
    confirmPrep: language === 'zh' ? '✅ 确认资源已就绪，进入下一步' : '✅ Confirm Resources & Proceed',
    next: language === 'zh' ? '下一步' : 'Next',
    back: language === 'zh' ? '上一步' : 'Back',
    analysisNeeded: language === 'zh' ? '等待分析...' : 'Analysis needed...',
    step: language === 'zh' ? '步骤' : 'Step',
    na: language === 'zh' ? '暂无' : 'N/A',
    coreLogic: language === 'zh' ? '核心业务逻辑' : 'Core Business Logic',
    bundle: language === 'zh' ? '自动化套件' : 'Automation Bundle',
    guide: language === 'zh' ? '注册教程' : 'Guide',
    askAI: language === 'zh' ? '询问AI' : 'Ask AI',
    markDone: language === 'zh' ? '已完成' : 'Done',
    howTo: language === 'zh' ? '怎么做？' : 'How-to?',
    quickPrompts: language === 'zh' ? '快捷提问' : 'Quick Actions',
    promptRegister: language === 'zh' ? '怎么注册账号？' : 'How to register?',
    promptTech: language === 'zh' ? '解释技术原理' : 'Explain tech',
    promptCustomize: language === 'zh' ? '定制脚本' : 'Customize script',
  };

  const toggleTask = (task: string) => {
    setCompletedTasks(prev => 
      prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]
    );
  };

  const openGuide = (account: string) => {
    const query = language === 'zh' ? `${account} 注册教程` : `how to register for ${account}`;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
  };

  const askForHelp = (account: string) => {
    const question = language === 'zh' ? `请详细告诉我如何注册和设置 ${account} 账号？` : `How do I register and set up a ${account} account?`;
    setChatInput(question);
  };

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case Difficulty.LOW: return 'text-emerald-400 border-emerald-900 bg-emerald-950/30';
      case Difficulty.MEDIUM: return 'text-blue-400 border-blue-900 bg-blue-950/30';
      case Difficulty.HIGH: return 'text-amber-400 border-amber-900 bg-amber-950/30';
      default: return 'text-slate-400';
    }
  };

  const getDifficultyLabel = (diff: Difficulty) => {
    if (language !== 'zh') return diff;
    switch(diff) {
        case Difficulty.LOW: return t.low;
        case Difficulty.MEDIUM: return t.medium;
        case Difficulty.HIGH: return t.high;
        default: return diff;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl bg-[#0f172a] border border-sky-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full md:h-[90vh] animate-[fadeIn_0.2s_ease-out]">
        
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
               <span className={`text-[10px] md:text-xs font-bold px-2 py-1 rounded border ${getDifficultyColor(opportunity.difficulty)}`}>
                  {getDifficultyLabel(opportunity.difficulty)}
               </span>
               <span className="text-[10px] md:text-xs font-mono text-slate-500">ID: {opportunity.id}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">{opportunity.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Content Area - Split View */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-[#0b1121]">
          {/* Left Column: Mission Control Stepper */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-800">
          
            {/* Stats Header */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-slate-800/50 bg-slate-900/20 shrink-0">
                <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{t.revenue}</div>
                    <div className="text-lg md:text-xl font-bold text-emerald-400 font-mono tracking-tight">{opportunity.estimatedMonthlyRevenue}</div>
                </div>
                <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{t.automation}</div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-sky-400">{opportunity.automationScore}%</span>
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden max-w-[60px]">
                            <div className="h-full bg-sky-500 rounded-full" style={{ width: `${opportunity.automationScore}%` }}></div>
                        </div>
                    </div>
                </div>
                {/* Simplified stats for mobile/stepper view */}
            </div>

            {/* Stepper Navigation */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-slate-800/30 bg-slate-900/10">
                {[1, 2, 3].map(step => (
                    <div 
                        key={step}
                        className={`flex flex-col items-center gap-2 cursor-pointer transition-all ${activePhase === step ? 'opacity-100 scale-105' : 'opacity-40 hover:opacity-70'}`}
                        onClick={() => { if (step < activePhase || isSaved) setActivePhase(step as any); }}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${
                            activePhase === step ? 'border-sky-500 text-sky-500 bg-sky-900/20' : 
                            activePhase > step ? 'border-emerald-500 text-emerald-500 bg-emerald-900/20' : 'border-slate-700 text-slate-700'
                        }`}>
                            {activePhase > step ? '✓' : step}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${activePhase === step ? 'text-sky-400' : 'text-slate-500'}`}>
                            {step === 1 ? t.phase1Title : step === 2 ? t.phase2Title : t.phase3Title}
                        </span>
                    </div>
                ))}
                {/* Connecting Lines */}
                <div className="absolute left-0 right-0 top-[125px] h-0.5 bg-slate-800 -z-10 mx-12 hidden md:block" />
            </div>

            {/* Active Phase Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                
                {/* PHASE 1 */}
                {activePhase === 1 && (
                    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 bg-slate-800 text-slate-400 text-xs font-bold rounded uppercase">{t.phase1Title}</span>
                            <h3 className="text-xl font-bold text-white">{t.investment}</h3>
                        </div>
                        
                        <div className="bg-slate-900/40 rounded-xl p-6 border border-slate-800">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-xs font-bold text-amber-500 uppercase mb-4 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        {t.investment}
                                    </h4>
                                    <ul className="space-y-4 text-sm text-slate-400">
                                        <li className="flex justify-between border-b border-slate-800/50 pb-2">
                                            <span>{t.time}:</span>
                                            <span className="text-slate-200 font-mono font-bold">{opportunity.prerequisites?.timeCommitment || t.na}</span>
                                        </li>
                                        <li className="flex justify-between border-b border-slate-800/50 pb-2">
                                            <span>{t.budget}:</span>
                                            <span className="text-slate-200 font-mono font-bold">{opportunity.prerequisites?.budget || t.na}</span>
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-amber-500 uppercase mb-4 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        {t.accounts}
                                    </h4>
                                    <div className="space-y-3">
                                        {opportunity.prerequisites?.accountsNeeded?.map((acc, i) => {
                                            const isDone = completedTasks.includes(acc);
                                            return (
                                                <div key={i} className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${isDone ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-slate-900/40 border-slate-700'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            onClick={() => toggleTask(acc)}
                                                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-500 hover:border-sky-500'}`}
                                                        >
                                                            {isDone && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                                        </button>
                                                        <span className={`font-medium text-sm ${isDone ? 'text-emerald-400 line-through' : 'text-slate-200'}`}>{acc}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => openGuide(acc)}
                                                            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-sky-400 rounded border border-slate-700 flex items-center gap-1 transition-colors"
                                                            title={t.guide}
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                                            <span className="hidden sm:inline">{t.guide}</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => askForHelp(acc)}
                                                            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 rounded border border-slate-700 flex items-center gap-1 transition-colors"
                                                            title={t.askAI}
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                                                            <span className="hidden sm:inline">{t.askAI}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        }) || <span className="text-sm text-slate-500">{t.analysisNeeded}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setActivePhase(2)}
                            className="w-full py-4 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 font-bold rounded-xl transition-all border border-slate-700 hover:border-emerald-500 flex items-center justify-center gap-2 group"
                        >
                            {t.confirmPrep}
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                        </button>
                    </div>
                )}

                {/* PHASE 2 */}
                {activePhase === 2 && (
                    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 bg-sky-900/50 text-sky-400 text-xs font-bold rounded uppercase">{t.phase2Title}</span>
                            <h3 className="text-xl font-bold text-white">{t.engineCore}</h3>
                        </div>

                        <div className="bg-sky-900/10 rounded-xl p-6 border border-sky-500/30 relative overflow-hidden group">
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                <svg className="w-48 h-48 text-sky-500" fill="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
                            </div>

                            <div className="relative z-10 flex flex-col items-center text-center space-y-6 py-4">
                                <div>
                                    <h4 className="text-2xl font-bold text-white mb-2">{t.engineCore}</h4>
                                    <p className="text-sm text-sky-200/70 max-w-lg mx-auto">
                                        {t.engineDesc} <span className="text-sky-300 font-mono font-bold bg-sky-900/30 px-2 py-0.5 rounded">{opportunity.technicalImplementation?.scriptFunction || t.coreLogic}</span>
                                    </p>
                                    {error && <div className="text-red-400 text-sm font-bold bg-red-900/20 px-4 py-2 rounded border border-red-900/50">{error}</div>}
                                </div>

                                {isSaved ? (
                                    <div className="px-6 py-4 bg-green-900/30 text-green-400 border border-green-500/30 rounded-xl flex items-center gap-3 text-lg font-bold animate-[pulse_2s_infinite]">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        {t.savedSuccess}
                                    </div>
                                ) : (
                                    <button 
                                        onClick={handleGenerateCode}
                                        disabled={isGenerating}
                                        className={`px-8 py-4 rounded-xl font-bold text-base shadow-lg shadow-sky-500/20 flex items-center gap-3 transition-all transform hover:scale-105 ${
                                            isGenerating 
                                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                                            : 'bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:shadow-sky-500/40'
                                        }`}
                                    >
                                        {isGenerating ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                {t.generating}
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                                                {t.generateBtn}
                                            </>
                                        )}
                                    </button>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-6 pt-6 border-t border-sky-500/20 text-left">
                                    <div>
                                        <div className="text-[10px] text-sky-300/50 uppercase font-bold mb-2">{t.inputData}</div>
                                        <div className="flex flex-wrap gap-2">
                                            {opportunity.technicalImplementation?.dataSources.map((ds, i) => (
                                                <span key={i} className="px-2 py-1 bg-slate-900 rounded text-xs text-slate-300 font-mono border border-slate-700">{ds}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-sky-300/50 uppercase font-bold mb-2">{t.outputData}</div>
                                        <div className="text-xs text-white font-mono bg-slate-900 p-3 rounded border border-slate-700">
                                            {opportunity.title} {t.bundle}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PHASE 3 */}
                {activePhase === 3 && (
                    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                         <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 bg-emerald-900/50 text-emerald-400 text-xs font-bold rounded uppercase">{t.phase3Title}</span>
                            <h3 className="text-xl font-bold text-white">{t.manualWorkflow}</h3>
                        </div>

                        <div className="bg-slate-900/40 rounded-xl p-6 border border-slate-800">
                            <ul className="space-y-6">
                                {opportunity.actionPlan.map((step, idx) => (
                                    <li key={idx} className="flex gap-4 group">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-sm font-bold font-mono text-slate-400 mt-0.5 group-hover:border-emerald-500 group-hover:text-emerald-500 transition-colors">
                                            {idx + 1}
                                        </div>
                                        <div className="pt-1">
                                            <p className="text-slate-300 text-sm md:text-base leading-relaxed group-hover:text-white transition-colors">{step}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

            </div>
          </div>
        
          {/* Right Panel: Expert Chat (Consultation) */}         
          <div className="w-full md:w-[400px] lg:w-[450px] flex flex-col bg-slate-950/40 shrink-0 border-l border-slate-800">
            <div className="p-4 border-b border-slate-800/50 bg-slate-900/20 flex items-center gap-2">
                <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{t.expertTitle}</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-[300px] md:min-h-0">
                {/* Initial Bot Message */}
                <div className="flex justify-start">
                  <div className="max-w-[90%] bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-3 text-xs md:text-sm text-slate-300 shadow-sm">
                    {t.chatInitial}
                  </div>
                </div>
                
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] p-3 text-xs md:text-sm rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-sky-600 text-white rounded-tr-none' 
                        : 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-none shadow-md'
                    }`}>
                      {msg.text || (isSending && i === messages.length - 1 ? <span className="animate-pulse">...</span> : '')}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            
            {/* Chat Input Field */}
            <div className="p-4 bg-slate-900/40 border-t border-slate-800/80">
              {/* Quick Prompts */}
              <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {[
                      { label: t.promptRegister, q: language === 'zh' ? '请指导我如何注册这些必要的账号' : 'Guide me through registering these accounts' },
                      { label: t.promptTech, q: language === 'zh' ? '这个自动化脚本是如何工作的？' : 'How does this automation script work?' },
                      { label: t.promptCustomize, q: language === 'zh' ? '我想修改脚本的逻辑' : 'I want to customize the script logic' }
                  ].map((prompt, i) => (
                      <button 
                          key={i}
                          onClick={() => setChatInput(prompt.q)}
                          className="whitespace-nowrap px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-[10px] text-slate-400 transition-colors shrink-0"
                      >
                          {prompt.label}
                      </button>
                  ))}
              </div>

              <form onSubmit={handleSendMessage} className="relative flex gap-2">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={t.chatPlaceholder}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs md:text-sm focus:outline-none focus:border-sky-500 transition-colors placeholder:text-slate-600"
                  disabled={isSending}
                />
                <button 
                  type="submit"
                  disabled={isSending || !chatInput.trim()}
                  className={`p-2 rounded-xl transition-all ${isSending ? 'bg-slate-800 text-slate-500' : 'bg-sky-600 text-white hover:bg-sky-500 shadow-lg'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9-2-9-18-9 18 9 2zm0 0v-8"></path></svg>
                </button>
              </form>
            </div>
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="p-3 md:p-4 border-t border-slate-800 bg-slate-900/80 flex justify-between shrink-0">
            <button 
                onClick={handleDownloadPlan}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
                {t.download}
            </button>
            <button onClick={onClose} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-xs font-bold border border-slate-700">{t.close}</button>
        </div>
      </div>
    </div>
  );
};

export default OpportunityModal;
