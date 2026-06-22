"use client";

import Link from "next/link";
import { TagTimeDonut } from "@/components/analytics/TagTimeDonut";
import type {
  WeekStats,
  MonthStats,
  YearStats,
  TagTimeStats,
} from "@/lib/analytics-stats";

const TAGS_CLASS_MAP: Record<string, string> = {
  Study: "tag-study", Work: "tag-work", Sleep: "tag-sleep",
  Exercise: "tag-health", Personal: "tag-personal",
  Breakfast: "tag-meal", Lunch: "tag-meal", Dinner: "tag-meal", Break: "tag-break",
};

export default function AnalyticsClient({
  view, week, month, year, year_number, monthName, tagTime,
  prevPeriod, nextPeriod, periodLabel, disableNext,
}: {
  view: "week" | "month" | "year";
  week: WeekStats | null; month: MonthStats | null; year: YearStats | null;
  year_number: number; monthName: string; tagTime: TagTimeStats;
  prevPeriod: string; nextPeriod: string; periodLabel: string; disableNext: boolean;
}) {
  const prevHref = `/analytics?view=${view}&period=${prevPeriod}`;
  const nextHref = `/analytics?view=${view}&period=${nextPeriod}`;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <h1 className="font-display text-2xl font-extrabold" style={{ color: "var(--text)" }}>
          Analytics
        </h1>
        <div className="flex items-center gap-1 rounded-lg p-1 flex-shrink-0"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <Link href="/analytics?view=week" className={`a-tab ${view === "week" ? "a-tab-active" : ""}`}>Week</Link>
          <Link href="/analytics?view=month" className={`a-tab ${view === "month" ? "a-tab-active" : ""}`}>Month</Link>
          <Link href="/analytics?view=year" className={`a-tab ${view === "year" ? "a-tab-active" : ""}`}>Year</Link>
        </div>
      </div>

      {/* Period nav */}
      <div className="flex items-center gap-2 mb-5">
        <Link href={prevHref}
          className="w-7 h-7 rounded flex items-center justify-center transition-colors"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <i className="fa-solid fa-chevron-left" style={{ fontSize: "10px", color: "var(--text-2)" }}></i>
        </Link>
        <span className="text-sm font-semibold flex-1 sm:flex-none" style={{ color: "var(--text)" }}>
          {periodLabel}
        </span>
        {disableNext ? (
          <span className="w-7 h-7 rounded flex items-center justify-center"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <i className="fa-solid fa-chevron-right" style={{ fontSize: "10px", color: "var(--text-3)" }}></i>
          </span>
        ) : (
          <Link href={nextHref}
            className="w-7 h-7 rounded flex items-center justify-center transition-colors"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <i className="fa-solid fa-chevron-right" style={{ fontSize: "10px", color: "var(--text-2)" }}></i>
          </Link>
        )}
      </div>

      {view === "week" && week && <WeekView week={week} />}
      {view === "month" && month && <MonthView month={month} monthName={monthName} year={year_number} />}
      {view === "year" && year && <YearView year={year} yearNum={year_number} />}

      <div className="mt-5">
        <TagTimeDonut tagTime={tagTime} subtitle={periodLabel} />
      </div>
    </div>
  );
}

