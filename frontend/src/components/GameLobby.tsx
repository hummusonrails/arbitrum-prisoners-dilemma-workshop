import React, { useState } from 'react';
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

interface GameLobbyProps {
  cells: Cell[];
  onCreateCell: (stake: string) => void;
  onJoinCell: (cellId: string, stake: string) => void;
  onEnterCell: (cellId: string) => void;
  onViewHistory: () => void;
  loading: boolean;
  minStake: bigint;
  userAddress: string | undefined;
}

const GameLobby: React.FC<GameLobbyProps> = ({
  cells,
  onCreateCell,
  onJoinCell,
  onEnterCell,
  onViewHistory,
  loading,
  minStake,
  userAddress
}) => {
  const [stakeAmount, setStakeAmount] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (!userAddress) return null;

  // Filter cells into different categories
  const openCells = cells.filter(cell => cell.player2 === '0x0000000000000000000000000000000000000000' && !cell.isComplete);
  const activeCells = cells.filter(cell => 
    cell.player2 !== '0x0000000000000000000000000000000000000000' && 
    !cell.isComplete &&
    (cell.player1.toLowerCase() === userAddress.toLowerCase() || cell.player2.toLowerCase() === userAddress.toLowerCase())
  );
  const completedCells = cells.filter(cell => cell.isComplete);

  const handleCreateCell = () => {
    if (!stakeAmount || parseFloat(stakeAmount) < parseFloat(formatEther(minStake))) {
      alert(`Minimum stake is ${formatEther(minStake)} ETH`);
      return;
    }
    onCreateCell(stakeAmount);
    setStakeAmount('');
    setShowCreateForm(false);
  };

  const handleJoinCell = (cellId: string, stake: bigint) => {
    onJoinCell(cellId, formatEther(stake));
  };

  const getCellStatus = (cell: Cell): string => {
    if (cell.isComplete) return 'Complete';
    if (cell.player2 === '0x0000000000000000000000000000000000000000') return 'Waiting for Player';
    return `Round ${cell.currentRound}`;
  };

  const getCellStatusColor = (cell: Cell): string => {
    if (cell.isComplete) return 'text-green-400';
    if (cell.player2 === '0x0000000000000000000000000000000000000000') return 'text-yellow-400';
    return 'text-blue-400';
  };

  const isUserInCell = (cell: Cell): boolean => {
    return cell.player1.toLowerCase() === userAddress.toLowerCase() || 
           cell.player2.toLowerCase() === userAddress.toLowerCase();
  };

  const canJoinCell = (cell: Cell): boolean => {
    return cell.player2 === '0x0000000000000000000000000000000000000000' && 
           cell.player1.toLowerCase() !== userAddress.toLowerCase();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="relative mb-12">
        <div className="absolute inset-0 opacity-20">
          <div className="flex justify-center">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-32 bg-gradient-to-b from-orange-400 via-red-500 to-red-800 mx-8 shadow-2xl"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
        
        <div className="relative z-10 text-center mb-8">
          <div className="mb-6">
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-red-700 mb-4 tracking-wider drop-shadow-2xl">
              🔒 CELL BLOCK 🔒
            </h1>
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-pulse" />
          </div>
          <p className="text-orange-200 text-xl font-mono tracking-wide mb-8">
            CHOOSE YOUR FATE • TRUST OR BETRAY • SURVIVE OR PERISH
          </p>
        </div>
        
        <div className="flex justify-center gap-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            disabled={loading}
            className="group relative bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:from-gray-600 disabled:to-gray-700 text-white px-8 py-4 rounded-xl font-black text-lg tracking-wider transition-all duration-300 transform hover:scale-110 hover:shadow-2xl disabled:hover:scale-100 border-2 border-orange-400/50 hover:border-orange-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-red-600/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <span className="relative z-10 flex items-center gap-3">
              {showCreateForm ? '❌ CANCEL' : '🏗️ CREATE CELL'}
            </span>
          </button>
          
          <button
            onClick={onViewHistory}
            className="group relative bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white px-8 py-4 rounded-xl font-black text-lg tracking-wider transition-all duration-300 transform hover:scale-110 hover:shadow-2xl border-2 border-gray-500/50 hover:border-gray-400"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gray-400/20 to-gray-600/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <span className="relative z-10 flex items-center gap-3">
              📜 CASE FILES
            </span>
          </button>
        </div>
      </div>

      {/* Create Cell Form */}
      {showCreateForm && (
        <div className="relative mb-12">
          {/* Prison cell frame */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-3xl border-2 border-orange-500/50 shadow-2xl" />
          <div className="absolute inset-2 bg-black/60 rounded-2xl border border-orange-400/30" />
          
          {/* Warning lights */}
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full animate-ping" />
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
          
          <div className="relative z-10 p-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-black text-orange-400 mb-2 tracking-wider">⚡ CONSTRUCT NEW CELL ⚡</h2>
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
            </div>
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="block text-orange-300 font-mono text-sm mb-2 tracking-wider">STAKE AMOUNT (ETH)</label>
                <input
                  type="number"
                  step="0.001"
                  min={formatEther(minStake)}
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder={`Min: ${formatEther(minStake)} ETH`}
                  className="w-full bg-black/80 border-2 border-orange-500/50 rounded-xl px-6 py-4 text-orange-100 placeholder-orange-400/60 focus:border-orange-400 focus:outline-none font-mono text-lg tracking-wider backdrop-blur-sm transition-all duration-300 focus:shadow-lg focus:shadow-orange-500/20"
                />
              </div>
              <button
                onClick={handleCreateCell}
                disabled={loading}
                className="group relative bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-8 py-4 rounded-xl font-black text-lg tracking-wider transition-all duration-300 transform hover:scale-105 hover:shadow-2xl disabled:hover:scale-100 border-2 border-green-400/50 hover:border-green-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-green-600/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                <span className="relative z-10">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      CONSTRUCTING...
                    </div>
                  ) : (
                    '🔨 CONSTRUCT'
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Cells */}
      {activeCells.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Your Active Cells</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCells.map((cell) => (
              <div
                key={cell.id}
                className="bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 border-2 border-purple-500/50 rounded-2xl p-6 hover:border-purple-400/70 transition-all cursor-pointer"
                onClick={() => onEnterCell(cell.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white">Cell #{cell.id}</h3>
                  <span className={`text-sm font-semibold ${getCellStatusColor(cell)}`}>
                    {getCellStatus(cell)}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="text-gray-300">
                    <span className="text-gray-400">Stake:</span> {formatEther(cell.stake)} ETH
                  </div>
                  <div className="text-gray-300">
                    <span className="text-gray-400">Rounds Played:</span> {cell.rounds.length}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className={`p-2 rounded ${cell.player1.toLowerCase() === userAddress.toLowerCase() ? 'bg-blue-600/30 border border-blue-500' : 'bg-gray-700'}`}>
                    <div className="text-gray-400">Player 1</div>
                    <div className="text-white font-mono text-xs">
                      {cell.player1.slice(0, 6)}...{cell.player1.slice(-4)}
                    </div>
                    {cell.player1.toLowerCase() === userAddress.toLowerCase() && (
                      <div className="text-blue-400 text-xs">You</div>
                    )}
                  </div>
                  <div className={`p-2 rounded ${cell.player2.toLowerCase() === userAddress.toLowerCase() ? 'bg-blue-600/30 border border-blue-500' : 'bg-gray-700'}`}>
                    <div className="text-gray-400">Player 2</div>
                    <div className="text-white font-mono text-xs">
                      {cell.player2.slice(0, 6)}...{cell.player2.slice(-4)}
                    </div>
                    {cell.player2.toLowerCase() === userAddress.toLowerCase() && (
                      <div className="text-blue-400 text-xs">You</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Cells */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Open Cells</h2>
        {openCells.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl p-8 text-center border border-gray-700">
            <p className="text-gray-400">No open cells available. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {openCells.map((cell) => (
              <div
                key={cell.id}
                className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white">Cell #{cell.id}</h3>
                  <span className="text-yellow-400 text-sm font-semibold">
                    Waiting for Player
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="text-gray-300">
                    <span className="text-gray-400">Stake:</span> {formatEther(cell.stake)} ETH
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-gray-400 text-sm mb-1">Created by:</div>
                  <div className="text-white font-mono text-sm">
                    {cell.player1.slice(0, 6)}...{cell.player1.slice(-4)}
                  </div>
                </div>

                {canJoinCell(cell) ? (
                  <button
                    onClick={() => handleJoinCell(cell.id, cell.stake)}
                    disabled={loading}
                    className="w-full !bg-green-600 hover:!bg-green-700 disabled:!bg-gray-600 !text-white py-2 rounded-lg font-semibold transition-colors"
                    style={{ backgroundColor: '#059669', color: 'white' }}
                  >
                    {loading ? 'Joining...' : `Join (${formatEther(cell.stake)} ETH)`}
                  </button>
                ) : isUserInCell(cell) ? (
                  <button
                    onClick={() => onEnterCell(cell.id)}
                    className="w-full !bg-orange-600 hover:!bg-orange-700 !text-white py-3 px-4 rounded-lg font-bold text-sm transition-colors duration-200"
                    style={{ backgroundColor: '#ea580c', color: 'white' }}
                  >
                    🔓 ENTER CELL
                  </button>
                ) : (
                  <div className="w-full bg-gray-600 text-gray-400 py-2 rounded-lg text-center">
                    Cannot Join
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Completed Cells */}
      {completedCells.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Recently Completed</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedCells.slice(0, 6).map((cell) => (
              <div
                key={cell.id}
                className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-all cursor-pointer opacity-75"
                onClick={() => onEnterCell(cell.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white">Cell #{cell.id}</h3>
                  <span className="text-green-400 text-sm font-semibold">
                    Complete
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="text-gray-300">
                    <span className="text-gray-400">Stake:</span> {formatEther(cell.stake)} ETH
                  </div>
                  <div className="text-gray-300">
                    <span className="text-gray-400">Rounds Played:</span> {cell.rounds.length}
                  </div>
                </div>

                <div className="text-center">
                  <button className="text-blue-400 hover:text-blue-300 text-sm">
                    View Results →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameLobby;
