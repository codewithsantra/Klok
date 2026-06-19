"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

type Tag = { id: string; name: string; emoji: string };

export type BlockInitial = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  tagId: string | null;
};

// ── Todo draft state ────────────────────────────────────────
type MetricType = "TIME" | "DISTANCE" | "COUNT" | "CUSTOM";
type TodoDraft = {
  text: string;
  // Trackable goal — null/undefined for simple todos
  metric?: {
    type: MetricType;
    target: number;
    unit: string;
  };
};

// Default unit per metric type
function defaultUnit(type: MetricType): string {
  switch (type) {
    case "TIME":
      return "hrs";
    case "DISTANCE":
      return "km";
    case "COUNT":
      return "items";
    case "CUSTOM":
      return "";
  }
}

export default function BlockModal({
  open,
  onClose,
  mode,
  initial,
  tags,
  currentDateISO,
}: {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initial?: BlockInitial;
  tags: Tag[];
  currentDateISO: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(currentDateISO);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [tagId, setTagId] = useState<string>("");
  const [todos, setTodos] = useState<TodoDraft[]>([{ text: "" }]);
  const [blockTrack, setBlockTrack] = useState(false);
  const [blockMetricType, setBlockMetricType] = useState<MetricType>("TIME");
  const [blockMetricTarget, setBlockMetricTarget] = useState<number>(1);
  const [blockMetricUnit, setBlockMetricUnit] = useState("hrs");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === "edit" && initial) {
      setTitle(initial.title);
      setDate(currentDateISO);
      setStartTime(initial.startTime);
      setEndTime(initial.endTime);
      setTagId(initial.tagId ?? "");
      setTodos([{ text: "" }]);
      setBlockTrack(false);
      setBlockMetricType("TIME");
      setBlockMetricTarget(1);
      setBlockMetricUnit("hrs");
    } else {
      setTitle("");
      setDate(currentDateISO);
      setStartTime("09:00");
      setEndTime("10:00");
      setTagId("");
      setTodos([{ text: "" }]);
      setBlockTrack(false);
      setBlockMetricType("TIME");
      setBlockMetricTarget(1);
      setBlockMetricUnit("hrs");
    }
  }, [open, mode, initial, currentDateISO]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Send full todo drafts (text + optional metric) to the API.
    const cleanTodos = todos
      .map((t) => ({
        text: t.text.trim(),
        metric:
          t.metric && t.metric.target > 0
            ? {
                type: t.metric.type,
                target: t.metric.target,
                unit: t.metric.unit.trim() || defaultUnit(t.metric.type),
              }
            : null,
      }))
      .filter((t) => t.text);

    try {
      if (mode === "create") {
        const res = await fetch("/api/blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            startTime,
            endTime,
            tagId: tagId || null,
            date,
            todos: cleanTodos,
            ...(blockTrack ? {
              metricType: blockMetricType,
              metricTarget: blockMetricTarget,
              metricUnit: blockMetricUnit,
            } : {}),
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Could not create block");
          setSubmitting(false);
          return;
        }
        toast("Block added");
        if (date !== currentDateISO) router.push(`/today?date=${date}`);
        else router.refresh();
        onClose();
        return;
      } else if (mode === "edit" && initial) {
        const res = await fetch(`/api/blocks/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            startTime,
            endTime,
            tagId: tagId || null,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Could not update block");
          setSubmitting(false);
          return;
        }
      }
      toast("Block updated");
      router.refresh();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    if (!confirm("Delete this block and all its todos?")) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/blocks/${initial.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not delete");
        setSubmitting(false);
        return;
      }
      toast("Block deleted");
      router.refresh();
      onClose();
    } catch {
      setError("Network error. Try again.");
      setSubmitting(false);
    }
  }

  function updateTodo(i: number, patch: Partial<TodoDraft>) {
    setTodos((prev) =>
      prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)),
    );
  }

  function toggleTrack(i: number) {
    setTodos((prev) =>
      prev.map((t, idx) =>
        idx === i
          ? t.metric
            ? { ...t, metric: undefined }
            : {
                ...t,
                metric: {
                  type: "TIME",
                  target: 1,
                  unit: defaultUnit("TIME"),
                },
              }
          : t,
      ),
    );
  }

  function updateMetric(
    i: number,
    patch: Partial<NonNullable<TodoDraft["metric"]>>,
  ) {
    setTodos((prev) =>
      prev.map((t, idx) =>
        idx === i && t.metric
          ? { ...t, metric: { ...t.metric, ...patch } }
          : t,
      ),
    );
  }

  function removeTodo(i: number) {
    setTodos((prev) =>
      prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev,
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card modal-card w-full max-w-md animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head flex items-center justify-between p-5 md:p-6">
          <h2 className="font-semibold" style={{ color: "var(--text)" }}>
            {mode === "create" ? "Add Time Block" : "Edit Block"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center transition-colors"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
            }}
          >
            <i
              className="fa-solid fa-xmark text-sm"
              style={{ color: "var(--text-2)" }}
            ></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4 p-5 md:p-6">
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--text)" }}
            >
              Block Title
            </label>
            <input
              className="inp"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Study Time, Morning Routine..."
              required
            />
          </div>

          {mode === "create" && (
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: "var(--text)" }}
              >
                Date
              </label>
              <input
                className="inp"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: "var(--text)" }}
              >
                Start Time
              </label>
              <input
                className="inp"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: "var(--text)" }}
              >
                End Time
              </label>
              <input
                className="inp"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--text)" }}
            >
              Tag{" "}
              <span style={{ color: "var(--text-3)", fontWeight: 400 }}>
                (optional)
              </span>
            </label>
            <select
              className="inp"
              value={tagId}
              onChange={(e) => setTagId(e.target.value)}
            >
              <option value="">— No tag —</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.emoji} {t.name}
                </option>
              ))}
            </select>
          </div>

          {mode === "create" && (
            <div>
              <label
                className="block text-xs font-semibold mb-2"
                style={{ color: "var(--text)" }}
              >
                Todos{" "}
                <span style={{ color: "var(--text-3)", fontWeight: 400 }}>
                  (optional)
                </span>
              </label>
              <div className="space-y-2">
                {todos.map((todo, i) => (
                  <TodoDraftRow
                    key={i}
                    todo={todo}
                    onChangeText={(text) => updateTodo(i, { text })}
                    onToggleTrack={() => toggleTrack(i)}
                    onUpdateMetric={(patch) => updateMetric(i, patch)}
                    onRemove={() => removeTodo(i)}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  setTodos((prev) => [...prev, { text: "" }])
                }
                className="text-xs font-semibold flex items-center gap-1.5 hover:underline mt-3"
                style={{ color: "var(--accent)" }}
              >
                <i className="fa-solid fa-plus text-[10px]"></i> Add another
                todo
              </button>
            </div>
          )}

          {mode === "create" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold" style={{ color: "var(--text)" }}>
                  Block Tracker{" "}
                  <span style={{ color: "var(--text-3)", fontWeight: 400 }}>(optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setBlockTrack((v) => !v)}
                  className="rounded flex items-center gap-1.5 transition-colors text-xs font-semibold"
                  style={{
                    height: 30,
                    padding: "0 10px",
                    background: blockTrack ? "var(--btn-primary-bg)" : "var(--surface-2)",
                    color: blockTrack ? "var(--btn-primary-text)" : "var(--text-2)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                >
                  <i className={`fa-solid ${blockTrack ? "fa-check" : "fa-stopwatch"}`} style={{ fontSize: 11 }}></i>
                  {blockTrack ? "Enabled" : "Add Timer / Target"}
                </button>
              </div>
              {blockTrack && (
                <div className="rounded-lg p-3 space-y-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)" }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    {([
                      { v: "TIME" as MetricType, label: "Time", icon: "fa-clock" },
                      { v: "DISTANCE" as MetricType, label: "Distance", icon: "fa-route" },
                      { v: "COUNT" as MetricType, label: "Count", icon: "fa-hashtag" },
                      { v: "CUSTOM" as MetricType, label: "Custom", icon: "fa-pen" },
                    ]).map((opt) => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => {
                          setBlockMetricType(opt.v);
                          setBlockMetricUnit(defaultUnit(opt.v));
                        }}
                        className="text-[11px] font-medium px-2.5 py-1 rounded transition-colors"
                        style={{
                          background: blockMetricType === opt.v ? "var(--btn-primary-bg)" : "var(--surface)",
                          color: blockMetricType === opt.v ? "var(--btn-primary-text)" : "var(--text-2)",
                          border: "1px solid var(--border)",
                          cursor: "pointer",
                        }}
                      >
                        <i className={`fa-solid ${opt.icon} mr-1`}></i>{opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-medium" style={{ color: "var(--text-3)" }}>Target</label>
                    <input
                      type="number" step="0.25" min="0"
                      value={blockMetricTarget || ""}
                      onChange={(e) => setBlockMetricTarget(parseFloat(e.target.value) || 0)}
                      className="inp" style={{ width: 80, padding: "6px 10px", fontSize: 13 }}
                      placeholder="1"
                    />
                    <input
                      type="text"
                      value={blockMetricUnit}
                      onChange={(e) => setBlockMetricUnit(e.target.value)}
                      className="inp" style={{ width: 90, padding: "6px 10px", fontSize: 13 }}
                      placeholder="hrs / km"
                      maxLength={20}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          </div>{/* /modal-body */}

          <div className="modal-foot p-5 md:p-6 space-y-3">
          {error && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg"
              style={{
                background: "var(--danger-bg)",
                border: "1px solid rgba(220,38,38,.2)",
              }}
            >
              <i
                className="fa-solid fa-circle-exclamation text-sm"
                style={{ color: "var(--danger)" }}
              ></i>
              <span
                className="text-xs font-medium"
                style={{ color: "var(--danger)" }}
              >
                {error}
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            {mode === "edit" && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="btn btn-danger px-3 disabled:opacity-50"
              >
                <i className="fa-solid fa-trash"></i>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn btn-outline flex-1 justify-center disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary flex-1 justify-center disabled:opacity-50"
            >
              {submitting
                ? mode === "create"
                  ? "Adding..."
                  : "Saving..."
                : mode === "create"
                  ? "Add Block"
                  : "Save Changes"}
            </button>
          </div>
          </div>{/* /modal-foot */}
        </form>
      </div>
    </div>
  );
}

// ── Single todo draft row with optional inline metric panel ─
function TodoDraftRow({
  todo,
  onChangeText,
  onToggleTrack,
  onUpdateMetric,
  onRemove,
}: {
  todo: TodoDraft;
  onChangeText: (text: string) => void;
  onToggleTrack: () => void;
  onUpdateMetric: (patch: Partial<NonNullable<TodoDraft["metric"]>>) => void;
  onRemove: () => void;
}) {
  return (
    <div
      style={{
        border: todo.metric ? "1px solid var(--border-2)" : "none",
        borderRadius: 8,
        padding: todo.metric ? "8px" : "0",
        background: todo.metric ? "var(--surface-2)" : "transparent",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      <div className="flex items-center gap-2">
        <input
          className="inp flex-1"
          value={todo.text}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder="e.g. Study SQL, drink water..."
        />

        {/* Track toggle button */}
        <button
          type="button"
          onClick={onToggleTrack}
          className="rounded flex items-center justify-center gap-1.5 transition-colors flex-shrink-0 text-xs font-semibold"
          style={{
            height: 36,
            padding: "0 11px",
            background: todo.metric ? "var(--btn-primary-bg)" : "var(--surface-2)",
            color: todo.metric ? "var(--btn-primary-text)" : "var(--text-2)",
            border: "1px solid var(--border)",
            cursor: "pointer",
          }}
          title={todo.metric ? "Remove tracking" : "Add a timer or target to this todo"}
        >
          <i className={`fa-solid ${todo.metric ? "fa-check" : "fa-stopwatch"}`} style={{ fontSize: 12 }}></i>
          {todo.metric ? "Tracking" : "Track"}
        </button>

        {/* Remove */}
        <button
          type="button"
          onClick={onRemove}
          className="w-9 h-9 rounded flex items-center justify-center transition-colors flex-shrink-0"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
          }}
        >
          <i
            className="fa-solid fa-xmark text-xs"
            style={{ color: "var(--text-3)" }}
          ></i>
        </button>
      </div>

      {/* Inline metric panel (only when trackable) */}
      {todo.metric && (
        <div
          className="mt-2.5 pt-2.5"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {/* Type picker */}
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{
                color: "var(--text-3)",
                letterSpacing: "0.06em",
                marginRight: 4,
              }}
            >
              Track
            </span>
            {(
              [
                { v: "TIME", label: "Time", icon: "fa-clock" },
                { v: "DISTANCE", label: "Distance", icon: "fa-route" },
                { v: "COUNT", label: "Count", icon: "fa-hashtag" },
                { v: "CUSTOM", label: "Custom", icon: "fa-pen" },
              ] as { v: MetricType; label: string; icon: string }[]
            ).map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() =>
                  onUpdateMetric({
                    type: opt.v,
                    unit: defaultUnit(opt.v),
                  })
                }
                className="text-[11px] font-medium px-2.5 py-1 rounded transition-colors"
                style={{
                  background:
                    todo.metric?.type === opt.v
                      ? "var(--btn-primary-bg)"
                      : "var(--surface)",
                  color:
                    todo.metric?.type === opt.v
                      ? "var(--btn-primary-text)"
                      : "var(--text-2)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <i className={`fa-solid ${opt.icon} mr-1`}></i>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Target + Unit */}
          <div className="flex items-center gap-2">
            <label
              className="text-[11px] font-medium"
              style={{ color: "var(--text-3)" }}
            >
              Target
            </label>
            <input
              type="number"
              step="0.25"
              min="0"
              value={todo.metric.target || ""}
              onChange={(e) =>
                onUpdateMetric({
                  target: parseFloat(e.target.value) || 0,
                })
              }
              className="inp"
              style={{ width: 80, padding: "6px 10px", fontSize: 13 }}
              placeholder="8"
            />
            <input
              type="text"
              value={todo.metric.unit}
              onChange={(e) => onUpdateMetric({ unit: e.target.value })}
              className="inp"
              style={{ width: 90, padding: "6px 10px", fontSize: 13 }}
              placeholder="hrs / km / pgs"
              maxLength={20}
            />
            <span
              className="text-[11px]"
              style={{ color: "var(--text-3)", marginLeft: "auto" }}
            >
              {todo.metric.type === "TIME"
                ? "Use the timer or log manually"
                : "Log progress manually"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
