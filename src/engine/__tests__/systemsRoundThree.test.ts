/**
 * Fixes from the third playtest (systems): moving back home, moves to another city, the doctor's warning, money
 * before the euro, cards that would collapse to one choice, tuition and skipped classes for grown students,
 * athletes' careers, layoffs of offices, a job lost to prison, appendicitis once, birthdays in prison and Clean Hands.
 */
import { ACHIEVEMENT_BY_ID } from '@/data/achievements';
import { EURO_SINCE } from '@/data/countries';
import { illnessHadFlag, ILLNESS_BY_ID } from '@/data/illnesses';
import { JOB_BY_ID } from '@/data/jobs';
import { ageUp } from '../ageUp';
import { applyAction } from '../actions';
import { evaluateCondition, HOME_WITH_PARENTS_FLAG, livesAtHome, movedBackHome, settleHomeWithParents } from '../events/conditions';
import { applyEffects, giveIllness } from '../events/effects';
import type { EventDef } from '../events/schema';
import { makeRegistry, openNextEvent, resolveChoice, scheduleYearEvents } from '../events/select';
import { EVENT_REGISTRY } from '../events/registry';
import { renderText } from '../events/text';
import { Rng } from '../rng';
import { HALL_OF_FAME_FLAG, meetsRequirements, yearlyCareer } from '../systems/careers';
import { createLife } from '../systems/character';
import { buildObituary, degreeNoun, markDeath } from '../systems/death';
import { familyPaysTuition, skipClass } from '../systems/education';
import { yearlyFinance } from '../systems/finance';
import { yearlyHealth } from '../systems/health';
import { rollMortality } from '../systems/mortality';
import { relocateCity } from '../systems/scenarios';
import type { Asset, GameState, Job, Person } from '../types';
import { formatMoney, formatMoneyFull, money } from '../util';

/** A life of `countryCode` at `age` in `year`, out of prison and alive, with no job, home or pending card. */
function at(age: number, opts: { countryCode?: string; year?: number; seed?: number; scenario?: 'farm_kid' | 'wealthy' } = {}): GameState {
  const s = createLife({ countryCode: opts.countryCode ?? 'US', scenario: opts.scenario }, opts.seed ?? 3);
  const year = opts.year ?? 2020;
  return { ...s, year, character: { ...s.character, age, birthYear: year - age }, career: { ...s.career, job: null }, assets: [] };
}

const job = (defId: string, level: number, patch: Partial<Job> = {}): Job => {
  const def = JOB_BY_ID[defId]!;
  const rung = def.ladder[Math.min(level, def.ladder.length - 1)]!;
  return { defId, title: rung.title, company: 'Granite & Sons', salary: rung.salary, level, performance: 60, yearsHeld: 3, yearsAtLevel: 3, category: def.category, partTime: false, askedThisYear: false, workedHarderThisYear: false, ...patch };
};

const withJob = (s: GameState, j: Job): GameState => ({ ...s, career: { ...s.career, job: j } });

const person = (s: GameState, id: string, patch: Partial<Person>): Person => ({
  ...Object.values(s.people)[0]!, id, firstName: id, lastName: 'Test', alive: true, farAway: undefined, age: 30, relationship: 80, viaId: undefined, growth: undefined, workplace: undefined, ...patch,
});

const addPeople = (s: GameState, ...people: Person[]): GameState => ({ ...s, people: { ...s.people, ...Object.fromEntries(people.map((p) => [p.id, p])) } });

const parents = (s: GameState) => Object.values(s.people).filter((p) => p.kind === 'mother' || p.kind === 'father');

const home = (patch: Partial<Asset> = {}): Asset => ({
  id: 'a_home', defId: 'suburban', kind: 'house', name: 'Suburban family home', value: 500_000, purchasePrice: 480_000, condition: 90, yearlyUpkeep: 10_000, mortgage: null, boughtAtAge: 30, primary: true, ...patch,
});

const newLines = (before: GameState, after: GameState) => after.log.slice(before.log.length).map((l) => l.text);

