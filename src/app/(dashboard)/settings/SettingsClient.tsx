"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addTagAction, toggleTagAction, deleteTagAction, type TagActionState } from "@/actions/tags";
import { useClerk } from "@clerk/nextjs";
import { updateProfileAction, deleteAccountAction, type ProfileState } from "@/actions/account";
import { useModalEscape } from "@/lib/use-modal-escape";
import { toast } from "@/lib/toast";

const EMOJI_OPTIONS = [
  "🏷️","📚","💻","📝","✏️","💪","🏃","🧘","🧠","🛌",
  "😴","🍳","🥗","🍽","☕","🌅","🌙","📞","💼","🎯",
  "🎨","🎵","🎮","📖","🔥","❤️","🌟","🌳","🚗","🛒",
  "🛁","🐶","🐱","🏠","✨",
];

type Tag = { id: string; name: string; emoji: string; active: boolean };
type User = { id: string; email: string; name: string | null; timeZone: string };

export default function SettingsClient({ user, tags }: { user: User; tags: Tag[] }) {
  const { openUserProfile } = useClerk();
  const [profileState, profileAction, profilePending] = useActionState<ProfileState | undefined, FormData>(updateProfileAction, undefined);
  const [addState, addFormAction, addPending] = useActionState<TagActionState | undefined, FormData>(addTagAction, undefined);
  const [selectedEmoji, setSelectedEmoji] = useState("🏷️");
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pickerOpen]);

  useEffect(() => { if (profileState?.success) toast("Profile saved"); }, [profileState]);

  const displayName = user.name?.trim() || user.email.split("@")[0];
  const initial = (user.name?.trim() || user.email).charAt(0).toUpperCase();

  const [confirmDelete, setConfirmDelete] = useState(false);
  useModalEscape(confirmDelete, () => setConfirmDelete(false));

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-extrabold mb-5" style={{ color: "var(--text)" }}>Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Profile */}
        <div className="card p-6">
          <h2 className="font-semibold mb-5" style={{ color: "var(--text)" }}>Profile</h2>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-lg flex items-center justify-center font-bold text-xl flex-shrink-0"
              style={{
                background: "var(--btn-primary-bg)",
                color: "var(--btn-primary-text)",
                borderRadius: "10px",
              }}>
              {initial}
            </div>
            <div>
              <div className="font-semibold" style={{ color: "var(--text)" }}>{displayName}</div>
              <div className="text-sm" style={{ color: "var(--text-3)" }}>{user.email}</div>
            </div>
          </div>

          <form action={profileAction} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text)" }}>Display Name</label>
              <input name="name" className="inp" defaultValue={user.name ?? ""} placeholder="Your name" maxLength={80} required />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text)" }}>
                Email <span className="font-normal" style={{ color: "var(--text-3)" }}>(read-only)</span>
              </label>
              <input className="inp" value={user.email} disabled style={{ opacity: 0.6 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text)" }}>
                Timezone <span className="font-normal" style={{ color: "var(--text-3)" }}>(auto-detected)</span>
              </label>
              <input className="inp" value={user.timeZone} disabled style={{ opacity: 0.6 }} />
              <p className="text-[10px] mt-1" style={{ color: "var(--text-3)" }}>
                Your day rolls over at midnight in this zone. Detected from your browser.
              </p>
            </div>
            {profileState?.error && <p className="text-[10px] font-medium" style={{ color: "var(--danger)" }}>{profileState.error}</p>}
            {profileState?.success && <p className="text-[10px] font-medium" style={{ color: "var(--success)" }}>✓ Saved!</p>}
            <button type="submit" disabled={profilePending} className="btn btn-primary disabled:opacity-50" style={{ fontSize: "12px" }}>
              {profilePending ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>

        {/* Security + Tags */}
        <div className="space-y-5">
          {/* Security (handled by Clerk) */}
          <div className="card p-6">
            <h2 className="font-semibold mb-2" style={{ color: "var(--text)" }}>Account &amp; Security</h2>
            <p className="text-sm mb-4" style={{ color: "var(--text-2)" }}>
              Password, email address, and connected sign-in methods are managed
              through your secure account panel.
            </p>
            <button type="button" onClick={() => openUserProfile()}
              className="btn btn-primary" style={{ fontSize: "12px" }}>
              <i className="fa-solid fa-shield-halved"></i> Manage account &amp; security
            </button>
          </div>

          {/* Tags */}
          <div className="card p-6">
            <h2 className="font-semibold mb-1" style={{ color: "var(--text)" }}>Activity Tags</h2>
            <p className="text-xs mb-4" style={{ color: "var(--text-3)" }}>Click a tag to toggle. Use the × to delete.</p>

            {tags.length === 0 ? (
              <p className="text-xs text-center py-3 italic" style={{ color: "var(--text-3)" }}>
                No tags yet — add your first below.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag) => (
                  <div key={tag.id} className="inline-flex items-center">
                    <form action={toggleTagAction.bind(null, tag.id)}>
                      <button type="submit" className={`tag-chip ${tag.active ? "tag-chip-on" : "tag-chip-off"}`}>
                        {tag.emoji} {tag.name}
                      </button>
                    </form>
                    <form action={deleteTagAction.bind(null, tag.id)}>
                      <button type="submit" className="ml-1 px-1 transition-colors"
                        style={{ color: "var(--text-3)" }} title="Delete tag">
                        <i className="fa-solid fa-xmark text-xs"></i>
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}

            <form action={addFormAction} className="flex gap-2 relative">
              <input type="hidden" name="emoji" value={selectedEmoji} />
              <div ref={pickerRef} className="relative flex-shrink-0">
                <button type="button" onClick={() => setPickerOpen((v) => !v)}
                  className="inp flex items-center justify-center text-lg"
                  style={{ width: "48px", padding: "7px 0" }}>
                  {selectedEmoji}
                </button>
                {pickerOpen && (
                  <div className="absolute z-10 mt-2 p-2 rounded-lg shadow-lg"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", width: "252px" }}>
                    <div className="grid grid-cols-7 gap-1">
                      {EMOJI_OPTIONS.map((e) => (
                        <button key={e} type="button"
                          onClick={() => { setSelectedEmoji(e); setPickerOpen(false); }}
                          className="text-lg rounded transition-colors aspect-square"
                          style={{ background: selectedEmoji === e ? "var(--accent-bg)" : "transparent" }}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <input name="name" className="inp flex-1" placeholder="Tag name..." required />
              <button type="submit" disabled={addPending} className="btn btn-primary disabled:opacity-50">
                <i className="fa-solid fa-plus"></i>
              </button>
            </form>
            {addState?.error && <p className="text-[10px] font-medium mt-1.5" style={{ color: "var(--danger)" }}>{addState.error}</p>}
            <p className="text-[10px] mt-1.5" style={{ color: "var(--text-3)" }}>Click the emoji to pick a different one</p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="lg:col-span-2 card p-6"
          style={{ background: "rgba(220,38,38,.03)", border: "1px solid rgba(220,38,38,.15)" }}>
          <h2 className="font-semibold mb-2" style={{ color: "var(--danger)" }}>Danger Zone</h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-2)" }}>
            Permanently delete your account and all your data. This cannot be undone.
          </p>
          <button type="button" onClick={() => setConfirmDelete(true)} className="btn btn-danger">
            Delete My Account
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="modal-backdrop" onClick={() => setConfirmDelete(false)}>
          <div role="dialog" aria-modal="true" aria-label="Confirm account deletion"
            className="card modal-card w-full max-w-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "var(--danger-bg)" }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ color: "var(--danger)", fontSize: 18 }}></i>
              </div>
              <h2 className="font-display text-lg font-extrabold mb-1.5" style={{ color: "var(--text)" }}>
                Delete your account?
              </h2>
              <p className="text-sm mb-5" style={{ color: "var(--text-2)" }}>
                This permanently removes all your tasks, timer sessions, and tags.
                This <strong>cannot be undone</strong>.
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setConfirmDelete(false)}
                  className="btn btn-outline flex-1 justify-center">
                  Cancel
                </button>
                <form action={deleteAccountAction} className="flex-1">
                  <button type="submit" className="btn btn-danger w-full justify-center">
                    Delete forever
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
