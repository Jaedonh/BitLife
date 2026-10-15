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
  if (def.id === 'lottery' && !getCountry(state.character.countryCode).gamblingLegal) return { available: false, reason: 'Illegal here', cost };
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
  if (def.id === 'lottery') return playLottery(s, rng, cost);

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

function playLottery(state: GameState, rng: Rng, cost: number): GameState {
  let s = bump(state, 'gamblingSessions');
  const lucky = s.character.traits.includes('lucky') ? 2 : 1;
  const roll = rng.next();
  let prize = 0;
  if (roll < 0.000_02 * lucky) prize = scaleMoney(s, rng.int(5_000_000, 50_000_000));
  else if (roll < 0.0005 * lucky) prize = scaleMoney(s, rng.int(50_000, 500_000));
  else if (roll < 0.01 * lucky) prize = scaleMoney(s, rng.int(500, 5_000));
  else if (roll < 0.12 * lucky) prize = scaleMoney(s, rng.int(20, 100));
  if (prize > 0) {
    s = addMoney(s, prize);
    s = { ...s, counters: { ...s.counters, gamblingWon: s.counters.gamblingWon + prize } };
    const big = prize >= scaleMoney(s, 50_000);
    if (big) s = addStats(s, { happiness: 25 });
    const text = big ? `I WON THE LOTTERY! ${prize.toLocaleString('en-US')}!` : `My lottery ticket won ${prize.toLocaleString('en-US')}.`;
    s = log(s, text, 'money');
    return setResult(s, text, 'good', { moneyDelta: prize - cost });
  }
  s = { ...s, counters: { ...s.counters, gamblingLost: s.counters.gamblingLost + cost } };
  s = log(s, 'I bought a lottery ticket. Not a winner.');
  return setResult(s, 'Not a winner. Maybe next year.', 'info', { moneyDelta: -cost });
}
