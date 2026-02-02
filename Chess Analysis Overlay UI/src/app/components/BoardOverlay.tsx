import { motion } from 'motion/react';

interface Move {
  from: { row: number; col: number };
  to: { row: number; col: number };
  type: 'best' | 'alternative';
}

interface BoardOverlayProps {
  moves: Move[];
  squareSize: number;
}

export function BoardOverlay({ moves, squareSize }: BoardOverlayProps) {
  const getPosition = (row: number, col: number) => ({
    left: col * squareSize + squareSize / 2,
    top: row * squareSize + squareSize / 2,
  });

  const drawArrow = (from: { row: number; col: number }, to: { row: number; col: number }, isBest: boolean) => {
    const fromPos = getPosition(from.row, from.col);
    const toPos = getPosition(to.row, to.col);
    
    const dx = toPos.left - fromPos.left;
    const dy = toPos.top - fromPos.top;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const length = Math.sqrt(dx * dx + dy * dy);

    return (
      <motion.div
        key={`${from.row}-${from.col}-${to.row}-${to.col}`}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute pointer-events-none"
        style={{
          left: fromPos.left,
          top: fromPos.top,
          width: length,
          height: 8,
          transformOrigin: '0 50%',
          transform: `rotate(${angle}deg)`,
        }}
      >
        {/* Arrow shaft */}
        <div
          className={`h-full rounded-full ${
            isBest 
              ? 'bg-gradient-to-r from-cyan-400/80 to-cyan-500/60' 
              : 'bg-gradient-to-r from-yellow-400/50 to-yellow-500/30'
          }`}
          style={{
            boxShadow: isBest 
              ? '0 0 20px rgba(6, 182, 212, 0.6), 0 0 40px rgba(6, 182, 212, 0.3)' 
              : '0 0 15px rgba(234, 179, 8, 0.4)',
          }}
        />
        
        {/* Arrow head */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: `20px solid ${isBest ? 'rgb(34 211 238 / 0.8)' : 'rgb(234 179 8 / 0.6)'}`,
            borderTop: '10px solid transparent',
            borderBottom: '10px solid transparent',
            filter: isBest 
              ? 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8))' 
              : 'drop-shadow(0 0 6px rgba(234, 179, 8, 0.6))',
          }}
        />

        {/* Animated pulse for best move */}
        {isBest && (
          <motion.div
            className="absolute inset-0 bg-cyan-400/30 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.2, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>
    );
  };

  const drawHighlight = (row: number, col: number, isBest: boolean) => {
    const pos = getPosition(row, col);
    
    return (
      <motion.div
        key={`highlight-${row}-${col}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: [0.6, 0.3, 0.6],
          scale: [0.9, 1, 0.9],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute pointer-events-none"
        style={{
          left: pos.left - squareSize / 2,
          top: pos.top - squareSize / 2,
          width: squareSize,
          height: squareSize,
        }}
      >
        <div
          className={`w-full h-full rounded-lg border-4 ${
            isBest ? 'border-cyan-400' : 'border-yellow-400'
          }`}
          style={{
            boxShadow: isBest
              ? '0 0 30px rgba(6, 182, 212, 0.6), inset 0 0 20px rgba(6, 182, 212, 0.3)'
              : '0 0 20px rgba(234, 179, 8, 0.5), inset 0 0 15px rgba(234, 179, 8, 0.2)',
          }}
        />
      </motion.div>
    );
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Draw highlights first (below arrows) */}
      {moves.map((move) => (
        <div key={`overlay-${move.from.row}-${move.from.col}-${move.to.row}-${move.to.col}`}>
          {drawHighlight(move.to.row, move.to.col, move.type === 'best')}
        </div>
      ))}
      
      {/* Draw arrows */}
      {moves.map((move) => drawArrow(move.from, move.to, move.type === 'best'))}
    </div>
  );
}
