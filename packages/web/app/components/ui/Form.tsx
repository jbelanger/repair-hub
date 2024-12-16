import { cn } from "~/utils/cn";
import { Button } from "./Button";
import { Link } from "@remix-run/react";

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, error, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium text-white/70">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

interface FormSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ children, className }: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {children}
    </div>
  );
}

interface FormActionsProps {
  cancelHref?: string;
  cancelLabel?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  onSubmit?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  className?: string;
}

export function FormActions({ 
  cancelHref, 
  cancelLabel = "Cancel", 
  submitLabel = "Save",
  isSubmitting,
  onSubmit,
  className 
}: FormActionsProps) {
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onSubmit) {
      e.preventDefault();
      await onSubmit(e);
    }
  };

  return (
    <div className={cn("flex gap-4 pt-4", className)}>
      {cancelHref && (
        <Link to={cancelHref} className="flex-1">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
          >
            {cancelLabel}
          </Button>
        </Link>
      )}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="flex-1"
        disabled={isSubmitting}
        onClick={onSubmit ? handleSubmit : undefined}
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </div>
  );
}

interface FormErrorProps {
  error?: string;
  className?: string;
}

export function FormError({ error, className }: FormErrorProps) {
  if (!error) return null;
  
  return (
    <div className={cn(
      "rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-red-200",
      className
    )}>
      {error}
    </div>
  );
}

interface FormGridProps {
  children: React.ReactNode;
  columns?: number;
  className?: string;
}

export function FormGrid({ children, columns = 2, className }: FormGridProps) {
  return (
    <div className={cn(
      "grid gap-4",
      columns === 2 && "grid-cols-1 sm:grid-cols-2",
      columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      className
    )}>
      {children}
    </div>
  );
}
