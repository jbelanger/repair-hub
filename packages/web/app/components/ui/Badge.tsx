import { cn } from "~/utils/cn";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "primary" | "success" | "info" | "warning" | "danger";
  size?: "sm" | "md";
}

export function Badge({ 
  variant = "default", 
  size = "sm",
  className, 
  ...props 
}: BadgeProps) {
  const variants = {
    default: "bg-[var(--color-accent-secondary)] text-[var(--color-accent-primary)] border-[var(--color-border-primary)]",
    primary: "bg-[var(--color-accent-secondary)] text-[var(--color-accent-primary)] border-[var(--color-border-primary)]",
    success: "bg-[var(--color-success-bg)] text-[var(--color-success-text)] border-[var(--color-success-border)]",
    info: "bg-[var(--color-info-bg)] text-[var(--color-info-text)] border-[var(--color-info-border)]",
    warning: "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border-[var(--color-warning-border)]",
    danger: "bg-[var(--color-error-bg)] text-[var(--color-error-text)] border-[var(--color-error-border)]",
  };

  const sizes = {
    sm: "px-2.5 py-0.5 text-xs font-medium",
    md: "px-3 py-1 text-sm font-medium",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border backdrop-blur-[var(--backdrop-blur)]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
