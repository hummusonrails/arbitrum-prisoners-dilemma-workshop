import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import { formatEther } from 'viem';
import type { Cell } from '../types/Cell';
import GameLobbyHeader from './GameLobbyHeader';

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
  
  // Helper function to check if an address is empty or zero
  const isEmptyAddress = (addr: string | null | undefined) => {
    return !addr || 
           addr === '0x' || 
           addr === '0x0000000000000000000000000000000000000000' || 
           addr === '';
  };
  
  // Filter cells into different categories with better type handling
  const openCells = cells.filter(cell => {
    // A cell is open if it has one player and is not complete
    const hasOnePlayer = !isEmptyAddress(cell.player1) && isEmptyAddress(cell.player2);
    const isComplete = Boolean(cell.isComplete);
        
    return !isComplete && hasOnePlayer;
  });
  
  const activeCells = cells.filter(cell => {
    // A cell is active if it has two players and is not complete
    const hasTwoPlayers = !isEmptyAddress(cell.player1) && !isEmptyAddress(cell.player2);
    const isComplete = Boolean(cell.isComplete);
    const isUserInCell = userAddress && 
      (String(cell.player1 || '').toLowerCase() === userAddress.toLowerCase() || 
       String(cell.player2 || '').toLowerCase() === userAddress.toLowerCase());
        
    return !isComplete && hasTwoPlayers && isUserInCell;
  });
  
  const completedCells = cells.filter(cell => {
    // A cell is completed if isComplete is true
    const isComplete = Boolean(cell.isComplete);
        
    return isComplete;
  });

  const handleCreateCell = () => {
    if (!stakeAmount || parseFloat(stakeAmount) < parseFloat(formatEther(minStake))) {
      alert(`Minimum stake is ${formatEther(minStake)} ETH`);
      return;
    }
    onCreateCell(stakeAmount);
    setStakeAmount('');
    setShowCreateForm(false);
  };

  const handleStakeAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setStakeAmount(e.target.value);
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
    <div className="max-w-6xl mx-auto p-4">
      <GameLobbyHeader
        onViewHistory={onViewHistory}
        onCreateClick={() => setShowCreateForm(!showCreateForm)}
        showCreateForm={showCreateForm}
        onCreateCell={handleCreateCell}
        onStakeAmountChange={handleStakeAmountChange}
        stakeAmount={stakeAmount}
        minStake={minStake}
        loading={loading}
        setShowCreateForm={setShowCreateForm}
        setStakeAmount={setStakeAmount}
      />
      
      {/* Create Cell Form */}
      {showCreateForm && (
        <div className="bg-gray-900 p-6 rounded-lg mb-8 border-2 border-yellow-600 shadow-lg shadow-yellow-900/50">
          <h3 className="text-2xl font-bold mb-4 text-yellow-400">CONSTRUCT NEW CELL</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="number"
              step="0.01"
              min={formatEther(minStake)}
              value={stakeAmount}
              onChange={handleStakeAmountChange}
              placeholder={`Minimum: ${formatEther(minStake)} ETH`}
              className="flex-1 p-3 rounded bg-gray-800 text-white border-2 border-gray-700 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 outline-none transition-all"
            />
            <div className="flex flex-col gap-2 justify-center sm:flex-row sm:items-center">
              <button
                onClick={handleCreateCell}
                disabled={loading}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-8 py-4 rounded-xl font-black text-lg tracking-wider transition-all duration-300 transform hover:scale-110 hover:shadow-2xl border-2 border-red-400/50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                {loading ? 'CONSTRUCTING...' : 'CONSTRUCT CELL'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800 text-white px-8 py-4 rounded-xl font-black text-lg tracking-wider transition-all duration-300 border-2 border-gray-500/50 hover:border-gray-400"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {activeCells.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-orange-400 mb-4">ACTIVE CELLS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCells.map((cell) => (
              <div
                key={cell.id}
                className="bg-gray-800/50 border border-orange-500/30 rounded-lg p-4 hover:bg-gray-700/50 transition-colors cursor-pointer"
                onClick={() => onEnterCell(cell.id)}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-medium text-white">Cell #{cell.id}</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${getCellStatusColor(cell)}`}>
                    {getCellStatus(cell)}
                  </span>
                </div>
                <div className="text-sm text-gray-300">
                  <p>Stake: {formatEther(cell.stake)} ETH</p>
                  <p>Players: 2/2</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Cells */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-yellow-400">AVAILABLE CELLS</h2>
          <span className="px-3 py-1 bg-gray-800 text-yellow-400 text-sm font-mono rounded-full border border-yellow-600">
            {openCells.length} CELL{openCells.length !== 1 ? 'S' : ''} AVAILABLE
          </span>
        </div>
        
        {openCells.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {openCells.map((cell) => (
              <div key={cell.id} className="bg-gray-900 p-5 rounded-xl border-2 border-gray-700 hover:border-yellow-600 transition-all hover:shadow-lg hover:shadow-yellow-900/30">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-800">
                  <span className="font-mono text-yellow-400">CELL #{cell.id}</span>
                  <span className="px-2 py-1 bg-gray-800 text-green-400 text-xs font-bold rounded">
                    {getCellStatus(cell).toUpperCase()}
                  </span>
                </div>
                <div className="space-y-2 mb-5">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stake:</span>
                    <span className="font-mono text-yellow-300">{formatEther(cell.stake)} ETH</span>
                  </div>
                </div>
                {canJoinCell(cell) ? (
                  <button
                    onClick={() => handleJoinCell(cell.id, cell.stake)}
                    disabled={loading}
                    className="game-lobby-join-button w-full py-3 text-white font-bold rounded shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                    style={{
                      backgroundColor: '#b45309',
                      border: '2px solid #92400e',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      appearance: 'none',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#92400e';
                      e.currentTarget.style.borderColor = '#78350f';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#b45309';
                      e.currentTarget.style.borderColor = '#92400e';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                    }}
                  >
                    {loading ? 'JOINING...' : 'JOIN CELL'}
                  </button>
                ) : isUserInCell(cell) ? (
                  <button
                    onClick={() => onEnterCell(cell.id)}
                    disabled
                    className="w-full py-3 group relative bg-gradient-to-r from-red-600 to-red-700 text-white font-black text-lg rounded-xl tracking-wider border-2 border-red-400/50 opacity-50 cursor-not-allowed"
                  >
                    ENTER CELL
                  </button>
                ) : (
                  <div className="w-full py-3 text-center text-gray-500 text-sm">
                    Not available
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-800">
            <p className="text-gray-500 text-lg">No open cells found.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="group relative bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-8 py-4 rounded-xl font-black text-lg tracking-wider transition-all duration-300 transform hover:scale-110 hover:shadow-2xl border-2 border-red-400/50 hover:border-red-300 mt-4"
            >
              CONSTRUCT NEW CELL
            </button>
          </div>
        )}
      </div>

      {/* Active Cells */}
      {activeCells.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-yellow-400">YOUR ACTIVE CELLS</h2>
            <span className="px-3 py-1 bg-gray-800 text-yellow-400 text-sm font-mono rounded-full border border-yellow-600">
              {activeCells.length} ACTIVE
            </span>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeCells.map((cell) => {
              const isYourTurn = cell.currentRound % 2 === 0 
                ? cell.player1?.toLowerCase() === userAddress?.toLowerCase() 
                : cell.player2?.toLowerCase() === userAddress?.toLowerCase();
                
              return (
                <div key={cell.id} className={`relative bg-gray-900 p-5 rounded-xl border-2 ${isYourTurn ? 'border-green-600' : 'border-blue-600'} hover:shadow-lg ${isYourTurn ? 'hover:shadow-green-900/30' : 'hover:shadow-blue-900/30'} transition-all`}>
                  {isYourTurn && (
                    <div className="absolute -top-3 -right-3 px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full animate-pulse">
                      YOUR TURN
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-800">
                    <span className="font-mono text-yellow-400">CELL #{cell.id}</span>
                    <span className="px-2 py-1 bg-gray-800 text-blue-400 text-xs font-bold rounded">
                      ROUND {cell.currentRound}
                    </span>
                  </div>
                  <div className="space-y-2 mb-5">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Stake:</span>
                      <span className="font-mono text-yellow-300">{formatEther(cell.stake)} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`font-mono ${isYourTurn ? 'text-green-400' : 'text-yellow-400'}`}>
                        {isYourTurn ? 'YOUR TURN' : 'WAITING'}
                      </span>
                    </div>
                    <span className="text-gray-400">Rounds Played:</span> {cell.rounds.length}
                  </div>
                  <button
                    onClick={() => onEnterCell(cell.id)}
                    className="w-full py-3 px-6 rounded-xl font-bold text-lg transition-colors duration-200
                      bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 shadow-md
                      disabled:bg-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed
                      hover:from-yellow-500 hover:to-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    ENTER CELL
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recently Completed */}
      {completedCells.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-yellow-400">RECENTLY COMPLETED</h2>
            <span className="px-3 py-1 bg-gray-800 text-gray-400 text-sm font-mono rounded-full border border-gray-700">
              LAST {Math.min(3, completedCells.length)} CELLS
            </span>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {completedCells.slice(0, 3).map((cell) => {
              // Determine win/lose based on payouts in the final round
              const finalRound = cell.rounds[cell.rounds.length - 1];
              let didWin = false;
              if (cell.player1?.toLowerCase() === userAddress?.toLowerCase()) {
                didWin = finalRound.player1Payout > finalRound.player2Payout;
              } else if (cell.player2?.toLowerCase() === userAddress?.toLowerCase()) {
                didWin = finalRound.player2Payout > finalRound.player1Payout;
              }
              
              return (
                <div key={cell.id} className="bg-gray-900/50 p-5 rounded-xl border-2 border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-800">
                    <span className="font-mono text-yellow-400">CELL #{cell.id}</span>
                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                      didWin 
                        ? 'bg-green-900/50 text-green-400 border border-green-800/50' 
                        : 'bg-red-900/50 text-red-400 border border-red-800/50'
                    }`}>
                      {didWin ? 'VICTORY' : 'DEFEAT'}
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Stake:</span>
                      <span className="font-mono text-yellow-300">{formatEther(cell.stake)} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rounds:</span>
                      <span className="font-mono">{cell.totalRounds}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Result:</span>
                      <span className={`font-mono ${didWin ? 'text-green-400' : 'text-red-400'}`}> 
                        {didWin ? 'WON' : 'LOST'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onEnterCell(cell.id)}
                    className="w-full py-3 px-6 rounded-xl font-bold text-lg transition-colors duration-200
                      bg-gradient-to-r from-green-400 to-green-600 text-gray-900 shadow-md
                      disabled:bg-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed
                      hover:from-green-500 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    ENTER CELL
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameLobby;
