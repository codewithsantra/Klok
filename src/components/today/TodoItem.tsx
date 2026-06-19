"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  toggleTodoAction,
  deleteTodoAction,
  setTodoStatusAction,
  updateTodoCommentAction,
  updateTodoTextAction,
  startTimerAction,
  pauseTimerAction,
  logProgressAction,
} from "@/actions/todos";

// ──────────────────────────────────────────────────────────────
// Todo shape (UI-only).
//
// Trackable fields are OPTIONAL — when the schema adds them,
// they'll flow through automatically and trigger the trackable
// card rendering. Until then, every todo renders as a simple row.
// ──────────────────────────────────────────────────────────────
export type TodoData = {
  id: string;
  text: string;
  status: "PENDING" | "DONE" | "INCOMPLETE" | "SKIPPED";
  comment: string | null;

  /** Trackable goal — NULL on simple todos. */
  metricType?: "TIME" | "DISTANCE" | "COUNT" | "CUSTOM" | null;
  metricUnit?: string | null;
  metricTarget?: number | null;
  metricActual?: number | null;

  /** Timer state (only meaningful when metricType === "TIME"). */
  timerStartedAt?: string | null;
  timerAccumMs?: number | null;
};

export function TodoItem({ todo }: { todo: TodoData }) {
  if (todo.metricType) return <TrackableTodo todo={todo} />;
  return <SimpleTodo todo={todo} />;
}

