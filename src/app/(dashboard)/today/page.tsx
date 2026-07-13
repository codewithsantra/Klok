import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  parseISODate, todayInZone, nowHHMMInZone, toISODate,
  addDays, formatPrettyDateWithLabel,
} from "@/lib/dates";
import { materializeRecurringTasks } from "@/lib/task-recurrence";
import TodayClient from "./TodayClient";

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; new?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const params = await searchParams;
  const openNew = params.new === "1";
  const today = todayInZone(user.timeZone);
  const date = (params.date && parseISODate(params.date)) || today;

  // Materialize recurring tasks for the viewed date
  await materializeRecurringTasks(user.id, date);

  const [tasks, tags, templates] = await Promise.all([
    prisma.task.findMany({
      where: { userId: user.id, date },
      include: { tag: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.tag.findMany({
      where: { userId: user.id, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.template.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, _count: { select: { blocks: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Which of this day's tasks already have a carried copy elsewhere?
  const carriedCopies = tasks.length
    ? await prisma.task.findMany({
        where: { userId: user.id, carriedFromId: { in: tasks.map((t) => t.id) } },
        select: { carriedFromId: true },
      })
    : [];
  const carriedIds = new Set(carriedCopies.map((c) => c.carriedFromId));

  const tasksView = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    startTime: t.startTime,
    endTime: t.endTime,
    status: t.status,
    note: t.note,
    tagId: t.tagId,
    tag: t.tag ? { id: t.tag.id, name: t.tag.name, emoji: t.tag.emoji } : null,
    recurrence: t.recurrence,
    recurringRuleId: t.recurringRuleId,
    carriedFromId: t.carriedFromId,
    alreadyCarried: carriedIds.has(t.id),
  }));

  const templatesView = templates.map((t) => ({
    id: t.id, name: t.name, blockCount: t._count.blocks,
  }));

  const todayISO = toISODate(today);
  const currentDateISO = toISODate(date);
  const nowHHMM = currentDateISO === todayISO ? nowHHMMInZone(user.timeZone) : null;
  const isPastDate = currentDateISO < todayISO;

  return (
    <TodayClient
      tasks={tasksView}
      todayISO={todayISO}
      tags={tags}
      templates={templatesView}
      currentDateISO={currentDateISO}
      currentDateLabel={formatPrettyDateWithLabel(date, today)}
      prevDateISO={toISODate(addDays(date, -1))}
      nextDateISO={toISODate(addDays(date, 1))}
      nowHHMM={nowHHMM}
      isPastDate={isPastDate}
    />
  );
}
