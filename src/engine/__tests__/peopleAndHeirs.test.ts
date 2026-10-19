/**
 * People and heirs (final playtest): an heir's family carries over as it was, names stay distinct across a life,
 * small children befriend children, contact ends a silence, a death starts a grief window, event coworkers fit the
 * workplace and pets are played with as their species plays.
 */
import { applyEffects } from '../events/effects';
import { NAMES } from '@/data/names';
import { JOB_BY_ID } from '@/data/jobs';
import { getCountry } from '@/data/countries';
import { Rng } from '../rng';
import { createLife, freshFirstName, friendAgeRange, makePerson, namesInLife } from '../systems/character';
import { markDeath } from '../systems/death';
import { availableInteractions, interact, yearlyRelationships } from '../systems/relationships';
import { GRIEF_FLAG, GRIEF_YEARS, griefFactor, inGrief } from '../systems/romance';
import type { GameState, Job, Person } from '../types';

/** A finished life: Arthur (80, a retired architect) with his wife Stella and three children, Emma (45) the heir. */
function finishedLife(): { prev: GameState; stella: Person; emma: Person; liam: Person; zoe: Person } {
  let prev = createLife({ countryCode: 'US', firstName: 'Arthur', lastName: 'Penhaligon', gender: 'male' }, 31);
  const rng = new Rng(7);
  const stella: Person = { ...makePerson(rng, { kind: 'spouse', gender: 'female', age: 78, countryCode: 'US', lastName: 'Vance', playerAge: 25, money: 200_000 }), firstName: 'Stella', occupation: 'Carpenter', looks: 12, smarts: 11, health: 33, craziness: 91, love: 70 };
  const child = (firstName: string, gender: Person['gender'], age: number): Person => ({
    ...makePerson(rng, { kind: 'child', gender, age, countryCode: 'US', lastName: 'Penhaligon', playerAge: 80 - age, money: 1_500 }),
    firstName, otherParentId: stella.id, occupation: 'Baby', looks: 20 + age, smarts: 40 + age,
  });
  const emma = child('Emma', 'female', 45);
  const liam = child('Liam', 'male', 52);
  const zoe = child('Zoe', 'female', 34);
  const job: Job = { defId: 'architect', title: 'Senior Architect', company: 'Penhaligon & Vance', salary: 90_000, level: 2, yearsHeld: 30, performance: 70, partTime: false } as Job;
  prev = {
    ...prev,
    character: { ...prev.character, age: 80, stats: { ...prev.character.stats, looks: 41, smarts: 77, health: 9 } },
    year: prev.character.birthYear + 80,
    people: { ...prev.people, [stella.id]: stella, [emma.id]: emma, [liam.id]: liam, [zoe.id]: zoe },
    career: { ...prev.career, job: null, retired: true, history: [{ title: 'Junior Architect', company: 'Ember Studio', fromAge: 24, toAge: 30, salary: 40_000, reason: 'quit' }, { title: job.title, company: job.company, fromAge: 30, toAge: 65, salary: 90_000, reason: 'retired' }] },
  };
  return { prev: markDeath(prev, 'old age'), stella, emma, liam, zoe };
}

