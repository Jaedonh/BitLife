import { ageUp } from '../ageUp';
import { applyAction } from '../actions';
import type { EventDef } from '../events/schema';
import { makeRegistry, openNextEvent, resolveChoice } from '../events/select';
import { Rng } from '../rng';
import { ADULT_CAUSES_FROM, ageNpcs, driftStats, npcDeathCause, onNpcDeath } from '../systems/aging';
import { createLife, makePerson } from '../systems/character';
import { activityAvailability } from '../systems/activities';
import { markDeath } from '../systems/death';
import { fosterRelation } from '../systems/scenarios';
import { parentsRef, personRef, renderText, scaleMoney } from '../events/text';
import { ACTIVITY_BY_ID } from '@/data/activities';
import { getCountry } from '@/data/countries';
import { NAMES } from '@/data/names';
import type { GameState, Person } from '../types';

const base = { category: 'random', title: 'Test', text: 'Something happened.', minAge: 0, maxAge: 120, weight: 1 } as const;
const bill: EventDef = { ...base, id: 'test_bill', choices: [{ id: 'pay', label: 'Pay', effects: [{ money: -300 }] }] };
const ownSavings: EventDef = { ...base, id: 'test_own_savings', choices: [{ id: 'pay', label: 'Pay for it myself', conditions: [{ money: { gte: 100 } }], effects: [{ money: -300, payer: 'self' }] }] };
const windfall: EventDef = { ...base, id: 'test_windfall', choices: [{ id: 'take', label: 'Take it', effects: [{ money: 200 }] }] };
const parentFalls: EventDef = {
  ...base,
  id: 'test_parent_falls',
  person: { kind: ['mother'] },
  choices: [{ id: 'fine', label: 'Take her word', effects: [{ stat: 'happiness', delta: -12 }, { log: 'She fell again. I should have fussed.', kind: 'bad' }, { personDies: true, cause: 'complications after a fall' }] }],
};
const diesTwice: EventDef = { ...parentFalls, id: 'test_dies_twice', choices: [{ id: 'ok', label: 'OK', effects: [{ stat: 'happiness', delta: -5 }, { log: 'She was gone.' }, { personDies: true }, { personDies: true }] }] };
const reg = makeRegistry([bill, ownSavings, windfall, parentFalls, diesTwice]);
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

  it("a choice that spends the child's own savings takes it from them, never more than they have, and not from the parents", () => {
    let s = lifeAt(12);
    s = { ...s, finances: { ...s.finances, cash: 1_000 } };
    const mother = kin(s, 'mother');
    let after = play(s, 'test_own_savings', 'pay');
    expect(after.finances.cash).toBe(1_000 - scaleMoney(s, 300));
    expect(after.people[mother.id]!.money).toBe(mother.money);
    s = { ...s, finances: { ...s.finances, cash: 150 } };
    after = play(s, 'test_own_savings', 'pay');
    expect(after.finances.cash).toBe(0);
    expect(after.finances.debt).toBe(0);
  });

  it("a minor's crime fine and asset upkeep are paid by their parents, not turned into debt", () => {
    let s = lifeAt(14);
    s = { ...s, assets: [{ id: 'b', defId: 'bike', kind: 'car', name: 'Used bicycle', value: 150, purchasePrice: 200, condition: 90, yearlyUpkeep: 10, mortgage: null, boughtAtAge: 9 }] };
    const aged = ageUp(s, noEvents);
    expect(aged.finances.debt).toBe(0);
    let caught: GameState | undefined;
    for (let seed = 1; seed < 400 && !caught; seed++) {
      const t = applyAction({ ...lifeAt(15), rng: { s: seed } }, { type: 'crime', id: 'shoplift' });
      if (t.log.some((l) => l.text.includes('had to pay'))) caught = t;
    }
    expect(caught).toBeDefined();
    expect(caught!.finances.debt).toBe(0);
    expect(caught!.finances.cash).toBe(0);
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
  it("pays the inheritance, with the event's own line and grief instead of the engine's", () => {
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
    expect(after.character.stats.happiness).toBe(48);
    const lines = after.log.slice(logStart).map((l) => l.text);
    expect(lines).toEqual(['She fell again. I should have fussed.', `I inherited $${share.toLocaleString('en-US')} from Mom's estate.`]);
  });

  it("takes an orphaned child in to relatives, and the child's share of the estate goes into their savings", () => {
    let s = lifeAt(10);
    const mother = kin(s, 'mother');
    s = patch(s, kin(s, 'father').id, { alive: false });
    s = patch(s, mother.id, { money: 50_000, relationship: 60 });
    const heirs = Object.values(s.people).filter((p) => p.kind === 'sibling' && p.alive).length + 1;
    const share = Math.round((50_000 * 0.8) / heirs);
    const after = play(s, 'test_parent_falls', 'fine', mother.id);
    // A minor inherits like a grown child: the share is kept in their own savings, not lost with the estate.
    expect(after.finances.cash).toBe(share);
    expect(after.log.at(-2)!.text).toBe(`I inherited $${share.toLocaleString('en-US')} from Mom's estate. It went into my savings.`);
    const carer = guardiansOf(after)[0]!;
    expect(carer.relative).toBe(true);
    const line = after.log.at(-1)!.text;
    expect(line).toMatch(new RegExp(`^With both my parents gone, I went to live with (Mom|Dad)'s (sister|brother), ${personRef(carer)}\\.$`));
  });

  it('handles a death once even if an event kills the same person twice', () => {
    let s = lifeAt(40);
    const mother = kin(s, 'mother');
    s = patch(s, mother.id, { money: 100_000, relationship: 60 });
    const after = play(s, 'test_dies_twice', 'ok', mother.id);
    expect(after.log.filter((l) => l.text.startsWith('I inherited')).length).toBe(1);
    expect(after.log.filter((l) => l.text.startsWith('My mother')).length).toBe(0);
  });
});