describe('moving back home (flag home_with_parents)', () => {
  const grown = () => {
    const s = at(27, { seed: 12 });
    expect(parents(s).some((p) => p.alive)).toBe(true);
    return { ...s, flags: { ...s.flags, [HOME_WITH_PARENTS_FLAG]: true } };
  };

  it('a grown-up who moved back in lives at home: atHome, household parents and the cheaper housing', () => {
    const s = grown();
    expect(livesAtHome({ ...s, flags: {} })).toBe(false);
    expect(livesAtHome(s)).toBe(true);
    expect(evaluateCondition(s, { atHome: false })).toBe(false);
    const rent = yearlyFinance({ ...s, flags: {}, finances: { ...s.finances, cash: 100_000, debt: 0 } }, new Rng(1));
    const atHome = yearlyFinance({ ...s, finances: { ...s.finances, cash: 100_000, debt: 0 } }, new Rng(1));
    expect(rent.finances.lastYear.expenses).toBe(9_000);
    expect(atHome.finances.lastYear.expenses).toBe(2_500);
  });

  it('holds only while a parent nearby is alive', () => {
    const s = grown();
    const far = { ...s, people: Object.fromEntries(Object.entries(s.people).map(([id, p]) => [id, p.kind === 'mother' || p.kind === 'father' ? { ...p, farAway: true } : p])) };
    expect(movedBackHome(far)).toBe(false);
    const gone = { ...s, people: Object.fromEntries(Object.entries(s.people).map(([id, p]) => [id, p.kind === 'mother' || p.kind === 'father' ? { ...p, alive: false } : p])) };
    expect(livesAtHome(gone)).toBe(false);
  });

  it('ends for good with a home, a wedding, moving in together, prison or a move to another city', () => {
    const s = grown();
    const cleared = (x: GameState) => x.flags[HOME_WITH_PARENTS_FLAG] === undefined;
    expect(cleared(settleHomeWithParents(s))).toBe(false);
    const bought = settleHomeWithParents({ ...s, assets: [home()] });
    expect(cleared(bought)).toBe(true);
    // Selling the house later does not put me back in my old room.
    expect(livesAtHome({ ...bought, assets: [] })).toBe(false);
    expect(cleared(settleHomeWithParents(addPeople(s, person(s, 'Ana', { kind: 'spouse' }))))).toBe(true);
    expect(cleared(settleHomeWithParents({ ...s, flags: { ...s.flags, lf_living_together: true } }))).toBe(true);
    expect(cleared(applyEffects(s, new Rng(1), [{ prison: 1 }]))).toBe(true);
    expect(cleared(relocateCity(s, new Rng(2)))).toBe(true);
    // A birthday settles whatever came in between (a wedding from the people screen, a home from the shop).
    const married = addPeople(s, person(s, 'Ana', { kind: 'spouse' }));
    expect(cleared(ageUp(married))).toBe(true);
  });

  it('a card that marries me or moves me in with a partner ends it at once', () => {
    const s = grown();
    const def: EventDef = {
      id: 'tst_move_in', category: 'romance', title: 'Keys', text: 'We found a place.', minAge: 18, maxAge: 90, weight: 1,
      choices: [{ id: 'yes', label: 'Move in', effects: [{ flag: 'lf_living_together' }, { log: 'We moved in together.' }] }, { id: 'no', label: 'Not yet', effects: [{ log: 'Not yet.' }] }],
    };
    const registry = makeRegistry([def]);
    const open = openNextEvent({ ...s, eventQueue: [{ eventId: def.id, context: {} }] }, registry);
    const after = resolveChoice(open, 'yes', registry);
    expect(after.flags[HOME_WITH_PARENTS_FLAG]).toBeUndefined();
    expect(livesAtHome(after)).toBe(false);
  });
});

