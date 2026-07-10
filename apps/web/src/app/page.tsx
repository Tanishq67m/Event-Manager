"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { events, Event } from "@/lib/api";
import EventCard from "@/components/EventCard";
import { useAuth } from "@/lib/auth-context";
import {
  CalendarDays,
  Ticket,
  BarChart3,
  Smartphone,
  ChevronRight,
  ChevronDown,
  Star,
  Users,
  ShieldCheck,
  Zap,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
} as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function LandingPage() {
  const { user } = useAuth();
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    events
      .list({ page: 1, limit: 3 })
      .then((res) => setFeaturedEvents(res.data || []))
      .catch((err) => console.error("Error loading events:", err))
      .finally(() => setLoadingEvents(false));
  }, []);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-[#0a0910] bg-radial-pulse relative overflow-hidden pb-1">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-900/10 blur-[150px] pointer-events-none" />

      {/* ── SECTION: HERO ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-24 pb-16 z-10 relative">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="text-center max-w-4xl mx-auto space-y-8"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full bg-violet-500/15 border border-violet-500/20 px-4 py-1.5 text-xs font-semibold text-violet-400">
            <Zap className="h-3.5 w-3.5 text-violet-400" />
            Built for creators, communities, startups and colleges
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            Sell out your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400">
              next event.
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Create events in minutes. Book tickets in seconds. Automate checkout, payments, and QR check-in gates inside one sleek, premium platform.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href={user ? "/dashboard/events/new" : "/auth/register?role=ORGANIZER"} className="ep-btn-primary px-8 py-3.5 text-base w-full sm:w-auto">
              Start Hosting Free <ChevronRight className="h-4 w-4" />
            </Link>
            <Link href="/events" className="ep-btn-secondary px-8 py-3.5 text-base w-full sm:w-auto">
              Explore Events
            </Link>
          </motion.div>

          {/* Hero Image Mockup */}
          <motion.div variants={fadeUp} className="pt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0910] via-transparent to-transparent z-10" />
            <div className="glass-card rounded-2xl border border-white/10 p-2 shadow-2xl relative mx-auto max-w-5xl">
              <img
                src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80"
                alt="Event Dashboard Preview"
                className="rounded-xl w-full object-cover h-[400px] sm:h-[500px] opacity-80 mix-blend-lighten"
              />
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-sm text-left shadow-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-violet-600 flex items-center justify-center">
                      <Ticket className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Techno Pulse 2026</p>
                      <p className="text-xs text-gray-400">Sold out • 500 Attendees</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-full" />
                    </div>
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-400">Capacity reached</span>
                      <span className="text-emerald-400">100%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── SECTION: TRUSTED BY ──────────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-white/[0.02] py-10 relative z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-xs font-semibold tracking-widest text-gray-500 uppercase mb-6">
            Trusted by modern organizers
          </p>
          <div className="flex flex-wrap justify-center gap-8 sm:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Using text logos for now */}
            <div className="text-xl font-black tracking-tighter text-white">Startup India</div>
            <div className="text-xl font-bold font-serif italic text-white">Pune JS</div>
            <div className="text-xl font-extrabold tracking-widest text-white uppercase">TechnoFest</div>
            <div className="text-xl font-medium tracking-tight text-white">Google Devs</div>
          </div>
        </div>
      </section>

      {/* ── SECTION: FEATURED EVENTS ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-24 z-10 relative">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <div className="flex flex-col sm:flex-row items-end justify-between mb-10 gap-4">
            <motion.div variants={fadeUp}>
              <p className="text-xs font-semibold tracking-widest text-violet-400 uppercase mb-2">Live Showcases</p>
              <h2 className="text-3xl font-bold text-white tracking-tight">Trending on EventPulse</h2>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Link href="/events" className="text-sm font-semibold text-violet-400 hover:text-white flex items-center gap-1 transition-colors">
                Browse all <ChevronRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {loadingEvents ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="glass-card rounded-2xl h-80 animate-pulse bg-white/5 border border-white/5" />
              ))
            ) : featuredEvents.length === 0 ? (
              <div className="col-span-3 text-center py-12 glass-card rounded-2xl border border-white/5">
                <p className="text-gray-400">No events found. Be the first to create one!</p>
              </div>
            ) : (
              featuredEvents.map((e) => (
                <motion.div key={e.id} variants={fadeUp}>
                  <EventCard event={e} />
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </section>

      {/* ── SECTION: CATEGORIES ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 z-10 relative">
        <div className="flex flex-wrap justify-center gap-4">
          {["Concerts", "Workshops", "Tech Meetups", "Comedy Shows", "Hackathons", "Festivals"].map((cat) => (
            <Link
              key={cat}
              href={`/events?search=${cat}`}
              className="glass-card px-6 py-3 rounded-full text-sm font-medium text-gray-300 hover:text-white hover:bg-violet-600/20 hover:border-violet-500/30 transition-all"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* ── SECTION: HOW IT WORKS ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-24 z-10 relative">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center max-w-2xl mx-auto mb-16 space-y-4"
        >
          <p className="text-xs font-semibold tracking-widest text-violet-400 uppercase">Seamless Flow</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Everything you need. Nothing you don't.</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <CalendarDays className="h-6 w-6 text-violet-400" />,
              title: "Create in minutes",
              body: "Launch beautiful event pages with our Stripe-like setup wizard. Add banners, map locations, and multiple ticket tiers instantly.",
            },
            {
              icon: <Ticket className="h-6 w-6 text-fuchsia-400" />,
              title: "Book in seconds",
              body: "Give attendees a frictionless checkout experience. Payments are securely processed via Razorpay directly to your account.",
            },
            {
              icon: <Smartphone className="h-6 w-6 text-indigo-400" />,
              title: "Scan at the gate",
              body: "Use any smartphone camera to scan QR tickets at the door. Prevent duplicates and track live capacity automatically.",
            },
          ].map((feature, idx) => (
            <motion.div key={idx} variants={fadeUp} className="glass-card p-8 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm">{feature.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SECTION: ORGANIZER BENEFITS & ANALYTICS ──────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-24 z-10 relative">
        <div className="glass-card rounded-3xl p-8 md:p-16 shadow-2xl relative overflow-hidden border border-white/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px]" />
          
          <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="space-y-6"
            >
              <motion.p variants={fadeUp} className="text-xs font-bold tracking-widest text-violet-400 uppercase">Designed for Growth</motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Linear-quality analytics dashboards for every host.
              </motion.h2>
              <motion.p variants={fadeUp} className="text-base text-gray-400 leading-relaxed">
                Ditch chaotic spreadsheets. EventPulse empowers you with active sales graphs, conversion metrics, capacity progress meters, and seamless CSV exports.
              </motion.p>

              <motion.ul variants={fadeUp} className="space-y-4 pt-4">
                {[
                  "Real-time tracking of ticket revenue",
                  "Multi-tier concurrent ticket slots",
                  "Automated email receipts & reminders",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-gray-300">
                    <ShieldCheck className="h-5 w-5 text-violet-400 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </motion.ul>
            </motion.div>

            {/* Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="bg-slate-950/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-gray-400" />
                  <h4 className="text-sm font-bold text-white">Live Telemetry</h4>
                </div>
                <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full font-mono font-bold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" /> SYNCING
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Gross Revenue</span>
                  <p className="text-2xl font-extrabold text-white mt-1">₹42,500</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Tickets Sold</span>
                  <p className="text-2xl font-extrabold text-white mt-1">185 <span className="text-sm text-gray-500 font-medium">/ 200</span></p>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[10px] text-gray-500 block mb-3 font-bold uppercase tracking-wider">Weekly Velocity</span>
                <div className="h-24 flex items-end gap-2">
                  {[20, 35, 25, 45, 60, 52, 78].map((h, idx) => (
                    <div key={idx} className="flex-1 flex flex-col justify-end h-full group">
                      <div 
                        style={{ height: `${h}%` }}
                        className="bg-violet-600/40 group-hover:bg-violet-500 rounded-t-sm transition-all duration-300 relative"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION: PRICING ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-24 z-10 relative">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <p className="text-xs font-semibold tracking-widest text-violet-400 uppercase">Transparent Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Flexible plans for any size</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass-card rounded-3xl p-10 border border-white/10 flex flex-col shadow-xl">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Community</span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-white">₹0</span>
              <span className="text-sm text-gray-500 font-medium">per ticket</span>
            </div>
            <p className="text-sm text-gray-400 mt-4 h-10">Perfect for free meetups, college clubs, and hackathons.</p>
            <div className="border-t border-white/10 my-8" />
            <ul className="space-y-4 text-sm text-gray-300 flex-1">
              {["Unlimited free events", "Up to 100 capacity", "Standard QR tickets", "Basic check-in tool"].map((f, i) => (
                <li key={i} className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 text-violet-400" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/auth/register?role=ORGANIZER" className="ep-btn-secondary w-full py-3 mt-8">Start Free</Link>
          </div>

          <div className="glass-card rounded-3xl p-10 border border-violet-500/30 flex flex-col shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
            <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">Pro</span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-white">1.5%</span>
              <span className="text-sm text-gray-500 font-medium">+ standard gateway fees</span>
            </div>
            <p className="text-sm text-gray-400 mt-4 h-10">For startups, paid concerts, and serious event hosts.</p>
            <div className="border-t border-white/10 my-8" />
            <ul className="space-y-4 text-sm text-gray-300 flex-1">
              {["Unlimited paid events", "Unlimited capacity", "Advanced analytics dashboard", "Priority QR check-in gates"].map((f, i) => (
                <li key={i} className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 text-violet-400" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/auth/register?role=ORGANIZER" className="ep-btn-primary w-full py-3 mt-8 shadow-[0_0_20px_rgba(124,58,237,0.3)]">Go Pro</Link>
          </div>
        </div>
      </section>

      {/* ── SECTION: TESTIMONIALS ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-24 z-10 relative">
        <div className="text-center mb-16 space-y-4">
          <p className="text-xs font-semibold tracking-widest text-violet-400 uppercase">Testimonials</p>
          <h2 className="text-3xl font-bold text-white tracking-tight">Approved by top hosts</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              quote: "We hosted our annual startup meet on EventPulse. The ticket sales flow took less than 2 minutes to configure and checkout was seamless.",
              author: "Nikhil D.",
              role: "Co-Founder, DevPulse",
            },
            {
              quote: "The visual seat booking layout is beautiful. Attendees booked early bird tickets and checked in with zero gates friction using the inline scanning camera.",
              author: "Aarushi V.",
              role: "Cultural Secretary",
            },
            {
              quote: "Linear dashboard speed. We monitored checkout rates and ticket capacity live. Best UX we have experienced on an event management tool.",
              author: "Vikram K.",
              role: "Music Curator",
            }
          ].map((t, idx) => (
            <div key={idx} className="glass-card p-8 rounded-2xl flex flex-col shadow-lg border border-white/5">
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4 text-fuchsia-400 fill-fuchsia-400" />)}
              </div>
              <p className="text-sm text-gray-300 leading-relaxed italic flex-1">"{t.quote}"</p>
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/5">
                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">
                  {t.author.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{t.author}</h4>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION: FAQS ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-24 z-10 relative">
        <div className="text-center mb-16 space-y-4">
          <p className="text-xs font-semibold tracking-widest text-violet-400 uppercase">Support Center</p>
          <h2 className="text-3xl font-bold text-white tracking-tight">Frequently Asked Questions</h2>
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
            }
          ].map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="glass-card rounded-2xl border border-white/5 overflow-hidden transition-colors hover:bg-white/[0.03]">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left py-6 px-8 flex items-center justify-between text-white font-bold text-sm sm:text-base select-none cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="pb-6 px-8 text-sm text-gray-400 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── SECTION: FOOTER ──────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 mt-12 bg-[#050408]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-violet-500 shadow-[0_0_12px_#7c3aed]" />
              <span className="text-base font-extrabold text-white tracking-tight">EventPulse</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              A premium event management platform built for creators, startups, and modern communities.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Platform</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link href="/events" className="hover:text-white transition-colors">Browse Events</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link href="/my-tickets" className="hover:text-white transition-colors">My Tickets</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Contact Support</Link></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 border-t border-white/5 flex items-center justify-between text-xs text-gray-600">
          <span>© 2026 EventPulse. All rights reserved.</span>
          <span className="font-mono bg-white/5 px-2 py-1 rounded">v0.1.0-alpha</span>
        </div>
      </footer>
    </div>
  );
}
