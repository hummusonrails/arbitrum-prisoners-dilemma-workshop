import React from 'react';
import { formatEther } from 'viem';

interface GameLobbyHeaderProps {
  onViewHistory: () => void;
  onCreateClick: () => void;
  showCreateForm: boolean;
  onCreateCell: () => void;
  onStakeAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  stakeAmount: string;
  minStake: bigint;
  loading: boolean;
  setShowCreateForm: (show: boolean) => void;
  setStakeAmount: (amount: string) => void;
}

const GameLobbyHeader: React.FC<GameLobbyHeaderProps> = ({
  onViewHistory,
  onCreateClick,
  showCreateForm,
  onCreateCell,
  onStakeAmountChange,
  stakeAmount,
  minStake,
  loading,
  setShowCreateForm,
  setStakeAmount,
}) => {
  return (
    <div className="relative mb-12">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 via-cyan-500/20 to-blue-500/20 blur-3xl"></div>
      </div>

      <div className="relative z-10 text-center mb-8">
        <div className="mb-6">
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-700 mb-4 tracking-wider drop-shadow-2xl">
            💼 DEAL MARKETPLACE 💼
          </h1>
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent animate-pulse" />
        </div>
        <p className="text-teal-200 text-xl font-mono tracking-wide mb-8">
          STRATEGIC DECISIONS • PARTNER OR COMPETE • BUILD OR CAPTURE
        </p>
        
        <div className="flex justify-center gap-6">
          <button
            onClick={onViewHistory}
            className="relative overflow-hidden group px-8 py-4 bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300 font-bold rounded-xl border-2 border-teal-600/50 hover:border-teal-400 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-teal-500/20"
          >
            <span className="relative z-10 flex items-center gap-2">
              <span>📜</span>
              <span>View History</span>
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          {!showCreateForm ? (
            <button
              onClick={onCreateClick}
              className="relative overflow-hidden group px-8 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold rounded-xl border-2 border-teal-400/50 hover:border-teal-300 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-teal-500/30"
              disabled={loading}
            >
              <span className="relative z-10 flex items-center gap-2">
                <span>🤝</span>
                <span>Create New Deal</span>
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-teal-400/20 to-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          ) : (
            <div className="flex items-center gap-4 bg-gray-900/80 backdrop-blur-sm p-4 rounded-xl border border-teal-500/30">
              <div className="relative">
                <input
                  type="number"
                  step="0.0001"
                  min={Number(formatEther(minStake))}
                  value={stakeAmount}
                  onChange={onStakeAmountChange}
                  placeholder={`Min: ${formatEther(minStake)} ETH`}
                  className="px-4 py-3 bg-gray-800 border border-teal-500/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent w-48"
                />
                <span className="absolute right-3 top-3 text-gray-400 text-xs">ETH</span>
              </div>
              <button
                onClick={onCreateCell}
                disabled={!stakeAmount || parseFloat(stakeAmount) < parseFloat(formatEther(minStake)) || loading}
                className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold rounded-lg border-2 border-teal-400/50 hover:border-teal-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <span>💼</span>
                    <span>Create</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setStakeAmount('');
                }}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameLobbyHeader;
