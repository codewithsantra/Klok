// Streak calculations, kept pure & dependency-light so they're easy to test.

import { toISODate, addDays } from "./dates";

/**
 * Current streak: consecutive days (ending today or yesterday) that have at
 * least one block. A gap breaks it. Returns 0 if nothing qualifies.
 */
export function computeStreak(blockDates: { date: Date }[], today: Date): number {
  if (blockDates.length === 0) return 0;
  const dateSet = new Set(blockDates.map((d) => toISODate(d.date)));
  let cursor = dateSet.has(toISODate(today)) ? today : addDays(today, -1);
  let streak = 0;
  while (dateSet.has(toISODate(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Longest all-time run of consecutive days that have at least one block. */
export function computeLongestStreak(blockDates: { date: Date }[]): number {
  if (blockDates.length === 0) return 0;
  const sorted = [...new Set(blockDates.map((d) => toISODate(d.date)))].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(`${sorted[i - 1]}T00:00:00Z`);
    const cur = new Date(`${sorted[i]}T00:00:00Z`);
    const diffDays = (cur.getTime() - prev.getTime()) / 86_400_000;
    if (diffDays === 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }
  return longest;
}
