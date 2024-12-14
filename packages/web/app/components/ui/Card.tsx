import { cn } from "../../utils/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "hover" | "interactive" | "gradient";
  size?: "sm" | "md" | "lg";
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  action?: React.ReactNode;
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({
  className,
  variant = "default",
  size = "md",
  ...props
}: CardProps) {
  const baseStyles = "glass-card";
  
  const variants = {
    default: "bg-background-lighter/50",
    hover: "bg-background-lighter/50 transition-all duration-200 hover:bg-background-lighter/70 hover:shadow-glow",
    interactive: "bg-background-lighter/50 transition-all duration-200 hover:bg-background-lighter/70 hover:shadow-glow cursor-pointer",
    gradient: "bg-card-gradient shadow-glow",
  };

  const sizes = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        "bg-glass-gradient",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  action,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 pb-4",
        action && "flex-row items-start justify-between",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold leading-none tracking-tight gradient-text",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-purple-300/70", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("pt-0", className)}
      {...props}
    />
  );
}

export function CardFooter({
  className,
  ...props
}: CardFooterProps) {
  return (
    <div
      className={cn("flex items-center pt-4", className)}
      {...props}
    />
  );
}
