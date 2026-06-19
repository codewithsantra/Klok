// Rendering: SSR (per-user data behind auth).

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { todayInZone, addDays } from "@/lib/dates";
import RecurringClient, { type RuleData } from "./RecurringClient";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Find the next date (within ~2 weeks) the rule fires and label it.
function nextRunLabel(
  active: boolean,
  daysOfWeek: number[],
  startTime: string,
  today: Date,
): string {
  if (!active) return "Paused";
  if (daysOfWeek.length === 0) return "—";
  for (let i = 0; i < 14; i++) {
    const d = addDays(today, i);
    if (daysOfWeek.includes(d.getUTCDay())) {
      const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : DAY_LABELS[d.getUTCDay()];
      return `${label}, ${startTime}`;
    }
  }
  return "—";
}

export default async function RecurringBlocksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const [rules, tags] = await Promise.all([
    prisma.recurringRule.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tag.findMany({
      where: { userId: user.id, active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const tagMap = new Map(tags.map((t) => [t.id, t]));
  const today = todayInZone(user.timeZone);

  const initialRules: RuleData[] = rules.map((r) => {
    const todos = Array.isArray(r.todosTemplate)
      ? (r.todosTemplate as unknown[]).map((t) => String(t))
      : [];
    const tag = r.tagId ? tagMap.get(r.tagId) : undefined;
    return {
      id: r.id,
      name: r.name,
      emoji: r.emoji,
      tagId: r.tagId,
      tagName: tag?.name ?? "No tag",
      startTime: r.startTime,
      endTime: r.endTime,
      recurrence: r.recurrence as RuleData["recurrence"],
      daysOfWeek: r.daysOfWeek,
      active: r.active,
      todos,
      todosCount: todos.length,
      nextRun: nextRunLabel(r.active, r.daysOfWeek, r.startTime, today),
    };
  });

  return (
    <RecurringClient
      initialRules={initialRules}
      tags={tags.map((t) => ({ id: t.id, name: t.name, emoji: t.emoji }))}
    />
  );
}
