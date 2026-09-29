"use client";

import { useEffect, useState } from "react";

/** "Starts in 12d : 04h : 31m", recomputed every 30 seconds. Shows nothing once the event has started. */
export function Countdown({ to, label, className }: { to: string; label?: string; className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // Rendered after mount so server and client HTML match.
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  if (now === null) return null;
  const ms = new Date(to).getTime() - now;
  if (ms <= 0) return null;
  const d = Math.floor(ms / 864e5);
  const h = Math.floor((ms % 864e5) / 36e5);
  const m = Math.floor((ms % 36e5) / 6e4);
  const cell = (v: number, label: string) => (
    <div className="text-center">
      <div className="ep-display text-[34px] tabular sm:text-[40px]">{String(v).padStart(2, "0")}</div>
      <div className="mt-1 font-mono text-[10px] tracking-[0.12em] text-fg-muted">{label}</div>
    </div>
  );
  return (
    <div className={className} role="timer" aria-label={`Starts in ${d} days ${h} hours ${m} minutes`}>
      {label && <p className="ep-overline mb-2">{label}</p>}
      <div className="inline-flex items-start gap-3 sm:gap-4">
      {cell(d, "DAYS")}
      <span aria-hidden className="ep-display text-[30px] text-fg-subtle sm:text-[36px]">:</span>
      {cell(h, "HOURS")}
      <span aria-hidden className="ep-display text-[30px] text-fg-subtle sm:text-[36px]">:</span>
      {cell(m, "MINUTES")}
      </div>
    </div>
  );
}
