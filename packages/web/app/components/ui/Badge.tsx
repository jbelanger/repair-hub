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
    default: "bg-purple-600/20 text-purple-100 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.1)]",
    primary: "bg-blue-500/20 text-blue-100 border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.1)]",
    success: "bg-green-500/20 text-green-100 border-green-500/40 shadow-[0_0_10px_rgba(34,197,94,0.1)]",
    warning: "bg-yellow-500/20 text-yellow-100 border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.1)]",
    danger: "bg-red-500/20 text-red-100 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.1)]",
  };

  const sizes = {
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border font-semibold border-[1.5px]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
