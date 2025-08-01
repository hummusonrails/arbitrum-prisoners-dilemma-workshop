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
      http: ['http://127.0.0.1:8547', 'http://localhost:8547'],
      webSocket: ['ws://127.0.0.1:8547', 'ws://localhost:8547']
    },
    public: {
      http: ['http://127.0.0.1:8547', 'http://localhost:8547'],
      webSocket: ['ws://127.0.0.1:8547', 'ws://localhost:8547']
    },
  },
  testnet: false,
})