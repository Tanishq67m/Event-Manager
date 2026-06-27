"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="ep-card p-8">
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1A56A4]" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Welcome back</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your EventPulse account</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" className="ep-btn-primary w-full py-2.5 mt-1" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{" "}
            <Link href="/auth/register" className="text-[#1A56A4] font-medium hover:underline">
              Get started
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
