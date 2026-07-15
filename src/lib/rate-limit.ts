/**
 * Lightweight per-user sliding-window rate limiter for mutation endpoints.
 *
 * In-memory: state lives per server instance, so on serverless platforms with
 * many concurrent instances the effective limit is (limit × instances). That's
 * fine for the goal here — stopping runaway loops and casual abuse, not
 * building a billing-grade quota system. Swap for Upstash/Redis if that
 * ever matters.
 */

type Window = { timestamps: number[] };

const buckets = new Map<string, Window>();

// Periodically drop stale buckets so the map doesn't grow unbounded.
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;
let lastSweep = Date.now();

/**
 * Returns true when the action is allowed, false when the caller has
 * exceeded `limit` actions within `windowMs`.
 */
export function rateLimit(key: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now();

  if (now - lastSweep > SWEEP_INTERVAL_MS) {
    lastSweep = now;
    for (const [k, w] of buckets) {
      if (w.timestamps.length === 0 || now - w.timestamps[w.timestamps.length - 1] > windowMs) {
        buckets.delete(k);
      }
    }
  }

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }

  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
  if (bucket.timestamps.length >= limit) return false;

  bucket.timestamps.push(now);
  return true;
}
