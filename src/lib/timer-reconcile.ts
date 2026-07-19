import { prisma } from "./db";
import { creditedRunMs } from "./timer-credit";

/**
 * Close out timer runs that were left open on a previous day.
 *
 * The Timer page only renders *today's* sessions, so a run started yesterday
 * becomes unreachable at midnight — there's no pause button to press, yet the
 * run keeps accruing. This sweeps those up on load: it banks the credited time
 * (capped by `creditedRunMs`) and clears `timerStartedAt`, so the session is
 * closed honestly instead of growing forever in the background.
 *
 * Runs started *today* are left alone — those are reachable and may be live.
 *
 * Returns how many runs were auto-stopped, so the UI can say so rather than
 * silently changing the user's numbers.
 */
export async function closeOrphanedTimerRuns(userId: string, today: Date): Promise<number> {
  const orphans = await prisma.timerSubItem.findMany({
    where: {
      timerStartedAt: { not: null },
      session: { userId, date: { lt: today } },
    },
    select: { id: true, timerStartedAt: true, timerAccumMs: true, targetMinutes: true },
  });
  if (orphans.length === 0) return 0;

  const now = Date.now();
  await prisma.$transaction(
    orphans.map((o) => {
      const runMs = now - o.timerStartedAt!.getTime();
      const credited = creditedRunMs(runMs, o.timerAccumMs, o.targetMinutes * 60_000);
      return prisma.timerSubItem.update({
        where: { id: o.id },
        data: { timerStartedAt: null, timerAccumMs: o.timerAccumMs + credited },
      });
    }),
  );

  return orphans.length;
}
