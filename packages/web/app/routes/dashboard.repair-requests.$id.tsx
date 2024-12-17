import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation, useNavigate, useRevalidator } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { useRepairRequest } from "~/utils/blockchain/hooks/useRepairRequest";
import { RepairRequestContractABI } from "~/utils/blockchain/abis/RepairRequestContract";
import { RepairRequestStatusType } from "~/utils/blockchain/config";
import { PageHeader } from "~/components/ui/PageHeader";
import { useToast, ToastManager } from "~/components/ui/Toast";
import { requireUser } from "~/utils/session.server";
import { type Address, type HexString } from "~/utils/blockchain/types";
import { hashToHexSync } from "~/utils/blockchain/hash.server";
import { BlockchainEvent, statusMap, validateStatusTransition, validateWithdrawRequest, getValidTransitions } from "~/utils/repair-request";
import { RepairRequestBlockchain } from "~/components/repair-request/RepairRequestBlockchain";
import { RepairRequestDetails } from "~/components/repair-request/RepairRequestDetails";
import { LandlordView } from "~/components/repair-request/LandlordView";
import { TenantView } from "~/components/repair-request/TenantView";
import { Switch } from "~/components/ui/Switch";
import type { LoaderData } from "~/types/repair-request";
import type { ContractError, ContractRepairRequest, SerializedContractRepairRequest } from "~/utils/blockchain/types/repair-request";
import { useState, useEffect, useCallback, useRef } from "react";
import { Form } from "@remix-run/react";
import { ResultAsync } from "neverthrow";
import { usePublicClient } from 'wagmi'
import { readRepairRequest } from '~/utils/blockchain/utils/contract-read'
import { decodeEventLog } from 'viem'
import { CONTRACT_ADDRESSES } from "~/utils/blockchain/config";
import { useRepairRequestEvents } from "~/hooks/useRepairRequestEvents";
import { getPublicClient } from "~/utils/blockchain/utils/client";

// Helper function to convert BigInt values to strings
function serializeBlockchainData(data: ContractRepairRequest): SerializedContractRepairRequest {
  return {
    ...data,
    id: data.id.toString(),
    createdAt: data.createdAt.toString(),
    updatedAt: data.updatedAt.toString(),
  };
}

