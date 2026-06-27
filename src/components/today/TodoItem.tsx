"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  toggleTodoAction,
  deleteTodoAction,
  setTodoStatusAction,
  updateTodoCommentAction,
  updateTodoTextAction,
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
};

export function TodoItem({ todo }: { todo: TodoData }) {
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
        <NoteRow
          variant="skip"
          value={noteText}
          onChange={setNoteText}
          onSave={(v) => {
            if (v !== (todo.comment ?? ""))
              startTx(() => updateTodoCommentAction(todo.id, v));
          }}
          placeholder="When / why? (optional)"
        />
      )}

      {/* Plain note row (neutral) */}
      {!skipMode && showNote && (
        <NoteRow
          variant="note"
          value={noteText}
          onChange={setNoteText}
          onSave={(v) => {
            if (v !== (todo.comment ?? ""))
              startTx(() => updateTodoCommentAction(todo.id, v));
          }}
          placeholder="Add a note..."
        />
      )}
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// NOTE ROW — editable comment with explicit Save (+ Enter to save)
// and a brief "Saved" confirmation so the action is never silent.
// ──────────────────────────────────────────────────────────────
function NoteRow({
  variant,
  value,
  onChange,
  onSave,
  placeholder,
  style,
}: {
  variant: "skip" | "note";
  value: string;
  onChange: (v: string) => void;
  onSave: (v: string) => void;
  placeholder: string;
  style?: React.CSSProperties;
}) {
  const [saved, setSaved] = useState(false);
  const flashRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function save() {
    onSave(value);
    setSaved(true);
    if (flashRef.current) clearTimeout(flashRef.current);
    flashRef.current = setTimeout(() => setSaved(false), 1600);
  }

  useEffect(
    () => () => {
      if (flashRef.current) clearTimeout(flashRef.current);
    },
    [],
  );

  return (
    <div className={`comment-row ${variant}`} style={style}>
      <i className="fa-solid fa-comment comment-icon"></i>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        placeholder={placeholder}
        maxLength={500}
        // Inline so the flex item can shrink (the stylesheet min-width:0
        // gets overridden by Tailwind's layer cascade on some builds).
        style={{ minWidth: 0 }}
      />
      {saved ? (
        <span className="note-saved">
          <i className="fa-solid fa-check" style={{ fontSize: 10 }}></i> Saved
        </span>
      ) : (
        <button
          type="button"
          className="note-save"
          // Keep input focus so onBlur doesn't double-fire before the click.
          onMouseDown={(e) => e.preventDefault()}
          onClick={save}
        >
          Save
        </button>
      )}
    </div>
  );
}
