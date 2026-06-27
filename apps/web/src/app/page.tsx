import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F1FB] px-3 py-1 text-xs font-medium text-[#1A56A4] mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1A56A4]" />
          No spreadsheets. No WhatsApp chaos.
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-gray-900 leading-[1.1] mb-6 max-w-3xl mx-auto">
          Events without the{" "}
          <span className="text-[#1A56A4]">manual work.</span>
        </h1>

        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Create your event, collect registrations, accept payments, and check in attendees — all from one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/auth/register?role=ORGANIZER" className="ep-btn-primary px-7 py-3 text-base">
            Create your first event →
          </Link>
          <Link href="/events" className="ep-btn-secondary px-7 py-3 text-base">
            Browse events
          </Link>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { num: "850+", label: "Registrations handled" },
            { num: "5+", label: "Events managed" },
            { num: "₹42K+", label: "Ticket sales" },
            { num: "~4 min", label: "To publish an event" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-semibold text-gray-900">{s.num}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
        <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">How it works</p>
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-12 max-w-lg">
          From idea to sold-out in minutes
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Create your event",
              body: "Set your title, venue, capacity, and ticket types. Add early bird or VIP tiers. Done in under 5 minutes.",
            },
            {
              step: "02",
              title: "Share the link",
              body: "Attendees register and pay online. Tickets land in their inbox the moment payment clears.",
            },
            {
              step: "03",
              title: "Scan and check in",
              body: "Validate QR codes at the door from any phone. See live attendance update on your dashboard.",
            },
          ].map((s) => (
            <div key={s.step} className="ep-card p-6">
              <div className="text-xs font-semibold text-[#1A56A4] mb-4 font-mono">{s.step}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">Features</p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-12">
            Everything you actually need
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "⚡", title: "Instant payments", body: "UPI, cards, and netbanking via Razorpay. Money goes directly to you." },
              { icon: "🎫", title: "QR tickets", body: "Unique QR code per attendee, delivered by email the moment they pay." },
              { icon: "📊", title: "Live dashboard", body: "Sales, revenue, and check-in rate in real time. No Excel needed." },
              { icon: "👥", title: "Ticket tiers", body: "Early bird, general, VIP — different prices and caps per type." },
              { icon: "✉️", title: "Auto confirmations", body: "Attendees get their ticket automatically. No manual follow-up." },
              { icon: "📱", title: "Mobile check-in", body: "Scan QR codes from any phone browser. No app install needed." },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl border border-gray-100 p-5 flex gap-4">
                <div className="text-xl shrink-0">{f.icon}</div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-4">
          Your next event, the easy way.
        </h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Join organizers already using EventPulse to run better events without the chaos.
        </p>
        <Link href="/auth/register?role=ORGANIZER" className="ep-btn-primary px-8 py-3 text-base">
          Start for free — no credit card needed
        </Link>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1A56A4]" />
            <span className="text-sm font-medium text-gray-500">EventPulse</span>
          </div>
          <p className="text-xs text-gray-400">© 2026 EventPulse. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