// ──────────────────────────────────────────────────────────────
// SIMPLE TODO
// ──────────────────────────────────────────────────────────────
function SimpleTodo({ todo }: { todo: TodoData }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [showNote, setShowNote] = useState(!!todo.comment);
  const [noteText, setNoteText] = useState(todo.comment ?? "");
  const [skipMode, setSkipMode] = useState(
    todo.status === "INCOMPLETE" || todo.status === "SKIPPED",
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [optimisticDone, setOptimisticDone] = useState<boolean | null>(null);
  const [, startTx] = useTransition();

  const menuWrapRef = useRef<HTMLDivElement>(null);

  // Close menu / confirm on outside click
  useEffect(() => {
    if (!menuOpen && !confirmDelete) return;
    function handler(e: MouseEvent) {
      if (
        menuWrapRef.current &&
        !menuWrapRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen, confirmDelete]);

  const isDone = optimisticDone ?? (todo.status === "DONE");

  function handleToggle() {
    const newDone = !isDone;
    setOptimisticDone(newDone);
    startTx(async () => {
      await toggleTodoAction(todo.id);
      setOptimisticDone(null);
    });
  }

  function handleMarkSkipped() {
    setMenuOpen(false);
    setSkipMode(true);
    setShowNote(false);
    startTx(() => setTodoStatusAction(todo.id, "SKIPPED"));
  }
  function handleAddNote() {
    setMenuOpen(false);
    setShowNote(true);
  }
  function handleEditClick() {
    setMenuOpen(false);
    setEditText(todo.text);
    setEditing(true);
  }
  function handleSaveEdit() {
    setEditing(false);
    const trimmed = editText.trim();
    if (trimmed && trimmed !== todo.text) {
      startTx(() => updateTodoTextAction(todo.id, trimmed));
    }
  }
  function handleDeleteClick() {
    setMenuOpen(false);
    setConfirmDelete(true);
  }
  function handleNoteSave() {
    if (noteText !== (todo.comment ?? "")) {
      startTx(() => updateTodoCommentAction(todo.id, noteText));
    }
  }

  return (
    <>
      <div
        className={`todo-row ${isDone ? "is-done" : ""} ${skipMode ? "is-skip" : ""}`}
      >
        {/* Checkbox */}
        <button
          type="button"
          onClick={handleToggle}
          className={`cb ${isDone ? "cb-done" : ""}`}
          title={isDone ? "Mark as pending" : "Mark as done"}
        >
          {isDone && (
            <i
              className="fa-solid fa-check text-white"
              style={{ fontSize: "9px" }}
            />
          )}
        </button>

        {/* Todo text — click to edit */}
        {editing ? (
          <input
            className="todo-text-edit"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveEdit();
              if (e.key === "Escape") {
                setEditText(todo.text);
                setEditing(false);
              }
            }}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            maxLength={300}
          />
        ) : (
          <span
            className="todo-text-display"
            onClick={handleEditClick}
            title="Click to edit"
          >
            {todo.text}
          </span>
        )}

        {/* Single 3-dot menu */}
        <div className="menu-wrap" ref={menuWrapRef}>
          <button
            type="button"
            className={`menu-trigger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen((o) => !o)}
            title="More actions"
          >
            <i className="fa-solid fa-ellipsis-vertical"></i>
          </button>

          <div className={`menu ${menuOpen ? "open" : ""}`}>
            <button
              type="button"
              className="menu-item"
              onClick={handleMarkSkipped}
            >
              <i className="fa-solid fa-ban"></i> Mark skipped
            </button>
            <button
              type="button"
              className="menu-item"
              onClick={handleAddNote}
            >
              <i className="fa-solid fa-comment"></i> Add note
            </button>
            <button
              type="button"
              className="menu-item"
              onClick={handleEditClick}
            >
              <i className="fa-solid fa-pen"></i> Edit
            </button>
            <div className="menu-divider"></div>
            <button
              type="button"
              className="menu-item danger"
              onClick={handleDeleteClick}
            >
              <i className="fa-solid fa-trash"></i> Delete
            </button>
          </div>

          {/* Delete confirmation popover */}
          {confirmDelete && (
            <div className="confirm-popover">
              <p>Delete this todo?</p>
              <div className="actions">
                <button
                  type="button"
                  className="cancel"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
                <form action={deleteTodoAction.bind(null, todo.id)}>
                  <button type="submit" className="confirm">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Skip comment row (amber) */}
      {skipMode && (
        <div className="comment-row skip">
          <i className="fa-solid fa-comment comment-icon"></i>
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onBlur={handleNoteSave}
            placeholder="When / why? (optional)"
            maxLength={500}
          />
        </div>
      )}

      {/* Plain note row (neutral) */}
      {!skipMode && showNote && (
        <div className="comment-row note">
          <i className="fa-solid fa-comment comment-icon"></i>
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onBlur={handleNoteSave}
            placeholder="Add a note..."
            maxLength={500}
          />
        </div>
      )}
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// TRACKABLE TODO (card style with progress bar + timer + log)
// ──────────────────────────────────────────────────────────────
function TrackableTodo({ todo }: { todo: TodoData }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [skipMode, setSkipMode] = useState(
    todo.status === "INCOMPLETE" || todo.status === "SKIPPED",
  );
  const [showNote, setShowNote] = useState(!!todo.comment);
  const [noteText, setNoteText] = useState(todo.comment ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [, startTx] = useTransition();

  // Timer state — seeded from server props, kept live by a local interval.
  const [running, setRunning] = useState(!!todo.timerStartedAt);
  const [accumMs, setAccumMs] = useState(todo.timerAccumMs ?? 0);
  const [startedAt, setStartedAt] = useState<number | null>(
    todo.timerStartedAt ? new Date(todo.timerStartedAt).getTime() : null,
  );
  const [, setTick] = useState(0);

  // Manual log form
  const [logging, setLogging] = useState(false);
  const [logValue, setLogValue] = useState("");

  // Mirror of metricActual; re-synced from server after each revalidation.
  const [actual, setActual] = useState(todo.metricActual ?? 0);

  // Re-sync local mirrors when the server sends fresh props (post-revalidate).
  useEffect(() => {
    setRunning(!!todo.timerStartedAt);
    setStartedAt(
      todo.timerStartedAt ? new Date(todo.timerStartedAt).getTime() : null,
    );
    setAccumMs(todo.timerAccumMs ?? 0);
    setActual(todo.metricActual ?? 0);
  }, [todo.timerStartedAt, todo.timerAccumMs, todo.metricActual]);

  const menuWrapRef = useRef<HTMLDivElement>(null);

  // Tick once a second while timer is running
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Close menu / confirm on outside click
  useEffect(() => {
    if (!menuOpen && !confirmDelete) return;
    function handler(e: MouseEvent) {
      if (
        menuWrapRef.current &&
        !menuWrapRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen, confirmDelete]);

  const [optimisticDone, setOptimisticDone] = useState<boolean | null>(null);
  const isDone = optimisticDone ?? (todo.status === "DONE");
  const target = todo.metricTarget ?? 0;
  const unit = todo.metricUnit ?? "";
  const elapsedMs =
    running && startedAt ? accumMs + (Date.now() - startedAt) : accumMs;
  const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
  const logLabel =
    todo.metricType === "TIME"
      ? "Log time"
      : todo.metricType === "DISTANCE"
        ? "Log distance"
        : todo.metricType === "COUNT"
          ? `Log ${unit || "count"}`
          : `Log ${unit || "value"}`;

  function fmt(ms: number) {
    const t = Math.floor(ms / 1000);
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function handleStart() {
    setStartedAt(Date.now());
    setRunning(true);
    startTx(() => startTimerAction(todo.id));
  }

  function handlePause() {
    if (startedAt) {
      const newAccum = accumMs + (Date.now() - startedAt);
      setAccumMs(newAccum);
      if (todo.metricType === "TIME") {
        // Reflect time worked into "actual" (hours)
        setActual(newAccum / 3600000);
      }
    }
    setStartedAt(null);
    setRunning(false);
    startTx(() => pauseTimerAction(todo.id));
  }

  function handleLogSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const v = parseFloat(logValue);
    if (!isNaN(v) && v > 0) {
      setActual(actual + v);
      startTx(() => logProgressAction(todo.id, v));
    }
    setLogValue("");
    setLogging(false);
  }

  function formatActual(n: number) {
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  }

  return (
    <div
      className={`todo-track ${running ? "running" : ""} ${isDone ? "is-done" : ""}`}
    >
      <div className="track-head">
        {/* Checkbox */}
        <button
          type="button"
          onClick={() => {
            const newDone = !isDone;
            setOptimisticDone(newDone);
            startTx(async () => {
              await toggleTodoAction(todo.id);
              setOptimisticDone(null);
            });
          }}
          className={`cb ${isDone ? "cb-done" : ""}`}
          title={isDone ? "Mark as pending" : "Mark as done"}
        >
          {isDone && (
            <i
              className="fa-solid fa-check text-white"
              style={{ fontSize: "9px" }}
            />
          )}
        </button>

        {/* Name (editable inline) */}
        {editing ? (
          <input
            className="todo-text-edit"
            style={{ flex: 1, fontSize: "14.5px", fontWeight: 500 }}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={() => {
              setEditing(false);
              const t = editText.trim();
              if (t && t !== todo.text)
                startTx(() => updateTodoTextAction(todo.id, t));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                setEditText(todo.text);
                setEditing(false);
              }
            }}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            maxLength={300}
          />
        ) : (
          <span
            className="track-name"
            onClick={() => {
              setEditText(todo.text);
              setEditing(true);
            }}
            title="Click to edit"
          >
            {todo.text}
          </span>
        )}

        <span className="track-target">
          Target: {target} {unit}
        </span>

        {/* Menu */}
        <div className="menu-wrap" ref={menuWrapRef}>
          <button
            type="button"
            className={`menu-trigger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen((o) => !o)}
            style={{ opacity: 1 }}
            title="More actions"
          >
            <i className="fa-solid fa-ellipsis-vertical"></i>
          </button>
          <div className={`menu ${menuOpen ? "open" : ""}`}>
            <button
              type="button"
              className="menu-item"
              onClick={() => {
                setSkipMode(true);
                setMenuOpen(false);
                startTx(() => setTodoStatusAction(todo.id, "SKIPPED"));
              }}
            >
              <i className="fa-solid fa-ban"></i> Mark skipped
            </button>
            <button
              type="button"
              className="menu-item"
              onClick={() => {
                setShowNote(true);
                setMenuOpen(false);
              }}
            >
              <i className="fa-solid fa-comment"></i> Add note
            </button>
            <button
              type="button"
              className="menu-item"
              onClick={() => {
                setEditText(todo.text);
                setEditing(true);
                setMenuOpen(false);
              }}
            >
              <i className="fa-solid fa-pen"></i> Edit
            </button>
            <div className="menu-divider"></div>
            <button
              type="button"
              className="menu-item danger"
              onClick={() => {
                setMenuOpen(false);
                setConfirmDelete(true);
              }}
            >
              <i className="fa-solid fa-trash"></i> Delete
            </button>
          </div>
          {confirmDelete && (
            <div className="confirm-popover">
              <p>Delete this todo?</p>
              <div className="actions">
                <button
                  type="button"
                  className="cancel"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
                <form action={deleteTodoAction.bind(null, todo.id)}>
                  <button type="submit" className="confirm">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="track-progress">
        <div className="info">
          <span className="actual">{formatActual(actual)}</span>
          <span className="of">
            {" "}
            / {target} {unit}
          </span>
          <span className="pct">{Math.round(pct)}%</span>
        </div>
        <div className="bar">
          <div style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Controls */}
      <div className="track-controls">
        {todo.metricType === "TIME" &&
          (running ? (
            <div className="timer-display">
              <span className="pulse-dot"></span>
              <span>{fmt(elapsedMs)}</span>
              <button
                type="button"
                className="pause-inline"
                onClick={handlePause}
              >
                <i
                  className="fa-solid fa-pause"
                  style={{ fontSize: "10px" }}
                ></i>{" "}
                Pause
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="track-btn"
              onClick={handleStart}
            >
              <i className="fa-solid fa-play"></i> Start Timer
            </button>
          ))}

        {!logging ? (
          <button
            type="button"
            className="track-btn secondary"
            onClick={() => setLogging(true)}
          >
            <i className="fa-solid fa-plus"></i> {logLabel}
          </button>
        ) : (
          <form className="log-form" onSubmit={handleLogSubmit}>
            <input
              type="number"
              step="0.25"
              min="0"
              placeholder="0"
              value={logValue}
              onChange={(e) => setLogValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setLogging(false);
                  setLogValue("");
                }
              }}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
            <span className="unit">{unit}</span>
            <button type="submit">Add</button>
          </form>
        )}
      </div>

      {/* Comment rows */}
      {skipMode && (
        <div className="comment-row skip" style={{ marginTop: 10 }}>
          <i className="fa-solid fa-comment comment-icon"></i>
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onBlur={() => {
              if (noteText !== (todo.comment ?? ""))
                startTx(() => updateTodoCommentAction(todo.id, noteText));
            }}
            placeholder="When / why? (optional)"
            maxLength={500}
          />
        </div>
      )}
      {!skipMode && showNote && (
        <div className="comment-row note" style={{ marginTop: 10 }}>
          <i className="fa-solid fa-comment comment-icon"></i>
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onBlur={() => {
              if (noteText !== (todo.comment ?? ""))
                startTx(() => updateTodoCommentAction(todo.id, noteText));
            }}
            placeholder="Add a note..."
            maxLength={500}
          />
        </div>
      )}
    </div>
  );
}
