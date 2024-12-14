import { Link, Outlet } from "@remix-run/react";
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from "~/utils/blockchain/config";
import { Home, Wrench, Bell, Settings } from 'lucide-react';
import '@rainbow-me/rainbowkit/styles.css';
import { ConnectWallet } from "~/components/ConnectWallet";

const queryClient = new QueryClient()

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Repair Requests', href: '/repair-requests', icon: Wrench },
];

export default function Layout() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          <div className="min-h-screen">
            {/* Navigation */}
            <nav className="fixed top-0 z-50 w-full border-b border-white/[0.02] bg-background/80 backdrop-blur-xl">
              <div className="mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                  <div className="flex items-center gap-8">
                    {/* Logo */}
                    <Link 
                      to="/" 
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 ring-1 ring-purple-500/20">
                        <span className="text-lg font-semibold text-purple-300">R</span>
                      </div>
                      <span className="text-lg font-semibold text-purple-300">
                        RepairHub
                      </span>
                    </Link>
                    
                    {/* Main Navigation */}
                    <div className="hidden md:flex md:gap-1">
                      {navigation.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className="nav-link"
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right side navigation */}
                  <div className="flex items-center gap-2">
                    <button className="flex h-9 w-9 items-center justify-center rounded-lg text-purple-300/70 transition-colors hover:bg-white/[0.03] hover:text-purple-300">
                      <Bell className="h-5 w-5" />
                    </button>
                    <button className="flex h-9 w-9 items-center justify-center rounded-lg text-purple-300/70 transition-colors hover:bg-white/[0.03] hover:text-purple-300">
                      <Settings className="h-5 w-5" />
                    </button>
                    <div className="mx-2 h-5 w-px bg-white/[0.04]" />
                    <ConnectWallet />
                  </div>
                </div>
              </div>
            </nav>

            {/* Main content */}
            <main className="mx-auto max-w-[1200px] p-4 pt-20 sm:p-6 sm:pt-24 lg:p-8 lg:pt-28">
              <Outlet />
            </main>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
