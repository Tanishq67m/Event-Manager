"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { events } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface TicketTypeInput {
  name: string;
  description: string;
  price: string; // user inputs rupees, we convert to paise
  totalQuantity: string;
}

const emptyTicket = (): TicketTypeInput => ({
  name: "",
  description: "",
  price: "0",
  totalQuantity: "50",
});

export default function NewEventPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [capacity, setCapacity] = useState("100");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [ticketTypes, setTicketTypes] = useState<TicketTypeInput[]>([emptyTicket()]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateTicket(i: number, field: keyof TicketTypeInput, value: string) {
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
        title,
        description,
        venue,
        capacity: parseInt(capacity),
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        ticketTypes: ticketTypes.map((t) => ({
          name: t.name,
          description: t.description || undefined,
          price: Math.round(parseFloat(t.price) * 100), // rupees → paise
          totalQuantity: parseInt(t.totalQuantity),
        })),
      });
      router.push(`/dashboard?created=${event.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Create event</h1>
        <p className="text-sm text-gray-500 mt-1">Fill in the details below. You can edit everything before publishing.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event details */}
        <div className="ep-card p-6 space-y-4">
          <h2 className="font-medium text-gray-900">Event details</h2>

          <div>
            <label className="ep-label">Event title *</label>
            <input className="ep-input" placeholder="Build With AI Workshop" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div>
            <label className="ep-label">Description *</label>
            <textarea
              className="ep-input min-h-[100px] resize-none"
              placeholder="Tell attendees what this event is about…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="ep-label">Venue *</label>
            <input className="ep-input" placeholder="GCoER, Pune" value={venue} onChange={(e) => setVenue(e.target.value)} required />
          </div>

          <div>
            <label className="ep-label">Total capacity *</label>
            <input type="number" className="ep-input" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
            <p className="text-xs text-gray-400 mt-1">Maximum number of attendees across all ticket types</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="ep-label">Starts at *</label>
              <input type="datetime-local" className="ep-input" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
            </div>
            <div>
              <label className="ep-label">Ends at *</label>
              <input type="datetime-local" className="ep-input" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
            </div>
          </div>
        </div>

        {/* Ticket types */}
        <div className="ep-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-gray-900">Ticket types</h2>
            <button type="button" onClick={addTicket} className="ep-btn-ghost text-xs">
              + Add type
            </button>
          </div>

          {ticketTypes.map((tt, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Ticket {i + 1}</span>
                {ticketTypes.length > 1 && (
                  <button type="button" onClick={() => removeTicket(i)} className="text-xs text-red-400 hover:text-red-600">
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="ep-label">Name *</label>
                  <input
                    className="ep-input"
                    placeholder="General"
                    value={tt.name}
                    onChange={(e) => updateTicket(i, "name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="ep-label">Price (₹)</label>
                  <input
                    type="number"
                    className="ep-input"
                    placeholder="0 for free"
                    min="0"
                    step="0.01"
                    value={tt.price}
                    onChange={(e) => updateTicket(i, "price", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="ep-label">Quantity *</label>
                  <input
                    type="number"
                    className="ep-input"
                    min="1"
                    value={tt.totalQuantity}
                    onChange={(e) => updateTicket(i, "totalQuantity", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="ep-label">Description</label>
                  <input
                    className="ep-input"
                    placeholder="Optional"
                    value={tt.description}
                    onChange={(e) => updateTicket(i, "description", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="ep-btn-primary flex-1 py-2.5">
            {loading ? "Creating…" : "Create event (save as draft)"}
          </button>
          <button type="button" onClick={() => router.back()} className="ep-btn-secondary px-5">
            Cancel
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center">
          Events are saved as drafts. You can review and publish from the dashboard.
        </p>
      </form>
    </div>
  );
}
