"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { todayInZone } from "@/lib/dates";

/**
 * Internal helper: recompute and update a block's status based on its todos.
 * - 0 todos        → leave status alone
 * - all DONE       → DONE
 * - some DONE      → PARTIAL
 * - none DONE      → PLANNED
 */
async function recomputeBlockStatus(blockId: string) {
  const block = await prisma.block.findUnique({
    where: { id: blockId },
    select: {
      todos: { select: { status: true } },
    },
  });
  if (!block || block.todos.length === 0) return;

  const total = block.todos.length;
  const done = block.todos.filter((t) => t.status === "DONE").length;

  let newStatus: "PLANNED" | "PARTIAL" | "DONE";
  if (done === total) newStatus = "DONE";
  else if (done > 0) newStatus = "PARTIAL";
  else newStatus = "PLANNED";

  await prisma.block.update({
    where: { id: blockId },
    data: { status: newStatus },
  });
}

/**
 * Toggle a todo's status between PENDING and DONE.
 */
export async function toggleTodoAction(todoId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  // Ownership check via the block relation
  const todo = await prisma.todo.findFirst({
    where: { id: todoId, block: { userId: user.id } },
    select: { id: true, status: true, blockId: true },
  });
  if (!todo) return;

  const newStatus = todo.status === "DONE" ? "PENDING" : "DONE";

  await prisma.todo.update({
    where: { id: todo.id },
    data: { status: newStatus },
  });

  await recomputeBlockStatus(todo.blockId);
  revalidatePath("/today");
}

/**
 * Set a todo's status directly (PENDING | DONE | INCOMPLETE | SKIPPED).
 */
export async function setTodoStatusAction(
  todoId: string,
  status: "PENDING" | "DONE" | "INCOMPLETE" | "SKIPPED",
) {
  const user = await getCurrentUser();
  if (!user) return;

  const todo = await prisma.todo.findFirst({
    where: { id: todoId, block: { userId: user.id } },
    select: { id: true, blockId: true },
  });
  if (!todo) return;

  await prisma.todo.update({
    where: { id: todo.id },
    data: { status },
  });

  await recomputeBlockStatus(todo.blockId);
  revalidatePath("/today");
}

/**
 * Update a todo's free-text comment/note. Empty string clears it.
 */
export async function updateTodoCommentAction(todoId: string, comment: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const trimmed = comment.trim().slice(0, 500);
  const todo = await prisma.todo.findFirst({
    where: { id: todoId, block: { userId: user.id } },
    select: { id: true },
  });
  if (!todo) return;

  await prisma.todo.update({
    where: { id: todo.id },
    data: { comment: trimmed || null },
  });
  revalidatePath("/today");
}

/**
 * Rename a todo.
 */
export async function updateTodoTextAction(todoId: string, text: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 300) return;

  const todo = await prisma.todo.findFirst({
    where: { id: todoId, block: { userId: user.id } },
    select: { id: true },
  });
  if (!todo) return;

  await prisma.todo.update({
    where: { id: todo.id },
    data: { text: trimmed },
  });
  revalidatePath("/today");
}

/**
 * Start (or resume) the timer on a trackable TIME todo.
 * Server-truth: stores the wall-clock start so elapsed survives a tab close.
 */
export async function startTimerAction(todoId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const todo = await prisma.todo.findFirst({
    where: { id: todoId, block: { userId: user.id } },
    select: { id: true, timerStartedAt: true },
  });
  if (!todo || todo.timerStartedAt) return; // already running

  await prisma.todo.update({
    where: { id: todo.id },
    data: { timerStartedAt: new Date() },
  });
  revalidatePath("/today");
}

/**
 * Pause the timer: fold the running interval into accumulated ms and,
 * for TIME metrics, reflect total time into metricActual (hours).
 */
export async function pauseTimerAction(todoId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const todo = await prisma.todo.findFirst({
    where: { id: todoId, block: { userId: user.id } },
    select: {
      id: true,
      timerStartedAt: true,
      timerAccumMs: true,
      metricType: true,
    },
  });
  if (!todo || !todo.timerStartedAt) return; // not running

  const newAccum =
    todo.timerAccumMs + (Date.now() - todo.timerStartedAt.getTime());

  await prisma.todo.update({
    where: { id: todo.id },
    data: {
      timerStartedAt: null,
      timerAccumMs: newAccum,
      ...(todo.metricType === "TIME"
        ? { metricActual: newAccum / 3_600_000 }
        : {}),
    },
  });
  revalidatePath("/today");
}

