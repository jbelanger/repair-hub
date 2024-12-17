import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import { WagmiConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from "~/utils/blockchain/config";
import { ThemeProvider } from "~/context/ThemeContext";
import { useEffect, useState } from "react";

import "./tailwind.css";
import "./styles/themes.css";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {/* Background decoration */}
        <div className="fixed inset-0 -z-10">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1A0B38] via-[#0A0612] to-[#0A0612]" />
          
          {/* Glowing orbs */}
          <div className="absolute -left-1/4 top-0 h-[800px] w-[800px] rounded-full bg-[#1A0B38]/10 blur-[120px]" />
          <div className="absolute -right-1/4 top-1/4 h-[600px] w-[600px] rounded-full bg-[#1A0B38]/10 blur-[120px]" />
          
          {/* Dot pattern overlay */}
          <div 
            className="absolute inset-0 opacity-[0.3] mix-blend-soft-light"
            style={{
              backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />
          
          {/* Noise texture */}
          <div 
            className="absolute inset-0 opacity-[0.02] mix-blend-soft-light"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative z-0 min-h-screen">
          {children}
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ClientOnly>
      <QueryClientProvider client={queryClient}>
        <WagmiConfig config={config}>
          <RainbowKitProvider theme={darkTheme()}>
            <ThemeProvider>
              <Outlet />
            </ThemeProvider>
          </RainbowKitProvider>
        </WagmiConfig>
      </QueryClientProvider>
    </ClientOnly>
  );
}
