import { familyFacts, groupPeople, interactionTiles, kindEmoji, kindLabel, neglectLine, personAvatar, personMemories, personRef, sinceLine } from '@/components/game/people';
import { applyAction } from '@/engine/actions';
import { Rng } from '@/engine/rng';
import { createLife, makePerson } from '@/engine/systems/character';
import type { GameState, LogEntry, Person, RelationshipKind } from '@/engine/types';

const rng = new Rng(3);
function person(kind: RelationshipKind, patch: Partial<Person> = {}): Person {
  return { ...makePerson(rng, { kind, age: 40, countryCode: 'US', playerAge: 0, gender: kind === 'father' ? 'male' : 'female' }), ...patch };
}
function life(age: number, people: Person[], patch: Partial<GameState> = {}): GameState {
  const s = createLife({ countryCode: 'US' }, 9);
  return { ...s, ...patch, character: { ...s.character, age, energy: 4, energyMax: 4 }, people: Object.fromEntries(people.map((p) => [p.id, p])) };
}

describe('neglect line (UI-23)', () => {
  it('never tells a child they have not spoken to the parents and siblings they live with', () => {
    const mom = person('mother', { metAtAge: 0, memory: { lastInteractionAge: 0, insults: 0, compliments: 0, gifts: 0, fights: 0, yearsNeglected: 0 } });
    expect(neglectLine(mom, 8)).toBeNull();
    expect(neglectLine({ ...mom, kind: 'sibling' }, 17)).toBeNull();
  });

  it('counts silence from moving out, from meeting, or from the last interaction, whichever is latest', () => {
    const mem = (last: number) => ({ lastInteractionAge: last, insults: 0, compliments: 0, gifts: 0, fights: 0, yearsNeglected: 0 });
    expect(neglectLine(person('mother', { metAtAge: 0, memory: mem(0) }), 25)).toBe("You haven't spoken in 7 years.");
    expect(neglectLine(person('mother', { metAtAge: 0, memory: mem(24) }), 25)).toBeNull();
    expect(neglectLine(person('friend', { metAtAge: 20, memory: mem(0) }), 23)).toBe("You haven't spoken in 3 years.");
    expect(neglectLine(person('pet', { metAtAge: 20, memory: mem(20) }), 24)).toBe("You haven't spent time together in 4 years.");
    expect(neglectLine(person('child', { age: 10, metAtAge: 30, memory: mem(30) }), 40)).toBeNull();
  });
});

describe('interaction tiles (UI-04)', () => {
  it('shows cost, energy and uses left, and disables with the reason in the engine order', () => {
    const lover = person('lover', { age: 26, love: 60 });
    let s = life(26, [lover], { finances: { ...createLife({}, 9).finances, cash: 100_000 } });
    const date = () => interactionTiles(s, lover).find((t) => t.def.id === 'date')!;
    expect(date()).toMatchObject({ available: true, cost: 120, usesLeft: 2 });
    expect(date().def.energy).toBe(1);
    s = { ...s, character: { ...s.character, energy: 0 } };
    expect(date()).toMatchObject({ available: false, reason: 'No energy left' });
    s = { ...s, character: { ...s.character, energy: 4 }, finances: { ...s.finances, cash: 10 } };
    expect(date()).toMatchObject({ available: false, reason: "Can't afford it" });
    s = { ...s, actionsThisYear: { [`date:${lover.id}`]: 2 } };
    expect(date()).toMatchObject({ available: false, reason: 'Done for this year', usesLeft: 0 });
    expect(interactionTiles(s, lover).filter((t) => t.risky).map((t) => t.def.id)).toEqual(['insult', 'breakUp']);
  });

  it('enables a tile exactly when the engine accepts the interaction', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const r = new Rng(seed);
      const kinds: RelationshipKind[] = ['mother', 'father', 'sibling', 'lover', 'spouse', 'friend', 'pet', 'child', 'coworker', 'enemy', 'ex', 'grandparent', 'grandchild'];
      const people = kinds.map((kind) => ({ ...makePerson(r, { kind, age: r.int(1, 60), countryCode: 'US', playerAge: 30, species: kind === 'pet' ? 'dog' : undefined }), love: kind === 'lover' || kind === 'spouse' ? 60 : undefined }));
      const base = createLife({ countryCode: 'US' }, seed);
      const s = life(r.int(5, 40), people, { finances: { ...base.finances, cash: r.pick([0, 50, 200, 5000]) } });
      const state = { ...s, character: { ...s.character, energy: r.int(0, 2) } };
      for (const p of people) {
        for (const tile of interactionTiles(state, p)) {
          const key = `${tile.def.id}:${p.id}`;
          const after = applyAction(state, { type: 'interact', personId: p.id, interaction: tile.def.id });
          const accepted = (after.actionsThisYear[key] ?? 0) > (state.actionsThisYear[key] ?? 0);
          expect({ id: tile.def.id, kind: p.kind, accepted }).toEqual({ id: tile.def.id, kind: p.kind, accepted: tile.available });
        }
      }
    }
  });
});

