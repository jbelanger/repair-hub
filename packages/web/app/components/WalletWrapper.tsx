import { useEffect, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Loader2 } from 'lucide-react';

interface WalletWrapperProps {
  children: React.ReactNode;
}

export function WalletWrapper({ children }: WalletWrapperProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { isLoading: isWalletLoading } = useWalletClient();
  const { isConnected } = useAccount();

  useEffect(() => {
    // Add a small delay to prevent flashing
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (!isInitialized || isWalletLoading) {
    return (
      <div className="h-12 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
      </div>
    );
  }

  return <>{children}</>;
}
