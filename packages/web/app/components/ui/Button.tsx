import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../utils/cn";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-[#7B5CFF] hover:bg-[#8C75FF] text-white rounded-lg shadow-lg shadow-purple-500/20",
      secondary: "bg-white/[0.03] hover:bg-white/[0.06] text-purple-300 rounded-lg ring-1 ring-white/[0.04]",
      outline: "border border-white/[0.04] bg-transparent hover:bg-white/[0.02] text-purple-300 rounded-lg",
      ghost: "bg-transparent hover:bg-white/[0.02] text-purple-300 rounded-lg",
    };

    const sizes = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
      icon: "h-9 w-9",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          isLoading && "relative text-transparent transition-none hover:text-transparent",
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-current" />
          </div>
        )}
        <span className="flex items-center gap-2">
          {!isLoading && leftIcon}
          {children}
          {!isLoading && rightIcon}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";
