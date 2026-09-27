import { cn } from "@/lib/utils";

/** Thin, flat capacity bar. Turns warning at 90% and danger when full. */
export function Meter({ value, max, className, label }: { value: number; max: number; className?: string; label?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const color = pct >= 100 ? "bg-danger" : pct >= 90 ? "bg-warning" : "bg-primary";
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
      className={cn("h-1 w-full overflow-hidden rounded-full bg-surface-muted", className)}
    >
      <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}
