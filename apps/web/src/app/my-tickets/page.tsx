"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Ticket, 
  Calendar, 
  Download, 
  Share2, 
  Mail, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  QrCode,
  MapPin,
  ChevronRight,
  ReceiptText
} from "lucide-react";
import { toast } from "sonner";
import { bookings, payments, Booking } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime, formatPrice } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
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
      toast.success("Payment simulated successfully!");
    } catch (err: unknown) {
      toast.error(`Simulation failed: ${err instanceof Error ? err.message : "payment error"}`);
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

  const handleDownloadPdf = (bookingId: string) => {
    toast.info("Generating your PDF pass...", {
      description: "It should start downloading shortly."
    });
    setTimeout(() => toast.success("PDF Pass generated!"), 2000);
  };

  const handleAddToCalendar = (title: string, dateStr: string) => {
    toast.success("Added to Calendar", {
      description: `${title} has been added to your local calendar.`
    });
  };

  const handleShare = (title: string) => {
    toast.success("Link copied to clipboard!", {
      description: `Share your experience at ${title} with friends.`
    });
  };

  const handleEmailResend = () => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
      loading: "Resending confirmation email...",
      success: "Confirmation email sent! Check your inbox.",
      error: "Failed to send email."
    });
  };

  const handleRequestInvoice = () => {
    toast.info("Invoice requested", {
      description: "A GST invoice will be generated and emailed to you."
    });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#08070d] py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-6">
          <div className="h-10 bg-white/10 rounded w-64 animate-pulse" />
          <div className="flex gap-2">
             {[1,2,3].map(i => <div key={i} className="h-10 w-24 bg-white/5 rounded-lg animate-pulse" />)}
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-white/5 border border-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const now = new Date();
  const filteredBookings = data.filter((booking) => {
    const eventDate = new Date(booking.ticketType.event.startsAt);
    const isCancelled = booking.status === "CANCELLED" || booking.status === "REFUNDED";
    
    if (activeTab === "cancelled") return isCancelled;
    if (isCancelled) return false;
    if (activeTab === "upcoming") return eventDate >= now;
    if (activeTab === "past") return eventDate < now;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#08070d] bg-radial-pulse pb-24">
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 z-10 relative">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Ticket className="h-8 w-8 text-violet-400" />
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Your Ticket Wallet</h1>
          </div>
          <p className="text-sm text-gray-400 max-w-lg leading-relaxed">
            Manage your upcoming experiences, access your entry QR codes, or download GST invoices for your purchases.
          </p>
        </motion.div>

        {/* Tab Controls */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex bg-white/5 p-1.5 border border-white/5 rounded-xl select-none w-max mb-8">
          {(["upcoming", "past", "cancelled"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-bold capitalize px-6 py-2.5 rounded-lg cursor-pointer transition-all ${
                activeTab === tab
                  ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.4)] border border-violet-500/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              {tab}
            </button>
          ))}
        </motion.div>

        {/* Tickets feed */}
        <AnimatePresence mode="wait">
          {filteredBookings.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="text-center py-20 glass-card rounded-3xl border border-white/5 shadow-2xl max-w-2xl mx-auto"
            >
              <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Ticket className="h-6 w-6 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No tickets found</h3>
              <p className="text-sm text-gray-400 max-w-xs mx-auto mb-8 leading-relaxed">
                You don't have any tickets under the "{activeTab}" tag. Ready to discover your next experience?
              </p>
              <button
                onClick={() => router.push("/events")}
                className="ep-btn-primary px-8 py-3.5 shadow-[0_0_20px_rgba(124,58,237,0.3)] rounded-xl"
              >
                Browse Live Events <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {filteredBookings.map((booking) => (
                <motion.div
                  variants={fadeUp}
                  key={booking.id}
                  className="glass-card rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between group hover:border-violet-500/30 transition-colors"
                >
                  {/* Left block: details */}
                  <div className="p-8 flex-1 min-w-0 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-wrap">
                        {booking.status === "CONFIRMED" && <span className="ep-badge-green px-3 py-1 bg-emerald-500/20 shadow-sm"><CheckCircle2 className="h-3 w-3 mr-1" /> Confirmed</span>}
                        {booking.status === "PENDING" && <span className="ep-badge-yellow px-3 py-1 bg-amber-500/20 shadow-sm"><Clock className="h-3 w-3 mr-1" /> Pending</span>}
                        {booking.status === "CANCELLED" && <span className="ep-badge-red px-3 py-1"><AlertCircle className="h-3 w-3 mr-1" /> Cancelled</span>}
                        {booking.status === "REFUNDED" && <span className="ep-badge-gray px-3 py-1">Refunded</span>}
                        
                        <span className="ep-badge-blue font-bold px-3 py-1 shadow-sm bg-violet-600/20">{booking.ticketType.name}</span>
                      </div>
                      
                      {booking.status === "CONFIRMED" && (
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded">
                          ID: {booking.id.split('-')[0]}
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-2xl font-extrabold text-white truncate hover:text-violet-400 transition-colors cursor-pointer" onClick={() => router.push(`/events/${booking.ticketType.event.slug}`)}>
                        {booking.ticketType.event.title}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-gray-400">
                        <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-violet-400" /> {formatDateTime(booking.ticketType.event.startsAt)}</span>
                        <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-violet-400" /> <span className="truncate">{booking.ticketType.event.venue}</span></span>
                      </div>
                    </div>

                    {/* Actions buttons */}
                    {booking.status === "CONFIRMED" && (
                      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/5">
                        <button onClick={() => handleDownloadPdf(booking.id)} className="ep-btn-secondary py-2 px-4 text-xs bg-white/5 hover:bg-white/10 rounded-lg">
                          <Download className="h-3.5 w-3.5" /> Download PDF
                        </button>
                        <button onClick={() => handleAddToCalendar(booking.ticketType.event.title, booking.ticketType.event.startsAt)} className="ep-btn-secondary py-2 px-4 text-xs bg-white/5 hover:bg-white/10 rounded-lg">
                          <Calendar className="h-3.5 w-3.5" /> Calendar
                        </button>
                        <button onClick={() => handleShare(booking.ticketType.event.title)} className="ep-btn-ghost py-2 px-3 text-xs rounded-lg text-gray-400 hover:text-white">
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={handleEmailResend} className="ep-btn-ghost py-2 px-3 text-xs rounded-lg text-gray-400 hover:text-white" title="Resend Email">
                          <Mail className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={handleRequestInvoice} className="ep-btn-ghost py-2 px-3 text-xs rounded-lg text-gray-400 hover:text-white ml-auto" title="Request GST Invoice">
                          <ReceiptText className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {booking.status === "PENDING" && (
                      <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <p>Checkout was interrupted. Complete your payment to secure this ticket.</p>
                        </div>
                        <button
                          onClick={() => handleSimulatePayment(booking.id)}
                          disabled={payingId === booking.id}
                          className="ep-btn-primary w-full sm:w-auto py-2.5 px-6 font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-sm"
                        >
                          {payingId === booking.id ? "Processing Mock Payment..." : "Complete Payment (Mock)"}
                        </button>
                      </div>
                    )}

                    {activeTab === "cancelled" && (
                      <div className="pt-4 border-t border-white/5 text-xs text-gray-500 flex flex-col gap-1">
                        <p><span className="font-bold text-gray-400">Cancel Policy:</span> Non-refundable as per organizer terms.</p>
                        <p><span className="font-bold text-gray-400">Refund Status:</span> Not applicable.</p>
                      </div>
                    )}
                  </div>

                  {/* Vertical dash divider / Perforated visual element */}
                  <div className="hidden md:flex flex-col justify-between items-center py-2 h-full absolute right-[220px] top-0 bottom-0 pointer-events-none">
                    <div className="w-[1px] h-full border-r-2 border-dashed border-white/10" />
                    <div className="absolute top-[-10px] w-5 h-5 rounded-full bg-[#08070d] border-b border-white/5" />
                    <div className="absolute bottom-[-10px] w-5 h-5 rounded-full bg-[#08070d] border-t border-white/5" />
                  </div>

                  {/* Right block: Cost & QR Code validator */}
                  <div className="bg-[#0c0a18] md:w-[220px] p-8 shrink-0 flex flex-col justify-center items-center text-center border-t md:border-t-0 md:border-l border-white/5 relative">
                    <div className="mb-6">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total Paid</span>
                      <p className="text-2xl font-extrabold text-white font-mono mt-1">{formatPrice(booking.totalAmount)}</p>
                      <span className="text-[11px] text-gray-500 font-medium block mt-1">For {booking.quantity} ticket{booking.quantity !== 1 ? "s" : ""}</span>
                    </div>

                    {booking.status === "CONFIRMED" ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.15)] relative group cursor-pointer">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&color=000000&data=${encodeURIComponent(booking.qrCode)}`}
                            alt="Verification QR code"
                            className="h-24 w-24 object-contain"
                          />
                          <div className="absolute inset-0 bg-violet-600/80 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                            <QrCode className="h-8 w-8 text-white" />
                          </div>
                        </div>
                        <span className="text-[10px] text-violet-400 font-mono tracking-widest uppercase bg-violet-500/10 px-2 py-1 rounded">
                          {booking.qrCode.substring(0, 10)}...
                        </span>
                      </div>
                    ) : booking.status === "PENDING" ? (
                      <div className="h-24 w-24 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center">
                        <Clock className="h-8 w-8 text-gray-600" />
                      </div>
                    ) : (
                      <div className="h-24 w-24 border-2 border-dashed border-rose-500/20 rounded-xl flex items-center justify-center">
                        <AlertCircle className="h-8 w-8 text-rose-500/40" />
                      </div>
                    )}
                  </div>

                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