/**
 * Add a manual progress amount to a trackable todo's actual.
 */
export async function logProgressAction(todoId: string, amount: number) {
  const user = await getCurrentUser();
  if (!user) return;
  if (!Number.isFinite(amount) || amount <= 0) return;

  const todo = await prisma.todo.findFirst({
    where: { id: todoId, block: { userId: user.id } },
    select: { id: true, metricActual: true },
  });
  if (!todo) return;

  await prisma.todo.update({
    where: { id: todo.id },
    data: { metricActual: todo.metricActual + amount },
  });
  revalidatePath("/today");
}

/**
 * Reconcile the full set of todos on a block from the edit modal.
 *
 * `items` is the desired list: entries with an `id` are existing todos
 * (text may be edited), entries without an `id` are new. Any existing todo
 * not present in `items` is deleted. Existing todos are updated in place so
 * their status / metrics / timers are preserved.
 *
 * When `applyToFuture` is true and the block belongs to a recurring rule,
 * the rule's todo template is replaced with the new text list and future
 * auto-generated blocks (date > today) are cleared so they regenerate with
 * the new todos. Today's/past blocks keep what's reconciled here.
 */
export async function editBlockTodosAction(
  blockId: string,
  items: { id?: string; text: string }[],
  applyToFuture: boolean,
) {
  const user = await getCurrentUser();
  if (!user) return;

  const block = await prisma.block.findFirst({
    where: { id: blockId, userId: user.id },
    select: {
      id: true,
      recurringRuleId: true,
      todos: { select: { id: true } },
    },
  });
  if (!block) return;

  const cleaned = items
    .map((i) => ({ id: i.id, text: i.text.trim().slice(0, 300) }))
    .filter((i) => i.text);

  const keepIds = new Set(cleaned.filter((i) => i.id).map((i) => i.id));
  const toDelete = block.todos.map((t) => t.id).filter((id) => !keepIds.has(id));

  if (toDelete.length) {
    await prisma.todo.deleteMany({
      where: { id: { in: toDelete }, blockId: block.id },
    });
  }
  for (const it of cleaned) {
    if (it.id) {
      await prisma.todo.update({
        where: { id: it.id },
        data: { text: it.text },
      });
    } else {
      await prisma.todo.create({ data: { blockId: block.id, text: it.text } });
    }
  }

  if (applyToFuture && block.recurringRuleId) {
    await prisma.recurringRule.update({
      where: { id: block.recurringRuleId },
      data: { todosTemplate: cleaned.map((i) => i.text) },
    });
    // Drop future auto-generated blocks so they regenerate with the new
    // template on next visit (today & past are left untouched).
    const today = todayInZone(user.timeZone);
    await prisma.block.deleteMany({
      where: {
        userId: user.id,
        recurringRuleId: block.recurringRuleId,
        date: { gt: today },
      },
    });
  }

  await recomputeBlockStatus(block.id);
  revalidatePath("/today");
}

/**
 * Add a todo to an existing block.
 */
export async function addTodoAction(blockId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const text = String(formData.get("text") ?? "").trim();
  if (!text || text.length > 300) return;

  // Ownership check on the parent block
  const block = await prisma.block.findFirst({
    where: { id: blockId, userId: user.id },
    select: { id: true },
  });
  if (!block) return;

  await prisma.todo.create({
    data: { blockId: block.id, text },
  });

  await recomputeBlockStatus(block.id);
  revalidatePath("/today");
}

/**
 * Delete a todo.
 */
export async function deleteTodoAction(todoId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const todo = await prisma.todo.findFirst({
    where: { id: todoId, block: { userId: user.id } },
    select: { id: true, blockId: true },
  });
  if (!todo) return;

  await prisma.todo.delete({ where: { id: todo.id } });

  await recomputeBlockStatus(todo.blockId);
  revalidatePath("/today");
}
