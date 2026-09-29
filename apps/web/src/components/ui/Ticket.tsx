import { cn } from "@/lib/utils";

/**
 * Paper ticket with half-circle notches cut into two edges.
 * vertical: notches on the left/right edges at `notch` from the top.
 * horizontal: notches on the top/bottom edges at `notch` from the left.
 */
export function Ticket({
  orientation = "vertical",
  notch = "70%",
  className,
  innerClassName,
  children,
}: {
  orientation?: "vertical" | "horizontal";
  notch?: string;
  className?: string;
  innerClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("ep-ticket-shadow", className)}>
      <div
        className={cn(orientation === "vertical" ? "ep-ticket-v" : "ep-ticket-h", "h-full", innerClassName)}
        style={{ ["--notch" as string]: notch }}
      >
        {children}
      </div>
    </div>
  );
}

/** Dashed tear line that sits between the notches. */
export function Perforation({ orientation = "horizontal", className }: { orientation?: "horizontal" | "vertical"; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        orientation === "horizontal" ? "mx-4 border-t-2 border-dashed" : "my-4 border-l-2 border-dashed",
        "border-paper-rule",
        className
      )}
    />
  );
}
