import { cn } from "~/utils/cn";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  leftLabel?: string;
  rightLabel?: string;
  className?: string;
}

export function Switch({ checked, onChange, leftLabel, rightLabel, className }: SwitchProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {leftLabel && (
        <span className={cn(
          "text-sm font-medium",
          checked ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-gray-100"
        )}>
          {leftLabel}
        </span>
      )}
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900",
          checked ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
      {rightLabel && (
        <span className={cn(
          "text-sm font-medium",
          checked ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"
        )}>
          {rightLabel}
        </span>
      )}
    </div>
  );
}