// Helper function to convert string to bigint
function toBigInt(value: string | number): bigint {
  return BigInt(value.toString());
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const { id } = params;

  if (!id) {
    throw new Response("Not Found", { status: 404 });
  }

  // Get blockchain state first
  const blockchainResult = await readRepairRequest(getPublicClient(), BigInt(id));
  if (blockchainResult.isErr()) {
    throw new Response("Failed to read blockchain state", { status: 500 });
  }
  const blockchainRequest = blockchainResult.value;

  // Get metadata from database
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

  const isLandlord = user.address.toLowerCase() === repairRequest.property.landlord.address.toLowerCase();
  const isTenant = user.address.toLowerCase() === repairRequest.initiator.address.toLowerCase();

  if (!isLandlord && !isTenant) {
    throw redirect("/dashboard/repair-requests");
  }

  // Get valid status transitions based on blockchain status
  const availableStatusUpdates = getValidTransitions(blockchainRequest.status);

  return json({
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
    blockchainRequest: serializeBlockchainData(blockchainRequest),
    user: {
      ...user,
      address: user.address as Address
    },
    isLandlord,
    isTenant,
    availableStatusUpdates
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  try {
    const user = await requireUser(request);
    const { id } = params;

    if (!id) {
      return json({ error: "Repair request ID is required" }, { status: 400 });
    }

    // Get blockchain state first
    const blockchainResult = await readRepairRequest(getPublicClient(), BigInt(id));
    if (blockchainResult.isErr()) {
      throw new Response("Failed to read blockchain state", { status: 500 });
    }
    const blockchainRequest = blockchainResult.value;

    // Get metadata from database
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
      return json({ error: "Repair request not found" }, { status: 404 });
    }

    const isLandlord = user.address.toLowerCase() === repairRequest.property.landlord.address.toLowerCase();
    const isTenant = user.address.toLowerCase() === repairRequest.initiator.address.toLowerCase();

    const formData = await request.formData();
    const action = formData.get("_action");

    if (action === "updateWorkDetails") {
      if (!isLandlord) {
        return json({ error: "Only the landlord can update work details" }, { status: 403 });
      }

      const workDetails = formData.get("workDetails") as string;
      if (!workDetails) {
        return json({ error: "Work details are required" }, { status: 400 });
      }

      const workDetailsHash = hashToHexSync(workDetails);

      // Create notification for tenant
      await db.notification.create({
        data: {
          userId: repairRequest.initiator.id,
          type: 'work_details_updated',
          title: 'Work Details Updated',
          message: `The work details for your repair request (#${id}) have been updated`,
          data: JSON.stringify({ repairRequestId: id })
        }
      });

      return json({ 
        success: true,
        workDetailsHash,
      });
    }

    if (action === "updateStatus") {
      if (!isLandlord) {
        return json({ error: "Only the landlord can update the status" }, { status: 403 });
      }

      const newStatus = formData.get("status") as string;
      if (!newStatus) {
        return json({ error: "Status is required" }, { status: 400 });
      }

      const numericStatus = Number(newStatus);
      if (!(numericStatus in RepairRequestStatusType)) {
        return json({ error: "Invalid status value" }, { status: 400 });
      }

      // Validate status transition using blockchain state
      const validTransitions = getValidTransitions(blockchainRequest.status);
      if (!validTransitions.includes(numericStatus)) {
        return json({ error: "Invalid status transition" }, { status: 400 });
      }

      // Create notification based on new status
      switch (numericStatus) {
        case RepairRequestStatusType.IN_PROGRESS:
          await db.notification.create({
            data: {
              userId: repairRequest.initiator.id,
              type: 'repair_request_in_progress',
              title: 'Repair Request In Progress',
              message: `Your repair request (#${id}) is now being worked on`,
              data: JSON.stringify({ repairRequestId: id })
            }
          });
          break;
        case RepairRequestStatusType.COMPLETED:
          await db.notification.create({
            data: {
              userId: repairRequest.initiator.id,
              type: 'repair_request_completed',
              title: 'Repair Work Completed',
              message: `The repair work for your request (#${id}) has been completed. Please review and accept/refuse the work.`,
              data: JSON.stringify({ repairRequestId: id })
            }
          });
          break;
        case RepairRequestStatusType.REJECTED:
          await db.notification.create({
            data: {
              userId: repairRequest.initiator.id,
              type: 'repair_request_rejected',
              title: 'Repair Request Rejected',
              message: `Your repair request (#${id}) has been rejected by the landlord`,
              data: JSON.stringify({ repairRequestId: id })
            }
          });
          break;
      }

      return json({ 
        success: true,
        status: numericStatus
      });
    }

    if (action === "withdrawRequest") {
      if (!isTenant) {
        return json({ error: "Only the tenant who created the request can withdraw it" }, { status: 403 });
      }

      // Check blockchain state for withdrawal
      if (blockchainRequest.status !== RepairRequestStatusType.PENDING) {
        return json({ error: "Can only withdraw pending requests" }, { status: 400 });
      }

      // Create notification for landlord
      await db.notification.create({
        data: {
          userId: repairRequest.property.landlord.id,
          type: 'repair_request_cancelled',
          title: 'Repair Request Cancelled',
          message: `Repair request #${id} has been cancelled by the tenant`,
          data: JSON.stringify({ repairRequestId: id })
        }
      });

      return json({ success: true });
    }

    if (action === "approveWork") {
      if (!isTenant) {
        return json({ error: "Only the tenant who created the request can approve/refuse work" }, { status: 403 });
      }

      // Check blockchain state for approval
      if (blockchainRequest.status !== RepairRequestStatusType.COMPLETED) {
        return json({ error: "Can only approve/refuse completed work" }, { status: 400 });
      }

      const isAccepted = formData.get("isAccepted") === "true";

      // Create notification for landlord
      await db.notification.create({
        data: {
          userId: repairRequest.property.landlord.id,
          type: isAccepted ? 'repair_request_accepted' : 'repair_request_refused',
          title: isAccepted ? 'Repair Work Accepted' : 'Repair Work Refused',
          message: isAccepted 
            ? `The tenant has accepted the completed work for repair request #${id}`
            : `The tenant has refused the completed work for repair request #${id}. Please review and make necessary adjustments.`,
          data: JSON.stringify({ repairRequestId: id })
        }
      });

      return json({ success: true });
    }

    return json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return json({ 
      error: error.message || "An unexpected error occurred" 
    }, { status: 500 });
  }
}

export default function RepairRequestPage() {
  const { repairRequest, blockchainRequest, user, isLandlord, isTenant, availableStatusUpdates } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const actionData = useActionData<{ 
    success?: boolean; 
    error?: string; 
    workDetailsHash?: HexString;
    status?: number;
  }>();
  const navigation = useNavigation();
  const { updateStatus, updateWorkDetails, withdrawRequest, approveWork, isPending } = useRepairRequest();
  const { toasts, addToast, removeToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLandlordView, setShowLandlordView] = useState(user.role === "LANDLORD");
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'withdraw' | 'status' | 'workDetails';
    expectedValue?: string | number;
    transactionId?: string;
    description?: string;
  } | null>(null);
  const mounted = useRef(true);
  const formDataRef = useRef<FormData | null>(null);
  const lastProcessedActionRef = useRef<string | null>(null);
  const [isRejected, setIsRejected] = useState(false);
  const publicClient = usePublicClient();

  // Use the hook to get events
  const { events } = useRepairRequestEvents(repairRequest.id);

  // Reset form state when transaction is rejected
  useEffect(() => {
    if (isRejected) {
      lastProcessedActionRef.current = null;
      formDataRef.current = null;
      setPendingAction(null);
      setIsProcessing(false);
      setIsRejected(false);
    }
  }, [isRejected]);

  // Reset action handled ref when navigation state changes
  useEffect(() => {
    if (navigation.state === 'idle') {
      lastProcessedActionRef.current = null;
    }
  }, [navigation.state]);

  // Watch for blockchain events
  useEffect(() => {
    if (!publicClient || !mounted.current || !isProcessing || !pendingAction) return;

    const unwatchCallbacks: (() => void)[] = [];

    // Watch for all status changes (including withdraw and approve)
    const unwatch = publicClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
      abi: RepairRequestContractABI,
      eventName: 'RepairRequestStatusChanged',
      onLogs: (logs) => {
        logs.forEach(log => {
          try {
            const decoded = decodeEventLog({
              abi: RepairRequestContractABI,
              data: log.data,
              topics: log.topics
            });
            const args = decoded.args as any;
            
            if (args.id.toString() === repairRequest.id && 
                pendingAction?.transactionId) {
              const newStatus = Number(args.newStatus);
              if (mounted.current) {
                switch (newStatus) {
                  case RepairRequestStatusType.CANCELLED:
                    addToast("Request has been successfully withdrawn", "success", "Withdrawal Successful");
                    setWithdrawSuccess(true);
                    break;
                  case RepairRequestStatusType.ACCEPTED:
                    addToast("Work has been approved", "success", "Update Successful");
                    setPendingAction(null);
                    revalidator.revalidate();
                    break;
                  case RepairRequestStatusType.REFUSED:
                    addToast("Work has been refused", "success", "Update Successful");
                    setPendingAction(null);
                    revalidator.revalidate();
                    break;
                  case RepairRequestStatusType.REJECTED:
                    addToast("Request has been rejected", "success", "Update Successful");
                    setPendingAction(null);
                    revalidator.revalidate();
                    break;
                  case RepairRequestStatusType.IN_PROGRESS:
                    addToast("Work has started", "success", "Update Successful");
                    setPendingAction(null);
                    revalidator.revalidate();
                    break;
                  case RepairRequestStatusType.COMPLETED:
                    addToast("Work has been completed", "success", "Update Successful");
                    setPendingAction(null);
                    revalidator.revalidate();
                    break;
                  default:
                    addToast("Status has been updated", "success", "Update Successful");
                    setPendingAction(null);
                    revalidator.revalidate();
                }
              }
            }
          } catch (error) {
            console.error('Error handling status change event:', error);
          }
        });
      }
    });
    unwatchCallbacks.push(unwatch);

    // Watch for work details updates
    if (pendingAction.type === 'workDetails') {
      const unwatch = publicClient.watchContractEvent({
        address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
        abi: RepairRequestContractABI,
        eventName: 'WorkDetailsUpdated',
        onLogs: (logs) => {
          logs.forEach(log => {
            try {
              const decoded = decodeEventLog({
                abi: RepairRequestContractABI,
                data: log.data,
                topics: log.topics
              });
              const args = decoded.args as any;
              
              if (args.id.toString() === repairRequest.id && 
                  args.newHash === pendingAction.expectedValue &&
                  pendingAction.transactionId) {
                if (mounted.current) {
                  addToast("Work details have been updated", "success", "Update Successful");
                  setPendingAction(null);
                  revalidator.revalidate();
                }
              }
            } catch (error) {
              console.error('Error handling work details event:', error);
            }
          });
        }
      });
      unwatchCallbacks.push(unwatch);
    }

    return () => {
      unwatchCallbacks.forEach(unwatch => unwatch());
    };
  }, [publicClient, isProcessing, pendingAction?.transactionId, repairRequest.id]);

