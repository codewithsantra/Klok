import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { todayInZone, nowHHMMInZone, toISODate } from "@/lib/dates";
import { computeStreak, computeLongestStreak } from "@/lib/streak";
import { getDailyQuote } from "@/lib/quotes";
import { closeOrphanedTimerRuns } from "@/lib/timer-reconcile";
import AgendaList from "@/components/dashboard/AgendaList";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const today = todayInZone(user.timeZone);
  const todayISO = toISODate(today);
  const nowHHMM = nowHHMMInZone(user.timeZone);

  // Close out any run left open on a previous day before reporting focus time.
  await closeOrphanedTimerRuns(user.id, today);

  const [todayTasks, doneTaskDates, timerSessions] = await Promise.all([
    prisma.task.findMany({
      where: { userId: user.id, date: today },
      include: { tag: true },
      orderBy: { startTime: "asc" },
    }),
    // Streaks count days you actually finished something — not days that
    // merely had tasks planned (recurring rules auto-create future
    // instances, which would inflate streaks without any effort).
    prisma.task.findMany({
      where: { userId: user.id, status: "DONE" },
      select: { date: true },
      orderBy: { date: "desc" },
    }),
    prisma.timerSession.findMany({
      where: { userId: user.id, date: today },
      include: {
        tag: { select: { emoji: true, name: true } },
        subItems: { select: { title: true, timerAccumMs: true, timerStartedAt: true, targetMinutes: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // ── Today's task stats ──
  const tasksTotal = todayTasks.length;
  const tasksDone = todayTasks.filter((t) => t.status === "DONE").length;
  const donePct = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;

  // ── Streak ──
  const streak = computeStreak(doneTaskDates, today);
  const longestStreak = computeLongestStreak(doneTaskDates);

  // ── Focus today ──
  const focusTargetMin = timerSessions.reduce((s, sess) => s + sess.targetMinutes, 0);
  const focusElapsedMin = timerSessions.reduce((s, sess) =>
    s + sess.subItems.reduce((si, i) => {
      let ms = i.timerAccumMs;
      if (i.timerStartedAt) ms += Date.now() - i.timerStartedAt.getTime();
      // Never count a sub-item past its allocated time.
      return si + Math.min(ms, i.targetMinutes * 60000);
    }, 0) / 60000, 0);
  const runningSession = timerSessions.find((s) => s.subItems.some((i) => i.timerStartedAt));
  const runningSub = runningSession?.subItems.find((i) => i.timerStartedAt);

  // ── Now / Up next ──
  const currentTask = todayTasks.find(
    (t) => t.status === "PENDING" && nowHHMM >= t.startTime && nowHHMM <= t.endTime,
  );
  const nextTask = todayTasks.find(
    (t) => t.status === "PENDING" && t.startTime > nowHHMM,
  );
  const missedCount = todayTasks.filter(
    (t) => t.status === "PENDING" && t.endTime < nowHHMM,
  ).length;

  // ── Greeting + daily quote ──
  const hour = parseInt(nowHHMM.split(":")[0], 10);
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const quote = getDailyQuote(todayISO, user.id);

  const fmtMin = (m: number) => {
    const h = Math.floor(m / 60);
    const mm = Math.round(m % 60);
    return h > 0 ? `${h}h ${mm}m` : `${mm}m`;
  };

  return (
    <div className="animate-fade-in">
      {/* ── Greeting + quick actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <h1 className="font-display text-2xl font-extrabold min-w-0" style={{ color: "var(--text)", textWrap: "balance" }}>
          {greeting}{user.name ? `, ${user.name}` : ""}!
        </h1>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Land with the create modal already open — a shortcut, not a redirect */}
          <Link href="/today?new=1" className="btn btn-primary text-xs">
            <i className="fa-solid fa-plus"></i> Add Task
          </Link>
          <Link href="/timer?new=1" className="btn btn-outline text-xs">
            <i className="fa-solid fa-play"></i> Start Focus
          </Link>
        </div>
      </div>

      {/* ── Daily motivation ── */}
      <div className="card p-5 mb-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(120deg, var(--accent) 0%, #8B5CF6 100%)",
          border: "none",
        }}>
        <i className="fa-solid fa-quote-left absolute"
          style={{ fontSize: 44, color: "rgba(255,255,255,.25)", top: 14, left: 18 }}></i>
        <div className="relative" style={{ paddingLeft: 76 }}>
          <p className="font-display text-base sm:text-lg font-bold leading-snug"
            style={{ color: "white", textWrap: "pretty" }}>
            {quote}
          </p>
          <p className="text-[11px] mt-1.5 font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,.75)" }}>
            Quote of the day
          </p>
        </div>
      </div>

      {/* ── Now / Up next strip ── */}
      <div className="card p-4 mb-5 flex items-center gap-4"
        style={{
          background: "linear-gradient(135deg, var(--accent-bg), var(--surface))",
          border: "1px solid rgba(94,106,210,.2)",
        }}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: !runningSession && !currentTask && !nextTask && missedCount > 0
              ? "var(--warning)" : "var(--accent)",
            color: "white",
          }}>
          <i className={`fa-solid ${
            runningSession ? "fa-stopwatch"
            : currentTask ? "fa-bolt"
            : nextTask ? "fa-forward"
            : missedCount > 0 ? "fa-triangle-exclamation"
            : "fa-mug-hot"}`}
            style={{ fontSize: 16 }}></i>
        </div>
        <div className="flex-1 min-w-0">
          {runningSession ? (
            <>
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--accent)" }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 pulse" style={{ background: "var(--accent)" }} />
                Focusing now
              </div>
              <div className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>
                {runningSession.tag?.emoji ?? "🎯"} {runningSession.title}
                {runningSub && <span className="font-medium" style={{ color: "var(--text-2)" }}> · {runningSub.title}</span>}
              </div>
            </>
          ) : currentTask ? (
            <>
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--accent)" }}>
                Happening now
              </div>
              <div className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>
                {currentTask.tag?.emoji ?? "📌"} {currentTask.title}
                <span className="font-medium tabular" style={{ color: "var(--text-2)" }}> · until {currentTask.endTime}</span>
              </div>
            </>
          ) : nextTask ? (
            <>
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--accent)" }}>
                Up next
              </div>
              <div className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>
                {nextTask.tag?.emoji ?? "📌"} {nextTask.title}
                <span className="font-medium tabular" style={{ color: "var(--text-2)" }}> · at {nextTask.startTime}</span>
              </div>
            </>
          ) : missedCount > 0 ? (
            <>
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--warning)" }}>
                Needs attention
              </div>
              <div className="text-sm font-bold" style={{ color: "var(--text)" }}>
                {missedCount} {missedCount === 1 ? "task" : "tasks"} slipped past — mark done, skip, or carry forward.
              </div>
            </>
          ) : (
            <>
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--accent)" }}>
                All clear
              </div>
              <div className="text-sm font-bold" style={{ color: "var(--text)" }}>
                {tasksTotal === 0 ? "Nothing scheduled — plan your day?" : "Everything handled. Nice."}
              </div>
            </>
          )}
        </div>
        <Link href={runningSession ? "/timer" : "/today"}
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          aria-label="Open">
          <i className="fa-solid fa-arrow-right text-xs" style={{ color: "var(--text-2)" }}></i>
        </Link>
      </div>

      {/* ── Today at a glance ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 stagger">
        {/* Tasks today */}
        <Link href="/today" className="card p-5 stat-card flex items-center gap-4">
          <div className="flex-shrink-0"
            style={{
              width: 52, height: 52, borderRadius: "50%",
              background: `conic-gradient(var(--success) ${donePct * 3.6}deg, var(--success-bg) 0)`,
              display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
            }}>
            <div style={{ position: "absolute", width: 38, height: 38, borderRadius: "50%", background: "var(--surface)" }} />
            <span className="tabular" style={{ position: "relative", fontSize: 11.5, fontWeight: 800, color: "var(--success)" }}>
              {tasksTotal > 0 ? `${donePct}%` : "—"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold tabular" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>
              {tasksDone}<span className="text-sm font-medium" style={{ color: "var(--text-3)" }}> / {tasksTotal}</span>
            </div>
            <div className="text-xs font-medium mt-0.5" style={{ color: "var(--text-2)" }}>Tasks done today</div>
          </div>
        </Link>

        {/* Focus today */}
        <Link href="/timer" className="card p-5 stat-card flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--accent-bg)" }}>
            <i className="fa-solid fa-stopwatch" style={{ color: "var(--accent)", fontSize: 16 }}></i>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold tabular" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>
              {timerSessions.length > 0 ? fmtMin(focusElapsedMin) : "—"}
              {focusTargetMin > 0 && (
                <span className="text-sm font-medium" style={{ color: "var(--text-3)" }}> / {fmtMin(focusTargetMin)}</span>
              )}
            </div>
            <div className="text-xs font-medium mt-0.5" style={{ color: "var(--text-2)" }}>Focus time today</div>
          </div>
        </Link>

        {/* Streak */}
        <div className="card p-5 stat-card flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--warning-bg)" }}>
            <span className="text-xl">🔥</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold tabular" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>
              {streak}<span className="text-sm font-medium" style={{ color: "var(--text-3)" }}> {streak === 1 ? "day" : "days"}</span>
            </div>
            <div className="text-xs font-medium mt-0.5" style={{ color: "var(--text-2)" }}>
              Current streak{longestStreak > 0 && <span style={{ color: "var(--text-3)" }}> · best {longestStreak}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Today's agenda (interactive) ── */}
      <AgendaList
        nowHHMM={nowHHMM}
        tasks={todayTasks.map((t) => ({
          id: t.id,
          title: t.title,
          startTime: t.startTime,
          endTime: t.endTime,
          status: t.status,
          tagName: t.tag?.name ?? null,
          tagEmoji: t.tag?.emoji ?? null,
        }))}
      />
    </div>
  );
}
