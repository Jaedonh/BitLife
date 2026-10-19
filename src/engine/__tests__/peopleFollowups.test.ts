/**
 * Follow-ups across the family, systems and people fixes: grandchildren and children's spouses take names nobody
 * in the life has, interaction lines tell two fathers apart, people far away are reached by phone or mail (never
 * in person) and leave room for new friends, a minor heir is taken in on the first day (by a real aunt or uncle
 * when the last player left a brother or sister), pet cards can bind a species, and a coworker who leaves during
 * an age-up keeps their name out of that year's new friends.
 */
import { getCountry } from '@/data/countries';
import { NAMES } from '@/data/names';
import { ageUp } from '../ageUp';
import { candidatesFor } from '../events/conditions';
import { applyEffects } from '../events/effects';
import { validateEvent, type EventDef } from '../events/schema';
import { makeRegistry } from '../events/select';
import { Rng } from '../rng';
import { createLife, emptyMemory, makePerson } from '../systems/character';
import { markDeath } from '../systems/death';
import { validateFlavor } from '../systems/flavor';
import type { FlavorLine } from '@/data/flavor';
import { addGrandchild, markChildMilestone, yearlyFamily } from '../systems/family';
import { availableInteractions, interact, yearlyRelationships } from '../systems/relationships';
import type { GameState, Gender, Person, RelationshipKind } from '../types';

const noEvents = makeRegistry([]);
const POOL = NAMES[getCountry('US').namePool];

/** A US player of `age` with only the people given, plenty of cash and energy. */
function life(age: number, people: Person[] = [], opts: { gender?: Gender; seed?: number } = {}): GameState {
  const s = createLife({ countryCode: 'US', gender: opts.gender ?? 'female', firstName: 'Nora' }, opts.seed ?? 31);
  return {
    ...s,
    people: Object.fromEntries(people.map((p) => [p.id, p])),
    year: s.character.birthYear + age,
    character: { ...s.character, age, energy: 4, energyMax: 4 },
    finances: { ...s.finances, cash: 100_000 },
    eventQueue: [],
    log: [],
  };
}

let ids = 0;
function person(kind: RelationshipKind, patch: Partial<Person> = {}, playerAge = 30): Person {
  const p = makePerson(new Rng(++ids), { kind, age: 40, countryCode: 'US', playerAge, gender: patch.gender ?? 'female' });
  return { ...p, id: `${kind}_${ids}`, memory: emptyMemory(playerAge), ...patch };
}

/** People who hold every name of the US pool except `keep` (exes: they reserve a name and nothing else). */
function crowd(keep: readonly string[] = []): Person[] {
  return [...POOL.male, ...POOL.female].filter((n) => !keep.includes(n) && n !== 'Nora').map((firstName) => person('ex', { firstName, age: 50 }));
}

const lastLine = (s: GameState) => s.lastResult?.text ?? '';

