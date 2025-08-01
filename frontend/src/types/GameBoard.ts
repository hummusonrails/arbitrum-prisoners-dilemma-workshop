export interface GameState {
    player1: string;
    player2: string;
    stake: string;
    player1Move: boolean;
    player2Move: boolean;
    isFinished: boolean;
  }
  
export interface GameBoardProps {
    game: GameState;
    address: string;
    onMove: (move: 0 | 1) => void;
    moveLoading: boolean;
    result?: {
      player1Move: string;
      player2Move: string;
      player1Payout: string;
      player2Payout: string;
    };
  }