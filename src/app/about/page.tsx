// Rendering: ISR (Incremental Static Regeneration).
// Public page showing aggregate platform stats. Revalidates every hour.

import Link from "next/link";
import {
  MarketingNav,
  MarketingFooter,
} from "@/components/marketing/MarketingChrome";

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: "#F7F7FC" }}>
      <MarketingNav />

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 pt-16 pb-12 text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
          style={{
            background: "var(--accent-bg)",
            color: "var(--accent)",
            border: "1px solid rgba(94,106,210,.2)",
          }}
        >
          About Klok
        </div>
        <h1
          className="font-display text-4xl md:text-5xl font-extrabold leading-tight mb-6"
          style={{ color: "var(--text)" }}
        >
          A daily tracker built for{" "}
          <span style={{ color: "var(--accent)" }}>honest reflection.</span>
        </h1>
        <p
          className="text-base lg:text-lg max-w-2xl mx-auto leading-relaxed"
          style={{ color: "var(--text-2)" }}
        >
          Klok isn&apos;t a fancy planner that pretends every day goes smoothly.
          It&apos;s a tracker designed around the truth: you plan, you execute,
          you miss things, you adjust.
        </p>
      </div>

      {/* Roadmap */}
      <div
        id="roadmap"
        className="max-w-4xl mx-auto px-4 md:px-8 pb-12"
        style={{ scrollMarginTop: "80px" }}
      >
        <div className="card p-8">
          <h2 className="font-semibold mb-1" style={{ color: "var(--text)" }}>
            What&apos;s next
          </h2>
          <p className="text-xs mb-6" style={{ color: "var(--text-3)" }}>
            A peek at where Klok is headed.
          </p>
          <div className="space-y-4">
            {[
              {
                status: "Shipped",
                color: "var(--success)",
                title: "Focus timer with sub-items",
                body: "Set a focus goal, split it into sub-items, and run live timers — overtime tracked honestly.",
              },
              {
                status: "Shipped",
                color: "var(--success)",
                title: "Recurring tasks & honest carry-forward",
                body: "Set routines once and Klok builds your day; carry misses forward without rewriting history.",
              },
              {
                status: "Planned",
                color: "var(--warning)",
                title: "Native mobile apps",
                body: "Klok in your pocket, with reminders and offline support.",
              },
              {
                status: "Exploring",
                color: "var(--text-3)",
                title: "Shared templates & team planning",
                body: "Plan together with shared structures and team analytics.",
              },
            ].map((r) => (
              <div key={r.title} className="flex gap-4">
                <div className="flex flex-col items-center pt-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: r.color }}
                  ></span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--text)" }}
                    >
                      {r.title}
                    </span>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "var(--surface-2)", color: r.color }}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-2)" }}>
                    {r.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 pb-20 text-center">
        <Link
          href="/sign-up"
          className="btn btn-primary"
          style={{ fontSize: "14px", padding: "12px 28px" }}
        >
          Start Tracking Free <i className="fa-solid fa-arrow-right"></i>
        </Link>
      </div>

      <MarketingFooter />
    </div>
  );
}
