import React from 'react';

interface SquareHighlightProps {
  row: number;
  col: number;
  type: 'best' | 'alternative' | 'threat' | 'check';
  squareSize: number;
}

export function SquareHighlight({ row, col, type, squareSize }: SquareHighlightProps) {
  const highlightConfig = {
    best: {
      border: 'rgba(34, 197, 94, 0.8)',
      bg: 'rgba(34, 197, 94, 0.15)',
      glow: 'rgba(34, 197, 94, 0.6)',
    },
    alternative: {
      border: 'rgba(96, 165, 250, 0.8)',
      bg: 'rgba(96, 165, 250, 0.15)',
      glow: 'rgba(96, 165, 250, 0.6)',
    },
    threat: {
      border: 'rgba(239, 68, 68, 0.8)',
      bg: 'rgba(239, 68, 68, 0.15)',
      glow: 'rgba(239, 68, 68, 0.6)',
    },
    check: {
      border: 'rgba(234, 179, 8, 0.9)',
      bg: 'rgba(234, 179, 8, 0.2)',
      glow: 'rgba(234, 179, 8, 0.7)',
    },
  };
  
  const config = highlightConfig[type];
  const x = col * squareSize;
  const y = row * squareSize;
  
  return (
    <g className="square-highlight">
      {/* Outer glow */}
      <rect
        x={x}
        y={y}
        width={squareSize}
        height={squareSize}
        fill={config.glow}
        opacity="0.3"
        filter="blur(8px)"
        className="transition-all duration-300"
      />
      
      {/* Background fill */}
      <rect
        x={x + 2}
        y={y + 2}
        width={squareSize - 4}
        height={squareSize - 4}
        fill={config.bg}
        rx="4"
        className="transition-all duration-300"
      />
      
      {/* Border */}
      <rect
        x={x + 2}
        y={y + 2}
        width={squareSize - 4}
        height={squareSize - 4}
        fill="none"
        stroke={config.border}
        strokeWidth="2"
        rx="4"
        className="transition-all duration-300"
      />
    </g>
  );
}
