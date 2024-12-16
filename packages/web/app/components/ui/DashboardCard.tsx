import { cn } from "~/utils/cn";
import type { LucideIcon } from "lucide-react";
import { Card } from "./Card";

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: number;
    trend: "up" | "down";
  };
  className?: string;
}

export function DashboardCard({ title, value, icon: Icon, change, className }: DashboardCardProps) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm">
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {value}
          </p>
        </div>
        <div
          className="p-2 rounded-lg backdrop-blur-[var(--backdrop-blur)]"
          style={{
            backgroundColor: 'var(--color-accent-secondary)',
            border: '1px solid var(--color-border-primary)'
          }}
        >
          <Icon className="h-5 w-5" style={{ color: 'var(--color-accent-primary)' }} />
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center">
          <span
            className={cn(
              "text-sm font-medium",
              change.trend === "up"
                ? "text-[var(--color-success)]"
                : "text-[var(--color-error)]"
            )}
          >
            {change.trend === "up" ? "+" : "-"}{Math.abs(change.value)}%
          </span>
          <span className="ml-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            from last month
          </span>
        </div>
      )}
    </Card>
  );
}
