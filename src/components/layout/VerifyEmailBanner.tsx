"use client";

import { useState, useTransition } from "react";
import { resendVerificationAction } from "@/actions/email-verification";

export default function VerifyEmailBanner({ email }: { email: string }) {
  const [pending, startTx] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  function handleResend() {
    setError(null);
    startTx(async () => {
      const res = await resendVerificationAction();
      if (res.error) setError(res.error);
      else setSent(true);
    });
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 text-xs"
      style={{ background: "rgba(245,158,11,.08)", borderBottom: "1px solid rgba(245,158,11,.2)" }}>
      <i className="fa-solid fa-envelope" style={{ color: "var(--warning)", fontSize: 11 }}></i>
      <span className="flex-1 min-w-0" style={{ color: "var(--text-2)" }}>
        {sent
          ? "Verification email sent — check your inbox."
          : error
            ? error
            : <>Verify your email — we sent a link to <strong style={{ color: "var(--text)" }}>{email}</strong>.</>}
      </span>
      {!sent && (
        <button type="button" onClick={handleResend} disabled={pending}
          className="font-semibold px-2.5 py-1 rounded flex-shrink-0"
          style={{ background: "var(--warning)", color: "white", border: "none", cursor: "pointer", opacity: pending ? 0.6 : 1 }}>
          {pending ? "Sending..." : "Resend link"}
        </button>
      )}
      <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss"
        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
        style={{ background: "transparent", border: "none", cursor: "pointer" }}>
        <i className="fa-solid fa-xmark" style={{ fontSize: 10, color: "var(--text-3)" }}></i>
      </button>
    </div>
  );
}
