import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/export — download all of the signed-in user's data as JSON.
 * Everything they created: tasks, timer sessions (with sub-items), tags,
 * and templates. Identity fields stay minimal (email + name only).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const [tasks, timerSessions, tags, templates] = await Promise.all([
    prisma.task.findMany({
      where: { userId: user.id },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      select: {
        title: true, date: true, startTime: true, endTime: true, status: true,
        note: true, recurrence: true, daysOfWeek: true, repeatEvery: true,
        repeatUnit: true, repeatEndDate: true, repeatEndCount: true,
        tag: { select: { name: true, emoji: true } },
        createdAt: true,
      },
    }),
    prisma.timerSession.findMany({
      where: { userId: user.id },
      orderBy: { date: "asc" },
      select: {
        title: true, date: true, targetMinutes: true, createdAt: true,
        tag: { select: { name: true, emoji: true } },
        subItems: {
          select: { title: true, targetMinutes: true, timerAccumMs: true, createdAt: true },
        },
      },
    }),
    prisma.tag.findMany({
      where: { userId: user.id },
      select: { name: true, emoji: true, active: true, createdAt: true },
    }),
    prisma.template.findMany({
      where: { userId: user.id },
      select: {
        name: true, icon: true, createdAt: true,
        items: { select: { title: true, startTime: true, endTime: true } },
      },
    }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    app: "Klok",
    user: { email: user.email, name: user.name },
    counts: {
      tasks: tasks.length,
      timerSessions: timerSessions.length,
      tags: tags.length,
      templates: templates.length,
    },
    tasks,
    timerSessions,
    tags,
    templates,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="klok-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
