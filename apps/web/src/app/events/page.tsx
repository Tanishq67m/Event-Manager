"use client";

import { useEffect, useState, useCallback } from "react";
import { events, Event } from "@/lib/api";
import EventCard from "@/components/EventCard";
import Link from "next/link";

export default function EventsPage() {
  const [data, setData] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const res = await events.list({ page: p, limit: 12, search: q || undefined });
      setData(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page, query); }, [page, query, load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Upcoming events</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} event{total !== 1 ? "s" : ""} available</p>
        </div>
        <Link href="/auth/register?role=ORGANIZER" className="ep-btn-primary shrink-0">
          + Create event
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="text"
          className="ep-input max-w-sm"
          placeholder="Search events or venues…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="ep-btn-secondary">Search</button>
        {query && (
          <button
            type="button"
            className="ep-btn-ghost"
            onClick={() => { setSearch(""); setQuery(""); setPage(1); }}
          >
            Clear
          </button>
        )}
      </form>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ep-card h-64 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🎯</p>
          <h3 className="font-medium text-gray-900 mb-1">
            {query ? `No events found for "${query}"` : "No events yet"}
          </h3>
          <p className="text-sm text-gray-500">
            {query ? "Try a different search term" : "Be the first to create one"}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            className="ep-btn-secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button
            className="ep-btn-secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
