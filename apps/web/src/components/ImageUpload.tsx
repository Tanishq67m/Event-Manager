"use client";

import { useRef, useState } from "react";
import { ImagePlus, RefreshCw, Trash2 } from "lucide-react";
import { uploads } from "@/lib/api";
import { cld, BANNER_CARD } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

const MAX_MB = 5;
const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Banner picker: drop or choose an image, it uploads straight to Cloudinary,
 * then `onChange` receives the hosted URL (or null when removed).
 */
export function ImageUpload({
  value,
  onChange,
  onUploadingChange,
  disabled,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  async function handle(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!ACCEPT.includes(file.type)) return setError("Use a JPG, PNG, WebP or AVIF image.");
    if (file.size > MAX_MB * 1024 * 1024) return setError(`That image is over ${MAX_MB} MB. Try a smaller one.`);
    setProgress(0);
    onUploadingChange?.(true);
    try {
      const url = await uploads.uploadBanner(file, setProgress);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setProgress(null);
      onUploadingChange?.(false);
      if (input.current) input.current.value = "";
    }
  }

  const uploading = progress !== null;

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept={ACCEPT.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => handle(e.target.files?.[0])}
      />

      {value && !uploading ? (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="aspect-[16/9] bg-surface-muted">
            <img src={cld(value, BANNER_CARD)} alt="Event cover" className="h-full w-full object-cover" />
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border bg-surface px-3 py-2">
            <span className="text-[12px] text-fg-muted">Shown on the event card and page</span>
            <div className="flex gap-1.5">
              <button type="button" disabled={disabled} onClick={() => input.current?.click()} className="ep-btn-secondary ep-btn-sm">
                <RefreshCw /> Replace
              </button>
              <button type="button" disabled={disabled} onClick={() => onChange(null)} className="ep-btn-ghost ep-btn-sm hover:text-danger">
                <Trash2 /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handle(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 text-center transition-colors",
            dragging ? "border-primary bg-primary-subtle" : "border-border-strong bg-surface hover:border-fg-subtle",
            (disabled || uploading) && "cursor-default"
          )}
        >
          {uploading ? (
            <>
              <span className="font-mono text-[12px] text-fg-muted tabular">Uploading… {progress}%</span>
              <span className="h-1 w-40 overflow-hidden rounded-full bg-surface-muted">
                <span className="block h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
              </span>
            </>
          ) : (
            <>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-subtle text-primary-text">
                <ImagePlus aria-hidden className="h-5 w-5" />
              </span>
              <span className="text-[14px] font-medium">Drop an image or click to upload</span>
              <span className="text-[12px] text-fg-muted">16:9 works best · JPG, PNG, WebP or AVIF · up to {MAX_MB} MB</span>
            </>
          )}
        </button>
      )}

      {error && (
        <p role="alert" className="mt-2 text-[12.5px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
