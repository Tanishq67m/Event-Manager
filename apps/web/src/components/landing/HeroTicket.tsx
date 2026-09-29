import { Check } from "lucide-react";
import { Event } from "@/lib/api";
import { formatAmount, formatPrice } from "@/lib/utils";
import { Ticket, Perforation } from "@/components/ui/Ticket";
import { Barcode } from "@/components/ui/Barcode";

const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleString("en-IN", { ...o, timeZone: "Asia/Kolkata" });

/**
 * Hero illustration: a paper ticket for the next event on sale (real data),
 * or a clearly labelled example when nothing is on sale yet.
 */
export function HeroTicket({ event, loading }: { event?: Event; loading?: boolean }) {
  const example = !event;
  const title = event?.title ?? "Your event";
  const org = event?.organization?.name ?? "Your organization";
  const date = event ? fmt(event.startsAt, { weekday: "short", day: "numeric", month: "short" }) : "Sat, 14 Nov";
  const time = event ? fmt(event.startsAt, { hour: "2-digit", minute: "2-digit", hour12: false }) : "19:00";
  const venue = event?.venue ?? "Your venue";
  const low = event && event.ticketTypes.length ? Math.min(...event.ticketTypes.map((t) => t.price)) : null;
  const multiple = event ? new Set(event.ticketTypes.map((t) => t.price)).size > 1 : false;
  const price = example ? "From ₹199" : low === null ? "Free" : multiple ? `From ${formatAmount(low)}` : formatPrice(low);

  return (
    <div className="ep-grid-bg relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-3xl border border-border bg-surface-muted/60 px-6 py-12 sm:min-h-[480px]">
      {loading ? (
        <div className="ep-skeleton h-[380px] w-[300px] rounded-2xl" />
      ) : (
        <div className="relative">
          <Ticket notch="68%" className="w-[292px] -rotate-[4deg] sm:w-[312px]">
            <div className="p-5">
              <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.14em] text-paper-muted">
                <span>ADMIT ONE</span>
                <span className="max-w-[55%] truncate">{org.toUpperCase()}</span>
              </div>
              <p className="ep-display mt-5 text-[30px] leading-[1.02] line-clamp-3">{title}</p>
              <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
                <div>
                  <dt className="font-mono text-[10px] tracking-[0.12em] text-paper-muted">DATE</dt>
                  <dd className="mt-0.5 font-semibold">{date}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] tracking-[0.12em] text-paper-muted">TIME</dt>
                  <dd className="mt-0.5 font-semibold tabular">{time}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="font-mono text-[10px] tracking-[0.12em] text-paper-muted">VENUE</dt>
                  <dd className="mt-0.5 truncate font-semibold">{venue}</dd>
                </div>
              </dl>
            </div>
            <Perforation />
            <div className="px-5 pb-5 pt-4">
              <Barcode value={event?.id ?? "example"} className="text-paper-ink" />
              <p className="mt-2 text-center font-mono text-[10.5px] tracking-[0.2em] text-paper-muted">
                {example ? "EXAMPLE TICKET" : "EP-2026-••••••••"}
              </p>
            </div>
          </Ticket>

          {/* Price tag */}
          <div className="absolute -right-6 top-8 rotate-[5deg] rounded-xl bg-primary px-3 py-2 text-primary-fg shadow-lg shadow-primary/25 sm:-right-10">
            <p className="font-mono text-[9.5px] tracking-[0.14em] opacity-80">TICKETS</p>
            <p className="font-display text-[17px] font-bold leading-tight tracking-[-0.02em]">{price}</p>
          </div>

          {/* Scan result */}
          <div className="absolute -bottom-6 -left-8 flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2.5 shadow-lg shadow-black/10 sm:-left-14">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-success text-white">
              <Check aria-hidden className="h-4 w-4" strokeWidth={3} />
            </span>
            <div className="leading-tight">
              <p className="text-[13px] font-semibold">Admit</p>
              <p className="font-mono text-[10.5px] text-fg-muted">Scanned at the door</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
