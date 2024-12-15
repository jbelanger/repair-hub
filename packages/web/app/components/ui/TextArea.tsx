import { forwardRef } from "react";
import { cn } from "../../utils/cn";

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  leftIcon?: React.ReactNode;
  error?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, leftIcon, error, ...props }, ref) => {
    const containerStyles = cn(
      "relative flex rounded-lg overflow-hidden",
      "bg-transparent",
      "border",
      error
        ? "border-red-500"
        : "border-purple-600",
      "focus-within:border-purple-500",
      "hover:border-purple-500"
    );

    const textareaStyles = cn(
      "w-full transition-all duration-200",
      "bg-transparent px-5 py-3 outline-none",
      leftIcon && "pl-11",
      "text-white placeholder:text-white/50",
      "focus:ring-0",
      "min-h-[120px]",
      "resize-none",
      className
    );

    const iconStyles = "absolute top-3 left-4 text-purple-500";

    return (
      <div className={containerStyles}>
        {leftIcon && (
          <div className={iconStyles}>
            {leftIcon}
          </div>
        )}
        <textarea 
          className={textareaStyles} 
          ref={ref} 
          {...props} 
        />
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