describe('memories', () => {
  const entry = (age: number, text: string, kind: LogEntry['kind'] = 'info'): LogEntry => ({ age, year: 2000 + age, text, kind });

  it('finds the last three lines about a parent by name or as Mom, newest first, without repeating an event and its outcome', () => {
    const mom = person('mother', { firstName: 'Layla', lastName: 'Richardson' });
    const s = life(9, [mom], {
      log: [
        entry(0, 'My parents are Layla Richardson (31) and Noah Richardson (33).'),
        entry(3, 'Bath time. Mom has the look. → Splash', 'event'),
        entry(3, 'Mom ended up wetter than I did.', 'good'),
        entry(5, 'Age 5', 'year'),
        entry(7, 'I spent a lovely afternoon with my mother, Layla.', 'good'),
        entry(8, 'Momentum carried me down the hill.'),
        entry(8, 'Grandma slipped me $20 and said not to tell Mom. → Keep it', 'event'),
      ],
    });
    expect(personMemories(s, mom)).toEqual([
      { age: 8, text: 'Grandma slipped me $20 and said not to tell Mom.', choice: 'Keep it', kind: 'event' },
      { age: 7, text: 'I spent a lovely afternoon with my mother, Layla.', kind: 'good' },
      { age: 3, text: 'Mom ended up wetter than I did.', kind: 'good' },
    ]);
  });

  it('does not claim lines about a namesake', () => {
    const friend = person('friend', { firstName: 'Zoë', lastName: 'Ng' });
    const coworker = person('coworker', { firstName: 'Zoë', lastName: 'Park' });
    const s = life(30, [friend, coworker], { log: [entry(29, 'Zoë and I had a good talk.'), entry(30, 'I made a new friend, Zoë Ng.', 'good')] });
    expect(personMemories(s, friend).map((m) => m.text)).toEqual(['I made a new friend, Zoë Ng.']);
  });
});

describe('people list and faces', () => {
  it('groups the living by Family, Partner, Friends, Work, Pets and names the work group by who is in it', () => {
    const groups = groupPeople([
      person('friend'), person('sibling', { age: 9 }), person('mother'), person('lover'), person('classmate'), person('pet', { species: 'cat' }), person('enemy'), person('friend', { alive: false }),
    ]);
    expect(groups.map((g) => [g.title, g.people.map((p) => p.kind)])).toEqual([
      ['Family', ['mother', 'sibling']],
      ['Partner', ['lover']],
      ['Friends', ['friend']],
      ['School', ['classmate']],
      ['Pets', ['pet']],
      ['Exes & rivals', ['enemy']],
    ]);
  });

  it('ages the avatar and uses Mom/Dad as the call name', () => {
    expect(personAvatar(person('child', { age: 1 }))).toBe('👶');
    expect(personAvatar(person('sibling', { age: 8, gender: 'male' }))).toBe('👦');
    expect(personAvatar(person('mother', { age: 45 }))).toBe('👩');
    expect(personAvatar(person('father', { age: 71 }))).toBe('👴');
    expect(personAvatar(person('pet', { species: 'cat' }))).toBe('🐱');
    expect(personRef(person('father'))).toBe('Dad');
    expect(personRef(person('stepfather', { firstName: 'Gareth' }))).toBe('Gareth');
  });
});

