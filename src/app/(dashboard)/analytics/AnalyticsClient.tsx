"use client";

import Link from "next/link";
import { TagTimeDonut } from "@/components/analytics/TagTimeDonut";
import type {
  WeekStats,
  MonthStats,
  YearStats,
  TagTimeStats,
} from "@/lib/analytics-stats";

type TimerSessionView = {
  id: string;
  title: string;
  date: string;
  targetMinutes: number;
  tagName: string | null;
  tagEmoji: string | null;
  elapsedMs: number;
};

export default function AnalyticsClient({
  view, week, month, year, year_number, monthName, tagTime,
  prevPeriod, nextPeriod, periodLabel, disableNext,
  timerSessions, tab,
}: {
  view: "week" | "month" | "year";
  week: WeekStats | null; month: MonthStats | null; year: YearStats | null;
  year_number: number; monthName: string; tagTime: TagTimeStats;
  prevPeriod: string; nextPeriod: string; periodLabel: string; disableNext: boolean;
  timerSessions: TimerSessionView[];
  tab: "tasks" | "timer";
}) {
  const prevHref = `/analytics?view=${view}&period=${prevPeriod}&tab=${tab}`;
  const nextHref = `/analytics?view=${view}&period=${nextPeriod}&tab=${tab}`;

  // ── Task stats (from the Today's Log module) ──
  const avgPct =
    view === "week" ? week?.avgPct ?? null
    : view === "month" ? month?.avgPct ?? null
    : (() => {
        const pcts = year?.months.map((m) => m.avgPct).filter((p): p is number => p !== null) ?? [];
        return pcts.length ? Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length) : null;
      })();
  const tasksLogged =
    view === "week" ? week?.totalBlocks ?? 0
    : view === "year" ? year?.totalBlocks ?? 0
    : null; // month stats track days, not task counts

  // ── Focus Timer stats (from the Timer module) ──
  const focusElapsedMin = timerSessions.reduce((s, sess) => s + sess.elapsedMs / 60000, 0);
  const focusTargetMin = timerSessions.reduce((s, sess) => s + sess.targetMinutes, 0);
  const focusPct = focusTargetMin > 0
    ? Math.min(Math.round((focusElapsedMin / focusTargetMin) * 100), 100)
    : null;

  return (
    <div className="animate-fade-in">
      {/* Header row: title + period nav + view switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
        <h1 className="font-display text-2xl font-extrabold" style={{ color: "var(--text)" }}>
          Analytics
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Link href={prevHref}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <i className="fa-solid fa-chevron-left" style={{ fontSize: "10px", color: "var(--text-2)" }}></i>
            </Link>
            <span className="text-sm font-semibold whitespace-nowrap tabular" style={{ color: "var(--text)" }}>
              {periodLabel}
            </span>
            {disableNext ? (
              <span className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <i className="fa-solid fa-chevron-right" style={{ fontSize: "10px", color: "var(--text-3)" }}></i>
              </span>
            ) : (
              <Link href={nextHref}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <i className="fa-solid fa-chevron-right" style={{ fontSize: "10px", color: "var(--text-2)" }}></i>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-xl p-1 flex-shrink-0"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <Link href={`/analytics?view=week&tab=${tab}`} className={`a-tab ${view === "week" ? "a-tab-active" : ""}`}>Week</Link>
            <Link href={`/analytics?view=month&tab=${tab}`} className={`a-tab ${view === "month" ? "a-tab-active" : ""}`}>Month</Link>
            <Link href={`/analytics?view=year&tab=${tab}`} className={`a-tab ${view === "year" ? "a-tab-active" : ""}`}>Year</Link>
          </div>
        </div>
      </div>

      {/* ── Module tabs: Tasks | Focus Timer ── */}
      <div className="flex items-center gap-2 mb-5" role="tablist"
        style={{ borderBottom: "1px solid var(--border)" }}>
        {([
          { key: "tasks", icon: "fa-list-check", label: "Tasks" },
          { key: "timer", icon: "fa-stopwatch", label: "Focus Timer" },
        ] as const).map((t) => (
          <Link key={t.key} role="tab" aria-selected={tab === t.key}
            href={`/analytics?view=${view}&tab=${t.key}`}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{
              color: tab === t.key ? "var(--accent)" : "var(--text-3)",
              borderBottom: tab === t.key ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom: -1,
            }}>
            <i className={`fa-solid ${t.icon}`} style={{ fontSize: 12 }}></i>
            {t.label}
          </Link>
        ))}
      </div>

      {/* ════ TASKS tab — everything from Today's Log ════ */}
      {tab === "tasks" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 stagger">
            <StatTile icon="fa-check" iconBg="var(--success-bg)" iconColor="var(--success)"
              value={avgPct !== null ? `${avgPct}%` : "—"} label="Avg Completion" />
            <StatTile icon="fa-list-check" iconBg="var(--accent-bg)" iconColor="var(--accent)"
              value={tasksLogged !== null ? String(tasksLogged) : month ? `${month.daysLogged}/${month.totalDays}` : "—"}
              label={tasksLogged !== null ? "Tasks Logged" : "Days Logged"} />
            <StatTile icon="fa-clock" iconBg="var(--accent-bg)" iconColor="var(--accent)"
              value={tagTime.totalMinutes > 0 ? fmtMin(tagTime.totalMinutes) : "—"} label="Time Planned" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {view === "week" && week && week.totalBlocks > 0 && <CompletionChart week={week} />}
            {view === "month" && month && <MonthView month={month} monthName={monthName} year={year_number} />}
            {view === "year" && year && <YearView year={year} yearNum={year_number} />}
            {view === "week" && (!week || week.totalBlocks === 0) && (
              <EmptyMessage text="No tasks logged this week yet." />
            )}
            <TagTimeDonut tagTime={tagTime} subtitle={periodLabel} />
          </div>
        </>
      )}

      {/* ════ FOCUS TIMER tab — everything from the Timer module ════ */}
      {tab === "timer" && (
        timerSessions.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              No focus sessions in this period.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 stagger">
              <StatTile icon="fa-stopwatch" iconBg="var(--warning-bg)" iconColor="var(--warning)"
                value={fmtMin(focusElapsedMin)} label="Focus Time"
                sub={focusTargetMin > 0 ? `of ${fmtMin(focusTargetMin)} goal` : undefined} />
              <StatTile icon="fa-bullseye" iconBg="var(--accent-bg)" iconColor="var(--accent)"
                value={focusPct !== null ? `${focusPct}%` : "—"} label="Goal Progress" />
              <StatTile icon="fa-layer-group" iconBg="var(--accent-bg)" iconColor="var(--accent)"
                value={String(timerSessions.length)} label="Sessions" />
            </div>
            <TimerProgressView sessions={timerSessions} view={view} week={week} />
          </>
        )
      )}
    </div>
  );
}

