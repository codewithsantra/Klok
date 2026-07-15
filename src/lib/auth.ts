import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { DEFAULT_TAGS } from "@/lib/constants";

const USER_SELECT = { id: true, email: true, name: true, timeZone: true } as const;

// ── Current user ──────────────────────────────────
//
// Clerk owns identity (sessions, passwords, verification). This resolves the
// Clerk user to our local User row, which holds all app data and relations.
//
// First sign-in mapping:
//   1. Look up by clerkId (normal case).
//   2. Else match by email — re-attaches accounts that existed before the
//      Clerk migration to their data.
//   3. Else create a fresh user with the default tag set.
//
// cache() dedupes the lookup per request — the dashboard layout and the page
// it renders both call this, which would otherwise be repeat DB round trips.
export const getCurrentUser = cache(async () => {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const existing = await prisma.user.findUnique({
    where: { clerkId },
    select: USER_SELECT,
  });
  if (existing) return existing;

  // First request after sign-up/sign-in with this Clerk account.
  const cu = await currentUser();
  if (!cu) return null;

  const email = cu.emailAddresses[0]?.emailAddress?.trim().toLowerCase();
  if (!email) return null;
  const name = [cu.firstName, cu.lastName].filter(Boolean).join(" ") || null;

  const byEmail = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: { clerkId, ...(name ? { name } : {}) },
      select: USER_SELECT,
    });
  }

  return prisma.user.create({
    data: {
      clerkId,
      email,
      name,
      tags: {
        create: DEFAULT_TAGS.filter((t) => t.on).map((t) => ({
          name: t.name,
          emoji: t.emoji,
        })),
      },
    },
    select: USER_SELECT,
  });
});
