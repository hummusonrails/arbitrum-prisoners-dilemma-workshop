// Define custom Stylus chain
import { defineChain } from 'viem'
import { arbitrumSepolia } from 'viem/chains'

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
      http: ['http://localhost:8547'],
      webSocket: ['ws://127.0.0.1:8547']
    },
    public: {
      http: ['http://localhost:8547'],
      webSocket: ['ws://127.0.0.1:8547']
    },
  },
  testnet: false,
})

// Export Arbitrum Sepolia for production use
export { arbitrumSepolia }

// Determine which chain to use based on environment
export const defaultChain = import.meta.env.VITE_USE_SEPOLIA === 'true' ? arbitrumSepolia : localhost