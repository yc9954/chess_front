import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Play,
  Pause,
  EyeOff,
  Target,
  Clock,
  ChevronDown,
  Keyboard,
  Crown,
} from 'lucide-react';
import type { AnalysisState } from '@/app/App';
import { MovesList } from './MovesList';
import { WinProbabilityGraph } from './WinProbabilityGraph';
import { ControlPanel } from './ControlPanel';

interface TransparentOverlayProps {
  state: AnalysisState;
  onToggleRun: () => void;
  onToggleAutoMove: () => void;
  onDelayChange: (delay: number) => void;
  onToggleVisibility: () => void;
}

export function TransparentOverlay({
  state,
  onToggleRun,
  onToggleAutoMove,
  onDelayChange,
  onToggleVisibility,
}: TransparentOverlayProps) {
  const [expandedSections, setExpandedSections] = useState({
    moves: true,
    graph: false,
    shortcuts: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getEvalIcon = () => {
    if (state.evaluation > 2) return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (state.evaluation < -2) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-white/40" />;
  };

  const evalPercentage = Math.min(100, Math.max(0, ((state.evaluation + 10) / 20) * 100));

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-[#0d0d14]/95 backdrop-blur-2xl border-l border-white/[0.06]">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Crown className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white/90 tracking-tight">Chess AI</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${state.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
              <span className="text-[10px] text-white/40 uppercase tracking-wider">
                {state.isRunning ? 'Analyzing' : 'Paused'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleRun}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            title={state.isRunning ? 'Pause (Ctrl+Shift+S)' : 'Start (Ctrl+Shift+S)'}
          >
            {state.isRunning ? (
              <Pause className="w-4 h-4 text-white/50" />
            ) : (
              <Play className="w-4 h-4 text-white/50" />
            )}
          </button>
          <button
            onClick={onToggleVisibility}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            title="Hide (Ctrl+Shift+X)"
          >
            <EyeOff className="w-4 h-4 text-white/50" />
          </button>
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Best Move */}
        <div className="px-5 py-5">
          <div className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Best Move</div>
          <div className="flex items-end justify-between">
            <motion.div
              key={state.bestMove}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-mono font-bold text-cyan-400 tracking-tight"
              style={{
                textShadow: '0 0 30px rgba(6, 182, 212, 0.3)',
              }}
            >
              {state.bestMove}
            </motion.div>
            <div className="flex items-center gap-2 pb-1">
              {getEvalIcon()}
              <span className="text-lg font-mono text-white/80">
                {state.evaluation > 0 ? '+' : ''}{state.evaluation.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Evaluation Bar */}
        <div className="px-5 pb-4">
          <div className="relative h-2 rounded-full overflow-hidden bg-white/[0.04]">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500/60 via-white/20 to-emerald-500/60 rounded-full"
              style={{ width: '100%' }}
            />
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-cyan-400"
              animate={{ left: `calc(${evalPercentage}% - 6px)` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              style={{
                boxShadow: '0 0 8px rgba(6, 182, 212, 0.6)',
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] text-white/20">Black</span>
            <span className="text-[9px] text-white/20">White</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-0 border-y border-white/[0.06]">
          <div className="px-4 py-3 border-r border-white/[0.06]">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="w-3 h-3 text-cyan-400/60" />
              <span className="text-[10px] text-white/30 uppercase tracking-wider">Depth</span>
            </div>
            <div className="text-lg font-mono font-semibold text-white/80">{state.depth}</div>
          </div>
          <div className="px-4 py-3 border-r border-white/[0.06]">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3 h-3 text-emerald-400/60" />
              <span className="text-[10px] text-white/30 uppercase tracking-wider">Win</span>
            </div>
            <div className="text-lg font-mono font-semibold text-white/80">{Math.round(state.winRate)}%</div>
          </div>
          <div className="px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3 h-3 text-orange-400/60" />
              <span className="text-[10px] text-white/30 uppercase tracking-wider">Time</span>
            </div>
            <div className="text-lg font-mono font-semibold text-white/80">{formatTime(state.elapsedTime)}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <ControlPanel
            isAutoMoveEnabled={state.isAutoMove}
            onToggleAutoMove={onToggleAutoMove}
            delay={state.delay}
            onDelayChange={onDelayChange}
          />
        </div>

        {/* Move History - Collapsible */}
        <div className="border-b border-white/[0.06]">
          <button
            onClick={() => toggleSection('moves')}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors"
          >
            <span className="text-xs text-white/50 uppercase tracking-wider">Move History</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/20">{state.moves.length} moves</span>
              <motion.div
                animate={{ rotate: expandedSections.moves ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-3.5 h-3.5 text-white/20" />
              </motion.div>
            </div>
          </button>
          <AnimatePresence>
            {expandedSections.moves && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-4">
                  <MovesList moves={state.moves} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Win Probability Graph - Collapsible */}
        <div className="border-b border-white/[0.06]">
          <button
            onClick={() => toggleSection('graph')}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors"
          >
            <span className="text-xs text-white/50 uppercase tracking-wider">Win Probability</span>
            <motion.div
              animate={{ rotate: expandedSections.graph ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-3.5 h-3.5 text-white/20" />
            </motion.div>
          </button>
          <AnimatePresence>
            {expandedSections.graph && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-4">
                  <WinProbabilityGraph data={state.winHistory} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Keyboard Shortcuts - Collapsible */}
        <div className="border-b border-white/[0.06]">
          <button
            onClick={() => toggleSection('shortcuts')}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Keyboard className="w-3.5 h-3.5 text-white/20" />
              <span className="text-xs text-white/50 uppercase tracking-wider">Shortcuts</span>
            </div>
            <motion.div
              animate={{ rotate: expandedSections.shortcuts ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-3.5 h-3.5 text-white/20" />
            </motion.div>
          </button>
          <AnimatePresence>
            {expandedSections.shortcuts && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-4 space-y-2">
                  {[
                    { keys: 'Ctrl+Shift+X', action: 'Toggle Panel' },
                    { keys: 'Ctrl+Shift+S', action: 'Start / Pause' },
                    { keys: 'Ctrl+Shift+A', action: 'Auto-Move' },
                  ].map(shortcut => (
                    <div key={shortcut.keys} className="flex items-center justify-between">
                      <span className="text-xs text-white/40">{shortcut.action}</span>
                      <kbd className="text-[10px] font-mono text-white/30 bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5">
                        {shortcut.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-cyan-400/40" />
          <span className="text-[10px] text-white/20">Stockfish NNUE</span>
        </div>
        <span className="text-[10px] text-white/15 font-mono">v0.1.0</span>
      </div>
    </div>
  );
}
