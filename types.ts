
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Color = 'w' | 'b';

export interface Move {
  from: string;
  to: string;
  promotion?: string;
  san?: string;
}

export interface GameStats {
  gameNumber: number;
  winner: 'AgentX' | 'BestPlayer' | 'Draw' | null;
  movesCount: number;
  agentXReward: number;
  qTableSize: number;
  epsilon: number;
}

export interface LearningMetrics {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  history: GameStats[];
}
