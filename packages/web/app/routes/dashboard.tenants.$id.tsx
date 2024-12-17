import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";
import { Mail, Phone, Home, Wrench } from "lucide-react";
import { Card } from "~/components/ui/Card";
import { PageHeader } from "~/components/ui/PageHeader";
import { DataList } from "~/components/ui/DataGrid";
import { RepairStatus } from "~/components/ui/StatusBadge";
import { LinkButton } from "~/components/ui/Button";

type RepairRequest = {
  id: string;
  status: string;
  description: string;
  createdAt: string;
  property: {
    address: string;
  };
};

type PropertyLease = {
  property: {
    id: string;
    address: string;
  };
  startDate: string;
  endDate: string;
  status: string;
};

type LoaderData = {
  tenant: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    propertyLeases: PropertyLease[];
    repairs: RepairRequest[];
  };
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  // Get tenant with their property leases and repair requests
  const tenant = await db.user.findFirst({
    where: {
      id: params.id,
      propertyLeases: {
        some: {
          property: {
            landlordId: user.id // Ensure tenant is connected to properties owned by this landlord
          }
        }
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      propertyLeases: {
        where: {
          property: {
            landlordId: user.id
          }
        },
        select: {
          property: {
            select: {
              id: true,
              address: true,
            }
          },
          startDate: true,
          endDate: true,
          status: true,
          repairs: {
            select: {
              id: true,
              status: true,
              description: true,
              createdAt: true,
              property: {
                select: {
                  address: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!tenant) {
    throw new Response("Tenant not found", { status: 404 });
  }

  // Format the data
  const formattedTenant = {
    ...tenant,
    propertyLeases: tenant.propertyLeases.map(lease => ({
      ...lease,
      startDate: lease.startDate.toISOString(),
      endDate: lease.endDate.toISOString()
    })),
    // Flatten repairs from all leases into a single array
    repairs: tenant.propertyLeases
      .flatMap(lease => lease.repairs)
      .map(repair => ({
        ...repair,
        createdAt: repair.createdAt.toISOString()
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  };

  return json<LoaderData>({ tenant: formattedTenant });
}

export default function TenantDetails() {
  const { tenant } = useLoaderData<typeof loader>();

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={tenant.name}
        subtitle="Tenant Details"
        backTo=".."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card
          accent="purple"
          header={{
            title: "Contact Information",
            icon: <Mail className="h-5 w-5" />,
            iconBackground: true
          }}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4" style={{ color: 'var(--color-text-secondary)' }} />
              <span>{tenant.email}</span>
            </div>
            {tenant.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4" style={{ color: 'var(--color-text-secondary)' }} />
                <span>{tenant.phone}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Properties */}
        <Card
          accent="purple"
          header={{
            title: "Leased Properties",
            icon: <Home className="h-5 w-5" />,
            iconBackground: true
          }}
        >
          <DataList
            items={tenant.propertyLeases}
            emptyState={{
              icon: Home,
              title: "No properties",
              description: "This tenant is not currently leasing any properties"
            }}
            renderItem={(lease) => (
              <Card variant="interactive">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {lease.property.address}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <LinkButton
                    to={`/dashboard/properties/${lease.property.id}`}
                    variant="ghost"
                    size="sm"
                  >
                    View Property
                  </LinkButton>
                </div>
              </Card>
            )}
          />
        </Card>

        {/* Repair History */}
        <Card
          accent="purple"
          className="lg:col-span-2"
          header={{
            title: "Repair History",
            icon: <Wrench className="h-5 w-5" />,
            iconBackground: true
          }}
        >
          <DataList
            items={tenant.repairs}
            emptyState={{
              icon: Wrench,
              title: "No repair requests",
              description: "This tenant has not made any repair requests"
            }}
            renderItem={(repair) => (
              <Card variant="interactive">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {repair.description}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <RepairStatus status={repair.status} />
                      <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {repair.property.address} • {new Date(repair.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <LinkButton
                    to={`/dashboard/repair-requests/${repair.id}`}
                    variant="ghost"
                    size="sm"
                  >
                    View Details
                  </LinkButton>
                </div>
              </Card>
            )}
          />
        </Card>
      </div>
    </div>
  );
}
