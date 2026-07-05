"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Simulate sending email verification link
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 1500);
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
            <h1 className="text-2xl font-bold text-white tracking-tight">Reset password</h1>
            <p className="text-xs text-gray-400 mt-1.5 font-medium">
              We'll send you an email reset link
            </p>
          </div>

          {submitted ? (
            <div className="space-y-5 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xl">
                ✉️
              </div>
              <div>
                <p className="text-sm font-bold text-white">Reset link dispatched</p>
                <p className="text-xs text-gray-400 mt-1">Check your inbox at <strong>{email}</strong> for instructions.</p>
              </div>
              <Link href="/auth/login" className="ep-btn-primary w-full py-2.5 block text-center mt-2">
                Return to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="ep-label">Account Email</label>
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

              <button
                type="submit"
                className="ep-btn-primary w-full py-3 mt-2 shadow-[0_0_15px_rgba(124,58,237,0.35)] glow-btn-hover"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send link"}
              </button>
            </form>
          )}

          {!submitted && (
            <p className="text-center text-xs text-gray-400 mt-6 font-medium">
              Remembered your credentials?{" "}
              <Link href="/auth/login" className="text-violet-400 font-bold hover:underline ml-1">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
