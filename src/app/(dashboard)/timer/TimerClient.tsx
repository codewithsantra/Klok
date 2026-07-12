"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createTimerSessionAction, deleteTimerSessionAction,
  addTimerSubItemAction, deleteTimerSubItemAction,
  startSubItemTimerAction, pauseSubItemTimerAction,
  updateTimerSessionAction, updateTimerSubItemAction,
} from "@/actions/timer-sessions";
import { toast } from "@/lib/toast";

type SubItemView = {
  id: string;
  title: string;
  targetMinutes: number;
  timerStartedAt: string | null;
  timerAccumMs: number;
  taskId: string | null;
  taskTitle: string | null;
};

type SessionView = {
  id: string;
  title: string;
  tagId: string | null;
  tagName: string | null;
  tagEmoji: string | null;
  targetMinutes: number;
  subItems: SubItemView[];
};

type TaskOption = {
  id: string;
  title: string;
  tagEmoji: string | null;
  startTime: string;
  endTime: string;
};

type Tag = { id: string; name: string; emoji: string };

type PendingSub = { title: string; minutes: number; taskId: string | null };

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function fmtMin(m: number): string {
  const h = Math.floor(m / 60);
  const mm = Math.round(m % 60);
  return h > 0 ? `${h}h ${mm}m` : `${mm}m`;
}

export default function TimerClient({
  sessions, tasks, tags,
}: {
  sessions: SessionView[];
  tasks: TaskOption[];
  tags: Tag[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editSession, setEditSession] = useState<SessionView | null>(null);
  const [, setTick] = useState(0);

  const hasRunning = sessions.some((s) => s.subItems.some((i) => i.timerStartedAt));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (hasRunning) intervalRef.current = setInterval(() => setTick((t) => t + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [hasRunning]);

  function openCreate() { setEditSession(null); setModalOpen(true); }
  function openEdit(s: SessionView) { setEditSession(s); setModalOpen(true); }

  const totalElapsedMs = sessions.reduce((sum, s) =>
    sum + s.subItems.reduce((si, i) => {
      let ms = i.timerAccumMs;
      if (i.timerStartedAt) ms += Date.now() - new Date(i.timerStartedAt).getTime();
      return si + ms;
    }, 0), 0);
  const totalTargetMs = sessions.reduce((s, sess) => s + sess.targetMinutes * 60000, 0);
  const overallPct = totalTargetMs > 0 ? Math.min(Math.round((totalElapsedMs / totalTargetMs) * 100), 100) : 0;

  if (sessions.length === 0 && !modalOpen) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "var(--accent-bg)" }}>
          <i className="fa-solid fa-stopwatch" style={{ fontSize: 24, color: "var(--accent)" }}></i>
        </div>
        <h2 className="font-display text-xl font-bold mb-2" style={{ color: "var(--text)" }}>
          Focus Timer
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-3)" }}>
          Create a timed session to track deep work.
        </p>
        <button onClick={openCreate} className="btn btn-primary">
          <i className="fa-solid fa-plus"></i> New Session
        </button>
        <SessionModal open={modalOpen} onClose={() => setModalOpen(false)}
          session={editSession} tags={tags} tasks={tasks} router={router} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-xl font-extrabold" style={{ color: "var(--text)" }}>
            Focus Timer
          </h1>
          {sessions.length > 0 && (
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs" style={{ color: "var(--text-3)" }}>
                {sessions.length} session{sessions.length > 1 ? "s" : ""} · {fmtMin(totalElapsedMs / 60000)} logged
              </span>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)", width: 80 }}>
                <div className="h-full rounded-full" style={{
                  width: `${overallPct}%`,
                  background: overallPct >= 100 ? "var(--success)" : "var(--accent)",
                }} />
              </div>
              <span className="text-[10px] font-bold tabular" style={{ color: "var(--accent)" }}
                suppressHydrationWarning>{overallPct}%</span>
            </div>
          )}
        </div>
        <button onClick={openCreate} className="btn btn-primary" style={{ fontSize: 12 }}>
          <i className="fa-solid fa-plus"></i> New Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} router={router}
            onEdit={() => openEdit(session)} />
        ))}
      </div>

      <SessionModal open={modalOpen} onClose={() => setModalOpen(false)}
        session={editSession} tags={tags} tasks={tasks} router={router} />
    </div>
  );
}

