"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Download, Plus, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { events, bookings, checkin, organizations, ApiError, Event, EventBooking } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn, formatDate, formatAmount, formatNumber, formatRelative, percent } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { MetricStrip } from "@/components/ui/MetricStrip";
import { EventStatus } from "@/components/ui/Status";
import { Meter } from "@/components/ui/Meter";
import { Notice } from "@/components/ui/Notice";
import { EmptyState } from "@/components/ui/EmptyState";
import { DailyBarChart, DayPoint } from "@/components/dashboard/DailyBarChart";
import { ActivityLog, ActivityEntry } from "@/components/dashboard/ActivityLog";

type Filter = "all" | "upcoming" | "draft" | "past";
type SortKey = "date" | "title" | "sold" | "revenue";

const DAY = 24 * 60 * 60 * 1000;
const istDay = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // yyyy-mm-dd

export default function DashboardPage() {
  const { user, isOrganizer } = useAuth();
  const [data, setData] = useState<Event[]>([]);
  const [bookingsByEvent, setBookingsByEvent] = useState<Record<string, EventBooking[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "date", dir: "asc" });
  const [publishing, setPublishing] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  // Reference time for "upcoming", "starts in" and the 14-day window; refreshed on each load.
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setNow(Date.now());
    try {
      organizations.mine().then((o) => setOrgName(o.name)).catch(() => setOrgName(null));
      const list = await events.myEvents();
      setData(list);
      // Confirmed bookings per non-draft event: real revenue, check-ins and activity.
      const withSales = list.filter((e) => e.status !== "DRAFT");
      const results = await Promise.allSettled(withSales.map((e) => bookings.forEvent(e.id)));
      const map: Record<string, EventBooking[]> = {};
      results.forEach((r, i) => {
        if (r.status === "fulfilled") map[withSales[i].id] = r.value;
      });
      setBookingsByEvent(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && isOrganizer) load();
  }, [user, isOrganizer, load]);

  const stats = useMemo(() => {
    const all = Object.values(bookingsByEvent).flat();
    const revenue = all.reduce((s, b) => s + b.totalAmount, 0);
    const tickets = all.reduce((s, b) => s + b.quantity, 0);
    const checkedIn = all.filter((b) => b.checkedIn).length;
    const capacity = data
      .filter((e) => e.status === "PUBLISHED")
      .reduce((s, e) => s + e.ticketTypes.reduce((t, tt) => t + tt.totalQuantity, 0), 0);
    const upcoming = data.filter((e) => e.status === "PUBLISHED" && new Date(e.startsAt).getTime() > now);
    const drafts = data.filter((e) => e.status === "DRAFT");
    return { all, revenue, tickets, checkedIn, bookings: all.length, capacity, upcoming, drafts };
  }, [bookingsByEvent, data, now]);

  const perEvent = useMemo(() => {
    const m: Record<string, { sold: number; total: number; revenue: number; checkedIn: number; bookings: number }> = {};
    for (const e of data) {
      const b = bookingsByEvent[e.id];
      m[e.id] = {
        sold: e.ticketTypes.reduce((s, t) => s + t.soldQuantity, 0),
        total: e.ticketTypes.reduce((s, t) => s + t.totalQuantity, 0),
        revenue: b ? b.reduce((s, x) => s + x.totalAmount, 0) : 0,
        checkedIn: b ? b.filter((x) => x.checkedIn).length : 0,
        bookings: b ? b.length : 0,
      };
    }
    return m;
  }, [data, bookingsByEvent]);

  // Tickets booked per day, last 14 days (IST), from confirmed bookings.
  const daily: DayPoint[] = useMemo(() => {
    const days: DayPoint[] = [];
    for (let i = 13; i >= 0; i--) days.push({ day: istDay(new Date(now - i * DAY)), value: 0 });
    const idx = new Map(days.map((d, i) => [d.day, i]));
    for (const b of stats.all) {
      const i = idx.get(istDay(new Date(b.createdAt)));
      if (i !== undefined) days[i].value += b.quantity;
    }
    return days;
  }, [stats.all, now]);

  const attention = useMemo(() => {
    const items: { id: string; event: Event; text: string; tone: "warning" | "danger" | "neutral" }[] = [];
    for (const e of data) {
      const p = perEvent[e.id];
      const start = new Date(e.startsAt).getTime();
      if (e.status === "DRAFT") items.push({ id: e.id + "d", event: e, text: "Draft — not visible to attendees", tone: "neutral" });
      if (e.status !== "PUBLISHED" || start < now) continue;
      if (p.total > 0 && p.sold >= p.total) items.push({ id: e.id + "s", event: e, text: "Sold out", tone: "danger" });
      else if (p.total > 0 && p.sold / p.total >= 0.9) items.push({ id: e.id + "a", event: e, text: `${p.total - p.sold} tickets left`, tone: "warning" });
      if (start - now < 7 * DAY) items.push({ id: e.id + "t", event: e, text: `Starts ${formatRelative(e.startsAt, now)}`, tone: "neutral" });
    }
    return items;
  }, [data, perEvent, now]);

  const activity: ActivityEntry[] = useMemo(() => {
    const titleById = Object.fromEntries(data.map((e) => [e.id, e.title]));
    const out: ActivityEntry[] = [];
    for (const [eventId, list] of Object.entries(bookingsByEvent)) {
      for (const b of list) {
        const detail = `${b.ticketType.name}${b.quantity > 1 ? ` ×${b.quantity}` : ""}`;
        out.push({ id: b.id + ":b", at: b.createdAt, kind: "booking", attendee: b.user.name, detail, event: titleById[eventId] });
        if (b.checkedIn && b.checkedInAt)
          out.push({ id: b.id + ":c", at: b.checkedInAt, kind: "checkin", attendee: b.user.name, detail: b.ticketType.name, event: titleById[eventId] });
      }
    }
    return out.sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 12);
  }, [bookingsByEvent, data]);

  const rows = useMemo(() => {
    const filtered = data.filter((e) => {
      const past = new Date(e.endsAt).getTime() < now;
      if (filter === "draft") return e.status === "DRAFT";
      if (filter === "past") return past || e.status === "ENDED";
      if (filter === "upcoming") return e.status === "PUBLISHED" && !past;
      return true;
    });
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sort.key) {
        case "title": return a.title.localeCompare(b.title) * dir;
        case "sold": return (percent(perEvent[a.id].sold, perEvent[a.id].total) - percent(perEvent[b.id].sold, perEvent[b.id].total)) * dir;
        case "revenue": return (perEvent[a.id].revenue - perEvent[b.id].revenue) * dir;
        default: return (+new Date(a.startsAt) - +new Date(b.startsAt)) * dir;
      }
    });
  }, [data, filter, sort, perEvent, now]);

  async function publish(e: Event) {
    setPublishing(e.id);
    try {
      await events.publish(e.id);
      setData((prev) => prev.map((x) => (x.id === e.id ? { ...x, status: "PUBLISHED" } : x)));
      toast.success(`Published “${e.title}”`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not publish event");
    } finally {
      setPublishing(null);
    }
  }

  async function exportCsv(e: Event) {
    setExporting(e.id);
    try {
      await checkin.downloadCsv(e.id, `${e.slug}-attendees.csv`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 204) toast(err.message);
      else toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(null);
    }
  }

  const sortHeader = (key: SortKey, label: string, className?: string) => {
    const on = sort.key === key;
    return (
      <th className={className} aria-sort={on ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
        <button
          type="button"
          onClick={() => setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }))}
          className={cn("inline-flex items-center gap-1 uppercase hover:text-fg", on && "text-fg")}
        >
          {label}
          {on && (sort.dir === "asc" ? <ArrowUp aria-hidden className="h-3 w-3" /> : <ArrowDown aria-hidden className="h-3 w-3" />)}
        </button>
      </th>
    );
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description={orgName ? `${orgName} · ${data.length} event${data.length === 1 ? "" : "s"}` : "Your events, sales and check-ins"}
        actions={
          <Link href="/dashboard/events/new" className="ep-btn-primary">
            <Plus /> New event
          </Link>
        }
      />

      {error && (
        <Notice tone="danger" title="Couldn't load the dashboard">
          {error}{" "}
          <button onClick={load} className="font-medium text-fg underline underline-offset-2">Retry</button>
        </Notice>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : !error && data.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Create an event with one or more ticket tiers. It's published as soon as you finish, and bookings, revenue and check-ins will show up here."
          action={<Link href="/dashboard/events/new" className="ep-btn-primary"><Plus /> Create your first event</Link>}
        />
      ) : !error && (
        <>
          <MetricStrip
            metrics={[
              { label: "Revenue", value: formatAmount(stats.revenue), detail: "Confirmed bookings" },
              { label: "Tickets sold", value: formatNumber(stats.tickets), detail: stats.capacity ? `${percent(stats.tickets, stats.capacity)}% of ${formatNumber(stats.capacity)} published` : "No published capacity" },
              { label: "Checked in", value: `${formatNumber(stats.checkedIn)} / ${formatNumber(stats.bookings)}`, detail: `${percent(stats.checkedIn, stats.bookings)}% of bookings` },
              { label: "Upcoming events", value: stats.upcoming.length, detail: `${stats.drafts.length} draft${stats.drafts.length === 1 ? "" : "s"}` },
            ]}
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <section aria-labelledby="chart-h" className="ep-panel p-4 lg:col-span-2">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 id="chart-h" className="text-sm font-medium">Tickets booked</h2>
                <span className="text-[12px] text-fg-subtle">Last 14 days · {formatNumber(daily.reduce((s, d) => s + d.value, 0))} total</span>
              </div>
              <DailyBarChart data={daily} unit="tickets" />
            </section>

            <section aria-labelledby="attn-h" className="ep-panel flex flex-col">
              <div className="flex items-baseline justify-between border-b border-border px-4 py-3">
                <h2 id="attn-h" className="text-sm font-medium">Needs attention</h2>
                <span className="text-[12px] text-fg-subtle tabular">{attention.length}</span>
              </div>
              {attention.length === 0 ? (
                <p className="px-4 py-6 text-[13px] text-fg-muted">Nothing right now. Drafts, events close to selling out and events starting this week show up here.</p>
              ) : (
                <ul className="divide-y divide-border overflow-y-auto lg:max-h-[216px]">
                  {attention.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span
                        aria-hidden
                        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", a.tone === "danger" ? "bg-danger" : a.tone === "warning" ? "bg-warning" : "bg-fg-subtle")}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] text-fg">{a.event.title}</p>
                        <p className="text-[12px] text-fg-muted">{a.text}</p>
                      </div>
                      {a.event.status === "DRAFT" ? (
                        <button onClick={() => publish(a.event)} disabled={publishing === a.event.id} className="ep-btn-secondary ep-btn-sm">
                          {publishing === a.event.id ? "Publishing…" : "Publish"}
                        </button>
                      ) : (
                        <Link href={`/events/${a.event.slug}`} className="ep-btn-ghost ep-btn-sm">View</Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section aria-labelledby="events-h" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="events-h" className="text-sm font-medium">Events</h2>
              <div role="tablist" aria-label="Filter events" className="inline-flex rounded-md border border-border bg-surface p-0.5">
                {(["all", "upcoming", "draft", "past"] as Filter[]).map((f) => (
                  <button
                    key={f}
                    role="tab"
                    aria-selected={filter === f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "h-7 rounded-[4px] px-2.5 text-[12px] font-medium capitalize transition-colors",
                      filter === f ? "bg-surface-muted text-fg" : "text-fg-muted hover:text-fg"
                    )}
                  >
                    {f === "draft" ? "Drafts" : f}
                  </button>
                ))}
              </div>
            </div>

            {rows.length === 0 ? (
              <EmptyState title="No events match this filter" description="Try another filter above." />
            ) : (
              <>
                {/* Desktop / tablet: table */}
                <div className="ep-panel hidden overflow-x-auto md:block">
                  <table className="ep-table">
                    <thead>
                      <tr>
                        {sortHeader("title", "Event")}
                        <th>Status</th>
                        {sortHeader("date", "Date")}
                        {sortHeader("sold", "Sold", "w-44")}
                        <th className="num">Checked in</th>
                        {sortHeader("revenue", "Revenue", "num")}
                        <th className="w-px"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((e) => {
                        const p = perEvent[e.id];
                        return (
                          <tr key={e.id}>
                            <td className="max-w-[260px]">
                              <Link href={`/events/${e.slug}`} className="block truncate font-medium text-fg hover:underline underline-offset-2">
                                {e.title}
                              </Link>
                              <span className="block truncate text-[12px] text-fg-muted">{e.venue}</span>
                            </td>
                            <td><EventStatus status={e.status} /></td>
                            <td className="whitespace-nowrap tabular text-fg-muted">{formatDate(e.startsAt)}</td>
                            <td>
                              <div className="flex items-center gap-2.5">
                                <Meter value={p.sold} max={p.total} className="w-20" label={`${e.title} tickets sold`} />
                                <span className="whitespace-nowrap font-mono text-[12px] text-fg-muted tabular">
                                  {p.sold}/{p.total}
                                </span>
                              </div>
                            </td>
                            <td className="num font-mono text-[12px] text-fg-muted">{e.status === "DRAFT" ? "—" : `${p.checkedIn}/${p.bookings}`}</td>
                            <td className="num font-mono text-[12px]">{e.status === "DRAFT" ? "—" : formatAmount(p.revenue)}</td>
                            <td>
                              <RowActions e={e} publishing={publishing} exporting={exporting} onPublish={publish} onExport={exportCsv} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile: stacked rows */}
                <ul className="ep-panel divide-y divide-border md:hidden">
                  {rows.map((e) => {
                    const p = perEvent[e.id];
                    return (
                      <li key={e.id} className="space-y-2 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link href={`/events/${e.slug}`} className="block truncate text-sm font-medium">{e.title}</Link>
                            <p className="text-[12px] text-fg-muted">{formatDate(e.startsAt)} · {e.venue}</p>
                          </div>
                          <EventStatus status={e.status} />
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Meter value={p.sold} max={p.total} className="flex-1" label={`${e.title} tickets sold`} />
                          <span className="font-mono text-[12px] text-fg-muted">{p.sold}/{p.total}</span>
                          {e.status !== "DRAFT" && <span className="font-mono text-[12px]">{formatAmount(p.revenue)}</span>}
                        </div>
                        <RowActions e={e} publishing={publishing} exporting={exporting} onPublish={publish} onExport={exportCsv} mobile />
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>

          <section aria-labelledby="activity-h" className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 id="activity-h" className="text-sm font-medium">Recent activity</h2>
              <span className="text-[12px] text-fg-subtle">Bookings and check-ins across your events</span>
            </div>
            {activity.length === 0 ? (
              <EmptyState title="No activity yet" description="Confirmed bookings and gate check-ins will be logged here as they happen." />
            ) : (
              <div className="ep-panel overflow-hidden">
                <ActivityLog entries={activity} />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function RowActions({
  e,
  publishing,
  exporting,
  onPublish,
  onExport,
  mobile,
}: {
  e: Event;
  publishing: string | null;
  exporting: string | null;
  onPublish: (e: Event) => void;
  onExport: (e: Event) => void;
  mobile?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", mobile ? "flex-wrap" : "justify-end")}>
      {e.status === "DRAFT" && (
        <button onClick={() => onPublish(e)} disabled={publishing === e.id} className="ep-btn-primary ep-btn-sm">
          {publishing === e.id ? "Publishing…" : "Publish"}
        </button>
      )}
      {e.status === "PUBLISHED" && (
        <Link href={`/dashboard/events/${e.id}/checkin`} className="ep-btn-secondary ep-btn-sm">
          <ScanLine /> Check-in
        </Link>
      )}
      <button
        onClick={() => onExport(e)}
        disabled={exporting === e.id}
        className="ep-btn-ghost ep-btn-sm"
        aria-label={`Export attendee CSV for ${e.title}`}
        title="Export attendee CSV"
      >
        <Download />
        {mobile && "CSV"}
      </button>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="ep-skeleton h-[74px]" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="ep-skeleton h-[212px] lg:col-span-2" />
        <div className="ep-skeleton h-[212px]" />
      </div>
      <div className="ep-skeleton h-64" />
    </div>
  );
}
