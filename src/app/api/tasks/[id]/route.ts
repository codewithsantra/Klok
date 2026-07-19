import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseISODate } from "@/lib/dates";
import { rateLimit } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (!rateLimit(`tasks:write:${user.id}`))
      return NextResponse.json({ error: "Too many requests — slow down a little." }, { status: 429 });

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

    if (Object.keys(data).length === 0 && !Array.isArray(body.subItems))
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });

    // Reconcile sub-items for this specific task (never bulk — a checklist is
    // per-instance). Incoming items with an id are kept (done-state preserved,
    // title updated); ones without an id are created; existing items absent
    // from the payload are deleted.
    if (Array.isArray(body.subItems)) {
      const incoming = (body.subItems as unknown[])
        .map((s) => {
          const o = s as { id?: unknown; title?: unknown };
          const title = String(o.title ?? "").trim().slice(0, 200);
          return { id: typeof o.id === "string" ? o.id : undefined, title };
        })
        .filter((s) => s.title.length > 0);

      const current = await prisma.taskSubItem.findMany({
        where: { taskId: id },
        select: { id: true, title: true },
      });
      const keepIds = new Set(incoming.filter((s) => s.id).map((s) => s.id));

      const toDelete = current.filter((c) => !keepIds.has(c.id)).map((c) => c.id);
      const toCreate = incoming.filter((s) => !s.id).map((s) => ({ taskId: id, title: s.title }));
      const toUpdate = incoming.filter(
        (s) => s.id && current.find((c) => c.id === s.id && c.title !== s.title),
      );

      await prisma.$transaction([
        ...(toDelete.length ? [prisma.taskSubItem.deleteMany({ where: { id: { in: toDelete } } })] : []),
        ...(toCreate.length ? [prisma.taskSubItem.createMany({ data: toCreate })] : []),
        ...toUpdate.map((s) => prisma.taskSubItem.update({ where: { id: s.id }, data: { title: s.title } })),
      ]);
    }

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
    if (!rateLimit(`tasks:write:${user.id}`))
      return NextResponse.json({ error: "Too many requests — slow down a little." }, { status: 429 });

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
