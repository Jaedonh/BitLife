import { evaluateCondition } from '../events/conditions';
import { applyEffects } from '../events/effects';
import { Rng } from '../rng';
import { createLife } from '../systems/character';
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
