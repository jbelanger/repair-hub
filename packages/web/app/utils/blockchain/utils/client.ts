import { createPublicClient, http } from 'viem'
import { hardhat, sepolia } from 'viem/chains'

// Get RPC URL from environment variable or use default for local development
const getRpcUrl = () => {
  const url = typeof document !== 'undefined' 
    ? import.meta.env.VITE_RPC_URL 
    : process.env.VITE_RPC_URL;
  return url || 'http://127.0.0.1:8545';
};

// Get chain ID from environment variable or use default for local development
const getChainId = () => {
  const chainId = typeof document !== 'undefined'
    ? import.meta.env.VITE_CHAIN_ID
    : process.env.VITE_CHAIN_ID;
  return chainId ? parseInt(chainId) : 31337; // Default to Hardhat's chain ID
};

export function getPublicClient() {
  const rpcUrl = getRpcUrl();
  const chainId = getChainId();

  // Get the appropriate chain configuration
  let chain;
  if (chainId === 31337) {
    chain = {
      ...hardhat,
      rpcUrls: {
        default: { http: [rpcUrl] },
        public: { http: [rpcUrl] },
      }
    };
  } else if (chainId === 11155111) {
    chain = {
      ...sepolia,
      rpcUrls: {
        default: { http: [rpcUrl] },
        public: { http: [rpcUrl] },
      }
    };
  } else {
    chain = {
      id: chainId,
      name: 'Custom Chain',
      network: 'custom',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: {
        default: { http: [rpcUrl] },
        public: { http: [rpcUrl] },
      },
    };
  }

  return createPublicClient({
    chain,
    transport: http(rpcUrl)
  });
}
