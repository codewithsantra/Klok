"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type ProfileState = {
  error?: string;
  success?: boolean;
};

/**
 * Update the current user's display name.
 * (Password changes live in Clerk's account UI, not here.)
 */
export async function updateProfileAction(
  _prev: ProfileState | undefined,
  formData: FormData,
): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };
  if (name.length > 80) return { error: "Name too long (max 80 chars)." };

  await prisma.user.update({
    where: { id: user.id },
    data: { name },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Permanently delete the current user's account — both the local data row
 * (cascade-deletes tasks, timers, tags, templates) and the Clerk identity.
 */
export async function deleteAccountAction() {
  const user = await getCurrentUser();
  if (!user) return;

  const { userId: clerkId } = await auth();

  await prisma.user.delete({ where: { id: user.id } });

  if (clerkId) {
    try {
      const client = await clerkClient();
      await client.users.deleteUser(clerkId);
    } catch (err) {
      console.error("Clerk user deletion failed:", err);
      // Local data is gone either way; the orphaned Clerk identity can be
      // removed from the Clerk dashboard if this ever fails.
    }
  }

  redirect("/");
}
