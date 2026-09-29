import { cn } from "@/lib/utils";

/** Decorative barcode derived from a string. For illustrations only — real tickets use the QR code. */
export function Barcode({ value, className }: { value: string; className?: string }) {
  let h = 2166136261;
  const bars: number[] = [];
  for (let i = 0; i < 46; i++) {
    h ^= value.charCodeAt(i % Math.max(1, value.length)) + i;
    h = Math.imul(h, 16777619) >>> 0;
    bars.push(1 + (h % 3));
  }
  let x = 0;
  const rects = bars.map((w, i) => {
    const r = i % 2 === 0 ? <rect key={i} x={x} y={0} width={w} height={40} /> : null;
    x += w + 1;
    return r;
  });
  return (
    <svg aria-hidden viewBox={`0 0 ${x} 40`} preserveAspectRatio="none" className={cn("h-10 w-full fill-current", className)}>
      {rects}
    </svg>
  );
}
