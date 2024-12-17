import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation, useNavigate } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { useRepairRequest } from "~/utils/blockchain/hooks/useRepairRequest";
import { RepairRequestContractABI } from "~/utils/blockchain/abis/RepairRequestContract";
import { RepairRequestStatusType } from "~/utils/blockchain/config";
import { PageHeader } from "~/components/ui/PageHeader";
import { useToast, ToastManager } from "~/components/ui/Toast";
import { requireUser } from "~/utils/session.server";
import { type Address, type HexString } from "~/utils/blockchain/types";
import { hashToHexSync } from "~/utils/blockchain/hash.server";
import { BlockchainEvent, statusMap, validateStatusTransition, validateWithdrawRequest } from "~/utils/repair-request";
import { RepairRequestBlockchain } from "~/components/repair-request/RepairRequestBlockchain";
import { RepairRequestDetails } from "~/components/repair-request/RepairRequestDetails";
import { LandlordView } from "~/components/repair-request/LandlordView";
import { TenantView } from "~/components/repair-request/TenantView";
import { Switch } from "~/components/ui/Switch";
import type { LoaderData, BlockchainRepairRequest } from "~/types/repair-request";
import type { ContractError, ContractRepairRequest } from "~/utils/blockchain/types/repair-request";
import { useState, useEffect, useCallback, useRef } from "react";
import { Form } from "@remix-run/react";
import { ResultAsync } from "neverthrow";
import { usePublicClient } from 'wagmi'
import { readRepairRequest } from '~/utils/blockchain/utils/contract-read'
import { decodeEventLog } from 'viem'
import { CONTRACT_ADDRESSES } from "~/utils/blockchain/config";

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

  const isLandlord = user.address.toLowerCase() === repairRequest.property.landlord.address.toLowerCase();
  const isTenant = user.address.toLowerCase() === repairRequest.initiator.address.toLowerCase();

  if (!isLandlord && !isTenant) {
    throw redirect("/dashboard/repair-requests");
  }

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
    isLandlord,
    isTenant
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  try {
    const user = await requireUser(request);
    const { id } = params;

    if (!id) {
      return json({ error: "Repair request ID is required" }, { status: 400 });
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

      const dbStatus = statusMap[numericStatus as RepairRequestStatusType];
      if (!dbStatus) {
        return json({ error: "Invalid status mapping" }, { status: 400 });
      }

      const validationError = validateStatusTransition(repairRequest.status, dbStatus);
      if (validationError) {
        return json({ error: validationError }, { status: 400 });
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

      if (repairRequest.status !== "PENDING") {
        return json({ error: "Can only withdraw pending requests" }, { status: 400 });
      }

      return json({ success: true });
    }

    if (action === "approveWork") {
      if (!isTenant) {
        return json({ error: "Only the tenant who created the request can approve/refuse work" }, { status: 403 });
      }

      if (repairRequest.status !== "COMPLETED") {
        return json({ error: "Can only approve/refuse completed work" }, { status: 400 });
      }

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
  const { repairRequest, user, isLandlord, isTenant } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
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
  } | null>(null);
  const [blockchainState, setBlockchainState] = useState({
    request: null as ContractRepairRequest | null,
    isLoading: false,
    isError: false
  });
  const mounted = useRef(true);
  const formDataRef = useRef<FormData | null>(null);
  const publicClient = usePublicClient();

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
            
            if (args.id.toString() === repairRequest.id) {
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
                    break;
                  case RepairRequestStatusType.REFUSED:
                    addToast("Work has been refused", "success", "Update Successful");
                    setPendingAction(null);
                    break;
                  case RepairRequestStatusType.REJECTED:
                    addToast("Request has been rejected", "success", "Update Successful");
                    setPendingAction(null);
                    break;
                  case RepairRequestStatusType.IN_PROGRESS:
                    addToast("Work has started", "success", "Update Successful");
                    setPendingAction(null);
                    break;
                  case RepairRequestStatusType.COMPLETED:
                    addToast("Work has been completed", "success", "Update Successful");
                    setPendingAction(null);
                    break;
                  default:
                    addToast("Status has been updated", "success", "Update Successful");
                    setPendingAction(null);
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
                  args.newHash === pendingAction.expectedValue) {
                if (mounted.current) {
                  addToast("Work details have been updated", "success", "Update Successful");
                  setPendingAction(null);
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
  }, [publicClient, isProcessing, pendingAction, repairRequest.id]);

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
        return;
      }

      if (action === "withdrawRequest") {
        const validationError = validateWithdrawRequest(repairRequest.status);
        if (validationError) {
          throw new Error(validationError);
        }

        const result = await withdrawRequest(BigInt(repairRequest.id));
        if (!mounted.current) {
          setIsProcessing(false);
          return;
        }

        await result.match(
          async () => {
            if (!mounted.current) return;
            setPendingAction({ type: 'withdraw' });
          },
          (error: ContractError) => {
            if (!mounted.current) return;
            throw new Error(error.message);
          }
        );
      } else if (action === "updateWorkDetails" && workDetailsHash) {
        const result = await updateWorkDetails(BigInt(repairRequest.id), workDetailsHash);
        if (!mounted.current) {
          setIsProcessing(false);
          return;
        }

        await result.match(
          async () => {
            if (!mounted.current) return;
            setPendingAction({ type: 'workDetails', expectedValue: workDetailsHash });
          },
          (error: ContractError) => {
            if (!mounted.current) return;
            throw new Error(error.message);
          }
        );
      } else if (action === "updateStatus" && statusValue !== undefined) {
        const result = await updateStatus(BigInt(repairRequest.id), statusValue);
        if (!mounted.current) {
          setIsProcessing(false);
          return;
        }

        await result.match(
          async () => {
            if (!mounted.current) return;
            setPendingAction({ type: 'status', expectedValue: statusValue });
          },
          (error: ContractError) => {
            if (!mounted.current) return;
            throw new Error(error.message);
          }
        );
      } else if (action === "approveWork") {
        const isAccepted = formData.get("isAccepted") === "true";
        const result = await approveWork(BigInt(repairRequest.id), isAccepted);
        if (!mounted.current) {
          setIsProcessing(false);
          return;
        }

        await result.match(
          async () => {
            if (!mounted.current) return;
            setPendingAction({ 
              type: 'status', 
              expectedValue: isAccepted ? RepairRequestStatusType.ACCEPTED : RepairRequestStatusType.REFUSED 
            });
          },
          (error: ContractError) => {
            if (!mounted.current) return;
            throw new Error(error.message);
          }
        );
      }
    } catch (error: any) {
      if (!mounted.current) return;
      addToast(error.message || "Failed to complete the transaction", "error", "Transaction Failed");
      setPendingAction(null);
    } finally {
      if (mounted.current) {
        setIsProcessing(false);
      }
    }
  }, [addToast, withdrawRequest, updateWorkDetails, updateStatus, approveWork, isProcessing, repairRequest.id, user.address]);

  useEffect(() => {
    mounted.current = true;

    async function fetchData() {
      if (!publicClient || !mounted.current) return;
      setBlockchainState(prev => ({ ...prev, isLoading: true }));

      const result = await readRepairRequest(publicClient, BigInt(repairRequest.id));
      
      if (!mounted.current) return;

      result.match(
        (data) => {
          setBlockchainState(prev => ({
            ...prev,
            request: data,
            isError: false,
            isLoading: false
          }));
        },
        () => {
          setBlockchainState(prev => ({
            ...prev,
            isError: true,
            isLoading: false
          }));
        }
      );
    }

    fetchData();

    return () => {
      mounted.current = false;
      setIsProcessing(false);
      setWithdrawSuccess(false);
      setPendingAction(null);
    };
  }, [publicClient, repairRequest.id]);

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
    if (!actionData || !mounted.current) return;

    if (actionData.error) {
      addToast(actionData.error, "error", "Action Failed");
      return;
    }

    if (actionData.success && !isProcessing && formDataRef.current) {
      const action = formDataRef.current.get("_action");
      if (!action) return;

      handleBlockchainTransaction(
        action.toString(),
        formDataRef.current,
        actionData.workDetailsHash,
        actionData.status
      );
    }
  }, [actionData, isProcessing, handleBlockchainTransaction, addToast]);

  const transformedBlockchainRequest: BlockchainRepairRequest | null = blockchainState.request ? {
    descriptionHash: blockchainState.request.descriptionHash,
    workDetailsHash: blockchainState.request.workDetailsHash,
    initiator: blockchainState.request.initiator,
    createdAt: blockchainState.request.createdAt,
    updatedAt: blockchainState.request.updatedAt,
  } : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Repair Request Details"
          subtitle="View and manage repair request information"
          backTo="/dashboard/repair-requests"
        />
        {isLandlord && isTenant && (
          <Switch
            checked={showLandlordView}
            onChange={setShowLandlordView}
            leftLabel="Tenant View"
            rightLabel="Landlord View"
            className="ml-4"
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {showLandlordView ? (
            <LandlordView
              repairRequest={repairRequest}
              isPending={isPending || isProcessing}
              addToast={addToast}
            />
          ) : (
            <TenantView
              repairRequest={repairRequest}
              isPending={isPending || isProcessing}
              isTenant={isTenant}
            />
          )}

          <RepairRequestBlockchain
            isLoading={blockchainState.isLoading}
            isError={blockchainState.isError}
            blockchainRequest={transformedBlockchainRequest}
            events={[]}
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
