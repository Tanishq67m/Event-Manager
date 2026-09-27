"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AuthShell } from "@/components/AuthShell";
import { Notice } from "@/components/ui/Notice";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [isExpired, setIsExpired] = useState(false);
  const [redirect, setRedirect] = useState("/events");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setIsExpired(params.get("expired") === "true");
      // Return to the page that sent the user here (e.g. an event page), same-origin paths only.
      const r = params.get("redirect");
      if (r && r.startsWith("/") && !r.startsWith("//")) setRedirect(r);
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push(redirect);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      description="Use the email and password for your EventPulse account."
      footer={
        <>
          No account?{" "}
          <Link href="/auth/register" className="font-medium text-fg underline-offset-2 hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isExpired && !error && <Notice tone="warning">Your session expired. Sign in again to continue.</Notice>}
        {error && <Notice tone="danger">{error}</Notice>}

        <div>
          <label htmlFor="email" className="ep-label">Email</label>
          <input id="email" type="email" autoComplete="email" className="ep-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </div>
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor="password" className="ep-label mb-0">Password</label>
            <Link href="/auth/forgot-password" className="text-[12px] text-fg-muted hover:text-fg">Forgot password?</Link>
          </div>
          <input id="password" type="password" autoComplete="current-password" className="ep-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <button type="submit" className="ep-btn-primary ep-btn-lg w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
