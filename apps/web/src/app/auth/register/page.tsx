"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Suspense } from "react";

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") || "ATTENDEE";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(defaultRole);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password, role);
      router.push(role === "ORGANIZER" ? "/dashboard" : "/events");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 bg-[#08070d] bg-radial-pulse relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm z-10 relative">
        <div className="glass-card p-8 rounded-xl shadow-2xl border border-white/10">
          <div className="mb-6 text-center">
            <div className="flex justify-center mb-4">
              <span className="h-3 w-3 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(124,58,237,0.8)]" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Create account</h1>
            <p className="text-xs text-gray-400 mt-1.5 font-medium">Start hosting and booking events</p>
          </div>

          {/* Role toggle */}
          <div className="flex rounded-lg border border-white/10 p-1 mb-6 bg-slate-950/40">
            {["ATTENDEE", "ORGANIZER"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 rounded-md py-2 text-xs font-semibold transition-all cursor-pointer ${
                  role === r
                    ? "bg-violet-600 text-white shadow-md border border-violet-500/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {r === "ATTENDEE" ? "I'm attending" : "I'm organizing"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="ep-label">Full name</label>
              <input
                type="text"
                className="ep-input"
                placeholder="Tanishq Mohod"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="ep-label">Email</label>
              <input
                type="email"
                className="ep-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="ep-label">Password</label>
              <input
                type="password"
                className="ep-input"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

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
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6 font-medium">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-violet-400 font-bold hover:underline ml-1">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
