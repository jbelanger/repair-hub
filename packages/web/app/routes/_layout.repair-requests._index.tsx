import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useAccount } from "wagmi";
import { db } from "~/utils/db.server";
import { Search, Plus, ClipboardList } from 'lucide-react';
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Badge } from "~/components/ui/Badge";
import { requireUser } from "~/utils/session.server";

type LoaderData = {
  repairRequests: Array<{
    id: string;
    description: string;
    urgency: string;
    status: string;
    propertyId: string;
    property: {
      address: string;
    };
    initiator: {
      name: string;
      address: string;
    };
  }>;
  user: {
    id: string;
    role: string;
    address: string;
    name: string;
  };
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  const repairRequests = await db.repairRequest.findMany({
    where: user.role === 'TENANT' 
      ? { initiatorId: user.id }
      : user.role === 'LANDLORD'
      ? { 
          property: {
            landlordId: user.id,
          },
        }
      : undefined,
    include: {
      property: {
        select: {
          address: true,
        },
      },
      initiator: {
        select: {
          name: true,
          address: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return json<LoaderData>({ 
    repairRequests,
    user
  });
}

export default function RepairRequests() {
  const { address } = useAccount();
  const { repairRequests, user } = useLoaderData<typeof loader>();

  if (!address) {
    return (
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
          <ClipboardList className="h-6 w-6 text-purple-400" />
        </div>
        <h3 className="text-lg font-medium text-purple-300 mb-2">Connect Your Wallet</h3>
        <p className="text-purple-300/70">
          Please connect your wallet to view and manage repair requests
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-purple-300">
            {user.role === 'TENANT' ? 'My Repair Requests' : 'Property Repairs'}
          </h1>
          <p className="mt-1 text-purple-300/70">
            {user.role === 'TENANT' 
              ? 'Track and manage your maintenance requests'
              : 'Manage repair requests for your properties'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            type="text"
            placeholder="Search requests..."
            leftIcon={<Search className="h-4 w-4" />}
            className="sm:w-64"
          />
          {(user.role === 'TENANT' || user.role === 'LANDLORD') && (
            <Link to="create">
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus className="h-4 w-4" />}
              >
                New Request
              </Button>
            </Link>
          )}
        </div>
      </div>

      {repairRequests.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-white/[0.04] bg-white/[0.02]">
          <div className="mx-auto w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
            <ClipboardList className="h-6 w-6 text-purple-400" />
          </div>
          <h3 className="text-lg font-medium text-purple-300 mb-2">No Repair Requests Yet</h3>
          <p className="text-purple-300/70 mb-6">
            {user.role === 'TENANT'
              ? "You haven't submitted any repair requests yet"
              : "You don't have any repair requests to manage yet"}
          </p>
          <Link to="create">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Submit New Request
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {repairRequests.map((request) => (
            <div
              key={request.id}
              className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-purple-300">{request.property.address}</h3>
                  <p className="text-sm text-purple-300/70 mt-1">
                    Submitted by {request.initiator.name}
                  </p>
                </div>
                <Badge variant={
                  request.status === "PENDING" ? "warning" :
                  request.status === "IN_PROGRESS" ? "primary" :
                  request.status === "COMPLETED" ? "success" :
                  "default"
                }>
                  {request.status}
                </Badge>
              </div>
              <p className="text-sm text-purple-300/70 mb-4 line-clamp-2">{request.description}</p>
              <div className="flex justify-between items-center">
                <Badge variant={
                  request.urgency === "HIGH" ? "danger" :
                  request.urgency === "MEDIUM" ? "warning" :
                  "primary"
                }>
                  {request.urgency} Priority
                </Badge>
                <Link
                  to={request.id}
                  className="text-sm text-purple-300 hover:text-purple-200 transition-colors"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
