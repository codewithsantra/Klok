"use client";

// Error boundary for dashboard routes. The most common cause here is a
// Neon serverless cold-start timing out on the first query after idle —
// a plain retry usually fixes it, so we lead with that.

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard route error:", error);
    fetch("/api/report-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        boundary: "dashboard",
        path: typeof window !== "undefined" ? window.location.pathname : undefined,
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
      <div className="card p-8 text-center" style={{ maxWidth: 420 }}>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--warning-bg)" }}
        >
          <i
            className="fa-solid fa-triangle-exclamation"
            style={{ color: "var(--warning)", fontSize: 18 }}
          ></i>
        </div>
        <h2 className="font-semibold mb-1" style={{ color: "var(--text)", fontSize: 16 }}>
          Something went wrong
        </h2>
        <p className="text-sm mb-5" style={{ color: "var(--text-3)" }}>
          This is usually a momentary hiccup waking the database. Try again — it
          almost always works the second time.
        </p>
        <button onClick={reset} className="btn btn-primary text-sm">
          <i className="fa-solid fa-rotate-right"></i> Try again
        </button>
      </div>
    </div>
  );
}
