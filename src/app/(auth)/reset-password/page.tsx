// Rendering: reads the one-time token from the URL, hands it to the form.

import Link from "next/link";
import ResetForm from "./ResetForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <>
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
            Invalid link
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-2)" }}>
            This password reset link is missing or malformed.
          </p>
        </div>
        <div className="card p-7 text-center">
          <Link href="/forgot-password" className="btn btn-primary w-full justify-center" style={{ padding: "10px" }}>
            Request a new link
          </Link>
        </div>
      </>
    );
  }

  return <ResetForm token={token} />;
}
