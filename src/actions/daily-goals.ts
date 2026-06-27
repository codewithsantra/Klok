"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseISODate } from "@/lib/dates";

export async function upsertDailyGoalAction(
  tagId: string,
  dateISO: string,
  targetMinutes: number,
) {
  const user = await getCurrentUser();
  if (!user) return;
  const date = parseISODate(dateISO);
  if (!date || targetMinutes <= 0) return;

  await prisma.dailyGoal.upsert({
    where: { userId_tagId_date: { userId: user.id, tagId, date } },
    create: { userId: user.id, tagId, date, targetMinutes },
    update: { targetMinutes },
  });
  revalidatePath("/today");
}

export async function deleteDailyGoalAction(goalId: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.dailyGoal.deleteMany({
    where: { id: goalId, userId: user.id },
  });
  revalidatePath("/today");
}
