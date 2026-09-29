"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { events, Event } from "@/lib/api";
import { ImageUpload } from "@/components/ImageUpload";

/** Modal for adding, replacing or removing an existing event's cover image. */
export function CoverDialog({ event, onClose, onSaved }: { event: Event; onClose: () => void; onSaved: (bannerUrl: string | null) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Open as a modal on mount. No close() in cleanup: that would fire onClose and unmount us
  // during React's development double-mount.
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  async function save(bannerUrl: string | null) {
    setSaving(true);
    try {
      await events.update(event.id, { bannerUrl });
      onSaved(bannerUrl);
      toast.success(bannerUrl ? "Cover image updated" : "Cover image removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the cover image");
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && !uploading && ref.current?.close()}
      aria-labelledby="cover-title"
      className="m-auto w-[min(560px,calc(100vw-32px))] rounded-2xl border border-border bg-surface p-0 text-fg backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 id="cover-title" className="font-display text-[20px] font-semibold tracking-[-0.02em]">Cover image</h2>
          <p className="truncate text-[13px] text-fg-muted">{event.title}</p>
        </div>
        <button onClick={() => ref.current?.close()} disabled={uploading} className="ep-btn-ghost ep-btn-icon" aria-label="Close">
          <X />
        </button>
      </div>
      <div className="p-5">
        <ImageUpload value={event.bannerUrl} onChange={save} onUploadingChange={setUploading} disabled={saving} />
        {saving && <p className="mt-2 font-mono text-[12px] text-fg-muted">Saving…</p>}
      </div>
    </dialog>
  );
}
