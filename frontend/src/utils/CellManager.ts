import type { Cell, Round, CellManager } from '../types/Cell';

// Shared utility for generating a random number of rounds between 1 and 10
export function generateRandomRounds(): number {
  return Math.floor(Math.random() * 10) + 1;
}

export class CellManagerImpl implements CellManager {
  public cells: Map<string, Cell> = new Map();

  // Create a unique cell ID based on players (normalized order)
  private createCellId(player1: string, player2: string): string {
    const players = [player1.toLowerCase(), player2.toLowerCase()].sort();
    return `cell_${players[0]}_${players[1]}`;
  }

  getCellByPlayers(player1: string, player2: string): Cell | undefined {
    const cellId = this.createCellId(player1, player2);
    return this.cells.get(cellId);
  }

  createCell(player1: string, player2: string, stake: string): Cell {
    const cellId = this.createCellId(player1, player2);
    
    // Check if cell already exists with matching stake
    const existingCell = this.cells.get(cellId);
    const stakeBigInt = BigInt(stake);
    if (existingCell && !existingCell.isComplete && existingCell.stake === stakeBigInt) {
      return existingCell;
    }

    const totalRounds = generateRandomRounds();
    const cell: Cell = {
      id: cellId,
      player1: player1.toLowerCase(),
      player2: player2.toLowerCase(),
      stake: stakeBigInt,
      totalRounds,
      currentRound: 0,
      rounds: [],
      isComplete: false,
      createdAt: Date.now()
    };

    this.cells.set(cellId, cell);
    return cell;
  }

  addRoundToCell(cellId: string, gameId: string): void {
    const cell = this.cells.get(cellId);
    if (!cell) {
      console.error(`[CellManager] Cell ${cellId} not found`);
      return;
    }

    const roundNumber = cell.rounds.length + 1;
    const round: Round = {
      roundNumber,
      player1Move: null,
      player2Move: null,
      player1Payout: BigInt(0),
      player2Payout: BigInt(0),
      isComplete: false,
      gameId,
      result: undefined
    };

    cell.rounds.push(round);
    cell.currentRound = roundNumber;
  }

  updateRoundResult(cellId: string, gameId: string, result: any): void {
    const cell = this.cells.get(cellId);
    if (!cell) {
      console.error(`[CellManager] Cell ${cellId} not found`);
      return;
    }

    const round = cell.rounds.find(r => r.gameId === gameId);
    if (!round) {
      console.error(`[CellManager] Round with game ${gameId} not found in cell ${cellId}`);
      return;
    }

  round.isComplete = true;
  round.result = result;

    // Check if cell is complete
    if (cell.rounds.length >= cell.totalRounds && cell.rounds.every(r => r.isComplete)) {
      cell.isComplete = true;
      console.log(`[CellManager] Cell ${cellId} completed after ${cell.rounds.length} rounds`);
    }
  }

  getCellByGameId(gameId: string): Cell | undefined {
    for (const cell of this.cells.values()) {
      if (cell.rounds.some(round => round.gameId === gameId)) {
        return cell;
      }
    }
    return undefined;
  }

  getActiveCells(): Cell[] {
    return Array.from(this.cells.values()).filter(cell => !cell.isComplete);
  }

  getCompletedCells(): Cell[] {
    return Array.from(this.cells.values()).filter(cell => cell.isComplete);
  }

  // Get cells that need a new round (current round finished but not at total rounds yet)
  getCellsNeedingNewRound(): Cell[] {
    return Array.from(this.cells.values()).filter(cell => {
      if (cell.isComplete) return false;
      if (cell.rounds.length === 0) return false;
      if (cell.rounds.length >= cell.totalRounds) return false;
      
      const lastRound = cell.rounds[cell.rounds.length - 1];
  return lastRound.isComplete;
    });
  }

  // Get the current active round for a cell
  getCurrentRound(cellId: string): Round | undefined {
    const cell = this.cells.get(cellId);
    if (!cell || cell.rounds.length === 0) return undefined;
    
    // Return the last round that's not finished, or the last round if all are finished
  const unfinishedRound = cell.rounds.find(r => !r.isComplete);
  return unfinishedRound || cell.rounds[cell.rounds.length - 1];
  }

  // End a cell early (when players decline to continue)
  endCell(cellId: string): void {
    const cell = this.cells.get(cellId);
    if (!cell) {
      console.error(`[CellManager] Cell ${cellId} not found`);
      return;
    }

    cell.isComplete = true;
    console.log(`[CellManager] Cell ${cellId} ended early after ${cell.rounds.length} rounds`);
  }
}

export const cellManager = new CellManagerImpl();
