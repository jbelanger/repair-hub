import { forwardRef } from "react";
import { cn } from "~/utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, as: Component = "div", ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          "rounded-xl border border-white/[0.08] bg-[#0F0F0F]",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

export { Card };
