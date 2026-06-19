import { NextRequest } from "next/server";
import { reportError } from "@/lib/report-error";

// Receives client-side error reports from the error boundaries and forwards
// them through the centralized reporter (server-side, where secrets live).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await reportError(body?.message ?? "Client error", {
      source: "client",
      stack: body?.stack,
      digest: body?.digest,
      boundary: body?.boundary,
      path: body?.path,
    });
  } catch {
    // Never let reporting throw back at the client.
  }
  return new Response(null, { status: 204 });
}
