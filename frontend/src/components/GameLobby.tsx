import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

// TODO: Import wagmi hooks for contract interaction
// import { useContractRead, useContractWrite } from 'wagmi';

interface ExtendedGame {
  id: string;
  player1: string;
  player2?: string;
  stake: string;
  player1HasMoved: boolean;
  player2HasMoved: boolean;
  isFinished: boolean;
  isOpen: boolean;
  isFull: boolean;
  status: string;
  result?: {
    player1Move: string;
    player2Move: string;
    player1Payout: string;
    player2Payout: string;
  };
}

interface GameLobbyProps {
  openGames: ExtendedGame[];
  onCreate: (stake: string) => void;
  onJoin: (gameId: string, stake: string) => void;
  onEnterGame: (gameId: string) => void;
  loading: boolean;
  userAddress?: string;
}

const GameLobby: React.FC<GameLobbyProps> = ({ openGames, onCreate, onJoin, onEnterGame, loading, userAddress }) => {
  const { isConnected } = useWeb3();
  const [stake, setStake] = useState('0.01'); // Set default to minimum stake
  const MIN_STAKE = 0.01; // 0.01 ETH minimum

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4">Game Lobby</h2>
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="number"
          step="0.01"
          min="0.01"
          placeholder={`Stake (ETH, min: ${MIN_STAKE})`}
          className="border px-3 py-2 rounded w-full md:w-1/3"
          value={stake}
          onChange={e => setStake(e.target.value)}
          disabled={!isConnected || loading}
        />
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={() => {
            const stakeNum = parseFloat(stake);
            if (stakeNum < MIN_STAKE) {
              alert(`Minimum stake is ${MIN_STAKE} ETH`);
              return;
            }
            onCreate(stake);
          }}
          disabled={!isConnected || !stake || parseFloat(stake) < MIN_STAKE || loading}
        >
          Create Game
        </button>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Games</h3>
        {openGames.length === 0 ? (
          <p className="text-gray-500">No games available. Create one to get started!</p>
        ) : (
          <ul className="space-y-3">
            {openGames.map((game) => {
              const isUserInGame = userAddress && (
                game.player1.toLowerCase() === userAddress.toLowerCase() ||
                (game.player2 && game.player2.toLowerCase() === userAddress.toLowerCase())
              );
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'open': return 'text-green-600';
                  case 'full': return 'text-blue-600';
                  case 'finished': return 'text-gray-600';
                  default: return 'text-gray-600';
                }
              };
              
              const getStatusBadge = (status: string) => {
                switch (status) {
                  case 'open': return 'bg-green-100 text-green-800';
                  case 'full': return 'bg-blue-100 text-blue-800';
                  case 'finished': return 'bg-gray-100 text-gray-800';
                  default: return 'bg-gray-100 text-gray-800';
                }
              };
              
              return (
                <li key={game.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(game.status)}`}>
                            {game.status.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-600">Game #{game.id}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <span className="font-medium">Player 1:</span> {game.player1.slice(0, 6)}...{game.player1.slice(-4)}
                        </div>
                        {game.player2 && game.player2 !== '0x0000000000000000000000000000000000000000' && (
                          <div>
                            <span className="font-medium">Player 2:</span> {game.player2.slice(0, 6)}...{game.player2.slice(-4)}
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <span className={`font-semibold ${getStatusColor(game.status)}`}>Stake: {game.stake} ETH</span>
                      </div>
                      
                      {/* Game Result Display for Finished Games */}
                      {game.status === 'finished' && game.result && (
                        <div className="mt-3 p-3 bg-gray-50 rounded border">
                          <div className="text-sm font-medium mb-2">Game Result:</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <div className="font-medium">Player 1:</div>
                              <div>Move: <span className={game.result.player1Move === 'Cooperate' ? 'text-blue-600' : 'text-red-600'}>{game.result.player1Move}</span></div>
                              <div>Earned: <span className="font-medium">{game.result.player1Payout} ETH</span></div>
                            </div>
                            <div>
                              <div className="font-medium">Player 2:</div>
                              <div>Move: <span className={game.result.player2Move === 'Cooperate' ? 'text-blue-600' : 'text-red-600'}>{game.result.player2Move}</span></div>
                              <div>Earned: <span className="font-medium">{game.result.player2Payout} ETH</span></div>
                            </div>
                          </div>
                          
                          {/* User-specific result */}
                          {userAddress && (
                            <div className="mt-2 pt-2 border-t">
                              {(userAddress.toLowerCase() === game.player1.toLowerCase() || 
                                userAddress.toLowerCase() === game.player2.toLowerCase()) && (
                                <div className="text-center">
                                  {(() => {
                                    const isPlayer1 = userAddress.toLowerCase() === game.player1.toLowerCase();
                                    const userMove = isPlayer1 ? game.result.player1Move : game.result.player2Move;
                                    const opponentMove = isPlayer1 ? game.result.player2Move : game.result.player1Move;
                                    const userPayout = parseFloat(isPlayer1 ? game.result.player1Payout : game.result.player2Payout);
                                    const opponentPayout = parseFloat(isPlayer1 ? game.result.player2Payout : game.result.player1Payout);
                                    
                                    let resultText = '';
                                    let resultColor = '';
                                    
                                    if (userPayout > opponentPayout) {
                                      resultText = '🎉 You Won!';
                                      resultColor = 'text-green-600 font-bold';
                                    } else if (userPayout < opponentPayout) {
                                      resultText = '😔 You Lost';
                                      resultColor = 'text-red-600 font-bold';
                                    } else {
                                      resultText = '🤝 Tie Game';
                                      resultColor = 'text-blue-600 font-bold';
                                    }
                                    
                                    return (
                                      <div>
                                        <div className={`text-sm ${resultColor}`}>{resultText}</div>
                                        <div className="text-xs text-gray-600 mt-1">
                                          You earned <span className="font-medium">{userPayout.toFixed(4)} ETH</span>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex gap-2">
                      {isUserInGame ? (
                        <button
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                          onClick={() => onEnterGame(game.id)}
                        >
                          Enter Game
                        </button>
                      ) : game.status === 'open' ? (
                        <button
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                          onClick={() => {
                            const stakeNum = parseFloat(game.stake);
                            if (stakeNum < MIN_STAKE) {
                              alert(`This game has invalid stake (${game.stake} ETH). Minimum required: ${MIN_STAKE} ETH`);
                              return;
                            }
                            console.log('[GameLobby] Joining game:', game.id, 'with stake:', game.stake, 'ETH');
                            onJoin(game.id, game.stake);
                          }}
                          disabled={!isConnected || loading || parseFloat(game.stake) < MIN_STAKE}
                        >
                          {loading ? 'Joining...' : `Join (${game.stake} ETH)`}
                        </button>
                      ) : game.status === 'full' ? (
                        <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded font-medium">
                          Game Full
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-800 px-4 py-2 rounded font-medium">
                          Finished
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default GameLobby;
