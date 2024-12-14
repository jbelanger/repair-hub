import React, { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { useNavigate } from 'react-router-dom'
import { isMetaMaskInstalled, getChainName, WalletError } from '../lib/blockchain'
import { UserService } from '../lib/services/UserService'

interface ConnectWalletProps {
  onConnect?: () => void
}

export function ConnectWallet({ onConnect }: ConnectWalletProps) {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const checkUserRegistration = async (address: string) => {
    try {
      const user = await UserService.getUserByAddress(address)
      if (!user) {
        navigate('/register')
      } else {
        onConnect?.()
      }
    } catch (error) {
      console.error('Error checking user registration:', error)
      setError('Failed to verify user registration')
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleConnect = async () => {
    try {
      setError(null)
      
      if (!isMetaMaskInstalled()) {
        throw new WalletError(
          'MetaMask is not installed. Please install MetaMask to continue.'
        )
      }

      await connect({ 
        connector: injected(),
        chainId: 11155111 // Sepolia chain ID
      })
      
      console.log('Wallet connected successfully')
      
      // Check user registration after successful connection
      if (address) {
        await checkUserRegistration(address)
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      if (error instanceof WalletError) {
        setError(error.message)
      } else {
        setError(`Please connect to ${getChainName()} network`)
      }
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000)
    }
  }

  // Check user registration when address changes
  React.useEffect(() => {
    if (isConnected && address) {
      checkUserRegistration(address)
    }
  }, [address, isConnected])

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
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
          {!isMetaMaskInstalled() && (
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 underline"
            >
              Download MetaMask
            </a>
          )}
        </div>
      )}
    </div>
  )
}
