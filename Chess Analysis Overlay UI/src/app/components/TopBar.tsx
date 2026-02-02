import { motion } from 'motion/react';
import { Play, Pause, Eye, EyeOff, Settings } from 'lucide-react';

interface TopBarProps {
  isRunning: boolean;
  isVisible: boolean;
  onToggleRun: () => void;
  onToggleVisibility: () => void;
}

export function TopBar({ isRunning, isVisible, onToggleRun, onToggleVisibility }: TopBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-2xl bg-black/30 border border-white/10 rounded-full px-4 py-2 shadow-2xl"
      style={{
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5">
          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-xs text-white/70 font-medium">
            {isRunning ? 'Active' : 'Paused'}
          </span>
        </div>

        <div className="w-px h-6 bg-white/10" />

        {/* Controls */}
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleRun}
            className="p-2 rounded-lg transition-colors"
            title={isRunning ? 'Pause' : 'Start'}
          >
            {isRunning ? (
              <Pause className="w-4 h-4 text-white/80" />
            ) : (
              <Play className="w-4 h-4 text-white/80" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleVisibility}
            className="p-2 rounded-lg transition-colors"
            title={isVisible ? 'Hide overlay' : 'Show overlay'}
          >
            {isVisible ? (
              <Eye className="w-4 h-4 text-white/80" />
            ) : (
              <EyeOff className="w-4 h-4 text-white/80" />
            )}
          </motion.button>

          <div className="w-px h-6 bg-white/10 mx-1" />

          <motion.button
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-white/80" />
          </motion.button>
        </div>

        <div className="w-px h-6 bg-white/10" />

        {/* Timer */}
        <div className="px-3 py-1 text-sm font-mono text-white/70">
          00:45
        </div>
      </div>
    </motion.div>
  );
}
