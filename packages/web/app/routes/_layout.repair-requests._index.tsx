import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useAccount } from "wagmi";
import { db } from "~/utils/db.server";

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
  userRole?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const userAddress = url.searchParams.get("address")?.toLowerCase();

  if (!userAddress) {
    return json<LoaderData>({ repairRequests: [] });
  }

  // Get user's role
  const user = await db.user.findUnique({
    where: { address: userAddress },
    select: { role: true },
  });

  if (!user) {
    return json<LoaderData>({ repairRequests: [] });
  }

  // Get repair requests based on user's role
  const repairRequests = await db.repairRequest.findMany({
    where: user.role === 'TENANT' 
      ? { initiator: { address: userAddress } }
      : user.role === 'LANDLORD'
      ? { 
          property: {
            landlordId: userAddress,
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
    userRole: user.role,
  });
}

export default function RepairRequests() {
  const { address } = useAccount();
  const { repairRequests, userRole } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Repair Requests</h1>
        {address && (userRole === 'TENANT' || userRole === 'LANDLORD') && (
          <Link
            to="create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Request
          </Link>
        )}
      </div>

      {!address ? (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          Please connect your wallet to view repair requests.
        </div>
      ) : !userRole ? (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          Please register first to create or view repair requests.
        </div>
      ) : repairRequests.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No repair requests</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new repair request.
          </p>
          <div className="mt-6">
            <Link
              to="create"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Request
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {repairRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white shadow rounded-lg p-6 border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">{request.property.address}</h3>
                  <p className="text-sm text-gray-500">
                    Submitted by {request.initiator.name}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-sm ${
                  request.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                  request.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" :
                  request.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {request.status}
                </span>
              </div>
              <p className="mt-2">{request.description}</p>
              <div className="mt-4 flex justify-between items-center">
                <span className={`text-sm ${
                  request.urgency === "HIGH" ? "text-red-600" :
                  request.urgency === "MEDIUM" ? "text-yellow-600" :
                  "text-green-600"
                }`}>
                  {request.urgency} Priority
                </span>
                <Link
                  to={request.id}
                  className="text-sm text-indigo-600 hover:text-indigo-900"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
