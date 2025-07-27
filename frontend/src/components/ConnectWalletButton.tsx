import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';

const ConnectWalletButton: React.FC = () => {
  const { address, isConnected, connect, disconnect } = useWeb3();
  return (
    <div className="flex items-center gap-4">
      {isConnected ? (
        <>
          <span className="text-green-600 font-mono text-xs">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
          <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={disconnect}>Disconnect</button>
        </>
      ) : (
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
};

export default ConnectWalletButton;
