"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Camera, CheckCircle2, Download, Keyboard, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { checkin, ApiError, EventAnalytics } from "@/lib/api";
import { cn, formatAmount, formatNumber, formatPrice, formatSchedule, formatTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { MetricStrip } from "@/components/ui/MetricStrip";
import { Meter } from "@/components/ui/Meter";
import { Notice } from "@/components/ui/Notice";
import { ActivityLog } from "@/components/dashboard/ActivityLog";

interface ScanResult {
  valid: boolean;
  message?: string;
  reason?: string;
  attendee?: string;
  ticketType?: string;
  checkedInAt?: string;
}

export default function CheckinPage() {
  const { id } = useParams<{ id: string }>();

  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [loadError, setLoadError] = useState("");
  const [qrInput, setQrInput] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scannedAt, setScannedAt] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  const [exporting, setExporting] = useState(false);

  // While true, the last result is shown at full strength so gate staff can read it at a glance.
  const [showFlash, setShowFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Lock to prevent duplicate fast camera scans
  const lastScanRef = useRef<number>(0);

  const loadAnalytics = useCallback(async () => {
    try {
      const data = await checkin.analytics(id);
      setAnalytics(data);
      setLoadError("");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load event stats");
    }
  }, [id]);

  const showResult = useCallback((res: ScanResult) => {
    setResult(res);
    setScannedAt(new Date().toISOString());
    setShowFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setShowFlash(false), 4000);
  }, []);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (useCamera) {
      scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);

      scanner.render(
        async (decodedText) => {
          const now = Date.now();
          // Debounce: prevent duplicate scan within 3 seconds
          if (now - lastScanRef.current < 3000) return;
          lastScanRef.current = now;

          setScanning(true);
          try {
            const res = await checkin.scan(decodedText.trim().toUpperCase(), id);
            showResult(res);
            if (res.valid) loadAnalytics();
          } catch (err: unknown) {
            showResult({ valid: false, reason: err instanceof Error ? err.message : "Scan failed" });
          } finally {
            setScanning(false);
          }
        },
        () => {
          /* Ignore per-frame read errors to prevent console spam */
        }
      );
    }

    return () => {
      if (scanner) scanner.clear().catch(console.error);
    };
  }, [useCamera, id, loadAnalytics, showResult]);

  useEffect(() => {
    loadAnalytics();
    if (!useCamera) inputRef.current?.focus();
  }, [id, useCamera, loadAnalytics]);

  useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current); }, []);

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    const code = qrInput.trim().toUpperCase();
    if (!code) return;

    setScanning(true);
    try {
      const res = await checkin.scan(code, id);
      showResult(res);
      setQrInput("");
      if (res.valid) loadAnalytics();
    } catch (err: unknown) {
      showResult({ valid: false, reason: err instanceof Error ? err.message : "Scan failed" });
    } finally {
      setScanning(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function exportCsv() {
    setExporting(true);
    try {
      await checkin.downloadCsv(id, "attendees.csv");
    } catch (err) {
      if (err instanceof ApiError && err.status === 204) toast(err.message);
      else toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  const s = analytics?.summary;

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: "/dashboard", label: "Overview" }}
        title={analytics ? analytics.event.title : <span className="ep-skeleton inline-block h-6 w-64 align-middle" />}
        meta={
          analytics && (
            <>
              <span className="tabular">{formatSchedule(analytics.event.startsAt)}</span>
              <span>{analytics.event.venue}</span>
            </>
          )
        }
        actions={
          <>
            <button onClick={loadAnalytics} className="ep-btn-secondary">
              <RefreshCw /> Refresh
            </button>
            <button onClick={exportCsv} disabled={exporting} className="ep-btn-secondary">
              <Download /> {exporting ? "Exporting…" : "Export CSV"}
            </button>
          </>
        }
      />

      {loadError && <Notice tone="danger" title="Couldn't load event stats">{loadError}</Notice>}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* ── Scanner ─────────────────────────────────────────────── */}
        <section aria-labelledby="scan-h" className="min-w-0 space-y-4 lg:col-span-5">
          <div className="ep-panel">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 id="scan-h" className="text-sm font-medium">Scan ticket</h2>
              <div role="tablist" aria-label="Scan mode" className="inline-flex rounded-md border border-border p-0.5">
                {[
                  { cam: false, label: "Manual", Icon: Keyboard },
                  { cam: true, label: "Camera", Icon: Camera },
                ].map(({ cam, label, Icon }) => (
                  <button
                    key={label}
                    role="tab"
                    aria-selected={useCamera === cam}
                    onClick={() => setUseCamera(cam)}
                    className={cn(
                      "inline-flex h-6 items-center gap-1.5 rounded-[4px] px-2 text-[12px] font-medium",
                      useCamera === cam ? "bg-surface-muted text-fg" : "text-fg-muted hover:text-fg"
                    )}
                  >
                    <Icon aria-hidden className="h-3.5 w-3.5" /> {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4">
              {useCamera ? (
                <div className="space-y-2">
                  <div className="overflow-hidden rounded-md border border-border bg-black">
                    <div id="reader" className="w-full" />
                  </div>
                  <p className="text-[12px] text-fg-muted">Hold the ticket QR inside the frame. Repeat scans within 3 seconds are ignored.</p>
                </div>
              ) : (
                <form onSubmit={handleScan} className="space-y-2">
                  <label htmlFor="qr" className="ep-label">Ticket code</label>
                  <div className="flex gap-2">
                    <input
                      id="qr"
                      ref={inputRef}
                      type="text"
                      className="ep-input font-mono uppercase tracking-wide"
                      placeholder="EP-2026-XXXXXXXXXX"
                      value={qrInput}
                      onChange={(e) => setQrInput(e.target.value)}
                      autoComplete="off"
                      spellCheck={false}
                      required
                    />
                    <button type="submit" className="ep-btn-primary h-9 px-4" disabled={scanning}>
                      {scanning ? "Checking…" : "Check in"}
                    </button>
                  </div>
                  <p className="ep-hint">Type a code, or keep this field focused and use a USB barcode scanner.</p>
                </form>
              )}
            </div>
          </div>

          {/* Result of the last scan */}
          <div aria-live="assertive" aria-atomic="true">
            {result ? (
              <div
                className={cn(
                  "rounded-lg border-l-4 border border-border px-4 py-4 transition-colors duration-500",
                  result.valid ? "border-l-success" : "border-l-danger",
                  showFlash ? (result.valid ? "bg-success-subtle" : "bg-danger-subtle") : "bg-surface"
                )}
              >
                <div className="flex items-start gap-3">
                  {result.valid ? (
                    <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  ) : (
                    <XCircle aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-base font-semibold", result.valid ? "text-success" : "text-danger")}>
                      {result.valid ? "Admit" : "Do not admit"}
                    </p>
                    {result.valid ? (
                      <>
                        <p className="mt-1 truncate text-lg font-medium text-fg">{result.attendee}</p>
                        <p className="text-[13px] text-fg-muted">
                          {result.ticketType || "General ticket"}
                          {result.checkedInAt && <> · checked in <span className="font-mono tabular">{formatTime(result.checkedInAt)}</span></>}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="mt-1 text-[14px] text-fg">{result.reason || "This ticket is already checked in"}</p>
                        {result.attendee && (
                          <p className="text-[13px] text-fg-muted">
                            Assigned to {result.attendee}
                            {result.ticketType && ` · ${result.ticketType}`}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  {scannedAt && <span className="shrink-0 font-mono text-[11px] text-fg-subtle tabular">{formatTime(scannedAt)}</span>}
                </div>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border-strong px-4 py-4 text-[13px] text-fg-muted">
                Scan results appear here.
              </p>
            )}
          </div>
        </section>

        {/* ── Live stats ──────────────────────────────────────────── */}
        <section aria-label="Event stats" className="min-w-0 space-y-6 lg:col-span-7">
          {!analytics && !loadError ? (
            <div className="space-y-4" aria-busy="true">
              <div className="ep-skeleton h-[74px]" />
              <div className="ep-skeleton h-40" />
            </div>
          ) : analytics && s && (
            <>
              <MetricStrip
                metrics={[
                  { label: "Registrations", value: formatNumber(s.totalRegistrations) },
                  { label: "Checked in", value: formatNumber(s.checkedInCount) },
                  { label: "Check-in rate", value: `${s.checkInRate}%` },
                  { label: "Revenue", value: formatAmount(s.totalRevenue) },
                ]}
              />

              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between text-[13px]">
                  <span className="text-fg-muted">Capacity used</span>
                  <span className="font-mono text-[12px] tabular">{s.capacityUsed}% of {formatNumber(analytics.event.capacity)}</span>
                </div>
                <Meter value={s.capacityUsed} max={100} label="Capacity used" />
              </div>

              <div className="space-y-2">
                <h2 className="text-sm font-medium">Ticket tiers</h2>
                <div className="ep-panel overflow-x-auto">
                  <table className="ep-table">
                    <thead>
                      <tr>
                        <th>Tier</th>
                        <th className="num">Price</th>
                        <th className="num">Sold</th>
                        <th className="num">Checked in</th>
                        <th className="num">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.ticketBreakdown.map((tt) => (
                        <tr key={tt.ticketTypeId}>
                          <td className="font-medium">{tt.name}</td>
                          <td className="num font-mono text-[12px] text-fg-muted">{formatPrice(tt.price)}</td>
                          <td className="num font-mono text-[12px]">{tt.sold}/{tt.total}</td>
                          <td className="num font-mono text-[12px]">{tt.checkedIn}</td>
                          <td className="num font-mono text-[12px]">{formatAmount(tt.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-sm font-medium">Recent entries</h2>
                  <span className="text-[12px] text-fg-subtle">Last 10</span>
                </div>
                {analytics.recentCheckIns.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border-strong px-4 py-4 text-[13px] text-fg-muted">No attendees checked in yet.</p>
                ) : (
                  <div className="ep-panel overflow-hidden">
                    <ActivityLog
                      showEvent={false}
                      entries={analytics.recentCheckIns.map((ci, i) => ({
                        id: `${ci.email}-${i}`,
                        at: ci.checkedInAt,
                        kind: "checkin" as const,
                        attendee: ci.attendeeName,
                        detail: ci.ticketType,
                      }))}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
