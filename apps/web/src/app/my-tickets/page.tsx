"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { bookings, payments, Booking } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime, formatPrice } from "@/lib/utils";

const statusStyle: Record<string, string> = {
  CONFIRMED: "ep-badge-green shadow-[0_0_8px_rgba(16,185,129,0.25)]",
  PENDING: "ep-badge-yellow border-amber-500/20 text-amber-400 bg-amber-500/10",
  CANCELLED: "ep-badge-red shadow-[0_0_8px_rgba(244,63,94,0.25)]",
  REFUNDED: "ep-badge-gray border-white/10 text-gray-400 bg-white/5",
};

export default function MyTicketsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Wallet tabs state
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [payingId, setPayingId] = useState<string | null>(null);

  async function handleSimulatePayment(bookingId: string) {
    setPayingId(bookingId);
    try {
      const order = await payments.createOrder(bookingId);
      await payments.verify({
        razorpayOrderId: order.orderId,
        razorpayPaymentId: `pay_mock_${Math.random().toString(36).substring(7)}`,
        razorpaySignature: "mock_signature"
      });
      const updated = await bookings.mine();
      setData(updated);
    } catch (err: unknown) {
      alert(`Simulation failed: ${err instanceof Error ? err.message : "payment error"}`);
    } finally {
      setPayingId(null);
    }
  }

  useEffect(() => {
    if (!authLoading && !user) { router.push("/auth/login"); return; }
    if (user) {
      bookings.mine().then(setData).catch(console.error).finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#08070d] py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 space-y-4">
          <div className="h-8 bg-white/10 rounded w-48 animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white/5 border border-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Filtering bookings
  const now = new Date();
  const filteredBookings = data.filter((booking) => {
    const eventDate = new Date(booking.ticketType.event.startsAt);
    const isCancelled = booking.status === "CANCELLED" || booking.status === "REFUNDED";
    
    if (activeTab === "cancelled") {
      return isCancelled;
    }
    if (isCancelled) {
      return false;
    }
    if (activeTab === "upcoming") {
      return eventDate >= now;
    }
    if (activeTab === "past") {
      return eventDate < now;
    }
    return true;
  });

  const handleDownloadPdf = (bookingId: string) => {
    alert(`Generating ticket PDF pass for booking: ${bookingId}...`);
  };

  const handleAddToCalendar = (title: string, dateStr: string) => {
    alert(`Adding "${title}" on ${new Date(dateStr).toLocaleDateString()} to your Calendar...`);
  };

  return (
    <div className="min-h-screen bg-[#08070d] bg-radial-pulse pb-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 z-10 relative space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Tickets Wallet</h1>
          <p className="text-sm text-gray-400 mt-1">Manage and access entry codes for your booked events</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-950/40 p-1 border border-white/5 rounded-lg select-none w-max">
          {(["upcoming", "past", "cancelled"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-bold uppercase px-4 py-2 rounded cursor-pointer transition-all ${
                activeTab === tab
                  ? "bg-violet-600 text-white shadow-[0_0_10px_rgba(124,58,237,0.3)] border border-violet-500/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tickets feed */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-xl border border-white/5 shadow-xl">
            <p className="text-5xl mb-4">🎫</p>
            <h3 className="text-lg font-bold text-white mb-1.5">No tickets found</h3>
            <p className="text-xs text-gray-400 max-w-xs mx-auto mb-6">
              You don't have any tickets under the "{activeTab}" filter tag.
            </p>
            <button
              onClick={() => router.push("/events")}
              className="ep-btn-primary px-6 py-2.5 shadow-[0_0_15px_rgba(124,58,237,0.4)]"
            >
              Browse live events
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="glass-card rounded-xl border border-white/5 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between"
              >
                
                {/* Left block: details */}
                <div className="p-6 flex-1 min-w-0 space-y-4">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={statusStyle[booking.status] || "ep-badge-gray"}>
                      {booking.status}
                    </span>
                    <span className="ep-badge-blue font-bold text-xs">{booking.ticketType.name}</span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white truncate hover:text-violet-400 transition-colors">
                      {booking.ticketType.event.title}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {formatDateTime(booking.ticketType.event.startsAt)} · {booking.ticketType.event.venue}
                    </p>
                  </div>

                  {/* Actions buttons */}
                  {booking.status === "CONFIRMED" && (
                    <div className="flex gap-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => handleDownloadPdf(booking.id)}
                        className="ep-btn-secondary text-[10px] py-1.5 px-3 uppercase tracking-wider"
                      >
                        PDF Pass
                      </button>
                      <button
                        onClick={() => handleAddToCalendar(booking.ticketType.event.title, booking.ticketType.event.startsAt)}
                        className="ep-btn-ghost text-[10px] py-1.5 px-3 uppercase tracking-wider font-semibold text-gray-400 hover:text-white"
                      >
                        Add to Calendar
                      </button>
                    </div>
                  )}

                  {booking.status === "PENDING" && (
                    <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
                      <p className="text-[10px] text-amber-400 font-medium leading-normal">
                        ⚠️ Payment is pending. Simulate checkout below:
                      </p>
                      <button
                        onClick={() => handleSimulatePayment(booking.id)}
                        disabled={payingId === booking.id}
                        className="ep-btn-primary text-[10px] py-1.5 px-3 uppercase tracking-wider font-bold text-center bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-md border-transparent w-max cursor-pointer"
                      >
                        {payingId === booking.id ? "Processing Mock..." : "Simulate Payment"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Vertical dash divider / Perforated visual element */}
                <div className="hidden md:flex flex-col justify-between items-center py-2 h-full absolute right-[180px] top-0 bottom-0 pointer-events-none">
                  <div className="w-[1px] h-full border-r border-dashed border-white/10" />
                </div>

                {/* Right block: Cost & QR Code validator */}
                <div className="bg-[#0b0914] md:w-[180px] p-6 shrink-0 flex flex-col justify-between items-center md:items-end text-center md:text-right border-t md:border-t-0 md:border-l border-white/5">
                  <div className="mb-4 md:mb-0">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">TOTAL PRICE</span>
                    <p className="text-lg font-extrabold text-white font-mono mt-0.5">{formatPrice(booking.totalAmount)}</p>
                    <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">× {booking.quantity} ticket{booking.quantity !== 1 ? "s" : ""}</span>
                  </div>

                  {booking.status === "CONFIRMED" && (
                    <div className="flex flex-col items-center md:items-end gap-1.5 mt-2">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&color=7c3aed&data=${encodeURIComponent(booking.qrCode)}`}
                        alt="Verification QR code"
                        className="h-20 w-20 border border-violet-500/20 rounded p-1 bg-slate-950 shadow-[0_0_8px_rgba(124,58,237,0.2)]"
                      />
                      <span className="text-[9px] text-violet-400 font-mono tracking-widest uppercase">{booking.qrCode.substring(0, 12)}...</span>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
