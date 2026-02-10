import React, { useState, useCallback, useEffect } from 'react';
import { fetchTopSectors, fetchSubNiches, scanForOpportunities } from './services/geminiService';
import { ScanResult, LogEntry, Language, Opportunity, DiscoveryNode, AgentAsset, FilterOption } from './types';
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
              <form onSubmit={handleManualSearch} className="w-full md:flex-1 relative group">
                <input 
                  type="text" 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t.searchPlaceholder}
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
                  <button onClick={() => { setDiscoveryPath(prev => prev.slice(0, -1)); setResult(null); }} className="h-12 flex-1 md:flex-none px-6 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-xs font-bold hover:bg-white/10 transition-all uppercase whitespace-nowrap">
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
                {!result ? (
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