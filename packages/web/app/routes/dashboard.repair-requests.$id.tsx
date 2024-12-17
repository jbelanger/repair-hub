import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, Form } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { useRepairRequest, useRepairRequestRead, useWatchRepairRequestEvents } from "~/utils/blockchain/hooks/useRepairRequest";
import { RepairRequestStatusType, CONTRACT_ADDRESSES } from "~/utils/blockchain/config";
import { Card } from "~/components/ui/Card";
import { RepairStatus, RepairUrgency } from "~/components/ui/StatusBadge";
import { Select } from "~/components/ui/Select";
import { TextArea } from "~/components/ui/TextArea";
import { Button } from "~/components/ui/Button";
import { PageHeader } from "~/components/ui/PageHeader";
import { FormField, FormSection } from "~/components/ui/Form";
import { Building2, User, Calendar, Clock, Hash, Link as LinkIcon, History, Wrench, AlertTriangle } from 'lucide-react';
import { useEffect, useState, useCallback } from "react";
import { useToast, ToastManager } from "~/components/ui/Toast";
import { Skeleton } from "~/components/ui/LoadingState";
import { requireUser } from "~/utils/session.server";
import { type Address, type HexString, getEtherscanLink } from "~/utils/blockchain/types";
import { hashToHexSync } from "~/utils/blockchain/hash.server";

