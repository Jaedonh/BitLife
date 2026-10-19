import { ACHIEVEMENTS, type AchievementContext, type AchievementDef } from '@/data/achievements';
import type { GameState } from '../types';

/** The part of a finished life the collection achievements need (a graveyard entry has it). */
export interface PastLife {
  id: string;
  ribbonId: string;
  countryCode: string;
}

/**
 * What the collection achievements see: the device's finished lives plus the current one. A life
 * that has just ended counts once, whether or not its grave has been written yet.
 */
export function achievementContext(past: readonly PastLife[], state: GameState | null): AchievementContext {
  const ribbons = new Set<string>();
  const countries = new Set<string>();
  for (const p of past) {
    if (p.ribbonId) ribbons.add(p.ribbonId);
    if (p.countryCode) countries.add(p.countryCode);
  }
  let lives = past.length;
  if (state) {
    countries.add(state.character.countryCode);
    if (!state.alive && state.death) {
      ribbons.add(state.death.ribbonId);
      if (!past.some((p) => p.id === state.character.id)) lives += 1;
    }
  }
  return { ribbons: [...ribbons], countries: [...countries], lives };
}

/**
 * Achievements this state earns that are not unlocked yet, in definition order. An event can also
 * grant one directly (`{ achievement: id }` puts the id in `state.achievements`). Already unlocked
 * ids are skipped before their test runs, so the check gets cheaper as the collection fills up.
 */
export function newAchievements(state: GameState, ctx: AchievementContext, unlocked: Readonly<Record<string, unknown>>): AchievementDef[] {
  const granted = state.achievements;
  const out: AchievementDef[] = [];
  for (const def of ACHIEVEMENTS) {
    if (Object.prototype.hasOwnProperty.call(unlocked, def.id)) continue;
    if (granted.includes(def.id) || def.test(state, ctx)) out.push(def);
  }
  return out;
}
