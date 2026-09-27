"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus, Copy } from "lucide-react";
import { toast } from "sonner";
import { bookings, payments, Booking } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn, formatAmount, formatSchedule, formatTime } from "@/lib/utils";
import { BookingStatus, Status } from "@/components/ui/Status";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";

type Tab = "upcoming" | "past" | "cancelled";

/** Build and download an .ics file so the event lands in the attendee's own calendar. */
function downloadIcs(b: Booking) {
  const ev = b.ticketType.event;
  const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/[\\,;]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EventPulse//Tickets//EN",
    "BEGIN:VEVENT",
    `UID:${b.id}@eventpulse`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(ev.startsAt)}`,
    `DTEND:${stamp(ev.endsAt)}`,
    `SUMMARY:${esc(ev.title)}`,
    `LOCATION:${esc(ev.venue)}`,
    `DESCRIPTION:${esc(`${b.ticketType.name} × ${b.quantity}\nTicket code: ${b.qrCode}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ev.slug}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function MyTicketsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [payingId, setPayingId] = useState<string | null>(null);

  async function handleSimulatePayment(bookingId: string) {
    setPayingId(bookingId);
    try {
      const order = await payments.createOrder(bookingId);
      await payments.verify({
        razorpayOrderId: order.orderId,
        razorpayPaymentId: `pay_mock_${Math.random().toString(36).substring(7)}`,
        razorpaySignature: "mock_signature",
      });
      const updated = await bookings.mine();
      setData(updated);
      toast.success("Payment completed");
    } catch (err: unknown) {
      toast.error(`Payment failed: ${err instanceof Error ? err.message : "payment error"}`);
    } finally {
      setPayingId(null);
    }
  }

  useEffect(() => {
    if (!authLoading && !user) { router.push("/auth/login"); return; }
    if (user) {
      bookings.mine()
        .then(setData)
        .catch((err) => setError(err instanceof Error ? err.message : "Could not load your tickets"))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Ticket code copied");
    } catch {
      toast.error("Couldn't copy the code");
    }
  }

  const now = new Date();
  const bucket = (b: Booking): Tab => {
    if (b.status === "CANCELLED" || b.status === "REFUNDED") return "cancelled";
    return new Date(b.ticketType.event.startsAt) >= now ? "upcoming" : "past";
  };
  const counts = { upcoming: 0, past: 0, cancelled: 0 };
  data.forEach((b) => counts[bucket(b)]++);
  const filteredBookings = data.filter((b) => bucket(b) === activeTab);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="border-b border-border pb-5">
        <h1 className="text-xl font-semibold tracking-tight">My tickets</h1>
        <p className="mt-1 text-[13px] text-fg-muted">Show the QR code at the entrance. Each code is valid for one check-in.</p>
      </header>

      <div role="tablist" aria-label="Ticket filter" className="mt-5 flex gap-4 border-b border-border">
        {(["upcoming", "past", "cancelled"] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "-mb-px flex items-center gap-1.5 border-b-2 pb-2.5 text-[13px] font-medium capitalize transition-colors",
              activeTab === tab ? "border-fg text-fg" : "border-transparent text-fg-muted hover:text-fg"
            )}
          >
            {tab}
            {!loading && <span className="font-mono text-[11px] text-fg-subtle tabular">{counts[tab]}</span>}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {error ? (
          <Notice tone="danger" title="Couldn't load your tickets">{error}</Notice>
        ) : loading || authLoading ? (
          <div className="space-y-3" aria-busy="true">
            {[1, 2].map((i) => <div key={i} className="ep-skeleton h-40" />)}
          </div>
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            title={activeTab === "upcoming" ? "No upcoming tickets" : activeTab === "past" ? "No past tickets" : "No cancelled bookings"}
            description={activeTab === "upcoming" ? "Tickets you book will appear here with their entry QR code." : undefined}
            action={activeTab === "upcoming" && <Link href="/events" className="ep-btn-secondary">Browse events</Link>}
          />
        ) : (
          <ul className="space-y-3">
            {filteredBookings.map((booking) => {
              const ev = booking.ticketType.event;
              return (
                <li key={booking.id} className="ep-panel flex flex-col overflow-hidden sm:flex-row">
                  <div className="min-w-0 flex-1 p-4">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <BookingStatus status={booking.status} />
                      {booking.checkedIn && <Status tone="info">Checked in{booking.checkedInAt ? ` ${formatTime(booking.checkedInAt)}` : ""}</Status>}
                    </div>

                    <Link href={`/events/${ev.slug}`} className="mt-2 block truncate text-base font-medium hover:underline underline-offset-2">
                      {ev.title}
                    </Link>
                    <p className="mt-0.5 font-mono text-[12px] text-fg-muted tabular">{formatSchedule(ev.startsAt)}</p>
                    <p className="truncate text-[13px] text-fg-muted">{ev.venue}</p>

                    <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[13px]">
                      <div className="flex gap-1.5"><dt className="text-fg-muted">Tier</dt><dd>{booking.ticketType.name}</dd></div>
                      <div className="flex gap-1.5"><dt className="text-fg-muted">Qty</dt><dd className="tabular">{booking.quantity}</dd></div>
                      <div className="flex gap-1.5"><dt className="text-fg-muted">Paid</dt><dd className="tabular">{formatAmount(booking.totalAmount)}</dd></div>
                    </dl>

                    {booking.status === "CONFIRMED" && activeTab === "upcoming" && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => downloadIcs(booking)} className="ep-btn-secondary ep-btn-sm">
                          <CalendarPlus /> Add to calendar
                        </button>
                        <button onClick={() => copyCode(booking.qrCode)} className="ep-btn-ghost ep-btn-sm">
                          <Copy /> Copy code
                        </button>
                      </div>
                    )}

                    {booking.status === "PENDING" && (
                      <div className="mt-4 space-y-3">
                        <Notice tone="warning">Payment wasn&apos;t completed. Your seat is held, but the ticket isn&apos;t valid until you pay.</Notice>
                        <button
                          onClick={() => handleSimulatePayment(booking.id)}
                          disabled={payingId === booking.id}
                          className="ep-btn-primary"
                        >
                          {payingId === booking.id ? "Processing…" : "Complete payment (test mode)"}
                        </button>
                      </div>
                    )}
                  </div>

                  {booking.status === "CONFIRMED" && (
                    <div className="flex items-center gap-4 border-t border-dashed border-border-strong p-4 sm:w-48 sm:flex-col sm:justify-center sm:border-l sm:border-t-0">
                      <div className="shrink-0 rounded-md border border-border bg-white p-1.5">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&color=000000&data=${encodeURIComponent(booking.qrCode)}`}
                          alt={`Entry QR code for ${ev.title}`}
                          width={112}
                          height={112}
                          className="h-24 w-24 sm:h-28 sm:w-28"
                        />
                      </div>
                      <div className="min-w-0 sm:text-center">
                        <p className="ep-overline">Ticket code</p>
                        <p className="mt-0.5 break-all font-mono text-[12px] text-fg">{booking.qrCode}</p>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
