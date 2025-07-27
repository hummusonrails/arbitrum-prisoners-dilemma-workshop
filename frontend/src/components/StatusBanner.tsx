import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';

const StatusBanner: React.FC = () => {
  const { isConnected, address, chainId } = useWeb3();
  return (
    <div className="w-full text-center py-2 bg-gray-100 dark:bg-gray-800 text-sm">
      {isConnected ? (
        <span className="text-green-600">Connected as {address?.slice(0, 6)}...{address?.slice(-4)} (Chain {chainId})</span>
      ) : (
        <span className="text-yellow-600">Not connected</span>
      )}
    </div>
  );
};

export default StatusBanner;
