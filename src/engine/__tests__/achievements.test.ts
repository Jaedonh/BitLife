import { achievementDescription, ACHIEVEMENT_BY_ID, ACHIEVEMENT_GROUPS, ACHIEVEMENTS, millionaireTarget, type AchievementContext } from '@/data/achievements';
import { COUNTRIES } from '@/data/countries';
import { ageUp } from '../ageUp';
import { applyAction } from '../actions';
import { applyEffect } from '../events/effects';
import { validateEvent, type EventDef } from '../events/schema';
import { makeRegistry } from '../events/select';
import { Rng } from '../rng';
import { simulateLife, balancedPolicy, recklessPolicy } from '../simulate';
import { achievementContext, newAchievements } from '../systems/achievements';
import { createLife, emptyMemory } from '../systems/character';
import { markDeath } from '../systems/death';
import type { Asset, GameState, Person } from '../types';
import { addMoney } from '../util';

const noEvents = makeRegistry([]);
const NONE: AchievementContext = { ribbons: [], countries: [], lives: 0 };

const life = (seed = 7, countryCode = 'US'): GameState => createLife({ countryCode, firstName: 'Ana', lastName: 'Silva' }, seed);
const at = (s: GameState, age: number): GameState => ({ ...s, character: { ...s.character, age } });
const ids = (s: GameState, ctx: AchievementContext = NONE, unlocked: Record<string, unknown> = {}) => newAchievements(s, ctx, unlocked).map((a) => a.id);
const earns = (s: GameState, id: string, ctx: AchievementContext = NONE) => ids(s, ctx).includes(id);

function person(s: GameState, patch: Partial<Person>): GameState {
  const p: Person = {
    id: `t_${Object.keys(s.people).length}`,
    firstName: 'Sam',
    lastName: 'Reyes',
    gender: 'female',
    age: s.character.age,
    alive: true,
    kind: 'friend',
    relationship: 60,
    looks: 50,
    smarts: 50,
    health: 80,
    craziness: 10,
    occupation: '',
    money: 0,
    memory: emptyMemory(s.character.age),
    metAtAge: s.character.age,
    ...patch,
  };
  return { ...s, people: { ...s.people, [p.id]: p } };
}

function asset(defId: string, kind: Asset['kind']): Asset {
  return { id: `a_${defId}`, defId, kind, name: defId, value: 1000, purchasePrice: 1000, condition: 100, yearlyUpkeep: 0, mortgage: null, boughtAtAge: 30 };
}

describe('achievement definitions', () => {
  it('ships 40 well-formed achievements with stable snake_case ids', () => {
    expect(ACHIEVEMENTS).toHaveLength(40);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(40);
    const groups = new Set(ACHIEVEMENT_GROUPS.map((g) => g.id));
    for (const a of ACHIEVEMENTS) {
      expect(a.id).toMatch(/^[a-z0-9_]+$/);
      expect(a.name.length).toBeGreaterThan(1);
      expect(a.name.length).toBeLessThanOrEqual(24);
      expect(a.emoji.length).toBeGreaterThan(0);
      // A country-specific description (money in the local currency) follows the same rules in every country.
      for (const text of [a.description, ...(a.describe ? COUNTRIES.map((c) => a.describe!(c.code)) : [])]) {
        expect(text).toMatch(/^[A-Z].*\.$/);
        expect(text.length).toBeLessThanOrEqual(100);
        // The unlock toast reads "Name: description", so a colon inside the description would read twice.
        expect(text).not.toContain(':');
      }
      expect(groups.has(a.group)).toBe(true);
      // Secrets live together, and only there.
      expect(!!a.secret).toBe(a.group === 'secret');
      expect(`${a.name} ${a.description}`).not.toMatch(/lottery|casino|\bbet\b|poker|slot|gambl/i);
      expect(ACHIEVEMENT_BY_ID[a.id]).toBe(a);
    }
    expect(ACHIEVEMENTS.filter((a) => a.secret).length).toBeGreaterThanOrEqual(3);
  });

  it('gives a newborn nothing', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const s = life(seed);
      expect(ids(s, achievementContext([], s)).filter((id) => id !== 'first_pet')).toEqual([]);
    }
  });
});

