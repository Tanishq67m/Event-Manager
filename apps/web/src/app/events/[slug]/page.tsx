"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { events, bookings, Event, TicketType } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDate, formatDateTime, formatPrice } from "@/lib/utils";

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

  useEffect(() => {
    events.bySlug(slug).then(setEvent).catch(console.error).finally(() => setLoading(false));
  }, [slug]);

  async function handleBook() {
    if (!user) { router.push(`/auth/login`); return; }
    if (!selectedTicket) return;

    setBooking(true);
    setBookingError("");
    try {
      const result = await bookings.create({ ticketTypeId: selectedTicket.id, quantity });
      if (result.status === "CONFIRMED") {
        setBookingSuccess(true);
      } else {
        // Paid ticket — go to payment
        router.push(`/my-tickets?pending=${result.id}`);
      }
    } catch (err: unknown) {
      setBookingError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-100 rounded-xl" />
          <div className="h-8 bg-gray-100 rounded w-2/3" />
          <div className="h-4 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20 text-center">
        <p className="text-gray-500">Event not found.</p>
      </div>
    );
  }

  const totalSold = event.ticketTypes.reduce((s, t) => s + t.soldQuantity, 0);
  const availableTickets = event.ticketTypes.filter(
    (t) => t.soldQuantity < t.totalQuantity
  );

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* ── Left: Event info ──────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Banner */}
          <div className="h-56 sm:h-72 rounded-xl overflow-hidden bg-gradient-to-br from-[#E6F1FB] to-[#c9dff5] flex items-center justify-center">
            {event.bannerUrl ? (
              <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-6xl">🎯</span>
            )}
          </div>

          {/* Title + org */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="ep-badge-blue">{event.organization.name}</span>
              <span className="ep-badge-green">Published</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3">{event.title}</h1>

            <div className="flex flex-col gap-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDateTime(event.startsAt)} – {formatDateTime(event.endsAt)}
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {event.venue}
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {totalSold} of {event.capacity} registered
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">About this event</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>
        </div>

        {/* ── Right: Booking widget ──────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="ep-card p-5 sticky top-20">
            <h2 className="font-semibold text-gray-900 mb-4">Get tickets</h2>

            {bookingSuccess ? (
              <div className="text-center py-4">
                <p className="text-3xl mb-3">🎉</p>
                <p className="font-semibold text-gray-900 mb-1">You're registered!</p>
                <p className="text-sm text-gray-500 mb-4">Check your email for your QR ticket.</p>
                <button
                  onClick={() => router.push("/my-tickets")}
                  className="ep-btn-primary w-full"
                >
                  View my tickets
                </button>
              </div>
            ) : availableTickets.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-2">😔</p>
                <p className="font-medium text-gray-700">Sold out</p>
                <p className="text-sm text-gray-500 mt-1">No tickets available</p>
              </div>
            ) : (
              <>
                {/* Ticket type selection */}
                <div className="space-y-2 mb-4">
                  {event.ticketTypes.map((tt) => {
                    const remaining = tt.totalQuantity - tt.soldQuantity;
                    const isSoldOut = remaining <= 0;
                    const isSelected = selectedTicket?.id === tt.id;

                    return (
                      <button
                        key={tt.id}
                        onClick={() => !isSoldOut && setSelectedTicket(tt)}
                        disabled={isSoldOut}
                        className={`w-full text-left rounded-lg border p-3 transition-all ${
                          isSoldOut
                            ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                            : isSelected
                            ? "border-[#1A56A4] bg-[#E6F1FB]"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">{tt.name}</span>
                          <span className="text-sm font-semibold text-[#1A56A4]">{formatPrice(tt.price)}</span>
                        </div>
                        {tt.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{tt.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {isSoldOut ? "Sold out" : `${remaining} left`}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Quantity */}
                {selectedTicket && (
                  <div className="mb-4">
                    <label className="ep-label">Quantity</label>
                    <select
                      className="ep-input"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                    >
                      {Array.from({ length: Math.min(10, selectedTicket.totalQuantity - selectedTicket.soldQuantity) }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Total */}
                {selectedTicket && (
                  <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-3 mb-4">
                    <span className="text-gray-500">Total</span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(selectedTicket.price * quantity)}
                    </span>
                  </div>
                )}

                {bookingError && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{bookingError}</p>
                )}

                <button
                  onClick={handleBook}
                  disabled={!selectedTicket || booking}
                  className="ep-btn-primary w-full py-2.5"
                >
                  {booking ? "Processing…" : !user ? "Sign in to book" : "Book now"}
                </button>

                <p className="text-xs text-gray-400 text-center mt-3">
                  {selectedTicket?.price === 0
                    ? "Free — ticket emailed instantly"
                    : "Secure payment via Razorpay"}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
