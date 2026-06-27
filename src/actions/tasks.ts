"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function toggleTaskAction(taskId: string) {
  const user = await getCurrentUser();
  if (!user) return;
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId: user.id },
    select: { id: true, status: true },
  });
  if (!task) return;
  await prisma.task.update({
    where: { id: task.id },
    data: { status: task.status === "DONE" ? "PENDING" : "DONE" },
  });
  revalidatePath("/today");
}

export async function setTaskStatusAction(taskId: string, status: "PENDING" | "DONE" | "SKIPPED") {
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.task.updateMany({
    where: { id: taskId, userId: user.id },
    data: { status },
  });
  revalidatePath("/today");
}

export async function updateTaskNoteAction(taskId: string, note: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.task.updateMany({
    where: { id: taskId, userId: user.id },
    data: { note: note.trim() || null },
  });
  revalidatePath("/today");
}
