"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  addTagAction,
  toggleTagAction,
  deleteTagAction,
  type TagActionState,
} from "@/actions/tags";
import {
  updateProfileAction,
  updatePasswordAction,
  deleteAccountAction,
  type ProfileState,
  type PasswordState,
} from "@/actions/account";

// Common activity emojis shown in the picker
const EMOJI_OPTIONS = [
  "🏷️", "📚", "💻", "📝", "✏️",
  "💪", "🏃", "🧘", "🧠", "🛌",
  "😴", "🍳", "🥗", "🍽", "☕",
  "🌅", "🌙", "📞", "💼", "🎯",
  "🎨", "🎵", "🎮", "📖", "🔥",
  "❤️", "🌟", "🌳", "🚗", "🛒",
  "🛁", "🐶", "🐱", "🏠", "✨",
];

type Tag = {
  id: string;
  name: string;
  emoji: string;
  active: boolean;
};

type User = {
  id: string;
  email: string;
  name: string | null;
};

export default function SettingsClient({
  user,
  tags,
}: {
  user: User;
  tags: Tag[];
}) {
  // Profile form
  const [profileState, profileAction, profilePending] = useActionState<
    ProfileState | undefined,
    FormData
  >(updateProfileAction, undefined);

  // Password form
  const [passwordState, passwordAction, passwordPending] = useActionState<
    PasswordState | undefined,
    FormData
  >(updatePasswordAction, undefined);

  // Add tag form
  const [addState, addFormAction, addPending] = useActionState<
    TagActionState | undefined,
    FormData
  >(addTagAction, undefined);

  // Emoji picker state
  const [selectedEmoji, setSelectedEmoji] = useState("🏷️");
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    if (!pickerOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node)
      ) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pickerOpen]);


  const displayName = user.name?.trim() || user.email.split("@")[0];
  const initial = (user.name?.trim() || user.email).charAt(0).toUpperCase();

  function handleDelete() {
    const ok = window.confirm(
      "Are you SURE you want to delete your account? This permanently removes all your blocks, todos, tags, and templates. This cannot be undone.",
    );
    if (!ok) return;
    return deleteAccountAction();
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-extrabold text-[#1A1A2E] mb-5">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Profile */}
        <div className="card p-6">
          <h2 className="font-bold text-[#1A1A2E] mb-5">Profile</h2>
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white text-2xl flex-shrink-0"
              style={{
                background: "linear-gradient(135deg,#6C6FDF,#9B9EEF)",
              }}
            >
              {initial}
            </div>
            <div>
              <div className="font-bold text-[#1A1A2E]">{displayName}</div>
              <div className="text-sm text-[#9CA3AF]">{user.email}</div>
            </div>
          </div>

          <form action={profileAction} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5">
                Display Name
              </label>
              <input
                name="name"
                className="inp"
                defaultValue={user.name ?? ""}
                placeholder="Your name"
                maxLength={80}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5">
                Email{" "}
                <span className="text-[#9CA3AF] font-normal">
                  (read-only)
                </span>
              </label>
              <input
                className="inp"
                value={user.email}
                disabled
                style={{ opacity: 0.7 }}
              />
            </div>

            {profileState?.error && (
              <p className="text-[10px] text-[#DC2626] font-medium">
                {profileState.error}
              </p>
            )}
            {profileState?.success && (
              <p className="text-[10px] text-[#15803D] font-medium">
                ✓ Saved!
              </p>
            )}

            <button
              type="submit"
              disabled={profilePending}
              className="btn btn-primary text-xs py-2.5 disabled:opacity-50"
              style={{ fontSize: "12px" }}
            >
              {profilePending ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>

        {/* Password + Tags */}
        <div className="space-y-5">
          {/* Password */}
          <div className="card p-6">
            <h2 className="font-bold text-[#1A1A2E] mb-4">Change Password</h2>

            <form action={passwordAction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5">
                  Current Password
                </label>
                <input
                  name="currentPassword"
                  type="password"
                  className="inp"
                  required
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5">
                  New Password
                </label>
                <input
                  name="newPassword"
                  type="password"
                  className="inp"
                  placeholder="Min. 8 characters"
                  minLength={8}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5">
                  Confirm New Password
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  className="inp"
                  placeholder="••••••••"
                  minLength={8}
                  required
                  autoComplete="new-password"
                />
              </div>

              {passwordState?.error && (
                <p className="text-[10px] text-[#DC2626] font-medium">
                  {passwordState.error}
                </p>
              )}
              {passwordState?.success && (
                <p className="text-[10px] text-[#15803D] font-medium">
                  ✓ Password updated.
                </p>
              )}

              <button
                type="submit"
                disabled={passwordPending}
                className="btn btn-primary text-xs py-2.5 disabled:opacity-50"
                style={{ fontSize: "12px" }}
              >
                {passwordPending ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>

          {/* Tags */}
          <div className="card p-6">
            <h2 className="font-bold text-[#1A1A2E] mb-2">Activity Tags</h2>
            <p className="text-xs text-[#9CA3AF] mb-4">
              Click a tag to toggle. Use the × to delete.
            </p>

            {tags.length === 0 ? (
              <p className="text-xs text-[#9CA3AF] text-center py-3 italic">
                No tags yet — add your first below.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag) => (
                  <div key={tag.id} className="inline-flex items-center">
                    <form action={toggleTagAction.bind(null, tag.id)}>
                      <button
                        type="submit"
                        className={`tag-chip ${tag.active ? "tag-chip-on" : "tag-chip-off"}`}
                      >
                        {tag.emoji} {tag.name}
                      </button>
                    </form>
                    <form action={deleteTagAction.bind(null, tag.id)}>
                      <button
                        type="submit"
                        className="ml-1 text-[#9CA3AF] hover:text-[#DC2626] px-1"
                        title="Delete tag"
                      >
                        <i className="fa-solid fa-xmark text-xs"></i>
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}

            <form action={addFormAction} className="flex gap-2 relative">
              {/* Hidden field carries the picked emoji */}
              <input type="hidden" name="emoji" value={selectedEmoji} />

              {/* Emoji picker button */}
              <div ref={pickerRef} className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setPickerOpen((v) => !v)}
                  className="inp flex items-center justify-center text-lg"
                  style={{ width: "52px", padding: "8px 0" }}
                  title="Pick emoji"
                >
                  {selectedEmoji}
                </button>

                {pickerOpen && (
                  <div
                    className="absolute z-10 mt-2 p-2 bg-white rounded-2xl shadow-lg"
                    style={{
                      border: "1px solid #E5E7EB",
                      width: "260px",
                    }}
                  >
                    <div className="grid grid-cols-7 gap-1">
                      {EMOJI_OPTIONS.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => {
                            setSelectedEmoji(e);
                            setPickerOpen(false);
                          }}
                          className={`text-lg rounded-lg hover:bg-[#EEEEFF] transition-colors aspect-square ${
                            selectedEmoji === e ? "bg-[#EEEEFF]" : ""
                          }`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <input
                name="name"
                className="inp flex-1"
                placeholder="Tag name..."
                required
              />
              <button
                type="submit"
                disabled={addPending}
                className="btn btn-primary px-4 disabled:opacity-50"
                style={{ padding: "10px 16px" }}
              >
                <i className="fa-solid fa-plus"></i>
              </button>
            </form>
            {addState?.error && (
              <p className="text-[10px] text-[#DC2626] font-medium mt-1.5">
                {addState.error}
              </p>
            )}
            <p className="text-[10px] text-[#9CA3AF] mt-1.5">
              Click the emoji to pick a different one
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        <div
          className="lg:col-span-2 card p-6 border border-[#FEE2E2]"
          style={{ background: "#FFFAFA" }}
        >
          <h2 className="font-bold text-[#DC2626] mb-2">Danger Zone</h2>
          <p className="text-sm text-[#6B7280] mb-4">
            Permanently delete your account and all your data. This cannot be
            undone.
          </p>
          <form action={handleDelete}>
            <button type="submit" className="btn btn-danger">
              Delete My Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
