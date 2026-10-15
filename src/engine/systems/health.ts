import { getCountry } from '@/data/countries';
import { ILLNESSES, ILLNESS_BY_ID } from '@/data/illnesses';
import { giveIllness } from '../events/effects';
import { scaleMoney } from '../events/text';
import type { Rng } from '../rng';
import type { AddictionKind, GameState } from '../types';
import { addMoney, addStats, log, setResult } from '../util';

function ageBand(age: number): 0 | 1 | 2 {
  return age < 18 ? 0 : age < 65 ? 1 : 2;
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
      s = log(s, `I recovered from ${ill.name}.`, 'good');
    } else remaining.push({ ...ill, yearsLeft: left });
  }
  s = { ...s, health: { ...s.health, illnesses: remaining } };
  // Children get taken to the doctor by their parents.
  if (c.age < 18 && s.health.illnesses.length && Object.values(s.people).some((p) => (p.kind === 'mother' || p.kind === 'father' || p.kind === 'stepmother' || p.kind === 'stepfather') && p.alive)) {
    const kept = [];
    for (const ill of s.health.illnesses) {
      const def = ILLNESS_BY_ID[ill.defId];
      if (rng.chance(def?.cureChance ?? 0.7)) s = log(s, `My parents took me to the doctor and I got over ${ill.name}.`, 'good');
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
    const pool = ILLNESSES.filter((i) => i.weights[band] > 0 && !s.health.illnesses.some((x) => x.defId === i.id));
    if (pool.length) {
      const def = rng.weighted(pool, (i) => i.weights[band]);
      s = giveIllness(s, def.id);
      s = log(s, `I was diagnosed with ${def.name}.`, def.severity >= 4 ? 'bad' : 'info');
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
      s = log(s, `I finally shook my ${k} habit.`, 'good');
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
  let s = addMoney(state, -cost);
  s = { ...s, health: { ...s.health, doctorVisitsThisYear: s.health.doctorVisitsThisYear + 1 } };
  const cured: string[] = [];
  const kept = [];
  for (const ill of s.health.illnesses) {
    const def = ILLNESS_BY_ID[ill.defId];
    const chance = (def?.cureChance ?? 0.7) + (ill.treated ? 0.1 : 0);
    if (rng.chance(chance)) cured.push(ill.name);
    else kept.push({ ...ill, treated: true });
  }
  s = { ...s, health: { ...s.health, illnesses: kept } };
  const heal = 4 + cured.length * 4;
  s = addStats(s, { health: heal });
  const text = cured.length
    ? `The doctor treated my ${cured.join(' and ')}. I'm feeling much better.`
    : kept.length
      ? `The doctor managed my ${kept.map((k) => k.name).join(', ')} and gave me a plan.`
      : 'The doctor gave me a clean bill of health.';
  s = log(s, text, 'good');
  return setResult(s, text, 'good', { statDeltas: { health: heal }, moneyDelta: -cost });
}

/** Rehab: expensive, but knocks addictions down hard. */
export function attendRehab(state: GameState, rng: Rng): GameState {
  const active = Object.entries(state.health.addictions).filter(([, v]) => (v ?? 0) > 0);
  if (!active.length) return setResult(state, "The counsellor smiled and said I didn't need to be there.", 'info');
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
  const text = cured ? 'I finished the programme clean. One day at a time.' : 'Rehab was hard. I made progress, but the pull is still there.';
  s = log(s, text, cured ? 'good' : 'info');
  return setResult(s, text, cured ? 'good' : 'info');
}
