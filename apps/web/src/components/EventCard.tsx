import Link from "next/link";
import { Event } from "@/lib/api";
import { formatAmount, formatPrice, formatSchedule } from "@/lib/utils";
import { Status } from "@/components/ui/Status";

function DateTile({ iso }: { iso: string }) {
  const d = new Date(iso);
  const month = d.toLocaleDateString("en-IN", { month: "short", timeZone: "Asia/Kolkata" }).toUpperCase();
  const day = d.toLocaleDateString("en-IN", { day: "numeric", timeZone: "Asia/Kolkata" });
  return (
    <div aria-hidden className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md border border-border bg-surface-muted leading-none">
      <span className="font-mono text-[10px] tracking-wider text-fg-muted">{month}</span>
      <span className="mt-0.5 text-[17px] font-semibold tabular text-fg">{day}</span>
    </div>
  );
}

export default function EventCard({ event }: { event: Event }) {
  const lowestPrice = event.ticketTypes.length > 0 ? Math.min(...event.ticketTypes.map((t) => t.price)) : null;
  const multiplePrices = new Set(event.ticketTypes.map((t) => t.price)).size > 1;

  const totalSold = event.ticketTypes.reduce((s, t) => s + t.soldQuantity, 0);
  const totalCapacity = event.ticketTypes.reduce((s, t) => s + t.totalQuantity, 0);
  const remaining = totalCapacity - totalSold;
  const isSoldOut = totalCapacity > 0 && totalSold >= totalCapacity;
  const almostGone = !isSoldOut && totalCapacity > 0 && remaining / totalCapacity <= 0.1;

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-border-strong"
    >
      {event.bannerUrl && (
        <div className="aspect-[2/1] border-b border-border bg-surface-muted">
          <img src={event.bannerUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex gap-3">
          {!event.bannerUrl && <DateTile iso={event.startsAt} />}
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-[15px] font-medium leading-snug text-fg group-hover:underline group-hover:underline-offset-2">
              {event.title}
            </h3>
            <p className="mt-0.5 font-mono text-[12px] text-fg-muted tabular">{formatSchedule(event.startsAt)}</p>
          </div>
        </div>
        <p className="mb-3 mt-2 truncate text-[13px] text-fg-muted">{event.venue}</p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-2.5 text-[13px]">
          <span className="font-medium text-fg">
            {lowestPrice === null ? "—" : multiplePrices ? `From ${formatAmount(lowestPrice)}` : formatPrice(lowestPrice)}
          </span>
          {isSoldOut ? (
            <Status tone="danger">Sold out</Status>
          ) : almostGone ? (
            <Status tone="warning">{remaining} left</Status>
          ) : (
            <span className="truncate text-[12px] text-fg-subtle">{event.organization?.name}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
