
import { Chess, Move as ChessMove } from 'chess.js';

export class ChessEngine {
  private game: Chess;

  constructor(fen?: string) {
    this.game = new Chess(fen);
  }

  getFen() {
    return this.game.fen();
  }

  getTurn() {
    return this.game.turn();
  }

  getLegalMoves() {
    return this.game.moves({ verbose: true });
  }

  makeMove(move: string | { from: string; to: string; promotion?: string }) {
    try {
      return this.game.move(move);
    } catch (e) {
      return null;
    }
  }

  isGameOver() {
    return this.game.isGameOver();
  }

  reset() {
    this.game.reset();
  }

  /**
   * Beginner Player Heuristic:
   * 1. If there's a checkmate move, take it.
   * 2. If there's a capture, take the most valuable piece.
   * 3. If there's a check, consider it.
   * 4. Otherwise, pick a random move.
   */
  public static getBestHeuristicMove(game: Chess): ChessMove {
    const moves = game.moves({ verbose: true });
    
    // 1. Check for checkmate
    for (const move of moves) {
      const temp = new Chess(game.fen());
      temp.move(move);
      if (temp.isCheckmate()) return move;
    }

    // 2. Check for captures (higher value first)
    const captures = moves.filter(m => m.captured);
    if (captures.length > 0) {
      const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
      captures.sort((a, b) => (pieceValues[b.captured!] || 0) - (pieceValues[a.captured!] || 0));
      return captures[0];
    }

    // 3. Check for giving check
    const checks = moves.filter(move => {
      const temp = new Chess(game.fen());
      temp.move(move);
      return temp.isCheck();
    });
    if (checks.length > 0) {
      return checks[Math.floor(Math.random() * checks.length)];
    }

    // 4. Random move
    return moves[Math.floor(Math.random() * moves.length)];
  }
}
