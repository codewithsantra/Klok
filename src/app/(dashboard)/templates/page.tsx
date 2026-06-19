// Rendering: SSR (per-request).
// Lists the signed-in user's templates — must be fetched fresh.

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addDays, todayInZone, toISODate } from "@/lib/dates";
import TemplatesClient from "./TemplatesClient";

export default async function TemplatesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const today = todayInZone(user.timeZone);

  const [templates, todayBlockCount] = await Promise.all([
    prisma.template.findMany({
      where: { userId: user.id },
      include: {
        blocks: {
          include: { tag: true },
          orderBy: { startTime: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.block.count({
      where: { userId: user.id, date: today },
    }),
  ]);

  // Shape data for the client (so it's plain JSON-safe)
  const view = templates.map((t) => {
    const tagNames = Array.from(
      new Set(t.blocks.map((b) => b.tag?.name).filter((x): x is string => !!x)),
    );
    return {
      id: t.id,
      name: t.name,
      createdAt: t.createdAt.toISOString(),
      blockCount: t.blocks.length,
      tagNames,
    };
  });

  // Default "apply to" date suggestion = tomorrow
  const defaultApplyDate = toISODate(addDays(today, 1));

  return (
    <TemplatesClient
      templates={view}
      defaultApplyDate={defaultApplyDate}
      todayBlockCount={todayBlockCount}
    />
  );
}
