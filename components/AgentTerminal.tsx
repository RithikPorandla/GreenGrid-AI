import React, { useEffect, useRef } from 'react';
import { AgentLog } from '../types';
import { Terminal, Circle } from 'lucide-react';

interface AgentTerminalProps {
  logs: AgentLog[];
}

const roleColors: Record<string, string> = {
  Grid_Manager: 'text-blue-400',
  Optimization_Writer: 'text-warning',
  Safety_Critic: 'text-danger',
  System: 'text-gray-500',
};

export const AgentTerminal: React.FC<AgentTerminalProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col h-full bg-[#080808]">
      <div className="px-4 py-3 border-b border-[#262626] flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs font-mono text-gray-400">agent_protocol_logs.sh</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#262626]"></div>
          <div className="w-2 h-2 rounded-full bg-[#262626]"></div>
        </div>
      </div>
      
      <div className="p-4 overflow-y-auto terminal-scroll flex-grow font-mono text-xs space-y-3 h-[300px] md:h-auto">
        {logs.length === 0 && (
            <div className="text-gray-700 italic flex items-center gap-2">
                <span className="animate-pulse">_</span> Waiting for grid anomalies...
            </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex flex-col gap-1 animate-fadeIn group">
            <div className="flex items-baseline gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
              <span className="text-gray-600 text-[10px]">
                {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
              </span>
              <span className={`font-semibold ${roleColors[log.role] || 'text-white'}`}>
                {log.role}
              </span>
            </div>
            <div className="pl-14 text-gray-300 ml-1 leading-relaxed">
              {log.message}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};