import { ArrowLeft, type LucideIcon } from "lucide-react";
import { Button } from "./Button";
import { Link } from "@remix-run/react";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  action?: {
    label: string;
    icon?: React.ReactNode;
    href?: string;
    onClick?: () => void;
  };
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, backTo, action, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        {backTo && (
          <Link to={backTo}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        )}
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions ? (
        actions
      ) : action && (
        action.href ? (
          <Link
            to={action.href}
            className="inline-flex items-center justify-center font-medium transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none h-10 px-5 text-base bg-purple-600 hover:bg-purple-500 text-white rounded-full"
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </Link>
        ) : (
          <Button onClick={action.onClick} leftIcon={action.icon}>
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}
