import { getCountry } from '@/data/countries';
import { FARM_TOWNS, SCENARIOS } from '@/data/scenarios';
import { ageUp } from '../ageUp';
import { candidatesFor, evaluateCondition, livesAtHome } from '../events/conditions';
import { validateEvent, type EventDef } from '../events/schema';
import { makeRegistry } from '../events/select';
import { Rng } from '../rng';
import { checkInvariants } from '../simulate';
import { onNpcDeath } from '../systems/aging';
import { parentsRef } from '../events/text';
import { createLife, makePerson } from '../systems/character';
import { buildObituary, markDeath } from '../systems/death';
import { fosterRelation, FRIENDS_KEPT_ABROAD, MOVE_ABROAD_AGES, moveAbroad, startingScenario, yearlyScenario } from '../systems/scenarios';
import { activityAvailability } from '../systems/activities';
import { ACTIVITY_BY_ID } from '@/data/activities';
import { sendToPrison } from '../events/effects';
import type { GameState, Person, ScenarioId } from '../types';

const noEvents = makeRegistry([]);
const SEEDS = Array.from({ length: 200 }, (_, i) => (i + 1) * 7919);
const lives = (scenario: ScenarioId, extra: Parameters<typeof createLife>[0] = {}) => SEEDS.map((seed) => createLife({ ...extra, scenario }, seed));
const kinds = (s: GameState, ...k: Person['kind'][]) => Object.values(s.people).filter((p) => k.includes(p.kind));
const texts = (s: GameState) => s.log.map((l) => l.text);

/** Ages a life to `age` with no events (deaths and all), returning the state at that birthday. */
function ageTo(s: GameState, age: number): GameState {
  let g = s;
  while (g.alive && g.character.age < age) g = ageUp(g, noEvents);
  return g;
}

describe('starting scenarios: the choice itself', () => {
  it('defaults to Standard and records the scenario on the character and as a flag', () => {
    const s = createLife({}, 11);
    expect(s.character.scenario).toBe('standard');
    expect(s.flags['scenario:standard']).toBe(true);
    expect(evaluateCondition(s, { flag: 'scenario:standard' })).toBe(true);
    expect(evaluateCondition(s, { flag: 'scenario:orphan' })).toBe(false);
  });

  it('a Standard life is the same life whether or not the scenario is named', () => {
    for (const seed of SEEDS.slice(0, 40)) expect(createLife({ scenario: 'standard' }, seed)).toEqual(createLife({}, seed));
  });

  it('an unknown scenario id is Standard, and the old wealthy-family option is the Wealthy scenario', () => {
    expect(startingScenario({ scenario: 'pirate' as ScenarioId })).toBe('standard');
    expect(startingScenario({ wealthyFamily: true })).toBe('wealthy');
    expect(startingScenario({ scenario: 'orphan', wealthyFamily: true })).toBe('orphan');
    const old = createLife({ wealthyFamily: true }, 5);
    expect(old.character.scenario).toBe('wealthy');
    expect(old.flags.wealthyFamily).toBe(true);
  });

  it('every scenario is deterministic for a seed and passes the invariants for a few years', () => {
    for (const def of SCENARIOS) {
      const a = createLife({ scenario: def.id }, 77);
      expect(createLife({ scenario: def.id }, 77)).toEqual(a);
      expect(a.character.scenario).toBe(def.id);
      expect(a.flags[`scenario:${def.id}`]).toBe(true);
      checkInvariants(a);
      checkInvariants(ageTo(a, 3));
    }
  });

  it('an heir carries no scenario: the family story continues as it is', () => {
    let prev = createLife({ scenario: 'orphan', countryCode: 'US' }, 31);
    const kid = makePerson(new Rng(3), { kind: 'child', gender: 'male', age: 9, countryCode: 'US', lastName: prev.character.lastName, playerAge: 40 });
    prev = { ...prev, character: { ...prev.character, age: 40 }, year: prev.character.birthYear + 40, people: { ...prev.people, [kid.id]: kid } };
    prev = markDeath(prev, 'a car accident');
    const heir = createLife({ heir: { childId: kid.id, previous: prev }, scenario: 'prodigy' }, 5);
    expect(heir.character.scenario).toBeUndefined();
    expect(heir.flags).toEqual({});
  });
});

