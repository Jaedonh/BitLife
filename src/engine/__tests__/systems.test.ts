import { getCountry } from '@/data/countries';
import { ageUp } from '../ageUp';
import { applyAction } from '../actions';
import { evaluateCondition } from '../events/conditions';
import { makeRegistry } from '../events/select';
import { createLife, emptyMemory } from '../systems/character';
import { canBuy, yearlyMortgagePayment } from '../systems/assets';
import { meetsRequirements, PART_TIME_LIVING_WAGE, rollListings, salaryCap } from '../systems/careers';
import { lifestyleFactor, SPENDING, yearlyFinance } from '../systems/finance';
import { awardRibbon } from '../systems/ribbons';
import { JOB_BY_ID } from '@/data/jobs';
import { Rng } from '../rng';
import type { GameState, Job, Person } from '../types';
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

  it('a retiree who takes a new job is paid that job, and the pension returns when it ends', () => {
    let s = createLife({ countryCode: 'US', customStats: { smarts: 95, looks: 80 } }, 22);
    s = healthy({ ...s, character: { ...s.character, age: 60 }, year: s.character.birthYear + 60, education: { ...s.education, degrees: ['high_school'], stage: 'done' } });
    const job: Job = { defId: 'janitor', title: 'Facilities Supervisor', company: 'Acme', salary: 90000, level: 2, performance: 90, yearsHeld: 10, yearsAtLevel: 5, category: 'service', partTime: false, askedThisYear: false, workedHarderThisYear: false };
    s = { ...s, career: { ...s.career, job } };
    s = applyAction(s, { type: 'retire' });
    expect(s.career.retired).toBe(true);
    s = healthy(ageUp(s, noEvents));
    expect(s.finances.lastYear.salary).toBe(31_500); // 35% of the $90k they retired from
    // Comes out of retirement for a cheaper gig.
    const listing = { id: 'l_test', defId: 'musician', title: 'Session Musician', company: 'Blue Note', salary: 24_000, category: 'creative' as const, partTime: false };
    for (let i = 0; i < 20 && !s.career.job; i++) s = applyAction({ ...s, career: { ...s.career, listings: [listing] } }, { type: 'applyJob', listingId: 'l_test' });
    expect(s.career.job?.salary).toBe(24_000);
    s = healthy(ageUp(s, noEvents));
    expect(s.career.job).not.toBeNull();
    expect(s.finances.lastYear.salary).toBe(s.career.job!.salary); // the job's pay, not the pension
    s = applyAction(s, { type: 'quitJob' });
    s = healthy(ageUp(s, noEvents));
    expect(s.finances.lastYear.salary).toBe(31_500); // the pension is still based on the career they retired from
  });

  it('raises and promotions never push pay past the rung ceiling', () => {
    let s = createLife({ countryCode: 'US', customStats: { smarts: 95 } }, 23);
    s = healthy({ ...s, character: { ...s.character, age: 25 }, year: s.character.birthYear + 25, education: { ...s.education, degrees: ['high_school'], stage: 'done' } });
    const job: Job = { defId: 'janitor', title: 'Janitor', company: 'Acme', salary: 26000, level: 0, performance: 90, yearsHeld: 1, yearsAtLevel: 1, category: 'service', partTime: false, askedThisYear: false, workedHarderThisYear: false };
    s = { ...s, career: { ...s.career, job } };
    let maxSalary = job.salary;
    s = ageTo(s, 60, (x) => {
      const j = x.career.job;
      if (j) {
        expect(j.salary).toBeLessThanOrEqual(salaryCap(x, JOB_BY_ID[j.defId]!, j.level));
        maxSalary = Math.max(maxSalary, j.salary);
      }
      return applyAction(applyAction(healthy(x), { type: 'workHarder' }), { type: 'askRaise' });
    });
    expect(maxSalary).toBeGreaterThan(job.salary);
    expect(maxSalary).toBeLessThanOrEqual(salaryCap(s, JOB_BY_ID.janitor!, JOB_BY_ID.janitor!.ladder.length - 1));
  });

  it('fame comes from rungs above entry level and fades out of the spotlight', () => {
    let s = createLife({ countryCode: 'US', customStats: { smarts: 95 } }, 24);
    s = healthy({ ...s, character: { ...s.character, age: 25 }, year: s.character.birthYear + 25 });
    const entry: Job = { defId: 'musician', title: 'Session Musician', company: 'Acme', salary: 22000, level: 0, performance: 90, yearsHeld: 10, yearsAtLevel: 5, category: 'creative', partTime: false, askedThisYear: false, workedHarderThisYear: false };
    s = healthy(ageUp({ ...s, career: { ...s.career, job: entry } }, noEvents));
    expect(s.character.fame).toBe(0);
    s = healthy(ageUp({ ...s, career: { ...s.career, job: { ...entry, title: 'Touring Musician', level: 1, performance: 90 } } }, noEvents));
    expect(s.career.job).not.toBeNull();
    expect(s.character.fame).toBe(8);
    s = healthy(ageUp({ ...s, career: { ...s.career, job: null } }, noEvents));
    expect(s.character.fame).toBe(5);
    // The life's peak is remembered for the Famous ribbon even after fame fades.
    expect(s.flags.peakFame).toBe(8);
  });

  it('a student job kept past 24 goes full hours and pays a living wage', () => {
    let s = createLife({ countryCode: 'US', customStats: { smarts: 95 } }, 27);
    s = healthy({ ...s, character: { ...s.character, age: 20 }, year: s.character.birthYear + 20 });
    const barista = JOB_BY_ID.pt_barista!;
    const job: Job = { defId: 'pt_barista', title: 'Barista', company: 'Bean There', salary: 12_500, level: 0, performance: 90, yearsHeld: 4, yearsAtLevel: 4, category: 'service', partTime: true, askedThisYear: false, workedHarderThisYear: false };
    s = { ...s, career: { ...s.career, job } };
    // A student is capped at 125% of the $12k base like any rung.
    expect(salaryCap(s, barista, 0)).toBe(15_000);
    s = healthy(ageUp(s, noEvents));
    expect(s.career.job!.salary).toBeLessThanOrEqual(15_000);
    // Past 24 the same job pays at least an entry-level full-time wage, and raises can add 25% on top.
    s = { ...s, character: { ...s.character, age: 25 }, year: s.character.birthYear + 25 };
    s = healthy(ageUp(s, noEvents));
    expect(s.career.job?.defId).toBe('pt_barista');
    expect(s.career.job!.salary).toBeGreaterThanOrEqual(PART_TIME_LIVING_WAGE);
    expect(salaryCap(s, barista, 0)).toBe(PART_TIME_LIVING_WAGE * 1.25);
    expect(s.log.some((l) => l.text.includes('full hours'))).toBe(true);
    // Country-scaled like every other wage.
    const fr = createLife({ countryCode: 'FR' }, 27);
    expect(salaryCap({ ...fr, character: { ...fr.character, age: 30 } }, barista, 0)).toBe(Math.round(PART_TIME_LIVING_WAGE * 0.8 * 1.25));
  });

  it('a star who retires keeps the Famous ribbon although current fame fades', () => {
    const base = createLife({ countryCode: 'US' }, 26);
    let s = { ...base, character: { ...base.character, age: 91, fame: 24 }, flags: { ...base.flags, peakFame: 100 } };
    expect(awardRibbon(s).id).toBe('famous');
    s = { ...s, flags: { ...s.flags, peakFame: 60 } };
    expect(awardRibbon(s).id).not.toBe('famous');
  });
});

