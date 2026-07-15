// Scheduled keep-warm ping for Neon (serverless Postgres suspends after
// ~5 min idle; the resume adds seconds to the next request). A trivial
// query every 5 minutes keeps the compute awake during the day.
//
// Cost note: this keeps Neon's compute active continuously, which consumes
// the free tier's compute hours faster. If that ever matters, widen the
// schedule or delete this function.
import { neon } from "@neondatabase/serverless";
import type { Config } from "@netlify/functions";

export default async function keepWarm() {
  const url = process.env.DATABASE_URL;
  if (!url) return new Response("no DATABASE_URL", { status: 500 });

  const sql = neon(url);
  await sql`SELECT 1`;
  return new Response("warm");
}

export const config: Config = {
  // Neon's free tier suspends after ~5 idle minutes, so a 10-minute ping
  // doesn't keep it warm continuously — it halves cold starts at roughly
  // half the compute burn. Right tradeoff while user count is low; tighten
  // back to */5 for always-warm when traffic justifies it.
  schedule: "*/10 * * * *",
};
