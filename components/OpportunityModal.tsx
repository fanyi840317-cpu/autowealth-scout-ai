import React, { useEffect, useState, useRef } from 'react';
import { Opportunity, Language, Difficulty, AutomationResult, AgentAsset } from '../types';
import { generateAutomationCode, createOpportunityChat } from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';

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
}

const OpportunityModal: React.FC<OpportunityModalProps> = ({ 
  opportunity, 
  isOpen, 
  onClose, 
  language,
  onAgentSaved
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
      // Initialize chat session
      if (opportunity) {
        chatRef.current = createOpportunityChat(opportunity, language);
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
    } catch (err) {
      setError(language === 'zh' ? '生成代码失败，请重试。' : 'Failed to generate code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
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
    generateBtn: language === 'zh' ? '⚡ 生成自动化 Agent' : '⚡ Generate Automation Agent',
    generating: language === 'zh' ? '正在编写代码...' : 'Writing Code...',
    savedSuccess: language === 'zh' ? '✅ Agent 已成功部署到资产库！' : '✅ Agent successfully deployed to Vault!',
    expertTitle: language === 'zh' ? '专家咨询：深度对话' : 'Expert Consultation: Deep Dive',
    chatPlaceholder: language === 'zh' ? '询问关于此机会的更多细节...' : 'Ask more details about this...',
    chatInitial: language === 'zh' ? '你好！我是你的商业顾问。有什么关于这个机会的问题我可以帮你解答吗？' : 'Hi! I am your business consultant. Do you have any questions about this opportunity I can help answer?',
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

        {/* Content Area - Scrollable Container */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Panel: Opportunity Details */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-8 border-r border-slate-800/50">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{t.revenue}</p>
                  <p className="text-lg font-mono text-emerald-400 font-bold">{opportunity.estimatedMonthlyRevenue}</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{t.automation}</p>
                  <div className="flex items-center gap-2">
                      <span className="text-lg font-mono text-sky-400 font-bold">{opportunity.automationScore}%</span>
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full"><div className="h-full bg-sky-500 rounded-full" style={{ width: `${opportunity.automationScore}%` }}></div></div>
                  </div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{t.region}</p>
                  <p className="text-base text-slate-200 truncate">{opportunity.trendingRegion || 'Global'}</p>
              </div>
            </div>

            {/* Analysis & Plan */}
            <div className="space-y-6">
                <div>
                    <h3 className="text-xs font-bold text-sky-500 uppercase mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {t.analysis}
                    </h3>
                    <p className="text-slate-300 leading-relaxed text-sm md:text-base">{opportunity.description}</p>
                </div>

                <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-800/50">
                    <h3 className="text-xs font-bold text-sky-500 uppercase mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                        {t.plan}
                    </h3>
                    <ul className="space-y-4">
                        {opportunity.actionPlan.map((step, idx) => (
                            <li key={idx} className="flex gap-3 text-sm">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 border border-sky-500/30 flex items-center justify-center text-[10px] font-mono text-sky-400">{idx + 1}</div>
                                <p className="text-slate-300 pt-0.5">{step}</p>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">{t.tags}</h3>
                    <div className="flex flex-wrap gap-2">
                        {opportunity.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-slate-800 text-slate-300 rounded-full text-[10px] border border-slate-700">#{tag}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Agent Generation Button Section */}
            <div className="pt-6">
                {!isSaved && !isGenerating && (
                     <button onClick={handleGenerateCode} className="w-full py-4 bg-gradient-to-r from-sky-900/50 to-blue-900/50 border border-sky-500/30 rounded-xl hover:border-sky-400 hover:from-sky-800/50 hover:to-blue-800/50 transition-all group flex items-center justify-center gap-3">
                        <span className="p-2 rounded-full bg-sky-500 text-white group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        </span>
                        <span className="text-sm md:text-base font-bold text-sky-100">{t.generateBtn}</span>
                     </button>
                )}

                {isGenerating && (
                    <div className="w-full py-8 flex flex-col items-center justify-center bg-slate-900/30 rounded-xl border border-slate-800 border-dashed animate-pulse">
                        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                        <p className="text-sky-400 text-xs">{t.generating}</p>
                    </div>
                )}

                {isSaved && (
                    <div className="p-6 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex flex-col items-center text-center animate-[fadeIn_0.5s_ease-out]">
                        <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-4">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">{t.savedSuccess}</h4>
                        <p className="text-slate-400 text-[10px] mb-4">Gemini has completed the architecture of your automation program.</p>
                    </div>
                )}
                
                {error && <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-center text-sm">{error}</div>}
            </div>
          </div>

          {/* Right Panel: Expert Chat (Consultation) */}
          <div className="w-full md:w-[400px] lg:w-[450px] flex flex-col bg-slate-950/40 shrink-0">
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
        <div className="p-3 md:p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end shrink-0">
            <button onClick={onClose} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-xs font-bold border border-slate-700">{t.close}</button>
        </div>
      </div>
    </div>
  );
};

export default OpportunityModal;