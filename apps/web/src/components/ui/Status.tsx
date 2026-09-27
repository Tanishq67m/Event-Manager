import { cn } from "@/lib/utils";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const dot: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-primary",
  neutral: "bg-fg-subtle",
};

/**
 * Status indicator: a small dot plus a text label. The label always carries the
 * meaning, so status never relies on colour alone.
 */
export function Status({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] text-fg", className)}>
      <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot[tone])} />
      {children}
    </span>
  );
}

const eventTone: Record<string, Tone> = { PUBLISHED: "success", DRAFT: "neutral", ENDED: "info", CANCELLED: "danger" };
const eventLabel: Record<string, string> = { PUBLISHED: "Published", DRAFT: "Draft", ENDED: "Ended", CANCELLED: "Cancelled" };

export function EventStatus({ status }: { status: string }) {
  return <Status tone={eventTone[status] ?? "neutral"}>{eventLabel[status] ?? status}</Status>;
}

const bookingTone: Record<string, Tone> = { CONFIRMED: "success", PENDING: "warning", CANCELLED: "danger", REFUNDED: "neutral" };
const bookingLabel: Record<string, string> = { CONFIRMED: "Confirmed", PENDING: "Pending payment", CANCELLED: "Cancelled", REFUNDED: "Refunded" };

export function BookingStatus({ status }: { status: string }) {
  return <Status tone={bookingTone[status] ?? "neutral"}>{bookingLabel[status] ?? status}</Status>;
}
