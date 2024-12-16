import { forwardRef } from "react";
import { cn } from "~/utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  variant?: "default" | "empty" | "interactive" | "property";
  header?: {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    iconBackground?: boolean;
    extra?: React.ReactNode;
  };
  stats?: Array<{
    value: number | string;
    label: string;
  }>;
  hover?: boolean;
  accent?: "none" | "purple" | "primary" | "secondary";
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, as: Component = "div", variant = "default", header, stats, hover, accent = "none", children, ...props }, ref) => {
    const baseStyles = "rounded-[var(--card-radius)] transition-all duration-200 backdrop-blur-[var(--backdrop-blur)]";
    const variantStyles = {
      default: "p-4",
      empty: "p-6 text-center",
      interactive: "p-4 hover:border-[var(--color-border-hover)] hover:bg-white/[0.02]",
      property: "p-6 hover:border-[var(--color-border-hover)]"
    };
    const accentStyles = {
      none: "",
      purple: "bg-purple-600/5",
      primary: "bg-[var(--color-accent-primary)]/5",
      secondary: "bg-[var(--color-accent-secondary)]/5"
    };

    const cardStyles = cn(
      baseStyles,
      variantStyles[variant],
      accentStyles[accent],
      hover && "hover:border-[var(--color-border-hover)] hover:bg-white/[0.02]",
      "bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--shadow-md)]",
      className
    );

    return (
      <Component ref={ref} className={cardStyles} {...props}>
        {header && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {header.icon && header.iconBackground ? (
                <div
                  className="p-2 rounded-lg backdrop-blur-[var(--backdrop-blur)]"
                  style={{
                    backgroundColor: 'var(--color-accent-secondary)',
                    border: '1px solid var(--color-border-primary)'
                  }}
                >
                  <div style={{ color: 'var(--color-accent-primary)' }}>
                    {header.icon}
                  </div>
                </div>
              ) : header.icon ? (
                <div style={{ color: 'var(--color-text-secondary)' }}>
                  {header.icon}
                </div>
              ) : null}
              <div>
                <h3 className="font-medium line-clamp-1" style={{ color: 'var(--color-text-primary)' }}>
                  {header.title}
                </h3>
                {header.subtitle && (
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {header.subtitle}
                  </p>
                )}
              </div>
            </div>
            {header.extra && (
              <div>{header.extra}</div>
            )}
          </div>
        )}
        {children}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {stat.value}
                </div>
                <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </Component>
    );
  }
);

Card.displayName = "Card";

// Sub-components for semantic structure
const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-between p-6", className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardHeader.displayName = "CardHeader";

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-6 py-4", className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardContent.displayName = "CardContent";

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardContent, CardFooter };
