import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { useNavigate } from '@remix-run/react'

interface ConnectWalletProps {
  onConnect?: () => void
}

export function ConnectWallet({ onConnect }: ConnectWalletProps) {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const navigate = useNavigate()

  const handleConnect = async () => {
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error(
          'MetaMask is not installed. Please install MetaMask to continue.'
        )
      }

      await connect({ 
        connector: injected(),
        chainId: 11155111 // Sepolia chain ID
      })
      
      console.log('Wallet connected successfully')
      onConnect?.()
      
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-700">
          Connected: {`${address.slice(0, 6)}...${address.slice(-4)}`}
        </span>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start">
      <button
        onClick={handleConnect}
        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Connect Wallet
      </button>
    </div>
  )
}
