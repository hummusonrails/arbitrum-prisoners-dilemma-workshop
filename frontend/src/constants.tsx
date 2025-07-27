// Define custom Stylus chain
import { defineChain } from 'viem'

export const localhost = defineChain({
  id: 412346,
  name: 'Nitro Localhost',
  network: 'Nitro localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      // Using 127.0.0.1 instead of localhost for better MetaMask compatibility
      http: ['http://127.0.0.1:8547'],
      webSocket: ['ws://127.0.0.1:8547']
    },
    public: {
      // Using 127.0.0.1 instead of localhost for better MetaMask compatibility
      http: ['http://127.0.0.1:8547'],
      webSocket: ['ws://127.0.0.1:8547']
    },
  },
  testnet: false,
})