// ── Session Modal ─────────────────────────────────────
function SessionModal({ open, onClose, session, tags, tasks, router }: {
  open: boolean;
  onClose: () => void;
  session: SessionView | null;
  tags: Tag[];
  tasks: TaskOption[];
  router: ReturnType<typeof useRouter>;
}) {
  const [, startTx] = useTransition();
  const isEdit = !!session;
  const [title, setTitle] = useState("");
  const [tagId, setTagId] = useState("");
  const [hours, setHours] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [subTitle, setSubTitle] = useState("");
  const [subHours, setSubHours] = useState("");
  const [subSource, setSubSource] = useState<"new" | "task">("new");
  const [subTaskId, setSubTaskId] = useState("");
  const [subError, setSubError] = useState("");
  const [pendingSubs, setPendingSubs] = useState<PendingSub[]>([]);
  const [removedSubIds, setRemovedSubIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    if (session) {
      setTitle(session.title);
      setTagId(session.tagId ?? "");
      setHours(String(session.targetMinutes / 60));
    } else {
      setTitle(""); setTagId(""); setHours("");
    }
    setSubTitle(""); setSubHours(""); setSubSource("new"); setSubTaskId("");
    setPendingSubs([]); setConfirmDelete(false); setSubError("");
    setRemovedSubIds(new Set());
  }, [open, session]);

  if (!open) return null;

  const currentTotalMin = Math.round(parseFloat(hours || "0") * 60) || 0;
  const visibleSubItems = session ? session.subItems.filter((i) => !removedSubIds.has(i.id)) : [];
  const existingUsedMin = visibleSubItems.reduce((s, i) => s + i.targetMinutes, 0);
  const pendingUsedMin = pendingSubs.reduce((s, p) => s + p.minutes, 0);
  const usedMin = existingUsedMin + pendingUsedMin;
  const remainingMin = Math.max(currentTotalMin - usedMin, 0);

  function addLocalSub() {
    const t = subSource === "task" ? tasks.find((tk) => tk.id === subTaskId)?.title ?? subTitle : subTitle;
    if (!t.trim() && (!subHours || isNaN(parseFloat(subHours)) || parseFloat(subHours) <= 0)) {
      setSubError("Name and hours are required"); return;
    }
    if (!t.trim()) { setSubError("Enter a sub-item name"); return; }
    if (!subHours || isNaN(parseFloat(subHours))) { setSubError("Enter hours"); return; }
    const mins = Math.round(parseFloat(subHours) * 60);
    if (mins <= 0) { setSubError("Hours must be greater than 0"); return; }
    setSubError("");
    if (mins > remainingMin) {
      const newTotalMin = usedMin + mins;
      setHours(String(newTotalMin / 60));
    }
    setPendingSubs((prev) => [...prev, { title: t.trim(), minutes: mins, taskId: subSource === "task" ? subTaskId || null : null }]);
    setSubTitle(""); setSubHours("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const mins = Math.round(parseFloat(hours) * 60);
    if (!title.trim() || mins <= 0) return;
    setSubmitting(true);

    if (isEdit && session) {
      startTx(async () => {
        await updateTimerSessionAction(session.id, title.trim(), tagId || null, mins);
        for (const ps of pendingSubs) {
          await addTimerSubItemAction(session.id, ps.title, ps.minutes, ps.taskId);
        }
        router.refresh();
        toast("Session updated");
        onClose();
        setSubmitting(false);
      });
    } else {
      const today = new Intl.DateTimeFormat("en-CA").format(new Date());
      startTx(async () => {
        const res = await createTimerSessionAction(title.trim(), tagId || null, today, mins);
        if (res && "error" in res) { toast(res.error!); setSubmitting(false); return; }
        if (res && "id" in res && pendingSubs.length > 0) {
          for (const ps of pendingSubs) {
            await addTimerSubItemAction(res.id, ps.title, ps.minutes, ps.taskId);
          }
        }
        toast("Session created");
        onClose();
        setSubmitting(false);
        router.refresh();
      });
    }
  }

  async function handleDeleteSub(subId: string) {
    setRemovedSubIds((prev) => new Set(prev).add(subId));
    startTx(async () => {
      await deleteTimerSubItemAction(subId);
      router.refresh();
      toast("Sub-item removed");
    });
  }

  async function handleDeleteSession() {
    if (!session) return;
    startTx(async () => {
      await deleteTimerSessionAction(session.id);
      router.refresh();
      toast("Session deleted");
      onClose();
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal-card w-full max-w-md animate-fade-in" onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
        <div className="modal-head flex items-center justify-between p-5 flex-shrink-0">
          <h2 className="font-semibold" style={{ color: "var(--text)" }}>
            {isEdit ? "Edit Session" : "New Timer Session"}
          </h2>
          <button type="button" onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <i className="fa-solid fa-xmark text-sm" style={{ color: "var(--text-2)" }}></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div className="modal-body space-y-3 p-5" style={{ overflowY: "auto", flex: 1 }}>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text)" }}>Title</label>
              <input className="inp" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Study, Deep Work..." required maxLength={100} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text)" }}>Tag</label>
                <select className="inp" value={tagId} onChange={(e) => setTagId(e.target.value)}>
                  <option value="">No tag</option>
                  {tags.map((t) => <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text)" }}>Duration</label>
                <div className="flex items-center gap-2">
                  <input type="number" step="0.5" min="0.5" placeholder="2"
                    value={hours} onChange={(e) => setHours(e.target.value)}
                    className="inp flex-1" required style={{ fontSize: 12 }} />
                  <span className="text-xs" style={{ color: "var(--text-3)" }}>hrs</span>
                </div>
              </div>
            </div>

            {/* Sub-items section — both create and edit */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>Sub-items</span>
                {currentTotalMin > 0 ? (
                  <span className="text-[10px]" style={{ color: remainingMin > 0 ? "var(--text-3)" : "var(--success)" }}>
                    {remainingMin > 0 ? `${fmtMin(remainingMin)} remaining` : "Fully allocated"}
                  </span>
                ) : (
                  <span className="text-[10px]" style={{ color: "var(--text-3)" }}>Set duration first</span>
                )}
              </div>

                {/* Existing sub-items (edit mode) */}
                {session && visibleSubItems.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {visibleSubItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-md"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                        <div>
                          <span className="text-xs font-medium" style={{ color: "var(--text)" }}>{item.title}</span>
                          <span className="text-[10px] ml-2" style={{ color: "var(--text-3)" }}>{fmtMin(item.targetMinutes)}</span>
                        </div>
                        <button type="button" onClick={() => handleDeleteSub(item.id)}
                          className="w-5 h-5 rounded flex items-center justify-center"
                          style={{ background: "transparent", border: "none", cursor: "pointer" }}>
                          <i className="fa-solid fa-xmark" style={{ fontSize: 9, color: "var(--text-3)" }}></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pending sub-items (create mode) */}
                {pendingSubs.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {pendingSubs.map((ps, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-md"
                        style={{ background: "var(--accent-bg)", border: "1px solid rgba(94,106,210,.15)" }}>
                        <div>
                          <span className="text-xs font-medium" style={{ color: "var(--text)" }}>{ps.title}</span>
                          <span className="text-[10px] ml-2" style={{ color: "var(--text-3)" }}>{fmtMin(ps.minutes)}</span>
                        </div>
                        <button type="button" onClick={() => setPendingSubs((prev) => prev.filter((_, j) => j !== i))}
                          className="w-5 h-5 rounded flex items-center justify-center"
                          style={{ background: "transparent", border: "none", cursor: "pointer" }}>
                          <i className="fa-solid fa-xmark" style={{ fontSize: 9, color: "var(--text-3)" }}></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty hint when no duration yet */}
                {currentTotalMin === 0 && pendingSubs.length === 0 && (!session || session.subItems.length === 0) && (
                  <div className="text-center py-3 rounded-md"
                    style={{ background: "var(--surface-2)", border: "1px dashed var(--border)" }}>
                    <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                      Enter a duration above to add sub-items
                    </span>
                  </div>
                )}

                {/* Add sub-item form */}
                {currentTotalMin > 0 && (
                  <div className="p-3 rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    {remainingMin === 0 && (
                      <p className="text-[10px] mb-2" style={{ color: "var(--warning)" }}>
                        <i className="fa-solid fa-circle-info mr-1" style={{ fontSize: 9 }}></i>
                        Duration will auto-increase when you add more sub-items
                      </p>
                    )}
                    <div className="flex gap-1.5 mb-2">
                      <button type="button" onClick={() => setSubSource("new")}
                        className="text-[10px] px-2 py-1 rounded font-medium"
                        style={{
                          background: subSource === "new" ? "var(--accent)" : "transparent",
                          color: subSource === "new" ? "white" : "var(--text-2)",
                          border: "1px solid " + (subSource === "new" ? "var(--accent)" : "var(--border)"),
                          cursor: "pointer",
                        }}>New</button>
                      {tasks.length > 0 && (
                        <button type="button" onClick={() => { setSubSource("task"); setSubTaskId(tasks[0]?.id ?? ""); }}
                          className="text-[10px] px-2 py-1 rounded font-medium"
                          style={{
                            background: subSource === "task" ? "var(--accent)" : "transparent",
                            color: subSource === "task" ? "white" : "var(--text-2)",
                            border: "1px solid " + (subSource === "task" ? "var(--accent)" : "var(--border)"),
                            cursor: "pointer",
                          }}>From task</button>
                      )}
                    </div>
                    {subSource === "new" ? (
                      <input className="inp mb-2" value={subTitle} onChange={(e) => { setSubTitle(e.target.value); setSubError(""); }}
                        placeholder="Sub-item name..." maxLength={100} style={{ fontSize: 12 }} />
                    ) : (
                      <select className="inp mb-2" value={subTaskId} onChange={(e) => setSubTaskId(e.target.value)}
                        style={{ fontSize: 12 }}>
                        {tasks.map((t) => (
                          <option key={t.id} value={t.id}>{t.tagEmoji ?? "📌"} {t.title}</option>
                        ))}
                      </select>
                    )}
                    {subError && (
                      <p className="text-[11px] mb-1.5 flex items-center gap-1" style={{ color: "var(--danger)" }}>
                        <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 10 }}></i>
                        {subError}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <input type="number" step="0.25" min="0.25"
                        value={subHours} onChange={(e) => { setSubHours(e.target.value); setSubError(""); }}
                        placeholder="hrs" className="inp flex-1" style={{ fontSize: 12 }} />
                      <button type="button" onClick={addLocalSub}
                        className="text-xs font-semibold px-3 py-1.5 rounded"
                        style={{ color: "var(--btn-primary-text)", background: "var(--btn-primary-bg)", border: "none", cursor: "pointer" }}>
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          <div className="modal-foot flex items-center gap-3 p-5 flex-shrink-0"
            style={{ borderTop: "1px solid var(--border)" }}>
            {isEdit && session && !confirmDelete && (
              <button type="button" disabled={submitting} onClick={() => setConfirmDelete(true)}
                className="btn btn-outline" style={{ fontSize: 12, color: "var(--danger)" }}>
                <i className="fa-solid fa-trash"></i> Delete
              </button>
            )}
            {isEdit && confirmDelete && (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--danger)" }}>Sure?</span>
                <button type="button" onClick={handleDeleteSession}
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
              {submitting ? "Saving..." : isEdit ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Session Card ─────────────────────────────────────
function SessionCard({ session, router, onEdit }: {
  session: SessionView; router: ReturnType<typeof useRouter>; onEdit: () => void;
}) {
  const [, setTick] = useState(0);

  const hasRunning = session.subItems.some((i) => i.timerStartedAt);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (hasRunning) intervalRef.current = setInterval(() => setTick((t) => t + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [hasRunning]);

  const totalElapsedMs = session.subItems.reduce((sum, i) => {
    let ms = i.timerAccumMs;
    if (i.timerStartedAt) ms += Date.now() - new Date(i.timerStartedAt).getTime();
    return sum + ms;
  }, 0);
  const overallPct = Math.min(Math.round((totalElapsedMs / (session.targetMinutes * 60000)) * 100), 100);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>
            {session.tagEmoji ?? "🎯"} {session.title}
          </span>
          {session.tagName && (
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
              {session.tagName}
            </span>
          )}
        </div>
        <button type="button" onClick={onEdit}
          className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          title="Edit session">
          <i className="fa-solid fa-pen" style={{ fontSize: 9, color: "var(--text-3)" }}></i>
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <div className="h-full rounded-full" style={{
            width: `${overallPct}%`,
            background: overallPct >= 100 ? "var(--success)" : "var(--accent)",
            transition: "width .35s cubic-bezier(0.2,0,0,1)",
          }} />
        </div>
        <span className="text-[10px] font-bold tabular flex-shrink-0"
          style={{ color: overallPct >= 100 ? "var(--success)" : "var(--accent)" }}
          suppressHydrationWarning>
          {fmtMin(totalElapsedMs / 60000)} / {fmtMin(session.targetMinutes)}
        </span>
      </div>

      {session.subItems.length === 0 ? (
        <button type="button" onClick={onEdit}
          className="w-full text-center py-3 rounded-md text-xs"
          style={{ background: "var(--surface-2)", border: "1px dashed var(--border)", color: "var(--text-3)", cursor: "pointer" }}>
          <i className="fa-solid fa-plus mr-1"></i> Add sub-items to start tracking
        </button>
      ) : (
        <div className="space-y-1.5">
          {session.subItems.map((item) => (
            <SubItemRow key={item.id} item={item} router={router} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sub-item Row ─────────────────────────────────────
function SubItemRow({ item, router }: { item: SubItemView; router: ReturnType<typeof useRouter> }) {
  const [, startTx] = useTransition();
  const running = !!item.timerStartedAt;
  const elapsed = item.timerAccumMs + (running && item.timerStartedAt ? Date.now() - new Date(item.timerStartedAt).getTime() : 0);
  const targetMs = item.targetMinutes * 60000;
  const pct = Math.min(Math.round((elapsed / targetMs) * 100), 100);

  function handleStart() {
    startTx(async () => { await startSubItemTimerAction(item.id); router.refresh(); });
  }
  function handlePause() {
    startTx(async () => { await pauseSubItemTimerAction(item.id); router.refresh(); });
  }

  return (
    <div className="flex items-center gap-2.5 p-2 rounded-lg"
      style={{ background: running ? "var(--accent-bg)" : "var(--surface-2)", border: "1px solid " + (running ? "rgba(94,106,210,.2)" : "var(--border)") }}>
      {!running ? (
        <button type="button" onClick={handleStart}
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", border: "none", cursor: "pointer" }}
          title="Start">
          <i className="fa-solid fa-play" style={{ fontSize: 9, marginLeft: 1 }}></i>
        </button>
      ) : (
        <button type="button" onClick={handlePause}
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--surface)", color: "var(--accent)", border: "2px solid var(--accent)", cursor: "pointer" }}
          title="Pause">
          <i className="fa-solid fa-pause" style={{ fontSize: 9 }}></i>
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>
            {item.title}
          </span>
          <span className="text-[10px] font-semibold tabular ml-2 flex-shrink-0"
            style={{ color: running ? "var(--accent)" : "var(--text-3)" }}
            suppressHydrationWarning>
            {fmt(elapsed)} <span style={{ fontWeight: 400, opacity: 0.7 }}>/ {fmtMin(item.targetMinutes)}</span>
          </span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <div className="h-full rounded-full" style={{
            width: `${pct}%`,
            background: pct >= 100 ? "var(--success)" : "var(--accent)",
            transition: "width .3s ease",
          }} />
        </div>
      </div>
    </div>
  );
}
