/**
 * Life choices the sampling policies never make, taken on some seeds so that content gated on them is reachable
 * in the validator and the text audit: graduate school after a bachelor's degree, a side hustle, a marriage the
 * player tends every year (so it can last 40 years), a habit that has taken hold (event choices alone rarely push an
 * addiction past the level where it starts to grow), a baby raised alone, a younger sibling at 3, losing both parents
 * young and a stay in juvenile detention. Deterministic per seed and state.
 */
import { applyAction } from '../src/engine/actions';
import { applyEffects } from '../src/engine/events/effects';
import { Rng } from '../src/engine/rng';
import { hustleOptions } from '../src/engine/systems/careers';
import { enrollOptions } from '../src/engine/systems/education';
import type { GameState } from '../src/engine/types';

export function varyLife(state: GameState, seed: number): GameState {
  let s = state;
  if (!s.alive || s.crime.inPrison) return s;
  const age = s.character.age;
  if (seed % 6 === 1 && age === 3) s = applyEffects(s, new Rng(seed + 3), [{ newPerson: { kind: 'sibling', minAge: 0, maxAge: 0 } }]);
  if (seed % 13 === 5 && age === 12) {
    for (const p of Object.values(s.people)) if (p.alive && (p.kind === 'mother' || p.kind === 'father')) s = { ...s, people: { ...s.people, [p.id]: { ...p, alive: false, deathAge: p.age, deathCause: 'an accident' } } };
  }
  // A trade course (yp_trade_pitch's choice) that random choices rarely take, so its certificate card is sampled.
  if (seed % 9 === 7 && age === 19 && !s.education.enrolled) s = { ...s, flags: { ...s.flags, yp_trade_course: true } };
  // A teen sentence goes to juvenile detention (justice.ts), which court cards otherwise make rare in samples.
  if (seed % 11 === 4 && age === 15) s = applyEffects(s, new Rng(seed + 15), [{ prison: 2 }]);
  if (seed % 3 === 1 && age >= 22 && age <= 30 && !s.education.enrolled) {
    const program = enrollOptions(s).find((o) => o.kind === 'graduate' && o.eligible);
    if (program) s = applyAction(s, { type: 'enroll', major: program.id });
  }
  if (seed % 4 === 2 && age >= 16 && age <= 40 && !s.career.hustle) {
    const hustle = hustleOptions(s).find((h) => h.eligible);
    if (hustle) s = applyAction(s, { type: 'startHustle', defId: hustle.def.id });
  }
  if (seed % 3 === 2) {
    const spouse = Object.values(s.people).find((p) => p.kind === 'spouse' && p.alive);
    if (spouse) s = applyAction(s, { type: 'interact', personId: spouse.id, interaction: 'spendTime' });
  }
  if (seed % 5 === 1 && age === 24) s = applyEffects(s, new Rng(seed), [{ addiction: seed % 2 ? 'alcohol' : 'drugs', delta: 45 }]);
  // A baby, then a break-up: lines for a single parent of a toddler become reachable (the policies only raise children in a couple).
  if (seed % 7 === 3 && age === 27) {
    s = applyEffects(s, new Rng(seed + 7), [{ newPerson: { kind: 'child', minAge: 0, maxAge: 0 } }]);
    const partner = Object.values(s.people).find((p) => p.alive && (p.kind === 'spouse' || p.kind === 'lover'));
    if (partner) s = applyAction(s, { type: 'interact', personId: partner.id, interaction: partner.kind === 'spouse' ? 'divorce' : 'breakUp' });
  }
  return s;
}
