import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";
import { Button } from "~/components/ui/Button";
import { Building2, Plus, Users } from "lucide-react";
import { Card } from "~/components/ui/Card";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  // Only landlords can access this page
  if (user.role !== "LANDLORD") {
    return redirect("/app");
  }

  const properties = await db.property.findMany({
    where: {
      landlordId: user.id
    },
    include: {
      _count: {
        select: { tenantLeases: true }
      }
    }
  });

  return json({ properties });
}

export default function Properties() {
  const { properties } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-white">
            My Properties
          </h1>
          <p className="mt-2 text-lg text-white/70">
            Manage your properties and tenants
          </p>
        </div>
        <Link to="/properties/create">
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
          <Link to="/properties/create">
            <Button>
              <Plus className="h-5 w-5 mr-2" />
              Add Property
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Link 
              key={property.id} 
              to={`/properties/${property.id}`}
              className="block"
            >
              <Card className="p-6 h-full hover:bg-white/5 transition-colors">
                <Building2 className="h-8 w-8 mb-4 text-white/20" />
                <h3 className="text-lg font-semibold mb-2 line-clamp-1">
                  {property.address}
                </h3>
                <div className="flex items-center text-white/70">
                  <Users className="h-4 w-4 mr-2" />
                  {property._count.tenantLeases} {property._count.tenantLeases === 1 ? 'tenant' : 'tenants'}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
