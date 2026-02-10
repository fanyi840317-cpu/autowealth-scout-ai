import React, { useState, useEffect, useRef } from 'react';
import { AutomationResult, Language } from '../types';

interface SandboxViewProps {
  automation: AutomationResult;
  onClose: () => void;
  language: Language;
}

const SandboxView: React.FC<SandboxViewProps> = ({ automation, onClose, language }) => {
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
        {/* Sidebar - Hidden on mobile */}
        <div className="w-60 border-r border-slate-800 bg-[#09090b] hidden lg:flex flex-col">
          <div className="p-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Explorer</div>
          <div className="flex flex-col gap-1 p-2">
            <div className="flex items-center gap-2 px-2 py-1 bg-sky-500/10 border border-sky-500/20 rounded text-sky-400 text-sm cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              agent_script.{automation.language === 'python' ? 'py' : 'js'}
            </div>
            <div className="flex items-center gap-2 px-2 py-1 text-slate-500 text-sm hover:text-slate-300 transition-colors cursor-not-allowed">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              README.md
            </div>
          </div>
        </div>

        {/* Main Editor & Terminal Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#09090b]">
          {/* Tabs */}
          <div className="h-9 flex items-center bg-[#18181b] border-b border-slate-800 shrink-0">
             <div className="px-4 h-full flex items-center gap-2 border-r border-slate-800 bg-[#09090b] text-sky-400 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                agent_script.{automation.language === 'python' ? 'py' : 'js'}
             </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 overflow-auto p-4 md:p-6 font-mono text-xs md:text-sm relative custom-scrollbar">
            <div className="absolute left-0 top-6 bottom-0 w-8 md:w-12 flex flex-col items-center text-slate-700 pointer-events-none select-none border-r border-slate-900 pr-1 md:pr-2">
              {Array.from({ length: 50 }).map((_, i) => (
                <div key={i} className="h-[1.5rem] leading-[1.5rem]">{i + 1}</div>
              ))}
            </div>
            <div className="pl-8 md:pl-10">
               <pre className="text-slate-300 whitespace-pre-wrap">
                 <code className="block leading-[1.5rem]">{automation.code}</code>
               </pre>
            </div>
          </div>

          {/* Bottom Terminal */}
          <div className="h-48 md:h-64 border-t border-slate-800 bg-[#09090b] flex flex-col shadow-[0_-10px_20px_rgba(0,0,0,0.5)] shrink-0">
             <div className="flex items-center justify-between px-4 py-1 bg-[#18181b] border-b border-slate-800">
                <div className="flex gap-4">
                  <button className="text-[10px] font-bold text-slate-200 border-b border-sky-500 pb-1 uppercase tracking-wider">{t.terminal}</button>
                  <button className="text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-wider">{t.output}</button>
                </div>
                <div className="flex gap-2">
                   <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                </div>
             </div>
             <div className="flex-1 overflow-y-auto p-4 font-mono text-xs bg-black/40 custom-scrollbar">
                {terminalLogs.length === 0 && !isRunning && (
                  <div className="text-slate-600">Click "Run Script" to simulate local agent execution.</div>
                )}
                {terminalLogs.map((log, i) => (
                  <div key={i} className={`mb-1 ${
                    log.includes('[SUCCESS]') ? 'text-emerald-400' : 
                    log.includes('[ERROR]') ? 'text-red-400' :
                    log.includes('[WAIT]') ? 'text-sky-400 animate-pulse' :
                    log.startsWith('$') ? 'text-white font-bold' : 'text-slate-400'
                  }`}>
                    {log}
                  </div>
                ))}
                <div ref={terminalEndRef} />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SandboxView;