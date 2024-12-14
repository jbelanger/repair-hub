import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useAccount } from "wagmi";
import { db } from "~/utils/db.server";
import { useRepairRequest } from "~/utils/blockchain/hooks/useRepairRequest";
import { RepairRequestStatusType } from "~/utils/blockchain/config";

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

  // Get user's role if address is provided
  let userRole;
  let canUpdateStatus = false;
  
  if (userAddress) {
    const user = await db.user.findUnique({
      where: { address: userAddress },
      select: { role: true },
    });
    userRole = user?.role;

    // Determine if user can update status
    canUpdateStatus = 
      userAddress === repairRequest.property.landlord.address.toLowerCase() || // Landlord
      userAddress === repairRequest.initiator.address.toLowerCase(); // Initiator
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
  const { address } = useAccount();
  const { repairRequest, canUpdateStatus } = useLoaderData<typeof loader>();
  const { updateStatus, isPending } = useRepairRequest();

  const handleStatusUpdate = async (newStatus: RepairRequestStatusType) => {
    try {
      await updateStatus(BigInt(repairRequest.id), newStatus);
      // Refresh the page to show updated status
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold">Repair Request Details</h1>
        </div>

        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Property Information</h2>
              <p className="text-gray-600">Address: {repairRequest.property.address}</p>
              <p className="text-gray-600">
                Landlord: {repairRequest.property.landlord.name}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Request Information</h2>
              <p className="text-gray-600">
                Submitted by: {repairRequest.initiator.name}
              </p>
              <p className="text-gray-600">
                Created: {new Date(repairRequest.createdAt).toLocaleDateString()}
              </p>
              <p className="text-gray-600">
                Last Updated: {new Date(repairRequest.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Description</h2>
            <p className="text-gray-600">{repairRequest.description}</p>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Status</h2>
                <span className={`inline-block px-2 py-1 rounded text-sm mt-2 ${
                  repairRequest.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                  repairRequest.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" :
                  repairRequest.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {repairRequest.status}
                </span>
              </div>

              {address && canUpdateStatus && (
                <div className="flex items-center gap-2">
                  <select
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    onChange={(e) => handleStatusUpdate(Number(e.target.value))}
                    disabled={isPending}
                  >
                    <option value="">Update Status</option>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Priority</h2>
            <span className={`inline-block px-2 py-1 rounded text-sm ${
              repairRequest.urgency === "HIGH" ? "bg-red-100 text-red-800" :
              repairRequest.urgency === "MEDIUM" ? "bg-yellow-100 text-yellow-800" :
              "bg-green-100 text-green-800"
            }`}>
              {repairRequest.urgency} Priority
            </span>
          </div>

          {repairRequest.attachments && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-4">Attachments</h2>
              <p className="text-gray-600">{repairRequest.attachments}</p>
            </div>
          )}

          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Blockchain Information</h2>
            <p className="text-gray-600 break-all">
              Transaction Hash: {repairRequest.hash}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
