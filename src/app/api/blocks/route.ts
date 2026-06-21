import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseISODate } from "@/lib/dates";
import { resolveDays } from "@/lib/recurrence";

/**
 * POST /api/blocks
 * Body: { title, date (YYYY-MM-DD), startTime, endTime, tagId?, todos?: string[] }
 *
 * Creates a block (and optional todos) for the current user.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const startTime = String(body.startTime ?? "").trim();
    const endTime = String(body.endTime ?? "").trim();
    const tagId = body.tagId ? String(body.tagId) : null;
    const date = parseISODate(String(body.date ?? ""));

    // Todos may arrive as plain strings (legacy) or objects with an
    // optional metric goal: { text, metric?: { type, target, unit } }.
    const METRIC_TYPES = ["TIME", "DISTANCE", "COUNT", "CUSTOM"] as const;
    type TodoCreate = {
      text: string;
      metricType?: (typeof METRIC_TYPES)[number];
      metricUnit?: string;
      metricTarget?: number;
    };
    const todos: TodoCreate[] = Array.isArray(body.todos)
      ? body.todos
          .map((raw: unknown): TodoCreate | null => {
            if (typeof raw === "string") {
              const text = raw.trim();
              return text ? { text } : null;
            }
            if (raw && typeof raw === "object") {
              const o = raw as Record<string, unknown>;
              const text = String(o.text ?? "").trim();
              if (!text) return null;
              const m = o.metric as Record<string, unknown> | null | undefined;
              if (
                m &&
                METRIC_TYPES.includes(m.type as (typeof METRIC_TYPES)[number]) &&
                Number(m.target) > 0
              ) {
                return {
                  text,
                  metricType: m.type as (typeof METRIC_TYPES)[number],
                  metricTarget: Number(m.target),
                  metricUnit: String(m.unit ?? "").slice(0, 20),
                };
              }
              return { text };
            }
            return null;
          })
          .filter((t: TodoCreate | null): t is TodoCreate => t !== null)
      : [];

    // ── Validation ──
    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 },
      );
    }
    if (!date) {
      return NextResponse.json(
        { error: "Valid date (YYYY-MM-DD) is required" },
        { status: 400 },
      );
    }
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      return NextResponse.json(
        { error: "Start time and end time must be in HH:MM format" },
        { status: 400 },
      );
    }
    if (endTime <= startTime) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 },
      );
    }

    // Verify tag ownership (if provided)
    if (tagId) {
      const tag = await prisma.tag.findFirst({
        where: { id: tagId, userId: user.id },
        select: { id: true },
      });
      if (!tag) {
        return NextResponse.json(
          { error: "Tag not found" },
          { status: 404 },
        );
      }
    }

    // ── Block-level tracking (optional) ──
    const blockMetricType = METRIC_TYPES.includes(body.metricType) ? body.metricType : null;
    const blockMetricTarget = blockMetricType && Number(body.metricTarget) > 0 ? Number(body.metricTarget) : null;
    const blockMetricUnit = blockMetricType ? String(body.metricUnit ?? "").slice(0, 20) || null : null;

    // ── Recurrence (optional) — creates a RecurringRule so the block
    //    auto-appears on future matching days. ──
    const REPEAT_KINDS = ["DAILY", "WEEKDAYS", "WEEKLY", "CUSTOM"] as const;
    const repeat = REPEAT_KINDS.includes(body.repeat) ? body.repeat : null;
    const rawDays: number[] = Array.isArray(body.daysOfWeek)
      ? body.daysOfWeek.map(Number).filter((d: number) => Number.isInteger(d) && d >= 0 && d <= 6)
      : [];

    let recurringRuleId: string | null = null;
    if (repeat) {
      const rule = await prisma.recurringRule.create({
        data: {
          userId: user.id,
          name: title,
          emoji: "🔁",
          tagId,
          startTime,
          endTime,
          recurrence: repeat,
          daysOfWeek: resolveDays(repeat, rawDays),
          startDate: date,
          todosTemplate: todos.map((t) => t.text),
        },
        select: { id: true },
      });
      recurringRuleId = rule.id;
    }

    // ── Create ──
    const block = await prisma.block.create({
      data: {
        userId: user.id,
        tagId,
        title,
        date,
        startTime,
        endTime,
        ...(repeat ? { recurrence: repeat, recurringRuleId } : {}),
        ...(blockMetricType ? { metricType: blockMetricType, metricTarget: blockMetricTarget, metricUnit: blockMetricUnit } : {}),
        todos: {
          create: todos.map((t) => ({
            text: t.text,
            ...(t.metricType
              ? {
                  metricType: t.metricType,
                  metricTarget: t.metricTarget,
                  metricUnit: t.metricUnit || null,
                }
              : {}),
          })),
        },
      },
      include: { tag: true, todos: true },
    });

    return NextResponse.json({ data: block }, { status: 201 });
  } catch (err) {
    console.error("POST /api/blocks failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/blocks?date=YYYY-MM-DD
 * Returns the current user's blocks for the given date.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    }

    const dateStr = request.nextUrl.searchParams.get("date");
    const date = dateStr ? parseISODate(dateStr) : null;
    if (!date) {
      return NextResponse.json(
        { error: "Query param 'date' (YYYY-MM-DD) is required" },
        { status: 400 },
      );
    }

    const blocks = await prisma.block.findMany({
      where: { userId: user.id, date },
      include: {
        tag: true,
        todos: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json({ data: blocks });
  } catch (err) {
    console.error("GET /api/blocks failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
