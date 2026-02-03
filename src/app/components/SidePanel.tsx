import React from 'react';
import { TrendingUp, ArrowRight, AlertTriangle } from 'lucide-react';

interface Move {
  notation: string;
  evaluation: number;
  centipawnLoss?: number;
  isBest?: boolean;
}

interface SidePanelProps {
  bestMove: string;
  topMoves: Move[];
  currentEvaluation: number;
}

export function SidePanel({ bestMove, topMoves, currentEvaluation }: SidePanelProps) {
  return (
    <div className="w-80 h-full p-4 bg-white/10 backdrop-blur-3xl border-l border-white/20 flex flex-col gap-4 shadow-xl">
      {/* Best Move Section */}
      <div className="rounded-2xl bg-gradient-to-br from-green-400/15 to-cyan-400/15 border border-white/30 backdrop-blur-xl p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-green-300" />
          <h3 className="text-sm font-semibold text-white">Best Move</h3>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-green-300 font-mono tracking-wider">
            {bestMove}
          </span>
          <div className="flex items-center gap-1 text-green-300">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
        <p className="text-xs text-white/60 mt-2">
          Evaluation: {currentEvaluation >= 0 ? '+' : ''}{(currentEvaluation / 100).toFixed(2)}
        </p>
      </div>
      
      {/* Top Moves Section */}
      <div className="flex-1 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/20 p-4 overflow-hidden flex flex-col shadow-lg">
        <h3 className="text-sm font-semibold text-white mb-3">Top Candidate Moves</h3>
        
        <div className="flex-1 overflow-y-auto space-y-2">
          {topMoves.map((move, index) => (
            <div
              key={index}
              className={`p-3 rounded-xl border transition-all backdrop-blur-xl ${
                move.isBest
                  ? 'bg-green-400/10 border-green-300/40 hover:bg-green-400/15'
                  : 'bg-white/10 border-white/20 hover:bg-white/15'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-mono font-semibold text-white">
                  {index + 1}. {move.notation}
                </span>
                <span className={`text-xs font-mono ${
                  move.evaluation >= 0 ? 'text-green-300' : 'text-red-300'
                }`}>
                  {move.evaluation >= 0 ? '+' : ''}{(move.evaluation / 100).toFixed(2)}
                </span>
              </div>
              
              {move.centipawnLoss !== undefined && move.centipawnLoss > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3 text-yellow-300" />
                  <span className="text-xs text-yellow-300/90">
                    Loss: -{(move.centipawnLoss / 100).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Engine Info */}
      <div className="text-xs text-white/50 text-center">
        <p>Powered by Chess AI Engine</p>
      </div>
    </div>
  );
}