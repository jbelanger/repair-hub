import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useAccount } from "wagmi";
import { db } from "~/utils/db.server";
import { useRepairRequest, useRepairRequestRead, useWatchRepairRequestEvents } from "~/utils/blockchain/hooks/useRepairRequest";
import { RepairRequestStatusType, CONTRACT_ADDRESSES } from "~/utils/blockchain/config";
import { Card, CardHeader, CardContent, CardFooter } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";
import { Select } from "~/components/ui/Select";
import { Button } from "~/components/ui/Button";
import { ArrowLeft, Building2, User, Calendar, Clock, Hash, Link, History } from 'lucide-react';
import { useEffect, useState, useCallback } from "react";

type LoaderData = {
  repairRequest: {
    id: string;
    description: string;
    urgency: string;
    status: string;
    attachments: string;
    hash: string;
    createdAt: string;
    updatedAt: string;
    property: {
      id: string;
      address: string;
      landlord: {
        id: string;
        name: string;
        address: string;
      };
    };
    initiator: {
      id: string;
      name: string;
      address: string;
    };
  };
  userRole?: string;
  canUpdateStatus: boolean;
};

type BlockchainEvent = {
  type: 'created' | 'updated' | 'hashUpdated';
  timestamp: bigint;
  data: {
    status?: RepairRequestStatusType;
    oldHash?: string;
    newHash?: string;
  };
};

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { id } = params;
  const url = new URL(request.url);
  const userAddress = url.searchParams.get("address")?.toLowerCase();

  if (!id) {
    throw new Response("Not Found", { status: 404 });
  }

  const repairRequest = await db.repairRequest.findUnique({
    where: { id },
    include: {
      property: {
        include: {
          landlord: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
      },
      initiator: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
    },
  });

  if (!repairRequest) {
    throw new Response("Not Found", { status: 404 });
  }

  let userRole;
  let canUpdateStatus = false;
  
  if (userAddress) {
    const user = await db.user.findUnique({
      where: { address: userAddress },
      select: { role: true },
    });
    userRole = user?.role;

    canUpdateStatus = 
      userAddress === repairRequest.property.landlord.address.toLowerCase() ||
      userAddress === repairRequest.initiator.address.toLowerCase();
  }

  return json<LoaderData>({
    repairRequest: {
      ...repairRequest,
      createdAt: repairRequest.createdAt.toISOString(),
      updatedAt: repairRequest.updatedAt.toISOString(),
    },
    userRole,
    canUpdateStatus,
  });
}

