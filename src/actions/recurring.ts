"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { todayUTC, todayInZone } from "@/lib/dates";
import { resolveDays, type RecurrenceKind } from "@/lib/recurrence";

export type RuleInput = {
  name: string;
  emoji: string;
  tagId: string | null;
  startTime: string;
  endTime: string;
  recurrence: RecurrenceKind;
  daysOfWeek: number[];
  todos: string[];
};

function validate(input: RuleInput): string | null {
  if (!input.name.trim()) return "Name is required";
  if (!/^\d{2}:\d{2}$/.test(input.startTime) || !/^\d{2}:\d{2}$/.test(input.endTime))
    return "Invalid time";
  if (input.endTime <= input.startTime) return "End time must be after start time";
  return null;
}

export async function createRecurringRuleAction(input: RuleInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };
  if (validate(input)) return { error: validate(input)! };

  // Verify tag ownership if provided.
  if (input.tagId) {
    const tag = await prisma.tag.findFirst({
      where: { id: input.tagId, userId: user.id },
      select: { id: true },
    });
    if (!tag) return { error: "Tag not found" };
  }

  await prisma.recurringRule.create({
    data: {
      userId: user.id,
      name: input.name.trim(),
      emoji: input.emoji || "🔁",
      tagId: input.tagId,
      startTime: input.startTime,
      endTime: input.endTime,
      recurrence: input.recurrence,
      daysOfWeek: resolveDays(input.recurrence, input.daysOfWeek),
      startDate: todayInZone(user.timeZone),
      todosTemplate: input.todos.map((t) => t.trim()).filter(Boolean),
    },
  });

  revalidatePath("/recurring-blocks");
  return { ok: true };
}

export async function updateRecurringRuleAction(id: string, input: RuleInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };
  if (validate(input)) return { error: validate(input)! };

  const rule = await prisma.recurringRule.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!rule) return { error: "Rule not found" };

  if (input.tagId) {
    const tag = await prisma.tag.findFirst({
      where: { id: input.tagId, userId: user.id },
      select: { id: true },
    });
    if (!tag) return { error: "Tag not found" };
  }

  await prisma.recurringRule.update({
    where: { id: rule.id },
    data: {
      name: input.name.trim(),
      emoji: input.emoji || "🔁",
      tagId: input.tagId,
      startTime: input.startTime,
      endTime: input.endTime,
      recurrence: input.recurrence,
      daysOfWeek: resolveDays(input.recurrence, input.daysOfWeek),
      todosTemplate: input.todos.map((t) => t.trim()).filter(Boolean),
    },
  });

  revalidatePath("/recurring-blocks");
  return { ok: true };
}

export async function toggleRecurringRuleAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const rule = await prisma.recurringRule.findFirst({
    where: { id, userId: user.id },
    select: { id: true, active: true },
  });
  if (!rule) return;

  await prisma.recurringRule.update({
    where: { id: rule.id },
    data: { active: !rule.active },
  });
  revalidatePath("/recurring-blocks");
}

export async function deleteRecurringRuleAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return;

  await prisma.recurringRule.deleteMany({
    where: { id, userId: user.id },
  });
  revalidatePath("/recurring-blocks");
}

/**
 * Stop a recurring series at its source, given any one of its blocks.
 * - Removes future auto-generated blocks (date > today) so the series
 *   stops appearing going forward.
 * - Keeps today's and past blocks as historical record (the rule's
 *   onDelete: SetNull un-links them from the deleted rule).
 * - Deletes the underlying RecurringRule so nothing materializes again.
 */
export async function stopRecurringSeriesAction(blockId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const block = await prisma.block.findFirst({
    where: { id: blockId, userId: user.id },
    select: { recurringRuleId: true },
  });
  if (!block?.recurringRuleId) return;

  const ruleId = block.recurringRuleId;
  const today = todayInZone(user.timeZone);

  await prisma.block.deleteMany({
    where: { userId: user.id, recurringRuleId: ruleId, date: { gt: today } },
  });
  await prisma.recurringRule.deleteMany({
    where: { id: ruleId, userId: user.id },
  });

  revalidatePath("/today");
  revalidatePath("/dashboard");
}

/**
 * Materialize active recurring rules into real Blocks for `date`.
 * Idempotent: skips a rule if a block with the same start time + title
 * already exists that day. Only runs for today or future dates.
 */
export async function materializeRecurringRules(
  userId: string,
  date: Date,
  today: Date = todayUTC(),
) {
  if (date < today) return; // never backfill the past

  const weekday = date.getUTCDay();

  const rules = await prisma.recurringRule.findMany({
    where: {
      userId,
      active: true,
      startDate: { lte: date },
      OR: [{ endDate: null }, { endDate: { gte: date } }],
    },
  });

  const applicable = rules.filter((r) => r.daysOfWeek.includes(weekday));
  if (applicable.length === 0) return;

  const existing = await prisma.block.findMany({
    where: { userId, date },
    select: { startTime: true, title: true, recurringRuleId: true },
  });
  const seen = new Set(existing.map((b) => `${b.startTime}|${b.title}`));
  const seenRuleIds = new Set(existing.map((b) => b.recurringRuleId).filter(Boolean));

  for (const rule of applicable) {
    // Skip if this rule already produced a block today, or a manually-created
    // block with the same start time + title already exists.
    if (seenRuleIds.has(rule.id)) continue;
    if (seen.has(`${rule.startTime}|${rule.name}`)) continue;
    const todos = Array.isArray(rule.todosTemplate)
      ? (rule.todosTemplate as unknown[]).map((t) => String(t)).filter(Boolean)
      : [];
    await prisma.block.create({
      data: {
        userId,
        tagId: rule.tagId,
        title: rule.name,
        date,
        startTime: rule.startTime,
        endTime: rule.endTime,
        recurrence: rule.recurrence,
        recurringRuleId: rule.id,
        todos: { create: todos.map((text) => ({ text })) },
      },
    });
  }
}
