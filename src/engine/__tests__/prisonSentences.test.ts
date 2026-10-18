import { EVENTS } from '@/data/events';
import { applyEffects, sendToPrison } from '../events/effects';
import { EVENT_REGISTRY } from '../events/registry';
import { validateEvent, type Effect, type EventDef } from '../events/schema';
import { fitsState, makeRegistry, openNextEvent, resolveChoice } from '../events/select';
import { Rng } from '../rng';
import { createLife } from '../systems/character';
import { yearlyPrison } from '../systems/crime';
import type { GameState } from '../types';

/** A player of the given age with an empty queue. */
function aged(age: number): GameState {
  const s = createLife({ countryCode: 'US' }, 42);
  return { ...s, year: s.character.birthYear + age, character: { ...s.character, age }, eventQueue: [] };
}

/** Ages through prison years until release; returns how many years were served. */
function serve(state: GameState): number {
  let s = state;
  let years = 0;
  while (s.crime.inPrison && years < 100) {
    s = yearlyPrison(s, new Rng(years + 1));
    years++;
  }
  return years;
}

describe('prison sentences', () => {
  it('adds a new sentence to the time left instead of replacing it', () => {
    let s = sendToPrison(aged(30), 12);
    expect(s.crime.sentenceYearsLeft).toBe(12);
    s = sendToPrison(s, 1);
    expect(s.crime.inPrison).toBe(true);
    expect(s.crime.sentenceYearsLeft).toBe(13);
    expect(s.crime.convictions).toBe(2);
  });

  it('a prison effect from an event written for prison extends the sentence', () => {
    const extra: EventDef = {
      id: 'test_inside_conviction',
      category: 'prison',
      title: 'Test',
      text: 'Something happened inside.',
      minAge: 0,
      maxAge: 120,
      weight: 1,
      conditions: [{ inPrison: true }],
      choices: [{ id: 'caught', label: 'Get caught', effects: [{ prison: 2 }] }],
    };
    const reg = makeRegistry([extra]);
    let s = openNextEvent({ ...sendToPrison(aged(30), 5), eventQueue: [{ eventId: extra.id, context: {} }] }, reg);
    expect(s.pendingEvent?.eventId).toBe(extra.id);
    s = resolveChoice(s, 'caught', reg);
    expect(s.crime.sentenceYearsLeft).toBe(7);
  });

  it('the combined sentence is served in full, and a later sentence starts fresh', () => {
    const jailed = applyEffects(sendToPrison(aged(30), 2), new Rng(3), [{ prison: 3 }]);
    expect(serve(jailed)).toBe(5);
    let free = jailed;
    while (free.crime.inPrison) free = yearlyPrison(free, new Rng(9));
    expect(free.crime.sentenceYearsLeft).toBe(0);
    expect(sendToPrison(free, 3).crime.sentenceYearsLeft).toBe(3);
    // A sentence always means at least a year.
    expect(sendToPrison(aged(30), 0).crime.sentenceYearsLeft).toBe(1);
  });
});

describe('arrest and court cards in prison', () => {
  const base = { category: 'crime', title: 'Test', text: 'The police knocked.', minAge: 18, maxAge: 80, weight: 1 } as const;
  const arrests: Effect[] = [{ chance: 0.5, then: [{ random: [{ weight: 1, effects: [{ arrest: true }] }] }] }];
  const errorsFor = (def: EventDef) => validateEvent(def, new Set([def.id])).filter((e) => e.includes('inPrison'));

  it('the validator asks every event that can arrest or jail the player whether it happens in prison', () => {
    expect(errorsFor({ ...base, id: 'test_raid', choices: [{ id: 'run', label: 'Run', effects: arrests }] })).toHaveLength(1);
    expect(errorsFor({ ...base, id: 'test_court', followUpOnly: true, choices: [{ id: 'fight', label: 'Fight it', effects: [{ prison: 1 }] }] })).toHaveLength(1);
    // Declared for the outside, for the inside, or on the choice that jails.
    expect(errorsFor({ ...base, id: 'test_raid', conditions: [{ inPrison: false }], choices: [{ id: 'run', label: 'Run', effects: arrests }] })).toEqual([]);
    expect(errorsFor({ ...base, id: 'test_riot', conditions: [{ inPrison: true }], choices: [{ id: 'join', label: 'Join in', effects: [{ prison: 2 }] }] })).toEqual([]);
    expect(
      errorsFor({
        ...base,
        id: 'test_mixed',
        choices: [
          { id: 'run', label: 'Run', conditions: [{ not: { inPrison: true } }], effects: arrests },
          { id: 'wait', label: 'Wait', effects: [] },
        ],
      }),
    ).toEqual([]);
  });

  it('no arrest, police or court card written for the outside fits a player in prison', () => {
    const jailsOrArrests = (effects: readonly Effect[]): boolean =>
      effects.some((e) => 'prison' in e || 'arrest' in e || ('random' in e && e.random.some((o) => jailsOrArrests(o.effects))) || ('chance' in e && (jailsOrArrests(e.then) || jailsOrArrests(e.else ?? []))));
    const outside = EVENTS.filter((d) => d.category !== 'prison' && (d.id === 'tn_party_police' || d.choices.some((c) => jailsOrArrests(c.effects))));
    expect(outside.map((d) => d.id)).toEqual(expect.arrayContaining(['cp_false_charge_court', 'cp_witness_summons', 'tn_shoplift_dare', 'tn_party_police']));
    const misfits: string[] = [];
    for (const def of outside) {
      // A jailed player of the card's age (set directly, so juvenile sentencing rules do not matter here).
      const s0 = aged(def.minAge);
      const jailed: GameState = { ...s0, crime: { ...s0.crime, inPrison: true, sentenceYearsLeft: 2, record: true } };
      if (fitsState(jailed, def)) misfits.push(def.id);
    }
    expect(misfits).toEqual([]);
  });

  it('the false-charge court date cannot shorten a sentence being served', () => {
    const jailed = sendToPrison(aged(30), 12);
    const s = openNextEvent({ ...jailed, rng: { s: 2 }, eventQueue: [{ eventId: 'cp_false_charge_court', context: {} }] }, EVENT_REGISTRY);
    expect(s.pendingEvent).toBeNull();
    expect(s.crime.sentenceYearsLeft).toBe(12);
  });
});
