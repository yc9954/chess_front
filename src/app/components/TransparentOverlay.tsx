import React from 'react';
import { Brain, Zap, TrendingUp, ArrowRight, AlertTriangle, Settings, Minimize2, Target } from 'lucide-react';
import { Switch } from '@/app/components/ui/switch';

interface Move {
  notation: string;
  evaluation: number;
  centipawnLoss?: number;
  isBest?: boolean;
}

interface TransparentOverlayProps {
  engineStatus: 'idle' | 'analyzing' | 'ready';
  depth: number;
  nodesPerSecond: number;
  score: number;
  bestMove: string;
  topMoves: Move[];
  autoMoveEnabled: boolean;
  onAutoMoveChange: (enabled: boolean) => void;
  onSettingsClick: () => void;
  onMinimizeClick: () => void;
}

export function TransparentOverlay({
  engineStatus,
  depth,
  nodesPerSecond,
  score,
  bestMove,
  topMoves,
  autoMoveEnabled,
  onAutoMoveChange,
  onSettingsClick,
  onMinimizeClick,
}: TransparentOverlayProps) {
  const statusConfig = {
    idle: { color: 'text-gray-400', bg: 'bg-gray-500/20', dotBg: 'bg-gray-400', label: 'Idle' },
    analyzing: { color: 'text-cyan-400', bg: 'bg-cyan-500/20', dotBg: 'bg-cyan-400', label: 'Analyzing', pulse: true },
    ready: { color: 'text-green-400', bg: 'bg-green-500/20', dotBg: 'bg-green-400', label: 'Ready' },
  };

  const config = statusConfig[engineStatus];

  const maxCentipawns = 1000;
  const clampedScore = Math.max(-maxCentipawns, Math.min(maxCentipawns, score));
  const whitePercentage = ((clampedScore + maxCentipawns) / (2 * maxCentipawns)) * 100;
  const displayScore = Math.abs(score / 100).toFixed(1);

  return (
    <div className="w-full h-full flex flex-col rounded-2xl overflow-hidden border border-white/15 bg-slate-900/85 backdrop-blur-2xl shadow-2xl">

      {/* Header — draggable */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-800/50"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-400/15 to-blue-500/15 border border-white/20">
            <Brain className="w-4 h-4 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-xs font-semibold text-white leading-tight">Chess AI SDK</h1>
            <p className="text-[10px] text-white/50">Advanced Analysis</p>
          </div>
        </div>

        <div
          className="flex items-center gap-1.5"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={onSettingsClick}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
            title="Settings (Ctrl+S)"
          >
            <Settings className="w-3.5 h-3.5 text-white/70" />
          </button>
          <button
            onClick={onMinimizeClick}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-300/30 transition-all"
            title="Minimize (Ctrl+H)"
          >
            <Minimize2 className="w-3.5 h-3.5 text-white/70" />
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${config.dotBg} ${config.pulse ? 'animate-pulse' : ''}`} />
          <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-white/40 font-mono">
          <span>D:{depth}</span>
          <span>{(nodesPerSecond / 1000000).toFixed(1)}M n/s</span>
        </div>
      </div>

      {/* Best Move + Eval bar */}
      <div className="flex border-b border-white/5">
        {/* Vertical evaluation bar */}
        <div className="w-8 relative bg-slate-950/50 border-r border-white/5 flex-shrink-0"
             style={{ minHeight: 80 }}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/80 to-white/50 transition-all duration-500"
            style={{ height: `${whitePercentage}%` }}
          />
          <div
            className="absolute top-0 left-0 right-0 bg-gradient-to-b from-gray-900/70 to-gray-800/50 transition-all duration-500"
            style={{ height: `${100 - whitePercentage}%` }}
          />
          <div
            className="absolute left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all duration-500"
            style={{ top: `${100 - whitePercentage}%` }}
          />
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="text-[9px] font-mono text-white/80 font-bold drop-shadow-lg">
              {score >= 0 ? '+' : ''}{displayScore}
            </span>
          </div>
        </div>

        {/* Best move display */}
        <div className="flex-1 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-green-300" />
            <h3 className="text-xs font-semibold text-white/80">Best Move</h3>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-green-300 font-mono tracking-wider">
              {bestMove}
            </span>
            <div className="flex items-center gap-1.5 text-green-300/70">
              <ArrowRight className="w-4 h-4" />
              <div className="text-right">
                <p className="text-sm font-mono font-semibold text-white/80">
                  {score >= 0 ? '+' : ''}{(score / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Candidate Moves — scrollable */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="px-4 py-2 text-xs font-semibold text-white/60 border-b border-white/5">
          Top Candidates
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
          {topMoves.map((move, index) => (
            <div
              key={index}
              className={`p-2.5 rounded-xl border transition-all ${
                move.isBest
                  ? 'bg-green-400/8 border-green-300/20'
                  : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono font-semibold text-white">
                  {index + 1}. {move.notation}
                </span>
                <span className={`text-xs font-mono ${
                  move.evaluation >= 0 ? 'text-green-300' : 'text-red-300'
                }`}>
                  {move.evaluation >= 0 ? '+' : ''}{(move.evaluation / 100).toFixed(2)}
                </span>
              </div>
              {move.centipawnLoss !== undefined && move.centipawnLoss > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-2.5 h-2.5 text-yellow-300" />
                  <span className="text-[10px] text-yellow-300/80">
                    Loss: -{(move.centipawnLoss / 100).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Auto-Move toggle */}
      <div className="px-4 py-2.5 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-green-300" />
            <span className="text-xs font-medium text-white/80">Auto-Move</span>
          </div>
          <Switch checked={autoMoveEnabled} onCheckedChange={onAutoMoveChange} />
        </div>
      </div>

      {/* Footer shortcuts */}
      <div className="px-4 py-2 border-t border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-center gap-4 text-[10px] text-white/30 font-mono">
          <span>Ctrl+H Toggle</span>
          <span>Ctrl+S Settings</span>
        </div>
      </div>
    </div>
  );
}
