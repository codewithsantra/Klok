"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSession,
  clearSession,
} from "@/lib/auth";
import { DEFAULT_TAGS } from "@/lib/constants";

export type AuthState = {
  error?: string;
};

export async function signUpAction(
  _prevState: AuthState | undefined,
  formData: FormData,
): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  // ── Validation ──
  if (!name || !email || !password) {
    return { error: "All fields are required." };
  }
  if (!email.includes("@")) {
    return { error: "Please enter a valid email." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  // ── Check if email exists ──
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  // ── Create user with default tags ──
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: passwordHash,
      tags: {
        create: DEFAULT_TAGS.filter((t) => t.on).map((t) => ({
          name: t.name,
          emoji: t.emoji,
        })),
      },
    },
  });

  // ── Sign them in ──
  await createSession(user.id);

  // ── Redirect to onboarding ──
  redirect("/onboarding");
}

export async function signInAction(
  _prevState: AuthState | undefined,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  // ── Validation ──
  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  // ── Find user ──
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Same generic message as wrong password (uniform error for security)
    return { error: "Incorrect email or password." };
  }

  // ── Verify password ──
  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return { error: "Incorrect email or password." };
  }

  // ── Sign them in ──
  await createSession(user.id);

  // ── Redirect to dashboard ──
  redirect("/dashboard");
}

export async function signOutAction() {
  await clearSession();
  redirect("/");
}
