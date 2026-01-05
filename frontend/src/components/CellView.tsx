import React, { useState, useEffect } from 'react';
import { formatEther } from 'viem';
import type { Cell, Round } from '../types/Cell';
import { getContinuationStatus } from '../lib/contract';
import { useWeb3 } from '../contexts/Web3Context';

interface CellViewProps {
  cell: Cell;
  onMove: (cellId: string, move: number) => Promise<void>;
  onContinuationDecision: (cellId: string, wantsToContinue: boolean) => Promise<void>;
  onBackToLobby: () => void;
  onRefresh: () => Promise<void>;
  moveLoading: boolean;
  userAddress: string | undefined;
}

const CellView: React.FC<CellViewProps> = ({
  cell,
  onMove,
  onContinuationDecision,
  onBackToLobby,
  onRefresh,
  moveLoading,
  userAddress
}) => {
  const { publicClient } = useWeb3();
  const [continuationStatus, setContinuationStatus] = useState<{
    p1Decided: boolean;
    p1Wants: boolean;
    p2Decided: boolean;
    p2Wants: boolean;
  } | null>(null);

const CellView: React.FC<CellViewProps> = ({
  cell,
  onMove,
  onContinuationDecision,
  onBackToLobby,
  onRefresh,
  moveLoading,
  userAddress
}) => {
  const { publicClient } = useWeb3();
  const [continuationStatus, setContinuationStatus] = useState<{
    p1Decided: boolean;
    p1Wants: boolean;
    p2Decided: boolean;
    p2Wants: boolean;
  } | null>(null);

  // Poll continuation status when round is complete and cell is not complete
  useEffect(() => {
    const fetchStatus = async () => {
      if (!publicClient || cell.isComplete) return;
      const currentRound = cell.rounds[cell.currentRound - 1];
      if (currentRound && currentRound.isComplete && !cell.isComplete) {
        const status = await getContinuationStatus(publicClient, cell.id);
        setContinuationStatus(status);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [publicClient, cell.id, cell.currentRound, cell.isComplete, cell.rounds]);

  if (!userAddress) return null;

  const isPlayer1 = cell.player1.toLowerCase() === userAddress.toLowerCase();
  const isPlayer2 = cell.player2.toLowerCase() === userAddress.toLowerCase();
  const isParticipant = isPlayer1 || isPlayer2;

  const getMoveText = (move: number | null): string => {

  const getMoveText = (move: number | null): string => {
    if (move === null) return 'Pending';
    return move === 0 ? 'Cooperate' : 'Defect';
  };

  const getMoveIcon = (move: number | null): string => {
    if (move === null) return '⏳';
    return move === 0 ? '🤝' : '🗡️';
  };

  const getOutcomeIcon = (p1Move: number | null, p2Move: number | null): string => {
    if (p1Move === null || p2Move === null) return '⏳';
    if (p1Move === 0 && p2Move === 0) return '🤝';
    if (p1Move === 1 && p2Move === 1) return '⚔️';
    return '🗡️'; // One cooperates, one defects
  };

  const getOutcomeText = (p1Move: number | null, p2Move: number | null): string => {
    if (p1Move === null || p2Move === null) return 'PENDING';
    if (p1Move === 0 && p2Move === 0) return 'MUTUAL COOPERATION';
    if (p1Move === 1 && p2Move === 1) return 'MUTUAL BETRAYAL';
    return 'BETRAYAL';
  };

  const getCurrentRound = (): Round | null => {
    // If backend has incremented currentRound but frontend hasn't fetched the new round yet, force refresh
    if (cell.rounds.length < cell.currentRound) {
      onRefresh();
      return null;
    }
    if (cell.rounds.length === 0) return null;
    return cell.rounds[cell.currentRound - 1] || null;
  };

  const canMakeMove = (): boolean => {
    if (!isParticipant || cell.isComplete) return false;
    const currentRound = getCurrentRound();
    // If the round is complete, do not allow moves
    if (!currentRound || currentRound.isComplete) return false;
    // If we need continuation decisions, can't make moves yet
    if (needsContinuationDecision()) return false;
    // Check if this player has already made their move in the current round
    const playerMove = isPlayer1 ? currentRound.player1Move : currentRound.player2Move;
    return playerMove === null;
  };

  const needsContinuationDecision = (): boolean => {
    if (!isParticipant || cell.isComplete) return false;
    // Check if we've reached max rounds
    if (cell.currentRound >= cell.totalRounds) return false;
    const currentRound = getCurrentRound();
    if (!currentRound || !currentRound.isComplete) return false;

    // Check if this player has already submitted their continuation decision
    if (continuationStatus) {
      const hasDecided = isPlayer1 ? continuationStatus.p1Decided : continuationStatus.p2Decided;
      if (hasDecided) return false; // Don't show dialog if already decided
    }

    // Show continuation dialog if the current round is complete and cell is not complete
    return true;
  };

  const handleMoveClick = (move: number) => {
    onMove(cell.id, move);
  };

  const handleContinuationClick = (wantsToContinue: boolean) => {
    onContinuationDecision(cell.id, wantsToContinue);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/40 to-orange-900/40 rounded-t-3xl border-t-4 border-l-4 border-r-4 border-red-500/50 shadow-2xl" />
        <div className="absolute inset-1 bg-black/70 rounded-t-2xl border-t-2 border-l-2 border-r-2 border-red-400/30" />
        
        <div className="absolute inset-0 opacity-30">
          <div className="h-full flex justify-center items-center">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-1 h-full bg-gradient-to-b from-red-400 to-red-700 mx-4 shadow-xl" />
            ))}
          </div>
        </div>
        
        <div className="absolute top-2 left-2 w-3 h-3 bg-red-500 rounded-full animate-ping" />
        <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
        
        <div className="relative z-10 p-8">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 mb-4 tracking-wider drop-shadow-2xl">
                ⛓️ CELL #{cell.id} ⛓️
              </h1>
              <div className="flex justify-center items-center gap-6 text-orange-200">
                <div className="bg-black/50 px-4 py-2 rounded-xl border border-orange-500/30">
                  <span className="text-orange-400 font-mono text-sm tracking-wider">ROUND:</span>
                  <span className="text-orange-200 font-black ml-2">Round {cell.currentRound}</span>
                </div>
                <div className="bg-black/50 px-4 py-2 rounded-xl border border-orange-500/30">
                  <span className="text-orange-400 font-mono text-sm tracking-wider">STAKE:</span>
                  <span className="text-orange-200 font-black ml-2">{formatEther(cell.stake)} ETH</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onRefresh}
                className="group relative bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-xl font-black tracking-wider transition-all duration-300 transform hover:scale-110 border-2 border-blue-500/50 hover:border-blue-400"
                title="Refresh game state"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-600/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                <span className="relative z-10">🔄 SYNC</span>
              </button>
              <button
                onClick={onBackToLobby}
                className="group relative bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-xl font-black tracking-wider transition-all duration-300 transform hover:scale-110 border-2 border-gray-500/50 hover:border-gray-400"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-400/20 to-gray-600/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                <span className="relative z-10">🚪 ESCAPE</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/30 to-orange-900/30 border-l-4 border-r-4 border-red-500/50 shadow-xl" />
        <div className="absolute inset-1 bg-black/60 border-l-2 border-r-2 border-red-400/30" />
        
        <div className="relative z-10 p-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-black text-orange-400 tracking-wider">👥 INMATES 👥</h2>
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent mt-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            {/* Player 1 */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-cyan-900/40 rounded-2xl border-2 border-blue-500/50 shadow-xl" />
              <div className="absolute inset-1 bg-black/70 rounded-xl border border-blue-400/30" />
              
              <div className="relative z-10 p-6 text-center">
                <div className="text-4xl mb-3">👨‍⚖️</div>
                <h3 className="text-xl font-black text-blue-300 mb-3 tracking-wider">PRISONER #1</h3>
                <div className="bg-black/50 px-4 py-2 rounded-lg border border-blue-500/30 mb-4">
                  <p className="text-blue-200 font-mono text-sm tracking-wider">
                    {cell.player1.slice(0, 8)}...{cell.player1.slice(-6)}
                  </p>
                </div>
                {isPlayer1 && (
                  <div className="inline-block bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-full font-black text-sm tracking-wider border-2 border-blue-400/50 animate-pulse">
                    ⚡ YOU ⚡
                  </div>
                )}
              </div>
            </div>
            
            {/* Player 2 */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-2xl border-2 border-purple-500/50 shadow-xl" />
              <div className="absolute inset-1 bg-black/70 rounded-xl border border-purple-400/30" />
              
              <div className="relative z-10 p-6 text-center">
                <div className="text-4xl mb-3">👩‍⚖️</div>
                <h3 className="text-xl font-black text-purple-300 mb-3 tracking-wider">PRISONER #2</h3>
                <div className="bg-black/50 px-4 py-2 rounded-lg border border-purple-500/30 mb-4">
                  <p className="text-purple-200 font-mono text-sm tracking-wider">
                    {cell.player2.slice(0, 8)}...{cell.player2.slice(-6)}
                  </p>
                </div>
                {isPlayer2 && (
                  <div className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full font-black text-sm tracking-wider border-2 border-purple-400/50 animate-pulse">
                    ⚡ YOU ⚡
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isParticipant && !cell.isComplete && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/30 to-orange-900/30 border-l-4 border-r-4 border-red-500/50 shadow-xl" />
          <div className="absolute inset-1 bg-black/60 border-l-2 border-r-2 border-red-400/30" />
          
          <div className="relative z-10 p-8">
            {canMakeMove() && (
              <div className="text-center">
                <div className="mb-8">
                  <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 mb-4 tracking-wider drop-shadow-2xl">
                    ⚖️ THE CHOICE ⚖️
                  </h2>
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-pulse mb-6" />
                  <p className="text-orange-200 text-lg font-mono tracking-wide max-w-2xl mx-auto">
                    YOUR FATE HANGS IN THE BALANCE • TRUST OR BETRAY • CHOOSE WISELY
                  </p>
                </div>
                
                <div className="flex gap-8 justify-center">
                  {/* Cooperate Button */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded-2xl border-2 border-blue-500/50 shadow-2xl group-hover:shadow-blue-500/30 transition-all duration-500" />
                    <div className="absolute inset-1 bg-black/70 rounded-xl border border-blue-400/30" />
                    
                    <button
                      onClick={() => handleMoveClick(0)}
                      disabled={moveLoading}
                      className="relative z-10 group bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-700 text-white px-12 py-6 rounded-xl font-black text-xl tracking-wider transition-all duration-300 transform hover:scale-110 hover:shadow-2xl disabled:hover:scale-100 border-2 border-blue-400/50 hover:border-blue-300 m-2"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-cyan-600/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                      <span className="relative z-10 flex items-center gap-3">
                        🤝 COOPERATE
                      </span>
                    </button>
                    <div className="text-center mt-4">
                      <p className="text-blue-300 font-mono text-sm tracking-wider">TRUST • HONOR • UNITY</p>
                    </div>
                  </div>
                  
                  {/* Defect Button */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-900/50 to-orange-900/50 rounded-2xl border-2 border-red-500/50 shadow-2xl group-hover:shadow-red-500/30 transition-all duration-500" />
                    <div className="absolute inset-1 bg-black/70 rounded-xl border border-red-400/30" />
                    
                    <button
                      onClick={() => handleMoveClick(1)}
                      disabled={moveLoading}
                      className="relative z-10 group bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:from-gray-600 disabled:to-gray-700 text-white px-12 py-6 rounded-xl font-black text-xl tracking-wider transition-all duration-300 transform hover:scale-110 hover:shadow-2xl disabled:hover:scale-100 border-2 border-red-400/50 hover:border-red-300 m-2"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-orange-600/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                      <span className="relative z-10 flex items-center gap-3">
                        ⚔️ BETRAY
                      </span>
                    </button>
                    <div className="text-center mt-4">
                      <p className="text-red-300 font-mono text-sm tracking-wider">POWER • GREED • SURVIVAL</p>
                    </div>
                  </div>
                </div>
                
                {moveLoading && (
                  <div className="mt-8 text-center">
                    <div className="inline-flex items-center gap-3 bg-black/50 px-6 py-3 rounded-xl border border-orange-500/30">
                      <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-orange-300 font-mono tracking-wider">PROCESSING DECISION...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Current Round Status */}
      {!cell.isComplete && (
        <div className="bg-gray-900 p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Current Round</h2>
          {getCurrentRound() === null ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-3 bg-black/50 px-6 py-3 rounded-xl border border-orange-500/30">
                <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-orange-300 font-mono tracking-wider">Syncing new round...</span>
              </div>
            </div>
          ) : needsContinuationDecision() && (
            <div className="relative z-20 bg-gradient-to-br from-orange-900 via-orange-800 to-orange-900 border-2 border-orange-500/50 rounded-2xl shadow-2xl p-6 mt-4">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400/10 to-red-400/10 rounded-2xl blur-xl" />
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-red-300 mb-6 text-center tracking-wide">
                  🚨 CONTINUATION DECISION REQUIRED 🚨
                </h3>
                <p className="text-orange-200 text-center mb-6 text-sm">
                  Choose your fate: Continue the psychological experiment or escape the cell?
                </p>
                <div className="flex gap-6 justify-center">
                  <button
                    onClick={() => handleContinuationClick(true)}
                    disabled={moveLoading}
                    className="group relative z-10 bg-gradient-to-r from-green-600 via-green-700 to-green-800 hover:from-green-500 hover:via-green-600 hover:to-green-700 disabled:from-gray-600 disabled:via-gray-700 disabled:to-gray-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border-2 border-green-400/30 hover:border-green-300/50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-green-600/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                    <span className="relative z-10 flex items-center gap-2">
                      {moveLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          PROCESSING...
                        </>
                      ) : (
                        <>
                          🔄 CONTINUE EXPERIMENT
                        </>
                      )}
                    </span>
                  </button>
                  <button
                    onClick={() => handleContinuationClick(false)}
                    disabled={moveLoading}
                    className="group relative z-10 bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-500 hover:via-red-600 hover:to-red-700 disabled:from-gray-600 disabled:via-gray-700 disabled:to-gray-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border-2 border-red-400/30 hover:border-red-300/50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-red-600/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                    <span className="relative z-10 flex items-center gap-2">
                      {moveLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          PROCESSING...
                        </>
                      ) : (
                        <>
                          🚪 ESCAPE CELL
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Continuation Status Display */}
          {!needsContinuationDecision() && continuationStatus && getCurrentRound()?.isComplete && !cell.isComplete && (
            <div className="bg-gray-800 rounded-xl p-6 mt-4 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4 text-center">Continuation Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-blue-300 font-semibold mb-2">Player 1</p>
                  {continuationStatus.p1Decided ? (
                    <div className="flex flex-col items-center gap-2">
                      <span className="px-3 py-1 bg-green-900/50 text-green-400 rounded-full text-sm border border-green-700">
                        ✓ Decided
                      </span>
                      <span className={`text-sm ${continuationStatus.p1Wants ? 'text-green-400' : 'text-red-400'}`}>
                        {continuationStatus.p1Wants ? '🔄 Wants to Continue' : '🚪 Wants to Exit'}
                      </span>
                    </div>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-900/50 text-yellow-400 rounded-full text-sm border border-yellow-700">
                      ⏳ Pending
                    </span>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-purple-300 font-semibold mb-2">Player 2</p>
                  {continuationStatus.p2Decided ? (
                    <div className="flex flex-col items-center gap-2">
                      <span className="px-3 py-1 bg-green-900/50 text-green-400 rounded-full text-sm border border-green-700">
                        ✓ Decided
                      </span>
                      <span className={`text-sm ${continuationStatus.p2Wants ? 'text-green-400' : 'text-red-400'}`}>
                        {continuationStatus.p2Wants ? '🔄 Wants to Continue' : '🚪 Wants to Exit'}
                      </span>
                    </div>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-900/50 text-yellow-400 rounded-full text-sm border border-yellow-700">
                      ⏳ Pending
                    </span>
                  )}
                </div>
              </div>
              {continuationStatus.p1Decided && continuationStatus.p2Decided && (
                <div className="mt-4 text-center">
                  {continuationStatus.p1Wants && continuationStatus.p2Wants ? (
                    <p className="text-green-400 font-semibold">
                      ✓ Both players want to continue - Next round starting...
                    </p>
                  ) : (
                    <p className="text-red-400 font-semibold">
                      ✗ At least one player wants to exit - Cell will complete...
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          {!canMakeMove() && !needsContinuationDecision() && !cell.isComplete && getCurrentRound() !== null && !continuationStatus && (
            <div className="text-center text-gray-400 py-8">
              <p>Waiting for other player or round completion...</p>
            </div>
          )}
        </div>
      )}

      {/* Round History */}
      <div className="bg-gray-900 rounded-b-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Round History</h2>
        {cell.rounds.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No rounds completed yet</p>
        ) : (
          <div className="space-y-4">
            {cell.rounds.map((round, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-white">
                    Round {round.roundNumber}
                  </h3>
                  <div className="text-2xl">
                    {getOutcomeIcon(round.player1Move, round.player2Move)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Player 1</p>
                    <p className="text-white font-semibold">
                      {getMoveIcon(round.player1Move)} {getMoveText(round.player1Move)}
                    </p>
                    {round.isComplete && (
                      <p className="text-green-400 text-sm">
                        +{formatEther(round.player1Payout)} ETH
                      </p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Player 2</p>
                    <p className="text-white font-semibold">
                      {getMoveIcon(round.player2Move)} {getMoveText(round.player2Move)}
                    </p>
                    {round.isComplete && (
                      <p className="text-green-400 text-sm">
                        +{formatEther(round.player2Payout)} ETH
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-gray-300 font-semibold">
                    {getOutcomeText(round.player1Move, round.player2Move)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cell Complete Status */}
      {cell.isComplete && (
        <div className="bg-gradient-to-r from-green-900 to-green-800 rounded-2xl p-6 mt-6 border-2 border-green-500/50">
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            🏁 Cell Complete!
          </h2>
          <p className="text-green-200 text-center">
            All rounds have been completed. Final payouts have been distributed.
          </p>
        </div>
      )}
    </div>
  );
};

export default CellView;
