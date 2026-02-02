import { motion } from 'motion/react';
import { Play, Pause, Clock } from 'lucide-react';

interface ControlPanelProps {
  isAutoMoveEnabled: boolean;
  onToggleAutoMove: () => void;
  delay: number;
  onDelayChange: (delay: number) => void;
}

export function ControlPanel({
  isAutoMoveEnabled,
  onToggleAutoMove,
  delay,
  onDelayChange,
}: ControlPanelProps) {
  return (
    <div className="space-y-4">
      {/* Auto-Move Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAutoMoveEnabled ? (
            <Play className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <Pause className="w-3.5 h-3.5 text-white/30" />
          )}
          <span className="text-xs text-white/50">Auto-Move</span>
        </div>
        <button
          onClick={onToggleAutoMove}
          className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
            isAutoMoveEnabled
              ? 'bg-cyan-500/30 border border-cyan-400/40'
              : 'bg-white/[0.06] border border-white/[0.08]'
          }`}
        >
          <motion.div
            className={`absolute top-0.5 w-5 h-5 rounded-full ${
              isAutoMoveEnabled
                ? 'bg-cyan-400 shadow-lg shadow-cyan-400/30'
                : 'bg-white/20'
            }`}
            animate={{ left: isAutoMoveEnabled ? '22px' : '2px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {/* Delay Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-white/20" />
            <span className="text-[10px] text-white/30 uppercase tracking-wider">Delay</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400/70">{delay}ms</span>
        </div>
        <input
          type="range"
          min="100"
          max="2000"
          step="100"
          value={delay}
          onChange={(e) => onDelayChange(Number(e.target.value))}
          className="w-full h-1 rounded-full appearance-none cursor-pointer slider-thumb"
          style={{
            background: `linear-gradient(to right, rgb(6 182 212 / 0.5) 0%, rgb(6 182 212 / 0.5) ${((delay - 100) / 1900) * 100}%, rgba(255 255 255 / 0.06) ${((delay - 100) / 1900) * 100}%, rgba(255 255 255 / 0.06) 100%)`,
          }}
        />
      </div>
    </div>
  );
}
