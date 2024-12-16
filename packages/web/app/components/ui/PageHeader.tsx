import { ArrowLeft } from "lucide-react";
import { Button } from "./Button";
import { Link } from "@remix-run/react";

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
}

export function PageHeader({ title, subtitle, backTo, action }: PageHeaderProps) {
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
      {action && (
        action.href ? (
          <Link to={action.href} prefetch="intent">
            <Button>
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          </Link>
        ) : (
          <Button onClick={action.onClick}>
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}
