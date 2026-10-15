import { getCountry } from '@/data/countries';
import { ageUp } from '../ageUp';
import { applyAction } from '../actions';
import { makeRegistry } from '../events/select';
import { createLife } from '../systems/character';
import { canBuy, yearlyMortgagePayment } from '../systems/assets';
import { meetsRequirements, rollListings } from '../systems/careers';
import { JOB_BY_ID } from '@/data/jobs';
import { Rng } from '../rng';
import type { GameState } from '../types';
import { netWorth } from '../util';

const noEvents = makeRegistry([]);

function ageTo(state: GameState, age: number, each?: (s: GameState) => GameState): GameState {
  let s = state;
  while (s.alive && s.character.age < age) {
    s = ageUp(s, noEvents);
    if (each && s.alive) s = each(s);
  }
  return s;
}

function healthy(s: GameState): GameState {
  // keep test characters alive and sharp so outcomes are about the system under test
  return { ...s, character: { ...s.character, stats: { ...s.character.stats, health: 95, smarts: 90 } }, health: { ...s.health, illnesses: [] } };
}

describe('education', () => {
  it('enrols at the country start age, graduates high school, and can take a degree', () => {
    let s = createLife({ countryCode: 'US', customStats: { smarts: 90 } }, 11);
    const start = getCountry('US').schoolStartAge;
    s = ageTo(s, start, healthy);
    expect(s.education.enrolled).toBe(true);
    expect(s.education.stage).toBe('primary');
    s = ageTo(s, 18, (x) => applyAction(healthy(x), { type: 'study' }));
    expect(s.education.degrees).toContain('high_school');
    expect(s.education.enrolled).toBe(false);
    s = applyAction(s, { type: 'enroll', major: 'computer_science' });
    expect(s.education.enrolled).toBe(true);
    expect(s.education.stage).toBe('university');
    s = ageTo(s, 22, (x) => applyAction(healthy(x), { type: 'study' }));
    expect(s.education.degrees).toContain('bachelor:computer_science');
  });

  it('rejects majors above the smarts threshold', () => {
    let s = createLife({ countryCode: 'US', customStats: { smarts: 10 } }, 12);
    s = { ...s, education: { ...s.education, degrees: ['high_school'], stage: 'done' }, character: { ...s.character, age: 18 } };
    const before = s.education.enrolled;
    s = applyAction(s, { type: 'enroll', major: 'physics' });
    expect(s.education.enrolled).toBe(before);
    expect(s.lastResult?.kind).toBe('bad');
  });
});

describe('careers', () => {
  it('requirements gate jobs by education and record', () => {
    let s = createLife({ countryCode: 'US', customStats: { smarts: 80 } }, 13);
    s = { ...s, character: { ...s.character, age: 25 } };
    expect(meetsRequirements(s, JOB_BY_ID.janitor!).ok).toBe(true);
    expect(meetsRequirements(s, JOB_BY_ID.software_dev!).ok).toBe(false);
    s = { ...s, education: { ...s.education, degrees: ['high_school', 'bachelor:computer_science'] } };
    expect(meetsRequirements(s, JOB_BY_ID.software_dev!).ok).toBe(true);
    s = { ...s, crime: { ...s.crime, record: true } };
    expect(meetsRequirements(s, JOB_BY_ID.police!).ok).toBe(false);
  });

  it('a hired character earns a salary and can be promoted over time', () => {
    let s = createLife({ countryCode: 'US', customStats: { smarts: 95, looks: 80 } }, 14);
    s = { ...s, character: { ...s.character, age: 24 }, year: s.character.birthYear + 24, education: { ...s.education, degrees: ['high_school'], stage: 'done' } };
    s = rollListings(s, new Rng(1));
    const listing = s.career.listings.find((l) => !l.partTime && meetsRequirements(s, JOB_BY_ID[l.defId]!).ok)!;
    // apply until hired (interview odds are probabilistic)
    for (let i = 0; i < 10 && !s.career.job; i++) {
      s = applyAction(s, { type: 'applyJob', listingId: listing.id });
      if (!s.career.job) s = { ...s, career: { ...s.career, listings: [listing, ...s.career.listings] } };
    }
    expect(s.career.job?.title).toBe(listing.title);
    const salary0 = s.career.job!.salary;
    s = ageTo(s, 40, (x) => applyAction(healthy(x), { type: 'workHarder' }));
    expect(s.counters.yearsEmployed).toBeGreaterThan(0);
    expect(s.counters.peakNetWorth).toBeGreaterThan(0);
    const job = s.career.job;
    const hist = s.career.history;
    // either still employed with a higher salary, or promoted/fired/laid off (logged in history)
    expect((job && job.salary > salary0) || hist.length > 0 || s.counters.promotions > 0).toBe(true);
  });
});

