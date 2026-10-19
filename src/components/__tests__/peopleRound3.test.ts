import { birthDateText } from '@/components/game/LifeProfileSheet';
import { neglectLine, occupationLabel, personFacts } from '@/components/game/people';
import { JOB_BY_ID } from '@/data/jobs';
import { Rng } from '@/engine/rng';
import { createLife, emptyMemory, makePerson } from '@/engine/systems/character';
import type { GameState, Job, LogEntry, Person, RelationshipKind } from '@/engine/types';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

function person(kind: RelationshipKind, patch: Partial<Person> = {}, seed = 3): Person {
  return { ...makePerson(new Rng(seed), { kind, age: 40, countryCode: 'US', playerAge: 0 }), ...patch };
}
function life(age: number, people: Person[], patch: Partial<GameState> = {}): GameState {
  const s = createLife({ countryCode: 'US' }, 9);
  return { ...s, ...patch, character: { ...s.character, age }, people: Object.fromEntries(people.map((p) => [p.id, p])) };
}
const counselor: Job = { defId: 'therapist', title: 'Counselor', company: 'Granite Counseling', salary: 42_000, level: 0, performance: 60, yearsHeld: 3, yearsAtLevel: 3, category: JOB_BY_ID.therapist!.category, partTime: false } as Job;
const silence = (p: Person, s: GameState) => personFacts(p, s).find((f) => /haven't/.test(f)) ?? null;

describe("the person page's silence is real silence (playtest 3)", () => {
  it('no silence for a coworker I work beside every day; after the job, it counts from my last day (finding 6)', () => {
    const dean = person('coworker', { metAtAge: 22, memory: emptyMemory(22), workplace: { jobId: 'therapist', company: 'Granite Counseling' } });
    const s = life(25, [dean]);
    const working = { ...s, career: { ...s.career, job: counselor } };
    expect(personFacts(dean, working)).toEqual(['Known since you were 22.', 'Works with you at Granite Counseling.']);
    const friend = { ...dean, kind: 'friend' as const, workplace: undefined, memory: { ...dean.memory, togetherUntil: 25 } };
    expect(silence(friend, life(26, [friend]))).toBeNull();
    expect(silence(friend, life(28, [friend]))).toBe("You haven't spoken in 3 years.");
  });

  it('no silence for Mom while I still live at home at 22; once I move out it counts from the last year at home (finding 19)', () => {
    const mom = person('mother', { metAtAge: 0, memory: emptyMemory(0), age: 48 });
    expect(silence(mom, life(22, [mom]))).toBeNull();
    const moved = { ...mom, memory: { ...mom.memory, togetherUntil: 22 } };
    const rich = (age: number) => {
      const s = life(age, [moved]);
      return { ...s, career: { ...s.career, job: { ...counselor, salary: 90_000 } } };
    };
    expect(silence(moved, rich(23))).toBeNull();
    expect(silence(moved, rich(25))).toBe("You haven't spoken in 3 years.");
    // An older save has no record: the childhood home ends at 18, as before.
    expect(neglectLine(mom, 25)).toBe("You haven't spoken in 7 years.");
  });

  it('no silence for a grown child who has not moved out (finding 25)', () => {
    const matilda = person('child', { age: 20, metAtAge: 35, memory: emptyMemory(35), growth: { school: 'graduated' } });
    expect(personFacts(matilda, life(55, [matilda]))).toEqual(['Born when you were 35.', 'Finished high school.']);
    const out = { ...matilda, growth: { school: 'graduated' as const, movedOut: true }, memory: { ...matilda.memory, togetherUntil: 55 } };
    expect(silence(out, life(58, [out]))).toBe("You haven't spoken in 3 years.");
  });

  it('an ex counts the silence from the divorce, not through the marriage (finding 27)', () => {
    const alfie = person('ex', { metAtAge: 40, marriedAtAge: 47, memory: { ...emptyMemory(59), togetherUntil: 59 }, gender: 'male' });
    expect(silence(alfie, life(60, [alfie]))).toBeNull();
    expect(silence(alfie, life(62, [alfie]))).toBe("You haven't spoken in 3 years.");
  });

  it('no silence older than the newest memory on the page: a goodbye this year is time together (finding 16)', () => {
    const precious = person('friend', { firstName: 'Precious', lastName: 'Nwosu', metAtAge: 9, memory: emptyMemory(9), farAway: true });
    const goodbye: LogEntry = { age: 11, year: 2016, text: 'My friend Precious gave me a drawing to keep and made me promise to write.', kind: 'info' };
    const s = life(11, [precious], { log: [goodbye] });
    expect(personFacts(precious, s)).toEqual(['Known since you were 9.', 'Lives far away.']);
    expect(silence(precious, life(11, [precious], { log: [] }))).toBe("You haven't spoken in 2 years.");
  });
});

describe('labels and dates (findings 10, 15)', () => {
  it("an heir's brother who finished high school has no Student label", () => {
    expect(occupationLabel(person('sibling', { age: 22, occupation: 'Student', growth: { school: 'graduated' } }))).toBeNull();
    expect(occupationLabel(person('sibling', { age: 19, occupation: 'Student' }))).toBe('Student');
  });

  it('the profile shows the birth date in US order', () => {
    expect(birthDateText({ birthDay: 29, birthMonth: 1, birthYear: 2005 })).toBe('January 29, 2005');
    expect(birthDateText({ birthDay: 22, birthMonth: 10, birthYear: 1984 })).toBe('October 22, 1984');
  });
});
