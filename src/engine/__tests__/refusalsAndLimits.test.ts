import { ACTIVITY_BY_ID } from '@/data/activities';
import { ageUp } from '../ageUp';
import { applyAction } from '../actions';
import { makeRegistry } from '../events/select';
import { activityAvailability } from '../systems/activities';
import { hustleOptions } from '../systems/careers';
import { createLife } from '../systems/character';
import { dropOutBlocker, SKIP_CLASS_PER_YEAR, skipClassBlocker } from '../systems/education';
import type { GameState } from '../types';

const noEvents = makeRegistry([]);

/** Ages a life with no random events, keeping it healthy so the system under test decides the outcome. */
function ageTo(state: GameState, age: number): GameState {
  let s = state;
  while (s.alive && s.character.age < age) {
    s = ageUp(s, noEvents);
    s = { ...s, character: { ...s.character, stats: { ...s.character.stats, health: 95, smarts: 80 } }, health: { ...s.health, illnesses: [] } };
  }
  return s;
}

const adult = (seed = 1): GameState => ageTo(createLife({ countryCode: 'US' }, seed), 26);
const withCash = (s: GameState, cash: number): GameState => ({ ...s, finances: { ...s.finances, cash } });
const jailed = (s: GameState): GameState => ({ ...s, crime: { ...s.crime, inPrison: true, sentenceYearsLeft: 5, record: true } });

describe('rehab (F07)', () => {
  it('refuses without an addiction and charges nothing', () => {
    const s = { ...withCash(adult(42), 20_000), health: { ...adult(42).health, addictions: {} } };
    expect(activityAvailability(s, ACTIVITY_BY_ID.rehab!)).toMatchObject({ available: false, reason: 'No addiction to treat' });
    const after = applyAction(s, { type: 'activity', id: 'rehab' });
    expect(after.finances.cash).toBe(20_000);
    expect(after.character.energy).toBe(s.character.energy);
    expect(after.actionsThisYear['activity:rehab']).toBeUndefined();
    expect(after.lastResult).toMatchObject({ text: 'No addiction to treat', kind: 'bad' });
  });

  it('still treats a real addiction for its price', () => {
    const base = withCash(adult(42), 20_000);
    const s = { ...base, health: { ...base.health, addictions: { alcohol: 50 } } };
    const after = applyAction(s, { type: 'activity', id: 'rehab' });
    expect(after.finances.cash).toBeLessThan(20_000);
    expect(after.health.addictions.alcohol ?? 0).toBeLessThan(50);
  });
});

describe('dropping out (F11)', () => {
  it('is refused under 16 and in primary or middle school, and the stage is kept', () => {
    for (const age of [6, 12, 15]) {
      const s = ageTo(createLife({ countryCode: 'US' }, 7), age);
      expect(s.education.enrolled).toBe(true);
      expect(dropOutBlocker(s)).toBe("I'm too young to drop out.");
      const after = applyAction(s, { type: 'dropOut' });
      expect(after.education).toEqual(s.education);
      expect(after.lastResult?.text).toBe("I'm too young to drop out.");
    }
    const odd = ageTo(createLife({ countryCode: 'US' }, 7), 9);
    expect(dropOutBlocker({ ...odd, character: { ...odd.character, age: 17 } })).toBe("I'm too young to drop out.");
  });

  it('is allowed from high school at 16', () => {
    const s = ageTo(createLife({ countryCode: 'US' }, 7), 16);
    expect(s.education.stage).toBe('high');
    expect(dropOutBlocker(s)).toBeNull();
    const after = applyAction(s, { type: 'dropOut' });
    expect(after.education).toMatchObject({ enrolled: false, droppedOut: true, stage: 'done' });
  });
});

describe('activities in prison (F13)', () => {
  const inside = withCash(jailed(adult()), 50_000);

  it('refuses salon, surgery, diet and the fun list without charging', () => {
    for (const id of ['plastic_surgery', 'salon', 'diet', 'therapy', 'vacation', 'movies']) {
      expect(activityAvailability(inside, ACTIVITY_BY_ID[id]!)).toMatchObject({ available: false, reason: 'Not available in prison' });
      const after = applyAction(inside, { type: 'activity', id });
      expect(after.finances.cash).toBe(50_000);
      expect(after.character.stats).toEqual(inside.character.stats);
    }
  });

  it('allows the yard, the library, meditation and the infirmary, and the prison gym is free', () => {
    for (const id of ['gym', 'library', 'jog', 'meditate', 'doctor']) expect(activityAvailability(inside, ACTIVITY_BY_ID[id]!).available).toBe(true);
    expect(activityAvailability(inside, ACTIVITY_BY_ID.gym!).cost).toBe(0);
    expect(applyAction(inside, { type: 'activity', id: 'gym' }).finances.cash).toBe(50_000);
  });
});

