import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { todayInZone } from "@/lib/dates";
import TimerClient from "./TimerClient";

export default async function TimerPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const openCreateOnLoad = (await searchParams).new === "1";

  const today = todayInZone(user.timeZone);

  const [sessions, tasks, tags] = await Promise.all([
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
  ]);

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
    />
  );
}
