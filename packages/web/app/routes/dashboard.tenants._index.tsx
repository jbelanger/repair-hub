import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";
import { PageHeader } from "~/components/ui/PageHeader";
import { Card } from "~/components/ui/Card";
import { Users } from "lucide-react";
import { LinkButton } from "~/components/ui/Button";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  if (user.role !== "LANDLORD") {
    throw new Response("Not authorized", { status: 403 });
  }

  const tenants = await db.propertyTenant.findMany({
    where: {
      property: {
        landlordId: user.id
      }
    },
    include: {
      property: true,
      tenant: true
    }
  });

  const invitations = await db.tenantInvitation.findMany({
    where: {
      property: {
        landlordId: user.id
      }
    },
    include: {
      property: true
    }
  });

  return json({ tenants, invitations });
}

export default function TenantsIndex() {
  const { tenants, invitations } = useLoaderData<typeof loader>();

  return (
    <div className="p-6">
      <PageHeader
        title="Tenants"
        subtitle="Manage your property tenants"
        action={{
          label: "Invite Tenant",
          href: "invite"
        }}
      />

      <div className="grid gap-6">
        <Card
          accent="purple"
          header={{
            title: "Active Tenants",
            subtitle: "Currently active tenants across your properties",
            icon: <Users className="h-5 w-5" />,
            iconBackground: true
          }}
        >
          <div className="divide-y divide-[var(--card-border)]">
            {tenants.length === 0 ? (
              <p className="py-4 text-center text-[var(--color-text-secondary)]">
                No active tenants
              </p>
            ) : (
              tenants.map((tenant) => (
                <div key={tenant.id} className="py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{tenant.tenant.name || tenant.tenant.email}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          {tenant.property.address}
                        </p>
                        <span className="text-sm text-[var(--color-text-secondary)]">
                          {new Date(tenant.startDate).toLocaleDateString()} - {new Date(tenant.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <LinkButton
                      to={tenant.tenant.id}
                      variant="ghost"
                      size="sm"
                    >
                      View Details
                    </LinkButton>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card
          accent="purple"
          header={{
            title: "Pending Invitations",
            subtitle: "Invitations waiting for tenant acceptance",
            icon: <Users className="h-5 w-5" />,
            iconBackground: true
          }}
        >
          <div className="divide-y divide-[var(--card-border)]">
            {invitations.length === 0 ? (
              <p className="py-4 text-center text-[var(--color-text-secondary)]">
                No pending invitations
              </p>
            ) : (
              invitations.map((invitation) => (
                <div key={invitation.id} className="py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {invitation.property.address}
                      </p>
                    </div>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
