import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useAccount } from "wagmi";
import { db } from "~/utils/db.server";
import { Search, Plus } from 'lucide-react';
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Badge } from "~/components/ui/Badge";

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
  userRole?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const userAddress = url.searchParams.get("address")?.toLowerCase();

  if (!userAddress) {
    return json<LoaderData>({ repairRequests: [], userRole: undefined });
  }

  const user = await db.user.findUnique({
    where: { address: userAddress },
    select: { role: true },
  });

  if (!user) {
    return json<LoaderData>({ repairRequests: [], userRole: undefined });
  }

  const repairRequests = await db.repairRequest.findMany({
    where: user.role === 'TENANT' 
      ? { initiator: { address: userAddress } }
      : user.role === 'LANDLORD'
      ? { 
          property: {
            landlordId: userAddress,
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
    userRole: user.role,
  });
}

export default function RepairRequests() {
  const { address } = useAccount();
  const { repairRequests, userRole } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-purple-300">
            Repair Requests
          </h1>
          <p className="mt-1 text-purple-300/70">Manage and track your repair requests</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            type="text"
            placeholder="Search requests..."
            leftIcon={<Search className="h-4 w-4" />}
            className="sm:w-64"
          />
          {address && (userRole === 'TENANT' || userRole === 'LANDLORD') && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => window.location.href = '/repair-requests/create'}
            >
              Create Request
            </Button>
          )}
        </div>
      </div>

      {!address ? (
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
          <p className="text-purple-300/70">Please connect your wallet to view repair requests.</p>
        </div>
      ) : !userRole ? (
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
          <p className="text-purple-300/70">Please register first to create or view repair requests.</p>
        </div>
      ) : repairRequests.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-white/[0.04] bg-white/[0.02]">
          <h3 className="text-lg font-medium text-purple-300">No repair requests</h3>
          <p className="mt-2 text-purple-300/70">Get started by creating a new repair request.</p>
          <div className="mt-6">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => window.location.href = '/repair-requests/create'}
            >
              Create Request
            </Button>
          </div>
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