describe('names in the family (A)', () => {
  const freeMale = POOL.male[POOL.male.length - 1]!;
  const freeFemale = POOL.female[POOL.female.length - 1]!;
  const spouseName = POOL.female[POOL.female.length - 2]!;

  it("a grandchild takes the one name nobody has, never their other parent's (the child's spouse)", () => {
    const son = person('child', { firstName: 'Adam', gender: 'male', age: 30, growth: { movedOut: true, spouse: { firstName: spouseName, gender: 'female' } } });
    const s = life(60, [son, ...crowd([freeMale, freeFemale, spouseName])]);
    for (let seed = 1; seed <= 30; seed++) {
      const after = addGrandchild(s, new Rng(seed), son.id);
      const baby = Object.values(after.people).find((p) => p.kind === 'grandchild')!;
      expect(baby.firstName).toBe(baby.gender === 'male' ? freeMale : freeFemale);
    }
  });

  it("a child's spouse takes the one name nobody has", () => {
    const daughter = person('child', { firstName: 'Ada', gender: 'female', age: 30, growth: { movedOut: true } });
    const s = life(60, [daughter, ...crowd([freeMale, freeFemale])]);
    for (let seed = 1; seed <= 30; seed++) {
      const spouse = markChildMilestone(s, new Rng(seed), daughter.id, 'married').people[daughter.id]!.growth!.spouse!;
      expect(spouse.firstName).toBe(spouse.gender === 'male' ? freeMale : freeFemale);
    }
  });

  it("even with every name taken, a child's spouse never shares a name with that child or their own kids, nor a grandchild with theirs", () => {
    // The pool is used up; the child's own children hold half of it.
    const son = person('child', { firstName: POOL.male[35]!, gender: 'male', age: 40, growth: { movedOut: true, kids: 2 } });
    const kids = [...POOL.male.slice(0, 30), ...POOL.female.slice(0, 30)].map((firstName, i) => person('grandchild', { firstName, gender: i < 30 ? 'male' : 'female', age: 10, viaId: son.id }));
    const s = life(70, [son, ...kids, ...crowd()]);
    const own = new Set([son.firstName, ...kids.map((k) => k.firstName)]);
    for (let seed = 1; seed <= 40; seed++) {
      const spouse = markChildMilestone(s, new Rng(seed), son.id, 'married').people[son.id]!.growth!.spouse!;
      expect(own.has(spouse.firstName)).toBe(false);
    }
    const married = { ...s, people: { ...s.people, [son.id]: { ...son, growth: { ...son.growth, kids: 1, spouse: { firstName: POOL.female[40]!, gender: 'female' as const } } } } };
    const family = new Set([...own, POOL.female[40]!]);
    for (let seed = 1; seed <= 40; seed++) {
      const after = addGrandchild(married, new Rng(seed), son.id);
      const baby = Object.values(after.people).find((p) => p.kind === 'grandchild' && !married.people[p.id])!;
      expect(family.has(baby.firstName)).toBe(false);
    }
  });

  it("once the pool is used up, a grandchild or a child's spouse is still never named like me (bar a baby named after me)", () => {
    const son = person('child', { firstName: 'Adam', gender: 'male', age: 30, growth: { movedOut: true, spouse: { firstName: 'Zoe', gender: 'female' } } });
    const daughter = person('child', { firstName: 'Ada', gender: 'female', age: 30, growth: { movedOut: true } });
    const s = life(60, [son, daughter, ...crowd()]);
    for (let seed = 1; seed <= 200; seed++) {
      const baby = Object.values(addGrandchild(s, new Rng(seed), son.id).people).find((p) => p.kind === 'grandchild')!;
      expect(baby.firstName).not.toBe('Nora');
      expect(['Adam', 'Zoe']).not.toContain(baby.firstName);
      // Nora's daughter marries another woman now and then (one in ten): never another Nora.
      const spouse = markChildMilestone(s, new Rng(seed), daughter.id, 'married').people[daughter.id]!.growth!.spouse!;
      expect(spouse.firstName).not.toBe('Nora');
    }
  });

  it('a baby named after me is still the one deliberate exception', () => {
    const son = person('child', { firstName: 'Adam', gender: 'male', age: 30, growth: { movedOut: true } });
    const s = markChildMilestone(life(60, [son]), new Rng(1), son.id, 'expecting', { namedAfterMe: true });
    const after = addGrandchild(s, new Rng(2), son.id);
    const baby = Object.values(after.people).find((p) => p.kind === 'grandchild')!;
    expect(baby.firstName).toBe('Nora');
    expect(after.log.map((l) => l.text).join(' ')).toMatch(/They named her Nora, after me\./);
  });
});

/** An heir of two fathers, 12: the late player (created first) is Dad, the surviving father Papa. */
function twoFathers(): { heir: GameState; papa: Person } {
  const base = createLife({ countryCode: 'IN', gender: 'male' }, 77);
  const prev0 = { ...base, character: { ...base.character, age: 40 }, year: base.character.birthYear + 40 };
  const rng = new Rng(3);
  const spouse = { ...makePerson(rng, { kind: 'spouse', gender: 'male', age: 41, countryCode: 'IN', playerAge: 40 }), firstName: 'Sanjay' };
  const kid = { ...makePerson(rng, { kind: 'child', gender: 'female', age: 12, countryCode: 'IN', playerAge: 28 }), otherParentId: spouse.id };
  const heir = createLife({ heir: { childId: kid.id, previous: markDeath({ ...prev0, people: { ...prev0.people, [spouse.id]: spouse, [kid.id]: kid } }, 'a car accident') } }, 4);
  const papa = Object.values(heir.people).find((p) => p.kind === 'father' && p.alive)!;
  return { heir: { ...heir, character: { ...heir.character, energy: 4 }, finances: { ...heir.finances, cash: 10_000 } }, papa };
}

