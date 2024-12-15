import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from "~/utils/blockchain/config";
import { Home, Wrench, Bell, Settings } from 'lucide-react';
import '@rainbow-me/rainbowkit/styles.css';
import { ConnectWallet } from "~/components/ConnectWallet";
import { Button } from "~/components/ui/Button";
import { getUserFromSession, createUserSession } from "~/utils/session.server";
import { db } from "~/utils/db.server";

const queryClient = new QueryClient()

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Repair Requests', href: '/repair-requests', icon: Wrench },
];

type LoaderData = {
  user: {
    id: string;
    address: string;
    role: string;
    name: string;
  } | null;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get("address")?.toLowerCase();
  const isRegisterPage = url.pathname === "/register";
  
  // Get user from session first
  const sessionUser = await getUserFromSession(request);
  
  // If we have a session user, use that
  if (sessionUser) {
    return json<LoaderData>({ user: sessionUser });
  }
  
  // If we have a wallet address and we're not on the register page
  if (walletAddress && !isRegisterPage) {
    // Check if user exists
    const user = await db.user.findUnique({
      where: { address: walletAddress },
      select: { 
        id: true,
        address: true,
        role: true,
        name: true,
      },
    });

    // If user exists, create session and return user
    if (user) {
      throw await createUserSession(user.id, url.pathname);
    }
    
    // If user doesn't exist, redirect to register
    if (!isRegisterPage) {
      throw redirect(`/register?address=${walletAddress}`);
    }
  }

  // If we're on a protected route and have no user, throw unauthorized
  const isProtectedRoute = url.pathname.startsWith('/repair-requests');
  if (isProtectedRoute && !sessionUser) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return json<LoaderData>({ user: null });
}

export default function Layout() {
  const { user } = useLoaderData<typeof loader>();

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
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.03] ring-1 ring-white/[0.1]">
                        <span className="text-lg font-semibold text-white">R</span>
                      </div>
                      <span className="text-lg font-semibold text-white">
                        RepairHub
                      </span>
                    </Link>
                    
                    {/* Main Navigation - Only show if user is authenticated */}
                    {user && (
                      <div className="hidden md:flex md:gap-1">
                        {navigation.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.name}
                              to={item.href}
                              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/[0.03] hover:text-white"
                            >
                              <Icon className="h-4 w-4" />
                              <span>{item.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right side navigation */}
                  <div className="flex items-center gap-2">
                    {user && (
                      <>
                        <Button variant="ghost" size="icon">
                          <Bell className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Settings className="h-5 w-5" />
                        </Button>
                        <div className="mx-2 h-5 w-px bg-white/[0.04]" />
                      </>
                    )}
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
