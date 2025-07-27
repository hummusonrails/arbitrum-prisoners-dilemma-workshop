import React from 'react';

type MoveButtonsProps = {
  onMove: (move: 0 | 1) => void;
  disabled?: boolean;
};

const MoveButtons: React.FC<MoveButtonsProps> = ({ onMove, disabled }) => (
  <div className="flex gap-6 justify-center mt-8">
    <button
      className="group bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold px-8 py-4 rounded-xl shadow-2xl border-2 border-green-400/50 transition-all duration-300 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative z-30 cell-hover"
      onClick={() => onMove(0)}
      disabled={disabled}
    >
      <div className="flex items-center space-x-3">
        <span className="text-2xl group-hover:animate-bounce">🤝</span>
        <div className="text-left">
          <div className="text-lg font-bold tracking-wider">COOPERATE</div>
          <div className="text-xs opacity-75 font-mono">Trust & Share</div>
        </div>
      </div>
    </button>
    <button
      className="group bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold px-8 py-4 rounded-xl shadow-2xl border-2 border-red-400/50 transition-all duration-300 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative z-30 cell-hover"
      onClick={() => onMove(1)}
      disabled={disabled}
    >
      <div className="flex items-center space-x-3">
        <span className="text-2xl group-hover:animate-bounce">⚔️</span>
        <div className="text-left">
          <div className="text-lg font-bold tracking-wider">DEFECT</div>
          <div className="text-xs opacity-75 font-mono">Betray & Take</div>
        </div>
      </div>
    </button>
  </div>
);

export default MoveButtons;
