import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { useAccount } from 'wagmi';
import { useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { ConnectWallet } from "~/components/ConnectWallet";
import { requireUser } from "~/utils/session.server";
import { Search } from "~/components/ui/Search";
import { Settings } from "lucide-react";
import { Sidebar } from "~/components/ui/Sidebar";
import { db } from "~/utils/db.server";
import { Notifications } from "~/components/Notifications";
import { RoleSwitcher } from "~/components/RoleSwitcher";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  if (!user) {
    return redirect("/");
  }

  // Get counts for the navigation badges
  const [propertiesCount, pendingRepairsCount, activeTenantsCount, pendingInvitations, notifications] = await Promise.all([
    db.property.count({ 
      where: { landlordId: user.id } 
    }),
    db.repairRequest.count({
      where: {
        OR: [
          { property: { landlordId: user.id } },
          { initiatorId: user.id }
        ],
        status: "PENDING"
      }
    }),
    db.propertyTenant.count({
      where: {
        property: { landlordId: user.id },
        status: "ACTIVE"
      }
    }),
    db.tenantInvitation.findMany({
      where: {
        email: user.email,
        status: "PENDING",
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        property: {
          select: {
            address: true
          }
        }
      }
    }),
    db.notification.findMany({
      where: {
        userId: user.id,
        read: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  ]);

  return json({ 
    user,
    counts: {
      properties: propertiesCount,
      repairs: pendingRepairsCount,
      tenants: activeTenantsCount
    },
    notifications: {
      invitations: pendingInvitations.map(invitation => ({
        id: invitation.id,
        propertyAddress: invitation.property.address,
        startDate: invitation.startDate.toISOString(),
        endDate: invitation.endDate.toISOString()
      })),
      general: notifications.map(notification => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        createdAt: notification.createdAt.toISOString(),
        read: notification.read
      }))
    }
  });
}

export default function AppLayout() {
  const { user, counts, notifications } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1A0B38] via-[#0A0612] to-[#0A0612]" />
        
        {/* Glowing orbs */}
        <div className="absolute -left-1/4 top-0 h-[800px] w-[800px] rounded-full bg-[#1A0B38]/10 blur-[120px]" />
        <div className="absolute -right-1/4 top-1/4 h-[600px] w-[600px] rounded-full bg-[#1A0B38]/10 blur-[120px]" />
        
        {/* Dot pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.3] mix-blend-soft-light"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
        
        {/* Noise texture */}
        <div 
          className="absolute inset-0 opacity-[0.02] mix-blend-soft-light"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 backdrop-blur-[var(--backdrop-blur)] z-50">
        <div className="h-full px-4 flex items-center justify-between" style={{
          backgroundColor: 'var(--card-bg)',
          borderBottom: '1px solid var(--card-border)'
        }}>
          {/* Left: Empty space for alignment */}
          <div className="w-[var(--sidebar-width)]"></div>

          {/* Center: Search */}
          <div className="flex-1 max-w-xl mx-4">
            <Search className="w-full" />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            <Notifications 
              invitations={notifications.invitations} 
              notifications={notifications.general}
            />
            <RoleSwitcher currentRole={user.role} />
            <button
              className="p-2 rounded-lg transition-colors duration-200 hover:bg-[var(--color-bg-tertiary)]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <Settings className="h-5 w-5" />
            </button>
            <ConnectWallet />
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar user={user} counts={counts} />

        {/* Main Content */}
        <main className="flex-1 mt-16 overflow-auto">
          <div className="h-full p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
