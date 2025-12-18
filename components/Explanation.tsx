
import React from 'react';

const Explanation: React.FC = () => {
  return (
    <div className="space-y-6 text-slate-300 text-sm md:text-base bg-slate-800/50 p-6 rounded-xl border border-slate-700">
      <section>
        <h3 className="text-xl font-bold text-emerald-400 mb-2">Achieving Positive Win-Rate (20-Game Cycle)</h3>
        <p>
          By extending the training to <strong>20 matches</strong>, AgentX has more time to refine its Q-table and settle into an optimal strategy.
        </p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li><strong>High Reward Multipliers:</strong> Capturing major pieces (Queens, Rooks) provides massive immediate feedback, teaching the agent that aggression pays off instantly.</li>
          <li><strong>Directed Discovery:</strong> During exploration, the agent is 80% likely to prioritize captures or checks over random moves, ensuring it "stumbles" onto winning patterns early.</li>
          <li><strong>Technical Resignation:</strong> By defining a "Win" at +4 material advantage, we reward the agent for consolidating a lead, which is significantly easier to learn than finding a deep checkmate sequence.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-xl font-bold text-cyan-400 mb-2">Extended Policy Stabilization</h3>
        <p>
          The agent transitions from exploring to exploiting the learned policy more gradually over the 20 matches, typically securing its first solid wins within the first quarter and reaching peak performance by Match 15.
        </p>
      </section>
    </div>
  );
};

export default Explanation;
