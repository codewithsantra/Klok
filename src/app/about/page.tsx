// Rendering: ISR (Incremental Static Regeneration).
// This is a PUBLIC page (no auth) showing aggregate platform stats.
// The numbers are identical for every visitor, so caching the rendered HTML
// is safe. We revalidate every hour to keep the numbers reasonably fresh
// without hitting the DB on every page view.

import Link from "next/link";
import { prisma } from "@/lib/db";

// ── ISR config — Next.js revalidates this page at most once every 3600s (1h) ──
export const revalidate = 3600;

export default async function AboutPage() {
  // These three queries run at most once per hour because of `revalidate`.
  const [userCount, blockCount, doneTodoCount] = await Promise.all([
    prisma.user.count(),
    prisma.block.count(),
    prisma.todo.count({ where: { status: "DONE" } }),
  ]);

  return (
    <div className="min-h-screen bg-[#ECECF8]">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#6C6FDF] rounded-xl flex items-center justify-center shadow-md shadow-[#6C6FDF]/40">
            <i className="fa-solid fa-calendar-check text-white text-sm"></i>
          </div>
          <span className="text-xl font-extrabold text-[#1A1A2E]">DayLog</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="btn btn-ghost px-5">
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="btn btn-primary shadow-md shadow-[#6C6FDF]/30"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 pt-12 md:pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-white border border-[#EEEEFF] px-4 py-2 rounded-full text-sm font-semibold text-[#6C6FDF] shadow-sm mb-6">
          About DayLog
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-[#1A1A2E] mb-6">
          A daily tracker built for{" "}
          <span className="grad-text">honest reflection.</span>
        </h1>
        <p className="text-base lg:text-lg text-[#6B7280] max-w-2xl mx-auto leading-relaxed">
          DayLog isn&apos;t a fancy planner that pretends every day goes
          smoothly. It&apos;s a tracker designed around the truth: you plan,
          you execute, you miss things, you adjust. It helps you build a real
          rhythm without judgement.
        </p>
      </div>

      {/* Live (ISR) stats */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 pb-12">
        <div className="card p-8">
          <h2 className="font-bold text-[#1A1A2E] mb-1">DayLog by the numbers</h2>
          <p className="text-xs text-[#9CA3AF] mb-6">
            Updated hourly via Incremental Static Regeneration.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatBlock
              icon="fa-users"
              iconBg="bg-[#EEEEFF]"
              iconColor="text-[#6C6FDF]"
              value={userCount.toLocaleString()}
              label="People tracking"
            />
            <StatBlock
              icon="fa-clock"
              iconBg="bg-[#FEF3C7]"
              iconColor="text-[#A16207]"
              value={blockCount.toLocaleString()}
              label="Time blocks scheduled"
            />
            <StatBlock
              icon="fa-check"
              iconBg="bg-[#DCFCE7]"
              iconColor="text-[#15803D]"
              value={doneTodoCount.toLocaleString()}
              label="Todos completed"
            />
          </div>
        </div>
      </div>

      {/* Closing */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 pb-20 text-center">
        <Link
          href="/sign-up"
          className="btn btn-primary shadow-lg shadow-[#6C6FDF]/30"
          style={{ fontSize: "15px", padding: "14px 32px" }}
        >
          Start Tracking Free <i className="fa-solid fa-arrow-right"></i>
        </Link>
      </div>
    </div>
  );
}

function StatBlock({
  icon,
  iconBg,
  iconColor,
  value,
  label,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
}) {
  return (
    <div className="text-center">
      <div
        className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center mx-auto mb-3`}
      >
        <i className={`fa-solid ${icon} ${iconColor} text-lg`}></i>
      </div>
      <div className="text-3xl font-extrabold text-[#1A1A2E]">{value}</div>
      <div className="text-sm text-[#6B7280] mt-1 font-medium">{label}</div>
    </div>
  );
}
