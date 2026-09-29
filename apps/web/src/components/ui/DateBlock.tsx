import { cn } from "@/lib/utils";

const parts = (iso: string) => {
  const d = new Date(iso);
  const opt = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-IN", { ...o, timeZone: "Asia/Kolkata" });
  return { weekday: opt({ weekday: "short" }).toUpperCase(), day: opt({ day: "numeric" }), month: opt({ month: "short" }).toUpperCase() };
};

/** Calendar-page style date: weekday, big day number, month. */
export function DateBlock({ iso, size = "md", className }: { iso: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const { weekday, day, month } = parts(iso);
  const s = {
    sm: { box: "h-12 w-12 rounded-lg", day: "text-[20px]", small: "text-[9px]" },
    md: { box: "h-16 w-16 rounded-xl", day: "text-[28px]", small: "text-[10px]" },
    lg: { box: "h-24 w-24 rounded-2xl", day: "text-[44px]", small: "text-[11px]" },
  }[size];
  return (
    <div
      aria-label={`${weekday} ${day} ${month}`}
      className={cn("flex shrink-0 flex-col items-center justify-center border border-border bg-surface leading-none", s.box, className)}
    >
      <span className={cn("font-mono tracking-[0.12em] text-primary-text", s.small)}>{weekday}</span>
      <span className={cn("ep-display my-0.5 tabular", s.day)}>{day}</span>
      <span className={cn("font-mono tracking-[0.12em] text-fg-muted", s.small)}>{month}</span>
    </div>
  );
}
