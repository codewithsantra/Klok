"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Basic sanity check for an IANA timezone string (e.g. "Asia/Kolkata", "UTC").
function isValidTimeZone(tz: string): boolean {
  if (!tz || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Persist the user's detected IANA timezone (called by the client on load). */
export async function updateTimezoneAction(tz: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };
  if (!isValidTimeZone(tz)) return { error: "Invalid timezone." };
  if (tz === user.timeZone) return { ok: true };

  await prisma.user.update({
    where: { id: user.id },
    data: { timeZone: tz },
  });

  // Date-sensitive pages need to re-render against the new "today".
  revalidatePath("/today");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
  return { ok: true };
}
