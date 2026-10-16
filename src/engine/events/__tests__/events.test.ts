import { EVENTS } from '@/data/events';
import { createLife, makePerson } from '../../systems/character';
import { Rng } from '../../rng';
import { applyEffects } from '../effects';
import { makeRegistry, openNextEvent, resolveChoice, scheduleYearEvents } from '../select';
import { validateEvent, type EventDef } from '../schema';
import { renderText } from '../text';

const registry = makeRegistry(EVENTS);

describe('event content validation', () => {
  it('every event is valid and ids are unique', () => {
    const ids = new Set(EVENTS.map((e) => e.id));
    expect(ids.size).toBe(EVENTS.length);
    const errors = EVENTS.flatMap((e) => validateEvent(e, ids));
    expect(errors).toEqual([]);
  });
});

describe('event flow', () => {
  const def: EventDef = {
    id: 'test_gift',
    category: 'family',
    title: 'Gift',
    text: '{{person}} gave me {{$100}}.',
    minAge: 0,
    maxAge: 100,
    weight: 1,
    person: { kind: ['mother'] },
    choices: [
      { id: 'thank', label: 'Say thanks', effects: [{ money: 100 }, { relationship: 'person', delta: 5 }, { karma: 1 }] },
      { id: 'rich', label: 'Only if rich', conditions: [{ money: { gte: 1_000_000 } }], effects: [{ money: 1 }] },
    ],
  };
  const reg = makeRegistry([def]);

  it('opens, renders and resolves a queued event', () => {
    let s = createLife({ countryCode: 'US' }, 42);
    const mother = Object.values(s.people).find((p) => p.kind === 'mother')!;
    s = { ...s, eventQueue: [{ eventId: 'test_gift', context: {}, personId: mother.id }] };
    s = openNextEvent(s, reg);
    expect(s.pendingEvent?.text).toBe(`${mother.firstName} gave me $100.`);
    // hidden choice filtered out
    expect(s.pendingEvent?.choices.map((c) => c.id)).toEqual(['thank']);
    const before = s.people[mother.id]!.relationship;
    s = resolveChoice(s, 'thank', reg);
    expect(s.pendingEvent).toBeNull();
    expect(s.finances.cash).toBe(100);
    expect(s.people[mother.id]!.relationship).toBe(Math.min(100, before + 5));
    expect(s.firedEvents.test_gift).toBe(0);
    expect(s.log.some((l) => l.kind === 'event')).toBe(true);
  });

  it('scales money by country', () => {
    const s = createLife({ countryCode: 'IN' }, 1);
    expect(renderText('{{$1000}}', s)).toBe('₹150');
  });

  it('schedules at most a few events per year from the real registry', () => {
    let s = createLife({}, 7);
    s = { ...s, character: { ...s.character, age: 6 } };
    s = scheduleYearEvents(s, registry);
    expect(s.eventQueue.length).toBeLessThanOrEqual(3);
    for (const q of s.eventQueue) expect(registry.byId[q.eventId]).toBeDefined();
  });

  it('once/cooldown prevents repeats', () => {
    const onceReg = makeRegistry([
      { id: 'only_once', category: 'random', title: 'Once', text: 'Once.', minAge: 0, maxAge: 100, weight: 1, once: true, choices: [{ id: 'ok', label: 'Ok', effects: [] }] },
      { id: 'cool', category: 'random', title: 'Cool', text: 'Cool.', minAge: 0, maxAge: 100, weight: 1, cooldown: 5, choices: [{ id: 'ok', label: 'Ok', effects: [] }] },
    ]);
    let s = createLife({}, 3);
    s = { ...s, character: { ...s.character, age: 20 } };
    // Drain both events once.
    for (let i = 0; i < 2; i++) {
      s = { ...s, eventQueue: [{ eventId: i === 0 ? 'only_once' : 'cool', context: {} }] };
      s = openNextEvent(s, onceReg);
      s = resolveChoice(s, 'ok', onceReg);
    }
    expect(s.firedEvents.only_once).toBe(20);
    expect(s.firedEvents.cool).toBe(20);
    // Next year: neither is eligible (once fired; cooldown 5 not elapsed).
    s = { ...s, character: { ...s.character, age: 21 } };
    for (let i = 0; i < 10; i++) s = scheduleYearEvents(s, onceReg);
    expect(s.eventQueue).toEqual([]);
    // Six years later the cooldown event returns but the once event does not.
    s = { ...s, character: { ...s.character, age: 26 } };
    let sawCool = false;
    let sawOnce = false;
    for (let i = 0; i < 30; i++) {
      s = scheduleYearEvents({ ...s, eventQueue: [] }, onceReg);
      if (s.eventQueue.some((q) => q.eventId === 'cool')) sawCool = true;
      if (s.eventQueue.some((q) => q.eventId === 'only_once')) sawOnce = true;
    }
    expect(sawCool).toBe(true);
    expect(sawOnce).toBe(false);
  });

  it('drops a queued event whose bound person died or left before it opened', () => {
    const base = { category: 'random', minAge: 0, maxAge: 100, weight: 1 } as const;
    const reg = makeRegistry([
      { ...base, id: 'kill', title: 'Loss', text: '{{person}} is gone.', person: { kind: ['friend'] }, choices: [{ id: 'ok', label: 'Ok', effects: [{ personDies: true }] }] },
      { ...base, id: 'after', title: 'Rumour', text: '{{person}} pulled me aside.', person: { kind: ['friend'] }, choices: [{ id: 'ok', label: 'Ok', effects: [] }] },
      { ...base, id: 'dump', title: 'Fight', text: 'It is over with {{person}}.', person: { kind: ['lover'] }, choices: [{ id: 'ok', label: 'Ok', effects: [{ removePerson: true }] }] },
      { ...base, id: 'date', title: 'Date', text: 'Dinner with {{person}}.', person: { kind: ['lover'] }, choices: [{ id: 'ok', label: 'Ok', effects: [] }] },
    ]);
    let s = createLife({ countryCode: 'US' }, 44);
    const friend = makePerson(new Rng(1), { kind: 'friend', age: 20, countryCode: 'US', playerAge: 20 });
    const lover = makePerson(new Rng(2), { kind: 'lover', age: 20, countryCode: 'US', playerAge: 20 });
    lover.love = 60;
    s = {
      ...s,
      character: { ...s.character, age: 20 },
      people: { ...s.people, [friend.id]: friend, [lover.id]: lover },
      eventQueue: [
        { eventId: 'kill', context: {}, personId: friend.id },
        { eventId: 'after', context: {}, personId: friend.id },
        { eventId: 'dump', context: {}, personId: lover.id },
        { eventId: 'date', context: {}, personId: lover.id },
      ],
    };
    s = openNextEvent(s, reg);
    expect(s.pendingEvent?.eventId).toBe('kill');
    s = resolveChoice(s, 'ok', reg);
    expect(s.people[friend.id]?.alive).toBe(false);
    // 'after' is skipped because the friend just died; 'dump' opens next.
    expect(s.pendingEvent?.eventId).toBe('dump');
    s = resolveChoice(s, 'ok', reg);
    expect(s.people[lover.id]?.kind).toBe('ex');
    // 'date' is skipped because the lover is now an ex.
    expect(s.pendingEvent).toBeNull();
    expect(s.eventQueue).toEqual([]);
  });
});