describe('the checker', () => {
  it('skips what is already unlocked and keeps definition order', () => {
    let s = at(life(), 40);
    s = { ...s, counters: { ...s.counters, marriages: 1, jobsHeld: 2 } };
    expect(ids(s)).toEqual(['first_job', 'married']);
    expect(ids(s, NONE, { first_job: { unlockedAt: 1 } })).toEqual(['married']);
  });

  it('unlocks an achievement an event grants directly', () => {
    const s = applyEffect(at(life(), 30), new Rng(1), { achievement: 'saint' }, {});
    expect(s.achievements).toEqual(['saint']);
    expect(ids(s)).toContain('saint');
  });

  it('rejects an event that grants an achievement that does not exist', () => {
    const ev = (achievement: string): EventDef => ({
      id: 'zz_test',
      category: 'random',
      title: 'Test',
      text: 'Something happened to me today.',
      minAge: 20,
      maxAge: 30,
      weight: 1,
      choices: [{ id: 'a', label: 'Fine', effects: [{ achievement }, { log: 'I took it.' }] }],
    });
    expect(validateEvent(ev('saint'), new Set())).toEqual([]);
    expect(validateEvent(ev('saint_nope'), new Set()).join('\n')).toMatch(/unknown achievement saint_nope/);
  });

  it('is cheap enough to run after every tap', () => {
    const { state } = simulateLife(42, balancedPolicy);
    const ctx = achievementContext(Array.from({ length: 200 }, (_, i) => ({ id: `l${i}`, ribbonId: 'mediocre', countryCode: 'US' })), state);
    const started = Date.now();
    for (let i = 0; i < 2000; i++) newAchievements(state, ctx, {});
    // 2000 full checks of a long life (nothing skipped) well under a second: a few microseconds per check.
    expect(Date.now() - started).toBeLessThan(1500);
  });

  it('finds real achievements in simulated lives', () => {
    const found = new Set<string>();
    for (let seed = 1; seed <= 24; seed++) {
      const { state } = simulateLife(seed, seed % 3 === 0 ? recklessPolicy : balancedPolicy);
      for (const id of ids(state, achievementContext([], state))) found.add(id);
    }
    for (const id of ['one_down', 'first_job', 'married', 'graduate']) expect(found).toContain(id);
    expect(found.size).toBeGreaterThanOrEqual(10);
  });
});

