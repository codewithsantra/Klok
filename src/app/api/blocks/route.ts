import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseISODate } from "@/lib/dates";

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
    const todos: string[] = Array.isArray(body.todos)
      ? body.todos.map((t: unknown) => String(t).trim()).filter(Boolean)
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

    // ── Create ──
    const block = await prisma.block.create({
      data: {
        userId: user.id,
        tagId,
        title,
        date,
        startTime,
        endTime,
        todos: {
          create: todos.map((text) => ({ text })),
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
