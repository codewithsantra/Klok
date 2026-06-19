"use server";

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { sendEmail, passwordResetEmail } from "@/lib/email";

export type ResetRequestState = { ok?: boolean; error?: string };
export type ResetState = { ok?: boolean; error?: string };

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function baseUrl(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Step 1: user requests a reset link. Always returns success (no user enumeration). */
export async function requestPasswordResetAction(
  _prev: ResetRequestState | undefined,
  formData: FormData,
): Promise<ResetRequestState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email." };
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  // Only do work if the user exists, but always return the same response.
  if (user) {
    // Invalidate any prior outstanding tokens for this user.
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    const url = `${await baseUrl()}/reset-password?token=${token}`;
    try {
      const { subject, html } = passwordResetEmail(url);
      await sendEmail({ to: email, subject, html });
    } catch (err) {
      console.error("Password reset email failed:", err);
      // Don't leak failure to the client; the generic response stands.
    }
  }

  return { ok: true };
}

/** Step 2: user submits a new password with the token from the email link. */
export async function resetPasswordAction(
  _prev: ResetState | undefined,
  formData: FormData,
): Promise<ResetState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!token) return { error: "Invalid or missing reset link." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords don't match." };

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired. Please request a new one." };
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { password: passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Belt-and-suspenders: kill any other outstanding tokens.
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId, usedAt: null } }),
  ]);

  return { ok: true };
}
