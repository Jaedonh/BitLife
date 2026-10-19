import { getCountry } from '@/data/countries';
import { hadOnceIllness, ILLNESSES, ILLNESS_BY_ID, shortIllnessName, visitCureChance } from '@/data/illnesses';
import { giveIllness } from '../events/effects';
import { parentsRef, scaleMoney } from '../events/text';
import type { Rng } from '../rng';
import { spend } from './guardians';
import type { AddictionKind, GameState, Illness } from '../types';
import { addMoney, addStats, capitalize, joinList, log, setResult } from '../util';

function ageBand(age: number): 0 | 1 | 2 {
  return age < 18 ? 0 : age < 65 ? 1 : 2;
}

/** What an addiction is called when it is finally beaten: "my drinking habit". */
const HABIT_NAMES: Record<AddictionKind, string> = { alcohol: 'drinking', drugs: 'drug', gambling: 'gambling' };

/** From this level an addiction has taken hold: it grows on its own instead of fading (GAME_DESIGN §13). */
export const HABIT_LEVEL = 30;

/**
 * Flag `habit:<kind>`: the addiction took hold (reached HABIT_LEVEL) and has not ended since. Only such a habit is
 * "finally shook" when it fades away; a party drink or two that fades was never a habit.
 */
export const habitFlag = (k: AddictionKind): string => `habit:${k}`;

/** The journal line when a parent's doctor visit clears a child's illness. */
function parentCureLine(defId: string, name: string, chronic: boolean, who: string): string {
  switch (defId) {
    case 'appendicitis': return `${who} rushed me to the hospital. The doctors took my appendix out, and I bounced back.`;
    case 'cancer': return `${who} found me the best care there was. After a hard year of treatment, the cancer went into remission.`;
    case 'depression': return `${who} got me help. With time and support, my depression lifted.`;
    case 'anxiety': return `${who} got me help. With time and practice, my anxiety eased.`;
    case 'diabetes': return `${who} took me to the doctor. A new diet and a lot of walking brought my blood sugar back under control.`;
    default:
      return chronic ? `${who} took me to the doctor, and over time my ${shortIllnessName(defId, name)} went away.` : `${who} took me to the doctor, and I got over my ${shortIllnessName(defId, name)}.`;
  }
}

/** Yearly illness rolls, recoveries, and addiction drift. */
export function yearlyHealth(state: GameState, rng: Rng): GameState {
  let s = state;
  const c = s.character;
  const band = ageBand(c.age);
  // Recoveries
  const remaining = [];
  for (const ill of s.health.illnesses) {
    if (ill.chronic) {
      remaining.push(ill);
      continue;
    }
    const left = ill.yearsLeft - 1;
    if (left <= 0) {
      s = log(s, `I recovered from my ${shortIllnessName(ill.defId, ill.name)}.`, 'good');
    } else remaining.push({ ...ill, yearsLeft: left });
  }
  s = { ...s, health: { ...s.health, illnesses: remaining } };
  // Children get taken to the doctor by their parents.
  if (c.age < 18 && s.health.illnesses.length && Object.values(s.people).some((p) => (p.kind === 'mother' || p.kind === 'father' || p.kind === 'stepmother' || p.kind === 'stepfather') && p.alive)) {
    const kept = [];
    for (const ill of s.health.illnesses) {
      if (rng.chance(visitCureChance(ill.defId, false))) s = log(s, parentCureLine(ill.defId, ill.name, ill.chronic, capitalize(parentsRef(s))), 'good');
      else kept.push({ ...ill, treated: true });
    }
    s = { ...s, health: { ...s.health, illnesses: kept } };
    s = addStats(s, { health: 3 });
  }
  // New illness
  let p = band === 0 ? 0.1 : band === 1 ? 0.13 : 0.28;
  p *= 1.3 - c.stats.health / 150;
  if (c.traits.includes('iron_constitution')) p *= 0.6;
  if ((s.health.addictions.drugs ?? 0) >= 40 || (s.health.addictions.alcohol ?? 0) >= 40) p *= 1.5;
  if (rng.chance(p)) {
    // A once-a-life illness (an appendix) is never rolled twice, nor after a card that took it out.
    const pool = ILLNESSES.filter((i) => i.weights[band] > 0 && c.age >= (i.minAge ?? 0) && !s.health.illnesses.some((x) => x.defId === i.id) && !hadOnceIllness(i, s.flags, s.firedEvents));
    if (pool.length) {
      const def = rng.weighted(pool, (i) => i.weights[band]);
      s = giveIllness(s, def.id);
      s = log(s, def.onset ?? `I was diagnosed with ${def.name}.`, def.severity >= 4 ? 'bad' : 'info');
      if (def.severity >= 4) s = addStats(s, { happiness: -8 });
    }
  }
  // Addictions drift
  const addictions = { ...s.health.addictions };
  const flags = { ...s.flags };
  // A habit that ended some other way (rehab, a card) since last year is over: a later small bump starts afresh.
  for (const k of ['alcohol', 'drugs', 'gambling'] as AddictionKind[]) if (flags[habitFlag(k)] && !((addictions[k] ?? 0) > 0)) delete flags[habitFlag(k)];
  for (const k of Object.keys(addictions) as AddictionKind[]) {
    const level = addictions[k] ?? 0;
    if (level <= 0) {
      delete addictions[k];
      continue;
    }
    if (level >= HABIT_LEVEL) flags[habitFlag(k)] = true;
    // Untreated addictions creep up; low ones fade.
    const drift = level >= HABIT_LEVEL ? rng.int(0, 6) : rng.int(-6, 2);
    const next = Math.max(0, Math.min(100, level + drift));
    if (next >= HABIT_LEVEL) flags[habitFlag(k)] = true;
    if (next <= 0) {
      delete addictions[k];
      // Only a habit that took hold is news when it fades; a few drinks at a party just stop mattering.
      if (flags[habitFlag(k)]) {
        delete flags[habitFlag(k)];
        s = log(s, `I finally shook my ${HABIT_NAMES[k]} habit.`, 'good');
      }
    } else {
      addictions[k] = next;
      if (next >= 40) {
        s = addStats(s, { happiness: -3, health: -1 });
        if (k === 'gambling') s = addMoney(s, -scaleMoney(s, rng.int(500, 4000)));
      }
    }
  }
  s = { ...s, flags, health: { ...s.health, addictions } };
  return s;
}

