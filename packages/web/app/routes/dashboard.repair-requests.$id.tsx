import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { useRepairRequest, useRepairRequestRead, useWatchRepairRequestEvents } from "~/utils/blockchain/hooks/useRepairRequest";
import { RepairRequestStatusType, CONTRACT_ADDRESSES } from "~/utils/blockchain/config";
import { Card } from "~/components/ui/Card";
import { RepairStatus, RepairUrgency } from "~/components/ui/StatusBadge";
import { Select } from "~/components/ui/Select";
import { PageHeader } from "~/components/ui/PageHeader";
import { FormField } from "~/components/ui/Form";
import { Building2, User, Calendar, Clock, Hash, Link as LinkIcon, History } from 'lucide-react';
import { useEffect, useState, useCallback } from "react";
import { useToast, ToastManager } from "~/components/ui/Toast";
import { Skeleton } from "~/components/ui/LoadingState";
import { requireUser } from "~/utils/session.server";
import { type Address, type HexString, getEtherscanLink } from "~/utils/blockchain/types";

type LoaderData = {
  repairRequest: {
    id: string;
    description: string;
    urgency: string;
    status: string;
    attachments: string;
    createdAt: string;
    updatedAt: string;
    property: {
      id: string;
      address: string;
      landlord: {
        id: string;
        name: string;
        address: Address;
      };
    };
    initiator: {
      id: string;
      name: string;
      address: Address;
    };
  };
  user: {
    id: string;
    role: string;
    address: Address;
  };
  availableStatusUpdates: RepairRequestStatusType[];
};

type BlockchainEvent = {
  type: 'created' | 'updated' | 'hashUpdated';
  timestamp: bigint;
  data: {
    status?: RepairRequestStatusType;
    oldHash?: HexString;
    newHash?: HexString;
  };
};

const formatTimestamp = (timestamp: bigint) => {
  return new Date(Number(timestamp) * 1000).toLocaleString();
};

// Get available status updates based on user role and current status
function getAvailableStatusUpdates(
  currentStatus: string,
  userRole: string,
  isLandlord: boolean,
  isTenant: boolean
): RepairRequestStatusType[] {
  if (!isLandlord && !isTenant) return [];

  switch (currentStatus) {
    case 'PENDING':
      return isLandlord 
        ? [RepairRequestStatusType.IN_PROGRESS, RepairRequestStatusType.REJECTED]
        : [RepairRequestStatusType.CANCELLED];
    case 'IN_PROGRESS':
      return isLandlord 
        ? [RepairRequestStatusType.COMPLETED]
        : [];
    case 'COMPLETED':
      return isTenant
        ? [RepairRequestStatusType.ACCEPTED, RepairRequestStatusType.REFUSED]
        : [];
    default:
      return [];
  }
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const { id } = params;

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

  // Check if user has access to this repair request
  const isLandlord = user.address.toLowerCase() === repairRequest.property.landlord.address.toLowerCase();
  const isTenant = user.address.toLowerCase() === repairRequest.initiator.address.toLowerCase();

  if (!isLandlord && !isTenant) {
    throw redirect("/dashboard/repair-requests");
  }

  const availableStatusUpdates = getAvailableStatusUpdates(
    repairRequest.status,
    user.role,
    isLandlord,
    isTenant
  );

  return json<LoaderData>({
    repairRequest: {
      ...repairRequest,
      createdAt: repairRequest.createdAt.toISOString(),
      updatedAt: repairRequest.updatedAt.toISOString(),
      property: {
        ...repairRequest.property,
        landlord: {
          ...repairRequest.property.landlord,
          address: repairRequest.property.landlord.address as Address
        }
      },
      initiator: {
        ...repairRequest.initiator,
        address: repairRequest.initiator.address as Address
      }
    },
    user: {
      ...user,
      address: user.address as Address
    },
    availableStatusUpdates,
  });
}

