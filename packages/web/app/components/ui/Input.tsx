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
      "relative flex items-center rounded-full overflow-hidden",
      "bg-transparent",
      "border",
      error
        ? "border-red-500"
        : "border-purple-600",
      "focus-within:border-purple-500",
      "hover:border-purple-500"
    );

    const inputStyles = cn(
      baseStyles,
      "bg-transparent px-5 py-2.5 outline-none",
      leftIcon && "pl-11",
      rightIcon && "pr-11",
      "text-white placeholder:text-white/50",
      "focus:ring-0",
      className
    );

    const iconStyles = "absolute inset-y-0 flex items-center text-purple-500";
    const leftIconStyles = cn(iconStyles, "left-4");
    const rightIconStyles = cn(iconStyles, "right-4");

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
