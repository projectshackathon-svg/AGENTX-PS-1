
import React from 'react';

interface BoardProps {
  fen: string;
  lastMove?: { from: string; to: string } | null;
}

const Board: React.FC<BoardProps> = ({ fen, lastMove }) => {
  const boardLayout = fen.split(' ')[0];
  const rows = boardLayout.split('/');

  const getPieceSymbol = (char: string) => {
    const symbols: Record<string, string> = {
      'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
      'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
    };
    return symbols[char] || '';
  };

  const parsedRows: (string | null)[][] = rows.map(row => {
    const squares: (string | null)[] = [];
    for (const char of row) {
      if (isNaN(parseInt(char))) {
        squares.push(char);
      } else {
        for (let i = 0; i < parseInt(char); i++) squares.push(null);
      }
    }
    return squares;
  });

  return (
    <div className="grid grid-cols-8 grid-rows-8 w-full max-w-[400px] aspect-square border-4 border-slate-700 shadow-2xl rounded-sm overflow-hidden">
      {parsedRows.map((row, rIdx) => 
        row.map((piece, cIdx) => {
          const isDark = (rIdx + cIdx) % 2 === 1;
          const squareName = `${String.fromCharCode(97 + cIdx)}${8 - rIdx}`;
          const isHighlight = lastMove && (lastMove.from === squareName || lastMove.to === squareName);
          
          return (
            <div 
              key={`${rIdx}-${cIdx}`}
              className={`flex items-center justify-center text-4xl sm:text-5xl select-none relative
                ${isDark ? 'bg-slate-600' : 'bg-slate-300 text-slate-900'}
                ${isHighlight ? 'ring-4 ring-yellow-400 ring-inset opacity-90' : ''}
              `}
            >
              {piece && (
                <span className={`drop-shadow-md ${piece === piece.toUpperCase() ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]' : 'text-black'}`}>
                  {getPieceSymbol(piece)}
                </span>
              )}
              <span className="absolute bottom-0 left-0 text-[8px] opacity-30 p-0.5">
                {squareName}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
};

export default Board;
