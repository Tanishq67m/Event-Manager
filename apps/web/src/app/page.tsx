"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { events, Event } from "@/lib/api";
import EventCard from "@/components/EventCard";
import { useAuth } from "@/lib/auth-context";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function LandingPage() {
  const { user } = useAuth();
  // Stats & States
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 12, hours: 8, minutes: 45, seconds: 30 });
  const [isPlayingSales, setIsPlayingSales] = useState(true);
  const [salesVolume, setSalesVolume] = useState(72);
  const [currentSalesEvent, setCurrentSalesEvent] = useState("Techno Night 2026");
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  
  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Search input
  const [searchVal, setSearchVal] = useState("");

  // Countdown timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Live sales ticker rotation
  useEffect(() => {
    if (!isPlayingSales) return;
    const items = [
      "Techno Night 2026",
      "Startup Pitch Meetup",
      "Standup Comedy Special",
      "VIP Music Fest Pass",
      "Neon Art Exhibition"
    ];
    const interval = setInterval(() => {
      const randomEvent = items[Math.floor(Math.random() * items.length)];
      const randomVol = Math.floor(Math.random() * 40) + 50;
      setCurrentSalesEvent(randomEvent);
      setSalesVolume(randomVol);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPlayingSales]);

  // Load featured events from backend
  useEffect(() => {
    events
      .list({ page: 1, limit: 3 })
      .then((res) => {
        setFeaturedEvents(res.data || []);
      })
      .catch((err) => {
        console.error("Error loading landing page events:", err);
      })
      .finally(() => {
        setLoadingEvents(false);
      });
  }, []);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-[#08070d] bg-radial-pulse relative overflow-hidden pb-1">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-900/10 blur-[150px] pointer-events-none" />

      {/* ── SECTION 1: HERO & WIDGETS ──────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-24 grid lg:grid-cols-12 gap-10 items-center z-10 relative">
        {/* Left: Copy & Search */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/15 border border-violet-500/20 px-3.5 py-1.5 text-xs font-semibold text-violet-400">
            <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse shadow-[0_0_8px_#a78bfa]" />
            ⚡ Built for creators, communities, startups and colleges
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.05]">
              EXPERIENCE THE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400">
                PULSE
              </span>
            </h1>
            <p className="text-2xl sm:text-3xl font-medium text-violet-400/90 tracking-wide font-sans italic">
              Live the Moment
            </p>
          </div>

          <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
            Create events in minutes. Book tickets in seconds. Automate checkout, payments via Razorpay,
            and QR check-in gates inside one sleek, Apple-level interface.
          </p>

          {/* Search bar inside Hero */}
          <div className="max-w-md mx-auto lg:mx-0">
            <form action="/events" className="flex gap-2">
              <input
                type="text"
                name="search"
                className="ep-input bg-white/5 border-white/10"
                placeholder="Search events, host organizers, venues…"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
              />
              <button type="submit" className="ep-btn-primary px-6">Explore</button>
            </form>
            {/* Category quick links */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-2.5 mt-4 text-xs text-gray-400">
              <span className="font-semibold text-gray-500">Popular:</span>
              {["Concerts", "Festivals", "Movies", "Comedy"].map((cat) => (
                <Link
                  key={cat}
                  href={`/events?search=${cat}`}
                  className="hover:text-violet-400 transition-colors underline decoration-dotted"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>

          {/* Live Sales Ticker Widget */}
          <div className="glass-card rounded-xl p-5 max-w-lg mx-auto lg:mx-0 shadow-2xl relative overflow-hidden border border-white/10">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                  Live Ticket Sales
                </span>
              </div>
              <span className="text-xs text-gray-500 font-medium">Auto-tracking</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPlayingSales(!isPlayingSales)}
                className="h-10 w-10 shrink-0 rounded-full bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/30 flex items-center justify-center text-white focus:outline-none transition-colors"
              >
                {isPlayingSales ? (
                  <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="h-4.5 w-4.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{currentSalesEvent}</p>
                <p className="text-xs text-gray-400 mt-0.5">Estimated Volume: {salesVolume}% capacity</p>
              </div>

              {/* Soundwave visualizer */}
              <div className="flex items-end gap-[3px] h-8 shrink-0">
                {[12, 24, 18, 30, 16, 26, 14, 28, 20, 15].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      height: isPlayingSales ? `${h}px` : "4px",
                      animationDelay: `${i * 0.1}s`,
                    }}
                    className={`w-[3px] rounded-full bg-violet-500 transition-all duration-300 ${
                      isPlayingSales ? "animate-bounce" : ""
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Premium Widgets */}
        <div className="lg:col-span-5 space-y-6">
          {/* Attendee counter overlay card */}
          <div className="glass-card rounded-xl p-5 flex items-center justify-between shadow-xl">
            <div className="flex items-center -space-x-3 overflow-hidden">
              {[
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
              ].map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt="Attendee avatar"
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-slate-950 object-cover"
                />
              ))}
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 ring-2 ring-slate-950 text-[10px] font-semibold text-white">
                +12K
              </div>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-white">120K+ Booked</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Tickets booked this month</p>
            </div>
          </div>

          {/* Ticket Wallet mockup pass */}
          <div className="glass-card rounded-xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between h-[210px] border-l-4 border-l-violet-500">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl" />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">
                  Ticket Wallet Pass
                </span>
                <h3 className="text-lg font-bold text-white mt-1 leading-snug">EventPulse Global 2026</h3>
                <p className="text-xs text-gray-400 mt-1">General Admission • 1-Day Access</p>
              </div>
              <div className="bg-white/5 rounded-lg p-1 border border-white/10 shrink-0">
                <div className="w-10 h-10 flex flex-col justify-between gap-[2px]">
                  {[1, 4, 2, 3, 5, 2, 4].map((w, idx) => (
                    <div key={idx} className="bg-white/80 h-[2px] w-full" />
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-dashed border-white/10 pt-4 flex items-center justify-between mt-4">
              <div>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Attendee Cost</span>
                <p className="text-xl font-extrabold text-white mt-0.5">₹100</p>
              </div>
              <Link
                href="/events"
                className="h-10 w-10 rounded-full bg-white text-slate-950 flex items-center justify-center hover:scale-105 transition-transform"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Countdown widget */}
          <div className="glass-card rounded-xl p-6 text-center shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600" />
            <span className="text-[10px] font-bold tracking-widest text-violet-400 uppercase">
              Countdown to next major event
            </span>
            <div className="grid grid-cols-4 gap-4 mt-4">
              {[
                { val: timeLeft.days, label: "Days" },
                { val: timeLeft.hours, label: "Hours" },
                { val: timeLeft.minutes, label: "Mins" },
                { val: timeLeft.seconds, label: "Secs" },
              ].map((t, idx) => (
                <div key={idx} className="bg-slate-950/40 border border-white/5 rounded-lg py-3 px-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                    {String(t.val).padStart(2, "0")}
                  </span>
                  <span className="block text-[10px] text-gray-500 mt-1 uppercase font-medium">
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: FEATURED EVENTS ──────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 mt-32 z-10 relative">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold tracking-widest text-violet-400 uppercase mb-2">Live Showcases</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">Featured events on EventPulse</h2>
          </div>
          <Link href="/events" className="text-sm font-semibold text-violet-400 hover:text-white flex items-center gap-1 transition-colors">
            <span>Browse all events</span>
            <span>→</span>
          </Link>
        </div>

        {loadingEvents ? (
          <div className="grid sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-xl h-72 animate-pulse bg-white/5" />
            ))}
          </div>
        ) : featuredEvents.length === 0 ? (
          /* High fidelity fallback event listings if DB is empty */
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                id: "mock-1",
                title: "Techno Summer Pulse Fest 2026",
                slug: "techno-pulse-2026",
                venue: "Indira Sound Arena, Pune",
                startsAt: "2026-07-20T18:00:00.000Z",
                capacity: 500,
                organization: { name: "Techno Beats Club" },
                ticketTypes: [{ price: 49900, soldQuantity: 180, totalQuantity: 300 }]
              },
              {
                id: "mock-2",
                title: "React Next Gen Developer Summit",
                slug: "react-summit-2026",
                venue: "Dev Community Hall, Bangalore",
                startsAt: "2026-08-12T09:00:00.000Z",
                capacity: 200,
                organization: { name: "JS Pune Guild" },
                ticketTypes: [{ price: 0, soldQuantity: 95, totalQuantity: 200 }]
              },
              {
                id: "mock-3",
                title: "Laugh Riot: Open Mic Comedy Special",
                slug: "laugh-riot-comedy",
                venue: "The Comedy Cellar, Mumbai",
                startsAt: "2026-07-28T20:00:00.000Z",
                capacity: 80,
                organization: { name: "Standup Comedy Inc" },
                ticketTypes: [{ price: 29900, soldQuantity: 80, totalQuantity: 80 }] // Sold out mockup
              }
            ].map((mockEvent) => (
              <EventCard key={mockEvent.id} event={mockEvent as unknown as Event} />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-6">
            {featuredEvents.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>

      {/* ── SECTION 3: HOW IT WORKS ────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 mt-32 z-10 relative">
        <div className="text-center max-w-lg mx-auto mb-16 space-y-3">
          <p className="text-xs font-semibold tracking-widest text-violet-400 uppercase">Interactive Flow</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            How EventPulse works
          </h2>
          <p className="text-sm text-gray-400">Manage ticketing flows and booking passes seamlessly.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Create in minutes",
              body: "Use our Notion-style Event Creator to set titles, times, visual banners, and custom ticket types (Free, Paid, VIP, Early Bird).",
            },
            {
              step: "02",
              title: "Book in seconds",
              body: "Attendees discover your listing page, select categories, choose seats using the interactive seat mapping, and pay via Razorpay.",
            },
            {
              step: "03",
              title: "Scan at the gate",
              body: "Validate entry passes instantly using the phone-browser camera check-in tool. Entry logs update dashboard graphs in real-time.",
            },
          ].map((s, idx) => (
            <div key={idx} className="glass-card p-6.5 rounded-xl border border-white/5 hover:border-violet-500/20 transition-all duration-300 relative group">
              <div className="text-xs font-bold text-violet-400 mb-4 font-mono tracking-widest uppercase">{s.step}</div>
              <h3 className="font-bold text-white text-base mb-2.5">{s.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed font-normal">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 4: ORGANIZER BENEFITS ──────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 mt-32 z-10 relative">
        <div className="glass-card rounded-2xl p-8 sm:p-12 shadow-2xl relative overflow-hidden border border-white/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl" />
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-xs font-bold tracking-widest text-violet-400 uppercase">Designed for Growth</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Linear-quality analytics dashboards for every host.
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed font-normal">
                Ditch the chaotic spreadsheets and legacy interfaces. EventPulse empowers organization owners with active sales graphs, conversion metrics, capacity progress meters, and CSV exports.
              </p>

              <div className="space-y-3.5">
                {[
                  "Real-time tracking of ticket revenue and registration numbers.",
                  "Multi-tier concurrent ticket slots (VIP, Early bird, General Admission).",
                  "Direct Neon PostgreSQL database integrations with Prisma adapters.",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3.5 text-sm text-gray-300">
                    <span className="h-5 w-5 shrink-0 rounded-full bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-400">
                      ✓
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom mini dashboard widget mockup */}
            <div className="bg-[#0b0914] rounded-xl border border-white/10 p-6 shadow-inner space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Telemetry</span>
                  <h4 className="text-xs font-bold text-white mt-0.5">Sales Tracking Analytics</h4>
                </div>
                <span className="text-[10px] bg-violet-500/15 border border-violet-500/30 text-violet-400 px-2 py-0.5 rounded font-mono font-bold">
                  LIVE FEED
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-slate-950/40 border border-white/5 rounded-lg p-3">
                  <span className="text-[10px] text-gray-500">TOTAL REVENUE</span>
                  <p className="text-base font-extrabold text-white mt-0.5">₹42,500</p>
                </div>
                <div className="bg-slate-950/40 border border-white/5 rounded-lg p-3">
                  <span className="text-[10px] text-gray-500">TICKETS SOLD</span>
                  <p className="text-base font-extrabold text-white mt-0.5">185 / 200</p>
                </div>
              </div>

              {/* Simulated analytics graph line */}
              <div className="pt-2">
                <span className="text-[10px] text-gray-500 block mb-2">WEEKLY REGISTRATIONS</span>
                <div className="h-16 flex items-end gap-1.5">
                  {[20, 35, 25, 45, 60, 52, 78].map((h, idx) => (
                    <div key={idx} className="flex-1 flex flex-col justify-end h-full group">
                      <div 
                        style={{ height: `${h}%` }}
                        className="bg-violet-600/60 group-hover:bg-violet-500 rounded-t transition-all duration-300"
                      />
                      <span className="text-[8px] text-gray-500 text-center mt-1 font-mono">{idx + 1}D</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: TESTIMONIALS ────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 mt-32 z-10 relative">
        <div className="text-center max-w-lg mx-auto mb-16 space-y-3">
          <p className="text-xs font-semibold tracking-widest text-violet-400 uppercase font-mono">Testimonials</p>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Approved by event hosts</h2>
          <p className="text-sm text-gray-400">See how startups, colleges, and music clubs manage bookings.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              quote: "We hosted our annual startup meet on EventPulse. The ticket sales flow took less than 2 minutes to configure and checkout via UPI was seamless.",
              author: "Nikhil Deshmukh",
              role: "Co-Founder, DevPulse Pune",
              img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80"
            },
            {
              quote: "The visual seat booking layout is beautiful. Attendees booked early bird tickets and checked in with zero gates friction using the inline scanning camera.",
              author: "Aarushi Verma",
              role: "Cultural Secretary, GCoER",
              img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
            },
            {
              quote: "Linear dashboard speed. We monitored checkout rates and ticket capacity live. Best UX we have experienced on an event management tool.",
              author: "Vikram Kulkarni",
              role: "Music Curator, Techno Room",
              img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
            }
          ].map((t, idx) => (
            <div key={idx} className="glass-card p-6.5 rounded-xl flex flex-col justify-between shadow-lg relative border border-white/5">
              <p className="text-sm text-gray-300 leading-relaxed font-normal italic">"{t.quote}"</p>
              <div className="flex items-center gap-3.5 mt-6 pt-4 border-t border-white/5">
                <img src={t.img} alt={t.author} className="h-10 w-10 rounded-full object-cover border border-violet-500/20" />
                <div>
                  <h4 className="text-sm font-bold text-white">{t.author}</h4>
                  <p className="text-[10px] text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 6: PRICING ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 mt-32 z-10 relative">
        <div className="text-center max-w-lg mx-auto mb-16 space-y-3">
          <p className="text-xs font-semibold tracking-widest text-violet-400 uppercase">Transparent Pricing</p>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Flexible plans for any event size</h2>
          <p className="text-sm text-gray-400">No hidden fees, simple commission-based upgrades.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Tier */}
          <div className="glass-card rounded-xl p-8 border border-white/10 flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
              <span className="text-[10px] bg-white/5 text-gray-400 border border-white/10 px-2.5 py-1 rounded font-bold uppercase">
                Community
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-extrabold text-white">₹0</span>
                <span className="text-xs text-gray-500">per ticket sold</span>
              </div>
              <p className="text-xs text-gray-400">Great for colleges, hackathons, and free meetups.</p>
              <ul className="space-y-2.5 pt-4 text-xs text-gray-300">
                {["1 Event Host Organization", "Up to 100 capacity", "Standard QR tickets Wallet", "Basic check-in tool"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-violet-400 font-bold">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href={user ? "/dashboard/events/new" : "/auth/register?role=ORGANIZER"}
              className="ep-btn-secondary w-full py-2.5 text-center mt-8 block"
            >
              {user ? "Create Event" : "Sign up free"}
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="glass-card rounded-xl p-8 border border-violet-500/30 flex flex-col justify-between shadow-2xl relative">
            <div className="absolute top-0 right-0 bg-violet-600 text-white text-[9px] font-bold uppercase px-3 py-1 rounded-bl-lg rounded-tr-lg tracking-widest">
              POPULAR
            </div>
            <div className="space-y-4">
              <span className="text-[10px] bg-violet-500/15 text-violet-400 border border-violet-500/20 px-2.5 py-1 rounded font-bold uppercase">
                Pro Organizer
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-extrabold text-white">1.5%</span>
                <span className="text-xs text-gray-500">commission fee</span>
              </div>
              <p className="text-xs text-gray-400">For startups, paid concerts, and conference tickets.</p>
              <ul className="space-y-2.5 pt-4 text-xs text-gray-300">
                {["Unlimited events", "Unlimited seating capacity", "Invite-only ticket settings", "Live dashboard graphs", "Priority QR check-in gates"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-violet-400 font-bold">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href={user ? "/dashboard/events/new" : "/auth/register?role=ORGANIZER"}
              className="ep-btn-primary w-full py-2.5 text-center mt-8 block shadow-[0_0_15px_rgba(124,58,237,0.4)] animate-pulse"
            >
              {user ? "Create Event" : "Go Pro"}
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 7: FAQS ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 mt-32 z-10 relative">
        <div className="text-center mb-16 space-y-3">
          <p className="text-xs font-semibold tracking-widest text-violet-400 uppercase">Support Center</p>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "How do ticket payouts work on EventPulse?",
              a: "We integrate directly with Razorpay. Payouts for paid events are routed straight to the organizer's configured Razorpay bank account once checkout completes."
            },
            {
              q: "Can I manage multiple ticket tiers concurrent in one event?",
              a: "Yes! While creating an event draft inside the dashboard, you can add multiple ticket type grids (e.g. VIP, Early Bird, General Admission) with distinct pricing thresholds and capacity caps."
            },
            {
              q: "Does the QR scanner require a mobile app install?",
              a: "Not at all. The EventPulse QR Validator runs directly inside any mobile browser (Safari, Chrome, etc.). Organizers simply open the gate URL and position ticket codes under the camera."
            },
            {
              q: "Can I set an event to private or invite-only?",
              a: "Yes. In the event creation screen, you can toggle ticket types to be Invite-Only, allowing you to restrict visibility or distribute tickets privately."
            }
          ].map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="glass-card rounded-xl border border-white/5 overflow-hidden">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left py-5 px-6 flex items-center justify-between text-white font-bold text-sm select-none cursor-pointer hover:bg-white/2"
                >
                  <span>{faq.q}</span>
                  <span className="text-xs text-gray-400 font-semibold">{isOpen ? "▲" : "▼"}</span>
                </button>
                {isOpen && (
                  <div className="py-4 px-6 border-t border-white/5 text-xs text-gray-400 leading-relaxed font-normal">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── SECTION 8: FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-white/5 mt-32 bg-slate-950/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-3.5 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-violet-500 shadow-[0_0_8px_#7c3aed]" />
              <span className="text-sm font-extrabold text-white">EventPulse</span>
            </div>
            <p className="text-xs text-gray-500 leading-normal">
              A modern event management platform built for creators, startups, and college clubs.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Platform</h4>
            <ul className="space-y-2.5 text-xs text-gray-500">
              <li><Link href="/events" className="hover:text-white transition-colors">Browse Events</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link href="/my-tickets" className="hover:text-white transition-colors">My Tickets</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Security</h4>
            <ul className="space-y-2.5 text-xs text-gray-500">
              <li><span className="hover:text-white transition-colors">Razorpay Secure</span></li>
              <li><span className="hover:text-white transition-colors">QR Integrity</span></li>
              <li><span className="hover:text-white transition-colors">Database Encrypted</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Vision</h4>
            <p className="text-xs text-gray-500 leading-relaxed font-normal">
              Not just another Eventbrite clone. Redefining event bookings.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-600">
          <span>© 2026 EventPulse Monorepo Inc. All rights reserved.</span>
          <span className="font-mono">development build</span>
        </div>
      </footer>
    </div>
  );
}
