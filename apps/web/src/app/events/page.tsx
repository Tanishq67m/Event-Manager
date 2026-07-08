"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Calendar, SlidersHorizontal, Ticket, X, ChevronRight, Compass } from "lucide-react";
import { events, Event } from "@/lib/api";
import EventCard from "@/components/EventCard";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const CATEGORIES = [
  { id: "all", label: "All Events" },
  { id: "music", label: "Music & Concerts" },
  { id: "tech", label: "Tech & Startups" },
  { id: "comedy", label: "Comedy" },
  { id: "college", label: "College Fests" },
  { id: "sports", label: "Sports" }
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function EventDiscoveryPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);

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
    setActiveCategory("all");
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
    <div className="min-h-screen bg-[#08070d] bg-radial-pulse relative pb-24">
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-[40vh] bg-gradient-to-b from-violet-900/10 to-transparent pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 z-10 relative">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-3">
            <motion.p variants={fadeUp} className="text-xs font-bold tracking-widest text-violet-400 uppercase flex items-center gap-2">
              <Compass className="h-4 w-4" /> Discover
            </motion.p>
            <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              Find your next experience
            </motion.h1>
            <motion.p variants={fadeUp} className="text-gray-400 text-sm max-w-xl leading-relaxed">
              Explore {total > 0 ? total : "thousands of"} live events, meetups, and conferences happening around you.
            </motion.p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <Link
              href={user ? "/dashboard/events/new" : "/auth/register?role=ORGANIZER"}
              className="ep-btn-primary py-3 px-6 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
            >
              <Ticket className="h-4 w-4 mr-1" /> Create an Event
            </Link>
          </motion.div>
        </div>

        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-2 flex items-center shadow-2xl border border-white/10 mb-8 max-w-4xl"
        >
          <form onSubmit={handleSearch} className="flex-1 flex items-center relative">
            <Search className="h-5 w-5 text-gray-500 absolute left-4" />
            <input
              type="text"
              className="w-full bg-transparent border-none text-white text-base pl-12 pr-4 py-3 focus:outline-none focus:ring-0 placeholder:text-gray-500"
              placeholder="Search by event name, genre, or host..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          
          {/* Divider */}
          <div className="hidden sm:block w-px h-8 bg-white/10 mx-2" />
          
          <button 
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${showFilters ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
          
          <button type="submit" onClick={handleSearch} className="ep-btn-primary px-6 py-2.5 ml-2 rounded-xl">
            Search
          </button>
        </motion.div>

        {/* Filter Drawer (Animated) */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="glass-card p-6 rounded-2xl border border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Location</label>
                  <div className="relative">
                    <MapPin className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
                    <input type="text" className="ep-input pl-9" placeholder="Pune, MH" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Date</label>
                  <div className="relative">
                    <Calendar className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
                    <select className="ep-input pl-9 appearance-none bg-slate-950/40 text-gray-300 border-white/5">
                      <option>Anytime</option>
                      <option>Today</option>
                      <option>This Weekend</option>
                      <option>Next Week</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Price</label>
                  <select className="ep-input appearance-none bg-slate-950/40 text-gray-300 border-white/5">
                    <option>Any Price</option>
                    <option>Free Only</option>
                    <option>Under ₹500</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Categories Strip */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-3 overflow-x-auto scrollbar-none pb-4 mb-10"
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id, cat.label)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-white text-slate-950 shadow-md" 
                    : "bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </motion.div>

        {/* Results Info */}
        {!loading && query && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-gray-400">Showing results for</span>
            <span className="text-sm font-bold text-white bg-white/10 px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
              "{query}"
              <X 
                className="h-3 w-3 cursor-pointer hover:text-rose-400" 
                onClick={() => { setSearch(""); setQuery(""); setPage(1); setActiveCategory("all"); }} 
              />
            </span>
          </div>
        )}

        {/* Event Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="glass-card rounded-2xl h-[340px] animate-pulse border border-white/5 flex flex-col p-4 justify-between">
                <div className="w-full h-40 bg-white/5 rounded-xl border border-white/5" />
                <div className="h-4 bg-white/10 rounded w-2/3 mt-4" />
                <div className="h-3 bg-white/5 rounded w-1/3 mt-2" />
                <div className="h-6 bg-white/5 rounded-full w-24 mt-4" />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center border border-white/5 max-w-2xl mx-auto mt-10">
            <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No events found</h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
              {query 
                ? "We couldn't find anything matching your search. Try adjusting your filters or search terms." 
                : "It looks like there are no events right now. Check back later or create your own!"}
            </p>
            {!query && (
              <Link href="/auth/register?role=ORGANIZER" className="ep-btn-secondary mt-8 inline-flex">
                Become an Organizer <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            )}
          </div>
        ) : (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {data.map((event) => (
              <motion.div key={event.id} variants={fadeUp}>
                <EventCard event={event} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-16">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-10 w-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </button>
            <div className="flex items-center gap-1 mx-4">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    page === i + 1 ? "bg-violet-500 w-8" : "bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-10 w-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
