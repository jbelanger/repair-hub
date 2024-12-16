import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getUserFromSession, requireUser } from "~/utils/session.server";
import { Building2, ClipboardList, Settings, Wrench } from "lucide-react";
import { db } from "~/utils/db.server";

type LoaderData = {
  user: NonNullable<Awaited<ReturnType<typeof getUserFromSession>>>;
  stats: {
    propertyCount: number;
    repairRequestCount: number;
    pendingRequestCount: number;
  };
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  const stats = await db.$transaction(async (tx) => {
    const propertyCount = await tx.property.count({
      where: { landlordId: user.id },
    });
    
    const [repairRequestCount, pendingRequestCount] = await Promise.all([
      tx.repairRequest.count({
        where: {
          OR: [
            { property: { landlordId: user.id } },
            { lease: { tenantId: user.id } },
          ],
        },
      }),
      tx.repairRequest.count({
        where: {
          OR: [
            { property: { landlordId: user.id } },
            { lease: { tenantId: user.id } },
          ],
          status: "PENDING",
        },
      }),
    ]);

    return {
      propertyCount,
      repairRequestCount,
      pendingRequestCount,
    };
  });

  return json<LoaderData>({ user, stats });
}

export default function Dashboard() {
  const { user, stats } = useLoaderData<typeof loader>();
  const isLandlord = user.role === "LANDLORD";

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Welcome Section */}
      <div className="mb-12">
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user.name?.split(' ')[0] || user.address.slice(0, 6)}...
        </h1>
        <p className="text-white/70 mt-1">
          Manage your properties and maintenance tasks
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        {/* Properties Card */}
        <div className="rounded-xl bg-[#14141F] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-white/70">Properties</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.propertyCount}</p>
              </div>
            </div>
            <Link 
              to="/dashboard/properties"
              className="text-purple-300/70 hover:text-purple-300 text-sm"
            >
              View All Properties
            </Link>
          </div>
        </div>

        {/* Total Requests Card */}
        <div className="rounded-xl bg-[#14141F] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <ClipboardList className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-white/70">Total Requests</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.repairRequestCount}</p>
              </div>
            </div>
            <Link 
              to="/dashboard/repair-requests"
              className="text-purple-300/70 hover:text-purple-300 text-sm"
            >
              View All Requests
            </Link>
          </div>
        </div>

        {/* Pending Requests Card */}
        <div className="rounded-xl bg-[#14141F] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Wrench className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-white/70">Pending Requests</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.pendingRequestCount}</p>
              </div>
            </div>
            <Link 
              to="/dashboard/repair-requests?status=pending"
              className="text-purple-300/70 hover:text-purple-300 text-sm"
            >
              View Pending
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {isLandlord ? (
              <>
                <Link
                  to="/dashboard/properties/create"
                  className="flex items-center gap-3 text-purple-300 hover:text-purple-200 bg-[#14141F] rounded-lg p-4 transition-colors"
                >
                  <Building2 className="h-5 w-5" />
                  Add New Property
                </Link>
                <Link
                  to="/dashboard/repair-requests"
                  className="flex items-center gap-3 text-purple-300 hover:text-purple-200 bg-[#14141F] rounded-lg p-4 transition-colors"
                >
                  <ClipboardList className="h-5 w-5" />
                  View Repair Requests
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard/repair-requests/create"
                  className="flex items-center gap-3 text-purple-300 hover:text-purple-200 bg-[#14141F] rounded-lg p-4 transition-colors"
                >
                  <Wrench className="h-5 w-5" />
                  Submit New Request
                </Link>
                <Link
                  to="/dashboard/repair-requests"
                  className="flex items-center gap-3 text-purple-300 hover:text-purple-200 bg-[#14141F] rounded-lg p-4 transition-colors"
                >
                  <ClipboardList className="h-5 w-5" />
                  View My Requests
                </Link>
              </>
            )}
            <Link
              to="/dashboard/profile"
              className="flex items-center gap-3 text-purple-300 hover:text-purple-200 bg-[#14141F] rounded-lg p-4 transition-colors"
            >
              <Settings className="h-5 w-5" />
              Profile Settings
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          <div className="bg-[#14141F] rounded-lg p-6">
            <p className="text-purple-300/70 text-center">
              Activity feed coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
