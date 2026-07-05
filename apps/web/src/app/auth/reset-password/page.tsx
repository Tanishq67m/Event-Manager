"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
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
    // Simulate updating password
    setTimeout(() => {
      setSuccess(true);
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
            <h1 className="text-2xl font-bold text-white tracking-tight">Set new password</h1>
            <p className="text-xs text-gray-400 mt-1.5 font-medium">
              Choose a strong password to protect your account
            </p>
          </div>

          {success ? (
            <div className="space-y-5 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xl animate-bounce">
                ✓
              </div>
              <div>
                <p className="text-sm font-bold text-white">Password updated</p>
                <p className="text-xs text-gray-400 mt-1">Your new password is now active.</p>
              </div>
              <button
                onClick={() => router.push("/auth/login")}
                className="ep-btn-primary w-full py-2.5 shadow-[0_0_15px_rgba(124,58,237,0.4)]"
              >
                Sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="ep-label">New Password</label>
                <input
                  type="password"
                  className="ep-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="ep-label">Confirm Password</label>
                <input
                  type="password"
                  className="ep-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                className="ep-btn-primary w-full py-3 mt-2 shadow-[0_0_15px_rgba(124,58,237,0.35)] glow-btn-hover"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
