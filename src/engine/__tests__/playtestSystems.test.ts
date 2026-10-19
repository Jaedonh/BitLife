/**
 * Fixes from the final playtest (systems): the debt-collector line, layoffs, detention wording,
 * parents paying tuition, the obituary's degree and retiring twice.
 */
import { ACHIEVEMENT_BY_ID } from '@/data/achievements';
import { HUSTLES } from '@/data/hustles';
import { JOB_BY_ID } from '@/data/jobs';
import { ageUp } from '../ageUp';
import { applyAction } from '../actions';
import { evaluateCondition } from '../events/conditions';
import { makeRegistry } from '../events/select';
import { scaleMoney } from '../events/text';
import { Rng } from '../rng';
import { canBuy } from '../systems/assets';
import { hustleBlocker, layOff, listingsBlocker, meetsRequirements, yearlyCareer } from '../systems/careers';
import { createLife } from '../systems/character';
import { buildObituary, highestDegree } from '../systems/death';
import { enroll, enrollBlocker } from '../systems/education';
import { DEBT_CALLS, yearlyFinance } from '../systems/finance';
import type { GameState, Job } from '../types';

const noEvents = makeRegistry([]);
const NONE = { ribbons: [], countries: [], lives: 0 };

const job = (patch: Partial<Job> = {}): Job => ({
  defId: 'accountant',
  title: 'Junior Accountant',
  company: 'Granite & Sons',
  salary: 50_000,
  level: 0,
  performance: 60,
  yearsHeld: 3,
  yearsAtLevel: 3,
  category: 'office',
  partTime: false,
  askedThisYear: false,
  workedHarderThisYear: false,
  ...patch,
});

const adult = (age: number, seed = 3, countryCode = 'US'): GameState => {
  const s = createLife({ countryCode }, seed);
  return { ...s, character: { ...s.character, age }, year: s.character.birthYear + age };
};

describe('the debt-collector line', () => {
  const ALL = new Set<string>([DEBT_CALLS.first, ...DEBT_CALLS.again, ...DEBT_CALLS.reminders]);
  /** One finance pass a year at ages from..to with no income and heavy debt. */
  function jobless(s: GameState, from: number, to: number): GameState {
    for (let age = from; age <= to; age++) {
      s = { ...s, character: { ...s.character, age }, finances: { ...s.finances, cash: 0, debt: Math.max(s.finances.debt, scaleMoney(s, 100_000)) } };
      s = yearlyFinance(s, new Rng(age));
    }
    return s;
  }
  const lines = (s: GameState) => s.log.filter((l) => ALL.has(l.text));

  it('is written when the trouble starts, then only every few years in new words', () => {
    const before = adult(30);
    const s = jobless(before, 30, 50);
    const written = lines(s);
    expect(written.map((l) => l.age)).toEqual([30, 35, 40, 45, 50]);
    expect(written[0]!.text).toBe(DEBT_CALLS.first);
    expect(new Set(written.map((l) => l.text)).size).toBe(written.length);
    // The stress itself is felt every year, written or not.
    const calm = { ...s, character: { ...s.character, age: 51, stats: { ...s.character.stats, happiness: 50 } }, finances: { ...s.finances, cash: 0, debt: scaleMoney(s, 100_000) } };
    const one = yearlyFinance(calm, new Rng(1));
    expect(lines(one)).toHaveLength(written.length);
    expect(one.character.stats.happiness).toBe(46);
  });

  it('a later stretch is news again, and says it is happening again', () => {
    let s = jobless(adult(30), 30, 32);
    // Two years with a job and the debt paid off.
    s = { ...s, finances: { ...s.finances, debt: 0, cash: 5_000 } };
    for (const age of [33, 34]) s = yearlyFinance({ ...s, character: { ...s.character, age }, career: { ...s.career, job: job() } }, new Rng(age));
    s = { ...s, career: { ...s.career, job: null } };
    s = jobless(s, 35, 36);
    s = { ...s, finances: { ...s.finances, debt: 0 } };
    s = jobless(s, 38, 38);
    const written = lines(s);
    expect(written.map((l) => l.age)).toEqual([30, 35, 38]);
    expect(written.map((l) => l.text)).toEqual([DEBT_CALLS.first, DEBT_CALLS.again[0], DEBT_CALLS.again[1]]);
  });

  it('never repeats a year in a played life', () => {
    let s = createLife({ countryCode: 'US' }, 8);
    while (s.alive) s = ageUp(s, noEvents);
    const ages = lines(s).map((l) => l.age);
    for (let i = 1; i < ages.length; i++) expect(ages[i]! - ages[i - 1]!).toBeGreaterThan(1);
  });

  it('a second bankruptcy says so', () => {
    const broke = (s: GameState): GameState => yearlyFinance({ ...s, finances: { ...s.finances, cash: 0, debt: scaleMoney(s, 600_000) } }, new Rng(2));
    const once = broke(adult(40));
    expect(once.log.at(-1)?.text).toBe('I declared bankruptcy. The court took almost everything.');
    const twice = broke({ ...once, character: { ...once.character, age: 50 } });
    expect(twice.log.at(-1)?.text).toBe('I declared bankruptcy again. Once more, the court took almost everything.');
  });

  it('is not written behind bars, where the stress still counts, and is news again once I am out', () => {
    let s = jobless(adult(30), 30, 34);
    expect(lines(s).map((l) => l.age)).toEqual([30]);
    // Two years inside, when a reminder would be due: no calls reach a cell, but the debt still weighs on me.
    const inside = (age: number, t: GameState): GameState => ({ ...t, crime: { ...t.crime, inPrison: true, sentenceYearsLeft: 1 }, character: { ...t.character, age, stats: { ...t.character.stats, happiness: 50 } } });
    for (const age of [35, 36]) {
      s = yearlyFinance({ ...inside(age, s), finances: { ...s.finances, cash: 0, debt: scaleMoney(s, 100_000) } }, new Rng(age));
      expect(s.character.stats.happiness).toBe(46);
    }
    expect(lines(s)).toHaveLength(1);
    // Out again and still broke: the stretch outside starts over.
    s = jobless({ ...s, crime: { ...s.crime, inPrison: false, sentenceYearsLeft: 0 } }, 37, 37);
    expect(lines(s).map((l) => [l.age, l.text])).toEqual([
      [30, DEBT_CALLS.first],
      [37, DEBT_CALLS.again[0]],
    ]);
  });
});

