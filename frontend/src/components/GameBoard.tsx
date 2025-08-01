import React from 'react';
import MoveButtons from './MoveButtons';
import type { GameBoardProps } from '../types/GameBoard';

const GameBoard: React.FC<GameBoardProps> = ({ game, address, onMove, moveLoading, result }) => {
  const isPlayer1 = game.player1.toLowerCase() === address.toLowerCase();
  const isPlayer2 = game.player2.toLowerCase() === address.toLowerCase();
  const hasMoved = isPlayer1 ? game.player1Move : game.player2Move;
  const canMove = !game.isFinished && (isPlayer1 || isPlayer2) && !hasMoved;

  return (
    <div className="bg-gray-900 rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-white mb-4">Game Board</h2>
      <div className="mb-2 text-gray-300">Stake: <span className="font-mono text-white">{game.stake} ETH</span></div>
      <div className="mb-2 text-gray-300">Player 1: <span className="font-mono text-white">{game.player1.slice(0, 6)}...{game.player1.slice(-4)}</span></div>
      <div className="mb-2 text-gray-300">Player 2: <span className="font-mono text-white">{game.player2.slice(0, 6)}...{game.player2.slice(-4)}</span></div>
      <div className="mb-2 text-gray-300">Your role: <span className="font-semibold text-white">{isPlayer1 ? 'Player 1' : isPlayer2 ? 'Player 2' : 'Spectator'}</span></div>
      <div className="mb-4 text-gray-300">Game status: <span className="font-semibold text-white">{game.isFinished ? 'Finished' : 'In Progress'}</span></div>
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
