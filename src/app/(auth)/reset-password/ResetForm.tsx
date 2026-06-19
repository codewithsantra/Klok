"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { resetPasswordAction, type ResetState } from "@/actions/password-reset";

export default function ResetForm({ token }: { token: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState<ResetState | undefined, FormData>(
    resetPasswordAction,
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
            <i className="fa-solid fa-circle-check" style={{ color: "var(--success)", fontSize: 18 }}></i>
          </div>
          <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
            Password updated
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-2)" }}>
            You can now sign in with your new password.
          </p>
        </div>
        <div className="card p-7 text-center">
          <Link href="/sign-in" className="btn btn-primary w-full justify-center" style={{ padding: "10px" }}>
            Sign in
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
          Choose a new password
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-2)" }}>
          Make it at least 8 characters.
        </p>
      </div>

      <div className="card p-7">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text)" }}>
              New password
            </label>
            <div className="relative">
              <input
                name="password"
                className="inp pr-10"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5"
                style={{ color: "var(--text-3)" }}
              >
                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}></i>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text)" }}>
              Confirm new password
            </label>
            <input
              name="confirmPassword"
              className="inp"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required
              minLength={8}
            />
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
            {pending ? "Updating..." : "Update password"}
          </button>
        </form>

        <p className="text-center text-sm mt-5" style={{ color: "var(--text-2)" }}>
          <Link href="/sign-in" className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>
            Back to sign in
          </Link>
        </p>
      </div>
    </>
  );
}
