import React from 'react';

interface ChessArrowProps {
  from: { row: number; col: number };
  to: { row: number; col: number };
  type: 'best' | 'alternative' | 'threat';
  squareSize: number;
}

export function ChessArrow({ from, to, type, squareSize }: ChessArrowProps) {
  const colors = {
    best: { stroke: 'rgba(34, 197, 94, 0.8)', glow: 'rgba(34, 197, 94, 0.4)' },
    alternative: { stroke: 'rgba(96, 165, 250, 0.8)', glow: 'rgba(96, 165, 250, 0.4)' },
    threat: { stroke: 'rgba(239, 68, 68, 0.8)', glow: 'rgba(239, 68, 68, 0.4)' },
  };
  
  const color = colors[type];
  
  // Calculate positions (center of squares)
  const startX = from.col * squareSize + squareSize / 2;
  const startY = from.row * squareSize + squareSize / 2;
  const endX = to.col * squareSize + squareSize / 2;
  const endY = to.row * squareSize + squareSize / 2;
  
  // Calculate angle for arrowhead
  const angle = Math.atan2(endY - startY, endX - startX);
  const arrowLength = 20;
  const arrowWidth = 15;
  
  // Shorten the line to accommodate arrowhead
  const shortenBy = 25;
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const ratio = (length - shortenBy) / length;
  const adjustedEndX = startX + dx * ratio;
  const adjustedEndY = startY + dy * ratio;
  
  // Arrowhead points
  const arrowPoint1X = endX - arrowLength * Math.cos(angle - Math.PI / 6);
  const arrowPoint1Y = endY - arrowLength * Math.sin(angle - Math.PI / 6);
  const arrowPoint2X = endX - arrowLength * Math.cos(angle + Math.PI / 6);
  const arrowPoint2Y = endY - arrowLength * Math.sin(angle + Math.PI / 6);
  
  return (
    <g className="chess-arrow">
      {/* Glow effect */}
      <line
        x1={startX}
        y1={startY}
        x2={adjustedEndX}
        y2={adjustedEndY}
        stroke={color.glow}
        strokeWidth="12"
        strokeLinecap="round"
        filter="blur(4px)"
      />
      
      {/* Main line */}
      <line
        x1={startX}
        y1={startY}
        x2={adjustedEndX}
        y2={adjustedEndY}
        stroke={color.stroke}
        strokeWidth="6"
        strokeLinecap="round"
        className="transition-all duration-300"
      />
      
      {/* Arrowhead */}
      <path
        d={`M ${endX} ${endY} L ${arrowPoint1X} ${arrowPoint1Y} L ${arrowPoint2X} ${arrowPoint2Y} Z`}
        fill={color.stroke}
        className="transition-all duration-300"
      />
      
      {/* Arrowhead glow */}
      <path
        d={`M ${endX} ${endY} L ${arrowPoint1X} ${arrowPoint1Y} L ${arrowPoint2X} ${arrowPoint2Y} Z`}
        fill={color.glow}
        filter="blur(4px)"
      />
    </g>
  );
}
