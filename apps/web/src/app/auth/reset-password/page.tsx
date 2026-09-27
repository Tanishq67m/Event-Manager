"use client";

import { useState, FormEvent, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/api";
import { AuthShell } from "@/components/AuthShell";
import { Notice } from "@/components/ui/Notice";

function ResetPassword() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await auth.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Set a new password" description="Signing in again is required on every device afterwards.">
      {token === "" ? (
        <div className="space-y-4">
          <Notice tone="danger" title="Reset link is incomplete">
            Open the link from your reset email again, or request a new one.
          </Notice>
          <Link href="/auth/forgot-password" className="ep-btn-secondary w-full">Request a new link</Link>
        </div>
      ) : success ? (
        <div className="space-y-4">
          <Notice tone="success" title="Password updated">You can now sign in with your new password.</Notice>
          <button onClick={() => router.push("/auth/login")} className="ep-btn-primary ep-btn-lg w-full">Sign in</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Notice tone="danger">{error}</Notice>}
          <div>
            <label htmlFor="pw" className="ep-label">New password</label>
            <input id="pw" type="password" autoComplete="new-password" className="ep-input" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
            <p className="ep-hint">8+ characters with an uppercase letter and a number.</p>
          </div>
          <div>
            <label htmlFor="pw2" className="ep-label">Confirm password</label>
            <input id="pw2" type="password" autoComplete="new-password" className="ep-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <button type="submit" className="ep-btn-primary ep-btn-lg w-full" disabled={loading}>
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPassword />
    </Suspense>
  );
}
