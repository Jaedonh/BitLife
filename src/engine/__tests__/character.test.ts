import { ageUp } from '../ageUp';
import { makeRegistry } from '../events/select';
import { Rng } from '../rng';
import { checkInvariants } from '../simulate';
import { createLife, makePerson } from '../systems/character';
import { markDeath } from '../systems/death';
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

  it('an heir continues as the chosen child: identity, age, family and inheritance carry over', () => {
    let prev = createLife({ countryCode: 'US', firstName: 'Arthur', lastName: 'Penhaligon', gender: 'male' }, 31);
    const rng = new Rng(7);
    const stella = makePerson(rng, { kind: 'spouse', gender: 'female', age: 78, countryCode: 'US', playerAge: 80, money: 200_000 });
    stella.firstName = 'Stella';
    const emma = makePerson(rng, { kind: 'child', gender: 'female', age: 45, countryCode: 'US', lastName: 'Penhaligon', playerAge: 80 });
    emma.firstName = 'Emma';
    emma.otherParentId = stella.id;
    const liam = makePerson(rng, { kind: 'child', gender: 'male', age: 42, countryCode: 'US', lastName: 'Penhaligon', playerAge: 80 });
    liam.firstName = 'Liam';
    liam.otherParentId = stella.id;
    prev = { ...prev, character: { ...prev.character, age: 80 }, year: prev.character.birthYear + 80, people: { ...prev.people, [stella.id]: stella, [emma.id]: emma, [liam.id]: liam }, finances: { ...prev.finances, cash: 500_000 } };
    prev = markDeath(prev, 'old age');
    expect(prev.death?.netWorth).toBe(500_000);

    const s = createLife({ heir: { childId: emma.id, previous: prev } }, 99);
    expect(s.character.firstName).toBe('Emma');
    expect(s.character.lastName).toBe('Penhaligon');
    expect(s.character.gender).toBe('female');
    expect(s.character.countryCode).toBe('US');
    expect(s.character.city).toBe(prev.character.city);
    expect(s.character.age).toBe(45);
    expect(s.year).toBe(prev.year);
    expect(s.character.birthYear).toBe(prev.year - 45);
    expect(s.character.energyMax).toBe(4);
    expect(s.character.stats.smarts).toBe(emma.smarts);
    expect(s.character.stats.looks).toBe(emma.looks);
    expect(s.character.stats.health).toBe(emma.health);
    expect(s.generation).toBe(2);
    expect(s.flags).toEqual({});
    expect(s.education.stage).toBe('done');
    expect(s.education.degrees).toContain('high_school');
    // 80% of the estate split between the two children, plus her own savings.
    expect(s.finances.cash).toBe(emma.money + 200_000);
    const people = Object.values(s.people);
    const father = people.find((p) => p.kind === 'father')!;
    const mother = people.find((p) => p.kind === 'mother')!;
    const sibling = people.find((p) => p.kind === 'sibling')!;
    expect(father.firstName).toBe('Arthur');
    expect(father.alive).toBe(false);
    expect(father.deathAge).toBe(80);
    expect(mother.firstName).toBe('Stella');
    expect(mother.age).toBe(78);
    expect(mother.alive).toBe(true);
    expect(sibling.firstName).toBe('Liam');
    expect(sibling.age).toBe(42);
    expect(people.every((p) => p.memory.lastInteractionAge === 45)).toBe(true);
    expect(s.log[0]?.text).toBe(`${prev.year}: Age 45`);
    expect(s.log.some((l) => l.text.includes('Emma Penhaligon, 45'))).toBe(true);
    expect(s.log.some((l) => l.text.includes('inherited'))).toBe(true);
    checkInvariants(s);
    const next = ageUp(s, makeRegistry([]));
    expect(next.character.age).toBe(46);
    expect(next.year).toBe(prev.year + 1);
    checkInvariants(next);
  });

  it('a school-age heir is enrolled in the right stage', () => {
    let prev = createLife({ countryCode: 'US', gender: 'female' }, 32);
    const kid = makePerson(new Rng(3), { kind: 'child', gender: 'male', age: 9, countryCode: 'US', lastName: prev.character.lastName, playerAge: 40 });
    prev = { ...prev, character: { ...prev.character, age: 40 }, year: prev.character.birthYear + 40, people: { ...prev.people, [kid.id]: kid } };
    prev = markDeath(prev, 'a car accident');
    const s = createLife({ heir: { childId: kid.id, previous: prev } }, 5);
    expect(s.character.age).toBe(9);
    expect(s.character.energyMax).toBe(2);
    expect(s.education.enrolled).toBe(true);
    expect(s.education.stage).toBe('primary');
    expect(s.finances.cash).toBe(0);
    const next = ageUp(ageUp(s, makeRegistry([])), makeRegistry([]));
    expect(next.education.stage).toBe('middle');
  });
});
