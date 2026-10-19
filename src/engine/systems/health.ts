import { getCountry } from '@/data/countries';
import { ILLNESSES, ILLNESS_BY_ID, shortIllnessName } from '@/data/illnesses';
import { giveIllness } from '../events/effects';
import { scaleMoney } from '../events/text';
import type { Rng } from '../rng';
import { caregivers, spend } from './guardians';
import type { AddictionKind, GameState } from '../types';
import { addMoney, addStats, joinList, log, setResult } from '../util';

function ageBand(age: number): 0 | 1 | 2 {
  return age < 18 ? 0 : age < 65 ? 1 : 2;
}

/** What an addiction is called when it is finally beaten: "my drinking habit". */
const HABIT_NAMES: Record<AddictionKind, string> = { alcohol: 'drinking', drugs: 'drug', gambling: 'gambling' };

/** The journal line when a parent's doctor visit clears a child's illness ("My parents", "Mom" or a foster parent: `who`). */
function parentCureLine(defId: string, name: string, chronic: boolean, who: ReturnType<typeof caregivers>): string {
  const w = who.who;
  switch (defId) {
    case 'appendicitis': return `${w} rushed me to the hospital. The doctors took my appendix out, and I bounced back.`;
    case 'cancer': return `${w} found me the best care ${who.they} could. After a hard year of treatment, the cancer went into remission.`;
    case 'depression': return `${w} got me help. With time and support, my depression lifted.`;
    case 'anxiety': return `${w} got me help. With time and practice, my anxiety eased.`;
    case 'diabetes': return `${w} took me to the doctor. A new diet and a lot of walking brought my blood sugar back under control.`;
    default:
      return chronic ? `${w} took me to the doctor, and over time my ${shortIllnessName(defId, name)} went away.` : `${w} took me to the doctor, and I got over my ${shortIllnessName(defId, name)}.`;
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
      const def = ILLNESS_BY_ID[ill.defId];
      if (rng.chance(def?.cureChance ?? 0.7)) s = log(s, parentCureLine(ill.defId, ill.name, ill.chronic, caregivers(s)), 'good');
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
    const pool = ILLNESSES.filter((i) => i.weights[band] > 0 && c.age >= (i.minAge ?? 0) && !s.health.illnesses.some((x) => x.defId === i.id));
    if (pool.length) {
      const def = rng.weighted(pool, (i) => i.weights[band]);
      s = giveIllness(s, def.id);
      s = log(s, def.onset ?? `I was diagnosed with ${def.name}.`, def.severity >= 4 ? 'bad' : 'info');
      if (def.severity >= 4) s = addStats(s, { happiness: -8 });
    }
  }
  // Addictions drift
  const addictions = { ...s.health.addictions };
  for (const k of Object.keys(addictions) as AddictionKind[]) {
    const level = addictions[k] ?? 0;
    if (level <= 0) {
      delete addictions[k];
      continue;
    }
    // Untreated addictions creep up; low ones fade.
    const drift = level >= 30 ? rng.int(0, 6) : rng.int(-6, 2);
    const next = Math.max(0, Math.min(100, level + drift));
    if (next <= 0) {
      delete addictions[k];
      s = log(s, `I finally shook my ${HABIT_NAMES[k]} habit.`, 'good');
    } else {
      addictions[k] = next;
      if (next >= 40) {
        s = addStats(s, { happiness: -3, health: -1 });
        if (k === 'gambling') s = addMoney(s, -scaleMoney(s, rng.int(500, 4000)));
      }
    }
  }
  s = { ...s, health: { ...s.health, addictions } };
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
  const kept = [];
  for (const ill of s.health.illnesses) {
    const def = ILLNESS_BY_ID[ill.defId];
    const chance = (def?.cureChance ?? 0.7) + (ill.treated ? 0.1 : 0);
    if (rng.chance(chance)) {
      cured.push(shortIllnessName(ill.defId, ill.name));
      if (ill.severity >= 4) curedSerious = true;
    } else kept.push({ ...ill, treated: true });
  }
  s = { ...s, health: { ...s.health, illnesses: kept } };
  const heal = 4 + cured.length * 4;
  s = addStats(s, { health: heal });
  // Chronic conditions get a plan; acute ones the doctor could not clear just need time.
  const chronic = joinList(kept.filter((k) => k.chronic).map((k) => shortIllnessName(k.defId, k.name)));
  const acute = joinList(kept.filter((k) => !k.chronic).map((k) => shortIllnessName(k.defId, k.name)));
  const lines: string[] = [];
  if (cured.length) lines.push(`The doctor treated my ${joinList(cured)}.`);
  if (chronic) lines.push(cured.length ? `I also have a plan to manage my ${chronic}.` : `The doctor gave me a plan to manage my ${chronic}.`);
  if (acute) lines.push(`${cured.length || chronic ? '' : 'The doctor checked me over. '}I still need time to recover from my ${acute}.`);
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
