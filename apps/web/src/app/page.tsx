"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { events, Event } from "@/lib/api";
import EventCard from "@/components/EventCard";
import { useAuth } from "@/lib/auth-context";
import { formatPrice, formatSchedule } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { Status } from "@/components/ui/Status";

const STEPS = [
  {
    n: "01",
    title: "Create the event",
    body: "Title, venue, schedule and capacity, plus as many ticket tiers as you need: free entry, early bird, standard, VIP. Save it as a draft or publish straight away.",
  },
  {
    n: "02",
    title: "Sell tickets",
    body: "Attendees pick a tier and quantity on the event page. Paid tickets go through Razorpay checkout; every confirmed booking gets a unique QR ticket by email.",
  },
  {
    n: "03",
    title: "Check people in",
    body: "Open the check-in screen on any phone or laptop. Scan with the camera or a USB scanner. Duplicate and unpaid tickets are rejected, and the counts update live.",
  },
];

const FAQ = [
  {
    q: "Can one event have several ticket types?",
    a: "Yes. Each tier has its own name, price and quantity, and sells out independently. Attendees see what's left per tier on the event page.",
  },
  {
    q: "Do door staff need to install an app?",
    a: "No. The check-in screen runs in the browser. It uses the device camera, or accepts codes typed or scanned with a USB barcode reader.",
  },
  {
    q: "How are payments handled?",
    a: "Paid bookings are processed through Razorpay checkout. A booking is only confirmed, and its QR ticket only becomes valid, once payment is verified.",
  },
  {
    q: "Can I get my attendee list out?",
    a: "Every event can be exported as a CSV of confirmed attendees, including who has checked in.",
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    events
      .list({ page: 1, limit: 6 })
      .then((res) => setFeaturedEvents(res.data || []))
      .catch((err) => console.error("Error loading events:", err))
      .finally(() => setLoadingEvents(false));
  }, []);

  const hostHref = user ? "/dashboard/events/new" : "/auth/register?role=ORGANIZER";

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:py-24">
          <div className="max-w-xl">
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              Ticketing and check-in for events you actually run.
            </h1>
            <p className="mt-5 text-[16px] leading-relaxed text-fg-muted">
              Publish an event with multiple ticket tiers, take payments through Razorpay, and scan QR tickets at the
              door from any browser. Sales, capacity and check-ins in one place.
            </p>
            <div className="mt-8 flex flex-col gap-2 sm:flex-row">
              <Link href={hostHref} className="ep-btn-primary ep-btn-lg">
                Host an event <ArrowRight />
              </Link>
              <Link href="/events" className="ep-btn-secondary ep-btn-lg">
                Browse events
              </Link>
            </div>
          </div>

          {/* Live list of what's on sale — real data from the events API */}
          <div className="ep-panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="text-[13px] font-medium">On sale now</span>
              <Link href="/events" className="text-[12px] text-fg-muted hover:text-fg">View all</Link>
            </div>
            {loadingEvents ? (
              <div className="space-y-2 p-4" aria-busy="true">
                {[1, 2, 3, 4].map((i) => <div key={i} className="ep-skeleton h-9" />)}
              </div>
            ) : featuredEvents.length === 0 ? (
              <p className="px-4 py-8 text-[13px] text-fg-muted">No events are on sale yet. Organizers&apos; published events appear here.</p>
            ) : (
              <ul className="divide-y divide-border">
                {featuredEvents.slice(0, 5).map((e) => {
                  const sold = e.ticketTypes.reduce((s, t) => s + t.soldQuantity, 0);
                  const cap = e.ticketTypes.reduce((s, t) => s + t.totalQuantity, 0);
                  const low = e.ticketTypes.length ? Math.min(...e.ticketTypes.map((t) => t.price)) : null;
                  return (
                    <li key={e.id}>
                      <Link href={`/events/${e.slug}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-4 py-2.5 hover:bg-surface-muted">
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium">{e.title}</span>
                          <span className="block truncate font-mono text-[11px] text-fg-muted tabular">
                            {formatSchedule(e.startsAt)} · {e.venue}
                          </span>
                        </span>
                        <span className="text-right">
                          <span className="block text-[13px] tabular">{low === null ? "—" : formatPrice(low)}</span>
                          {cap > 0 && sold >= cap ? (
                            <Status tone="danger" className="text-[11px]">Sold out</Status>
                          ) : (
                            <span className="block font-mono text-[11px] text-fg-subtle tabular">{cap - sold} left</span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-sm font-medium text-fg-muted">How it works</h2>
          <ol className="mt-6 grid gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((s) => (
              <li key={s.n} className="border-t border-border-strong pt-4">
                <span className="font-mono text-[12px] text-fg-subtle">{s.n}</span>
                <h3 className="mt-2 text-base font-medium">{s.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-fg-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Upcoming events ───────────────────────────────────────────── */}
      {!loadingEvents && featuredEvents.length > 0 && (
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Upcoming events</h2>
              <Link href="/events" className="inline-flex items-center gap-1 text-[13px] text-fg-muted hover:text-fg">
                All events <ArrowRight aria-hidden className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredEvents.slice(0, 3).map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-[240px_minmax(0,1fr)]">
          <h2 className="text-lg font-semibold tracking-tight">Questions</h2>
          <div className="divide-y divide-border border-y border-border">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-3.5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[14px] font-medium [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden className="font-mono text-fg-subtle group-open:hidden">+</span>
                  <span aria-hidden className="hidden font-mono text-fg-subtle group-open:inline">−</span>
                </summary>
                <p className="mt-2 max-w-prose text-[14px] leading-relaxed text-fg-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer>
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="space-y-1">
            <Logo />
            <p className="text-[12px] text-fg-subtle">© 2026 EventPulse</p>
          </div>
          <nav aria-label="Footer" className="flex gap-5 text-[13px] text-fg-muted">
            <Link href="/events" className="hover:text-fg">Events</Link>
            <Link href="/my-tickets" className="hover:text-fg">My tickets</Link>
            <Link href="/dashboard" className="hover:text-fg">Dashboard</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