export default function RepairRequestDetails() {
  const navigate = useNavigate();
  const { repairRequest, user, availableStatusUpdates } = useLoaderData<typeof loader>();
  const { updateStatus, isPending } = useRepairRequest();
  const [events, setEvents] = useState<BlockchainEvent[]>([]);
  const { toasts, addToast, removeToast } = useToast();

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
    onCreated: (id: bigint, initiator: Address, landlord: Address, propertyId: HexString, descriptionHash: HexString, createdAt: bigint) => {
      if (id.toString() === repairRequest.id) {
        handleEvent('created', createdAt);
      }
    },
    onStatusChanged: (id: bigint, initiator: Address, landlord: Address, oldStatus: RepairRequestStatusType, newStatus: RepairRequestStatusType, updatedAt: bigint) => {
      if (id.toString() === repairRequest.id) {
        handleEvent('updated', updatedAt, { status: newStatus });
      }
    },
    onDescriptionUpdated: (id: bigint, initiator: Address, landlord: Address, oldHash: HexString, newHash: HexString, updatedAt: bigint) => {
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
      addToast("Status updated successfully", "success");
      window.location.reload();
    } catch (error) {
      console.error('Error updating status:', error);
      addToast("Failed to update status", "error");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Repair Request Details"
        subtitle="View and manage repair request information"
        backTo="/dashboard/repair-requests"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card */}
          <Card
            accent="purple"
            header={{
              title: "Description",
              icon: <Hash className="h-5 w-5" />,
              iconBackground: true,
              extra: <RepairUrgency urgency={repairRequest.urgency} />
            }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <RepairStatus status={repairRequest.status} />
              </div>
              <p className="text-white/70">{repairRequest.description}</p>
              {availableStatusUpdates.length > 0 && (
                <div className="mt-6 pt-6 border-t border-purple-600/10">
                  <FormField label="Update Status">
                    <Select
                      value=""
                      onChange={(e) => handleStatusUpdate(Number(e.target.value))}
                      disabled={isPending}
                    >
                      <option value="">Select new status...</option>
                      {availableStatusUpdates.map((status) => (
                        <option key={status} value={status}>
                          {RepairRequestStatusType[status].replace(/_/g, ' ')}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>
              )}
            </div>
          </Card>

          {/* Blockchain Information Card */}
          <Card
            accent="purple"
            header={{
              title: "Blockchain Information",
              icon: <LinkIcon className="h-5 w-5" />,
              iconBackground: true
            }}
          >
            <div className="p-6">
              {isLoading ? (
                <Skeleton className="h-48" />
              ) : blockchainRequest ? (
                <div className="space-y-6">
                  <div className="grid gap-4">
                    <div className="flex items-start gap-3">
                      <Hash className="h-5 w-5 text-purple-400 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <p className="text-white/70">Description Hash</p>
                        <p className="text-white text-sm font-mono">{blockchainRequest.descriptionHash}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-purple-400 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <p className="text-white/70">Initiator Address</p>
                        <a
                          href={getEtherscanLink('address', blockchainRequest.initiator)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white text-sm font-mono hover:text-purple-300 transition-colors"
                        >
                          {blockchainRequest.initiator}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <LinkIcon className="h-5 w-5 text-purple-400 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <p className="text-white/70">Contract Address</p>
                        <a
                          href={getEtherscanLink('address', CONTRACT_ADDRESSES.REPAIR_REQUEST)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white text-sm font-mono hover:text-purple-300 transition-colors"
                        >
                          {CONTRACT_ADDRESSES.REPAIR_REQUEST}
                        </a>
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

                  <div className="pt-4 border-t border-purple-600/10">
                    <div className="flex items-center gap-2 mb-3">
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
                </div>
              ) : (
                <p className="text-white/70">No blockchain data available</p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Property Details Card */}
          <Card
            accent="purple"
            header={{
              title: "Property Details",
              icon: <Building2 className="h-5 w-5" />,
              iconBackground: true
            }}
          >
            <div className="p-6 space-y-4">
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
            </div>
          </Card>

          {/* Request Details Card */}
          <Card
            accent="purple"
            header={{
              title: "Request Details",
              icon: <Clock className="h-5 w-5" />,
              iconBackground: true
            }}
          >
            <div className="p-6 space-y-4">
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
            </div>
          </Card>
        </div>
      </div>

      <ToastManager toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
