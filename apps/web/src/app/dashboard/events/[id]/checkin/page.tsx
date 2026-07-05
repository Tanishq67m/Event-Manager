"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { checkin, EventAnalytics } from "@/lib/api";
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
  const router = useRouter();

  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [qrInput, setQrInput] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  
  // Flash overlay visible state
  const [showFlash, setShowFlash] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAnalytics();
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
    setShowFlash(false);
    
    try {
      const res = await checkin.scan(code);
      setResult(res);
      setShowFlash(true);
      setQrInput("");
      
      if (res.valid) loadAnalytics();

      // Automatically auto-close flash after 4 seconds
      setTimeout(() => {
        setShowFlash(false);
      }, 4000);
      
    } catch (err: unknown) {
      const errRes: ScanResult = { 
        valid: false, 
        reason: err instanceof Error ? err.message : "Scan failed" 
      };
      setResult(errRes);
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 4000);
    } finally {
      setScanning(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  const exportUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"}/checkin/export/${id}`;

  return (
    <div className="min-h-screen bg-[#08070d] bg-radial-pulse pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 z-10 relative space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <Link href="/dashboard" className="text-xs text-gray-500 hover:text-white transition-colors">
              ← Back to dashboard
            </Link>
            {analytics && (
              <h1 className="text-2xl font-extrabold text-white mt-1.5">{analytics.event.title}</h1>
            )}
            <p className="text-xs text-gray-400 mt-0.5">Live Gate QR Scanner check-ins tool</p>
          </div>
          <div className="flex gap-2">
            <a
              href={exportUrl}
              target="_blank"
              rel="noreferrer"
              className="ep-btn-secondary text-xs px-4 py-2"
            >
              Export CSV
            </a>
            <button
              onClick={loadAnalytics}
              className="ep-btn-secondary text-xs px-4 py-2"
            >
              Refresh Stats
            </button>
          </div>
        </div>

        {/* ── Visual Flashing Scanner Overlays ────────────────────────────── */}
        {showFlash && result && (
          <div
            onClick={() => setShowFlash(false)}
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md cursor-pointer animate-fade-in ${
              result.valid
                ? "bg-emerald-950/90 shadow-[inset_0_0_80px_rgba(16,185,129,0.4)]"
                : "bg-rose-950/90 shadow-[inset_0_0_80px_rgba(244,63,94,0.4)]"
            }`}
          >
            <div className="text-center space-y-4 max-w-md p-8 glass-card border-white/10 rounded-2xl animate-scale-up">
              <div className="text-6xl">
                {result.valid ? "✅" : "❌"}
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                {result.valid ? "Welcome Access" : "Access Denied"}
              </h2>

              <div className="space-y-1.5 pt-2">
                {result.valid ? (
                  <>
                    <p className="text-2xl font-extrabold text-emerald-400">{result.attendee}</p>
                    <p className="text-sm font-semibold text-white uppercase tracking-wider">{result.ticketType || "General Ticket"}</p>
                    {result.checkedInAt && (
                      <p className="text-xs text-gray-400">
                        Checked in at {new Date(result.checkedInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold text-rose-400 leading-snug">
                      {result.reason || "This ticket is already checked in!"}
                    </p>
                    {result.attendee && (
                      <p className="text-xs text-gray-400 mt-1">
                        Assigned to: <strong>{result.attendee}</strong> ({result.ticketType})
                      </p>
                    )}
                  </>
                )}
              </div>

              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pt-4">
                Click anywhere to dismiss
              </p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: Code Scan input & Feeds */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Input card */}
            <div className="glass-card p-6 rounded-xl border border-white/10 space-y-4">
              <h3 className="font-bold text-white text-sm">Gate Validation input</h3>
              <form onSubmit={handleScan} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  className="ep-input font-mono tracking-widest text-sm uppercase bg-slate-950/60"
                  placeholder="EP-2026-XXXXXXXXXX"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  autoComplete="off"
                  required
                />
                <button type="submit" className="ep-btn-primary px-6" disabled={scanning}>
                  {scanning ? "..." : "Scan"}
                </button>
              </form>
              <p className="text-[10px] text-gray-500 font-semibold leading-normal">
                Type code or autofocus to scan with standard USB barcode scanners.
              </p>
            </div>

            {/* Standard Alert scan status showing inline */}
            {result && !showFlash && (
              <div className={`glass-card p-5 rounded-xl border-l-4 ${
                result.valid ? "border-l-emerald-500 bg-emerald-950/20" : "border-l-rose-500 bg-rose-950/20"
              }`}>
                <div className="flex items-start gap-3">
                  <span className="text-xl">{result.valid ? "✅" : "❌"}</span>
                  <div>
                    <h4 className="font-bold text-white text-sm">{result.valid ? result.message : "Invalid Ticket Code"}</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      {result.valid ? `${result.attendee} (${result.ticketType})` : result.reason}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent gate check-ins timeline */}
            {analytics && (
              <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
                <h3 className="font-bold text-white text-sm">Recent Entries</h3>
                
                {analytics.recentCheckIns.length === 0 ? (
                  <p className="text-xs text-gray-500">No attendees checked in yet.</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.recentCheckIns.map((ci, i) => (
                      <div key={i} className="flex items-center justify-between text-xs border-b border-white/3 pb-2 last:border-b-0 last:pb-0">
                        <div>
                          <span className="font-bold text-white">{ci.attendeeName}</span>
                          <span className="text-gray-500 text-[10px] ml-2 uppercase font-mono">{ci.ticketType}</span>
                        </div>
                        <span className="text-[10px] text-violet-400 font-mono">
                          {ci.checkedInAt ? new Date(ci.checkedInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right panel: Analytics summary */}
          {analytics && (
            <div className="lg:col-span-6 space-y-6">
              
              {/* Telemetry card grid */}
              <div className="grid grid-cols-2 gap-3.5">
                {[
                  { label: "Total Registrations", value: analytics.summary.totalRegistrations },
                  { label: "Today's Entries", value: analytics.summary.checkedInCount },
                  { label: "Check-in Ratio", value: `${analytics.summary.checkInRate}%` },
                  { label: "Gross revenue", value: analytics.summary.totalRevenueFormatted },
                ].map((s) => (
                  <div key={s.label} className="glass-card p-4 rounded-xl border border-white/5 shadow-md">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">{s.label}</span>
                    <p className="text-lg font-extrabold text-white mt-1 font-mono">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="glass-card p-5 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Capacity Progress</span>
                  <span className="font-semibold text-violet-400 font-mono">{analytics.summary.capacityUsed}%</span>
                </div>
                <div className="bg-slate-900 border border-slate-950 rounded-full h-2 w-full">
                  <div
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 h-2 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(124,58,237,0.4)]"
                    style={{ width: `${analytics.summary.capacityUsed}%` }}
                  />
                </div>
              </div>

              {/* Ticket tier splits */}
              <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
                <h3 className="font-bold text-white text-sm">Ticket Category Analytics</h3>
                
                <div className="space-y-4">
                  {analytics.ticketBreakdown.map((tt) => (
                    <div key={tt.ticketTypeId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{tt.name}</span>
                        <span className="text-gray-400 font-mono">{tt.sold} / {tt.total} Sold</span>
                      </div>
                      <div className="bg-slate-900 border border-slate-950 rounded-full h-1.5 w-full">
                        <div
                          className="bg-violet-500 h-1.5 rounded-full"
                          style={{ width: `${tt.total > 0 ? (tt.sold / tt.total) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-500 pt-0.5">
                        <span>Revenue: {formatPrice(tt.revenue)}</span>
                        <span className="text-violet-400">{tt.checkedIn} Checked-in</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