describe('orphan', () => {
  const all = lives('orphan');

  it('has no parents or grandparents, a foster parent aged 30-55 and the foster_care flag', () => {
    for (const s of all) {
      expect(kinds(s, 'mother', 'father', 'grandparent')).toHaveLength(0);
      const foster = kinds(s, 'stepmother', 'stepfather');
      expect(foster).toHaveLength(1);
      expect(foster[0]!.foster).toBe(true);
      expect(foster[0]!.age).toBeGreaterThanOrEqual(30);
      expect(foster[0]!.age).toBeLessThanOrEqual(55);
      expect(foster[0]!.money).toBeLessThanOrEqual(12_000);
      for (const p of [...foster, ...kinds(s, 'sibling')]) expect(p.lastName).not.toBe(s.character.lastName);
      expect(s.flags.foster_care).toBe(true);
      expect(s.flags.wealthyFamily).toBeUndefined();
      for (const sib of kinds(s, 'sibling')) expect(sib.foster).toBe(true);
      expect(kinds(s, 'sibling').length).toBeLessThanOrEqual(2);
      expect(texts(s).some((t) => t.startsWith('I never knew my birth parents'))).toBe(true);
      expect(texts(s).some((t) => t.startsWith('My parents are') || t.startsWith('My mother is'))).toBe(false);
    }
    expect(all.some((s) => kinds(s, 'sibling').length > 0)).toBe(true);
  });

  it('the foster family is named as such in the journal, the people list and an obituary', () => {
    const s = all[0]!;
    const foster = kinds(s, 'stepmother', 'stepfather')[0]!;
    const label = fosterRelation(foster)!;
    expect(label).toMatch(/^foster (mother|father)$/);
    expect(texts(s).some((t) => t.startsWith(`My ${label} is ${foster.firstName} ${foster.lastName} (${foster.age})`))).toBe(true);
    const dead = { ...foster, alive: false, deathAge: foster.age, deathCause: 'a stroke' };
    const after = onNpcDeath({ ...s, people: { ...s.people, [foster.id]: dead } }, dead, new Rng(1));
    expect(texts(after)).toContain(`My ${label} ${foster.firstName} ${foster.lastName} died of a stroke at ${foster.age}.`);
    const kid = ageTo(s, 6);
    if (kid.alive && kid.people[foster.id]?.alive) expect(buildObituary(kid, 'an accident', 0, 'Gone Too Soon')).toContain(`${label} ${foster.firstName}`);
  });

  it('the foster parent takes a sick child to the doctor, as parents do', () => {
    const s = ageTo(all[1]!, 7);
    const withFlu = (g: GameState): GameState => ({ ...g, health: { ...g.health, illnesses: [{ defId: 'flu', name: 'the flu', severity: 2, chronic: false, yearsLeft: 3, treated: false }] } });
    const flu = (g: GameState) => g.health.illnesses.find((i) => i.defId === 'flu');
    const cared = flu(ageUp(withFlu(s), noEvents));
    expect(!cared || cared.treated).toBe(true);
    // Without the foster parent nobody takes them.
    const alone = Object.fromEntries(Object.entries(s.people).filter(([, p]) => !p.foster || p.kind === 'sibling'));
    expect(flu(ageUp(withFlu({ ...s, people: alone }), noEvents))?.treated).toBe(false);
  });

  it('journal lines about who looks after the child name the foster parent, the one parent or both', () => {
    const orphan = all[2]!;
    const foster = kinds(orphan, 'stepmother', 'stepfather')[0]!;
    expect(parentsRef(orphan)).toBe(foster.firstName);
    const mom = createLife({ scenario: 'single_parent' }, SEEDS.find((seed) => kinds(createLife({ scenario: 'single_parent' }, seed), 'mother').length)!);
    expect(parentsRef(mom)).toBe('Mom');
    const both = SEEDS.map((seed) => createLife({}, seed)).find((x) => kinds(x, 'mother', 'father').length === 2)!;
    expect(parentsRef(both)).toBe('Mom and Dad');
    expect(parentsRef({ ...orphan, people: {} })).toBe('my family');
    // A sick foster child is cured with the foster parent's name on the line.
    const sick = { ...ageTo(orphan, 6), health: { ...orphan.health, illnesses: [{ defId: 'cold', name: 'the common cold', severity: 1, chronic: false, yearsLeft: 3, treated: false }] } };
    const lines = Array.from({ length: 8 }, (_, i) => ageUp({ ...sick, rng: { s: 1000 + i } }, noEvents)).flatMap((x) => texts(x));
    expect(lines.some((t) => t.startsWith(`${foster.firstName} took me to the doctor`))).toBe(true);
    expect(lines.some((t) => t.startsWith('My parents took me'))).toBe(false);
  });

  it('a foster child who loses the foster parent is placed with a new foster parent, who looks after them', () => {
    const orphan = ageTo(all[2]!, 9);
    const foster = kinds(orphan, 'stepmother', 'stepfather')[0]!;
    const dead = { ...foster, alive: false, deathAge: foster.age, deathCause: 'a heart attack' };
    const after = onNpcDeath({ ...orphan, people: { ...orphan.people, [foster.id]: dead } }, dead, new Rng(1));
    const carers = kinds(after, 'stepmother', 'stepfather').filter((p) => p.alive);
    expect(carers).toHaveLength(1);
    const carer = carers[0]!;
    expect(carer.foster).toBe(true);
    expect(carer.relative).toBeUndefined();
    expect(carer.age).toBeGreaterThanOrEqual(30);
    expect(carer.lastName).not.toBe(orphan.character.lastName);
    expect(carer.firstName).not.toBe(foster.firstName);
    expect(texts(after)).toContain(`With ${foster.firstName} gone, my caseworker placed me with a new ${fosterRelation(carer)}, ${carer.firstName} ${carer.lastName}.`);
    expect(texts(after).some((t) => t.includes('both my parents'))).toBe(false);
    // The new foster parent is who the journal names, and who pays for the doctor.
    expect(parentsRef(after)).toBe(carer.firstName);
    expect(activityAvailability(after, ACTIVITY_BY_ID.doctor!).available).toBe(true);
    const sick = { ...after, health: { ...after.health, illnesses: [{ defId: 'flu', name: 'the flu', severity: 2, chronic: false, yearsLeft: 3, treated: false }] } };
    const flu = ageUp(sick, noEvents).health.illnesses.find((i) => i.defId === 'flu');
    expect(!flu || flu.treated).toBe(true);
  });

  it('an older save whose foster child was left with nobody gets a foster parent at the next birthday, without retelling the loss', () => {
    const orphan = ageTo(all[2]!, 9);
    const foster = kinds(orphan, 'stepmother', 'stepfather')[0]!;
    const old = { ...orphan, people: { ...orphan.people, [foster.id]: { ...foster, alive: false, deathAge: foster.age, deathCause: 'cancer' } } };
    const next = ageUp(old, noEvents);
    const carer = kinds(next, 'stepmother', 'stepfather').find((p) => p.alive)!;
    expect(carer.foster).toBe(true);
    const placed = texts(next).filter((t) => t.includes('caseworker'));
    expect(placed).toEqual([`My caseworker placed me with a new ${fosterRelation(carer)}, ${carer.firstName} ${carer.lastName}.`]);
  });

  it('an orphan still in juvenile detention on their 18th birthday ages out of foster care on release day, once', () => {
    const teen = ageTo(all[3]!, 17);
    expect(teen.alive).toBe(true);
    const jailed = sendToPrison(teen, 1);
    expect(jailed.crime.juvenile).toBe(true);
    const out = ageUp(jailed, noEvents);
    expect(out.crime.inPrison).toBe(false);
    const at18 = out.log.filter((l) => l.age === 18).map((l) => l.text);
    const release = at18.findIndex((t) => t.startsWith('I walked out of juvenile detention'));
    const agedOut = at18.findIndex((t) => t.startsWith('I aged out of foster care'));
    expect(release).toBeGreaterThanOrEqual(0);
    expect(agedOut).toBeGreaterThan(release);
    const later = ageTo(out, 21);
    expect(later.log.filter((l) => l.text.startsWith('I aged out of foster care'))).toHaveLength(1);
    // Someone who is not an orphan does not age out of anything on release.
    const standard = sendToPrison(ageTo(createLife({ countryCode: 'US' }, 3), 17), 1);
    expect(texts(ageUp(standard, noEvents)).some((t) => t.startsWith('I aged out'))).toBe(false);
  });

  it('a former foster child has a place of their own from 18', () => {
    const orphan = all[2]!;
    const adult = { ...orphan, character: { ...orphan.character, age: 19 } };
    expect(livesAtHome(adult)).toBe(false);
    expect(livesAtHome({ ...orphan, character: { ...orphan.character, age: 12 } })).toBe(true);
  });

  it('ages out of foster care at 18', () => {
    const grown = all.slice(0, 30).map((s) => ageTo(s, 18)).filter((s) => s.alive && s.character.age === 18 && !s.crime.inPrison);
    expect(grown.length).toBeGreaterThan(20);
    for (const s of grown) expect(s.log.filter((l) => l.age === 18).some((l) => l.text.startsWith('I aged out of foster care'))).toBe(true);
    const line = grown.flatMap((s) => texts(s)).filter((t) => t.startsWith('I aged out'));
    expect(line.every((t) => t.length <= 100)).toBe(true);
  });
});

