import { cn } from "@/lib/utils";

export interface Metric {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
}

/**
 * A row of key numbers separated by hairlines — one bordered strip, not a grid of cards.
 * Collapses to two columns on small screens.
 */
export function MetricStrip({ metrics, className }: { metrics: Metric[]; className?: string }) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-surface",
        metrics.length >= 4 ? "lg:grid-cols-4" : metrics.length === 3 ? "sm:grid-cols-3" : "",
        className
      )}
    >
      {metrics.map((m, i) => (
        <div
          key={m.label}
          className={cn(
            "border-border px-4 py-3",
            i % 2 === 1 && "border-l",
            i >= 2 && "border-t",
            metrics.length >= 4 && "lg:border-t-0",
            metrics.length >= 4 && i > 0 && "lg:border-l",
            metrics.length === 3 && "sm:border-t-0",
            metrics.length === 3 && i > 0 && "sm:border-l"
          )}
        >
          <dt className="text-[12px] text-fg-muted">{m.label}</dt>
          <dd className="mt-1 text-lg font-semibold tracking-tight text-fg tabular">{m.value}</dd>
          {m.detail && <dd className="mt-0.5 text-[12px] text-fg-subtle tabular">{m.detail}</dd>}
        </div>
      ))}
    </dl>
  );
}
