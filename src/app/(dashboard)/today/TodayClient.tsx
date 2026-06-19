"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import BlockModal, { type BlockInitial } from "@/components/today/BlockModal";
import { TodoItem, type TodoData } from "@/components/today/TodoItem";
import { BlockTracker } from "@/components/today/BlockTracker";
import {
  CarryForwardBanner,
  type CarriedTodo,
} from "@/components/today/CarryForwardBanner";
import { PlanVsRealityView } from "@/components/today/PlanVsRealityView";
import { addTodoAction } from "@/actions/todos";
import { applyTemplateAction } from "@/actions/templates";
import { markAllTodosAction, setBlockStatusAction } from "@/actions/blocks";
import { setBlockMetricAction, clearBlockMetricAction } from "@/actions/block-track";

type TemplateView = { id: string; name: string; blockCount: number };
type Tag = { id: string; name: string; emoji: string };
type Todo = TodoData;
type Block = {
  id: string; title: string; startTime: string; endTime: string;
  status: "PLANNED" | "DONE" | "PARTIAL" | "SKIPPED";
  tagId: string | null; tag: Tag | null; todos: Todo[];
  metricType: "TIME" | "DISTANCE" | "COUNT" | "CUSTOM" | null;
  metricUnit: string | null;
  metricTarget: number | null;
  metricActual: number;
  timerStartedAt: string | null;
  timerAccumMs: number;
};

