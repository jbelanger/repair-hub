import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../utils/cn";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "dark" | "blue" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-purple-600 hover:bg-purple-500 text-white rounded-full",
      secondary: "bg-transparent border border-purple-600 text-purple-600 hover:bg-purple-600/5 rounded-full",
      dark: "bg-gray-800 hover:bg-gray-700 text-white rounded-full",
      blue: "bg-blue-500 hover:bg-blue-400 text-white rounded-full",
      ghost: "bg-transparent hover:bg-white/[0.02] text-white/70 hover:text-white rounded-lg",
    };

    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-10 px-5 text-base",
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
