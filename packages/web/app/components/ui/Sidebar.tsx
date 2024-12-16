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
} from "lucide-react";
import { useTheme } from "~/context/ThemeContext";

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

export function Sidebar({ user, counts }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const navigation = [
    {
      name: "Dashboard",
      to: "/dashboard",
      icon: LayoutDashboard,
      current: location.pathname === "/dashboard",
    },
    ...(user.role === "LANDLORD"
      ? [
          {
            name: "Properties",
            to: "/dashboard/properties",
            icon: Building2,
            count: counts.properties,
            current: location.pathname.startsWith("/dashboard/properties"),
          },
        ]
      : []),
    {
      name: "Repairs",
      to: "/dashboard/repairs",
      icon: Wrench,
      count: counts.repairs,
      current: location.pathname.startsWith("/dashboard/repairs"),
    },
    ...(user.role === "LANDLORD"
      ? [
          {
            name: "Tenants",
            to: "/dashboard/tenants",
            icon: Users,
            count: counts.tenants,
            current: location.pathname === "/dashboard/tenants",
          },
        ]
      : []),
    {
      name: "Settings",
      to: "/dashboard/profile",
      icon: Settings,
      current: location.pathname === "/dashboard/profile",
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-col h-screen transition-all duration-300 backdrop-blur-[var(--backdrop-blur)]",
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
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src="/logo3.png" alt="Logo" className="h-8" />
            <span className="text-xl font-bold">RepairHub</span>
          </div>
        )}
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
              "flex items-center px-3 py-2 rounded-lg transition-colors duration-200",
              item.current
                ? "bg-[var(--color-accent-secondary)] text-[var(--color-accent-primary)]"
                : "hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            )}
          >
            <item.icon className="h-5 w-5" />
            {!collapsed && (
              <>
                <span className="ml-3">{item.name}</span>
                {item.count !== undefined && (
                  <span
                    className={cn(
                      "ml-auto rounded-full px-2 py-0.5 text-xs",
                      item.current
                        ? "bg-[var(--color-accent-secondary)]"
                        : "bg-[var(--color-bg-tertiary)]"
                    )}
                  >
                    {item.count}
                  </span>
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
