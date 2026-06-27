import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseISODate } from "@/lib/dates";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const startTime = String(body.startTime ?? "").trim();
    const endTime = String(body.endTime ?? "").trim();
    const tagId = body.tagId ? String(body.tagId) : null;
    const date = parseISODate(String(body.date ?? ""));
    const note = body.note ? String(body.note).trim() : null;

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!date) return NextResponse.json({ error: "Valid date required" }, { status: 400 });
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime))
      return NextResponse.json({ error: "Times must be HH:MM" }, { status: 400 });
    if (endTime <= startTime)
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });

    if (tagId) {
      const tag = await prisma.tag.findFirst({ where: { id: tagId, userId: user.id }, select: { id: true } });
      if (!tag) return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Recurrence
    const REPEAT_KINDS = ["DAILY", "WEEKDAYS", "WEEKLY", "CUSTOM"] as const;
    const recurrence = REPEAT_KINDS.includes(body.recurrence) ? body.recurrence : "NONE";
    const daysOfWeek: number[] = Array.isArray(body.daysOfWeek)
      ? body.daysOfWeek.map(Number).filter((d: number) => Number.isInteger(d) && d >= 0 && d <= 6)
      : [];
    const repeatEvery = Math.max(1, Math.min(99, Number(body.repeatEvery) || 1));
    const repeatUnit = ["day", "week", "month", "year"].includes(body.repeatUnit) ? body.repeatUnit : null;
    const repeatEndDate = body.repeatEndDate ? parseISODate(body.repeatEndDate) : null;
    const repeatEndCount = body.repeatEndCount ? Math.max(1, Number(body.repeatEndCount)) : null;

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title,
        tagId,
        date,
        startTime,
        endTime,
        note,
        recurrence,
        daysOfWeek,
        repeatEvery,
        repeatUnit,
        repeatEndDate,
        repeatEndCount,
      },
      include: { tag: true },
    });

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (err) {
    console.error("POST /api/tasks failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
