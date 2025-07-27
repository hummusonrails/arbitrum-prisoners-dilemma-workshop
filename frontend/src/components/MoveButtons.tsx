import React from 'react';

type MoveButtonsProps = {
  onMove: (move: 0 | 1) => void;
  disabled?: boolean;
};

const MoveButtons: React.FC<MoveButtonsProps> = ({ onMove, disabled }) => (
  <div className="flex gap-4 justify-center mt-4">
    <button
      className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded disabled:opacity-50"
      onClick={() => onMove(0)}
      disabled={disabled}
    >
      Cooperate
    </button>
    <button
      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded disabled:opacity-50"
      onClick={() => onMove(1)}
      disabled={disabled}
    >
      Defect
    </button>
  </div>
);

export default MoveButtons;
