"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { events, Event } from "@/lib/api";
import EventCard from "@/components/EventCard";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";

// Quick filters run a text search with the label, exactly as before.
const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "music", label: "Music & Concerts" },
  { id: "tech", label: "Tech & Startups" },
  { id: "comedy", label: "Comedy" },
  { id: "college", label: "College Fests" },
  { id: "sports", label: "Sports" },
];

/** The URL's ?search= is the source of truth; this component is re-keyed whenever it changes. */
function EventDiscovery({ initialQuery }: { initialQuery: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(initialQuery);
  const query = initialQuery;
  const activeCategory = CATEGORIES.find((c) => c.id !== "all" && c.label === query)?.id ?? (query ? "" : "all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);


  const load = useCallback(async (p: number, q: string) => {
    setLoading(true);
    setError(false);
    try {
      const res = await events.list({ page: p, limit: 12, search: q || undefined });
      setData(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      setData([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, query);
  }, [page, query, load]);

  // Changing the query updates the URL; the page re-keys and starts again from page 1.
  function setQueryInUrl(q: string) {
    router.replace(q ? `/events?search=${encodeURIComponent(q)}` : "/events", { scroll: false });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQueryInUrl(search.trim());
  }

  function handleCategoryClick(catId: string, catLabel: string) {
    setQueryInUrl(catId === "all" ? "" : catLabel);
  }

  function clearSearch() {
    setQueryInUrl("");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Events</h1>
          <p className="mt-1 text-[13px] text-fg-muted">
            {loading ? "Loading…" : `${total} event${total === 1 ? "" : "s"}${query ? ` matching “${query}”` : ""}`}
          </p>
        </div>
        <Link href={user ? "/dashboard/events/new" : "/auth/register?role=ORGANIZER"} className="ep-btn-secondary self-start sm:self-auto">
          Host an event
        </Link>
      </header>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
        <form onSubmit={handleSearch} role="search" className="flex w-full gap-2 md:max-w-md">
          <div className="relative flex-1">
            <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
            <input
              type="search"
              aria-label="Search events"
              className="ep-input pl-8"
              placeholder="Search by name, venue or organizer"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="ep-btn-secondary h-9">Search</button>
        </form>

        <div className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:ml-auto md:px-0" role="group" aria-label="Quick filters">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id, cat.label)}
                aria-pressed={isActive}
                className={cn(
                  "h-7 shrink-0 whitespace-nowrap rounded-md border px-2.5 text-[12px] font-medium transition-colors",
                  isActive ? "border-fg bg-fg text-bg" : "border-border bg-surface text-fg-muted hover:text-fg"
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {!loading && query && (
        <div className="mt-4 flex items-center gap-2 text-[13px] text-fg-muted">
          Results for <span className="font-medium text-fg">“{query}”</span>
          <button onClick={clearSearch} className="ep-btn-ghost ep-btn-sm" aria-label="Clear search">
            <X /> Clear
          </button>
        </div>
      )}

      <div className="mt-6">
        {error ? (
          <Notice tone="danger" title="Couldn't load events">
            The events service didn&apos;t respond.{" "}
            <button onClick={() => load(page, query)} className="font-medium text-fg underline underline-offset-2">Retry</button>
          </Notice>
        ) : loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-border bg-surface">
                <div className="ep-skeleton aspect-[2/1] rounded-none" />
                <div className="space-y-2 p-3.5">
                  <div className="ep-skeleton h-3 w-1/3" />
                  <div className="ep-skeleton h-4 w-3/4" />
                  <div className="ep-skeleton h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            title={query ? "No events match your search" : "No events on sale"}
            description={query ? "Try a different name, venue or organizer." : "Nothing is on sale right now. Organizers can publish an event from their dashboard."}
            action={
              query ? (
                <button onClick={clearSearch} className="ep-btn-secondary">Clear search</button>
              ) : (
                <Link href="/auth/register?role=ORGANIZER" className="ep-btn-secondary">Become an organizer</Link>
              )
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-8 flex items-center justify-between border-t border-border pt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="ep-btn-secondary">
            <ChevronLeft /> Previous
          </button>
          <div className="hidden items-center gap-1 sm:flex">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                aria-current={page === i + 1 ? "page" : undefined}
                className={cn(
                  "h-8 min-w-8 rounded-md px-2 font-mono text-[12px] tabular",
                  page === i + 1 ? "bg-surface-muted font-medium text-fg" : "text-fg-muted hover:text-fg"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <span className="font-mono text-[12px] text-fg-muted sm:hidden">
            {page} / {totalPages}
          </span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="ep-btn-secondary">
            Next <ChevronRight />
          </button>
        </nav>
      )}
    </div>
  );
}

function KeyedByQuery() {
  const q = useSearchParams().get("search") ?? "";
  return <EventDiscovery key={q} initialQuery={q} />;
}

export default function EventDiscoveryPage() {
  return (
    <Suspense>
      <KeyedByQuery />
    </Suspense>
  );
}
