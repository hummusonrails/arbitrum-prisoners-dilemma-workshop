import { useState, useEffect, useCallback } from 'react';
import type { PublicClient } from 'viem';
import type { Cell } from '../types/Cell';
import { fetchCellData } from '../lib/contract';
import abi from '../abi/PrisonersDilemmaContract.json';

const CONTRACT_ADDRESS = '0xc2c0c3398915a2d2e9c33c186abfef3192ee25e8' as const;

type PermissivePublicClient = {
  [K in keyof PublicClient]: PublicClient[K];
} & {
  account?: any;
  [key: string]: any;
};

interface UseCellsOptions {
  publicClient: PermissivePublicClient | null;
  isContractInitialized: boolean;
}

export function useCells({ publicClient, isContractInitialized }: UseCellsOptions) {
  const [cells, setCells] = useState<Cell[]>([]);
  const [activeCell, setActiveCell] = useState<Cell | null>(null);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [cellHistory, setCellHistory] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(false);
  const [moveLoading, setMoveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch and update all cells from contract
  const updateCellsState = useCallback(async () => {
    if (!publicClient || !isContractInitialized) {
      console.log('Skipping cell update: contract not initialized');
      return;
    }
    setLoading(true);
    try {
      const latestBlock = await publicClient.getBlockNumber();
      
      const cellCounter = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'getCellCounter',
        args: [],
        blockNumber: latestBlock,
      }) as bigint;
      
      const cellIds = Array.from({ length: Number(cellCounter) }, (_, i) => (i + 1).toString());
      
      const cellsFetched = await Promise.all(
        cellIds.map(async (id) => {
          try {
            const cell = await fetchCellData(publicClient, id);
            return cell;
          } catch (err) {
            console.error(`Error fetching cell ${id}:`, err);
            return null;
          }
        })
      );
      
      const validCells = cellsFetched.filter(Boolean) as Cell[];
      setCells(validCells);
      
      if (activeCell) {
        const updatedActiveCell = validCells.find(cell => cell.id === activeCell.id);
        setActiveCell(updatedActiveCell || null);
      }
    } catch (error) {
      console.error('Error updating cells state:', error);
      setError(`Failed to update cells: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }, [publicClient, isContractInitialized]);

  // Polling effect for cells
  useEffect(() => {
    if (!publicClient || !isContractInitialized) return;
    updateCellsState();
    const interval = setInterval(updateCellsState, 5000);
    return () => clearInterval(interval);
  }, [publicClient, isContractInitialized, updateCellsState]);

  return {
    cells,
    setCells,
    activeCell,
    setActiveCell,
    selectedCellId,
    setSelectedCellId,
    cellHistory,
    setCellHistory,
    loading,
    setLoading,
    moveLoading,
    setMoveLoading,
    updateCellsState,
  };
}
