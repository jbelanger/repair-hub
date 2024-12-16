import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Card } from "~/components/ui/Card";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";
import type { PrismaClient, RepairRequest, PropertyTenant, Prisma } from "@prisma/client";

type RepairWithDetails = RepairRequest & {
  property: { address: string };
  initiator: { name: string };
};

type LeaseWithDetails = PropertyTenant & {
  property: { 
    address: string;
    landlord: {
      name: string;
      email: string;
    };
  };
};

type LandlordStats = {
  type: 'landlord';
  propertiesCount: number;
  activeTenantsCount: number;
  activeRepairsCount: number;
  subscription: {
    plan: { name: string };
    status: string;
  } | null;
  recentRepairs: RepairWithDetails[];
  recentInvitations: {
    id: string;
    property: { address: string };
    email: string;
    startDate: Date;
    endDate: Date;
    status: string;
  }[];
  repairsByStatus: {
    status: string;
    _count: number;
  }[];
};

type TenantStats = {
  type: 'tenant';
  activeLeases: LeaseWithDetails[];
  activeRepairsCount: number;
  pendingRepairsCount: number;
  recentRepairs: RepairWithDetails[];
  repairsByStatus: {
    status: string;
    _count: number;
  }[];
};

type LoaderData = {
  stats: LandlordStats | TenantStats;
};