export default function TodayClient({
  blocks, carried, tags, templates, currentDateISO, currentDateLabel,
  prevDateISO, nextDateISO, nowHHMM, isPastDate,
}: {
  blocks: Block[]; carried: CarriedTodo[]; tags: Tag[]; templates: TemplateView[];
  currentDateISO: string; currentDateLabel: string;
  prevDateISO: string; nextDateISO: string;
  nowHHMM: string | null; isPastDate: boolean;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<BlockInitial | undefined>();
  const [applyOpen, setApplyOpen] = useState(false);
  const [view, setView] = useState<"timeline" | "compare">("timeline");

  function openCreate() { setModalMode("create"); setEditing(undefined); setModalOpen(true); }
  function openEdit(block: Block) {
    setModalMode("edit");
    setEditing({ id: block.id, title: block.title, startTime: block.startTime, endTime: block.endTime, tagId: block.tagId });
    setModalOpen(true);
  }

  const totalTodos = blocks.reduce((acc, b) => acc + b.todos.length, 0);
  const doneTodos = blocks.reduce((acc, b) => acc + b.todos.filter((t) => t.status === "DONE").length, 0);
  const skippedTodos = blocks.reduce((acc, b) => acc + b.todos.filter((t) => t.status === "INCOMPLETE" || t.status === "SKIPPED").length, 0);
  const pendingTodos = totalTodos - doneTodos - skippedTodos;
  const pct = (n: number) => (totalTodos ? Math.round((n / totalTodos) * 100) : 0);
  const completedBlocks = blocks.filter((b) => b.status === "DONE").length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display text-2xl font-extrabold" style={{ color: "var(--text)" }}>
            Today&apos;s Log
          </h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Link
              href={`/today?date=${prevDateISO}`}
              className="w-6 h-6 rounded flex items-center justify-center transition-colors"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            >
              <i className="fa-solid fa-chevron-left" style={{ fontSize: "9px", color: "var(--text-2)" }}></i>
            </Link>
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {currentDateLabel}
            </span>
            <Link
              href={`/today?date=${nextDateISO}`}
              className="w-6 h-6 rounded flex items-center justify-center transition-colors"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            >
              <i className="fa-solid fa-chevron-right" style={{ fontSize: "9px", color: "var(--text-2)" }}></i>
            </Link>
            <input
              type="date"
              value={currentDateISO}
              onChange={(e) => router.push(`/today?date=${e.target.value}`)}
              className="inp"
              style={{
                width: "auto", padding: "3px 8px", fontSize: "11px",
                background: "var(--accent-bg)", borderColor: "var(--accent-bg)",
                color: "var(--accent)", fontWeight: 600,
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {templates.length > 0 && (
            <button onClick={() => setApplyOpen(true)} className="btn btn-outline" style={{ fontSize: "12px" }}>
              <i className="fa-solid fa-layer-group"></i> Apply Template
            </button>
          )}
          <button onClick={openCreate} className="btn btn-primary" style={{ fontSize: "12px" }}>
            <i className="fa-solid fa-plus"></i> Add Block
          </button>
        </div>
      </div>

      {/* Carry-Forward banner (renders only when there are carried todos) */}
      <CarryForwardBanner
        todos={carried}
        todayBlocks={blocks.map((b) => ({ id: b.id, title: b.title }))}
        currentDateISO={currentDateISO}
      />

      {/* View toggle: Timeline | Plan vs Reality */}
      <div className="flex items-center gap-1 mb-4" style={{ width: "fit-content", background: "var(--surface-2)", border: "1px solid var(--border)", padding: 3, borderRadius: 8 }}>
        <button
          type="button"
          onClick={() => setView("timeline")}
          className="text-xs font-medium px-3 py-1.5 rounded transition-colors"
          style={{
            background: view === "timeline" ? "var(--surface)" : "transparent",
            color: view === "timeline" ? "var(--text)" : "var(--text-2)",
            border: view === "timeline" ? "1px solid var(--border)" : "1px solid transparent",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <i className="fa-solid fa-list mr-1.5"></i> Timeline
        </button>
        <button
          type="button"
          onClick={() => setView("compare")}
          className="text-xs font-medium px-3 py-1.5 rounded transition-colors"
          style={{
            background: view === "compare" ? "var(--surface)" : "transparent",
            color: view === "compare" ? "var(--text)" : "var(--text-2)",
            border: view === "compare" ? "1px solid var(--border)" : "1px solid transparent",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <i className="fa-solid fa-scale-balanced mr-1.5"></i> Plan vs Reality
        </button>
      </div>

      {/* Plan vs Reality view */}
      {view === "compare" && (
        <PlanVsRealityView blocks={blocks} isPastDate={isPastDate} />
      )}

      {/* Main grid (Timeline view) */}
      {view === "timeline" && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Timeline */}
        <div className="lg:col-span-2 card p-5">
          {blocks.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3"
                style={{ background: "var(--accent-bg)" }}>
                <i className="fa-solid fa-clock" style={{ color: "var(--accent)", fontSize: "18px" }}></i>
              </div>
              <p className="text-base font-semibold" style={{ color: "var(--text)" }}>Nothing planned for this day</p>
              <p className="text-sm mt-1 mb-5" style={{ color: "var(--text-3)" }}>Click &quot;Add Block&quot; to start tracking.</p>
              <button onClick={openCreate} className="btn btn-primary" style={{ fontSize: "12px" }}>
                <i className="fa-solid fa-plus"></i> Add First Block
              </button>
            </div>
          ) : (
            <div className="space-y-3 stagger">
              {blocks.map((block) => (
                <BlockCard key={block.id} block={block} onEdit={() => openEdit(block)} nowHHMM={nowHHMM} isPastDate={isPastDate} />
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--text)" }}>Day Summary</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: "var(--text-2)" }}>Blocks completed</span>
                <span className="font-semibold" style={{ color: "var(--text)" }}>{completedBlocks} / {blocks.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: "var(--text-2)" }}>Todos total</span>
                <span className="font-semibold" style={{ color: "var(--text)" }}>{totalTodos}</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--text)" }}>Todos Progress</h3>
            {totalTodos === 0 ? (
              <p className="text-xs text-center py-3" style={{ color: "var(--text-3)" }}>No todos yet.</p>
            ) : (
              <div className="space-y-2.5">
                <ProgressRow label="Completed" value={doneTodos} total={totalTodos} color="var(--success)" />
                <ProgressRow label="Skipped" value={skippedTodos} total={totalTodos} color="var(--warning)" />
                <ProgressRow label="Pending" value={pendingTodos} total={totalTodos} color="var(--text-3)" />
                <p className="text-[10px] text-right pt-1" style={{ color: "var(--text-3)" }}>
                  {pct(doneTodos)}% complete
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      <BlockModal open={modalOpen} onClose={() => setModalOpen(false)} mode={modalMode} initial={editing} tags={tags} currentDateISO={currentDateISO} />

      {applyOpen && (
        <ApplyTemplateInline templates={templates} currentDateISO={currentDateISO} onClose={() => setApplyOpen(false)} />
      )}
    </div>
  );
}

function ApplyTemplateInline({ templates, currentDateISO, onClose }: {
  templates: TemplateView[]; currentDateISO: string; onClose: () => void;
}) {
  const [selected, setSelected] = useState<string>(templates[0]?.id ?? "");
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card p-5 md:p-6 w-full max-w-md animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold" style={{ color: "var(--text)" }}>Apply Template</h2>
          <button type="button" onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center transition-colors"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <i className="fa-solid fa-xmark text-sm" style={{ color: "var(--text-2)" }}></i>
          </button>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--text-2)" }}>Pick a template to apply to this date.</p>
        <form action={async (formData: FormData) => {
          const id = String(formData.get("templateId") ?? "");
          if (!id) return;
          formData.set("date", currentDateISO);
          await applyTemplateAction(id, formData);
        }} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text)" }}>Template</label>
            <select name="templateId" className="inp" value={selected} onChange={(e) => setSelected(e.target.value)} required>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.blockCount} {t.blockCount === 1 ? "block" : "blocks"})</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn btn-outline flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn btn-primary flex-1 justify-center">Apply</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BlockCard({ block, onEdit, nowHHMM, isPastDate }: {
  block: Block; onEdit: () => void; nowHHMM: string | null; isPastDate: boolean;
}) {
  const tagClass = block.tag ? tagClassFor(block.tag.name) : "tag-personal";
  const addInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [addingText, setAddingText] = useState<string | null>(null);
  const pillClass = computeBadge(block.status, block.startTime, block.endTime, nowHHMM, isPastDate);
  const pillText = badgeText(pillClass);

  const bgStyle =
    block.status === "DONE"
      ? { background: "rgba(22,163,74,.05)", border: "1px solid rgba(22,163,74,.15)" }
      : block.status === "PARTIAL"
        ? { background: "var(--accent-bg)", border: "1px solid rgba(94,106,210,.15)" }
        : { background: "var(--surface-2)", border: "1px solid var(--border)" };

  const borderLeft =
    block.status === "DONE" ? "2px solid var(--success)"
      : block.status === "PARTIAL" ? "2px solid var(--accent)"
        : "2px solid var(--border-2)";

  return (
    <div className="rounded-lg p-3.5" style={{ ...bgStyle, borderLeft }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>
              {block.tag?.emoji ?? "📌"} {block.title}
            </span>
            {block.tag && <span className={`tag ${tagClass}`}>{block.tag.name}</span>}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            {block.startTime} – {block.endTime}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`pill ${pillClass}`}>{pillText}</span>

          {(() => {
            const noTodos = block.todos.length === 0;
            const allDone = !noTodos && block.todos.every((t) => t.status === "DONE");
            if (allDone) return null;
            if (noTodos) {
              const isDone = block.status === "DONE";
              return (
                <form action={setBlockStatusAction.bind(null, block.id, isDone ? "PLANNED" : "DONE")}>
                  <button type="submit"
                    className="w-7 h-7 rounded flex items-center justify-center transition-colors"
                    style={{ background: isDone ? "rgba(22,163,74,.1)" : "var(--surface-2)", border: "1px solid var(--border)" }}
                    title={isDone ? "Mark as not done" : "Mark as done"}>
                    <i className={`fa-solid ${isDone ? "fa-rotate-left" : "fa-check"} text-xs`}
                      style={{ color: isDone ? "var(--success)" : "var(--text-3)" }}></i>
                  </button>
                </form>
              );
            }
            return (
              <form action={markAllTodosAction.bind(null, block.id, true)}>
                <button type="submit"
                  className="w-7 h-7 rounded flex items-center justify-center transition-colors"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                  title="Mark all todos as done">
                  <i className="fa-solid fa-check text-xs" style={{ color: "var(--text-3)" }}></i>
                </button>
              </form>
            );
          })()}

          <button type="button" onClick={onEdit}
            className="w-7 h-7 rounded flex items-center justify-center transition-colors"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            title="Edit / Delete">
            <i className="fa-solid fa-pen text-xs" style={{ color: "var(--text-3)" }}></i>
          </button>
        </div>
      </div>

      {/* Per-block progress bar */}
      {block.todos.length > 0 && (() => {
        const total = block.todos.length;
        const done = block.todos.filter((t) => t.status === "DONE").length;
        const pct = Math.round((done / total) * 100);
        return (
          <div className="flex items-center gap-2 mb-2.5">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
              <div className="h-full rounded-full"
                style={{ width: `${pct}%`, background: pct === 100 ? "var(--success)" : "var(--accent)", transition: "width .35s cubic-bezier(0.2,0,0,1)" }} />
            </div>
            <span className="text-[10px] font-semibold tabular" style={{ color: "var(--text-3)" }}>{done}/{total}</span>
          </div>
        );
      })()}

      {/* Todos — new component handles simple + trackable rendering, menu, edit, notes */}
      {(block.todos.length > 0 || addingText) && (
        <div style={{ marginBottom: "8px" }}>
          {block.todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
          {/* Optimistic ghost row while the new todo saves */}
          {addingText && (
            <div className="todo-row" style={{ opacity: 0.55 }}>
              <span className="cb" aria-hidden />
              <span className="todo-text-display">{addingText}</span>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 11, color: "var(--text-3)" }}></i>
            </div>
          )}
        </div>
      )}

      {/* Block-level tracker (timer / target) */}
      {block.metricType ? (
        <div className="relative">
          <BlockTracker block={{ ...block, metricType: block.metricType }} />
          <button
            type="button"
            title="Remove tracking"
            onClick={async () => { await clearBlockMetricAction(block.id); router.refresh(); }}
            className="absolute top-1 right-1 w-6 h-6 rounded flex items-center justify-center"
            style={{ background: "transparent", color: "var(--text-3)" }}
          >
            <i className="fa-solid fa-xmark" style={{ fontSize: 10 }}></i>
          </button>
        </div>
      ) : (
        block.todos.length === 0 && !addingText && (
          <button
            type="button"
            onClick={async () => {
              await setBlockMetricAction(block.id, "TIME", durationHours(block.startTime, block.endTime), "hrs");
              router.refresh();
            }}
            className="flex items-center gap-2 text-xs font-semibold px-2.5 py-2 rounded-lg mb-1 transition-colors"
            style={{ color: "var(--accent)", background: "var(--accent-bg)" }}
          >
            <i className="fa-solid fa-stopwatch" style={{ fontSize: 11 }}></i>
            Track this block with a timer
          </button>
        )
      )}

      {/* Add todo */}
      <form
        action={async (formData) => {
          const text = String(formData.get("text") ?? "").trim();
          if (!text) return;
          setAddingText(text);
          if (addInputRef.current) addInputRef.current.value = "";
          await addTodoAction(block.id, formData);
          router.refresh();
          setAddingText(null);
        }}
        className="mt-2 flex items-center gap-2"
      >
        <i className="fa-solid fa-plus" style={{ fontSize: "10px", color: "var(--accent)" }}></i>
        <input ref={addInputRef} name="text"
          className="flex-1 bg-transparent text-xs outline-none"
          style={{ color: "var(--text)" }}
          placeholder="Add a todo..."
          required maxLength={300} />
      </form>
    </div>
  );
}

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

function computeBadge(status: string, startTime: string, endTime: string, nowHHMM: string | null, isPastDate: boolean): string {
  if (status === "DONE") return "pill-done";
  if (status === "SKIPPED") return "pill-skipped";
  if (isPastDate && status === "PLANNED") return "pill-missed";
  if (isPastDate && status === "PARTIAL") return "pill-partial";
  if (nowHHMM !== null) {
    if (status === "PARTIAL") return nowHHMM > endTime ? "pill-partial" : "pill-now";
    if (nowHHMM > endTime) return "pill-missed";
    if (nowHHMM >= startTime) return "pill-now";
    return "pill-upcoming";
  }
  if (status === "PARTIAL") return "pill-now";
  return "pill-upcoming";
}

function durationHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  return mins > 0 ? Math.round((mins / 60) * 4) / 4 : 1; // round to 0.25h
}

function badgeText(pillClass: string): string {
  const map: Record<string, string> = {
    "pill-done": "✓ Done", "pill-skipped": "Skipped", "pill-partial": "Partial",
    "pill-now": "In progress", "pill-missed": "Missed", "pill-upcoming": "Upcoming",
  };
  return map[pillClass] ?? "—";
}

function tagClassFor(name: string): string {
  const map: Record<string, string> = {
    Study: "tag-study", Work: "tag-work", Sleep: "tag-sleep",
    Exercise: "tag-health", Personal: "tag-personal",
    Breakfast: "tag-meal", Lunch: "tag-meal", Dinner: "tag-meal", Break: "tag-break",
  };
  return map[name] ?? "tag-personal";
}