// ── Stat Tile ────────────────────────────────────────
function StatTile({ icon, iconBg, iconColor, value, label, sub }: {
  icon: string; iconBg: string; iconColor: string; value: string; label: string; sub?: string;
}) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}>
        <i className={`fa-solid ${icon}`} style={{ color: iconColor, fontSize: 14 }}></i>
      </div>
      <div className="min-w-0">
        <div className="text-xl font-bold tabular truncate" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>
          {value}
        </div>
        <div className="text-[11px] font-medium truncate" style={{ color: "var(--text-3)" }}>
          {label}{sub ? <span style={{ color: "var(--text-3)", opacity: 0.8 }}> · {sub}</span> : null}
        </div>
      </div>
    </div>
  );
}

// ── Timer Progress View ─────────────────────────────
function TimerProgressView({ sessions, view, week }: {
  sessions: TimerSessionView[];
  view: string;
  week: WeekStats | null;
}) {
  const dates = [...new Set(sessions.map((s) => s.date))].sort();

  const dayData = (view === "week" && week ? week.days.map((d) => d.date) : dates).map((date) => {
    const daySessions = sessions.filter((s) => s.date === date);
    const target = daySessions.reduce((s, sess) => s + sess.targetMinutes, 0);
    const elapsed = daySessions.reduce((s, sess) => s + sess.elapsedMs / 60000, 0);
    const pct = target > 0 ? Math.min(Math.round((elapsed / target) * 100), 100) : 0;
    const dayLabel = new Date(date + "T00:00:00Z").toLocaleDateString("en", { weekday: "short" });
    const isToday = date === new Intl.DateTimeFormat("en-CA").format(new Date());
    return { date, label: dayLabel, target, elapsed, pct, count: daySessions.length, isToday };
  });

  const maxTarget = Math.max(...dayData.map((d) => d.target), 60);

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>Progress by Day</h3>
      </div>

      <div className="flex items-end justify-between gap-2" style={{ height: "160px" }}>
        {dayData.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5" style={{ height: "100%" }}>
            <span className="text-[10px] font-semibold" style={{ color: "var(--text-2)", lineHeight: 1 }}>
              {d.target > 0 ? `${d.pct}%` : "—"}
            </span>
            <div className="flex-1 w-full flex flex-col justify-end rounded overflow-hidden"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <div className="w-full rounded-md"
                style={{
                  height: `${d.target === 0 ? 0 : Math.max((d.target / maxTarget) * 100, 5)}%`,
                  background: d.target === 0 ? "transparent"
                    : d.pct >= 80 ? "var(--success)"
                    : d.pct >= 50 ? "var(--warning)"
                    : d.count > 0 ? "var(--accent)" : "var(--surface-2)",
                  opacity: d.pct >= 50 ? 1 : 0.6,
                  transition: "height 0.35s cubic-bezier(0.2,0,0,1)",
                }}
                title={`${d.label}: ${fmtMin(d.elapsed)} / ${fmtMin(d.target)}`} />
            </div>
            <span className="text-[10px] font-semibold"
              style={{ color: d.isToday ? "var(--accent)" : "var(--text-2)", lineHeight: 1 }}>
              {d.isToday ? "Today" : d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


// ── Completion Chart ──
function CompletionChart({ week }: { week: WeekStats }) {
  if (week.totalBlocks === 0) return <EmptyMessage text="No tasks logged this week yet." />;

  const bestDay = week.bestDay;
  const worstDay = week.worstDay;

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>Completion by Day</h3>
        <div className="flex flex-wrap gap-3">
          {bestDay && <StatChip label="Best" value={`${bestDay.label} ${bestDay.pct}%`} color="var(--success)" />}
          {worstDay && <StatChip label="Worst" value={`${worstDay.label} ${worstDay.pct}%`} color="var(--danger)" />}
          <StatChip label="Tasks" value={String(week.totalBlocks)} color="var(--text)" />
        </div>
      </div>

      <div className="flex items-end justify-between gap-2" style={{ height: "160px" }}>
        {week.days.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5" style={{ height: "100%" }}>
            <span className="text-[10px] font-semibold" style={{ color: "var(--text-2)", lineHeight: 1 }}>
              {d.total > 0 ? `${d.pct}%` : "—"}
            </span>
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
    </div>
  );
}

// ── Stat Chip ──
function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
      <span className="text-[10px] font-medium" style={{ color: "var(--text-3)" }}>{label}</span>
      <span className="text-xs font-bold" style={{ color }}>{value}</span>
    </div>
  );
}


// ── Month View ──
function MonthView({ month, monthName, year }: { month: MonthStats; monthName: string; year: number }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>
          {monthName} {year} — Heatmap
        </h3>
        {month.daysLogged > 0 && (
          <div className="flex gap-3">
            <StatChip label="Avg" value={month.avgPct !== null ? `${month.avgPct}%` : "—"} color="var(--accent)" />
            <StatChip label="Logged" value={`${month.daysLogged}/${month.totalDays}`} color="var(--text)" />
          </div>
        )}
      </div>
      {month.daysLogged === 0 ? (
        <EmptyMessage text="No tasks logged this month yet." />
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
  );
}

// ── Year View ──
function YearView({ year, yearNum }: { year: YearStats; yearNum: number }) {
  return (
    <div className="card p-6">
      <h3 className="font-semibold text-sm mb-5" style={{ color: "var(--text)" }}>
        {yearNum} — Monthly Averages
      </h3>
      {year.totalBlocks === 0 ? (
        <EmptyMessage text="No tasks logged this year yet." />
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
                    title={`${m.label}: ${m.total} tasks`} />
                </div>
                <span className="text-[10px]" style={{ color: "var(--text-2)", lineHeight: 1 }}>{m.label}</span>
              </div>
            ))}
          </div>
          {year.bestMonth && (
            <p className="text-xs mt-4" style={{ color: "var(--text-2)" }}>
              Best month: <strong style={{ color: "var(--text)" }}>{year.bestMonth.label}</strong> at{" "}
              <strong style={{ color: "var(--text)" }}>{year.bestMonth.avgPct}%</strong>. Total tasks:{" "}
              <strong style={{ color: "var(--text)" }}>{year.totalBlocks}</strong>.
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────

function fmtMin(m: number): string {
  const h = Math.floor(m / 60);
  const mm = Math.round(m % 60);
  return h > 0 ? `${h}h${mm > 0 ? ` ${mm}m` : ""}` : `${mm}m`;
}

function EmptyMessage({ text }: { text: string }) {
  return (
    <div className="card flex flex-col items-center justify-center text-center py-12 gap-3">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: "var(--accent-bg)" }}
      >
        <i className="fa-solid fa-chart-column" style={{ color: "var(--accent)", fontSize: 18 }}></i>
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>{text}</p>
      <Link href="/today" className="btn btn-primary text-xs">
        <i className="fa-solid fa-plus"></i> Add a task
      </Link>
    </div>
  );
}

function perfColor(pct: number): string {
  if (pct >= 80) return "var(--success)";
  if (pct >= 50) return "var(--warning)";
  return "var(--danger)";
}