type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  if (user.role === "LANDLORD") {
    // Get landlord stats
    const stats = await db.$transaction(async (tx: TransactionClient) => {
      const propertiesCount = await tx.property.count({
        where: { landlordId: user.id }
      });
      
      const activeTenantsCount = await tx.propertyTenant.count({
        where: { 
          property: { landlordId: user.id },
          status: "ACTIVE" 
        }
      });
      
      const activeRepairsCount = await tx.repairRequest.count({
        where: {
          property: { landlordId: user.id },
          status: {
            in: ["PENDING", "IN_PROGRESS"],
          },
        },
      });
      
      const subscription = await tx.subscription.findFirst({
        where: { userId: user.id },
        include: { plan: true },
      });

      const recentRepairs = await tx.repairRequest.findMany({
        where: {
          property: { landlordId: user.id }
        },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          property: true,
          initiator: true,
        },
      });

      const recentInvitations = await tx.tenantInvitation.findMany({
        where: {
          property: { landlordId: user.id }
        },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          property: true,
        },
      });

      const repairsByStatus = await tx.repairRequest.groupBy({
        where: {
          property: { landlordId: user.id }
        },
        by: ["status"],
        _count: true,
      });

      return {
        type: 'landlord' as const,
        propertiesCount,
        activeTenantsCount,
        activeRepairsCount,
        subscription,
        recentRepairs,
        recentInvitations,
        repairsByStatus,
      };
    });

    return json({ stats });
  } else {
    // Get tenant stats
    const stats = await db.$transaction(async (tx: TransactionClient) => {
      const activeLeases = await tx.propertyTenant.findMany({
        where: {
          tenantId: user.id,
          status: "ACTIVE",
          endDate: {
            gt: new Date(),
          },
        },
        include: {
          property: {
            include: {
              landlord: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      const [activeRepairsCount, pendingRepairsCount] = await Promise.all([
        tx.repairRequest.count({
          where: {
            initiatorId: user.id,
            status: {
              in: ["PENDING", "IN_PROGRESS"],
            },
          },
        }),
        tx.repairRequest.count({
          where: {
            initiatorId: user.id,
            status: "PENDING",
          },
        }),
      ]);

      const recentRepairs = await tx.repairRequest.findMany({
        where: {
          initiatorId: user.id,
        },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          property: true,
        },
      });

      const repairsByStatus = await tx.repairRequest.groupBy({
        where: {
          initiatorId: user.id,
        },
        by: ["status"],
        _count: true,
      });

      return {
        type: 'tenant' as const,
        activeLeases,
        activeRepairsCount,
        pendingRepairsCount,
        recentRepairs,
        repairsByStatus,
      };
    });

    return json({ stats });
  }
}

export default function DashboardIndex() {
  const { stats } = useLoaderData<LoaderData>();

  if (stats.type === 'landlord') {
    return (
      <div className="p-6 space-y-6">
        {/* Landlord Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-400">Properties</h3>
              <p className="text-2xl font-bold">{stats.propertiesCount}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-400">Active Tenants</h3>
              <p className="text-2xl font-bold">{stats.activeTenantsCount}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-400">Active Repairs</h3>
              <p className="text-2xl font-bold">{stats.activeRepairsCount}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-400">Subscription</h3>
              <p className="text-2xl font-bold">{stats.subscription?.plan.name || "FREE"}</p>
              <p className="text-sm text-gray-400">
                {stats.subscription?.status === "ACTIVE" ? "Active" : "Inactive"}
              </p>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Repairs */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Recent Repair Requests</h3>
            <div className="space-y-4">
              {stats.recentRepairs.map((repair) => (
                <div key={repair.id} className="flex justify-between items-start border-b border-white/[0.08] pb-4">
                  <div>
                    <p className="font-medium">{repair.property.address}</p>
                    <p className="text-sm text-gray-400">{repair.description}</p>
                    <p className="text-xs text-gray-500">by {repair.initiator.name}</p>
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      repair.status === "PENDING" ? "bg-yellow-500/20 text-yellow-500" :
                      repair.status === "IN_PROGRESS" ? "bg-blue-500/20 text-blue-500" :
                      repair.status === "COMPLETED" ? "bg-green-500/20 text-green-500" :
                      "bg-gray-500/20 text-gray-500"
                    }`}>
                      {repair.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Invitations */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Recent Invitations</h3>
            <div className="space-y-4">
              {stats.recentInvitations.map((invitation) => (
                <div key={invitation.id} className="flex justify-between items-start border-b border-white/[0.08] pb-4">
                  <div>
                    <p className="font-medium">{invitation.property.address}</p>
                    <p className="text-sm text-gray-400">{invitation.email}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(invitation.startDate).toLocaleDateString()} - {new Date(invitation.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      invitation.status === "PENDING" ? "bg-yellow-500/20 text-yellow-500" :
                      invitation.status === "ACCEPTED" ? "bg-green-500/20 text-green-500" :
                      "bg-red-500/20 text-red-500"
                    }`}>
                      {invitation.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Status Distribution */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Repair Requests by Status</h3>
          <div className="flex items-center gap-4">
            {stats.repairsByStatus.map((status) => (
              <div key={status.status} className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">{status.status}</span>
                  <span className="text-sm font-medium">{status._count}</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.08]">
                  <div
                    className={`h-full rounded-full ${
                      status.status === "PENDING" ? "bg-yellow-500" :
                      status.status === "IN_PROGRESS" ? "bg-blue-500" :
                      status.status === "COMPLETED" ? "bg-green-500" :
                      "bg-gray-500"
                    }`}
                    style={{
                      width: `${(status._count / (stats.activeRepairsCount || 1)) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Tenant Active Properties */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Your Properties</h3>
          <div className="space-y-4">
            {stats.activeLeases.map((lease) => (
              <div key={lease.id} className="flex justify-between items-start border-b border-white/[0.08] pb-4">
                <div>
                  <p className="font-medium">{lease.property.address}</p>
                  <p className="text-sm text-gray-400">Landlord: {lease.property.landlord.name}</p>
                  <p className="text-xs text-gray-500">
                    Lease: {new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    lease.status === "ACTIVE" ? "bg-green-500/20 text-green-500" :
                    "bg-gray-500/20 text-gray-500"
                  }`}>
                    {lease.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Tenant Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400">Active Repairs</h3>
            <p className="text-2xl font-bold">{stats.activeRepairsCount}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400">Pending Repairs</h3>
            <p className="text-2xl font-bold">{stats.pendingRepairsCount}</p>
          </div>
        </Card>
      </div>

      {/* Recent Repairs */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Recent Repair Requests</h3>
        <div className="space-y-4">
          {stats.recentRepairs.map((repair) => (
            <div key={repair.id} className="flex justify-between items-start border-b border-white/[0.08] pb-4">
              <div>
                <p className="font-medium">{repair.property.address}</p>
                <p className="text-sm text-gray-400">{repair.description}</p>
                <p className="text-xs text-gray-500">
                  Created: {new Date(repair.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  repair.status === "PENDING" ? "bg-yellow-500/20 text-yellow-500" :
                  repair.status === "IN_PROGRESS" ? "bg-blue-500/20 text-blue-500" :
                  repair.status === "COMPLETED" ? "bg-green-500/20 text-green-500" :
                  "bg-gray-500/20 text-gray-500"
                }`}>
                  {repair.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Status Distribution */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Your Repairs by Status</h3>
        <div className="flex items-center gap-4">
          {stats.repairsByStatus.map((status) => (
            <div key={status.status} className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">{status.status}</span>
                <span className="text-sm font-medium">{status._count}</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.08]">
                <div
                  className={`h-full rounded-full ${
                    status.status === "PENDING" ? "bg-yellow-500" :
                    status.status === "IN_PROGRESS" ? "bg-blue-500" :
                    status.status === "COMPLETED" ? "bg-green-500" :
                    "bg-gray-500"
                  }`}
                  style={{
                    width: `${(status._count / (stats.activeRepairsCount || 1)) * 100}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
