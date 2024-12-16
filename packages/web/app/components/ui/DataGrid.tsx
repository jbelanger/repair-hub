import { cn } from "~/utils/cn";
import { Card } from "./Card";
import { EmptyState } from "./EmptyState";
import type { LucideIcon } from "lucide-react";

interface DataGridProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  columns?: number;
  gap?: number;
  emptyState?: {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: {
      label: string;
      href?: string;
      onClick?: () => void;
      icon?: React.ReactNode;
    };
  };
  className?: string;
}

export function DataGrid<T>({ 
  items,
  renderItem,
  columns = 3,
  gap = 6,
  emptyState,
  className
}: DataGridProps<T>) {
  if (items.length === 0 && emptyState) {
    return (
      <EmptyState
        icon={emptyState.icon}
        title={emptyState.title}
        description={emptyState.description}
        action={emptyState.action}
      />
    );
  }

  return (
    <div 
      className={cn(
        "grid gap-6",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 lg:grid-cols-2",
        columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
        className
      )}
      style={{ gap: `${gap * 0.25}rem` }}
    >
      {items.map((item, index) => (
        <div key={index}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}

// Specialized variants for common use cases
interface DataListProps<T> extends Omit<DataGridProps<T>, 'columns'> {
  divided?: boolean;
}

export function DataList<T>({ 
  items,
  renderItem,
  gap = 4,
  emptyState,
  divided,
  className
}: DataListProps<T>) {
  if (items.length === 0 && emptyState) {
    return (
      <EmptyState
        icon={emptyState.icon}
        title={emptyState.title}
        description={emptyState.description}
        action={emptyState.action}
      />
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {items.map((item, index) => (
        <div 
          key={index}
          className={cn(
            divided && index !== items.length - 1 && "border-b border-white/[0.08] pb-4"
          )}
          style={{ marginTop: index === 0 ? 0 : `${gap * 0.25}rem` }}
        >
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}

interface DataTableProps<T> extends Omit<DataGridProps<T>, 'columns' | 'renderItem'> {
  columns: {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
  }[];
  onRowClick?: (item: T) => void;
}

export function DataTable<T>({
  items,
  columns,
  emptyState,
  onRowClick,
  className
}: DataTableProps<T>) {
  if (items.length === 0 && emptyState) {
    return (
      <EmptyState
        icon={emptyState.icon}
        title={emptyState.title}
        description={emptyState.description}
        action={emptyState.action}
      />
    );
  }

  return (
    <Card className={className}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.08]">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={cn(
                    "px-6 py-3 text-left text-sm font-medium text-white/70",
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  "border-b border-white/[0.08] last:border-0",
                  onRowClick && "cursor-pointer hover:bg-white/[0.02]"
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn(
                      "px-6 py-4 text-sm whitespace-nowrap",
                      column.className
                    )}
                  >
                    {typeof column.accessor === 'function'
                      ? column.accessor(item)
                      : String(item[column.accessor])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
