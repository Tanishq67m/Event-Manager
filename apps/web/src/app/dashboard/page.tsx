"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { events, Event } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDate, formatPrice } from "@/lib/utils";

const statusStyle: Record<string, string> = {
  PUBLISHED: "ep-badge-green",
  DRAFT: "ep-badge-gray",
  ENDED: "ep-badge-blue",
  CANCELLED: "ep-badge-red",
};

export default function DashboardPage() {
  const { user, isOrganizer, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/auth/login"); return; }
    if (!authLoading && !isOrganizer) { router.push("/events"); return; }
    if (user && isOrganizer) {
      events.myEvents().then(setData).catch(console.error).finally(() => setLoading(false));
    }
  }, [user, isOrganizer, authLoading, router]);

  const published = data.filter((e) => e.status === "PUBLISHED").length;
  const drafts = data.filter((e) => e.status === "DRAFT").length;
  const totalCapacity = data.reduce((s, e) => s + e.capacity, 0);

  if (loading || authLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-4">
        <div className="h-8 bg-gray-100 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your events and track registrations</p>
        </div>
        <Link href="/dashboard/events/new" className="ep-btn-primary">
          + New event
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total events", value: data.length },
          { label: "Published", value: published },
          { label: "Draft", value: drafts },
        ].map((s) => (
          <div key={s.label} className="ep-card p-5">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Events list */}
      <h2 className="font-semibold text-gray-900 mb-4">Your events</h2>

      {data.length === 0 ? (
        <div className="ep-card p-12 text-center">
          <p className="text-4xl mb-4">🎯</p>
          <h3 className="font-medium text-gray-900 mb-1">No events yet</h3>
          <p className="text-sm text-gray-500 mb-6">Create your first event to start collecting registrations</p>
          <Link href="/dashboard/events/new" className="ep-btn-primary">Create event</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((event) => {
            const totalSold = event.ticketTypes?.reduce((s, t) => s + t.soldQuantity, 0) ?? 0;
            const revenue = event.ticketTypes?.reduce((s, t) => s + (t.soldQuantity * t.price), 0) ?? 0;
            const pct = event.capacity > 0 ? Math.round((totalSold / event.capacity) * 100) : 0;

            return (
              <div key={event.id} className="ep-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={statusStyle[event.status] || "ep-badge-gray"}>{event.status}</span>
                      <span className="text-xs text-gray-400">{formatDate(event.startsAt)}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{event.venue}</p>

                    {/* Progress bar */}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-[#1A56A4] h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">{totalSold}/{event.capacity}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-900">{formatPrice(revenue)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">revenue</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                  {event.status === "PUBLISHED" && (
                    <Link href={`/dashboard/events/${event.id}/checkin`} className="ep-btn-primary text-xs py-1.5 px-3">
                      Check-in
                    </Link>
                  )}
                  {event.status === "DRAFT" && (
                    <button
                      onClick={async () => {
                        await events.publish(event.id);
                        setData((prev) => prev.map((e) => e.id === event.id ? { ...e, status: "PUBLISHED" } : e));
                      }}
                      className="ep-btn-primary text-xs py-1.5 px-3"
                    >
                      Publish
                    </button>
                  )}
                  <Link href={`/events/${event.slug}`} className="ep-btn-secondary text-xs py-1.5 px-3">
                    View page
                  </Link>
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"}/checkin/export/${event.id}`}
                    className="ep-btn-ghost text-xs py-1.5 px-3"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Export CSV
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
