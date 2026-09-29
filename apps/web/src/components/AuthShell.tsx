import { HeroTicket } from "@/components/landing/HeroTicket";

/** Shared frame for sign-in, sign-up and account-recovery screens. */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-center lg:gap-20">
      <div className="w-full max-w-[400px]">
        <h1 className="ep-display text-[40px]">{title}</h1>
        {description && <p className="mt-3 text-[15px] text-fg-muted">{description}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-8 border-t border-border pt-5 text-[14px] text-fg-muted">{footer}</div>}
      </div>
      <div className="hidden lg:block" aria-hidden>
        <HeroTicket />
      </div>
    </div>
  );
}
