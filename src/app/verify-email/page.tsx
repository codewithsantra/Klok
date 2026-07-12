import Link from "next/link";
import { verifyEmailToken } from "@/actions/email-verification";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = await verifyEmailToken(token ?? "");
  const user = await getCurrentUser();
  const homeHref = user ? "/dashboard" : "/sign-in";

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)" }}>
      <div className="card p-8 max-w-sm w-full text-center">
        {result.ok ? (
          <>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(22,163,74,.1)" }}>
              <i className="fa-solid fa-circle-check" style={{ color: "var(--success)", fontSize: 24 }}></i>
            </div>
            <h1 className="font-display text-xl font-extrabold mb-2" style={{ color: "var(--text)" }}>
              Email verified
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--text-2)" }}>
              Your email address is confirmed. You&apos;re all set.
            </p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(220,38,38,.08)" }}>
              <i className="fa-solid fa-link-slash" style={{ color: "var(--danger)", fontSize: 22 }}></i>
            </div>
            <h1 className="font-display text-xl font-extrabold mb-2" style={{ color: "var(--text)" }}>
              {result.reason === "expired" ? "Link expired" : "Invalid link"}
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--text-2)" }}>
              {result.reason === "expired"
                ? "This verification link has expired. Sign in and use the banner to request a new one."
                : "This verification link is invalid or was already used."}
            </p>
          </>
        )}
        <Link href={homeHref} className="btn btn-primary text-sm">
          {user ? "Go to dashboard" : "Sign in"}
        </Link>
      </div>
    </div>
  );
}
