"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import TaskModal, { type TaskInitial } from "@/components/today/TaskModal";
import { toggleTaskAction, setTaskStatusAction, updateTaskNoteAction } from "@/actions/tasks";
import { toast } from "@/lib/toast";

type Tag = { id: string; name: string; emoji: string };

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
  alreadyCarried: boolean;
};

export default function TodayClient({
  tasks, todayISO, openCreateOnLoad, tags,
  currentDateISO, currentDateLabel, prevDateISO, nextDateISO,
  nowHHMM, isPastDate,
}: {
  tasks: TaskView[];
  todayISO: string;
  openCreateOnLoad?: boolean;
  tags: Tag[];
  currentDateISO: string;
  currentDateLabel: string;
  prevDateISO: string;
  nextDateISO: string;
  nowHHMM: string | null;
  isPastDate: boolean;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(!!openCreateOnLoad);
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
                  nowHHMM={nowHHMM} isPastDate={isPastDate} todayISO={todayISO} />
              ))}
            </div>
          )}
        </div>

        {/* Right panel — one merged summary card */}
        <div className="space-y-4">
          {totalTasks === 0 ? (
            <div className="card p-5">
              <h3 className="font-semibold text-sm mb-2" style={{ color: "var(--text)" }}>Day Summary</h3>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>No tasks yet — add one to see your day at a glance.</p>
            </div>
          ) : (
            <PlanVsReality tasks={tasks} doneTasks={doneTasks} skippedTasks={skippedTasks}
              pendingTasks={pendingTasks} totalTasks={totalTasks} />
          )}
        </div>
      </div>

      <TaskModal open={modalOpen} onClose={() => setModalOpen(false)}
        mode={modalMode} initial={editing} tags={tags} currentDateISO={currentDateISO} todayISO={todayISO} />
    </div>
  );
}

// ── Task Card ─────────────────────────────────────────
function TaskCard({ task, onEdit, nowHHMM, isPastDate, todayISO }: {
  task: TaskView; onEdit: () => void; nowHHMM: string | null; isPastDate: boolean; todayISO: string;
}) {
  const router = useRouter();
  const [, startTx] = useTransition();
  const [showNote, setShowNote] = useState(!!task.note);
  const [noteText, setNoteText] = useState(task.note ?? "");
  const [optimisticDone, setOptimisticDone] = useState<boolean | null>(null);
  const [carried, setCarried] = useState(task.alreadyCarried);
  const isDone = optimisticDone ?? task.status === "DONE";
  const isSkipped = task.status === "SKIPPED";
  // A task is "missed" when it's still pending and its time has passed —
  // either the whole day is over, or it's today and the end time went by.
  const missedToday = !isPastDate && nowHHMM !== null && nowHHMM > task.endTime;
  const isMissed = !isDone && !isSkipped && (isPastDate || missedToday);
  // Past-day misses carry to today; today's misses carry to tomorrow.
  const carryTargetISO = isPastDate
    ? todayISO
    : new Intl.DateTimeFormat("en-CA").format(new Date(new Date(todayISO + "T00:00:00").getTime() + 86_400_000));
  const carryLabel = isPastDate ? "Carry to today" : "Carry to tomorrow";

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

  function handleCarry() {
    startTx(async () => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          tagId: task.tagId,
          date: carryTargetISO,
          startTime: task.startTime,
          endTime: task.endTime,
          carriedFromId: task.id,
        }),
      });
      if (res.ok) {
        setCarried(true);
        toast(isPastDate ? "Task carried to today" : "Task carried to tomorrow");
        router.refresh();
      } else {
        toast("Could not carry task");
      }
    });
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
          {isMissed && (
            carried ? (
              <span className="text-[10px] font-semibold px-2 py-1 rounded"
                style={{ background: "var(--success)", color: "white" }}>
                <i className="fa-solid fa-check" style={{ fontSize: 9 }}></i> Carried
              </span>
            ) : (
              <button type="button" onClick={handleCarry}
                className="text-[10px] font-semibold px-2 py-1 rounded whitespace-nowrap"
                style={{ background: "var(--warning)", color: "white", border: "none", cursor: "pointer" }}
                title="Copy this task forward; the miss stays on record here">
                <i className="fa-solid fa-arrow-right" style={{ fontSize: 9 }}></i> {carryLabel}
              </button>
            )
          )}
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
        <div className="flex items-start gap-2 mt-2 pl-8">
          <i className="fa-solid fa-comment mt-1" style={{ fontSize: 10, color: "var(--text-3)" }}></i>
          <textarea value={noteText}
            onChange={(e) => {
              setNoteText(e.target.value);
              e.currentTarget.style.height = "auto";
              e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
            }}
            ref={(el) => {
              if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }
            }}
            onBlur={handleSaveNote}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); } }}
            placeholder="Add a note..." maxLength={500} rows={1}
            className="flex-1 bg-transparent text-xs outline-none resize-none leading-relaxed"
            style={{ color: "var(--text-2)", minWidth: 0, overflow: "hidden" }} />
        </div>
      )}
    </div>
  );
}