describe('side hustles (F14)', () => {
  it('cannot be started from a prison cell', () => {
    const after = applyAction(jailed(adult()), { type: 'startHustle', defId: 'streamer' });
    expect(after.career.hustle).toBeNull();
    expect(after.lastResult?.text).toBe("I can't run a side hustle from a prison cell.");
  });

  it('charge their energy when started and every year they keep running', () => {
    const s = adult();
    const started = applyAction(s, { type: 'startHustle', defId: 'streamer' });
    expect(started.character.energy).toBe(s.character.energy - 1);
    const next = ageUp(started, noEvents);
    expect(next.career.hustle?.defId).toBe('streamer');
    expect(next.character.energy).toBe(next.character.energyMax - 1);
    const tired = applyAction({ ...s, character: { ...s.character, energy: 0 } }, { type: 'startHustle', defId: 'streamer' });
    expect(tired.career.hustle).toBeNull();
    expect(tired.lastResult?.text).toMatch(/out of energy/);
  });

  it('rideshare ends when the car is sold, and pays nothing once no car is owned', () => {
    let s = applyAction(withCash(adult(), 100_000), { type: 'buyAsset', defId: 'old_hatchback', financing: 'cash' });
    s = applyAction(s, { type: 'startHustle', defId: 'rideshare' });
    expect(s.career.hustle?.defId).toBe('rideshare');
    const car = s.assets.find((a) => a.kind === 'car')!;
    const sold = applyAction(s, { type: 'sellAsset', assetId: car.id });
    expect(sold.career.hustle).toBeNull();
    expect(sold.lastResult?.text).toMatch(/Without a car, my rideshare gig was over\.$/);
    // A car lost any other way (an event, bankruptcy) ends it at the next birthday, before it earns.
    const wrecked = ageUp({ ...s, assets: s.assets.filter((a) => a.kind !== 'car') }, noEvents);
    expect(wrecked.career.hustle).toBeNull();
    expect(wrecked.log.some((l) => l.text === 'Without a car, my rideshare gig was over.')).toBe(true);
  });

  it('the start list explains every refusal', () => {
    const opts = hustleOptions(adult());
    expect(opts.find((o) => o.def.id === 'rideshare')).toMatchObject({ eligible: false, reason: 'I need a car for that.' });
    expect(opts.find((o) => o.def.id === 'streamer')).toMatchObject({ eligible: true });
  });
});

describe('skipping class (F15)', () => {
  it('is capped each year, costs energy, and says so', () => {
    let s = ageTo(createLife({ countryCode: 'US' }, 8), 8);
    const start = s;
    for (let i = 0; i < 12; i++) s = applyAction(s, { type: 'skipClass' });
    expect(s.actionsThisYear.skipClass).toBe(SKIP_CLASS_PER_YEAR);
    expect(s.character.energy).toBe(start.character.energy - SKIP_CLASS_PER_YEAR);
    expect(s.education.grade).toBe(Math.max(0, start.education.grade - 8 * SKIP_CLASS_PER_YEAR));
    expect(s.lastResult?.text).toBe("I've skipped enough this year.");
    // The cap resets with the year.
    expect(skipClassBlocker(ageUp(s, noEvents))).toBeNull();
  });

  it('needs energy left', () => {
    const s = ageTo(createLife({ countryCode: 'US' }, 8), 8);
    const tired = applyAction({ ...s, character: { ...s.character, energy: 0 } }, { type: 'skipClass' });
    expect(tired.education.grade).toBe(s.education.grade);
    expect(tired.lastResult?.text).toBe("I'm out of energy this year. Age up to recharge.");
  });
});

describe('refusals say why (F18)', () => {
  it('paying debt with no cash, or with no debt', () => {
    const s = adult(9);
    const broke = applyAction({ ...s, finances: { ...s.finances, cash: 0, debt: 5_000 } }, { type: 'payDebt', amount: 0 });
    expect(broke.finances.debt).toBe(5_000);
    expect(broke.lastResult).toMatchObject({ text: 'I have no cash to pay my debt with.', kind: 'bad' });
    expect(applyAction({ ...s, finances: { ...s.finances, debt: 0 } }, { type: 'payDebt', amount: 100 }).lastResult?.text).toBe("I don't have any debt to pay.");
  });

  it('enrolling from prison or without a diploma', () => {
    const s = ageTo(createLife({ countryCode: 'US', customStats: { smarts: 90 } }, 5), 19);
    expect(s.education.degrees).toContain('high_school');
    const inside = applyAction(jailed(s), { type: 'enroll', major: 'business' });
    expect(inside.education.enrolled).toBe(false);
    expect(inside.lastResult?.text).toBe("I can't enroll while I'm in prison.");
    const noDiploma = applyAction({ ...s, education: { ...s.education, degrees: [] } }, { type: 'enroll', major: 'business' });
    expect(noDiploma.lastResult?.text).toBe('I need a high school diploma first.');
  });

  it('a reroll too young or in prison is refused without spending the reward', () => {
    const kid = ageTo(createLife({ countryCode: 'IN' }, 4), 10);
    const after = applyAction(kid, { type: 'rewarded', placement: 'reroll' });
    expect(after.counters.rewardedAdsUsed).toBe(kid.counters.rewardedAdsUsed);
    expect(after.career.listings).toEqual(kid.career.listings);
    expect(after.lastResult?.text).toBe("I'm too young for job listings. They open up at 14.");
    expect(applyAction(kid, { type: 'refreshListings' }).lastResult?.text).toBe("I'm too young for job listings. They open up at 14.");
    const inside = jailed(adult());
    expect(applyAction(inside, { type: 'rewarded', placement: 'reroll' }).counters.rewardedAdsUsed).toBe(inside.counters.rewardedAdsUsed);
    const free = applyAction(adult(), { type: 'rewarded', placement: 'reroll' });
    expect(free.career.listings.length).toBeGreaterThan(0);
    expect(free.counters.rewardedAdsUsed).toBe(adult().counters.rewardedAdsUsed + 1);
  });

  it('investing is for adults', () => {
    const kid = withCash(ageTo(createLife({ countryCode: 'IN' }, 4), 10), 500);
    const after = applyAction(kid, { type: 'invest', kind: 'crypto', amount: 125 });
    expect(after.finances.cash).toBe(500);
    expect(after.finances.investments).toEqual(kid.finances.investments);
    expect(after.lastResult?.text).toBe('I have to be 18 to open an investment account.');
    expect(applyAction(withCash(adult(), 500), { type: 'invest', kind: 'savings', amount: 125 }).finances.cash).toBe(375);
  });
});
