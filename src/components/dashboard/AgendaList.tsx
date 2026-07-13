"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleTaskAction } from "@/actions/tasks";

export type AgendaTask = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "DONE" | "SKIPPED";
  tagName: string | null;
  tagEmoji: string | null;
};

export default function AgendaList({ tasks, nowHHMM }: {
  tasks: AgendaTask[];
  nowHHMM: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm" style={{ color: "var(--text)" }}>
          Today&apos;s Agenda
        </h2>
        <Link href="/today" className="text-xs font-semibold hover:underline" style={{ color: "var(--accent)" }}>
          Open Today&apos;s Log →
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
            Nothing planned yet
          </p>
          <p className="text-xs mb-4" style={{ color: "var(--text-3)" }}>
            Plan your day in a couple of clicks.
          </p>
          <Link href="/today" className="btn btn-primary text-xs">
            <i className="fa-solid fa-plus"></i> Add your first task
          </Link>
        </div>
      ) : (
        <div className="space-y-1.5 stagger">
          {tasks.map((t) => (
            <AgendaRow key={t.id} task={t} nowHHMM={nowHHMM} />
          ))}
        </div>
      )}
    </div>
  );
}

function AgendaRow({ task, nowHHMM }: { task: AgendaTask; nowHHMM: string }) {
  const router = useRouter();
  const [, startTx] = useTransition();
  const [optimisticDone, setOptimisticDone] = useState<boolean | null>(null);
  const isDone = optimisticDone ?? task.status === "DONE";
  const isSkipped = task.status === "SKIPPED";
  const isNow = !isDone && !isSkipped && nowHHMM >= task.startTime && nowHHMM <= task.endTime;
  const isMissed = !isDone && !isSkipped && nowHHMM > task.endTime;

  function handleToggle() {
    setOptimisticDone(!isDone);
    startTx(async () => {
      await toggleTaskAction(task.id);
      setOptimisticDone(null);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
      style={{
        background: isNow ? "var(--accent-bg)" : "var(--surface-2)",
        border: `1px solid ${isNow ? "rgba(94,106,210,.25)" : "var(--border)"}`,
        opacity: isSkipped ? 0.55 : 1,
      }}>
      {/* 40px touch target wrapping the small visual checkbox */}
      <button type="button" onClick={handleToggle}
        className="flex items-center justify-center flex-shrink-0 -my-2 -ml-2"
        style={{ width: 40, height: 40, background: "transparent", border: "none", cursor: "pointer" }}
        title={isDone ? "Mark pending" : "Mark done"}>
        <span className={`cb ${isDone ? "cb-done" : ""}`}>
          {isDone && <i className="fa-solid fa-check text-white" style={{ fontSize: 9 }} />}
        </span>
      </button>

      <span className={`flex-1 min-w-0 truncate text-sm font-medium ${isDone ? "line-through" : ""}`}
        style={{ color: isDone ? "var(--text-3)" : "var(--text)" }}>
        {task.tagEmoji ?? "📌"} {task.title}
      </span>

      <span className="text-[11px] tabular flex-shrink-0" style={{ color: "var(--text-3)" }}>
        {task.startTime}–{task.endTime}
      </span>

      {isNow && (
        <span className="pill pill-now flex-shrink-0">Now</span>
      )}
      {isMissed && (
        <span className="pill pill-missed flex-shrink-0">Missed</span>
      )}
      {isSkipped && (
        <span className="pill pill-skipped flex-shrink-0">Skipped</span>
      )}
    </div>
  );
}
