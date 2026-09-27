"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Link2, MapPin, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { events, bookings, Event, TicketType } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn, formatAmount, formatPrice } from "@/lib/utils";
import EventCard from "@/components/EventCard";
import { Notice } from "@/components/ui/Notice";
import { Status } from "@/components/ui/Status";

function timeRange(startIso: string, endIso: string) {
  const t = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
  const date = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  const sameDay = date(startIso) === date(endIso);
  return sameDay ? `${date(startIso)}, ${t(startIso)}–${t(endIso)} IST` : `${date(startIso)} ${t(startIso)} – ${date(endIso)} ${t(endIso)} IST`;
}

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [relatedEvents, setRelatedEvents] = useState<Event[]>([]);

  useEffect(() => {
    events.bySlug(slug)
      .then((res) => {
        setEvent(res);
        // Other published events, for the "More events" strip
        events.list({ limit: 4 }).then((r) => {
          setRelatedEvents(r.data.filter((e) => e.id !== res.id).slice(0, 3));
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    setQuantity(1);
  }, [selectedTicket]);

  async function handleBook() {
    if (!user) { router.push(`/auth/login?redirect=/events/${slug}`); return; }
    if (!selectedTicket) return;

    // Remember how many tickets this user usually books, to preselect it next time
    const previous = JSON.parse(localStorage.getItem("ep_last_quantity") ?? '{"count":0}');
    localStorage.setItem("ep_last_quantity", JSON.stringify({ count: previous.count + quantity }));

    setBooking(true);
    setBookingError("");
    try {
      const result = await bookings.create({ ticketTypeId: selectedTicket.id, quantity });
      if (result.status === "CONFIRMED") {
        setBookingSuccess(true);
      } else {
        router.push(`/my-tickets?pending=${result.id}`);
      }
    } catch (err: unknown) {
      setBookingError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBooking(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6" aria-busy="true">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <div className="ep-skeleton h-4 w-40" />
            <div className="ep-skeleton h-8 w-2/3" />
            <div className="ep-skeleton h-24 w-full" />
          </div>
          <div className="ep-skeleton h-64" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
        <p className="font-mono text-[12px] text-fg-subtle">404</p>
        <h1 className="mt-1 text-xl font-semibold">Event not found</h1>
        <p className="mt-2 text-[13px] text-fg-muted">It may have been unpublished or removed, or the link is wrong.</p>
        <Link href="/events" className="ep-btn-secondary mt-6">Browse events</Link>
      </div>
    );
  }

  const availableTickets = event.ticketTypes.filter((t) => t.soldQuantity < t.totalQuantity);
  const isSoldOutGlobally = availableTickets.length === 0;
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const encodedAddress = encodeURIComponent(event.venue);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── Event ─────────────────────────────────────────── */}
        <article className="min-w-0">
          <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-fg-muted">
            <Link href="/events" className="hover:text-fg">Events</Link>
            <span className="mx-1.5 text-fg-subtle">/</span>
            <Link href={`/${event.organization.slug}`} className="hover:text-fg">{event.organization.name}</Link>
          </nav>

          {event.bannerUrl && (
            <div className="mb-6 aspect-[2/1] overflow-hidden rounded-lg border border-border bg-surface-muted">
              <img src={event.bannerUrl} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{event.title}</h1>
            <button onClick={copyLink} className="ep-btn-ghost shrink-0" aria-label="Copy link to this event">
              <Link2 /> <span className="hidden sm:inline">Copy link</span>
            </button>
          </div>

          <dl className="mt-6 divide-y divide-border border-y border-border text-[14px]">
            <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 py-3">
              <dt className="text-fg-muted">When</dt>
              <dd className="tabular">{timeRange(event.startsAt, event.endsAt)}</dd>
            </div>
            <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 py-3">
              <dt className="text-fg-muted">Where</dt>
              <dd>
                {event.venue}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 inline-flex items-center gap-1 text-[13px] text-primary hover:underline underline-offset-2"
                >
                  <MapPin aria-hidden className="h-3.5 w-3.5" /> Open in Maps
                </a>
              </dd>
            </div>
            <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 py-3">
              <dt className="text-fg-muted">Organizer</dt>
              <dd>
                <Link href={`/${event.organization.slug}`} className="hover:underline underline-offset-2">{event.organization.name}</Link>
              </dd>
            </div>
          </dl>

          <section className="mt-8" aria-labelledby="about-h">
            <h2 id="about-h" className="text-sm font-medium">About this event</h2>
            <div className="mt-2 max-w-prose whitespace-pre-wrap text-[15px] leading-relaxed text-fg-muted">{event.description}</div>
          </section>

          {mapsKey && (
            <section className="mt-8" aria-labelledby="map-h">
              <h2 id="map-h" className="text-sm font-medium">Location</h2>
              <div className="mt-2 h-64 overflow-hidden rounded-lg border border-border sm:h-80">
                <iframe
                  title={`Map of ${event.venue}`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  src={`https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=${encodedAddress}`}
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </section>
          )}
        </article>

        {/* ── Tickets ───────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-20" aria-labelledby="tickets-h">
          <div className="ep-panel">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 id="tickets-h" className="text-sm font-medium">Tickets</h2>
              {isSoldOutGlobally && <Status tone="danger">Sold out</Status>}
            </div>

            {bookingSuccess ? (
              <div className="space-y-4 p-4">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  <div>
                    <p className="font-medium">Booking confirmed</p>
                    <p className="mt-0.5 text-[13px] text-fg-muted">Your QR ticket is in My Tickets and has been emailed to you.</p>
                  </div>
                </div>
                <button onClick={() => router.push("/my-tickets")} className="ep-btn-primary ep-btn-lg w-full">
                  View my tickets
                </button>
              </div>
            ) : isSoldOutGlobally ? (
              <div className="p-4">
                <p className="font-medium">This event is sold out</p>
                <p className="mt-1 text-[13px] text-fg-muted">All tickets have been booked. Seats can open up if bookings are cancelled.</p>
              </div>
            ) : (
              <div>
                <div role="radiogroup" aria-label="Ticket type" className="divide-y divide-border">
                  {event.ticketTypes.map((tt) => {
                    const remaining = tt.totalQuantity - tt.soldQuantity;
                    const isSoldOut = remaining <= 0;
                    const isSelected = selectedTicket?.id === tt.id;
                    return (
                      <button
                        key={tt.id}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => !isSoldOut && setSelectedTicket(tt)}
                        disabled={isSoldOut}
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                          isSoldOut ? "cursor-not-allowed opacity-55" : "hover:bg-surface-muted",
                          isSelected && "bg-primary-subtle hover:bg-primary-subtle"
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                            isSelected ? "border-primary" : "border-border-strong"
                          )}
                        >
                          {isSelected && <span className="h-2 w-2 rounded-full bg-primary" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-3">
                            <span className="font-medium">{tt.name}</span>
                            <span className="font-medium tabular">{tt.price === 0 ? "Free" : formatPrice(tt.price)}</span>
                          </span>
                          {tt.description && <span className="mt-0.5 block text-[12px] text-fg-muted">{tt.description}</span>}
                          <span className={cn("mt-1 block text-[12px] tabular", isSoldOut ? "text-danger" : remaining <= 10 ? "text-warning" : "text-fg-subtle")}>
                            {isSoldOut ? "Sold out" : `${remaining} left`}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-4 border-t border-border p-4">
                  {selectedTicket ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span id="qty-label" className="text-[13px] text-fg-muted">Quantity</span>
                        <div className="inline-flex items-center rounded-md border border-border-strong" role="group" aria-labelledby="qty-label">
                          <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            disabled={quantity <= 1}
                            className="ep-btn-ghost ep-btn-icon rounded-r-none"
                            aria-label="Decrease quantity"
                          >
                            <Minus />
                          </button>
                          <span className="w-8 text-center font-mono text-[13px] tabular" aria-live="polite">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const remaining = selectedTicket.totalQuantity - selectedTicket.soldQuantity;
                              setQuantity((q) => Math.min(Math.min(10, remaining), q + 1));
                            }}
                            className="ep-btn-ghost ep-btn-icon rounded-l-none"
                            aria-label="Increase quantity"
                          >
                            <Plus />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-baseline justify-between border-t border-border pt-3">
                        <span className="text-[13px] text-fg-muted">
                          Total <span className="font-mono text-[12px] text-fg-subtle">({quantity} × {formatPrice(selectedTicket.price)})</span>
                        </span>
                        <span className="text-lg font-semibold tabular">{formatAmount(selectedTicket.price * quantity)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-[13px] text-fg-muted">Select a ticket type to continue.</p>
                  )}

                  {bookingError && <Notice tone="danger">{bookingError}</Notice>}

                  <button onClick={handleBook} disabled={!selectedTicket || booking} className="ep-btn-primary ep-btn-lg w-full">
                    {booking ? "Booking…" : !user ? "Sign in to book" : "Book tickets"}
                  </button>
                  {selectedTicket && selectedTicket.price > 0 && (
                    <p className="text-center text-[12px] text-fg-subtle">Paid tickets are held until payment completes.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {relatedEvents.length > 0 && (
        <section className="mt-16 border-t border-border pt-8" aria-labelledby="more-h">
          <h2 id="more-h" className="text-sm font-medium">More events</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedEvents.map((re) => (
              <EventCard key={re.id} event={re} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
