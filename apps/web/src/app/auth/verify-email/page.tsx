"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/api";
import { AuthShell } from "@/components/AuthShell";
import { Notice } from "@/components/ui/Notice";

type State = "verifying" | "verified" | "missing" | "failed";

function VerifyEmail() {
  const token = useSearchParams().get("token");
  const [state, setState] = useState<State>(token ? "verifying" : "missing");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    auth
      .verifyEmail(token)
      .then(() => setState("verified"))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Verification failed");
        setState("failed");
      });
  }, [token]);

  return (
    <AuthShell title="Verify your email">
      {state === "verifying" && <p className="text-[13px] text-fg-muted" aria-live="polite">Verifying your link…</p>}
      {state === "verified" && (
        <div className="space-y-4">
          <Notice tone="success" title="Email verified">Your account is active.</Notice>
          <Link href="/events" className="ep-btn-primary ep-btn-lg w-full">Browse events</Link>
        </div>
      )}
      {state === "missing" && (
        <Notice title="Open the link from your email">
          Verification happens when you open the link we emailed you after sign-up. This page needs that link&apos;s token.
        </Notice>
      )}
      {state === "failed" && <Notice tone="danger" title="Couldn't verify">{error}. The link may have already been used.</Notice>}
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmail />
    </Suspense>
  );
}
