import { motion } from 'motion/react';
import { Sparkles, TrendingUp, TrendingDown, Minus, Play, Pause, Eye, Settings, Clock, Target } from 'lucide-react';

interface TransparentOverlayProps {
  bestMove: string;
  evaluation: number;
  depth: number;
  winRate: number;
  isRunning: boolean;
  onToggleRun: () => void;
}

export function TransparentOverlay({
  bestMove,
  evaluation,
  depth,
  winRate,
  isRunning,
  onToggleRun,
}: TransparentOverlayProps) {
  const getEvalIcon = () => {
    if (evaluation > 2) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (evaluation < -2) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const evalPercentage = Math.min(100, Math.max(0, ((evaluation + 10) / 20) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full backdrop-blur-2xl bg-black/25 border border-white/15 rounded-3xl shadow-2xl overflow-hidden"
      style={{
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="h-full flex flex-col p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white/90">Chess AI</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-xs text-white/70">{isRunning ? 'Active' : 'Paused'}</span>
          </div>
        </div>

        {/* Best Move - Large Display */}
        <div className="mb-6 p-5 bg-white/5 rounded-2xl border border-white/10">
          <div className="text-xs text-white/50 mb-2 uppercase tracking-wide">Best Move</div>
          <div className="text-5xl font-mono text-cyan-400 font-bold tracking-tight mb-2">
            {bestMove}
          </div>
          <div className="flex items-center gap-2 text-white/70">
            {getEvalIcon()}
            <span className="text-lg font-mono">
              {evaluation > 0 ? '+' : ''}{evaluation.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Evaluation Bar */}
        <div className="mb-6">
          <div className="text-xs text-white/50 mb-3 uppercase tracking-wide">Position Evaluation</div>
          <div className="relative h-3 bg-gradient-to-r from-red-500/40 via-gray-700/40 to-green-500/40 rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg shadow-white/50"
              animate={{ left: `${evalPercentage}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/40">
            <span>Black advantage</span>
            <span>White advantage</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 text-white/50 mb-1">
              <Target className="w-3 h-3" />
              <span className="text-xs uppercase tracking-wide">Depth</span>
            </div>
            <div className="text-2xl font-bold text-white/90">{depth}</div>
          </div>
          
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 text-white/50 mb-1">
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs uppercase tracking-wide">Win Rate</span>
            </div>
            <div className="text-2xl font-bold text-white/90">{winRate}%</div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto space-y-2">
          <motion.button
            whileHover={{ backgroundColor: 'rgba(6, 182, 212, 0.2)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onToggleRun}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500/20 border border-cyan-400/30 rounded-xl text-white/90 font-medium transition-colors"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Analysis</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Start Analysis</span>
              </>
            )}
          </motion.button>

          <div className="flex gap-2">
            <motion.button
              whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/70 text-sm transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Hide</span>
            </motion.button>

            <motion.button
              whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/70 text-sm transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
