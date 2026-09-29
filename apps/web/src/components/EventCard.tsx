import Link from "next/link";
import { ArrowUpRight, Clock, MapPin } from "lucide-react";
import { Event } from "@/lib/api";
import { cn, formatAmount, formatPrice } from "@/lib/utils";
import { DateBlock } from "@/components/ui/DateBlock";
import { cld, BANNER_CARD } from "@/lib/cloudinary";

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });

// Three poster treatments in the brand palette, picked from the slug so a grid has some rhythm.
const POSTERS = [
  { box: "ep-grid-bg bg-primary-subtle", org: "text-fg-muted" },
  { box: "bg-primary text-primary-fg [background-image:linear-gradient(rgb(255_255_255/0.12)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.12)_1px,transparent_1px)] [background-size:28px_28px]", org: "text-white/80" },
  { box: "bg-fg text-bg [background-image:linear-gradient(color-mix(in_srgb,var(--bg)_10%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_srgb,var(--bg)_10%,transparent)_1px,transparent_1px)] [background-size:28px_28px]", org: "opacity-70" },
];
const posterFor = (slug: string) => POSTERS[[...slug].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % POSTERS.length];

export default function EventCard({ event }: { event: Event }) {
  const poster = posterFor(event.slug);
  const lowestPrice = event.ticketTypes.length > 0 ? Math.min(...event.ticketTypes.map((t) => t.price)) : null;
  const multiplePrices = new Set(event.ticketTypes.map((t) => t.price)).size > 1;

  const totalSold = event.ticketTypes.reduce((s, t) => s + t.soldQuantity, 0);
  const totalCapacity = event.ticketTypes.reduce((s, t) => s + t.totalQuantity, 0);
  const remaining = totalCapacity - totalSold;
  const isSoldOut = totalCapacity > 0 && totalSold >= totalCapacity;
  const almostGone = !isSoldOut && totalCapacity > 0 && remaining / totalCapacity <= 0.15;

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-border-strong"
    >
      {/* Poster */}
      <div className={cn("relative aspect-[16/9] overflow-hidden border-b border-border", !event.bannerUrl && poster.box)}>
        {event.bannerUrl ? (
          <>
            <img src={cld(event.bannerUrl, BANNER_CARD)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
            <DateBlock iso={event.startsAt} className="absolute bottom-4 left-4 text-fg" />
          </>
        ) : (
          <>
            <DateBlock iso={event.startsAt} className="absolute bottom-4 left-4 text-fg" />
            <span className={cn("absolute right-4 top-4 max-w-[60%] truncate font-mono text-[10.5px] uppercase tracking-[0.12em]", poster.org)}>
              {event.organization?.name}
            </span>
          </>
        )}
        {isSoldOut && (
          <span className="absolute right-4 bottom-5 -rotate-6 rounded-md border-2 border-danger bg-surface/90 px-2 py-0.5 font-mono text-[12px] font-bold tracking-[0.12em] text-danger">
            SOLD OUT
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-[19px] font-semibold leading-tight tracking-[-0.02em] text-fg line-clamp-2">{event.title}</h3>
        <div className="mt-2 flex flex-col gap-1 text-[13px] text-fg-muted">
          <span className="inline-flex items-center gap-1.5">
            <Clock aria-hidden className="h-3.5 w-3.5 shrink-0" />
            <span className="tabular">
              {new Date(event.startsAt).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" })} · {time(event.startsAt)}
            </span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin aria-hidden className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <p className="font-display text-[20px] font-bold tracking-[-0.02em] text-fg">
              {lowestPrice === null ? "—" : multiplePrices ? `From ${formatAmount(lowestPrice)}` : formatPrice(lowestPrice)}
            </p>
            <p className={cn("mt-0.5 text-[12px]", isSoldOut ? "text-danger" : almostGone ? "text-warning" : "text-fg-subtle")}>
              {isSoldOut ? "Sold out" : almostGone ? `Only ${remaining} left` : `${remaining} left`}
            </p>
          </div>
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border-strong text-fg transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-fg"
          >
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
