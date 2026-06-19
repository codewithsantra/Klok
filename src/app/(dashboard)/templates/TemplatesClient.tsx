"use client";

import { useActionState, useState } from "react";
import {
  saveTodayAsTemplateAction, applyTemplateAction, deleteTemplateAction,
  type SaveTemplateState,
} from "@/actions/templates";

type TemplateView = { id: string; name: string; createdAt: string; blockCount: number; tagNames: string[] };

const TAG_CLASS_MAP: Record<string, string> = {
  Study: "tag-study", Work: "tag-work", Sleep: "tag-sleep",
  Exercise: "tag-health", Personal: "tag-personal",
  Breakfast: "tag-meal", Lunch: "tag-meal", Dinner: "tag-meal", Break: "tag-break",
};

export default function TemplatesClient({ templates, defaultApplyDate, todayBlockCount }: {
  templates: TemplateView[]; defaultApplyDate: string; todayBlockCount: number;
}) {
  const [saveState, saveFormAction, savePending] = useActionState<SaveTemplateState | undefined, FormData>(
    saveTodayAsTemplateAction, undefined,
  );
  const [applyOpenFor, setApplyOpenFor] = useState<string | null>(null);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <h1 className="font-display text-2xl font-extrabold" style={{ color: "var(--text)" }}>
          Day Templates
        </h1>
      </div>

      {/* Save Today */}
      {todayBlockCount === 0 ? (
        <div className="card p-4 mb-5 flex items-start gap-3"
          style={{ background: "var(--warning-bg)", border: "1px solid rgba(217,119,6,.2)" }}>
          <i className="fa-solid fa-circle-info mt-0.5" style={{ color: "var(--warning)" }}></i>
          <div className="flex-1">
            <h2 className="font-semibold text-sm mb-1" style={{ color: "var(--text)" }}>
              Add blocks to today first
            </h2>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
              Templates are saved from the blocks you have planned today. Go to Today&apos;s Log,
              add some blocks, then come back here to save them as a reusable template.
            </p>
            <a href="/today" className="btn btn-primary mt-3" style={{ fontSize: "11px" }}>
              <i className="fa-solid fa-plus"></i> Go to Today&apos;s Log
            </a>
          </div>
        </div>
      ) : (
        <div className="card p-4 mb-5">
          <h2 className="font-semibold text-sm mb-2" style={{ color: "var(--text)" }}>
            <i className="fa-solid fa-floppy-disk mr-1.5" style={{ color: "var(--accent)" }}></i>
            Save Today as Template
          </h2>
          <p className="text-xs mb-3" style={{ color: "var(--text-3)" }}>
            Save today&apos;s {todayBlockCount} {todayBlockCount === 1 ? "block" : "blocks"} as a reusable structure.
          </p>
          <form action={saveFormAction} className="flex flex-col sm:flex-row gap-2">
            <input name="name" className="inp flex-1" placeholder="e.g. My Typical Weekday" maxLength={80} required />
            <button type="submit" disabled={savePending} className="btn btn-primary disabled:opacity-50">
              {savePending ? "Saving..." : "Save"}
            </button>
          </form>
          {saveState?.error && <p className="text-[10px] font-medium mt-2" style={{ color: "var(--danger)" }}>{saveState.error}</p>}
          {saveState?.success && <p className="text-[10px] font-medium mt-2" style={{ color: "var(--success)" }}>✓ Template saved!</p>}
        </div>
      )}

      {/* Template list */}
      {templates.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3"
            style={{ background: "var(--accent-bg)" }}>
            <i className="fa-solid fa-layer-group" style={{ color: "var(--accent)", fontSize: "18px" }}></i>
          </div>
          <p className="text-base font-semibold" style={{ color: "var(--text)" }}>No templates yet</p>
          <p className="text-sm mt-1 max-w-md mx-auto" style={{ color: "var(--text-3)" }}>
            Save a day&apos;s structure above to create your first template.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((tpl) => (
            <div key={tpl.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--accent-bg)" }}>
                  <i className="fa-solid fa-layer-group" style={{ color: "var(--accent)" }}></i>
                </div>
                <form action={deleteTemplateAction.bind(null, tpl.id)}>
                  <button type="submit"
                    className="w-7 h-7 rounded flex items-center justify-center transition-colors"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                    title="Delete">
                    <i className="fa-solid fa-trash text-xs" style={{ color: "var(--text-3)" }}></i>
                  </button>
                </form>
              </div>
              <h3 className="font-semibold mb-0.5" style={{ color: "var(--text)" }}>{tpl.name}</h3>
              <p className="text-xs mb-1" style={{ color: "var(--text-3)" }}>
                {tpl.blockCount} {tpl.blockCount === 1 ? "block" : "blocks"}
              </p>
              <p className="text-[10px] mb-3" style={{ color: "var(--text-3)" }}>
                Created {formatRelative(tpl.createdAt)}
              </p>
              {tpl.tagNames.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {tpl.tagNames.slice(0, 4).map((name) => (
                    <span key={name} className={`tag ${TAG_CLASS_MAP[name] ?? "tag-personal"}`}>{name}</span>
                  ))}
                </div>
              )}
              <button onClick={() => setApplyOpenFor(tpl.id)}
                className="btn btn-primary w-full justify-center" style={{ fontSize: "12px" }}>
                Apply to Date
              </button>
            </div>
          ))}
        </div>
      )}

      {applyOpenFor && (
        <ApplyModal
          templateId={applyOpenFor}
          templateName={templates.find((t) => t.id === applyOpenFor)?.name ?? "Template"}
          defaultDate={defaultApplyDate}
          onClose={() => setApplyOpenFor(null)}
        />
      )}
    </div>
  );
}

function ApplyModal({ templateId, templateName, defaultDate, onClose }: {
  templateId: string; templateName: string; defaultDate: string; onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card p-5 md:p-6 w-full max-w-md animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold" style={{ color: "var(--text)" }}>Apply Template</h2>
          <button type="button" onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <i className="fa-solid fa-xmark text-sm" style={{ color: "var(--text-2)" }}></i>
          </button>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--text-2)" }}>
          Apply <strong>{templateName}</strong> to which date?
        </p>
        <form action={applyTemplateAction.bind(null, templateId)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text)" }}>Target Date</label>
            <input name="date" type="date" className="inp" defaultValue={defaultDate} required />
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

function formatRelative(isoString: string): string {
  const then = new Date(isoString);
  const diffMs = Date.now() - then.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}
