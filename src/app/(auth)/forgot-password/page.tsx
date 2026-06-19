"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordResetAction, type ResetRequestState } from "@/actions/password-reset";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState<ResetRequestState | undefined, FormData>(
    requestPasswordResetAction,
    undefined,
  );

  if (state?.ok) {
    return (
      <>
        <div className="text-center mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--success-bg)" }}
          >
            <i className="fa-solid fa-paper-plane" style={{ color: "var(--success)", fontSize: 18 }}></i>
          </div>
          <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
            Check your inbox
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-2)" }}>
            If an account exists for that email, we&apos;ve sent a link to reset your password.
            The link expires in 1 hour.
          </p>
        </div>
        <div className="card p-7 text-center">
          <Link href="/sign-in" className="btn btn-primary w-full justify-center" style={{ padding: "10px" }}>
            Back to sign in
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
          Reset your password
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-2)" }}>
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <div className="card p-7">
        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text)" }}>
              Email
            </label>
            <input name="email" className="inp" type="email" placeholder="you@example.com" required />
          </div>

          {state?.error && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg"
              style={{ background: "var(--danger-bg)", border: "1px solid rgba(220,38,38,.2)" }}
            >
              <i className="fa-solid fa-circle-exclamation text-sm" style={{ color: "var(--danger)" }}></i>
              <span className="text-xs font-medium" style={{ color: "var(--danger)" }}>{state.error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary w-full justify-center disabled:opacity-50"
            style={{ padding: "10px", fontSize: "13.5px" }}
          >
            {pending ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="text-center text-sm mt-5" style={{ color: "var(--text-2)" }}>
          Remembered it?{" "}
          <Link href="/sign-in" className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}
