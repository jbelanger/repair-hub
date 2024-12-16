import { type ReactNode } from "react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";
import { Mail, Plus, Users, Wrench } from "lucide-react";
import { DashboardCard } from "~/components/ui/DashboardCard";
import { Card } from "~/components/ui/Card";
import { PageHeader } from "~/components/ui/PageHeader";
import { EmptyState } from "~/components/ui/EmptyState";
import { DataList } from "~/components/ui/DataGrid";
import { RepairStatus } from "~/components/ui/StatusBadge";
import { Button, LinkButton } from "~/components/ui/Button";
import { useToast, ToastManager } from "~/components/ui/Toast";
import { ConfirmModal } from "~/components/ui/Modal";
import { useState } from "react";

type TenantLease = {
  id: string;
  tenant: {
    id: string;
    name: string;
    email: string;
  };
};

type RepairRequest = {
  id: string;
  status: string;
  initiator: {
    name: string;
  };
};

type DatabaseInvitation = {
  id: string;
  email: string;
  expiresAt: Date;
  status: string;
  propertyId: string;
  startDate: Date;
  endDate: Date;
};

type Invitation = {
  id: string;
  email: string;
  expiresAt: string;
  status: string;
  propertyId: string;
  startDate: string;
  endDate: string;
};

type LoaderData = {
  property: {
    id: string;
    address: string;
    tenantLeases: TenantLease[];
    invitations: Invitation[];
    repairs: RepairRequest[];
  };
};

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
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
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
          initiator: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  if (!property) {
    throw new Response("Property not found", { status: 404 });
  }

  // Convert dates to strings
  const formattedProperty = {
    ...property,
    invitations: property.invitations.map((invitation: DatabaseInvitation) => ({
      ...invitation,
      expiresAt: invitation.expiresAt.toISOString(),
      startDate: invitation.startDate.toISOString(),
      endDate: invitation.endDate.toISOString(),
    }))
  };

  return json<LoaderData>({ property: formattedProperty });
}

export default function PropertyDetails(): ReactNode {
  const { property } = useLoaderData<typeof loader>();
  const { toasts, addToast, removeToast } = useToast();
  const [invitationToCancel, setInvitationToCancel] = useState<string | null>(null);

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/cancel`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to cancel invitation');
      
      addToast("Invitation cancelled successfully", "success");
      window.location.reload();
    } catch (error) {
      console.error('Cancel invitation error:', error);
      addToast("Failed to cancel invitation", "error");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Outlet />
      <PageHeader
        title={property.address}
        subtitle="Property Details"
        backTo=".."
        action={{
          label: "Invite Tenant",
          icon: <Plus className="h-5 w-5" />,
          href: `/dashboard/tenants/invite?propertyId=${property.id}`
        }}
      />

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
        <Card
          accent="purple"
          header={{
            title: "Current Tenants",
            icon: <Users className="h-5 w-5" />,
            iconBackground: true
          }}
        >
          <DataList<TenantLease>
            items={property.tenantLeases}
            emptyState={{
              icon: Users,
              title: "No active tenants",
              description: "Invite tenants to start managing your property",
              action: {
                label: "Invite Tenant",
                icon: <Plus className="h-5 w-5" />,
                href: `/dashboard/tenants/invite?propertyId=${property.id}`
              }
            }}
            renderItem={(lease) => (
              <Card variant="interactive">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {lease.tenant.name}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {lease.tenant.email}
                    </p>
                  </div>
                  <LinkButton
                    to={`/dashboard/tenants/${lease.tenant.id}`}
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

        {/* Open Repairs */}
        <Card
          accent="purple"
          header={{
            title: "Open Repairs",
            icon: <Wrench className="h-5 w-5" />,
            iconBackground: true
          }}
        >
          <DataList<RepairRequest>
            items={property.repairs}
            emptyState={{
              icon: Wrench,
              title: "No open repairs",
              description: "All repair requests have been resolved"
            }}
            renderItem={(repair) => (
              <Card variant="interactive">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      Requested by {repair.initiator.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <RepairStatus status={repair.status} />
                    </div>
                  </div>
                  <LinkButton
                    to={`/dashboard/repairs/${repair.id}`}
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

        {/* Pending Invitations */}
        <Card
          accent="purple"
          header={{
            title: "Pending Invitations",
            icon: <Mail className="h-5 w-5" />,
            iconBackground: true
          }}
        >
          <DataList<Invitation>
            items={property.invitations}
            emptyState={{
              icon: Mail,
              title: "No pending invitations",
              description: "All invitations have been accepted or expired"
            }}
            renderItem={(invitation) => (
              <Card variant="interactive">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {invitation.email}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInvitationToCancel(invitation.id)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
          />
        </Card>
      </div>

      {/* Cancel Invitation Modal */}
      {invitationToCancel && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setInvitationToCancel(null)}
          title="Cancel Invitation"
          message="Are you sure you want to cancel this invitation? This action cannot be undone."
          confirmLabel="Cancel Invitation"
          cancelLabel="Keep Invitation"
          onConfirm={() => handleCancelInvitation(invitationToCancel)}
          isDestructive
        />
      )}

      <ToastManager toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
