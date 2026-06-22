// Rendering: SSR (per-request).
// This page shows the signed-in user's stats — must run fresh every visit so
// they see their latest data. The auth cookie also forces dynamic rendering.

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addDays, parseISODate, toISODate, todayInZone } from "@/lib/dates";
import {
  computeMonthStats,
  computeWeekStats,
  computeYearStats,
  computeTagTimeStats,
} from "@/lib/analytics-stats";
import AnalyticsClient from "./AnalyticsClient";

type ViewKey = "week" | "month" | "year";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_SHORT_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; period?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const params = await searchParams;
  const view: ViewKey =
    params.view === "month" || params.view === "year" ? params.view : "week";

  const today = todayInZone(user.timeZone);

  // ── Resolve the "reference date" for the chosen view ──
  // For week: the end date of the 7-day window. Default = today.
  // For month: any date in that month. Default = today.
  // For year: any date in that year. Default = today.
  let referenceDate: Date = today;

  if (params.period) {
    if (view === "year" && /^\d{4}$/.test(params.period)) {
      referenceDate = new Date(Date.UTC(parseInt(params.period, 10), 0, 1));
    } else if (view === "month" && /^\d{4}-\d{2}$/.test(params.period)) {
      const [y, m] = params.period.split("-").map(Number);
      referenceDate = new Date(Date.UTC(y, m - 1, 1));
    } else if (view === "week") {
      const parsed = parseISODate(params.period);
      if (parsed) referenceDate = parsed;
    }
  }

  // ── Compute date range for the data fetch ──
  let rangeStart: Date;
  let rangeEnd: Date;

  if (view === "week") {
    rangeStart = addDays(referenceDate, -6);
    rangeEnd = referenceDate;
  } else if (view === "month") {
    rangeStart = new Date(
      Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1),
    );
    rangeEnd = new Date(
      Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() + 1, 0),
    );
  } else {
    rangeStart = new Date(Date.UTC(referenceDate.getUTCFullYear(), 0, 1));
    rangeEnd = new Date(Date.UTC(referenceDate.getUTCFullYear(), 11, 31));
    // Don't fetch dates that haven't happened yet
    if (rangeEnd > today) rangeEnd = today;
  }

  // ── Fetch blocks in that range ──
  const blocks = await prisma.block.findMany({
    where: { userId: user.id, date: { gte: rangeStart, lte: rangeEnd } },
    select: {
      date: true,
      status: true,
      startTime: true,
      endTime: true,
      tag: { select: { name: true, emoji: true } },
    },
  });

  // Time spent per tag across the selected period (scheduled block durations).
  const tagTime = computeTagTimeStats(blocks);

  // ── Compute stats for the active view ──
  const week =
    view === "week" ? computeWeekStats(blocks, referenceDate) : null;
  const month =
    view === "month" ? computeMonthStats(blocks, referenceDate, today) : null;
  const year =
    view === "year"
      ? computeYearStats(blocks, referenceDate.getUTCFullYear())
      : null;

  // ── Compute prev/next period strings + a friendly period label ──
  let prevPeriod = "";
  let nextPeriod = "";
  let periodLabel = "";

  if (view === "week") {
    prevPeriod = toISODate(addDays(referenceDate, -7));
    nextPeriod = toISODate(addDays(referenceDate, 7));
    const start = addDays(referenceDate, -6);
    periodLabel = `${DAY_SHORT_NAMES[start.getUTCDay()]} ${start.getUTCDate()} ${MONTH_NAMES[start.getUTCMonth()].slice(0, 3)} – ${DAY_SHORT_NAMES[referenceDate.getUTCDay()]} ${referenceDate.getUTCDate()} ${MONTH_NAMES[referenceDate.getUTCMonth()].slice(0, 3)}`;
  } else if (view === "month") {
    const y = referenceDate.getUTCFullYear();
    const m = referenceDate.getUTCMonth();
    const prevDate = new Date(Date.UTC(y, m - 1, 1));
    const nextDate = new Date(Date.UTC(y, m + 1, 1));
    prevPeriod = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, "0")}`;
    nextPeriod = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, "0")}`;
    periodLabel = `${MONTH_NAMES[m]} ${y}`;
  } else {
    const y = referenceDate.getUTCFullYear();
    prevPeriod = String(y - 1);
    nextPeriod = String(y + 1);
    periodLabel = String(y);
  }

  // Disable "next" arrow when it would point to a fully future period
  const isAtFutureEdge = (() => {
    if (view === "week") {
      return addDays(referenceDate, 7) > today;
    } else if (view === "month") {
      return (
        referenceDate.getUTCFullYear() > today.getUTCFullYear() ||
        (referenceDate.getUTCFullYear() === today.getUTCFullYear() &&
          referenceDate.getUTCMonth() >= today.getUTCMonth())
      );
    } else {
      return referenceDate.getUTCFullYear() >= today.getUTCFullYear();
    }
  })();

  return (
    <AnalyticsClient
      view={view}
      week={week}
      month={month}
      year={year}
      tagTime={tagTime}
      year_number={referenceDate.getUTCFullYear()}
      monthName={MONTH_NAMES[referenceDate.getUTCMonth()]}
      prevPeriod={prevPeriod}
      nextPeriod={nextPeriod}
      periodLabel={periodLabel}
      disableNext={isAtFutureEdge}
    />
  );
}
