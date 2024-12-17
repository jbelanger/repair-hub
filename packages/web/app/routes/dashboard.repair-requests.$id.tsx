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
import { statusMap, validateStatusTransition, getAvailableStatusUpdates } from "~/utils/repair-request";
import { RepairRequestBlockchain } from "~/components/repair-request/RepairRequestBlockchain";
import { RepairRequestDetails } from "~/components/repair-request/RepairRequestDetails";
import { LandlordView } from "~/components/repair-request/LandlordView";
import { TenantView } from "~/components/repair-request/TenantView";
import { useRepairRequestEvents } from "~/hooks/useRepairRequestEvents";
import type { LoaderData, BlockchainRepairRequest } from "~/types/repair-request";
import { useState, useEffect } from "react";
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
    return json({ success: true });
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
  const actionData = useActionData<{ success?: boolean; error?: string; workDetailsHash?: HexString }>();
  const navigation = useNavigation();
  const { updateStatus, updateWorkDetails, withdrawRequest, approveWork, isPending } = useRepairRequest();
  const { toasts, addToast, removeToast } = useToast();
  const [hasShownToast, setHasShownToast] = useState(false);
  const isSubmitting = navigation.state === "submitting";
  const showLandlordView = user.role === 'LANDLORD';

  // Get blockchain data and events
  const { repairRequest: blockchainRequest, isLoading, isError } = useRepairRequestRead(BigInt(repairRequest.id));
  const { events } = useRepairRequestEvents(repairRequest.id);

  // Reset toast flag when form is submitted
  useEffect(() => {
    if (isSubmitting) {
      setHasShownToast(false);
    }
  }, [isSubmitting]);

  // Show toast when action completes
  useEffect(() => {
    if (!hasShownToast && !isSubmitting && actionData) {
      if (actionData.success) {
        if (actionData.workDetailsHash) {
          // Handle work details update
          updateWorkDetails(BigInt(repairRequest.id), actionData.workDetailsHash)
            .then(async () => {
              // Only update database after blockchain confirmation
              await fetch(`/api/repair-requests/${repairRequest.id}/work-details`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workDetails: navigation.formData?.get("workDetails") }),
              });
              addToast(
                "Work details have been successfully updated",
                "success",
                "Update Successful"
              );
            })
            .catch((error) => {
              console.error('Blockchain update error:', error);
              addToast(
                "Failed to update work details on the blockchain",
                "error",
                "Update Failed"
              );
            });
        } else {
          // Handle other successful actions
          const action = navigation.formData?.get("_action");
          if (action === "updateStatus") {
            const statusStr = navigation.formData?.get("status");
            if (!statusStr) return;
            
            const status = Number(statusStr);
            if (!(status in RepairRequestStatusType)) return;

            updateStatus(BigInt(repairRequest.id), status)
              .then(async () => {
                // Only update database after blockchain confirmation
                const dbStatus = statusMap[status as RepairRequestStatusType];
                if (!dbStatus) return;

                await fetch(`/api/repair-requests/${repairRequest.id}/status`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: dbStatus }),
                });
                addToast(
                  "Status has been successfully updated",
                  "success",
                  "Update Successful"
                );
              })
              .catch((error) => {
                console.error('Blockchain update error:', error);
                const errorMessage = error.message.includes("InvalidStatusTransition") 
                  ? "Invalid status transition"
                  : "Failed to update status on the blockchain";
                addToast(errorMessage, "error", "Update Failed");
              });
          } else if (action === "withdrawRequest") {
            withdrawRequest(BigInt(repairRequest.id))
              .then(async () => {
                // Only update database after blockchain confirmation
                await fetch(`/api/repair-requests/${repairRequest.id}/status`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: "CANCELLED" }),
                });
                addToast(
                  "Request has been successfully withdrawn",
                  "success",
                  "Withdrawal Successful"
                );
              })
              .catch((error) => {
                console.error('Blockchain update error:', error);
                const errorMessage = error.message.includes("RequestIsNotPending")
                  ? "Can only withdraw pending requests"
                  : "Failed to withdraw request on the blockchain";
                addToast(errorMessage, "error", "Update Failed");
              });
          } else if (action === "approveWork") {
            const isAccepted = navigation.formData?.get("isAccepted") === "true";
            approveWork(BigInt(repairRequest.id), isAccepted)
              .then(async () => {
                // Only update database after blockchain confirmation
                await fetch(`/api/repair-requests/${repairRequest.id}/status`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: isAccepted ? "ACCEPTED" : "REFUSED" }),
                });
                addToast(
                  `Work has been successfully ${isAccepted ? 'approved' : 'refused'}`,
                  "success",
                  isAccepted ? "Work Approved" : "Work Refused"
                );
              })
              .catch((error) => {
                console.error('Blockchain update error:', error);
                const errorMessage = error.message.includes("RequestNotCompleted")
                  ? "Can only approve/refuse completed work"
                  : "Failed to update work approval on the blockchain";
                addToast(errorMessage, "error", "Update Failed");
              });
          }
        }
      } else if (actionData.error) {
        addToast(
          actionData.error,
          "error",
          "Update Failed"
        );
      }
      setHasShownToast(true);
    }
  }, [actionData, isSubmitting, hasShownToast, addToast, updateWorkDetails, updateStatus, withdrawRequest, approveWork, repairRequest.id, navigation.formData]);

  // Transform blockchain request to match component interface
  const transformedBlockchainRequest: BlockchainRepairRequest | null = blockchainRequest ? {
    descriptionHash: blockchainRequest.descriptionHash,
    workDetailsHash: blockchainRequest.workDetailsHash,
    initiator: blockchainRequest.initiator,
    createdAt: blockchainRequest.createdAt,
    updatedAt: blockchainRequest.updatedAt,
  } : null;

  // Status action buttons
  const statusButtons = availableStatusUpdates.map((status: RepairRequestStatusType) => (
    <Form key={status} method="post" className="inline-block">
      <input type="hidden" name="_action" value="updateStatus" />
      <input type="hidden" name="status" value={status} />
      <Button
        type="submit"
        variant={getStatusButtonVariant(status)}
        disabled={isPending || isSubmitting}
        size="sm"
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
              availableStatusUpdates={availableStatusUpdates}
              isPending={isPending}
              addToast={addToast}
            >
              {statusButtons}
            </LandlordView>
          ) : (
            <TenantView
              repairRequest={repairRequest}
              availableStatusUpdates={availableStatusUpdates}
              isPending={isPending}
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
