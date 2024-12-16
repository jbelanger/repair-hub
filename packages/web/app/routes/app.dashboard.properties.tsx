import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";
import { Button } from "~/components/ui/Button";
import { Building2, Plus, Users } from "lucide-react";
import { Card } from "~/components/ui/Card";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  const properties = await db.property.findMany({
    where: {
      landlordId: user.id
    },
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
    }
  });

  return json({ properties });
}

export default function DashboardProperties() {
  const { properties } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">
            My Properties
          </h2>
          <p className="mt-1 text-white/70">
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

      {properties.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-white/20" />
          <h3 className="text-xl font-semibold mb-2">No properties yet</h3>
          <p className="text-white/70 mb-6">
            Add your first property to start managing repairs
          </p>
          <Link to="/dashboard/properties/create">
            <Button>
              <Plus className="h-5 w-5 mr-2" />
              Add Property
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {properties.map((property) => (
            <Link 
              key={property.id} 
              to={`/dashboard/properties/${property.id}`}
            >
              <Card className="p-6 h-full hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <Building2 className="h-8 w-8 text-white/20" />
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold line-clamp-1">
                        {property.address}
                      </h3>
                      <div className="flex items-center mt-1 text-sm text-white/70">
                        <Users className="h-4 w-4 mr-1.5" />
                        {property._count.tenantLeases} {property._count.tenantLeases === 1 ? 'tenant' : 'tenants'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-white">
                      {property.tenantLeases.length}
                    </div>
                    <div className="text-sm text-white/70">
                      Active Tenants
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-white">
                      {property.invitations.length}
                    </div>
                    <div className="text-sm text-white/70">
                      Pending Invites
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-white">
                      {property.repairs.length}
                    </div>
                    <div className="text-sm text-white/70">
                      Open Repairs
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
