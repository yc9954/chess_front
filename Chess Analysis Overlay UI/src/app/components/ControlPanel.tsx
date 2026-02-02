import { motion } from 'motion/react';
import { Play, Pause, Zap, Clock } from 'lucide-react';

interface ControlPanelProps {
  isAutoMoveEnabled: boolean;
  onToggleAutoMove: () => void;
  delay: number;
  onDelayChange: (delay: number) => void;
  onQuickAnalysis: () => void;
}

export function ControlPanel({
  isAutoMoveEnabled,
  onToggleAutoMove,
  delay,
  onDelayChange,
  onQuickAnalysis
}: ControlPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl p-5 shadow-2xl"
      style={{
        boxShadow: '0 0 30px rgba(6, 182, 212, 0.1), inset 0 0 15px rgba(255, 255, 255, 0.02)'
      }}
    >
      <div className="flex items-center gap-6">
        {/* Auto-Move Toggle */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-400 uppercase tracking-wider">Auto-Move</div>
          <button
            onClick={onToggleAutoMove}
            className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
              isAutoMoveEnabled 
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/50' 
                : 'bg-gray-700'
            }`}
          >
            <motion.div
              className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg ${
                isAutoMoveEnabled ? 'shadow-cyan-400/50' : ''
              }`}
              animate={{ left: isAutoMoveEnabled ? '34px' : '4px' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
            {isAutoMoveEnabled && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-0 rounded-full bg-cyan-400/20 animate-pulse"
              />
            )}
          </button>
          <div className="flex items-center gap-1">
            {isAutoMoveEnabled ? (
              <Play className="w-4 h-4 text-cyan-400" />
            ) : (
              <Pause className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="h-10 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent" />

        {/* Delay Slider */}
        <div className="flex-1 max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider">
              <Clock className="w-3 h-3" />
              Human-like Delay
            </div>
            <span className="text-xs font-mono text-cyan-400">{delay}ms</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="100"
              max="2000"
              step="100"
              value={delay}
              onChange={(e) => onDelayChange(Number(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer slider-thumb"
              style={{
                background: `linear-gradient(to right, rgb(6 182 212) 0%, rgb(6 182 212) ${((delay - 100) / 1900) * 100}%, rgb(55 65 81) ${((delay - 100) / 1900) * 100}%, rgb(55 65 81) 100%)`
              }}
            />
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="h-10 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent" />

        {/* Quick Analysis Button */}
        <motion.button
          onClick={onQuickAnalysis}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 rounded-lg text-white text-sm font-medium transition-all shadow-lg shadow-cyan-500/30 border border-cyan-400/30"
        >
          <Zap className="w-4 h-4" />
          Quick Analysis
        </motion.button>
      </div>
    </motion.div>
  );
}
