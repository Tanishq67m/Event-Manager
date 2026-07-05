"use client";

import { useEffect, useState, useCallback } from "react";
import { events, Event } from "@/lib/api";
import EventCard from "@/components/EventCard";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const CATEGORIES = [
  { id: "all", label: "All", icon: "🎟️" },
  { id: "concerts", label: "Concerts", icon: "🎵" },
  { id: "festivals", label: "Festivals", icon: "🎪" },
  { id: "movies", label: "Movies", icon: "🎬" },
  { id: "sports", label: "Sports", icon: "🏆" },
  { id: "comedy", label: "Comedy", icon: "🎭" }
];

export default function EventsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
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
    setActiveCategory("all"); // Reset category highlighting when custom search is run
  }

  function handleCategoryClick(catId: string, catLabel: string) {
    setActiveCategory(catId);
    setPage(1);
    if (catId === "all") {
      setSearch("");
      setQuery("");
    } else {
      setSearch(catLabel);
      setQuery(catLabel);
    }
  }

  return (
    <div className="min-h-screen bg-[#08070d] bg-radial-pulse relative pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 z-10 relative">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Explore Events</h1>
            <p className="text-sm text-gray-400 mt-1">
              {total} event{total !== 1 ? "s" : ""} currently live in your area
            </p>
          </div>
          <Link
            href={user ? "/dashboard/events/new" : "/auth/register?role=ORGANIZER"}
            className="ep-btn-primary shrink-0 glow-btn-hover"
          >
            + Create event
          </Link>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2.5 mb-8">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
              🔍
            </span>
            <input
              type="text"
              className="ep-input pl-10"
              placeholder="Search by event title, host, or venue…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="ep-btn-primary px-6">Search</button>
          {query && (
            <button
              type="button"
              className="ep-btn-ghost hover:text-white"
              onClick={() => { setSearch(""); setQuery(""); setPage(1); setActiveCategory("all"); }}
            >
              Clear
            </button>
          )}
        </form>

        {/* Categories strip */}
        <div className="mb-10 overflow-x-auto scrollbar-none pb-2 flex gap-3">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.id, cat.label)}
                className={`flex items-center gap-2 rounded-lg px-4.5 py-2.5 text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.4)] border border-violet-500/50 scale-[1.02]"
                    : "bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl h-72 animate-pulse flex flex-col p-4 justify-between">
                <div className="w-full h-40 bg-white/5 rounded-lg border border-white/5" />
                <div className="h-4 bg-white/10 rounded w-2/3 mt-4" />
                <div className="h-3 bg-white/5 rounded w-1/3 mt-2" />
                <div className="h-6 bg-white/5 rounded-full w-24 mt-4" />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="glass-card rounded-xl text-center py-20 px-4">
            <p className="text-5xl mb-4">🎯</p>
            <h3 className="text-xl font-bold text-white mb-2">
              {query ? `No events found for "${query}"` : "No events available"}
            </h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              {query
                ? "Try searching another term, checking spelling, or clicking a different category tab."
                : "No events have been created yet. Be the first organizer to publish one!"}
            </p>
            {!query && (
              <Link
                href="/auth/register?role=ORGANIZER"
                className="ep-btn-primary mt-6 inline-flex items-center gap-2"
              >
                <span>Go to organizer signup</span>
                <span>→</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-12">
            <button
              className="ep-btn-secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-400 font-medium">
              Page {page} of {totalPages}
            </span>
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
    </div>
  );
}
