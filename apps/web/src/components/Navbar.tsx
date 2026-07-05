"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function Navbar() {
  const { user, logout, isOrganizer } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={cn(
        "text-xs font-bold uppercase tracking-wider transition-all duration-150 relative py-2 px-1",
        pathname === href
          ? "text-violet-400"
          : "text-gray-400 hover:text-white"
      )}
    >
      {label}
      {pathname === href && (
        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full shadow-[0_0_8px_rgba(124,58,237,0.8)]" />
      )}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-lg">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="h-3 w-3 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 shadow-[0_0_12px_rgba(124,58,237,0.8)] group-hover:scale-110 transition-transform duration-300" />
            <span className="font-black text-white text-base tracking-widest uppercase font-mono bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300">
              EventPulse
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLink("/events", "Browse events")}
            {isOrganizer && navLink("/dashboard", "Dashboard")}
            {user && navLink("/my-tickets", "My tickets")}
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 font-semibold border border-white/5 bg-white/5 px-2.5 py-1 rounded">
                  {user.name}
                </span>
                <button
                  onClick={logout}
                  className="text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors">
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="ep-btn-primary text-xs font-bold uppercase tracking-wider px-5 py-2 shadow-[0_0_15px_rgba(124,58,237,0.35)] glow-btn-hover"
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/5 py-4 flex flex-col gap-4 bg-slate-950/95 backdrop-blur-lg">
            <Link href="/events" className="text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white px-2" onClick={() => setMenuOpen(false)}>Browse events</Link>
            {isOrganizer && (
              <Link href="/dashboard" className="text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white px-2" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            )}
            {user && (
              <Link href="/my-tickets" className="text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white px-2" onClick={() => setMenuOpen(false)}>My tickets</Link>
            )}
            {user ? (
              <button onClick={() => { logout(); setMenuOpen(false); }} className="text-left text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white px-2">
                Sign out
              </button>
            ) : (
              <div className="flex gap-3 pt-2 px-2 border-t border-white/5">
                <Link href="/auth/login" className="ep-btn-secondary flex-1 text-center py-2" onClick={() => setMenuOpen(false)}>Sign in</Link>
                <Link href="/auth/register" className="ep-btn-primary flex-1 text-center py-2" onClick={() => setMenuOpen(false)}>Get started</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
