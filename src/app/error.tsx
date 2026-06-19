"use client";

// Root error boundary — catches errors on public/auth routes that aren't
// wrapped by a more specific boundary (e.g. the dashboard one).

import { useEffect } from "react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root route error:", error);
    fetch("/api/report-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        boundary: "root",
        path: typeof window !== "undefined" ? window.location.pathname : undefined,
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg)" }}
    >
      <div className="text-center" style={{ maxWidth: 420 }}>
        <div className="text-5xl mb-4">😵‍💫</div>
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: "var(--text)", letterSpacing: "-0.02em" }}
        >
          Something broke
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-3)" }}>
          An unexpected error occurred. Give it another try, or head back home.
        </p>
        <div className="flex items-center justify-center gap-2">
          <button onClick={reset} className="btn btn-primary text-sm">
            <i className="fa-solid fa-rotate-right"></i> Try again
          </button>
          <Link href="/" className="btn btn-ghost text-sm">
            <i className="fa-solid fa-house"></i> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