describe('life milestones', () => {
  it('degrees, a medical career and the top of a ladder', () => {
    const s = at(life(), 35);
    expect(earns({ ...s, education: { ...s.education, degrees: ['high_school', 'bachelor:biology'] } }, 'graduate')).toBe(true);
    expect(earns({ ...s, education: { ...s.education, degrees: ['high_school', 'bachelor:biology', 'doctor:medicine'] } }, 'postgrad')).toBe(true);
    const job = { defId: 'doctor', title: 'Physician', company: 'City Hospital', salary: 180000, level: 1, performance: 60, yearsHeld: 2, yearsAtLevel: 1, category: 'health' as const, partTime: false, askedThisYear: false, workedHarderThisYear: false };
    expect(earns({ ...s, career: { ...s.career, job } }, 'doctor')).toBe(true);
    // A resident is not a doctor yet.
    expect(earns({ ...s, career: { ...s.career, job: { ...job, level: 0, title: 'Medical Resident' } } }, 'doctor')).toBe(false);
    expect(earns({ ...s, career: { ...s.career, job: { ...job, level: 3, title: 'Chief of Medicine' } } }, 'top_rung')).toBe(true);
    expect(earns({ ...s, career: { ...s.career, job: { ...job, level: 2 } } }, 'top_rung')).toBe(false);
    // A one-rung part-time job is not the top of a career.
    const cashier = { ...job, defId: 'pt_cashier', title: 'Cashier', level: 0, partTime: true, category: 'service' as const };
    expect(earns({ ...s, career: { ...s.career, job: cashier } }, 'top_rung')).toBe(false);
  });

  it('family: marriage, a golden anniversary and three children', () => {
    let s = at(life(), 75);
    expect(earns(person(s, { kind: 'spouse', marriedAtAge: 25 }), 'golden_anniversary')).toBe(true);
    expect(earns(person(s, { kind: 'spouse', marriedAtAge: 26 }), 'golden_anniversary')).toBe(false);
    expect(earns(person(s, { kind: 'spouse', marriedAtAge: 25, alive: false }), 'golden_anniversary')).toBe(false);
    for (let i = 0; i < 3; i++) s = person(s, { kind: 'child', age: 40 + i });
    expect(earns(s, 'full_house')).toBe(true);
  });

  it('homes, a mansion and a million in local terms', () => {
    const us = at(life(3, 'US'), 50);
    expect(earns({ ...us, assets: [asset('studio', 'house')] }, 'homeowner')).toBe(true);
    expect(earns({ ...us, assets: [asset('mansion', 'house')] }, 'mansion')).toBe(true);
    expect(earns({ ...us, finances: { ...us.finances, cash: 999_000 } }, 'millionaire')).toBe(false);
    expect(earns({ ...us, finances: { ...us.finances, cash: 1_000_000 } }, 'millionaire')).toBe(true);
    // Money is in USD-based units scaled by the country: a Nigerian million is 100,000 units.
    const ng = at(life(3, 'NG'), 50);
    expect(earns({ ...ng, finances: { ...ng.finances, cash: 100_000 } }, 'millionaire')).toBe(true);
    // Without a diploma it is also the dropout's fortune.
    expect(earns({ ...us, education: { ...us.education, degrees: [] }, finances: { ...us.finances, cash: 2_000_000 } }, 'dropout_millionaire')).toBe(true);
    expect(earns({ ...us, education: { ...us.education, degrees: ['high_school'] }, finances: { ...us.finances, cash: 2_000_000 } }, 'dropout_millionaire')).toBe(false);
  });

  it('the Millionaire target is the one shown on screen, in the local currency', () => {
    const ctx = NONE;
    // India: a million US dollars at Indian wages is ₹12,000,000 (two significant figures), not ₹1,000,000.
    expect(millionaireTarget('IN')).toBe(12_000_000);
    expect(achievementDescription(ACHIEVEMENT_BY_ID.millionaire!, 'IN')).toBe('Reach a net worth of ₹12,000,000, a million US dollars at Indian wages.');
    const india = at(life(3, 'IN'), 33);
    const rupees = (r: number): GameState => ({ ...india, finances: { ...india.finances, cash: Math.ceil(r / 83), debt: 0, investments: [] }, assets: [] });
    expect(ACHIEVEMENT_BY_ID.millionaire!.test(rupees(4_439_006), ctx)).toBe(false);
    expect(ACHIEVEMENT_BY_ID.millionaire!.test(rupees(11_999_000), ctx)).toBe(false);
    expect(ACHIEVEMENT_BY_ID.millionaire!.test(rupees(12_000_000), ctx)).toBe(true);
    // The UK: never less than a million of the local currency, so £632,000 is not yet a millionaire.
    expect(achievementDescription(ACHIEVEMENT_BY_ID.millionaire!, 'GB')).toBe('Reach a net worth of £1,000,000.');
    const uk = at(life(3, 'GB'), 50);
    expect(ACHIEVEMENT_BY_ID.millionaire!.test({ ...uk, finances: { ...uk.finances, cash: 800_000 } }, ctx)).toBe(false);
    expect(ACHIEVEMENT_BY_ID.millionaire!.test({ ...uk, finances: { ...uk.finances, cash: Math.ceil(1_000_000 / 0.79) } }, ctx)).toBe(true);
    expect(achievementDescription(ACHIEVEMENT_BY_ID.millionaire!, 'US')).toBe('Reach a net worth of $1,000,000.');
    // Every country's target is at least a million on screen and the description names it.
    for (const c of COUNTRIES) {
      expect(millionaireTarget(c.code)).toBeGreaterThanOrEqual(1_000_000);
      expect(achievementDescription(ACHIEVEMENT_BY_ID.millionaire!, c.code)).toContain(`${c.currencySymbol}${millionaireTarget(c.code).toLocaleString('en-US')}`);
    }
    // Without a life the description is the general one; Debt Free names its local amount too.
    expect(achievementDescription(ACHIEVEMENT_BY_ID.millionaire!)).toBe(ACHIEVEMENT_BY_ID.millionaire!.description);
    expect(achievementDescription(ACHIEVEMENT_BY_ID.debt_free!, 'IN')).toBe('Pay off a debt of ₹250,000 or more without going bankrupt.');
  });

  it('a millionaire still in high school is not a dropout yet', () => {
    // Italian high school runs to 19: at 18 a student who inherited a fortune has no diploma *yet*.
    const it18 = at(life(5, 'IT'), 18);
    const student = { ...it18, education: { ...it18.education, stage: 'high' as const, enrolled: true, degrees: [] }, finances: { ...it18.finances, cash: 50_000_000 } };
    expect(earns(student, 'millionaire')).toBe(true);
    expect(earns(student, 'dropout_millionaire')).toBe(false);
    // Out of school without one, it counts.
    expect(earns({ ...student, education: { ...student.education, stage: 'done', enrolled: false } }, 'dropout_millionaire')).toBe(true);
    expect(earns({ ...student, education: { ...student.education, enrolled: false, droppedOut: true } }, 'dropout_millionaire')).toBe(true);
  });

  it('pets and a friendship of 40 years', () => {
    const s = at(life(), 60);
    expect(earns(person(s, { kind: 'pet', species: 'dog' }), 'first_pet')).toBe(true);
    expect(earns(person(s, { kind: 'friend', relationship: 85, metAtAge: 20 }), 'lifelong_friend')).toBe(true);
    expect(earns(person(s, { kind: 'friend', relationship: 70, metAtAge: 20 }), 'lifelong_friend')).toBe(false);
    expect(earns(person(s, { kind: 'friend', relationship: 85, metAtAge: 21 }), 'lifelong_friend')).toBe(false);
  });

  it('old age', () => {
    expect(earns(at(life(), 99), 'centenarian')).toBe(false);
    expect(earns(at(life(), 100), 'centenarian')).toBe(true);
    expect(earns(at(life(), 110), 'still_here')).toBe(true);
  });
});

