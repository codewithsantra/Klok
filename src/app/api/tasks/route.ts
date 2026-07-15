import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseISODate } from "@/lib/dates";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (!rateLimit(`tasks:write:${user.id}`))
      return NextResponse.json({ error: "Too many requests — slow down a little." }, { status: 429 });

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

    // Carry-forward: link the copy back to the missed source task
    let carriedFromId: string | null = null;
    if (body.carriedFromId) {
      const source = await prisma.task.findFirst({
        where: { id: String(body.carriedFromId), userId: user.id },
        select: { id: true },
      });
      if (!source) return NextResponse.json({ error: "Source task not found" }, { status: 404 });
      carriedFromId = source.id;
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

    // If the start date's weekday isn't among the selected repeat days,
    // shift the first task to the next selected day so the off-pattern
    // date doesn't get a stray instance.
    let taskDate = date;
    const weekBased = recurrence === "WEEKLY" || (recurrence === "CUSTOM" && repeatUnit === "week");
    if (weekBased && daysOfWeek.length > 0 && !daysOfWeek.includes(taskDate.getUTCDay())) {
      for (let i = 0; i < 7; i++) {
        taskDate = new Date(taskDate.getTime() + 86_400_000);
        if (daysOfWeek.includes(taskDate.getUTCDay())) break;
      }
    }

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title,
        tagId,
        date: taskDate,
        startTime,
        endTime,
        note,
        recurrence,
        daysOfWeek,
        repeatEvery,
        repeatUnit,
        repeatEndDate,
        repeatEndCount,
        carriedFromId,
      },
      include: { tag: true },
    });

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (err) {
    console.error("POST /api/tasks failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