describe('grandparents, grandchildren and coworkers on the People screens', () => {
  it('labels and faces', () => {
    const grandma = person('grandparent', { firstName: 'Rosa', gender: 'female', age: 74 });
    const grandpa = person('grandparent', { firstName: 'Joe', gender: 'male', age: 77 });
    const baby = person('grandchild', { gender: 'female', age: 1 });
    const boy = person('grandchild', { gender: 'male', age: 7 });
    expect([kindLabel(grandma), kindLabel(grandpa), kindLabel(baby), kindLabel(boy)]).toEqual(['Grandmother', 'Grandfather', 'Granddaughter', 'Grandson']);
    expect([kindEmoji(grandma), kindEmoji(grandpa), kindEmoji(baby), kindEmoji(boy)]).toEqual(['👵', '👴', '👶', '👦']);
    expect(personRef(grandma)).toBe('Grandma Rosa');
    expect(sinceLine({ ...baby, metAtAge: 58 })).toBe('Born when you were 58.');
    expect(sinceLine({ ...grandma, metAtAge: 0 })).toBe('Known since you were born.');
  });

  it('puts them in Family: parents, grandparents, siblings, children, grandchildren', () => {
    const groups = groupPeople([person('grandchild', { age: 3 }), person('child', { age: 30 }), person('grandparent', { age: 80 }), person('mother', { age: 55 }), person('sibling', { age: 25 }), person('coworker')]);
    expect(groups.map((g) => [g.title, g.people.map((p) => p.kind)])).toEqual([
      ['Family', ['mother', 'grandparent', 'sibling', 'child', 'grandchild']],
      ['Work', ['coworker']],
    ]);
  });

  it('says whose parent or child they are, how a grown child is doing, and where a coworker works with you', () => {
    const mom = person('mother', { firstName: 'Lia' });
    const grandma = person('grandparent', { gender: 'female', age: 74, viaId: mom.id });
    const kid = person('child', { firstName: 'Maya', gender: 'female', age: 33, growth: { school: 'graduated', movedOut: true, spouse: { firstName: 'Tom', gender: 'male' }, kids: 2 } });
    const grandkid = person('grandchild', { gender: 'male', age: 4, viaId: kid.id });
    const mate = person('coworker', { workplace: { jobId: 'fast_food', company: 'the Ember Grill' } });
    const s = life(60, [mom, grandma, kid, grandkid, mate]);
    const job = { defId: 'fast_food', title: 'Fast Food Worker', company: 'the Ember Grill', salary: 1, level: 0, performance: 50, yearsHeld: 1, yearsAtLevel: 1, category: 'service' as const, partTime: false, askedThisYear: false, workedHarderThisYear: false };
    const working = { ...s, career: { ...s.career, job } };
    expect(familyFacts(grandma, s)).toEqual(["Mom's mother."]);
    expect(familyFacts(grandkid, s)).toEqual(["Maya's son."]);
    expect(familyFacts(kid, s)).toEqual(['Finished high school.', 'Has moved out.', 'Married to Tom.', 'Has 2 children of her own.']);
    // The employer reads as prose here, article and all: not "at Ember Grill" or "at Army".
    expect(familyFacts(mate, working)).toEqual(['Works with you at the Ember Grill.']);
    expect(familyFacts(mate, s)).toEqual([]);
    const soldier = person('coworker', { workplace: { jobId: 'military', company: 'the Army' } });
    const army = { ...s, career: { ...s.career, job: { ...job, defId: 'military', title: 'Private', company: 'the Army' } } };
    expect(familyFacts(soldier, army)).toEqual(['Serves with you in the Army.']);
  });

  it('a child is not told they have neglected grandparents they see with their parents, nor a grandparent a toddler grandchild', () => {
    const mem = (last: number) => ({ lastInteractionAge: last, insults: 0, compliments: 0, gifts: 0, fights: 0, yearsNeglected: 0 });
    const grandma = person('grandparent', { metAtAge: 0, memory: mem(0), age: 70 });
    expect(neglectLine(grandma, 9)).toBeNull();
    expect(neglectLine(grandma, 15)).toBe("You haven't spoken in 3 years.");
    expect(neglectLine(person('grandchild', { age: 3, metAtAge: 60, memory: mem(60) }), 63)).toBeNull();
  });
});

describe('foster family labels (S2 orphan scenario)', () => {
  it('names a foster parent and foster siblings as such, and everyone else as before', () => {
    const s = createLife({ scenario: 'orphan', countryCode: 'US' }, 12);
    const foster = Object.values(s.people).find((p) => p.kind === 'stepmother' || p.kind === 'stepfather')!;
    expect(kindLabel(foster)).toBe(foster.gender === 'male' ? 'Foster father' : 'Foster mother');
    expect(kindLabel({ ...foster, foster: undefined })).toBe(foster.gender === 'male' ? 'Stepfather' : 'Stepmother');
    expect(kindLabel(person('sibling', { foster: true, gender: 'male' }))).toBe('Foster brother');
    expect(kindLabel(person('sibling', { foster: true, gender: 'female' }))).toBe('Foster sister');
    // They are family on the relationships screen.
    expect(groupPeople(Object.values(s.people)).find((g) => g.key === 'family')?.people.some((p) => p.id === foster.id)).toBe(true);
  });
});
