import React from 'react';
import { Brain, Activity, Zap, TrendingUp, ArrowRight, AlertTriangle, Settings, Minimize2, Target } from 'lucide-react';
import { Switch } from '@/app/components/ui/switch';

declare global {
  interface Window {
    electronAPI?: {
      setIgnoreMouseEvents: (ignore: boolean) => void;
    };
  }
}

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
    idle: { color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Idle' },
    analyzing: { color: 'text-cyan-400', bg: 'bg-cyan-500/20', label: 'Analyzing', pulse: true },
    ready: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Ready' },
  };

  const config = statusConfig[engineStatus];

  // Evaluation bar percentage
  const maxCentipawns = 1000;
  const clampedScore = Math.max(-maxCentipawns, Math.min(maxCentipawns, score));
  const whitePercentage = ((clampedScore + maxCentipawns) / (2 * maxCentipawns)) * 100;
  const displayScore = Math.abs(score / 100).toFixed(1);

  // Helper for Electron click-through
  const setIgnoreMouseEvents = (ignore: boolean) => {
    if (window.electronAPI) {
      console.log('Setting ignore mouse events:', ignore);
      window.electronAPI.setIgnoreMouseEvents(ignore);
    }
  };

  // For buttons - disable click-through when hovering
  const interactiveHandlers = {
    onMouseEnter: () => setIgnoreMouseEvents(false),
    onMouseLeave: () => setIgnoreMouseEvents(false), // Keep it false to ensure buttons work
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top Bar */}
      <div
        className="absolute top-0 left-0 right-0 px-6 py-3 bg-slate-900/20 backdrop-blur-xl border-b border-white/10 shadow-lg z-50"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        {...interactiveHandlers}
      >
        <div className="flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400/15 to-blue-500/15 border border-white/20 backdrop-blur-xl">
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


          </div>

          {/* Right: Controls */}
          <div className="flex gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <button
              onClick={onSettingsClick}
              className="p-2 rounded-xl bg-slate-800/50 backdrop-blur-3xl border border-white/20 hover:border-white/40 hover:bg-slate-700/50 transition-all shadow-lg"
              title="Settings (Ctrl+S)"
            >
              <Settings className="w-4 h-4 text-white/80 hover:text-white" />
            </button>

            <button
              onClick={onMinimizeClick}
              className="p-2 rounded-xl bg-slate-800/50 backdrop-blur-3xl border border-white/20 hover:border-red-300/50 hover:bg-slate-700/50 transition-all shadow-lg"
              title="Minimize HUD (Ctrl+H)"
            >
              <Minimize2 className="w-4 h-4 text-white/80 hover:text-red-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Left: Evaluation Bar */}
      <div
        className="absolute left-6 top-24 bottom-6 w-12 z-40 pointer-events-auto"
        {...interactiveHandlers}
      >
        <div className="flex flex-col items-center gap-2 h-full">
          <div className="relative w-full flex-1 rounded-2xl overflow-hidden border border-white/15 bg-slate-900/20 backdrop-blur-2xl shadow-lg">
            {/* White advantage (bottom) */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/90 to-white/60 transition-all duration-500"
              style={{ height: `${whitePercentage}%` }}
            />

            {/* Black advantage (top) */}
            <div
              className="absolute top-0 left-0 right-0 bg-gradient-to-b from-gray-900/80 to-gray-800/60 transition-all duration-500"
              style={{ height: `${100 - whitePercentage}%` }}
            />

            {/* Score indicator */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-full h-0.5 bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)] transition-all duration-500"
              style={{ top: `${100 - whitePercentage}%` }}
            />
          </div>

          {/* Score display */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/20 backdrop-blur-2xl border border-white/15 shadow-lg">
            <p className="text-xs font-mono text-white">
              {score >= 0 ? '+' : ''}{displayScore}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Best Move & Top Moves Panel */}
      <div
        className="absolute right-6 top-24 bottom-6 w-80 z-40 pointer-events-auto"
        {...interactiveHandlers}
      >
        <div className="h-full p-4 bg-slate-900/20 backdrop-blur-3xl border border-white/15 rounded-2xl flex flex-col gap-4 shadow-xl">
          {/* Auto Move Toggle */}
          <div className="p-3 rounded-2xl bg-black/20 border border-white/10 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-green-400/15 border border-white/20">
                  <Target className="w-4 h-4 text-green-300" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white">Auto-Move</h3>
                  <p className="text-xs text-white/50">Auto execute</p>
                </div>
              </div>
              <Switch
                checked={autoMoveEnabled}
                onCheckedChange={onAutoMoveChange}
              />
            </div>
          </div>

          {/* Best Move Section */}
          <div className="rounded-2xl bg-gradient-to-br from-green-400/12 to-cyan-400/12 border border-white/20 backdrop-blur-xl p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-300" />
              <h3 className="text-sm font-semibold text-white">Best Move</h3>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-300 font-mono tracking-wider">
                {bestMove}
              </span>
              <div className="flex items-center gap-1 text-green-300">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-white/60 mt-2">
              Evaluation: {score >= 0 ? '+' : ''}{(score / 100).toFixed(2)}
            </p>
          </div>

          {/* Top Moves Section */}
          <div className="flex-1 rounded-2xl bg-black/20 backdrop-blur-2xl border border-white/10 p-4 overflow-hidden flex flex-col shadow-lg">
            <h3 className="text-sm font-semibold text-white mb-3">Top Candidate Moves</h3>

            <div className="flex-1 overflow-y-auto space-y-2">
              {topMoves.map((move, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-xl border transition-all backdrop-blur-xl ${move.isBest
                    ? 'bg-green-400/8 border-green-300/30 hover:bg-green-400/12'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-mono font-semibold text-white">
                      {index + 1}. {move.notation}
                    </span>
                    <span className={`text-xs font-mono ${move.evaluation >= 0 ? 'text-green-300' : 'text-red-300'
                      }`}>
                      {move.evaluation >= 0 ? '+' : ''}{(move.evaluation / 100).toFixed(2)}
                    </span>
                  </div>

                  {move.centipawnLoss !== undefined && move.centipawnLoss > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3 text-yellow-300" />
                      <span className="text-xs text-yellow-300/90">
                        Loss: -{(move.centipawnLoss / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Engine Info */}
          <div className="text-xs text-white/50 text-center">
            <p>Powered by Chess AI Engine</p>
          </div>
        </div>
      </div>

      {/* Bottom: Keyboard shortcuts */}
      <div
        className="absolute bottom-6 left-24 px-3 py-2 rounded-xl bg-slate-900/20 backdrop-blur-2xl border border-white/15 shadow-lg z-40 pointer-events-auto"
        {...interactiveHandlers}
      >
        <div className="text-xs text-white/60 space-y-1">
          <p>Ctrl+H: Toggle HUD</p>
          <p>Ctrl+S: Settings</p>
          <p>Ctrl+B: Toggle Scores</p>
        </div>
      </div>
    </div>
  );
}