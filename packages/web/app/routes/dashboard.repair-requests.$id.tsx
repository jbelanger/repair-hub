import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { useRepairRequest, useRepairRequestRead } from "~/utils/blockchain/hooks/useRepairRequest";
import { RepairRequestStatusType } from "~/utils/blockchain/config";
import { PageHeader } from "~/components/ui/PageHeader";
import { useToast, ToastManager } from "~/components/ui/Toast";
import { requireUser } from "~/utils/session.server";
import { type Address, type HexString } from "~/utils/blockchain/types";
import { hashToHexSync } from "~/utils/blockchain/hash.server";
import { 
  statusMap, 
  validateStatusTransition, 
  getAvailableStatusUpdates, 
  getValidTransitions,
  validateWithdrawRequest,
  validateApproveWork
} from "~/utils/repair-request";
import { RepairRequestBlockchain } from "~/components/repair-request/RepairRequestBlockchain";
import { RepairRequestDetails } from "~/components/repair-request/RepairRequestDetails";
import { LandlordView } from "~/components/repair-request/LandlordView";
import { TenantView } from "~/components/repair-request/TenantView";
import { useRepairRequestEvents } from "~/hooks/useRepairRequestEvents";
import type { LoaderData, BlockchainRepairRequest } from "~/types/repair-request";
import { useState, useEffect, useCallback } from "react";
import { Form } from "@remix-run/react";
import { Button } from "~/components/ui/Button";

