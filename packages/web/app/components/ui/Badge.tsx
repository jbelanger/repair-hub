import { cn } from "../../utils/cn";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  ...props
}: BadgeProps) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors";
  
  const variants = {
    default: "glass-button",
    primary: "bg-purple-500/10 text-purple-300 ring-1 ring-purple-500/20",
    secondary: "bg-pink-500/10 text-pink-300 ring-1 ring-pink-500/20",
    success: "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20",
    danger: "bg-red-500/10 text-red-300 ring-1 ring-red-500/20",
    outline: "border border-white/[0.04] text-purple-300/80",
    ghost: "bg-white/[0.02] text-purple-300/80 hover:bg-white/[0.04] hover:text-purple-300",
  };

  const sizes = {
    sm: "h-5 px-2 text-xs",
    md: "h-6 px-2.5 text-sm",
    lg: "h-7 px-3 text-base",
  };

  return (
    <div
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        "rounded-full shadow-glow-sm backdrop-blur-sm",
        "bg-glass-gradient",
        className
      )}
      {...props}
    />
  );
}
