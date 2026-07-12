"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

type Tag = { id: string; name: string; emoji: string };

export type TaskInitial = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  tagId: string | null;
  note: string | null;
  recurrence?: string;
  recurringRuleId?: string | null;
};

type RepeatKind = "NONE" | "DAILY" | "WEEKDAYS" | "WEEKLY" | "CUSTOM";
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TaskModal({
  open, onClose, mode, initial, tags, currentDateISO, todayISO,
}: {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initial?: TaskInitial;
  tags: Tag[];
  currentDateISO: string;
  todayISO?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(currentDateISO);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [tagId, setTagId] = useState("");
  const [note, setNote] = useState("");
  const [repeat, setRepeat] = useState<RepeatKind>("NONE");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [repeatEvery, setRepeatEvery] = useState(1);
  const [repeatUnit, setRepeatUnit] = useState("week");
  const [repeatEndMode, setRepeatEndMode] = useState<"never" | "after" | "on">("never");
  const [repeatEndCount, setRepeatEndCount] = useState(10);
  const [repeatEndDate, setRepeatEndDate] = useState("");
  const [editScope, setEditScope] = useState<"this" | "future">("this");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === "edit" && initial) {
      setTitle(initial.title);
      setDate(currentDateISO);
      setStartTime(initial.startTime);
      setEndTime(initial.endTime);
      setTagId(initial.tagId ?? tags[0]?.id ?? "");
      setNote(initial.note ?? "");
      setRepeat((initial.recurrence as RepeatKind) ?? "NONE");
      setEditScope("this");
      setConfirmDelete(false);
    } else {
      setTitle("");
      setDate(currentDateISO);
      setStartTime("09:00");
      setEndTime("10:00");
      setTagId(tags[0]?.id ?? "");
      setNote("");
      setRepeat("NONE");
      setDaysOfWeek([1, 2, 3, 4, 5]);
      setRepeatEvery(1);
      setRepeatUnit("week");
      setRepeatEndMode("never");
      setRepeatEndCount(10);
      setRepeatEndDate("");
    }
  }, [open, mode, initial, currentDateISO, tags]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (tags.length > 0 && !tagId) { setError("Pick a tag."); return; }
    setSubmitting(true);

    try {
      if (mode === "create") {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title, startTime, endTime, tagId: tagId || null, date,
            note: note || null,
            recurrence: repeat,
            ...(repeat === "WEEKLY" || repeat === "CUSTOM" ? { daysOfWeek } : {}),
            ...(repeat === "CUSTOM" ? {
              repeatEvery, repeatUnit,
              ...(repeatEndMode === "after" ? { repeatEndCount } : {}),
              ...(repeatEndMode === "on" ? { repeatEndDate } : {}),
            } : {}),
          }),
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error ?? "Could not create task"); setSubmitting(false); return; }
        toast("Task added");
        if (date !== currentDateISO) router.push(`/today?date=${date}`);
        else router.refresh();
      } else if (initial) {
        const res = await fetch(`/api/tasks/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title, startTime, endTime, tagId: tagId || null, note: note || null,
            recurrence: repeat,
            ...(date !== currentDateISO ? { date } : {}),
            ...(repeat === "WEEKLY" || repeat === "CUSTOM" ? { daysOfWeek } : {}),
            ...(repeat === "CUSTOM" ? {
              repeatEvery, repeatUnit,
              ...(repeatEndMode === "after" ? { repeatEndCount } : {}),
              ...(repeatEndMode === "on" ? { repeatEndDate } : {}),
            } : {}),
            ...(initial.recurringRuleId || repeat !== "NONE" ? { editScope } : {}),
          }),
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error ?? "Could not update task"); setSubmitting(false); return; }
        if (date !== currentDateISO) {
          toast("Task moved");
          router.push(`/today?date=${date}`);
        } else {
          toast("Task updated");
          router.refresh();
        }
      }
      onClose();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${initial.id}`, { method: "DELETE" });
      if (!res.ok) { setError("Could not delete"); setSubmitting(false); return; }
      toast("Task deleted");
      router.refresh();
      onClose();
    } catch { setError("Network error."); setSubmitting(false); }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal-card w-full max-w-md animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head flex items-center justify-between p-5 md:p-6">
          <h2 className="font-semibold" style={{ color: "var(--text)" }}>
            {mode === "create" ? "Add Task" : "Edit Task"}
          </h2>
          <button type="button" onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <i className="fa-solid fa-xmark text-sm" style={{ color: "var(--text-2)" }}></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4 p-5 md:p-6">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text)" }}>Task Name</label>
              <input className="inp" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Study JavaScript, Morning Run..." required maxLength={200} />
            </div>

            {/* Tag */}
            {tags.length > 0 && (
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text)" }}>Tag</label>
                <select className="inp" value={tagId} onChange={(e) => setTagId(e.target.value)} required>
                  <option value="">Select tag...</option>
                  {tags.map((t) => <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}
                </select>
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text)" }}>Date</label>
              <input className="inp" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              {mode === "edit" && date !== currentDateISO && todayISO && currentDateISO < todayISO && (
                <p className="text-[11px] mt-1.5 flex items-start gap-1.5" style={{ color: "var(--warning)" }}>
                  <i className="fa-solid fa-triangle-exclamation mt-0.5" style={{ fontSize: 10 }}></i>
                  <span>
                    This <strong>moves</strong>{" "}the task and erases it from that day&apos;s log.{" "}
                    If you missed it, use &quot;Carry to today&quot; on the task instead.
                  </span>
                </p>
              )}
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text)" }}>Start Time</label>
                <input className="inp" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text)" }}>End Time</label>
                <input className="inp" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
            </div>

            {/* Repeat */}
            <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text)" }}>Repeat</label>
                <div className="flex flex-wrap gap-1.5">
                  {(["NONE", "DAILY", "WEEKLY", "CUSTOM"] as const).map((r) => (
                    <button key={r} type="button" onClick={() => setRepeat(r)}
                      className="text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
                      style={{
                        background: repeat === r ? "var(--accent)" : "var(--surface-2)",
                        color: repeat === r ? "white" : "var(--text-2)",
                        border: repeat === r ? "1px solid var(--accent)" : "1px solid var(--border)",
                        cursor: "pointer",
                      }}>
                      {r === "NONE" ? "Once" : r === "DAILY" ? "Daily" : r === "WEEKLY" ? "Weekly" : "Custom"}
                    </button>
                  ))}
                </div>

                {/* Weekly day picker */}
                {(repeat === "WEEKLY" || repeat === "CUSTOM") && (
                  <>
                    <div className="flex gap-1 mt-2">
                      {DAY_LABELS.map((label, i) => (
                        <button key={i} type="button"
                          onClick={() => setDaysOfWeek((prev) =>
                            prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]
                          )}
                          className="w-8 h-8 rounded-full text-[10px] font-semibold transition-colors"
                          style={{
                            background: daysOfWeek.includes(i) ? "var(--accent)" : "var(--surface-2)",
                            color: daysOfWeek.includes(i) ? "white" : "var(--text-3)",
                            border: "1px solid " + (daysOfWeek.includes(i) ? "var(--accent)" : "var(--border)"),
                            cursor: "pointer",
                          }}>
                          {label}
                        </button>
                      ))}
                    </div>
                    {daysOfWeek.length > 0 && !daysOfWeek.includes(new Date(date + "T00:00:00").getDay()) && (
                      <p className="text-[11px] mt-2 flex items-start gap-1.5" style={{ color: "var(--warning)" }}>
                        <i className="fa-solid fa-circle-info mt-0.5" style={{ fontSize: 10 }}></i>
                        <span>
                          {`${new Date(date + "T00:00:00").toLocaleDateString("en", { weekday: "long" })} isn't a selected day — the first task will be created on the next selected day instead.`}
                        </span>
                      </p>
                    )}
                  </>
                )}

                {/* Custom repeat options */}
                {repeat === "CUSTOM" && (
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "var(--text-2)" }}>Every</span>
                      <input type="number" min={1} max={99} value={repeatEvery}
                        onChange={(e) => setRepeatEvery(Number(e.target.value))}
                        className="inp w-16" style={{ fontSize: 12, padding: "4px 8px" }} />
                      <select className="inp" value={repeatUnit} onChange={(e) => setRepeatUnit(e.target.value)}
                        style={{ fontSize: 12, padding: "4px 8px" }}>
                        <option value="day">Day(s)</option>
                        <option value="week">Week(s)</option>
                        <option value="month">Month(s)</option>
                        <option value="year">Year(s)</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>Ends</span>
                      <div className="flex flex-col gap-1.5 mt-1">
                        <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--text-2)" }}>
                          <input type="radio" name="endMode" checked={repeatEndMode === "never"}
                            onChange={() => setRepeatEndMode("never")} /> Never
                        </label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--text-2)" }}>
                          <input type="radio" name="endMode" checked={repeatEndMode === "after"}
                            onChange={() => setRepeatEndMode("after")} /> After
                          {repeatEndMode === "after" && (
                            <input type="number" min={1} value={repeatEndCount}
                              onChange={(e) => setRepeatEndCount(Number(e.target.value))}
                              className="inp w-16" style={{ fontSize: 12, padding: "4px 8px" }} />
                          )}
                          {repeatEndMode === "after" && <span>times</span>}
                        </label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--text-2)" }}>
                          <input type="radio" name="endMode" checked={repeatEndMode === "on"}
                            onChange={() => setRepeatEndMode("on")} /> On date
                          {repeatEndMode === "on" && (
                            <input type="date" value={repeatEndDate}
                              onChange={(e) => setRepeatEndDate(e.target.value)}
                              className="inp" style={{ fontSize: 12, padding: "4px 8px" }} />
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            {/* Edit scope for recurring */}
            {mode === "edit" && (initial?.recurringRuleId || repeat !== "NONE") && (
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text)" }}>Apply changes to</label>
                <div className="flex gap-2">
                  {(["this", "future"] as const).map((s) => (
                    <button key={s} type="button" onClick={() => setEditScope(s)}
                      className="text-xs px-3 py-1.5 rounded-md font-medium"
                      style={{
                        background: editScope === s ? "var(--accent)" : "var(--surface-2)",
                        color: editScope === s ? "white" : "var(--text-2)",
                        border: editScope === s ? "1px solid var(--accent)" : "1px solid var(--border)",
                        cursor: "pointer",
                      }}>
                      {s === "this" ? "Only this task" : "This & future tasks"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-xs font-medium" style={{ color: "var(--danger)" }}>{error}</p>}
          </div>

          <div className="modal-foot flex items-center gap-3 p-5 md:p-6"
            style={{ borderTop: "1px solid var(--border)" }}>
            {mode === "edit" && !confirmDelete && (
              <button type="button" onClick={() => setConfirmDelete(true)} disabled={submitting}
                className="btn btn-outline" style={{ fontSize: 12, color: "var(--danger)" }}>
                <i className="fa-solid fa-trash"></i> Delete
              </button>
            )}
            {mode === "edit" && confirmDelete && (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--danger)" }}>Sure?</span>
                <button type="button" onClick={handleDelete}
                  className="text-xs font-semibold px-2 py-1 rounded"
                  style={{ background: "var(--danger)", color: "white", border: "none", cursor: "pointer" }}>Yes</button>
                <button type="button" onClick={() => setConfirmDelete(false)}
                  className="text-xs px-2 py-1 rounded"
                  style={{ background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)", cursor: "pointer" }}>No</button>
              </div>
            )}
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ fontSize: 12 }}>Cancel</button>
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ fontSize: 12 }}>
              {submitting ? "Saving..." : mode === "create" ? "Add Task" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
