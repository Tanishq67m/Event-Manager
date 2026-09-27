export function formatPrice(paise: number): string {
  if (paise === 0) return "Free";
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export function formatDateTimeInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function isEventUpcoming(startsAt: string): boolean {
  return new Date(startsAt) > new Date();
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Compact formatting for dense, technical views ─────────────────────────────

/** "12s ago", "4m ago", "3h ago", "2d ago", then a short date. */
export function formatRelative(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return "—";
  const diff = Math.round((now - new Date(iso).getTime()) / 1000);
  const future = diff < 0;
  const s = Math.abs(diff);
  const unit =
    s < 60 ? `${s}s` :
    s < 3600 ? `${Math.floor(s / 60)}m` :
    s < 86400 ? `${Math.floor(s / 3600)}h` :
    s < 86400 * 30 ? `${Math.floor(s / 86400)}d` : null;
  if (!unit) return formatDate(iso);
  return future ? `in ${unit}` : `${unit} ago`;
}

/** 24h clock with seconds, IST — for logs and check-in feeds. */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
}

/** "Wed, 28 Oct · 19:30" — event schedule line. */
export function formatSchedule(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
  return `${day} · ${time}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-IN");
}

export function percent(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

/** Like formatPrice, but for amounts (revenue, totals): zero is "₹0", never "Free". */
export function formatAmount(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
