import { ageUp } from '@/engine/ageUp';
import { Rng } from '@/engine/rng';
import { createLife, makePerson } from '@/engine/systems/character';
import type { GameState } from '@/engine/types';
import { migrateSave } from '@/store/migrations';

describe('an older save with a grown partner still marked Student (playtest 2, finding 22)', () => {
  it('loads unchanged and gives her a job and savings at the next birthday', () => {
    const base = createLife({ countryCode: 'US', gender: 'male' }, 21);
    const wife = { ...makePerson(new Rng(1), { kind: 'spouse', gender: 'female', age: 51, countryCode: 'US', playerAge: 17 }), occupation: 'Student', money: 0, love: 70, relationship: 80, marriedAtAge: 24 };
    const save: GameState = { ...base, year: base.character.birthYear + 52, character: { ...base.character, age: 52 }, people: { ...base.people, [wife.id]: wife } };
    // The save as it was written to storage, before people grew up.
    const loaded = migrateSave(JSON.parse(JSON.stringify(save)))!;
    expect(loaded).not.toBeNull();
    expect(loaded.people[wife.id]).toMatchObject({ occupation: 'Student', money: 0 });
    const next = ageUp(loaded);
    expect(next.people[wife.id]!.occupation).not.toBe('Student');
    expect(next.people[wife.id]!.money).toBeGreaterThan(0);
  });
});
