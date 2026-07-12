"use server";

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendEmail, verificationEmail } from "@/lib/email";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute between resends

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

/**
 * Create a verification token for the user and email the verify link.
 * Used on signup and by the "resend" button.
 */
export async function sendVerificationEmail(userId: string, email: string): Promise<void> {
  await prisma.verificationToken.deleteMany({ where: { userId, usedAt: null } });

  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const url = `${await baseUrl()}/verify-email?token=${token}`;
  try {
    const { subject, html } = verificationEmail(url);
    await sendEmail({ to: email, subject, html });
  } catch (err) {
    console.error("Verification email failed:", err);
    // Non-fatal: user can hit "resend" from the banner.
  }
}

export type ResendState = { ok?: boolean; error?: string };

/** "Resend verification email" from the banner. Rate-limited per user. */
export async function resendVerificationAction(): Promise<ResendState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };
  if (user.emailVerifiedAt) return { ok: true };

  const recent = await prisma.verificationToken.findFirst({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
    select: { id: true },
  });
  if (recent) return { error: "Just sent — check your inbox, or retry in a minute." };

  await sendVerificationEmail(user.id, user.email);
  return { ok: true };
}

/** Consume a token from the /verify-email link. */
export async function verifyEmailToken(
  token: string,
): Promise<{ ok: true } | { ok: false; reason: "invalid" | "expired" }> {
  if (!token || token.length < 32) return { ok: false, reason: "invalid" };

  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!record || record.usedAt) return { ok: false, reason: "invalid" };
  if (record.expiresAt < new Date()) return { ok: false, reason: "expired" };

  await prisma.$transaction([
    prisma.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);

  return { ok: true };
}
