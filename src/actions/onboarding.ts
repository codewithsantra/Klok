"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * Save the user's onboarding tag preferences.
 * `deactivateNames` is a list of tag names the user toggled OFF.
 * Tags with names in this list get `active: false`.
 * All others stay `active: true`.
 *
 * Called from the onboarding page when the user finishes Step 2.
 */
export async function saveOnboardingTagsAction(deactivateNames: string[]) {
  const user = await getCurrentUser();
  if (!user) return;

  // Defensive sanitize
  const names = (deactivateNames ?? [])
    .filter((n) => typeof n === "string")
    .map((n) => n.trim())
    .filter(Boolean);

  if (names.length > 0) {
    await prisma.tag.updateMany({
      where: { userId: user.id, name: { in: names } },
      data: { active: false },
    });
  }

  revalidatePath("/settings");
  revalidatePath("/today");
}
