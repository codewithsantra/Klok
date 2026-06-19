// Pure recurrence helpers, extracted so they're testable without the
// server-action / Prisma dependencies in actions/recurring.ts.

export type RecurrenceKind = "DAILY" | "WEEKDAYS" | "WEEKLY" | "CUSTOM";

/** Expand a recurrence kind into the concrete weekdays (0=Sun..6=Sat) it fires on. */
export function resolveDays(recurrence: RecurrenceKind, daysOfWeek: number[]): number[] {
  if (recurrence === "DAILY") return [0, 1, 2, 3, 4, 5, 6];
  if (recurrence === "WEEKDAYS") return [1, 2, 3, 4, 5];
  return [...new Set(daysOfWeek)]
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .sort((a, b) => a - b);
}
