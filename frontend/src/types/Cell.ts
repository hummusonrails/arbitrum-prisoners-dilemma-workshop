export interface Round {
  gameId: string;
  roundNumber: number;
  isFinished: boolean;
  result?: {
    player1Move: string;
    player2Move: string;
    player1Payout: string;
    player2Payout: string;
  };
}

export interface Cell {
  id: string;
  player1: string;
  player2: string;
  stake: string;
  totalRounds: number;
  currentRound: number;
  rounds: Round[];
  isComplete: boolean;
  createdAt: number;
}

export interface CellManager {
  cells: Map<string, Cell>;
  getCellByPlayers: (player1: string, player2: string) => Cell | undefined;
  createCell: (player1: string, player2: string, stake: string) => Cell;
  addRoundToCell: (cellId: string, gameId: string) => void;
  updateRoundResult: (cellId: string, gameId: string, result: any) => void;
  getCellByGameId: (gameId: string) => Cell | undefined;
  getActiveCells: () => Cell[];
  getCompletedCells: () => Cell[];
}
