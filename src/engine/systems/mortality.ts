import { getCountry } from '@/data/countries';
import { ILLNESS_BY_ID } from '@/data/illnesses';
import type { Rng } from '../rng';
import type { GameState } from '../types';
import { log } from '../util';
import { markDeath } from './death';

export function baseMortality(age: number): number {
  if (age < 1) return 0.004;
  if (age < 15) return 0.0003;
  if (age < 25) return 0.0008;
  if (age < 45) return 0.0015;
  if (age < 55) return 0.004;
  if (age < 65) return 0.009;
  if (age < 75) return 0.02;
  if (age < 85) return 0.05;
  if (age < 95) return 0.12;
  if (age < 105) return 0.25;
  return 0.5;
}

/** Yearly probability of dying given the full state. */
export function deathProbability(state: GameState): number {
  const c = state.character;
  const country = getCountry(c.countryCode);
  let p = baseMortality(c.age) * Math.pow(78 / country.lifeExpectancy, 2);
  const h = c.stats.health;
  if (h <= 10) p *= 6;
  else if (h < 25) p *= 3.5;
  else if (h < 40) p *= 2;
  else if (h >= 80) p *= 0.7;
  for (const ill of state.health.illnesses) {
    if (ill.severity >= 5) p += ill.treated ? 0.04 : 0.12;
    else if (ill.severity === 4) p += ill.treated ? 0.01 : 0.04;
  }
  for (const level of Object.values(state.health.addictions)) if ((level ?? 0) >= 60) p += 0.01;
  if (state.crime.inPrison) p += 0.004;
  if (state.career.job && state.career.job.yearsHeld > 0) p += 0; // placeholder for danger handled in careers
  return Math.min(0.95, p);
}

const AGE_CAUSES_YOUNG = ['a car accident', 'a freak accident', 'a sudden illness', 'an undiagnosed heart condition'];
const AGE_CAUSES_MID = ['a heart attack', 'a car accident', 'cancer', 'a stroke', 'a sudden illness'];
const AGE_CAUSES_OLD = ['a heart attack', 'a stroke', 'natural causes', 'pneumonia', 'cancer', 'heart failure', 'old age'];

export function pickDeathCause(state: GameState, rng: Rng): string {
  const severe = state.health.illnesses.filter((i) => i.severity >= 4);
  if (severe.length && rng.chance(0.75)) {
    const ill = rng.pick(severe);
    const def = ILLNESS_BY_ID[ill.defId];
    return def ? def.name.replace(/^(a|an|the) /, '') : ill.name;
  }
  if (state.health.criticalYears === 0 && state.character.stats.health <= 10) return 'organ failure';
  const age = state.character.age;
  return rng.pick(age < 30 ? AGE_CAUSES_YOUNG : age < 60 ? AGE_CAUSES_MID : AGE_CAUSES_OLD);
}

/** Rolls for death; also manages the "critical" countdown that warns the player. */
export function rollMortality(state: GameState, rng: Rng): GameState {
  let s = state;
  const h = s.character.stats.health;
  if (h <= 8) {
    if (s.health.criticalYears === 0) {
      s = { ...s, health: { ...s.health, criticalYears: 2 } };
      s = log(s, 'My doctor told me bluntly: if I do not turn my health around within two years, I will not survive.', 'bad');
    } else {
      const left = s.health.criticalYears - 1;
      s = { ...s, health: { ...s.health, criticalYears: left } };
      if (left <= 0) return markDeath(s, 'organ failure');
      s = log(s, `My body is failing. I have maybe ${left} year${left === 1 ? '' : 's'} left unless something changes.`, 'bad');
    }
  } else if (s.health.criticalYears > 0) {
    s = { ...s, health: { ...s.health, criticalYears: 0 } };
    s = log(s, 'My health is back from the brink. The doctor called it a second chance.', 'good');
  }
  if (rng.chance(deathProbability(s))) return markDeath(s, pickDeathCause(s, rng));
  return s;
}
