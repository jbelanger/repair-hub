import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";
import { Button } from "~/components/ui/Button";
import { ArrowLeft, Building2, Mail, Plus, Users } from "lucide-react";
import { Card } from "~/components/ui/Card";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  // Only landlords can access this page
  if (user.role !== "LANDLORD") {
    return redirect("/");
  }

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
      }
    }
  });

  if (!property) {
    throw new Response("Property not found", { status: 404 });
  }

  return json({ property });
}

export default function PropertyDetails() {
  const { property } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-12">
        <Link to="/properties">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">
            {property.address}
          </h1>
          <p className="mt-2 text-lg text-white/70">
            Manage tenants and invitations
          </p>
        </div>
        <Link to={`/properties/${property.id}/invite`}>
          <Button>
            <Plus className="h-5 w-5 mr-2" />
            Invite Tenant
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Tenants */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Current Tenants
            </h2>
            <Users className="h-5 w-5 text-white/70" />
          </div>
          
          {property.tenantLeases.length === 0 ? (
            <Card className="p-6 text-center text-white/70">
              No active tenants
            </Card>
          ) : (
            <div className="space-y-4">
              {property.tenantLeases.map((lease) => (
                <Card key={lease.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">
                        {lease.tenant.name}
                      </p>
                      <p className="text-sm text-white/70">
                        {lease.tenant.email}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Pending Invitations */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Pending Invitations
            </h2>
            <Mail className="h-5 w-5 text-white/70" />
          </div>
          
          {property.invitations.length === 0 ? (
            <Card className="p-6 text-center text-white/70">
              No pending invitations
            </Card>
          ) : (
            <div className="space-y-4">
              {property.invitations.map((invitation) => (
                <Card key={invitation.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">
                        {invitation.email}
                      </p>
                      <p className="text-sm text-white/70">
                        Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Cancel
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
