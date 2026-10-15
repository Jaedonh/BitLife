import { ACTIVITY_BY_ID, type ActivityDef } from '@/data/activities';
import { getCountry } from '@/data/countries';
import { giveIllness } from '../events/effects';
import { scaleMoney } from '../events/text';
import type { Rng } from '../rng';
import type { ActionAvailability, GameState } from '../types';
import { actionCount, addKarma, addMoney, addStats, bump, countAction, log, setResult } from '../util';
import { attendRehab, doctorCost, visitDoctor } from './health';

export function activityCost(state: GameState, def: ActivityDef): number {
  if (def.id === 'doctor') return doctorCost(state);
  if (def.id === 'gym' || def.id === 'therapy') {
    const c = getCountry(state.character.countryCode);
    return scaleMoney(state, def.cost) * (c.publicHealthcare && def.id === 'therapy' ? 0.4 : 1);
  }
  return scaleMoney(state, def.cost);
}

export function activityAvailability(state: GameState, def: ActivityDef): ActionAvailability {
  const cost = activityCost(state, def);
  if (state.character.age < def.minAge) return { available: false, reason: `Age ${def.minAge}+`, cost };
  if (def.maxAge !== undefined && state.character.age > def.maxAge) return { available: false, reason: 'Too old', cost };
  if (state.crime.inPrison && def.group !== 'mind_body' && def.id !== 'doctor') return { available: false, reason: 'In prison', cost };
  if (def.perYear > 0 && actionCount(state, `activity:${def.id}`) >= def.perYear) return { available: false, reason: 'Done for this year', cost };
  if (def.energy > state.character.energy) return { available: false, reason: 'No energy left this year', cost };
  if (cost > state.finances.cash) return { available: false, reason: "Can't afford it", cost };
  return { available: true, cost };
}

export function doActivity(state: GameState, rng: Rng, id: string): GameState {
  const def = ACTIVITY_BY_ID[id];
  if (!def) return state;
  const avail = activityAvailability(state, def);
  if (!avail.available) return setResult(state, avail.reason ?? 'Not available', 'bad');
  const cost = avail.cost ?? 0;
  let s = countAction(state, `activity:${def.id}`);
  s = { ...s, character: { ...s.character, energy: s.character.energy - def.energy } };

  if (def.id === 'doctor') return visitDoctor(s, rng);
  if (def.id === 'rehab') {
    s = addMoney(s, -cost);
    return attendRehab(s, rng);
  }
  s = addMoney(s, -cost);

  const athletic = s.character.traits.includes('athletic') && (def.id === 'gym' || def.id === 'jog') ? 2 : 0;
  const quick = s.character.traits.includes('quick_learner') && def.id === 'library' ? 2 : 0;
  if (def.risk && rng.chance(def.risk.chance)) {
    s = addStats(s, def.risk.effects);
    if (def.risk.injury) s = { ...s, health: { ...s.health, injuries: s.health.injuries + 1 } };
    if (def.risk.illness) s = giveIllness(s, def.risk.illness);
    s = log(s, def.risk.text, 'bad');
    return setResult(s, def.risk.text, 'bad', { statDeltas: def.risk.effects, moneyDelta: -cost });
  }
  const effects = { ...def.effects, health: (def.effects.health ?? 0) + athletic, smarts: (def.effects.smarts ?? 0) + quick };
  s = addStats(s, effects);
  if (def.karma) s = addKarma(s, def.karma);
  if (def.counter) s = bump(s, def.counter);
  s = log(s, def.text, 'good');
  return setResult(s, def.text, 'good', { statDeltas: effects, moneyDelta: -cost });
}
