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
        <h1 className="text-3xl font-extrabold text-[#1A1A2E]">
          Create account
        </h1>
        <p className="text-[#6B7280] mt-2 text-sm">
          Start planning. Start winning.
        </p>
      </div>

      <div className="card p-8">
        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">
              Full Name
            </label>
            <input
              name="name"
              className="inp"
              type="text"
              placeholder="Your name"
              required
            />
          </div>
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
                type={showPwd ? "text" : "password"}
                placeholder="Min. 8 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-3 text-[#9CA3AF] hover:text-[#6C6FDF]"
              >
                <i
                  className={`fa-solid ${showPwd ? "fa-eye-slash" : "fa-eye"} text-sm`}
                ></i>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1.5">
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
                className="absolute right-3 top-3 text-[#9CA3AF] hover:text-[#6C6FDF]"
              >
                <i
                  className={`fa-solid ${showPwd2 ? "fa-eye-slash" : "fa-eye"} text-sm`}
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
            {pending ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          Already have an account?
          <Link
            href="/sign-in"
            className="text-[#6C6FDF] font-semibold hover:underline ml-1"
          >
            Sign In
          </Link>
        </p>
      </div>
    </>
  );
}