describe('ribbons', () => {
  it('a child who dies is remembered as Gone Too Soon, never Wasted', () => {
    const base = createLife({ countryCode: 'US' }, 27);
    expect(awardRibbon({ ...base, character: { ...base.character, age: 3 } }).id).toBe('gone_too_soon');
    expect(awardRibbon({ ...base, character: { ...base.character, age: 15 } }).id).toBe('gone_too_soon');
    expect(awardRibbon({ ...base, character: { ...base.character, age: 20 } }).id).toBe('wasted');
  });

  it('money ribbons scale with the country, Survivor needs 15 illnesses and Centenarian outranks it', () => {
    // Adults: a child's death always gets Gone Too Soon, whatever the money.
    const adult = (s: ReturnType<typeof createLife>) => ({ ...s, character: { ...s.character, age: 70 } });
    const us = adult(createLife({ countryCode: 'US' }, 25));
    const ng = adult(createLife({ countryCode: 'NG' }, 25));
    expect(awardRibbon({ ...us, finances: { ...us.finances, cash: 150_000 } }).id).not.toBe('rich');
    expect(awardRibbon({ ...ng, finances: { ...ng.finances, cash: 150_000 } }).id).toBe('rich');
    const old = { ...us, character: { ...us.character, age: 100 }, counters: { ...us.counters, illnesses: 14 } };
    expect(awardRibbon(old).id).toBe('centenarian');
    expect(awardRibbon({ ...old, character: { ...old.character, age: 80 } }).id).not.toBe('survivor');
    expect(awardRibbon({ ...old, character: { ...old.character, age: 80 }, counters: { ...old.counters, illnesses: 15 } }).id).toBe('survivor');
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

  it('investment returns stay in the balance and are not paid out as cash', () => {
    let s = createLife({ countryCode: 'US' }, 21);
    s = healthy({ ...s, character: { ...s.character, age: 30 }, year: s.character.birthYear + 30, finances: { ...s.finances, cash: 150_000 } });
    s = applyAction(s, { type: 'invest', kind: 'savings', amount: 100_000 });
    expect(s.finances.investments[0]?.amount).toBe(100_000);
    const cashBefore = s.finances.cash;
    s = ageUp(s, noEvents);
    expect(s.finances.investments[0]?.amount).toBe(102_000);
    expect(s.finances.lastYear.passive).toBe(0);
    expect(s.finances.lastYear.income).toBe(0);
    expect(s.finances.cash).toBe(cashBefore - s.finances.lastYear.expenses);
  });

  /** A 30-year-old renter on a $50k US salary with no kids, traits or assets: income $40,400, housing $9k, full lifestyle $11,400. */
  function worker(cash: number, debt: number, countryCode = 'US'): GameState {
    const s = createLife({ countryCode }, 28);
    const job: Job = { defId: 'graphic_designer', title: 'Designer', company: 'Acme', salary: 50_000, level: 0, performance: 60, yearsHeld: 3, yearsAtLevel: 3, category: 'creative', partTime: false, askedThisYear: false, workedHarderThisYear: false };
    return { ...s, character: { ...s.character, age: 30, traits: [] }, year: s.character.birthYear + 30, career: { ...s.career, job }, finances: { ...s.finances, cash, debt } };
  }

  it('lifestyle spending shrinks while in debt or short of a year of expenses', () => {
    expect(lifestyleFactor(50_000, 1, 20_000)).toBe(0);
    expect(lifestyleFactor(0, 0, 20_000)).toBe(0);
    expect(lifestyleFactor(10_000, 0, 20_000)).toBe(0.5);
    expect(lifestyleFactor(80_000, 0, 20_000)).toBe(1);
    // Cushioned: housing $9k + lifestyle 30% of (50k - 12k).
    expect(yearlyFinance(worker(100_000, 0), new Rng(1)).finances.lastYear.expenses).toBe(9_000 + 11_400);
    // Half a year of expenses saved: half the extras.
    expect(yearlyFinance(worker(10_200, 0), new Rng(1)).finances.lastYear.expenses).toBe(9_000 + 5_700);
  });

  it('a worker coming out of a jobless stretch with debt pays it down instead of spiralling', () => {
    // The traced case: a French designer on 50k with 140k of debt. No extras while in debt, so the surplus beats the interest.
    let s = worker(0, 140_000, 'FR');
    s = yearlyFinance(s, new Rng(1));
    // Income 50k - 13.2k tax = 36.8k; expenses 7.2k housing + 28k debt payment (20%), no lifestyle.
    expect(s.finances.lastYear.expenses).toBe(7_200 + 28_000);
    expect(s.finances.debt).toBe(140_000 + 21_000 - 28_000);
    expect(s.finances.cash).toBe(1_600);
    let debt = s.finances.debt;
    for (let i = 0; i < 5; i++) {
      s = yearlyFinance({ ...s, finances: { ...s.finances, cash: 0 } }, new Rng(1));
      expect(s.finances.debt).toBeLessThan(debt);
      debt = s.finances.debt;
    }
  });

  it('savings above the comfortable level are spent on a richer life, so wealth plateaus', () => {
    const comfortable = SPENDING.comfortable;
    // Below the threshold there is no wealth effect: $20k a year is saved.
    const modest = yearlyFinance(worker(comfortable - 50_000, 0), new Rng(1));
    expect(modest.finances.lastYear.expenses).toBe(20_400);
    // $100k above it: 10% of the excess goes on lifestyle.
    const comfy = yearlyFinance(worker(comfortable + 100_000, 0), new Rng(1));
    expect(comfy.finances.lastYear.expenses).toBe(20_400 + 100_000 * SPENDING.wealthShare);
    // Far above it the spending is capped at the year's spare income: cash stops growing but never falls.
    const rich = yearlyFinance(worker(3_000_000, 0), new Rng(1));
    expect(rich.finances.lastYear.expenses).toBe(rich.finances.lastYear.income);
    expect(rich.finances.cash).toBe(3_000_000);
    // With no income it never eats into savings or creates debt.
    const jobless = worker(3_000_000, 0);
    const idle = yearlyFinance({ ...jobless, career: { ...jobless.career, job: null } }, new Rng(1));
    expect(idle.finances.lastYear.expenses).toBe(9_000);
    expect(idle.finances.debt).toBe(0);
  });

  it('a crypto crash never turns an unrealised loss into debt', () => {
    for (let seed = 2; seed < 32; seed++) {
      let s = createLife({ countryCode: 'US' }, seed);
      s = healthy({ ...s, character: { ...s.character, age: 30 }, year: s.character.birthYear + 30, finances: { ...s.finances, cash: 100_000 } });
      s = applyAction(s, { type: 'invest', kind: 'crypto', amount: 100_000 });
      s = ageUp(s, noEvents);
      expect(s.finances.lastYear.passive).toBe(0);
      // Only the year's living expenses can create debt, never the investment swing.
      expect(s.finances.debt).toBeLessThanOrEqual(s.finances.lastYear.expenses);
    }
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

  it('people are only neglected in years without an interaction', () => {
    let s = createLife({ countryCode: 'US', gender: 'male' }, 26);
    s = healthy({ ...s, character: { ...s.character, age: 30, energy: 4, energyMax: 4 }, year: s.character.birthYear + 30 });
    const spouse: Person = { ...Object.values(s.people)[0]!, id: 'p_spouse', kind: 'spouse', gender: 'female', age: 29, alive: true, health: 95, relationship: 75, love: 64, memory: emptyMemory(30) };
    s = { ...s, people: { ...s.people, [spouse.id]: spouse } };
    s = applyAction(s, { type: 'interact', personId: spouse.id, interaction: 'spendTime' });
    const rel = s.people[spouse.id]!.relationship;
    const love = s.people[spouse.id]!.love!;
    s = healthy(ageUp(s, noEvents));
    expect(s.people[spouse.id]!.memory.yearsNeglected).toBe(0);
    expect(s.people[spouse.id]!.relationship).toBe(rel);
    expect(s.people[spouse.id]!.love).toBe(love);
    s = healthy(ageUp(s, noEvents));
    expect(s.people[spouse.id]!.memory.yearsNeglected).toBe(1);
    expect(s.people[spouse.id]!.relationship).toBe(rel - 4);
    expect(s.people[spouse.id]!.love).toBe(love - 5);
  });
});

describe('asset conditions', () => {
  const withAsset = (defId: string, kind: 'car' | 'house'): GameState => {
    const s = createLife({}, 11);
    return { ...s, assets: [{ id: 'a1', defId, kind, name: defId, value: 1, purchasePrice: 1, condition: 100, yearlyUpkeep: 0, mortgage: null, boughtAtAge: 0 }] };
  };

  it('ownsAssetId tells a real car from a bicycle, which is also of kind car', () => {
    expect(evaluateCondition(withAsset('bike', 'car'), { ownsAsset: 'car' })).toBe(true);
    expect(evaluateCondition(withAsset('bike', 'car'), { ownsAssetId: ['sedan', 'old_hatchback'] })).toBe(false);
    expect(evaluateCondition(withAsset('sedan', 'car'), { ownsAssetId: ['sedan', 'old_hatchback'] })).toBe(true);
    expect(evaluateCondition(withAsset('condo', 'house'), { noAsset: 'house' })).toBe(false);
  });

  it('jobId matches a specific job and sinceEvent measures years since an event fired', () => {
    const s = createLife({}, 13);
    const at30 = { ...s, character: { ...s.character, age: 30 }, firedEvents: { ad_burnout: 27 } };
    expect(evaluateCondition(at30, { sinceEvent: 'ad_burnout', gte: 3, lte: 3 })).toBe(true);
    expect(evaluateCondition(at30, { sinceEvent: 'ad_burnout', lte: 2 })).toBe(false);
    expect(evaluateCondition(at30, { sinceEvent: 'never_fired', gte: 0 })).toBe(false);
    expect(evaluateCondition(s, { jobId: ['pilot'] })).toBe(false);
  });

  it('count compares a lifetime counter', () => {
    const s = createLife({}, 12);
    expect(evaluateCondition(s, { count: 'divorces', gte: 1 })).toBe(false);
    expect(evaluateCondition({ ...s, counters: { ...s.counters, divorces: 2 } }, { count: 'divorces', gte: 1 })).toBe(true);
  });
});
