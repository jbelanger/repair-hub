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
              className="flex items-center gap-2 rounded-lg bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-300 ring-1 ring-purple-500/20 transition-all hover:bg-purple-500/20 hover:text-purple-200"
            >
              <Wallet2 className="h-4 w-4" />
              Connect Wallet
            </button>
          )
        }

        if (chain?.unsupported) {
          return (
            <button
              onClick={openChainModal}
              className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 ring-1 ring-red-500/20 transition-all hover:bg-red-500/20 hover:text-red-200"
            >
              <ExternalLink className="h-4 w-4" />
              Wrong network
            </button>
          )
        }

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={openChainModal}
              className="flex items-center gap-2 rounded-lg bg-purple-500/10 px-3 py-2 text-sm text-purple-300 ring-1 ring-purple-500/20 transition-all hover:bg-purple-500/20 hover:text-purple-200"
            >
              {chain?.hasIcon && chain?.iconUrl && (
                <div className="h-4 w-4 overflow-hidden rounded-full">
                  <img
                    alt={chain.name ?? 'Chain icon'}
                    src={chain.iconUrl}
                    className="h-full w-full"
                  />
                </div>
              )}
              {chain?.name ?? 'Unknown'}
              <ChevronDown className="h-4 w-4 opacity-60" />
            </button>

            <button
              onClick={openAccountModal}
              className="flex items-center gap-2 rounded-lg bg-purple-500/10 px-3 py-2 text-sm text-purple-300 ring-1 ring-purple-500/20 transition-all hover:bg-purple-500/20 hover:text-purple-200"
            >
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-400/10">
                <Wallet2 className="h-3 w-3 text-purple-300" />
              </div>
              <span className="max-w-24 truncate">{account.displayName}</span>
              {account.displayBalance && (
                <>
                  <span className="opacity-60">•</span>
                  <span className="opacity-60">{account.displayBalance}</span>
                </>
              )}
              <ChevronDown className="h-4 w-4 opacity-60" />
            </button>
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
