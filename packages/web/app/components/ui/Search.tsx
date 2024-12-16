import { Search as SearchIcon } from "lucide-react";
import { cn } from "~/utils/cn";

interface SearchProps {
  className?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
}

export function Search({ className, placeholder = "Search...", onChange }: SearchProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 backdrop-blur-[var(--backdrop-blur)]",
        className
      )}
      style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <SearchIcon
        className="h-4 w-4"
        style={{ color: 'var(--color-text-tertiary)' }}
      />
      <input
        type="text"
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          "bg-transparent outline-none text-sm w-full",
          "placeholder:text-[var(--color-text-tertiary)]"
        )}
        style={{ color: 'var(--color-text-primary)' }}
      />
    </div>
  );
}
