import { ageUp } from '../ageUp';
import { scaleMoney } from '../events/text';
import type { EventDef } from '../events/schema';
import { makeRegistry, openNextEvent, resolveChoice } from '../events/select';
import { Rng } from '../rng';
import { driftStats } from '../systems/aging';
import { createLife } from '../systems/character';
import type { GameState, Person } from '../types';

const base = { category: 'random', title: 'Test', text: 'Something happened.', minAge: 0, maxAge: 120, weight: 1 } as const;
const bill: EventDef = { ...base, id: 'test_bill', choices: [{ id: 'pay', label: 'Pay', effects: [{ money: -300 }] }] };
const windfall: EventDef = { ...base, id: 'test_windfall', choices: [{ id: 'take', label: 'Take it', effects: [{ money: 200 }] }] };
const parentFalls: EventDef = {
  ...base,
  id: 'test_parent_falls',
  person: { kind: ['mother'] },
  choices: [{ id: 'fine', label: 'Take her word', effects: [{ personDies: true, cause: 'complications after a fall' }, { log: 'She fell again. I should have fussed.', kind: 'bad' }] }],
};
const diesTwice: EventDef = { ...parentFalls, id: 'test_dies_twice', choices: [{ id: 'ok', label: 'OK', effects: [{ personDies: true }, { personDies: true }] }] };
const reg = makeRegistry([bill, windfall, parentFalls, diesTwice]);
const noEvents = makeRegistry([]);

/** Seed 3 starts with a mother, a father and one sibling. */
function lifeAt(age: number): GameState {
  const s = createLife({ countryCode: 'US' }, 3);
  const people = Object.fromEntries(Object.entries(s.people).filter(([, p]) => p.kind !== 'pet'));
  return { ...s, people, year: s.character.birthYear + age, character: { ...s.character, age }, eventQueue: [], finances: { ...s.finances, cash: 0, debt: 0 } };
}

function kin(s: GameState, kind: Person['kind']): Person {
  const p = Object.values(s.people).find((x) => x.kind === kind);
  if (!p) throw new Error(`no ${kind}`);
  return p;
}

function patch(s: GameState, id: string, change: Partial<Person>): GameState {
  return { ...s, people: { ...s.people, [id]: { ...s.people[id]!, ...change } } };
}

function play(s: GameState, eventId: string, choiceId: string, personId?: string): GameState {
  const opened = openNextEvent({ ...s, eventQueue: [{ eventId, context: {}, personId }] }, reg);
  expect(opened.pendingEvent?.eventId).toBe(eventId);
  return resolveChoice(opened, choiceId, reg);
}

describe('minors never pay for events or carry debt costs', () => {
  it("a child's event cost is paid by a living parent and never becomes debt", () => {
    const s = lifeAt(8);
    const cost = scaleMoney(s, 300);
    const mother = kin(s, 'mother');
    const father = kin(s, 'father');
    const payer = mother.money >= father.money ? mother : father;
    const after = play(s, 'test_bill', 'pay');
    expect(after.finances.debt).toBe(0);
    expect(after.finances.cash).toBe(0);
    expect(after.people[payer.id]!.money).toBe(payer.money - cost);
  });

  it('waives the cost when no parent can cover it, and keeps a minor\'s own cash untouched', () => {
    let s = lifeAt(12);
    s = patch(s, kin(s, 'mother').id, { money: 100 });
    s = patch(s, kin(s, 'father').id, { alive: false });
    s = { ...s, finances: { ...s.finances, cash: 1_000 } };
    const after = play(s, 'test_bill', 'pay');
    expect(after.finances.debt).toBe(0);
    expect(after.finances.cash).toBe(1_000);
    expect(after.people[kin(s, 'mother').id]!.money).toBe(0);
  });

  it('a child still keeps money an event gives them, and adults still pay (a shortfall becomes debt)', () => {
    expect(play(lifeAt(10), 'test_windfall', 'take').finances.cash).toBe(scaleMoney(lifeAt(10), 200));
    const adult = play(lifeAt(30), 'test_bill', 'pay');
    expect(adult.finances.debt).toBe(scaleMoney(adult, 300));
  });

  it("a minor's debt is not charged interest or repayments and costs no happiness", () => {
    const s = { ...lifeAt(10), finances: { ...lifeAt(10).finances, debt: 500 } };
    expect(ageUp(s, noEvents).finances.debt).toBe(500);
    const clear = { ...s, finances: { ...s.finances, debt: 0 } };
    expect(driftStats(s, new Rng(9)).character.stats.happiness).toBe(driftStats(clear, new Rng(9)).character.stats.happiness);
    // From 18 the usual rules apply.
    const adult = { ...lifeAt(30), finances: { ...lifeAt(30).finances, debt: 500 } };
    const adultClear = { ...adult, finances: { ...adult.finances, debt: 0 } };
    expect(driftStats(adult, new Rng(9)).character.stats.happiness).toBe(driftStats(adultClear, new Rng(9)).character.stats.happiness - 1);
  });
});

describe('an event death runs the same handling as a natural death', () => {
  it('logs the death, applies grief and pays the inheritance', () => {
    let s = lifeAt(40);
    const mother = kin(s, 'mother');
    s = patch(s, mother.id, { age: 75, money: 200_000, relationship: 60 });
    s = { ...s, character: { ...s.character, stats: { ...s.character.stats, happiness: 60 } } };
    const heirs = Object.values(s.people).filter((p) => p.kind === 'sibling' && p.alive).length + 1;
    const share = Math.round((200_000 * 0.8) / heirs);
    const logStart = s.log.length + 1;
    const after = play(s, 'test_parent_falls', 'fine', mother.id);
    const dead = after.people[mother.id]!;
    expect(dead.alive).toBe(false);
    expect(dead.deathAge).toBe(75);
    expect(dead.deathCause).toBe('complications after a fall');
    expect(after.finances.cash).toBe(share);
    expect(after.character.stats.happiness).toBe(45);
    const lines = after.log.slice(logStart).map((l) => l.text);
    expect(lines).toEqual([
      `My mother ${mother.firstName} ${mother.lastName} died of complications after a fall at 75.`,
      `I inherited $${share.toLocaleString('en-US')} from ${mother.firstName}'s estate.`,
      'She fell again. I should have fussed.',
    ]);
  });

  it('takes an orphaned child in to relatives and leaves a minor no inheritance', () => {
    let s = lifeAt(10);
    const mother = kin(s, 'mother');
    s = patch(s, kin(s, 'father').id, { alive: false });
    s = patch(s, mother.id, { money: 50_000 });
    const after = play(s, 'test_parent_falls', 'fine', mother.id);
    expect(after.finances.cash).toBe(0);
    expect(after.log.some((l) => l.text === 'With both my parents gone, I was taken in by relatives.')).toBe(true);
  });

  it('handles a death once even if an event kills the same person twice', () => {
    let s = lifeAt(40);
    const mother = kin(s, 'mother');
    s = patch(s, mother.id, { money: 100_000, relationship: 60 });
    const after = play(s, 'test_dies_twice', 'ok', mother.id);
    expect(after.log.filter((l) => l.text.startsWith('I inherited')).length).toBe(1);
    expect(after.log.filter((l) => l.text.startsWith('My mother')).length).toBe(1);
  });
});
