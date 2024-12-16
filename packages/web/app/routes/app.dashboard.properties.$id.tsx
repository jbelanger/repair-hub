import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";
import { Button } from "~/components/ui/Button";
import { ArrowLeft, Building2, Mail, Plus, Users, Wrench } from "lucide-react";
import { Card } from "~/components/ui/Card";

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

export default function PropertyDetails() {
  const { property } = useLoaderData<typeof loader>();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/properties">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {property.address}
            </h2>
            <p className="mt-1 text-white/70">
              Property Details
            </p>
          </div>
        </div>
        <Link to={`/dashboard/properties/${property.id}/invite`}>
          <Button>
            <Plus className="h-5 w-5 mr-2" />
            Invite Tenant
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-white/70">Active Tenants</div>
            <Users className="h-5 w-5 text-white/20" />
          </div>
          <div className="mt-2 text-3xl font-semibold">
            {property.tenantLeases.length}
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-white/70">Pending Invites</div>
            <Mail className="h-5 w-5 text-white/20" />
          </div>
          <div className="mt-2 text-3xl font-semibold">
            {property.invitations.length}
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-white/70">Open Repairs</div>
            <Wrench className="h-5 w-5 text-white/20" />
          </div>
          <div className="mt-2 text-3xl font-semibold">
            {property.repairs.length}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Tenants */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Current Tenants
            </h3>
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

        {/* Open Repairs */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Open Repairs
            </h3>
            <Wrench className="h-5 w-5 text-white/70" />
          </div>
          
          {property.repairs.length === 0 ? (
            <Card className="p-6 text-center text-white/70">
              No open repairs
            </Card>
          ) : (
            <div className="space-y-4">
              {property.repairs.map((repair) => (
                <Card key={repair.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">
                        Requested by {repair.initiator.name}
                      </p>
                      <p className="text-sm text-white/70">
                        Status: {repair.status}
                      </p>
                    </div>
                    <Link to={`/dashboard/repairs/${repair.id}`}>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Pending Invitations */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Pending Invitations
            </h3>
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
