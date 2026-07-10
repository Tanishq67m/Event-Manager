"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CalendarDays, 
  MapPin, 
  Building2, 
  ChevronDown, 
  CheckCircle2, 
  Ticket,
  Share2,
  Heart,
  Image as ImageIcon,
  Clock,
  Info
} from "lucide-react";
import { events, bookings, Event, TicketType } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDate, formatDateTime, formatPrice } from "@/lib/utils";
import EventCard from "@/components/EventCard";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
} as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

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

  // Accordion faq active tab
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    events.bySlug(slug)
      .then((res) => {
        setEvent(res);
        // Load some mock related events or latest events
        events.list({ limit: 3 }).then((r) => {
          setRelatedEvents(r.data.filter(e => e.id !== res.id).slice(0, 3));
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
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
          <div className="h-80 bg-white/5 border border-white/5 rounded-2xl animate-pulse" />
          <div className="h-10 bg-white/10 rounded w-1/2 animate-pulse" />
          <div className="h-4 bg-white/5 rounded w-1/3 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#08070d] flex items-center justify-center py-20 text-center">
        <div className="glass-card p-10 rounded-3xl border border-white/5 max-w-md">
          <Info className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Event Not Found</h2>
          <p className="text-gray-400 mb-6">This event may have been deleted or the URL is incorrect.</p>
          <button onClick={() => router.push('/events')} className="ep-btn-secondary">Back to Discovery</button>
        </div>
      </div>
    );
  }

  const totalSold = event.ticketTypes.reduce((s, t) => s + t.soldQuantity, 0);
  const availableTickets = event.ticketTypes.filter((t) => t.soldQuantity < t.totalQuantity);
  const isSoldOutGlobally = availableTickets.length === 0;

  // Google Maps embed URL
  const encodedAddress = encodeURIComponent(event.venue);
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${encodedAddress}`;

  return (
    <div className="min-h-screen bg-[#08070d] bg-radial-pulse relative pb-32">
      {/* Background Banner Blur */}
      {event.bannerUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ duration: 1 }}
          style={{ backgroundImage: `url(${event.bannerUrl})` }}
          className="absolute top-0 inset-x-0 h-[500px] bg-cover bg-center blur-[80px] pointer-events-none"
        />
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 z-10 relative">
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={staggerContainer}
          className="grid lg:grid-cols-12 gap-10 items-start"
        >
          
          {/* ── Left Column: Event details ──────── */}
          <motion.div variants={fadeUp} className="lg:col-span-8 space-y-10">
            
            {/* Banner image */}
            <div className="h-64 md:h-[400px] rounded-3xl overflow-hidden bg-gradient-to-br from-violet-950/20 to-indigo-950/20 flex items-center justify-center border border-white/10 shadow-2xl relative group">
              {event.bannerUrl ? (
                <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <ImageIcon className="h-12 w-12 text-violet-400/50" />
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">EventPulse</span>
                </div>
              )}
              {isSoldOutGlobally && (
                <div className="absolute top-4 right-4 bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  SOLD OUT
                </div>
              )}
            </div>

            {/* Title & Metadata */}
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="ep-badge-blue font-bold px-3 py-1 text-xs shadow-sm bg-violet-600/20">
                    <Building2 className="h-3 w-3 inline-block mr-1.5 -mt-0.5" />
                    {event.organization.name}
                  </span>
                  <span className="ep-badge-green font-semibold px-3 py-1 text-xs">
                    Published
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-rose-400 hover:bg-white/10 transition-colors">
                    <Heart className="h-4 w-4" />
                  </button>
                  <button className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
                {event.title}
              </h1>

              <div className="grid sm:grid-cols-2 gap-4 bg-slate-950/40 rounded-2xl border border-white/5 p-6 backdrop-blur-md">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <CalendarDays className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <span className="block font-bold text-white mb-1">Date & Time</span>
                    <span className="text-gray-400 text-sm leading-snug block">{formatDateTime(event.startsAt)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <span className="block font-bold text-white mb-1">Venue Location</span>
                    <span className="text-gray-400 text-sm leading-snug block">{event.venue}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* About / Description */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Info className="h-5 w-5 text-violet-400" /> About this event
              </h3>
              <div className="prose prose-invert max-w-none text-gray-400 text-[15px] leading-loose whitespace-pre-wrap">
                {event.description}
              </div>
            </div>

            {/* Interactive Map Embed */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <MapPin className="h-5 w-5 text-violet-400" /> Directions & Map
              </h3>
              <div className="h-64 sm:h-80 w-full rounded-2xl overflow-hidden border border-white/10 relative shadow-lg">
                {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={mapUrl}
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center border border-white/5">
                    <MapPin className="h-8 w-8 text-violet-400 mb-3" />
                    <p className="text-white font-bold">{event.venue}</p>
                    <p className="text-xs text-gray-500 mt-2">Map embed is disabled (Missing API Key)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Organization profile expanded */}
            <div className="glass-card p-8 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-xl text-center sm:text-left">
              <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 p-0.5 shrink-0">
                <div className="h-full w-full bg-slate-950 rounded-full flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <span className="text-[10px] text-violet-400 font-bold uppercase tracking-widest block mb-1">Organized By</span>
                  <h4 className="text-xl font-bold text-white">{event.organization.name}</h4>
                </div>
                <p className="text-sm text-gray-400">
                  Dedicated to curating the best experiences. Follow to stay updated on future events.
                </p>
                <div className="pt-2">
                  <button className="ep-btn-secondary py-2 px-5 rounded-full text-xs">
                    Follow Organizer
                  </button>
                </div>
              </div>
            </div>

            {/* FAQs */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white tracking-tight">Frequently Asked Questions</h3>
              <div className="space-y-3">
                {[
                  { q: "Is registration required?", a: "Yes, you must book tickets in advance. Your QR ticket is scanned at the entrance gate." },
                  { q: "Are tickets refundable?", a: "Tickets are non-refundable but transferrable. Simply email the PDF ticket pass to your replacement." }
                ].map((faq, idx) => {
                  const isOpen = activeFaq === idx;
                  return (
                    <div key={idx} className="glass-card rounded-xl border border-white/5 overflow-hidden transition-colors hover:bg-white/[0.03]">
                      <button
                        onClick={() => setActiveFaq(isOpen ? null : idx)}
                        className="w-full text-left py-4 px-6 flex justify-between items-center text-sm font-bold text-white select-none cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                          >
                            <p className="pb-4 px-6 text-sm text-gray-400 leading-relaxed font-normal">
                              {faq.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

          </motion.div>

          {/* ── Right Column: Booking panel ──────── */}
          <motion.div variants={fadeUp} className="lg:col-span-4 relative">
            <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/10 space-y-6 sticky top-24">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-violet-400" /> Select Tickets
                </h2>
                {isSoldOutGlobally && (
                  <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded">SOLD OUT</span>
                )}
              </div>

              {bookingSuccess ? (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8 space-y-6">
                  <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-xl">Booking Confirmed!</p>
                    <p className="text-sm text-gray-400 mt-2 leading-relaxed">Your QR ticket has been delivered to your email.</p>
                  </div>
                  <button
                    onClick={() => router.push("/my-tickets")}
                    className="ep-btn-primary w-full py-3.5 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                  >
                    View My Tickets
                  </button>
                </motion.div>
              ) : isSoldOutGlobally ? (
                <div className="text-center py-10 space-y-4">
                  <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="h-6 w-6 text-gray-500" />
                  </div>
                  <p className="font-bold text-gray-300 text-lg">Sales Closed</p>
                  <p className="text-sm text-gray-500">All tickets have been claimed. Check back later in case spaces open up.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Tiers selection */}
                  <div className="space-y-3">
                    {event.ticketTypes.map((tt) => {
                      const remaining = tt.totalQuantity - tt.soldQuantity;
                      const isSoldOut = remaining <= 0;
                      const isSelected = selectedTicket?.id === tt.id;

                      return (
                        <button
                          key={tt.id}
                          onClick={() => !isSoldOut && setSelectedTicket(tt)}
                          disabled={isSoldOut}
                          className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 cursor-pointer relative overflow-hidden ${
                            isSoldOut
                              ? "border-white/5 bg-white/2 bg-opacity-40 opacity-50 cursor-not-allowed"
                              : isSelected
                              ? "border-violet-500 bg-violet-600/10 shadow-[0_0_20px_rgba(124,58,237,0.15)] ring-1 ring-violet-500/50"
                              : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                          }`}
                        >
                          {isSelected && <div className="absolute top-0 right-0 w-16 h-16 bg-violet-600/20 blur-xl rounded-full" />}
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-base font-bold text-white block">{tt.name}</span>
                              {tt.description && (
                                <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{tt.description}</p>
                              )}
                            </div>
                            <span className="text-base font-extrabold text-white bg-white/10 px-2.5 py-1 rounded-lg">
                              {tt.price === 0 ? "Free" : formatPrice(tt.price)}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-xs text-gray-500 font-medium">
                            <span className="flex items-center gap-1"><Ticket className="h-3 w-3" /> Availability</span>
                            <span className={isSoldOut ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                              {isSoldOut ? "Sold out" : `${remaining} left`}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Quantity selector */}
                  <AnimatePresence>
                    {selectedTicket && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: "auto", opacity: 1 }} 
                        className="bg-slate-950/50 rounded-2xl p-5 border border-white/5 space-y-5"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Quantity
                          </label>
                          <div className="flex items-center gap-4 bg-white/5 rounded-xl border border-white/10 p-1">
                            <button
                              type="button"
                              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                              className="w-8 h-8 rounded-lg hover:bg-white/10 text-white font-bold flex items-center justify-center transition-colors"
                            >
                              -
                            </button>
                            <span className="w-4 text-center text-sm font-extrabold text-white">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const remaining = selectedTicket.totalQuantity - selectedTicket.soldQuantity;
                                setQuantity((q) => Math.min(Math.min(10, remaining), q + 1));
                              }}
                              className="w-8 h-8 rounded-lg hover:bg-white/10 text-white font-bold flex items-center justify-center transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                          <span className="text-sm text-gray-400 font-medium">Subtotal</span>
                          <span className="text-lg font-bold text-white">
                            {formatPrice(selectedTicket.price * quantity)}
                          </span>
                        </div>
                        
                        {/* Promo Code & GST Field (UI Mock) */}
                        <div className="space-y-3 pt-3">
                          <div className="relative">
                            <input type="text" placeholder="Promo Code" className="ep-input text-sm py-2 pr-16 bg-white/5 border-white/10 text-white" />
                            <button className="absolute right-1.5 top-1.5 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded">Apply</button>
                          </div>
                          <div className="relative">
                            <input type="text" placeholder="GSTIN (Optional)" className="ep-input text-sm py-2 bg-white/5 border-white/10 text-white" />
                          </div>
                        </div>

                        <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                          <span className="text-sm text-gray-400 font-medium">Total Price</span>
                          <span className="text-2xl font-extrabold text-white">
                            {formatPrice(selectedTicket.price * quantity)}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {bookingError && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-sm text-rose-400 flex items-start gap-2">
                      <Info className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  <button
                    onClick={handleBook}
                    disabled={!selectedTicket || booking}
                    className="ep-btn-primary w-full py-4 text-base rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all"
                  >
                    {booking ? "Processing Securely…" : !user ? "Sign in to Book" : "Confirm Booking"}
                  </button>

                  <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" /> Secure processing via EventPulse
                  </p>
                </div>
              )}
            </div>
          </motion.div>

        </motion.div>

        {/* Related Events Strip */}
        {relatedEvents.length > 0 && (
          <div className="mt-32 pt-16 border-t border-white/5 relative z-10">
            <h2 className="text-2xl font-bold text-white mb-8">More events you might like</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {relatedEvents.map(re => (
                <EventCard key={re.id} event={re} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
