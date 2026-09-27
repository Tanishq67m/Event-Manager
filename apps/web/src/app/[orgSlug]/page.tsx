"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { organizations, Event, Organization } from "@/lib/api";
import EventCard from "@/components/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

export default function OrganizerProfilePage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();

  const [org, setOrg] = useState<(Organization & { events: Event[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgSlug) return;

    // Support for vanity URLs with @ (e.g., /@tanishq-events)
    const rawSlug = decodeURIComponent(orgSlug);
    const slugToFetch = rawSlug.startsWith("@") ? rawSlug.substring(1) : rawSlug;

    organizations.bySlug(slugToFetch)
      .then(setOrg)
      .catch(() => setOrg(null))
      .finally(() => setLoading(false));
  }, [orgSlug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 sm:px-6" aria-busy="true">
        <div className="ep-skeleton h-7 w-64" />
        <div className="ep-skeleton h-4 w-96 max-w-full" />
        <div className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="ep-skeleton h-64" />)}
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
        <p className="font-mono text-[12px] text-fg-subtle">404</p>
        <h1 className="mt-1 text-xl font-semibold">Organizer not found</h1>
        <p className="mt-2 text-[13px] text-fg-muted">There&apos;s no organizer at this address. Check the link, or browse events instead.</p>
        <Link href="/events" className="ep-btn-secondary mt-6">Browse events</Link>
      </div>
    );
  }

  // The organization endpoint doesn't embed the organizer on each event; add it for the cards.
  const withOrg = org.events.map((e) => ({ ...e, organization: e.organization ?? { name: org.name, slug: org.slug, logoUrl: org.logoUrl } }));
  const liveEvents = withOrg.filter((e) => new Date(e.endsAt) >= new Date());
  const pastEvents = withOrg.filter((e) => new Date(e.endsAt) < new Date()).reverse();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-start">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-muted">
          {org.logoUrl ? (
            <img src={org.logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-semibold text-fg-muted" aria-hidden>{org.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight">{org.name}</h1>
          <p className="mt-0.5 font-mono text-[12px] text-fg-subtle">/{org.slug}</p>
          {org.description && <p className="mt-3 max-w-prose whitespace-pre-wrap text-[14px] text-fg-muted">{org.description}</p>}
        </div>
        <dl className="flex gap-6 text-[13px] sm:text-right">
          <div>
            <dt className="text-fg-muted">Upcoming</dt>
            <dd className="text-lg font-semibold tabular">{liveEvents.length}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Past</dt>
            <dd className="text-lg font-semibold tabular">{pastEvents.length}</dd>
          </div>
        </dl>
      </header>

      <section className="mt-8" aria-labelledby="upcoming-h">
        <h2 id="upcoming-h" className="text-sm font-medium">Upcoming events</h2>
        <div className="mt-4">
          {liveEvents.length === 0 ? (
            <EmptyState title="No upcoming events" description={`${org.name} has nothing on sale right now.`} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {liveEvents.map((event) => <EventCard key={event.id} event={event} />)}
            </div>
          )}
        </div>
      </section>

      {pastEvents.length > 0 && (
        <section className="mt-10" aria-labelledby="past-h">
          <h2 id="past-h" className="text-sm font-medium">Past events</h2>
          <ul className="ep-panel mt-4 divide-y divide-border">
            {pastEvents.map((event) => (
              <li key={event.id}>
                <Link href={`/events/${event.slug}`} className="flex items-center justify-between gap-4 px-4 py-2.5 hover:bg-surface-muted">
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium">{event.title}</span>
                    <span className="block truncate text-[12px] text-fg-muted">{event.venue}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[12px] text-fg-subtle tabular">{formatDate(event.startsAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
