"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createRecurringRuleAction,
  updateRecurringRuleAction,
  toggleRecurringRuleAction,
  deleteRecurringRuleAction,
  type RuleInput,
} from "@/actions/recurring";

// ──────────────────────────────────────────────────────────────
// RecurringClient — full UI for recurring rules (wired to DB)
// ──────────────────────────────────────────────────────────────

type Recurrence = "DAILY" | "WEEKDAYS" | "WEEKLY" | "CUSTOM";
type TagOption = { id: string; name: string; emoji: string };

export type RuleData = {
  id: string;
  name: string;
  emoji: string;
  tagId: string | null;
  tagName: string;
  startTime: string;
  endTime: string;
  recurrence: Recurrence;
  daysOfWeek: number[];
  active: boolean;
  todos: string[];
  todosCount: number;
  nextRun: string;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function recurrenceText(rule: RuleData): string {
  if (rule.recurrence === "DAILY") return "Every day";
  if (rule.recurrence === "WEEKDAYS") return "Weekdays (Mon–Fri)";
  if (rule.recurrence === "WEEKLY") {
    const d = rule.daysOfWeek.map((i) => DAY_LABELS[i]).join(", ");
    return `Weekly · ${d}`;
  }
  return rule.daysOfWeek.map((i) => DAY_LABELS[i]).join(", ");
}

export default function RecurringClient({
  initialRules,
  tags,
}: {
  initialRules: RuleData[];
  tags: TagOption[];
}) {
  const router = useRouter();
  const [rules, setRules] = useState<RuleData[]>(initialRules);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RuleData | null>(null);
  const [, startTx] = useTransition();

  const activeCount = rules.filter((r) => r.active).length;
  const totalRules = rules.length;

  function handleToggle(id: string) {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)),
    );
    startTx(async () => {
      await toggleRecurringRuleAction(id);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
    startTx(async () => {
      await deleteRecurringRuleAction(id);
      router.refresh();
    });
  }

  function handleOpenCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function handleOpenEdit(rule: RuleData) {
    setEditing(rule);
    setModalOpen(true);
  }

  async function handleSaveRule(id: string, input: RuleInput) {
    const result = id
      ? await updateRecurringRuleAction(id, input)
      : await createRecurringRuleAction(input);
    if (result && "error" in result && result.error) {
      throw new Error(result.error);
    }
    setModalOpen(false);
    router.refresh();
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
        <div>
          <h1
            className="font-display text-2xl font-extrabold"
            style={{ color: "var(--text)" }}
          >
            Recurring Blocks
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
            Schedule blocks to repeat daily, weekly, or on custom days.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn btn-primary"
          style={{ fontSize: "13px" }}
        >
          <i className="fa-solid fa-plus"></i> New Rule
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-5">
        <StatCard label="Total rules" value={String(totalRules)} />
        <StatCard
          label="Active"
          value={String(activeCount)}
          accent="var(--success)"
        />
        <StatCard
          label="Paused"
          value={String(totalRules - activeCount)}
          accent="var(--text-3)"
        />
      </div>

      {/* Rule list */}
      {rules.length === 0 ? (
        <EmptyState onCreate={handleOpenCreate} />
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onToggle={() => handleToggle(rule.id)}
              onEdit={() => handleOpenEdit(rule)}
              onDelete={() => handleDelete(rule.id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <RuleModal
          initial={editing}
          tags={tags}
          onSave={handleSaveRule}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────
function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div
      className="card p-4 flex items-center justify-between"
      style={{ minHeight: 62 }}
    >
      <span className="text-xs" style={{ color: "var(--text-3)" }}>
        {label}
      </span>
      <span
        className="text-2xl font-bold"
        style={{
          color: accent ?? "var(--text)",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="card p-12 text-center">
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3"
        style={{ background: "var(--surface-2)" }}
      >
        <i
          className="fa-solid fa-rotate"
          style={{ color: "var(--text-2)", fontSize: "18px" }}
        ></i>
      </div>
      <p className="text-base font-semibold" style={{ color: "var(--text)" }}>
        No recurring rules yet
      </p>
      <p
        className="text-sm mt-1 mb-5 max-w-md mx-auto"
        style={{ color: "var(--text-3)" }}
      >
        Set up blocks that automatically appear every day, every weekday, or on
        specific days of the week.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="btn btn-primary"
        style={{ fontSize: "12px" }}
      >
        <i className="fa-solid fa-plus"></i> Create Your First Rule
      </button>
    </div>
  );
}

// ── Rule card ────────────────────────────────────────────────
function RuleCard({
  rule,
  onToggle,
  onEdit,
  onDelete,
}: {
  rule: RuleData;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirmDel, setConfirmDel] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="card p-5"
      style={{
        position: "relative",
        opacity: rule.active ? 1 : 0.65,
        transition: "opacity 0.15s",
      }}
    >
      <div className="flex items-start gap-4">
        {/* Emoji icon */}
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: "var(--surface-2)",
            fontSize: 20,
          }}
        >
          {rule.emoji}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3
              className="font-semibold"
              style={{ color: "var(--text)", fontSize: 15 }}
            >
              {rule.name}
            </h3>
            <span
              className="text-[11px] font-medium px-2 py-0.5 rounded"
              style={{
                background: "var(--surface-2)",
                color: "var(--text-2)",
                border: "1px solid var(--border)",
              }}
            >
              {rule.tagName}
            </span>
            {!rule.active && (
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded"
                style={{
                  background: "rgba(248,113,113,0.08)",
                  color: "var(--danger)",
                  border: "1px solid rgba(248,113,113,0.2)",
                }}
              >
                Paused
              </span>
            )}
          </div>

          <div
            className="flex items-center gap-x-4 gap-y-1 flex-wrap text-xs"
            style={{ color: "var(--text-2)" }}
          >
            <span>
              <i
                className="fa-solid fa-clock mr-1.5"
                style={{ opacity: 0.6 }}
              ></i>
              {rule.startTime} – {rule.endTime}
            </span>
            <span>
              <i
                className="fa-solid fa-repeat mr-1.5"
                style={{ opacity: 0.6 }}
              ></i>
              {recurrenceText(rule)}
            </span>
            <span>
              <i
                className="fa-solid fa-list-check mr-1.5"
                style={{ opacity: 0.6 }}
              ></i>
              {rule.todosCount} todo{rule.todosCount !== 1 && "s"}
            </span>
            <span style={{ color: "var(--text-3)" }}>
              <i
                className="fa-solid fa-circle-arrow-right mr-1.5"
                style={{ opacity: 0.6 }}
              ></i>
              Next: {rule.nextRun}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Toggle switch */}
          <label
            className="toggle"
            title={rule.active ? "Pause rule" : "Resume rule"}
          >
            <input
              type="checkbox"
              checked={rule.active}
              onChange={onToggle}
            />
            <span className="slider"></span>
          </label>

          {/* Menu */}
          <div className="menu-wrap">
            <button
              type="button"
              className={`menu-trigger ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen((o) => !o)}
              style={{ opacity: 1 }}
            >
              <i className="fa-solid fa-ellipsis-vertical"></i>
            </button>
            <div className={`menu ${menuOpen ? "open" : ""}`}>
              <button
                type="button"
                className="menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
              >
                <i className="fa-solid fa-pen"></i> Edit
              </button>
              <button
                type="button"
                className="menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  onToggle();
                }}
              >
                <i
                  className={`fa-solid ${rule.active ? "fa-pause" : "fa-play"}`}
                ></i>{" "}
                {rule.active ? "Pause" : "Resume"}
              </button>
              <div className="menu-divider"></div>
              <button
                type="button"
                className="menu-item danger"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmDel(true);
                }}
              >
                <i className="fa-solid fa-trash"></i> Delete
              </button>
            </div>
            {confirmDel && (
              <div className="confirm-popover">
                <p>Delete this rule?</p>
                <div className="actions">
                  <button
                    type="button"
                    className="cancel"
                    onClick={() => setConfirmDel(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="confirm"
                    onClick={() => {
                      setConfirmDel(false);
                      onDelete();
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Create / Edit Modal ──────────────────────────────────────
function RuleModal({
  initial,
  tags,
  onSave,
  onClose,
}: {
  initial: RuleData | null;
  tags: TagOption[];
  onSave: (id: string, input: RuleInput) => void | Promise<void>;
  onClose: () => void;
}) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [tagId, setTagId] = useState<string>(initial?.tagId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(initial?.startTime ?? "07:00");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "08:00");
  const [recurrence, setRecurrence] = useState<Recurrence>(
    initial?.recurrence ?? "DAILY",
  );
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    initial?.daysOfWeek ?? [1, 2, 3, 4, 5],
  );
  const [todos, setTodos] = useState<string[]>(
    initial?.todos.length ? initial.todos : [""],
  );

  function toggleDay(d: number) {
    setDaysOfWeek((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const selectedTag = tags.find((t) => t.id === tagId);
    const emoji = selectedTag?.emoji ?? "🔁";
    try {
      await onSave(initial?.id ?? "", {
        name,
        emoji,
        tagId: tagId || null,
        startTime,
        endTime,
        recurrence,
        daysOfWeek,
        todos: todos.map((t) => t.trim()).filter(Boolean),
      });
    } catch {
      setError("Failed to save rule. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card modal-card w-full max-w-lg animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head flex items-center justify-between p-5 md:p-6">
          <h2 className="font-semibold" style={{ color: "var(--text)" }}>
            {isEdit ? "Edit Rule" : "New Recurring Rule"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center"
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

        <form onSubmit={submit}>
          <div className="modal-body space-y-4 p-5 md:p-6">
          {/* Name */}
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--text)" }}
            >
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning Routine"
              className="inp"
              required
              maxLength={80}
            />
          </div>

          {/* Tag */}
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--text)" }}
            >
              Tag{" "}
              <span style={{ color: "var(--text-3)", fontWeight: 400 }}>(optional)</span>
            </label>
            <select
              value={tagId}
              onChange={(e) => setTagId(e.target.value)}
              className="inp"
            >
              <option value="">— No tag —</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.emoji} {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: "var(--text)" }}
              >
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="inp"
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
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="inp"
                required
              />
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label
              className="block text-xs font-semibold mb-2"
              style={{ color: "var(--text)" }}
            >
              Repeat
            </label>
            <div className="flex flex-wrap gap-2">
              {(["DAILY", "WEEKDAYS", "WEEKLY", "CUSTOM"] as Recurrence[]).map(
                (r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRecurrence(r)}
                    className={`rchip ${recurrence === r ? "rchip-active" : ""}`}
                  >
                    {r === "DAILY"
                      ? "Every day"
                      : r === "WEEKDAYS"
                        ? "Weekdays"
                        : r === "WEEKLY"
                          ? "Weekly"
                          : "Custom"}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Days picker (only for WEEKLY / CUSTOM) */}
          {(recurrence === "WEEKLY" || recurrence === "CUSTOM") && (
            <div>
              <label
                className="block text-xs font-semibold mb-2"
                style={{ color: "var(--text)" }}
              >
                On these days
              </label>
              <div className="flex gap-2">
                {DAY_LABELS.map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`daychip ${daysOfWeek.includes(i) ? "daychip-active" : ""}`}
                  >
                    {d.charAt(0)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Todos template */}
          <div>
            <label
              className="block text-xs font-semibold mb-2"
              style={{ color: "var(--text)" }}
            >
              Todos{" "}
              <span style={{ color: "var(--text-3)", fontWeight: 400 }}>
                (added to each generated block)
              </span>
            </label>
            <div className="space-y-2">
              {todos.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={t}
                    onChange={(e) =>
                      setTodos((prev) =>
                        prev.map((x, idx) => (idx === i ? e.target.value : x)),
                      )
                    }
                    className="inp flex-1"
                    placeholder="e.g. Drink water, stretch..."
                    maxLength={300}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setTodos((prev) =>
                        prev.length > 1
                          ? prev.filter((_, idx) => idx !== i)
                          : prev,
                      )
                    }
                    className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0"
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
              ))}
            </div>
            <button
              type="button"
              onClick={() => setTodos((prev) => [...prev, ""])}
              className="text-xs font-semibold flex items-center gap-1.5 hover:underline mt-3"
              style={{ color: "var(--accent)" }}
            >
              <i className="fa-solid fa-plus text-[10px]"></i> Add another todo
            </button>
          </div>

          </div>{/* /modal-body */}

          {/* Submit */}
          <div className="modal-foot p-5 md:p-6 space-y-3">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg"
                style={{ background: "var(--danger-bg)", border: "1px solid rgba(220,38,38,.2)" }}>
                <i className="fa-solid fa-circle-exclamation text-sm" style={{ color: "var(--danger)" }}></i>
                <span className="text-xs font-medium" style={{ color: "var(--danger)" }}>{error}</span>
              </div>
            )}
            <div className="flex gap-3">
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
                {submitting ? "Saving..." : isEdit ? "Save Changes" : "Create Rule"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
