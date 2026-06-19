// Rendering: SSR (per-request).
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { todayInZone, nowHHMMInZone, addDays, isSameUTCDay } from "@/lib/dates";
import { computeStreak, computeLongestStreak } from "@/lib/streak";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const today = todayInZone(user.timeZone);
  const weekStart = addDays(today, -6);

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

  const blocksTotal = todayBlocks.length;
  const blocksDone = todayBlocks.filter((b) => b.status === "DONE").length;
  const productivityScore =
    blocksTotal === 0 ? null : Math.round((blocksDone / blocksTotal) * 100);

  const streak = computeStreak(allBlockDates, today);
  const longestStreak = computeLongestStreak(allBlockDates);
  const weekDays = buildWeekChart(weekBlocks, today);
  const previewBlocks = todayBlocks.slice(0, 4);

  const nowHHMM = nowHHMMInZone(user.timeZone);

  return (
    <div className="animate-fade-in">
      {/* Greeting */}
      <div className="mb-6">
        <h1
          className="font-display text-2xl font-extrabold"
          style={{ color: "var(--text)" }}
        >
          Welcome back{user.name ? `, ${user.name}` : ""}!
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
          {streak > 0
            ? `🔥 ${streak}-day streak — keep it going!`
            : "Plan your first block to start a streak."}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 stagger">
        <Link href="/today" className="card p-5 stat-card flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--success-bg)" }}
          >
            <i className="fa-solid fa-check" style={{ color: "var(--success)", fontSize: "16px" }}></i>
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>
              {blocksDone}{" "}
              <span className="text-sm font-medium" style={{ color: "var(--text-3)" }}>
                / {blocksTotal}
              </span>
            </div>
            <div className="text-xs font-medium mt-0.5" style={{ color: "var(--text-2)" }}>
              Blocks Completed
            </div>
          </div>
          <i className="fa-solid fa-arrow-right text-xs" style={{ color: "var(--text-3)" }}></i>
        </Link>

        <Link href="/analytics" className="card p-5 stat-card flex items-center gap-4">
          <div
            className="flex-shrink-0"
            style={{
              width: 52, height: 52, borderRadius: "50%",
              background: `conic-gradient(var(--accent) ${(productivityScore ?? 0) * 3.6}deg, var(--accent-bg) 0)`,
              display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
            }}
          >
            <div style={{ position: "absolute", width: 38, height: 38, borderRadius: "50%", background: "var(--surface)" }} />
            <span className="tabular" style={{ position: "relative", fontSize: 11.5, fontWeight: 800, color: "var(--accent)" }}>
              {productivityScore === null ? "—" : `${productivityScore}%`}
            </span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold" style={{ color: "var(--text)" }}>Productivity Score</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
              {blocksDone} of {blocksTotal} blocks done
            </div>
          </div>
          <i className="fa-solid fa-arrow-right text-xs" style={{ color: "var(--text-3)" }}></i>
        </Link>

        <div className="card p-5 stat-card flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--warning-bg)" }}
          >
            <span className="text-xl">🔥</span>
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>
              {streak}{" "}
              <span className="text-sm font-medium" style={{ color: "var(--text-3)" }}>
                {streak === 1 ? "day" : "days"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-2)" }}>
                Current Streak
              </span>
              {longestStreak > 0 && (
                <span
                  className="text-[11px] font-medium"
                  style={{ color: "var(--text-3)" }}
                  title="Your longest run of consecutive days"
                >
                  · Best {longestStreak}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Today's blocks preview */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ color: "var(--text)" }}>
              Today&apos;s Blocks
            </h2>
            <Link href="/today" className="text-xs font-semibold hover:underline" style={{ color: "var(--accent)" }}>
              See All →
            </Link>
          </div>

          {previewBlocks.length === 0 ? (
            <div className="text-center py-10">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3"
                style={{ background: "var(--accent-bg)" }}
              >
                <i className="fa-solid fa-calendar-day" style={{ color: "var(--accent)", fontSize: "18px" }}></i>
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                No blocks scheduled yet
              </p>
              <p className="text-xs mt-1 mb-4" style={{ color: "var(--text-3)" }}>
                Plan your day by adding your first time block.
              </p>
              <Link href="/today" className="btn btn-primary text-xs">
                <i className="fa-solid fa-plus"></i> Add Block
              </Link>
            </div>
          ) : (
            <div className="space-y-2 stagger">
              {previewBlocks.map((block) => {
                const tagClass = block.tag ? tagClassFor(block.tag.name) : "tag-personal";
                const doneTodos = block.todos.filter((t) => t.status === "DONE").length;
                const totalTodos = block.todos.length;
                const badge = computeBadge(block.status, block.startTime, block.endTime, nowHHMM);

                return (
                  <div
                    key={block.id}
                    className="flex items-start justify-between rounded-lg p-3"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm" style={{ color: "var(--text)" }}>
                          {block.tag?.emoji ?? "📌"} {block.title}
                        </span>
                        {block.tag && <span className={`tag ${tagClass}`}>{block.tag.name}</span>}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-3)" }}>
                        {block.startTime} – {block.endTime}
                        {totalTodos > 0 && ` · ${doneTodos}/${totalTodos} todos done`}
                      </div>
                    </div>
                    <span className={`pill ${badge}`}>{badgeText(badge)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm" style={{ color: "var(--text)" }}>This Week</h2>
              <Link href="/analytics" className="text-xs font-semibold hover:underline" style={{ color: "var(--accent)" }}>
                Full view →
              </Link>
            </div>
            <div className="flex items-end justify-between gap-1.5 h-16">
              {weekDays.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-md"
                    style={{
                      height: `${Math.max(day.pct * 0.6, 4)}px`,
                      background:
                        day.pct === 0
                          ? "var(--surface-2)"
                          : day.pct >= 80
                            ? "var(--success)"
                            : day.pct >= 50
                              ? "var(--warning)"
                              : "var(--danger)",
                      outline: day.isToday ? "2px solid var(--accent)" : "none",
                      outlineOffset: "1px",
                      transition: "height 0.35s cubic-bezier(0.2,0,0,1)",
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
                  className="text-[10px]"
                  style={{
                    color: day.isToday ? "var(--accent)" : "var(--text-3)",
                    fontWeight: day.isToday ? 700 : 400,
                  }}
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

function buildWeekChart(weekBlocks: { date: Date; status: string }[], today: Date) {
  const days: { label: string; pct: number; isToday: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = addDays(today, -i);
    const dayBlocks = weekBlocks.filter((b) => isSameUTCDay(b.date, day));
    const total = dayBlocks.length;
    const done = dayBlocks.filter((b) => b.status === "DONE").length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    days.push({ label: DAY_SHORT[day.getUTCDay()], pct, isToday: i === 0 });
  }
  return days;
}

function computeBadge(status: string, startTime: string, endTime: string, nowHHMM: string): string {
  if (status === "DONE") return "pill-done";
  if (status === "SKIPPED") return "pill-skipped";
  if (status === "PARTIAL") {
    if (nowHHMM > endTime) return "pill-partial";
    return "pill-now";
  }
  if (nowHHMM > endTime) return "pill-missed";
  if (nowHHMM >= startTime) return "pill-now";
  return "pill-upcoming";
}

function badgeText(pillClass: string): string {
  const map: Record<string, string> = {
    "pill-done": "Done ✓",
    "pill-skipped": "Skipped",
    "pill-partial": "Partial",
    "pill-now": "Now",
    "pill-missed": "Missed",
    "pill-upcoming": "Upcoming",
  };
  return map[pillClass] ?? "—";
}

function tagClassFor(name: string): string {
  const map: Record<string, string> = {
    Study: "tag-study", Work: "tag-work", Sleep: "tag-sleep",
    Exercise: "tag-health", Personal: "tag-personal",
    Breakfast: "tag-meal", Lunch: "tag-meal", Dinner: "tag-meal", Break: "tag-break",
  };
  return map[name] ?? "tag-personal";
}
