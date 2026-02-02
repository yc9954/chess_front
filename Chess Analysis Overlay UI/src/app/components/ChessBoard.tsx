import { BoardOverlay } from './BoardOverlay';

const INITIAL_BOARD = [
  ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
  ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '♙', '', '', ''],
  ['', '', '', '', '', '♘', '', ''],
  ['♙', '♙', '♙', '♙', '', '♙', '♙', '♙'],
  ['♖', '♘', '♗', '♕', '♔', '♗', '', '♖'],
];

const SQUARE_SIZE = 80;

export function ChessBoard() {
  // Example moves for visualization
  const moves = [
    {
      from: { row: 6, col: 5 },
      to: { row: 4, col: 4 },
      type: 'best' as const,
    },
    {
      from: { row: 1, col: 4 },
      to: { row: 3, col: 4 },
      type: 'alternative' as const,
    },
  ];

  return (
    <div className="relative">
      {/* Chess Board */}
      <div 
        className="relative border-4 border-gray-800 shadow-2xl"
        style={{
          background: 'linear-gradient(145deg, #2d2d2d 0%, #1a1a1a 100%)',
        }}
      >
        <div className="grid grid-cols-8 grid-rows-8">
          {INITIAL_BOARD.map((row, rowIndex) =>
            row.map((piece, colIndex) => {
              const isLight = (rowIndex + colIndex) % 2 === 0;
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`flex items-center justify-center text-5xl ${
                    isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'
                  }`}
                  style={{
                    width: SQUARE_SIZE,
                    height: SQUARE_SIZE,
                  }}
                >
                  {piece}
                </div>
              );
            })
          )}
        </div>

        {/* Overlay for arrows and highlights */}
        <BoardOverlay moves={moves} squareSize={SQUARE_SIZE} />
      </div>

      {/* Coordinates */}
      <div className="absolute -left-6 top-0 h-full flex flex-col justify-around text-gray-500 text-xs font-mono">
        {[8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
          <div key={num}>{num}</div>
        ))}
      </div>
      <div className="absolute -bottom-6 left-0 w-full flex justify-around text-gray-500 text-xs font-mono">
        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((letter) => (
          <div key={letter}>{letter}</div>
        ))}
      </div>
    </div>
  );
}
