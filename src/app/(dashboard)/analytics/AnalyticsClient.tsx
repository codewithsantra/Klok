"use client";

import Link from "next/link";
import type {
  WeekStats,
  MonthStats,
  YearStats,
} from "@/lib/analytics-stats";

const TAGS_CLASS_MAP: Record<string, string> = {
  Study: "tag-study",
  Work: "tag-work",
  Sleep: "tag-sleep",
  Exercise: "tag-health",
  Personal: "tag-personal",
  Breakfast: "tag-meal",
  Lunch: "tag-meal",
  Dinner: "tag-meal",
  Break: "tag-break",
};

export default function AnalyticsClient({
  view,
  week,
  month,
  year,
  year_number,
  monthName,
  prevPeriod,
  nextPeriod,
  periodLabel,
  disableNext,
}: {
  view: "week" | "month" | "year";
  week: WeekStats | null;
  month: MonthStats | null;
  year: YearStats | null;
  year_number: number;
  monthName: string;
  prevPeriod: string;
  nextPeriod: string;
  periodLabel: string;
  disableNext: boolean;
}) {
  const prevHref = `/analytics?view=${view}&period=${prevPeriod}`;
  const nextHref = `/analytics?view=${view}&period=${nextPeriod}`;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <h1 className="text-xl font-extrabold text-[#1A1A2E]">Analytics</h1>
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm overflow-x-auto flex-shrink-0">
          <Link
            href="/analytics?view=week"
            className={`a-tab ${view === "week" ? "a-tab-active" : ""}`}
          >
            Week
          </Link>
          <Link
            href="/analytics?view=month"
            className={`a-tab ${view === "month" ? "a-tab-active" : ""}`}
          >
            Month
          </Link>
          <Link
            href="/analytics?view=year"
            className={`a-tab ${view === "year" ? "a-tab-active" : ""}`}
          >
            Year
          </Link>
        </div>
      </div>

      {/* Period nav (prev / current label / next) */}
      <div className="flex items-center gap-2 mb-5">
        <Link
          href={prevHref}
          className="w-7 h-7 bg-white rounded-xl flex items-center justify-center shadow-sm hover:bg-[#EEEEFF]"
          title="Previous"
        >
          <i
            className="fa-solid fa-chevron-left text-[#6B7280]"
            style={{ fontSize: "10px" }}
          ></i>
        </Link>
        <span className="text-sm font-bold text-[#1A1A2E] flex-1 sm:flex-none">
          {periodLabel}
        </span>
        {disableNext ? (
          <span
            className="w-7 h-7 bg-[#F3F4F6] rounded-xl flex items-center justify-center"
            title="No future data"
          >
            <i
              className="fa-solid fa-chevron-right text-[#D1D5DB]"
              style={{ fontSize: "10px" }}
            ></i>
          </span>
        ) : (
          <Link
            href={nextHref}
            className="w-7 h-7 bg-white rounded-xl flex items-center justify-center shadow-sm hover:bg-[#EEEEFF]"
            title="Next"
          >
            <i
              className="fa-solid fa-chevron-right text-[#6B7280]"
              style={{ fontSize: "10px" }}
            ></i>
          </Link>
        )}
      </div>

      {view === "week" && week && <WeekView week={week} />}
      {view === "month" && month && (
        <MonthView month={month} monthName={monthName} year={year_number} />
      )}
      {view === "year" && year && <YearView year={year} yearNum={year_number} />}
    </div>
  );
}