describe('ways to live', () => {
  it('clean hands is judged at death, at 80 or older, with no crime ever', () => {
    const old = at(life(), 85);
    expect(earns(old, 'clean_hands')).toBe(false);
    expect(earns(markDeath(old, 'old age'), 'clean_hands')).toBe(true);
    expect(earns(markDeath(at(life(), 79), 'old age'), 'clean_hands')).toBe(false);
    expect(earns(markDeath({ ...old, counters: { ...old.counters, crimes: 1 } }, 'old age'), 'clean_hands')).toBe(false);
    expect(earns(markDeath({ ...old, crime: { ...old.crime, arrests: 1 } }, 'old age'), 'clean_hands')).toBe(false);
  });

  it('repeat offender counts prison sentences', () => {
    const s = at(life(), 30);
    expect(earns({ ...s, crime: { ...s.crime, convictions: 2 } }, 'repeat_offender')).toBe(false);
    expect(earns({ ...s, crime: { ...s.crime, convictions: 3 } }, 'repeat_offender')).toBe(true);
  });

  it('debt free: the engine remembers the peak and the payoff unlocks it', () => {
    let s = at(life(5, 'US'), 30);
    s = addMoney({ ...s, finances: { ...s.finances, cash: 0 } }, -25_000);
    expect(s.finances.debt).toBe(25_000);
    s = ageUp(s, noEvents);
    expect(s.flags.peakDebt).toBeGreaterThanOrEqual(25_000);
    expect(earns(s, 'debt_free')).toBe(false);
    s = { ...s, finances: { ...s.finances, cash: s.finances.cash + 100_000 } };
    s = applyAction(s, { type: 'payDebt', amount: s.finances.debt });
    expect(s.finances.debt).toBe(0);
    expect(earns(s, 'debt_free')).toBe(true);
    // Bankruptcy is not paying it off, and a small debt is not an escape.
    expect(earns({ ...s, finances: { ...s.finances, bankrupt: true } }, 'debt_free')).toBe(false);
    expect(earns({ ...s, flags: { ...s.flags, peakDebt: 5_000 } }, 'debt_free')).toBe(false);
  });

  it('debt free asks for the round local amount its description names', () => {
    // The UK: $20,000 at British wages is £12,640, shown and tested as £13,000.
    expect(achievementDescription(ACHIEVEMENT_BY_ID.debt_free!, 'GB')).toBe('Pay off a debt of £13,000 or more without going bankrupt.');
    const uk = at(life(5, 'GB'), 40);
    const paid = (pounds: number): GameState => ({ ...uk, flags: { ...uk.flags, peakDebt: pounds / 0.79 }, finances: { ...uk.finances, debt: 0, bankrupt: false }, education: { ...uk.education, studentDebt: 0 } });
    expect(earns(paid(12_900), 'debt_free')).toBe(false);
    expect(earns(paid(13_000), 'debt_free')).toBe(true);
  });

  it('debt free counts student loans as debt', () => {
    let s = at(life(5, 'US'), 23);
    s = { ...s, education: { ...s.education, studentDebt: 30_000 } };
    s = ageUp(s, noEvents);
    expect(s.flags.peakDebt).toBeGreaterThanOrEqual(30_000);
    expect(earns({ ...s, education: { ...s.education, studentDebt: 0 }, finances: { ...s.finances, debt: 0 } }, 'debt_free')).toBe(true);
  });

  it('fame, karma, a scholarship and habits', () => {
    const s = at(life(), 40);
    expect(earns({ ...s, flags: { ...s.flags, peakFame: 80 } }, 'famous')).toBe(true);
    expect(earns({ ...s, character: { ...s.character, karma: 95 } }, 'saint')).toBe(true);
    expect(earns({ ...s, education: { ...s.education, scholarship: true } }, 'full_ride')).toBe(true);
    expect(earns({ ...s, counters: { ...s.counters, vacations: 10, workouts: 100, compliments: 50 } }, 'gym_rat')).toBe(true);
    expect(ids({ ...s, counters: { ...s.counters, vacations: 10, workouts: 99, compliments: 49 } })).toEqual(expect.arrayContaining(['frequent_flyer']));
    expect(ids({ ...s, counters: { ...s.counters, workouts: 99, compliments: 49 } })).not.toEqual(expect.arrayContaining(['gym_rat']));
    expect(earns({ ...s, flags: { ...s.flags, hustleMaxed: true } }, 'hustle_top')).toBe(true);
  });
});

