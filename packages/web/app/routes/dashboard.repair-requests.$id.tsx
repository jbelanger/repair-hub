import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { useRepairRequest, useRepairRequestRead } from "~/utils/blockchain/hooks/useRepairRequest";
import { RepairRequestStatusType } from "~/utils/blockchain/config";
import { PageHeader } from "~/components/ui/PageHeader";
import { useState } from "react";
import { useToast, ToastManager } from "~/components/ui/Toast";
import { requireUser } from "~/utils/session.server";
import { type Address, hashToHex } from "~/utils/blockchain/types";
import { hashToHexSync } from "~/utils/blockchain/hash.server";
import { statusMap, getAvailableStatusUpdates } from "~/utils/repair-request";
import { RepairRequestBlockchain } from "~/components/repair-request/RepairRequestBlockchain";
import { RepairRequestDetails } from "~/components/repair-request/RepairRequestDetails";
import { LandlordView } from "~/components/repair-request/LandlordView";
import { TenantView } from "~/components/repair-request/TenantView";
import { useRepairRequestEvents } from "~/hooks/useRepairRequestEvents";
import type { LoaderData, BlockchainRepairRequest } from "~/types/repair-request";

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

export default function RepairRequestPage() {
  const { repairRequest, user, availableStatusUpdates } = useLoaderData<typeof loader>();
  const { updateStatus, updateWorkDetails, withdrawRequest, approveWork, isPending } = useRepairRequest();
  const [workDetailsInput, setWorkDetailsInput] = useState(repairRequest.workDetails || "");
  const { toasts, addToast, removeToast } = useToast();
  const isLandlord = user.address.toLowerCase() === repairRequest.property.landlord.address.toLowerCase();
  const isTenant = user.address.toLowerCase() === repairRequest.initiator.address.toLowerCase();

  // Get blockchain data and events
  const { repairRequest: blockchainRequest, isLoading, isError } = useRepairRequestRead(BigInt(repairRequest.id));
  const { events, eventHandlers } = useRepairRequestEvents(repairRequest.id);

  // Transform blockchain request to match component interface
  const transformedBlockchainRequest: BlockchainRepairRequest | null = blockchainRequest ? {
    descriptionHash: blockchainRequest.descriptionHash,
    workDetailsHash: blockchainRequest.workDetailsHash,
    initiator: blockchainRequest.initiator,
    createdAt: blockchainRequest.createdAt,
    updatedAt: blockchainRequest.updatedAt,
  } : null;

  const handleStatusUpdate = async (newStatus: RepairRequestStatusType) => {
    try {
      await updateStatus(BigInt(repairRequest.id), newStatus);
      
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
      
      const workDetailsHash = await hashToHex(workDetails);
      await updateWorkDetails(BigInt(repairRequest.id), workDetailsHash);
      
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
      await withdrawRequest(BigInt(repairRequest.id));
      
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
      await approveWork(BigInt(repairRequest.id), isAccepted);
      
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
          {isLandlord ? (
            <LandlordView
              repairRequest={repairRequest}
              availableStatusUpdates={availableStatusUpdates}
              isPending={isPending}
              workDetails={workDetailsInput}
              onWorkDetailsChange={setWorkDetailsInput}
              onWorkDetailsSubmit={handleWorkDetailsUpdate}
              onStatusUpdate={handleStatusUpdate}
            />
          ) : (
            <TenantView
              repairRequest={repairRequest}
              availableStatusUpdates={availableStatusUpdates}
              isPending={isPending}
              onStatusUpdate={handleStatusUpdate}
              onWithdrawRequest={handleWithdrawRequest}
              onApproveWork={handleApproveWork}
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
