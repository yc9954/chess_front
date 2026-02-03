import React from 'react';
import { Brain, Zap, Activity } from 'lucide-react';

interface TopStatusBarProps {
  engineStatus: 'idle' | 'analyzing' | 'ready';
  depth: number;
  nodesPerSecond: number;
}

export function TopStatusBar({ engineStatus, depth, nodesPerSecond }: TopStatusBarProps) {
  const statusConfig = {
    idle: { color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Idle' },
    analyzing: { color: 'text-cyan-400', bg: 'bg-cyan-500/20', label: 'Analyzing', pulse: true },
    ready: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Ready' },
  };
  
  const config = statusConfig[engineStatus];
  
  return (
    <div className="w-full px-6 py-3 bg-white/10 backdrop-blur-3xl border-b border-white/20 shadow-lg">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left: Logo/Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-white/30 backdrop-blur-xl">
            <Brain className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">Chess AI SDK</h1>
            <p className="text-xs text-white/60">Advanced Analysis</p>
          </div>
        </div>
        
        {/* Center: Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${config.bg} ${config.pulse ? 'animate-pulse' : ''}`}>
              <div className={`w-full h-full rounded-full ${config.color.replace('text-', 'bg-')} shadow-[0_0_10px_currentColor]`} />
            </div>
            <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
          </div>
          
          <div className="w-px h-6 bg-white/20" />
          
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/80 font-mono">Depth: {depth}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-300/90" />
            <span className="text-sm text-white/80 font-mono">
              {(nodesPerSecond / 1000).toFixed(0)}k n/s
            </span>
          </div>
        </div>
        
        {/* Right: Quick actions placeholder */}
        <div className="w-32" />
      </div>
    </div>
  );
}