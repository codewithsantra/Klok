"use client";

import { useEffect, useState, useTransition } from "react";
import {
  startBlockTimerAction,
  pauseBlockTimerAction,
  logBlockProgressAction,
} from "@/actions/block-track";
import { toast } from "@/lib/toast";

export type BlockMetric = {
  id: string;
  metricType: "TIME" | "DISTANCE" | "COUNT" | "CUSTOM";
  metricUnit: string | null;
  metricTarget: number | null;
  metricActual: number;
  timerStartedAt: string | null;
  timerAccumMs: number;
};

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function BlockTracker({ block }: { block: BlockMetric }) {
  const [, startTx] = useTransition();
  const [running, setRunning] = useState(!!block.timerStartedAt);
  const [startedAt, setStartedAt] = useState<number | null>(
    block.timerStartedAt ? new Date(block.timerStartedAt).getTime() : null,
  );
  const [, setTick] = useState(0);
  const [logging, setLogging] = useState(false);
  const [logValue, setLogValue] = useState("");

  // Re-sync from server props
  useEffect(() => {
    setRunning(!!block.timerStartedAt);
    setStartedAt(block.timerStartedAt ? new Date(block.timerStartedAt).getTime() : null);
  }, [block.timerStartedAt]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const isTime = block.metricType === "TIME";
  const unit = block.metricUnit || (isTime ? "hrs" : "");
  const accumMs = block.timerAccumMs;
  const elapsedMs = running && startedAt ? accumMs + (Date.now() - startedAt) : accumMs;
  const actual = isTime ? elapsedMs / 3_600_000 : block.metricActual;
  const target = block.metricTarget ?? 0;
  const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0;

  function handleStart() {
    setRunning(true);
    setStartedAt(Date.now());
    startTx(() => startBlockTimerAction(block.id));
  }
  function handlePause() {
    setRunning(false);
    startTx(() => pauseBlockTimerAction(block.id));
  }
  function handleLog(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(logValue);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setLogging(false);
    setLogValue("");
    startTx(() => logBlockProgressAction(block.id, amount));
    toast("Progress logged");
  }

  const fmtActual = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

  return (
    <div className="todo-track" style={{ marginBottom: 10 }}>
      {target > 0 && (
        <div className="track-progress">
          <div className="info">
            <span className="actual">{fmtActual(actual)}</span>
            <span className="of"> / {target} {unit}</span>
            <span className="pct">{Math.round(pct)}%</span>
          </div>
          <div className="bar"><div style={{ width: `${pct}%` }} /></div>
        </div>
      )}

      <div className="track-controls">
        {isTime &&
          (running ? (
            <div className="timer-display">
              <span className="pulse-dot"></span>
              <span>{fmt(elapsedMs)}</span>
              <button type="button" className="pause-inline" onClick={handlePause}>
                <i className="fa-solid fa-pause" style={{ fontSize: "10px" }}></i> Pause
              </button>
            </div>
          ) : (
            <button type="button" className="track-btn" onClick={handleStart}>
              <i className="fa-solid fa-play"></i> Start Timer
            </button>
          ))}

        {!isTime &&
          (!logging ? (
            <button type="button" className="track-btn secondary" onClick={() => setLogging(true)}>
              <i className="fa-solid fa-plus"></i> Log {unit}
            </button>
          ) : (
            <form className="log-form" onSubmit={handleLog}>
              <input
                type="number" step="0.25" min="0" placeholder="0"
                value={logValue} onChange={(e) => setLogValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") { setLogging(false); setLogValue(""); } }}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
              />
              <span className="unit">{unit}</span>
              <button type="submit">Add</button>
            </form>
          ))}
      </div>
    </div>
  );
}