// ── Plan vs Reality ──────────────────────────────────
function PlanVsReality({ tasks, doneTasks, skippedTasks, pendingTasks, totalTasks }: {
  tasks: TaskView[]; doneTasks: number; skippedTasks: number; pendingTasks: number; totalTasks: number;
}) {
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

  const totalPlannedMin = tasks.reduce((s, t) => s + durationMin(t.startTime, t.endTime), 0);
  const doneMin = tasks.filter((t) => t.status === "DONE")
    .reduce((s, t) => s + durationMin(t.startTime, t.endTime), 0);
  const skippedMin = tasks.filter((t) => t.status === "SKIPPED")
    .reduce((s, t) => s + durationMin(t.startTime, t.endTime), 0);
  const pct = totalPlannedMin > 0 ? Math.round((doneMin / totalPlannedMin) * 100) : 0;

  return (
    <div className="card p-5">
      {/* Header: title + big % */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>
          <i className="fa-solid fa-scale-balanced mr-1.5" style={{ fontSize: 11, color: "var(--accent)" }}></i>
          Day Summary
        </h3>
        <div className="text-right">
          <span className="text-lg font-extrabold" style={{ color: pct >= 80 ? "var(--success)" : pct >= 40 ? "var(--warning)" : "var(--danger)" }}>
            {pct}%
          </span>
          <span className="text-[10px] ml-1" style={{ color: "var(--text-3)" }}>of plan done</span>
        </div>
      </div>

      {/* Counts strip */}
      <div className="flex items-center gap-3 mb-3 text-[11px]">
        <span style={{ color: "var(--success)" }}><strong>{doneTasks}</strong> done</span>
        <span style={{ color: "var(--warning)" }}><strong>{skippedTasks}</strong> skipped</span>
        <span style={{ color: "var(--text-3)" }}><strong>{pendingTasks}</strong> pending</span>
        <span className="ml-auto" style={{ color: "var(--text-3)" }}>{totalTasks} total</span>
      </div>

      {/* Stacked time bar */}
      <div className="h-2.5 rounded-full overflow-hidden flex" style={{ background: "var(--border)" }}>
        {doneMin > 0 && (
          <div className="h-full" style={{ width: `${(doneMin / totalPlannedMin) * 100}%`, background: "var(--success)" }} />
        )}
        {skippedMin > 0 && (
          <div className="h-full" style={{ width: `${(skippedMin / totalPlannedMin) * 100}%`, background: "var(--warning)" }} />
        )}
      </div>

      {/* Time footer */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
        <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
          Planned <strong style={{ color: "var(--text-2)" }}>{fmtH(totalPlannedMin)}</strong>
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
          Done <strong style={{ color: "var(--success)" }}>{fmtH(doneMin)}</strong>
        </span>
        {skippedMin > 0 && (
          <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
            Skipped <strong style={{ color: "var(--warning)" }}>{fmtH(skippedMin)}</strong>
          </span>
        )}
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────
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
