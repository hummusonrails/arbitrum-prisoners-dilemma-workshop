import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

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
  const [stake, setStake] = useState('0.01');
  const MIN_STAKE = 0.01;

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-orange-600/30 rounded-2xl shadow-2xl p-8 mb-8 cell-hover relative overflow-hidden">
      {/* Prison cell bars effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="h-full w-full" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 20px, rgba(251, 146, 60, 0.2) 20px, rgba(251, 146, 60, 0.2) 24px)'
        }}></div>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-center mb-6">
          <div className="text-5xl mr-4 prison-text">🏛️</div>
          <h2 className="text-3xl font-bold text-white tracking-wider">
            <span className="text-orange-400">CELL</span>{' '}
            <span className="text-red-400">BLOCK</span>
          </h2>
          <div className="text-5xl ml-4 prison-text">⛓️</div>
        </div>
        
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-xl p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className="text-3xl mr-3">💰</div>
            <h3 className="text-xl font-bold text-white">Set Your Stakes</h3>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-gray-300 text-sm font-mono mb-2">WAGER AMOUNT (ETH)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder={`Min: ${MIN_STAKE} ETH`}
                className="w-full bg-gray-700 border-2 border-gray-500 focus:border-orange-400 text-white px-4 py-3 rounded-lg font-mono text-lg transition-all duration-300 placeholder-gray-400 focus:ring-2 focus:ring-orange-400/50"
                value={stake}
                onChange={e => setStake(e.target.value)}
                disabled={!isConnected || loading}
              />
            </div>
            <div className="flex items-end">
              <button
                className="group bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-orange-400/50 hover:border-red-400/70"
                onClick={() => {
                  const stakeNum = parseFloat(stake);
                  if (stakeNum < MIN_STAKE) {
                    alert(`⚠️ Minimum stake is ${MIN_STAKE} ETH`);
                    return;
                  }
                  onCreate(stake);
                }}
                disabled={!isConnected || !stake || parseFloat(stake) < MIN_STAKE || loading}
              >
                <div className="flex items-center space-x-2">
                  <div className="text-2xl group-hover:animate-spin">🎲</div>
                  <span className="tracking-wider">
                    {loading ? 'CREATING...' : 'CREATE CELL'}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-600 rounded-xl p-6">
          <div className="flex items-center mb-6">
            <div className="text-3xl mr-3">🏢</div>
            <h3 className="text-2xl font-bold text-white tracking-wider">
              <span className="text-orange-400">AVAILABLE</span>{' '}
              <span className="text-red-400">CELLS</span>
            </h3>
          </div>
          
          {openGames.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-50">🔒</div>
              <p className="text-gray-300 text-lg font-mono">No active cells. Create one to begin...</p>
              <p className="text-gray-400 text-sm mt-2">The prison awaits your first move</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {openGames.map((game) => {
                const isUserInGame = userAddress && (
                  game.player1.toLowerCase() === userAddress.toLowerCase() ||
                  (game.player2 && game.player2.toLowerCase() === userAddress.toLowerCase())
                );
                
                return (
                  <div key={game.id} className="bg-gradient-to-r from-gray-800 to-gray-700 border-2 border-gray-600 rounded-xl p-6 shadow-xl transform hover:scale-[1.02] transition-all duration-300 choice-card">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-4">
                          <div className="text-3xl mr-3">🔐</div>
                          <div>
                            <h4 className="text-xl font-bold text-white tracking-wider">
                              CELL #{game.id}
                            </h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                game.status === 'open' ? 'bg-green-600 text-green-100' :
                                game.status === 'full' ? 'bg-blue-600 text-blue-100' :
                                'bg-gray-600 text-gray-100'
                              }`}>
                                {game.status.toUpperCase()}
                              </span>
                              <span className="text-orange-400 font-mono text-lg">
                                💰 {game.stake} ETH
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400 font-mono">PRISONER 1:</span>
                              <div className="text-white font-mono">
                                {game.player1.slice(0, 6)}...{game.player1.slice(-4)}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-400 font-mono">PRISONER 2:</span>
                              <div className="text-white font-mono">
                                {game.player2 && game.player2 !== '0x0000000000000000000000000000000000000000' 
                                  ? `${game.player2.slice(0, 6)}...${game.player2.slice(-4)}`
                                  : 'VACANT'
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {game.status === 'finished' && game.result && (
                          <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4">
                            <div className="text-red-200 font-bold mb-2 flex items-center">
                              <span className="text-2xl mr-2">⚖️</span>
                              VERDICT DELIVERED
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-gray-300">Move: <span className={game.result.player1Move === 'Cooperate' ? 'text-blue-400' : 'text-red-400'}>{game.result.player1Move}</span></div>
                                <div className="text-gray-300">Earned: <span className="text-green-400 font-bold">{game.result.player1Payout} ETH</span></div>
                              </div>
                              <div>
                                <div className="text-gray-300">Move: <span className={game.result.player2Move === 'Cooperate' ? 'text-blue-400' : 'text-red-400'}>{game.result.player2Move}</span></div>
                                <div className="text-gray-300">Earned: <span className="text-green-400 font-bold">{game.result.player2Payout} ETH</span></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-shrink-0 ml-6">
                        {isUserInGame ? (
                          <button
                            className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg transform hover:scale-105 transition-all duration-300 border-2 border-blue-400/50"
                            onClick={() => onEnterGame(game.id)}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-xl">🚪</span>
                              <span>ENTER CELL</span>
                            </div>
                          </button>
                        ) : game.status === 'open' ? (
                          <button
                            className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-green-400/50"
                            onClick={() => {
                              const stakeNum = parseFloat(game.stake);
                              if (stakeNum < MIN_STAKE) {
                                alert(`⚠️ This game has invalid stake (${game.stake} ETH). Minimum required: ${MIN_STAKE} ETH`);
                                return;
                              }
                              onJoin(game.id, game.stake);
                            }}
                            disabled={!isConnected || loading || parseFloat(game.stake) < MIN_STAKE}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-xl group-hover:animate-pulse">⚡</span>
                              <span>{loading ? 'JOINING...' : `JOIN (${game.stake} ETH)`}</span>
                            </div>
                          </button>
                        ) : (
                          <div className="text-center">
                            <div className="text-4xl mb-2 opacity-50">🔒</div>
                            <span className="text-gray-400 font-mono text-sm">
                              {game.status === 'full' ? 'CELL FULL' : 'CASE CLOSED'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameLobby;
