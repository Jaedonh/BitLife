import { createLife } from '../systems/character';
import { STAT_IDS } from '../types';

describe('createLife', () => {
  it('is deterministic for a seed', () => {
    const a = createLife({}, 123);
    const b = createLife({}, 123);
    expect(a).toEqual(b);
  });

  it('generates a valid newborn with parents', () => {
    for (let seed = 1; seed < 300; seed++) {
      const s = createLife({}, seed);
      expect(s.character.age).toBe(0);
      for (const id of STAT_IDS) {
        expect(s.character.stats[id]).toBeGreaterThanOrEqual(0);
        expect(s.character.stats[id]).toBeLessThanOrEqual(100);
      }
      expect(s.character.stats.health).toBeGreaterThanOrEqual(80);
      expect(s.character.stats.happiness).toBeGreaterThanOrEqual(50);
      const people = Object.values(s.people);
      expect(people.some((p) => p.kind === 'mother')).toBe(true);
      expect(people.every((p) => p.age >= 1 || p.kind === 'sibling')).toBe(true);
      expect(s.log.length).toBeGreaterThanOrEqual(2);
      expect(s.year).toBe(s.character.birthYear);
    }
  });

  it('honours explicit options', () => {
    const s = createLife({ firstName: 'Ada', lastName: 'Lovelace', gender: 'female', countryCode: 'GB', customStats: { smarts: 99 } }, 5);
    expect(s.character.firstName).toBe('Ada');
    expect(s.character.lastName).toBe('Lovelace');
    expect(s.character.gender).toBe('female');
    expect(s.character.countryCode).toBe('GB');
    expect(s.character.stats.smarts).toBe(99);
  });

  it('falls back to a random country for an unknown code', () => {
    const s = createLife({ countryCode: 'ZZ' }, 9);
    expect(s.character.countryCode).not.toBe('ZZ');
  });
});
