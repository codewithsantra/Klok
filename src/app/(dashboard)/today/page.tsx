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
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const params = await searchParams;
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
  }));

  const templatesView = templates.map((t) => ({
    id: t.id, name: t.name, blockCount: t._count.blocks,
  }));

  // Carry-forward: unfinished tasks from previous day
  const prevDate = addDays(date, -1);
  const prevTasks = await prisma.task.findMany({
    where: { userId: user.id, date: prevDate, status: "PENDING" },
    include: { tag: true },
  });
  const alreadyCarried = new Set(
    tasks.map((t) => t.carriedFromId).filter(Boolean) as string[],
  );
  const existingKeys = new Set(
    tasks.map((t) => `${t.title}|${t.startTime}|${t.endTime}`),
  );
  const carriedTasks = prevTasks
    .filter((t) => !alreadyCarried.has(t.id) && !existingKeys.has(`${t.title}|${t.startTime}|${t.endTime}`))
    .map((t) => ({
      id: t.id,
      title: t.title,
      tagId: t.tagId,
      tagEmoji: t.tag?.emoji ?? null,
      startTime: t.startTime,
      endTime: t.endTime,
    }));

  const todayISO = toISODate(today);
  const currentDateISO = toISODate(date);
  const nowHHMM = currentDateISO === todayISO ? nowHHMMInZone(user.timeZone) : null;
  const isPastDate = currentDateISO < todayISO;

  return (
    <TodayClient
      tasks={tasksView}
      carried={carriedTasks}
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
