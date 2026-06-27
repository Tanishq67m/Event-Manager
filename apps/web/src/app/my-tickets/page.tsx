"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { bookings, Booking } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime, formatPrice } from "@/lib/utils";

const statusStyle: Record<string, string> = {
  CONFIRMED: "ep-badge-green",
  PENDING: "ep-badge-yellow",
  CANCELLED: "ep-badge-red",
  REFUNDED: "ep-badge-gray",
};

export default function MyTicketsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/auth/login"); return; }
    if (user) {
      bookings.mine().then(setData).catch(console.error).finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="ep-card h-28 animate-pulse bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">My tickets</h1>

      {data.length === 0 ? (
        <div className="text-center py-20 ep-card">
          <p className="text-4xl mb-4">🎫</p>
          <h3 className="font-medium text-gray-900 mb-1">No tickets yet</h3>
          <p className="text-sm text-gray-500 mb-6">Register for an event to see your tickets here</p>
          <button onClick={() => router.push("/events")} className="ep-btn-primary">
            Browse events
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((booking) => (
            <div key={booking.id} className="ep-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={statusStyle[booking.status] || "ep-badge-gray"}>
                      {booking.status}
                    </span>
                    <span className="ep-badge-blue">{booking.ticketType.name}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate">
                    {booking.ticketType.event.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {formatDateTime(booking.ticketType.event.startsAt)} · {booking.ticketType.event.venue}
                  </p>
                  <p className="text-xs text-gray-400 mt-2 font-mono">{booking.qrCode}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-semibold text-gray-900">{formatPrice(booking.totalAmount)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">× {booking.quantity}</p>
                </div>
              </div>

              {booking.status === "CONFIRMED" && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-500">Show QR at entry</p>
                  <div className="text-right">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(booking.qrCode)}`}
                      alt="QR"
                      className="h-16 w-16 border border-gray-200 rounded p-0.5"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