const handleBlockchainTransaction = useCallback(async (
    action: string,
    formData: FormData,
    workDetailsHash?: HexString,
    statusValue?: number
  ) => {
    if (isProcessing || !mounted.current) return;
    setIsProcessing(true);

    try {
      if (!user.address) {
        setIsProcessing(false);
        setPendingAction(null);
        return;
      }

      if (action === "withdrawRequest") {
        const result = await withdrawRequest(toBigInt(repairRequest.id), true);
        if (!mounted.current) {
          setIsProcessing(false);
          setPendingAction(null);
          return;
        }

        await result.match(
          async () => {
            if (!mounted.current) return;
            setPendingAction({ 
              type: 'withdraw',
              transactionId: Date.now().toString(),
              description: 'Withdrawing request...'
            });
          },
          (error: ContractError) => {
            if (!mounted.current) return;
            if (error.message.toLowerCase().includes('user rejected') || 
                error.message.toLowerCase().includes('user denied')) {
              addToast("Transaction was rejected", "error", "Transaction Failed");
              setIsRejected(true);
              return;
            }
            throw error;
          }
        );
      } else if (action === "updateWorkDetails" && workDetailsHash) {
        const result = await updateWorkDetails(toBigInt(repairRequest.id), workDetailsHash, true);
        if (!mounted.current) {
          setIsProcessing(false);
          setPendingAction(null);
          return;
        }

        await result.match(
          async () => {
            if (!mounted.current) return;
            setPendingAction({ 
              type: 'workDetails', 
              expectedValue: workDetailsHash,
              transactionId: Date.now().toString(),
              description: 'Updating work details...'
            });
          },
          (error: ContractError) => {
            if (!mounted.current) return;
            if (error.message.toLowerCase().includes('user rejected') || 
                error.message.toLowerCase().includes('user denied')) {
              addToast("Transaction was rejected", "error", "Transaction Failed");
              setIsRejected(true);
              return;
            }
            throw error;
          }
        );
      } else if (action === "updateStatus" && statusValue !== undefined) {
        const result = await updateStatus(toBigInt(repairRequest.id), statusValue, true);
        if (!mounted.current) {
          setIsProcessing(false);
          setPendingAction(null);
          return;
        }

        await result.match(
          async () => {
            if (!mounted.current) return;
            setPendingAction({ 
              type: 'status', 
              expectedValue: statusValue,
              transactionId: Date.now().toString(),
              description: 'Updating status...'
            });
          },
          (error: ContractError) => {
            if (!mounted.current) return;
            if (error.message.toLowerCase().includes('user rejected') || 
                error.message.toLowerCase().includes('user denied')) {
              addToast("Transaction was rejected", "error", "Transaction Failed");
              setIsRejected(true);
              return;
            }
            throw error;
          }
        );
      } else if (action === "approveWork") {
        const isAccepted = formData.get("isAccepted") === "true";
        const result = await approveWork(toBigInt(repairRequest.id), isAccepted, true);
        if (!mounted.current) {
          setIsProcessing(false);
          setPendingAction(null);
          return;
        }

        await result.match(
          async () => {
            if (!mounted.current) return;
            setPendingAction({ 
              type: 'status', 
              expectedValue: isAccepted ? RepairRequestStatusType.ACCEPTED : RepairRequestStatusType.REFUSED,
              transactionId: Date.now().toString(),
              description: isAccepted ? 'Approving work...' : 'Refusing work...'
            });
          },
          (error: ContractError) => {
            if (!mounted.current) return;
            if (error.message.toLowerCase().includes('user rejected') || 
                error.message.toLowerCase().includes('user denied')) {
              addToast("Transaction was rejected", "error", "Transaction Failed");
              setIsRejected(true);
              return;
            }
            throw error;
          }
        );
      }
    } catch (error: any) {
      if (!mounted.current) return;
      addToast(error.message || "Failed to complete the transaction", "error", "Transaction Failed");
      setIsRejected(true);
    }
  }, [addToast, withdrawRequest, updateWorkDetails, updateStatus, approveWork, isProcessing, repairRequest.id, user.address]);

