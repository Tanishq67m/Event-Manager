import { cn } from "@/lib/utils";

/** Wordmark with a small pulse glyph. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-fg", className)}>
      <svg aria-hidden viewBox="0 0 22 22" className="h-[22px] w-[22px]" fill="none">
        <rect width="22" height="22" rx="6" className="fill-primary" />
        <path d="M4 11.5h3.2l1.8-4.5 3 9 2-5h4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-display text-[18px] font-bold tracking-[-0.03em]">EventPulse</span>
    </span>
  );
}
