"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signInAction, type AuthState } from "@/actions/auth";

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState<
    AuthState | undefined,
    FormData
  >(signInAction, undefined);

  return (
    <>
      <div className="text-center mb-6">
        <h1
          className="font-display text-3xl font-extrabold"
          style={{ color: "var(--text)" }}
        >
          Welcome back
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-2)" }}>
          Sign in to your account
        </p>
      </div>

      <div className="card p-7">
        <form action={formAction} className="space-y-4">
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--text)" }}
            >
              Email
            </label>
            <input
              name="email"
              className="inp"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                className="block text-xs font-semibold"
                style={{ color: "var(--text)" }}
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium hover:underline"
                style={{ color: "var(--accent)" }}
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                name="password"
                className="inp pr-10"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5"
                style={{ color: "var(--text-3)" }}
              >
                <i
                  className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}
                ></i>
              </button>
            </div>
          </div>

          {state?.error && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg"
              style={{
                background: "var(--danger-bg)",
                border: "1px solid rgba(220,38,38,.2)",
              }}
            >
              <i
                className="fa-solid fa-circle-exclamation text-sm"
                style={{ color: "var(--danger)" }}
              ></i>
              <span
                className="text-xs font-medium"
                style={{ color: "var(--danger)" }}
              >
                {state.error}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary w-full justify-center disabled:opacity-50"
            style={{ padding: "10px", fontSize: "13.5px" }}
          >
            {pending ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p
          className="text-center text-sm mt-5"
          style={{ color: "var(--text-2)" }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-semibold hover:underline"
            style={{ color: "var(--accent)" }}
          >
            Create one
          </Link>
        </p>
      </div>
    </>
  );
}
