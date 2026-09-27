import { cn } from "@/lib/utils";

/** Wordmark with a small pulse glyph. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight text-fg", className)}>
      <svg aria-hidden viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none">
        <rect x="0.5" y="0.5" width="19" height="19" rx="4" className="fill-primary" />
        <path d="M3.5 10.5h3l1.6-4 2.8 8 1.8-4.5h3.8" stroke="var(--primary-fg)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[15px]">EventPulse</span>
    </span>
  );
}
