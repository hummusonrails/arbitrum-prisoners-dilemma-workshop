import React from 'react';
import MoveButtons from './MoveButtons';

interface GameState {
  player1: string;
  player2: string;
  stake: string;
  player1Move: boolean;
  player2Move: boolean;
  isFinished: boolean;
}

interface GameBoardProps {
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

const GameBoard: React.FC<GameBoardProps> = ({ game, address, onMove, moveLoading, result }) => {
  const isPlayer1 = game.player1.toLowerCase() === address.toLowerCase();
  const isPlayer2 = game.player2.toLowerCase() === address.toLowerCase();
  const hasMoved = isPlayer1 ? game.player1Move : game.player2Move;
  const canMove = !game.isFinished && (isPlayer1 || isPlayer2) && !hasMoved;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4">Game Board</h2>
      <div className="mb-2">Stake: <span className="font-mono">{game.stake} ETH</span></div>
      <div className="mb-2">Player 1: <span className="font-mono">{game.player1.slice(0, 6)}...{game.player1.slice(-4)}</span></div>
      <div className="mb-2">Player 2: <span className="font-mono">{game.player2.slice(0, 6)}...{game.player2.slice(-4)}</span></div>
      <div className="mb-2">Your role: <span className="font-semibold">{isPlayer1 ? 'Player 1' : isPlayer2 ? 'Player 2' : 'Spectator'}</span></div>
      <div className="mb-4">Game status: <span className="font-semibold">{game.isFinished ? 'Finished' : 'In Progress'}</span></div>
      {!game.isFinished && canMove && (
        <MoveButtons onMove={onMove} disabled={moveLoading} />
      )}
      {hasMoved && !game.isFinished && (
        <div className="text-yellow-600 mt-4">Waiting for opponent's move...</div>
      )}
      {game.isFinished && result && (
        <div className="mt-6 p-4 bg-green-100 dark:bg-green-900 rounded">
          <div className="font-semibold mb-2">Game Result</div>
          <div>Player 1 Move: <span className="font-mono">{result.player1Move}</span></div>
          <div>Player 2 Move: <span className="font-mono">{result.player2Move}</span></div>
          <div>Payouts:</div>
          <div className="ml-4">Player 1: <span className="font-mono">{result.player1Payout} ETH</span></div>
          <div className="ml-4">Player 2: <span className="font-mono">{result.player2Payout} ETH</span></div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
