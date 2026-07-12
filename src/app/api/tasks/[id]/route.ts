import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseISODate } from "@/lib/dates";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.task.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (typeof body.title === "string") {
      const t = body.title.trim();
      if (!t) return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      data.title = t;
    }
    if (typeof body.startTime === "string") data.startTime = body.startTime;
    if (typeof body.endTime === "string") data.endTime = body.endTime;
    if ("tagId" in body) {
      const tagId = body.tagId === null ? null : String(body.tagId);
      if (tagId) {
        const tag = await prisma.tag.findFirst({ where: { id: tagId, userId: user.id }, select: { id: true } });
        if (!tag) return NextResponse.json({ error: "Tag not found" }, { status: 404 });
      }
      data.tagId = tagId;
    }
    if (typeof body.note === "string") data.note = body.note.trim() || null;
    if (typeof body.date === "string") {
      const newDate = parseISODate(body.date);
      if (!newDate) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
      data.date = newDate;
    }
    if (typeof body.status === "string" && ["PENDING", "DONE", "SKIPPED"].includes(body.status)) {
      data.status = body.status;
    }

    if (Object.keys(data).length === 0)
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });

    const editScope = body.editScope as string | undefined;

    if (editScope === "future") {
      const task = await prisma.task.findFirst({
        where: { id, userId: user.id },
        select: { recurringRuleId: true, recurrence: true, date: true },
      });
      if (task) {
        const ruleId = task.recurringRuleId;
        const isTemplate = !ruleId && task.recurrence !== "NONE";
        // Never bulk-apply a date change — that would collapse every
        // instance onto the same day. Date moves are per-task only.
        const { date: _date, ...bulkData } = data;

        if (ruleId) {
          await prisma.task.update({ where: { id: ruleId }, data: bulkData });
          await prisma.task.updateMany({
            where: {
              userId: user.id,
              recurringRuleId: ruleId,
              date: { gte: task.date },
            },
            data: bulkData,
          });
          return NextResponse.json({ data: { id } });
        }

        if (isTemplate) {
          await prisma.task.update({ where: { id }, data: bulkData });
          await prisma.task.updateMany({
            where: {
              userId: user.id,
              recurringRuleId: id,
              date: { gte: task.date },
            },
            data: bulkData,
          });
          return NextResponse.json({ data: { id } });
        }
      }
    }

    const updated = await prisma.task.update({ where: { id }, data, include: { tag: true } });
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("PATCH /api/tasks/[id] failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { id } = await context.params;
    const existing = await prisma.task.findFirst({ where: { id, userId: user.id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ data: { id } });
  } catch (err) {
    console.error("DELETE /api/tasks/[id] failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