const GUARDIANS: readonly Person['kind'][] = ['mother', 'father', 'stepmother', 'stepfather'];
const guardiansOf = (s: GameState) => Object.values(s.people).filter((p) => p.alive && GUARDIANS.includes(p.kind));
const orphanLines = (s: GameState, from: number) => s.log.slice(from).map((l) => l.text).filter((t) => /^With .* gone,/.test(t));
/** Every line that says who took the child in, with or without the loss. */
const careLines = (s: GameState, from: number) => s.log.slice(from).map((l) => l.text).filter((t) => /went to live with|took me in|became my guardian|my caseworker/i.test(t));

describe('a child who loses the last parent at home', () => {
  it('goes to live with an aunt or uncle, a real guardian who pays, takes them to the doctor and is named in the journal', () => {
    let s = lifeAt(9);
    const mother = kin(s, 'mother');
    const father = kin(s, 'father');
    s = patch(s, father.id, { alive: false });
    const from = s.log.length;
    const dead = { ...s.people[mother.id]!, alive: false, deathAge: mother.age, deathCause: 'cancer' };
    const after = onNpcDeath({ ...s, people: { ...s.people, [mother.id]: dead } }, dead, new Rng(4));
    const carers = guardiansOf(after);
    expect(carers).toHaveLength(1);
    const carer = carers[0]!;
    expect(['stepmother', 'stepfather']).toContain(carer.kind);
    expect(carer.relative).toBe(true);
    expect(carer.foster).toBeUndefined();
    expect([mother.id, father.id]).toContain(carer.viaId);
    expect(carer.age).toBeGreaterThanOrEqual(after.character.age + 18);
    expect(carer.money).toBeGreaterThan(0);
    // Narrated as Aunt Rosa / Uncle Joe everywhere a parent would be.
    const ref = personRef(carer);
    expect(ref).toBe(`${carer.gender === 'male' ? 'Uncle' : 'Aunt'} ${carer.firstName}`);
    expect(fosterRelation(carer)).toBe(carer.gender === 'male' ? 'uncle' : 'aunt');
    expect(parentsRef(after)).toBe(ref);
    expect(renderText('{{parents}} paid.', after)).toBe(`${ref} paid.`);
    expect(renderText('{{person}} waved.', after, { person: carer })).toBe(`${ref} waved.`);
    const side = carer.viaId === mother.id ? 'Mom' : 'Dad';
    expect(orphanLines(after, from)).toEqual([`With both my parents gone, I went to live with ${side}'s ${carer.gender === 'male' ? 'brother' : 'sister'}, ${ref}.`]);
    // They pay for the doctor, and take the child there when they are ill.
    expect(activityAvailability(after, ACTIVITY_BY_ID.doctor!).available).toBe(true);
    const sick = { ...after, health: { ...after.health, illnesses: [{ defId: 'flu', name: 'the flu', severity: 2, chronic: false, yearsLeft: 3, treated: false }] } };
    const next = ageUp(sick, noEvents);
    const flu = next.health.illnesses.find((i) => i.defId === 'flu');
    expect(!flu || flu.treated).toBe(true);
    // An adult who loses a parent is nobody's ward.
    const grown = lifeAt(30);
    const mom = kin(grown, 'mother');
    const gone = { ...mom, alive: false };
    const adult = onNpcDeath({ ...patch(grown, kin(grown, 'father').id, { alive: false }), people: { ...patch(grown, kin(grown, 'father').id, { alive: false }).people, [mom.id]: gone } }, gone, new Rng(4));
    expect(guardiansOf(adult)).toHaveLength(0);
  });

  it('names the parent a child only ever had, never "both my parents"', () => {
    let s = lifeAt(7);
    const mother = kin(s, 'mother');
    s = { ...s, people: Object.fromEntries(Object.entries(s.people).filter(([id]) => id !== kin(s, 'father').id)) };
    const from = s.log.length;
    const dead = { ...s.people[mother.id]!, alive: false, deathAge: mother.age, deathCause: 'a car accident' };
    const after = onNpcDeath({ ...s, people: { ...s.people, [mother.id]: dead } }, dead, new Rng(2));
    const [line] = orphanLines(after, from);
    // The parent just named is "her", not "Mom" twice.
    expect(line).toMatch(/^With Mom gone, I went to live with her (sister|brother), (Aunt|Uncle) \S+\.$/);
    // Locked up when it happens: the relative becomes the guardian.
    const inside = onNpcDeath({ ...s, crime: { ...s.crime, inPrison: true, juvenile: true }, people: { ...s.people, [mother.id]: dead } }, dead, new Rng(2));
    expect(orphanLines(inside, from)[0]).toMatch(/^With Mom gone, her (sister|brother), (Aunt|Uncle) \S+, became my guardian\.$/);
    // A mother and a stepfather: the one who just died is named.
    let t = lifeAt(12);
    const step = { ...kin(t, 'father'), id: 'step_1', kind: 'stepfather' as const, firstName: 'Joe' };
    t = { ...t, people: { ...Object.fromEntries(Object.entries(t.people).filter(([id]) => id !== kin(t, 'father').id)), [step.id]: step } };
    t = patch(t, kin(t, 'mother').id, { alive: false });
    const deadStep = { ...step, alive: false };
    const after2 = onNpcDeath({ ...t, people: { ...t.people, [step.id]: deadStep } }, deadStep, new Rng(2));
    expect(orphanLines(after2, t.log.length)[0]).toMatch(/^With Joe gone, I went to live with Mom's (sister|brother), (Aunt|Uncle) \S+\.$/);
  });

  it('writes one line after every death of the year when both parents die the same year', () => {
    let s = lifeAt(14);
    for (const k of ['mother', 'father'] as const) s = patch(s, kin(s, k).id, { age: 98, health: 1 });
    let after: GameState | undefined;
    for (let seed = 1; seed < 400 && !after; seed++) {
      const t = ageNpcs({ ...s, log: [] }, new Rng(seed));
      if (!t.people[kin(s, 'mother').id]!.alive && !t.people[kin(s, 'father').id]!.alive) after = t;
    }
    expect(after).toBeDefined();
    const lines = after!.log.map((l) => l.text);
    const deaths = lines.filter((t) => /^(Mom|Dad) died/.test(t));
    expect(deaths).toHaveLength(2);
    expect(orphanLines(after!, 0)).toHaveLength(1);
    expect(lines.findIndex((t) => /^With /.test(t))).toBeGreaterThan(Math.max(...deaths.map((d) => lines.indexOf(d))));
    expect(orphanLines(after!, 0)[0]).toMatch(/^With both my parents gone, /);
    expect(guardiansOf(after!)).toHaveLength(1);
  });

  it('a minor left with no guardian at all (an heir, an older save) is taken in at the next birthday, once', () => {
    let s = lifeAt(10);
    for (const k of ['mother', 'father'] as const) s = patch(s, kin(s, k).id, { alive: false });
    const from = s.log.length;
    const next = ageUp(s, noEvents);
    expect(guardiansOf(next)).toHaveLength(1);
    // The loss was told when it happened (or in the heir's opening lines), so the line only says who took them in.
    expect(orphanLines(next, from)).toEqual([]);
    expect(careLines(next, from)).toHaveLength(1);
    expect(careLines(next, from)[0]).toMatch(/^I went to live with (Mom|Dad)'s (sister|brother), (Aunt|Uncle) \S+\.$/);
    const later = ageUp(ageUp(next, noEvents), noEvents);
    expect(careLines(later, from)).toHaveLength(1);
    // The heir of a single parent who died young.
    const parent = createLife({ countryCode: 'US', gender: 'female' }, 8);
    const kid = makePerson(new Rng(3), { kind: 'child', gender: 'male', age: 9, countryCode: 'US', lastName: parent.character.lastName, playerAge: 30 });
    const prev = markDeath({ ...parent, character: { ...parent.character, age: 39 }, year: parent.character.birthYear + 39, people: { ...parent.people, [kid.id]: kid } }, 'a car accident');
    const heir = ageUp(createLife({ heir: { childId: kid.id, previous: prev } }, 4), noEvents);
    expect(guardiansOf(heir)).toHaveLength(1);
    expect(careLines(heir, 0)).toHaveLength(1);
    expect(careLines(heir, 0)[0]).toMatch(/^I went to live with Mom's (sister|brother), (Aunt|Uncle) \S+\.$/);
  });

  it("the aunt or uncle is about the age of the parent who just died, and a generation younger than that side's grandparents", () => {
    let checked = 0;
    for (let seed = 1; seed <= 60; seed++) {
      let s = lifeAt(9);
      const mother = kin(s, 'mother');
      s = patch(s, kin(s, 'father').id, { alive: false });
      s = patch(s, mother.id, { age: 34 });
      // Mom's own mother, still alive at 56: her daughters are at most 38.
      const nana = { ...makePerson(new Rng(seed), { kind: 'grandparent', gender: 'female', age: 56, countryCode: 'US', playerAge: 9 }), viaId: mother.id };
      s = { ...s, people: { ...s.people, [nana.id]: nana } };
      const dead = { ...s.people[mother.id]!, alive: false, deathAge: 34, deathCause: 'cancer' };
      const after = onNpcDeath({ ...s, people: { ...s.people, [mother.id]: dead } }, dead, new Rng(seed));
      const carer = guardiansOf(after)[0]!;
      expect(carer.age).toBeGreaterThanOrEqual(9 + 18);
      if (carer.viaId !== mother.id) continue;
      checked++;
      expect(Math.abs(carer.age - 34)).toBeLessThanOrEqual(8);
      expect(nana.age - carer.age).toBeGreaterThanOrEqual(18);
    }
    expect(checked).toBeGreaterThan(10);
  });

  it("an immigrant child's aunt or uncle has a name from the old country, and pays in the new one's money", () => {
    const pool = (code: string) => NAMES[getCountry(code).namePool];
    for (let seed = 1; seed <= 20; seed++) {
      let s: GameState = { ...lifeAt(10), flags: { immigrant: 'MX' } };
      s = { ...s, character: { ...s.character, countryCode: 'JP', city: 'Osaka' } };
      for (const k of ['mother', 'father'] as const) s = patch(s, kin(s, k).id, { alive: false });
      const carer = guardiansOf(ageUp(s, noEvents))[0]!;
      expect(carer.relative).toBe(true);
      expect([...pool('MX').female, ...pool('MX').male]).toContain(carer.firstName);
      expect(carer.money).toBeGreaterThanOrEqual(Math.round(2_000 * getCountry('JP').salaryMultiplier));
    }
  });

  it('when the aunt or uncle dies too, another relative takes the child in', () => {
    let s = lifeAt(8);
    for (const k of ['mother', 'father'] as const) s = patch(s, kin(s, k).id, { alive: false });
    s = ageUp(s, noEvents);
    const aunt = guardiansOf(s)[0]!;
    const dead = { ...aunt, alive: false, deathAge: aunt.age, deathCause: 'cancer' };
    const from = s.log.length;
    const after = onNpcDeath({ ...s, people: { ...s.people, [aunt.id]: dead } }, dead, new Rng(6));
    expect(after.log.slice(from).map((l) => l.text)).toContain(`${personRef(aunt)} died of cancer at ${aunt.age}.`);
    expect(orphanLines(after, from)[0]).toMatch(new RegExp(`^With ${personRef(aunt)} gone, I went to live with `));
    expect(guardiansOf(after)).toHaveLength(1);
    expect(guardiansOf(after)[0]!.id).not.toBe(aunt.id);
  });
});

describe('what young people die of', () => {
  it('children and young adults never die of a heart attack, a stroke or kidney failure; older adults can', () => {
    const causes = (age: number) => new Set(Array.from({ length: 300 }, (_, i) => npcDeathCause(new Rng(i + 1), age)));
    for (const age of [0, 3, 10, 17, 18, 25, ADULT_CAUSES_FROM - 1]) {
      for (const c of causes(age)) expect(c).not.toMatch(/heart attack|stroke|kidney failure|natural causes/);
    }
    expect([...causes(70)].some((c) => /heart attack|stroke/.test(c))).toBe(true);
    expect(causes(50).has('natural causes')).toBe(false);
  });
});

describe("a child's doctor visits and outings", () => {
  it("are paid by the parents, so a baby can see a doctor with no money of their own", () => {
    const s = lifeAt(1);
    const before = Object.values(s.people).filter((p) => p.kind === 'mother' || p.kind === 'father').reduce((n, p) => n + p.money, 0);
    const after = applyAction(s, { type: 'activity', id: 'doctor' });
    expect(after.lastResult?.kind).toBe('good');
    expect(after.finances.cash).toBe(0);
    expect(after.finances.debt).toBe(0);
    const paid = before - Object.values(after.people).filter((p) => p.kind === 'mother' || p.kind === 'father').reduce((n, p) => n + p.money, 0);
    expect(paid).toBeGreaterThan(0);
    expect(after.lastResult?.moneyDelta).toBeUndefined();
  });

  it('fall back on the child\'s own cash when the parents cannot cover it, and are refused when neither can', () => {
    let s = lifeAt(10);
    for (const p of Object.values(s.people)) if (p.kind === 'mother' || p.kind === 'father') s = patch(s, p.id, { money: 0 });
    expect(applyAction(s, { type: 'activity', id: 'doctor' }).lastResult?.text).toBe("Can't afford it");
    s = { ...s, finances: { ...s.finances, cash: 100_000 } };
    const after = applyAction(s, { type: 'activity', id: 'doctor' });
    expect(after.finances.cash).toBeLessThan(100_000);
    expect(after.lastResult?.moneyDelta).toBe(after.finances.cash - 100_000);
  });
});