type LoaderData = {
  repairRequest: {
    id: string;
    description: string;
    urgency: string;
    status: string;
    attachments: string;
    workDetails: string | null;
    workDetailsHash: string | null;
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
  type: 'created' | 'updated' | 'hashUpdated' | 'workDetailsUpdated';
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

// Convert blockchain status enum to database status string
const statusMap = {
  [RepairRequestStatusType.PENDING]: "PENDING",
  [RepairRequestStatusType.IN_PROGRESS]: "IN_PROGRESS",
  [RepairRequestStatusType.COMPLETED]: "COMPLETED",
  [RepairRequestStatusType.ACCEPTED]: "ACCEPTED",
  [RepairRequestStatusType.REFUSED]: "REFUSED",
  [RepairRequestStatusType.REJECTED]: "REJECTED",
  [RepairRequestStatusType.CANCELLED]: "CANCELLED",
} as const;

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

export async function action({ request, params }: ActionFunctionArgs) {
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
          landlord: true,
        },
      },
      initiator: true,
    },
  });

  if (!repairRequest) {
    throw new Response("Not Found", { status: 404 });
  }

  const isLandlord = user.address.toLowerCase() === repairRequest.property.landlord.address.toLowerCase();
  const isTenant = user.address.toLowerCase() === repairRequest.initiator.address.toLowerCase();

  const formData = await request.formData();
  const action = formData.get("_action");

  if (action === "updateWorkDetails") {
    if (!isLandlord) {
      throw new Response("Unauthorized", { status: 403 });
    }

    const workDetails = formData.get("workDetails") as string;
    if (!workDetails) {
      return json({ error: "Work details are required" }, { status: 400 });
    }

    const workDetailsHash = hashToHexSync(workDetails);

    await db.repairRequest.update({
      where: { id },
      data: {
        workDetails,
        workDetailsHash,
      },
    });

    return json({ success: true });
  }

  if (action === "updateStatus") {
    const newStatus = formData.get("status") as string;
    if (!newStatus) {
      return json({ error: "Status is required" }, { status: 400 });
    }

    const numericStatus = Number(newStatus);
    if (!(numericStatus in RepairRequestStatusType)) {
      return json({ error: "Invalid status" }, { status: 400 });
    }

    const dbStatus = statusMap[numericStatus as RepairRequestStatusType];
    if (!dbStatus) {
      return json({ error: "Invalid status" }, { status: 400 });
    }

    // Validate status transition based on user role
    const availableStatusUpdates = getAvailableStatusUpdates(
      repairRequest.status,
      user.role,
      isLandlord,
      isTenant
    );

    if (!availableStatusUpdates.includes(numericStatus)) {
      return json({ error: "Invalid status transition" }, { status: 400 });
    }

    await db.repairRequest.update({
      where: { id },
      data: {
        status: dbStatus,
      },
    });

    return json({ success: true });
  }

  if (action === "withdrawRequest") {
    if (!isTenant) {
      throw new Response("Unauthorized", { status: 403 });
    }

    if (repairRequest.status !== "PENDING") {
      return json({ error: "Can only withdraw pending requests" }, { status: 400 });
    }

    await db.repairRequest.update({
      where: { id },
      data: {
        status: "CANCELLED",
      },
    });

    return json({ success: true });
  }

  if (action === "approveWork") {
    if (!isTenant) {
      throw new Response("Unauthorized", { status: 403 });
    }

    if (repairRequest.status !== "COMPLETED") {
      return json({ error: "Can only approve/refuse completed work" }, { status: 400 });
    }

    const isAccepted = formData.get("isAccepted") === "true";
    const newStatus = isAccepted ? "ACCEPTED" : "REFUSED";

    await db.repairRequest.update({
      where: { id },
      data: {
        status: newStatus,
      },
    });

    return json({ success: true });
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function RepairRequestDetails() {
  const navigate = useNavigate();
  const { repairRequest, user, availableStatusUpdates } = useLoaderData<typeof loader>();
  const { updateStatus, updateWorkDetails, withdrawRequest, approveWork, isPending } = useRepairRequest();
  const [events, setEvents] = useState<BlockchainEvent[]>([]);
  const [workDetailsInput, setWorkDetailsInput] = useState(repairRequest.workDetails || "");
  const { toasts, addToast, removeToast } = useToast();
  const isLandlord = user.address.toLowerCase() === repairRequest.property.landlord.address.toLowerCase();
  const isTenant = user.address.toLowerCase() === repairRequest.initiator.address.toLowerCase();

  // Get blockchain data
  const { repairRequest: blockchainRequest, isLoading } = useRepairRequestRead(BigInt(repairRequest.id));

  // Create a stable callback for event handling
  const handleEvent = useCallback((type: BlockchainEvent['type'], timestamp: bigint, data = {}) => {
    setEvents(prev => {
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
    onWorkDetailsUpdated: (id: bigint, initiator: Address, landlord: Address, oldHash: HexString, newHash: HexString, updatedAt: bigint) => {
      if (id.toString() === repairRequest.id) {
        handleEvent('workDetailsUpdated', updatedAt, { oldHash, newHash });
      }
    }
  });

  // Clear events when repair request ID changes
  useEffect(() => {
    setEvents([]);
  }, [repairRequest.id]);

  const handleStatusUpdate = async (newStatus: RepairRequestStatusType) => {
    try {
      // First update the blockchain
      await updateStatus(BigInt(repairRequest.id), newStatus);
      
      // Then update the database through the form action
      const formData = new FormData();
      formData.append("_action", "updateStatus");
      formData.append("status", newStatus.toString());
      
      const response = await fetch(`/dashboard/repair-requests/${repairRequest.id}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update status in database");
      }

      addToast("Status updated successfully", "success");
      window.location.reload();
    } catch (error) {
      console.error('Error updating status:', error);
      addToast("Failed to update status", "error");
    }
  };

  const handleWorkDetailsUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.currentTarget);
      const workDetails = formData.get("workDetails") as string;
      
      // First update the blockchain
      const workDetailsHash = hashToHexSync(workDetails);
      await updateWorkDetails(BigInt(repairRequest.id), workDetailsHash);
      
      // Then submit the form to update the database
      const response = await fetch(`/dashboard/repair-requests/${repairRequest.id}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update work details in database");
      }

      addToast("Work details updated successfully", "success");
      window.location.reload();
    } catch (error) {
      console.error('Error updating work details:', error);
      addToast("Failed to update work details", "error");
    }
  };

  const handleWithdrawRequest = async () => {
    try {
      // First update the blockchain
      await withdrawRequest(BigInt(repairRequest.id));
      
      // Then update the database
      const formData = new FormData();
      formData.append("_action", "withdrawRequest");
      
      const response = await fetch(`/dashboard/repair-requests/${repairRequest.id}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to withdraw request in database");
      }

      addToast("Request withdrawn successfully", "success");
      window.location.reload();
    } catch (error) {
      console.error('Error withdrawing request:', error);
      addToast("Failed to withdraw request", "error");
    }
  };

  const handleApproveWork = async (isAccepted: boolean) => {
    try {
      // First update the blockchain
      await approveWork(BigInt(repairRequest.id), isAccepted);
      
      // Then update the database
      const formData = new FormData();
      formData.append("_action", "approveWork");
      formData.append("isAccepted", isAccepted.toString());
      
      const response = await fetch(`/dashboard/repair-requests/${repairRequest.id}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update work approval in database");
      }

      addToast(`Work ${isAccepted ? 'approved' : 'refused'} successfully`, "success");
      window.location.reload();
    } catch (error) {
      console.error('Error approving/refusing work:', error);
      addToast(`Failed to ${isAccepted ? 'approve' : 'refuse'} work`, "error");
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
                    <div className="flex gap-4">
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
                      {repairRequest.status === 'PENDING' && isTenant && (
                        <Button
                          variant="danger"
                          onClick={handleWithdrawRequest}
                          disabled={isPending}
                          leftIcon={<AlertTriangle className="h-5 w-5" />}
                        >
                          Withdraw Request
                        </Button>
                      )}
                      {repairRequest.status === 'COMPLETED' && isTenant && (
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            onClick={() => handleApproveWork(true)}
                            disabled={isPending}
                          >
                            Approve Work
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleApproveWork(false)}
                            disabled={isPending}
                          >
                            Refuse Work
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormField>
                </div>
              )}
            </div>
          </Card>

          {/* Work Details Card */}
          {isLandlord && (
            <Card
              accent="purple"
              header={{
                title: "Work Details",
                icon: <Wrench className="h-5 w-5" />,
                iconBackground: true
              }}
            >
              <div className="p-6">
                <Form method="post" onSubmit={handleWorkDetailsUpdate}>
                  <input type="hidden" name="_action" value="updateWorkDetails" />
                  <FormSection>
                    <FormField label="Work Details">
                      <TextArea
                        name="workDetails"
                        value={workDetailsInput}
                        onChange={(e) => setWorkDetailsInput(e.target.value)}
                        placeholder="Enter work details..."
                        disabled={isPending}
                      />
                    </FormField>
                    <Button
                      type="submit"
                      disabled={isPending || !workDetailsInput}
                      leftIcon={<Wrench className="h-5 w-5" />}
                    >
                      Update Work Details
                    </Button>
                  </FormSection>
                </Form>
              </div>
            </Card>
          )}

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

                    {blockchainRequest.workDetailsHash && (
                      <div className="flex items-start gap-3">
                        <Wrench className="h-5 w-5 text-purple-400 mt-1.5 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <p className="text-white/70">Work Details Hash</p>
                          <p className="text-white text-sm font-mono">{blockchainRequest.workDetailsHash}</p>
                        </div>
                      </div>
                    )}
                    
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
                              {event.type === 'workDetailsUpdated' && 'Work details updated'}
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
