// Daily motivational lines for the dashboard greeting.
// Picked deterministically from the date + a per-user salt, so the line
// changes every day, is stable across reloads within a day, and differs
// between users — no API, no storage.

const QUOTES = [
  "Plans are guesses. Logging what really happened is the superpower.",
  "You don't need a perfect day. You need an honest one.",
  "Small done beats big planned.",
  "The streak isn't the goal — showing up is.",
  "One focused hour outworks four distracted ones.",
  "Miss a task? Log it. That's not failure, that's data.",
  "Progress hides in days that felt ordinary.",
  "Do the next block. Just the next one.",
  "A skipped task recorded honestly is worth more than a fake tick.",
  "Consistency compounds quietly.",
  "Your calendar shows intent. Your log shows character.",
  "Start before you feel ready — the timer is patient.",
  "Yesterday's miss is today's first task.",
  "Focus is a muscle. Every session is a rep.",
  "Don't count the days you missed. Count the ones you kept.",
  "The plan gets you started; the log keeps you honest.",
  "Two tasks done well beat ten half-touched.",
  "Momentum loves a small win before noon.",
  "Track the truth. Adjust the plan. Repeat.",
  "The best day to restart a streak is the day you broke it.",
  "Deep work now, easy conscience tonight.",
  "You planned it for a reason. Give it fifteen minutes.",
  "Perfection is a stall tactic. Log something.",
  "Every 'done' is a vote for the person you're becoming.",
  "Guard the first hour — the rest of the day follows it.",
  "A short session still counts. Zero is the only failure.",
  "What gets logged gets learned.",
  "Tired? Shrink the task, keep the habit.",
  "Discipline is remembering why you scheduled it.",
  "Finish the day on paper before you start it in life.",
  "The timer doesn't judge. It just counts. So start it.",
  "Busy is a feeling. Done is a fact.",
  "One honest week teaches more than a year of intentions.",
  "Break the task down until starting feels silly to skip.",
  "Your future self reads this log. Write something good.",
  "Missed the morning? The afternoon is still yours.",
  "Streaks are built one unglamorous day at a time.",
  "Plan tomorrow tonight; win tomorrow twice.",
  "It's not about time found — it's about time protected.",
  "Show up for the small blocks. The big ones take care of themselves.",
  "Reflection turns a bad day into a useful one.",
  "The gap between plan and reality is where growth lives.",
] as const;

/** Deterministic small hash — stable across server restarts. */
function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(h);
}

/** The quote of the day for a given user. `dateISO` = YYYY-MM-DD in the user's zone. */
export function getDailyQuote(dateISO: string, salt: string): string {
  return QUOTES[hash(`${dateISO}|${salt}`) % QUOTES.length];
}
