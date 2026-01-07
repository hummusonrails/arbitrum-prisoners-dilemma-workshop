import React, { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';
import { createPublicClient, createWalletClient, custom } from 'viem';
import { defaultChain } from '../constants';
import { CONTRACT_ADDRESS } from '../lib/contract';


interface Web3ContextType {
  publicClient: ReturnType<typeof createPublicClient> | null;
  walletClient: ReturnType<typeof createWalletClient> | null;
  address: string | null;
  chainId: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
}

const Web3Context = createContext<Web3ContextType>({
  publicClient: null,
  walletClient: null,
  address: null,
  chainId: null,
  connect: async () => {},
  disconnect: () => {},
  isConnected: false,
});

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const [publicClient, setPublicClient] = useState<ReturnType<typeof createPublicClient> | null>(null);
  const [walletClient, setWalletClient] = useState<ReturnType<typeof createWalletClient> | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  React.useEffect(() => {
    console.log('[Web3Provider] Build config', {
      contractAddress: CONTRACT_ADDRESS,
      chainId: defaultChain.id,
      chainName: defaultChain.name,
      useSepolia: import.meta.env.VITE_USE_SEPOLIA,
    });
  }, []);

  const connect = async () => {
    if (!(window as any).ethereum) {
      alert('No injected wallet found. Please install MetaMask or another wallet.');
      return;
    }
    try {
      const ethereum = (window as any).ethereum;
      const targetChainIdHex = `0x${defaultChain.id.toString(16)}`;

      // Ensure the wallet is on the correct chain before creating clients
      const ensureCorrectChain = async () => {
        const currentChainIdHex = await ethereum.request({ method: 'eth_chainId' });
        if (currentChainIdHex === targetChainIdHex) return;
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainIdHex }],
          });
        } catch (switchError: any) {
          if (switchError?.code === 4902) {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: targetChainIdHex,
                chainName: defaultChain.name,
                nativeCurrency: defaultChain.nativeCurrency,
                rpcUrls: defaultChain.rpcUrls.default.http,
              }],
            });
          } else {
            throw switchError;
          }
        }
      };

      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      await ensureCorrectChain();
      const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
      const chainId = Number(chainIdHex);
      const newAddress = accounts[0];
      const walletClient = createWalletClient({
        chain: defaultChain,
        transport: custom((window as any).ethereum),
        account: newAddress as `0x${string}`
      });
      const publicClient = createPublicClient({
        chain: defaultChain,
        transport: custom((window as any).ethereum),
      });
      setWalletClient(walletClient);
      setPublicClient(publicClient);
      setAddress(newAddress);
      setChainId(chainId);
      setIsConnected(true);
    } catch (err) {
      console.error('Failed to connect wallet:', err);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setIsConnected(false);
    setWalletClient(null);
    setPublicClient(null);
    setChainId(null);
  };

  // Check for existing wallet connection on page load
  React.useEffect(() => {
    const checkExistingConnection = async () => {
      if (!(window as any).ethereum || isInitialized) return;
      
      try {
        // Check if already connected
        const accounts = await (window as any).ethereum.request({ 
          method: 'eth_accounts' 
        });
        
        if (accounts.length > 0) {
          console.log('[Web3Provider] Found existing wallet connection, reconnecting...');
          await connect();
        }
      } catch (error) {
        console.error('[Web3Provider] Error checking existing connection:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    
    checkExistingConnection();
  }, [isInitialized]);

  // Listen for account changes
  React.useEffect(() => {
    if (!(window as any).ethereum) return;
    
    const handleAccountsChanged = (accounts: string[]) => {
      console.log('[Web3Provider] Accounts changed:', accounts);
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== address) {
        // Account has changed - reconnect with new account
        connect();
      }
    };
    
    const handleChainChanged = () => {
      console.log('[Web3Provider] Chain changed, reconnecting...');
      // Add a small delay to prevent rapid reconnections
      setTimeout(() => {
        connect();
      }, 100);
    };
    
    (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
    (window as any).ethereum.on('chainChanged', handleChainChanged);
    
    return () => {
      (window as any).ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      (window as any).ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [address]);

  // Debug logs for context propagation
  React.useEffect(() => {
    console.log('[Web3Provider] Context updated', { publicClient, walletClient, address, chainId, isConnected });
  }, [publicClient, walletClient, address, chainId, isConnected]);

  return (
    <Web3Context.Provider value={{ publicClient, walletClient, address, chainId, connect, disconnect, isConnected }}>
      {children}
    </Web3Context.Provider>
  );
};

export default Web3Provider;