describe('interactions (B)', () => {
  it('call the second father Papa', () => {
    const { heir, papa } = twoFathers();
    for (const id of ['spendTime', 'conversation', 'compliment', 'gift']) {
      const after = interact(heir, new Rng(5), papa.id, id);
      expect(lastLine(after)).toMatch(/\bPapa\b/);
      expect(lastLine(after)).not.toMatch(/\bDad\b/);
    }
  });

  /** A player of `age` with a grandmother, a friend and a best friend left behind, and a friend nearby. */
  function farLife(age: number) {
    const grandma = person('grandparent', { firstName: 'Rosa', gender: 'female', age: 75, money: 50_000, farAway: true, relationship: 80 }, 0);
    const friend = person('friend', { firstName: 'Santiago', gender: 'male', age, farAway: true, relationship: 70 }, age - 3);
    const best = person('bestFriend', { firstName: 'Diego', gender: 'male', age, farAway: true, relationship: 90 }, age - 5);
    const local = person('friend', { firstName: 'Mia', gender: 'female', age, relationship: 60 }, age - 1);
    return { s: life(age, [grandma, friend, best, local]), grandma, friend, best, local };
  }

  it('hide spending time and visits with people far away, and refuse them with the reason', () => {
    const { s, grandma, friend, local } = farLife(10);
    expect(availableInteractions(s, grandma).map((d) => d.id)).not.toEqual(expect.arrayContaining(['visit']));
    expect(availableInteractions(s, grandma).map((d) => d.id)).not.toContain('spendTime');
    expect(availableInteractions(s, friend).map((d) => d.id)).not.toContain('spendTime');
    expect(availableInteractions(s, local).map((d) => d.id)).toContain('spendTime');
    for (const id of ['visit', 'spendTime']) {
      const after = interact(s, new Rng(1), grandma.id, id);
      expect(lastLine(after)).toBe('They live far away now.');
      expect(after.finances.cash).toBe(s.finances.cash);
      expect(after.log).toEqual(s.log);
    }
  });

  it('reach people far away by phone or mail, never in person (and no money pressed into a hand)', () => {
    const inPerson = /afternoon|hung out|weekend at|visited|dropped in|went to see|fed me|walked away|beamed|slipped|pressed|played together|followed|\bin my hand/i;
    const distance = /\bcall|phone|mail|sent|wrote|letter|line went/i;
    for (const age of [10, 30]) {
      const { s, grandma, friend, best } = farLife(age);
      for (const p of [grandma, friend, best]) {
        const offered = availableInteractions(s, p).map((d) => d.id);
        expect(offered.length).toBeGreaterThan(2);
        for (const id of offered) {
          for (let seed = 1; seed <= 12; seed++) {
            const line = lastLine(interact(s, new Rng(seed), p.id, id));
            expect({ id, line, inPerson: inPerson.test(line) }).toEqual({ id, line, inPerson: false });
            expect({ id, line, distance: distance.test(line) }).toEqual({ id, line, distance: true });
          }
        }
      }
    }
  });

  it('count only friends nearby against the four-friend limit', () => {
    const far = [1, 2, 3, 4].map((i) => person('friend', { firstName: `Far${i}`, age: 15, farAway: true, relationship: 80 }, 10));
    const near = [1, 2, 3, 4].map((i) => person('friend', { firstName: `Near${i}`, age: 15, relationship: 80 }, 10));
    const newFriends = (people: Person[]) =>
      Array.from({ length: 20 }, (_, i) => yearlyRelationships(life(15, people), new Rng(i + 1))).filter((s) => s.log.some((l) => l.text.startsWith('I made a new friend'))).length;
    expect(newFriends(far)).toBeGreaterThan(0);
    expect(newFriends(near)).toBe(0);
  });
});

