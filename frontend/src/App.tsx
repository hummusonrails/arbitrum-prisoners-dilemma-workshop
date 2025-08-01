import { useState, useEffect, useCallback } from 'react';
import { ConnectWalletButton, StatusBanner, GameLobby, CellView, GameHistory, Footer } from './components';
import { useWeb3 } from './contexts/Web3Context';
import { parseEther } from 'viem';
import { localhost } from './constants';
import abi from './abi/PrisonersDilemmaContract.json';

const CONTRACT_ADDRESS = '0xd542490eba60e4b4d28d23c5b392b1607438f3cc' as const;

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

type ViewType = 'lobby' | 'cell' | 'history';

export default function App() {
  const { address, isConnected, walletClient, publicClient } = useWeb3();

  // State variables
  const [cells, setCells] = useState<Cell[]>([]);
  const [activeCell, setActiveCell] = useState<Cell | null>(null);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [cellHistory, setCellHistory] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(false);
  const [moveLoading, setMoveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('lobby');
  const [initializeLoading, setInitializeLoading] = useState(false);
  const [isContractInitialized, setIsContractInitialized] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [minStake, setMinStake] = useState<bigint>(BigInt(0));

  // Initialize contract
  const initializeContract = async () => {
    if (!walletClient || !address) return;
    
    try {
      setInitializeLoading(true);
      setError(null);
      
      const result = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'initialize',
        args: [parseEther('0.01')],
        chain: localhost,
        account: address as `0x${string}`,
      });
      
      console.log('[App] Initialize contract transaction hash:', result);
    } catch (error) {
      console.error('[App] Error initializing contract:', error);
      setError('Failed to initialize contract: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setInitializeLoading(false);
    }
  };

  // Check if contract is initialized
  const checkContractInitialization = async () => {
    if (!publicClient) return false;
    
    try {
      console.log('[App] Checking contract initialization...');
      console.log('[App] Contract address:', CONTRACT_ADDRESS);
      
      // Force fresh blockchain read to avoid stale state
      const latestBlock = await publicClient.getBlockNumber();
      console.log('[App] Reading from latest block:', latestBlock);
      
      // Check if contract is initialized by checking if owner is set
      // In an uninitialized contract, owner should be Address::ZERO (0x0000...)
      const ownerResult = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'getOwner',
        args: [],
        blockNumber: latestBlock,
      });
      
      console.log('[App] Owner result:', ownerResult);
      
      // If owner is zero address, the contract is not initialized
      const isInitialized = ownerResult !== '0x0000000000000000000000000000000000000000';
      
      if (!isInitialized) {
        console.log('[App] Contract not initialized - owner is zero address');
        setIsContractInitialized(false);
        setMinStake(BigInt(0));
        return false;
      }
      
      // Contract is initialized, now get the min stake
      const minStakeResult = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'getMinStake',
        args: [],
        blockNumber: latestBlock,
      });
      
      console.log('[App] Contract is initialized, owner:', ownerResult, 'min stake:', minStakeResult);
      setMinStake(minStakeResult as bigint);
      setIsContractInitialized(true);
      setError(null);
      return true;
    } catch (error) {
      console.error('[App] DETAILED ERROR checking contract initialization:');
      console.error('[App] Error type:', typeof error);
      console.error('[App] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[App] Full error object:', error);
      console.error('[App] Contract address being called:', CONTRACT_ADDRESS);
      console.error('[App] Public client available:', !!publicClient);
      console.error('[App] ABI available:', !!abi);
      setIsContractInitialized(false);
      return false;
    }
  };

  // Fetch cell data from contract
  const fetchCellData = async (cellId: string): Promise<Cell | null> => {
    if (!publicClient) return null;
    
    try {
      const latestBlock = await publicClient.getBlockNumber();
      
      const cellData = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'getCell',
        args: [BigInt(cellId)],
        blockNumber: latestBlock,
      }) as any[];
      
      if (!cellData || cellData.length === 0) return null;
      
      // Parse cell data according to contract structure
      const cell: Cell = {
        id: cellId,
        player1: cellData[0],
        player2: cellData[1],
        stake: cellData[2],
        totalRounds: Number(cellData[3]),
        currentRound: Number(cellData[4]),
        isComplete: cellData[5],
        rounds: []
      };
      
      console.log(`[App] Fetched cell ${cellId}:`, {
        totalRounds: cell.totalRounds,
        currentRound: cell.currentRound,
        isComplete: cell.isComplete,
        rawData: cellData
      });
      
      // Fetch round data for each round
      for (let i = 1; i <= cell.currentRound; i++) {
        try {
          const roundData = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi,
            functionName: 'getRoundResult',
            args: [BigInt(cellId), BigInt(i)],
            blockNumber: latestBlock,
          }) as any[];
          
          // Only add round data if it represents a real completed round
          // Contract returns (0, 0, 0, 0) for non-existent rounds
          if (roundData && roundData.length > 0) {
            const player1Payout = roundData[2] || BigInt(0);
            const player2Payout = roundData[3] || BigInt(0);
            
            // Skip if this looks like default/empty data from contract
            // Real rounds should have non-zero payouts or be explicitly marked as finished
            if (player1Payout > BigInt(0) || player2Payout > BigInt(0)) {
              cell.rounds.push({
                roundNumber: i,
                player1Move: roundData[0] !== null ? Number(roundData[0]) : null,
                player2Move: roundData[1] !== null ? Number(roundData[1]) : null,
                player1Payout: player1Payout,
                player2Payout: player2Payout,
                isComplete: true
              });
            }
          }
        } catch (roundError) {
          console.warn(`[App] Could not fetch round ${i} for cell ${cellId}:`, roundError);
        }
      }
      
      return cell;
    } catch (error) {
      console.error('[App] Error fetching cell data:', error);
      return null;
    }
  };

  // Update cells state by fetching from contract
  const updateCellsState = async () => {
    if (!publicClient || !isContractInitialized) return;
    
    try {
      const latestBlock = await publicClient.getBlockNumber();
      
      // Get total number of cells
      const cellCounter = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'getCellCounter',
        args: [],
        blockNumber: latestBlock,
      }) as bigint;
      
      const cellCount = Number(cellCounter);
      const newCells: Cell[] = [];
      
      // Fetch each cell
      for (let i = 1; i <= cellCount; i++) {
        const cell = await fetchCellData(i.toString());
        if (cell) {
          newCells.push(cell);
        }
      }
      
      setCells(newCells);
      
      // Update active cell if one is selected
      if (selectedCellId) {
        const updatedActiveCell = newCells.find(c => c.id === selectedCellId);
        if (updatedActiveCell) {
          setActiveCell(updatedActiveCell);
        }
      }
      
      // Update cell history with completed cells
      const completedCells = newCells.filter(c => c.isComplete);
      setCellHistory(completedCells);
      
    } catch (error) {
      console.error('[App] Error updating cells state:', error);
    }
  };

  // Polling for updates
  const pollForCellUpdates = useCallback((maxPolls: number = 10) => {
    if (isPolling) return;
    
    setIsPolling(true);
    let pollCount = 0;
    
    const pollInterval = setInterval(async () => {
      pollCount++;
      console.log(`[App] Polling for updates (${pollCount}/${maxPolls})`);
      
      if (publicClient && isContractInitialized) {
        await updateCellsState();
      }
      
      if (pollCount >= maxPolls) {
        clearInterval(pollInterval);
        setIsPolling(false);
      }
    }, 2000);
    
    // Cleanup function
    return () => {
      clearInterval(pollInterval);
      setIsPolling(false);
    };
  }, [publicClient, isContractInitialized, isPolling]);

  // Create new cell
  const handleCreateCell = async (stake: string) => {
    if (!walletClient || !address) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'createCell',
        args: [],
        account: address as `0x${string}`,
        value: BigInt(Math.floor(parseFloat(stake) * 1e18)),
        chain: localhost,
      });
      
      console.log('[App] Create cell transaction hash:', hash);
      pollForCellUpdates(5);
    } catch (error) {
      console.error('[App] Error creating cell:', error);
      setError('Failed to create cell: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  // Join existing cell
  const handleJoinCell = async (cellId: string, stake: string) => {
    if (!walletClient || !address) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'joinCell',
        args: [BigInt(cellId)],
        account: address as `0x${string}`,
        value: BigInt(Math.floor(parseFloat(stake) * 1e18)),
        chain: localhost,
      });
      
      console.log('[App] Join cell transaction hash:', hash);
      pollForCellUpdates(5);
    } catch (error) {
      console.error('[App] Error joining cell:', error);
      setError('Failed to join cell: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  // Submit move for current round
  const handleMove = async (cellId: string, move: number) => {
    if (!walletClient || !address) return;
    
    try {
      setMoveLoading(true);
      setError(null);
      
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'submitMove',
        args: [BigInt(cellId), BigInt(move)],
        account: address as `0x${string}`,
        chain: localhost,
      });
      
      console.log('[App] Submit move transaction hash:', hash);
      pollForCellUpdates(5);
    } catch (error) {
      console.error('[App] Error submitting move:', error);
      setError('Failed to submit move: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setMoveLoading(false);
    }
  };

  // Submit continuation decision
  const handleContinuationDecision = async (cellId: string, wantsToContinue: boolean) => {
    if (!walletClient || !address) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'submitContinuationDecision',
        args: [BigInt(cellId), wantsToContinue],
        account: address as `0x${string}`,
        chain: localhost,
      });
      
      console.log('[App] Submit continuation decision transaction hash:', hash);
      pollForCellUpdates(5);
    } catch (error) {
      console.error('[App] Error submitting continuation decision:', error);
      setError('Failed to submit continuation decision: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  // Navigation handlers
  const handleEnterCell = (cellId: string) => {
    console.log('[App] handleEnterCell called with cellId:', cellId);
    console.log('[App] Available cells:', cells.map(c => ({ id: c.id, totalRounds: c.totalRounds, currentRound: c.currentRound, isComplete: c.isComplete })));
    
    setSelectedCellId(cellId);
    setCurrentView('cell');
    const cell = cells.find(c => c.id === cellId);
    if (cell) {
      console.log('[App] Found cell:', { id: cell.id, totalRounds: cell.totalRounds, currentRound: cell.currentRound, isComplete: cell.isComplete });
      setActiveCell(cell);
    } else {
      console.error('[App] Cell not found for ID:', cellId);
    }
  };

  const handleBackToLobby = () => {
    setSelectedCellId(null);
    setActiveCell(null);
    setCurrentView('lobby');
  };

  const handleViewHistory = () => {
    setCurrentView('history');
  };

  // Effects
  useEffect(() => {
    if (isConnected && publicClient) {
      console.log('[App] useEffect triggered - checking contract initialization');
      console.log('[App] isConnected:', isConnected);
      console.log('[App] publicClient available:', !!publicClient);
      
      // Add a small delay to ensure publicClient is fully ready
      const timer = setTimeout(() => {
        checkContractInitialization();
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      console.log('[App] useEffect - not ready yet:', { isConnected, publicClient: !!publicClient });
    }
  }, [isConnected, publicClient]);

  useEffect(() => {
    if (isConnected && publicClient && isContractInitialized) {
      updateCellsState();
    }
  }, [isConnected, publicClient, isContractInitialized]);

  // Auto-refresh every 10 seconds when connected
  useEffect(() => {
    if (!isConnected || !publicClient || !isContractInitialized) return;
    
    const interval = setInterval(() => {
      updateCellsState();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isConnected, publicClient, isContractInitialized]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
        {/* Prison bars overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="h-full flex justify-center items-center">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-full bg-gradient-to-b from-gray-400 via-gray-600 to-gray-800 mx-8 shadow-2xl"
                style={{
                  transform: `perspective(1000px) rotateX(${Math.sin(i * 0.5) * 2}deg)`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Spotlight effect */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-yellow-400 opacity-5 rounded-full blur-3xl animate-pulse" />
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center p-12 bg-black/40 backdrop-blur-sm rounded-3xl border border-gray-700/50 shadow-2xl transform hover:scale-105 transition-all duration-700">
            <div className="mb-8">
              <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 mb-4 tracking-wider drop-shadow-2xl animate-pulse">
                PRISONER'S
              </h1>
              <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 tracking-wider drop-shadow-2xl">
                DILEMMA
              </h1>
            </div>
            <div className="text-gray-300 text-lg mb-8 font-mono tracking-wide">
              <div className="animate-typewriter overflow-hidden whitespace-nowrap border-r-4 border-orange-500 mx-auto">
                ENTER THE CELL... IF YOU DARE
              </div>
            </div>
            <div className="transform hover:scale-110 transition-all duration-300">
              <ConnectWalletButton />
            </div>
          </div>
        </div>
        
        {/* Ambient shadows */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent" />
      </div>
    );
  }

  if (!isContractInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
        {/* Prison bars overlay */}
        <div className="absolute inset-0 opacity-15">
          <div className="h-full flex justify-center items-center">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-full bg-gradient-to-b from-red-400 via-red-600 to-red-800 mx-12 shadow-2xl animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
        
        {/* Warning lights */}
        <div className="absolute top-10 left-10 w-4 h-4 bg-red-500 rounded-full animate-ping" />
        <div className="absolute top-10 right-10 w-4 h-4 bg-red-500 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center p-12 bg-red-900/20 backdrop-blur-sm rounded-3xl border-2 border-red-500/30 shadow-2xl transform hover:scale-105 transition-all duration-700">
            <div className="mb-8">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <h1 className="text-4xl font-black text-red-400 mb-4 tracking-wider drop-shadow-2xl animate-pulse">
                SYSTEM LOCKDOWN
              </h1>
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent mb-6 animate-pulse" />
            </div>
            <p className="text-red-200 mb-8 font-mono text-lg tracking-wide">
              SECURITY PROTOCOLS MUST BE INITIALIZED
            </p>
            <button
              onClick={initializeContract}
              disabled={initializeLoading}
              className="group relative bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-8 py-4 rounded-xl font-black text-lg tracking-wider transition-all duration-300 transform hover:scale-110 hover:shadow-2xl disabled:hover:scale-100 border-2 border-red-400/50 hover:border-red-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-red-600/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
              <span className="relative z-10">
                {initializeLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    INITIALIZING SYSTEM...
                  </div>
                ) : (
                  'INITIALIZE SECURITY PROTOCOLS'
                )}
              </span>
            </button>
          </div>
        </div>
        
        {/* Danger shadows */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-red-900/50 to-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
      {/* Prison atmosphere effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="h-full flex justify-center items-center">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="w-0.5 h-full bg-gradient-to-b from-gray-400 via-gray-600 to-gray-800 mx-6 shadow-xl"
              style={{
                transform: `perspective(1000px) rotateX(${Math.sin(i * 0.3) * 1}deg)`,
                opacity: 0.3 + Math.sin(i * 0.5) * 0.2
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-400 opacity-5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-400 opacity-5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Status Banner with prison styling */}
      <div className="relative z-20">
        <StatusBanner 
          isConnected={isConnected}
          address={address}
          isContractInitialized={isContractInitialized}
          minStake={minStake}
          error={error}
          isPolling={isPolling}
        />
      </div>
      
      {/* Main content area */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="backdrop-blur-sm bg-black/20 rounded-3xl border border-gray-700/50 shadow-2xl p-8">
          {currentView === 'lobby' && (
            <GameLobby
              cells={cells}
              onCreateCell={handleCreateCell}
              onJoinCell={handleJoinCell}
              onEnterCell={handleEnterCell}
              onViewHistory={handleViewHistory}
              loading={loading}
              minStake={minStake}
              userAddress={address}
            />
          )}
          
          {currentView === 'cell' && activeCell && (
            <CellView
              cell={activeCell}
              onMove={handleMove}
              onContinuationDecision={handleContinuationDecision}
              onBackToLobby={handleBackToLobby}
              onRefresh={updateCellsState}
              moveLoading={moveLoading}
              userAddress={address}
            />
          )}
          
          {currentView === 'history' && (
            <GameHistory
              cellHistory={cellHistory}
              onBackToLobby={handleBackToLobby}
              onEnterCell={handleEnterCell}
              userAddress={address}
            />
          )}
        </div>
      </div>
      
      <div className="relative z-10">
        <Footer />
      </div>
      
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black via-gray-900/50 to-transparent" />
    </div>
  );
}
