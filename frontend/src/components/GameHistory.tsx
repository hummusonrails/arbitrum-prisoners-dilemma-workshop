import React from 'react';
import { formatEther } from 'viem';

interface Cell {
  id: string;
  player1: string;
  player2: string;
  stake: bigint;
  totalRounds: number;
  currentRound: number;
  isComplete: boolean;
  rounds: Round[];
}

interface Round {
  roundNumber: number;
  player1Move: number | null;
  player2Move: number | null;
  player1Payout: bigint;
  player2Payout: bigint;
  isComplete: boolean;
}

interface GameHistoryProps {
  cellHistory: Cell[];
  onBackToLobby: () => void;
  onEnterCell: (cellId: string) => void;
  userAddress: string | undefined;
}

const GameHistory: React.FC<GameHistoryProps> = ({ 
  cellHistory, 
  onBackToLobby, 
  onEnterCell, 
  userAddress 
}) => {
  if (!userAddress) return null;

  const getMoveText = (move: number | null): string => {
    if (move === null) return 'N/A';
    return move === 0 ? 'Cooperate' : 'Defect';
  };

  const getMoveIcon = (move: number | null): string => {
    if (move === null) return '❓';
    return move === 0 ? '🤝' : '🗡️';
  };

  const getTotalPayout = (cell: Cell, playerAddress: string): bigint => {
    const isPlayer1 = cell.player1.toLowerCase() === playerAddress.toLowerCase();
    return cell.rounds.reduce((total, round) => {
      return total + (isPlayer1 ? round.player1Payout : round.player2Payout);
    }, BigInt(0));
  };

  const getWinnerText = (cell: Cell): string => {
    const player1Total = getTotalPayout(cell, cell.player1);
    const player2Total = getTotalPayout(cell, cell.player2);
    
    if (player1Total > player2Total) return 'Player 1 Wins';
    if (player2Total > player1Total) return 'Player 2 Wins';
    return 'Tie';
  };

  const isUserParticipant = (cell: Cell): boolean => {
    return cell.player1.toLowerCase() === userAddress.toLowerCase() || 
           cell.player2.toLowerCase() === userAddress.toLowerCase();
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Cell History</h1>
          <p className="text-gray-300">View completed multi-round Prisoner's Dilemma cells</p>
        </div>
        <button
          onClick={onBackToLobby}
          className="!bg-gray-600 hover:!bg-gray-700 !text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          style={{ backgroundColor: '#4b5563', color: 'white' }}
        >
          ← Back to Lobby
        </button>
      </div>

      {/* History List */}
      {cellHistory.length === 0 ? (
        <div className="bg-gray-800 rounded-2xl p-8 text-center border border-gray-700">
          <p className="text-gray-400 text-lg">No completed cells yet.</p>
          <p className="text-gray-500 text-sm mt-2">Complete some games to see them here!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {cellHistory.map((cell) => (
            <div
              key={cell.id}
              className={`bg-gray-800 rounded-2xl p-6 border transition-all cursor-pointer hover:border-gray-600 ${
                isUserParticipant(cell) ? 'border-blue-500/50' : 'border-gray-700'
              }`}
              onClick={() => onEnterCell(cell.id)}
            >
              {/* Cell Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Cell #{cell.id}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-300">
                    <span>Stake: {formatEther(cell.stake)} ETH</span>
                    <span>Rounds: {cell.rounds.length}/{cell.totalRounds}</span>
                    <span className="text-green-400">{getWinnerText(cell)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-semibold">✅ Complete</div>
                  {isUserParticipant(cell) && (
                    <div className="text-blue-400 text-sm mt-1">You participated</div>
                  )}
                </div>
              </div>

              {/* Players */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`p-4 rounded-lg border ${
                  cell.player1.toLowerCase() === userAddress.toLowerCase() 
                    ? 'border-blue-500 bg-blue-900/20' 
                    : 'border-gray-600 bg-gray-700'
                }`}>
                  <div className="text-gray-400 text-sm mb-1">Player 1</div>
                  <div className="text-white font-mono text-sm mb-2">
                    {cell.player1.slice(0, 6)}...{cell.player1.slice(-4)}
                  </div>
                  <div className="text-green-400 font-semibold">
                    Total: +{formatEther(getTotalPayout(cell, cell.player1))} ETH
                  </div>
                  {cell.player1.toLowerCase() === userAddress.toLowerCase() && (
                    <div className="text-blue-400 text-xs mt-1">You</div>
                  )}
                </div>
                
                <div className={`p-4 rounded-lg border ${
                  cell.player2.toLowerCase() === userAddress.toLowerCase() 
                    ? 'border-blue-500 bg-blue-900/20' 
                    : 'border-gray-600 bg-gray-700'
                }`}>
                  <div className="text-gray-400 text-sm mb-1">Player 2</div>
                  <div className="text-white font-mono text-sm mb-2">
                    {cell.player2.slice(0, 6)}...{cell.player2.slice(-4)}
                  </div>
                  <div className="text-green-400 font-semibold">
                    Total: +{formatEther(getTotalPayout(cell, cell.player2))} ETH
                  </div>
                  {cell.player2.toLowerCase() === userAddress.toLowerCase() && (
                    <div className="text-blue-400 text-xs mt-1">You</div>
                  )}
                </div>
              </div>

              {/* Round Summary */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Round Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cell.rounds.map((round, index) => (
                    <div
                      key={index}
                      className="bg-gray-600 rounded-lg p-3 text-sm"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300 font-semibold">
                          Round {round.roundNumber + 1}
                        </span>
                        <span className="text-gray-400">
                          {round.isComplete ? '✅' : '⏳'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center">
                          <div className="text-gray-400">P1</div>
                          <div className="text-white">
                            {getMoveIcon(round.player1Move)} {getMoveText(round.player1Move)}
                          </div>
                          {round.isComplete && (
                            <div className="text-green-400">
                              +{formatEther(round.player1Payout)}
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400">P2</div>
                          <div className="text-white">
                            {getMoveIcon(round.player2Move)} {getMoveText(round.player2Move)}
                          </div>
                          {round.isComplete && (
                            <div className="text-green-400">
                              +{formatEther(round.player2Payout)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* View Details Button */}
              <div className="mt-4 text-center">
                <button className="text-blue-400 hover:text-blue-300 text-sm font-semibold">
                  Click to view detailed results →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GameHistory;
