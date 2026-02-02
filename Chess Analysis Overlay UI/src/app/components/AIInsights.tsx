import { motion } from 'motion/react';
import { Sparkles, Search, MessageSquare, Zap } from 'lucide-react';
import { FloatingPanel } from './FloatingPanel';

interface AIInsightsProps {
  bestMove: string;
  evaluation: number;
}

export function AIInsights({ bestMove, evaluation }: AIInsightsProps) {
  const suggestions = [
    { icon: Sparkles, text: `Play ${bestMove} for advantage`, color: 'text-cyan-400' },
    { icon: Search, text: 'Search opening database', color: 'text-blue-400' },
    { icon: MessageSquare, text: 'Analyze position deeply', color: 'text-purple-400' },
    { icon: Zap, text: 'Show tactical patterns', color: 'text-yellow-400' },
  ];

  return (
    <FloatingPanel className="p-5 w-96">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-medium text-white/90">AI Insights</h3>
      </div>

      {/* Current Position */}
      <div className="mb-4 pb-4 border-b border-white/10">
        <div className="text-xs text-white/50 mb-1">Current position</div>
        <div className="text-white/90 text-sm">
          Engine suggests <span className="font-mono text-cyan-400 font-semibold">{bestMove}</span> with 
          <span className={`ml-1 font-semibold ${evaluation > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {evaluation > 0 ? '+' : ''}{evaluation.toFixed(1)}
          </span> evaluation
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-1">
        <div className="text-xs text-white/50 mb-2">Suggested actions</div>
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
          >
            <suggestion.icon className={`w-4 h-4 flex-shrink-0 ${suggestion.color}`} />
            <span className="text-sm text-white/80">{suggestion.text}</span>
          </motion.button>
        ))}
      </div>
    </FloatingPanel>
  );
}