describe('family line and collection', () => {
  it('generations', () => {
    const s = life();
    expect(earns({ ...s, generation: 2 }, 'next_generation')).toBe(true);
    expect(earns({ ...s, generation: 4 }, 'dynasty')).toBe(false);
    expect(earns({ ...s, generation: 5 }, 'dynasty')).toBe(true);
  });

  it('the context counts each finished life once and the current country always', () => {
    const past = [
      { id: 'a', ribbonId: 'rich', countryCode: 'US' },
      { id: 'b', ribbonId: 'rich', countryCode: 'JP' },
    ];
    const alive = life(9, 'BR');
    expect(achievementContext(past, alive)).toEqual({ ribbons: ['rich'], countries: ['US', 'JP', 'BR'], lives: 2 });
    const dead = markDeath(at(alive, 50), 'old age');
    // Before its grave is written...
    const before = achievementContext(past, dead);
    expect(before.lives).toBe(3);
    expect(before.ribbons).toContain(dead.death!.ribbonId);
    // ...and after: still one life.
    const after = achievementContext([{ id: dead.character.id, ribbonId: dead.death!.ribbonId, countryCode: 'BR' }, ...past], dead);
    expect(after.lives).toBe(3);
    expect(achievementContext([], null)).toEqual({ ribbons: [], countries: [], lives: 0 });
  });

  it('unlocks the collection achievements from the context', () => {
    const s = life();
    expect(ids(s, { ribbons: [], countries: ['US'], lives: 1 })).toContain('one_down');
    expect(ids(s, { ribbons: [], countries: ['US'], lives: 10 })).toContain('again_and_again');
    const ten = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    expect(ids(s, { ribbons: ten, countries: [], lives: 10 })).toContain('ribbon_collector');
    expect(ids(s, { ribbons: ten.slice(1), countries: [], lives: 10 })).not.toContain('ribbon_collector');
    expect(ids(s, { ribbons: [], countries: ['US', 'GB', 'JP', 'BR', 'IN'], lives: 4 })).toContain('world_citizen');
  });
});

