"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { stopRecurringSeriesAction } from "@/actions/recurring";
import { editBlockTodosAction } from "@/actions/todos";

type Tag = { id: string; name: string; emoji: string };

export type BlockInitial = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  tagId: string | null;
  recurrence?: string;
  recurringRuleId?: string | null;
  todos?: { id: string; text: string }[];
};

type RepeatKind = "NONE" | "DAILY" | "WEEKDAYS" | "WEEKLY" | "CUSTOM";
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function repeatLabel(r?: string): string {
  switch (r) {
    case "DAILY": return "every day";
    case "WEEKDAYS": return "on weekdays";
    case "WEEKLY": return "weekly";
    case "CUSTOM": return "on custom days";
    default: return "";
  }
}
type TodoDraft = { text: string };

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
  const [repeat, setRepeat] = useState<RepeatKind>("NONE");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [confirmStop, setConfirmStop] = useState(false);
  // Edit-mode todo management
  const [editTodos, setEditTodos] = useState<{ id?: string; text: string }[]>([]);
  const [todoScope, setTodoScope] = useState<"day" | "future">("day");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setConfirmStop(false);
    if (mode === "edit" && initial) {
      setTitle(initial.title);
      setDate(currentDateISO);
      setStartTime(initial.startTime);
      setEndTime(initial.endTime);
      setTagId(initial.tagId ?? tags[0]?.id ?? "");
      setTodos([{ text: "" }]);
      setRepeat("NONE");
      setDaysOfWeek([1, 2, 3, 4, 5]);
      setEditTodos(initial.todos ? initial.todos.map((t) => ({ id: t.id, text: t.text })) : []);
      setTodoScope("day");
    } else {
      setTitle("");
      setDate(currentDateISO);
      setStartTime("09:00");
      setEndTime("10:00");
      setTagId(tags[0]?.id ?? "");
      setTodos([{ text: "" }]);
      setRepeat("NONE");
      setDaysOfWeek([1, 2, 3, 4, 5]);
    }
  }, [open, mode, initial, currentDateISO, tags]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Require a tag (when the user has any) so blocks stay categorized.
    if (tags.length > 0 && !tagId) {
      setError("Please pick a tag.");
      return;
    }

    setSubmitting(true);

    const cleanTodos = todos
      .map((t) => ({ text: t.text.trim() }))
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
            ...(repeat !== "NONE" ? {
              repeat,
              daysOfWeek,
            } : {}),
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Could not create block");
          setSubmitting(false);
          return;
        }
        toast(repeat !== "NONE" ? "Recurring block created" : "Block added");
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
        // Reconcile todos (add/edit/delete), optionally to the whole series.
        await editBlockTodosAction(
          initial.id,
          editTodos.map((t) => ({ id: t.id, text: t.text })),
          !!initial.recurringRuleId && todoScope === "future",
        );
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

  async function handleStopRepeating() {
    if (!initial) return;
    setSubmitting(true);
    setError(null);
    try {
      await stopRecurringSeriesAction(initial.id);
      toast("Stopped repeating");
      router.refresh();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Could not stop the series. Try again.");
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
              Tag
            </label>
            <select
              className="inp"
              value={tagId}
              onChange={(e) => setTagId(e.target.value)}
              required
            >
              {/* Only offer "no tag" when the user has none yet — otherwise a
                  tag is required so analytics stay meaningful. */}
              {tags.length === 0 ? (
                <option value="">— No tags yet —</option>
              ) : (
                <option value="" disabled>
                  Select a tag…
                </option>
              )}
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.emoji} {t.name}
                </option>
              ))}
            </select>
          </div>

          {mode === "edit" && (
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text)" }}>
                Todos
              </label>
              {editTodos.length === 0 && (
                <p className="text-xs mb-2" style={{ color: "var(--text-3)" }}>
                  No todos yet.
                </p>
              )}
              <div className="space-y-2">
                {editTodos.map((td, i) => (
                  <div key={td.id ?? `new-${i}`} className="flex items-center gap-2">
                    <input
                      className="inp flex-1"
                      value={td.text}
                      onChange={(e) =>
                        setEditTodos((prev) =>
                          prev.map((x, idx) => (idx === i ? { ...x, text: e.target.value } : x)),
                        )
                      }
                      placeholder="Todo text..."
                      maxLength={300}
                    />
                    <button
                      type="button"
                      onClick={() => setEditTodos((prev) => prev.filter((_, idx) => idx !== i))}
                      className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                      title="Remove todo"
                    >
                      <i className="fa-solid fa-xmark text-xs" style={{ color: "var(--text-3)" }}></i>
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setEditTodos((prev) => [...prev, { text: "" }])}
                className="text-xs font-semibold flex items-center gap-1.5 hover:underline mt-3"
                style={{ color: "var(--accent)" }}
              >
                <i className="fa-solid fa-plus text-[10px]"></i> Add todo
              </button>

              {initial?.recurringRuleId && (
                <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <span className="block text-[11px] font-semibold mb-2" style={{ color: "var(--text-2)" }}>
                    Apply todo changes to:
                  </span>
                  <div className="flex gap-2">
                    {([
                      { v: "day", label: "This day only" },
                      { v: "future", label: "This + future days" },
                    ] as { v: "day" | "future"; label: string }[]).map((opt) => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setTodoScope(opt.v)}
                        className="text-[11px] font-medium px-2.5 py-1.5 rounded transition-colors"
                        style={{
                          background: todoScope === opt.v ? "var(--btn-primary-bg)" : "var(--surface)",
                          color: todoScope === opt.v ? "var(--btn-primary-text)" : "var(--text-2)",
                          border: "1px solid var(--border)",
                          cursor: "pointer",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {todoScope === "future" && (
                    <p className="text-[11px] mt-2" style={{ color: "var(--text-3)" }}>
                      <i className="fa-solid fa-circle-info mr-1"></i>
                      Updates the recurring template; future days regenerate with these todos.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {mode === "edit" && initial?.recurringRuleId && (
            <div
              className="rounded-lg p-3"
              style={{ background: "var(--accent-bg)", border: "1px solid rgba(94,106,210,.15)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <i className="fa-solid fa-rotate" style={{ color: "var(--accent)", fontSize: 12 }}></i>
                <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                  This block repeats{repeatLabel(initial.recurrence) ? ` ${repeatLabel(initial.recurrence)}` : ""}
                </span>
              </div>
              <p className="text-[11px] mb-2.5" style={{ color: "var(--text-3)" }}>
                New blocks are auto-created on future days. Stopping cancels the
                series — today and past days are kept.
              </p>
              {!confirmStop ? (
                <button
                  type="button"
                  onClick={() => setConfirmStop(true)}
                  disabled={submitting}
                  className="text-xs font-semibold px-3 py-1.5 rounded disabled:opacity-50"
                  style={{ color: "var(--danger)", background: "var(--danger-bg)", border: "1px solid rgba(220,38,38,.2)", cursor: "pointer" }}
                >
                  <i className="fa-solid fa-circle-stop mr-1.5"></i> Stop repeating
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[11px]" style={{ color: "var(--text-2)" }}>
                    Stop future blocks?
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfirmStop(false)}
                    disabled={submitting}
                    className="text-xs px-2.5 py-1 rounded disabled:opacity-50"
                    style={{ color: "var(--text-2)", background: "var(--surface)", border: "1px solid var(--border)", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleStopRepeating}
                    disabled={submitting}
                    className="text-xs font-semibold px-2.5 py-1 rounded disabled:opacity-50"
                    style={{ color: "#fff", background: "var(--danger)", border: "none", cursor: "pointer" }}
                  >
                    Stop
                  </button>
                </div>
              )}
            </div>
          )}

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
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="inp flex-1"
                      value={todo.text}
                      onChange={(e) =>
                        setTodos((prev) =>
                          prev.map((t, idx) => (idx === i ? { text: e.target.value } : t)),
                        )
                      }
                      placeholder="e.g. Study SQL, drink water..."
                      maxLength={300}
                    />
                    <button
                      type="button"
                      onClick={() => removeTodo(i)}
                      className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                    >
                      <i className="fa-solid fa-xmark text-xs" style={{ color: "var(--text-3)" }}></i>
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setTodos((prev) => [...prev, { text: "" }])}
                className="text-xs font-semibold flex items-center gap-1.5 hover:underline mt-3"
                style={{ color: "var(--accent)" }}
              >
                <i className="fa-solid fa-plus text-[10px]"></i> Add another todo
              </button>
            </div>
          )}

          {mode === "create" && (
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text)" }}>
                Repeat{" "}
                <span style={{ color: "var(--text-3)", fontWeight: 400 }}>(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {([
                  { v: "NONE", label: "Once" },
                  { v: "DAILY", label: "Every day" },
                  { v: "WEEKDAYS", label: "Weekdays" },
                  { v: "WEEKLY", label: "Weekly" },
                  { v: "CUSTOM", label: "Custom" },
                ] as { v: RepeatKind; label: string }[]).map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setRepeat(opt.v)}
                    className="text-[11px] font-medium px-2.5 py-1.5 rounded transition-colors"
                    style={{
                      background: repeat === opt.v ? "var(--btn-primary-bg)" : "var(--surface)",
                      color: repeat === opt.v ? "var(--btn-primary-text)" : "var(--text-2)",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {(repeat === "WEEKLY" || repeat === "CUSTOM") && (
                <div className="flex gap-2 mt-3">
                  {DAY_LABELS.map((d, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setDaysOfWeek((prev) =>
                          prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort(),
                        )
                      }
                      className="text-[11px] font-semibold rounded transition-colors"
                      style={{
                        width: 34, height: 34,
                        background: daysOfWeek.includes(i) ? "var(--btn-primary-bg)" : "var(--surface)",
                        color: daysOfWeek.includes(i) ? "var(--btn-primary-text)" : "var(--text-2)",
                        border: "1px solid var(--border)",
                        cursor: "pointer",
                      }}
                    >
                      {d.charAt(0)}
                    </button>
                  ))}
                </div>
              )}
              {repeat !== "NONE" && (
                <p className="text-[11px] mt-2" style={{ color: "var(--text-3)" }}>
                  <i className="fa-solid fa-circle-info mr-1"></i>
                  This block will automatically appear on matching days.
                </p>
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

