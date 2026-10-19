/**
 * Legal-age rules for the player's romantic partners (lovers and spouses).
 *
 * Nobody dates under 16. Adults only ever pair with adults, and a 16- or
 * 17-year-old only with another minor within two years of their age. A minor
 * only meets partners of exactly their own age, so a couple who stay together
 * turn 18 in the same year and never end up as an adult and a minor.
 */

import type { Rng } from '../rng';
import type { GameState, Gender } from '../types';

export const MIN_ROMANCE_AGE = 16;
export const ADULT_AGE = 18;

/** The ages a new partner can have for a player of `age`, or null when the player is too young for romance. */
export function partnerAgeRange(age: number): [number, number] | null {
  if (age < MIN_ROMANCE_AGE) return null;
  if (age < ADULT_AGE) return [age, age];
  return [Math.max(ADULT_AGE, age - 4), age + 4];
}

/** Whether the player and a partner of these ages may be romantic. Checked on every romantic act, so it follows both as they age. */
export function romanceAllowed(playerAge: number, partnerAge: number): boolean {
  if (playerAge < MIN_ROMANCE_AGE || partnerAge < MIN_ROMANCE_AGE) return false;
  if (playerAge >= ADULT_AGE) return partnerAge >= ADULT_AGE;
  return partnerAge < ADULT_AGE && Math.abs(playerAge - partnerAge) <= 2;
}

/**
 * Who the player is drawn to (GAME_DESIGN §10), from who they have stayed with: every year spent with a partner met
 * before that year counts for that partner's sex (`Character.partnerYears`). With no history, a new partner is of the
 * other sex nine times in ten; each year with a partner of the player's own sex leans the next ones that way (one
 * year makes it about even, five about 85%), and years with the other sex lean them back. Partners the player leaves
 * within the year they met count for nothing either way.
 */
export const PARTNER_LEAN = {
  /** The chance of a partner of the player's own sex with no history. */
  base: 0.1,
  /** Never fully closed either way: people surprise themselves. */
  min: 0.03,
  max: 0.95,
} as const;

/** The chance that a new partner is of the player's own sex, given who they have stayed with. */
export function sameSexChance(state: Pick<GameState, 'character'>): number {
  const years = state.character.partnerYears;
  const same = years?.same ?? 0;
  const other = years?.other ?? 0;
  return Math.min(PARTNER_LEAN.max, Math.max(PARTNER_LEAN.min, (PARTNER_LEAN.base + same) / (1 + same + other)));
}

/** The sex of a new partner the player meets (the yearly roll, or a card that does not say): one draw. */
export function partnerGender(rng: Rng, state: Pick<GameState, 'character'>): Gender {
  const me = state.character.gender;
  return rng.chance(sameSexChance(state)) ? me : me === 'male' ? 'female' : 'male';
}

/** The yearly pass: a year with each partner the player has had since before this year counts toward the leaning. */
export function notePartnerYears(state: GameState): GameState {
  const age = state.character.age;
  let same = 0;
  let other = 0;
  for (const p of Object.values(state.people)) {
    if (!p.alive || (p.kind !== 'lover' && p.kind !== 'spouse') || p.metAtAge >= age) continue;
    if (p.gender === state.character.gender) same++;
    else other++;
  }
  if (!same && !other) return state;
  const years = state.character.partnerYears ?? { same: 0, other: 0 };
  return { ...state, character: { ...state.character, partnerYears: { same: years.same + same, other: years.other + other } } };
}

/** Clamps a content-given age range to `band`; when they do not overlap, the band wins. */
export function clampRange(range: [number, number], band: [number, number]): [number, number] {
  const lo = Math.max(range[0], band[0]);
  const hi = Math.min(range[1], band[1]);
  return lo <= hi ? [lo, hi] : band;
}

/**
 * The grief window (GAME_DESIGN §10): after a lover or spouse dies, nobody new becomes a partner in the year of
 * the loss, neither by the yearly meeting roll (relationships.ts) nor through an event card (the newPerson effect),
 * and the yearly roll is half as likely the year after. While the window lasts the flag `grieving` holds the
 * player's age at the loss, so content can wait it out with `{ flag: 'grieving', exists: false }`; the yearly
 * relationship pass clears it.
 */
export const GRIEF_YEARS = 2;
export const GRIEF_FLAG = 'grieving';

/** Whether the player lost a partner within the grief window. */
export function inGrief(state: Pick<GameState, 'flags' | 'character'>): boolean {
  const at = state.flags[GRIEF_FLAG];
  return typeof at === 'number' && state.character.age - at < GRIEF_YEARS;
}

/** How likely a new partner is by chance, as a share of the usual: none in the year of a loss, half the year after. */
export function griefFactor(state: Pick<GameState, 'flags' | 'character'>): number {
  if (!inGrief(state)) return 1;
  return state.character.age === state.flags[GRIEF_FLAG] ? 0 : 0.5;
}

/** A partner has died: mark the death as mourned (so it is counted once) and start the grief window now. */
export function markBereaved(state: GameState, personId: string): GameState {
  const p = state.people[personId];
  if (!p || p.alive || p.mourned) return state;
  return {
    ...state,
    people: { ...state.people, [personId]: { ...p, mourned: true } },
    flags: { ...state.flags, [GRIEF_FLAG]: state.character.age },
  };
}

/**
 * What the journal says when a card offers a date in the year of a loss and the player takes it: nothing comes of
 * it, and the line says why, so the choice does not hang unanswered. Names the partner lost most recently.
 */
export function tooSoonLine(state: Pick<GameState, 'people'>): string {
  const lost = Object.values(state.people).filter((p) => !p.alive && p.mourned && (p.kind === 'lover' || p.kind === 'spouse')).pop();
  return lost ? `In the end it was too soon after losing ${lost.firstName}, and nothing came of it.` : 'In the end it was too soon, and nothing came of it.';
}

/** The yearly grief bookkeeping: a partner who died since the last pass starts the window, and one that has run its course ends. */
export function yearlyGrief(state: GameState): GameState {
  let s = state;
  for (const p of Object.values(s.people)) if (!p.alive && (p.kind === 'lover' || p.kind === 'spouse') && !p.mourned) s = markBereaved(s, p.id);
  if (s.flags[GRIEF_FLAG] === undefined || inGrief(s)) return s;
  const flags = { ...s.flags };
  delete flags[GRIEF_FLAG];
  return { ...s, flags };
}
