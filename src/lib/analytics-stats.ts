/**
 * Pure helpers that aggregate block data into analytics views.
 * All functions are timezone-naive UTC — same convention as the rest of the app.
 */

import { addDays, isSameUTCDay, toISODate } from "./dates";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type RawBlock = {
  date: Date;
  status: string;
  tag: { name: string } | null;
};

export type DayStat = {
  date: string;        // YYYY-MM-DD
  label: string;       // "Mon"
  total: number;
  done: number;
  pct: number;         // 0..100
  isToday: boolean;
};

export type WeekStats = {
  days: DayStat[];
  bestDay: DayStat | null;
  worstDay: DayStat | null;
  avgPct: number | null;
  totalBlocks: number;
  tagCounts: { name: string; count: number }[];
};

export function computeWeekStats(
  blocks: RawBlock[],
  today: Date,
): WeekStats {
  const days: DayStat[] = [];

  for (let i = 6; i >= 0; i--) {
    const day = addDays(today, -i);
    const dayBlocks = blocks.filter((b) => isSameUTCDay(b.date, day));
    const total = dayBlocks.length;
    const done = dayBlocks.filter((b) => b.status === "DONE").length;
    days.push({
      date: toISODate(day),
      label: DAY_SHORT[day.getUTCDay()],
      total,
      done,
      pct: total === 0 ? 0 : Math.round((done / total) * 100),
      isToday: i === 0,
    });
  }

  // Best/worst (only consider days that had any blocks)
  const daysWithBlocks = days.filter((d) => d.total > 0);
  const bestDay =
    daysWithBlocks.length > 0
      ? daysWithBlocks.reduce((a, b) => (b.pct > a.pct ? b : a))
      : null;
  const worstDay =
    daysWithBlocks.length > 0
      ? daysWithBlocks.reduce((a, b) => (b.pct < a.pct ? b : a))
      : null;

  // Avg over days that had blocks
  const avgPct =
    daysWithBlocks.length > 0
      ? Math.round(
          daysWithBlocks.reduce((sum, d) => sum + d.pct, 0) /
            daysWithBlocks.length,
        )
      : null;

  // Tag usage frequency
  const counts: Record<string, number> = {};
  for (const b of blocks) {
    if (b.tag) counts[b.tag.name] = (counts[b.tag.name] ?? 0) + 1;
  }
  const tagCounts = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    days,
    bestDay,
    worstDay,
    avgPct,
    totalBlocks: blocks.length,
    tagCounts,
  };
}

export type MonthStats = {
  days: { date: string; pct: number | null }[];
  avgPct: number | null;
  daysLogged: number;
  totalDays: number;
  bestDay: { date: string; pct: number } | null;
  worstDay: { date: string; pct: number } | null;
};

export function computeMonthStats(
  blocks: RawBlock[],
  monthRef: Date,
  today: Date,
): MonthStats {
  const year = monthRef.getUTCFullYear();
  const month = monthRef.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const todayStr = toISODate(today);

  const days: { date: string; pct: number | null }[] = [];
  let sumPct = 0;
  let withBlocks = 0;
  let bestDay: { date: string; pct: number } | null = null;
  let worstDay: { date: string; pct: number } | null = null;

  for (let d = 1; d <= daysInMonth; d++) {
    const dayDate = new Date(Date.UTC(year, month, d));
    const dayDateStr = toISODate(dayDate);
    const isFuture = dayDateStr > todayStr;

    const dayBlocks = blocks.filter((b) => isSameUTCDay(b.date, dayDate));
    const total = dayBlocks.length;

    if (total === 0 || isFuture) {
      // Future days never count in stats — and their heatmap cell stays empty.
      days.push({ date: dayDateStr, pct: null });
      continue;
    }

    const done = dayBlocks.filter((b) => b.status === "DONE").length;
    const pct = Math.round((done / total) * 100);
    days.push({ date: dayDateStr, pct });
    sumPct += pct;
    withBlocks++;
    if (!bestDay || pct > bestDay.pct) bestDay = { date: dayDateStr, pct };
    if (!worstDay || pct < worstDay.pct) worstDay = { date: dayDateStr, pct };
  }

  return {
    days,
    avgPct: withBlocks > 0 ? Math.round(sumPct / withBlocks) : null,
    daysLogged: withBlocks,
    totalDays: daysInMonth,
    bestDay,
    worstDay,
  };
}

export type YearStats = {
  months: { label: string; monthIdx: number; avgPct: number | null; total: number }[];
  totalBlocks: number;
  bestMonth: { label: string; avgPct: number } | null;
};

export function computeYearStats(blocks: RawBlock[], year: number): YearStats {
  const months: YearStats["months"] = [];
  let bestMonth: YearStats["bestMonth"] = null;

  for (let m = 0; m < 12; m++) {
    const monthBlocks = blocks.filter(
      (b) =>
        b.date.getUTCFullYear() === year && b.date.getUTCMonth() === m,
    );
    const total = monthBlocks.length;
    const done = monthBlocks.filter((b) => b.status === "DONE").length;
    const avgPct = total === 0 ? null : Math.round((done / total) * 100);

    months.push({ label: MONTH_SHORT[m], monthIdx: m, avgPct, total });

    if (avgPct !== null && (!bestMonth || avgPct > bestMonth.avgPct)) {
      bestMonth = { label: MONTH_SHORT[m], avgPct };
    }
  }

  return {
    months,
    totalBlocks: blocks.length,
    bestMonth,
  };
}