describe('effects', () => {
  it('death ends the life and later effects are skipped', () => {
    let s = createLife({}, 11);
    s = applyEffects(s, new Rng(1), [{ death: 'a freak accident' }, { money: 1000 }]);
    expect(s.alive).toBe(false);
    expect(s.death?.cause).toBe('a freak accident');
    expect(s.finances.cash).toBe(0);
    expect(s.death?.obituary).toContain(s.character.firstName);
  });

  it('prison removes the job and marks a record', () => {
    let s = createLife({}, 12);
    s = { ...s, career: { ...s.career, job: { defId: 'x', title: 'Clerk', company: 'Acme', salary: 1, level: 0, performance: 50, yearsHeld: 2, yearsAtLevel: 2, category: 'office', partTime: false, askedThisYear: false, workedHarderThisYear: false } } };
    s = applyEffects(s, new Rng(2), [{ prison: 3 }]);
    expect(s.crime.inPrison).toBe(true);
    expect(s.crime.sentenceYearsLeft).toBe(3);
    expect(s.career.job).toBeNull();
    expect(s.career.history[0]?.title).toBe('Clerk');
  });

  it('random outcomes are deterministic per rng', () => {
    const s = createLife({}, 13);
    const eff = [{ random: [{ weight: 1, effects: [{ money: 1 }] }, { weight: 1, effects: [{ money: 2 }] }] }] as const;
    const a = applyEffects(s, new Rng(5), eff as never);
    const b = applyEffects(s, new Rng(5), eff as never);
    expect(a.finances.cash).toBe(b.finances.cash);
  });
});
