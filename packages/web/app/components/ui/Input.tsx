import { forwardRef } from "react";
import { cn } from "../../utils/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightIcon, error, ...props }, ref) => {
    const baseStyles = "w-full transition-all duration-200";
    const containerStyles = cn(
      "relative flex items-center rounded-lg overflow-hidden",
      "bg-white/[0.02] backdrop-blur-sm",
      "ring-1",
      error
        ? "ring-red-500/20 focus-within:ring-red-500/30"
        : "ring-white/[0.04] focus-within:ring-purple-500/20",
      "shadow-sm focus-within:shadow-glow",
      error
        ? "focus-within:shadow-red-500/10"
        : "focus-within:shadow-purple-500/10",
      "hover:bg-white/[0.04]",
      "bg-glass-gradient"
    );

    const inputStyles = cn(
      baseStyles,
      "bg-transparent px-4 py-2 outline-none",
      leftIcon && "pl-10",
      rightIcon && "pr-10",
      "text-purple-300 placeholder:text-purple-300/50",
      "focus:ring-0",
      className
    );

    const iconStyles = "absolute inset-y-0 flex items-center text-purple-300/50";
    const leftIconStyles = cn(iconStyles, "left-3");
    const rightIconStyles = cn(iconStyles, "right-3");

    return (
      <div className={containerStyles}>
        {leftIcon && (
          <div className={leftIconStyles}>
            {leftIcon}
          </div>
        )}
        <input 
          type={type} 
          className={inputStyles} 
          ref={ref} 
          {...props} 
        />
        {rightIcon && (
          <div className={rightIconStyles}>
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
