import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { todayInZone, addDays, toISODate } from "@/lib/dates";
import { closeOrphanedTimerRuns } from "@/lib/timer-reconcile";
import TimerClient from "./TimerClient";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type SessionDetail = {
  id: string; title: string; emoji: string | null; totalMin: number;
  items: { title: string; min: number }[];
};

export default async function TimerPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const openCreateOnLoad = (await searchParams).new === "1";

  const today = todayInZone(user.timeZone);
  const weekAgo = addDays(today, -7);

  // A run left open on a previous day is unreachable from this page (it only
  // renders today's sessions), so close it out before reading anything.
  const autoStopped = await closeOrphanedTimerRuns(user.id, today);

  const [sessions, tasks, tags, pastSessions] = await Promise.all([
    prisma.timerSession.findMany({
      where: { userId: user.id, date: today },
      include: {
        tag: { select: { id: true, name: true, emoji: true } },
        subItems: {
          include: { task: { select: { id: true, title: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.task.findMany({
      where: { userId: user.id, date: today },
      include: { tag: { select: { id: true, name: true, emoji: true } } },
      orderBy: { startTime: "asc" },
    }),
    prisma.tag.findMany({
      where: { userId: user.id, active: true },
      orderBy: { name: "asc" },
    }),
    // Last 7 days (excluding today) for the "recent history" section — with
    // enough detail to show what was actually worked on each day.
    prisma.timerSession.findMany({
      where: { userId: user.id, date: { gte: weekAgo, lt: today } },
      select: {
        id: true,
        title: true,
        date: true,
        tag: { select: { emoji: true } },
        subItems: { select: { title: true, timerAccumMs: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Aggregate elapsed time per day, then fill in the full 7-day range so
  // days with zero focus time still show up (as "0m", not silently missing).
  const elapsedByDate = new Map<string, number>();
  for (const s of pastSessions) {
    const key = toISODate(s.date);
    const ms = s.subItems.reduce((sum, i) => sum + i.timerAccumMs, 0);
    elapsedByDate.set(key, (elapsedByDate.get(key) ?? 0) + ms);
  }
  const history = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, -7 + i);
    const iso = toISODate(d);
    return {
      date: iso,
      label: DAY_SHORT[d.getUTCDay()],
      totalMin: Math.round((elapsedByDate.get(iso) ?? 0) / 60000),
    };
  });

  // Per-day session breakdown (most recent first), only for days with logged
  // focus time — this answers "what did I spend time on yesterday?".
  const yesterdayISO = toISODate(addDays(today, -1));
  const detailByDate = new Map<string, { iso: string; label: string; sessions: SessionDetail[] }>();
  for (const s of pastSessions) {
    const iso = toISODate(s.date);
    const sessionMs = s.subItems.reduce((sum, i) => sum + i.timerAccumMs, 0);
    if (sessionMs === 0) continue;
    const detail: SessionDetail = {
      id: s.id,
      title: s.title,
      emoji: s.tag?.emoji ?? null,
      totalMin: Math.round(sessionMs / 60000),
      items: s.subItems
        .filter((i) => i.timerAccumMs > 0)
        .map((i) => ({ title: i.title, min: Math.round(i.timerAccumMs / 60000) })),
    };
    const d = new Date(iso + "T00:00:00Z");
    const label = iso === yesterdayISO
      ? "Yesterday"
      : `${DAY_SHORT[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTH_SHORT[d.getUTCMonth()]}`;
    if (!detailByDate.has(iso)) detailByDate.set(iso, { iso, label, sessions: [] });
    detailByDate.get(iso)!.sessions.push(detail);
  }
  const recentDays = Array.from(detailByDate.values()).sort((a, b) => b.iso.localeCompare(a.iso));

  const sessionsView = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    tagId: s.tagId,
    tagName: s.tag?.name ?? null,
    tagEmoji: s.tag?.emoji ?? null,
    targetMinutes: s.targetMinutes,
    subItems: s.subItems.map((i) => ({
      id: i.id,
      title: i.title,
      targetMinutes: i.targetMinutes,
      timerStartedAt: i.timerStartedAt ? i.timerStartedAt.toISOString() : null,
      timerAccumMs: i.timerAccumMs,
      taskId: i.taskId,
      taskTitle: i.task?.title ?? null,
    })),
  }));

  const tasksView = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    tagEmoji: t.tag?.emoji ?? null,
    startTime: t.startTime,
    endTime: t.endTime,
  }));

  return (
    <TimerClient
      sessions={sessionsView}
      tasks={tasksView}
      tags={tags}
      openCreateOnLoad={openCreateOnLoad}
      history={history}
      recentDays={recentDays}
      autoStopped={autoStopped}
    />
  );
}
