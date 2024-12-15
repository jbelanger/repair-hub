import { useAccount } from "wagmi";
import { ClipboardList, Wrench } from "lucide-react";
import { LinkButton } from "~/components/ui/LinkButton";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getUserFromSession } from "~/utils/session.server";

type LoaderData = {
  user: {
    id: string;
    address: string;
    role: string;
    name: string;
  } | null;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUserFromSession(request);
  return json<LoaderData>({ user });
}

export default function Index() {
  const { address } = useAccount();
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      {/* Large centered logo with gradient overlay */}
      <div className="relative mb-8 -mt-8 group">
        <div 
          className="h-80 w-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100 opacity-40"
          style={{
            WebkitMask: `url(/logo5.svg) center/contain no-repeat`,
            mask: `url(/logo5.svg) center/contain no-repeat`,
            backgroundColor: '#2563eb',
            filter: 'drop-shadow(0 0 30px rgba(37, 99, 235, 0.2))',
          }}
        />
        {/* Subtle gradient overlay */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-transparent to-background opacity-50"
          style={{
            WebkitMask: `url(/logo5.svg) center/contain no-repeat`,
            mask: `url(/logo5.svg) center/contain no-repeat`,
          }}
        />
      </div>

      <h1 className="text-4xl font-bold text-white mb-4">
        Welcome to RepairHub
      </h1>
      
      <p className="text-xl text-white/70 mb-8 max-w-2xl">
        The decentralized platform for managing property repairs and maintenance. Connect your wallet to get started.
      </p>

      {!address ? (
        <div className="space-y-4">
          <p className="text-purple-300/70">
            Connect your wallet to access the platform
          </p>
        </div>
      ) : !user ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <LinkButton
              to="/register"
              variant="primary"
              size="lg"
              leftIcon={<ClipboardList className="h-5 w-5" />}
            >
              Register Now
            </LinkButton>
          </div>
          <p className="text-purple-300/70">
            Create an account to start managing repairs
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <LinkButton
              to="/repair-requests"
              variant="primary"
              size="lg"
              leftIcon={<ClipboardList className="h-5 w-5" />}
            >
              View Repair Requests
            </LinkButton>
            <LinkButton
              to="/repair-requests/create"
              variant="secondary"
              size="lg"
              leftIcon={<Wrench className="h-5 w-5" />}
            >
              Submit New Request
            </LinkButton>
          </div>
          <p className="text-purple-300/70">
            Manage your property repairs and maintenance in one place
          </p>
        </div>
      )}

      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto text-left">
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-6">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
            <div 
              className="h-6 w-6"
              style={{
                WebkitMask: `url(/logo5.svg) center/contain no-repeat`,
                mask: `url(/logo5.svg) center/contain no-repeat`,
                backgroundColor: '#a855f7',
              }}
            />
          </div>
          <h3 className="text-lg font-medium text-purple-300 mb-2">
            Property Management
          </h3>
          <p className="text-purple-300/70">
            Easily manage repairs and maintenance for your properties or submit requests as a tenant.
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-6">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
            <Wrench className="h-6 w-6 text-purple-400" />
          </div>
          <h3 className="text-lg font-medium text-purple-300 mb-2">
            Smart Contracts
          </h3>
          <p className="text-purple-300/70">
            All repair requests and work orders are secured on the blockchain for transparency and trust.
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-6">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
            <ClipboardList className="h-6 w-6 text-purple-400" />
          </div>
          <h3 className="text-lg font-medium text-purple-300 mb-2">
            Track Progress
          </h3>
          <p className="text-purple-300/70">
            Real-time updates on repair requests, from submission to completion.
          </p>
        </div>
      </div>
    </div>
  );
}
