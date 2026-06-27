"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import TaskModal, { type TaskInitial } from "@/components/today/TaskModal";
import { toggleTaskAction, setTaskStatusAction, updateTaskNoteAction } from "@/actions/tasks";
import { toast } from "@/lib/toast";

type Tag = { id: string; name: string; emoji: string };
type TemplateView = { id: string; name: string; blockCount: number };

type TaskView = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "DONE" | "SKIPPED";
  note: string | null;
  tagId: string | null;
  tag: Tag | null;
  recurrence: string;
  recurringRuleId: string | null;
  carriedFromId: string | null;
};

type CarriedTask = {
  id: string;
  title: string;
  tagId: string | null;
  tagEmoji: string | null;
  startTime: string;
  endTime: string;
};

export default function TodayClient({
  tasks, carried, tags, templates,
  currentDateISO, currentDateLabel, prevDateISO, nextDateISO,
  nowHHMM, isPastDate,
}: {
  tasks: TaskView[];
  carried: CarriedTask[];
  tags: Tag[];
  templates: TemplateView[];
  currentDateISO: string;
  currentDateLabel: string;
  prevDateISO: string;
  nextDateISO: string;
  nowHHMM: string | null;
  isPastDate: boolean;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<TaskInitial | undefined>();

  function openCreate() {
    setModalMode("create");
    setEditing(undefined);
    setModalOpen(true);
  }

  function openEdit(task: TaskView) {
    setModalMode("edit");
    setEditing({
      id: task.id,
      title: task.title,
      startTime: task.startTime,
      endTime: task.endTime,
      tagId: task.tagId,
      note: task.note,
      recurrence: task.recurrence,
      recurringRuleId: task.recurringRuleId,
    });
    setModalOpen(true);
  }

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "DONE").length;
  const skippedTasks = tasks.filter((t) => t.status === "SKIPPED").length;
  const pendingTasks = totalTasks - doneTasks - skippedTasks;
  const pct = (n: number) => (totalTasks ? Math.round((n / totalTasks) * 100) : 0);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display text-2xl font-extrabold" style={{ color: "var(--text)" }}>
            Today&apos;s Log
          </h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Link href={`/today?date=${prevDateISO}`}
              className="w-6 h-6 rounded flex items-center justify-center transition-colors"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <i className="fa-solid fa-chevron-left" style={{ fontSize: "9px", color: "var(--text-2)" }}></i>
            </Link>
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{currentDateLabel}</span>
            <Link href={`/today?date=${nextDateISO}`}
              className="w-6 h-6 rounded flex items-center justify-center transition-colors"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <i className="fa-solid fa-chevron-right" style={{ fontSize: "9px", color: "var(--text-2)" }}></i>
            </Link>
            <input type="date" value={currentDateISO}
              onChange={(e) => router.push(`/today?date=${e.target.value}`)}
              className="inp"
              style={{ width: "auto", padding: "3px 8px", fontSize: "11px",
                background: "var(--accent-bg)", borderColor: "var(--accent-bg)",
                color: "var(--accent)", fontWeight: 600 }} />
          </div>
        </div>
        <button onClick={openCreate} className="btn btn-primary" style={{ fontSize: "12px" }}>
          <i className="fa-solid fa-plus"></i> Add Task
        </button>
      </div>

      {/* Carry-forward banner */}
      {carried.length > 0 && (
        <CarryBanner carried={carried} currentDateISO={currentDateISO} />
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Timeline */}
        <div className="lg:col-span-2 card p-5">
          {tasks.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3"
                style={{ background: "var(--accent-bg)" }}>
                <i className="fa-solid fa-clock" style={{ color: "var(--accent)", fontSize: "18px" }}></i>
              </div>
              <p className="text-base font-semibold" style={{ color: "var(--text)" }}>Nothing planned for this day</p>
              <p className="text-sm mt-1 mb-5" style={{ color: "var(--text-3)" }}>
                Click &quot;Add Task&quot; to start scheduling.
              </p>
              <button onClick={openCreate} className="btn btn-primary" style={{ fontSize: "12px" }}>
                <i className="fa-solid fa-plus"></i> Add First Task
              </button>
            </div>
          ) : (
            <div className="space-y-3 stagger">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={() => openEdit(task)}
                  nowHHMM={nowHHMM} isPastDate={isPastDate} />
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--text)" }}>Day Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: "var(--text-2)" }}>Total tasks</span>
                <span className="font-semibold" style={{ color: "var(--text)" }}>{totalTasks}</span>
              </div>
              <ProgressRow label="Completed" value={doneTasks} total={totalTasks} color="var(--success)" />
              <ProgressRow label="Skipped" value={skippedTasks} total={totalTasks} color="var(--warning)" />
              <ProgressRow label="Pending" value={pendingTasks} total={totalTasks} color="var(--text-3)" />
              {totalTasks > 0 && (
                <p className="text-[10px] text-right pt-1" style={{ color: "var(--text-3)" }}>
                  {pct(doneTasks)}% complete
                </p>
              )}
            </div>
          </div>

          {/* Plan vs Reality */}
          {totalTasks > 0 && <PlanVsReality tasks={tasks} />}
        </div>
      </div>

      <TaskModal open={modalOpen} onClose={() => setModalOpen(false)}
        mode={modalMode} initial={editing} tags={tags} currentDateISO={currentDateISO} />
    </div>
  );
}