function WeekView({ week }: { week: WeekStats }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 card p-6">
        <h3 className="font-semibold text-sm mb-5" style={{ color: "var(--text)" }}>
          Last 7 Days — Completion %
        </h3>
        {week.totalBlocks === 0 ? (
          <EmptyMessage text="No blocks logged this week yet." />
        ) : (
          <div className="flex items-end justify-between gap-2" style={{ height: "160px" }}>
            {week.days.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5" style={{ height: "100%" }}>
                <span className="text-[10px] font-semibold" style={{ color: "var(--text-2)", lineHeight: 1 }}>
                  {d.total > 0 ? `${d.pct}%` : "—"}
                </span>
                {/* Track + fill */}
                <div className="flex-1 w-full flex flex-col justify-end rounded overflow-hidden"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <div
                    className="w-full rounded-md"
                    style={{
                      height: `${d.total === 0 ? 0 : Math.max(d.pct, 5)}%`,
                      background: d.total === 0 ? "transparent" : perfColor(d.pct),
                      transition: "height 0.35s cubic-bezier(0.2,0,0,1)",
                    }}
                    title={`${d.label}: ${d.done}/${d.total}`}
                  />
                </div>
                <span className="text-[10px] font-semibold"
                  style={{ color: d.isToday ? "var(--accent)" : "var(--text-2)", lineHeight: 1 }}>
                  {d.isToday ? "Today" : d.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>Week Summary</h3>
        <div className="space-y-3">
          <Row label="Avg score" value={week.avgPct === null ? "—" : `${week.avgPct}%`} valueColor="var(--accent)" />
          <Row label="Best day" value={week.bestDay ? `${week.bestDay.label} (${week.bestDay.pct}%)` : "—"} valueColor="var(--success)" />
          <Row label="Worst day" value={week.worstDay ? `${week.worstDay.label} (${week.worstDay.pct}%)` : "—"} valueColor="var(--danger)" />
          <Row label="Total blocks" value={String(week.totalBlocks)} />
        </div>
        {week.tagCounts.length > 0 && (
          <div>
            <h4 className="font-semibold text-xs mb-2 mt-4" style={{ color: "var(--text)" }}>Top tags this week</h4>
            <div className="flex flex-wrap gap-1.5">
              {week.tagCounts.slice(0, 6).map((t) => (
                <span key={t.name} className={`tag ${TAGS_CLASS_MAP[t.name] ?? "tag-personal"}`}>
                  {t.name} · {t.count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MonthView({ month, monthName, year }: { month: MonthStats; monthName: string; year: number }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 card p-6">
        <h3 className="font-semibold text-sm mb-4" style={{ color: "var(--text)" }}>
          {monthName} {year} — Heatmap
        </h3>
        {month.daysLogged === 0 ? (
          <EmptyMessage text="No blocks logged this month yet." />
        ) : (
          <>
            <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
              {month.days.map((d) => (
                <div key={d.date}
                  className="rounded flex items-center justify-center aspect-square text-[10px] font-semibold"
                  style={{
                    background: d.pct === null ? "transparent" : `rgba(34,197,94,${(0.18 + (d.pct / 100) * 0.82).toFixed(2)})`,
                    color: d.pct === null ? "transparent" : d.pct >= 45 ? "white" : "var(--success-text)",
                    border: d.pct === null ? "1px dashed var(--border)" : "none",
                  }}
                  title={`${d.date}${d.pct !== null ? ` · ${d.pct}%` : ""}`}>
                  {Number(d.date.split("-")[2])}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-4">
              <span className="text-[10px]" style={{ color: "var(--text-3)" }}>Less</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded" style={{ background: "rgba(34,197,94,.25)" }} />
                <div className="w-4 h-4 rounded" style={{ background: "rgba(34,197,94,.55)" }} />
                <div className="w-4 h-4 rounded" style={{ background: "rgba(34,197,94,1)" }} />
              </div>
              <span className="text-[10px]" style={{ color: "var(--text-3)" }}>More</span>
            </div>
          </>
        )}
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>{monthName} Summary</h3>
        <div className="space-y-3">
          <Row label="Avg score" value={month.avgPct === null ? "—" : `${month.avgPct}%`} valueColor="var(--accent)" />
          <Row label="Days logged" value={`${month.daysLogged} / ${month.totalDays}`} />
          <Row label="Best day" value={month.bestDay ? `${month.bestDay.date.split("-")[2]} (${month.bestDay.pct}%)` : "—"} valueColor="var(--success)" />
          <Row label="Worst day" value={month.worstDay ? `${month.worstDay.date.split("-")[2]} (${month.worstDay.pct}%)` : "—"} valueColor="var(--danger)" />
        </div>
      </div>
    </div>
  );
}

function YearView({ year, yearNum }: { year: YearStats; yearNum: number }) {
  return (
    <div className="card p-6">
      <h3 className="font-semibold text-sm mb-5" style={{ color: "var(--text)" }}>
        {yearNum} — Monthly Averages
      </h3>
      {year.totalBlocks === 0 ? (
        <EmptyMessage text="No blocks logged this year yet." />
      ) : (
        <>
          <div className="flex items-end justify-between gap-2" style={{ height: "160px" }}>
            {year.months.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5" style={{ height: "100%" }}>
                <span className="text-[10px] font-semibold" style={{ color: "var(--text-2)", lineHeight: 1 }}>
                  {m.avgPct !== null ? `${m.avgPct}%` : ""}
                </span>
                <div className="flex-1 w-full flex flex-col justify-end rounded overflow-hidden"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <div className="w-full rounded-md"
                    style={{
                      height: `${m.avgPct !== null ? Math.max(m.avgPct, 5) : 0}%`,
                      background: m.avgPct === null ? "transparent" : perfColor(m.avgPct),
                      transition: "height 0.35s cubic-bezier(0.2,0,0,1)",
                    }}
                    title={`${m.label}: ${m.total} blocks`} />
                </div>
                <span className="text-[10px]" style={{ color: "var(--text-2)", lineHeight: 1 }}>{m.label}</span>
              </div>
            ))}
          </div>
          {year.bestMonth && (
            <p className="text-xs mt-4" style={{ color: "var(--text-2)" }}>
              Best month: <strong style={{ color: "var(--text)" }}>{year.bestMonth.label}</strong> at{" "}
              <strong style={{ color: "var(--text)" }}>{year.bestMonth.avgPct}%</strong>. Total blocks:{" "}
              <strong style={{ color: "var(--text)" }}>{year.totalBlocks}</strong>.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: "var(--text-2)" }}>{label}</span>
      <span className="font-semibold" style={{ color: valueColor ?? "var(--text)" }}>{value}</span>
    </div>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 gap-3">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: "var(--accent-bg)" }}
      >
        <i className="fa-solid fa-chart-column" style={{ color: "var(--accent)", fontSize: 18 }}></i>
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>{text}</p>
      <Link href="/today" className="btn btn-primary text-xs">
        <i className="fa-solid fa-plus"></i> Plan a block
      </Link>
    </div>
  );
}

// Performance-based bar color: green (strong), amber (ok), red (poor).
function perfColor(pct: number): string {
  if (pct >= 80) return "var(--success)";
  if (pct >= 50) return "var(--warning)";
  return "var(--danger)";
}
