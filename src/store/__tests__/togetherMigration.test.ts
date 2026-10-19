import { ageUp } from '@/engine/ageUp';
import { makeRegistry } from '@/engine/events/select';
import { Rng } from '@/engine/rng';
import { createLife, makePerson } from '@/engine/systems/character';
import type { GameState } from '@/engine/types';
import { migrateSave } from '@/store/migrations';

describe('an older save with no record of years together or of partners (playtest 3)', () => {
  it('loads unchanged, and the next birthday starts both records', () => {
    const base = createLife({ countryCode: 'US', gender: 'male' }, 21);
    const wife = { ...makePerson(new Rng(1), { kind: 'spouse', gender: 'female', age: 51, countryCode: 'US', playerAge: 40 }), love: 90, relationship: 80, marriedAtAge: 44 };
    const save: GameState = { ...base, year: base.character.birthYear + 52, character: { ...base.character, age: 52 }, people: { [wife.id]: wife } };
    const raw = JSON.parse(JSON.stringify(save));
    // The shape older versions wrote: neither field exists.
    expect(raw.people[wife.id].memory.togetherUntil).toBeUndefined();
    expect(raw.character.partnerYears).toBeUndefined();
    const loaded = migrateSave(raw)!;
    expect(loaded).toEqual(save);
    const next = ageUp({ ...loaded, pendingEvent: null }, makeRegistry([]));
    expect(next.people[wife.id]).toMatchObject({ kind: 'spouse', alive: true, memory: { togetherUntil: 53 } });
    expect(next.character.partnerYears).toEqual({ same: 0, other: 1 });
  });
});