describe('a move to another city (relocate)', () => {
  it('a farm kid who moves is no longer on the farm', () => {
    const s = at(8, { scenario: 'farm_kid', seed: 32 });
    expect(s.flags.farm).toBe(true);
    const moved = relocateCity(s, new Rng(4));
    expect(moved.character.city).not.toBe(s.character.city);
    expect(moved.flags.farm).toBeUndefined();
    expect(evaluateCondition(moved, { flag: 'farm' })).toBe(false);
  });

  it('the home I lived in is sold before the move, with a line; one worth less than its mortgage is rented out', () => {
    const s = { ...at(45), finances: { ...at(45).finances, cash: 1_000 } };
    const sold = relocateCity({ ...s, assets: [home({ mortgage: { remaining: 100_000, yearlyPayment: 9_000, years: 15 } })] }, new Rng(5));
    expect(sold.assets).toEqual([]);
    expect(sold.finances.cash).toBe(1_000 + 375_000);
    expect(newLines(s, sold)).toContain(`Before the move, I sold my suburban family home in ${s.character.city} and cleared $375,000.`);
    const under = relocateCity({ ...s, assets: [home({ value: 200_000, mortgage: { remaining: 300_000, yearlyPayment: 20_000, years: 20 } })] }, new Rng(5));
    expect(under.assets[0]).toMatchObject({ primary: false, rentedOut: true });
    expect(newLines(s, under).join(' ')).toMatch(/rented it out/);
    // A house already rented out stays as it is, with no line.
    const rental = relocateCity({ ...s, assets: [home({ primary: false, rentedOut: true })] }, new Rng(5));
    expect(rental.assets).toHaveLength(1);
    expect(newLines(s, rental)).toEqual([]);
  });

  it('a partner I do not live with, grown children and their children stay behind far away; the household comes along', () => {
    const s0 = at(50);
    const s = addPeople(
      s0,
      person(s0, 'Hugo', { kind: 'lover', love: 70 }),
      person(s0, 'Nathan', { kind: 'child', age: 27, growth: { movedOut: true } }),
      person(s0, 'Gina', { kind: 'grandchild', age: 2, viaId: 'Nathan' }),
      person(s0, 'Lily', { kind: 'child', age: 15 }),
      person(s0, 'Rex', { kind: 'pet', species: 'dog', age: 4 }),
    );
    const moved = relocateCity(s, new Rng(6));
    expect(moved.people.Hugo!.farAway).toBe(true);
    expect(moved.people.Nathan!.farAway).toBe(true);
    expect(moved.people.Gina!.farAway).toBe(true);
    expect(moved.people.Lily!.farAway).toBeUndefined();
    expect(moved.people.Rex!.farAway).toBeUndefined();
    // Parents of a grown-up stay behind too, even one who had moved back in with them.
    expect(parents(moved).filter((p) => p.alive).every((p) => p.farAway === true)).toBe(true);
    const together = relocateCity({ ...s, flags: { ...s.flags, lf_living_together: true, [HOME_WITH_PARENTS_FLAG]: true } }, new Rng(6));
    expect(together.people.Hugo!.farAway).toBeUndefined();
    expect(parents(together).filter((p) => p.alive).every((p) => p.farAway === true)).toBe(true);
    // A child moves with the household.
    const kid = relocateCity(at(9, { seed: 32 }), new Rng(6));
    expect(parents(kid).some((p) => p.farAway)).toBe(false);
  });

  it('a partner and grown children left behind still count as mine: no second partner, no "no kids" card', () => {
    const s0 = at(50);
    const s = addPeople(s0, person(s0, 'Hugo', { kind: 'lover', love: 70 }), person(s0, 'Nathan', { kind: 'child', age: 27, growth: { movedOut: true } }), person(s0, 'Ivy', { kind: 'ex', relationship: 20 }));
    const moved = relocateCity(s, new Rng(6));
    expect(moved.people.Hugo!.farAway).toBe(true);
    expect(evaluateCondition(moved, { hasLover: true })).toBe(true);
    expect(evaluateCondition(moved, { hasChildren: true })).toBe(true);
    // In-person scenes still need them nearby.
    expect(evaluateCondition(moved, { hasPerson: ['lover'] })).toBe(false);
    // An ex stays in the old city too.
    expect(moved.people.Ivy!.farAway).toBe(true);
  });

  it('a grandchild born to a child far away lives far away; a partner married from far away moves in', () => {
    const s0 = at(55);
    const s = addPeople(s0, person(s0, 'Nathan', { kind: 'child', age: 30, farAway: true, growth: { movedOut: true, spouse: { firstName: 'Ana', gender: 'female' }, expecting: 1 } }), person(s0, 'Hugo', { kind: 'lover', love: 90, farAway: true }));
    // The baby on the way arrives at the birthday (systems/family.ts), in the city where Nathan lives.
    const year = ageUp(s);
    const born = Object.values(year.people).filter((p) => p.kind === 'grandchild' && p.viaId === 'Nathan');
    expect(born).toHaveLength(1);
    expect(born[0]!.farAway).toBe(true);
    const wed = applyEffects(s, new Rng(3), [{ marry: true }], { personId: 'Hugo', person: s.people.Hugo });
    expect(wed.people.Hugo).toMatchObject({ kind: 'spouse' });
    expect(wed.people.Hugo!.farAway).toBeUndefined();
    // A wedding from the people screen is settled by the next birthday.
    const proposed = { ...s, people: { ...s.people, Hugo: { ...s.people.Hugo!, kind: 'spouse' as const } } };
    expect(ageUp(proposed).people.Hugo!.farAway).toBeUndefined();
  });

  it('a close coworker stays a friend far away, with a line; the others leave the life; the job brings new ones', () => {
    const s0 = withJob(at(35), job('accountant', 1));
    const workplace = { jobId: 'accountant', company: 'Granite & Sons' };
    const s = addPeople(s0, person(s0, 'Samuel', { kind: 'coworker', relationship: 87, workplace }), person(s0, 'Tess', { kind: 'coworker', relationship: 40, workplace }));
    const moved = relocateCity(s, new Rng(7));
    expect(moved.people.Samuel).toMatchObject({ kind: 'friend', farAway: true });
    expect(moved.people.Samuel!.workplace).toBeUndefined();
    expect(moved.people.Tess).toBeUndefined();
    expect(newLines(s, moved)).toContain('I said goodbye to Samuel from work, who promised to stay in touch.');
    expect(Object.values(moved.people).filter((p) => p.kind === 'coworker').length).toBeGreaterThanOrEqual(2);
  });
});

