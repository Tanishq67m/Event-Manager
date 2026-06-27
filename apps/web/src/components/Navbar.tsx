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
        "text-sm transition-colors",
        pathname === href
          ? "text-[#1A56A4] font-medium"
          : "text-gray-500 hover:text-gray-900"
      )}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#1A56A4]" />
            <span className="font-semibold text-gray-900 text-sm tracking-tight">EventPulse</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLink("/events", "Browse events")}
            {isOrganizer && navLink("/dashboard", "Dashboard")}
            {user && navLink("/my-tickets", "My tickets")}
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <span className="text-xs text-gray-400 mr-1">{user.name}</span>
                <button onClick={logout} className="ep-btn-ghost text-sm">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="ep-btn-ghost">Sign in</Link>
                <Link href="/auth/register" className="ep-btn-primary">Get started</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-gray-500 hover:text-gray-900"
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
          <div className="md:hidden border-t border-gray-100 py-3 flex flex-col gap-3">
            <Link href="/events" className="text-sm text-gray-600" onClick={() => setMenuOpen(false)}>Browse events</Link>
            {isOrganizer && (
              <Link href="/dashboard" className="text-sm text-gray-600" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            )}
            {user && (
              <Link href="/my-tickets" className="text-sm text-gray-600" onClick={() => setMenuOpen(false)}>My tickets</Link>
            )}
            {user ? (
              <button onClick={() => { logout(); setMenuOpen(false); }} className="text-left text-sm text-gray-500">
                Sign out
              </button>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link href="/auth/login" className="ep-btn-secondary flex-1 text-center" onClick={() => setMenuOpen(false)}>Sign in</Link>
                <Link href="/auth/register" className="ep-btn-primary flex-1 text-center" onClick={() => setMenuOpen(false)}>Get started</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
