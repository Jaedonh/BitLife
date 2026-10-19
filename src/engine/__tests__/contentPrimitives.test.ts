import { evaluateCondition } from '../events/conditions';
import { applyEffects } from '../events/effects';
import { Rng } from '../rng';
import { createLife, makePerson } from '../systems/character';
import type { GameState } from '../types';

function at(countryCode: string, age: number, year: number): GameState {
  const s = createLife({ countryCode }, 7);
  return { ...s, year, character: { ...s.character, age } };
}

describe('conditions for era, climate and home', () => {
  it('year gates era content on the calendar year', () => {
    expect(evaluateCondition(at('US', 14, 1994), { year: { gte: 2010 } })).toBe(false);
    expect(evaluateCondition(at('US', 14, 2015), { year: { gte: 2010 } })).toBe(true);
  });

  it('climate and hemisphere come from the country', () => {
    expect(evaluateCondition(at('CA', 8, 2000), { climate: ['snowy'] })).toBe(true);
    expect(evaluateCondition(at('NG', 8, 2000), { climate: ['snowy', 'mild'] })).toBe(false);
    expect(evaluateCondition(at('BR', 8, 2000), { southern: true })).toBe(true);
    expect(evaluateCondition(at('GB', 8, 2000), { southern: false })).toBe(true);
  });

  it('atHome is true for a child and false for an adult with a place of their own', () => {
    expect(evaluateCondition(at('US', 10, 2000), { atHome: true })).toBe(true);
    expect(evaluateCondition(at('US', 40, 2000), { atHome: false })).toBe(true);
  });
});

describe('sinceRetired', () => {
  it('counts years from the retirement and is false before it or after going back to work', () => {
    const base = at('US', 70, 2040);
    expect(evaluateCondition(base, { sinceRetired: true, lte: 0 })).toBe(false);
    const entry = { title: 'Accountant', company: 'Granite & Sons', fromAge: 30, toAge: 67, salary: 90_000, reason: 'retired' as const };
    const retired: GameState = { ...base, career: { ...base.career, retired: true, job: null, history: [...base.career.history, entry] } };
    expect(evaluateCondition(retired, { sinceRetired: true, eq: 3 })).toBe(true);
    expect(evaluateCondition(retired, { sinceRetired: true, lte: 0 })).toBe(false);
  });
});

describe('switchEmployer', () => {
  it('keeps the job and rung at a new company for a raise, and records the old job as left', () => {
    const base = at('US', 30, 2010);
    const job = { defId: 'accountant', title: 'Accountant', company: 'Granite & Sons', salary: 60_000, level: 1, performance: 70, yearsHeld: 4, yearsAtLevel: 2, category: 'finance' as const, partTime: false, askedThisYear: false, workedHarderThisYear: false };
    const s: GameState = { ...base, career: { ...base.career, job } };
    const after = applyEffects(s, new Rng(3), [{ switchEmployer: true, raise: 0.2 }]);
    expect(after.career.job?.defId).toBe('accountant');
    expect(after.career.job?.level).toBe(1);
    expect(after.career.job?.company).not.toBe('Granite & Sons');
    expect(after.career.job?.salary).toBe(72_000);
    expect(after.career.job?.yearsHeld).toBe(0);
    expect(after.career.history.at(-1)).toMatchObject({ company: 'Granite & Sons', reason: 'left' });
    expect(after.counters.firings ?? 0).toBe(0);
  });

  it('does nothing without a job', () => {
    const s = at('US', 30, 2010);
    expect(applyEffects(s, new Rng(3), [{ switchEmployer: true }]).career).toEqual(s.career);
  });
});

describe('moveAway, relocate and promotion', () => {
  it('moveAway makes the bound person far away', () => {
    const base = at('US', 30, 2010);
    const friend = Object.values(base.people).find((p) => p.alive && p.kind !== 'pet') ?? null;
    expect(friend).not.toBeNull();
    const after = applyEffects(base, new Rng(1), [{ moveAway: true }], { personId: friend!.id });
    expect(after.people[friend!.id]!.farAway).toBe(true);
  });

  it('relocate changes the city, keeps the household and leaves friends and grandparents far away', () => {
    const base = at('US', 30, 2010);
    const f = makePerson(new Rng(5), { kind: 'friend', countryCode: 'US', playerAge: 30, age: 30 });
    const s: GameState = { ...base, people: { ...base.people, [f.id]: f } };
    const after = applyEffects(s, new Rng(2), [{ relocate: true }]);
    expect(after.character.city).not.toBe(base.character.city);
    expect(after.people[f.id]!.farAway).toBe(true);
    for (const p of Object.values(after.people)) if (p.kind === 'grandparent' && p.alive) expect(p.farAway).toBe(true);
    for (const p of Object.values(after.people)) if (p.kind === 'mother' || p.kind === 'father') expect(p.farAway).toBeUndefined();
  });

  it('promotion moves up one rung with a raise, and does nothing at the top', () => {
    const base = at('US', 30, 2010);
    const job = { defId: 'accountant', title: 'Accountant', company: 'Granite & Sons', salary: 68_000, level: 1, performance: 70, yearsHeld: 4, yearsAtLevel: 2, category: 'finance' as const, partTime: false, askedThisYear: false, workedHarderThisYear: false };
    const after = applyEffects({ ...base, career: { ...base.career, job } }, new Rng(3), [{ promotion: true }]);
    expect(after.career.job?.level).toBe(2);
    expect(after.career.job?.title).toBe('Senior Accountant');
    expect(after.career.job!.salary).toBeGreaterThan(68_000);
    const top = { ...job, level: 4, title: 'CFO' };
    const same = applyEffects({ ...base, career: { ...base.career, job: top } }, new Rng(3), [{ promotion: true }]);
    expect(same.career.job).toEqual(top);
  });
});

describe('newPerson occupation and layoffs from cards', () => {
  it('an adult made by a card has the occupation the text gives; a minor stays a student', () => {
    const base = at('US', 30, 2010);
    const adult = applyEffects(base, new Rng(4), [{ newPerson: { kind: 'friend', minAge: 30, maxAge: 40, occupation: 'Mechanic' } }]);
    expect(Object.values(adult.people).some((p) => p.kind === 'friend' && p.occupation === 'Mechanic')).toBe(true);
    const kid = at('US', 12, 2010);
    const minor = applyEffects(kid, new Rng(4), [{ newPerson: { kind: 'friend', occupation: 'Mechanic' } }]);
    expect(Object.values(minor.people).some((p) => p.kind === 'friend' && p.occupation === 'Mechanic')).toBe(false);
  });

  it('a layoff on a card is recorded as laid off and is not a firing', () => {
    const base = at('US', 30, 2010);
    const job = { defId: 'accountant', title: 'Accountant', company: 'Granite & Sons', salary: 68_000, level: 1, performance: 70, yearsHeld: 4, yearsAtLevel: 2, category: 'finance' as const, partTime: false, askedThisYear: false, workedHarderThisYear: false };
    const after = applyEffects({ ...base, career: { ...base.career, job } }, new Rng(3), [{ loseJob: true, reason: 'laidOff' }]);
    expect(after.career.job).toBeNull();
    expect(after.career.history.at(-1)?.reason).toBe('laidOff');
    expect(after.counters.firings ?? 0).toBe(0);
  });
});
