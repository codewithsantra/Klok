// Rendering: SSR (per-request).
// Per-user data (today's blocks, streak, weekly chart) — must run fresh on
// each request to reflect any changes the user made elsewhere in the app.

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { todayUTC, addDays, isSameUTCDay, toISODate } from "@/lib/dates";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const today = todayUTC();
  const weekStart = addDays(today, -6); // 7 days including today

  // Run all queries in parallel — independent of each other
  const [todayBlocks, weekBlocks, allBlockDates] = await Promise.all([
    prisma.block.findMany({
      where: { userId: user.id, date: today },
      include: { tag: true, todos: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.block.findMany({
      where: { userId: user.id, date: { gte: weekStart, lte: today } },
      select: { date: true, status: true },
    }),
    prisma.block.findMany({
      where: { userId: user.id },
      select: { date: true },
      orderBy: { date: "desc" },
    }),
  ]);

  // ── Stats ──
  const blocksTotal = todayBlocks.length;
  const blocksDone = todayBlocks.filter((b) => b.status === "DONE").length;
  const productivityScore =
    blocksTotal === 0 ? null : Math.round((blocksDone / blocksTotal) * 100);

  // ── Streak ──
  const streak = computeStreak(allBlockDates, today);

  // ── Week chart ──
  const weekDays = buildWeekChart(weekBlocks, today);

  // ── Today's preview (first 4) ──
  const previewBlocks = todayBlocks.slice(0, 4);

  // Current time as HH:MM (for "Missed" / "Now" / "Upcoming" badges)
  const now = new Date();
  const nowHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <div className="animate-fade-in">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1A1A2E]">
          Welcome back{user.name ? `, ${user.name}` : ""}!
        </h1>
        <p className="text-sm text-[#9CA3AF] mt-1">
          {streak > 0
            ? `🔥 ${streak}-day streak — keep it going!`
            : "Plan your first block to start a streak."}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Link
          href="/today"
          className="card p-5 stat-card flex items-center gap-4 cursor-pointer"
        >
          <div className="w-12 h-12 bg-[#DCFCE7] rounded-2xl flex items-center justify-center flex-shrink-0">
            <i className="fa-solid fa-check text-[#15803D] text-lg"></i>
          </div>
          <div className="flex-1">
            <div className="text-2xl font-extrabold text-[#1A1A2E]">
              {blocksDone}{" "}
              <span className="text-base font-medium text-[#9CA3AF]">
                / {blocksTotal}
              </span>
            </div>
            <div className="text-xs font-semibold text-[#6B7280] mt-0.5">
              Blocks Completed
            </div>
          </div>
          <i className="fa-solid fa-arrow-right text-[#D1D5DB] text-xs"></i>
        </Link>

        <Link
          href="/analytics"
          className="card p-5 stat-card flex items-center gap-4 cursor-pointer"
        >
          <div className="w-12 h-12 bg-[#EEEEFF] rounded-2xl flex items-center justify-center flex-shrink-0">
            <i className="fa-solid fa-bolt text-[#6C6FDF] text-lg"></i>
          </div>
          <div className="flex-1">
            <div className="text-2xl font-extrabold text-[#6C6FDF]">
              {productivityScore === null ? "—" : `${productivityScore}%`}
            </div>
            <div className="text-xs font-semibold text-[#6B7280] mt-0.5">
              Productivity Score
            </div>
          </div>
          <i className="fa-solid fa-arrow-right text-[#D1D5DB] text-xs"></i>
        </Link>

        <div className="card p-5 stat-card flex items-center gap-4">
          <div className="w-12 h-12 bg-[#FEF3C7] rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🔥</span>
          </div>
          <div className="flex-1">
            <div className="text-2xl font-extrabold text-[#1A1A2E]">
              {streak}{" "}
              <span className="text-base font-medium text-[#9CA3AF]">
                {streak === 1 ? "day" : "days"}
              </span>
            </div>
            <div className="text-xs font-semibold text-[#6B7280] mt-0.5">
              Current Streak
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Today's blocks preview */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#1A1A2E] text-base">
              Today&apos;s Blocks
            </h2>
            <Link
              href="/today"
              className="text-xs text-[#6C6FDF] font-semibold hover:underline"
            >
              See All →
            </Link>
          </div>
          {previewBlocks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 bg-[#EEEEFF] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <i className="fa-solid fa-calendar-day text-[#6C6FDF] text-xl"></i>
              </div>
              <p className="text-sm font-semibold text-[#1A1A2E]">
                No blocks scheduled yet
              </p>
              <p className="text-xs text-[#9CA3AF] mt-1 mb-4">
                Plan your day by adding your first time block.
              </p>
              <Link
                href="/today"
                className="btn btn-primary text-xs py-2.5"
                style={{ fontSize: "12px" }}
              >
                <i className="fa-solid fa-plus"></i> Add Block
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {previewBlocks.map((block) => {
                const tagClass = block.tag
                  ? tagClassFor(block.tag.name)
                  : "tag-personal";
                const doneTodos = block.todos.filter(
                  (t) => t.status === "DONE",
                ).length;
                const totalTodos = block.todos.length;

                const cardClass =
                  block.status === "DONE"
                    ? "block-done bg-[#F9FFF9] border border-[#DCFCE7]"
                    : block.status === "PARTIAL"
                      ? "block-partial bg-[#FAFAFF] border border-[#EEEEFF]"
                      : "block-plan bg-white border border-[#F3F4F6]";
                const badge = computeBadge(block.status, block.startTime, block.endTime, nowHHMM);

                return (
                  <div
                    key={block.id}
                    className={`${cardClass} rounded-xl p-3.5`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-bold text-[#1A1A2E] text-sm">
                            {block.tag?.emoji ?? "📌"} {block.title}
                          </span>
                          {block.tag && (
                            <span className={`tag ${tagClass}`}>
                              {block.tag.name}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#9CA3AF]">
                          {block.startTime} – {block.endTime}
                          {totalTodos > 0 &&
                            ` · ${doneTodos}/${totalTodos} todos done`}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-bold ${badge.color} px-2.5 py-1 rounded-lg`}
                      >
                        {badge.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Week chart */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-[#1A1A2E] text-sm">This Week</h2>
              <Link
                href="/analytics"
                className="text-xs text-[#6C6FDF] font-semibold hover:underline"
              >
                Full view →
              </Link>
            </div>
            <div className="flex items-end justify-between gap-1.5 h-16">
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full rounded-md"
                    style={{
                      height: `${Math.max(day.pct * 0.6, 4)}px`,
                      background: day.isToday ? "#6C6FDF" : "#EEEEFF",
                    }}
                    title={`${day.label}: ${day.pct}%`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {weekDays.map((day, i) => (
                <span
                  key={i}
                  className={`text-[10px] ${
                    day.isToday
                      ? "font-bold text-[#6C6FDF]"
                      : "text-[#9CA3AF]"
                  }`}
                >
                  {day.isToday ? "Today" : day.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──

/**
 * Compute the current streak (consecutive days with at least one block).
 * Lenient: if today has no blocks yet, starts counting from yesterday.
 */
function computeStreak(blockDates: { date: Date }[], today: Date): number {
  if (blockDates.length === 0) return 0;

  // Build a set of date strings (deduped) for O(1) lookup
  const dateSet = new Set(blockDates.map((d) => toISODate(d.date)));

  // If today has blocks, start there. Otherwise start from yesterday.
  let cursor = dateSet.has(toISODate(today)) ? today : addDays(today, -1);

  // Walk backwards while consecutive days are present
  let streak = 0;
  while (dateSet.has(toISODate(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function buildWeekChart(
  weekBlocks: { date: Date; status: string }[],
  today: Date,
) {
  const days: { label: string; pct: number; isToday: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = addDays(today, -i);
    const dayBlocks = weekBlocks.filter((b) => isSameUTCDay(b.date, day));
    const total = dayBlocks.length;
    const done = dayBlocks.filter((b) => b.status === "DONE").length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    days.push({
      label: DAY_SHORT[day.getUTCDay()],
      pct,
      isToday: i === 0,
    });
  }
  return days;
}

/**
 * Compute the right badge for a block based on its status AND current time.
 * Used for TODAY's blocks (so time comparison is meaningful).
 */
function computeBadge(
  status: string,
  startTime: string,
  endTime: string,
  nowHHMM: string,
): { text: string; color: string } {
  if (status === "DONE") {
    return { text: "Done ✓", color: "text-[#15803D] bg-[#DCFCE7]" };
  }
  if (status === "SKIPPED") {
    return { text: "Skipped", color: "text-[#DC2626] bg-[#FEE2E2]" };
  }
  if (status === "PARTIAL") {
    if (nowHHMM > endTime) {
      return { text: "Partial", color: "text-[#F59E0B] bg-[#FEF3C7]" };
    }
    return { text: "In Progress", color: "text-[#6C6FDF] bg-[#EEEEFF]" };
  }
  // PLANNED
  if (nowHHMM > endTime) {
    return { text: "Missed", color: "text-[#DC2626] bg-[#FEE2E2]" };
  }
  if (nowHHMM >= startTime) {
    return { text: "Now", color: "text-[#6C6FDF] bg-[#EEEEFF]" };
  }
  return { text: "Upcoming", color: "text-[#9CA3AF] bg-[#F3F4F6]" };
}

function tagClassFor(name: string): string {
  const map: Record<string, string> = {
    Study: "tag-study",
    Work: "tag-work",
    Sleep: "tag-sleep",
    Exercise: "tag-health",
    Personal: "tag-personal",
    Breakfast: "tag-meal",
    Lunch: "tag-meal",
    Dinner: "tag-meal",
    Break: "tag-break",
  };
  return map[name] ?? "tag-personal";
}
