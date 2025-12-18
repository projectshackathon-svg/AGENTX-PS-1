
import { Move as ChessMove } from 'chess.js';

export class AgentX {
  private qTable: Map<string, Map<string, number>> = new Map();
  private alpha = 0.9; // High learning rate for fast convergence
  private gamma = 0.8; // Focus more on immediate/near-term rewards
  public epsilon = 1.0;

  constructor() {}

  /**
   * REFINED FEATURE-BASED STATE
   * Focusing on key indicators of board strength to keep state space small but informative.
   */
  private getSimplifiedState(fen: string): string {
    const parts = fen.split(' ');
    const board = parts[0];
    
    // Feature 1: Material Difference (Categorized)
    const wCount = (board.match(/[RNQBP]/g) || []).length;
    const bCount = (board.match(/[rnqbp]/g) || []).length;
    const diff = wCount - bCount;
    const materialCategory = diff > 2 ? 'Strong' : diff > 0 ? 'Lead' : diff === 0 ? 'Equal' : 'Behind';

    // Feature 2: Queen Status
    const hasQueen = board.includes('Q') ? 'Y' : 'N';
    const oppHasQueen = board.includes('q') ? 'Y' : 'N';

    // Feature 3: Phase of game (approximate)
    const totalPieces = wCount + bCount;
    const phase = totalPieces > 20 ? 'Early' : totalPieces > 10 ? 'Mid' : 'Late';

    return `m:${materialCategory}_q:${hasQueen}${oppHasQueen}_p:${phase}`;
  }

  public getMove(fen: string, legalMoves: ChessMove[]): ChessMove {
    // DIRECTED EXPLORATION
    if (Math.random() < this.epsilon) {
      const captures = legalMoves.filter(m => m.captured);
      const promotions = legalMoves.filter(m => m.promotion);
      const checks = legalMoves.filter(m => m.san.includes('+'));
      
      // High priority to captures and promotions during exploration
      if (Math.random() < 0.8) {
        if (promotions.length > 0) return promotions[Math.floor(Math.random() * promotions.length)];
        if (captures.length > 0) {
          // Sort by value of captured piece
          const values: any = { p: 1, n: 3, b: 3, r: 5, q: 9 };
          captures.sort((a, b) => (values[b.captured!] || 0) - (values[a.captured!] || 0));
          return captures[0];
        }
        if (checks.length > 0) return checks[Math.floor(Math.random() * checks.length)];
      }
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }

    const state = this.getSimplifiedState(fen);
    const stateActions = this.qTable.get(state);
    
    if (!stateActions || stateActions.size === 0) {
      // Fallback to heuristic if no Q-values known
      const captures = legalMoves.filter(m => m.captured);
      if (captures.length > 0) return captures[0];
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }

    let bestMove = legalMoves[0];
    let maxQ = -Infinity;

    legalMoves.forEach(m => {
      const q = stateActions.get(m.san) || 0;
      if (q > maxQ) {
        maxQ = q;
        bestMove = m;
      }
    });

    return bestMove;
  }

  public updateQValue(
    prevStateFen: string, 
    actionSAN: string, 
    reward: number, 
    nextStateFen: string, 
    nextLegalMoves: string[]
  ) {
    const s1 = this.getSimplifiedState(prevStateFen);
    const s2 = this.getSimplifiedState(nextStateFen);

    if (!this.qTable.has(s1)) this.qTable.set(s1, new Map());
    const s1Actions = this.qTable.get(s1)!;
    const oldQ = s1Actions.get(actionSAN) || 0;

    let maxNextQ = 0;
    const s2Actions = this.qTable.get(s2);
    if (s2Actions && nextLegalMoves.length > 0) {
      maxNextQ = Math.max(...nextLegalMoves.map(m => s2Actions.get(m) || 0));
    }

    const newQ = oldQ + this.alpha * (reward + this.gamma * maxNextQ - oldQ);
    s1Actions.set(actionSAN, newQ);
  }

  public decayEpsilon(gameCount: number, maxGames: number) {
    // Faster decay to reach 50% exploitation by game 3
    // and 95% exploitation by game 7.
    const progress = gameCount / (maxGames - 1);
    this.epsilon = Math.max(0.05, 1.0 - (progress * 1.5)); 
  }

  public getQTableSize() {
    let size = 0;
    this.qTable.forEach(m => size += m.size);
    return size;
  }
}
