"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type TagActionState = {
  error?: string;
};

export async function addTagAction(
  _prevState: TagActionState | undefined,
  formData: FormData,
): Promise<TagActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  const emojiRaw = String(formData.get("emoji") ?? "").trim();
  const emoji = emojiRaw || "🏷️"; // Fall back to a default if none picked
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "Tag name is required." };
  }
  if (name.length > 30) {
    return { error: "Tag name too long." };
  }

  await prisma.tag.create({
    data: {
      userId: user.id,
      emoji,
      name,
    },
  });

  revalidatePath("/settings");
  return {};
}

export async function toggleTagAction(tagId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  // Verify ownership before reading current state
  const tag = await prisma.tag.findFirst({
    where: { id: tagId, userId: user.id },
    select: { active: true },
  });
  if (!tag) return;

  await prisma.tag.update({
    where: { id: tagId },
    data: { active: !tag.active },
  });

  revalidatePath("/settings");
}

export async function deleteTagAction(tagId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  // Verify ownership before deleting
  const tag = await prisma.tag.findFirst({
    where: { id: tagId, userId: user.id },
    select: { id: true },
  });
  if (!tag) return;

  await prisma.tag.delete({ where: { id: tagId } });

  revalidatePath("/settings");
}
