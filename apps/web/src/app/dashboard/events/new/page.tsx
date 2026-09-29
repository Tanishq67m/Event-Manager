"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { events } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn, formatAmount, formatNumber, formatPrice, formatSchedule } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Notice } from "@/components/ui/Notice";
import { ImageUpload } from "@/components/ImageUpload";

interface TicketTypeInput {
  name: string;
  description: string;
  price: string;
  totalQuantity: string;
}

const emptyTicket = (): TicketTypeInput => ({ name: "", description: "", price: "0", totalQuantity: "50" });

type Errors = Partial<Record<"title" | "description" | "venue" | "startsAt" | "endsAt" | "capacity" | "tickets", string>>;

/** Mirrors the API's createEventSchema so problems show inline instead of as one generic error. */
function validate(v: { title: string; description: string; venue: string; startsAt: string; endsAt: string; capacity: string; ticketTypes: TicketTypeInput[] }): Errors {
  const e: Errors = {};
  if (v.title.trim().length < 3) e.title = "At least 3 characters.";
  if (v.description.trim().length < 10) e.description = "At least 10 characters.";
  if (v.venue.trim().length < 3) e.venue = "Where is it happening?";
  if (!v.startsAt) e.startsAt = "Pick a start time.";
  if (!v.endsAt) e.endsAt = "Pick an end time.";
  if (v.startsAt && v.endsAt && new Date(v.endsAt) <= new Date(v.startsAt)) e.endsAt = "Must be after the start.";
  if (!(parseInt(v.capacity) >= 1)) e.capacity = "At least 1.";
  if (v.ticketTypes.some((t) => !t.name.trim() || !(parseInt(t.totalQuantity) >= 1) || parseFloat(t.price || "0") < 0))
    e.tickets = "Every tier needs a name, a quantity of at least 1, and a price of 0 or more.";
  return e;
}

