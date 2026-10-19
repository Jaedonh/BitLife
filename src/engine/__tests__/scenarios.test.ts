import { getCountry } from '@/data/countries';
import { FARM_TOWNS, SCENARIOS } from '@/data/scenarios';
import { ageUp } from '../ageUp';
import { evaluateCondition, livesAtHome } from '../events/conditions';
import { makeRegistry } from '../events/select';
import { Rng } from '../rng';
import { checkInvariants } from '../simulate';
import { onNpcDeath } from '../systems/aging';
import { parentsRef } from '../events/text';
import { createLife, makePerson } from '../systems/character';
import { buildObituary, markDeath } from '../systems/death';
import { fosterRelation, MOVE_ABROAD_AGES, moveAbroad, startingScenario, yearlyScenario } from '../systems/scenarios';
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

  it('a foster child who loses the foster parent is placed with another family', () => {
    const orphan = ageTo(all[2]!, 9);
    const foster = kinds(orphan, 'stepmother', 'stepfather')[0]!;
    const dead = { ...foster, alive: false, deathAge: foster.age, deathCause: 'a heart attack' };
    const after = onNpcDeath({ ...orphan, people: { ...orphan.people, [foster.id]: dead } }, dead, new Rng(1));
    expect(texts(after)).toContain(`With ${foster.firstName} gone, my caseworker placed me with another foster family.`);
    expect(texts(after).some((t) => t.includes('both my parents'))).toBe(false);
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

  it('does not move a child with no parent left or one in detention', () => {
    const s = createLife({ scenario: 'immigrant', countryCode: 'IN' }, 99);
    const plan = s.character.moveAbroad!;
    const at = { ...s, character: { ...s.character, age: plan.age } };
    const orphaned = { ...at, people: Object.fromEntries(Object.entries(at.people).map(([id, p]) => [id, p.kind === 'mother' || p.kind === 'father' ? { ...p, alive: false } : p])) };
    expect(moveAbroad(orphaned, new Rng(1), plan.countryCode)).toBe(orphaned);
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
