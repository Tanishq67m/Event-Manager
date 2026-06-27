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
    <Link href={`/events/${event.slug}`}>
      <article className="ep-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 overflow-hidden cursor-pointer h-full flex flex-col">
        {/* Banner */}
        <div className="h-40 bg-gradient-to-br from-[#E6F1FB] to-[#c9dff5] flex items-center justify-center relative">
          {event.bannerUrl ? (
            <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[#1A56A4] text-4xl select-none">🎯</span>
          )}
          {isSoldOut && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="ep-badge bg-black/60 text-white text-xs font-semibold">Sold out</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1 gap-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{event.title}</h3>
            {lowestPrice !== null && (
              <span className="ep-badge-blue shrink-0 text-xs">{formatPrice(lowestPrice)}</span>
            )}
          </div>

          <p className="text-xs text-gray-500 flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {event.venue}
          </p>

          <p className="text-xs text-gray-500 flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(event.startsAt)}
          </p>

          <div className="mt-auto pt-2 flex items-center justify-between border-t border-gray-50">
            <span className="text-xs text-gray-400">{event.organization.name}</span>
            <span className="text-xs text-gray-400">{totalSold}/{totalCapacity} registered</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
