// Rendering: SSR (per-request).
// Uses the auth cookie + per-user data, so Next.js can't cache this page.
// Every visit runs the Server Component fresh against the DB.

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  parseISODate,
  todayInZone,
  nowHHMMInZone,
  toISODate,
  addDays,
  formatPrettyDateWithLabel,
} from "@/lib/dates";
import { materializeRecurringRules } from "@/actions/recurring";
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
  const today = todayInZone(user.timeZone);
  const date = (params.date && parseISODate(params.date)) || today;

  // Materialize any recurring rules due on this date (idempotent).
  await materializeRecurringRules(user.id, date, today);

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

  // Serialize Date fields so client deps stay primitive.
  const blocksView = blocks.map((b) => ({
    ...b,
    timerStartedAt: b.timerStartedAt ? b.timerStartedAt.toISOString() : null,
    todos: b.todos.map((t) => ({
      ...t,
      timerStartedAt: t.timerStartedAt ? t.timerStartedAt.toISOString() : null,
    })),
  }));

  // ── Carry-forward: unfinished todos from the previous day ──
  const prevDate = addDays(date, -1);
  const prevBlocks = await prisma.block.findMany({
    where: { userId: user.id, date: prevDate },
    include: { todos: { orderBy: { createdAt: "asc" } } },
  });
  // Sources that have already been carried into the current day.
  const alreadyCarried = new Set(
    blocks
      .flatMap((b) => b.todos)
      .map((t) => t.carriedFromId)
      .filter(Boolean) as string[],
  );
  const carriedTodos = prevBlocks.flatMap((b) =>
    b.todos
      .filter(
        (t) => t.status !== "DONE" && !alreadyCarried.has(t.id),
      )
      .map((t) => ({ id: t.id, text: t.text, blockTitle: b.title })),
  );

  // For time-aware badges: only meaningful when viewing TODAY
  const todayISO = toISODate(today);
  const currentDateISO = toISODate(date);
  const nowHHMM =
    currentDateISO === todayISO ? nowHHMMInZone(user.timeZone) : null;
  const isPastDate = currentDateISO < todayISO;

  return (
    <TodayClient
      blocks={blocksView}
      carried={carriedTodos}
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
