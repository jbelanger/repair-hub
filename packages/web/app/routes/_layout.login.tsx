import { json, redirect } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { Button } from "~/components/ui/Button";
import { db } from "~/utils/db.server";
import { createUserSession } from "~/utils/session.server";
import { useAccount } from "wagmi";

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const address = formData.get("address")?.toString();

  if (!address) {
    return json(
      { error: "Please connect your wallet" },
      { status: 400 }
    );
  }

  const user = await db.user.findUnique({
    where: { address: address.toLowerCase() },
  });

  if (!user) {
    return json(
      { error: "No account found with this address. Please register first." },
      { status: 404 }
    );
  }

  return createUserSession(user.id, "/dashboard");
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const { address } = useAccount();

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-white">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {!address ? (
          <div className="text-center">
            <p className="text-white/70 mb-4">
              Connect your wallet to sign in
            </p>
          </div>
        ) : (
          <form method="post" className="space-y-6">
            <input type="hidden" name="address" value={address} />
            
            {actionData?.error && (
              <div className="text-red-500 text-sm">{actionData.error}</div>
            )}

            <Button type="submit" className="w-full">
              Sign in with {address.slice(0, 6)}...{address.slice(-4)}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