function WeekView({ week }: { week: WeekStats }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 card p-6">
        <h3 className="font-bold text-sm text-[#1A1A2E] mb-5">
          Last 7 Days — Completion %
        </h3>
        {week.totalBlocks === 0 ? (
          <EmptyMessage text="No blocks logged this week yet." />
        ) : (
          <div className="flex items-end justify-between gap-2 h-40">
            {week.days.map((d) => (
              <div
                key={d.date}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <span className="text-[10px] font-bold text-[#6B7280]">
                  {d.total > 0 ? `${d.pct}%` : "—"}
                </span>
                <div
                  className="w-full rounded-lg"
                  style={{
                    height: `${Math.max(d.pct * 1.2, 4)}px`,
                    background:
                      d.total === 0
                        ? "#F3F4F6"
                        : d.pct >= 80
                          ? "#6C6FDF"
                          : d.pct >= 60
                            ? "#9B9EEF"
                            : "#EEEEFF",
                  }}
                  title={`${d.label}: ${d.done}/${d.total}`}
                />
                <span
                  className={`text-xs font-semibold ${
                    d.isToday ? "text-[#6C6FDF]" : "text-[#6B7280]"
                  }`}
                >
                  {d.isToday ? "Today" : d.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="font-bold text-sm text-[#1A1A2E]">Week Summary</h3>
        <div className="space-y-3">
          <Row label="Avg score" value={week.avgPct === null ? "—" : `${week.avgPct}%`} valueColor="#6C6FDF" />
          <Row
            label="Best day"
            value={
              week.bestDay
                ? `${week.bestDay.label} (${week.bestDay.pct}%)`
                : "—"
            }
            valueColor="#15803D"
          />
          <Row
            label="Worst day"
            value={
              week.worstDay
                ? `${week.worstDay.label} (${week.worstDay.pct}%)`
                : "—"
            }
            valueColor="#DC2626"
          />
          <Row label="Total blocks" value={String(week.totalBlocks)} />
        </div>

        {week.tagCounts.length > 0 && (
          <div>
            <h4 className="font-bold text-xs text-[#1A1A2E] mb-2 mt-4">
              Top tags this week
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {week.tagCounts.slice(0, 6).map((t) => (
                <span
                  key={t.name}
                  className={`tag ${TAGS_CLASS_MAP[t.name] ?? "tag-personal"}`}
                >
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

function MonthView({
  month,
  monthName,
  year,
}: {
  month: MonthStats;
  monthName: string;
  year: number;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 card p-6">
        <h3 className="font-bold text-sm text-[#1A1A2E] mb-4">
          {monthName} {year} — Heatmap
        </h3>
        {month.daysLogged === 0 ? (
          <EmptyMessage text="No blocks logged this month yet." />
        ) : (
          <>
            <div
              className="grid gap-1.5"
              style={{ gridTemplateColumns: "repeat(7, 1fr)" }}
            >
              {month.days.map((d) => (
                <div
                  key={d.date}
                  className="rounded-xl flex items-center justify-center aspect-square text-[10px] font-bold"
                  style={{
                    background:
                      d.pct === null
                        ? "transparent"
                        : d.pct >= 80
                          ? "#6C6FDF"
                          : d.pct >= 60
                            ? "#9B9EEF"
                            : "#EEEEFF",
                    color:
                      d.pct === null
                        ? "transparent"
                        : d.pct >= 80
                          ? "white"
                          : d.pct >= 60
                            ? "#5558CC"
                            : "#9CA3AF",
                    border: d.pct === null ? "1px dashed #E5E7EB" : "none",
                  }}
                  title={d.date}
                >
                  {Number(d.date.split("-")[2])}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-4">
              <span className="text-[10px] text-[#9CA3AF]">Less</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded" style={{ background: "#EEEEFF" }} />
                <div className="w-4 h-4 rounded" style={{ background: "#9B9EEF" }} />
                <div className="w-4 h-4 rounded" style={{ background: "#6C6FDF" }} />
              </div>
              <span className="text-[10px] text-[#9CA3AF]">More</span>
            </div>
          </>
        )}
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="font-bold text-sm text-[#1A1A2E]">{monthName} Summary</h3>
        <div className="space-y-3">
          <Row label="Avg score" value={month.avgPct === null ? "—" : `${month.avgPct}%`} valueColor="#6C6FDF" />
          <Row label="Days logged" value={`${month.daysLogged} / ${month.totalDays}`} />
          <Row
            label="Best day"
            value={
              month.bestDay
                ? `${month.bestDay.date.split("-")[2]} (${month.bestDay.pct}%)`
                : "—"
            }
            valueColor="#15803D"
          />
          <Row
            label="Worst day"
            value={
              month.worstDay
                ? `${month.worstDay.date.split("-")[2]} (${month.worstDay.pct}%)`
                : "—"
            }
            valueColor="#DC2626"
          />
        </div>
      </div>
    </div>
  );
}

function YearView({
  year,
  yearNum,
}: {
  year: YearStats;
  yearNum: number;
}) {
  return (
    <div className="card p-6">
      <h3 className="font-bold text-sm text-[#1A1A2E] mb-5">
        {yearNum} — Monthly Averages
      </h3>

      {year.totalBlocks === 0 ? (
        <EmptyMessage text="No blocks logged this year yet." />
      ) : (
        <>
          <div className="flex items-end justify-between gap-2 h-40">
            {year.months.map((m) => (
              <div
                key={m.label}
                className="flex-1 flex flex-col items-center gap-1"
              >
                {m.avgPct !== null && (
                  <span className="text-[10px] font-bold text-[#6B7280]">
                    {m.avgPct}%
                  </span>
                )}
                <div
                  className="w-full rounded-lg"
                  style={{
                    height: `${Math.max((m.avgPct ?? 8) * 1.2, 4)}px`,
                    background: m.avgPct === null ? "#F3F4F6" : "#6C6FDF",
                  }}
                  title={`${m.label}: ${m.total} blocks`}
                />
                <span className="text-[10px] text-[#6B7280]">{m.label}</span>
              </div>
            ))}
          </div>
          {year.bestMonth && (
            <p className="text-xs text-[#6B7280] mt-4">
              Best month so far: <strong>{year.bestMonth.label}</strong> at{" "}
              <strong>{year.bestMonth.avgPct}%</strong>. Total blocks logged:{" "}
              <strong>{year.totalBlocks}</strong>.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[#6B7280]">{label}</span>
      <span className="font-bold" style={{ color: valueColor ?? "#1A1A2E" }}>
        {value}
      </span>
    </div>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return <p className="text-sm text-[#9CA3AF] text-center py-8">{text}</p>;
}
