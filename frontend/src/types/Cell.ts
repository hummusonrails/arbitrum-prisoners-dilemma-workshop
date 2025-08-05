export interface Round {
  roundNumber: number;
  player1Move: number | null;
  player2Move: number | null;
  player1Payout: bigint;
  player2Payout: bigint;
  isComplete: boolean;
  gameId?: string;
  result?: any;
}

export interface Cell {
  id: string;
  player1: string;
  player2: string;
  stake: bigint;
  totalRounds: number;
  currentRound: number;
  rounds: Round[];
  isComplete: boolean;
  createdAt: number;
  updatedAt?: number;
}

export interface RoundResult {
  player1Move: number;
  player2Move: number;
  player1Payout: string | bigint;
  player2Payout: string | bigint;
  isComplete: boolean;
}

export interface CellManager {
  cells: Map<string, Cell>;
  getCellByPlayers: (player1: string, player2: string) => Cell | undefined;
  createCell: (player1: string, player2: string, stake: string) => Cell;
  addRoundToCell: (cellId: string, gameId: string) => void;
  updateRoundResult: (cellId: string, gameId: string, result: RoundResult) => void;
  getCellByGameId: (gameId: string) => Cell | undefined;
  getActiveCells: () => Cell[];
  getCompletedCells: () => Cell[];
}