// ── Task Card ─────────────────────────────────────────
function TaskCard({ task, onEdit, nowHHMM, isPastDate }: {
  task: TaskView; onEdit: () => void; nowHHMM: string | null; isPastDate: boolean;
}) {
  const [, startTx] = useTransition();
  const [showNote, setShowNote] = useState(!!task.note);
  const [noteText, setNoteText] = useState(task.note ?? "");
  const [optimisticDone, setOptimisticDone] = useState<boolean | null>(null);
  const isDone = optimisticDone ?? task.status === "DONE";
  const isSkipped = task.status === "SKIPPED";

  const pill = computeBadge(task.status, task.startTime, task.endTime, nowHHMM, isPastDate);

  const bgStyle = isDone
    ? { background: "rgba(22,163,74,.05)", border: "1px solid rgba(22,163,74,.15)" }
    : isSkipped
      ? { background: "var(--surface-2)", border: "1px solid var(--border)", opacity: 0.6 }
      : { background: "var(--surface-2)", border: "1px solid var(--border)" };

  const borderLeft = isDone ? "2px solid var(--success)"
    : isSkipped ? "2px solid var(--warning)"
      : pill.cls === "pill-now" ? "2px solid var(--accent)"
        : "2px solid var(--border-2)";

  function handleToggle() {
    const newDone = !isDone;
    setOptimisticDone(newDone);
    startTx(async () => {
      await toggleTaskAction(task.id);
      setOptimisticDone(null);
    });
  }

  function handleSkip() {
    startTx(() => setTaskStatusAction(task.id, "SKIPPED"));
  }

  function handleSaveNote() {
    if (noteText !== (task.note ?? "")) {
      startTx(async () => {
        await updateTaskNoteAction(task.id, noteText);
        toast("Note saved");
      });
    }
  }

  return (
    <div className="rounded-lg p-3.5" style={{ ...bgStyle, borderLeft }}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button type="button" onClick={handleToggle}
          className={`cb mt-0.5 flex-shrink-0 ${isDone ? "cb-done" : ""}`}
          title={isDone ? "Mark pending" : "Mark done"}>
          {isDone && <i className="fa-solid fa-check text-white" style={{ fontSize: 9 }} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold text-sm ${isDone ? "line-through" : ""}`}
              style={{ color: isDone ? "var(--text-3)" : "var(--text)" }}>
              {task.tag?.emoji ?? "📌"} {task.title}
            </span>
            {task.tag && <span className={`tag ${tagClassFor(task.tag.name)}`}>{task.tag.name}</span>}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            {task.startTime} – {task.endTime}
            {task.recurrence !== "NONE" && (
              <span className="ml-2">
                <i className="fa-solid fa-repeat" style={{ fontSize: 9 }}></i> {task.recurrence.toLowerCase()}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`pill ${pill.cls}`}>{pill.text}</span>
          {!isDone && !isSkipped && (
            <button type="button" onClick={handleSkip}
              className="w-7 h-7 rounded flex items-center justify-center"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              title="Skip">
              <i className="fa-solid fa-ban text-xs" style={{ color: "var(--text-3)" }}></i>
            </button>
          )}
          <button type="button" onClick={() => setShowNote((s) => !s)}
            className="w-7 h-7 rounded flex items-center justify-center"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            title="Note">
            <i className="fa-solid fa-comment text-xs" style={{ color: task.note ? "var(--accent)" : "var(--text-3)" }}></i>
          </button>
          <button type="button" onClick={onEdit}
            className="w-7 h-7 rounded flex items-center justify-center"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            title="Edit">
            <i className="fa-solid fa-pen text-xs" style={{ color: "var(--text-3)" }}></i>
          </button>
        </div>
      </div>

      {/* Note */}
      {showNote && (
        <div className="flex items-center gap-2 mt-2 pl-8">
          <i className="fa-solid fa-comment" style={{ fontSize: 10, color: "var(--text-3)" }}></i>
          <input value={noteText} onChange={(e) => setNoteText(e.target.value)}
            onBlur={handleSaveNote}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
            placeholder="Add a note..." maxLength={500}
            className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: "var(--text-2)", minWidth: 0 }} />
        </div>
      )}
    </div>
  );
}

// ── Carry Banner ─────────────────────────────────────
function CarryBanner({ carried, currentDateISO }: {
  carried: CarriedTask[]; currentDateISO: string;
}) {
  const router = useRouter();
  const [, startTx] = useTransition();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  async function carryTask(ct: CarriedTask) {
    startTx(async () => {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ct.title,
          tagId: ct.tagId,
          date: currentDateISO,
          startTime: ct.startTime,
          endTime: ct.endTime,
          carriedFromId: ct.id,
        }),
      });
      setDismissed((prev) => new Set(prev).add(ct.id));
      router.refresh();
      toast("Task added to today");
    });
  }

  function skipTask(id: string) {
    setDismissed((prev) => new Set(prev).add(id));
  }

  const visible = carried.filter((ct) => !dismissed.has(ct.id));
  if (visible.length === 0) return null;

  return (
    <div className="card p-4 mb-4" style={{ background: "rgba(245,158,11,.06)", border: "1px solid rgba(245,158,11,.2)" }}>
      <div className="flex items-center gap-2 mb-2">
        <i className="fa-solid fa-rotate-right" style={{ fontSize: 11, color: "var(--warning)" }}></i>
        <span className="text-xs font-semibold" style={{ color: "var(--warning)" }}>
          Incomplete from yesterday ({visible.length})
        </span>
      </div>
      <div className="space-y-1.5">
        {visible.map((ct) => (
          <div key={ct.id} className="flex items-center justify-between p-2 rounded"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <span className="text-xs" style={{ color: "var(--text)" }}>
              {ct.tagEmoji ?? "📌"} {ct.title}
              <span className="ml-1" style={{ color: "var(--text-3)" }}>({ct.startTime}–{ct.endTime})</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => skipTask(ct.id)}
                className="text-[10px] font-medium px-2 py-1 rounded"
                style={{ background: "var(--surface-2)", color: "var(--text-3)", border: "1px solid var(--border)", cursor: "pointer" }}>
                Skip
              </button>
              <button type="button" onClick={() => carryTask(ct)}
                className="text-[10px] font-semibold px-2 py-1 rounded"
                style={{ background: "var(--warning)", color: "white", border: "none", cursor: "pointer" }}>
                Add to today
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Plan vs Reality ──────────────────────────────────
function PlanVsReality({ tasks }: { tasks: TaskView[] }) {
  function durationMin(s: string, e: string): number {
    const [sh, sm] = s.split(":").map(Number);
    const [eh, em] = e.split(":").map(Number);
    const d = eh * 60 + em - (sh * 60 + sm);
    return d > 0 ? d : 0;
  }

  const fmtH = (m: number) => {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return h > 0 ? `${h}h ${mm > 0 ? `${mm}m` : ""}`.trim() : `${mm}m`;
  };

  const doneTasks = tasks.filter((t) => t.status === "DONE");
  const skippedTasks = tasks.filter((t) => t.status === "SKIPPED");
  const pendingTasks = tasks.filter((t) => t.status === "PENDING");

  const totalPlannedMin = tasks.reduce((s, t) => s + durationMin(t.startTime, t.endTime), 0);
  const doneMin = doneTasks.reduce((s, t) => s + durationMin(t.startTime, t.endTime), 0);
  const pct = totalPlannedMin > 0 ? Math.round((doneMin / totalPlannedMin) * 100) : 0;

  const statusConfig: Record<string, { icon: string; color: string; label: string }> = {
    DONE: { icon: "fa-check", color: "var(--success)", label: "Done" },
    SKIPPED: { icon: "fa-ban", color: "var(--warning)", label: "Skipped" },
    PENDING: { icon: "fa-clock", color: "var(--text-3)", label: "Pending" },
  };

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--text)" }}>
        <i className="fa-solid fa-scale-balanced mr-1.5" style={{ fontSize: 11, color: "var(--accent)" }}></i>
        Plan vs Reality
      </h3>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-2.5 rounded-full overflow-hidden flex" style={{ background: "var(--border)" }}>
          {doneMin > 0 && (
            <div className="h-full" style={{ width: `${(doneMin / totalPlannedMin) * 100}%`, background: "var(--success)" }} />
          )}
          {skippedTasks.length > 0 && (
            <div className="h-full" style={{
              width: `${(skippedTasks.reduce((s, t) => s + durationMin(t.startTime, t.endTime), 0) / totalPlannedMin) * 100}%`,
              background: "var(--warning)",
            }} />
          )}
        </div>
        <span className="text-sm font-bold" style={{ color: pct >= 80 ? "var(--success)" : pct >= 40 ? "var(--warning)" : "var(--danger)" }}>
          {pct}%
        </span>
      </div>

      {/* Per-task breakdown */}
      <div className="space-y-1.5">
        {tasks.map((t) => {
          const cfg = statusConfig[t.status];
          return (
            <div key={t.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs"
              style={{ background: "var(--surface-2)" }}>
              <i className={`fa-solid ${cfg.icon}`} style={{ fontSize: 10, color: cfg.color, width: 14, textAlign: "center" as const }}></i>
              <span className="flex-1 min-w-0 truncate" style={{
                color: t.status === "DONE" ? "var(--text-2)" : "var(--text)",
                textDecoration: t.status === "DONE" ? "line-through" : "none",
              }}>
                {t.tag?.emoji ?? "📌"} {t.title}
              </span>
              <span className="text-[10px] flex-shrink-0" style={{ color: "var(--text-3)" }}>
                {fmtH(durationMin(t.startTime, t.endTime))}
              </span>
              <span className="text-[10px] font-semibold flex-shrink-0 w-12 text-right" style={{ color: cfg.color }}>
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
        <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
          Plan <strong style={{ color: "var(--text-2)" }}>{fmtH(totalPlannedMin)}</strong>
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
          Done <strong style={{ color: "var(--success)" }}>{fmtH(doneMin)}</strong>
        </span>
        {skippedTasks.length > 0 && (
          <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
            Skipped <strong style={{ color: "var(--warning)" }}>{skippedTasks.length}</strong>
          </span>
        )}
        {pendingTasks.length > 0 && (
          <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
            Pending <strong style={{ color: "var(--text-2)" }}>{pendingTasks.length}</strong>
          </span>
        )}
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────
function ProgressRow({ label, value, total, color }: {
  label: string; value: number; total: number; color: string;
}) {
  const width = total ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: "var(--text-2)" }}>{label}</span>
        <span className="font-semibold" style={{ color }}>{value} / {total}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full" style={{ width: `${width}%`, background: color }} />
      </div>
    </div>
  );
}

function computeBadge(status: string, startTime: string, endTime: string, nowHHMM: string | null, isPastDate: boolean) {
  if (status === "DONE") return { cls: "pill-done", text: "Done" };
  if (status === "SKIPPED") return { cls: "pill-skipped", text: "Skipped" };
  if (isPastDate) return { cls: "pill-missed", text: "Missed" };
  if (nowHHMM !== null) {
    if (nowHHMM > endTime) return { cls: "pill-missed", text: "Missed" };
    if (nowHHMM >= startTime) return { cls: "pill-now", text: "Now" };
    return { cls: "pill-upcoming", text: "Upcoming" };
  }
  return { cls: "pill-upcoming", text: "Upcoming" };
}

function tagClassFor(name: string): string {
  const map: Record<string, string> = {
    Study: "tag-study", Work: "tag-work", Sleep: "tag-sleep",
    Exercise: "tag-health", Personal: "tag-personal",
    Breakfast: "tag-meal", Lunch: "tag-meal", Dinner: "tag-meal", Break: "tag-break",
  };
  return map[name] ?? "tag-personal";
}
