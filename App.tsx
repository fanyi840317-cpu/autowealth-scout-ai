import React, { useState, useCallback, useEffect } from 'react';
import { fetchTopSectors, fetchSubNiches, scanForOpportunities, verifyIdea } from './services/geminiService';
import { ScanResult, LogEntry, Language, Opportunity, DiscoveryNode, AgentAsset, FilterOption, VerificationResult } from './types';
import OpportunityCard from './components/OpportunityCard';
import Terminal from './components/Terminal';
import OpportunityModal from './components/OpportunityModal';
import SandboxView from './components/SandboxView';
import AgentLibrary from './components/AgentLibrary';

const TRANSLATIONS = {
  en: {
    brand: "AutoWealth",
    statusLive: "LIVE SCANNER",
    globalMetrics: "GLOBAL OPPORTUNITY INDEX",
    searchPlaceholder: "Identify a specific niche (e.g., 'Shopify Automation' or 'YouTube Faceless')...",
    discoveryTitle: "Market Discovery Hub",
    discoverySubtitle: "Real-time AI scanning of global blue ocean markets",
    navDiscover: "Market Intel",
    navVault: "Agent Vault",
    btnSearch: "Search",
    btnRefresh: "Rescan View",
    btnBack: "Previous Level",
    btnLoadMore: "Discover More Nodes",
    summaryTitle: "Macro Analysis",
    scanningActive: "AI AGENT ACTIVE: NAVIGATING WEB NODES...",
    errorTitle: "System Interruption",
    errorRetry: "Re-establish Connection",
    filtersLabel: "SCAN PARAMETERS:",
  },
  zh: {
    brand: "AutoWealth",
    statusLive: "实时扫描中",
    globalMetrics: "全球机会指数",
    searchPlaceholder: "识别特定领域 (例如: 'Shopify自动化' 或 'YouTube 无脸频道')...",
    discoveryTitle: "市场发现中心",
    discoverySubtitle: "AI 实时扫描全球蓝海市场与自动化契机",
    navDiscover: "情报情报",
    navVault: "资产库",
    btnSearch: "搜索",
    btnRefresh: "换一批",
    btnBack: "返回上一级",
    btnLoadMore: "加载更多发现",
    summaryTitle: "宏观分析",
    scanningActive: "AI 代理活跃中：正在导航互联网节点...",
    errorTitle: "系统中断",
    errorRetry: "重新建立连接",
    filtersLabel: "扫描参数配置:",
  }
};

