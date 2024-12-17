import { useState } from "react";
import { Link, useLocation } from "@remix-run/react";
import { cn } from "~/utils/cn";
import {
  LayoutDashboard,
  Building2,
  Wrench,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "~/context/ThemeContext";
import { Logo } from "~/components/Logo";

interface SidebarProps {
  user: {
    role: string;
    name: string;
  };
  counts: {
    properties?: number;
    repairs: number;
    tenants?: number;
  };
}

interface NavigationItem {
  name: string;
  to: string;
  icon: LucideIcon;
  current: boolean;
  count?: number;
}

export function Sidebar({ user, counts }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  // Base navigation items - Dashboard only for landlords
  const baseNavigation: NavigationItem[] = [
    ...(user.role === 'LANDLORD' ? [{
      name: "Dashboard",
      to: ".",
      icon: LayoutDashboard,
      current: location.pathname === "/dashboard",
    }] : []),
    {
      name: "Settings",
      to: "profile",
      icon: Settings,
      current: location.pathname === "/dashboard/profile",
    },
  ];

  // Role-specific navigation items
  const roleNavigation: Record<string, NavigationItem[]> = {
    LANDLORD: [
      {
        name: "Properties",
        to: "properties",
        icon: Building2,
        count: counts.properties,
        current: location.pathname.startsWith("/dashboard/properties"),
      },
      {
        name: "Repair Requests",
        to: "repair-requests",
        icon: Wrench,
        count: counts.repairs,
        current: location.pathname.startsWith("/dashboard/repair-requests"),
      },
      {
        name: "Tenants",
        to: "tenants",
        icon: Users,
        count: counts.tenants,
        current: location.pathname === "/dashboard/tenants",
      },
    ],
    TENANT: [
      {
        name: "Repair Requests",
        to: "repair-requests",
        icon: Wrench,
        count: counts.repairs,
        current: location.pathname.startsWith("/dashboard/repair-requests"),
      },
    ],
    ADMIN: [] // Admin-specific navigation items can be added here
  };

  // Combine base navigation with role-specific items
  const navigation = [
    ...baseNavigation.slice(0, 1), // Dashboard first (if present)
    ...(roleNavigation[user.role] || []),
    ...baseNavigation.slice(1) // Settings last
  ];

  return (
    <div
      className={cn(
        "flex flex-col h-[calc(100vh-4rem)] mt-16 transition-all duration-300 backdrop-blur-[var(--backdrop-blur)]",
        collapsed ? "w-[var(--sidebar-width-collapsed)]" : "w-[var(--sidebar-width)]"
      )}
      style={{
        backgroundColor: 'var(--card-bg)',
        borderRight: '1px solid var(--card-border)',
        boxShadow: 'var(--shadow-lg)'
      }}
    >
      {/* Logo and App Name */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Logo logoSrc="/logo5.svg" size={collapsed ? "md" : "lg"} showText={false} className="py-1" />
          {!collapsed && (
            <span className="text-xl font-bold tracking-tight text-[var(--color-neutral-white)]">
              RepairHub
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg transition-colors duration-200 hover:bg-[var(--color-bg-tertiary)]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.to}
            className={cn(
              "flex items-center px-3 py-2 rounded-lg transition-colors duration-300",
              item.current
                ? "bg-[var(--color-hover-bg)] text-[var(--color-text-primary)] hover:bg-[var(--color-primary-400)]/20"
                : "hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5",
              item.current && "text-[var(--color-text-primary)]"
            )} />
            {!collapsed && (
              <>
                <span className="ml-3">{item.name}</span>
                {item.count !== undefined && (
                  <div
                    className={cn(
                      "ml-auto inline-flex items-center rounded-full border backdrop-blur-[var(--backdrop-blur)] px-2.5 py-0.5 text-xs font-medium",
                      "bg-[var(--color-accent-secondary)] text-[var(--color-accent-primary)] border-[var(--color-border-primary)]"
                    )}
                  >
                    {item.count}
                  </div>
                )}
              </>
            )}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div
        className="p-4 space-y-2"
        style={{ borderTop: '1px solid var(--card-border)' }}
      >
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={cn(
            "flex items-center w-full px-3 py-2 rounded-lg transition-colors duration-200",
            "hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
          )}
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          {!collapsed && <span className="ml-3">Theme</span>}
        </button>
        <form action="/logout" method="post">
          <button
            type="submit"
            className={cn(
              "flex items-center w-full px-3 py-2 rounded-lg transition-colors duration-200",
              "hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
            )}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-3">Logout</span>}
          </button>
        </form>
      </div>
    </div>
  );
}
