"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { checkin, EventAnalytics, getAccessToken } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

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
  const [qrInput, setQrInput] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAnalytics();
    // Focus the QR input on mount so a barcode scanner (USB HID) works automatically
    inputRef.current?.focus();
  }, [id]);

  async function loadAnalytics() {
    try {
      const data = await checkin.analytics(id);
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    const code = qrInput.trim().toUpperCase();
    if (!code) return;

    setScanning(true);
    setResult(null);
    try {
      const res = await checkin.scan(code);
      setResult(res);
      setQrInput("");
      // Refresh analytics after successful scan
      if (res.valid) loadAnalytics();
    } catch (err: unknown) {
      setResult({ valid: false, reason: err instanceof Error ? err.message : "Scan failed" });
    } finally {
      setScanning(false);
      // Re-focus for next scan
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  const exportUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"}/checkin/export/${id}`;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      {analytics && (
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">{analytics.event.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{analytics.event.venue}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Scanner ─────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="ep-card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Scan QR code</h2>
            <form onSubmit={handleScan} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                className="ep-input font-mono tracking-wider text-sm uppercase"
                placeholder="EP-2026-XXXXXXXXXX"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                autoComplete="off"
              />
              <button type="submit" className="ep-btn-primary shrink-0" disabled={scanning}>
                {scanning ? "…" : "Scan"}
              </button>
            </form>
            <p className="text-xs text-gray-400 mt-2">
              Type or scan QR code — works with USB barcode scanners too
            </p>
          </div>

          {/* Scan result */}
          {result && (
            <div className={`ep-card p-5 border-l-4 ${result.valid ? "border-green-500 bg-green-50" : "border-red-400 bg-red-50"}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{result.valid ? "✅" : "❌"}</span>
                <div>
                  <p className={`font-semibold ${result.valid ? "text-green-800" : "text-red-800"}`}>
                    {result.valid ? result.message : result.reason}
                  </p>
                  {result.attendee && (
                    <p className="text-sm text-gray-600 mt-0.5">
                      {result.attendee} · {result.ticketType}
                    </p>
                  )}
                  {result.checkedInAt && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Checked in at {new Date(result.checkedInAt).toLocaleTimeString("en-IN")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recent check-ins */}
          {analytics && analytics.recentCheckIns.length > 0 && (
            <div className="ep-card p-5">
              <h3 className="font-medium text-gray-900 mb-3 text-sm">Recent check-ins</h3>
              <div className="space-y-2">
                {analytics.recentCheckIns.map((ci, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-gray-800">{ci.attendeeName}</span>
                      <span className="text-gray-400 ml-2 text-xs">{ci.ticketType}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {ci.checkedInAt ? new Date(ci.checkedInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Analytics ───────────────────────────────────────────────── */}
        {analytics && (
          <div className="space-y-4">
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Registered", value: analytics.summary.totalRegistrations },
                { label: "Checked in", value: analytics.summary.checkedInCount },
                { label: "Check-in rate", value: `${analytics.summary.checkInRate}%` },
                { label: "Revenue", value: analytics.summary.totalRevenueFormatted },
              ].map((s) => (
                <div key={s.label} className="ep-card p-4">
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-xl font-semibold text-gray-900 mt-1">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Capacity bar */}
            <div className="ep-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Capacity</span>
                <span className="text-sm text-gray-500">{analytics.summary.capacityUsed}%</span>
              </div>
              <div className="bg-gray-100 rounded-full h-2">
                <div
                  className="bg-[#1A56A4] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${analytics.summary.capacityUsed}%` }}
                />
              </div>
            </div>

            {/* Ticket breakdown */}
            <div className="ep-card p-5">
              <h3 className="font-medium text-gray-900 mb-3 text-sm">Ticket breakdown</h3>
              <div className="space-y-3">
                {analytics.ticketBreakdown.map((tt) => (
                  <div key={tt.ticketTypeId}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-800">{tt.name}</span>
                      <span className="text-gray-500">{tt.sold}/{tt.total} sold</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-[#1A56A4] h-1.5 rounded-full"
                        style={{ width: `${tt.total > 0 ? (tt.sold / tt.total) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatPrice(tt.revenue)} revenue · {tt.checkedIn} checked in
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Export */}
            <a
              href={exportUrl}
              target="_blank"
              rel="noreferrer"
              className="ep-btn-secondary w-full text-center py-2.5 block"
            >
              ↓ Export attendee CSV
            </a>

            <button
              onClick={loadAnalytics}
              className="ep-btn-ghost w-full text-center py-2 text-sm"
            >
              ↻ Refresh stats
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
