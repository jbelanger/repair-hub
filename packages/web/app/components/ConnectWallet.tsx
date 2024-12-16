import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Link } from '@remix-run/react';
import { Wallet2, ChevronDown, ExternalLink, Loader2 } from 'lucide-react'
import { useAccountEffect, useSignMessage, useAccount } from 'wagmi'
import { useState } from 'react';
import { cn } from '~/utils/cn';

interface ConnectWalletProps {  
  variant?: "primary" | "secondary" | "dark" | "blue" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  className?: string;
}

interface CheckUserResponse {
  exists?: boolean;
  error?: string;
}

export function ConnectWallet({ 
  variant = "primary",
  size = "md",
  className
}: ConnectWalletProps) {
  const { signMessageAsync } = useSignMessage();
  const { address } = useAccount();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  
  useAccountEffect({
    async onConnect({ address: connectedAddress, isReconnected }) {
      if (!connectedAddress || isReconnected || isConnecting || isAuthenticating) return;
      
      try {
        setIsConnecting(true);
        setError(null);

        // Check if user exists
        const response = await fetch('/api/auth/check-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address: connectedAddress }),
        });

        const data: CheckUserResponse = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        // Set destination for navigation
        setDestination(data.exists ? '/dashboard' : `/register?address=${connectedAddress}`);

      } catch (error) {
        console.error('Connection error:', error);
        setError(error instanceof Error ? error.message : 'Failed to connect');
      } finally {
        setIsConnecting(false);
      }
    },
    onDisconnect() {
      // Call logout endpoint
      fetch('/api/auth/logout', { method: 'POST' });
      setDestination('/');
    },
  });

  // Match Button component styles
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-purple-600 hover:bg-purple-500 text-white rounded-full",
    secondary: "bg-transparent border border-purple-600 text-purple-600 hover:bg-purple-600/5 rounded-full",
    dark: "bg-gray-800 hover:bg-gray-700 text-white rounded-full",
    blue: "bg-blue-500 hover:bg-blue-400 text-white rounded-full",
    ghost: "bg-transparent hover:bg-white/[0.02] text-white/70 hover:text-white rounded-lg",
    danger: "bg-red-600 hover:bg-red-500 text-white rounded-full",
  };

  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-10 px-5 text-base",
    lg: "h-12 px-6 text-base",
    icon: "h-9 w-9",
  };

  return (
    <div className="space-y-2">
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          mounted,
        }) => {
          const ready = mounted;
          if (!ready) {
            return (
              <button
                disabled
                className={cn(
                  baseStyles,
                  variants[variant],
                  sizes[size],
                  "opacity-50",
                  className
                )}
              >
                <Loader2 className="h-5 w-5 animate-spin" />
              </button>
            );
          }

          // Always show connect button if not connected
          if (!account) {
            return (
              <button
                onClick={openConnectModal}
                className={cn(
                  baseStyles,
                  variants[variant],
                  sizes[size],
                  className
                )}
                disabled={isConnecting || isAuthenticating}
              >
                {isConnecting || isAuthenticating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{isAuthenticating ? 'Authenticating...' : 'Connecting...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Wallet2 className="h-5 w-5" />
                    <span>Connect Wallet</span>
                  </div>
                )}
              </button>
            );
          }

          if (chain?.unsupported) {
            return (
              <button
                onClick={openChainModal}
                className={cn(
                  baseStyles,
                  "bg-red-600 hover:bg-red-500 text-white rounded-full",
                  sizes[size],
                  className
                )}
              >
                <span className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Wrong network
                </span>
              </button>
            );
          }

          return (
            <div className="flex items-center gap-2">
              <button
                onClick={openChainModal}
                className={cn(
                  baseStyles,
                  "bg-white/[0.03] hover:bg-white/[0.06] text-white rounded-lg ring-1 ring-white/[0.1]",
                  sizes[size],
                  className
                )}
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
                className={cn(
                  baseStyles,
                  "bg-white/[0.03] hover:bg-white/[0.06] text-white rounded-lg ring-1 ring-white/[0.1]",
                  sizes[size],
                  className
                )}
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
          );
        }}
      </ConnectButton.Custom>
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}
      {destination && (
        <Link to={destination} className="hidden" id="navigation-link" />
      )}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            function clickLink() {
              document.getElementById('navigation-link')?.click();
            }
            if (document.getElementById('navigation-link')) {
              clickLink();
            }
          `,
        }}
      />
    </div>
  );
}
