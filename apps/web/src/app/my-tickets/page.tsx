"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus, Copy } from "lucide-react";
import { toast } from "sonner";
import { bookings, payments, Booking } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn, formatAmount, formatTime } from "@/lib/utils";

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

  const statusLabel: Record<string, [string, string]> = {
    CONFIRMED: ["Confirmed", "bg-success"],
    PENDING: ["Pending payment", "bg-warning"],
    CANCELLED: ["Cancelled", "bg-danger"],
    REFUNDED: ["Refunded", "bg-paper-muted"],
  };
  const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleString("en-IN", { ...o, timeZone: "Asia/Kolkata" });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header>
        <p className="ep-eyebrow">Your wallet</p>
        <h1 className="ep-display mt-4 text-[44px] sm:text-[56px]">My tickets</h1>
        <p className="mt-3 text-[15px] text-fg-muted">Show the QR code at the entrance. Each code works for one check-in.</p>
      </header>

      <div role="tablist" aria-label="Ticket filter" className="mt-8 inline-flex rounded-xl border border-border bg-surface p-1">
        {(["upcoming", "past", "cancelled"] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex h-9 items-center gap-2 rounded-lg px-3.5 text-[13.5px] font-medium capitalize transition-colors",
              activeTab === tab ? "bg-fg text-bg" : "text-fg-muted hover:text-fg"
            )}
          >
            {tab}
            {!loading && <span className="font-mono text-[11px] opacity-60 tabular">{counts[tab]}</span>}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {error ? (
          <Notice tone="danger" title="Couldn't load your tickets">{error}</Notice>
        ) : loading || authLoading ? (
          <div className="space-y-5" aria-busy="true">
            {[1, 2].map((i) => <div key={i} className="ep-skeleton h-52 rounded-2xl" />)}
          </div>
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            title={activeTab === "upcoming" ? "No upcoming tickets" : activeTab === "past" ? "No past tickets" : "No cancelled bookings"}
            description={activeTab === "upcoming" ? "Tickets you book show up here with their entry QR code." : undefined}
            action={activeTab === "upcoming" && <Link href="/events" className="ep-btn-primary">Find events</Link>}
          />
        ) : (
          <ul className="space-y-6">
            {filteredBookings.map((booking) => {
              const ev = booking.ticketType.event;
              const [label, dot] = statusLabel[booking.status] ?? [booking.status, "bg-paper-muted"];
              const confirmed = booking.status === "CONFIRMED";
              return (
                <li key={booking.id} className="ep-ticket-shadow">
                  <div
                    className={cn(
                      "ep-ticket-v sm:ep-ticket-h flex flex-col sm:flex-row",
                      "[--notch:calc(100%-196px)] sm:[--notch:calc(100%-212px)]",
                      !confirmed && "[--notch:calc(100%-1px)] sm:[--notch:calc(100%-1px)]"
                    )}
                  >
                    {/* Details */}
                    <div className="min-w-0 flex-1 p-5 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px] tracking-[0.14em] text-paper-muted">
                        <span>ADMIT {booking.quantity} · {ev.organization?.name?.toUpperCase() ?? "EVENTPULSE"}</span>
                        <span className="inline-flex items-center gap-1.5 text-paper-ink">
                          <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", dot)} />
                          <span className="uppercase tracking-[0.08em]">{label}</span>
                        </span>
                      </div>

                      <Link href={`/events/${ev.slug}`} className="ep-display mt-3 block text-[28px] leading-tight hover:underline hover:underline-offset-4">
                        {ev.title}
                      </Link>

                      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-[14px] sm:grid-cols-4">
                        {[
                          ["DATE", fmt(ev.startsAt, { weekday: "short", day: "numeric", month: "short" })],
                          ["TIME", fmt(ev.startsAt, { hour: "2-digit", minute: "2-digit", hour12: false })],
                          ["TIER", booking.ticketType.name],
                          ["PAID", formatAmount(booking.totalAmount)],
                        ].map(([k, v]) => (
                          <div key={k} className="min-w-0">
                            <dt className="font-mono text-[10px] tracking-[0.12em] text-paper-muted">{k}</dt>
                            <dd className="mt-0.5 truncate font-semibold tabular">{v}</dd>
                          </div>
                        ))}
                        <div className="col-span-2 min-w-0 sm:col-span-4">
                          <dt className="font-mono text-[10px] tracking-[0.12em] text-paper-muted">VENUE</dt>
                          <dd className="mt-0.5 truncate font-semibold">{ev.venue}</dd>
                        </div>
                      </dl>

                      {confirmed && activeTab === "upcoming" && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            onClick={() => downloadIcs(booking)}
                            className="ep-btn ep-btn-sm border-paper-rule bg-transparent text-paper-ink hover:bg-black/5"
                          >
                            <CalendarPlus /> Add to calendar
                          </button>
                          <button onClick={() => copyCode(booking.qrCode)} className="ep-btn ep-btn-sm bg-transparent text-paper-muted hover:bg-black/5 hover:text-paper-ink">
                            <Copy /> Copy code
                          </button>
                        </div>
                      )}

                      {booking.status === "PENDING" && (
                        <div className="mt-5 space-y-3">
                          <p className="rounded-lg bg-[#f7ecd6] px-3 py-2.5 text-[13px] text-[#6b4304]">
                            Payment wasn&apos;t completed. Your seat is held, but the ticket isn&apos;t valid until you pay.
                          </p>
                          <button onClick={() => handleSimulatePayment(booking.id)} disabled={payingId === booking.id} className="ep-btn-primary">
                            {payingId === booking.id ? "Processing…" : "Complete payment (test mode)"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Stub */}
                    {confirmed && (
                      <div className="flex items-center gap-4 border-t-2 border-dashed border-paper-rule p-5 sm:w-[212px] sm:flex-col sm:justify-center sm:border-l-2 sm:border-t-0">
                        <div className="shrink-0 rounded-lg bg-white p-2 ring-1 ring-black/10">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&color=000000&data=${encodeURIComponent(booking.qrCode)}`}
                            alt={`Entry QR code for ${ev.title}`}
                            width={112}
                            height={112}
                            className="h-24 w-24 sm:h-28 sm:w-28"
                          />
                        </div>
                        <div className="min-w-0 sm:text-center">
                          <p className="font-mono text-[10px] tracking-[0.12em] text-paper-muted">TICKET CODE</p>
                          <p className="mt-0.5 break-all font-mono text-[12px] font-medium">{booking.qrCode}</p>
                          {booking.checkedIn && (
                            <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10.5px] text-[#16794a]">
                              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#16794a]" />
                              CHECKED IN{booking.checkedInAt ? ` ${formatTime(booking.checkedInAt)}` : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
