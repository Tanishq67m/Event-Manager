import { cn, formatTime } from "@/lib/utils";

export interface ActivityEntry {
  id: string;
  at: string;
  kind: "booking" | "checkin";
  event?: string;
  attendee: string;
  detail?: string;
}

const kindLabel = { booking: "BOOKED", checkin: "CHECK-IN" } as const;
const kindColor = { booking: "text-primary", checkin: "text-success" } as const;

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const same = d.toDateString() === today.toDateString();
  return same
    ? ""
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", timeZone: "Asia/Kolkata" });
}

/** Log-style feed: monospace timestamp, event type, then human-readable context. */
export function ActivityLog({ entries, showEvent = true }: { entries: ActivityEntry[]; showEvent?: boolean }) {
  return (
    <ol className="divide-y divide-border font-mono text-[12px]">
      {entries.map((e) => (
        <li
          key={e.id}
          className={cn(
            "grid grid-cols-[auto_auto_minmax(0,1fr)] items-baseline gap-x-3 px-3 py-2",
            showEvent && "sm:grid-cols-[136px_80px_minmax(0,1fr)_minmax(0,1.2fr)]"
          )}
        >
          <time dateTime={e.at} className="whitespace-nowrap text-fg-subtle tabular" title={new Date(e.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}>
            {dayLabel(e.at) && <span className="mr-1">{dayLabel(e.at)}</span>}
            {formatTime(e.at)}
          </time>
          <span className={cn("font-medium", kindColor[e.kind])}>{kindLabel[e.kind]}</span>
          <span className="truncate font-sans text-[13px] text-fg">
            {e.attendee}
            {e.detail && <span className="text-fg-muted"> · {e.detail}</span>}
          </span>
          {showEvent && e.event && (
            <span className="col-span-3 truncate font-sans text-[12px] text-fg-muted sm:col-span-1 sm:text-[13px]">{e.event}</span>
          )}
        </li>
      ))}
    </ol>
  );
}
