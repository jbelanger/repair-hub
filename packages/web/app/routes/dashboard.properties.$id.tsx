import { type ReactNode } from "react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";
import { Button } from "~/components/ui/Button";
import { ArrowLeft, Building2, Mail, Plus, Users, Wrench } from "lucide-react";
import { DashboardCard } from "~/components/ui/DashboardCard";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  const property = await db.property.findUnique({
    where: {
      id: params.id,
      landlordId: user.id // Ensure the property belongs to this landlord
    },
    include: {
      tenantLeases: {
        where: {
          status: "ACTIVE"
        },
        include: {
          tenant: true
        }
      },
      invitations: {
        where: {
          status: "PENDING"
        }
      },
      repairs: {
        where: {
          status: {
            in: ["PENDING", "IN_PROGRESS"]
          }
        },
        include: {
          initiator: true
        }
      }
    }
  });

  if (!property) {
    throw new Response("Property not found", { status: 404 });
  }

  return json({ property });
}

export default function PropertyDetails(): ReactNode {
  const { property } = useLoaderData<typeof loader>();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to=".." prefetch="intent">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {property.address}
            </h2>
            <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Property Details
            </p>
          </div>
        </div>
        <Link to="invite" prefetch="intent">
          <Button>
            <Plus className="h-5 w-5 mr-2" />
            Invite Tenant
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard
          title="Active Tenants"
          value={property.tenantLeases.length}
          icon={Users}
        />
        <DashboardCard
          title="Pending Invites"
          value={property.invitations.length}
          icon={Mail}
        />
        <DashboardCard
          title="Open Repairs"
          value={property.repairs.length}
          icon={Wrench}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Tenants */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Current Tenants
            </h3>
            <Users className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} />
          </div>
          
          {property.tenantLeases.length === 0 ? (
            <div
              className="p-6 rounded-[var(--card-radius)] transition-all duration-200 backdrop-blur-[var(--backdrop-blur)] text-center"
              style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                boxShadow: 'var(--shadow-md)',
                color: 'var(--color-text-secondary)'
              }}
            >
              No active tenants
            </div>
          ) : (
            <div className="space-y-4">
              {property.tenantLeases.map((lease) => (
                <div
                  key={lease.id}
                  className="p-4 rounded-[var(--card-radius)] transition-all duration-200 backdrop-blur-[var(--backdrop-blur)]"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {lease.tenant.name}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {lease.tenant.email}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Open Repairs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Open Repairs
            </h3>
            <Wrench className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} />
          </div>
          
          {property.repairs.length === 0 ? (
            <div
              className="p-6 rounded-[var(--card-radius)] transition-all duration-200 backdrop-blur-[var(--backdrop-blur)] text-center"
              style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                boxShadow: 'var(--shadow-md)',
                color: 'var(--color-text-secondary)'
              }}
            >
              No open repairs
            </div>
          ) : (
            <div className="space-y-4">
              {property.repairs.map((repair) => (
                <div
                  key={repair.id}
                  className="p-4 rounded-[var(--card-radius)] transition-all duration-200 backdrop-blur-[var(--backdrop-blur)]"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        Requested by {repair.initiator.name}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Status: {repair.status}
                      </p>
                    </div>
                    <Link to={`/dashboard/repairs/${repair.id}`} prefetch="intent">
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Invitations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Pending Invitations
            </h3>
            <Mail className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} />
          </div>
          
          {property.invitations.length === 0 ? (
            <div
              className="p-6 rounded-[var(--card-radius)] transition-all duration-200 backdrop-blur-[var(--backdrop-blur)] text-center"
              style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                boxShadow: 'var(--shadow-md)',
                color: 'var(--color-text-secondary)'
              }}
            >
              No pending invitations
            </div>
          ) : (
            <div className="space-y-4">
              {property.invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="p-4 rounded-[var(--card-radius)] transition-all duration-200 backdrop-blur-[var(--backdrop-blur)]"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {invitation.email}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
