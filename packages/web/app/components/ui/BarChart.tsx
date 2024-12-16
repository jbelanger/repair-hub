import { cn } from "~/utils/cn";

interface BarChartProps {
  data: {
    label: string;
    value: number;
    color?: string;
  }[];
  className?: string;
}

export function BarChart({ data, className }: BarChartProps) {
  // Find the maximum value for scaling
  const maxValue = Math.max(...data.map(item => item.value));

  return (
    <div
      className={cn(
        "p-6 rounded-[var(--card-radius)] transition-all duration-200 backdrop-blur-[var(--backdrop-blur)]",
        className
      )}
      style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        boxShadow: 'var(--shadow-md)'
      }}
    >
      <div className="flex items-end justify-between h-48 gap-4">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full relative flex items-end justify-center h-40">
              <div
                className="w-full rounded-lg transition-all duration-500 backdrop-blur-[var(--backdrop-blur)]"
                style={{
                  height: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color || 'var(--color-chart-1)',
                  border: '1px solid var(--color-border-primary)'
                }}
              />
            </div>
            <span style={{ color: 'var(--color-text-tertiary)' }} className="text-xs">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
