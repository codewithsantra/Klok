/**
 * Date helpers used across the app.
 *
 * Important: dates in Prisma's `@db.Date` columns are stored at UTC midnight.
 * We treat the "logical day" as the UTC date, ignoring local timezone shifts.
 * This keeps things simple and consistent across deploys.
 */

/** Returns a Date at UTC midnight (00:00:00.000) for the given date. */
export function startOfUTCDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Returns today's date at UTC midnight. */
export function todayUTC(): Date {
  return startOfUTCDay(new Date());
}

/** Parses an ISO date string (YYYY-MM-DD) to a UTC midnight Date. */
export function parseISODate(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(iso + "T00:00:00Z");
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Formats a Date as YYYY-MM-DD (for URLs and date inputs). */
export function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/** Returns a new date N days after the given one (can be negative). */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Returns true if two dates are on the same UTC day. */
export function isSameUTCDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Formats a Date as "Mon, 2 Jun 2026". */
export function formatPrettyDate(date: Date): string {
  return `${DAY_SHORT[date.getUTCDay()]}, ${date.getUTCDate()} ${MONTH_SHORT[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** Formats a Date with a "Today" or "Yesterday" suffix if applicable. */
export function formatPrettyDateWithLabel(date: Date, today: Date): string {
  const pretty = formatPrettyDate(date);
  if (isSameUTCDay(date, today)) return `${pretty} · Today`;
  if (isSameUTCDay(date, addDays(today, -1))) return `${pretty} · Yesterday`;
  if (isSameUTCDay(date, addDays(today, 1))) return `${pretty} · Tomorrow`;
  return pretty;
}
