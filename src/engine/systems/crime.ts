import { CRIME_BY_ID, type CrimeDef } from '@/data/crimes';
import { sendToPrison } from '../events/effects';
import { parentsRef, scaleMoney } from '../events/text';
import { guardianFunds, payForMinor } from './guardians';
import type { Rng } from '../rng';
import type { ActionAvailability, GameState } from '../types';
import { addKarma, addMoney, addStats, bump, capitalize, clampStat, log, money, plural, setResult, actionCount, countAction } from '../util';

export function crimeAvailability(state: GameState, def: CrimeDef): ActionAvailability {
  if (state.character.age < def.minAge) return { available: false, reason: `Age ${def.minAge}+` };
  if (state.crime.inPrison) return { available: false, reason: 'In prison' };
  if (def.energy > state.character.energy) return { available: false, reason: 'No energy left this year' };
  if (actionCount(state, `crime:${def.id}`) >= 2) return { available: false, reason: 'Too risky to repeat this year' };
  return { available: true };
}

export function commitCrime(state: GameState, rng: Rng, id: string): GameState {
  const def = CRIME_BY_ID[id];
  if (!def) return state;
  const avail = crimeAvailability(state, def);
  if (!avail.available) return setResult(state, avail.reason ?? 'Not available', 'bad');
  let s = countAction(state, `crime:${def.id}`);
  s = { ...s, character: { ...s.character, energy: s.character.energy - def.energy } };
  s = bump(s, 'crimes');
  s = addKarma(s, def.karma);
  const c = s.character;
  let chance = def.success + (c.stats.smarts - 50) / 250 + (c.traits.includes('rebellious') ? 0.08 : 0) + (c.traits.includes('lucky') ? 0.05 : 0) - s.crime.notoriety / 400;
  chance = Math.max(0.05, Math.min(0.95, chance));
  const injured = rng.chance(def.injury);
  if (injured) {
    s = addStats(s, { health: -rng.int(5, 15) });
    s = { ...s, health: { ...s.health, injuries: s.health.injuries + 1 } };
  }
  if (rng.chance(chance)) {
    const payout = scaleMoney(s, rng.int(def.payout[0], def.payout[1]));
    s = addMoney(s, payout);
    s = { ...s, crime: { ...s.crime, crimesCommitted: s.crime.crimesCommitted + 1, notoriety: clampStat(s.crime.notoriety + 2) } };
    s = addStats(s, { happiness: c.traits.includes('rebellious') ? 3 : 1 });
    const text = payout > 0 ? `I got away with ${def.noun} and made ${money(s, payout)}.${injured ? ' I got hurt in the process.' : ''}` : `I got away with ${def.noun}.${injured ? ' Not without a few bruises.' : ''}`;
    s = log(s, text, 'bad');
    return setResult(s, text, 'info', { moneyDelta: payout });
  }
  s = { ...s, crime: { ...s.crime, crimesCommitted: s.crime.crimesCommitted + 1 } };
  if (rng.chance(def.arrestOnFail)) {
    const years = rng.int(def.sentence[0], def.sentence[1]);
    if (years <= 0) {
      s = { ...s, crime: { ...s.crime, record: true, arrests: s.crime.arrests + 1, notoriety: clampStat(s.crime.notoriety + 3) } };
      s = bump(s, 'arrests');
      s = addStats(s, { happiness: -6 });
      const fine = scaleMoney(s, rng.int(100, 1500));
      // A minor's fine is paid by their parents (or waived), never turned into a child's debt.
      const minor = s.character.age < 18;
      const parentsPay = minor && guardianFunds(s) > 0;
      s = minor ? payForMinor(s, fine) : addMoney(s, -fine);
      const text = !minor
        ? `I was caught ${def.gerund} and fined ${money(s, fine)}. It's on my record now.`
        : parentsPay
          ? `I was caught ${def.gerund}. ${capitalize(parentsRef(s))} had to pay a ${money(s, fine)} fine, and it's on my record now.`
          : `I was caught ${def.gerund}. I was too young to be fined, but it's on my record now.`;
      s = log(s, text, 'bad');
      return setResult(s, text, 'bad', { moneyDelta: minor ? 0 : -fine });
    }
    s = sendToPrison(s, years);
    s = addStats(s, { happiness: -15 });
    const text = `I was arrested for ${def.noun} and sentenced to ${plural(years, 'year')} in prison.`;
    s = log(s, text, 'bad');
    return setResult(s, text, 'bad');
  }
  s = addStats(s, { happiness: -3 });
  const text = `I tried ${def.gerund}, but it went wrong and I ran. Nobody followed.${injured ? ' I limped home.' : ''}`;
  s = log(s, text, 'bad');
  return setResult(s, text, 'info');
}

/** Prison time passes; release when the sentence ends. */
export function yearlyPrison(state: GameState, rng: Rng): GameState {
  if (!state.crime.inPrison) return state;
  let s = bump(state, 'yearsInPrison');
  s = { ...s, crime: { ...s.crime, prisonYearsTotal: s.crime.prisonYearsTotal + 1 } };
  const left = s.crime.sentenceYearsLeft - 1;
  if (rng.chance(0.15)) {
    s = addStats(s, { health: -rng.int(3, 10) });
    s = log(s, 'I got into a fight in the yard.', 'bad');
  }
  if (left <= 0) {
    s = { ...s, crime: { ...s.crime, inPrison: false, sentenceYearsLeft: 0 } };
    s = addStats(s, { happiness: 10 });
    s = log(s, 'I was released from prison.', 'milestone');
  } else {
    s = { ...s, crime: { ...s.crime, sentenceYearsLeft: left } };
    s = log(s, `Another year behind bars. ${plural(left, 'year')} to go.`, 'bad');
  }
  return s;
}
