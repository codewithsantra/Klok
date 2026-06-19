"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseISODate } from "@/lib/dates";

/**
 * Clone an unfinished todo from a previous day into one of today's blocks.
 * Copies the text + metric goal but resets progress, timer and status.
 * Links the clone back to the source via `carriedFromId` so the source
 * stops appearing in the carry-forward banner.
 */
export async function carryForwardTodoAction(
  sourceTodoId: string,
  targetBlockId: string,
) {
  const user = await getCurrentUser();
  if (!user) return;

  // Verify both source todo and target block belong to the user.
  const [source, target] = await Promise.all([
    prisma.todo.findFirst({
      where: { id: sourceTodoId, block: { userId: user.id } },
      select: {
        text: true,
        metricType: true,
        metricUnit: true,
        metricTarget: true,
      },
    }),
    prisma.block.findFirst({
      where: { id: targetBlockId, userId: user.id },
      select: { id: true },
    }),
  ]);
  if (!source || !target) return;

  await prisma.todo.create({
    data: {
      blockId: target.id,
      text: source.text,
      metricType: source.metricType,
      metricUnit: source.metricUnit,
      metricTarget: source.metricTarget,
      carriedFromId: sourceTodoId,
    },
  });

  revalidatePath("/today");
}

/**
 * Carry a todo forward by creating a new "Carried Tasks" block on the target date.
 * Used when no blocks exist yet for today.
 */
export async function carryForwardWithNewBlockAction(
  sourceTodoId: string,
  dateISO: string,
) {
  const user = await getCurrentUser();
  if (!user) return;

  const date = parseISODate(dateISO);
  if (!date) return;

  const source = await prisma.todo.findFirst({
    where: { id: sourceTodoId, block: { userId: user.id } },
    select: {
      text: true,
      metricType: true,
      metricUnit: true,
      metricTarget: true,
    },
  });
  if (!source) return;

  const block = await prisma.block.create({
    data: {
      userId: user.id,
      title: "Carried Tasks",
      date,
      startTime: "09:00",
      endTime: "10:00",
      todos: {
        create: [{
          text: source.text,
          metricType: source.metricType,
          metricUnit: source.metricUnit,
          metricTarget: source.metricTarget,
          carriedFromId: sourceTodoId,
        }],
      },
    },
  });

  revalidatePath("/today");
  return { blockId: block.id };
}
