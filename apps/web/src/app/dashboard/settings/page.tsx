"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { organizations, Organization } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Notice } from "@/components/ui/Notice";

export default function SettingsPage() {
  const { user, logout } = useAuth();

  const [org, setOrg] = useState<(Organization & { _count?: { events: number } }) | null>(null);
  const [orgState, setOrgState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [orgName, setOrgName] = useState("");
  const [orgDesc, setOrgDesc] = useState("");
  const [savingOrg, setSavingOrg] = useState(false);

  useEffect(() => {
    organizations
      .mine()
      .then((o) => {
        setOrg(o);
        setOrgName(o.name);
        setOrgDesc(o.description ?? "");
        setOrgState("ready");
      })
      .catch((err: { status?: number }) => setOrgState(err?.status === 404 ? "missing" : "error"));
  }, []);

  const handleOrgSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOrg(true);
    try {
      if (orgName) {
        const updated = await organizations.update({ name: orgName, description: orgDesc });
        setOrg((prev) => (prev ? { ...prev, ...updated } : updated));
        toast.success("Organization updated");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update organization");
    } finally {
      setSavingOrg(false);
    }
  };

  if (!user) return null;

  const dirty = org && (orgName !== org.name || orgDesc !== (org.description ?? ""));

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Your account and the organization attendees see on your events." />

      <section className="grid gap-4 md:grid-cols-[200px_minmax(0,1fr)]" aria-labelledby="account-h">
        <div>
          <h2 id="account-h" className="text-sm font-medium">Account</h2>
          <p className="mt-1 text-[12px] text-fg-muted">Signed-in user.</p>
        </div>
        <div className="ep-panel max-w-2xl">
          <dl className="divide-y divide-border text-[13px]">
            {[
              ["Name", user.name],
              ["Email", <span key="e" className="font-mono text-[12px]">{user.email}</span>],
              ["Role", <span key="r" className="ep-tag">{user.role.toLowerCase()}</span>],
              ["Member since", user.createdAt ? formatDate(user.createdAt) : "—"],
            ].map(([k, v]) => (
              <div key={k as string} className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4 px-4 py-2.5">
                <dt className="text-fg-muted">{k}</dt>
                <dd className="truncate">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3">
            <p className="text-[12px] text-fg-muted">Signing out clears this browser&apos;s session.</p>
            <button onClick={logout} className="ep-btn-secondary">Sign out</button>
          </div>
        </div>
      </section>

      <div className="border-t border-border" />

      <section className="grid gap-4 md:grid-cols-[200px_minmax(0,1fr)]" aria-labelledby="org-h">
        <div>
          <h2 id="org-h" className="text-sm font-medium">Organization</h2>
          <p className="mt-1 text-[12px] text-fg-muted">Shown as the organizer on your event pages and on your public profile.</p>
        </div>

        <div className="max-w-2xl">
          {orgState === "loading" && <div className="ep-skeleton h-56" aria-busy="true" />}

          {orgState === "missing" && (
            <Notice title="No organization yet">
              One is created automatically when you create your first event. You can rename it here afterwards.
            </Notice>
          )}

          {orgState === "error" && <Notice tone="danger" title="Couldn't load your organization">Refresh the page to try again.</Notice>}

          {orgState === "ready" && org && (
            <form onSubmit={handleOrgSave} className="ep-panel">
              <div className="space-y-4 p-4">
                <div>
                  <label htmlFor="org-name" className="ep-label">Name</label>
                  <input id="org-name" type="text" className="ep-input" placeholder="e.g. Acme Events" value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
                </div>
                <div>
                  <label htmlFor="org-desc" className="ep-label">About</label>
                  <textarea id="org-desc" className="ep-textarea" placeholder="Tell attendees who you are and what you run." value={orgDesc} onChange={(e) => setOrgDesc(e.target.value)} />
                </div>
                <div>
                  <span className="ep-label">Public page</span>
                  <Link href={`/${org.slug}`} className="inline-flex items-center gap-1.5 font-mono text-[12px] text-primary hover:underline underline-offset-2">
                    /{org.slug} <ExternalLink aria-hidden className="h-3 w-3" />
                  </Link>
                  <p className="ep-hint">
                    {org._count?.events ?? 0} event{org._count?.events === 1 ? "" : "s"} · the address is generated from the original name and doesn&apos;t change.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
                {dirty && (
                  <button type="button" className="ep-btn-ghost" onClick={() => { setOrgName(org.name); setOrgDesc(org.description ?? ""); }}>
                    Discard
                  </button>
                )}
                <button type="submit" disabled={savingOrg || !dirty} className="ep-btn-primary">
                  {savingOrg ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
