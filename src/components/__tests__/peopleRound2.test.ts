import { heirOccupationLabel, neglectLine, occupationLabel, personFacts, personMemories, personSubtitle, kindLabel } from '@/components/game/people';
import { Rng } from '@/engine/rng';
import { createLife, makePerson } from '@/engine/systems/character';
import { seesDaily } from '@/engine/systems/relationships';
import type { GameState, LogEntry, Person, RelationshipKind } from '@/engine/types';

const mem = (last: number) => ({ lastInteractionAge: last, insults: 0, compliments: 0, gifts: 0, fights: 0, yearsNeglected: 0 });
function person(kind: RelationshipKind, patch: Partial<Person> = {}): Person {
  return { ...makePerson(new Rng(3), { kind, age: 40, countryCode: 'US', playerAge: 0 }), ...patch };
}
function life(age: number, people: Person[], patch: Partial<GameState> = {}): GameState {
  const s = createLife({ countryCode: 'US' }, 9);
  return { ...s, ...patch, character: { ...s.character, age }, people: Object.fromEntries(people.map((p) => [p.id, p])) };
}
const entry = (age: number, text: string): LogEntry => ({ age, year: 2000 + age, text, kind: 'info' });

describe('no silence with the people I live with (playtest 2, finding 3)', () => {
  const wife = person('spouse', { metAtAge: 35, marriedAtAge: 37, memory: mem(40), gender: 'female' });
  const zara = person('lover', { metAtAge: 16, memory: mem(20), gender: 'female' });
  const dog = person('pet', { species: 'dog', age: 9, metAtAge: 37, memory: mem(40) });

  it('a spouse, a partner I moved in with and a pet never "haven\'t spoken in N years"', () => {
    const together = life(46, [wife, dog], { flags: { lf_living_together: true } });
    for (const p of [wife, dog]) expect(personFacts(p, together).join(' ')).not.toMatch(/haven't/);
    expect(personFacts(zara, life(26, [zara], { flags: { lf_living_together: true } })).join(' ')).not.toMatch(/haven't/);
  });

  it('the silence is still real for a partner I do not live with, and while I am in prison', () => {
    expect(seesDaily(life(26, [zara]), zara)).toBe(false);
    expect(seesDaily(life(46, [wife]), { ...wife, farAway: true })).toBe(false);
    expect(personFacts(zara, life(26, [zara]))).toContain("You haven't spoken in 6 years.");
    const jailed = life(46, [wife]);
    expect(personFacts(wife, { ...jailed, crime: { ...jailed.crime, inPrison: true } })).toContain("You haven't spoken in 6 years.");
    expect(neglectLine(wife, 46)).toBe("You haven't spoken in 6 years.");
    expect(neglectLine(wife, 46, true)).toBeNull();
  });
});

describe('labels say what people really do (findings 8, 32)', () => {
  it('my child out of high school is no longer a "Student"; the heir card says when there is no diploma', () => {
    const harriet = person('child', { age: 20, occupation: 'Student', growth: { school: 'droppedOut' } });
    expect(occupationLabel(harriet)).toBeNull();
    expect(heirOccupationLabel(harriet)).toBe('No diploma');
    const grad = person('child', { age: 19, occupation: 'Student', growth: { school: 'graduated' } });
    expect(occupationLabel(grad)).toBeNull();
    expect(heirOccupationLabel(grad)).toBeNull();
    const pupil = person('child', { age: 15, occupation: 'Student', growth: { school: 'started' } });
    expect(heirOccupationLabel(pupil)).toBe('Student');
    expect(occupationLabel(person('child', { age: 3, occupation: 'Baby' }))).toBe('Toddler');
  });

  it('a coworker of 67 or more who still works with me shows the working title', () => {
    const oliver = person('coworker', { age: 70, occupation: 'Head Janitor', workplace: { jobId: 'janitor', company: 'Union Ltd.' } });
    expect(personSubtitle(oliver, kindLabel(oliver))).toBe('Coworker · 70 · Head Janitor');
    expect(occupationLabel({ ...oliver, kind: 'friend' })).toBe('Retired Head Janitor');
  });
});

describe('memories are only of this person (finding 14)', () => {
  it('a new Layla does not inherit the lines of the Layla who drifted away before we met', () => {
    const kelly = person('friend', { firstName: 'Layla', lastName: 'Kelly', metAtAge: 66 });
    const s = life(67, [kelly], {
      log: [
        entry(19, 'I made a new friend, Layla Ward.'),
        entry(25, 'Layla and I had the kind of argument that starts about a borrowed sweater.'),
        entry(30, 'Layla and I drifted apart for good.'),
        entry(66, 'I made a new friend, Layla Kelly.'),
        entry(67, 'Layla and I had a good talk.'),
      ],
    });
    expect(personMemories(s, kelly, 5).map((m) => m.age)).toEqual([67, 66]);
  });

  it('someone known since birth keeps every line', () => {
    const mom = person('mother', { firstName: 'Rosa', metAtAge: 0, gender: 'female' });
    const s = life(30, [mom], { log: [entry(4, 'Mom taught me to whistle.'), entry(29, 'I complimented Mom. She beamed.')] });
    expect(personMemories(s, mom).map((m) => m.age)).toEqual([29, 4]);
  });
});
