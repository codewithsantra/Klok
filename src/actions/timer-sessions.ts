"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseISODate } from "@/lib/dates";

export async function createTimerSessionAction(
  title: string,
  tagId: string | null,
  dateISO: string,
  targetMinutes: number,
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };
  const date = parseISODate(dateISO);
  if (!date || !title.trim() || targetMinutes <= 0)
    return { error: "Invalid input" };

  const session = await prisma.timerSession.create({
    data: { userId: user.id, title: title.trim(), tagId, date, targetMinutes },
  });
  revalidatePath("/timer");
  revalidatePath("/dashboard");
  return { id: session.id };
}

export async function deleteTimerSessionAction(sessionId: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.timerSession.deleteMany({ where: { id: sessionId, userId: user.id } });
  revalidatePath("/timer");
}

export async function addTimerSubItemAction(
  sessionId: string,
  title: string,
  targetMinutes: number,
  taskId: string | null,
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };
  if (!title.trim() || targetMinutes <= 0) return { error: "Invalid input" };

  const session = await prisma.timerSession.findFirst({
    where: { id: sessionId, userId: user.id },
    include: { subItems: { select: { targetMinutes: true } } },
  });
  if (!session) return { error: "Session not found" };

  const usedMinutes = session.subItems.reduce((s, i) => s + i.targetMinutes, 0);
  if (usedMinutes + targetMinutes > session.targetMinutes)
    return { error: `Exceeds session total. ${session.targetMinutes - usedMinutes} min remaining.` };

  await prisma.timerSubItem.create({
    data: { sessionId, title: title.trim(), targetMinutes, taskId },
  });
  revalidatePath("/timer");
  return { ok: true };
}

export async function deleteTimerSubItemAction(subItemId: string) {
  const user = await getCurrentUser();
  if (!user) return;
  const item = await prisma.timerSubItem.findFirst({
    where: { id: subItemId },
    include: { session: { select: { userId: true } } },
  });
  if (!item || item.session.userId !== user.id) return;
  await prisma.timerSubItem.delete({ where: { id: subItemId } });
  revalidatePath("/timer");
}

export async function updateTimerSessionAction(
  sessionId: string,
  title: string,
  tagId: string | null,
  targetMinutes: number,
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };
  if (!title.trim() || targetMinutes <= 0) return { error: "Invalid input" };

  await prisma.timerSession.updateMany({
    where: { id: sessionId, userId: user.id },
    data: { title: title.trim(), tagId, targetMinutes },
  });
  revalidatePath("/timer");
  return { ok: true };
}

export async function updateTimerSubItemAction(
  subItemId: string,
  title: string,
  targetMinutes: number,
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };
  const item = await prisma.timerSubItem.findFirst({
    where: { id: subItemId },
    include: { session: { select: { userId: true } } },
  });
  if (!item || item.session.userId !== user.id) return { error: "Not found" };

  await prisma.timerSubItem.update({
    where: { id: subItemId },
    data: { title: title.trim(), targetMinutes },
  });
  revalidatePath("/timer");
  return { ok: true };
}

export async function startSubItemTimerAction(subItemId: string) {
  const user = await getCurrentUser();
  if (!user) return;
  const item = await prisma.timerSubItem.findFirst({
    where: { id: subItemId },
    include: { session: { select: { userId: true, id: true } } },
  });
  if (!item || item.session.userId !== user.id || item.timerStartedAt) return;

  // Pause any other running sub-item timer in any session for this user
  const running = await prisma.timerSubItem.findMany({
    where: { timerStartedAt: { not: null }, session: { userId: user.id } },
    select: { id: true, timerStartedAt: true, timerAccumMs: true },
  });
  for (const r of running) {
    if (r.id === subItemId || !r.timerStartedAt) continue;
    const newAccum = r.timerAccumMs + (Date.now() - r.timerStartedAt.getTime());
    await prisma.timerSubItem.update({
      where: { id: r.id },
      data: { timerStartedAt: null, timerAccumMs: newAccum },
    });
  }

  await prisma.timerSubItem.update({
    where: { id: subItemId },
    data: { timerStartedAt: new Date() },
  });
  revalidatePath("/timer");
}

export async function pauseSubItemTimerAction(subItemId: string) {
  const user = await getCurrentUser();
  if (!user) return;
  const item = await prisma.timerSubItem.findFirst({
    where: { id: subItemId },
    include: { session: { select: { userId: true } } },
  });
  if (!item || item.session.userId !== user.id || !item.timerStartedAt) return;

  const newAccum = item.timerAccumMs + (Date.now() - item.timerStartedAt.getTime());
  await prisma.timerSubItem.update({
    where: { id: subItemId },
    data: { timerStartedAt: null, timerAccumMs: newAccum },
  });
  revalidatePath("/timer");
}
