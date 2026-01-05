import type { Cell } from '../types/Cell';
import type { PublicClient, WalletClient } from 'viem';
import abi from '../abi/PrisonersDilemmaContract.json';
import { parseEther } from 'viem';
import { localhost } from '../constants';

export const CONTRACT_ADDRESS = '0x79b994d378518eae46917aa19f05ce6545faac26' as const;
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
    console.error('[contract] Error in checkContractInitialization:', error);
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
    let attempts = 0;
    const maxAttempts = forceRefresh ? 3 : 1;
    while (attempts < maxAttempts) {
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
        const [player1, player2, stake, totalRounds, currentRound, isComplete] = result as [
          `0x${string}`,
          `0x${string}`,
          bigint,
          number,
          number,
          boolean
        ];

        // Filter out cells that are not actually created (both players are zero address)
        const zeroAddress = '0x0000000000000000000000000000000000000000';
        if ((player1 === zeroAddress) && (player2 === zeroAddress)) {
          return null;
        }

        // Only fetch rounds up to currentRound
        const rounds: any[] = [];
        for (let i = 1; i <= Number(currentRound); i++) {
          const roundResult = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi,
            functionName: 'getRoundResult',
            args: [BigInt(cellId), i],
            blockNumber: latestBlock,
          });
          let [p1Move, p2Move, p1Payout, p2Payout] = roundResult as [number, number, bigint, bigint];

          let isFinished = false;
          let parsedP1Move: number | null = null;
          let parsedP2Move: number | null = null;
          let parsedP1Payout = BigInt(0);
          let parsedP2Payout = BigInt(0);

          // A round is finished if payouts are non-zero (contract only sets payouts after resolution)
          // This properly handles the case where both players cooperate (move 0,0) with non-zero payouts
          isFinished = (p1Payout !== BigInt(0) || p2Payout !== BigInt(0));

          if (isFinished) {
            // Round is complete - moves are valid (0 = Cooperate, 1 = Defect)
            parsedP1Move = p1Move;
            parsedP2Move = p2Move;
            parsedP1Payout = BigInt(p1Payout);
            parsedP2Payout = BigInt(p2Payout);
          } else {
            // Round not started or moves not yet submitted by both players
            parsedP1Move = null;
            parsedP2Move = null;
            parsedP1Payout = BigInt(0);
            parsedP2Payout = BigInt(0);
          }

          // Always add a round for every round number up to currentRound
          rounds.push({
            roundNumber: i,
            player1Move: parsedP1Move,
            player2Move: parsedP2Move,
            player1Payout: parsedP1Payout,
            player2Payout: parsedP2Payout,
            isComplete: isFinished
          });
        }

        const cell: Cell = {
          id: cellId,
          player1: player1 || '0x',
          player2: player2 || '0x',
          stake: BigInt(stake?.toString() || '0'),
          totalRounds: Number(totalRounds),
          currentRound: Number(currentRound),
          isComplete: Boolean(isComplete),
          rounds,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        return cell;
      } catch (error: any) {
        if (error.message?.includes('Cell does not exist')) {
          return null;
        }
        if (attempts >= maxAttempts) {
          return null;
        }
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Poll contract initialization status every intervalMs milliseconds
export const startContractInitializationPolling = (
  publicClient: PublicClient | null,
  setIsContractInitialized: (v: boolean) => void,
  setMinStake: (v: bigint) => void,
  setError: (msg: string | null) => void,
  intervalMs: number = 5000
) => {
  let polling = true;
  const poll = async () => {
    if (!polling) return;
    await checkContractInitialization(publicClient, setIsContractInitialized, setMinStake, setError);
    setTimeout(poll, intervalMs);
  };
  poll();
  // Return a function to stop polling
  return () => { polling = false; };
};
