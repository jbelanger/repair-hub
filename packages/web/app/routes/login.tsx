import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import { useAccount } from "wagmi";
import { ConnectWallet } from "~/components/ConnectWallet";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { PageHeader } from "~/components/ui/PageHeader";
import { db } from "~/utils/db.server";
import { toChecksumAddress } from "~/utils/blockchain/types";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirectTo") || "/dashboard";
  return json({ redirectTo });
}

export default function Login() {
  const { redirectTo } = useLoaderData<typeof loader>();
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();

  // Function to check if user exists
  const checkUserExists = async () => {
    if (!address) return;

    try {
      const response = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });

      const data = await response.json();

      if (data.exists) {
        // User exists, proceed with login
        navigate(redirectTo);
      } else {
        // No account found, redirect to registration
        navigate(`/register?address=${address}`);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  // Check user existence when wallet is connected
  if (isConnected && address) {
    checkUserExists();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title="Login to RepairHub"
        subtitle="Connect your wallet to access your account"
        backTo="/"
      />

      <Card className="p-6">
        {!isConnected ? (
          <div className="space-y-4">
            <p className="text-center text-white/70">
              Connect your wallet to continue
            </p>
            <div className="flex justify-center">
              <ConnectWallet />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-white/70">
              Checking your account...
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
