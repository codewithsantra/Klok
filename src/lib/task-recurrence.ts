import { prisma } from "./db";
import { toISODate } from "./dates";

/**
 * Materialize recurring tasks for a given user+date.
 * Finds all recurring tasks (recurrence != NONE) created on or before `date`,
 * checks if they should fire on `date`, and creates instances if none exist.
 * Idempotent — skips if an instance for that date+recurringRuleId already exists.
 */
export async function materializeRecurringTasks(userId: string, date: Date) {
  const weekday = date.getUTCDay();
  const dateStr = toISODate(date);

  const templates = await prisma.task.findMany({
    where: {
      userId,
      recurrence: { not: "NONE" },
      date: { lt: date },
      recurringRuleId: null,
    },
    select: {
      id: true,
      title: true,
      tagId: true,
      startTime: true,
      endTime: true,
      recurrence: true,
      daysOfWeek: true,
      repeatEvery: true,
      repeatUnit: true,
      repeatEndDate: true,
      repeatEndCount: true,
      date: true,
    },
  });

  if (templates.length === 0) return;

  const existing = await prisma.task.findMany({
    where: { userId, date, recurringRuleId: { not: null } },
    select: { recurringRuleId: true },
  });
  const existingRuleIds = new Set(existing.map((t) => t.recurringRuleId));

  for (const tpl of templates) {
    if (existingRuleIds.has(tpl.id)) continue;
    if (!shouldFireOn(tpl, date, dateStr)) continue;

    if (tpl.repeatEndDate && date > tpl.repeatEndDate) continue;

    if (tpl.repeatEndCount) {
      const instanceCount = await prisma.task.count({
        where: { userId, recurringRuleId: tpl.id },
      });
      if (instanceCount >= tpl.repeatEndCount) continue;
    }

    await prisma.task.create({
      data: {
        userId,
        title: tpl.title,
        tagId: tpl.tagId,
        date,
        startTime: tpl.startTime,
        endTime: tpl.endTime,
        recurrence: "NONE",
        recurringRuleId: tpl.id,
      },
    });
  }
}

function shouldFireOn(
  tpl: {
    recurrence: string;
    daysOfWeek: number[];
    repeatEvery: number;
    repeatUnit: string | null;
    date: Date;
  },
  targetDate: Date,
  _targetDateStr: string,
): boolean {
  const { recurrence, daysOfWeek, repeatEvery, repeatUnit, date: startDate } = tpl;

  if (recurrence === "DAILY") {
    if (repeatUnit === "day" && repeatEvery > 1) {
      const diffDays = Math.round(
        (targetDate.getTime() - startDate.getTime()) / 86_400_000,
      );
      return diffDays > 0 && diffDays % repeatEvery === 0;
    }
    return true;
  }

  if (recurrence === "WEEKDAYS") {
    const wd = targetDate.getUTCDay();
    return wd >= 1 && wd <= 5;
  }

  if (recurrence === "WEEKLY") {
    return daysOfWeek.includes(targetDate.getUTCDay());
  }

  if (recurrence === "CUSTOM") {
    const unit = repeatUnit ?? "week";
    const every = repeatEvery;

    if (unit === "day") {
      const diffDays = Math.round(
        (targetDate.getTime() - startDate.getTime()) / 86_400_000,
      );
      return diffDays > 0 && diffDays % every === 0;
    }

    if (unit === "week") {
      if (!daysOfWeek.includes(targetDate.getUTCDay())) return false;
      const diffWeeks = Math.round(
        (targetDate.getTime() - startDate.getTime()) / (7 * 86_400_000),
      );
      return diffWeeks > 0 && diffWeeks % every === 0;
    }

    if (unit === "month") {
      const sameDay = targetDate.getUTCDate() === startDate.getUTCDate();
      if (!sameDay) return false;
      const monthsDiff =
        (targetDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
        (targetDate.getUTCMonth() - startDate.getUTCMonth());
      return monthsDiff > 0 && monthsDiff % every === 0;
    }

    if (unit === "year") {
      const sameMonthDay =
        targetDate.getUTCMonth() === startDate.getUTCMonth() &&
        targetDate.getUTCDate() === startDate.getUTCDate();
      if (!sameMonthDay) return false;
      const yearsDiff = targetDate.getUTCFullYear() - startDate.getUTCFullYear();
      return yearsDiff > 0 && yearsDiff % every === 0;
    }
  }

  return false;
}
