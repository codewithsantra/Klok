"use client";

// ──────────────────────────────────────────────────────────────
// PlanVsRealityView
// ──────────────────────────────────────────────────────────────
// A side-by-side comparison of what was PLANNED at the start of
// the day vs what ACTUALLY HAPPENED (current state).
//
// CURRENT: derives reality from existing block/todo status. The
// "planned" snapshot is approximated from the same data — when
// you wire it up properly, you'll store a `plannedSnapshot` JSON
// on the block at creation time and read it here.
// ──────────────────────────────────────────────────────────────

type Tag = { id: string; name: string; emoji: string };
type Todo = {
  id: string;
  text: string;
  status: "PENDING" | "DONE" | "INCOMPLETE" | "SKIPPED";
};
type Block = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: "PLANNED" | "DONE" | "PARTIAL" | "SKIPPED";
  tag: Tag | null;
  todos: Todo[];
};

export function PlanVsRealityView({ blocks, isPastDate }: { blocks: Block[]; isPastDate?: boolean }) {
  // Compute summary stats
  const plannedBlocks = blocks.length;
  const completedBlocks = blocks.filter((b) => b.status === "DONE").length;
  const partialBlocks = blocks.filter((b) => b.status === "PARTIAL").length;
  const missedBlocks = blocks.filter(
    (b) => b.status === "PLANNED" || b.status === "SKIPPED",
  ).length;

  const plannedTodos = blocks.reduce((a, b) => a + b.todos.length, 0);
  const doneTodos = blocks.reduce(
    (a, b) => a + b.todos.filter((t) => t.status === "DONE").length,
    0,
  );
  const matchPct =
    plannedTodos > 0 ? Math.round((doneTodos / plannedTodos) * 100) : 0;

  if (blocks.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          No blocks to compare yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="card p-5">
        <div
          className="flex items-center justify-between mb-4"
          style={{ paddingBottom: 14, borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h2
              className="font-semibold mb-1"
              style={{ color: "var(--text)", fontSize: 16 }}
            >
              Plan vs Reality
            </h2>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>
              How today actually went compared to what you planned.
            </p>
          </div>
          <div className="text-right">
            <div
              className="text-3xl font-bold"
              style={{ color: "var(--text)", letterSpacing: "-0.02em" }}
            >
              {matchPct}%
            </div>
            <div className="text-[11px]" style={{ color: "var(--text-3)" }}>
              plan match
            </div>
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-4 gap-3">
          <StatCell
            label="Blocks planned"
            value={String(plannedBlocks)}
            color="var(--text)"
          />
          <StatCell
            label="Completed"
            value={String(completedBlocks)}
            color="var(--success)"
          />
          <StatCell
            label="Partial"
            value={String(partialBlocks)}
            color="var(--warning)"
          />
          <StatCell
            label="Missed"
            value={String(missedBlocks)}
            color="var(--danger)"
          />
        </div>
      </div>

      {/* Per-block comparison */}
      <div className="space-y-3">
        {blocks.map((b) => (
          <BlockCompare key={b.id} block={b} isPastDate={isPastDate} />
        ))}
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="text-center px-3 py-3 rounded-lg"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="text-2xl font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>
        {label}
      </div>
    </div>
  );
}

function BlockCompare({ block, isPastDate }: { block: Block; isPastDate?: boolean }) {
  const doneCount = block.todos.filter((t) => t.status === "DONE").length;
  const totalCount = block.todos.length;
  const incomplete = block.todos.filter((t) => t.status === "INCOMPLETE");

  const isMissed = isPastDate && block.status === "PLANNED";

  const statusColor =
    block.status === "DONE"
      ? "var(--success)"
      : block.status === "PARTIAL"
        ? "var(--warning)"
        : block.status === "SKIPPED" || isMissed
          ? "var(--danger)"
          : "var(--text-3)";

  const statusLabel = isMissed ? "MISSED" : block.status;

  return (
    <div className="card p-5">
      <div
        className="flex items-center justify-between"
        style={{ paddingBottom: 14, borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <div
            className="font-semibold text-sm"
            style={{ color: "var(--text)" }}
          >
            {block.tag?.emoji ?? "📌"} {block.title}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            {block.startTime} – {block.endTime}
          </div>
        </div>
        <div className="text-right">
          <div
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: statusColor }}
          >
            {statusLabel}
          </div>
        </div>
      </div>

      {/* Two columns: PLAN vs REALITY */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"
        style={{ alignItems: "start" }}
      >
        {/* PLAN */}
        <div>
          <div
            className="text-[11px] font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--text-3)", letterSpacing: "0.08em" }}
          >
            <i className="fa-solid fa-pen-to-square mr-1.5"></i> Plan
          </div>
          {totalCount === 0 ? (
            <div className="text-xs italic" style={{ color: "var(--text-3)" }}>
              No todos planned
            </div>
          ) : (
            <div className="space-y-1.5">
              {block.todos.map((t) => (
                <div
                  key={t.id}
                  className="text-sm py-1.5 px-2 rounded flex items-center gap-2"
                  style={{
                    color: "var(--text-2)",
                    background: "var(--surface-2)",
                  }}
                >
                  <span style={{ color: "var(--text-3)" }}>○</span>
                  {t.text}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* REALITY */}
        <div>
          <div
            className="text-[11px] font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--text-3)", letterSpacing: "0.08em" }}
          >
            <i className="fa-solid fa-clipboard-check mr-1.5"></i> Reality
          </div>
          {totalCount === 0 ? (
            <div className="text-xs italic" style={{ color: isMissed ? "var(--danger)" : "var(--text-3)" }}>
              {block.status === "DONE" ? "Block marked done" : isMissed ? "Not completed" : "Nothing logged"}
            </div>
          ) : (
            <div className="space-y-1.5">
              {block.todos.map((t) => {
                const isDone = t.status === "DONE";
                const isSkipped =
                  t.status === "INCOMPLETE" || t.status === "SKIPPED";
                const bg = isDone
                  ? "rgba(52,211,153,0.06)"
                  : isSkipped
                    ? "rgba(251,191,36,0.06)"
                    : "rgba(248,113,113,0.06)";
                const color = isDone
                  ? "var(--success)"
                  : isSkipped
                    ? "var(--warning)"
                    : "var(--danger)";
                const icon = isDone
                  ? "fa-check"
                  : isSkipped
                    ? "fa-ban"
                    : "fa-xmark";
                const label = isDone
                  ? "Done"
                  : isSkipped
                    ? "Skipped"
                    : "Missed";
                return (
                  <div
                    key={t.id}
                    className="text-sm py-1.5 px-2 rounded flex items-center justify-between gap-2"
                    style={{ background: bg, color: "var(--text)" }}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <i
                        className={`fa-solid ${icon}`}
                        style={{ color, fontSize: 11 }}
                      ></i>
                      <span style={{ textDecoration: isDone ? "line-through" : "none" }}>
                        {t.text}
                      </span>
                    </span>
                    <span
                      className="text-[10px] font-semibold uppercase flex-shrink-0"
                      style={{ color }}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Summary line */}
          {totalCount > 0 && (
            <div
              className="text-xs mt-3 pt-2"
              style={{
                color: "var(--text-3)",
                borderTop: "1px solid var(--border)",
              }}
            >
              {doneCount} of {totalCount} todos done
              {incomplete.length > 0 && ` · ${incomplete.length} skipped`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