describe('the doctor gives two years', () => {
  it('nobody dies on the birthday of the warning; the countdown still ends a life that does not recover', () => {
    for (let seed = 1; seed <= 400; seed++) {
      const s = at(84, { seed: (seed % 7) + 1 });
      const sick: GameState = { ...s, character: { ...s.character, stats: { ...s.character.stats, health: 4 } }, health: { ...s.health, criticalYears: 0 } };
      const warned = rollMortality(sick, new Rng(seed));
      expect(warned.alive).toBe(true);
      expect(warned.health.criticalYears).toBe(2);
    }
    const s = at(70);
    const dying: GameState = { ...s, character: { ...s.character, stats: { ...s.character.stats, health: 4 } }, health: { ...s.health, criticalYears: 1 } };
    expect(rollMortality(dying, new Rng(1)).alive).toBe(false);
  });
});

describe('money before the euro', () => {
  it('Italy, Germany, France and Spain show the old currency before the euro notes and coins of 2002', () => {
    expect(EURO_SINCE).toBe(2002);
    expect(formatMoneyFull(100, 'IT', 1990)).toBe('178,100 lire');
    expect(formatMoneyFull(10, 'DE', 1995)).toBe('18 marks');
    expect(formatMoneyFull(100, 'FR', 1998)).toBe('603 francs');
    expect(formatMoneyFull(100, 'ES', 1997)).toBe('15,300 pesetas');
    expect(formatMoney(100_000, 'IT', 1996)).toBe('178M lire');
    expect(formatMoneyFull(-10, 'DE', 1995)).toBe('-18 marks');
    // One of them is singular.
    expect(formatMoneyFull(0.56, 'DE', 1995)).toBe('1 mark');
    // Until the notes and coins of 2002, wages and prices were still in the old money; from then on, euros.
    expect(formatMoneyFull(100, 'DE', 2001)).toBe('180 marks');
    expect(formatMoneyFull(100, 'DE', 2002)).toBe('€92');
    // Without a year, and anywhere else, nothing changes.
    expect(formatMoneyFull(100, 'IT')).toBe('€92');
    expect(formatMoneyFull(100, 'US', 1985)).toBe('$100');
    expect(formatMoneyFull(100, 'GB', 1985)).toBe('£79');
  });

  it('the journal speaks the money of its year; game amounts never change', () => {
    const s = at(6, { countryCode: 'IT', year: 1990 });
    expect(money(s, 10)).toBe('17,810 lire');
    expect(money({ ...s, year: 2001 }, 10)).toBe('17,810 lire');
    expect(money({ ...s, year: 2002 }, 10)).toBe('€9');
    expect(renderText('I found {{$1}}.', { ...s, year: 2010 })).toBe('I found €1.');
  });
});

