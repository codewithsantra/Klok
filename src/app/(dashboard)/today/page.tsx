// Rendering: SSR (per-request).
// Uses the auth cookie + per-user data, so Next.js can't cache this page.
// Every visit runs the Server Component fresh against the DB.

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  parseISODate,
  todayUTC,
  toISODate,
  addDays,
  formatPrettyDateWithLabel,
} from "@/lib/dates";
import TodayClient from "./TodayClient";

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  // Resolve which date to display from the URL (?date=YYYY-MM-DD)
  const params = await searchParams;
  const today = todayUTC();
  const date = (params.date && parseISODate(params.date)) || today;

  // Fetch blocks, tags, and templates in parallel
  const [blocks, tags, templates] = await Promise.all([
    prisma.block.findMany({
      where: { userId: user.id, date },
      include: {
        tag: true,
        todos: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.tag.findMany({
      where: { userId: user.id, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.template.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        _count: { select: { blocks: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const templatesView = templates.map((t) => ({
    id: t.id,
    name: t.name,
    blockCount: t._count.blocks,
  }));

  // For time-aware badges: only meaningful when viewing TODAY
  const todayISO = toISODate(today);
  const currentDateISO = toISODate(date);
  const now = new Date();
  const nowHHMM =
    currentDateISO === todayISO
      ? `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
      : null;
  const isPastDate = currentDateISO < todayISO;

  return (
    <TodayClient
      blocks={blocks}
      tags={tags}
      templates={templatesView}
      currentDateISO={currentDateISO}
      currentDateLabel={formatPrettyDateWithLabel(date, today)}
      prevDateISO={toISODate(addDays(date, -1))}
      nextDateISO={toISODate(addDays(date, 1))}
      nowHHMM={nowHHMM}
      isPastDate={isPastDate}
    />
  );
}
