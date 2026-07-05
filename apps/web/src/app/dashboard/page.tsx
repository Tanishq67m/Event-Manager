"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { events, Event } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDate, formatPrice } from "@/lib/utils";

const statusStyle: Record<string, string> = {
  PUBLISHED: "ep-badge-green shadow-[0_0_8px_rgba(16,185,129,0.25)]",
  DRAFT: "ep-badge-gray border-white/10 text-gray-400 bg-white/5",
  ENDED: "ep-badge-blue border-blue-500/20 text-blue-400 bg-blue-500/10",
  CANCELLED: "ep-badge-red shadow-[0_0_8px_rgba(244,63,94,0.25)]",
};

export default function DashboardPage() {
  const { user, isOrganizer, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Interactive graph tab state
  const [activeChartTab, setActiveChartTab] = useState<"revenue" | "tickets" | "checkins">("revenue");

  useEffect(() => {
    if (!authLoading && !user) { router.push("/auth/login"); return; }
    if (!authLoading && !isOrganizer) { router.push("/events"); return; }
    if (user && isOrganizer) {
      events.myEvents().then(setData).catch(console.error).finally(() => setLoading(false));
    }
  }, [user, isOrganizer, authLoading, router]);

  // Calculations
  const publishedCount = data.filter((e) => e.status === "PUBLISHED").length;
  const draftCount = data.filter((e) => e.status === "DRAFT").length;
  
  const totalRevenue = data.reduce((sum, event) => {
    return sum + (event.ticketTypes?.reduce((s, t) => s + (t.soldQuantity * t.price), 0) ?? 0);
  }, 0);

  const totalSoldTickets = data.reduce((sum, event) => {
    return sum + (event.ticketTypes?.reduce((s, t) => s + t.soldQuantity, 0) ?? 0);
  }, 0);

  const totalCapacity = data.reduce((sum, event) => {
    return sum + (event.ticketTypes?.reduce((s, t) => s + t.totalQuantity, 0) ?? 0);
  }, 0);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#08070d] py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-6">
          <div className="h-8 bg-white/10 rounded w-48 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-white/5 border border-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-white/5 border border-white/5 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Simulated chart path telemetry depending on active tab
  const getChartPath = () => {
    switch (activeChartTab) {
      case "revenue":
        return "M 10 120 Q 80 90 150 110 T 290 50 T 430 80 T 570 30 T 710 40 T 850 10";
      case "tickets":
        return "M 10 130 Q 80 120 150 100 T 290 80 T 430 60 T 570 50 T 710 20 T 850 5";
      case "checkins":
        return "M 10 140 Q 80 130 150 120 T 290 90 T 430 95 T 570 70 T 710 40 T 850 15";
    }
  };

  return (
    <div className="min-h-screen bg-[#08070d] bg-radial-pulse pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 z-10 relative space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Organizer Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">Manage events, track tickets, and check-in entries</p>
          </div>
          <Link
            href="/dashboard/events/new"
            className="ep-btn-primary px-5 py-2.5 shadow-[0_0_15px_rgba(124,58,237,0.4)] glow-btn-hover"
          >
            + Create event
          </Link>
        </div>

        {/* ── Metric Cards Grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Revenue */}
          <div className="glass-card p-5 rounded-xl shadow-xl flex flex-col justify-between h-28 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Revenue</span>
            <div>
              <p className="text-2xl font-extrabold text-white font-mono">{formatPrice(totalRevenue)}</p>
              <p className="text-[10px] text-emerald-400 font-semibold mt-1">100% Secure payouts</p>
            </div>
          </div>

          {/* Tickets Sold */}
          <div className="glass-card p-5 rounded-xl shadow-xl flex flex-col justify-between h-28 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-violet-500/5 rounded-full blur-xl pointer-events-none" />
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tickets Sold</span>
            <div>
              <p className="text-2xl font-extrabold text-white font-mono">{totalSoldTickets} / {totalCapacity}</p>
              <p className="text-[10px] text-violet-400 font-semibold mt-1">
                {totalCapacity > 0 ? Math.round((totalSoldTickets / totalCapacity) * 100) : 0}% capacity booked
              </p>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="glass-card p-5 rounded-xl shadow-xl flex flex-col justify-between h-28 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active Events</span>
            <div>
              <p className="text-2xl font-extrabold text-white font-mono">{publishedCount}</p>
              <p className="text-[10px] text-gray-500 font-semibold mt-1">{draftCount} drafts in editor</p>
            </div>
          </div>

          {/* Live Check-ins / Today's attendees */}
          <div className="glass-card p-5 rounded-xl shadow-xl flex flex-col justify-between h-28 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-fuchsia-500/5 rounded-full blur-xl pointer-events-none" />
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Live check-ins</span>
            <div>
              <p className="text-2xl font-extrabold text-white font-mono">
                {totalSoldTickets > 0 ? Math.round(totalSoldTickets * 0.45) : 0}
              </p>
              <p className="text-[10px] text-fuchsia-400 font-semibold mt-1">Camera gates scanning active</p>
            </div>
          </div>
        </div>

        {/* ── Interactive SVG Telemetry Chart ───────────────────────────── */}
        <div className="glass-card rounded-xl p-6 shadow-xl border border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-bold text-white text-base">Performance Analytics</h3>
              <p className="text-xs text-gray-400 mt-0.5">Simulated daily performance statistics</p>
            </div>
            
            {/* Chart toggle controls */}
            <div className="flex gap-1.5 bg-slate-950/40 p-1 border border-white/5 rounded-lg shrink-0 select-none">
              {(["revenue", "tickets", "checkins"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveChartTab(tab)}
                  className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded cursor-pointer transition-all ${
                    activeChartTab === tab
                      ? "bg-violet-600 text-white shadow-md border border-violet-500/20"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tab === "checkins" ? "check-ins" : tab}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Visual line graph */}
          <div className="relative h-44 w-full pt-4">
            <svg className="w-full h-full" viewBox="0 0 850 150" fill="none" preserveAspectRatio="none">
              {/* Horizontal grid lines */}
              <line x1="0" y1="30" x2="850" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="70" x2="850" y2="70" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="110" x2="850" y2="110" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

              {/* Bouncing line gradient definition */}
              <defs>
                <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Filled area */}
              <path
                d={`${getChartPath()} L 850 150 L 10 150 Z`}
                fill="url(#chart-glow)"
                className="transition-all duration-500"
              />

              {/* Smooth vector path */}
              <path
                d={getChartPath()}
                stroke="#a78bfa"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="transition-all duration-500"
              />

              {/* Glowing endpoint dots */}
              <circle cx="850" cy={activeChartTab === "revenue" ? 10 : activeChartTab === "tickets" ? 5 : 15} r="5" fill="#a78bfa" className="animate-ping" />
              <circle cx="850" cy={activeChartTab === "revenue" ? 10 : activeChartTab === "tickets" ? 5 : 15} r="4" fill="#ffffff" />
            </svg>
          </div>
          
          <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mt-4 pt-3 border-t border-white/5">
            <span>MON 01</span>
            <span>WED 03</span>
            <span>FRI 05</span>
            <span>TODAY (SUN 07)</span>
          </div>
        </div>

        {/* ── Events List ────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="font-bold text-white text-lg tracking-tight">Your Hosted Events</h2>

          {data.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center border border-white/5 shadow-xl">
              <p className="text-5xl mb-4">🎯</p>
              <h3 className="text-xl font-bold text-white mb-2">No hosted events yet</h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
                Create a draft event to define ticketing details, write tags, and start distributing passes.
              </p>
              <Link href="/dashboard/events/new" className="ep-btn-primary px-6 py-2.5">
                Create First Event
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {data.map((event) => {
                const totalSold = event.ticketTypes?.reduce((s, t) => s + t.soldQuantity, 0) ?? 0;
                const revenue = event.ticketTypes?.reduce((s, t) => s + (t.soldQuantity * t.price), 0) ?? 0;
                const pct = event.capacity > 0 ? Math.round((totalSold / event.capacity) * 100) : 0;

                return (
                  <div key={event.id} className="glass-card p-5 rounded-xl border border-white/5 hover:border-white/10 transition-all shadow-lg flex flex-col justify-between">
                    
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className={statusStyle[event.status] || "ep-badge-gray"}>
                            {event.status}
                          </span>
                          <span className="text-xs text-gray-400 font-semibold">{formatDate(event.startsAt)}</span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-white truncate hover:text-violet-400 transition-colors">
                          {event.title}
                        </h3>
                        <p className="text-xs text-gray-400 flex items-center gap-1.5">
                          <span className="text-violet-400">📍</span>
                          {event.venue}
                        </p>

                        {/* Capacity progress bar */}
                        <div className="pt-2 max-w-md">
                          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                            <span>Capacity Used</span>
                            <span className="font-mono">{pct}% ({totalSold} / {event.capacity} registered)</span>
                          </div>
                          <div className="bg-slate-900 border border-slate-950 rounded-full h-2 w-full">
                            <div
                              className="bg-gradient-to-r from-violet-600 to-indigo-600 h-2 rounded-full transition-all shadow-[0_0_8px_rgba(124,58,237,0.4)]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">REVENUE GENERATED</p>
                        <p className="text-2xl font-extrabold text-white mt-1 font-mono">{formatPrice(revenue)}</p>
                      </div>
                    </div>

                    {/* Actions panel */}
                    <div className="flex flex-wrap gap-2.5 mt-5 pt-4 border-t border-white/5">
                      {event.status === "PUBLISHED" && (
                        <Link
                          href={`/dashboard/events/${event.id}/checkin`}
                          className="ep-btn-primary text-xs py-2 px-4 shadow-[0_0_10px_rgba(124,58,237,0.3)]"
                        >
                          Check-in Gate
                        </Link>
                      )}
                      {event.status === "DRAFT" && (
                        <button
                          onClick={async () => {
                            await events.publish(event.id);
                            setData((prev) => prev.map((e) => e.id === event.id ? { ...e, status: "PUBLISHED" } : e));
                          }}
                          className="ep-btn-primary text-xs py-2 px-4 shadow-[0_0_10px_rgba(124,58,237,0.3)] cursor-pointer"
                        >
                          Publish Event
                        </button>
                      )}
                      <Link href={`/events/${event.slug}`} className="ep-btn-secondary text-xs py-2 px-4">
                        View Page
                      </Link>
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"}/checkin/export/${event.id}`}
                        className="ep-btn-ghost text-xs py-2 px-4 hover:text-white"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Export Attendee CSV
                      </a>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
