"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { Menu, Search, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

/** Public header. The organizer area (/dashboard) has its own sidebar shell. */
export default function Navbar() {
  const { user, logout, isOrganizer } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  // The menu is open "for" a path, so navigating anywhere closes it without an effect.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const menuOpen = openFor === pathname;
  const setMenuOpen = (fn: (open: boolean) => boolean) => setOpenFor(fn(menuOpen) ? pathname : null);
  const [q, setQ] = useState("");

  if (pathname.startsWith("/dashboard")) return null;

  const links = [
    { href: "/events", label: "Events", show: true },
    { href: "/#how", label: "How it works", show: !user },
    { href: "/my-tickets", label: "My tickets", show: !!user },
    { href: "/dashboard", label: "Dashboard", show: isOrganizer },
  ].filter((l) => l.show);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/events?search=${encodeURIComponent(term)}` : "/events");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-6">
        <Link href="/" className="rounded-sm" aria-label="EventPulse home">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-[14px] font-medium transition-colors",
                isActive(l.href) ? "text-fg" : "text-fg-muted hover:text-fg"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={onSearch} role="search" className="relative ml-auto hidden w-56 lg:block">
          <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search events"
            aria-label="Search events"
            className="ep-input h-9 rounded-lg bg-surface pl-8 text-[13px]"
          />
        </form>

        <div className="hidden items-center gap-2 md:flex lg:ml-0 ml-auto">
          {user ? (
            <>
              <span className="max-w-[160px] truncate text-[13px] text-fg-muted" title={user.email}>
                {user.name}
              </span>
              <button onClick={logout} className="ep-btn-ghost">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="ep-btn-secondary">
                Sign in
              </Link>
              <Link href="/auth/register" className="ep-btn-primary">
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          className="ep-btn-ghost ep-btn-icon ml-auto md:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {menuOpen && (
        <div id="mobile-nav" className="border-t border-border bg-surface px-4 pb-4 pt-2 md:hidden">
          <form onSubmit={onSearch} role="search" className="relative mb-2">
            <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events" aria-label="Search events" className="ep-input pl-8" />
          </form>
          <nav aria-label="Main" className="flex flex-col">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={cn("rounded-md px-2 py-2.5 text-sm", isActive(l.href) ? "bg-surface-muted font-medium text-fg" : "text-fg-muted")}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-2 border-t border-border pt-3">
            {user ? (
              <div className="flex items-center justify-between">
                <span className="truncate text-[13px] text-fg-muted">{user.email}</span>
                <button onClick={logout} className="ep-btn-secondary">Sign out</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/auth/login" className="ep-btn-secondary ep-btn-lg">Sign in</Link>
                <Link href="/auth/register" className="ep-btn-primary ep-btn-lg">Get started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
