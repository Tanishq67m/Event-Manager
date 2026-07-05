"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { events } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime, formatPrice } from "@/lib/utils";

interface TicketTypeInput {
  name: string;
  description: string;
  price: string;
  totalQuantity: string;
  inviteOnly: boolean;
  color: string;
}

const emptyTicket = (): TicketTypeInput => ({
  name: "",
  description: "",
  price: "0",
  totalQuantity: "50",
  inviteOnly: false,
  color: "violet"
});

const TICKET_COLORS: Record<string, string> = {
  violet: "bg-violet-600 text-white border-violet-500",
  emerald: "bg-emerald-600 text-white border-emerald-500",
  amber: "bg-amber-600 text-white border-amber-500",
  rose: "bg-rose-600 text-white border-rose-500",
  cyan: "bg-cyan-600 text-white border-cyan-500"
};

const PRESET_BANNERS = [
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80", // Concert crowd
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80", // Party lights
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80", // Dj turntables
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=800&q=80"  // Stage live band
];

export default function NewEventPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Mode: edit vs preview on mobile
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [capacity, setCapacity] = useState("100");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [bannerUrl, setBannerUrl] = useState(PRESET_BANNERS[0]);
  const [category, setCategory] = useState("Concerts");
  const [tags, setTags] = useState("");
  const [ticketTypes, setTicketTypes] = useState<TicketTypeInput[]>([
    { name: "General Admission", description: "Standard event pass", price: "0", totalQuantity: "100", inviteOnly: false, color: "violet" }
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateTicket(i: number, field: keyof TicketTypeInput, value: any) {
    setTicketTypes((prev) => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  }

  function addTicket() {
    setTicketTypes((prev) => [...prev, emptyTicket()]);
  }

  function removeTicket(i: number) {
    if (ticketTypes.length === 1) return;
    setTicketTypes((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");
    setLoading(true);

    try {
      const event = await events.create({
        title: title || "Untitled Event",
        description,
        venue,
        capacity: parseInt(capacity),
        startsAt: startsAt ? new Date(startsAt).toISOString() : new Date().toISOString(),
        endsAt: endsAt ? new Date(endsAt).toISOString() : new Date(Date.now() + 7200000).toISOString(),
        ticketTypes: ticketTypes.map((t) => ({
          name: t.name || "General Ticket",
          description: t.description || undefined,
          price: Math.round(parseFloat(t.price || "0") * 100), // rupees → paise
          totalQuantity: parseInt(t.totalQuantity || "50"),
        })),
      });
      // Optionally update the banner on the backend if needed, or simply redirect
      router.push(`/dashboard?created=${event.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#08070d] bg-radial-pulse pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-6">
        
        {/* Top bar with mobile tab toggle */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Event Builder</h1>
            <p className="text-xs text-gray-500 mt-0.5">Design a highly polished event landing page</p>
          </div>

          <div className="flex gap-2">
            <div className="flex bg-slate-950/40 p-1 border border-white/5 rounded-lg lg:hidden select-none">
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded cursor-pointer ${
                  activeTab === "edit" ? "bg-violet-600 text-white" : "text-gray-400"
                }`}
              >
                Form
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded cursor-pointer ${
                  activeTab === "preview" ? "bg-violet-600 text-white" : "text-gray-400"
                }`}
              >
                Live Preview
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="ep-btn-primary px-5 py-2 text-xs shadow-[0_0_12px_rgba(124,58,237,0.35)] cursor-pointer"
            >
              {loading ? "Saving..." : "Save Draft"}
            </button>
          </div>
        </div>

        {/* Main side-by-side workspace grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* ── Left side: Notion-style editor form ───────────────────── */}
          <form
            onSubmit={handleSubmit}
            className={`lg:col-span-7 space-y-6 ${activeTab === "edit" ? "block" : "hidden lg:block"}`}
          >
            {/* Notion Header block */}
            <div className="space-y-4 pt-2">
              {/* Borderless Large Title */}
              <input
                type="text"
                className="w-full text-3xl sm:text-4xl font-black bg-transparent text-white border-b border-white/5 focus:outline-none focus:border-violet-500 focus:ring-0 placeholder:text-gray-600 px-0 pb-3 transition-colors"
                placeholder="Untitled Event..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              {/* Banner select grid */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Select Page Banner Theme
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_BANNERS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setBannerUrl(url)}
                      className={`relative h-14 rounded-lg overflow-hidden border cursor-pointer transition-all ${
                        bannerUrl === url ? "border-violet-500 scale-95 shadow-[0_0_8px_#7c3aed]" : "border-white/5 hover:border-white/20"
                      }`}
                    >
                      <img src={url} alt="preset banner" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description Block */}
            <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
              <h3 className="font-bold text-white text-sm border-b border-white/5 pb-2">Description</h3>
              <div>
                <textarea
                  className="w-full min-h-[140px] bg-transparent text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-0 border-0 resize-none px-0 leading-relaxed"
                  placeholder="Rich text details... Type / to check formatting commands"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Event Settings Block */}
            <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4.5">
              <h3 className="font-bold text-white text-sm border-b border-white/5 pb-2">Location & Schedule</h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="ep-label">Venue / Address</label>
                  <input
                    type="text"
                    className="ep-input"
                    placeholder="GCoER Auditorium, Pune"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="ep-label">Category</label>
                  <select
                    className="ep-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {["Concerts", "Festivals", "Movies", "Sports", "Comedy", "Hackathons"].map((cat) => (
                      <option key={cat} value={cat} className="bg-slate-950 text-white">{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="ep-label">Start Time</label>
                  <input
                    type="datetime-local"
                    className="ep-input font-mono"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="ep-label">End Time</label>
                  <input
                    type="datetime-local"
                    className="ep-input font-mono"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="ep-label">Total Seating Capacity</label>
                  <input
                    type="number"
                    className="ep-input"
                    min="1"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="ep-label">Tags (separated by comma)</label>
                  <input
                    type="text"
                    className="ep-input"
                    placeholder="AI, tech, student"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Ticket Management Block */}
            <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4.5">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="font-bold text-white text-sm">Ticket Management</h3>
                <button
                  type="button"
                  onClick={addTicket}
                  className="text-xs font-bold text-violet-400 hover:text-white cursor-pointer"
                >
                  + Add Ticket Tier
                </button>
              </div>

              {ticketTypes.map((tt, i) => (
                <div key={i} className="bg-slate-950/40 border border-white/5 rounded-xl p-4.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Tier #{i + 1}
                    </span>
                    {ticketTypes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTicket(i)}
                        className="text-xs font-semibold text-rose-400 hover:text-rose-500 cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="ep-label">Tier Name *</label>
                      <input
                        className="ep-input"
                        placeholder="VIP Premium / Early Bird"
                        value={tt.name}
                        onChange={(e) => updateTicket(i, "name", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="ep-label">Ticket Price (₹)</label>
                      <input
                        type="number"
                        className="ep-input font-mono"
                        placeholder="0 for free"
                        min="0"
                        step="0.01"
                        value={tt.price}
                        onChange={(e) => updateTicket(i, "price", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="ep-label">Quantity Caps *</label>
                      <input
                        type="number"
                        className="ep-input font-mono"
                        min="1"
                        value={tt.totalQuantity}
                        onChange={(e) => updateTicket(i, "totalQuantity", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="ep-label">Short Tagline</label>
                      <input
                        className="ep-input"
                        placeholder="Benefits note"
                        value={tt.description}
                        onChange={(e) => updateTicket(i, "description", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Invite only and color tags */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/5">
                    <label className="flex items-center gap-2 text-xs text-gray-300 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tt.inviteOnly}
                        onChange={(e) => updateTicket(i, "inviteOnly", e.target.checked)}
                        className="rounded border-white/10 bg-white/5 text-violet-600 focus:ring-violet-500 h-4 w-4"
                      />
                      Invite-Only / Private Distribute
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 font-bold uppercase">Color tag</span>
                      <div className="flex gap-1.5">
                        {Object.keys(TICKET_COLORS).map((col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => updateTicket(i, "color", col)}
                            style={{
                              backgroundColor: col === "violet" ? "#7c3aed" : col === "emerald" ? "#10b981" : col === "amber" ? "#f59e0b" : col === "rose" ? "#f43f5e" : "#06b6d4"
                            }}
                            className={`h-4.5 w-4.5 rounded-full border cursor-pointer transition-transform ${
                              tt.color === col ? "scale-125 border-white" : "border-transparent"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3.5 py-2.5">
                {error}
              </p>
            )}
          </form>

          {/* ── Right side: Live Preview rendering in real time ───────── */}
          <div
            className={`lg:col-span-5 lg:block sticky top-20 ${
              activeTab === "preview" ? "block" : "hidden"
            }`}
          >
            <div className="border border-white/10 rounded-xl overflow-hidden shadow-2xl bg-[#08070d] h-[650px] overflow-y-auto relative scrollbar-none">
              
              {/* Visual simulated window browser header */}
              <div className="bg-slate-950/80 px-4 py-2 flex items-center gap-2.5 border-b border-white/5 sticky top-0 z-20">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </div>
                <div className="bg-slate-900 border border-white/5 text-[9px] text-gray-500 rounded px-4 py-0.5 w-3/4 mx-auto truncate font-mono text-center">
                  http://localhost:3000/events/preview
                </div>
              </div>

              {/* Dynamic banner theme */}
              <div className="h-32 bg-slate-950 relative overflow-hidden flex items-center justify-center">
                <img src={bannerUrl} alt="banner preview" className="w-full h-full object-cover opacity-60" />
                <span className="absolute bottom-2.5 left-3.5 text-[9px] bg-violet-600/80 text-white font-bold uppercase px-2 py-0.5 rounded tracking-wider">
                  {category}
                </span>
              </div>

              {/* Content preview details */}
              <div className="p-4 space-y-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-white leading-snug break-words">
                    {title || "Untitled Live Preview"}
                  </h2>
                  <p className="text-[10px] text-gray-500 font-semibold">Hosted by {user?.name || "Organizer Name"}</p>
                </div>

                {/* Simulated stats block */}
                <div className="grid grid-cols-2 gap-2 bg-white/3 rounded-lg border border-white/5 p-3 text-[10px] text-gray-400">
                  <div>
                    <span className="block text-gray-500">Starts At</span>
                    <span className="font-semibold text-white">
                      {startsAt ? formatDateTime(startsAt) : "Not configured"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-500">Venue Location</span>
                    <span className="font-semibold text-white truncate block">{venue || "Not configured"}</span>
                  </div>
                </div>

                {/* About block */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">About</span>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-normal whitespace-pre-wrap break-words">
                    {description || "Provide detail descriptions to see rich content previews."}
                  </p>
                </div>

                {/* Ticket previews list with colored indicator badges */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Available Tiers</span>
                  {ticketTypes.map((tt, idx) => (
                    <div
                      key={idx}
                      className="bg-white/5 border border-white/5 rounded-lg p-3 flex justify-between items-center relative overflow-hidden"
                    >
                      {/* Color indicator stripe */}
                      <div
                        style={{
                          backgroundColor: tt.color === "violet" ? "#7c3aed" : tt.color === "emerald" ? "#10b981" : tt.color === "amber" ? "#f59e0b" : tt.color === "rose" ? "#f43f5e" : "#06b6d4"
                        }}
                        className="absolute left-0 top-0 bottom-0 w-[3px]"
                      />
                      <div className="pl-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-white">{tt.name || `Ticket #${idx+1}`}</span>
                          {tt.inviteOnly && (
                            <span className="text-[7px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1 py-[1px] rounded font-bold uppercase">
                              invite
                            </span>
                          )}
                        </div>
                        {tt.description && <p className="text-[9px] text-gray-500 mt-0.5">{tt.description}</p>}
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-extrabold text-violet-400 block">
                          {parseFloat(tt.price || "0") === 0 ? "Free" : `₹${tt.price}`}
                        </span>
                        <span className="text-[8px] text-gray-500">{tt.totalQuantity} total</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
