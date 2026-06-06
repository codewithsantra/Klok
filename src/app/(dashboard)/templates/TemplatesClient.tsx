"use client";

import { useActionState, useState } from "react";
import {
  saveTodayAsTemplateAction,
  applyTemplateAction,
  deleteTemplateAction,
  type SaveTemplateState,
} from "@/actions/templates";

type TemplateView = {
  id: string;
  name: string;
  createdAt: string;
  blockCount: number;
  tagNames: string[];
};

const TAG_CLASS_MAP: Record<string, string> = {
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

export default function TemplatesClient({
  templates,
  defaultApplyDate,
  todayBlockCount,
}: {
  templates: TemplateView[];
  defaultApplyDate: string;
  todayBlockCount: number;
}) {
  const [saveState, saveFormAction, savePending] = useActionState<
    SaveTemplateState | undefined,
    FormData
  >(saveTodayAsTemplateAction, undefined);

  const [applyOpenFor, setApplyOpenFor] = useState<string | null>(null);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <h1 className="text-xl font-extrabold text-[#1A1A2E]">Day Templates</h1>
      </div>

      {/* Save Today as Template — inline form (only if today has blocks) */}
      {todayBlockCount === 0 ? (
        <div
          className="card p-4 mb-5 flex items-start gap-3"
          style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}
        >
          <i className="fa-solid fa-circle-info text-[#A16207] mt-0.5"></i>
          <div className="flex-1">
            <h2 className="font-bold text-sm text-[#1A1A2E] mb-1">
              Add blocks to today first
            </h2>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Templates are saved from the blocks you have planned today. Go to
              Today&apos;s Log, add some blocks, then come back here to save
              them as a reusable template.
            </p>
            <a
              href="/today"
              className="btn btn-primary text-xs py-2 mt-3"
              style={{ fontSize: "11px" }}
            >
              <i className="fa-solid fa-plus"></i> Go to Today&apos;s Log
            </a>
          </div>
        </div>
      ) : (
        <div className="card p-4 mb-5">
          <h2 className="font-bold text-sm text-[#1A1A2E] mb-2">
            <i className="fa-solid fa-floppy-disk text-[#6C6FDF] mr-1.5"></i>
            Save Today as Template
          </h2>
          <p className="text-xs text-[#9CA3AF] mb-3">
            Save today&apos;s {todayBlockCount}{" "}
            {todayBlockCount === 1 ? "block" : "blocks"} as a reusable
            structure. You can apply it to any future date.
          </p>
          <form action={saveFormAction} className="flex flex-col sm:flex-row gap-2">
            <input
              name="name"
              className="inp flex-1"
              placeholder="e.g. My Typical Weekday"
              maxLength={80}
              required
            />
            <button
              type="submit"
              disabled={savePending}
              className="btn btn-primary disabled:opacity-50"
            >
              {savePending ? "Saving..." : "Save"}
            </button>
          </form>
          {saveState?.error && (
            <p className="text-[10px] text-[#DC2626] font-medium mt-2">
              {saveState.error}
            </p>
          )}
          {saveState?.success && (
            <p className="text-[10px] text-[#15803D] font-medium mt-2">
              ✓ Template saved!
            </p>
          )}
        </div>
      )}

      {/* Template list */}
      {templates.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-[#EEEEFF] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-layer-group text-[#6C6FDF] text-2xl"></i>
          </div>
          <p className="text-base font-bold text-[#1A1A2E]">
            No templates yet
          </p>
          <p className="text-sm text-[#9CA3AF] mt-1 max-w-md mx-auto">
            Save a day&apos;s structure above to create your first template.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((tpl) => (
            <div key={tpl.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-[#EEEEFF] rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-layer-group text-[#6C6FDF]"></i>
                </div>
                <form action={deleteTemplateAction.bind(null, tpl.id)}>
                  <button
                    type="submit"
                    className="w-7 h-7 bg-[#F3F4F6] rounded-lg flex items-center justify-center hover:bg-[#FEE2E2]"
                    title="Delete"
                  >
                    <i className="fa-solid fa-trash text-[#9CA3AF] text-xs"></i>
                  </button>
                </form>
              </div>
              <h3 className="font-bold text-[#1A1A2E] mb-0.5">{tpl.name}</h3>
              <p className="text-xs text-[#9CA3AF] mb-1">
                {tpl.blockCount}{" "}
                {tpl.blockCount === 1 ? "block" : "blocks"}
              </p>
              <p className="text-[10px] text-[#9CA3AF] mb-3">
                Created {formatRelative(tpl.createdAt)}
              </p>

              {tpl.tagNames.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {tpl.tagNames.slice(0, 4).map((name) => (
                    <span
                      key={name}
                      className={`tag ${TAG_CLASS_MAP[name] ?? "tag-personal"}`}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => setApplyOpenFor(tpl.id)}
                className="btn btn-primary w-full justify-center text-xs py-2.5"
                style={{ fontSize: "12px" }}
              >
                Apply to Date
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Apply modal */}
      {applyOpenFor && (
        <ApplyModal
          templateId={applyOpenFor}
          templateName={
            templates.find((t) => t.id === applyOpenFor)?.name ?? "Template"
          }
          defaultDate={defaultApplyDate}
          onClose={() => setApplyOpenFor(null)}
        />
      )}
    </div>
  );
}

function ApplyModal({
  templateId,
  templateName,
  defaultDate,
  onClose,
}: {
  templateId: string;
  templateName: string;
  defaultDate: string;
  onClose: () => void;
}) {
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
          Apply <strong>{templateName}</strong> to which date?
        </p>

        <form
          action={applyTemplateAction.bind(null, templateId)}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5">
              Target Date
            </label>
            <input
              name="date"
              type="date"
              className="inp"
              defaultValue={defaultDate}
              required
            />
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
