import { cn } from "~/utils/cn";
import { Button, LinkButton } from "./Button";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

export function EmptyState({ 
  icon: Icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "rounded-[var(--card-radius)] transition-all duration-200 backdrop-blur-[var(--backdrop-blur)] text-center p-6",
      "bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--shadow-md)]",
      className
    )}>
      {Icon && (
        <div className="mx-auto w-12 h-12 rounded-full bg-[var(--color-accent-secondary)] flex items-center justify-center mb-4">
          <Icon className="h-6 w-6" style={{ color: 'var(--color-accent-primary)' }} />
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
        {title}
      </h3>
      {description && (
        <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          {description}
        </p>
      )}
      {action && (
        action.href ? (
          <LinkButton to={action.href} leftIcon={action.icon}>
            {action.label}
          </LinkButton>
        ) : (
          <Button onClick={action.onClick} leftIcon={action.icon}>
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}

// Specialized empty states for common use cases
interface NoResultsProps {
  searchTerm?: string;
  className?: string;
}

export function NoResults({ searchTerm, className }: NoResultsProps) {
  return (
    <EmptyState
      title="No results found"
      description={searchTerm ? `No results found for "${searchTerm}"` : "No matching items found"}
      className={className}
    />
  );
}

interface NoAccessProps {
  message?: string;
  className?: string;
}

export function NoAccess({ message = "You don't have access to this resource", className }: NoAccessProps) {
  return (
    <EmptyState
      title="Access Denied"
      description={message}
      className={className}
    />
  );
}

interface ConnectWalletPromptProps {
  message?: string;
  className?: string;
}

export function ConnectWalletPrompt({ 
  message = "Please connect your wallet to continue",
  className 
}: ConnectWalletPromptProps) {
  return (
    <EmptyState
      title="Connect Wallet"
      description={message}
      className={className}
    />
  );
}