describe('finance and assets', () => {
  it('mortgage maths and purchase gating', () => {
    expect(yearlyMortgagePayment(100_000)).toBeGreaterThan(7_500);
    expect(yearlyMortgagePayment(100_000)).toBeLessThan(8_500);
    let s = createLife({ countryCode: 'US' }, 15);
    s = { ...s, character: { ...s.character, age: 30 }, finances: { ...s.finances, cash: 50_000, lastYear: { ...s.finances.lastYear, income: 90_000 } } };
    expect(canBuy(s, 'studio', 'cash').ok).toBe(false);
    expect(canBuy(s, 'studio', 'mortgage').ok).toBe(true);
    s = applyAction(s, { type: 'buyAsset', defId: 'studio', financing: 'mortgage' });
    expect(s.assets).toHaveLength(1);
    expect(s.assets[0]!.mortgage?.remaining).toBe(96_000);
    expect(s.finances.cash).toBe(26_000);
    expect(netWorth(s)).toBeGreaterThan(20_000);
    s = applyAction(s, { type: 'sellAsset', assetId: s.assets[0]!.id });
    expect(s.assets).toHaveLength(0);
  });

  it('shortfalls become debt and debt is paid down', () => {
    let s = createLife({ countryCode: 'US' }, 16);
    s = { ...s, character: { ...s.character, age: 30 }, year: s.character.birthYear + 30, finances: { ...s.finances, cash: 0 } };
    s = ageUp(s, noEvents);
    expect(s.finances.cash).toBeGreaterThanOrEqual(0);
    expect(s.finances.debt).toBeGreaterThan(0);
    s = { ...s, finances: { ...s.finances, cash: 1_000_000 } };
    s = applyAction(s, { type: 'payDebt', amount: 1_000_000 });
    expect(s.finances.debt).toBe(0);
  });
});

describe('relationships', () => {
  it('proposal, marriage, child, divorce', () => {
    let s = createLife({ countryCode: 'US', gender: 'male' }, 17);
    s = { ...s, character: { ...s.character, age: 28, energy: 3, energyMax: 3 }, finances: { ...s.finances, cash: 100_000 } };
    const rng = new Rng(3);
    const lover = { ...Object.values(s.people)[0]!, id: 'p_lover', kind: 'lover' as const, gender: 'female' as const, age: 27, alive: true, relationship: 90, love: 95 };
    s = { ...s, people: { ...s.people, [lover.id]: lover } };
    let married = false;
    for (let i = 0; i < 8 && !married; i++) {
      s = applyAction({ ...s, actionsThisYear: {}, character: { ...s.character, energy: 3 }, rng: new Rng(rng.int(1, 1e9)).snapshot() }, { type: 'interact', personId: lover.id, interaction: 'propose' });
      married = s.people[lover.id]!.kind === 'spouse';
    }
    expect(married).toBe(true);
    expect(s.counters.marriages).toBe(1);
    let child = false;
    for (let i = 0; i < 12 && !child; i++) {
      s = applyAction({ ...s, actionsThisYear: {}, character: { ...s.character, energy: 3 }, rng: new Rng(rng.int(1, 1e9)).snapshot() }, { type: 'interact', personId: lover.id, interaction: 'haveChild' });
      child = Object.values(s.people).some((p) => p.kind === 'child');
    }
    expect(child).toBe(true);
    s = applyAction({ ...s, actionsThisYear: {}, character: { ...s.character, energy: 3 } }, { type: 'interact', personId: lover.id, interaction: 'divorce' });
    expect(s.people[lover.id]!.kind).toBe('ex');
    expect(s.counters.divorces).toBe(1);
  });
});