describe('layoffs are not firings', () => {
  it('the yearly layoff is recorded as laid off and never counts toward Three Strikes', () => {
    const s = { ...adult(30), career: { ...adult(30).career, job: job() } };
    let laidOff: GameState | null = null;
    for (let r = 1; r < 5000 && !laidOff; r++) {
      const t = yearlyCareer(s, new Rng(r));
      if (!t.career.job && t.log.some((l) => / made cutbacks and I was laid off\.$/.test(l.text))) laidOff = t;
    }
    expect(laidOff).not.toBeNull();
    expect(laidOff!.counters.firings).toBe(0);
    expect(laidOff!.career.history.at(-1)?.reason).toBe('laidOff');
    const three = { ...laidOff!, counters: { ...laidOff!.counters, firings: 2 } };
    expect(ACHIEVEMENT_BY_ID.three_strikes!.test(layOff({ ...three, career: { ...three.career, job: job() } }), NONE)).toBe(false);
    expect(evaluateCondition(laidOff!, { count: 'firings', gte: 1 })).toBe(false);
  });

  it('a firing for poor performance still counts', () => {
    const s = { ...adult(30), career: { ...adult(30).career, job: job({ performance: 0 }) } };
    let fired: GameState | null = null;
    for (let r = 1; r < 200 && !fired; r++) {
      const t = yearlyCareer(s, new Rng(r));
      if (t.log.some((l) => /fired from/.test(l.text))) fired = t;
    }
    expect(fired!.counters.firings).toBe(1);
    expect(fired!.career.history.at(-1)?.reason).toBe('fired');
  });
});

describe('juvenile detention wording', () => {
  it('Assets says detention for a minor and prison for an adult', () => {
    const kid = adult(16);
    expect(canBuy({ ...kid, crime: { ...kid.crime, inPrison: true, juvenile: true, sentenceYearsLeft: 1 } }, 'bike', 'cash').reason).toBe('Not while in detention');
    const grown = adult(30);
    expect(canBuy({ ...grown, crime: { ...grown.crime, inPrison: true, sentenceYearsLeft: 3 } }, 'bike', 'cash').reason).toBe('Not while in prison');
  });

  it('jobs, hustles and enrolling say detention for a minor too', () => {
    const kid = adult(16);
    const inside: GameState = { ...kid, crime: { ...kid.crime, inPrison: true, juvenile: true, sentenceYearsLeft: 1 }, education: { ...kid.education, degrees: ['high_school'], stage: 'done', enrolled: false } };
    expect(meetsRequirements(inside, JOB_BY_ID.pt_babysitter!).reason).toBe('In detention');
    expect(listingsBlocker(inside)).toBe("I can't job-hunt from detention.");
    expect(hustleBlocker(inside, HUSTLES[0]!)).toBe("I can't run a side hustle from detention.");
    expect(enrollBlocker(inside)).toBe("I can't enroll while I'm in detention.");
    const grown = adult(30);
    expect(enrollBlocker({ ...grown, crime: { ...grown.crime, inPrison: true, sentenceYearsLeft: 3 } })).toBe("I can't enroll while I'm in prison.");
  });
});