describe('a card never opens as a single forced choice', () => {
  const card: EventDef = {
    id: 'tst_note', category: 'random', title: 'The note', text: 'A note under my door.', minAge: 18, maxAge: 90, weight: 1,
    choices: [
      { id: 'cake', label: 'Bake a cake', conditions: [{ money: { gte: 25 } }], effects: [{ money: -25 }, { log: 'Cake.' }] },
      { id: 'trainer', label: 'Hire a trainer', conditions: [{ money: { gte: 120 } }], effects: [{ money: -120 }, { log: 'Trainer.' }] },
      { id: 'ignore', label: 'Ignore it', effects: [{ log: 'Ignored.' }] },
    ],
  };
  const registry = makeRegistry([card]);
  const queued = (cash: number): GameState => {
    const s = at(30);
    return { ...s, finances: { ...s.finances, cash }, eventQueue: [{ eventId: card.id, context: {} }] };
  };

  it('a broke player is not offered only "Ignore it": the card waits', () => {
    expect(openNextEvent(queued(0), registry).pendingEvent).toBeNull();
    expect(openNextEvent(queued(50), registry).pendingEvent?.choices.map((c) => c.id)).toEqual(['cake', 'ignore']);
  });

  it('a card written with one choice, and the engine court card, still open', () => {
    const single: EventDef = { ...card, id: 'tst_single', choices: [card.choices[2]!] };
    const reg = makeRegistry([single]);
    expect(openNextEvent({ ...queued(0), eventQueue: [{ eventId: single.id, context: {} }] }, reg).pendingEvent?.eventId).toBe('tst_single');
    // The court card with every choice but one withdrawn (a refused lawyer and so on) still asks for an answer.
    const trial = { ...queued(0), eventQueue: [{ eventId: 'sys_trial', context: { opening: 'I was charged.', hide: 'public,lawyer,self' } }] };
    expect(openNextEvent(trial, registry).pendingEvent?.choices).toHaveLength(1);
  });

  it('a follow-up opens with what is left, as written (the union vote after "Sign the card")', () => {
    const vote: EventDef = {
      id: 'tst_vote', category: 'work', title: 'The vote', text: 'The result was pinned to the board.', minAge: 18, maxAge: 90, weight: 1, followUpOnly: true,
      choices: [
        { id: 'board', label: 'Check the bulletin board', effects: [{ log: 'The union won.' }] },
        { id: 'organisers', label: 'Wait with the organizers', conditions: [{ flag: 'tst_organiser', eq: true }], effects: [{ log: 'We won.' }] },
      ],
    };
    const reg = makeRegistry([vote]);
    const open = openNextEvent({ ...queued(0), eventQueue: [{ eventId: vote.id, context: {} }] }, reg);
    expect(open.pendingEvent?.choices.map((c) => c.id)).toEqual(['board']);
    // The real union vote, queued by every choice of the union drive, still opens for one who only signed.
    const s = withJob(at(30), job('accountant', 1));
    const drive = openNextEvent({ ...s, eventQueue: [{ eventId: 'wk_union_drive', context: {} }] }, EVENT_REGISTRY);
    expect(drive.pendingEvent?.eventId).toBe('wk_union_drive');
    expect(resolveChoice(drive, 'sign', EVENT_REGISTRY).pendingEvent?.eventId).toBe('wk_union_vote');
  });

  it("a broke player is not rolled the card at all: the year's slot goes to another one", () => {
    const other: EventDef = { ...card, id: 'tst_other', choices: [card.choices[2]!, { ...card.choices[2]!, id: 'shrug', label: 'Shrug' }] };
    const reg = makeRegistry([card, other]);
    for (let seed = 1; seed <= 30; seed++) {
      const broke = { ...queued(0), eventQueue: [], rng: new Rng(seed).snapshot() };
      expect(scheduleYearEvents(broke, reg, 1).eventQueue.map((q) => q.eventId)).toEqual(['tst_other']);
    }
    const rolled = new Set<string>();
    for (let seed = 1; seed <= 30; seed++) rolled.add(scheduleYearEvents({ ...queued(500), eventQueue: [], rng: new Rng(seed).snapshot() }, reg, 1).eventQueue[0]!.eventId);
    expect(rolled.has('tst_note')).toBe(true);
  });
});

