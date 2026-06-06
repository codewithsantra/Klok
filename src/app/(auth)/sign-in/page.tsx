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
      {/* Heading */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-extrabold text-[#1A1A2E]">Welcome back</h1>
        <p className="text-[#6B7280] mt-2 text-sm">
          Track your day, own your time
        </p>
      </div>

      {/* Card */}
      <div className="card p-8">
        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">
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
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">
              Password
            </label>
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
                className="absolute right-3 top-3 text-[#9CA3AF] hover:text-[#6C6FDF]"
              >
                <i
                  className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}
                ></i>
              </button>
            </div>
          </div>
          {state?.error && (
            <div className="flex items-center gap-2 p-3 bg-[#FFF5F5] rounded-xl border border-[#FEE2E2]">
              <i className="fa-solid fa-circle-exclamation text-[#DC2626] text-sm"></i>
              <span className="text-xs text-[#DC2626] font-medium">
                {state.error}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary w-full justify-center py-3 rounded-xl text-sm disabled:opacity-50"
          >
            {pending ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="text-center text-sm text-[#6B7280] mt-6">
          Don&apos;t have an account?
          <Link
            href="/sign-up"
            className="text-[#6C6FDF] font-semibold hover:underline ml-1"
          >
            Create one
          </Link>
        </p>
      </div>
    </>
  );
}
