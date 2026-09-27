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
    <div className="flex min-h-[calc(100vh-56px)] items-start justify-center px-4 pt-16 pb-12 sm:pt-24">
      <div className="w-full max-w-[360px]">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-[13px] text-fg-muted">{description}</p>}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6 border-t border-border pt-4 text-[13px] text-fg-muted">{footer}</div>}
      </div>
    </div>
  );
}
