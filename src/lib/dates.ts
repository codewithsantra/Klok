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

/** Returns today's date at UTC midnight (server clock, no timezone awareness). */
export function todayUTC(): Date {
  return startOfUTCDay(new Date());
}

/**
 * Returns the user's *logical day* — the calendar date it currently is in the
 * given IANA timezone — as a UTC-midnight Date (matching our storage convention).
 * Falls back to UTC if the timezone is missing or invalid.
 */
export function todayInZone(timeZone?: string | null): Date {
  if (!timeZone) return todayUTC();
  try {
    // en-CA renders as YYYY-MM-DD, which we can reattach at UTC midnight.
    const ymd = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const parsed = parseISODate(ymd);
    return parsed ?? todayUTC();
  } catch {
    return todayUTC();
  }
}

/** Current wall-clock time as "HH:MM" in the given timezone (24h). */
export function nowHHMMInZone(timeZone?: string | null): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: timeZone || undefined,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());
  } catch {
    const now = new Date();
    return `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
  }
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
