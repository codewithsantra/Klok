"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * Save the user's onboarding tag preferences.
 *
 * `selections` is the full toggle state from onboarding. This reconciles the
 * user's tags to match:
 *  - selected (on)  → ensure the tag exists and is active (creates if missing)
 *  - unselected     → deactivate if it exists (never creates)
 *
 * Being a full reconcile (not just "deactivate") means a tag the user enables
 * gets created even if it wasn't seeded at signup — fixing the case where
 * toggling a tag on did nothing.
 */
export async function saveOnboardingTagsAction(
  selections: { name: string; emoji: string; on: boolean }[],
) {
  const user = await getCurrentUser();
  if (!user) return;

  const clean = (selections ?? [])
    .filter((s) => s && typeof s.name === "string")
    .map((s) => ({ name: s.name.trim(), emoji: (s.emoji ?? "🏷️").trim() || "🏷️", on: !!s.on }))
    .filter((s) => s.name);

  const existing = await prisma.tag.findMany({
    where: { userId: user.id },
    select: { id: true, name: true },
  });
  const idByName = new Map(existing.map((t) => [t.name, t.id]));

  for (const sel of clean) {
    const id = idByName.get(sel.name);
    if (sel.on) {
      if (id) {
        await prisma.tag.update({ where: { id }, data: { active: true } });
      } else {
        await prisma.tag.create({
          data: { userId: user.id, name: sel.name, emoji: sel.emoji, active: true },
        });
      }
    } else if (id) {
      await prisma.tag.update({ where: { id }, data: { active: false } });
    }
  }

  revalidatePath("/settings");
  revalidatePath("/today");
}
