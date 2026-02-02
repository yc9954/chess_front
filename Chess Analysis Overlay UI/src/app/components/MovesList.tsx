import { motion } from 'motion/react';
import { FloatingPanel } from './FloatingPanel';
import { ChevronRight } from 'lucide-react';

interface Move {
  number: number;
  white: string;
  black: string;
  evaluation: number;
}

const mockMoves: Move[] = [
  { number: 1, white: 'e4', black: 'c5', evaluation: 0.3 },
  { number: 2, white: 'Nf3', black: 'Nc6', evaluation: 0.4 },
  { number: 3, white: 'd4', black: 'cxd4', evaluation: 0.2 },
  { number: 4, white: 'Nxd4', black: 'Nf6', evaluation: 0.5 },
];

export function MovesList() {
  return (
    <FloatingPanel className="p-4 w-80" delay={0.15}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-white/90">Move History</h3>
        <span className="text-xs text-white/50">4 moves</span>
      </div>

      <div className="space-y-1 max-h-48 overflow-y-auto">
        {mockMoves.map((move, index) => (
          <motion.div
            key={move.number}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.03 }}
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors"
          >
            <span className="text-xs text-white/40 w-6">{move.number}.</span>
            <div className="flex-1 flex items-center gap-2">
              <span className="font-mono text-sm text-white/90">{move.white}</span>
              <ChevronRight className="w-3 h-3 text-white/30" />
              <span className="font-mono text-sm text-white/70">{move.black}</span>
            </div>
            <span className={`text-xs font-mono ${move.evaluation > 0 ? 'text-green-400' : 'text-white/50'}`}>
              {move.evaluation > 0 ? '+' : ''}{move.evaluation.toFixed(1)}
            </span>
          </motion.div>
        ))}
      </div>
    </FloatingPanel>
  );
}
