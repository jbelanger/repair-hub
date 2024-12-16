import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";
import { Building2, Settings, Wrench, Users } from "lucide-react";
import { cn } from "~/utils/cn";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  // Only logged in users can access dashboard
  if (!user) {
    return redirect("/app");
  }

  // Get counts for the navigation badges
  const [propertiesCount, pendingRepairsCount, activeTenantsCount] = await Promise.all([
    user.role === "LANDLORD" 
      ? db.property.count({ where: { landlordId: user.id } })
      : 0,
    user.role === "LANDLORD"
      ? db.repairRequest.count({
          where: {
            property: { landlordId: user.id },
            status: "PENDING"
          }
        })
      : db.repairRequest.count({
          where: {
            initiatorId: user.id,
            status: "PENDING"
          }
        }),
    user.role === "LANDLORD"
      ? db.propertyTenant.count({
          where: {
            property: { landlordId: user.id },
            status: "ACTIVE"
          }
        })
      : 0
  ]);

  return json({ user, propertiesCount, pendingRepairsCount, activeTenantsCount });
}

export default function Dashboard() {
  const { user, propertiesCount, pendingRepairsCount, activeTenantsCount } = useLoaderData<typeof loader>();
  const location = useLocation();

  const navigation = [
    {
      name: "Profile",
      to: "/dashboard/profile",
      icon: Settings,
      current: location.pathname === "/dashboard/profile"
    },
    ...(user.role === "LANDLORD" ? [
      {
        name: "Properties",
        to: "/dashboard/properties",
        icon: Building2,
        count: propertiesCount,
        current: location.pathname.startsWith("/dashboard/properties")
      }
    ] : []),
    {
      name: "Repair Requests",
      to: "/dashboard/repairs",
      icon: Wrench,
      count: pendingRepairsCount,
      current: location.pathname.startsWith("/dashboard/repairs")
    },
    ...(user.role === "LANDLORD" ? [
      {
        name: "Tenants",
        to: "/dashboard/tenants",
        icon: Users,
        count: activeTenantsCount,
        current: location.pathname === "/dashboard/tenants"
      }
    ] : [])
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Navigation Tabs */}
      <nav className="mb-8">
        <div className="border-b border-white/10">
          <div className="flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.to}
                className={cn(
                  item.current
                    ? "border-purple-500 text-purple-500"
                    : "border-transparent text-white/70 hover:text-white hover:border-white/20",
                  "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium"
                )}
              >
                <item.icon
                  className={cn(
                    item.current
                      ? "text-purple-500"
                      : "text-white/70 group-hover:text-white",
                    "h-5 w-5 mr-2"
                  )}
                  aria-hidden="true"
                />
                {item.name}
                {item.count ? (
                  <span
                    className={cn(
                      item.current
                        ? "bg-purple-100 text-purple-600"
                        : "bg-white/10 text-white/70 group-hover:text-white",
                      "ml-3 hidden rounded-full py-0.5 px-2.5 text-xs font-medium md:inline-block"
                    )}
                  >
                    {item.count}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <div className="py-6">
        <Outlet />
      </div>
    </div>
  );
}
