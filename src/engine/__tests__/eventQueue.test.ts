import { ageUp } from '../ageUp';
import { evaluateAll } from '../events/conditions';
import { sendToPrison } from '../events/effects';
import { EVENT_REGISTRY } from '../events/registry';
import type { EventDef } from '../events/schema';
import { makeRegistry, openNextEvent, resolveChoice } from '../events/select';
import { createLife } from '../systems/character';
import type { GameState } from '../types';

/** A 30-year-old with no pets and an empty queue. */
function adult(): GameState {
  const s = createLife({ countryCode: 'US' }, 42);
  const people = Object.fromEntries(Object.entries(s.people).filter(([, p]) => p.kind !== 'pet'));
  return { ...s, people, year: s.character.birthYear + 30, character: { ...s.character, age: 30 }, eventQueue: [] };
}

const base = { category: 'random', title: 'Test', text: 'Something happened.', minAge: 0, maxAge: 120, weight: 1 } as const;
const jail: EventDef = {
  ...base,
  id: 'test_jail',
  choices: [
    { id: 'caught', label: 'Get caught', effects: [{ prison: 3 }] },
    { id: 'free', label: 'Walk away', effects: [{ log: 'Nothing came of it.' }] },
  ],
};
const outside: EventDef = { ...base, id: 'test_outside', conditions: [{ inPrison: false }], choices: [{ id: 'ok', label: 'OK', effects: [] }] };
const childhood: EventDef = { ...base, id: 'test_childhood', maxAge: 12, choices: [{ id: 'ok', label: 'OK', effects: [] }] };
const adopt: EventDef = {
  ...base,
  id: 'test_adopt',
  conditions: [{ noPerson: ['pet'] }],
  choices: [{ id: 'adopt', label: 'Adopt', effects: [{ newPerson: { kind: 'pet', species: 'dog' } }, { queue: 'test_first_walk' }] }],
};
// A follow-up whose conditions rely on the state its source choice created (the pet), plus a guard.
const firstWalk: EventDef = {
  ...base,
  id: 'test_first_walk',
  followUpOnly: true,
  conditions: [{ hasPerson: ['pet'] }, { inPrison: false }],
  choices: [{ id: 'walk', label: 'Walk', effects: [] }],
};
const unguarded: EventDef = { ...base, id: 'test_unguarded', choices: [{ id: 'ok', label: 'OK', effects: [] }] };
const inside: EventDef = { ...base, id: 'test_inside', conditions: [{ inPrison: true }], choices: [{ id: 'ok', label: 'OK', effects: [] }] };
const reg = makeRegistry([jail, outside, childhood, adopt, firstWalk, unguarded, inside]);
const queue = (...ids: string[]) => ids.map((eventId) => ({ eventId, context: {} }));

describe('queued cards are re-checked when they open', () => {
  it('skips a card whose conditions an earlier card this year made false', () => {
    let s = openNextEvent({ ...adult(), eventQueue: queue('test_jail', 'test_outside') }, reg);
    expect(s.pendingEvent?.eventId).toBe('test_jail');
    const jailed = resolveChoice(s, 'caught', reg);
    expect(jailed.crime.inPrison).toBe(true);
    expect(jailed.pendingEvent).toBeNull();
    expect(jailed.eventQueue).toEqual([]);
    // Without the arrest the same card still opens.
    s = resolveChoice(s, 'free', reg);
    expect(s.pendingEvent?.eventId).toBe('test_outside');
  });

  it('in prison only opens cards written for prison, even ones with no prison condition', () => {
    let s = openNextEvent({ ...adult(), eventQueue: queue('test_jail', 'test_unguarded', 'test_inside') }, reg);
    s = resolveChoice(s, 'caught', reg);
    expect(s.pendingEvent?.eventId).toBe('test_inside');
    // Outside, the unguarded card opens as usual.
    s = openNextEvent({ ...adult(), eventQueue: queue('test_unguarded') }, reg);
    expect(s.pendingEvent?.eventId).toBe('test_unguarded');
  });

  it('skips a card that is outside its age range', () => {
    const s = openNextEvent({ ...adult(), eventQueue: queue('test_childhood', 'test_outside') }, reg);
    expect(s.pendingEvent?.eventId).toBe('test_outside');
  });

  it('skips a second adoption once the first card brought a pet home', () => {
    let s = openNextEvent({ ...adult(), eventQueue: queue('test_adopt', 'test_adopt') }, reg);
    s = resolveChoice(s, 'adopt', reg);
    // The duplicate is skipped (it needs noPerson: pet); the follow-up it queued still opens.
    expect(s.pendingEvent?.eventId).toBe('test_first_walk');
  });

  it('opens a follow-up that relies on the state its choice created, unless a later card broke its guard', () => {
    let s = openNextEvent({ ...adult(), eventQueue: queue('test_adopt', 'test_jail') }, reg);
    s = resolveChoice(s, 'adopt', reg);
    expect(s.pendingEvent?.eventId).toBe('test_jail');
    expect(resolveChoice(s, 'free', reg).pendingEvent?.eventId).toBe('test_first_walk');
    const jailed = resolveChoice(s, 'caught', reg);
    expect(jailed.pendingEvent).toBeNull();
    expect(jailed.eventQueue).toEqual([]);
  });

  it('does not open the false-charge court date ("no prison" plea deal) while in prison', () => {
    const free = openNextEvent({ ...adult(), eventQueue: queue('cp_false_charge_court') }, EVENT_REGISTRY);
    expect(free.pendingEvent?.eventId).toBe('cp_false_charge_court');
    const jailed = openNextEvent({ ...sendToPrison(adult(), 12), eventQueue: queue('cp_false_charge_court') }, EVENT_REGISTRY);
    expect(jailed.pendingEvent).toBeNull();
  });

  it('every card that opens in a played life fits its age range and conditions', () => {
    const misfits: string[] = [];
    for (let seed = 1; seed <= 70; seed++) {
      let s = createLife({}, seed);
      for (let y = 0; y < 120 && s.alive; y++) {
        s = ageUp(s);
        while (s.pendingEvent) {
          const def = EVENT_REGISTRY.byId[s.pendingEvent.eventId]!;
          const age = s.character.age;
          if (age < def.minAge || age > def.maxAge || !evaluateAll(s, def.conditions)) misfits.push(`seed ${seed} age ${age}: ${def.id}`);
          s = resolveChoice(s, s.pendingEvent.choices[0]!.id, EVENT_REGISTRY);
        }
      }
    }
    expect(misfits).toEqual([]);
  });
});
