"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Download, PencilLine, QrCode, ScanLine, Ticket as TicketIcon, Users } from "lucide-react";
import { events, Event } from "@/lib/api";
import EventCard from "@/components/EventCard";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/ui/Logo";
import { HeroTicket } from "@/components/landing/HeroTicket";
import { EmptyState } from "@/components/ui/EmptyState";

const FAQ = [
  {
    q: "Can one event have several ticket types?",
    a: "Yes. Each tier has its own name, price and quantity, and sells out on its own. Attendees see how many are left per tier.",
  },
  {
    q: "Do door volunteers need to install an app?",
    a: "No. The check-in screen runs in the phone browser. Scan with the camera, or type the code or use a USB barcode reader.",
  },
  {
    q: "How are payments handled?",
    a: "Paid bookings go through Razorpay checkout. A booking is confirmed, and its QR ticket becomes valid, only once payment is verified.",
  },
  {
    q: "Can I get my attendee list out?",
    a: "Every event exports to CSV: names, emails, tiers, amounts and who has checked in.",
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    events
      .list({ page: 1, limit: 6 })
      .then((res) => {
        setFeaturedEvents(res.data || []);
        setTotal(res.total ?? null);
      })
      .catch((err) => console.error("Error loading events:", err))
      .finally(() => setLoadingEvents(false));
  }, []);

  const hostHref = user ? "/dashboard/events/new" : "/auth/register?role=ORGANIZER";
  const next = featuredEvents.find((e) => e.ticketTypes.some((t) => t.soldQuantity < t.totalQuantity)) ?? featuredEvents[0];

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="ep-rise">
            <p className="ep-eyebrow">Ticketing for fests, meetups &amp; gigs</p>
            <h1 className="ep-display mt-6 text-[52px] sm:text-[72px] lg:text-[80px]">
              Sell the tickets.
              <br />
              <span className="text-fg-subtle">Scan the door.</span>
            </h1>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-fg-muted">
              Put your event online in minutes with free or paid ticket tiers. People book in a couple of taps, pay
              through Razorpay, and get a QR ticket your volunteers scan from any phone.
            </p>
            <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
              <Link href={hostHref} className="ep-btn-primary ep-btn-lg">
                Start hosting <ArrowRight />
              </Link>
              <Link href="/events" className="ep-btn-secondary ep-btn-lg">
                Find events
              </Link>
            </div>
            <p className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11.5px] text-fg-muted">
              {total !== null && (
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />
                  {total} event{total === 1 ? "" : "s"} on sale now
                </span>
              )}
              <span>Razorpay checkout</span>
              <span>QR check-in</span>
            </p>
          </div>

          <HeroTicket event={next} loading={loadingEvents} />
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section id="how" className="scroll-mt-16 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="ep-eyebrow">How it works</p>
          <h2 className="ep-display mt-4 max-w-2xl text-[36px] sm:text-[48px]">From idea to a full room in three steps.</h2>

          <ol className="mt-12 grid gap-5 md:grid-cols-3">
            <li className="flex flex-col rounded-2xl border border-border bg-surface p-5">
              <span className="font-mono text-[12px] text-primary-text">01</span>
              <h3 className="mt-2 font-display text-[22px] font-semibold tracking-[-0.02em]">Create the event</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-fg-muted">
                Title, venue, time and as many ticket tiers as you like. Save a draft or publish straight away.
              </p>
              {/* Illustration: tier list */}
              <div aria-hidden className="mt-6 space-y-2 rounded-xl border border-border bg-surface-muted p-3 text-[13px]">
                {[
                  ["Early bird", "₹199", "50"],
                  ["Standard", "₹299", "150"],
                  ["VIP", "₹999", "20"],
                ].map(([n, p, q]) => (
                  <div key={n} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
                    <span className="font-medium">{n}</span>
                    <span className="font-mono text-[12px] text-fg-muted">
                      {p} × {q}
                    </span>
                  </div>
                ))}
              </div>
            </li>

            <li className="flex flex-col rounded-2xl border border-border bg-surface p-5">
              <span className="font-mono text-[12px] text-primary-text">02</span>
              <h3 className="mt-2 font-display text-[22px] font-semibold tracking-[-0.02em]">Sell tickets</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-fg-muted">
                Share the event link. People pick a tier and quantity and pay with Razorpay. Tickets arrive by email.
              </p>
              {/* Illustration: tier picker */}
              <div aria-hidden className="mt-6 space-y-2 rounded-xl border border-border bg-surface-muted p-3">
                <div className="grid grid-cols-2 gap-2 text-[13px]">
                  <div className="rounded-lg bg-primary p-3 text-primary-fg">
                    <p className="font-medium">Standard</p>
                    <p className="font-display text-[20px] font-bold">₹299</p>
                  </div>
                  <div className="rounded-lg bg-surface p-3">
                    <p className="font-medium">VIP</p>
                    <p className="font-display text-[20px] font-bold">₹999</p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-fg px-3 py-2.5 text-[13px] font-semibold text-bg">
                  Pay ₹598 <span className="font-mono text-[11px] opacity-70">2 × Standard</span>
                </div>
              </div>
            </li>

            <li className="flex flex-col rounded-2xl border border-border bg-surface p-5">
              <span className="font-mono text-[12px] text-primary-text">03</span>
              <h3 className="mt-2 font-display text-[22px] font-semibold tracking-[-0.02em]">Scan at the door</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-fg-muted">
                Volunteers open the check-in screen on their phone. Duplicate and unpaid tickets are turned away.
              </p>
              {/* Illustration: scan results */}
              <div aria-hidden className="mt-6 space-y-2 rounded-xl border border-border bg-surface-muted p-3 text-[13px]">
                <div className="flex items-center gap-2.5 rounded-lg border-l-4 border-success bg-surface px-3 py-2">
                  <Check className="h-4 w-4 text-success" strokeWidth={3} />
                  <span className="font-semibold text-success">Admit</span>
                  <span className="ml-auto font-mono text-[11px] text-fg-muted">General</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-lg border-l-4 border-danger bg-surface px-3 py-2">
                  <span className="flex h-4 w-4 items-center justify-center font-bold text-danger">×</span>
                  <span className="font-semibold text-danger">Already checked in</span>
                </div>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* ── On sale now ───────────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="ep-eyebrow">On sale now</p>
              <h2 className="ep-display mt-4 text-[36px] sm:text-[48px]">Happening soon</h2>
            </div>
            <Link href="/events" className="ep-btn-secondary">
              All events <ArrowRight />
            </Link>
          </div>
          <div className="mt-10">
            {loadingEvents ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => <div key={i} className="ep-skeleton h-[340px] rounded-2xl" />)}
              </div>
            ) : featuredEvents.length === 0 ? (
              <EmptyState
                title="Nothing on sale yet"
                description="Published events show up here. Be the first to put one up."
                action={<Link href={hostHref} className="ep-btn-primary">Host an event</Link>}
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {featuredEvents.slice(0, 6).map((e) => <EventCard key={e.id} event={e} />)}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── For organizers ────────────────────────────────────────────── */}
      <section id="organizers" className="scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-primary-fg sm:px-12 sm:py-16">
            <div aria-hidden className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:28px_28px]" />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
              <div>
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] opacity-80">For organizers</p>
                <h2 className="ep-display mt-4 text-[36px] sm:text-[48px]">Running a fest, a meetup or a comedy night?</h2>
                <p className="mt-4 max-w-md text-[16px] leading-relaxed opacity-85">
                  One dashboard for sales, capacity and the door. Free events cost nothing to run.
                </p>
                <Link href={hostHref} className="ep-btn ep-btn-lg mt-8 bg-white text-[#111114] hover:bg-white/90">
                  Create your first event <ArrowRight />
                </Link>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {[
                  { Icon: TicketIcon, t: "Tiered tickets", d: "Free, early bird, VIP — each with its own limit." },
                  { Icon: QrCode, t: "QR tickets by email", d: "Every confirmed booking gets a unique code." },
                  { Icon: ScanLine, t: "Phone check-in", d: "Camera or USB scanner, duplicates rejected." },
                  { Icon: Users, t: "Live numbers", d: "Sold, checked in and revenue per tier." },
                  { Icon: Download, t: "CSV export", d: "Your attendee list, whenever you want it." },
                  { Icon: PencilLine, t: "Drafts", d: "Set it up quietly, publish when you're ready." },
                ].map(({ Icon, t, d }) => (
                  <li key={t} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                    <Icon aria-hidden className="h-5 w-5" />
                    <p className="mt-3 font-semibold">{t}</p>
                    <p className="mt-1 text-[13px] opacity-80">{d}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-20 sm:px-6 md:grid-cols-[320px_minmax(0,1fr)]">
          <div>
            <p className="ep-eyebrow">FAQ</p>
            <h2 className="ep-display mt-4 text-[36px]">Good questions</h2>
          </div>
          <div className="divide-y divide-border border-y border-border">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-medium [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border-strong font-mono text-fg-muted transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-fg-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="space-y-1.5">
            <Logo />
            <p className="font-mono text-[11px] text-fg-subtle">© 2026 EventPulse · Made in Pune</p>
          </div>
          <nav aria-label="Footer" className="flex gap-5 text-[14px] text-fg-muted">
            <Link href="/events" className="hover:text-fg">Events</Link>
            <Link href="/my-tickets" className="hover:text-fg">My tickets</Link>
            <Link href="/dashboard" className="hover:text-fg">Dashboard</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
