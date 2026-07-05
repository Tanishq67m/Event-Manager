import Link from "next/link";
import { Event } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/utils";

export default function EventCard({ event }: { event: Event }) {
  const lowestPrice = event.ticketTypes.length > 0
    ? Math.min(...event.ticketTypes.map((t) => t.price))
    : null;

  const totalSold = event.ticketTypes.reduce((s, t) => s + t.soldQuantity, 0);
  const totalCapacity = event.ticketTypes.reduce((s, t) => s + t.totalQuantity, 0);
  const isSoldOut = totalCapacity > 0 && totalSold >= totalCapacity;

  return (
    <Link href={`/events/${event.slug}`} className="h-full block">
      <article className="glass-card hover:border-violet-500/40 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col">
        {/* Banner */}
        <div className="h-44 bg-gradient-to-br from-violet-950/30 to-indigo-950/30 flex items-center justify-center relative border-b border-white/5">
          {event.bannerUrl ? (
            <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="text-violet-400 text-5xl select-none animate-pulse">🎯</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">EventPulse</span>
            </div>
          )}
          {isSoldOut && (
            <div className="absolute inset-0 bg-[#08070d]/70 flex items-center justify-center backdrop-blur-[2px]">
              <span className="ep-badge-red text-xs font-bold px-3 py-1 shadow-[0_0_10px_rgba(244,63,94,0.4)]">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1 gap-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-bold text-white text-base leading-snug line-clamp-2 group-hover:text-violet-400 transition-colors">
              {event.title}
            </h3>
            {lowestPrice !== null && (
              <span className="ep-badge-blue shrink-0 text-xs font-bold px-2.5 py-0.5 shadow-sm">
                {lowestPrice === 0 ? "Free" : formatPrice(lowestPrice)}
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs text-gray-400">
            <p className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{event.venue}</span>
            </p>

            <p className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(event.startsAt)}</span>
            </p>
          </div>

          <div className="mt-auto pt-3 flex items-center justify-between border-t border-white/5 text-[11px] text-gray-500 font-medium">
            <span className="truncate max-w-[120px]">{event.organization.name}</span>
            <span className={isSoldOut ? "text-rose-400" : "text-violet-400"}>
              {totalSold}/{totalCapacity} registered
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
