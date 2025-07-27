import React, { useState, useEffect, useCallback } from 'react';
import ConnectWalletButton from './components/ConnectWalletButton';
import StatusBanner from './components/StatusBanner';
import GameLobby from './components/GameLobby';
import GameBoard from './components/GameBoard';
import GameHistory from './components/GameHistory';
import { useWeb3 } from './contexts/Web3Context';
import { localhost } from './constants';
import abi from './abi/PrisonersDilemmaContract.json';

const CONTRACT_ADDRESS = '0x47cec0749bd110bc11f9577a70061202b1b6c034' as `0x${string}`;

function App() {
  const { publicClient, walletClient, address, isConnected } = useWeb3();
  const [allGames, setAllGames] = useState<any[]>([]);
  const [activeGame, setActiveGame] = useState<any | null>(null);
  const [currentView, setCurrentView] = useState<'lobby' | 'game'>('lobby');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [moveLoading, setMoveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isContractInitialized, setIsContractInitialized] = useState<boolean | null>(null);
  const [initializeLoading, setInitializeLoading] = useState(false);


  // Check contract initialization
  const checkContractInitialization = useCallback(async () => {
    if (!publicClient) return;
    
    try {
      const minStake = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'getMinStake',
      }) as bigint;
      
      setIsContractInitialized(Number(minStake) > 0);
    } catch (error) {
      console.error('[App] Error checking contract initialization:', error);
      setIsContractInitialized(false);
    }
  }, [publicClient]);

  // Initialize contract
  const initializeContract = async () => {
    if (!walletClient || !address) return;
    
    try {
      setInitializeLoading(true);
      setError(null);
      
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'initialize',
        args: [BigInt('10000000000000000')], // 0.01 ETH in wei
        account: address as `0x${string}`,
        chain: localhost,
      });
      
      console.log('[App] Initialize transaction hash:', hash);
      await checkContractInitialization();
    } catch (error) {
      console.error('[App] Error initializing contract:', error);
      setError('Failed to initialize contract: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setInitializeLoading(false);
    }
  };

  // Fetch game result for finished games with retry logic
  const fetchGameResult = async (gameId: string, retries = 2) => {
    if (!publicClient) return null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const resultData = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi,
          functionName: 'getGameResult',
          args: [BigInt(gameId)],
        }) as [number, number, bigint, bigint];

        const [player1Move, player2Move, player1Payout, player2Payout] = resultData;
        
        // Check if we got valid data (not default zeros for unfinished games)
        if (player1Payout === 0n && player2Payout === 0n) {
          return null; // Game not finished yet
        }
        
        return {
          player1Move: player1Move === 0 ? 'Cooperate' : 'Defect',
          player2Move: player2Move === 0 ? 'Cooperate' : 'Defect',
          player1Payout: (Number(player1Payout) / 1e18).toFixed(4),
          player2Payout: (Number(player2Payout) / 1e18).toFixed(4),
        };
      } catch (error) {
        console.error(`[App] Error fetching game result (attempt ${attempt + 1}):`, error);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
        }
      }
    }
    return null;
  };

  // Fetch game data with error handling and retry logic
  const fetchGameData = useCallback(async (retries = 2) => {
    if (!publicClient || !isContractInitialized) return;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`[App] Fetching game data... (attempt ${attempt + 1})`);
        const gameCounter = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi,
          functionName: 'getGameCounter',
        }) as bigint;

        const games = [];
        for (let i = 1; i <= Number(gameCounter); i++) {
          try {
            const gameData = await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi,
              functionName: 'getGame',
              args: [BigInt(i)],
            }) as [string, string, bigint, boolean, boolean, boolean];

            const [player1, player2, stake, player1HasMoved, player2HasMoved, isFinished] = gameData;
            
            const game: any = {
              id: i.toString(),
              player1,
              player2,
              stake: (Number(stake) / 1e18).toFixed(4),
              player1HasMoved,
              player2HasMoved,
              isFinished,
              isOpen: player2 === '0x0000000000000000000000000000000000000000',
              isFull: player2 !== '0x0000000000000000000000000000000000000000' && !isFinished,
              status: isFinished ? 'finished' : 
                      player2 === '0x0000000000000000000000000000000000000000' ? 'open' : 'full'
            };
            
            // Fetch result data for finished games only
            if (isFinished) {
              const result = await fetchGameResult(i.toString());
              if (result) {
                game.result = result;
              }
            }
            
            games.push(game);
          } catch (gameError) {
            console.error(`[App] Error fetching game ${i}:`, gameError);
            // Skip this game and continue with others
          }
        }

        console.log('[App] Fetched games:', games);
        setAllGames(games);
        
        // Update game history with finished games
        const finishedGames = games.filter(game => game.isFinished && game.result);
        if (finishedGames.length > 0) {
          setGameHistory(prevHistory => {
            const existingIds = new Set(prevHistory.map(g => g.id));
            const newGames = finishedGames.filter(g => !existingIds.has(g.id)).map(game => ({
              ...game,
              result: `${game.result.player1Move} vs ${game.result.player2Move} | P1: ${game.result.player1Payout} ETH, P2: ${game.result.player2Payout} ETH`
            }));
            if (newGames.length > 0) {
              console.log('[App] Adding new finished games to history:', newGames);
              return [...prevHistory, ...newGames].sort((a, b) => parseInt(b.id) - parseInt(a.id));
            }
            return prevHistory;
          });
        }
        
        // Check for active game and update if it exists
        if (address) {
          try {
            const playerGameId = await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi,
              functionName: 'getPlayerGame',
              args: [address],
            }) as bigint;
            
            if (Number(playerGameId) > 0) {
              const activeGameData = games.find(g => g.id === playerGameId.toString());
              if (activeGameData && activeGameData.player2 !== '0x0000000000000000000000000000000000000000') {
                setActiveGame((prevActive: any) => {
                  // Only update if the game state has actually changed
                  if (!prevActive || prevActive.id !== activeGameData.id || 
                      prevActive.isFinished !== activeGameData.isFinished ||
                      prevActive.player1HasMoved !== activeGameData.player1HasMoved ||
                      prevActive.player2HasMoved !== activeGameData.player2HasMoved) {
                    console.log('[App] Updating active game:', activeGameData);
                    return activeGameData;
                  }
                  return prevActive;
                });
                
                // If the active game is finished, redirect to lobby after a delay
                if (activeGameData.isFinished && currentView === 'game') {
                  console.log('[App] Game finished, redirecting to lobby in 3 seconds...');
                  setTimeout(() => {
                    setCurrentView('lobby');
                    setActiveGame(null);
                    setSelectedGameId(null);
                  }, 3000);
                }
              } else if (Number(playerGameId) === 0) {
                // Player has no active game
                setActiveGame(null);
              }
            }
          } catch (playerGameError) {
            console.error('[App] Error fetching player game:', playerGameError);
          }
        }
        

        return; // Success, exit retry loop
      } catch (error) {
        console.error(`[App] Error fetching game data (attempt ${attempt + 1}):`, error);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5s before retry
        }
      }
    }
  }, [publicClient, isContractInitialized, address]);

  // Create game
  const handleCreateGame = async (stake: string) => {
    if (!walletClient || !address) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'createGame',
        args: [],
        account: address as `0x${string}`,
        value: BigInt(Math.floor(parseFloat(stake) * 1e18)),
        chain: localhost,
      });
      
      console.log('[App] Create game transaction hash:', hash);
      // Wait a bit before fetching to avoid race conditions
      setTimeout(() => fetchGameData(), 3000);
    } catch (error) {
      console.error('[App] Error creating game:', error);
      setError('Failed to create game: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  // Join game
  const handleJoinGame = async (gameId: string, stake: string) => {
    if (!walletClient || !address) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'joinGame',
        args: [BigInt(gameId)],
        account: address as `0x${string}`,
        value: BigInt(Math.floor(parseFloat(stake) * 1e18)),
        chain: localhost,
      });
      
      console.log('[App] Join game transaction hash:', hash);
      // Wait a bit before fetching to avoid race conditions
      setTimeout(() => fetchGameData(), 3000);
    } catch (error) {
      console.error('[App] Error joining game:', error);
      setError('Failed to join game: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  // Submit move
  const handleMove = async (move: 0 | 1) => {
    if (!walletClient || !address || !activeGame) return;
    
    try {
      setMoveLoading(true);
      setError(null);
      
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'submitMove',
        args: [BigInt(activeGame.id), move],
        account: address as `0x${string}`,
        chain: localhost,
      });
      
      console.log('[App] Submit move transaction hash:', hash);
      // More aggressive polling after move submission to catch state changes quickly
      setTimeout(() => {
        fetchGameData();
        // Additional polling for the next 15 seconds to catch game completion
        const pollInterval = setInterval(() => {
          fetchGameData();
        }, 2000);
        setTimeout(() => clearInterval(pollInterval), 15000);
      }, 2000);
    } catch (error) {
      console.error('[App] Error submitting move:', error);
      setError('Failed to submit move: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setMoveLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    if (!isConnected) {
      setAllGames([]);
      setActiveGame(null);
      setIsContractInitialized(null);
    }
    if (isConnected && publicClient) {
      checkContractInitialization();
    }
  }, [isConnected, publicClient, checkContractInitialization]);

  useEffect(() => {
    if (isContractInitialized && publicClient) {
      fetchGameData();
      // More frequent polling when in an active game to catch state changes quickly
      const pollInterval = currentView === 'game' && activeGame && !activeGame.isFinished ? 2000 : 5000;
      const interval = setInterval(fetchGameData, pollInterval);
      return () => clearInterval(interval);
    }
  }, [isContractInitialized, publicClient, fetchGameData, currentView, activeGame]);

  useEffect(() => {
    if (publicClient) {
      const interval = setInterval(checkContractInitialization, 5000);
      return () => clearInterval(interval);
    }
  }, [publicClient, checkContractInitialization]);

  // Handle game selection for navigation
  const handleEnterGame = (gameId: string) => {
    const game = allGames.find(g => g.id === gameId);
    if (game) {
      setActiveGame(game);
      setSelectedGameId(gameId);
      setCurrentView('game');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 relative overflow-hidden">
      {/* Prison bars overlay */}
      <div className="fixed inset-0 pointer-events-none z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-800/20 to-transparent" 
             style={{
               backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 40px, rgba(75, 85, 99, 0.3) 40px, rgba(75, 85, 99, 0.3) 44px)',
               animation: 'bars-shadow 3s ease-in-out infinite alternate'
             }}>
        </div>
      </div>
      
      <header className="bg-gray-900/95 backdrop-blur-sm shadow-2xl border-b border-red-900/30 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-6xl animate-pulse">⚖️</div>
              <div>
                <h1 className="text-4xl font-bold text-white drop-shadow-lg tracking-wider">
                  <span className="text-red-400">PRISONER'S</span>{' '}
                  <span className="text-orange-400">DILEMMA</span>
                </h1>
                <p className="text-gray-300 text-sm font-mono tracking-widest opacity-75">
                  TRUST • BETRAY • SURVIVE
                </p>
              </div>
            </div>
            <div className="transform hover:scale-105 transition-transform duration-300">
              <ConnectWalletButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-20">
        <div className="mb-6 transform hover:scale-[1.02] transition-all duration-500">
          <StatusBanner />
        </div>
        
        {error && (
          <div className="bg-red-900/90 border-2 border-red-500 text-red-200 px-6 py-4 rounded-lg mb-6 shadow-2xl backdrop-blur-sm animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <div className="font-bold text-red-100">SYSTEM ALERT</div>
                <div className="font-mono text-sm">{error}</div>
              </div>
            </div>
          </div>
        )}
        
        {!isConnected ? (
          <div className="text-center py-16 relative">
            <div className="bg-gray-900/80 backdrop-blur-sm border-2 border-gray-700 rounded-2xl p-12 shadow-2xl transform hover:scale-105 transition-all duration-700 hover:border-orange-500/50">
              <div className="text-8xl mb-6 animate-bounce">🔒</div>
              <h2 className="text-3xl font-bold text-white mb-6 tracking-wider">
                <span className="text-orange-400">CELL</span> <span className="text-red-400">LOCKED</span>
              </h2>
              <p className="text-gray-300 text-lg mb-8 font-mono">
                Connect your wallet to enter the prison...
              </p>
              <div className="border-t border-gray-600 pt-6">
                <p className="text-gray-400 text-sm">
                  Only the connected can participate in the dilemma
                </p>
              </div>
            </div>
          </div>
        ) : isContractInitialized === null ? (
          <div className="text-center py-12">
            <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-xl p-8 shadow-2xl">
              <div className="text-6xl mb-4 animate-spin">⚙️</div>
              <p className="text-gray-300 mb-4 font-mono tracking-wider">SCANNING PRISON SYSTEMS...</p>
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        ) : !isContractInitialized ? (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-red-600/50 rounded-2xl shadow-2xl p-8 mb-8 text-center transform hover:scale-[1.02] transition-all duration-500">
            <div className="text-7xl mb-6 animate-pulse">⚠️</div>
            <h2 className="text-3xl font-bold text-white mb-4 tracking-wider">
              <span className="text-red-400">PRISON</span> <span className="text-orange-400">UNINITIALIZED</span>
            </h2>
            <p className="text-gray-300 mb-8 text-lg font-mono leading-relaxed">
              The correctional facility systems require initialization.<br/>
              <span className="text-orange-300">Establish minimum stakes and prepare the cells...</span>
            </p>
            <button
              className="group bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-red-400/50 hover:border-orange-400/70"
              onClick={initializeContract}
              disabled={initializeLoading}
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl group-hover:animate-spin">🔑</div>
                <span className="tracking-wider">
                  {initializeLoading ? 'INITIALIZING SYSTEMS...' : 'INITIALIZE PRISON'}
                </span>
              </div>
            </button>
          </div>
        ) : currentView === 'lobby' ? (
          <div>
            <GameLobby 
              openGames={allGames} 
              onCreate={handleCreateGame} 
              onJoin={handleJoinGame} 
              onEnterGame={handleEnterGame}
              loading={loading}
              userAddress={address || undefined}
            />
          </div>
        ) : currentView === 'game' && selectedGameId ? (
          <div>
            <div className="mb-6">
              <button
                className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-bold px-6 py-3 rounded-lg shadow-lg border border-gray-500/50 transition-all duration-300 transform hover:scale-105 relative z-30 flex items-center space-x-2"
                onClick={() => setCurrentView('lobby')}
              >
                <span className="text-lg">←</span>
                <span>Back to Lobby</span>
              </button>
            </div>
            <GameBoard
              game={activeGame}
              address={address || ''}
              onMove={handleMove}
              moveLoading={moveLoading}
              result={undefined}
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-300">No game selected</p>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mt-4"
              onClick={() => setCurrentView('lobby')}
            >
              Go to Lobby
            </button>
          </div>
        )}
        <GameHistory history={gameHistory} />
      </main>
    </div>
  );
}

export default App;
