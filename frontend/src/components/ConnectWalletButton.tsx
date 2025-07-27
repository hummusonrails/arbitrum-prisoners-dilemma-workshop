import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';

const ConnectWalletButton: React.FC = () => {
  const { address, isConnected, connect, disconnect } = useWeb3();
  return (
    <div className="flex items-center gap-4 relative z-30">
      {isConnected ? (
        <>
          <span className="text-green-400 font-mono text-sm font-bold bg-gray-800/90 px-3 py-2 rounded-lg border border-green-500/30 shadow-lg">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
          <button 
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold px-4 py-2 rounded-lg shadow-lg border border-red-400/50 transition-all duration-300 transform hover:scale-105 relative z-30"
            onClick={disconnect}
          >
            🔓 Disconnect
          </button>
        </>
      ) : (
        <button 
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg border border-blue-400/50 transition-all duration-300 transform hover:scale-105 relative z-30"
          onClick={connect}
        >
          🔗 Connect Wallet
        </button>
      )}
    </div>
  );
};

export default ConnectWalletButton;
