import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useAccount } from "wagmi";
import { db } from "~/utils/db.server";
import { Search, Plus, ClipboardList, ArrowRight } from 'lucide-react';
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Badge } from "~/components/ui/Badge";
import { Card, CardHeader, CardContent, CardFooter } from "~/components/ui/Card";
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
      <Card className="text-center p-8">
        <div className="mx-auto w-12 h-12 rounded-full bg-purple-600/10 flex items-center justify-center mb-4">
          <ClipboardList className="h-6 w-6 text-purple-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Connect Your Wallet</h3>
        <p className="text-white/70">
          Please connect your wallet to view and manage repair requests
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {user.role === 'TENANT' ? 'My Repair Requests' : 'Property Repairs'}
          </h1>
          <p className="mt-2 text-lg text-white/70">
            {user.role === 'TENANT' 
              ? 'Track and manage your maintenance requests'
              : 'Manage repair requests for your properties'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            type="text"
            placeholder="Search requests..."
            leftIcon={<Search className="h-5 w-5" />}
            className="sm:w-64"
          />
          {(user.role === 'TENANT' || user.role === 'LANDLORD') && (
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Plus className="h-5 w-5" />}
              onClick={() => window.location.href = '/repair-requests/create'}
            >
              New Request
            </Button>
          )}
        </div>
      </div>

      {repairRequests.length === 0 ? (
        <Card className="text-center py-12">
          <div className="mx-auto w-12 h-12 rounded-full bg-purple-600/10 flex items-center justify-center mb-4">
            <ClipboardList className="h-6 w-6 text-purple-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No Repair Requests Yet</h3>
          <p className="text-white/70 mb-6">
            {user.role === 'TENANT'
              ? "You haven't submitted any repair requests yet"
              : "You don't have any repair requests to manage yet"}
          </p>
          <Button
            variant="primary"
            size="lg"
            leftIcon={<Plus className="h-5 w-5" />}
            onClick={() => window.location.href = '/repair-requests/create'}
          >
            Submit New Request
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {repairRequests.map((request) => (
            <Card key={request.id} hover>
              <CardHeader>
                <div>
                  <h3 className="text-lg font-medium text-white">{request.property.address}</h3>
                  <p className="text-sm text-white/70 mt-1">
                    Submitted by {request.initiator.name}
                  </p>
                </div>
                <Badge variant={
                  request.status === "PENDING" ? "warning" :
                  request.status === "IN_PROGRESS" ? "primary" :
                  request.status === "COMPLETED" ? "success" :
                  "default"
                }>
                  {request.status.replace('_', ' ')}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/70 line-clamp-2">{request.description}</p>
              </CardContent>
              <CardFooter className="justify-between">
                <Badge variant={
                  request.urgency === "HIGH" ? "danger" :
                  request.urgency === "MEDIUM" ? "warning" :
                  "default"
                }>
                  {request.urgency} Priority
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  onClick={() => window.location.href = `/repair-requests/${request.id}`}
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