describe('grown students', () => {
  it('a wealthy family pays only while a parent is alive and for a student under 30', () => {
    const s = at(20, { scenario: 'wealthy', seed: 1 });
    expect(familyPaysTuition(s)).toBe(true);
    expect(familyPaysTuition({ ...s, character: { ...s.character, age: 30 } })).toBe(false);
    const orphaned = { ...s, character: { ...s.character, age: 50 }, people: Object.fromEntries(Object.entries(s.people).map(([id, p]) => [id, ['mother', 'father', 'stepmother', 'stepfather'].includes(p.kind) ? { ...p, alive: false } : p])) };
    const enrolled = applyAction({ ...orphaned, education: { ...orphaned.education, enrolled: false, stage: 'done', degrees: ['high_school'] } }, { type: 'enroll', major: 'business' });
    expect(enrolled.education.enrolled).toBe(true);
    expect(enrolled.education.parentsPay).toBe(false);
    expect(enrolled.log.some((l) => /will pay for my/.test(l.text))).toBe(false);
  });

  it('skipping a college class as a grown-up never tells on me to my parents', () => {
    let caught = 0;
    for (let seed = 1; seed <= 120; seed++) {
      const s0 = at(26, { seed: (seed % 9) + 1 });
      const s: GameState = { ...s0, rng: { s: seed }, character: { ...s0.character, energy: 4 }, education: { ...s0.education, enrolled: true, stage: 'university', major: 'business' } };
      const after = skipClass(s, new Rng(seed));
      const lines = newLines(s, after).join(' ');
      expect(lines).not.toMatch(/Word got back|grounded/);
      if (/got caught/.test(lines)) caught++;
      for (const p of parents(s)) expect(after.people[p.id]!.relationship).toBe(p.relationship);
    }
    expect(caught).toBeGreaterThan(0);
    // A minor still gets grounded.
    let grounded = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const s0 = at(15);
      const s: GameState = { ...s0, character: { ...s0.character, energy: 4 }, education: { ...s0.education, enrolled: true, stage: 'high' } };
      if (newLines(s, skipClass(s, new Rng(seed))).some((l) => /grounded/.test(l))) grounded++;
    }
    expect(grounded).toBeGreaterThan(0);
  });

  it("the drop-out dialog names a credential once: your master's degree, your degree in computer science", () => {
    expect(degreeNoun('master:general')).toBe("master's degree");
    expect(degreeNoun('master:business')).toBe('MBA');
    expect(degreeNoun('doctor:medicine')).toBe('medical degree');
    expect(degreeNoun('doctor:philosophy')).toBe('PhD');
    expect(degreeNoun('bachelor:computer_science')).toBe('degree in computer science');
    expect(degreeNoun('high_school')).toBeNull();
  });
});

