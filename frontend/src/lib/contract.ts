import type { Cell } from '../types/Cell';
import type { PublicClient, WalletClient } from 'viem';
import abi from '../abi/PrisonersDilemmaContract.json';
import { parseEther } from 'viem';
import { localhost } from '../constants';

export const CONTRACT_ADDRESS = '0xc2c0c3398915a2d2e9c33c186abfef3192ee25e8' as const;
export { abi, localhost };

// Initialize contract
export const initializeContract = async (
  walletClient: WalletClient | null,
  address: `0x${string}` | undefined,
  setError: (msg: string | null) => void,
  setInitializeLoading: (v: boolean) => void
) => {
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
    console.log('[contract] Initialize contract transaction hash:', result);
  } catch (error) {
    console.error('[contract] Error initializing contract:', error);
    setError('Failed to initialize contract: ' + (error instanceof Error ? error.message : String(error)));
  } finally {
    setInitializeLoading(false);
  }
};

// Check if contract is initialized
export const checkContractInitialization = async (
  publicClient: PublicClient | null,
  setIsContractInitialized: (v: boolean) => void,
  setMinStake: (v: bigint) => void,
  setError: (msg: string | null) => void
) => {
  if (!publicClient) return false;
  try {
    const latestBlock = await publicClient.getBlockNumber();
    const ownerResult = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: 'getOwner',
      args: [],
      blockNumber: latestBlock,
    });
    const isInitialized = ownerResult !== '0x0000000000000000000000000000000000000000';
    if (!isInitialized) {
      setIsContractInitialized(false);
      setMinStake(BigInt(0));
      return false;
    }
    const minStakeResult = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: 'getMinStake',
      args: [],
      blockNumber: latestBlock,
    });
    setMinStake(minStakeResult as bigint);
    setIsContractInitialized(true);
    setError(null);
    return true;
  } catch (error) {
    setIsContractInitialized(false);
    return false;
  }
};

// Fetch cell data from contract
export const fetchCellData = async (
  publicClient: PublicClient | null,
  cellId: string,
  forceRefresh: boolean = false
): Promise<Cell | null> => {
  if (!publicClient) return null;
  try {
    let latestBlock = await publicClient.getBlockNumber();
    if (forceRefresh) {
      await new Promise(resolve => setTimeout(resolve, 500));
      latestBlock = await publicClient.getBlockNumber();
    }
    // Define the expected shape of the cell data from the contract
    type ContractCellData = {
      player1: `0x${string}`;
      player2: `0x${string}`;
      stake: bigint;
      totalRounds: bigint;
      currentRound: bigint;
      isComplete: boolean;
      rounds: Array<{
        roundNumber: bigint;
        player1Move: boolean;
        player2Move: boolean;
        player1Payout: bigint;
        player2Payout: bigint;
        isComplete: boolean;
      }>;
    };

    // Helper function to safely parse contract response
    const parseContractResponse = (data: unknown): ContractCellData | null => {
      if (!data || typeof data !== 'object') return null;
      
      const response = Array.isArray(data) ? data : [];
      
      const [
        player1,
        player2,
        stake,
        totalRounds,
        currentRound,
        isComplete,
        rounds = []
      ] = response as [
        `0x${string}`,
        `0x${string}`,
        bigint,
        bigint,
        bigint,
        boolean,
        Array<{
          roundNumber: bigint;
          player1Move: boolean;
          player2Move: boolean;
          player1Payout: bigint;
          player2Payout: bigint;
          isComplete: boolean;
        }>
      ];
      
      return {
        player1: player1 || '0x',
        player2: player2 || '0x',
        stake: BigInt(stake?.toString() || '0'),
        totalRounds: BigInt(totalRounds?.toString() || '1'),
        currentRound: BigInt(currentRound?.toString() || '0'),
        isComplete: Boolean(isComplete),
        rounds: Array.isArray(rounds) 
          ? rounds.map(r => ({
              roundNumber: BigInt(r?.roundNumber?.toString() || '0'),
              player1Move: Boolean(r?.player1Move),
              player2Move: Boolean(r?.player2Move),
              player1Payout: BigInt(r?.player1Payout?.toString() || '0'),
              player2Payout: BigInt(r?.player2Payout?.toString() || '0'),
              isComplete: Boolean(r?.isComplete)
            }))
          : []
      };
    };

    let contractData: ContractCellData | null = null;
    let attempts = 0;
    const maxAttempts = forceRefresh ? 3 : 1;
    
    while (!contractData && attempts < maxAttempts) {
      attempts++;
      try {
        if (attempts > 1) {
          latestBlock = await publicClient.getBlockNumber();
        }
        const result = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi,
          functionName: 'getCell',
          args: [BigInt(cellId)],
          blockNumber: latestBlock,
        });
        
        contractData = parseContractResponse(result);
        
        if (!contractData) {
          console.error('Invalid cell data format:', result);
          return null;
        }

        const cell: Cell = {
          id: cellId,
          player1: contractData.player1 || '0x',
          player2: contractData.player2 || '0x',
          stake: contractData.stake,
          totalRounds: Number(contractData.totalRounds),
          currentRound: Number(contractData.currentRound),
          isComplete: contractData.isComplete || false,
          rounds: contractData.rounds.map(round => ({
            roundNumber: Number(round.roundNumber),
            player1Move: round.player1Move ? 1 : 0,
            player2Move: round.player2Move ? 1 : 0,
            player1Payout: BigInt(round.player1Payout),
            player2Payout: BigInt(round.player2Payout),
            isComplete: round.isComplete
          })),
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        return cell;
      } catch (error: any) {
        if (error.message?.includes('Cell does not exist')) {
          return null;
        }
        console.error('Error fetching cell data:', error);
        if (attempts >= maxAttempts) {
          return null;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error in fetchCellData:', error);
    return null;
  }
};
