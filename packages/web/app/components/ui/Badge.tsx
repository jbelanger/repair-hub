import { cn } from "~/utils/cn";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  size?: "sm" | "md";
}

export function Badge({ 
  variant = "default", 
  size = "sm",
  className, 
  ...props 
}: BadgeProps) {
  const variants = {
    default: "bg-purple-600/10 text-purple-200 border-purple-600/20",
    primary: "bg-blue-500/10 text-blue-200 border-blue-500/20",
    success: "bg-green-500/10 text-green-200 border-green-500/20",
    warning: "bg-yellow-500/10 text-yellow-200 border-yellow-500/20",
    danger: "bg-red-500/10 text-red-200 border-red-500/20",
  };

  const sizes = {
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
