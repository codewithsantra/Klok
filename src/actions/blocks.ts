"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type BlockStatus = "PLANNED" | "DONE" | "PARTIAL" | "SKIPPED";

/**
 * Set a block's status directly.
 *
 * Used for blocks with no todos (where the auto-computed status from
 * `recomputeBlockStatus` would skip them and leave them at PLANNED forever).
 */
export async function setBlockStatusAction(
  blockId: string,
  status: BlockStatus,
) {
  const user = await getCurrentUser();
  if (!user) return;

  // Ownership check
  const block = await prisma.block.findFirst({
    where: { id: blockId, userId: user.id },
    select: { id: true },
  });
  if (!block) return;

  await prisma.block.update({
    where: { id: block.id },
    data: { status },
  });

  revalidatePath("/today");
  revalidatePath("/dashboard");
}

/**
 * Mark every todo in a block as DONE (or reset them all to PENDING).
 * Also updates the block's own status to match.
 */
export async function markAllTodosAction(
  blockId: string,
  markAsDone: boolean,
) {
  const user = await getCurrentUser();
  if (!user) return;

  // Ownership check
  const block = await prisma.block.findFirst({
    where: { id: blockId, userId: user.id },
    select: { id: true },
  });
  if (!block) return;

  await prisma.todo.updateMany({
    where: { blockId: block.id },
    data: { status: markAsDone ? "DONE" : "PENDING" },
  });

  await prisma.block.update({
    where: { id: block.id },
    data: { status: markAsDone ? "DONE" : "PLANNED" },
  });

  revalidatePath("/today");
  revalidatePath("/dashboard");
}
