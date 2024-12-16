import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useNavigate } from '@remix-run/react';
import { Wallet2, ChevronDown, ExternalLink } from 'lucide-react'
import { useAccountEffect } from 'wagmi'

interface ConnectWalletProps {  
  variant?: "default" | "link";
  alwaysShowConnect?: boolean;
}

export function ConnectWallet({ variant = "default", alwaysShowConnect = false }: ConnectWalletProps) {
  const navigate = useNavigate();
  
  useAccountEffect({
    onConnect({ address, connector, isReconnected }) {
      console.log('Connected:', { address, connector, isReconnected });
      if(!isReconnected)
        navigate('/dashboard');
    },
    onDisconnect() {
      console.log('Disconnected');      
      navigate('/');
    },
  });

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

        // Always show connect button if alwaysShowConnect is true
        if (!account || alwaysShowConnect) {
          if (variant === "link") {
            return (
              <button
                onClick={openConnectModal}
                className="text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                Login
              </button>
            )
          }
          
          return (
            <button
              onClick={openConnectModal}
              className="flex items-center gap-2 rounded-lg bg-[#7B5CFF] px-4 py-2 text-sm font-medium text-white hover:bg-[#8C75FF] transition-colors"
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
              className="flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-white ring-1 ring-red-500/30 hover:bg-red-500/30 transition-colors"
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
              className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-sm text-white ring-1 ring-white/[0.1] hover:bg-white/[0.06] transition-colors"
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
              className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-sm text-white ring-1 ring-white/[0.1] hover:bg-white/[0.06] transition-colors"
            >
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white/[0.1]">
                <Wallet2 className="h-3 w-3" />
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
