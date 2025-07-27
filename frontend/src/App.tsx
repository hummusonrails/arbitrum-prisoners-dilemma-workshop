import React, { useState, useEffect, useCallback } from 'react';
import ConnectWalletButton from './components/ConnectWalletButton';
import StatusBanner from './components/StatusBanner';
import GameLobby from './components/GameLobby';
import GameBoard from './components/GameBoard';
import GameHistory from './components/GameHistory';
import { useWeb3 } from './contexts/Web3Context';
import { localhost } from './constants';
import abi from './abi/PrisonersDilemmaContract.json';

const CONTRACT_ADDRESS = '0x1840aeeaf2d22038673f0b651a26895ed01faf1c' as `0x${string}`;

function App() {
  const { publicClient, walletClient, address, isConnected } = useWeb3();
  const [allGames, setAllGames] = useState<any[]>([]);
  const [activeGame, setActiveGame] = useState<any | null>(null);
  const [currentView, setCurrentView] = useState<'lobby' | 'game'>('lobby');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [gameHistory] = useState<any[]>([]);
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
        
        // Check for active game
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
                setActiveGame(activeGameData);
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
      });
      
      console.log('[App] Submit move transaction hash:', hash);
      // Wait a bit before fetching to avoid race conditions
      setTimeout(() => fetchGameData(), 3000);
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
      const interval = setInterval(fetchGameData, 3000);
      return () => clearInterval(interval);
    }
  }, [isContractInitialized, publicClient, fetchGameData]);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Prisoner's Dilemma DApp
            </h1>
            <ConnectWalletButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StatusBanner isConnected={isConnected} address={address || undefined} chain={localhost} />
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {!isConnected ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Connect Your Wallet to Play
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Connect your wallet to start playing the Prisoner's Dilemma game.
            </p>
          </div>
        ) : isContractInitialized === null ? (
          <div className="text-center py-8">
            <p className="text-gray-300 mb-4">Checking contract status...</p>
          </div>
        ) : !isContractInitialized ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Contract Initialization Required</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              The Prisoner's Dilemma contract needs to be initialized before you can play.
              This sets up the minimum stake and prepares the game for players.
            </p>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded disabled:opacity-50"
              onClick={initializeContract}
              disabled={initializeLoading}
            >
              {initializeLoading ? 'Initializing...' : 'Initialize Contract'}
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
            <div className="mb-4">
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                onClick={() => setCurrentView('lobby')}
              >
                ← Back to Lobby
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
            <p className="text-gray-500">No game selected</p>
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
