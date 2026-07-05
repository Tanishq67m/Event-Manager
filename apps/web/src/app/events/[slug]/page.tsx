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

  // Accordion faq active tab
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    events.bySlug(slug).then(setEvent).catch(console.error).finally(() => setLoading(false));
  }, [slug]);

  // Reset quantity when ticket type changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedTicket]);

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
      <div className="min-h-screen bg-[#08070d] py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-6">
          <div className="h-64 bg-white/5 border border-white/5 rounded-xl animate-pulse" />
          <div className="h-8 bg-white/10 rounded w-2/3 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#08070d] flex items-center justify-center py-20 text-center">
        <p className="text-gray-400">Event not found.</p>
      </div>
    );
  }

  const totalSold = event.ticketTypes.reduce((s, t) => s + t.soldQuantity, 0);
  const availableTickets = event.ticketTypes.filter((t) => t.soldQuantity < t.totalQuantity);

  return (
    <div className="min-h-screen bg-[#08070d] bg-radial-pulse relative pb-20">
      {/* Background Banner Blur */}
      {event.bannerUrl && (
        <div
          style={{ backgroundImage: `url(${event.bannerUrl})` }}
          className="absolute top-0 inset-x-0 h-[380px] bg-cover bg-center opacity-15 blur-[60px] pointer-events-none"
        />
      )}

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 z-10 relative">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* ── Left Column: Event details, schedule, speakers, FAQs ──────── */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Banner image */}
            <div className="h-56 sm:h-80 rounded-xl overflow-hidden bg-gradient-to-br from-violet-950/20 to-indigo-950/20 flex items-center justify-center border border-white/5 shadow-2xl relative">
              {event.bannerUrl ? (
                <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-violet-400 text-6xl animate-pulse">🎯</span>
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">EventPulse</span>
                </div>
              )}
            </div>

            {/* Title & Metadata Card */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="ep-badge-blue font-bold px-2.5 py-0.5 text-xs">
                  {event.organization.name}
                </span>
                <span className="ep-badge-green font-semibold px-2.5 py-0.5 text-xs">
                  Published
                </span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                {event.title}
              </h1>

              <div className="grid sm:grid-cols-2 gap-4 bg-white/5 rounded-xl border border-white/5 p-5">
                <div className="flex items-start gap-3 text-xs">
                  <span className="h-8 w-8 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-lg shrink-0 text-violet-400">
                    📅
                  </span>
                  <div>
                    <span className="block font-bold text-white mb-0.5">Date & Time</span>
                    <span className="text-gray-400 leading-normal">{formatDateTime(event.startsAt)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <span className="h-8 w-8 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-lg shrink-0 text-violet-400">
                    📍
                  </span>
                  <div>
                    <span className="block font-bold text-white mb-0.5">Venue Location</span>
                    <span className="text-gray-400 leading-normal">{event.venue}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Timeline */}
            <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
              <h3 className="text-base font-bold text-white tracking-tight">Event Schedule</h3>
              <div className="space-y-4 relative before:absolute before:inset-y-2 before:left-[11px] before:w-[2px] before:bg-white/5">
                {[
                  { time: "09:00 AM", title: "Registrations & Welcome Drinks", desc: "Arrive, scan your QR ticket at the desk, and collect badges." },
                  { time: "10:00 AM", title: "Opening Keynote & Introductions", desc: "Introduction to EventPulse ecosystem and speaker panels." },
                  { time: "11:30 AM", title: "Interactive Workshop Session", desc: "Hands-on builder guide to launching products." },
                  { time: "01:00 PM", title: "Lunch & Core Networking", desc: "Meet creators, startup founders, and sponsors." }
                ].map((s, idx) => (
                  <div key={idx} className="flex gap-4 relative">
                    <span className="h-6 w-6 shrink-0 rounded-full bg-slate-950 border border-violet-500/40 text-violet-400 flex items-center justify-center text-[10px] font-bold z-10">
                      ●
                    </span>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-violet-400 font-mono tracking-wider">{s.time}</span>
                      <h4 className="text-xs font-bold text-white">{s.title}</h4>
                      <p className="text-xs text-gray-500 leading-relaxed font-normal">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* About / Description */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white tracking-tight">About this event</h3>
              <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap font-normal">
                {event.description}
              </p>
            </div>

            {/* Speakers profiles */}
            <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
              <h3 className="text-base font-bold text-white tracking-tight">Speakers & Hosts</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { name: "Tanishq Mohod", role: "Product Host", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" },
                  { name: "Esther Howard", role: "UX Designer", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" },
                  { name: "Jenny Wilson", role: "Lead Engineer", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" }
                ].map((s, idx) => (
                  <div key={idx} className="bg-slate-950/40 border border-white/5 rounded-lg p-3 text-center space-y-2">
                    <img src={s.img} alt={s.name} className="h-12 w-12 rounded-full object-cover border border-violet-500/20 mx-auto" />
                    <div>
                      <h4 className="text-xs font-bold text-white truncate">{s.name}</h4>
                      <p className="text-[9px] text-gray-500">{s.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulated Venue Dark Map SVG placeholder */}
            <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
              <h3 className="text-base font-bold text-white tracking-tight">Location Map</h3>
              <div className="h-44 bg-[#0b0914] rounded-lg border border-white/5 relative overflow-hidden flex flex-col items-center justify-center p-4">
                {/* SVG mock map design */}
                <svg className="absolute inset-0 w-full h-full stroke-white/5 fill-none" viewBox="0 0 400 200">
                  <path d="M 0 50 Q 100 80 200 60 T 400 120" strokeWidth="2" />
                  <path d="M 120 0 Q 140 100 220 200" strokeWidth="1" />
                  <circle cx="200" cy="60" r="25" className="fill-violet-600/10 stroke-violet-500/30" />
                  <circle cx="200" cy="60" r="5" className="fill-violet-500 animate-ping" />
                  <circle cx="200" cy="60" r="4" className="fill-white" />
                </svg>
                <div className="z-10 bg-slate-950/90 border border-white/10 px-4 py-2 rounded-lg text-center shadow-2xl">
                  <p className="text-xs font-bold text-white">{event.venue}</p>
                  <span className="text-[9px] text-gray-500 font-medium">Click to navigate in Google Maps</span>
                </div>
              </div>
            </div>

            {/* Gallery placeholder images */}
            <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
              <h3 className="text-base font-bold text-white tracking-tight">Event Gallery</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=300&q=80",
                  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=300&q=80",
                  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80"
                ].map((url, idx) => (
                  <div key={idx} className="h-20 rounded-lg overflow-hidden border border-white/5 relative group">
                    <img src={url} alt="Gallery item" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ))}
              </div>
            </div>

            {/* Event Specific FAQs accordion */}
            <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
              <h3 className="text-base font-bold text-white tracking-tight">FAQs</h3>
              <div className="space-y-2.5">
                {[
                  { q: "Is registration required?", a: "Yes, you must book tickets in advance. Your QR ticket is scanned at the entrance gate." },
                  { q: "Are tickets refundable?", a: "Tickets are non-refundable but transferrable. Simply email the PDF ticket pass to your replacement." }
                ].map((faq, idx) => {
                  const isOpen = activeFaq === idx;
                  return (
                    <div key={idx} className="bg-slate-950/40 rounded-lg border border-white/5 overflow-hidden">
                      <button
                        onClick={() => setActiveFaq(isOpen ? null : idx)}
                        className="w-full text-left py-3.5 px-4.5 flex justify-between items-center text-xs font-bold text-white select-none cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        <span className="text-[10px] text-gray-500">{isOpen ? "▲" : "▼"}</span>
                      </button>
                      {isOpen && (
                        <p className="py-3 px-4.5 border-t border-white/5 text-[11px] text-gray-400 leading-relaxed font-normal">
                          {faq.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Organization profile */}
            <div className="glass-card p-6 rounded-xl border border-white/5 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-3.5">
                <span className="h-10 w-10 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-xl text-violet-400">
                  🏢
                </span>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">ORGANIZED BY</span>
                  <h4 className="text-sm font-bold text-white">{event.organization.name}</h4>
                </div>
              </div>
              <span className="text-[10px] text-gray-400 font-semibold border border-white/5 bg-white/3 rounded px-2.5 py-1">
                Verified Host
              </span>
            </div>

          </div>

          {/* ── Right Column: Booking panel & Interactive seating ──────── */}
          <div className="lg:col-span-5">
            <div className="glass-card p-6 rounded-xl shadow-2xl border border-white/10 space-y-6 sticky top-20">
              <h2 className="text-lg font-bold text-white tracking-tight">Get Tickets</h2>

              {bookingSuccess ? (
                <div className="text-center py-6 space-y-5">
                  <p className="text-5xl animate-bounce">🎉</p>
                  <div>
                    <p className="font-bold text-white text-lg">Registration Confirmed!</p>
                    <p className="text-sm text-gray-400 mt-1">Your QR ticket has been delivered to your email.</p>
                  </div>
                  <button
                    onClick={() => router.push("/my-tickets")}
                    className="ep-btn-primary w-full py-3 shadow-[0_0_15px_rgba(124,58,237,0.4)]"
                  >
                    View my tickets
                  </button>
                </div>
              ) : availableTickets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">😔</p>
                  <p className="font-bold text-gray-300">Sold out</p>
                  <p className="text-sm text-gray-500 mt-1">No ticket categories are currently available for sale.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  
                  {/* Tiers selection */}
                  <div className="space-y-3.5">
                    {event.ticketTypes.map((tt) => {
                      const remaining = tt.totalQuantity - tt.soldQuantity;
                      const isSoldOut = remaining <= 0;
                      const isSelected = selectedTicket?.id === tt.id;

                      return (
                        <button
                          key={tt.id}
                          onClick={() => !isSoldOut && setSelectedTicket(tt)}
                          disabled={isSoldOut}
                          className={`w-full text-left rounded-xl border p-4 transition-all duration-200 cursor-pointer ${
                            isSoldOut
                              ? "border-white/5 bg-white/2 bg-opacity-40 opacity-40 cursor-not-allowed"
                              : isSelected
                              ? "border-violet-500 bg-violet-600/20 shadow-[0_0_12px_rgba(124,58,237,0.15)]"
                              : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white">{tt.name}</span>
                            <span className="text-sm font-extrabold text-violet-400">
                              {tt.price === 0 ? "Free" : formatPrice(tt.price)}
                            </span>
                          </div>
                          {tt.description && (
                            <p className="text-xs text-gray-400 mt-1.5 leading-normal">{tt.description}</p>
                          )}
                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5 text-[10px] text-gray-500">
                            <span>Available</span>
                            <span className={isSoldOut ? "text-rose-400" : "text-violet-400"}>
                              {isSoldOut ? "Sold out" : `${remaining} left`}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Quantity selector */}
                  {selectedTicket && (
                    <div className="border-t border-white/5 pt-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                          Select Quantity
                        </label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold flex items-center justify-center cursor-pointer transition-colors"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-extrabold text-white font-mono">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const remaining = selectedTicket.totalQuantity - selectedTicket.soldQuantity;
                              setQuantity((q) => Math.min(Math.min(10, remaining), q + 1));
                            }}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold flex items-center justify-center cursor-pointer transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-white/5 pt-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Total Quantity</span>
                          <span className="text-white font-extrabold font-mono">{quantity} ticket{quantity !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-gray-400">Total Cost</span>
                          <span className="text-base font-extrabold text-white font-mono">
                            {formatPrice(selectedTicket.price * quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {bookingError && (
                    <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3.5 py-2.5">
                      {bookingError}
                    </p>
                  )}

                  <button
                    onClick={handleBook}
                    disabled={!selectedTicket || booking}
                    className="ep-btn-primary w-full py-3 shadow-[0_0_15px_rgba(124,58,237,0.4)]"
                  >
                    {booking ? "Processing…" : !user ? "Sign in to book" : "Book now"}
                  </button>

                  <p className="text-[10px] text-gray-500 text-center mt-1 leading-normal font-medium">
                    {selectedTicket?.price === 0
                      ? "Free ticket — delivered instantly by email"
                      : "Payments processed via Razorpay Secure Gateway"}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