describe('big family', () => {
  const all = lives('big_family');

  it('has three to five older siblings with distinct names, a mother old enough for them, and tight money', () => {
    for (const s of all) {
      const sibs = kinds(s, 'sibling');
      expect(sibs.length).toBeGreaterThanOrEqual(3);
      expect(sibs.length).toBeLessThanOrEqual(5);
      expect(new Set(sibs.map((x) => x.firstName)).size).toBe(sibs.length);
      expect(sibs.some((x) => x.firstName === s.character.firstName)).toBe(false);
      const mother = kinds(s, 'mother')[0];
      if (mother) for (const sib of sibs) expect(sib.age).toBeLessThanOrEqual(mother.age - 17);
      expect(s.flags.poorFamily).toBe(true);
      expect(s.flags.wealthyFamily).toBeUndefined();
      expect(texts(s).some((t) => t.includes('older siblings'))).toBe(true);
    }
    expect(new Set(all.map((s) => kinds(s, 'sibling').length))).toEqual(new Set([3, 4, 5]));
  });
});

describe('single parent', () => {
  const all = lives('single_parent');

  it('has exactly one parent, usually a mother, and grandparents only on that side', () => {
    let dads = 0;
    for (const s of all) {
      const parents = kinds(s, 'mother', 'father');
      expect(parents).toHaveLength(1);
      const parent = parents[0]!;
      if (parent.kind === 'father') dads++;
      for (const gp of kinds(s, 'grandparent')) expect(gp.viaId).toBe(parent.id);
      const pronoun = parent.kind === 'mother' ? 'She' : 'He';
      expect(texts(s).some((t) => t.endsWith(`${pronoun}'s raising me on ${parent.kind === 'mother' ? 'her' : 'his'} own.`))).toBe(true);
    }
    expect(dads).toBeGreaterThan(20);
    expect(dads).toBeLessThan(100);
  });
});