describe('athletes', () => {
  const fit = (age: number) => {
    const s = at(age);
    return { ...s, character: { ...s.character, stats: { ...s.character.stats, health: 95 } } };
  };

  it('nobody turns pro after 36', () => {
    expect(meetsRequirements(fit(30), JOB_BY_ID.athlete!).ok).toBe(true);
    expect(meetsRequirements(fit(36), JOB_BY_ID.athlete!).ok).toBe(true);
    expect(meetsRequirements(fit(37), JOB_BY_ID.athlete!)).toEqual({ ok: false, reason: 'Too old to turn pro' });
    expect(meetsRequirements(fit(47), JOB_BY_ID.athlete!).ok).toBe(false);
  });

  it('the ladder tops out at Star Athlete, paid less than a movie star', () => {
    const ladder = JOB_BY_ID.athlete!.ladder;
    expect(ladder.map((r) => r.title)).toEqual(['Semi-pro Athlete', 'Professional Athlete', 'Star Athlete']);
    expect(ladder.at(-1)!.salary).toBeLessThan(JOB_BY_ID.actor!.ladder.at(-1)!.salary);
  });

  it('a playing career ends by 40 with a line about the last game, then the Hall of Fame five years on', () => {
    let retired = 0;
    for (let seed = 1; seed <= 40; seed++) {
      let s = withJob(fit(33), job('athlete', 2, { yearsAtLevel: 6 }));
      let endedAt = 0;
      for (let age = 34; age <= 50; age++) {
        s = yearlyCareer({ ...s, character: { ...s.character, age } }, new Rng(seed * 100 + age));
        if (!endedAt && !s.career.job) endedAt = age;
      }
      expect(endedAt).toBeGreaterThanOrEqual(34);
      expect(endedAt).toBeLessThanOrEqual(40);
      // A few careers end sooner another way (a layoff, a firing); the rest end on the field.
      if (s.career.history.at(-1)?.reason !== 'sportRetired') continue;
      retired++;
      expect(s.career.history.at(-1)).toMatchObject({ defId: 'athlete', reason: 'sportRetired', toAge: endedAt });
      expect(s.career.retired).toBe(false);
      const lines = s.log.map((l) => l.text);
      expect(lines).toContain(`I played my last game at ${endedAt} and retired from professional sports. The crowd stood for the whole final minute.`);
      expect(lines).toContain('Five years after my last game, I was voted into the Hall of Fame.');
      expect(s.flags[HALL_OF_FAME_FLAG]).toBe(true);
      const obit = buildObituary({ ...s, character: { ...s.character, age: 80 } }, 'natural causes', 1_000_000, 'Famous');
      expect(obit).toContain('was voted into the Hall of Fame.');
      expect(obit).not.toMatch(/years as a Hall of Famer/);
    }
    expect(retired).toBeGreaterThan(30);
  });

  it('an older save still playing as a Hall of Famer retires at the next birthday, at 50 or at 28', () => {
    for (const age of [50, 28]) {
      for (let seed = 1; seed <= 20; seed++) {
        const s = withJob(fit(age), { ...job('athlete', 2), level: 3, title: 'Hall of Famer', salary: 3_000_000 });
        const after = yearlyCareer(s, new Rng(seed));
        expect(after.career.job).toBeNull();
        expect(after.career.history.at(-1)?.reason).toBe('sportRetired');
        expect(after.flags[HALL_OF_FAME_FLAG]).toBe(true);
      }
    }
  });

  it('the Hall of Fame vote waits for a player in prison, and then does not say "five years"', () => {
    const s = { ...fit(45), flags: { [HALL_OF_FAME_FLAG]: 44 } };
    const inside = { ...s, crime: { ...s.crime, inPrison: true, sentenceYearsLeft: 2 } };
    const held = yearlyCareer(inside, new Rng(1));
    expect(held.flags[HALL_OF_FAME_FLAG]).toBe(44);
    expect(newLines(inside, held).join(' ')).not.toMatch(/Hall of Fame/);
    const out = yearlyCareer({ ...s, character: { ...s.character, age: 47 } }, new Rng(1));
    expect(out.flags[HALL_OF_FAME_FLAG]).toBe(true);
    expect(newLines(s, out)).toContain('I was voted into the Hall of Fame at last.');
  });
});

describe('offices are not laid off', () => {
  it('a senator, a judge and a soldier never lose the job to cutbacks; a campaign aide can', () => {
    const offices: Job[] = [job('politician', 4, { company: 'Austin City Hall' }), job('judge', 3, { company: 'the Austin District Court' }), job('military', 2, { company: 'the Army' })];
    for (const j of offices) {
      for (let seed = 1; seed <= 600; seed++) {
        const s = withJob(fit(), { ...j, performance: 90 });
        const after = yearlyCareer(s, new Rng(seed));
        expect(after.career.history.some((h) => h.reason === 'laidOff')).toBe(false);
        expect(after.log.some((l) => /cutbacks|cut its numbers/.test(l.text))).toBe(false);
      }
    }
    let aides = 0;
    for (let seed = 1; seed <= 600; seed++) if (yearlyCareer(withJob(fit(), job('politician', 0, { performance: 90 })), new Rng(seed)).career.history.at(-1)?.reason === 'laidOff') aides++;
    expect(aides).toBeGreaterThan(0);
  });

  function fit(): GameState {
    const s = at(50);
    return { ...s, character: { ...s.character, stats: { ...s.character.stats, smarts: 90, happiness: 80, health: 80 } } };
  }
});

describe('a job lost to a prison sentence', () => {
  it('goes into the history as prison, not as moving on', () => {
    const s = withJob(at(35), job('engineer', 0));
    const jailed = applyEffects(s, new Rng(1), [{ prison: 2 }]);
    expect(jailed.career.history.at(-1)).toMatchObject({ defId: 'engineer', reason: 'prison', toAge: 35 });
  });
});