// Handle navigation form data
useEffect(() => {
  if (navigation.formData) {
    formDataRef.current = navigation.formData;
  }
}, [navigation.formData]);

// Handle withdraw success navigation
useEffect(() => {
  if (withdrawSuccess) {
    navigate("/dashboard/repair-requests", { replace: true });
  }
}, [withdrawSuccess, navigate]);

// Handle action data and blockchain transactions
useEffect(() => {
  if (!actionData?.success || !mounted.current || isProcessing || !formDataRef.current) return;

  const action = formDataRef.current.get("_action");
  if (!action) return;

  // Generate a unique transaction ID
  const transactionId = `${action}-${Date.now()}`;

  // Only process if we haven't seen this transaction before
  if (lastProcessedActionRef.current !== transactionId) {
    lastProcessedActionRef.current = transactionId;
    handleBlockchainTransaction(
      action.toString(),
      formDataRef.current,
      actionData.workDetailsHash,
      actionData.status
    );
  }
}, [actionData?.success]);

return (
  <div className="p-6 space-y-6">
    <div className="flex justify-between items-center">
      <PageHeader
        title="Repair Request Details"
        subtitle="View and manage repair request information"
        backTo="/dashboard/repair-requests"
      />
    </div>

    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        {showLandlordView ? (
          <LandlordView
            repairRequest={repairRequest}
            blockchainRequest={blockchainRequest}
            availableStatusUpdates={availableStatusUpdates}
            isPending={isPending || isProcessing || !!pendingAction}
            pendingAction={pendingAction}
            addToast={addToast}
          />
        ) : (
          <TenantView
            repairRequest={repairRequest}
            blockchainRequest={blockchainRequest}
            isPending={isPending || isProcessing || !!pendingAction}
            pendingAction={pendingAction}
            availableStatusUpdates={availableStatusUpdates}
            isTenant={isTenant}
          />
        )}

        <RepairRequestBlockchain
          isLoading={false}
          isError={false}
          blockchainRequest={{
            descriptionHash: blockchainRequest.descriptionHash,
            workDetailsHash: blockchainRequest.workDetailsHash,
            initiator: blockchainRequest.initiator,
            createdAt: toBigInt(blockchainRequest.createdAt),
            updatedAt: toBigInt(blockchainRequest.updatedAt),
          }}
          events={events}
        />
      </div>

      <RepairRequestDetails
        property={repairRequest.property}
        initiator={repairRequest.initiator}
        createdAt={repairRequest.createdAt}
        updatedAt={repairRequest.updatedAt}
      />
    </div>

    <ToastManager toasts={toasts} removeToast={removeToast} />
  </div>
);
}


