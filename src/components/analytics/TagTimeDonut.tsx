"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { TagTimeStats } from "@/lib/analytics-stats";

// Cohesive jewel-tone palette — vivid but harmonized (consistent
// saturation/lightness) so slices look designed, not like a rainbow.
const TAG_COLORS = [
  "#6366F1", // indigo (brand-aligned)
  "#06B6D4", // cyan
  "#F43F5E", // rose
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#10B981", // emerald
  "#3B82F6", // blue
  "#EC4899", // pink
];

function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function TagTimeDonut({
  tagTime,
  title = "Time by Tag",
  subtitle,
  layout = "row",
}: {
  tagTime: TagTimeStats;
  title?: string;
  subtitle?: string;
  layout?: "row" | "stack";
}) {
  const data = tagTime.tags.map((t, i) => ({
    name: `${t.emoji} ${t.name}`,
    value: t.minutes,
    color: TAG_COLORS[i % TAG_COLORS.length],
  }));

  const isRow = layout === "row";

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>
          {title}
          {subtitle && (
            <span className="font-normal" style={{ color: "var(--text-3)" }}>
              {" "}· {subtitle}
            </span>
          )}
        </h3>
        {tagTime.totalMinutes > 0 && (
          <span className="text-xs font-semibold" style={{ color: "var(--text-3)" }}>
            {fmtDuration(tagTime.totalMinutes)} total
          </span>
        )}
      </div>

      {tagTime.totalMinutes === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: "var(--text-3)" }}>
          No time blocks to break down yet.
        </p>
      ) : (
        <div
          className={
            isRow
              ? "grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
              : "flex flex-col gap-5"
          }
        >
          {/* Donut */}
          <div style={{ width: "100%", height: isRow ? 230 : 200, position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={isRow ? 62 : 55}
                  outerRadius={isRow ? 95 : 85}
                  paddingAngle={2}
                  stroke="var(--surface)"
                  strokeWidth={2}
                >
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => fmtDuration(Number(value) || 0)}
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  itemStyle={{ color: "var(--text)" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold" style={{ color: "var(--text)" }}>
                {fmtDuration(tagTime.totalMinutes)}
              </span>
              <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
                total
              </span>
            </div>
          </div>

          {/* Legend / breakdown */}
          <div className="space-y-2.5">
            {tagTime.tags.map((t, i) => (
              <div key={t.name} className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ background: TAG_COLORS[i % TAG_COLORS.length] }}
                />
                <span className="text-sm flex-1 min-w-0 truncate" style={{ color: "var(--text)" }}>
                  {t.emoji} {t.name}
                </span>
                <span className="text-sm font-semibold tabular" style={{ color: "var(--text)" }}>
                  {fmtDuration(t.minutes)}
                </span>
                <span className="text-xs tabular w-9 text-right" style={{ color: "var(--text-3)" }}>
                  {t.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
