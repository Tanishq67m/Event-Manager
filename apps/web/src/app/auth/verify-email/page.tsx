"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleVerify() {
    setLoading(true);
    // Simulate active code validation
    setTimeout(() => {
      setVerified(true);
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
            <h1 className="text-2xl font-bold text-white tracking-tight">Verify email</h1>
            <p className="text-xs text-gray-400 mt-1.5 font-medium">
              Validate your account to start booking events
            </p>
          </div>

          {verified ? (
            <div className="space-y-5 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xl animate-bounce">
                🎉
              </div>
              <div>
                <p className="text-sm font-bold text-white">Email verified successfully</p>
                <p className="text-xs text-gray-400 mt-1">Your account is active and verified.</p>
              </div>
              <button
                onClick={() => router.push("/events")}
                className="ep-btn-primary w-full py-2.5 shadow-[0_0_15px_rgba(124,58,237,0.4)]"
              >
                Start exploring
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-slate-950/50 rounded-lg p-5 border border-white/5 text-center">
                <p className="text-xs text-gray-300 leading-relaxed font-normal">
                  We've sent a 6-digit verification code to your registered email address.
                </p>
              </div>

              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    className="w-10 h-12 bg-white/5 border border-white/10 rounded-lg text-center text-white text-lg font-bold font-mono focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  />
                ))}
              </div>

              <button
                onClick={handleVerify}
                className="ep-btn-primary w-full py-3 shadow-[0_0_15px_rgba(124,58,237,0.35)] glow-btn-hover"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify code"}
              </button>

              <div className="flex justify-between text-xs text-gray-500">
                <span>Didn't get code?</span>
                <button className="text-violet-400 font-bold hover:underline">Resend code</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
