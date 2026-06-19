"use client";

import Link from "next/link";
import { useState, useActionState } from "react";
import { signUpAction, type AuthState } from "@/actions/auth";

export default function SignUpPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [state, formAction, pending] = useActionState<
    AuthState | undefined,
    FormData
  >(signUpAction, undefined);

  return (
    <>
      <div className="text-center mb-6">
        <h1
          className="font-display text-3xl font-extrabold"
          style={{ color: "var(--text)" }}
        >
          Create account
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-2)" }}>
          Start planning. Start winning.
        </p>
      </div>

      <div className="card p-7">
        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text)" }}>
              Full Name
            </label>
            <input name="name" className="inp" type="text" placeholder="Your name" required />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text)" }}>
              Email
            </label>
            <input name="email" className="inp" type="email" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text)" }}>
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                className="inp pr-10"
                type={showPwd ? "text" : "password"}
                placeholder="Min. 8 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-2.5"
                style={{ color: "var(--text-3)" }}
              >
                <i className={`fa-solid ${showPwd ? "fa-eye-slash" : "fa-eye"} text-sm`}></i>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text)" }}>
              Confirm Password
            </label>
            <div className="relative">
              <input
                name="confirmPassword"
                className="inp pr-10"
                type={showPwd2 ? "text" : "password"}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd2(!showPwd2)}
                className="absolute right-3 top-2.5"
                style={{ color: "var(--text-3)" }}
              >
                <i className={`fa-solid ${showPwd2 ? "fa-eye-slash" : "fa-eye"} text-sm`}></i>
              </button>
            </div>
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
            {pending ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm mt-5" style={{ color: "var(--text-2)" }}>
          Already have an account?{" "}
          <Link href="/sign-in" className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>
            Sign In
          </Link>
        </p>
      </div>
    </>
  );
}
