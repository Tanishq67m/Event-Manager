"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowUpRight, Building2, CalendarDays, CheckCircle2, Clock, Link2, MapPin, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { events, bookings, Event, TicketType } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn, formatAmount, formatPrice } from "@/lib/utils";
import EventCard from "@/components/EventCard";
import { Notice } from "@/components/ui/Notice";
import { Status } from "@/components/ui/Status";
import { DateBlock } from "@/components/ui/DateBlock";
import { Countdown } from "@/components/ui/Countdown";

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
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-busy="true">
        <div className="flex gap-5">
          <div className="ep-skeleton h-24 w-24 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <div className="ep-skeleton h-3 w-40" />
            <div className="ep-skeleton h-12 w-2/3" />
            <div className="ep-skeleton h-8 w-1/2" />
          </div>
        </div>
        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="ep-skeleton h-40" />
          <div className="ep-skeleton h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 sm:px-6">
        <p className="ep-eyebrow">404</p>
        <h1 className="ep-display mt-4 text-[44px]">Event not found</h1>
        <p className="mt-3 text-[15px] text-fg-muted">It may have been unpublished or removed, or the link is wrong.</p>
        <Link href="/events" className="ep-btn-primary ep-btn-lg mt-8">Browse events</Link>
      </div>
    );
  }

  const availableTickets = event.ticketTypes.filter((t) => t.soldQuantity < t.totalQuantity);
  const isSoldOutGlobally = availableTickets.length === 0;
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const encodedAddress = encodeURIComponent(event.venue);
  const t = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
  const day = new Date(event.startsAt).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <nav aria-label="Breadcrumb" className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-fg-muted">
            <Link href="/events" className="hover:text-fg">Events</Link>
            <span className="mx-2 text-fg-subtle">/</span>
            <Link href={`/${event.organization.slug}`} className="hover:text-fg">{event.organization.name}</Link>
          </nav>

          {event.bannerUrl && (
            <div className="mt-6 aspect-[21/9] overflow-hidden rounded-2xl border border-border bg-surface-muted">
              <img src={event.bannerUrl} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 gap-5">
              <DateBlock iso={event.startsAt} size="lg" className="hidden sm:flex" />
              <div className="min-w-0">
                <h1 className="ep-display text-[40px] sm:text-[56px]">{event.title}</h1>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="ep-chip"><CalendarDays aria-hidden />{day}</span>
                  <span className="ep-chip tabular"><Clock aria-hidden />{t(event.startsAt)}–{t(event.endsAt)} IST</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ep-chip max-w-full hover:border-border-strong"
                    title="Open in Google Maps"
                  >
                    <MapPin aria-hidden /><span className="truncate">{event.venue}</span><ArrowUpRight aria-hidden />
                  </a>
                  <Link href={`/${event.organization.slug}`} className="ep-chip hover:border-border-strong">
                    <Building2 aria-hidden />{event.organization.name}
                  </Link>
                  <button onClick={copyLink} className="ep-chip hover:border-border-strong" aria-label="Copy link to this event">
                    <Link2 aria-hidden />Copy link
                  </button>
                </div>
              </div>
            </div>

            {!isSoldOutGlobally && (
              <Countdown to={event.startsAt} label="Starts in" className="shrink-0 rounded-2xl border border-border bg-surface px-5 py-4" />
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* ── About ─────────────────────────────────────────── */}
          <article className="min-w-0">
            <p className="ep-eyebrow">About this event</p>
            <div className="mt-4 max-w-prose whitespace-pre-wrap text-[16px] leading-relaxed text-fg-muted">{event.description}</div>

            {mapsKey && (
              <section className="mt-10" aria-labelledby="map-h">
                <p id="map-h" className="ep-eyebrow">Location</p>
                <div className="mt-4 h-64 overflow-hidden rounded-2xl border border-border sm:h-80">
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
          <aside className="lg:sticky lg:top-24" aria-labelledby="tickets-h">
            <div className="ep-panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 id="tickets-h" className="font-display text-[20px] font-semibold tracking-[-0.02em]">Tickets</h2>
                {isSoldOutGlobally && <Status tone="danger">Sold out</Status>}
              </div>

              {bookingSuccess ? (
                <div className="space-y-5 p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success text-white">
                      <CheckCircle2 aria-hidden className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-display text-[20px] font-semibold tracking-[-0.02em]">Booking confirmed</p>
                      <p className="mt-1 text-[14px] text-fg-muted">Your QR ticket is in My Tickets and has been emailed to you.</p>
                    </div>
                  </div>
                  <button onClick={() => router.push("/my-tickets")} className="ep-btn-primary ep-btn-lg w-full">
                    View my tickets
                  </button>
                </div>
              ) : isSoldOutGlobally ? (
                <div className="p-5">
                  <p className="font-display text-[20px] font-semibold tracking-[-0.02em]">This event is sold out</p>
                  <p className="mt-1.5 text-[14px] text-fg-muted">All tickets have been booked. Seats can open up if bookings are cancelled.</p>
                </div>
              ) : (
                <div className="p-5">
                  <div role="radiogroup" aria-label="Ticket type" className="space-y-2.5">
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
                            "flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3.5 text-left transition-colors",
                            isSoldOut
                              ? "cursor-not-allowed border-border opacity-50"
                              : isSelected
                                ? "border-primary bg-primary text-primary-fg"
                                : "border-border-strong bg-surface hover:border-fg-subtle"
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block font-semibold">{tt.name}</span>
                            {tt.description && (
                              <span className={cn("mt-0.5 block text-[12.5px]", isSelected ? "text-white/80" : "text-fg-muted")}>{tt.description}</span>
                            )}
                            <span
                              className={cn(
                                "mt-1.5 block font-mono text-[11px] tabular",
                                isSelected ? "text-white/85" : isSoldOut ? "text-danger" : remaining <= 10 ? "text-warning" : "text-fg-subtle"
                              )}
                            >
                              {isSoldOut ? "Sold out" : `${remaining} left`}
                            </span>
                          </span>
                          <span className="shrink-0 font-display text-[22px] font-bold tracking-[-0.02em] tabular">
                            {tt.price === 0 ? "Free" : formatPrice(tt.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 space-y-4 border-t border-dashed border-border-strong pt-5">
                    {selectedTicket ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span id="qty-label" className="text-[14px] text-fg-muted">Quantity</span>
                          <div className="inline-flex items-center rounded-lg border border-border-strong" role="group" aria-labelledby="qty-label">
                            <button
                              type="button"
                              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                              disabled={quantity <= 1}
                              className="ep-btn-ghost ep-btn-icon rounded-r-none"
                              aria-label="Decrease quantity"
                            >
                              <Minus />
                            </button>
                            <span className="w-9 text-center font-mono text-[14px] tabular" aria-live="polite">{quantity}</span>
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
                        <div className="flex items-end justify-between">
                          <span className="text-[14px] text-fg-muted">
                            Total <span className="block font-mono text-[11.5px] text-fg-subtle">{quantity} × {formatPrice(selectedTicket.price)}</span>
                          </span>
                          <span className="ep-display text-[32px] tabular">{formatAmount(selectedTicket.price * quantity)}</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-[14px] text-fg-muted">Pick a ticket type to continue.</p>
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
          <section className="mt-20 border-t border-border pt-12" aria-labelledby="more-h">
            <p className="ep-eyebrow">Keep exploring</p>
            <h2 id="more-h" className="ep-display mt-4 text-[32px]">More events</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedEvents.map((re) => (
                <EventCard key={re.id} event={re} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
