import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Building2, Wrench, Users, TrendingUp } from "lucide-react";
import { DashboardCard } from "~/components/ui/DashboardCard";
import { BarChart } from "~/components/ui/BarChart";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";

interface Metric {
  count: number;
  change: number;
}

interface RepairTrend {
  label: string;
  value: number;
  color: string;
}

interface LandlordStats {
  properties: Metric;
  tenants: Metric;
  repairs: Metric;
  repairTrends: RepairTrend[];
}

interface TenantStats {
  repairs: Metric;
  repairTrends: RepairTrend[];
}

type LoaderData = {
  stats: LandlordStats | TenantStats;
};

function isLandlordStats(stats: LandlordStats | TenantStats): stats is LandlordStats {
  return 'properties' in stats;
}

async function getMonthOverMonthChange(
  currentCount: number,
  userId: string,
  type: 'properties' | 'repairs' | 'tenants'
) {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  let previousCount = 0;

  switch (type) {
    case 'properties':
      previousCount = await db.property.count({
        where: {
          landlordId: userId,
          createdAt: {
            lt: lastMonth
          }
        }
      });
      break;
    case 'repairs':
      previousCount = await db.repairRequest.count({
        where: {
          property: { landlordId: userId },
          createdAt: {
            lt: lastMonth
          }
        }
      });
      break;
    case 'tenants':
      previousCount = await db.propertyTenant.count({
        where: {
          property: { landlordId: userId },
          createdAt: {
            lt: lastMonth
          }
        }
      });
      break;
  }

  if (previousCount === 0) return 0;
  return ((currentCount - previousCount) / previousCount) * 100;
}

async function getRepairTrends(userId: string, role: string) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(now.getMonth() - i);
    return d;
  }).reverse();

  const trends = await Promise.all(
    months.map(async (month) => {
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const count = await db.repairRequest.count({
        where: {
          ...(role === "LANDLORD"
            ? { property: { landlordId: userId } }
            : { initiatorId: userId }),
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      return {
        label: month.toLocaleDateString('en-US', { month: 'short' }),
        value: count,
        color: 'var(--color-chart-1)'
      };
    })
  );

  return trends;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  if (user.role === "LANDLORD") {
    const [
      propertiesCount,
      activeTenantsCount,
      activeRepairsCount,
      repairTrends
    ] = await Promise.all([
      db.property.count({
        where: { landlordId: user.id }
      }),
      db.propertyTenant.count({
        where: {
          property: { landlordId: user.id },
          status: "ACTIVE"
        }
      }),
      db.repairRequest.count({
        where: {
          property: { landlordId: user.id },
          status: {
            in: ["PENDING", "IN_PROGRESS"]
          }
        }
      }),
      getRepairTrends(user.id, user.role)
    ]);

    // Get month-over-month changes
    const [
      propertiesChange,
      tenantsChange,
      repairsChange
    ] = await Promise.all([
      getMonthOverMonthChange(propertiesCount, user.id, 'properties'),
      getMonthOverMonthChange(activeTenantsCount, user.id, 'tenants'),
      getMonthOverMonthChange(activeRepairsCount, user.id, 'repairs')
    ]);

    return json({
      stats: {
        properties: {
          count: propertiesCount,
          change: propertiesChange
        },
        tenants: {
          count: activeTenantsCount,
          change: tenantsChange
        },
        repairs: {
          count: activeRepairsCount,
          change: repairsChange
        },
        repairTrends
      } satisfies LandlordStats
    });
  } else {
    const [activeRepairsCount, repairTrends] = await Promise.all([
      db.repairRequest.count({
        where: {
          initiatorId: user.id,
          status: {
            in: ["PENDING", "IN_PROGRESS"]
          }
        }
      }),
      getRepairTrends(user.id, user.role)
    ]);

    const repairsChange = await getMonthOverMonthChange(activeRepairsCount, user.id, 'repairs');

    return json({
      stats: {
        repairs: {
          count: activeRepairsCount,
          change: repairsChange
        },
        repairTrends
      } satisfies TenantStats
    });
  }
}

export default function DashboardIndex() {
  const { stats } = useLoaderData<typeof loader>();

  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLandlordStats(stats) && (
          <>
            <DashboardCard
              title="Total Properties"
              value={stats.properties.count}
              icon={Building2}
              change={{
                value: stats.properties.change,
                trend: stats.properties.change >= 0 ? 'up' : 'down'
              }}
            />
            <DashboardCard
              title="Active Tenants"
              value={stats.tenants.count}
              icon={Users}
              change={{
                value: stats.tenants.change,
                trend: stats.tenants.change >= 0 ? 'up' : 'down'
              }}
            />
          </>
        )}
        <DashboardCard
          title="Active Repairs"
          value={stats.repairs.count}
          icon={Wrench}
          change={{
            value: stats.repairs.change,
            trend: stats.repairs.change >= 0 ? 'up' : 'down'
          }}
        />
        <DashboardCard
          title="Total Revenue"
          value="$12,345"
          icon={TrendingUp}
          change={{
            value: 12.5,
            trend: 'up'
          }}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          data={stats.repairTrends}
          className="lg:col-span-2"
        />
      </div>
    </div>
  );
}
