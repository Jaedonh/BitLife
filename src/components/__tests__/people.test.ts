import { groupPeople, interactionTiles, neglectLine, personAvatar, personMemories, personRef } from '@/components/game/people';
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
      const kinds: RelationshipKind[] = ['mother', 'father', 'sibling', 'lover', 'spouse', 'friend', 'pet', 'child', 'coworker', 'enemy', 'ex'];
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
