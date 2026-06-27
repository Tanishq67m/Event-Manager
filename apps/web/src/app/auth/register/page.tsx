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
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="ep-card p-8">
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1A56A4]" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Create your account</h1>
            <p className="text-sm text-gray-500 mt-1">Start managing events for free</p>
          </div>

          {/* Role toggle */}
          <div className="flex rounded-lg border border-gray-200 p-1 mb-6 bg-gray-50">
            {["ATTENDEE", "ORGANIZER"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
                  role === r
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
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
                placeholder="At least 8 chars, one uppercase, one number"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" className="ep-btn-primary w-full py-2.5 mt-1" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-[#1A56A4] font-medium hover:underline">
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
