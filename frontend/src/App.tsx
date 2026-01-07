import { useState, useEffect } from 'react';
import { ConnectWalletButton, StatusBanner, GameLobby, CellView, GameHistory, Footer } from './components';
import { useWeb3 } from './contexts/Web3Context';
import { useCells } from './hooks/useCells';
import { initializeContract, checkContractInitialization, startContractInitializationPolling } from './lib/contract';
import { useCellActions } from './hooks/useCellActions';

type ViewType = 'lobby' | 'cell' | 'history';

export default function App() {
  const { address, isConnected, walletClient, publicClient } = useWeb3();
  
  // Local state
  const [error, setError] = useState<string | undefined>(undefined);
  const [currentView, setCurrentView] = useState<ViewType>('lobby');
  const [initializeLoading, setInitializeLoading] = useState(false);
  const [isContractInitialized, setIsContractInitialized] = useState(false);
  const [minStake, setMinStake] = useState<bigint>(BigInt(0));
  const typedPublicClient = publicClient;

  // State variables managed by hook
  const {
    cells, setCells,
    activeCell, setActiveCell,
    setSelectedCellId,
    cellHistory, setCellHistory,
    loading, setLoading,
    moveLoading, setMoveLoading,
    updateCellsState
  } = useCells({ 
    publicClient: typedPublicClient, 
    isContractInitialized 
  });

  // Action handlers from useCellActions
  const {
    handleCreateCell,
    handleJoinCell,
    handleMove,
    handleContinuationDecision,
    handleEnterCell,
    handleBackToLobby,
    handleViewHistory
  } = useCellActions({
    address: address as `0x${string}` | undefined,
    walletClient,
    publicClient: typedPublicClient,
    setLoading,
    setMoveLoading,
    setError: (err: string | null) => setError(err ?? undefined),
    setCells,
    setActiveCell,
    setSelectedCellId,
    setCurrentView,
    setCellHistory,
    updateCellsState,
    cells
  });

  // Initialize contract on component mount
  useEffect(() => {
    if (publicClient && !isContractInitialized) {
      checkContractInitialization(publicClient, setIsContractInitialized, setMinStake, (msg: string | null) => setError(msg ?? undefined));
    }
  }, [publicClient, isContractInitialized]);

  // Polling contract initialization status
  useEffect(() => {
    let stopPolling: (() => void) | undefined;
    if (publicClient) {
      stopPolling = startContractInitializationPolling(
        publicClient,
        setIsContractInitialized,
        setMinStake,
        (msg: string | null) => setError(msg ?? undefined),
        5000 // poll every 5 seconds
      );
    }
    return () => {
      if (stopPolling) stopPolling();
    };
  }, [publicClient]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center relative overflow-hidden">
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
        
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400 opacity-5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-400 opacity-5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative z-10 text-center max-w-2xl mx-auto px-8">
          <div className="mb-12">
            <h1 className="text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-600 bg-clip-text text-transparent">
              FOUNDER'S
            </h1>
            <h2 className="text-6xl font-bold mb-8 bg-gradient-to-r from-teal-400 via-green-500 to-emerald-600 bg-clip-text text-transparent">
              DILEMMA
            </h2>
            <div className="text-gray-300 text-xl mb-8">
              Strategic decisions, cooperation, and competition
            </div>
            <div className="text-cyan-400 text-lg font-mono tracking-wider">
              CONNECT YOUR WALLET TO BEGIN
            </div>
          </div>
          
          <div className="space-y-8">
            <ConnectWalletButton />
            
            <div className="text-gray-400 text-sm">
              Connect your wallet to start exploring strategic decisions
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black via-gray-900/50 to-transparent" />
      </div>
    );
  }

  if (!isContractInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center relative overflow-hidden">
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
        
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400 opacity-5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-400 opacity-5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative z-10 text-center max-w-2xl mx-auto px-8">
          <div className="mb-12">
            <h1 className="text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-600 bg-clip-text text-transparent">
              FOUNDER'S
            </h1>
            <h2 className="text-6xl font-bold mb-8 bg-gradient-to-r from-teal-400 via-green-500 to-emerald-600 bg-clip-text text-transparent">
              DILEMMA
            </h2>
            <div className="text-gray-300 text-xl mb-8">
              Strategic decisions, cooperation, and competition
            </div>
            <div className="text-cyan-400 text-lg font-mono tracking-wider">
              CONTRACT INITIALIZATION REQUIRED
            </div>
          </div>
          
          <div className="space-y-8">
            <button
              onClick={() => walletClient && address && initializeContract(walletClient, address as `0x${string}`, (msg: string | null) => setError(msg ?? undefined), setInitializeLoading)}
              disabled={!walletClient || !address || initializeLoading}
              className="group relative bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-8 py-4 rounded-xl font-black text-lg tracking-wider transition-all duration-300 transform hover:scale-110 hover:shadow-2xl disabled:hover:scale-100 border-2 border-teal-400/50 hover:border-teal-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 to-emerald-600/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
              <span className="relative z-10">
                {initializeLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    INITIALIZING CONTRACT...
                  </div>
                ) : (
                  'INITIALIZE GAME SYSTEM'
                )}
              </span>
            </button>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-teal-900/50 to-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
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
      
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-400 opacity-5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-400 opacity-5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="relative z-20">
        <StatusBanner 
          isConnected={isConnected}
          address={address ?? undefined}
          isContractInitialized={isContractInitialized}
          minStake={minStake}
          error={error ?? null}
          isPolling={false}
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