describe('immigrant', () => {
  const all = lives('immigrant');

  it('plans a move abroad at 6-14 to another country, mostly to one that pays better', () => {
    let richer = 0;
    for (const s of all) {
      const plan = s.character.moveAbroad!;
      expect(plan.age).toBeGreaterThanOrEqual(MOVE_ABROAD_AGES.min);
      expect(plan.age).toBeLessThanOrEqual(MOVE_ABROAD_AGES.max);
      expect(plan.countryCode).not.toBe(s.character.countryCode);
      if (getCountry(plan.countryCode).salaryMultiplier > getCountry(s.character.countryCode).salaryMultiplier) richer++;
      expect(s.flags.immigrant).toBeUndefined();
    }
    expect(richer / all.length).toBeGreaterThan(0.5);
  });

  it('moves at the planned age: new country and city, the immigrant flag, a milestone line, classmates left behind', () => {
    const s = createLife({ scenario: 'immigrant', countryCode: 'MX' }, 4242);
    const plan = s.character.moveAbroad!;
    const before = ageTo(s, plan.age - 1);
    expect(before.character.countryCode).toBe('MX');
    const mate = makePerson(new Rng(9), { kind: 'classmate', age: plan.age - 1, countryCode: 'MX', playerAge: plan.age - 1 });
    const moved = ageUp({ ...before, people: { ...before.people, [mate.id]: mate } }, noEvents);
    const to = getCountry(plan.countryCode);
    expect(moved.character.countryCode).toBe(plan.countryCode);
    expect(to.cities).toContain(moved.character.city);
    expect(moved.flags.immigrant).toBe('MX');
    expect(evaluateCondition(moved, { flag: 'immigrant', eq: 'MX' })).toBe(true);
    expect(moved.people[mate.id]).toBeUndefined();
    const line = moved.log.find((l) => l.age === plan.age && l.kind === 'milestone' && l.text.startsWith('My family moved from Mexico to'));
    expect(line?.text).toBe(`My family moved from Mexico to ${to.name.startsWith('United') ? 'the ' : ''}${to.name}. We started over in ${moved.character.city}.`);
    // ...and only once.
    const later = ageTo(moved, plan.age + 3);
    expect(later.log.filter((l) => l.text.startsWith('My family moved from')).length).toBe(1);
    expect(later.character.countryCode).toBe(plan.countryCode);
  });

  it('friends, rivals and grandparents stay behind as people far away: only long-distance cards bind them', () => {
    const s = createLife({ scenario: 'immigrant', countryCode: 'MX' }, 4242);
    const plan = s.character.moveAbroad!;
    const before = ageTo(s, plan.age - 1);
    const rng = new Rng(21);
    const friend = { ...makePerson(rng, { kind: 'friend', age: plan.age - 1, countryCode: 'MX', playerAge: 4 }), firstName: 'Santiago', relationship: 99 };
    const best = { ...makePerson(rng, { kind: 'bestFriend', age: plan.age - 1, countryCode: 'MX', playerAge: 5 }), firstName: 'Diego' };
    const rival = makePerson(rng, { kind: 'enemy', age: plan.age - 1, countryCode: 'MX', playerAge: 5 });
    const gone = { ...makePerson(rng, { kind: 'grandparent', gender: 'male', age: 80, countryCode: 'MX', playerAge: 0 }), alive: false };
    const moved = ageUp({ ...before, people: { ...before.people, [friend.id]: friend, [best.id]: best, [rival.id]: rival, [gone.id]: gone } }, noEvents);
    expect(moved.character.countryCode).toBe(plan.countryCode);
    const grands = kinds(moved, 'grandparent').filter((p) => p.alive);
    for (const p of [moved.people[friend.id]!, moved.people[best.id]!, moved.people[rival.id]!, ...grands]) expect(p.farAway).toBe(true);
    for (const p of kinds(moved, 'mother', 'father', 'sibling')) expect(p.farAway).toBeUndefined();
    // A goodbye line names the best friend (and the grandparents staying behind, if any).
    const bye = moved.log.find((l) => l.age === plan.age && /Diego/.test(l.text))?.text;
    expect(bye).toMatch(/My best friend Diego|my best friend Diego/);
    // Ordinary cards never bind them; a card written for distance binds only them; the dead are remembered anyway.
    for (const kind of ['friend', 'bestFriend', 'enemy', 'grandparent'] as const) expect(candidatesFor(moved, { kind: [kind] })).toEqual([]);
    const far = candidatesFor(moved, { kind: ['friend', 'bestFriend'], farAway: true });
    expect(far.map((p) => p.id)).toEqual(expect.arrayContaining([friend.id, best.id]));
    expect(far.every((p) => p.farAway)).toBe(true);
    expect(candidatesFor(moved, { kind: ['grandparent'], alive: false }).map((p) => p.id)).toContain(gone.id);
    // A friend made in the new country is an ordinary friend.
    const local = makePerson(rng, { kind: 'friend', age: plan.age, countryCode: plan.countryCode, playerAge: plan.age });
    const later = { ...moved, people: { ...moved.people, [local.id]: local } };
    expect(candidatesFor(later, { kind: ['friend'] }).map((p) => p.id)).toEqual([local.id]);
    expect(candidatesFor(later, { kind: ['friend'], farAway: false }).map((p) => p.id)).toEqual([local.id]);
    // 'any' is for a card that works at any distance (a message, a group chat): old friends and new.
    expect(candidatesFor(later, { kind: ['friend', 'bestFriend'], farAway: 'any' }).map((p) => p.id)).toEqual(expect.arrayContaining([friend.id, best.id, local.id]));
    // hasPerson and noPerson count only people nearby, so a card that puts a grandparent in the room does not open.
    expect(evaluateCondition(moved, { hasPerson: ['grandparent'] })).toBe(false);
    expect(evaluateCondition(moved, { noPerson: ['friend', 'bestFriend'] })).toBe(true);
    expect(evaluateCondition(later, { hasPerson: ['friend', 'bestFriend'] })).toBe(true);
  });

  it('only the two closest friends keep in touch, so the new country has room for new friends', () => {
    const s = createLife({ scenario: 'immigrant', countryCode: 'IN' }, 515);
    const plan = s.character.moveAbroad!;
    const before = ageTo(s, plan.age - 1);
    const rng = new Rng(8);
    const old = Object.values(before.people).filter((p) => p.kind === 'friend' || p.kind === 'bestFriend');
    const mk = (kind: 'friend' | 'bestFriend', relationship: number) => ({ ...makePerson(rng, { kind, age: plan.age - 1, countryCode: 'IN', playerAge: 5 }), relationship });
    const best = mk('bestFriend', 40);
    const close = mk('friend', 100);
    const rest = [mk('friend', 60), mk('friend', 55), mk('friend', 50)];
    const dead = { ...mk('friend', 80), alive: false };
    let people: GameState['people'] = { ...before.people };
    for (const p of [best, close, ...rest, dead]) people[p.id] = p;
    const moved = ageUp({ ...before, people }, noEvents);
    expect(moved.character.countryCode).toBe(plan.countryCode);
    // The best friend first, however close the others are, then the closest friend; the dead stay remembered.
    expect(moved.people[best.id]?.farAway).toBe(true);
    expect(moved.people[close.id]?.farAway).toBe(true);
    for (const p of [...rest, ...old]) expect(moved.people[p.id]).toBeUndefined();
    expect(moved.people[dead.id]).toBeDefined();
    const living = Object.values(moved.people).filter((p) => p.alive && (p.kind === 'friend' || p.kind === 'bestFriend'));
    expect(living.filter((p) => p.farAway)).toHaveLength(FRIENDS_KEPT_ABROAD);
    // With room under the four-friend cap, new friends turn up in the new country within a few years.
    people = moved.people;
    let later = moved;
    for (let i = 0; i < 4; i++) later = ageUp(later, noEvents);
    const fresh = Object.values(later.people).filter((p) => p.alive && p.kind === 'friend' && !p.farAway && !people[p.id]);
    expect(fresh.length).toBeGreaterThan(0);
    expect(fresh.every((p) => p.metAtAge >= plan.age)).toBe(true);
  });

  it('the validator only accepts farAway on people who can stay behind', () => {
    const card = (person: EventDef['person']): EventDef => ({ id: 'tr_far_test', category: 'random', title: 'A letter', text: 'A letter came from {{person}}.', minAge: 8, maxAge: 90, weight: 1, person, choices: [{ id: 'read', label: 'Read it', effects: [{ log: 'I read it twice.' }] }, { id: 'keep', label: 'Keep it for later', effects: [{ log: 'I kept it for later.' }] }] });
    expect(validateEvent(card({ kind: ['friend', 'bestFriend'], farAway: true }), new Set(['tr_far_test']))).toEqual([]);
    expect(validateEvent(card({ kind: ['grandparent'], farAway: 'any' }), new Set(['tr_far_test']))).toEqual([]);
    expect(validateEvent(card({ kind: ['sibling'], farAway: true }), new Set(['tr_far_test'])).join(' ')).toMatch(/farAway/);
  });

  it('does not move a child with no parent left or one in detention', () => {
    const s = createLife({ scenario: 'immigrant', countryCode: 'IN' }, 99);
    const plan = s.character.moveAbroad!;
    const at = { ...s, character: { ...s.character, age: plan.age } };
    const orphaned = { ...at, people: Object.fromEntries(Object.entries(at.people).map(([id, p]) => [id, p.kind === 'mother' || p.kind === 'father' ? { ...p, alive: false } : p])) };
    expect(moveAbroad(orphaned, new Rng(1), plan.countryCode)).toBe(orphaned);
    // Nor one an aunt or uncle took in: the move was the parents' plan.
    const takenIn = ageUp({ ...orphaned, character: { ...orphaned.character, age: plan.age - 2 }, year: orphaned.year - 2 }, noEvents);
    expect(Object.values(takenIn.people).some((p) => p.alive && p.relative)).toBe(true);
    const moveYear = ageUp(takenIn, noEvents);
    expect(moveYear.character.age).toBe(plan.age);
    expect(moveYear.character.countryCode).toBe('IN');
    expect(moveYear.flags.immigrant).toBeUndefined();
    const jailed = { ...at, crime: { ...at.crime, inPrison: true, sentenceYearsLeft: 1 } };
    expect(yearlyScenario(jailed, new Rng(1)).character.countryCode).toBe('IN');
  });
});

