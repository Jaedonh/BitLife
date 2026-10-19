/**
 * Presentation helpers for achievements: progress counts and the "unlocked by" line.
 * Pure, so the home, death and achievements screens agree and tests need no renderer.
 */
import { achievementDescription, ACHIEVEMENTS, type AchievementDef } from '@/data/achievements';
import type { AchievementUnlock } from '@/store/settingsStore';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Unlocked out of all shipped achievements (stored ids no longer shipped are not counted). */
export function achievementProgress(unlocked: Readonly<Record<string, AchievementUnlock>>, defs: readonly AchievementDef[] = ACHIEVEMENTS): { unlocked: number; total: number } {
  let n = 0;
  for (const d of defs) if (Object.prototype.hasOwnProperty.call(unlocked, d.id)) n++;
  return { unlocked: n, total: defs.length };
}

/** How many achievements were unlocked since this life began (on the tombstone: "3 new this life"). */
export function unlockedSince(unlocked: Readonly<Record<string, AchievementUnlock>>, since: number, defs: readonly AchievementDef[] = ACHIEVEMENTS): number {
  let n = 0;
  for (const d of defs) {
    const u = unlocked[d.id];
    if (u && Object.prototype.hasOwnProperty.call(unlocked, d.id) && u.unlockedAt >= since) n++;
  }
  return n;
}

/** "Mar 4, 2026" (formatted by hand: the same on every platform and JS engine). */
export function formatUnlockDate(ms: number): string {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return '';
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** "Ana Silva, age 34 · Mar 4, 2026". */
export function unlockLine(u: AchievementUnlock): string {
  const who = u.lifeName ? `${u.lifeName}, age ${u.age}` : `Age ${u.age}`;
  const when = formatUnlockDate(u.unlockedAt);
  return when ? `${who} · ${when}` : who;
}

/**
 * What a tile shows: secret achievements stay hidden until unlocked. With the country of the life being
 * played, an amount of money is given in its currency ("Reach a net worth of ₹12,000,000…").
 */
export function achievementFace(def: AchievementDef, unlocked: boolean, countryCode?: string | null): { emoji: string; name: string; description: string } {
  if (def.secret && !unlocked) return { emoji: '❓', name: '???', description: 'A secret. Keep living to find it.' };
  return { emoji: def.emoji, name: def.name, description: achievementDescription(def, countryCode) };
}