describe('parents paying tuition is not a scholarship', () => {
  const graduate = (seed: number): GameState => {
    const s = adult(18, seed);
    return { ...s, flags: { ...s.flags, wealthyFamily: true }, education: { ...s.education, stage: 'done', enrolled: false, degrees: ['high_school'], grade: 40 }, character: { ...s.character, age: 18, stats: { ...s.character.stats, smarts: 60 } } };
  };

  it('waives tuition without the Full Ride achievement or the scholarship note', () => {
    let paid = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const s = enroll(graduate(seed), new Rng(seed), 'business');
      expect(s.education.enrolled).toBe(true);
      const won = s.log.some((l) => l.text.startsWith('I won a full scholarship'));
      expect(s.education.scholarship).toBe(won);
      expect(ACHIEVEMENT_BY_ID.full_ride!.test(s, NONE)).toBe(won);
      if (won) continue;
      paid++;
      expect(s.education.parentsPay).toBe(true);
      expect(s.log.some((l) => / will pay for my business degree\./.test(l.text))).toBe(true);
      // A year of university adds no student debt.
      const next = ageUp(s, noEvents);
      expect(next.education.studentDebt).toBe(0);
    }
    expect(paid).toBeGreaterThan(20);
  });

  it('a real scholarship still unlocks Full Ride', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const base = adult(18, seed);
      const s = enroll({ ...base, education: { ...base.education, stage: 'done', enrolled: false, degrees: ['high_school'], grade: 90 }, character: { ...base.character, stats: { ...base.character.stats, smarts: 80 } } }, new Rng(seed), 'business');
      if (!s.education.scholarship) continue;
      expect(s.education.parentsPay).toBe(false);
      expect(ACHIEVEMENT_BY_ID.full_ride!.test(s, NONE)).toBe(true);
      return;
    }
    throw new Error('no scholarship in 200 tries');
  });
});

describe('the obituary names the highest degree', () => {
  it('a PhD beats a later MBA and master’s; between equals the latest wins', () => {
    expect(highestDegree(['high_school', 'bachelor:physics', 'doctor:philosophy', 'master:business', 'master:general'])).toBe('a PhD');
    expect(highestDegree(['high_school', 'bachelor:biology', 'master:general'])).toBe("a master's degree");
    expect(highestDegree(['high_school', 'bachelor:biology', 'bachelor:history'])).toBe('a degree in history');
    expect(highestDegree(['high_school'])).toBeUndefined();
  });

  it('reads as one sentence for someone who never worked', () => {
    const s = adult(80, 202, 'GB');
    const done = { ...s, alive: false, education: { ...s.education, stage: 'done' as const, enrolled: false, degrees: ['high_school', 'bachelor:physics', 'doctor:philosophy', 'master:general'] } };
    const text = buildObituary(done, 'old age', 0, 'Academic');
    expect(text).toMatch(/ earned a PhD but never held a steady job, which (he|she) insisted was a lifestyle choice\./);
    const retired = { ...done, career: { ...done.career, retired: true, history: [{ title: 'Fire Chief', company: 'the London Fire Department', fromAge: 30, toAge: 65, salary: 80_000, reason: 'retired' as const }] } };
    expect(buildObituary(retired, 'old age', 0, 'Academic')).toMatch(/ retired after 35 years as a fire chief and held a PhD\./);
  });
});

describe('retiring twice', () => {
  it('sinceRetired counts from the latest retirement and is false while back at work', () => {
    let s: GameState = { ...adult(60), career: { ...adult(60).career, job: job({ defId: 'janitor', title: 'Janitor', company: 'Vertex Group', category: 'service' }) } };
    s = applyAction(s, { type: 'retire' });
    expect(s.career.history.at(-1)).toMatchObject({ reason: 'retired', toAge: 60 });
    s = ageUp(s, noEvents);
    // Retiring is something done during the year; the first cards that can follow it come at the next birthday.
    expect(evaluateCondition(s, { sinceRetired: true, eq: 1 })).toBe(true);
    s = { ...s, career: { ...s.career, job: job({ defId: 'janitor', title: 'Janitor', company: 'Granite & Sons', category: 'service', yearsHeld: 0 }) } };
    expect(evaluateCondition(s, { sinceRetired: true, gte: 0 })).toBe(false);
    s = ageUp(ageUp(s, noEvents), noEvents);
    if (!s.career.job) s = { ...s, career: { ...s.career, job: job({ company: 'Granite & Sons' }) } };
    s = applyAction(s, { type: 'retire' });
    expect(s.career.retired).toBe(true);
    expect(s.career.history.at(-1)).toMatchObject({ reason: 'retired', toAge: 63 });
    s = ageUp(s, noEvents);
    expect(evaluateCondition(s, { sinceRetired: true, eq: 1 })).toBe(true);
    // A post-retirement job that ends any other way is not a new retirement.
    const quit = applyAction({ ...s, career: { ...s.career, job: job({ company: 'Blue Note' }) } }, { type: 'quitJob' });
    expect(evaluateCondition(quit, { sinceRetired: true, gte: 0 })).toBe(false);
  });
});
