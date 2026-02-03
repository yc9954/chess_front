import React from 'react';
import { ChessArrow } from './ChessArrow';
import { SquareHighlight } from './SquareHighlight';
import { ScoreBadge } from './ScoreBadge';

interface Arrow {
  from: { row: number; col: number };
  to: { row: number; col: number };
  type: 'best' | 'alternative' | 'threat';
}

interface Highlight {
  row: number;
  col: number;
  type: 'best' | 'alternative' | 'threat' | 'check';
}

interface PieceScore {
  row: number;
  col: number;
  value: number;
}

interface ChessBoardAnalysisProps {
  arrows?: Arrow[];
  highlights?: Highlight[];
  pieceScores?: PieceScore[];
  squareSize?: number;
  showScores?: boolean;
}

export function ChessBoardAnalysis({
  arrows = [],
  highlights = [],
  pieceScores = [],
  squareSize = 80,
  showScores = false,
}: ChessBoardAnalysisProps) {
  const boardSize = squareSize * 8;
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        width={boardSize}
        height={boardSize}
        className="w-full h-full"
        style={{ mixBlendMode: 'normal' }}
      >
        {/* Render highlights first (behind arrows) */}
        {highlights.map((highlight, index) => (
          <SquareHighlight
            key={`highlight-${index}`}
            row={highlight.row}
            col={highlight.col}
            type={highlight.type}
            squareSize={squareSize}
          />
        ))}
        
        {/* Render arrows */}
        {arrows.map((arrow, index) => (
          <ChessArrow
            key={`arrow-${index}`}
            from={arrow.from}
            to={arrow.to}
            type={arrow.type}
            squareSize={squareSize}
          />
        ))}
        
        {/* Render score badges */}
        {showScores && pieceScores.map((score, index) => (
          <ScoreBadge
            key={`score-${index}`}
            row={score.row}
            col={score.col}
            value={score.value}
            squareSize={squareSize}
          />
        ))}
      </svg>
    </div>
  );
}