describe('appendicitis happens once', () => {
  it('a card or the yearly roll gives it once; it is never rolled again after it or after an appendix card', () => {
    expect(ILLNESS_BY_ID.appendicitis!.oncePerLife).toBe(true);
    const s = at(30);
    const first = giveIllness(s, 'appendicitis');
    expect(first.flags[illnessHadFlag('appendicitis')]).toBe(30);
    const cured = { ...first, health: { ...first.health, illnesses: [] } };
    expect(giveIllness(cured, 'appendicitis').health.illnesses).toEqual([]);
    const ill = (x: GameState, seed: number) => yearlyHealth({ ...x, character: { ...x.character, stats: { ...x.character.stats, health: 5 } } }, new Rng(seed)).health.illnesses.some((i) => i.defId === 'appendicitis');
    let fresh = 0;
    for (let seed = 1; seed <= 3000; seed++) {
      expect(ill(cured, seed)).toBe(false);
      expect(ill({ ...s, firedEvents: { ...s.firedEvents, kl_appendicitis: 8 } }, seed)).toBe(false);
      expect(ill({ ...s, firedEvents: { ...s.firedEvents, hl_appendix_pain: 25 } }, seed)).toBe(false);
      if (ill(s, seed)) fresh++;
    }
    expect(fresh).toBeGreaterThan(0);
  });
});

describe('birthdays behind bars', () => {
  it('no cake and no photographer in prison', () => {
    const s = at(49);
    const inside = applyEffects(s, new Rng(1), [{ prison: 3 }]);
    const fifty = ageUp(inside);
    const lines = fifty.log.filter((l) => l.age === 50).map((l) => l.text);
    expect(lines).toContain('Half a century old, and I spent the birthday behind bars.');
    expect(lines.join(' ')).not.toMatch(/cake/);
    const outside = ageUp(s);
    expect(outside.log.filter((l) => l.age === 50).map((l) => l.text)).toContain('Half a century. I got a cake with too many candles.');
  });

  it('the birthday a sentence ends is told after the walk out, never "behind bars"', () => {
    const s = at(49);
    const last = { ...applyEffects(s, new Rng(1), [{ prison: 3 }]), crime: { ...applyEffects(s, new Rng(1), [{ prison: 3 }]).crime, sentenceYearsLeft: 1 } };
    const fifty = ageUp(last);
    expect(fifty.crime.inPrison).toBe(false);
    const lines = fifty.log.filter((l) => l.age === 50 && l.kind !== 'year').map((l) => l.text);
    expect(lines.join(' ')).not.toMatch(/behind bars/);
    const out = lines.findIndex((l) => /prison|released|walked out|free/i.test(l));
    const cake = lines.indexOf('Half a century. I got a cake with too many candles.');
    expect(out).toBeGreaterThanOrEqual(0);
    expect(cake).toBeGreaterThan(out);
  });
});

describe('Clean Hands', () => {
  const test = (s: GameState) => ACHIEVEMENT_BY_ID.clean_hands!.test(markDeath({ ...s, character: { ...s.character, age: 85 } }, 'natural causes'), { ribbons: [], countries: [], lives: 1 });

  it('is about crimes I committed, not a false theft charge', () => {
    const s = at(70);
    expect(test(s)).toBe(true);
    // The false charge's court date: the plea, or a lost trial, does not take it away.
    const charged: GameState = { ...s, firedEvents: { ...s.firedEvents, cp_false_charge_court: 40 } };
    expect(test(applyEffects(charged, new Rng(1), [{ arrest: true }, { log: 'I admitted to something I did not do because it was cheaper.' }]))).toBe(true);
    expect(test(applyEffects(charged, new Rng(1), [{ prison: 1 }]))).toBe(true);
    // A card that ends a crime with only the arrest (perjury, a padded expense report) still does, as does a second arrest.
    expect(test(applyEffects(s, new Rng(1), [{ arrest: true }, { log: 'Lying under oath got me arrested and fined.' }]))).toBe(false);
    expect(test(applyEffects(charged, new Rng(1), [{ arrest: true }, { prison: 1 }]))).toBe(false);
    expect(test(applyEffects(s, new Rng(1), [{ counter: 'crimes' }]))).toBe(false);
    expect(test({ ...s, crime: { ...s.crime, crimesCommitted: 1 } })).toBe(false);
  });
});