export default function NewEventPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState("100");
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeInput[]>([
    { name: "General Admission", description: "Standard pass", price: "0", totalQuantity: "100" },
  ]);

  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState<"publish" | "draft" | null>(null);

  function updateTicket(i: number, field: keyof TicketTypeInput, value: string) {
    setTicketTypes((prev) => prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));
  }
  function addTicket() {
    setTicketTypes((prev) => [...prev, emptyTicket()]);
  }
  function removeTicket(i: number) {
    if (ticketTypes.length === 1) return;
    setTicketTypes((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: { preventDefault(): void }, publish = true) {
    e.preventDefault();
    if (!user) return;
    const found = validate({ title, description, venue, startsAt, endsAt, capacity, ticketTypes });
    setErrors(found);
    setSubmitError("");
    if (Object.keys(found).length) {
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    setLoading(publish ? "publish" : "draft");

    try {
      const event = await events.create({
        title: title || "Untitled Event",
        description,
        venue,
        bannerUrl: bannerUrl ?? undefined,
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
      if (publish) await events.publish(event.id);

      toast.success(publish ? "Event published" : "Draft saved");
      router.push(`/dashboard?created=${event.id}`);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setLoading(null);
    }
  }

  const totalTickets = ticketTypes.reduce((s, t) => s + (parseInt(t.totalQuantity) || 0), 0);
  const potential = ticketTypes.reduce((s, t) => s + Math.round(parseFloat(t.price || "0") * 100) * (parseInt(t.totalQuantity) || 0), 0);
  const overCapacity = totalTickets > (parseInt(capacity) || 0);

  const field = (id: keyof Errors) => ({
    "aria-invalid": errors[id] ? ("true" as const) : undefined,
    "aria-describedby": errors[id] ? `${id}-err` : undefined,
  });
  const err = (id: keyof Errors) =>
    errors[id] && (
      <p id={`${id}-err`} className="mt-1.5 text-[12px] text-danger">
        {errors[id]}
      </p>
    );

  return (
    <form onSubmit={(e) => handleSubmit(e, true)} noValidate className="space-y-6">
      <PageHeader
        back={{ href: "/dashboard", label: "Overview" }}
        title="New event"
        description="Publishing makes the event page public and opens ticket sales immediately."
      />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 divide-y divide-border">
          {/* Details */}
          <fieldset className="grid min-w-0 grid-cols-1 gap-4 pb-8 md:grid-cols-[180px_minmax(0,1fr)]">
            <legend className="sr-only">Details</legend>
            <div>
              <h2 className="text-sm font-medium">Details</h2>
              <p className="mt-1 text-[12px] text-fg-muted">Shown at the top of the public event page.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="ep-label">Title</label>
                <input id="title" className="ep-input" placeholder="e.g. Pune JS Meetup #43" value={title} onChange={(e) => setTitle(e.target.value)} {...field("title")} />
                {err("title")}
              </div>
              <div>
                <label htmlFor="description" className="ep-label">Description</label>
                <textarea
                  id="description"
                  className="ep-textarea min-h-[140px]"
                  placeholder="What happens at this event, who it's for, what to bring."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  {...field("description")}
                />
                {err("description") || <p className="ep-hint">Line breaks are kept as written.</p>}
              </div>
            </div>
          </fieldset>

          {/* Cover image */}
          <fieldset className="grid min-w-0 grid-cols-1 gap-4 py-8 md:grid-cols-[180px_minmax(0,1fr)]">
            <legend className="sr-only">Cover image</legend>
            <div>
              <h2 className="text-sm font-medium">Cover image</h2>
              <p className="mt-1 text-[12px] text-fg-muted">Optional. Without one, the card shows the date on a coloured poster.</p>
            </div>
            <div className="max-w-xl">
              <ImageUpload value={bannerUrl} onChange={setBannerUrl} onUploadingChange={setUploading} disabled={loading !== null} />
            </div>
          </fieldset>

          {/* Venue & time */}
          <fieldset className="grid min-w-0 grid-cols-1 gap-4 py-8 md:grid-cols-[180px_minmax(0,1fr)]">
            <legend className="sr-only">Venue and time</legend>
            <div>
              <h2 className="text-sm font-medium">Venue &amp; time</h2>
              <p className="mt-1 text-[12px] text-fg-muted">Times are in your local timezone.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="venue" className="ep-label">Venue</label>
                <input id="venue" className="ep-input" placeholder="e.g. Thoughtworks, Yerwada, Pune" value={venue} onChange={(e) => setVenue(e.target.value)} {...field("venue")} />
                {err("venue")}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="startsAt" className="ep-label">Starts</label>
                  <input id="startsAt" type="datetime-local" className="ep-input font-mono text-[13px]" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} {...field("startsAt")} />
                  {err("startsAt")}
                </div>
                <div>
                  <label htmlFor="endsAt" className="ep-label">Ends</label>
                  <input id="endsAt" type="datetime-local" className="ep-input font-mono text-[13px]" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} {...field("endsAt")} />
                  {err("endsAt")}
                </div>
              </div>
              <div className="max-w-[200px]">
                <label htmlFor="capacity" className="ep-label">Venue capacity</label>
                <input id="capacity" type="number" min="1" className="ep-input font-mono text-[13px]" value={capacity} onChange={(e) => setCapacity(e.target.value)} {...field("capacity")} />
                {err("capacity")}
              </div>
            </div>
          </fieldset>

          {/* Tickets */}
          <fieldset className="grid min-w-0 grid-cols-1 gap-4 pt-8 md:grid-cols-[180px_minmax(0,1fr)]">
            <legend className="sr-only">Ticket tiers</legend>
            <div>
              <h2 className="text-sm font-medium">Ticket tiers</h2>
              <p className="mt-1 text-[12px] text-fg-muted">Price in rupees. Use 0 for free entry.</p>
            </div>
            <div className="space-y-3">
              <div className="ep-panel overflow-x-auto">
                <table className="ep-table min-w-[560px]">
                  <thead>
                    <tr>
                      <th className="w-[34%]">Name</th>
                      <th>Description</th>
                      <th className="w-28">Price (₹)</th>
                      <th className="w-24">Quantity</th>
                      <th className="w-10"><span className="sr-only">Remove</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticketTypes.map((tt, i) => (
                      <tr key={i} className="hover:bg-transparent">
                        <td>
                          <input aria-label={`Tier ${i + 1} name`} className="ep-input h-8 text-[13px]" placeholder="e.g. Early bird" value={tt.name} onChange={(e) => updateTicket(i, "name", e.target.value)} />
                        </td>
                        <td>
                          <input aria-label={`Tier ${i + 1} description`} className="ep-input h-8 text-[13px]" placeholder="Optional" value={tt.description} onChange={(e) => updateTicket(i, "description", e.target.value)} />
                        </td>
                        <td>
                          <input aria-label={`Tier ${i + 1} price in rupees`} type="number" min="0" className="ep-input h-8 font-mono text-[13px]" value={tt.price} onChange={(e) => updateTicket(i, "price", e.target.value)} />
                        </td>
                        <td>
                          <input aria-label={`Tier ${i + 1} quantity`} type="number" min="1" className="ep-input h-8 font-mono text-[13px]" value={tt.totalQuantity} onChange={(e) => updateTicket(i, "totalQuantity", e.target.value)} />
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => removeTicket(i)}
                            disabled={ticketTypes.length === 1}
                            className="ep-btn-ghost ep-btn-icon h-8 hover:text-danger"
                            aria-label={`Remove tier ${i + 1}`}
                          >
                            <Trash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {errors.tickets && <p className="text-[12px] text-danger" role="alert">{errors.tickets}</p>}
              <button type="button" onClick={addTicket} className="ep-btn-secondary ep-btn-sm">
                <Plus /> Add tier
              </button>
            </div>
          </fieldset>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-6">
          <div className="ep-panel">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-medium">Summary</h2>
            </div>
            <dl className="divide-y divide-border text-[13px]">
              {[
                ["Title", title || <span className="text-fg-subtle">Not set</span>],
                ["Starts", startsAt ? <span className="tabular">{formatSchedule(new Date(startsAt).toISOString())}</span> : <span className="text-fg-subtle">Not set</span>],
                ["Venue", venue || <span className="text-fg-subtle">Not set</span>],
                ["Tickets", <span key="t" className={cn("font-mono text-[12px]", overCapacity && "text-warning")}>{formatNumber(totalTickets)} / {formatNumber(parseInt(capacity) || 0)}</span>],
                ["If sold out", <span key="p" className="font-mono text-[12px]">{formatAmount(potential)}</span>],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between gap-4 px-4 py-2">
                  <dt className="shrink-0 text-fg-muted">{k}</dt>
                  <dd className="min-w-0 truncate text-right">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-border px-4 py-3">
              <p className="ep-overline mb-1.5">Tiers</p>
              <ul className="space-y-1 text-[13px]">
                {ticketTypes.map((t, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="truncate">{t.name || <span className="text-fg-subtle">Unnamed</span>}</span>
                    <span className="shrink-0 font-mono text-[12px] text-fg-muted">
                      {formatPrice(Math.round(parseFloat(t.price || "0") * 100))} × {t.totalQuantity || 0}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {overCapacity && (
              <p className="border-t border-border px-4 py-2.5 text-[12px] text-warning">Tiers add up to more tickets than the venue capacity.</p>
            )}
          </div>

          {submitError && <Notice tone="danger" title="Couldn't create the event" className="mt-4">{submitError}</Notice>}

          <div className="mt-4 grid gap-2">
            <button type="submit" disabled={loading !== null || uploading} className="ep-btn-primary ep-btn-lg w-full">
              {loading === "publish" ? "Publishing…" : "Create and publish"}
            </button>
            <button type="button" onClick={(e) => handleSubmit(e, false)} disabled={loading !== null || uploading} className="ep-btn-secondary ep-btn-lg w-full">
              {loading === "draft" ? "Saving…" : "Save as draft"}
            </button>
            <button type="button" onClick={() => router.push("/dashboard")} className="ep-btn-ghost w-full">
              Cancel
            </button>
          </div>
        </aside>
      </div>
    </form>
  );
}
