"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/utils";

export interface DayPoint {
  /** yyyy-mm-dd in IST */
  day: string;
  value: number;
}

const fmtDay = (d: string) =>
  new Date(d + "T00:00:00+05:30").toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

/**
 * Single-series daily bar chart. Flat bars in the accent colour, recessive grid,
 * per-bar hover readout, and a screen-reader table with the same numbers.
 */
export function DailyBarChart({ data, unit, height = 132 }: { data: DayPoint[]; unit: string; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  // Round the axis max up to a readable step.
  const step = max <= 5 ? 1 : max <= 20 ? 5 : max <= 100 ? 10 : Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / step) * step;
  const active = hover !== null ? data[hover] : null;

  return (
    <figure className="m-0">
      <div className="mb-2 flex h-5 items-baseline justify-between text-[12px] text-fg-muted tabular" aria-live="polite">
        {active ? (
          <span>
            <span className="text-fg">{fmtDay(active.day)}</span> · {formatNumber(active.value)} {unit}
          </span>
        ) : (
          <span>Hover or tap a bar for the daily count</span>
        )}
      </div>

      <div className="relative flex" style={{ height }}>
        {/* y-axis labels */}
        <div className="flex w-8 shrink-0 flex-col justify-between pr-2 text-right font-mono text-[11px] leading-none text-fg-subtle tabular" aria-hidden>
          <span>{top}</span>
          <span>{top / 2 === Math.floor(top / 2) ? top / 2 : ""}</span>
          <span>0</span>
        </div>

        <div className="relative flex-1" aria-hidden>
          {/* grid */}
          <div className="absolute inset-x-0 top-0 border-t border-dashed border-border" />
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border" />
          <div className="absolute inset-x-0 bottom-0 border-t border-border-strong" />

          <div className="absolute inset-0 flex items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
            {data.map((d, i) => {
              const h = (d.value / top) * 100;
              return (
                <div
                  key={d.day}
                  className="flex h-full flex-1 cursor-default items-end"
                  onMouseEnter={() => setHover(i)}
                >
                  <div
                    className={`w-full rounded-t-[3px] transition-opacity ${d.value === 0 ? "" : "bg-primary"} ${
                      hover !== null && hover !== i ? "opacity-40" : ""
                    }`}
                    style={{ height: d.value === 0 ? 0 : `max(${h}%, 2px)` }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* x-axis: first, middle, last */}
      <div className="ml-8 mt-1.5 flex justify-between font-mono text-[11px] text-fg-subtle" aria-hidden>
        <span>{data[0] && fmtDay(data[0].day)}</span>
        <span>{data[Math.floor(data.length / 2)] && fmtDay(data[Math.floor(data.length / 2)].day)}</span>
        <span>{data.length > 0 && "Today"}</span>
      </div>

      <table className="sr-only">
        <caption>Daily {unit}</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>{unit}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}>
              <td>{fmtDay(d.day)}</td>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