const statusLabels = {
  [RepairRequestStatusType.PENDING]: "Pending",
  [RepairRequestStatusType.IN_PROGRESS]: "In Progress",
  [RepairRequestStatusType.COMPLETED]: "Completed",
  [RepairRequestStatusType.ACCEPTED]: "Accepted",
  [RepairRequestStatusType.REFUSED]: "Refused",
  [RepairRequestStatusType.REJECTED]: "Rejected",
  [RepairRequestStatusType.CANCELLED]: "Cancelled",
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
      throw new Response("Only the landlord can update work details", { status: 403 });
    }

    const workDetails = formData.get("workDetails") as string;
    if (!workDetails) {
      return json({ error: "Work details are required" }, { status: 400 });
    }

    const workDetailsHash = hashToHexSync(workDetails);

    // Note: Database update will happen after blockchain confirmation in the frontend
    return json({ 
      success: true,
      workDetailsHash,
    });
  }

  if (action === "updateStatus") {
    if (!isLandlord) {
      throw new Response("Only the landlord can update the status", { status: 403 });
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

    // Validate status transition according to contract rules
    const validationError = validateStatusTransition(repairRequest.status, dbStatus);
    if (validationError) {
      return json({ error: validationError }, { status: 400 });
    }

    // Note: Database update will happen after blockchain confirmation in the frontend
    return json({ 
      success: true,
      status: numericStatus // Pass the numeric status back to the client
    });
  }

  if (action === "withdrawRequest") {
    if (!isTenant) {
      throw new Response("Only the tenant can withdraw the request", { status: 403 });
    }

    if (repairRequest.status !== "PENDING") {
      return json({ error: "Can only withdraw pending requests" }, { status: 400 });
    }

    // Note: Database update will happen after blockchain confirmation in the frontend
    return json({ success: true });
  }

  if (action === "approveWork") {
    if (!isTenant) {
      throw new Response("Only the tenant can approve/refuse work", { status: 403 });
    }

    if (repairRequest.status !== "COMPLETED") {
      return json({ error: "Can only approve/refuse completed work" }, { status: 400 });
    }

    const isAccepted = formData.get("isAccepted") === "true";

    // Note: Database update will happen after blockchain confirmation in the frontend
    return json({ success: true });
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function RepairRequestPage() {
  const { repairRequest, user, availableStatusUpdates } = useLoaderData<typeof loader>();
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
  const isSubmitting = navigation.state === "submitting";
  const showLandlordView = user.role === 'LANDLORD';

  // Get blockchain data and events
  const { repairRequest: blockchainRequest, isLoading, isError } = useRepairRequestRead(BigInt(repairRequest.id));
  const { events } = useRepairRequestEvents(repairRequest.id);

  // Transform blockchain request to match component interface
  const transformedBlockchainRequest: BlockchainRepairRequest | null = blockchainRequest ? {
    descriptionHash: blockchainRequest.descriptionHash,
    workDetailsHash: blockchainRequest.workDetailsHash,
    initiator: blockchainRequest.initiator,
    createdAt: blockchainRequest.createdAt,
    updatedAt: blockchainRequest.updatedAt,
  } : null;

  // Filter available status updates based on blockchain state, but preserve CANCELLED status for tenants
  const filteredStatusUpdates = blockchainRequest 
    ? availableStatusUpdates.filter(status => {
        // Don't filter out CANCELLED status for tenants with pending requests
        if (status === RepairRequestStatusType.CANCELLED && 
            !showLandlordView && 
            blockchainRequest.status === RepairRequestStatusType.PENDING) {
          return true;
        }
        // Filter other statuses based on valid transitions
        const validTransitions = getValidTransitions(blockchainRequest.status);
        return validTransitions.includes(status);
      })
    : availableStatusUpdates;

  const handleBlockchainTransaction = useCallback(async (
    action: string,
    formData: FormData,
    workDetailsHash?: HexString,
    statusValue?: number
  ) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      addToast(
        "Please confirm the transaction in your wallet",
        "info",
        "Waiting for Confirmation"
      );

      const updateDatabase = async (endpoint: string, data: any) => {
        try {
          const response = await fetch(`/api/repair-requests/${repairRequest.id}/${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to update database: ${response.statusText}`);
          }
          
          return response.json();
        } catch (error) {
          console.error('Database update error:', error);
          throw error;
        }
      };

      if (action === "updateWorkDetails" && workDetailsHash) {
        await updateWorkDetails(BigInt(repairRequest.id), workDetailsHash);
        const result = await updateDatabase('work-details', { 
          workDetails: formData.get("workDetails") 
        });
        if (result.error) {
          throw new Error(result.error);
        }
        addToast(
          "Work details have been successfully updated",
          "success",
          "Update Successful"
        );
      }
      else if (action === "updateStatus" && typeof statusValue === 'number') {
        // Validate status value
        if (!(statusValue in RepairRequestStatusType)) {
          throw new Error('Invalid status value');
        }

        // Verify the status transition is valid based on blockchain state
        if (blockchainRequest) {
          const validTransitions = getValidTransitions(blockchainRequest.status);
          if (!validTransitions.includes(statusValue as RepairRequestStatusType)) {
            throw new Error(`Invalid status transition from ${RepairRequestStatusType[blockchainRequest.status]} to ${RepairRequestStatusType[statusValue]}`);
          }
        }

        try {
          await updateStatus(BigInt(repairRequest.id), statusValue as RepairRequestStatusType);
          const dbStatus = statusMap[statusValue as RepairRequestStatusType];
          if (!dbStatus) {
            throw new Error('Invalid status mapping');
          }
          const result = await updateDatabase('status', { status: dbStatus });
          if (result.error) {
            throw new Error(result.error);
          }
          addToast(
            `Status has been successfully updated to ${statusLabels[statusValue as RepairRequestStatusType]}`,
            "success",
            "Update Successful"
          );
        } catch (error: any) {
          // Log the error details
          console.error('Status update error:', {
            error,
            message: error.message,
            cause: error.cause,
            stack: error.stack
          });

          // Re-throw the error to be handled by the outer catch block
          throw error;
        }
      }
      else if (action === "withdrawRequest") {
        // Validate withdraw request conditions
        const validationError = validateWithdrawRequest(repairRequest.status);
        if (validationError) {
          throw new Error(validationError);
        }

        // Also check blockchain state
        if (blockchainRequest) {
          const blockchainValidationError = validateWithdrawRequest(statusMap[blockchainRequest.status]);
          if (blockchainValidationError) {
            throw new Error(blockchainValidationError);
          }
        }

        await withdrawRequest(BigInt(repairRequest.id));
        const result = await updateDatabase('withdraw', {});
        if (result.error) {
          throw new Error(result.error);
        }
        addToast(
          "Request has been successfully withdrawn",
          "success",
          "Withdrawal Successful"
        );
      }
      else if (action === "approveWork") {
        // Validate approve work conditions
        const validationError = validateApproveWork(repairRequest.status);
        if (validationError) {
          throw new Error(validationError);
        }

        // Also check blockchain state
        if (blockchainRequest) {
          const blockchainValidationError = validateApproveWork(statusMap[blockchainRequest.status]);
          if (blockchainValidationError) {
            throw new Error(blockchainValidationError);
          }
        }

        const isAccepted = formData.get("isAccepted") === "true";
        await approveWork(BigInt(repairRequest.id), isAccepted);
        const result = await updateDatabase('approve', { isAccepted });
        if (result.error) {
          throw new Error(result.error);
        }
        addToast(
          `Work has been successfully ${isAccepted ? 'approved' : 'refused'}`,
          "success",
          isAccepted ? "Approval Successful" : "Work Refused"
        );
      }
    } catch (error: any) {
      console.error('Transaction error:', {
        error,
        message: error.message,
        cause: error.cause,
        stack: error.stack
      });
      
      // Display a user-friendly error message
      addToast(
        error.message || "Failed to complete the transaction",
        "error",
        "Transaction Failed"
      );
    } finally {
      setIsProcessing(false);
    }
  }, [addToast, approveWork, isProcessing, repairRequest.id, updateStatus, updateWorkDetails, withdrawRequest, blockchainRequest, repairRequest.status]);

  // Handle form submissions
  useEffect(() => {
    if (!isSubmitting && actionData?.success && !isProcessing && navigation.formData) {
      const action = navigation.formData.get("_action");
      if (!action) return;

      handleBlockchainTransaction(
        action.toString(),
        navigation.formData,
        actionData.workDetailsHash,
        actionData.status
      );
    } else if (actionData?.error) {
      addToast(actionData.error, "error", "Update Failed");
    }
  }, [actionData, isSubmitting, isProcessing, handleBlockchainTransaction, addToast, navigation.formData]);

  // Status action buttons
  const statusButtons = filteredStatusUpdates.map((status: RepairRequestStatusType) => (
    <Form key={status} method="post" className="inline-block">
      <input type="hidden" name="_action" value="updateStatus" />
      <input type="hidden" name="status" value={status} />
      <Button
        type="submit"
        variant={getStatusButtonVariant(status)}
        disabled={isPending || isSubmitting || isProcessing || isLoading}
      >
        {getStatusActionLabel(status)}
      </Button>
    </Form>
  ));

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Repair Request Details"
        subtitle="View and manage repair request information"
        backTo="/dashboard/repair-requests"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {showLandlordView ? (
            <LandlordView
              repairRequest={repairRequest}
              availableStatusUpdates={filteredStatusUpdates}
              isPending={isPending || isProcessing}
              addToast={addToast}
            >
              {statusButtons}
            </LandlordView>
          ) : (
            <TenantView
              repairRequest={repairRequest}
              availableStatusUpdates={filteredStatusUpdates}
              isPending={isPending || isProcessing}
            />
          )}

          <RepairRequestBlockchain
            isLoading={isLoading}
            isError={isError}
            blockchainRequest={transformedBlockchainRequest}
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

function getStatusButtonVariant(status: RepairRequestStatusType): "primary" | "danger" | "secondary" {
  switch (status) {
    case RepairRequestStatusType.IN_PROGRESS:
      return "primary";
    case RepairRequestStatusType.COMPLETED:
      return "primary";
    case RepairRequestStatusType.REJECTED:
      return "danger";
    default:
      return "secondary";
  }
}

function getStatusActionLabel(status: RepairRequestStatusType): string {
  switch (status) {
    case RepairRequestStatusType.IN_PROGRESS:
      return "Start Work";
    case RepairRequestStatusType.COMPLETED:
      return "Mark as Completed";
    case RepairRequestStatusType.REJECTED:
      return "Reject Request";
    default:
      return `Mark as ${statusLabels[status]}`;
  }
}
