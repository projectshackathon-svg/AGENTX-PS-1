
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess, Move as ChessMove } from 'chess.js';
import { GoogleGenAI } from "@google/genai";
import Board from './components/Board';
import Explanation from './components/Explanation';
import { AgentX } from './services/AgentX';
import { ChessEngine } from './services/ChessGame';
import { GameStats, LearningMetrics } from './types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';

const MAX_CHALLENGE_GAMES = 20; 
const MOVE_DELAY = 25; // Slightly faster for 20 games
const ADVANTAGE_WIN_LIMIT = 4; 

const App: React.FC = () => {
  const [game, setGame] = useState(new Chess());
  const [currentMove, setCurrentMove] = useState<{from: string; to: string} | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [status, setStatus] = useState("Awaiting Challenge...");
  const [metrics, setMetrics] = useState<LearningMetrics>({
    totalGames: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    history: []
  });
  const [commentary, setCommentary] = useState("AgentX initializing. Goal: Dominate the 20-match season.");

  const agentRef = useRef(new AgentX());
  const trainingRef = useRef(false);

  const calculateMaterialBalance = (chessGame: Chess) => {
    let score = 0;
    const values: any = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    chessGame.board().forEach(row => row.forEach(sq => {
      if (sq) {
        const val = values[sq.type] || 0;
        score += sq.color === 'w' ? val : -val;
      }
    }));
    return score;
  };

  const getReward = (move: ChessMove, isAgentWinner: boolean, isGameOver: boolean, currentScore: number) => {
    if (isAgentWinner) return 50000;
    if (isGameOver && !isAgentWinner) return -20000;

    let reward = 0;
    if (move.captured) {
      const values: any = { p: 200, n: 600, b: 600, r: 1000, q: 3000 };
      reward += values[move.captured] || 0;
    }
    if (move.promotion) reward += 5000;
    if (move.san.includes('+')) reward += 500;
    reward += currentScore * 100;
    return reward;
  };

  const runGame = async (gameIndex: number): Promise<boolean> => {
    const localGame = new Chess();
    setGame(new Chess());
    agentRef.current.decayEpsilon(gameIndex, MAX_CHALLENGE_GAMES); 
    
    setStatus(`Match ${gameIndex + 1}/${MAX_CHALLENGE_GAMES}...`);
    let movesCount = 0;
    let totalReward = 0;
    let agentWon = false;

    while (!localGame.isGameOver() && movesCount < 120) {
      if (!trainingRef.current) break;

      const turn = localGame.turn();
      const fenBefore = localGame.fen();
      let move: ChessMove;

      if (turn === 'w') {
        move = agentRef.current.getMove(fenBefore, localGame.moves({ verbose: true }));
      } else {
        move = ChessEngine.getBestHeuristicMove(localGame);
      }

      const resultMove = localGame.move(move);
      if (!resultMove) break;

      setGame(new Chess(localGame.fen()));
      setCurrentMove({ from: resultMove.from, to: resultMove.to });
      movesCount++;

      const currentScore = calculateMaterialBalance(localGame);
      const isCheckmate = localGame.isCheckmate();
      const isAdvantageWin = currentScore >= ADVANTAGE_WIN_LIMIT;

      if ((isCheckmate && turn === 'w') || isAdvantageWin) {
        agentWon = true;
      }

      if (turn === 'w') {
        const reward = getReward(resultMove, agentWon, localGame.isGameOver() || agentWon, currentScore);
        totalReward += reward;
        agentRef.current.updateQValue(fenBefore, resultMove.san, reward, localGame.fen(), localGame.moves({ verbose: true }).map(m => m.san));
      }

      if (agentWon) break;
      await new Promise(r => setTimeout(r, MOVE_DELAY));
    }

    const winnerName = agentWon ? 'AgentX' : (localGame.isCheckmate() ? 'BestPlayer' : 'Draw');
    
    setMetrics(prev => ({
      ...prev,
      totalGames: prev.totalGames + 1,
      wins: winnerName === 'AgentX' ? prev.wins + 1 : prev.wins,
      losses: winnerName === 'BestPlayer' ? prev.losses + 1 : prev.losses,
      draws: winnerName === 'Draw' ? prev.draws + 1 : prev.draws,
      history: [...prev.history, {
        gameNumber: gameIndex + 1,
        winner: winnerName as any,
        movesCount,
        agentXReward: totalReward,
        qTableSize: agentRef.current.getQTableSize(),
        epsilon: agentRef.current.epsilon
      }]
    }));

    return agentWon;
  };

  const startChallenge = async () => {
    if (isTraining) return;
    setIsTraining(true);
    trainingRef.current = true;
    agentRef.current = new AgentX();
    setMetrics({ totalGames: 0, wins: 0, losses: 0, draws: 0, history: [] });

    for (let i = 0; i < MAX_CHALLENGE_GAMES; i++) {
      if (!trainingRef.current) break;
      await runGame(i);
      await new Promise(r => setTimeout(r, 500));
    }

    setIsTraining(false);
    trainingRef.current = false;
    setStatus(`${MAX_CHALLENGE_GAMES}-Match Season Concluded.`);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-400 to-cyan-600 bg-clip-text text-transparent uppercase tracking-tighter">
            AgentX: Dominance Protocol
          </h1>
          <p className="text-slate-400 font-medium tracking-tight">Reinforcement Learning over a 20-Game Extended Season.</p>
        </div>
        
        <div className="flex gap-4">
          {!isTraining ? (
            <button onClick={startChallenge} className="bg-emerald-600 hover:bg-emerald-700 px-8 py-3 rounded-full font-bold transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95">
              Begin 20-Game Season
            </button>
          ) : (
            <button onClick={() => trainingRef.current = false} className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-full font-bold transition-all shadow-lg">
              Terminate Season
            </button>
          )}
        </div>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 flex flex-col items-center gap-6">
          <div className="w-full bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col items-center relative">
            <Board fen={game.fen()} lastMove={currentMove} />
            <div className="mt-6 w-full text-center">
              <div className="text-sm font-mono text-emerald-400 mb-2 font-bold uppercase tracking-widest">{status}</div>
              <div className="text-xs text-slate-300 italic bg-slate-900/60 p-4 rounded-xl border border-slate-700 min-h-[60px] flex items-center justify-center">
                {commentary}
              </div>
            </div>
          </div>
          <div className="w-full grid grid-cols-3 gap-4">
            <StatCard label="AgentX Wins" value={metrics.wins} color="text-emerald-400" />
            <StatCard label="Losses" value={metrics.losses} color="text-red-400" />
            <StatCard label="Advantage" value={calculateMaterialBalance(game)} color="text-cyan-400" />
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-8">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl h-[400px]">
             <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">📈 Extended Learning Curve</h3>
             <ResponsiveContainer width="100%" height="90%">
                <AreaChart data={metrics.history}>
                  <defs>
                    <linearGradient id="colorReward" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="gameNumber" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                  <Area type="monotone" dataKey="agentXReward" stroke="#10b981" fillOpacity={1} fill="url(#colorReward)" name="Learning Value" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
          <Explanation />
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-lg flex flex-col items-center">
    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{label}</span>
    <span className={`text-3xl font-black ${color}`}>{value}</span>
  </div>
);

export default App;
