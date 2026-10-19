/**
 * The person screen's words for family (follow-ups): a second father is Papa in memories and family facts, an aunt
 * or uncle who took the player in says whose sibling they are and when, and people left behind live far away.
 */
import { familyFacts, personFacts, personMemories } from '@/components/game/people';
import { earlyStage } from '@/components/game/workEarlyYears';
import { Rng } from '@/engine/rng';
import { createLife, emptyMemory, makePerson } from '@/engine/systems/character';
import { markDeath } from '@/engine/systems/death';
import type { GameState, LogEntry, Person, RelationshipKind } from '@/engine/types';

/** An heir of two fathers, 12: the late player (created first) is Dad, the surviving father Papa. */
function twoFathers(): { heir: GameState; dad: Person; papa: Person } {
  const base = createLife({ countryCode: 'IN', gender: 'male' }, 77);
  const prev0 = { ...base, character: { ...base.character, age: 40 }, year: base.character.birthYear + 40 };
  const rng = new Rng(3);
  const spouse = { ...makePerson(rng, { kind: 'spouse', gender: 'male', age: 41, countryCode: 'IN', playerAge: 40 }), firstName: 'Sanjay' };
  const kid = { ...makePerson(rng, { kind: 'child', gender: 'female', age: 12, countryCode: 'IN', playerAge: 28 }), otherParentId: spouse.id };
  const heir = createLife({ heir: { childId: kid.id, previous: markDeath({ ...prev0, people: { ...prev0.people, [spouse.id]: spouse, [kid.id]: kid } }, 'a car accident') } }, 4);
  const fathers = Object.values(heir.people).filter((p) => p.kind === 'father');
  return { heir, dad: fathers.find((p) => !p.alive)!, papa: fathers.find((p) => p.alive)! };
}

let ids = 0;
function person(kind: RelationshipKind, patch: Partial<Person> = {}): Person {
  const p = makePerson(new Rng(++ids), { kind, age: 40, countryCode: 'US', playerAge: 0, gender: patch.gender ?? 'female' });
  return { ...p, id: `${kind}_${ids}`, memory: emptyMemory(0), ...patch };
}

function life(age: number, people: Person[]): GameState {
  const s = createLife({ countryCode: 'US', firstName: 'Nora' }, 9);
  return { ...s, character: { ...s.character, age }, people: Object.fromEntries(people.map((p) => [p.id, p])) };
}

const entry = (age: number, text: string): LogEntry => ({ age, year: 2000 + age, text, kind: 'info' });

describe('a second father', () => {
  it("is Papa in memories: Papa's lines are his, Dad's are Dad's", () => {
    const { heir, dad, papa } = twoFathers();
    const s = { ...heir, log: [entry(9, 'Dad taught me to whistle.'), entry(10, 'Papa burned the pancakes again.'), entry(11, 'I complimented Papa. He beamed.')] };
    expect(personMemories(s, papa).map((m) => m.text)).toEqual(['I complimented Papa. He beamed.', 'Papa burned the pancakes again.']);
    expect(personMemories(s, dad).map((m) => m.text)).toEqual(['Dad taught me to whistle.']);
  });

  it("names his side of the family: Papa's mother", () => {
    const { heir, papa } = twoFathers();
    const nani = person('grandparent', { firstName: 'Meera', gender: 'female', age: 70, viaId: papa.id });
    expect(familyFacts(nani, { ...heir, people: { ...heir.people, [nani.id]: nani } })).toEqual(["Papa's mother."]);
  });
});

describe('who a baby is at home with (Work & School)', () => {
  /** A baby heir: the late player was their only parent, or one of two fathers. */
  function babyHeir(withPapa: boolean): GameState {
    const base = createLife({ countryCode: 'US', gender: 'male' }, 21);
    const prev0 = { ...base, character: { ...base.character, age: 34 }, year: base.character.birthYear + 34 };
    const rng = new Rng(8);
    const papa = { ...makePerson(rng, { kind: 'spouse', gender: 'male', age: 35, countryCode: 'US', playerAge: 34 }), firstName: 'Theo' };
    const baby = { ...makePerson(rng, { kind: 'child', gender: 'female', age: 1, countryCode: 'US', playerAge: 33 }), ...(withPapa ? { otherParentId: papa.id } : {}) };
    const prev = markDeath({ ...prev0, people: { ...prev0.people, ...(withPapa ? { [papa.id]: papa } : {}), [baby.id]: baby } }, 'a car accident');
    return createLife({ heir: { childId: baby.id, previous: prev } }, 6);
  }

  it('is Papa, not Dad, when the late player was Dad', () => {
    expect(earlyStage(babyHeir(true))?.title).toBe('At home with Papa');
  });

  it('is the aunt or uncle who took the baby in', () => {
    const heir = babyHeir(false);
    const carer = Object.values(heir.people).find((p) => p.relative && p.alive)!;
    expect(earlyStage(heir)?.title).toBe(`At home with ${carer.gender === 'male' ? 'Uncle' : 'Aunt'} ${carer.firstName}`);
  });
});

describe('an aunt or uncle who took me in', () => {
  const mom = person('mother', { firstName: 'Clara', alive: false, deathAge: 38 });

  it("says whose sibling they are and when, without repeating when we met", () => {
    const aunt = person('stepmother', { firstName: 'Rosa', relative: true, viaId: mom.id, metAtAge: 9 });
    const s = life(12, [mom, aunt]);
    expect(familyFacts(aunt, s)).toEqual(["Mom's sister.", 'Took you in when you were 9.']);
    expect(personFacts(aunt, s)).toEqual(["Mom's sister.", 'Took you in when you were 9.']);
    // Their name finds their memories: "Aunt Rosa".
    expect(personMemories({ ...s, log: [entry(10, 'Aunt Rosa packed my lunch with a note.')] }, aunt).map((m) => m.text)).toEqual(['Aunt Rosa packed my lunch with a note.']);
  });

  it('one known since birth (the last player\'s own brother) took me in when that parent died', () => {
    const uncle = person('stepfather', { firstName: 'Walt', gender: 'male', relative: true, viaId: mom.id, metAtAge: 0 });
    expect(personFacts(uncle, life(10, [mom, uncle]))).toEqual(['Known since you were born.', "Mom's brother.", 'Took you in when Mom died.']);
  });
});

describe('people far away', () => {
  it('live far away, as the person screen says', () => {
    const mom = person('mother', { firstName: 'Clara' });
    const grandma = person('grandparent', { firstName: 'Rosa', age: 70, viaId: mom.id, farAway: true, metAtAge: 0 });
    const friend = person('friend', { firstName: 'Diego', gender: 'male', age: 12, farAway: true, metAtAge: 6, memory: emptyMemory(11) });
    const s = life(12, [mom, grandma, friend]);
    expect(familyFacts(grandma, s)).toEqual(["Mom's mother.", 'Lives far away.']);
    expect(familyFacts(friend, s)).toEqual(['Lives far away.']);
    expect(personFacts(friend, s)).toEqual(['Known since you were 6.', 'Lives far away.']);
    // Remembered, not far away, once they have died.
    expect(familyFacts({ ...friend, alive: false }, s)).toEqual([]);
  });
});
