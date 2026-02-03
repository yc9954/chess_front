import React from 'react';

interface ScoreBadgeProps {
  row: number;
  col: number;
  value: number;
  squareSize: number;
}

export function ScoreBadge({ row, col, value, squareSize }: ScoreBadgeProps) {
  const x = col * squareSize + squareSize - 24;
  const y = row * squareSize + 4;
  
  const isPositive = value >= 0;
  const displayValue = Math.abs(value / 100).toFixed(1);
  
  return (
    <g className="score-badge">
      {/* Background */}
      <rect
        x={x}
        y={y}
        width="20"
        height="16"
        rx="4"
        fill="rgba(0, 0, 0, 0.8)"
        className="transition-all duration-300"
      />
      
      {/* Border glow */}
      <rect
        x={x}
        y={y}
        width="20"
        height="16"
        rx="4"
        fill="none"
        stroke={isPositive ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)'}
        strokeWidth="1"
        className="transition-all duration-300"
      />
      
      {/* Text */}
      <text
        x={x + 10}
        y={y + 11}
        textAnchor="middle"
        fill={isPositive ? '#22c55e' : '#ef4444'}
        fontSize="9"
        fontFamily="monospace"
        fontWeight="600"
        className="transition-all duration-300"
      >
        {isPositive ? '+' : '-'}{displayValue}
      </text>
    </g>
  );
}
