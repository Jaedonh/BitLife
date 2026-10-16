import { getCountry } from '@/data/countries';
import { ageUp } from '../ageUp';
import { applyAction } from '../actions';
import { makeRegistry } from '../events/select';
import { createLife, emptyMemory } from '../systems/character';
import { canBuy, yearlyMortgagePayment } from '../systems/assets';
import { meetsRequirements, rollListings, salaryCap } from '../systems/careers';
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

  it('a star who retires keeps the Famous ribbon although current fame fades', () => {
    const base = createLife({ countryCode: 'US' }, 26);
    let s = { ...base, character: { ...base.character, age: 91, fame: 24 }, flags: { ...base.flags, peakFame: 100 } };
    expect(awardRibbon(s).id).toBe('famous');
    s = { ...s, flags: { ...s.flags, peakFame: 60 } };
    expect(awardRibbon(s).id).not.toBe('famous');
  });
});

describe('ribbons', () => {
  it('money ribbons scale with the country, Survivor needs 15 illnesses and Centenarian outranks it', () => {
    const us = createLife({ countryCode: 'US' }, 25);
    const ng = createLife({ countryCode: 'NG' }, 25);
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
