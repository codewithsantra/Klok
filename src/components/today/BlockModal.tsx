"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Tag = { id: string; name: string; emoji: string };

export type BlockInitial = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  tagId: string | null;
};

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
  const [todos, setTodos] = useState<string[]>([""]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset / populate fields when the modal opens
  useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === "edit" && initial) {
      setTitle(initial.title);
      setDate(currentDateISO); // Edit mode doesn't change date
      setStartTime(initial.startTime);
      setEndTime(initial.endTime);
      setTagId(initial.tagId ?? "");
      // Existing todos are managed inline on the timeline, not in this modal.
      setTodos([""]);
    } else {
      setTitle("");
      setDate(currentDateISO);
      setStartTime("09:00");
      setEndTime("10:00");
      setTagId("");
      setTodos([""]);
    }
  }, [open, mode, initial, currentDateISO]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const cleanTodos = todos.map((t) => t.trim()).filter(Boolean);

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
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Could not create block");
          setSubmitting(false);
          return;
        }
        // If user picked a different date, jump there so they see the new block
        if (date !== currentDateISO) {
          router.push(`/today?date=${date}`);
        } else {
          router.refresh();
        }
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
      const res = await fetch(`/api/blocks/${initial.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not delete");
        setSubmitting(false);
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("Network error. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card p-5 md:p-6 w-full max-w-md animate-fade-in"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-[#1A1A2E]">
            {mode === "create" ? "Add Time Block" : "Edit Block"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 bg-[#F3F4F6] rounded-xl flex items-center justify-center hover:bg-[#FEE2E2]"
          >
            <i className="fa-solid fa-xmark text-[#6B7280] text-sm"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5">
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
              <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5">
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
              <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5">
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
              <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5">
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
            <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5">
              Tag (optional)
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
              <label className="block text-xs font-semibold text-[#1A1A2E] mb-2">
                Todos{" "}
                <span className="text-[#9CA3AF] font-normal">(optional)</span>
              </label>
              <div className="space-y-2">
                {todos.map((todo, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="inp flex-1"
                      style={{ padding: "8px 12px" }}
                      value={todo}
                      onChange={(e) =>
                        setTodos((prev) =>
                          prev.map((t, idx) => (idx === i ? e.target.value : t)),
                        )
                      }
                      placeholder="e.g. Brush teeth, drink water..."
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setTodos((prev) =>
                          prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev,
                        )
                      }
                      className="w-7 h-7 bg-[#F3F4F6] rounded-lg flex items-center justify-center hover:bg-[#FEE2E2] flex-shrink-0"
                    >
                      <i className="fa-solid fa-xmark text-[#9CA3AF] text-xs"></i>
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setTodos((prev) => [...prev, ""])}
                className="text-xs text-[#6C6FDF] font-semibold flex items-center gap-1.5 hover:underline mt-2"
              >
                <i className="fa-solid fa-plus text-[10px]"></i> Add another todo
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-[#FFF5F5] rounded-xl border border-[#FEE2E2]">
              <i className="fa-solid fa-circle-exclamation text-[#DC2626] text-sm"></i>
              <span className="text-xs text-[#DC2626] font-medium">{error}</span>
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
              className="btn btn-ghost flex-1 justify-center border border-[#E5E7EB] disabled:opacity-50"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary flex-1 justify-center disabled:opacity-50"
              style={{ flex: 1 }}
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
        </form>
      </div>
    </div>
  );
}
