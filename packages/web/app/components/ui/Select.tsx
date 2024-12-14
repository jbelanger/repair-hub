import { forwardRef } from "react";
import { cn } from "../../utils/cn";
import { UserCircle2 } from "lucide-react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  leftIcon?: React.ReactNode;
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, leftIcon = <UserCircle2 className="h-5 w-5" />, error, value, ...props }, ref) => {
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

    const selectStyles = cn(
      baseStyles,
      "bg-transparent pl-11 pr-10 py-2.5 outline-none appearance-none",
      !value && "text-white/50", // Apply placeholder styling when no value is selected
      value && "text-white", // Apply normal text color when value is selected
      "focus:ring-0",
      className
    );

    const iconStyles = "absolute inset-y-0 flex items-center text-purple-500 left-4";

    return (
      <div className={containerStyles}>
        <div className={iconStyles}>
          {leftIcon}
        </div>
        <select 
          className={selectStyles} 
          ref={ref}
          value={value}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-purple-500">
          <svg 
            width="12" 
            height="8" 
            viewBox="0 0 12 8" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M1 1.5L6 6.5L11 1.5" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    );
  }
);

Select.displayName = "Select";
