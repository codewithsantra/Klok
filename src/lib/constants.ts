/**
 * App-wide constants.
 *
 * These are NOT user data. They are the fixed list of options the app shows
 * (like a restaurant menu — the menu exists before any customer arrives).
 *
 * User-specific data (which tags they picked, what time they chose) will
 * live in the database. The constants here just define what's available.
 */

/** Time options shown during onboarding "What time does your day start?" */
export const DAY_START_TIMES = [
  "5 AM",
  "6 AM",
  "7 AM",
  "8 AM",
  "9 AM",
  "10 AM",
  "11 AM",
  "12 PM",
] as const;

/** Default activity tags shown during onboarding (and Settings) */
export type DefaultTag = { emoji: string; name: string; on: boolean };

// All tags are seeded for every new user (on signup). The `on` flag also
// drives the onboarding pre-selection — kept all-true so a new account starts
// fully tagged, then the user can trim what they don't want in onboarding/Settings.
export const DEFAULT_TAGS: DefaultTag[] = [
  { emoji: "😴", name: "Sleep", on: true },
  { emoji: "📚", name: "Study", on: true },
  { emoji: "💼", name: "Work", on: true },
  { emoji: "🍳", name: "Breakfast", on: true },
  { emoji: "🥗", name: "Lunch", on: true },
  // Was 🌙 — a moon doesn't read as "dinner" at a glance. A bowl does.
  { emoji: "🍲", name: "Dinner", on: true },
  { emoji: "🏃", name: "Exercise", on: true },
  { emoji: "☕", name: "Break", on: true },
  { emoji: "🧘", name: "Personal", on: true },
  { emoji: "🎮", name: "Gaming", on: true },
  { emoji: "📖", name: "Reading", on: true },
  { emoji: "🎵", name: "Music", on: true },
  { emoji: "🚗", name: "Commute", on: true },
  { emoji: "🛁", name: "Self-care", on: true },
];