describe('prodigy', () => {
  it('starts with Smarts 85-100, the quick learner trait and the prodigy flag, even with low custom stats', () => {
    for (const s of [...lives('prodigy'), ...lives('prodigy', { customStats: { smarts: 20 } }).slice(0, 40)]) {
      expect(s.character.stats.smarts).toBeGreaterThanOrEqual(85);
      expect(s.character.stats.smarts).toBeLessThanOrEqual(100);
      expect(s.character.potential.smarts).toBeGreaterThanOrEqual(s.character.stats.smarts);
      expect(s.character.traits).toContain('quick_learner');
      // At most two rolled traits; a wealthy birth adds Lucky, as in any life.
      expect(s.character.traits.length).toBeLessThanOrEqual(s.flags.wealthyFamily ? 3 : 2);
      expect(s.flags.prodigy).toBe(true);
    }
  });
});

describe('farm kid', () => {
  it('grows up in a farm town of the birth country with a farmer in the family and the farm flag', () => {
    for (const s of lives('farm_kid')) {
      expect(FARM_TOWNS[s.character.countryCode]).toContain(s.character.city);
      expect(kinds(s, 'mother', 'father').some((p) => p.occupation === 'Farmer')).toBe(true);
      expect(s.flags.farm).toBe(true);
      expect(texts(s).some((t) => t.startsWith('My family runs a farm'))).toBe(true);
    }
  });
});

describe('wealthy', () => {
  it('is the premium wealthy family: rich parents, the lucky trait and the flag', () => {
    for (const s of lives('wealthy').slice(0, 50)) {
      expect(s.flags.wealthyFamily).toBe(true);
      expect(s.character.traits).toContain('lucky');
      expect(kinds(s, 'mother')[0]!.money).toBeGreaterThanOrEqual(400_000 * getCountry(s.character.countryCode).salaryMultiplier);
    }
  });
});
