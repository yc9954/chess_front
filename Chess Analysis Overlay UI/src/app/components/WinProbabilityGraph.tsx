import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from 'recharts';

const mockData = [
  { move: 1, white: 52, black: 48 },
  { move: 2, white: 51, black: 49 },
  { move: 3, white: 53, black: 47 },
  { move: 4, white: 55, black: 45 },
  { move: 5, white: 58, black: 42 },
  { move: 6, white: 56, black: 44 },
  { move: 7, white: 59, black: 41 },
  { move: 8, white: 62, black: 38 },
];

export function WinProbabilityGraph() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="backdrop-blur-xl bg-black/30 border border-white/10 rounded-2xl p-6 shadow-2xl"
      style={{
        boxShadow: '0 0 40px rgba(6, 182, 212, 0.1), inset 0 0 20px rgba(255, 255, 255, 0.02)'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-300 tracking-wider uppercase">
          Win Probability
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-400 rounded-full" />
            <span className="text-gray-400">White {mockData[mockData.length - 1].white}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-400 rounded-full" />
            <span className="text-gray-400">Black {mockData[mockData.length - 1].black}%</span>
          </div>
        </div>
      </div>

      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%" minHeight={128}>
          <AreaChart data={mockData}>
            <defs>
              <linearGradient id="whiteGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(6 182 212)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="rgb(6 182 212)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="blackGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(248 113 113)" stopOpacity={0} />
                <stop offset="100%" stopColor="rgb(248 113 113)" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="move" 
              stroke="#4b5563" 
              strokeWidth={0.5}
              tick={{ fill: '#6b7280', fontSize: 10 }}
            />
            <YAxis 
              domain={[0, 100]} 
              stroke="#4b5563" 
              strokeWidth={0.5}
              tick={{ fill: '#6b7280', fontSize: 10 }}
            />
            <Area
              type="monotone"
              dataKey="white"
              stroke="rgb(6 182 212)"
              strokeWidth={2}
              fill="url(#whiteGradient)"
            />
            <Area
              type="monotone"
              dataKey="black"
              stroke="rgb(248 113 113)"
              strokeWidth={2}
              fill="url(#blackGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}