describe('secrets', () => {
  it('a rejected proposal is remembered by the engine', () => {
    let s = at(life(11), 30);
    // A lover who is not in love enough always says no.
    s = person(s, { id: 'lv', kind: 'lover', love: 30, relationship: 40, age: 30 } as Partial<Person>);
    s = { ...s, finances: { ...s.finances, cash: 10_000 } };
    const loverId = Object.values(s.people).find((p) => p.kind === 'lover')!.id;
    s = applyAction(s, { type: 'interact', personId: loverId, interaction: 'propose' });
    expect(s.log[s.log.length - 1]!.text).toMatch(/said no/);
    expect(s.flags.proposalsRejected).toBe(1);
    expect(earns(s, 'ouch')).toBe(true);
  });

  it('pets, firings, divorces, a pigeon, bankruptcy and surgery', () => {
    let s = at(life(), 45);
    for (let i = 0; i < 4; i++) s = person(s, { kind: 'pet', species: 'cat' });
    expect(earns(s, 'zookeeper')).toBe(false);
    s = person(s, { kind: 'pet', species: 'pigeon', alive: false });
    expect(ids(s)).toEqual(expect.arrayContaining(['zookeeper', 'bird_brain']));
    const c = { ...s.counters, firings: 3, divorces: 3 };
    expect(ids({ ...s, counters: c })).toEqual(expect.arrayContaining(['three_strikes', 'practice_makes_perfect']));
    expect(earns({ ...s, finances: { ...s.finances, bankrupt: true } }, 'rock_bottom')).toBe(true);
  });

  it('mirror, mirror counts cosmetic surgery, not an appendectomy or a broken hip', () => {
    let s = at(life(4, 'US'), 30);
    // Three operations from health events share the lifetime surgery counter...
    s = { ...s, counters: { ...s.counters, surgeries: 3 } };
    expect(earns(s, 'mirror_mirror')).toBe(false);
    // ...three trips to the plastic surgeon (once a year; a botched one still counts) are what it asks for.
    for (let i = 0; i < 3; i++) {
      s = { ...s, finances: { ...s.finances, cash: 100_000 }, actionsThisYear: {}, character: { ...s.character, energy: s.character.energyMax, age: 30 + i } };
      s = applyAction(s, { type: 'activity', id: 'plastic_surgery' });
      expect(s.flags.cosmeticSurgeries).toBe(i + 1);
    }
    expect(earns(s, 'mirror_mirror')).toBe(true);
  });
});
