import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

const ALLOWED_STATUSES = ["PLANNED", "DONE", "PARTIAL", "SKIPPED"] as const;
type BlockStatus = (typeof ALLOWED_STATUSES)[number];

/**
 * PATCH /api/blocks/[id]
 * Body: any subset of { title, startTime, endTime, tagId, status }
 *
 * Updates a block. Only fields included in the body are touched.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.block.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    // Build update payload (only fields the caller actually sent)
    const data: Record<string, unknown> = {};

    if (typeof body.title === "string") {
      const title = body.title.trim();
      if (!title) {
        return NextResponse.json(
          { error: "Title cannot be empty" },
          { status: 400 },
        );
      }
      data.title = title;
    }

    if (typeof body.startTime === "string") {
      if (!/^\d{2}:\d{2}$/.test(body.startTime)) {
        return NextResponse.json(
          { error: "startTime must be HH:MM" },
          { status: 400 },
        );
      }
      data.startTime = body.startTime;
    }

    if (typeof body.endTime === "string") {
      if (!/^\d{2}:\d{2}$/.test(body.endTime)) {
        return NextResponse.json(
          { error: "endTime must be HH:MM" },
          { status: 400 },
        );
      }
      data.endTime = body.endTime;
    }

    if ("tagId" in body) {
      const tagId = body.tagId === null ? null : String(body.tagId);
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
      data.tagId = tagId;
    }

    if (typeof body.status === "string") {
      if (!ALLOWED_STATUSES.includes(body.status as BlockStatus)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 },
        );
      }
      data.status = body.status;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    const updated = await prisma.block.update({
      where: { id },
      data,
      include: { tag: true, todos: true },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("PATCH /api/blocks/[id] failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/blocks/[id]
 * Removes the block (cascades todos).
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { id } = await context.params;

    // Verify ownership
    const existing = await prisma.block.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    await prisma.block.delete({ where: { id } });

    return NextResponse.json({ data: { id } });
  } catch (err) {
    console.error("DELETE /api/blocks/[id] failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
