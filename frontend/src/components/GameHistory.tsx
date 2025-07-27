import React from 'react';

interface GameHistoryEntry {
  id: string;
  player1: string;
  player2: string;
  stake: string;
  result: string;
}

interface GameHistoryProps {
  history: GameHistoryEntry[];
}

const GameHistory: React.FC<GameHistoryProps> = ({ history }) => (
  <div className="bg-gray-900 rounded-lg shadow-lg p-6 mb-8">
    <h2 className="text-2xl font-bold text-white mb-4">Game History</h2>
    {history.length === 0 ? (
      <div className="text-gray-300">No finished games yet.</div>
    ) : (
      <ul className="divide-y divide-gray-600">
        {history.map(entry => (
          <li key={entry.id} className="py-2 flex justify-between items-center">
            <span className="font-mono text-xs text-gray-300">{entry.player1.slice(0, 6)}...{entry.player1.slice(-4)}</span>
            <span className="font-mono text-xs text-gray-300">vs</span>
            <span className="font-mono text-xs text-gray-300">{entry.player2.slice(0, 6)}...{entry.player2.slice(-4)}</span>
            <span className="text-gray-300">Stake: {entry.stake} ETH</span>
            <span className="font-semibold text-white">{entry.result}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default GameHistory;
