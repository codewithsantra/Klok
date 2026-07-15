"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseISODate, todayInZone, toISODate } from "@/lib/dates";

export type SaveTemplateState = {
  error?: string;
  success?: boolean;
};

/**
 * Save today's tasks as a reusable template (title, tag, and time range of
 * each — statuses and notes are not carried, since a template is a plan shape).
 */
export async function saveTodayAsTemplateAction(
  _prev: SaveTemplateState | undefined,
  formData: FormData,
): Promise<SaveTemplateState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Template name is required." };
  if (name.length > 80) return { error: "Name too long." };

  const today = todayInZone(user.timeZone);
  const tasks = await prisma.task.findMany({
    where: { userId: user.id, date: today },
    orderBy: { startTime: "asc" },
    select: { title: true, tagId: true, startTime: true, endTime: true },
  });

  if (tasks.length === 0) {
    return { error: "You have no tasks today to save." };
  }

  await prisma.template.create({
    data: {
      userId: user.id,
      name,
      items: {
        create: tasks.map((t) => ({
          tagId: t.tagId,
          title: t.title,
          startTime: t.startTime,
          endTime: t.endTime,
        })),
      },
    },
  });

  revalidatePath("/templates");
  return { success: true };
}

/**
 * Apply a template to a target date — creates real Tasks for that date.
 * Redirects to /today?date=<targetDate> on success.
 */
export async function applyTemplateAction(
  templateId: string,
  formData: FormData,
) {
  const user = await getCurrentUser();
  if (!user) return;

  const dateStr = String(formData.get("date") ?? "");
  const targetDate = parseISODate(dateStr);
  if (!targetDate) return;

  const template = await prisma.template.findFirst({
    where: { id: templateId, userId: user.id },
    include: { items: { orderBy: { startTime: "asc" } } },
  });
  if (!template || template.items.length === 0) return;

  await prisma.task.createMany({
    data: template.items.map((it) => ({
      userId: user.id,
      tagId: it.tagId,
      date: targetDate,
      title: it.title,
      startTime: it.startTime,
      endTime: it.endTime,
    })),
  });

  redirect(`/today?date=${toISODate(targetDate)}`);
}

/** Delete a template (cascades to its items). */
export async function deleteTemplateAction(templateId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const tpl = await prisma.template.findFirst({
    where: { id: templateId, userId: user.id },
    select: { id: true },
  });
  if (!tpl) return;

  await prisma.template.delete({ where: { id: tpl.id } });
  revalidatePath("/templates");
}
