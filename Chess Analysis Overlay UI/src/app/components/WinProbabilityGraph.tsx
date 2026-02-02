import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import type { WinHistoryPoint } from '@/app/App';

interface WinProbabilityGraphProps {
  data: WinHistoryPoint[];
}

export function WinProbabilityGraph({ data }: WinProbabilityGraphProps) {
  const lastPoint = data[data.length - 1];

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400/60" />
          <span className="text-[10px] text-white/30">White {lastPoint?.white}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-400/60" />
          <span className="text-[10px] text-white/30">Black {lastPoint?.black}%</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%" minHeight={112}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="whiteGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(6 182 212)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="rgb(6 182 212)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="blackGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(248 113 113)" stopOpacity={0} />
                <stop offset="100%" stopColor="rgb(248 113 113)" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="move"
              stroke="transparent"
              tick={{ fill: 'rgba(255,255,255,0.15)', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              stroke="transparent"
              tick={false}
              axisLine={false}
              tickLine={false}
              width={0}
            />
            <Area
              type="monotone"
              dataKey="white"
              stroke="rgb(6 182 212 / 0.5)"
              strokeWidth={1.5}
              fill="url(#whiteGrad)"
            />
            <Area
              type="monotone"
              dataKey="black"
              stroke="rgb(248 113 113 / 0.4)"
              strokeWidth={1.5}
              fill="url(#blackGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
