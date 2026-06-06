"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import BlockModal, { type BlockInitial } from "@/components/today/BlockModal";
import {
  addTodoAction,
  deleteTodoAction,
  toggleTodoAction,
} from "@/actions/todos";
import { applyTemplateAction } from "@/actions/templates";
import { markAllTodosAction, setBlockStatusAction } from "@/actions/blocks";

type TemplateView = {
  id: string;
  name: string;
  blockCount: number;
};

type Tag = {
  id: string;
  name: string;
  emoji: string;
};

type Todo = {
  id: string;
  text: string;
  status: "PENDING" | "DONE" | "INCOMPLETE";
  comment: string | null;
};

type Block = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: "PLANNED" | "DONE" | "PARTIAL" | "SKIPPED";
  tagId: string | null;
  tag: Tag | null;
  todos: Todo[];
};

export default function TodayClient({
  blocks,
  tags,
  templates,
  currentDateISO,
  currentDateLabel,
  prevDateISO,
  nextDateISO,
  nowHHMM,
  isPastDate,
}: {
  blocks: Block[];
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
  const [editing, setEditing] = useState<BlockInitial | undefined>();
  const [applyOpen, setApplyOpen] = useState(false);

  function openCreate() {
    setModalMode("create");
    setEditing(undefined);
    setModalOpen(true);
  }

  function openEdit(block: Block) {
    setModalMode("edit");
    setEditing({
      id: block.id,
      title: block.title,
      startTime: block.startTime,
      endTime: block.endTime,
      tagId: block.tagId,
    });
    setModalOpen(true);
  }

  const totalTodos = blocks.reduce((acc, b) => acc + b.todos.length, 0);
  const doneTodos = blocks.reduce(
    (acc, b) => acc + b.todos.filter((t) => t.status === "DONE").length,
    0,
  );
  const incompleteTodos = blocks.reduce(
    (acc, b) => acc + b.todos.filter((t) => t.status === "INCOMPLETE").length,
    0,
  );
  const pendingTodos = totalTodos - doneTodos - incompleteTodos;
  const pct = (n: number) => (totalTodos ? Math.round((n / totalTodos) * 100) : 0);

  const completedBlocks = blocks.filter((b) => b.status === "DONE").length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-extrabold text-[#1A1A2E]">Today&apos;s Log</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Link
              href={`/today?date=${prevDateISO}`}
              className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-sm hover:bg-[#EEEEFF] transition-colors flex-shrink-0"
            >
              <i
                className="fa-solid fa-chevron-left text-[#6B7280]"
                style={{ fontSize: "9px" }}
              ></i>
            </Link>
            <span className="text-xs sm:text-sm font-semibold text-[#1A1A2E]">
              {currentDateLabel}
            </span>
            <Link
              href={`/today?date=${nextDateISO}`}
              className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-sm hover:bg-[#EEEEFF] transition-colors flex-shrink-0"
            >
              <i
                className="fa-solid fa-chevron-right text-[#6B7280]"
                style={{ fontSize: "9px" }}
              ></i>
            </Link>
            <input
              type="date"
              value={currentDateISO}
              onChange={(e) => router.push(`/today?date=${e.target.value}`)}
              className="inp text-xs text-[#6C6FDF] font-semibold cursor-pointer"
              style={{
                width: "auto",
                padding: "4px 8px",
                fontSize: "11px",
                borderColor: "#EEEEFF",
                background: "#EEEEFF",
                color: "#6C6FDF",
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {templates.length > 0 && (
            <button
              onClick={() => setApplyOpen(true)}
              className="btn btn-outline text-xs py-2"
              style={{ fontSize: "12px" }}
            >
              <i className="fa-solid fa-layer-group"></i> Apply Template
            </button>
          )}
          <button
            onClick={openCreate}
            className="btn btn-primary text-xs py-2"
            style={{ fontSize: "12px" }}
          >
            <i className="fa-solid fa-plus"></i> Add Block
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Timeline */}
        <div className="lg:col-span-2 card p-5">
          {blocks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-[#EEEEFF] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-clock text-[#6C6FDF] text-2xl"></i>
              </div>
              <p className="text-base font-bold text-[#1A1A2E]">
                Nothing planned for this day
              </p>
              <p className="text-sm text-[#9CA3AF] mt-1 mb-5">
                Click &quot;Add Block&quot; to start tracking.
              </p>
              <button
                onClick={openCreate}
                className="btn btn-primary text-xs py-2"
                style={{ fontSize: "12px" }}
              >
                <i className="fa-solid fa-plus"></i> Add First Block
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {blocks.map((block) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  onEdit={() => openEdit(block)}
                  nowHHMM={nowHHMM}
                  isPastDate={isPastDate}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-bold text-sm text-[#1A1A2E] mb-3">Day Summary</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6B7280]">Blocks completed</span>
                <span className="font-bold text-[#1A1A2E]">
                  {completedBlocks} / {blocks.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6B7280]">Todos total</span>
                <span className="font-bold text-[#1A1A2E]">{totalTodos}</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-sm text-[#1A1A2E] mb-3">Todos Progress</h3>
            {totalTodos === 0 ? (
              <p className="text-xs text-[#9CA3AF] text-center py-3">No todos yet.</p>
            ) : (
              <div className="space-y-2.5">
                <ProgressRow
                  label="Completed"
                  value={doneTodos}
                  total={totalTodos}
                  color="#22C55E"
                  textColor="#15803D"
                />
                <ProgressRow
                  label="Incomplete"
                  value={incompleteTodos}
                  total={totalTodos}
                  color="#F59E0B"
                  textColor="#F59E0B"
                />
                <ProgressRow
                  label="Pending"
                  value={pendingTodos}
                  total={totalTodos}
                  color="#D1D5DB"
                  textColor="#9CA3AF"
                />
                <p className="text-[10px] text-[#9CA3AF] text-right pt-1">
                  {pct(doneTodos)}% complete
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <BlockModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        initial={editing}
        tags={tags}
        currentDateISO={currentDateISO}
      />

      {applyOpen && (
        <ApplyTemplateInline
          templates={templates}
          currentDateISO={currentDateISO}
          onClose={() => setApplyOpen(false)}
        />
      )}
    </div>
  );
}

function ApplyTemplateInline({
  templates,
  currentDateISO,
  onClose,
}: {
  templates: TemplateView[];
  currentDateISO: string;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string>(templates[0]?.id ?? "");

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card p-5 md:p-6 w-full max-w-md animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-[#1A1A2E]">Apply Template</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 bg-[#F3F4F6] rounded-xl flex items-center justify-center hover:bg-[#FEE2E2]"
          >
            <i className="fa-solid fa-xmark text-[#6B7280] text-sm"></i>
          </button>
        </div>

        <p className="text-sm text-[#6B7280] mb-4">
          Pick a template to apply to this date.
        </p>

        <form
          action={async (formData: FormData) => {
            const id = String(formData.get("templateId") ?? "");
            if (!id) return;
            formData.set("date", currentDateISO);
            await applyTemplateAction(id, formData);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5">
              Template
            </label>
            <select
              name="templateId"
              className="inp"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              required
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.blockCount} {t.blockCount === 1 ? "block" : "blocks"})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost flex-1 justify-center border border-[#E5E7EB]"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1 justify-center"
              style={{ flex: 1 }}
            >
              Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BlockCard({
  block,
  onEdit,
  nowHHMM,
  isPastDate,
}: {
  block: Block;
  onEdit: () => void;
  nowHHMM: string | null;
  isPastDate: boolean;
}) {
  const tagClass = block.tag ? tagClassFor(block.tag.name) : "tag-personal";
  const addInputRef = useRef<HTMLInputElement>(null);
  const badge = computeBadge(block.status, block.startTime, block.endTime, nowHHMM, isPastDate);
  const borderClass =
    block.status === "DONE"
      ? "block-done"
      : block.status === "PARTIAL"
        ? "block-partial"
        : "block-plan";
  const bgStyle =
    block.status === "DONE"
      ? { background: "#F0FFF4", border: "1px solid #DCFCE7" }
      : block.status === "PARTIAL"
        ? { background: "#FAFAFF", border: "1px solid #EEEEFF" }
        : { background: "white", border: "1px solid #F3F4F6" };

  return (
    <div className={`${borderClass} rounded-xl p-3.5`} style={bgStyle}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-[#1A1A2E]">
              {block.tag?.emoji ?? "📌"} {block.title}
            </span>
            {block.tag && (
              <span className={`tag ${tagClass}`}>{block.tag.name}</span>
            )}
          </div>
          <div className="text-xs text-[#9CA3AF] mt-0.5">
            {block.startTime} – {block.endTime}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-xs font-bold ${badge.color} px-2 py-1 rounded-lg`}>
            {badge.text}
          </span>

          {/* Mark Done button — appears when there's still something to mark:
              - No todos + PLANNED → toggle to DONE
              - No todos + DONE     → toggle back to PLANNED (in case of mistake)
              - Has todos, not all done → mark all todos DONE
              - Has todos, all done → no button (uncheck individual todos to undo) */}
          {(() => {
            const noTodos = block.todos.length === 0;
            const allDone =
              !noTodos && block.todos.every((t) => t.status === "DONE");

            // Hide entirely when all todos already done
            if (allDone) return null;

            // No-todos block: toggle between PLANNED and DONE
            if (noTodos) {
              const isDone = block.status === "DONE";
              return (
                <form
                  action={setBlockStatusAction.bind(
                    null,
                    block.id,
                    isDone ? "PLANNED" : "DONE",
                  )}
                >
                  <button
                    type="submit"
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isDone
                        ? "bg-[#DCFCE7] hover:bg-[#FEE2E2]"
                        : "bg-[#F3F4F6] hover:bg-[#DCFCE7]"
                    }`}
                    title={isDone ? "Mark as not done" : "Mark as done"}
                  >
                    <i
                      className={`fa-solid ${isDone ? "fa-rotate-left" : "fa-check"} text-xs ${
                        isDone ? "text-[#15803D]" : "text-[#9CA3AF]"
                      }`}
                    ></i>
                  </button>
                </form>
              );
            }

            // Has todos but not all done — show "Mark all as done"
            return (
              <form action={markAllTodosAction.bind(null, block.id, true)}>
                <button
                  type="submit"
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors bg-[#F3F4F6] hover:bg-[#DCFCE7]"
                  title="Mark all todos as done"
                >
                  <i className="fa-solid fa-check text-xs text-[#9CA3AF]"></i>
                </button>
              </form>
            );
          })()}

          <button
            type="button"
            onClick={onEdit}
            className="w-7 h-7 bg-[#F3F4F6] rounded-lg flex items-center justify-center hover:bg-[#EEEEFF] transition-colors"
            title="Edit / Delete"
          >
            <i className="fa-solid fa-pen text-[#9CA3AF] text-xs"></i>
          </button>
        </div>
      </div>

      {/* Todos */}
      {block.todos.length > 0 && (
        <div className="space-y-2">
          {block.todos.map((todo) => (
            <div key={todo.id} className="flex items-center gap-2.5 group">
              {/* Toggle checkbox */}
              <form action={toggleTodoAction.bind(null, todo.id)}>
                <button
                  type="submit"
                  className={`cb ${todo.status === "DONE" ? "cb-done" : todo.status === "INCOMPLETE" ? "cb-warn" : ""}`}
                  title={todo.status === "DONE" ? "Mark as pending" : "Mark as done"}
                >
                  {todo.status === "DONE" && (
                    <i
                      className="fa-solid fa-check text-white"
                      style={{ fontSize: "9px" }}
                    ></i>
                  )}
                  {todo.status === "INCOMPLETE" && (
                    <i
                      className="fa-solid fa-exclamation text-[#F59E0B]"
                      style={{ fontSize: "8px" }}
                    ></i>
                  )}
                </button>
              </form>

              {/* Text */}
              <span
                className={`text-xs flex-1 ${
                  todo.status === "DONE"
                    ? "text-[#6B7280] line-through"
                    : "text-[#1A1A2E]"
                }`}
              >
                {todo.text}
              </span>

              {/* Delete on hover */}
              <form action={deleteTodoAction.bind(null, todo.id)}>
                <button
                  type="submit"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[#9CA3AF] hover:text-[#DC2626] px-1"
                  title="Delete todo"
                >
                  <i className="fa-solid fa-xmark text-xs"></i>
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      {/* Add todo */}
      <form
        action={async (formData) => {
          await addTodoAction(block.id, formData);
          if (addInputRef.current) addInputRef.current.value = "";
        }}
        className="mt-2.5 flex items-center gap-2"
      >
        <i className="fa-solid fa-plus text-[10px] text-[#6C6FDF]"></i>
        <input
          ref={addInputRef}
          name="text"
          className="flex-1 bg-transparent text-xs text-[#1A1A2E] outline-none placeholder-[#9CA3AF]"
          placeholder="Add a todo..."
          required
          maxLength={300}
        />
      </form>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
  color,
  textColor,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  textColor: string;
}) {
  const width = total ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#6B7280]">{label}</span>
        <span className="font-bold" style={{ color: textColor }}>
          {value} / {total}
        </span>
      </div>
      <div className="h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${width}%`, background: color }}
        />
      </div>
    </div>
  );
}

/** Pick a tag color class based on tag name (deterministic). */
/**
 * Compute the badge text + color for a block.
 * Considers status AND current time (when viewing today).
 */
function computeBadge(
  status: string,
  startTime: string,
  endTime: string,
  nowHHMM: string | null,
  isPastDate: boolean,
): { text: string; color: string } {
  if (status === "DONE") {
    return { text: "✓ Done", color: "text-[#15803D] bg-[#DCFCE7]" };
  }
  if (status === "SKIPPED") {
    return { text: "Skipped", color: "text-[#DC2626] bg-[#FEE2E2]" };
  }

  // Past date with no completion → Missed
  if (isPastDate && status === "PLANNED") {
    return { text: "Missed", color: "text-[#DC2626] bg-[#FEE2E2]" };
  }
  if (isPastDate && status === "PARTIAL") {
    return { text: "Partial", color: "text-[#F59E0B] bg-[#FEF3C7]" };
  }

  // Today: time-aware
  if (nowHHMM !== null) {
    if (status === "PARTIAL") {
      if (nowHHMM > endTime) {
        return { text: "Partial", color: "text-[#F59E0B] bg-[#FEF3C7]" };
      }
      return { text: "In Progress", color: "text-[#6C6FDF] bg-[#EEEEFF]" };
    }
    // PLANNED on today
    if (nowHHMM > endTime) {
      return { text: "Missed", color: "text-[#DC2626] bg-[#FEE2E2]" };
    }
    if (nowHHMM >= startTime) {
      return { text: "Now", color: "text-[#6C6FDF] bg-[#EEEEFF]" };
    }
    return { text: "Upcoming", color: "text-[#9CA3AF] bg-[#F3F4F6]" };
  }

  // Future date
  if (status === "PARTIAL") {
    return { text: "In Progress", color: "text-[#6C6FDF] bg-[#EEEEFF]" };
  }
  return { text: "Upcoming", color: "text-[#9CA3AF] bg-[#F3F4F6]" };
}

function tagClassFor(name: string): string {
  const map: Record<string, string> = {
    Study: "tag-study",
    Work: "tag-work",
    Sleep: "tag-sleep",
    Exercise: "tag-health",
    Personal: "tag-personal",
    Breakfast: "tag-meal",
    Lunch: "tag-meal",
    Dinner: "tag-meal",
    Break: "tag-break",
  };
  return map[name] ?? "tag-personal";
}
