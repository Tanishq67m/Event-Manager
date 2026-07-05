"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [isExpired, setIsExpired] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const expired = new URLSearchParams(window.location.search).get("expired") === "true";
      setIsExpired(expired);
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/events");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 bg-[#08070d] bg-radial-pulse relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-sm z-10 relative">
        <div className="glass-card p-8 rounded-xl shadow-2xl border border-white/10">
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <span className="h-3 w-3 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(124,58,237,0.8)]" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
            <p className="text-xs text-gray-400 mt-1.5 font-medium">Sign in to your EventPulse account</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="ep-label">Email</label>
              <input
                type="email"
                className="ep-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="ep-label">Password</label>
              <input
                type="password"
                className="ep-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs mt-1">
              <label className="flex items-center gap-2 text-gray-300 font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-white/15 bg-white/5 text-violet-600 focus:ring-violet-500 h-4 w-4"
                />
                Remember me
              </label>
              <Link href="/auth/forgot-password" className="text-violet-400 font-bold hover:underline">
                Forgot password?
              </Link>
            </div>

            {isExpired && !error && (
              <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3.5 py-2.5">
                Your session has expired. Please sign in again.
              </p>
            )}

            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3.5 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="ep-btn-primary w-full py-3 mt-1 shadow-[0_0_15px_rgba(124,58,237,0.35)] glow-btn-hover"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6 font-medium">
            Don't have an account?{" "}
            <Link href="/auth/register" className="text-violet-400 font-bold hover:underline ml-1">
              Get started
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
