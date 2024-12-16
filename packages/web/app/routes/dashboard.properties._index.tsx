import { type ReactNode } from "react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";
import { Button } from "~/components/ui/Button";
import { Building2, Plus } from "lucide-react";
import { Search } from "~/components/ui/Search";
import { Select } from "~/components/ui/Select";

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            My Properties
          </h2>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Manage your properties and tenants
          </p>
        </div>
        <Link to="/dashboard/properties/create">
          <Button>
            <Plus className="h-5 w-5 mr-2" />
            Add Property
          </Button>
        </Link>
      </div>

      {properties.length === 0 && !searchParams.toString() ? (
        <div
          className="p-6 rounded-[var(--card-radius)] transition-all duration-200 backdrop-blur-[var(--backdrop-blur)] text-center"
          style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <Building2 className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--color-text-tertiary)' }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>No properties yet</h3>
          <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            Add your first property to start managing repairs
          </p>
          <Link to="create" prefetch="intent">
            <Button>
              <Plus className="h-5 w-5 mr-2" />
              Add Property
            </Button>
          </Link>
        </div>
      ) : (
        <>
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

          {properties.length === 0 ? (
            <div
              className="p-6 rounded-[var(--card-radius)] transition-all duration-200 backdrop-blur-[var(--backdrop-blur)] text-center"
              style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <p style={{ color: 'var(--color-text-secondary)' }}>No properties found matching your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <Link 
                  key={property.id} 
                  to={property.id}
                  prefetch="intent"
                >
                  <div
                    className="p-6 rounded-[var(--card-radius)] transition-all duration-200 backdrop-blur-[var(--backdrop-blur)] hover:border-[var(--color-border-hover)]"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--card-border)',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div
                        className="p-2 rounded-lg backdrop-blur-[var(--backdrop-blur)]"
                        style={{
                          backgroundColor: 'var(--color-accent-secondary)',
                          border: '1px solid var(--color-border-primary)'
                        }}
                      >
                        <Building2 className="h-5 w-5" style={{ color: 'var(--color-accent-primary)' }} />
                      </div>
                      <div>
                        <h3 className="font-medium line-clamp-1" style={{ color: 'var(--color-text-primary)' }}>
                          {property.address}
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {property._count.tenantLeases} {property._count.tenantLeases === 1 ? 'tenant' : 'tenants'}
                        </p>
                      </div>
                    </div>

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
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
