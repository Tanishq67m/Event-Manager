"use client";

import { useState, FormEvent, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { AuthShell } from "@/components/AuthShell";
import { Notice } from "@/components/ui/Notice";

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

  const rules = [
    { ok: password.length >= 8, label: "8+ characters" },
    { ok: /[A-Z]/.test(password), label: "an uppercase letter" },
    { ok: /[0-9]/.test(password), label: "a number" },
  ];

  return (
    <AuthShell
      title="Create an account"
      description="Book tickets as an attendee, or host your own events."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-fg underline-offset-2 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset>
          <legend className="ep-label">Account type</legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: "ATTENDEE", title: "Attendee", sub: "Book and hold tickets" },
              { v: "ORGANIZER", title: "Organizer", sub: "Create and sell events" },
            ].map((r) => (
              <label
                key={r.v}
                className={cn(
                  "cursor-pointer rounded-md border px-3 py-2.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--ring)]",
                  role === r.v ? "border-primary bg-primary-subtle" : "border-border-strong bg-surface hover:bg-surface-muted"
                )}
              >
                <input type="radio" name="role" value={r.v} checked={role === r.v} onChange={() => setRole(r.v)} className="sr-only" />
                <span className="block text-[13px] font-medium">{r.title}</span>
                <span className="block text-[12px] text-fg-muted">{r.sub}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {error && <Notice tone="danger">{error}</Notice>}

        <div>
          <label htmlFor="name" className="ep-label">Full name</label>
          <input id="name" type="text" autoComplete="name" className="ep-input" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </div>
        <div>
          <label htmlFor="email" className="ep-label">Email</label>
          <input id="email" type="email" autoComplete="email" className="ep-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="password" className="ep-label">Password</label>
          <input id="password" type="password" autoComplete="new-password" className="ep-input" aria-describedby="pw-rules" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <p id="pw-rules" className="ep-hint">
            Needs{" "}
            {rules.map((r, i) => (
              <span key={r.label}>
                <span className={cn(password && (r.ok ? "text-success" : "text-fg-muted"))}>{r.label}</span>
                {i < rules.length - 2 ? ", " : i === rules.length - 2 ? " and " : "."}
              </span>
            ))}
          </p>
        </div>

        <button type="submit" className="ep-btn-primary ep-btn-lg w-full" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
