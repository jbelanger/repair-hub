import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Wallet2, ChevronDown, ExternalLink } from 'lucide-react'

interface ConnectWalletProps {
  onConnect?: () => void
}

export function ConnectWallet({ onConnect }: ConnectWalletProps) {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted
        if (!ready) {
          return null
        }

        if (!account) {
          return (
            <button
              onClick={openConnectModal}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <Wallet2 className="w-4 h-4" />
              Connect Wallet
            </button>
          )
        }

        if (chain?.unsupported) {
          return (
            <button
              onClick={openChainModal}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Wrong network
            </button>
          )
        }

        return (
          <div className="flex items-center space-x-4">
            <button
              onClick={openChainModal}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              {chain?.hasIcon && chain?.iconUrl && (
                <div className="w-4 h-4 overflow-hidden rounded-full">
                  <img
                    alt={chain.name ?? 'Chain icon'}
                    src={chain.iconUrl}
                    className="w-full h-full"
                  />
                </div>
              )}
              {chain?.name ?? 'Unknown'}
              <ChevronDown className="w-4 h-4" />
            </button>

            <button
              onClick={openAccountModal}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center">
                <Wallet2 className="w-3 h-3 text-indigo-600" />
              </div>
              {account.displayName}
              {account.displayBalance ? ` (${account.displayBalance})` : ''}
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
