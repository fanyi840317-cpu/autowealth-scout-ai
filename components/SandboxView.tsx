import React, { useState, useEffect, useRef } from 'react';
import { AutomationResult, Language } from '../types';

interface SandboxViewProps {
  automation: AutomationResult;
  onClose: () => void;
  language: Language;
}

const SandboxView: React.FC<SandboxViewProps> = ({ automation, onClose, language }) => {
  if (!automation) return null;

  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const t = {
    run: language === 'zh' ? '运行程序' : 'Run Script',
    stop: language === 'zh' ? '停止' : 'Stop',
    copy: language === 'zh' ? '复制代码' : 'Copy Code',
    close: language === 'zh' ? '退出沙箱' : 'Exit Sandbox',
    terminal: language === 'zh' ? '终端' : 'Terminal',
    output: language === 'zh' ? '输出' : 'Output',
    running: language === 'zh' ? '正在执行核心逻辑...' : 'Executing core logic...',
    completed: language === 'zh' ? '进程执行完毕 (退出码 0)' : 'Process finished (exit code 0)',
  };

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  const simulateRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setTerminalLogs([]);
    
    const logs = [
      `$ ${automation.language} agent_script.${automation.language === 'python' ? 'py' : 'js'}`,
      `[INFO] Initializing environment...`,
      `[INFO] Loading dependencies: ${automation.dependencies.join(', ')}`,
      `[WAIT] Establishing secure connection to target nodes...`,
      `[DATA] Scanning entry points for automation vectors...`,
      `[EXEC] Starting task: "${t.running}"`,
      ...automation.instructions.split('\n').map(i => `[LOG] ${i}`),
      `[SUCCESS] ${t.completed}`
    ];

    for (const log of logs) {
      setTerminalLogs(prev => [...prev, log]);
      await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 400));
    }
    setIsRunning(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(automation.code);
    alert(language === 'zh' ? '代码已复制到剪贴板' : 'Code copied to clipboard');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[#09090b] flex flex-col animate-[fadeIn_0.3s_ease-out]">
      {/* Top Navbar */}
      <div className="h-14 md:h-12 border-b border-slate-800 flex items-center justify-between px-3 md:px-4 bg-[#18181b] shrink-0">
        <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
          <div className="hidden md:flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <div className="flex items-center gap-1 border-r border-slate-800 pr-2 md:pr-4 md:ml-2">
            <span className="text-sky-500 font-bold truncate text-sm md:text-base">AutoWealth</span>
            <span className="text-slate-500 text-[10px] md:text-xs font-mono hidden sm:inline">/ sandbox_env / agent_v1.0</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                const guide = `
# SETUP GUIDE
${automation.setupGuide || 'No setup guide provided.'}

# HUMAN TASKS
${(automation.humanTasks || []).map(task => `- [ ] ${task}`).join('\n')}

# INSTRUCTIONS
${automation.instructions}
                `;
                navigator.clipboard.writeText(guide);
                alert(language === 'zh' ? '配置指南已复制' : 'Setup guide copied');
              }}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 bg-indigo-900 hover:bg-indigo-800 rounded text-[10px] md:text-xs text-indigo-100 transition-all border border-indigo-700"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {language === 'zh' ? '查看配置' : 'View Setup'}
            </button>
            <button 
              onClick={simulateRun}
              disabled={isRunning}
              className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 rounded text-[10px] md:text-xs font-bold transition-all ${
                isRunning ? 'bg-slate-800 text-slate-500' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
              }`}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4.5 3.5v13l11-6.5-11-6.5z"/></svg>
              {isRunning ? t.stop : t.run}
            </button>
            <button 
              onClick={handleCopy}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] md:text-xs text-slate-300 transition-all border border-slate-700"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
              {t.copy}
            </button>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors p-1"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Code Editor & Business Context */}
        <div className="w-1/2 md:w-3/5 border-r border-slate-800 flex flex-col bg-[#1e1e1e]">
          
          {/* Business Context Panel (New) */}
          <div className="bg-[#111] border-b border-slate-800 p-4 text-xs">
            <h3 className="text-yellow-500 font-bold mb-3 flex items-center gap-2 uppercase tracking-wider">
              <span className="text-lg">⚡</span> 
              {language === 'zh' ? '商业变现蓝图' : 'BUSINESS BLUEPRINT'}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <div className="text-slate-500 font-bold uppercase">{language === 'zh' ? '目标客户' : 'TARGET CUSTOMER'}</div>
                    <div className="text-slate-300 font-medium">{automation.targetUser || 'N/A'}</div>
                </div>
                <div className="space-y-1">
                    <div className="text-slate-500 font-bold uppercase">{language === 'zh' ? '交付产品' : 'DELIVERABLE'}</div>
                    <div className="text-slate-300 font-medium">{automation.deliverable || 'N/A'}</div>
                </div>
                <div className="col-span-2 space-y-1 bg-green-900/10 p-2 rounded border border-green-900/30">
                    <div className="text-green-500 font-bold uppercase flex items-center gap-1">
                        <span>💰</span> {language === 'zh' ? '变现策略' : 'MONETIZATION STRATEGY'}
                    </div>
                    <div className="text-green-300 font-medium">{automation.monetizationStrategy || 'N/A'}</div>
                </div>
                 <div className="col-span-2 space-y-1">
                    <div className="text-slate-500 font-bold uppercase">{language === 'zh' ? '价值主张' : 'VALUE PROPOSITION'}</div>
                    <div className="text-slate-400 italic">"{automation.valueProposition || 'N/A'}"</div>
                </div>
            </div>
          </div>

          <div className="h-8 bg-[#252526] flex items-center px-4 text-xs text-slate-400 select-none border-b border-[#333] shrink-0">
             <span className="mr-2">📁 project</span> 
             <span className="text-slate-600">/</span> 
             <span className="ml-2 text-yellow-400">script.{automation.language === 'python' ? 'py' : 'js'}</span>
             
             {automation.automationScope && (
               <span className="ml-auto text-[10px] bg-sky-900/30 text-sky-400 px-2 py-0.5 rounded border border-sky-800 truncate max-w-[200px]" title={automation.automationScope}>
                 SCOPE: {automation.automationScope}
               </span>
             )}
          </div>
          <div className="flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed text-slate-300 whitespace-pre scrollbar-thin">
            {automation.code}
          </div>
        </div>

        {/* Right: Terminal & Guide */}
        <div className="w-1/2 md:w-2/5 flex flex-col bg-[#0c0c0c]">
          {/* Setup Guide Panel */}
          <div className="h-1/3 border-b border-slate-800 p-4 overflow-auto bg-[#111] text-xs text-slate-400 font-mono">
            <h3 className="text-indigo-400 font-bold mb-2 uppercase tracking-wider border-b border-indigo-900/30 pb-1 flex justify-between">
              <span>{language === 'zh' ? '环境准备 & 人工任务' : 'SETUP & HUMAN TASKS'}</span>
              <span className="text-[10px] text-slate-500 bg-slate-800 px-1 rounded">PART A: HUMAN</span>
            </h3>
            
            {automation.setupGuide && (
              <div className="mb-4">
                <div className="text-slate-500 mb-1 font-bold"># TERMINAL SETUP:</div>
                <div className="text-green-400 select-all cursor-text bg-black p-2 rounded border border-slate-800">
                  {automation.setupGuide}
                </div>
              </div>
            )}

            {automation.humanTasks && automation.humanTasks.length > 0 && (
              <div>
                <div className="text-slate-500 mb-1 font-bold"># HUMAN INPUT (IDENTITY/AUTH):</div>
                <div className="bg-amber-900/10 border border-amber-900/30 p-2 rounded">
                    <ul className="list-none space-y-1 text-slate-300">
                    {automation.humanTasks.map((task, i) => (
                        <li key={i} className="flex gap-2 text-[10px] md:text-xs">
                            <span className="text-amber-500 shrink-0">👤</span>
                            <span>{task}</span>
                        </li>
                    ))}
                    </ul>
                </div>
              </div>
            )}
          </div>

          {/* Terminal Output */}
          <div className="flex-1 flex flex-col min-h-0 relative">
            <div className="h-8 bg-[#333] flex items-center justify-between px-4 text-xs font-bold text-white select-none shadow-md shrink-0">
              <div className="flex items-center">
                <span className="mr-2">💻</span> {t.terminal}
              </div>
              <span className="text-[10px] text-green-500 bg-green-900/30 px-1 rounded border border-green-900">PART B: AUTOMATED ENGINE</span>
            </div>
            <div className="flex-1 p-3 font-mono text-xs overflow-y-auto text-green-500 bg-black/90 scrollbar-thin">
              {terminalLogs.map((log, i) => (
                <div key={i} className="mb-1 break-all animate-[fadeIn_0.1s]">
                  {log}
                </div>
              ))}
              <div ref={terminalEndRef} />
              {isRunning && <span className="animate-pulse">_</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SandboxView;