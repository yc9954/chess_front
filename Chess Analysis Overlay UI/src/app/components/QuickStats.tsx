import { motion } from 'motion/react';
import { TrendingUp, Clock, Target } from 'lucide-react';
import { FloatingPanel } from './FloatingPanel';

interface QuickStatsProps {
  depth: number;
  winRate: number;
  timeElapsed: string;
}

export function QuickStats({ depth, winRate, timeElapsed }: QuickStatsProps) {
  const stats = [
    { icon: Target, label: 'Depth', value: depth.toString(), color: 'text-cyan-400' },
    { icon: TrendingUp, label: 'Win Rate', value: `${winRate}%`, color: 'text-green-400' },
    { icon: Clock, label: 'Time', value: timeElapsed, color: 'text-orange-400' },
  ];

  return (
    <FloatingPanel className="p-4" delay={0.1}>
      <div className="flex items-center gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
            className="flex items-center gap-2"
          >
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <div>
              <div className="text-xs text-white/50">{stat.label}</div>
              <div className="text-sm font-semibold text-white/90">{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </FloatingPanel>
  );
}
