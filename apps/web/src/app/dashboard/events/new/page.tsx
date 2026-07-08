"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Info, 
  MapPin, 
  Ticket, 
  Image as ImageIcon, 
  Send,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
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
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=800&q=80"
];

const WIZARD_STEPS = [
  { id: "basic", label: "Basic Info", icon: Info },
  { id: "banner", label: "Banner", icon: ImageIcon },
  { id: "venue", label: "Venue & Time", icon: MapPin },
  { id: "tickets", label: "Tickets", icon: Ticket },
  { id: "review", label: "Review & Publish", icon: Send }
];

export default function EventWizardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Concerts");
  const [tags, setTags] = useState("");
  
  const [venue, setVenue] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState("100");
  
  const [bannerUrl, setBannerUrl] = useState(PRESET_BANNERS[0]);
  
  const [ticketTypes, setTicketTypes] = useState<TicketTypeInput[]>([
    { name: "General Admission", description: "Standard pass", price: "0", totalQuantity: "100", inviteOnly: false, color: "violet" }
  ]);
  
  const [loading, setLoading] = useState(false);

  function updateTicket(i: number, field: keyof TicketTypeInput, value: any) {
    setTicketTypes((prev) => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  }
  function addTicket() { setTicketTypes((prev) => [...prev, emptyTicket()]); }
  function removeTicket(i: number) {
    if (ticketTypes.length === 1) return;
    setTicketTypes((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!user) return;
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
          price: Math.round(parseFloat(t.price || "0") * 100),
          totalQuantity: parseInt(t.totalQuantity || "50"),
        })),
      });
      // Optionally publish immediately
      await events.publish(event.id);
      
      toast.success("Event created successfully!");
      router.push(`/dashboard?created=${event.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setLoading(false);
    }
  }

  const nextStep = () => setCurrentStep(prev => Math.min(WIZARD_STEPS.length - 1, prev + 1));
  const prevStep = () => setCurrentStep(prev => Math.max(0, prev - 1));

  // Step renderers
  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Event Title</label>
        <input
          type="text"
          className="w-full text-3xl font-black bg-transparent text-white border-b border-white/10 focus:outline-none focus:border-violet-500 focus:ring-0 placeholder:text-gray-600 px-0 pb-3 transition-colors"
          placeholder="Give it a catchy name..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Description</label>
        <div className="glass-card rounded-xl border border-white/5 p-1">
          <textarea
            className="w-full min-h-[160px] bg-transparent text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-0 border-0 resize-none px-3 py-3 leading-relaxed"
            placeholder="What is this event about? (Supports markdown)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Category</label>
          <select className="ep-input w-full" value={category} onChange={(e) => setCategory(e.target.value)}>
            {["Concerts", "Festivals", "Tech & Startups", "Sports", "Comedy", "College Fests"].map((cat) => (
              <option key={cat} value={cat} className="bg-slate-950 text-white">{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Tags</label>
          <input type="text" className="ep-input w-full" placeholder="e.g. music, live, indie" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
      </div>
    </div>
  );

  const renderBanner = () => (
    <div className="space-y-6">
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-4">Select Banner Theme</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {PRESET_BANNERS.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setBannerUrl(url)}
              className={`relative h-24 rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-300 ${
                bannerUrl === url ? "border-violet-500 scale-95 shadow-[0_0_15px_#7c3aed]" : "border-transparent hover:border-white/20"
              }`}
            >
              <img src={url} alt="preset banner" className="w-full h-full object-cover" />
              {bannerUrl === url && (
                <div className="absolute inset-0 bg-violet-600/20 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="glass-card rounded-xl p-6 border border-white/5 border-dashed text-center mt-6">
        <ImageIcon className="h-8 w-8 text-gray-500 mx-auto mb-2" />
        <p className="text-sm text-gray-300 font-medium">Custom Image Upload</p>
        <p className="text-xs text-gray-500 mt-1 mb-4">Upload your own 16:9 banner (max 5MB)</p>
        <button className="ep-btn-secondary py-2 text-xs">Choose File</button>
      </div>
    </div>
  );

  const renderVenue = () => (
    <div className="space-y-6">
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Venue Location</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
          <input type="text" className="ep-input pl-10" placeholder="e.g. Madison Square Garden, NY" value={venue} onChange={(e) => setVenue(e.target.value)} />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Starts At</label>
          <input type="datetime-local" className="ep-input font-mono" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Ends At</label>
          <input type="datetime-local" className="ep-input font-mono" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Total Venue Capacity</label>
        <input type="number" className="ep-input max-w-[200px]" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
      </div>
    </div>
  );

  const renderTickets = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">Configure the pricing tiers for your event attendees.</p>
        <button onClick={addTicket} className="text-xs font-bold text-violet-400 hover:text-white bg-violet-500/10 hover:bg-violet-500/20 px-3 py-1.5 rounded-lg transition-colors">
          + Add Tier
        </button>
      </div>

      {ticketTypes.map((tt, i) => (
        <div key={i} className="glass-card rounded-2xl p-5 border border-white/5 space-y-4 relative overflow-hidden group">
          <div style={{ backgroundColor: tt.color === "violet" ? "#7c3aed" : tt.color === "emerald" ? "#10b981" : tt.color === "amber" ? "#f59e0b" : tt.color === "rose" ? "#f43f5e" : "#06b6d4" }} className="absolute left-0 top-0 bottom-0 w-1" />
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white bg-white/10 px-2 py-1 rounded">Tier {i + 1}</span>
            {ticketTypes.length > 1 && (
              <button onClick={() => removeTicket(i)} className="text-[10px] uppercase font-bold text-rose-400 hover:text-rose-500">Remove</button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Tier Name</label>
              <input className="ep-input text-sm py-2" placeholder="e.g. VIP Pass" value={tt.name} onChange={(e) => updateTicket(i, "name", e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Price (₹)</label>
              <input type="number" className="ep-input text-sm py-2 font-mono" placeholder="0 for Free" value={tt.price} onChange={(e) => updateTicket(i, "price", e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Quantity Limit</label>
              <input type="number" className="ep-input text-sm py-2 font-mono" value={tt.totalQuantity} onChange={(e) => updateTicket(i, "totalQuantity", e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Short Description</label>
              <input className="ep-input text-sm py-2" placeholder="e.g. Front row seating" value={tt.description} onChange={(e) => updateTicket(i, "description", e.target.value)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6">
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-emerald-400">Ready to Publish</h4>
          <p className="text-xs text-emerald-500/80 mt-1">Your event looks great! Once published, your public page will be live and tickets will be available for purchase immediately.</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
        <h3 className="text-xl font-bold text-white border-b border-white/5 pb-3 mb-4">{title || "Untitled Event"}</h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Venue</span>
            <span className="text-white">{venue || "Not set"}</span>
          </div>
          <div>
            <span className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Timing</span>
            <span className="text-white">{startsAt ? formatDateTime(startsAt) : "Not set"}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
          <span className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">Ticketing</span>
          <div className="space-y-2">
            {ticketTypes.map((t, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm bg-white/5 p-2 rounded">
                <span className="text-gray-300">{t.name || "Unnamed Tier"} <span className="text-xs text-gray-500">x{t.totalQuantity}</span></span>
                <span className="font-bold text-violet-400">{t.price === "0" ? "Free" : `₹${t.price}`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#08070d] bg-radial-pulse">
      
      {/* Wizard Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
        <div className="mx-auto max-w-4xl px-4 h-16 flex items-center justify-between">
          <h1 className="text-white font-bold tracking-tight">Create New Event</h1>
          <button onClick={() => router.push('/dashboard')} className="text-xs text-gray-400 hover:text-white">Cancel</button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-12 flex flex-col md:flex-row gap-10 items-start">
        
        {/* Sidebar Stepper */}
        <div className="w-full md:w-64 shrink-0 space-y-2">
          {WIZARD_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === idx;
            const isPast = currentStep > idx;
            
            return (
              <div 
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isActive ? 'bg-violet-600/10 border border-violet-500/20' : 'border border-transparent'}`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border transition-colors ${isActive ? 'bg-violet-600 text-white border-violet-500 shadow-[0_0_10px_rgba(124,58,237,0.3)]' : isPast ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                  {isPast ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider block ${isActive ? 'text-violet-400' : isPast ? 'text-emerald-400' : 'text-gray-500'}`}>Step {idx + 1}</span>
                  <span className={`text-sm font-semibold ${isActive || isPast ? 'text-white' : 'text-gray-400'}`}>{step.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Form Content Area */}
        <div className="flex-1 w-full min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="min-h-[400px]"
            >
              <div className="mb-8 border-b border-white/5 pb-4">
                <h2 className="text-2xl font-extrabold text-white">{WIZARD_STEPS[currentStep].label}</h2>
              </div>
              
              {currentStep === 0 && renderBasicInfo()}
              {currentStep === 1 && renderBanner()}
              {currentStep === 2 && renderVenue()}
              {currentStep === 3 && renderTickets()}
              {currentStep === 4 && renderReview()}
            </motion.div>
          </AnimatePresence>

          {/* Footer Navigation */}
          <div className="mt-12 pt-6 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="ep-btn-secondary px-5 py-2.5 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>

            {currentStep < WIZARD_STEPS.length - 1 ? (
              <button
                onClick={nextStep}
                className="ep-btn-primary px-8 py-2.5 flex items-center gap-2 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => handleSubmit()}
                disabled={loading}
                className="ep-btn-primary px-8 py-2.5 flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-transparent shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                {loading ? "Publishing..." : "Publish Event Live"} <Send className="h-4 w-4 ml-1" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
