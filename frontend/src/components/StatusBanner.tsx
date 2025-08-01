import React from 'react';
import { formatEther } from 'viem';

interface StatusBannerProps {
  isConnected: boolean;
  address: string | undefined;
  isContractInitialized: boolean;
  minStake: bigint;
  error: string | null;
  isPolling: boolean;
}

const StatusBanner: React.FC<StatusBannerProps> = ({ 
  isConnected, 
  address, 
  isContractInitialized, 
  minStake, 
  error, 
  isPolling 
}) => {
  return (
    <div className="relative w-full">
      {/* Security monitoring bar */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b-2 border-orange-500/30" />
      
      {/* Warning lights */}
      <div className="absolute top-1 left-2 w-2 h-2 bg-red-500 rounded-full animate-ping" />
      <div className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
      
      <div className="relative z-10 w-full text-center py-3 text-sm flex items-center justify-center space-x-6">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 font-mono tracking-wider">
                🔐 INMATE: {address?.slice(0, 8)}...{address?.slice(-6)}
              </span>
            </>
          ) : (
            <>
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 font-mono tracking-wider">⚠️ UNAUTHORIZED ACCESS</span>
            </>
          )}
        </div>
        
        {/* Contract Status */}
        {isContractInitialized && (
          <div className="flex items-center gap-2 bg-black/50 px-3 py-1 rounded-lg border border-orange-500/30">
            <span className="text-orange-400 font-mono text-xs tracking-wider">MIN BAIL:</span>
            <span className="text-orange-200 font-black text-xs">{formatEther(minStake)} ETH</span>
          </div>
        )}
        
        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 bg-red-900/50 px-3 py-1 rounded-lg border border-red-500/50 animate-pulse">
            <span className="text-red-400 text-xs">🚨</span>
            <span className="text-red-300 font-mono text-xs tracking-wider">
              SYSTEM ERROR: {error.slice(0, 30)}{error.length > 30 ? '...' : ''}
            </span>
          </div>
        )}
        
        {/* Sync Status */}
        {isPolling && (
          <div className="flex items-center gap-2 bg-blue-900/50 px-3 py-1 rounded-lg border border-blue-500/30">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-spin" />
            <span className="text-blue-400 font-mono text-xs tracking-wider">MONITORING...</span>
          </div>
        )}
      </div>
      
      {/* Bottom glow */}
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-pulse" />
    </div>
  );
};

export default StatusBanner;
