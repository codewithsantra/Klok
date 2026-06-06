"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  getCurrentUser,
  hashPassword,
  verifyPassword,
  clearSession,
} from "@/lib/auth";

export type ProfileState = {
  error?: string;
  success?: boolean;
};

export type PasswordState = {
  error?: string;
  success?: boolean;
};

/**
 * Update the current user's display name.
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
 * Change the current user's password.
 * Requires the current password to be verified first.
 */
export async function updatePasswordAction(
  _prev: PasswordState | undefined,
  formData: FormData,
): Promise<PasswordState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All password fields are required." };
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New passwords don't match." };
  }

  // Fetch user WITH the password hash (getCurrentUser strips it out)
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, password: true },
  });
  if (!dbUser) return { error: "User not found." };

  const valid = await verifyPassword(currentPassword, dbUser.password);
  if (!valid) {
    return { error: "Current password is incorrect." };
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: dbUser.id },
    data: { password: newHash },
  });

  return { success: true };
}

/**
 * Permanently delete the current user's account.
 * Cascade-deletes blocks, todos, tags, templates.
 */
export async function deleteAccountAction() {
  const user = await getCurrentUser();
  if (!user) return;

  await prisma.user.delete({ where: { id: user.id } });
  await clearSession();
  redirect("/");
}
