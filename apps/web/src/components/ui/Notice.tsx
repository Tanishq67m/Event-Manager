import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type NoticeTone = "info" | "success" | "warning" | "danger";

const styles: Record<NoticeTone, string> = {
  info: "border-border bg-surface-muted text-fg",
  success: "border-success/30 bg-success-subtle text-fg",
  warning: "border-warning/30 bg-warning-subtle text-fg",
  danger: "border-danger/30 bg-danger-subtle text-fg",
};
const iconColor: Record<NoticeTone, string> = {
  info: "text-fg-muted",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};
const icons = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: AlertCircle };

/** Inline message for errors, warnings and confirmations inside a page or form. */
export function Notice({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: NoticeTone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const Icon = icons[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-2.5 rounded-md border px-3 py-2.5 text-[13px]", styles[tone], className)}>
      <Icon aria-hidden className={cn("mt-px h-4 w-4 shrink-0", iconColor[tone])} />
      <div className="min-w-0 space-y-0.5">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className="text-fg-muted">{children}</div>}
      </div>
    </div>
  );
}
