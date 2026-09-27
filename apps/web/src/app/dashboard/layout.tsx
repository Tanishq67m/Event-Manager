"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarPlus, ExternalLink, LayoutList, LogOut, Menu, Settings, Ticket, X, Compass } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { organizations } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

const primaryNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutList, exact: true },
  { href: "/dashboard/events/new", label: "New event", icon: CalendarPlus },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isOrganizer, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  // Drawer is open "for" a path, so navigating closes it without an effect.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === pathname;
  const setOpen = (v: boolean) => setOpenFor(v ? pathname : null);
  const [orgSlug, setOrgSlug] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/auth/login");
    else if (!isOrganizer) router.push("/events");
  }, [loading, user, isOrganizer, router]);

  useEffect(() => {
    if (user && isOrganizer) organizations.mine().then((o) => setOrgSlug(o.slug)).catch(() => setOrgSlug(null));
  }, [user, isOrganizer]);


  const active = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const item = (href: string, label: string, Icon: React.ElementType, opts: { exact?: boolean; external?: boolean } = {}) => {
    const isActive = !opts.external && active(href, opts.exact);
    return (
      <Link
        key={href}
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors",
          isActive ? "bg-surface-muted font-medium text-fg" : "text-fg-muted hover:bg-surface-muted/60 hover:text-fg"
        )}
      >
        <Icon aria-hidden className={cn("h-4 w-4 shrink-0", isActive ? "text-fg" : "text-fg-subtle group-hover:text-fg-muted")} />
        <span className="truncate">{label}</span>
        {opts.external && <ExternalLink aria-hidden className="ml-auto h-3 w-3 text-fg-subtle" />}
      </Link>
    );
  };

  const nav = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
        <Link href="/" aria-label="EventPulse home" className="rounded-sm">
          <Logo />
        </Link>
      </div>

      <nav aria-label="Organizer" className="flex-1 space-y-5 overflow-y-auto px-2 py-4">
        <div className="space-y-0.5">
          {primaryNav.map((n) => item(n.href, n.label, n.icon, { exact: n.exact }))}
        </div>
        <div className="space-y-0.5">
          <p className="ep-overline px-2 pb-1">Public</p>
          {item("/events", "Browse events", Compass, { external: true })}
          {item("/my-tickets", "My tickets", Ticket, { external: true })}
          {orgSlug && item(`/${orgSlug}`, "Organizer page", ExternalLink, { external: true })}
        </div>
      </nav>

      <div className="shrink-0 space-y-0.5 border-t border-border px-2 py-3">
        {item("/dashboard/settings", "Settings", Settings)}
        {user && (
          <div className="flex items-center gap-2 px-2 pt-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-fg">{user.name}</p>
              <p className="truncate text-[12px] text-fg-subtle">{user.email}</p>
            </div>
            <button onClick={logout} className="ep-btn-ghost ep-btn-icon" aria-label="Sign out" title="Sign out">
              <LogOut />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (loading || !user || !isOrganizer) {
    return <div className="min-h-screen bg-bg" aria-busy="true" />;
  }

  return (
    <div className="min-h-screen bg-bg lg:pl-56">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 border-r border-border bg-surface lg:block">{nav}</aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
        <Link href="/" aria-label="EventPulse home" className="rounded-sm">
          <Logo />
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="ep-btn-ghost ep-btn-icon"
          aria-label="Open navigation"
          aria-expanded={open}
          aria-controls="dashboard-drawer"
        >
          <Menu />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button className="absolute inset-0 bg-black/30" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <aside id="dashboard-drawer" className="absolute inset-y-0 left-0 w-64 border-r border-border bg-surface">
            <button onClick={() => setOpen(false)} className="ep-btn-ghost ep-btn-icon absolute right-2 top-3" aria-label="Close navigation">
              <X />
            </button>
            {nav}
          </aside>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
    </div>
  );
}
