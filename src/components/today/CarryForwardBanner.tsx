"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { carryForwardTodoAction, carryForwardWithNewBlockAction } from "@/actions/carry-forward";
import { toast } from "@/lib/toast";

// ──────────────────────────────────────────────────────────────
// CarryForwardBanner
// ──────────────────────────────────────────────────────────────
// Shows at the top of Today's Log when yesterday had unfinished
// or skipped todos. User can quickly re-add them to today or
// dismiss them.
//
// CURRENT: rendered with hardcoded dummy data so you can see it.
// TODO (user): replace `dummyCarried` with server-fetched data
//              — see /lib/carry-forward.ts or similar.
// ──────────────────────────────────────────────────────────────

export type CarriedTodo = {
  id: string;
  text: string;
  blockTitle: string;
  blockTagId: string | null;
  blockStartTime: string;
  blockEndTime: string;
};

export function CarryForwardBanner({
  todos = [],
  todayBlocks = [],
  currentDateISO,
}: {
  todos?: CarriedTodo[];
  todayBlocks?: { id: string; title: string }[];
  currentDateISO?: string;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [bannerHidden, setBannerHidden] = useState(false);
  const [, startTx] = useTransition();

  const remaining = todos.filter((t) => !dismissed.has(t.id));
  if (bannerHidden || remaining.length === 0) return null;

  // Dismiss is session-only (the source simply stays in yesterday's log).
  function dismissOne(id: string) {
    setDismissed((prev) => new Set(prev).add(id));
  }

  function dismissAll() {
    setBannerHidden(true);
  }

  function addToBlock(todoId: string, blockId: string) {
    setDismissed((prev) => new Set(prev).add(todoId));
    startTx(() => carryForwardTodoAction(todoId, blockId));
    toast("Carried forward to today");
  }

  return (
    <div
      className="mb-5 rounded-lg overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Banner header */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors"
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--surface-2)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(251,191,36,0.1)",
              border: "1px solid rgba(251,191,36,0.2)",
            }}
          >
            <i
              className="fa-solid fa-arrow-rotate-left"
              style={{ fontSize: "12px", color: "var(--warning)" }}
            ></i>
          </div>
          <div className="text-left">
            <div
              className="text-sm font-semibold"
              style={{ color: "var(--text)" }}
            >
              {remaining.length} todo{remaining.length !== 1 && "s"} carried
              from yesterday
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
              {expanded ? "Click to collapse" : "Click to view & decide"}
            </div>
          </div>
        </div>
        <i
          className={`fa-solid fa-chevron-${expanded ? "up" : "down"} text-xs`}
          style={{ color: "var(--text-3)" }}
        ></i>
      </button>

      {/* Expanded list */}
      {expanded && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "8px 12px",
          }}
        >
          {remaining.map((todo) => (
            <CarriedTodoRow
              key={todo.id}
              todo={todo}
              todayBlocks={todayBlocks}
              onAdd={(blockId) => addToBlock(todo.id, blockId)}
              onAddWithNewBlock={(todoId) => {
                setDismissed((prev) => new Set(prev).add(todoId));
                startTx(async () => {
                  await carryForwardWithNewBlockAction(todoId, currentDateISO ?? new Date().toISOString().slice(0, 10));
                  router.refresh();
                });
                toast("Carried forward to a new block");
              }}
              onDismiss={() => dismissOne(todo.id)}
            />
          ))}

          {/* Bulk actions */}
          <div
            className="flex items-center justify-between pt-3 mt-2"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <span className="text-xs" style={{ color: "var(--text-3)" }}>
              From yesterday&apos;s log
            </span>
            <button
              type="button"
              onClick={dismissAll}
              className="text-xs font-medium px-3 py-1.5 rounded transition-colors"
              style={{
                color: "var(--text-2)",
                background: "transparent",
                border: "1px solid var(--border)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Dismiss all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Single carried-todo row ───────────────────────────────────
function CarriedTodoRow({
  todo,
  todayBlocks,
  onAdd,
  onAddWithNewBlock,
  onDismiss,
}: {
  todo: CarriedTodo;
  todayBlocks: { id: string; title: string }[];
  onAdd: (blockId: string) => void;
  onAddWithNewBlock: (todoId: string) => void;
  onDismiss: () => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div
      className="flex items-center gap-3 py-2 px-2 rounded transition-colors"
      style={{ position: "relative" }}
    >
      <div
        className="cb skip flex-shrink-0"
        style={{ pointerEvents: "none" }}
      ></div>
      <div className="flex-1 min-w-0">
        <div className="text-sm" style={{ color: "var(--text)" }}>
          {todo.text}
        </div>
        <div className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
          From &quot;{todo.blockTitle}&quot;
        </div>
      </div>

      {/* Add to block */}
      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          className="text-xs font-medium px-3 py-1.5 rounded transition-opacity"
          style={{
            background: "var(--btn-primary-bg)",
            color: "var(--btn-primary-text)",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Add to today <i className="fa-solid fa-chevron-down text-[9px] ml-1"></i>
        </button>

        {pickerOpen && (
          <div
            className="menu open"
            style={{
              right: 0,
              left: "auto",
              minWidth: 180,
            }}
          >
            <button
              type="button"
              className="menu-item"
              onClick={() => {
                onAddWithNewBlock(todo.id);
                setPickerOpen(false);
              }}
            >
              <i className="fa-solid fa-arrow-rotate-left"></i> Recreate &quot;{todo.blockTitle}&quot;
            </button>
            {todayBlocks.length > 0 && (
              <>
                <div className="text-[10px] px-3 py-1.5" style={{ color: "var(--text-3)" }}>
                  Or add to existing block:
                </div>
                {todayBlocks.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className="menu-item"
                    onClick={() => {
                      onAdd(b.id);
                      setPickerOpen(false);
                    }}
                  >
                    <i className="fa-solid fa-plus"></i> {b.title}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Dismiss */}
      <button
        type="button"
        onClick={onDismiss}
        className="w-7 h-7 rounded flex items-center justify-center transition-colors"
        style={{
          background: "transparent",
          color: "var(--text-3)",
          border: "none",
          cursor: "pointer",
        }}
        title="Dismiss"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--surface-2)";
          e.currentTarget.style.color = "var(--text)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--text-3)";
        }}
      >
        <i className="fa-solid fa-xmark text-xs"></i>
      </button>
    </div>
  );
}
