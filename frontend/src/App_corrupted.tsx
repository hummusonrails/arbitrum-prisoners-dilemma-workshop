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
  const { publicClient, walletClient, address, isConnected, connect } = useWeb3();
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
        account: address,
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

  // Fetch game result for finished games
  const fetchGameResult = async (gameId: string) => {
    if (!publicClient) return null;
    
    try {
      const resultData = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'getGameResult',
        args: [BigInt(gameId)],
      }) as [number, number, bigint, bigint];

      const [player1Move, player2Move, player1Payout, player2Payout] = resultData;
      
      return {
        player1Move: player1Move === 0 ? 'Cooperate' : 'Defect',
        player2Move: player2Move === 0 ? 'Cooperate' : 'Defect',
        player1Payout: (Number(player1Payout) / 1e18).toFixed(4),
        player2Payout: (Number(player2Payout) / 1e18).toFixed(4),
      };
    } catch (error) {
      console.error('[App] Error fetching game result:', error);
      return null;
    }
  };

  // Fetch game data
  const fetchGameData = useCallback(async () => {
    if (!publicClient || !isContractInitialized) return;
    
    try {
      console.log('[App] Fetching game data...');
      const gameCounter = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'getGameCounter',
      }) as bigint;

      const games = [];
      for (let i = 1; i <= Number(gameCounter); i++) {
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
        
        // Fetch result data for finished games
        if (isFinished) {
          const result = await fetchGameResult(i.toString());
          if (result) {
            game.result = result;
          }
        }
        
        games.push(game);
      }

      console.log('[App] Fetched games:', games);
      setAllGames(games);
      
      // Check for active game
      if (address) {
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
      }
    } catch (error) {
      console.error('[App] Error fetching game data:', error);
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
        account: address,
        value: BigInt(Math.floor(parseFloat(stake) * 1e18)),
      });
      
      console.log('[App] Create game transaction hash:', hash);
      await fetchGameData();
      setTimeout(() => fetchGameData(), 2000);
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
        account: address,
        value: BigInt(Math.floor(parseFloat(stake) * 1e18)),
      });
      
      console.log('[App] Join game transaction hash:', hash);
      await fetchGameData();
      setTimeout(() => fetchGameData(), 2000);
    } catch (error) {
      console.error('[App] Error joining game:', error);
      setError('Failed to join game: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  // Submit move
  const handleMove = async (gameId: string, move: 'cooperate' | 'defect') => {
    if (!walletClient || !address || !activeGame) return;
    
    try {
      setMoveLoading(true);
      setError(null);
      
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'submitMove',
        args: [BigInt(activeGame.id), move === 'cooperate' ? 0 : 1],
        account: address,
      });
      
      console.log('[App] Submit move transaction hash:', hash);
      await fetchGameData();
      setTimeout(() => fetchGameData(), 2000);
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
        <StatusBanner isConnected={isConnected} address={address} chain={localhost} />
        
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
              userAddress={address}
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
              address={address}
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

  // Initialize contract
  const initializeContract = useCallback(async () => {
    if (!walletClient || !address) {
      setError('Wallet not connected');
      return;
    }
    
    setInitializeLoading(true);
    setError(null);
    
    try {
      // Initialize with 0.01 ETH minimum stake
      const minStake = BigInt('10000000000000000'); // 0.01 ETH in wei
      
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'initialize',
        account: address as `0x${string}`,
        args: [minStake],
        chain: localhost,
      });
      
      console.log('[App] Contract initialization transaction:', hash);
      
      // Wait for transaction confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      
      // Check initialization status
      await checkContractInitialization();
      
      console.log('[App] Contract initialized successfully');
    } catch (error) {
      console.error('[App] Contract initialization failed:', error);
      setError('Contract initialization failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setInitializeLoading(false);
    }
  }, [walletClient, address, publicClient, checkContractInitialization]);

  // Fetch game data (only if contract is initialized)
  const fetchGameResult = async (gameId: string) => {
    if (!publicClient) return null;
    
    try {
      const resultData = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'getGameResult',
        args: [BigInt(gameId)],
      }) as [number, number, bigint, bigint];

      const [player1Move, player2Move, player1Payout, player2Payout] = resultData;
      
      return {
        player1Move: player1Move === 0 ? 'Cooperate' : 'Defect',
        player2Move: player2Move === 0 ? 'Cooperate' : 'Defect',
        player1Payout: (Number(player1Payout) / 1e18).toFixed(4),
        player2Payout: (Number(player2Payout) / 1e18).toFixed(4),
      };
    } catch (error) {
      console.error('[App] Error fetching game result:', error);
      return null;
    }
  };

  const fetchGameData = async () => {
    if (!publicClient || !isContractInitialized) return;
    
    try {
      console.log('[App] Fetching game data...');
      const gameCounter = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'getGameCounter',
      }) as bigint;

      const games = [];
      for (let i = 1; i <= Number(gameCounter); i++) {
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
        
        // Fetch result data for finished games
        if (isFinished) {
          const result = await fetchGameResult(i.toString());
          if (result) {
            game.result = result;
          }
        }
        
        games.push(game);
      }

      console.log('[App] Fetched games:', games);
      setAllGames(games);
      
      // If user is connected, check for their active game
      if (address) {
        const playerGameId = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi,
          functionName: 'getPlayerGame',
          args: [address],
        }) as bigint;
        
        if (Number(playerGameId) > 0) {
          const gameData = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi,
            functionName: 'getGame',
            args: [playerGameId],
          }) as any[];
          
          console.log('[App] Raw game data:', gameData);
          console.log('[App] Player game ID:', playerGameId.toString());
          
          if (gameData && Array.isArray(gameData)) {
            const parsedGame = {
              id: playerGameId.toString(),
              player1: gameData[0],
              player2: gameData[1],
              stake: (Number(gameData[2]) / 1e18).toString(),
              player1Move: gameData[3],
              player2Move: gameData[4],
              isFinished: gameData[5],
            };
            console.log('[App] Parsed game data:', parsedGame);
            
            // Only set as active game if player2 exists (game has been joined)
            // If player2 is 0x0000...0000, it means game is still open for joining
            if (gameData[1] !== '0x0000000000000000000000000000000000000000') {
              setActiveGame(parsedGame);
            } else {
              // Game exists but not joined yet - show in lobby
              setActiveGame(null);
            }
          }
        } else {
          setActiveGame(null);
        }
      }
    } catch (error) {
      console.error('[App] Error fetching game data:', error);
      setError('Failed to fetch game data: ' + (error instanceof Error ? error.message : String(error)));
    }
  }, [publicClient, address, CONTRACT_ADDRESS, isContractInitialized]);

  // Check contract initialization on mount and periodically
  useEffect(() => {
    if (publicClient) {
      checkContractInitialization();
      
      // Set up periodic check every 5 seconds if not initialized
      const interval = setInterval(() => {
        if (!isContractInitialized) {
          checkContractInitialization();
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [publicClient, checkContractInitialization, isContractInitialized]);

  // Fetch game data when contract is initialized
  useEffect(() => {
    if (isContractInitialized && publicClient) {
      fetchGameData();
      // More frequent polling for better real-time sync
      const interval = setInterval(() => {
        console.log('[App] Periodic game data refresh...');
        fetchGameData();
      }, 2000); // Refresh every 2 seconds for better sync
      return () => clearInterval(interval);
    }
  }, [isContractInitialized, publicClient, fetchGameData]);

  // Create game
  const handleCreateGame = useCallback(async (stake: string) => {
    if (!walletClient || !address) {
      setError('Wallet not connected');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'createGame',
        account: address as `0x${string}`,
        args: [],
        value: BigInt(Number(stake) * 1e18),
        chain: localhost,
      });
      
      // Immediate refresh after transaction
      fetchGameData();
      // Additional refresh after a short delay to ensure transaction is processed
      setTimeout(() => fetchGameData(), 1000);
    } catch (error) {
      console.error('[App] Create game failed:', error);
      setError('Create game failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  }, [walletClient, address, fetchGameData]);

  // Join game
  const handleJoinGame = useCallback(async (gameId: string, stake: string) => {
    if (!walletClient || !address) {
      setError('Wallet not connected');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'joinGame',
        account: address as `0x${string}`,
        args: [BigInt(gameId)],
        value: BigInt(Number(stake) * 1e18),
        chain: localhost,
      });
      
      // Immediate refresh after transaction
      fetchGameData();
      // Additional refresh after a short delay to ensure transaction is processed
      setTimeout(() => fetchGameData(), 1000);
    } catch (error) {
      console.error('[App] Join game failed:', error);
      setError('Join game failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  }, [walletClient, address, fetchGameData]);

  // Submit move
  const handleMove = useCallback(async (move: 0 | 1) => {
    if (!walletClient || !address || !activeGame) {
      setError('Wallet not connected or no active game');
      return;
    }
    
    setMoveLoading(true);
    setError(null);
    
    try {
      await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'submitMove',
        account: address as `0x${string}`,
        args: [BigInt(activeGame.id), move],
        chain: localhost,
      });
      
      // Immediate refresh after transaction
      fetchGameData();
      // Additional refresh after a short delay to ensure transaction is processed
      setTimeout(() => fetchGameData(), 1000);
    } catch (error) {
      console.error('[App] Submit move failed:', error);
      setError('Submit move failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setMoveLoading(false);
    }
  }, [walletClient, address, activeGame, fetchGameData]);

  // Clear data when disconnected
  useEffect(() => {
    if (!isConnected) {
      setAllGames([]);
      setActiveGame(null);
      setIsContractInitialized(null);
    }
  }, [isConnected]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 dark:from-gray-900 dark:to-blue-950 text-gray-900 dark:text-white">
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold tracking-tight">Prisoner's Dilemma DApp</h1>
        <ConnectWalletButton />
      </header>
      <StatusBanner />
      
      {error && (
        <div className="max-w-3xl mx-auto p-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        </div>
      )}
      
      <main className="max-w-3xl mx-auto p-4">
        {!isConnected || !address ? (
          <div className="text-center py-8">
            <p className="text-gray-300 mb-4">Please connect your wallet to play Prisoner's Dilemma</p>
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
              onEnterGame={(gameId: string) => {
                setSelectedGameId(gameId);
                setCurrentView('game');
              }}
              loading={loading}
              userAddress={address}
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
              address={address}
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
      <footer className="p-4 text-center text-xs text-gray-500">
        Powered by Arbitrum Stylus &bull; {CONTRACT_ADDRESS}
      </footer>
    </div>
  );
}

export default App;