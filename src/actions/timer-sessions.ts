"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseISODate } from "@/lib/dates";
import { creditedRunMs } from "@/lib/timer-credit";

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

/**
 * Manually correct how much time is logged against a sub-item.
 *
 * The timer is best-effort — you forget to start it, forget to stop it, or work
 * away from the app. This is the escape hatch that keeps the log honest without
 * needing a developer to touch the database.
 */
export async function setSubItemLoggedTimeAction(subItemId: string, minutes: number) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };
  if (!Number.isFinite(minutes) || minutes < 0) return { error: "Invalid time" };
  // 24h per sub-item is already absurd; refuse rather than store nonsense.
  if (minutes > 24 * 60) return { error: "That's over 24 hours — check the value." };

  const item = await prisma.timerSubItem.findFirst({
    where: { id: subItemId },
    include: { session: { select: { userId: true } } },
  });
  if (!item || item.session.userId !== user.id) return { error: "Not found" };

  // Setting an explicit time also ends any run in progress, otherwise the live
  // timer would immediately add to the number the user just corrected.
  await prisma.timerSubItem.update({
    where: { id: subItemId },
    data: { timerAccumMs: Math.round(minutes * 60_000), timerStartedAt: null },
  });
  revalidatePath("/timer");
  revalidatePath("/dashboard");
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
  // A sub-item runs only for its allocated time. Once it's met its target
  // there's nothing left to run, so refuse to (re)start it.
  if (item.timerAccumMs >= item.targetMinutes * 60_000) return;

  // Pause any other running sub-item timer in any session for this user.
  // These are often forgotten runs (possibly days old), so the same credit cap
  // applies here as on an explicit pause.
  const running = await prisma.timerSubItem.findMany({
    where: { timerStartedAt: { not: null }, session: { userId: user.id } },
    select: { id: true, timerStartedAt: true, timerAccumMs: true, targetMinutes: true },
  });
  for (const r of running) {
    if (r.id === subItemId || !r.timerStartedAt) continue;
    const runMs = Date.now() - r.timerStartedAt.getTime();
    const newAccum = r.timerAccumMs + creditedRunMs(runMs, r.timerAccumMs, r.targetMinutes * 60_000);
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

  const runMs = Date.now() - item.timerStartedAt.getTime();
  const newAccum =
    item.timerAccumMs + creditedRunMs(runMs, item.timerAccumMs, item.targetMinutes * 60_000);
  await prisma.timerSubItem.update({
    where: { id: subItemId },
    data: { timerStartedAt: null, timerAccumMs: newAccum },
  });
  revalidatePath("/timer");
  revalidatePath("/dashboard");
}
