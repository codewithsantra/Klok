"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Block-level tracking — the same timer/log model as todos, but for a whole
// block (used when a block has no todos but you still want to time it).

// Turn on / off block-level tracking.
export async function setBlockMetricAction(
  blockId: string,
  metricType: "TIME" | "DISTANCE" | "COUNT" | "CUSTOM",
  metricTarget: number | null,
  metricUnit: string | null,
) {
  const user = await getCurrentUser();
  if (!user) return;
  const block = await prisma.block.findFirst({
    where: { id: blockId, userId: user.id },
    select: { id: true },
  });
  if (!block) return;
  await prisma.block.update({
    where: { id: block.id },
    data: { metricType, metricTarget, metricUnit },
  });
  revalidatePath("/today");
}

export async function clearBlockMetricAction(blockId: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.block.updateMany({
    where: { id: blockId, userId: user.id },
    data: {
      metricType: null,
      metricTarget: null,
      metricUnit: null,
      metricActual: 0,
      timerStartedAt: null,
      timerAccumMs: 0,
    },
  });
  revalidatePath("/today");
}

export async function startBlockTimerAction(blockId: string) {
  const user = await getCurrentUser();
  if (!user) return;
  const block = await prisma.block.findFirst({
    where: { id: blockId, userId: user.id },
    select: { id: true, timerStartedAt: true },
  });
  if (!block || block.timerStartedAt) return;
  await prisma.block.update({ where: { id: block.id }, data: { timerStartedAt: new Date() } });
  revalidatePath("/today");
}

export async function pauseBlockTimerAction(blockId: string) {
  const user = await getCurrentUser();
  if (!user) return;
  const block = await prisma.block.findFirst({
    where: { id: blockId, userId: user.id },
    select: { id: true, timerStartedAt: true, timerAccumMs: true, metricType: true },
  });
  if (!block || !block.timerStartedAt) return;
  const newAccum = block.timerAccumMs + (Date.now() - block.timerStartedAt.getTime());
  await prisma.block.update({
    where: { id: block.id },
    data: {
      timerStartedAt: null,
      timerAccumMs: newAccum,
      ...(block.metricType === "TIME" ? { metricActual: newAccum / 3_600_000 } : {}),
    },
  });
  revalidatePath("/today");
}

export async function logBlockProgressAction(blockId: string, amount: number) {
  const user = await getCurrentUser();
  if (!user) return;
  if (!Number.isFinite(amount) || amount <= 0) return;
  const block = await prisma.block.findFirst({
    where: { id: blockId, userId: user.id },
    select: { id: true, metricActual: true },
  });
  if (!block) return;
  await prisma.block.update({
    where: { id: block.id },
    data: { metricActual: block.metricActual + amount },
  });
  revalidatePath("/today");
}