export function doctorCost(state: GameState): number {
  const country = getCountry(state.character.countryCode);
  const base = 400 + state.health.illnesses.reduce((sum, i) => sum + 400 * (ILLNESS_BY_ID[i.defId]?.treatCost ?? 1), 0);
  return scaleMoney(state, country.publicHealthcare ? Math.round(base * 0.15) : base);
}

/** A doctor visit: costs money, heals a little, may cure illnesses. */
export function visitDoctor(state: GameState, rng: Rng): GameState {
  if (state.health.doctorVisitsThisYear >= 4) return setResult(state, 'The clinic is fully booked for the rest of the year.', 'info');
  const cost = doctorCost(state);
  let s = spend(state, cost);
  s = { ...s, health: { ...s.health, doctorVisitsThisYear: s.health.doctorVisitsThisYear + 1 } };
  const cured: string[] = [];
  let curedSerious = false;
  const kept: Illness[] = [];
  // Chronic conditions already being treated before this visit: the doctor checks on them rather than starting a plan.
  const ongoing = new Set(s.health.illnesses.filter((i) => i.chronic && i.treated).map((i) => i.defId));
  for (const ill of s.health.illnesses) {
    // An incurable illness (dementia, arthritis) is managed, never cured (visitCureChance is 0).
    if (rng.chance(visitCureChance(ill.defId, ill.treated))) {
      cured.push(shortIllnessName(ill.defId, ill.name));
      if (ill.severity >= 4) curedSerious = true;
    } else kept.push({ ...ill, treated: true });
  }
  s = { ...s, health: { ...s.health, illnesses: kept } };
  const heal = 4 + cured.length * 4;
  s = addStats(s, { health: heal });
  // Chronic conditions get a plan, and once they have one, a check-up; acute ones the doctor could not clear just need time.
  const names = (list: readonly Illness[]) => joinList(list.map((k) => shortIllnessName(k.defId, k.name)));
  const planned = kept.filter((k) => k.chronic && !ongoing.has(k.defId));
  const checked = kept.filter((k) => k.chronic && ongoing.has(k.defId));
  const chronic = names(planned);
  const stable = names(checked);
  const acute = names(kept.filter((k) => !k.chronic));
  const lines: string[] = [];
  if (cured.length) lines.push(`The doctor treated my ${joinList(cured)}.`);
  if (chronic) lines.push(cured.length ? `I also have a plan to manage my ${chronic}.` : `The doctor gave me a plan to manage my ${chronic}.`);
  // "My migraines are", "My asthma and anxiety are", "My asthma is".
  const several = checked.length > 1 || !!ILLNESS_BY_ID[checked[0]?.defId ?? '']?.plural;
  if (stable) lines.push(cured.length || chronic ? `My ${stable} ${several ? 'are' : 'is'} stable for now.` : `The doctor checked on my ${stable}. ${several ? "They're" : "It's"} stable for now.`);
  if (acute) lines.push(`${cured.length || chronic || stable ? '' : 'The doctor checked me over. '}I still need time to recover from my ${acute}.`);
  if (cured.length && !kept.length) lines.push(curedSerious ? "I'm on the mend." : "I'm feeling much better.");
  const text = lines.length ? lines.join(' ') : 'The doctor gave me a clean bill of health.';
  s = log(s, text, 'good');
  return setResult(s, text, 'good', { statDeltas: { health: heal }, moneyDelta: s.finances.cash - state.finances.cash || undefined });
}

/** Rehab: expensive, but knocks addictions down hard. */
export function attendRehab(state: GameState, rng: Rng): GameState {
  const active = Object.entries(state.health.addictions).filter(([, v]) => (v ?? 0) > 0);
  if (!active.length) return setResult(state, "The counselor smiled and said I didn't need to be there.", 'info');
  const addictions = { ...state.health.addictions };
  let cured = 0;
  for (const [k, v] of active) {
    const next = Math.max(0, (v ?? 0) - rng.int(40, 70));
    if (next <= 0) {
      delete addictions[k as AddictionKind];
      cured++;
    } else addictions[k as AddictionKind] = next;
  }
  let s: GameState = { ...state, health: { ...state.health, addictions } };
  const text = cured ? 'I finished the program clean. One day at a time.' : 'Rehab was hard. I made progress, but the pull is still there.';
  s = log(s, text, cured ? 'good' : 'info');
  return setResult(s, text, cured ? 'good' : 'info');
}