describe('relationship effects by kind (C)', () => {
  it('skip people far away', () => {
    const away = person('friend', { firstName: 'Diego', farAway: true, relationship: 50 });
    const here = person('friend', { firstName: 'Mia', relationship: 50 });
    const after = applyEffects(life(16, [away, here]), new Rng(1), [{ relationship: 'friend', delta: 10 }]);
    expect(after.people[away.id]!.relationship).toBe(50);
    expect(after.people[here.id]!.relationship).toBe(60);
  });
});

describe('a minor heir whose only parent was the last player (E)', () => {
  const GUARDIANS: RelationshipKind[] = ['mother', 'father', 'stepmother', 'stepfather'];
  const guardians = (s: GameState) => Object.values(s.people).filter((p) => p.alive && GUARDIANS.includes(p.kind));
  const careLines = (s: GameState) => s.log.map((l) => l.text).filter((t) => /went to live with|took me in|became my guardian|my caseworker/i.test(t));

  /** A single mother who dies at 39, leaving a son of 9 (and whatever siblings of her own `people` holds). */
  function singleMother(people: (prev: GameState) => Person[] = () => []): { prev: GameState; kid: Person } {
    const parent = createLife({ countryCode: 'US', gender: 'female', firstName: 'Clara', lastName: 'Hale' }, 8);
    const base = { ...parent, people: Object.fromEntries(Object.entries(parent.people).filter(([, p]) => p.kind !== 'sibling')) };
    const kid = makePerson(new Rng(3), { kind: 'child', gender: 'male', age: 9, countryCode: 'US', lastName: 'Hale', playerAge: 30 });
    const extra = people(base);
    const prev = markDeath(
      { ...base, character: { ...base.character, age: 39 }, year: base.character.birthYear + 39, people: { ...base.people, [kid.id]: kid, ...Object.fromEntries(extra.map((p) => [p.id, p])) } },
      'a car accident',
    );
    return { prev, kid };
  }

  it('is taken in on the first day, once, not at the next birthday', () => {
    const { prev, kid } = singleMother();
    const heir = createLife({ heir: { childId: kid.id, previous: prev } }, 4);
    expect(guardians(heir)).toHaveLength(1);
    expect(careLines(heir)).toHaveLength(1);
    expect(careLines(heir)[0]).toMatch(/^I went to live with Mom's (sister|brother), (Aunt|Uncle) \S+\.$/);
    const later = ageUp(ageUp(heir, noEvents), noEvents);
    expect(careLines(later)).toHaveLength(1);
    expect(guardians(later)).toHaveLength(1);
  });

  it("goes to the last player's own grown brother or sister when there is one, as they were", () => {
    const { prev, kid } = singleMother(() => [
      { ...person('sibling', { firstName: 'June', lastName: 'Hale', gender: 'female', age: 44, occupation: 'Pharmacist', relationship: 40, money: 30_000 }, 0), metAtAge: 0 },
      { ...person('sibling', { firstName: 'Walt', lastName: 'Hale', gender: 'male', age: 47, occupation: 'Plumber', relationship: 85, money: 12_000 }, 0), metAtAge: 0 },
      { ...person('sibling', { firstName: 'Tess', lastName: 'Hale', gender: 'female', age: 51, alive: false, relationship: 99 }, 0), metAtAge: 0 },
    ]);
    const heir = createLife({ heir: { childId: kid.id, previous: prev } }, 4);
    const [uncle] = guardians(heir);
    const mom = Object.values(heir.people).find((p) => p.kind === 'mother')!;
    // The closest living one: Walt, the uncle the heir has known all along.
    expect(uncle).toMatchObject({ kind: 'stepfather', relative: true, viaId: mom.id, firstName: 'Walt', lastName: 'Hale', gender: 'male', age: 47, occupation: 'Plumber', money: 12_000, metAtAge: 0, alive: true });
    expect(careLines(heir)).toEqual(["I went to live with Mom's brother, Uncle Walt."]);
    expect(careLines(ageUp(heir, noEvents))).toHaveLength(1);
  });

  it('a brother still under 18, or a foster sister, cannot take the heir in, so an aunt or uncle is found as before', () => {
    const { prev, kid } = singleMother(() => [
      { ...person('sibling', { firstName: 'Pip', lastName: 'Hale', gender: 'male', age: 16 }, 0), metAtAge: 0 },
      { ...person('sibling', { firstName: 'Vera', lastName: 'Okafor', gender: 'female', age: 45, foster: true, relationship: 95 }, 0), metAtAge: 0 },
    ]);
    const heir = createLife({ heir: { childId: kid.id, previous: prev } }, 4);
    const [carer] = guardians(heir);
    expect(carer!.relative).toBe(true);
    expect(['Pip', 'Vera']).not.toContain(carer!.firstName);
    expect(careLines(heir)).toHaveLength(1);
  });

  it('an heir with a living other parent, or a grown heir, is nobody\'s ward', () => {
    const { prev, kid } = singleMother();
    const dad = person('spouse', { firstName: 'Owen', gender: 'male', age: 41 });
    const two = { ...prev, people: { ...prev.people, [dad.id]: dad, [kid.id]: { ...kid, otherParentId: dad.id } } };
    const heir = createLife({ heir: { childId: kid.id, previous: two } }, 4);
    expect(guardians(heir).map((p) => p.kind)).toEqual(['father']);
    expect(careLines(heir)).toEqual([]);
    const grown = { ...prev, people: { ...prev.people, [kid.id]: { ...kid, age: 19 } } };
    expect(careLines(createLife({ heir: { childId: kid.id, previous: grown } }, 4))).toEqual([]);
  });
});

describe('pet species in a person selector (F)', () => {
  const pets = ['dog', 'cat', 'pigeon', 'parrot', 'hamster'].map((species) => person('pet', { species, firstName: `Pet ${species}`, age: 3 }));

  it('binds only pets of those species', () => {
    const s = life(20, pets);
    expect(candidatesFor(s, { kind: ['pet'], species: ['dog', 'cat'] }).map((p) => p.species).sort()).toEqual(['cat', 'dog']);
    expect(candidatesFor(s, { kind: ['pet'] })).toHaveLength(5);
  });

  it('the validator takes species only on a pet selector, with known species', () => {
    const card = (sel: EventDef['person']): EventDef => ({ id: 'pt_species_test', category: 'random', title: 'Fur everywhere', text: '{{person}} shed on the couch again.', minAge: 8, maxAge: 90, weight: 1, person: sel, choices: [{ id: 'brush', label: 'Brush them', effects: [{ log: 'I brushed {{person}}.' }] }, { id: 'vacuum', label: 'Vacuum', effects: [{ log: 'I vacuumed the couch.' }] }] });
    const known = new Set(['pt_species_test']);
    expect(validateEvent(card({ kind: ['pet'], species: ['dog', 'cat', 'rabbit', 'hamster'] }), known)).toEqual([]);
    expect(validateEvent(card({ kind: ['friend'], species: ['dog'] }), known).join(' ')).toMatch(/species/);
    expect(validateEvent(card({ kind: ['pet'], species: ['dgo'] }), known).join(' ')).toMatch(/species/);
    expect(validateEvent(card({ kind: ['pet'], species: [] }), known).join(' ')).toMatch(/species/);
    // Flavor lines bind people the same way.
    const line = (sel: FlavorLine['person']): FlavorLine => ({ text: 'I found {{person}} asleep on my coat again.', minAge: 8, maxAge: 90, person: sel });
    expect(validateFlavor([line({ kind: ['pet'], species: ['dog', 'cat'] })])).toEqual([]);
    expect(validateFlavor([line({ kind: ['spouse'], species: ['cat'] })]).join(' ')).toMatch(/species/);
  });
});

describe('names that leave during an age-up (G)', () => {
  const [a, b] = [POOL.male.slice(-2), POOL.female.slice(-2)];

  it("yearlyRelationships keeps the names it is given (the year's start) out of new friends and partners", () => {
    // Married, so the only newcomer a year is a friend.
    const s = life(20, [person('spouse', { firstName: 'Quill', gender: 'male', age: 21, love: 80 }), ...crowd([...a!, ...b!])]);
    const reserved = new Set([a![0]!, b![0]!]);
    let made = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const after = yearlyRelationships(s, new Rng(seed), reserved);
      for (const p of Object.values(after.people)) {
        if (s.people[p.id]) continue;
        made++;
        expect([a![1], b![1]]).toContain(p.firstName);
      }
    }
    expect(made).toBeGreaterThan(5);
  });

  it("yearlyFamily keeps the names it is given out of a grandchild and a child's spouse", () => {
    // Every name but two of each gender is taken; the year's start reserves one of each.
    const reserved = new Set([a![0]!, b![0]!]);
    const expecting = person('child', { firstName: 'Adam', gender: 'male', age: 30, growth: { movedOut: true, spouse: { firstName: 'Zoe', gender: 'female' }, expecting: 1 } });
    const single = person('child', { firstName: 'Ada', gender: 'female', age: 30, growth: { movedOut: true } });
    const crowded = crowd([...a!, ...b!]);
    let spouses = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const baby = Object.values(yearlyFamily(life(60, [expecting, ...crowded]), new Rng(seed), reserved).people).find((p) => p.kind === 'grandchild')!;
      expect([a![1], b![1]]).toContain(baby.firstName);
      const spouse = yearlyFamily(life(60, [single, ...crowded]), new Rng(seed), reserved).people[single.id]!.growth?.spouse;
      if (!spouse) continue;
      spouses++;
      expect([a![1], b![1]]).toContain(spouse.firstName);
    }
    expect(spouses).toBeGreaterThan(3);
  });

  it('a friend who drifts apart this age-up does not hand their name to a grandchild born the same year', () => {
    let drifted = 0;
    for (let seed = 1; seed <= 60; seed++) {
      // At 85 nobody new becomes a friend or a partner: the only newcomer is the grandchild.
      const friends = [a![0]!, b![0]!].map((firstName, i) => person('friend', { firstName, gender: i ? 'female' : 'male', age: 85, relationship: 0 }));
      const son = person('child', { firstName: 'Adam', gender: 'male', age: 50, growth: { movedOut: true, spouse: { firstName: 'Zoe', gender: 'female' }, expecting: 1, kids: 1 } });
      const s = life(85, [son, ...friends, ...crowd([...a!, ...b!])], { seed });
      const after = ageUp(s, noEvents);
      if (friends.some((f) => !after.people[f.id])) drifted++;
      const baby = Object.values(after.people).find((p) => p.kind === 'grandchild');
      if (baby) expect([a![1], b![1]]).toContain(baby.firstName);
    }
    expect(drifted).toBeGreaterThan(10);
  });

  it('a coworker who leaves with the job this age-up does not hand their name to a new friend or partner', () => {
    let made = 0;
    for (let seed = 1; seed <= 40; seed++) {
      // Between jobs at 19: the coworker from the job that just ended is settled (and leaves the life) during the age-up.
      const mate = person('coworker', { firstName: a![0]!, gender: 'male', age: 25, relationship: 20, workplace: { jobId: 'cashier', company: 'Ember Grill' } });
      const mate2 = person('coworker', { firstName: b![0]!, gender: 'female', age: 25, relationship: 20, workplace: { jobId: 'cashier', company: 'Ember Grill' } });
      const spouse = person('spouse', { firstName: 'Quill', gender: 'male', age: 21, love: 80 });
      const s = life(19, [spouse, mate, mate2, ...crowd([...a!, ...b!])], { seed });
      const after = ageUp(s, noEvents);
      expect(after.people[mate.id]).toBeUndefined();
      for (const p of Object.values(after.people)) {
        if (s.people[p.id] || p.kind === 'grandchild' || p.kind === 'child') continue;
        made++;
        expect([a![1], b![1]]).toContain(p.firstName);
      }
    }
    expect(made).toBeGreaterThan(5);
  });
});