describe('continuing as an heir', () => {
  it('the dead player, the other parent and the siblings carry over as they were, known since birth', () => {
    const { prev, emma, liam, zoe } = finishedLife();
    const s = createLife({ heir: { childId: emma.id, previous: prev } }, 99);
    const people = Object.values(s.people);
    const dad = people.find((p) => p.kind === 'father')!;
    expect(dad).toMatchObject({ firstName: 'Arthur', lastName: 'Penhaligon', alive: false, deathAge: 80, age: 80, metAtAge: 0, occupation: 'Senior Architect', looks: 41, smarts: 77, health: 9, relationship: emma.relationship });
    const mom = people.find((p) => p.kind === 'mother')!;
    expect(mom).toMatchObject({ firstName: 'Stella', lastName: 'Vance', gender: 'female', age: 78, alive: true, metAtAge: 0, occupation: 'Carpenter', looks: 12, smarts: 11, health: 33, craziness: 91, money: 200_000 });
    expect(mom.love).toBeUndefined();
    for (const was of [liam, zoe]) {
      const sib = people.find((p) => p.kind === 'sibling' && p.firstName === was.firstName)!;
      expect(sib).toMatchObject({ age: was.age, gender: was.gender, occupation: was.occupation, looks: was.looks, smarts: was.smarts, health: was.health, craziness: was.craziness, money: was.money });
      expect(sib.otherParentId).toBeUndefined();
    }
    // Liam is older than Emma: there from the start. Zoe was born when Emma was 11.
    expect(people.find((p) => p.firstName === 'Liam')!.metAtAge).toBe(0);
    expect(people.find((p) => p.firstName === 'Zoe')!.metAtAge).toBe(11);
  });

  it("a married heir's spouse is known at least since their eldest child was born, not since the takeover", () => {
    const { prev, emma } = finishedLife();
    const wed: Person = { ...emma, growth: { spouse: { firstName: 'Noor', gender: 'female' }, kids: 2 } };
    const rng = new Rng(12);
    const grandkid = (firstName: string, age: number): Person => ({ ...makePerson(rng, { kind: 'grandchild', gender: 'male', age, countryCode: 'US', lastName: 'Penhaligon', playerAge: 80 - age }), firstName, viaId: emma.id });
    const ollie = grandkid('Ollie', 20);
    const theo = grandkid('Theo', 14);
    const people = { ...prev.people, [wed.id]: wed, [ollie.id]: ollie, [theo.id]: theo };
    const s = createLife({ heir: { childId: emma.id, previous: { ...prev, people } } }, 99);
    const spouse = Object.values(s.people).find((p) => p.kind === 'spouse')!;
    expect(spouse.firstName).toBe('Noor');
    expect(spouse.metAtAge).toBe(25);
    expect(Object.values(s.people).find((p) => p.firstName === 'Ollie')!.metAtAge).toBe(25);
    // Married without children: all the last life knew is that they were married by the takeover.
    const childless = createLife({ heir: { childId: emma.id, previous: { ...prev, people: { ...prev.people, [wed.id]: { ...wed, growth: { spouse: { firstName: 'Noor', gender: 'female' } } } } } } }, 99);
    expect(Object.values(childless.people).find((p) => p.kind === 'spouse')!.metAtAge).toBe(45);
  });

  it('the dead player keeps the job they died in when they still had one', () => {
    const { prev, emma } = finishedLife();
    const job = { defId: 'teacher', title: 'Head Teacher', company: 'Ember High', salary: 50_000, level: 2, yearsHeld: 20, performance: 60, partTime: false } as Job;
    const s = createLife({ heir: { childId: emma.id, previous: { ...prev, career: { ...prev.career, job, retired: false } } } }, 99);
    expect(Object.values(s.people).find((p) => p.kind === 'father')!.occupation).toBe('Head Teacher');
    const jobless = createLife({ heir: { childId: emma.id, previous: { ...prev, career: { ...prev.career, history: [] } } } }, 99);
    expect(Object.values(jobless.people).find((p) => p.kind === 'father')!.occupation).toBe('Unemployed');
  });

  it('a grown heir can apply for jobs at once and brings the working years they lived before taking over', () => {
    const { prev, emma } = finishedLife();
    const s = createLife({ heir: { childId: emma.id, previous: prev } }, 99);
    expect(s.career.listings.length).toBeGreaterThan(0);
    expect(s.career.listingsYear).toBe(s.year);
    const years = 45 - Math.max(18, getCountry('US').highSchoolEndAge);
    expect(s.counters.yearsEmployed).toBe(years);
    expect(s.career.totalYearsWorked).toBe(years);
    expect(s.career.job).toBeNull();
    // Dying without ever working again: judged on the years played, not as "Lazy" or "never held a steady job".
    const dead = markDeath(s, 'a stroke');
    expect(dead.death!.ribbonId).not.toBe('lazy');
    expect(dead.death!.obituary).not.toMatch(/never held a steady job/);
    // A young child of the dead player has no listings and no working past.
    const kid: Person = { ...emma, id: 'p_kid', age: 9 };
    const young = createLife({ heir: { childId: kid.id, previous: { ...prev, people: { ...prev.people, [kid.id]: kid } } } }, 99);
    expect(young.career.listings).toHaveLength(0);
    expect(young.counters.yearsEmployed).toBe(0);
  });
});

