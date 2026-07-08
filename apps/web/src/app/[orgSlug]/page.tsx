"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Info, MapPin, CalendarDays, ExternalLink, Mail, Twitter, ChevronRight } from "lucide-react";
import { organizations, Event, Organization } from "@/lib/api";
import EventCard from "@/components/EventCard";
import Link from "next/link";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function OrganizerProfilePage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const router = useRouter();

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
      <div className="min-h-screen bg-[#08070d] py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-6">
          <div className="h-64 bg-white/5 border border-white/5 rounded-3xl animate-pulse" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
            {[1, 2, 3].map(i => <div key={i} className="h-80 bg-white/5 border border-white/5 rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-[#08070d] flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl p-10 text-center max-w-md border border-white/5">
          <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-8 w-8 text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Organizer Not Found</h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            The profile you are looking for does not exist or the username might be incorrect.
          </p>
          <button onClick={() => router.push('/events')} className="ep-btn-secondary">Explore Events</button>
        </div>
      </div>
    );
  }

  const liveEvents = org.events.filter(e => new Date(e.endsAt) >= new Date());
  const pastEvents = org.events.filter(e => new Date(e.endsAt) < new Date());

  return (
    <div className="min-h-screen bg-[#08070d] bg-radial-pulse pb-24">
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-violet-900/20 to-transparent pointer-events-none" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 z-10 relative space-y-12">
        
        {/* Organizer Header Profile */}
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="glass-card rounded-3xl p-8 sm:p-12 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
          {/* Abstract background shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
          
          <motion.div variants={fadeUp} className="shrink-0 relative group">
            <div className="h-32 w-32 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 p-1 shadow-[0_0_30px_rgba(124,58,237,0.3)]">
              {org.logoUrl ? (
                <img src={org.logoUrl} alt={org.name} className="h-full w-full rounded-full object-cover bg-slate-950" />
              ) : (
                <div className="h-full w-full rounded-full bg-slate-950 flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-white" />
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="flex-1 space-y-4">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">Verified Organizer</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">{org.name}</h1>
              <p className="text-gray-500 font-mono text-sm mt-1">eventpulse.com/@{org.slug}</p>
            </div>
            
            <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-2xl">
              {org.description || "Dedicated to creating unforgettable experiences. Follow us for the latest updates on upcoming events and exclusive access."}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <button className="ep-btn-primary px-6 py-2.5 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(124,58,237,0.4)]">
                Follow Organizer
              </button>
              <button className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <ExternalLink className="h-4 w-4" />
              </button>
              <button className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-4 w-4" />
              </button>
            </div>
          </motion.div>

          {/* Stats quick view */}
          <motion.div variants={fadeUp} className="hidden lg:flex flex-col gap-3 shrink-0 ml-auto border-l border-white/10 pl-8 py-4">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Total Events</span>
              <span className="text-2xl font-extrabold text-white">{org.events.length}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Active Events</span>
              <span className="text-2xl font-extrabold text-violet-400">{liveEvents.length}</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Live Events Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 className="text-2xl font-bold text-white">Live & Upcoming Events</h2>
          </div>

          {liveEvents.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center border border-white/5">
              <CalendarDays className="h-8 w-8 text-gray-600 mx-auto mb-3" />
              <p className="text-white font-bold text-lg mb-1">No upcoming events</p>
              <p className="text-gray-500 text-sm">Check back later or follow the organizer to get notified.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Past Events Section */}
        {pastEvents.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 pt-8">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="h-2 w-2 rounded-full bg-gray-500" />
              <h2 className="text-xl font-bold text-gray-300">Past Events</h2>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {pastEvents.map(event => (
                <Link key={event.id} href={`/events/${event.slug}`} className="group glass-card rounded-xl border border-white/5 overflow-hidden block">
                  <div className="h-32 bg-slate-900 relative overflow-hidden">
                    {event.bannerUrl && <img src={event.bannerUrl} className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-500 grayscale group-hover:grayscale-0" />}
                    <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <span className="text-xs font-bold text-white bg-white/10 px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1">View Details <ChevronRight className="h-3 w-3" /></span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-gray-300 truncate mb-1">{event.title}</h3>
                    <p className="text-[10px] text-gray-500 flex items-center gap-1 truncate"><MapPin className="h-3 w-3" /> {event.venue}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
