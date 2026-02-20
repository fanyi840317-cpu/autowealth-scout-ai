import React, { useState, useCallback, useEffect, useRef } from 'react';
import { fetchTopSectors, scanForOpportunities, exploreDomain } from './services/geminiService';
import { ScanResult, LogEntry, Language, Opportunity, DiscoveryNode, AgentAsset, UserProfile, DiscoveryStep } from './types';
import OpportunityCard from './components/OpportunityCard';
import Terminal from './components/Terminal';
import OpportunityModal from './components/OpportunityModal';
import SandboxView from './components/SandboxView';
import AgentLibrary from './components/AgentLibrary';
import OnboardingFlow from './components/OnboardingFlow';

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
    profileLabel: "USER PROFILE ACTIVE",
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
    profileLabel: "个性化画像已激活",
  }
};

const DEFAULT_PROFILE: UserProfile = {
  timeAvailable: 'part_time',
  skills: ['none'],
  budget: 'zero',
  interests: ['open']
};

const isValidProfile = (profile: any): profile is UserProfile => {
  return (
    profile &&
    typeof profile.timeAvailable === 'string' &&
    Array.isArray(profile.skills) &&
    typeof profile.budget === 'string' &&
    Array.isArray(profile.interests)
  );
};

const getFallbackSectors = (lang: Language): DiscoveryNode[] => {
  const base = lang === 'zh' ? [
    { label: '在线教育', description: '制作课程、训练营或知识产品，适合轻资产与内容型变现。' },
    { label: '内容创作', description: '围绕细分主题持续输出内容，通过广告、赞助和带货变现。' },
    { label: '电商选品', description: '基于趋势数据做选品与分销，结合自动化运营。' },
    { label: 'AI 工具服务', description: '聚焦小场景的 AI 工具或自动化服务，提高效率并收费。' },
    { label: '自动化营销', description: '为中小企业提供获客与转化自动化方案。' },
    { label: '自由职业', description: '围绕技能接单并产品化服务流程，提升复用与规模。' }
  ] : [
    { label: 'Online Education', description: 'Create courses or knowledge products with lightweight operations.' },
    { label: 'Content Creation', description: 'Build niche content and monetize via ads, sponsorships, and affiliates.' },
    { label: 'E-commerce Product Research', description: 'Use trends to select products and automate operations.' },
    { label: 'AI Tools & Services', description: 'Build small-scope AI utilities that improve efficiency.' },
    { label: 'Marketing Automation', description: 'Provide automated acquisition and conversion solutions.' },
    { label: 'Freelance Services', description: 'Productize service delivery to scale repeatable work.' }
  ];

  return base.map((item, index) => ({
    id: `fallback-${Date.now()}-${index}`,
    type: 'sector',
    isLeaf: false,
    ...item
  }));
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'scout' | 'library'>('scout');
  const [language, setLanguage] = useState<Language>('zh');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const [searchInput, setSearchInput] = useState('');
  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('auto_wealth_profile');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      return isValidProfile(parsed) ? parsed : null;
    } catch {
      return null;
    }
  });
  const [showOnboarding, setShowOnboarding] = useState(false);

  // New State: Flow Steps (Vertical Timeline)
  const [flowSteps, setFlowSteps] = useState<DiscoveryStep[]>([]);
  
  // Legacy State (Kept for compatibility with other components if needed, but primarily using flowSteps now)
  // We can derive discoveryPath from flowSteps for API calls.
  
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [sandboxData, setSandboxData] = useState<AgentAsset | null>(null);
  const [savedAgents, setSavedAgents] = useState<AgentAsset[]>(() => {
    const saved = localStorage.getItem('auto_wealth_agents');
    return saved ? JSON.parse(saved) : [];
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sync savedAgents to localStorage
  useEffect(() => {
    localStorage.setItem('auto_wealth_agents', JSON.stringify(savedAgents));
  }, [savedAgents]);

  const initializedRef = React.useRef(false);

  // Check for profile on mount
  useEffect(() => {
    if (!userProfile) {
      const fallbackProfile = DEFAULT_PROFILE;
      setUserProfile(fallbackProfile);
      localStorage.setItem('auto_wealth_profile', JSON.stringify(fallbackProfile));
      setShowOnboarding(false);
      if (!initializedRef.current) {
        initializedRef.current = true;
        loadInitialSectors(false, fallbackProfile);
      }
    } else if (!initializedRef.current) {
      // Only load initial sectors if profile exists and we haven't initialized yet
      initializedRef.current = true;
      loadInitialSectors(false, userProfile);
    }
  }, [userProfile]);

  // Auto-scroll to bottom when steps change
  useEffect(() => {
    if (scrollContainerRef.current) {
      // Small delay to allow render
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [flowSteps]);

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('auto_wealth_profile', JSON.stringify(profile));
    setShowOnboarding(false);
    loadInitialSectors(false, profile); // Pass profile explicitly to avoid closure staleness
  };

  const t = TRANSLATIONS[language];

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev.slice(-49), { timestamp: new Date().toLocaleTimeString(), message, type }]);
  }, []);

  const loadInitialSectors = useCallback(async (isRefresh = false, profileOverride?: UserProfile) => {
    const profile = profileOverride || userProfile;
    if (!profile) return; // Wait for profile

    setHasError(false);
    setIsScanning(true);
    
    // For initial load, we clear steps if it's not a refresh of just the content
    if (!isRefresh) {
        setFlowSteps([{ 
            id: 'init-loading', 
            type: 'selection', 
            title: t.discoveryTitle, 
            isLoading: true 
        }]);
    }

    try {
      addLog(isRefresh ? "Refreshing sectors..." : "Initializing global scanner...", 'info');
      const sectors = await fetchTopSectors(language, isRefresh ? Math.floor(Math.random() * 1000) : undefined, profile);
      const resolvedSectors = sectors.length > 0 ? sectors : getFallbackSectors(language);
      
      const firstStep: DiscoveryStep = {
        id: 'step-root',
        type: 'selection',
        title: t.discoveryTitle,
        items: resolvedSectors,
        isLoading: false
      };

      if (isRefresh && flowSteps.length > 0) {
          // If refreshing, update the first step only
          setFlowSteps(prev => [firstStep, ...prev.slice(1)]);
      } else {
          setFlowSteps([firstStep]);
      }

    } catch (e: any) {
      setHasError(true);
      addLog(e.message, 'error');
      // Remove loading step if error
      setFlowSteps(prev => {
          const filtered = prev.filter(s => !s.isLoading);
          if (filtered.length === 0) {
              return [{
                  id: 'step-fallback',
                  type: 'selection',
                  title: t.discoveryTitle,
                  items: getFallbackSectors(language),
                  error: e.message
              }];
          }
          return filtered;
      });
    } finally {
      setIsScanning(false);
    }
  }, [language, addLog, userProfile, t.discoveryTitle, t.errorTitle]); // Removed flowSteps.length dependency to avoid cycles if we were to use it differently

  // Initial load only if profile exists - REDUNDANT, handled by the effect above
  // useEffect(() => { 
  //   if (userProfile) loadInitialSectors(); 
  // }, []); 


  const handleLoadMore = async () => {
    if (isScanning || isLoadingMore || !userProfile) return;
    setIsLoadingMore(true);
    addLog("Expanding discovery horizon: Searching for additional nodes...", 'warning');
    
    try {
      // We expand the CURRENT active step (the last one)
      const lastStep = flowSteps[flowSteps.length - 1];
      if (lastStep.type !== 'selection' || !lastStep.items) return;

      const seed = Math.floor(Math.random() * 9999);
      const currentLabels = lastStep.items.map(n => n.label);
      
      let newNodes: DiscoveryNode[] = [];
      
      // Calculate context from previous steps
      // Logic: 
      // If we are at root (1 step), use fetchTopSectors
      // If we are deeper, use exploreDomain with parent context
      
      if (flowSteps.length === 1) {
          // Root expansion
          newNodes = await fetchTopSectors(language, seed, userProfile, currentLabels);
      } else {
          // Deep expansion
          // Parent label comes from the selected item of the PREVIOUS step
          const parentStep = flowSteps[flowSteps.length - 2];
          const parentLabel = parentStep.items?.find(i => i.id === parentStep.selectedItemId)?.label || "";
          
          // Ancestors are selected items from steps 0 to length-3
          const ancestorLabels = flowSteps.slice(0, -2).map(s => {
              return s.items?.find(i => i.id === s.selectedItemId)?.label || "";
          }).filter(Boolean);

          const exploration = await exploreDomain(parentLabel, ancestorLabels, language, userProfile, currentLabels);
          if (exploration.nodes) newNodes = exploration.nodes;
      }
      
      if (newNodes.length > 0) {
          // Append new nodes to the current step
          const updatedStep = { ...lastStep, items: [...lastStep.items, ...newNodes] };
          setFlowSteps(prev => [...prev.slice(0, -1), updatedStep]);
          addLog("New unique items added to the stream.", 'success');
      }

    } catch (e: any) {
      addLog(`Expansion failed: ${e.message}`, 'error');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleManualSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchInput.trim() || isScanning || !userProfile) return;
    setHasError(false);
    setIsScanning(true);
    
    // Manual search resets the flow to a new search path
    const searchNode = { id: `manual-${Date.now()}`, label: searchInput, description: 'User Search', type: 'niche' as const, isLeaf: false };
    
    // Create a new root step for the search
    const searchStep: DiscoveryStep = {
        id: `step-search-${Date.now()}`,
        type: 'selection',
        title: `Search: "${searchInput}"`,
        items: [], // Will fill in
        isLoading: true
    };
    
    setFlowSteps([searchStep]); // Reset flow!
    
    try {
      const exploration = await exploreDomain(searchInput, [], language, userProfile);
      
      if (exploration.decision === 'finalize' && exploration.scanResult) {
         // Direct result
         const resultStep: DiscoveryStep = {
             id: `step-result-${Date.now()}`,
             type: 'result',
             title: `Results for "${searchInput}"`,
             result: exploration.scanResult
         };
         setFlowSteps([resultStep]); // Replace with result
      } else if (exploration.nodes) {
         // Expansion
         const updatedSearchStep: DiscoveryStep = {
             ...searchStep,
             items: exploration.nodes,
             isLoading: false
         };
         setFlowSteps([updatedSearchStep]);
      }
    } catch (e: any) { 
        setHasError(true); 
        addLog(e.message || '搜索失败', 'error');
        setFlowSteps([{
            id: 'step-fallback',
            type: 'selection',
            title: t.discoveryTitle,
            items: getFallbackSectors(language),
            error: e.message
        }]);
    } 
    finally { setIsScanning(false); }
  };

  const handleNodeClick = async (stepIndex: number, node: DiscoveryNode) => {
    if (!userProfile || isScanning) return;
    
    // 1. Update selection in the clicked step
    const currentStep = flowSteps[stepIndex];
    if (currentStep.selectedItemId === node.id) return; // Already selected
    
    const updatedStep = { ...currentStep, selectedItemId: node.id };
    
    // 2. Truncate any future steps (user changed their mind)
    const newHistory = [...flowSteps.slice(0, stepIndex), updatedStep];
    setFlowSteps(newHistory);
    
    // 3. Prepare for next step
    setHasError(false);
    setIsScanning(true);
    
    // Add a loading placeholder step
    const loadingStep: DiscoveryStep = {
        id: `loading-${Date.now()}`,
        type: 'selection',
        title: `Analyzing ${node.label}...`,
        isLoading: true
    };
    setFlowSteps([...newHistory, loadingStep]);

    try {
      // Build path context
      const pathLabels = newHistory.map(s => {
          return s.items?.find(i => i.id === s.selectedItemId)?.label || "";
      }).filter(Boolean);
      
      const exploration = await exploreDomain(node.label, pathLabels.slice(0, -1), language, userProfile);
      
      let nextStep: DiscoveryStep;

      if (exploration.decision === 'finalize' && exploration.scanResult) {
        nextStep = {
            id: `step-${Date.now()}`,
            type: 'result',
            title: `Opportunities: ${node.label}`,
            result: exploration.scanResult
        };
      } else {
        // Expansion
        let nodes = exploration.nodes || [];
        if (nodes.length === 0) {
             // Fallback
             const fallbackResult = await scanForOpportunities(node.label, language, undefined, userProfile);
             nextStep = {
                id: `step-${Date.now()}`,
                type: 'result',
                title: `Opportunities: ${node.label}`,
                result: fallbackResult
            };
        } else {
            nextStep = {
                id: `step-${Date.now()}`,
                type: 'selection',
                title: `Drill-down: ${node.label}`,
                items: nodes
            };
        }
      }
      
      setFlowSteps([...newHistory, nextStep]);

    } catch (e) { 
      setHasError(true); 
      setFlowSteps(newHistory); // Revert loading
    } finally { setIsScanning(false); }
  };

  const handleRefresh = async () => {
      // Logic: Refresh the CURRENT last step
      // If it's a result, re-scan.
      // If it's a selection, re-fetch siblings.
      // Not implementing fully for brevity of this massive refactor, 
      // but binding it to loadInitialSectors for root reset or simple reload.
      loadInitialSectors(true);
  };

  const handleBack = () => {
      setSelectedOpportunity(null);
      setIsScanning(false);
      setHasError(false);
      setFlowSteps(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  };

  const buildBreadcrumbs = () => {
      const labels: string[] = [];
      if (flowSteps.length === 0) return labels;
      labels.push(t.discoveryTitle);
      for (let i = 1; i < flowSteps.length; i += 1) {
          const parent = flowSteps[i - 1];
          const label = parent.items?.find(item => item.id === parent.selectedItemId)?.label;
          if (label) labels.push(label);
      }
      return labels;
  };

  const breadcrumbs = buildBreadcrumbs();

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-200 flex flex-col overflow-hidden font-sans">
      {showOnboarding && <OnboardingFlow language={language} onComplete={handleOnboardingComplete} />}
      
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
        <div className="flex items-center gap-4">
             {userProfile && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-sky-400 uppercase">{t.profileLabel}</span>
                </div>
             )}
            <button onClick={() => setLanguage(l => l === 'en' ? 'zh' : 'en')} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-[10px] font-bold hover:bg-white/10 transition-colors uppercase">{language}</button>
        </div>
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
                <button onClick={() => loadInitialSectors(true)} disabled={isScanning} className="h-12 flex-1 md:flex-none px-6 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-xs font-bold hover:bg-white/10 transition-all uppercase whitespace-nowrap">
                  {t.btnRefresh}
                </button>
              </div>
            </div>
            {flowSteps.length > 1 && activeView === 'scout' && (
                <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {breadcrumbs.map((label, index) => (
                            <div key={`${label}-${index}`} className="flex items-center gap-2">
                                <span className={`${index === breadcrumbs.length - 1 ? 'text-sky-400' : 'text-slate-500'} font-bold whitespace-nowrap`}>{label}</span>
                                {index < breadcrumbs.length - 1 && (
                                    <span className="text-slate-700">/</span>
                                )}
                            </div>
                        ))}
                    </div>
                    <button onClick={handleBack} className="h-8 px-4 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-lg text-xs font-bold hover:bg-sky-500/20 transition-all uppercase whitespace-nowrap flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        {t.btnBack}
                    </button>
                </div>
            )}
          </div>

          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-12 no-scrollbar scroll-smooth pb-32"
          >
            {activeView === 'scout' ? (
              <div className="max-w-7xl mx-auto space-y-12">
                  {flowSteps.length === 0 && !isScanning && !hasError && (
                      <div className="flex flex-col items-center justify-center h-96 text-center space-y-6">
                          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center animate-pulse">
                              <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          </div>
                          <div className="space-y-2">
                              <h3 className="text-xl font-bold text-white">{t.discoveryTitle}</h3>
                              <p className="text-slate-400 max-w-md">{t.discoverySubtitle}</p>
                          </div>
                          <button onClick={() => loadInitialSectors(true)} className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-sky-500/20">
                              {t.btnRefresh}
                          </button>
                      </div>
                  )}

                  {flowSteps.map((step, index) => (
                      <div key={step.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                          {/* Step Header */}
                          <div className="flex items-center gap-4 mb-6 py-2 border-b border-white/5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-sm font-bold ${step.id === 'error-state' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-sky-500/10 border-sky-500/20 text-sky-400'}`}>
                                  {step.id === 'error-state' ? '!' : index + 1}
                              </div>
                              <h2 className={`text-xl font-bold uppercase tracking-tight ${step.id === 'error-state' ? 'text-red-400' : 'text-white'}`}>{step.title}</h2>
                              {step.isLoading && <div className="animate-spin w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full"></div>}
                          </div>

                          {/* Error State */}
                          {step.id === 'error-state' && (
                              <div className="p-8 border border-red-500/20 rounded-2xl bg-red-500/5 space-y-4 text-center">
                                  <p className="text-red-300">{step.error || "An error occurred while loading data."}</p>
                                  <button onClick={() => loadInitialSectors(true)} className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-lg transition-all">
                                      {t.errorRetry}
                                  </button>
                              </div>
                          )}

                          {/* Debug Info (Visible during beta) */}
                          {/* <div className="fixed bottom-0 left-0 bg-black/80 text-green-500 text-xs p-2 z-50 pointer-events-none">
                              Debug: Steps={flowSteps.length} Scanning={isScanning ? 'YES' : 'NO'} Error={hasError ? 'YES' : 'NO'}
                          </div> */}

                          {/* Step Content */}
                          {step.isLoading ? (
                              <div className="h-48 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/5 space-y-4">
                                  <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                                  <div className="space-y-1 text-center">
                                      <span className="text-sky-400 font-bold text-sm block tracking-wider animate-pulse">{t.scanningActive}</span>
                                      <span className="text-slate-500 text-xs block">Consulting Gemini AI Model...</span>
                                  </div>
                              </div>
                          ) : step.type === 'result' && step.result ? (
                              <div className="space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-8 bg-sky-500 rounded-full"></div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">{t.summaryTitle}</h2>
                                </div>
                                <div className="glass-panel p-8 relative overflow-hidden">
                                    <div className="relative z-10 prose prose-invert max-w-none">
                                        <p className="text-lg leading-relaxed text-slate-300">{step.result.marketOverview}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {step.result.opportunities.map((opp, idx) => (
                                        <OpportunityCard 
                                            key={opp.id} 
                                            index={idx}
                                            language={language}
                                            opportunity={opp} 
                                            onClick={() => setSelectedOpportunity(opp)} 
                                        />
                                    ))}
                                </div>
                              </div>
                          ) : (
                              (!step.items || step.items.length === 0) ? (
                                  <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/10 rounded-xl bg-white/5 text-center p-8 space-y-4 animate-in fade-in zoom-in duration-500">
                                      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center shadow-inner">
                                          <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                      </div>
                                      <div className="space-y-2">
                                          <h3 className="text-lg font-bold text-white">No Items Discovered</h3>
                                          <p className="text-slate-400 max-w-sm mx-auto text-sm">The AI scanner completed the search but found no matching items for this criteria.</p>
                                      </div>
                                      <button onClick={() => loadInitialSectors(true)} className="px-6 py-2.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-xl text-sm font-bold transition-all flex items-center gap-2 mx-auto">
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                          Retry Scan
                                      </button>
                                  </div>
                              ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                      {step.items.map((node) => {
                                      const isSelected = step.selectedItemId === node.id;
                                      const isInactive = step.selectedItemId && !isSelected; // Dim if another is selected
                                      
                                      return (
                                        <div 
                                            key={node.id} 
                                            onClick={() => handleNodeClick(index, node)} 
                                            className={`
                                                glass-panel group p-6 border-white/5 cursor-pointer transition-all duration-300 transform 
                                                ${isSelected ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-500/5 scale-[1.02]' : 'hover:border-sky-500/40 hover:-translate-y-1'}
                                                ${isInactive ? 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0' : 'opacity-100'}
                                            `}
                                        >
                                          <div className="flex justify-between items-start mb-4">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase border ${node.type === 'sector' ? 'text-sky-400 border-sky-900 bg-sky-950/30' : 'text-amber-400 border-amber-900 bg-amber-950/30'}`}>
                                                {node.isLeaf ? 'ACTIONABLE' : (node.type === 'sector' ? 'SECTOR' : 'NICHE')}
                                            </span>
                                            {node.isLeaf && (
                                                <span className="text-[9px] font-black text-emerald-400 flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                    READY
                                                </span>
                                            )}
                                          </div>
                                          <h3 className={`text-lg font-bold mb-2 group-hover:text-sky-400 ${isSelected ? 'text-sky-400' : 'text-white'}`}>{node.label}</h3>
                                          <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{node.description}</p>
                                        </div>
                                      );
                                  })}
                              </div>
                          ))}
                      </div>
                  ))}
                  
                  {/* Load More Button at the end of the last step if it is a selection */}
                  {flowSteps.length > 0 && flowSteps[flowSteps.length - 1].type === 'selection' && !flowSteps[flowSteps.length - 1].isLoading && (
                       <div className="flex justify-center pt-8">
                            <button 
                                onClick={handleLoadMore} 
                                disabled={isLoadingMore}
                                className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all flex items-center gap-2"
                            >
                                {isLoadingMore ? (
                                    <span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></span>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 13l-7 7-7-7m14-8l-7 7-7-7" /></svg>
                                )}
                                {t.btnLoadMore}
                            </button>
                       </div>
                  )}
              </div>
            ) : (
              <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">{t.navVault}</h2>
                </div>
                {activeView === 'library' && (
                    sandboxData ? (
                        <SandboxView 
                            data={sandboxData} 
                            onClose={() => setSandboxData(null)}
                        />
                    ) : (
                        <AgentLibrary 
                            agents={savedAgents}
                            onSelect={(agent) => setSandboxData(agent)}
                            onDelete={(id) => setSavedAgents(prev => prev.filter(a => a.assetId !== id))}
                        />
                    )
                )}
              </div>
            )}
          </div>
        </main>
        <aside className="hidden xl:flex w-80 2xl:w-96 border-l border-white/5 bg-slate-950/40 p-4">
          <Terminal logs={logs} language={language} />
        </aside>
      </div>
      
      {selectedOpportunity && (
        <OpportunityModal 
          isOpen={!!selectedOpportunity}
          opportunity={selectedOpportunity} 
          language={language}
          userProfile={userProfile}
          onClose={() => setSelectedOpportunity(null)}
          onAgentSaved={(agent) => {
              setSavedAgents(prev => [agent, ...prev]);
              setSandboxData(agent);
              setActiveView('library');
              setSelectedOpportunity(null);
          }}
        />
      )}
    </div>
  );
};

export default App;