const FILTERS: FilterOption[] = [
  { id: 'solo', label: { en: 'Solo / Individual', zh: '个人/独立开发者' }, category: 'team' },
  { id: 'team', label: { en: 'Team / Studio', zh: '团队/工作室' }, category: 'team' },
  { id: 'low_cost', label: { en: 'Low Cost / Bootstrap', zh: '低成本/零启动' }, category: 'budget' },
  { id: 'investment', label: { en: 'Capital Ready', zh: '资金充裕' }, category: 'budget' },
  { id: 'no_code', label: { en: 'No-Code / Low-Tech', zh: '无代码/低技术' }, category: 'skill' },
  { id: 'dev', label: { en: 'Developer / Pro', zh: '程序员/专业技术' }, category: 'skill' },
  { id: 'side_hustle', label: { en: 'Side Hustle', zh: '副业/兼职' }, category: 'time' },
];

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'scout' | 'library'>('scout');
  const [mode, setMode] = useState<'discovery' | 'verify'>('discovery');
  const [language, setLanguage] = useState<Language>('zh');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const [searchInput, setSearchInput] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>(['solo', 'low_cost']); 
  const [discoveryPath, setDiscoveryPath] = useState<DiscoveryNode[]>([]);
  const [nodes, setNodes] = useState<DiscoveryNode[]>([]);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [sandboxData, setSandboxData] = useState<AgentAsset | null>(null);
  const [savedAgents, setSavedAgents] = useState<AgentAsset[]>(() => {
    const saved = localStorage.getItem('auto_wealth_agents');
    return saved ? JSON.parse(saved) : [];
  });

  const t = TRANSLATIONS[language];

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev.slice(-49), { timestamp: new Date().toLocaleTimeString(), message, type }]);
  }, []);

  const getFilterLabels = useCallback(() => {
    return activeFilters.map(id => FILTERS.find(f => f.id === id)?.label[language] || id);
  }, [activeFilters, language]);

  const loadInitialSectors = useCallback(async (isRefresh = false) => {
    setHasError(false);
    setIsScanning(true);
    try {
      addLog(isRefresh ? "Refreshing sectors..." : "Initializing global scanner...", 'info');
      const sectors = await fetchTopSectors(language, isRefresh ? Math.floor(Math.random() * 1000) : undefined, getFilterLabels());
      setNodes(sectors);
    } catch (e: any) {
      setHasError(true);
      addLog(e.message, 'error');
    } finally {
      setIsScanning(false);
    }
  }, [language, addLog, getFilterLabels]);

  useEffect(() => { loadInitialSectors(); }, [loadInitialSectors]);

  useEffect(() => {
    localStorage.setItem('auto_wealth_agents', JSON.stringify(savedAgents));
  }, [savedAgents]);

  const handleLoadMore = async () => {
    if (isScanning || isLoadingMore) return;
    setIsLoadingMore(true);
    addLog("Expanding discovery horizon: Searching for additional nodes...", 'warning');
    
    try {
      const filters = getFilterLabels();
      const seed = Math.floor(Math.random() * 9999);
      
      if (result) {
        // Load more opportunities
        const currentTitles = result.opportunities.map(o => o.title);
        const last = discoveryPath[discoveryPath.length - 1];
        const moreResult = await scanForOpportunities(last.label, language, seed, filters, currentTitles);
        setResult(prev => prev ? {
          ...prev,
          opportunities: [...prev.opportunities, ...moreResult.opportunities],
          sources: [...prev.sources, ...moreResult.sources].filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i)
        } : moreResult);
      } else if (discoveryPath.length > 0) {
        // Load more niches
        const currentLabels = nodes.map(n => n.label);
        const last = discoveryPath[discoveryPath.length - 1];
        const moreNiches = await fetchSubNiches(last.label, language, seed, filters, currentLabels);
        setNodes(prev => [...prev, ...moreNiches]);
      } else {
        // Load more top sectors
        const currentLabels = nodes.map(n => n.label);
        const moreSectors = await fetchTopSectors(language, seed, filters, currentLabels);
        setNodes(prev => [...prev, ...moreSectors]);
      }
      addLog("New unique opportunities added to the stream.", 'success');
    } catch (e: any) {
      addLog(`Expansion failed: ${e.message}`, 'error');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleManualSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchInput.trim() || isScanning) return;
    setHasError(false);
    setIsScanning(true);
    setResult(null);
    setVerificationResult(null);

    if (mode === 'verify') {
      try {
        addLog(`Verifying idea: ${searchInput}...`, 'info');
        const res = await verifyIdea(searchInput, language);
        setVerificationResult(res);
        addLog("Verification complete.", 'success');
      } catch (e: any) {
        setHasError(true);
        addLog(`Verification failed: ${e.message}`, 'error');
      } finally {
        setIsScanning(false);
      }
      return;
    }

    setDiscoveryPath([{ id: `manual-${Date.now()}`, label: searchInput, description: 'User Search', type: 'niche' }]);
    try {
      const finalResult = await scanForOpportunities(searchInput, language, undefined, getFilterLabels());
      setResult(finalResult);
    } catch (e) { setHasError(true); } 
    finally { setIsScanning(false); }
  };

  const handleNodeClick = async (node: DiscoveryNode) => {
    setHasError(false);
    setIsScanning(true);
    setResult(null);
    setDiscoveryPath(prev => [...prev, node]);
    try {
      if (node.type === 'sector') {
        const niches = await fetchSubNiches(node.label, language, undefined, getFilterLabels());
        setNodes(niches);
      } else {
        const finalResult = await scanForOpportunities(node.label, language, undefined, getFilterLabels());
        setResult(finalResult);
      }
    } catch (e) { 
      setHasError(true); 
      setDiscoveryPath(prev => prev.slice(0, -1));
    } finally { setIsScanning(false); }
  };

  const handleBack = async () => {
    if (isScanning) return;
    const newPath = discoveryPath.slice(0, -1);
    setDiscoveryPath(newPath);
    setResult(null);
    setHasError(false);
    setIsScanning(true);
    try {
      if (newPath.length === 0) {
        setNodes(await fetchTopSectors(language, undefined, getFilterLabels()));
      } else {
        const lastNode = newPath[newPath.length - 1];
        setNodes(await fetchSubNiches(lastNode.label, language, undefined, getFilterLabels()));
      }
    } catch (e) { setHasError(true); }
    finally { setIsScanning(false); }
  };

  const handleRefresh = async () => {
    setHasError(false);
    setIsScanning(true);
    const seed = Math.floor(Math.random() * 1000);
    try {
      if (result) {
        setResult(await scanForOpportunities(discoveryPath[discoveryPath.length - 1].label, language, seed, getFilterLabels()));
      } else if (discoveryPath.length > 0) {
        setNodes(await fetchSubNiches(discoveryPath[discoveryPath.length - 1].label, language, seed, getFilterLabels()));
      } else {
        setNodes(await fetchTopSectors(language, seed, getFilterLabels()));
      }
    } catch (e) { setHasError(true); }
    finally { setIsScanning(false); }
  };

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-200 flex flex-col overflow-hidden font-sans">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#0f172a,black)] pointer-events-none z-0"></div>
      
      <header className="h-16 shrink-0 border-b border-white/5 flex items-center justify-between px-6 z-40 bg-slate-950/50 backdrop-blur-xl">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.4)]">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <span className="text-xl font-black tracking-tighter text-white uppercase">{t.brand}</span>
          </div>
          <nav className="hidden md:flex items-center gap-1 p-1 bg-white/5 rounded-full border border-white/10">
            <button onClick={() => setActiveView('scout')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeView === 'scout' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{t.navDiscover}</button>
            <button onClick={() => setActiveView('library')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeView === 'library' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{t.navVault}</button>
          </nav>
        </div>
        <button onClick={() => setLanguage(l => l === 'en' ? 'zh' : 'en')} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-[10px] font-bold hover:bg-white/10 transition-colors uppercase">{language}</button>
      </header>

      <div className="flex-1 flex overflow-hidden z-10">
        <main className="flex-1 flex flex-col min-w-0">
          <div className="px-6 py-4 space-y-4 border-b border-white/5 bg-slate-900/20">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-center max-w-5xl mx-auto w-full">
              <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 shrink-0">
                 <button onClick={() => { setMode('discovery'); setVerificationResult(null); setResult(null); }} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${mode === 'discovery' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500 hover:text-slate-300'}`}>Discover</button>
                 <button onClick={() => { setMode('verify'); setVerificationResult(null); setResult(null); }} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${mode === 'verify' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500 hover:text-slate-300'}`}>Verify</button>
              </div>
              <form onSubmit={handleManualSearch} className="w-full md:flex-1 relative group">
                <input 
                  type="text" 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={mode === 'verify' ? (language === 'zh' ? "输入你的商业想法 (例如: 小红书代运营)..." : "Enter your business idea...") : t.searchPlaceholder}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-12 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all placeholder:text-slate-600"
                />
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg className={`w-4 h-4 ${isScanning ? 'text-sky-500 animate-spin' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2"/></svg>
                </div>
              </form>
              <div className="flex gap-2 shrink-0 w-full md:w-auto">
                <button onClick={handleRefresh} disabled={isScanning} className="h-12 flex-1 md:flex-none px-6 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-xs font-bold hover:bg-white/10 transition-all uppercase whitespace-nowrap">
                  {t.btnRefresh}
                </button>
                {discoveryPath.length > 0 && (
                  <button onClick={handleBack} disabled={isScanning} className="h-12 flex-1 md:flex-none px-6 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-xs font-bold hover:bg-white/10 transition-all uppercase whitespace-nowrap">
                    {t.btnBack}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar justify-center">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mr-2">{t.filtersLabel}</span>
              {FILTERS.map(f => (
                <button key={f.id} onClick={() => setActiveFilters(prev => prev.includes(f.id) ? prev.filter(x => x !== f.id) : [...prev, f.id])} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${activeFilters.includes(f.id) ? 'bg-sky-500 text-white border-sky-400' : 'bg-white/5 text-slate-500 border-white/10'}`}>
                  {f.label[language]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-12 no-scrollbar scroll-smooth">
            {activeView === 'scout' ? (
              <>
                {mode === 'verify' && verificationResult ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-8 pb-12">
                        <div className="p-8 bg-slate-900/50 border border-purple-500/30 rounded-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-32 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            
                            <h2 className="text-3xl font-black text-white mb-8 uppercase tracking-tight relative z-10">Verification Report: <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{searchInput}</span></h2>
                            
                            <div className="flex flex-col md:flex-row gap-8 items-center mb-10 relative z-10">
                                <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" className="text-slate-800" fill="none" />
                                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" className="text-purple-500" fill="none" strokeDasharray={`${verificationResult.score * 3.51} 351`} strokeLinecap="round" />
                                    </svg>
                                    <div className="text-center">
                                        <span className="text-3xl font-black text-white block">{verificationResult.score}</span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Score</span>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <p className="text-xs text-purple-400 uppercase font-black tracking-widest">Final Verdict</p>
                                    <p className="text-xl font-medium text-slate-200 leading-relaxed border-l-4 border-purple-500 pl-4">{verificationResult.verdict}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                <div className="bg-slate-950/80 p-6 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-colors">
                                    <h3 className="text-purple-400 text-xs font-black uppercase mb-4 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                        Market & Competition
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Market Size</p>
                                            <p className="text-sm text-slate-300">{verificationResult.marketSize}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Competitors</p>
                                                <p className="text-sm text-white font-mono">{verificationResult.competitors.count}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Barriers</p>
                                                <p className="text-sm text-white">{verificationResult.competitors.barriers}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Top Players</p>
                                            <div className="flex flex-wrap gap-2">
                                                {verificationResult.competitors.topPlayers.map(p => (
                                                    <span key={p} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[10px]">{p}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-950/80 p-6 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-colors">
                                    <h3 className="text-emerald-400 text-xs font-black uppercase mb-4 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        Financials
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Startup Cost</p>
                                                <p className="text-sm text-emerald-400 font-mono font-bold">{verificationResult.costs.startup}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Monthly Cost</p>
                                                <p className="text-sm text-slate-300 font-mono">{verificationResult.costs.monthly}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Profit Model</p>
                                            <p className="text-sm text-slate-300">{verificationResult.profitPath.method} @ <span className="text-emerald-400 font-bold">{verificationResult.profitPath.unitPrice}</span></p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Required Skills</p>
                                            <div className="flex flex-wrap gap-2">
                                                {verificationResult.costs.skills.map(s => (
                                                    <span key={s} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[10px]">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-950/50 p-6 rounded-2xl border border-red-500/20">
                                 <h3 className="text-red-400 text-xs font-black uppercase mb-4 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                    Risk Assessment
                                 </h3>
                                 <ul className="space-y-2">
                                    {verificationResult.risks.map((risk, i) => (
                                        <li key={i} className="text-sm text-slate-400 flex gap-2">
                                            <span className="text-red-500">•</span> {risk}
                                        </li>
                                    ))}
                                 </ul>
                            </div>
                        </div>
                    </div>
                ) : !result ? (
                  mode === 'verify' ? (
                     <div className="flex flex-col items-center justify-center py-32 space-y-6 opacity-50">
                        <div className="w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-2">Verification Mode Active</h2>
                            <p className="text-sm text-slate-500">Enter a business idea above to generate a comprehensive viability report.</p>
                        </div>
                     </div>
                    ) : (
                    <div className="space-y-6">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">{t.discoveryTitle}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                      {nodes.map((node) => (
                        <div key={node.id} onClick={() => handleNodeClick(node)} className="glass-panel group p-6 border-white/5 hover:border-sky-500/40 cursor-pointer transition-all transform hover:-translate-y-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase border mb-4 ${node.type === 'sector' ? 'text-sky-400 border-sky-900 bg-sky-950/30' : 'text-amber-400 border-amber-900 bg-amber-950/30'}`}>{node.type}</span>
                          <h3 className="text-lg font-bold text-white group-hover:text-sky-400 mb-2">{node.label}</h3>
                          <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{node.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  )
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 bg-sky-500 rounded-full"></div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">{discoveryPath[discoveryPath.length - 1]?.label}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                      {result.opportunities.map((opp, idx) => (
                        <OpportunityCard key={opp.id} opportunity={opp} index={idx} language={language} onClick={() => setSelectedOpportunity(opp)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Load More Button */}
                <div className="flex justify-center pt-8 pb-12">
                   <button 
                    onClick={handleLoadMore}
                    disabled={isScanning || isLoadingMore}
                    className="group relative px-10 py-4 bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden transition-all hover:border-sky-500/50 active:scale-95 disabled:opacity-50"
                   >
                     <div className="absolute inset-0 bg-gradient-to-r from-sky-500/0 via-sky-500/5 to-sky-500/0 group-hover:translate-x-full duration-1000 transition-transform"></div>
                     <div className="flex items-center gap-3 relative z-10">
                        {isLoadingMore ? (
                          <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2.5" strokeLinecap="round"/></svg>
                        )}
                        <span className="text-xs font-black text-white uppercase tracking-[0.2em]">{t.btnLoadMore}</span>
                     </div>
                   </button>
                </div>
              </>
            ) : (
              <AgentLibrary agents={savedAgents} language={language} onLaunch={setSandboxData} onDelete={id => setSavedAgents(s => s.filter(a => a.assetId !== id))} />
            )}
          </div>
        </main>

        <aside className="hidden xl:flex w-96 shrink-0 flex-col border-l border-white/5 bg-slate-950/50 backdrop-blur-sm relative">
           <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Telemetry</span>
           </div>
           <div className="flex-1 p-2"><Terminal logs={logs} language={language} /></div>
           {result && (
              <div className="p-4 bg-sky-500/5 border-t border-white/5 space-y-3">
                 <h4 className="text-[10px] font-black text-sky-500 uppercase tracking-widest">{t.summaryTitle}</h4>
                 <p className="text-xs text-slate-400 leading-relaxed italic line-clamp-6">{result.marketOverview}</p>
                 
                 {result.sources && result.sources.length > 0 && (
                    <div className="pt-2 border-t border-white/5 mt-2">
                        <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Data Sources</h5>
                        <ul className="space-y-1.5">
                            {result.sources.slice(0, 5).map((s, i) => (
                                <li key={i}>
                                    <a href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] text-sky-400 hover:text-sky-300 truncate block flex items-center gap-1.5 transition-colors">
                                        <svg className="w-3 h-3 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                        <span className="truncate opacity-80 hover:opacity-100">{s.title}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                 )}
              </div>
           )}
        </aside>
      </div>

      <OpportunityModal opportunity={selectedOpportunity} isOpen={!!selectedOpportunity} onClose={() => setSelectedOpportunity(null)} language={language} onAgentSaved={a => setSavedAgents(prev => [a, ...prev])} />
      {sandboxData && <SandboxView automation={sandboxData} onClose={() => setSandboxData(null)} language={language} />}
    </div>
  );
};

export default App;