export default function RepairRequestDetails() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const { repairRequest, canUpdateStatus } = useLoaderData<typeof loader>();
  const { updateStatus, isPending } = useRepairRequest();
  const [events, setEvents] = useState<BlockchainEvent[]>([]);

  // Get blockchain data
  const { repairRequest: blockchainRequest, isLoading } = useRepairRequestRead(BigInt(repairRequest.id));

  // Create a stable callback for event handling
  const handleEvent = useCallback((type: BlockchainEvent['type'], timestamp: bigint, data = {}) => {
    setEvents(prev => {
      // Check if this exact event already exists
      const exists = prev.some(e => 
        e.type === type && 
        e.timestamp === timestamp &&
        JSON.stringify(e.data) === JSON.stringify(data)
      );
      
      if (exists) return prev;
      
      return [...prev, { type, timestamp, data }];
    });
  }, []);

  // Watch for blockchain events
  useWatchRepairRequestEvents({
    onCreated: (id, initiator, propertyId, descriptionHash, createdAt) => {
      if (id.toString() === repairRequest.id) {
        handleEvent('created', createdAt);
      }
    },
    onUpdated: (id, status, updatedAt) => {
      if (id.toString() === repairRequest.id) {
        handleEvent('updated', updatedAt, { status });
      }
    },
    onDescriptionHashUpdated: (id, oldHash, newHash, updatedAt) => {
      if (id.toString() === repairRequest.id) {
        handleEvent('hashUpdated', updatedAt, { oldHash, newHash });
      }
    }
  });

  // Clear events when repair request ID changes
  useEffect(() => {
    setEvents([]);
  }, [repairRequest.id]);

  const handleStatusUpdate = async (newStatus: RepairRequestStatusType) => {
    try {
      await updateStatus(BigInt(repairRequest.id), newStatus);
      window.location.reload();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const statusOptions = [
    { value: RepairRequestStatusType.PENDING, label: 'Pending' },
    { value: RepairRequestStatusType.APPROVED, label: 'Approved' },
    { value: RepairRequestStatusType.IN_PROGRESS, label: 'In Progress' },
    { value: RepairRequestStatusType.COMPLETED, label: 'Completed' },
    { value: RepairRequestStatusType.CANCELLED, label: 'Cancelled' },
  ];

  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const getEtherscanLink = (type: 'tx' | 'address' | 'token', value: string): string | undefined => {
    // Only create link if value is a valid hex string starting with 0x
    if (!/^0x[a-fA-F0-9]+$/.test(value)) {
      return undefined;
    }
    return `https://sepolia.etherscan.io/${type}/${value}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/repair-requests')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">
            Repair Request Details
          </h1>
          <p className="mt-2 text-lg text-white/70">
            View and manage repair request information
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-purple-600/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center gap-3">
                  Description
                  <Badge variant={
                    repairRequest.urgency === "HIGH" ? "danger" :
                    repairRequest.urgency === "MEDIUM" ? "warning" :
                    "default"
                  }>
                    {repairRequest.urgency} Priority
                  </Badge>
                </h2>
                <Badge variant={
                  repairRequest.status === "PENDING" ? "warning" :
                  repairRequest.status === "IN_PROGRESS" ? "primary" :
                  repairRequest.status === "COMPLETED" ? "success" :
                  "default"
                }>
                  {repairRequest.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-white/70">{repairRequest.description}</p>
            </CardContent>
            {address && canUpdateStatus && (
              <CardFooter className="border-t border-purple-600/10">
                <Select
                  value=""
                  onChange={(e) => handleStatusUpdate(Number(e.target.value))}
                  disabled={isPending}
                >
                  <option value="">Update status...</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </CardFooter>
            )}
          </Card>

          <Card className="bg-purple-600/5">
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Blockchain Information</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <p className="text-white/70">Loading blockchain data...</p>
              ) : blockchainRequest ? (
                <>
                  <div className="grid gap-4">
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-start gap-3">
                        <Hash className="h-5 w-5 text-purple-400 mt-1.5 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <p className="text-white/70">Transaction Hash</p>
                          {getEtherscanLink('tx', repairRequest.hash) ? (
                            <a
                              href={getEtherscanLink('tx', repairRequest.hash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Click to view on Etherscan (opens in a new tab)"
                              className="text-white text-sm font-mono hover:text-purple-300 transition-colors cursor-pointer"
                            >
                              {repairRequest.hash}
                            </a>
                          ) : (
                            <p className="text-white text-sm font-mono">{repairRequest.hash}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-purple-400 mt-1.5 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <p className="text-white/70">Initiator Address</p>
                          {getEtherscanLink('address', blockchainRequest.initiator) ? (
                            <a
                              href={getEtherscanLink('address', blockchainRequest.initiator)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Click to view on Etherscan (opens in a new tab)"
                              className="text-white text-sm font-mono hover:text-purple-300 transition-colors cursor-pointer"
                            >
                              {blockchainRequest.initiator}
                            </a>
                          ) : (
                            <p className="text-white text-sm font-mono">{blockchainRequest.initiator}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Link className="h-5 w-5 text-purple-400 mt-1.5 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <p className="text-white/70">Contract Address</p>
                          {getEtherscanLink('token', CONTRACT_ADDRESSES.REPAIR_REQUEST) ? (
                            <a
                              href={getEtherscanLink('token', CONTRACT_ADDRESSES.REPAIR_REQUEST)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Click to view on Etherscan (opens in a new tab)"
                              className="text-white text-sm font-mono hover:text-purple-300 transition-colors cursor-pointer"
                            >
                              {CONTRACT_ADDRESSES.REPAIR_REQUEST}
                            </a>
                          ) : (
                            <p className="text-white text-sm font-mono">{CONTRACT_ADDRESSES.REPAIR_REQUEST}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Link className="h-5 w-5 text-purple-400 mt-1.5 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <p className="text-white/70">Description Hash</p>
                          <p className="text-white text-sm font-mono">{blockchainRequest.descriptionHash}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-white/70">Created On Chain</p>
                            <p className="text-white">{formatTimestamp(blockchainRequest.createdAt)}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-white/70">Last Updated On Chain</p>
                            <p className="text-white">{formatTimestamp(blockchainRequest.updatedAt)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-purple-600/10">
                    <div className="flex items-center gap-2">
                      <History className="h-5 w-5 text-purple-400" />
                      <h3 className="text-white font-semibold">Event History</h3>
                    </div>
                    <div className="space-y-2">
                      {events.length > 0 ? (
                        events
                          .sort((a, b) => Number(b.timestamp - a.timestamp))
                          .map((event, index) => (
                            <div key={index} className="text-white/70 text-sm">
                              {formatTimestamp(event.timestamp)} -{' '}
                              {event.type === 'created' && 'Request created on chain'}
                              {event.type === 'updated' && `Status updated to ${RepairRequestStatusType[event.data.status!]}`}
                              {event.type === 'hashUpdated' && 'Description hash updated'}
                            </div>
                          ))
                      ) : (
                        <p className="text-white/70 text-sm">No events recorded yet</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-white/70">No blockchain data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-purple-600/5">
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Property Details</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="text-white/70">Address</p>
                  <p className="text-white">{repairRequest.property.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="text-white/70">Landlord</p>
                  <p className="text-white">{repairRequest.property.landlord.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-600/5">
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Request Details</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="text-white/70">Submitted by</p>
                  <p className="text-white">{repairRequest.initiator.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="text-white/70">Created</p>
                  <p className="text-white">
                    {new Date(repairRequest.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="text-white/70">Last Updated</p>
                  <p className="text-white">
                    {new Date(repairRequest.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
