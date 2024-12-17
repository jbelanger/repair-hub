import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Building2, Wrench, Users } from "lucide-react";
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

async function getRepairTrends(userId: string) {
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
          property: { landlordId: userId },
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

  // Redirect tenants to their repair requests page
  if (user.role !== "LANDLORD") {
    return redirect("/dashboard/repair-requests");
  }

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
    getRepairTrends(user.id)
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
}

export default function DashboardIndex() {
  const { stats } = useLoaderData<typeof loader>();

  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <DashboardCard
          title="Active Repairs"
          value={stats.repairs.count}
          icon={Wrench}
          change={{
            value: stats.repairs.change,
            trend: stats.repairs.change >= 0 ? 'up' : 'down'
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