describe('first names in a life', () => {
  it('the helper avoids taken names in a single draw and falls back to the whole pool', () => {
    const pool = NAMES[getCountry('US').namePool].female;
    const taken = new Set(pool.slice(1));
    expect(freshFirstName(new Rng(3), 'female', 'US', taken)).toBe(pool[0]);
    // With nothing taken it draws exactly what an unchecked draw would.
    expect(freshFirstName(new Rng(3), 'female', 'US', new Set())).toBe(new Rng(3).pick(pool));
    expect(pool).toContain(freshFirstName(new Rng(3), 'female', 'US', new Set(pool)));
    const reserved = new Set<string>();
    const a = makePerson(new Rng(5), { kind: 'friend', gender: 'female', age: 30, countryCode: 'US', playerAge: 30, taken: reserved });
    expect(reserved.has(a.firstName)).toBe(true);
  });

  it('nobody at birth shares a first name with the player or each other (playtest seeds)', () => {
    const births: [Parameters<typeof createLife>[0], number][] = [
      [{ scenario: 'big_family', countryCode: 'IN' }, 1766807171],
      [{ countryCode: 'JP', scenario: 'standard' }, 1123],
      [{ countryCode: 'GB', scenario: 'wealthy' }, 1247],
      [{ countryCode: 'ES', scenario: 'single_parent' }, 4626],
      [{ countryCode: 'CA', scenario: 'immigrant' }, 472],
    ];
    for (let seed = 1; seed <= 400; seed++) births.push([{ scenario: (['standard', 'big_family', 'orphan', 'single_parent'] as const)[seed % 4] }, seed]);
    for (const [opts, seed] of births) {
      const s = createLife(opts, seed);
      const names = [s.character.firstName, ...Object.values(s.people).map((p) => p.firstName)];
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('new friends, partners, babies, event people and pets take names nobody in the life has, dead family included', () => {
    let s = createLife({ countryCode: 'US' }, 11);
    const all = NAMES.anglo;
    // Everyone in the pool but two names of each gender is already in the life, half of them dead.
    const crowd = [...all.male.slice(2), ...all.female.slice(2)].map((firstName, i) => ({
      ...makePerson(new Rng(i + 1), { kind: i % 3 ? 'sibling' : 'child', gender: all.male.includes(firstName) ? 'male' : 'female', age: 30, countryCode: 'US', playerAge: 30 }),
      firstName, alive: i % 2 === 0,
    }));
    s = { ...s, character: { ...s.character, age: 30, firstName: 'Zed', stats: { ...s.character.stats, looks: 100 } }, people: Object.fromEntries(crowd.map((p) => [p.id, p])) };
    const free = new Set([...all.male.slice(0, 2), ...all.female.slice(0, 2)]);
    // Friends and partners from the yearly roll.
    let made = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const next = yearlyRelationships(s, new Rng(seed));
      for (const p of Object.values(next.people).filter((x) => x.kind === 'friend' || x.kind === 'lover')) {
        made++;
        expect(free.has(p.firstName)).toBe(true);
      }
    }
    expect(made).toBeGreaterThan(5);
    // Event people (a friend, a pet, a baby).
    for (const kind of ['friend', 'pet', 'child', 'coworker'] as const) {
      for (let seed = 1; seed <= 10; seed++) {
        const next = applyEffects(s, new Rng(seed), [{ newPerson: { kind, ...(kind === 'pet' ? { species: 'dog' } : {}) } }]);
        const added = Object.values(next.people).find((p) => !s.people[p.id])!;
        expect(free.has(added.firstName)).toBe(true);
      }
    }
    // A baby the couple has.
    const spouse = { ...makePerson(new Rng(9_999), { kind: 'spouse', gender: 'female', age: 30, countryCode: 'US', playerAge: 25 }), firstName: 'Olivia', alive: true };
    for (let seed = 1; seed <= 30; seed++) {
      const withSpouse: GameState = { ...s, character: { ...s.character, gender: 'male', energy: 4 }, people: { ...s.people, [spouse.id]: spouse } };
      const next = interact(withSpouse, new Rng(seed), spouse.id, 'haveChild');
      const baby = Object.values(next.people).find((p) => p.kind === 'child' && !withSpouse.people[p.id]);
      if (baby) expect(free.has(baby.firstName)).toBe(true);
    }
  });

  it('namesInLife covers the player, the living and the dead, and the children\'s spouses', () => {
    const s = createLife({ countryCode: 'US', firstName: 'Zed' }, 3);
    const kid: Person = { ...makePerson(new Rng(1), { kind: 'child', age: 30, countryCode: 'US', playerAge: 20 }), firstName: 'Kit', growth: { spouse: { firstName: 'Bea', gender: 'female' } } };
    const ghost: Person = { ...makePerson(new Rng(2), { kind: 'sibling', age: 30, countryCode: 'US', playerAge: 0 }), firstName: 'Gus', alive: false };
    const names = namesInLife({ ...s, people: { ...s.people, [kid.id]: kid, [ghost.id]: ghost } });
    for (const n of ['Zed', 'Kit', 'Bea', 'Gus', ...Object.values(s.people).map((p) => p.firstName)]) expect(names.has(n)).toBe(true);
  });
});

describe('friends of small children', () => {
  it('are children within a year of the player, never toddlers; teens and adults keep their own bands', () => {
    expect(friendAgeRange(4)).toEqual([3, 5]);
    expect(friendAgeRange(8)).toEqual([7, 9]);
    expect(friendAgeRange(15)).toEqual([13, 17]);
    expect(friendAgeRange(40)).toEqual([37, 43]);
    for (let age = 4; age < 13; age++) {
      for (let seed = 1; seed <= 30; seed++) {
        const base = createLife({ countryCode: 'US' }, seed);
        const s: GameState = { ...base, people: {}, character: { ...base.character, age } };
        const yearly = Object.values(yearlyRelationships(s, new Rng(seed)).people).filter((p) => p.kind === 'friend');
        const carded = Object.values(applyEffects(s, new Rng(seed), [{ newPerson: { kind: 'friend' } }]).people);
        for (const f of [...yearly, ...carded]) {
          expect(Math.abs(f.age - age)).toBeLessThanOrEqual(1);
          expect(f.age).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  it('a card that asks for a grown-up friend for a child still gets one ("the man I saved")', () => {
    const base = createLife({ countryCode: 'US' }, 2);
    const s: GameState = { ...base, people: {}, character: { ...base.character, age: 12 } };
    const man = Object.values(applyEffects(s, new Rng(4), [{ newPerson: { kind: 'friend', gender: 'male', minAge: 35, maxAge: 75 } }]).people)[0]!;
    expect(man.age).toBeGreaterThanOrEqual(35);
  });
});

describe('contact this year', () => {
  function girlfriend(): { s: GameState; her: Person } {
    const base = createLife({ countryCode: 'US', gender: 'male' }, 8);
    const her: Person = { ...makePerson(new Rng(2), { kind: 'lover', gender: 'female', age: 27, countryCode: 'US', playerAge: 18 }), love: 70, relationship: 70 };
    return { s: { ...base, people: { [her.id]: her }, character: { ...base.character, age: 27, energy: 4 }, finances: { ...base.finances, cash: 50_000 } }, her };
  }

  it('a break-up, a proposal or a try for a baby counts as speaking this year', () => {
    for (const id of ['breakUp', 'propose', 'haveChild'] as const) {
      const { s, her } = girlfriend();
      const after = interact(s, new Rng(1), her.id, id);
      expect(after.people[her.id]!.memory.lastInteractionAge).toBe(27);
      expect(after.people[her.id]!.memory.yearsNeglected).toBe(0);
    }
  });

  it('an event card about someone counts as time with them', () => {
    const { s, her } = girlfriend();
    const after = applyEffects(s, new Rng(1), [{ stat: 'happiness', delta: 2 }], { personId: her.id, person: her });
    expect(after.people[her.id]!.memory.lastInteractionAge).toBe(27);
    // One the card killed stays as they were.
    const gone = applyEffects(s, new Rng(1), [{ log: 'x' }, { personDies: true }], { personId: her.id, person: her });
    expect(gone.people[her.id]!.memory.lastInteractionAge).toBe(18);
  });
});

describe('the grief window', () => {
  function widow(seed: number): GameState {
    const base = createLife({ countryCode: 'US', gender: 'female' }, seed);
    const husband: Person = { ...makePerson(new Rng(seed), { kind: 'spouse', gender: 'male', age: 45, countryCode: 'US', playerAge: 30 }), alive: false, deathAge: 45, deathCause: 'a sudden illness' };
    return { ...base, people: { [husband.id]: husband }, character: { ...base.character, age: 45, stats: { ...base.character.stats, looks: 100 } } };
  }
  const lovers = (s: GameState) => Object.values(s.people).filter((p) => p.kind === 'lover' && p.alive);

  it('no new partner turns up by chance in the year a partner dies, and half as often the year after', () => {
    let nextYear = 0;
    let usual = 0;
    let later = 0;
    for (let seed = 1; seed <= 200; seed++) {
      // ageNpcs has just marked him dead: this year's roll counts the death and meets nobody.
      const s = yearlyRelationships(widow(seed), new Rng(seed));
      expect(lovers(s)).toHaveLength(0);
      expect(s.flags[GRIEF_FLAG]).toBe(45);
      expect(Object.values(s.people).find((p) => p.kind === 'spouse')!.mourned).toBe(true);
      // The year after, the roll is halved (looks 100: a 25% chance instead of 50%).
      const second = yearlyRelationships({ ...s, character: { ...s.character, age: 46 } }, new Rng(seed * 31));
      expect(second.flags[GRIEF_FLAG]).toBe(45);
      if (lovers(second).length) nextYear++;
      const { [GRIEF_FLAG]: _gone, ...flags } = s.flags;
      if (lovers(yearlyRelationships({ ...s, flags, character: { ...s.character, age: 46 } }, new Rng(seed * 31))).length) usual++;
      // Then the window closes (the flag goes, so content can wait for it), and the death is counted once.
      const after = yearlyRelationships({ ...second, character: { ...second.character, age: 47 } }, new Rng(seed * 7));
      expect(after.flags[GRIEF_FLAG]).toBeUndefined();
      expect(yearlyRelationships({ ...after, character: { ...after.character, age: 50 } }, new Rng(1)).flags[GRIEF_FLAG]).toBeUndefined();
      if (lovers(after).length) later++;
    }
    expect(nextYear).toBeGreaterThan(20);
    expect(nextYear).toBeLessThan(usual * 0.7);
    expect(later).toBeGreaterThan(nextYear);
  });

  it('a partner killed by an event starts the window too, and no card brings a new partner that year', () => {
    const base = createLife({ countryCode: 'US', gender: 'female' }, 4);
    const him: Person = makePerson(new Rng(4), { kind: 'lover', gender: 'male', age: 40, countryCode: 'US', playerAge: 35 });
    const s: GameState = { ...base, people: { [him.id]: him }, character: { ...base.character, age: 40 } };
    const after = applyEffects(s, new Rng(1), [{ log: 'He was gone.' }, { stat: 'happiness', delta: -20 }, { personDies: true }], { personId: him.id, person: him });
    expect(inGrief(after)).toBe(true);
    expect(griefFactor(after)).toBe(0);
    expect(after.people[him.id]!.mourned).toBe(true);
    const date = [{ newPerson: { kind: 'lover' as const, log: 'I started seeing {{person}}.' } }];
    const refused = applyEffects(after, new Rng(2), date);
    expect(lovers(refused)).toHaveLength(0);
    // The date the player chose does not hang unanswered: the journal says it was too soon, naming who was lost.
    expect(refused.log.slice(after.log.length).map((l) => l.text)).toEqual([`In the end it was too soon after losing ${him.firstName}, and nothing came of it.`]);
    // Prison and the age bands refuse quietly, as before.
    const jailed: GameState = { ...after, crime: { ...after.crime, inPrison: true } };
    expect(applyEffects(jailed, new Rng(2), date).log).toHaveLength(jailed.log.length);
    // A year on, a card can bring someone; two years on the window is over.
    const nextYear: GameState = { ...after, character: { ...after.character, age: 41 } };
    expect(griefFactor(nextYear)).toBe(0.5);
    expect(lovers(applyEffects(nextYear, new Rng(2), date))).toHaveLength(1);
    const healed = yearlyRelationships({ ...after, character: { ...after.character, age: 40 + GRIEF_YEARS } }, new Rng(3));
    expect(inGrief(healed)).toBe(false);
    expect(griefFactor(healed)).toBe(1);
  });
});

describe('coworkers an event introduces', () => {
  it('hold a post on my own career ladder', () => {
    const base = createLife({ countryCode: 'US' }, 6);
    const job = { defId: 'waiter', title: 'Waiter', company: 'Vanguard Bistro', salary: 25_000, level: 0, yearsHeld: 1, performance: 50, partTime: false } as Job;
    const ladder = JOB_BY_ID.waiter!.ladder.map((r) => r.title);
    const s: GameState = { ...base, character: { ...base.character, age: 25 }, career: { ...base.career, job } };
    for (let seed = 1; seed <= 40; seed++) {
      const after = applyEffects(s, new Rng(seed), [{ newPerson: { kind: 'coworker' } }]);
      const cw = Object.values(after.people).find((p) => p.kind === 'coworker')!;
      expect(ladder).toContain(cw.occupation);
      expect(cw.workplace).toEqual({ jobId: 'waiter', company: 'Vanguard Bistro' });
    }
  });
});

describe('pets', () => {
  it('only dogs go for walks, and playing fits the species', () => {
    const base = createLife({ countryCode: 'US' }, 9);
    const s: GameState = { ...base, character: { ...base.character, age: 12, energy: 2 } };
    for (const species of ['dog', 'cat', 'hamster', 'rabbit', 'parrot', 'pigeon']) {
      const pet: Person = { ...makePerson(new Rng(1), { kind: 'pet', age: 2, countryCode: 'US', playerAge: 10, species }), firstName: 'Pip' };
      const t: GameState = { ...s, people: { ...s.people, [pet.id]: pet } };
      const ids = availableInteractions(t, pet).map((d) => d.id);
      expect(ids.includes('walk')).toBe(species === 'dog');
      expect(interact(t, new Rng(1), pet.id, 'walk').log.length).toBe(species === 'dog' ? t.log.length + 1 : t.log.length);
      const line = interact(t, new Rng(1), pet.id, 'playWith').lastResult!.text;
      expect(line).toMatch(/Pip/);
      if (species !== 'dog') expect(line).not.toMatch(/walk|ball/);
    }
  });
});
