import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";
import { Building2, Plus } from "lucide-react";
import { Search } from "~/components/ui/Search";
import { Select } from "~/components/ui/Select";
import { PageHeader } from "~/components/ui/PageHeader";
import { DataGrid } from "~/components/ui/DataGrid";
import { Card } from "~/components/ui/Card";
import { EmptyState } from "~/components/ui/EmptyState";
import { GridSkeleton } from "~/components/ui/LoadingState";
import { useToast, ToastManager } from "~/components/ui/Toast";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.toLowerCase() || "";
  const filter = url.searchParams.get("filter") || "all";
  const sort = url.searchParams.get("sort") || "address";

  let whereClause: any = {
    landlordId: user.id,
    ...(search ? {
      address: { contains: search }
    } : {})
  };

  // Apply filters
  switch (filter) {
    case "with-repairs":
      whereClause = {
        ...whereClause,
        repairs: {
          some: {
            status: "PENDING"
          }
        }
      };
      break;
    case "with-invites":
      whereClause = {
        ...whereClause,
        invitations: {
          some: {
            status: "PENDING"
          }
        }
      };
      break;
    case "with-tenants":
      whereClause = {
        ...whereClause,
        tenantLeases: {
          some: {
            status: "ACTIVE"
          }
        }
      };
      break;
  }

  const properties = await db.property.findMany({
    where: whereClause,
    include: {
      _count: {
        select: { tenantLeases: true }
      },
      tenantLeases: {
        where: { status: "ACTIVE" },
        include: { tenant: true }
      },
      invitations: {
        where: { status: "PENDING" }
      },
      repairs: {
        where: { status: "PENDING" }
      }
    },
    orderBy: sort === 'tenants' 
      ? { tenantLeases: { _count: 'desc' } }
      : sort === 'created' 
        ? { createdAt: 'desc' }
        : { address: 'asc' }
  });

  return json({ properties });
}

export default function DashboardPropertiesIndex() {
  const { properties } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();
  const searchTerm = searchParams.get("search") || "";

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    setSearchParams(params);
  };

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value !== "all") {
      params.set("filter", value);
    } else {
      params.delete("filter");
    }
    setSearchParams(params);
  };

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value !== "address") {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }
    setSearchParams(params);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="My Properties"
        subtitle="Manage your properties and tenants"
        action={{
          label: "Add Property",
          icon: <Plus className="h-5 w-5" />,
          href: "/dashboard/properties/create"
        }}
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <Search 
          className="flex-1"
          placeholder="Search properties..."
          onChange={handleSearch}
        />
        <Select
          className="w-full sm:w-48"
          value={searchParams.get("filter") || "all"}
          onChange={(e) => handleFilterChange(e.target.value)}
        >
          <option value="all">All Properties</option>
          <option value="with-repairs">With Open Repairs</option>
          <option value="with-invites">With Pending Invites</option>
          <option value="with-tenants">With Active Tenants</option>
        </Select>
        <Select
          className="w-full sm:w-48"
          value={searchParams.get("sort") || "address"}
          onChange={(e) => handleSortChange(e.target.value)}
        >
          <option value="address">Sort by Address</option>
          <option value="tenants">Sort by Tenants</option>
          <option value="created">Sort by Created Date</option>
        </Select>
      </div>

      {properties.length === 0 && !searchParams.toString() ? (
        <EmptyState
          icon={Building2}
          title="No properties yet"
          description="Add your first property to start managing repairs"
          action={{
            label: "Add Property",
            icon: <Plus className="h-5 w-5" />,
            href: "create"
          }}
        />
      ) : (
        <DataGrid
          items={properties}
          columns={3}
          emptyState={
            properties.length === 0 ? {
              title: "No properties found",
              description: searchTerm ? `No properties found matching "${searchTerm}"` : "No properties match the selected filters",
              icon: Building2
            } : undefined
          }
          renderItem={(property) => (
            <Card
              variant="property"
              header={{
                icon: <Building2 className="h-5 w-5" />,
                iconBackground: true,
                title: property.address,
                subtitle: `${property._count.tenantLeases} ${property._count.tenantLeases === 1 ? 'tenant' : 'tenants'}`
              }}
            >
              <div className="mb-6">
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Added {new Date(property.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {property.tenantLeases.length}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Active Tenants
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {property.invitations.length}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Pending Invites
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {property.repairs.length}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Open Repairs
                  </div>
                </div>
              </div>
            </Card>
          )}
        />
      )}

      <ToastManager toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
