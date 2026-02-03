import React from 'react';

interface EvaluationBarProps {
  score: number; // centipawn score (positive for white, negative for black)
}

export function EvaluationBar({ score }: EvaluationBarProps) {
  // Convert centipawn to percentage (capped at ±10 pawns)
  const maxCentipawns = 1000;
  const clampedScore = Math.max(-maxCentipawns, Math.min(maxCentipawns, score));
  const whitePercentage = ((clampedScore + maxCentipawns) / (2 * maxCentipawns)) * 100;
  
  const displayScore = Math.abs(score / 100).toFixed(1);
  
  return (
    <div className="flex flex-col items-center gap-2 h-full">
      <div className="relative w-8 flex-1 rounded-2xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-2xl shadow-lg">
        {/* White advantage (bottom) */}
        <div 
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/90 to-white/60 transition-all duration-500"
          style={{ height: `${whitePercentage}%` }}
        />
        
        {/* Black advantage (top) */}
        <div 
          className="absolute top-0 left-0 right-0 bg-gradient-to-b from-gray-900/80 to-gray-800/60 transition-all duration-500"
          style={{ height: `${100 - whitePercentage}%` }}
        />
        
        {/* Score indicator */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 w-full h-0.5 bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)] transition-all duration-500"
          style={{ top: `${100 - whitePercentage}%` }}
        />
      </div>
      
      {/* Score display */}
      <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-lg">
        <p className="text-xs font-mono text-white">
          {score >= 0 ? '+' : ''}{displayScore}
        </p>
      </div>
    </div>
  );
}