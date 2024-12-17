import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, Form } from "@remix-run/react";
import { useAccount } from "wagmi";
import { ConnectWallet } from "~/components/ConnectWallet";
import { Card } from "~/components/ui/Card";
import { PageHeader } from "~/components/ui/PageHeader";
import { findOrCreateUser, createUserSession } from "~/utils/session.server";
import { type Address } from "~/utils/blockchain/types";
import { Button } from "~/components/ui/Button";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirectTo") || "/dashboard";
  return json({ redirectTo });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const address = formData.get("address");
  const redirectTo = formData.get("redirectTo") || "/dashboard";

  if (!address || typeof address !== "string") {
    return json({ error: "Invalid address" }, { status: 400 });
  }

  // Try to find existing user
  const user = await findOrCreateUser(address as Address);

  if (!user) {
    // No user found - redirect to registration
    return redirect(`/register?address=${address}&redirectTo=${redirectTo}`);
  }

  // User exists - create session and redirect
  return createUserSession(user.id, redirectTo as string);
}

export default function Login() {
  const { redirectTo } = useLoaderData<typeof loader>();
  const { address, isConnected } = useAccount();
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title="Login to RepairHub"
        subtitle="Connect your wallet to access your account"
        backTo="/"
      />

      <Card className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
            {error}
          </div>
        )}
        
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
          <Form method="post" className="space-y-4">
            <input type="hidden" name="address" value={address} />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <p className="text-center text-white/70">
              Wallet connected: {address}
            </p>
            <div className="flex justify-center">
              <Button type="submit" size="lg">
                Login to Dashboard
              </Button>
            </div>
          </Form>
        )}
      </Card>
    </div>
  );
}
