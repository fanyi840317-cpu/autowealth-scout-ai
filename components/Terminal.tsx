import React, { useEffect, useRef } from 'react';
import { LogEntry, Language } from '../types';

interface TerminalProps {
  logs: LogEntry[];
  language: Language;
}

const Terminal: React.FC<TerminalProps> = ({ logs, language }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const fileName = language === 'zh' ? 'SYS_KERNEL_OP' : 'SYSTEM_KERNEL_LOG';

  return (
    <div className="h-full flex flex-col font-mono text-[10px] bg-black/40 rounded-xl border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5">
        <div className="flex items-center gap-2">
           <div className="flex gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-red-500/50"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></div>
           </div>
           <span className="text-slate-500 font-bold tracking-tighter ml-2">{fileName}</span>
        </div>
        <span className="text-[8px] text-slate-700">0.4.0-STABLE</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar scroll-smooth">
        {logs.length === 0 && (
            <div className="text-slate-700 italic animate-pulse">Initializing telemetry stream...</div>
        )}
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2 animate-in fade-in slide-in-from-left-1 duration-300">
            <span className="text-slate-700 shrink-0 select-none">[{log.timestamp}]</span>
            <span className={`
                leading-relaxed break-words
                ${log.type === 'error' ? 'text-red-400 bg-red-500/5 px-1 rounded' : ''}
                ${log.type === 'success' ? 'text-emerald-400' : ''}
                ${log.type === 'warning' ? 'text-sky-400' : ''}
                ${log.type === 'info' ? 'text-slate-400' : ''}
            `}>
              <span className="opacity-50 mr-1">{log.type === 'error' ? '✖' : '❯'}</span>
              {log.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      
      <div className="px-3 py-1 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
         <span className="text-[8px] text-slate-600">ENCRYPTION: AES-256</span>
         <span className="text-[8px] text-slate-600">BUFF: {logs.length}/50</span>
      </div>
    </div>
  );
};

export default Terminal;