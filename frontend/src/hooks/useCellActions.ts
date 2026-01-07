import { useCallback } from 'react';
import { parseEther } from 'viem';
import { generateRandomRounds } from '../utils/CellManager';
import type { WalletClient, PublicClient } from 'viem';
import { CONTRACT_ADDRESS, abi, localhost } from '../lib/contract';
import type { Cell } from '../types/Cell';

type ViewType = 'lobby' | 'cell' | 'history';

interface UseCellActionsProps {
  address: `0x${string}` | undefined;
  walletClient: WalletClient | null;
  publicClient: PublicClient | null;
  setLoading: (loading: boolean) => void;
  setMoveLoading: (loading: boolean) => void;
  setError: (err: string | null) => void;
  setCells: (cells: Cell[]) => void;
  setActiveCell: (cell: Cell | null) => void;
  setSelectedCellId: (id: string | null) => void;
  setCurrentView: (view: ViewType) => void;
  setCellHistory: (cells: Cell[]) => void;
  updateCellsState: () => Promise<void>;
  cells: Cell[];
}

export function useCellActions({
  address,
  walletClient,
  publicClient,
  setLoading,
  setMoveLoading,
  setError,
  setActiveCell,
  setSelectedCellId,
  setCurrentView,
  updateCellsState,
  cells
}: UseCellActionsProps) {
  // Create new cell
  const handleCreateCell = useCallback(async (stake: string) => {
    if (!walletClient || !address || !publicClient) {
      console.error('Cannot create cell: missing required clients or address');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const stakeValue = parseEther(stake);
      
      // Get the current gas price
      const gasPrice = await publicClient.getGasPrice();
      
      const totalRounds = generateRandomRounds();
      const request = {
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'createCell',
        args: [totalRounds],
        account: address as `0x${string}`,
        chain: localhost,
        value: stakeValue,
        gasPrice: gasPrice * 2n, // Add some buffer to the gas price
      };
      
      const gasEstimate = await publicClient.estimateContractGas({
        ...request,
      }).catch((error) => {
        console.error('Gas estimation failed:', error);
        return 2000000n;
      });
            
      const hash = await walletClient.writeContract({
        ...request,
        gas: gasEstimate * 2n,
      });
            
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
          timeout: 60000,
        });

        if (receipt.status === 'reverted') {
          throw new Error('Transaction reverted');
        }

        // Refresh state after successful transaction
        try {
          await updateCellsState();
        } catch (refreshError) {
          console.error('Error refreshing cells after create:', refreshError);
        }
      }

      return hash;
    } catch (error) {
      const errorMessage = 'Failed to create cell: ' + (error instanceof Error ? error.message : String(error));
      console.error(errorMessage, error);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [walletClient, address, setLoading, setError, updateCellsState]);

  // Join existing cell
  const handleJoinCell = useCallback(async (cellId: string, stake: string) => {
    if (!walletClient || !address || !publicClient) return;
    try {
      setLoading(true);
      setError(null);
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'joinCell',
        args: [BigInt(cellId)],
        account: address as `0x${string}`,
        value: parseEther(stake),
        chain: localhost,
      });

      // Wait for transaction confirmation before updating state
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
        timeout: 60000,
      });

      if (receipt.status === 'reverted') {
        throw new Error('Transaction reverted');
      }

      // Refresh state after successful transaction
      await updateCellsState();
    } catch (error) {
      setError('Failed to join cell: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  }, [walletClient, address, publicClient, setLoading, setError, updateCellsState]);

  // Submit move for current round
  const handleMove = useCallback(async (cellId: string, move: number) => {
    if (!walletClient || !address || !publicClient) return;
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

      // Wait for transaction confirmation before updating state
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
        timeout: 60000,
      });

      if (receipt.status === 'reverted') {
        throw new Error('Transaction reverted');
      }

      // Refresh state after successful transaction
      await updateCellsState();
    } catch (error) {
      setError('Failed to submit move: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setMoveLoading(false);
    }
  }, [walletClient, address, publicClient, setMoveLoading, setError, updateCellsState]);

  // Submit continuation decision
  const handleContinuationDecision = useCallback(async (cellId: string, wantsToContinue: boolean) => {
    if (!walletClient || !address || !publicClient) return;
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

      // Wait for transaction confirmation before updating state
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
        timeout: 60000,
      });

      if (receipt.status === 'reverted') {
        throw new Error('Transaction reverted');
      }

      // Refresh state after successful transaction
      await updateCellsState();
    } catch (error) {
      setError('Failed to submit continuation decision: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  }, [walletClient, address, publicClient, setLoading, setError, updateCellsState]);

  // Navigation handlers
  const handleEnterCell = useCallback((cellId: string) => {
    setSelectedCellId(cellId);
    setCurrentView('cell');
    const cell = cells.find(c => c.id === cellId);
    if (cell) {
      setActiveCell(cell);
    }
  }, [setSelectedCellId, setCurrentView, cells, setActiveCell]);

  const handleBackToLobby = useCallback(() => {
    setSelectedCellId(null);
    setActiveCell(null);
    setCurrentView('lobby');
  }, [setSelectedCellId, setActiveCell, setCurrentView]);

  const handleViewHistory = useCallback(() => {
    setCurrentView('history');
  }, [setCurrentView]);

  return {
    handleCreateCell,
    handleJoinCell,
    handleMove,
    handleContinuationDecision,
    handleEnterCell,
    handleBackToLobby,
    handleViewHistory
  };
}
