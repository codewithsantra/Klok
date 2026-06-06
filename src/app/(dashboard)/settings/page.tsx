// Rendering: SSR (per-request).
// Profile + per-user tags — must run on every visit.

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const tags = await prisma.tag.findMany({
    where: { userId: user.id },
    orderBy: [{ active: "desc" }, { createdAt: "asc" }],
  });

  return <SettingsClient user={user} tags={tags} />;
}
