"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { auth } from "@/lib/api";
import { AuthShell } from "@/components/AuthShell";
import { Notice } from "@/components/ui/Notice";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await auth.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      description="Enter your account email and we'll send a reset link."
      footer={
        <Link href="/auth/login" className="font-medium text-fg underline-offset-2 hover:underline">
          Back to sign in
        </Link>
      }
    >
      {submitted ? (
        <Notice tone="success" title="Check your inbox">
          If an account exists for <span className="font-medium text-fg">{email}</span>, a reset link is on its way. It expires in 15 minutes.
        </Notice>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Notice tone="danger">{error}</Notice>}
          <div>
            <label htmlFor="email" className="ep-label">Email</label>
            <input id="email" type="email" autoComplete="email" className="ep-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <button type="submit" className="ep-btn-primary ep-btn-lg w-full" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
