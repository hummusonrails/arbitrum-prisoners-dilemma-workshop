import React from 'react';

type MoveButtonsProps = {
  onMove: (move: 0 | 1) => void;
  disabled?: boolean;
};

const MoveButtons: React.FC<MoveButtonsProps> = ({ onMove, disabled }) => (
  <div className="flex gap-6 justify-center mt-8">
    <button
      className="group bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 text-white font-bold px-8 py-4 rounded-xl shadow-2xl border-2 border-teal-400/50 transition-all duration-300 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative z-30 cell-hover"
      onClick={() => onMove(0)}
      disabled={disabled}
    >
      <div className="flex items-center space-x-3">
        <span className="text-2xl group-hover:animate-bounce">🤝</span>
        <div className="text-left">
          <div className="text-lg font-bold tracking-wider">PARTNER</div>
          <div className="text-xs opacity-75 font-mono">Collaborate & Grow</div>
        </div>
      </div>
    </button>
    <button
      className="group bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-500 hover:to-amber-600 text-white font-bold px-8 py-4 rounded-xl shadow-2xl border-2 border-orange-400/50 transition-all duration-300 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative z-30 cell-hover"
      onClick={() => onMove(1)}
      disabled={disabled}
    >
      <div className="flex items-center space-x-3">
        <span className="text-2xl group-hover:animate-bounce">⚔️</span>
        <div className="text-left">
          <div className="text-lg font-bold tracking-wider">COMPETE</div>
          <div className="text-xs opacity-75 font-mono">Capture Market</div>
        </div>
      </div>
    </button>
  </div>
);

export default MoveButtons;
