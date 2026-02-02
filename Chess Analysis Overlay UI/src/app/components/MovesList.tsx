import type { MoveRecord } from '@/app/App';

interface MovesListProps {
  moves: MoveRecord[];
}

export function MovesList({ moves }: MovesListProps) {
  return (
    <div className="space-y-0.5 max-h-40 overflow-y-auto">
      {moves.map((move) => (
        <div
          key={move.number}
          className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/[0.02] transition-colors"
        >
          <span className="text-[10px] text-white/20 w-4 text-right font-mono">{move.number}.</span>
          <div className="flex-1 flex items-center gap-2">
            <span className="font-mono text-xs text-white/70">{move.white}</span>
            <span className="text-white/10">-</span>
            <span className="font-mono text-xs text-white/40">{move.black}</span>
          </div>
          <span className={`text-[10px] font-mono ${move.evaluation > 0 ? 'text-emerald-400/60' : move.evaluation < 0 ? 'text-red-400/60' : 'text-white/20'}`}>
            {move.evaluation > 0 ? '+' : ''}{move.evaluation.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}
