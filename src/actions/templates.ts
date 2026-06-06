"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseISODate, todayUTC, toISODate } from "@/lib/dates";

export type SaveTemplateState = {
  error?: string;
  success?: boolean;
};

/**
 * Save today's blocks (and their todos) as a reusable template.
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

  // Fetch today's blocks with their todos and tag
  const today = todayUTC();
  const blocks = await prisma.block.findMany({
    where: { userId: user.id, date: today },
    include: { todos: { orderBy: { createdAt: "asc" } } },
    orderBy: { startTime: "asc" },
  });

  if (blocks.length === 0) {
    return { error: "You have no blocks today to save." };
  }

  // Nested create: Template + TemplateBlocks + TemplateTodos in one atomic write
  await prisma.template.create({
    data: {
      userId: user.id,
      name,
      blocks: {
        create: blocks.map((b) => ({
          tagId: b.tagId,
          title: b.title,
          startTime: b.startTime,
          endTime: b.endTime,
          todos: {
            create: b.todos.map((t) => ({ text: t.text })),
          },
        })),
      },
    },
  });

  revalidatePath("/templates");
  return { success: true };
}

/**
 * Apply a template to a target date — creates real Blocks + Todos for that date.
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

  // Verify ownership and fetch with all nested data
  const template = await prisma.template.findFirst({
    where: { id: templateId, userId: user.id },
    include: {
      blocks: {
        include: { todos: true },
        orderBy: { startTime: "asc" },
      },
    },
  });
  if (!template || template.blocks.length === 0) return;

  // Create blocks one by one (each creates its own todos via nested write)
  // Using a transaction so partial failures rollback cleanly.
  await prisma.$transaction(
    template.blocks.map((tb) =>
      prisma.block.create({
        data: {
          userId: user.id,
          tagId: tb.tagId,
          date: targetDate,
          title: tb.title,
          startTime: tb.startTime,
          endTime: tb.endTime,
          todos: {
            create: tb.todos.map((tt) => ({ text: tt.text })),
          },
        },
      }),
    ),
  );

  // Show the user the result by jumping to that day
  redirect(`/today?date=${toISODate(targetDate)}`);
}

/**
 * Delete a template (cascades to its blocks and todos).
 */
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
