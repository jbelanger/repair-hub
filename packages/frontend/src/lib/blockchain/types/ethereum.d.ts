type RequestArguments = {
  method: string;
  params?: unknown[] | object;
};

interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: RequestArguments) => Promise<unknown>;
  on: (event: string, listener: (...args: any[]) => void) => void;
  removeListener: (event: string, listener: (...args: any[]) => void) => void;
  chainId?: string;
  networkVersion?: string;
  selectedAddress?: string | null;
  isConnected?: () => boolean;
}

interface Window {
  ethereum?: EthereumProvider;
}

declare module 'viem' {
  interface Window {
    ethereum?: EthereumProvider;
  }
}
