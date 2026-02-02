import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AnalysisHUDProps {
  evaluation: number; // -10 to +10
  bestMove: string;
  depth: number;
  winRate: number;
}

export function AnalysisHUD({ evaluation, bestMove, depth, winRate }: AnalysisHUDProps) {
  // Convert evaluation to percentage for the bar (0-100)
  const evalPercentage = Math.min(100, Math.max(0, ((evaluation + 10) / 20) * 100));
  
  const getEvalIcon = () => {
    if (evaluation > 2) return <TrendingUp className="w-4 h-4 text-cyan-400" />;
    if (evaluation < -2) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-80 h-full backdrop-blur-xl bg-black/30 border border-white/10 rounded-2xl p-6 shadow-2xl"
      style={{
        boxShadow: '0 0 40px rgba(6, 182, 212, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.02)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-medium text-gray-300 tracking-wider uppercase">
          Engine Analysis
        </h2>
        <div className="flex items-center gap-2 text-xs text-cyan-400">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          Live
        </div>
      </div>

      {/* Evaluation Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Evaluation</span>
          <div className="flex items-center gap-1">
            {getEvalIcon()}
            <span className="text-sm font-mono text-white">
              {evaluation > 0 ? '+' : ''}{evaluation.toFixed(1)}
            </span>
          </div>
        </div>
        
        {/* Vertical eval bar */}
        <div className="relative h-48 w-12 mx-auto bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg overflow-hidden border border-white/10">
          {/* White advantage (top) */}
          <motion.div
            className="absolute top-0 left-0 right-0 bg-gradient-to-b from-cyan-400/80 to-cyan-500/60"
            initial={{ height: '50%' }}
            animate={{ height: `${100 - evalPercentage}%` }}
            transition={{ type: 'spring', stiffness: 100 }}
          />
          
          {/* Black advantage (bottom) */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-400/80 to-red-500/60"
            initial={{ height: '50%' }}
            animate={{ height: `${evalPercentage}%` }}
            transition={{ type: 'spring', stiffness: 100 }}
          />
          
          {/* Center line */}
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/40 -translate-y-1/2" />
          
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>

      {/* Best Move Display */}
      <div className="mb-6 p-4 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl border border-cyan-500/20">
        <div className="text-xs text-gray-400 mb-2 tracking-wide">BEST MOVE</div>
        <div className="text-3xl font-mono text-cyan-400 tracking-tight font-bold">
          {bestMove}
        </div>
        <div className="mt-2 h-[1px] bg-gradient-to-r from-cyan-400/50 via-cyan-400/20 to-transparent" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-lg p-3 border border-white/5">
          <div className="text-xs text-gray-400 mb-1">Depth</div>
          <div className="text-xl font-mono text-white">{depth}</div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-3 border border-white/5">
          <div className="text-xs text-gray-400 mb-1">Win Rate</div>
          <div className="text-xl font-mono text-white">{winRate}%</div>
        </div>
      </div>

      {/* Subtle bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cyan-500/10 to-transparent pointer-events-none rounded-b-2xl" />
    </motion.div>
  );
}
