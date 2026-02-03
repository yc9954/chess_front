import React from 'react';

export function ChessMockBoard() {
  const squares = [];
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  
  // Simple chess pieces unicode
  const pieces = {
    // Initial position for demonstration
    '0-0': '♜', '0-1': '♞', '0-2': '♝', '0-3': '♛', '0-4': '♚', '0-5': '♝', '0-6': '♞', '0-7': '♜',
    '1-0': '♟', '1-1': '♟', '1-2': '♟', '1-3': '♟', '1-4': '♟', '1-5': '♟', '1-6': '♟', '1-7': '♟',
    '6-0': '♙', '6-1': '♙', '6-2': '♙', '6-3': '♙', '6-4': '♙', '6-5': '♙', '6-6': '♙', '6-7': '♙',
    '7-0': '♖', '7-1': '♘', '7-2': '♗', '7-3': '♕', '7-4': '♔', '7-5': '♗', '7-6': '♘', '7-7': '♖',
  };
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isLight = (row + col) % 2 === 0;
      const piece = pieces[`${row}-${col}`];
      
      squares.push(
        <div
          key={`${row}-${col}`}
          className={`relative flex items-center justify-center ${
            isLight ? 'bg-amber-100' : 'bg-amber-700'
          }`}
        >
          {piece && (
            <span className={`text-5xl select-none ${
              piece.charCodeAt(0) >= 9817 ? 'text-white drop-shadow-lg' : 'text-gray-900 drop-shadow-lg'
            }`}>
              {piece}
            </span>
          )}
          
          {/* File labels (bottom row) */}
          {row === 7 && (
            <span className={`absolute bottom-0.5 right-1 text-xs font-semibold ${
              isLight ? 'text-amber-700' : 'text-amber-100'
            }`}>
              {files[col]}
            </span>
          )}
          
          {/* Rank labels (left column) */}
          {col === 0 && (
            <span className={`absolute top-0.5 left-1 text-xs font-semibold ${
              isLight ? 'text-amber-700' : 'text-amber-100'
            }`}>
              {ranks[row]}
            </span>
          )}
        </div>
      );
    }
  }
  
  return (
    <div className="relative w-[640px] h-[640px] shadow-2xl">
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full border-4 border-amber-900">
        {squares}
      </div>
    </div>
  );
}
