import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  back,
  meta,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="-ml-1 mb-2 inline-flex items-center gap-0.5 rounded-sm px-1 text-[13px] text-fg-muted hover:text-fg">
            <ChevronLeft aria-hidden className="h-3.5 w-3.5" />
            {back.label}
          </Link>
        )}
        <h1 className="ep-display truncate text-[30px] leading-tight text-fg sm:text-[34px]">{title}</h1>
        {description && <p className="mt-1 text-[13px] text-fg-muted">{description}</p>}
        {meta && <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-fg-muted">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
