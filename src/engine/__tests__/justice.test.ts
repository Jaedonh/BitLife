import { EVENTS } from '@/data/events';
import { JUVENILE_DETENTION_EVENTS } from '@/data/events/juvenile_detention';
import { ageUp } from '../ageUp';
import { applyAction } from '../actions';
import { applyEffects, sendToPrison } from '../events/effects';
import { EVENT_REGISTRY } from '../events/registry';
import { validateEvent, type EventDef } from '../events/schema';
import { fitsState, makeRegistry, openNextEvent, resolveChoice } from '../events/select';
import { scaleMoney } from '../events/text';
import { Rng } from '../rng';
import { createLife } from '../systems/character';
import { crimeAvailability } from '../systems/crime';
import { activityAvailability } from '../systems/activities';
import { candidatesFor } from '../events/conditions';
import { CRIME_BY_ID } from '@/data/crimes';
import { ACTIVITY_BY_ID } from '@/data/activities';
import { money } from '../util';
import { markDeath } from '../systems/death';
import {
  acquittalChance,
  convictedYears,
  lawyerFee,
  oddsWords,
  PAROLE_EVENT_ID,
  paroleCard,
  paroleEligible,
  paroleHearingChance,
  SYSTEM_EVENTS,
  TRIAL_EVENT_ID,
  trialCard,
  upgradeJusticeState,
} from '../systems/justice';
import type { GameState } from '../types';

const noEvents = makeRegistry([]);

/** Seed 3 starts with a mother, a father and one sibling. A US life of the given age, with energy to act. */
function aged(age: number, patch: Partial<GameState> = {}): GameState {
  const s = createLife({ countryCode: 'US' }, 3);
  const people = Object.fromEntries(Object.entries(s.people).filter(([, p]) => p.kind !== 'pet'));
  return {
    ...s,
    people,
    year: s.character.birthYear + age,
    character: { ...s.character, age, energy: 4, energyMax: 4, stats: { ...s.character.stats, smarts: 50 } },
    crime: { ...s.crime, notoriety: 0 },
    eventQueue: [],
    pendingEvent: null,
    ...patch,
  };
}

const lawyerFeeText = (s: GameState, years: number) => money(s, lawyerFee(s, years));
const withCash = (s: GameState, cash: number): GameState => ({ ...s, finances: { ...s.finances, cash, debt: 0 } });
const highSchooler = (s: GameState, grade = 70): GameState => ({ ...s, education: { ...s.education, stage: 'high', enrolled: true, grade, yearsInStage: 1 } });

/** The court card for `years` on a charge, open on screen. */
function inCourt(s: GameState, years: number, crimeId = 'car_theft'): GameState {
  return openNextEvent({ ...s, eventQueue: [trialCard(s, crimeId, years)] }, EVENT_REGISTRY);
}

/** Answers the open card with a fixed rng word, so a branch can be picked by seed. */
function answer(s: GameState, choiceId: string, seed = 1): GameState {
  return resolveChoice({ ...s, rng: { s: seed } }, choiceId, EVENT_REGISTRY);
}

/** Ages up without random events, answering any card (parole hearings) with `choiceId` when given. */
function year(s: GameState, choiceId?: string): GameState {
  let n = ageUp(s, noEvents);
  while (n.pendingEvent) n = resolveChoice(n, choiceId && n.pendingEvent.choices.some((c) => c.id === choiceId) ? choiceId : n.pendingEvent.choices[0]!.id, noEvents);
  return n;
}

describe('court trial', () => {
  it('an arrest that carries a sentence opens the court card instead of a cell door', () => {
    let s: GameState | undefined;
    for (let seed = 1; seed < 300 && !s?.pendingEvent; seed++) s = applyAction({ ...aged(30), rng: { s: seed } }, { type: 'crime', id: 'car_theft' });
    expect(s?.pendingEvent?.eventId).toBe(TRIAL_EVENT_ID);
    expect(s!.crime.inPrison).toBe(false);
    expect(s!.crime.convictions).toBe(0);
    expect(s!.lastResult?.text).toBe('I was arrested for car theft. My case went to court.');
    expect(s!.pendingEvent!.text).toMatch(/^I stood in court, charged with car theft\. If convicted, I was looking at \d years? in prison\./);
    expect(s!.pendingEvent!.choices.map((c) => c.id)).toEqual(['plea', 'public', 'lawyer', 'self']);
    // No second crime while the case is open.
    expect(crimeAvailability(s!, CRIME_BY_ID.shoplift!)).toEqual({ available: false, reason: 'I have a court date first' });
  });

  it('pleading guilty is a certain 60% of the sentence, at least a year, and a little karma', () => {
    expect([1, 2, 3, 4, 5, 10].map((y) => convictedYears('plea', y))).toEqual([1, 1, 2, 2, 3, 6]);
    for (const seed of [1, 2, 3, 4, 5]) {
      const before = inCourt(aged(30), 5);
      expect(before.pendingEvent!.text).toContain('The prosecutor offered 3 years if I pleaded guilty.');
      const s = answer(before, 'plea', seed);
      expect(s.crime.inPrison).toBe(true);
      expect(s.crime.sentenceYearsLeft).toBe(3);
      expect(s.character.karma).toBe(before.character.karma + 1);
      expect(s.log.at(-1)?.text).toBe('I pleaded guilty. The judge gave me 3 years in prison.');
      expect(s.lastResult?.text).toBe('Guilty: 3 years in prison.');
    }
  });

  it('acquittal odds follow smarts, notoriety and the charge', () => {
    const smart = (smarts: number, notoriety = 0) => {
      const s = aged(30);
      return { ...s, character: { ...s.character, stats: { ...s.character.stats, smarts } }, crime: { ...s.crime, notoriety } };
    };
    expect(acquittalChance(smart(50), 'plea', 4)).toBe(0);
    expect(acquittalChance(smart(50), 'public', 4)).toBeCloseTo(0.2);
    expect(acquittalChance(smart(100), 'public', 4)).toBeCloseTo(0.4);
    expect(acquittalChance(smart(30), 'public', 4)).toBeCloseTo(0.2); // smarts only ever help the public defender
    expect(acquittalChance(smart(50, 30), 'public', 4)).toBeCloseTo(0.1);
    expect(acquittalChance(smart(50), 'lawyer', 1)).toBeCloseTo(0.6);
    expect(acquittalChance(smart(50), 'lawyer', 10)).toBeCloseTo(0.45);
    expect(acquittalChance(smart(100, 40), 'lawyer', 1)).toBeCloseTo(0.6);
    expect(acquittalChance(smart(50), 'self', 4)).toBeCloseTo(0.1);
    expect(acquittalChance(smart(95), 'self', 4)).toBeCloseTo(0.4);
    expect(acquittalChance(smart(5), 'self', 4)).toBeCloseTo(0.02);
  });

  it('losing costs the full sentence with a public defender, 0.8x with a lawyer and 1.3x alone', () => {
    expect(convictedYears('public', 4)).toBe(4);
    expect(convictedYears('lawyer', 4)).toBe(3);
    expect(convictedYears('self', 4)).toBe(5);
    expect(convictedYears('lawyer', 1)).toBe(1);
    const outcomes = (plea: 'public' | 'lawyer' | 'self') => {
      const court = inCourt(withCash(aged(30), 1_000_000), 4);
      const years = new Map<number, number>();
      for (let seed = 1; seed <= 400; seed++) {
        const s = answer(court, plea, seed * 7919);
        const y = s.crime.inPrison ? s.crime.sentenceYearsLeft : 0;
        years.set(y, (years.get(y) ?? 0) + 1);
      }
      return years;
    };
    const pub = outcomes('public');
    expect([...pub.keys()].sort()).toEqual([0, 4]);
    expect(pub.get(0)! / 400).toBeGreaterThan(0.13);
    expect(pub.get(0)! / 400).toBeLessThan(0.27);
    expect([...outcomes('lawyer').keys()].sort()).toEqual([0, 3]);
    expect([...outcomes('self').keys()].sort()).toEqual([0, 5]);
  });

  it('an acquittal sends the player home with an arrest but no conviction or record', () => {
    const court = inCourt(aged(30), 4);
    let s = court;
    for (let seed = 1; seed < 200 && (s === court || s.crime.inPrison); seed++) s = answer(court, 'self', seed);
    expect(s.crime.inPrison).toBe(false);
    expect(s.crime.convictions).toBe(0);
    expect(s.crime.record).toBe(false);
    expect(s.crime.arrests).toBe(1);
    expect(s.counters.arrests).toBe(1);
    expect(s.log.at(-1)?.text).toContain('Not guilty.');
  });

  it('a lawyer costs more for a bigger charge and is paid up front', () => {
    const us = aged(30);
    expect(lawyerFee(us, 1)).toBe(4000);
    expect(lawyerFee(us, 5)).toBe(20000);
    expect(lawyerFee(us, 15)).toBe(60000);
    expect(lawyerFee(us, 20)).toBe(60000);
    const india = { ...us, character: { ...us.character, countryCode: 'IN' } };
    expect(lawyerFee(india, 1)).toBe(scaleMoney(india, 4000));
    const court = inCourt(withCash(us, 50_000), 5);
    expect(court.pendingEvent!.choices.find((c) => c.id === 'lawyer')!.hint).toMatch(/^\$20,000 · (a long shot|probably lose|could go either way|probably win|almost sure to win)$/);
    const s = answer(court, 'lawyer');
    expect(s.finances.cash).toBe(30_000);
    expect(s.log.some((l) => l.text === 'I paid a lawyer $20,000.')).toBe(true);
  });

  it("a minor's parents pay for the lawyer", () => {
    const teen = aged(16);
    const parents = Object.values(teen.people).filter((p) => p.kind === 'mother' || p.kind === 'father');
    const rich = { ...teen, people: { ...teen.people, [parents[0]!.id]: { ...parents[0]!, money: 100_000 } } };
    const s = answer(inCourt(rich, 2), 'lawyer');
    expect(s.people[parents[0]!.id]!.money).toBe(100_000 - lawyerFee(rich, 2));
    expect(s.finances.debt).toBe(0);
    expect(s.log.some((l) => l.text.startsWith('My parents paid $'))).toBe(true);
  });

  it('a lawyer the player cannot afford refuses, and the card comes back without one', () => {
    const court = inCourt(withCash(aged(30), 100), 3);
    const lawyer = court.pendingEvent!.choices.find((c) => c.id === 'lawyer')!;
    expect(lawyer.hint).toBe('$12,000 · more than I have');
    expect(court.pendingEvent!.context['tone:lawyer']).toBe('credit');
    const refused = answer(court, 'lawyer');
    expect(refused.crime.inPrison).toBe(false);
    expect(refused.finances.debt).toBe(0);
    expect(refused.log.at(-1)?.text).toBe("The lawyer wanted $12,000 up front. I didn't have it.");
    expect(refused.pendingEvent?.eventId).toBe(TRIAL_EVENT_ID);
    expect(refused.pendingEvent!.choices.map((c) => c.id)).toEqual(['plea', 'public', 'self']);
    expect(refused.pendingEvent!.text).toBe('No lawyer, then. The judge was still waiting. If convicted, I was looking at 3 years in prison. The prosecutor offered 2 years if I pleaded guilty.');
    expect(answer(refused, 'plea').crime.sentenceYearsLeft).toBe(2);
  });

  it('hints give the cost and the odds in words, never a percentage', () => {
    for (const [smarts, notoriety, years] of [[50, 0, 1], [90, 0, 3], [20, 60, 8], [100, 0, 15]] as const) {
      const s = aged(30);
      const court = inCourt({ ...s, character: { ...s.character, stats: { ...s.character.stats, smarts } }, crime: { ...s.crime, notoriety } }, years);
      for (const c of court.pendingEvent!.choices) {
        expect(c.hint).toBeDefined();
        expect(c.hint).not.toMatch(/%|\d\.\d|\{\{/);
      }
      const hints = Object.fromEntries(court.pendingEvent!.choices.map((c) => [c.id, c.hint!]));
      expect(hints.plea).toMatch(/^\d+ years?, guaranteed$/);
      expect(hints.public).toMatch(/^Free · /);
      expect(hints.self).toMatch(/^Free · /);
      expect(hints.lawyer).toMatch(/^\$[\d,]+ · /);
    }
    expect([0.05, 0.3, 0.5, 0.7, 0.9].map((p) => oddsWords(p, 'trial'))).toEqual(['a long shot', 'probably lose', 'could go either way', 'probably win', 'almost sure to win']);
    expect([0.05, 0.3, 0.5, 0.7, 0.9].map((p) => oddsWords(p, 'parole'))).toEqual(['a long shot', 'unlikely', 'could go either way', 'probably granted', 'almost certain']);
  });

  it('notoriety grows with the sentence actually passed (rounded), not the raw years', () => {
    expect(sendToPrison(aged(30), 2.6).crime.notoriety).toBe(9);
    expect(sendToPrison(aged(30), 0.2).crime.notoriety).toBe(3);
    expect(sendToPrison(aged(30), 4).crime.notoriety).toBe(12);
  });
});

describe('juvenile court', () => {
  it('a minor goes to juvenile detention: at most two years in all, and out by 18', () => {
    const s14 = sendToPrison(aged(14), 5);
    expect(s14.crime.juvenile).toBe(true);
    expect(s14.crime.sentenceYearsLeft).toBe(2);
    expect(sendToPrison(aged(17), 5).crime.sentenceYearsLeft).toBe(1);
    expect(sendToPrison(s14, 3).crime.sentenceYearsLeft).toBe(2);
    expect(sendToPrison(aged(18), 5).crime.juvenile).toBeUndefined();
    let s = year(s14);
    expect(s.crime.inPrison).toBe(true);
    expect(s.log.some((l) => l.age === 15 && l.text === 'Another year in juvenile detention. 1 year to go.')).toBe(true);
    s = year(s);
    expect(s.crime.inPrison).toBe(false);
    expect(s.crime.juvenile).toBeUndefined();
    expect(s.flags.released).toBe(true);
    expect(s.log.some((l) => l.age === 16 && /^I walked out of juvenile detention with my things in a plastic bag\. (Mom|Dad) was waiting outside\.$/.test(l.text))).toBe(true);
  });

  it('juvenile court asks for at most two years, and a plea deal works down from that', () => {
    const court = inCourt(aged(15), 5);
    expect(court.pendingEvent!.text).toBe('I stood in juvenile court, charged with car theft. If convicted, I was looking at 2 years in juvenile detention. The prosecutor offered 1 year if I pleaded guilty.');
    expect(court.pendingEvent!.choices[0]!.hint).toBe('1 year, guaranteed');
    // The lawyer's fee still follows the charge.
    expect(court.pendingEvent!.context.fee).toBe(String(lawyerFee(aged(15), 5)));
    const convicted = answer(court, 'plea');
    expect(convicted.crime.sentenceYearsLeft).toBe(1);
    expect(convicted.log.at(-1)?.text).toBe('I admitted it. The judge gave me 1 year in juvenile detention.');
    const lost = [...Array(60).keys()].map((seed) => answer(court, 'self', seed + 1)).filter((x) => x.crime.inPrison);
    expect(lost.length).toBeGreaterThan(40);
    for (const x of lost) expect(x.crime.sentenceYearsLeft).toBe(2);
  });

  it('school carries on in detention, so a teen jailed at 14 still finishes high school', () => {
    let s = highSchooler(aged(14), 75);
    s = { ...s, character: { ...s.character, stats: { ...s.character.stats, smarts: 70 } } };
    s = sendToPrison(s, 4);
    expect(s.crime.juvenile).toBe(true);
    expect(s.crime.sentenceYearsLeft).toBe(2);
    expect(s.education.enrolled).toBe(true);
    s = year(s);
    expect(s.education.enrolled).toBe(true);
    expect(s.log.some((l) => l.age === 15 && l.text === 'I did my schoolwork in detention.')).toBe(true);
    for (let i = 0; i < 3; i++) s = year(s);
    expect(s.character.age).toBe(18);
    expect(s.education.degrees).toContain('high_school');
  });

  it('a diploma can be earned inside, where high school ends at 17', () => {
    const br = { ...aged(16), character: { ...aged(16).character, countryCode: 'BR', stats: { ...aged(16).character.stats, smarts: 70 } } };
    let s = sendToPrison(highSchooler(br, 80), 2);
    s = year(s);
    expect(s.crime.inPrison).toBe(true);
    expect(s.education.degrees).toContain('high_school');
  });

  it('released before 18 without a diploma, a student goes back to school; a dropout does not', () => {
    // Expelled before the conviction, so not enrolled inside.
    const expelled = { ...aged(15), education: { ...aged(15).education, stage: 'high' as const, enrolled: false, expelled: true, grade: 40 } };
    let s = year(sendToPrison(expelled, 1));
    expect(s.crime.inPrison).toBe(false);
    expect(s.education.enrolled).toBe(true);
    expect(s.education.stage).toBe('high');
    expect(s.education.expelled).toBe(false);
    expect(s.log.some((l) => l.text.startsWith('I went back to high school.'))).toBe(true);
    const dropout = { ...aged(16), education: { ...aged(16).education, stage: 'done' as const, enrolled: false, droppedOut: true } };
    s = year(sendToPrison(dropout, 1));
    expect(s.crime.inPrison).toBe(false);
    expect(s.education.enrolled).toBe(false);
  });

  it('a juvenile record is sealed at 18; an adult conviction stays on it', () => {
    let s = year(sendToPrison(aged(16), 1));
    expect(s.crime.record).toBe(true);
    s = year(s);
    expect(s.character.age).toBe(18);
    expect(s.crime.record).toBe(false);
    expect(s.crime.sealedConvictions).toBe(1);
    expect(s.log.some((l) => l.text === 'My juvenile record was sealed. On paper, adult me starts clean.')).toBe(true);
    expect(markDeath(s, 'a heart attack').death!.obituary).not.toMatch(/conviction/);
    s = year(year(sendToPrison(s, 1)));
    expect(s.crime.inPrison).toBe(false);
    expect(s.crime.record).toBe(true);
    expect(markDeath(s, 'a heart attack').death!.obituary).toMatch(/had one conviction on record/);
  });

  it('prison events stay out of juvenile detention, and detention events out of everywhere else', () => {
    const detained = sendToPrison(aged(16), 2);
    const adultInside = sendToPrison(aged(30), 2);
    const free = aged(16);
    // Events written for detention say { juvenile: true } (the jd_ file, and others such as a grandparent's visit).
    const forDetention = (d: (typeof EVENTS)[number]) => !!d.conditions?.some((c) => 'juvenile' in c && c.juvenile);
    const prisonEvents = EVENTS.filter((d) => !d.id.startsWith('jd_') && !forDetention(d) && d.conditions?.some((c) => 'inPrison' in c && c.inPrison));
    expect(prisonEvents.length).toBeGreaterThan(5);
    for (const def of prisonEvents) expect([def.id, fitsState({ ...detained, character: { ...detained.character, age: Math.max(def.minAge, 16) } }, def)]).toEqual([def.id, false]);
    expect(JUVENILE_DETENTION_EVENTS.length).toBeGreaterThanOrEqual(8);
    for (const def of JUVENILE_DETENTION_EVENTS) {
      expect(def.id).toMatch(/^jd_/);
      expect(fitsState(adultInside, def)).toBe(false);
      expect(fitsState(free, def)).toBe(false);
    }
    expect(JUVENILE_DETENTION_EVENTS.filter((def) => fitsState(highSchooler(detained), def)).length).toBeGreaterThanOrEqual(8);
  });
});

describe('parole', () => {
  /** An adult `served` years into a `total`-year sentence. */
  function serving(total: number, served: number, flags: GameState['flags'] = {}): GameState {
    const s = sendToPrison(aged(30), total);
    return { ...s, flags: { ...s.flags, ...flags }, crime: { ...s.crime, sentenceYearsLeft: total - served } };
  }

  it('a hearing is possible only after half of an adult sentence is served', () => {
    expect(paroleEligible(serving(6, 2))).toBe(false);
    expect(paroleEligible(serving(6, 3))).toBe(true);
    expect(paroleEligible(serving(1, 0))).toBe(false);
    expect(paroleEligible(sendToPrison(aged(16), 2))).toBe(false);
    // A sentence added inside lengthens the stay that half is measured against.
    expect(sendToPrison(serving(6, 3), 4).crime.sentenceYears).toBe(10);
    expect(paroleEligible(sendToPrison(serving(6, 3), 4))).toBe(false);
  });

  it('a hearing comes up about 30% of years, more with good conduct, less with write-ups', () => {
    expect(paroleHearingChance(serving(6, 3))).toBeCloseTo(0.3);
    expect(paroleHearingChance(serving(6, 3, { cp_prison_good_conduct: 3 }))).toBeCloseTo(0.45);
    expect(paroleHearingChance(serving(6, 3, { cp_prison_infraction: 4 }))).toBeCloseTo(0.1);
    expect(paroleHearingChance(serving(6, 3, { cp_parole_recommended: true }))).toBeCloseTo(0.5);
    let hearings = 0;
    let early = 0;
    for (let seed = 1; seed <= 200; seed++) {
      let s: GameState = { ...sendToPrison(aged(30), 8), rng: { s: seed } };
      for (let y = 0; y < 7 && s.crime.inPrison; y++) {
        s = ageUp(s, noEvents);
        if (s.pendingEvent?.eventId === PAROLE_EVENT_ID) {
          hearings++;
          if (8 - s.crime.sentenceYearsLeft < 4) early++;
        }
        // Set the card aside unanswered, as a denied hearing would leave things (waiving ends hearings for the stay).
        s = { ...s, pendingEvent: null, eventQueue: [] };
      }
    }
    expect(early).toBe(0);
    // Four eligible years (served 4..7) at 30% each.
    expect(hearings / 200).toBeGreaterThan(0.9);
    expect(hearings / 200).toBeLessThan(1.5);
  });

  it('granted parole releases the player with a parole flag for two years', () => {
    const inside = serving(6, 3, { cp_prison_good_conduct: 5 });
    const card = openNextEvent({ ...inside, eventQueue: [paroleCard(inside)] }, EVENT_REGISTRY);
    expect(card.pendingEvent?.eventId).toBe(PAROLE_EVENT_ID);
    expect(card.pendingEvent!.text).toBe('The parole board had my file open: 3 years served, 3 years to go. My file mentioned good behavior more than once. They asked what I would do with my freedom.');
    expect(card.pendingEvent!.choices.map((c) => c.hint)).toEqual(['Almost certain', 'Probably granted', 'No parole strings']);
    let s = card;
    for (let seed = 1; seed < 50 && s.crime.inPrison; seed++) s = answer(card, 'remorse', seed);
    expect(s.crime.inPrison).toBe(false);
    expect(s.flags.parole).toBe(true);
    expect(s.flags.released).toBe(true);
    expect(s.crime.paroleYearsLeft).toBe(2);
    expect(s.log.at(-1)?.text).toBe("The board granted parole. I walked out with my things in a paper bag and a parole officer's number.");
    s = year(s);
    expect(s.crime.paroleYearsLeft).toBe(1);
    s = year(s);
    expect(s.crime.paroleYearsLeft).toBeUndefined();
    expect(s.flags.parole).toBeUndefined();
    expect(s.log.some((l) => l.text === 'My parole ended. Nobody checks up on me anymore.')).toBe(true);
  });

  it('waiving the hearing keeps the player inside to serve the full time', () => {
    const inside = serving(6, 3);
    const s = answer(openNextEvent({ ...inside, eventQueue: [paroleCard(inside)] }, EVENT_REGISTRY), 'waive');
    expect(s.crime.inPrison).toBe(true);
    expect(s.crime.sentenceYearsLeft).toBe(3);
  });

  it('a conviction while on parole counts double and ends the parole', () => {
    const paroled: GameState = { ...aged(30), crime: { ...aged(30).crime, paroleYearsLeft: 2 }, flags: { parole: true } };
    const s = applyEffects(paroled, new Rng(1), [{ prison: 2 }]);
    expect(s.crime.sentenceYearsLeft).toBe(4);
    expect(s.crime.paroleYearsLeft).toBeUndefined();
    expect(s.flags.parole).toBeUndefined();
    let arrested: GameState | undefined;
    for (let seed = 1; seed < 300 && !arrested?.pendingEvent; seed++) arrested = applyAction({ ...paroled, rng: { s: seed } }, { type: 'crime', id: 'car_theft' });
    const years = Number(arrested!.pendingEvent!.context.years);
    expect(years % 2).toBe(0);
    expect(arrested!.pendingEvent!.text).toContain('I was on parole, so it counted double.');
  });
});

describe('the court and parole cards', () => {
  it('are valid events in every registry, never picked at random', () => {
    const ids = new Set([...EVENTS.map((e) => e.id), ...SYSTEM_EVENTS.map((e) => e.id)]);
    for (const def of SYSTEM_EVENTS) {
      expect(validateEvent(def, ids)).toEqual([]);
      expect(def.followUpOnly).toBe(true);
      expect(noEvents.byId[def.id]).toBe(def);
      expect(EVENT_REGISTRY.byId[def.id]).toBe(def);
    }
  });

  it('content cannot use the court effects or card vars', () => {
    const content: EventDef = {
      id: 'tn_test_court',
      category: 'crime',
      title: 'Test',
      text: 'A judge looked at me.',
      minAge: 18,
      maxAge: 80,
      weight: 1,
      conditions: [{ inPrison: false }],
      vars: ['charge'],
      choices: [{ id: 'plead', label: 'Plead', effects: [{ trial: 'plea' }] }],
    };
    const errors = validateEvent(content, new Set([content.id]));
    expect(errors.some((e) => e.includes('court or parole effect'))).toBe(true);
    expect(errors.some((e) => e.includes('declare vars'))).toBe(true);
    const bad = { ...SYSTEM_EVENTS[0]!, choices: [{ id: 'x', label: 'X', effects: [{ trial: 'bribe' as never }] }] };
    expect(validateEvent(bad, new Set([bad.id])).some((e) => e.includes('unknown trial plea'))).toBe(true);
  });
});

describe('older saves', () => {
  it('a minor serving adult time moves to juvenile detention and back into school', () => {
    const old: GameState = { ...highSchooler(aged(15)), crime: { ...aged(15).crime, inPrison: true, sentenceYearsLeft: 5, record: true, convictions: 1 } };
    const legacy = { ...old, education: { ...old.education, enrolled: false } };
    const s = upgradeJusticeState(legacy);
    expect(s.crime.juvenile).toBe(true);
    expect(s.crime.sentenceYearsLeft).toBe(2);
    expect(s.education.enrolled).toBe(true);
  });

  it("an adult's stay gets a length for parole, and a free life is left alone", () => {
    const inside: GameState = { ...aged(30), crime: { ...aged(30).crime, inPrison: true, sentenceYearsLeft: 4 } };
    expect(upgradeJusticeState(inside).crime.sentenceYears).toBe(4);
    const free = aged(30);
    expect(upgradeJusticeState(free)).toBe(free);
  });
});

describe('review fixes', () => {
  it("an event's own verdict comes first, then how parole or juvenile court changed it", () => {
    const verdict = { log: 'Two years for transporting stolen goods.', kind: 'bad' as const };
    // A 17-year-old serves one year at most, so "two years" needs a correction after the event's line.
    const teen = applyEffects(aged(17), new Rng(1), [{ prison: 2 }, verdict]);
    expect(teen.crime.sentenceYearsLeft).toBe(1);
    expect(teen.log.slice(-2).map((l) => l.text)).toEqual(['Two years for transporting stolen goods.', 'I was 17, so it meant juvenile detention instead: 1 year.']);
    // Inside a random or chance branch, the note follows that branch's own line.
    const nested = applyEffects(aged(14), new Rng(1), [{ chance: 1, then: [{ prison: 1 }, { log: 'One year.', kind: 'bad' }] }]);
    expect(nested.log.slice(-2).map((l) => l.text)).toEqual(['One year.', "I was 14, so I'd serve it in juvenile detention."]);
    const paroled: GameState = { ...aged(30), crime: { ...aged(30).crime, paroleYearsLeft: 1 }, flags: { parole: true } };
    const back = applyEffects(paroled, new Rng(1), [{ prison: 2 }, verdict]);
    expect(back.crime.sentenceYearsLeft).toBe(4);
    expect(back.log.slice(-2).map((l) => l.text)).toEqual(['Two years for transporting stolen goods.', 'I was on parole, so it counted double: 4 years.']);
    // An adult off parole serves what the event said: no note.
    expect(applyEffects(aged(30), new Rng(1), [{ prison: 2 }, verdict]).log.at(-1)?.text).toBe('Two years for transporting stolen goods.');
  });

  it('juvenile detention lasts two years in all, even if time is added inside', () => {
    let s = sendToPrison(aged(15), 2);
    s = { ...s, crime: { ...s.crime, sentenceYearsLeft: 1 } }; // one year served
    s = sendToPrison(s, 3);
    expect(s.crime.sentenceYearsLeft).toBe(1);
    expect(s.crime.sentenceYears).toBe(2);
  });

  it("a minor's refused lawyer: we didn't have it, whoever we are", () => {
    const orphan = { ...aged(16), people: {} };
    const s = answer(inCourt(orphan, 3), 'lawyer');
    expect(s.log.at(-1)?.text).toBe(`The lawyer wanted ${lawyerFeeText(orphan, 3)} up front. We didn't have it.`);
    expect(s.pendingEvent?.choices.map((c) => c.id)).toEqual(['plea', 'public', 'self']);
  });

  it('mail call in detention comes from someone old enough to write a letter', () => {
    const def = JUVENILE_DETENTION_EVENTS.find((d) => d.id === 'jd_mail_call')!;
    const inside = sendToPrison(aged(15), 2);
    const toddler = { ...Object.values(inside.people).find((p) => p.kind === 'sibling')!, age: 3 };
    const onlyToddler = { ...inside, people: { [toddler.id]: toddler } };
    expect(candidatesFor(onlyToddler, def.person!)).toEqual([]);
    expect(candidatesFor({ ...inside, people: { [toddler.id]: { ...toddler, age: 12 } } }, def.person!)).toHaveLength(1);
  });

  it("a content card's queued context never stands in for its placeholders", () => {
    const def: EventDef = {
      id: 'tn_test_context',
      category: 'family',
      title: 'Test',
      text: '{{person}} looked at me.',
      minAge: 0,
      maxAge: 120,
      weight: 1,
      person: { kind: ['mother'] },
      choices: [{ id: 'ok', label: 'Smile', effects: [{ log: '{{person}} smiled back.' }] }],
    };
    const reg = makeRegistry([def]);
    const s = aged(10);
    const mother = Object.values(s.people).find((p) => p.kind === 'mother')!;
    const opened = openNextEvent({ ...s, eventQueue: [{ eventId: def.id, context: { person: 'Nobody' }, personId: mother.id }] }, reg);
    expect(opened.pendingEvent!.text).toBe('Mom looked at me.');
    expect(resolveChoice(opened, 'ok', reg).log.at(-1)?.text).toBe('Mom smiled back.');
  });

  it('serving my full time means no more hearings this stay, and the board does not sit twice in a year', () => {
    const inside = { ...sendToPrison(aged(30), 8), crime: { ...sendToPrison(aged(30), 8).crime, sentenceYearsLeft: 4 } };
    const board = { eventId: 'cp_parole_hearing', context: {} };
    const card = openNextEvent({ ...inside, eventQueue: [paroleCard(inside), board] }, EVENT_REGISTRY);
    const waived = resolveChoice(card, 'waive', EVENT_REGISTRY);
    expect(waived.pendingEvent).toBeNull();
    expect(waived.eventQueue).toEqual([]);
    expect(paroleEligible(waived)).toBe(false);
    let s = waived;
    for (let y = 0; y < 4; y++) {
      s = ageUp({ ...s, rng: { s: 1000 + y } }, noEvents);
      expect(s.pendingEvent?.eventId).not.toBe(PAROLE_EVENT_ID);
    }
    expect(s.crime.inPrison).toBe(false);
    expect(s.flags.paroleWaived).toBeUndefined();
    // A denied hearing also drops the content board queued behind it that year.
    let denied = card;
    for (let seed = 1; seed < 50 && !denied.log.at(-1)?.text.includes('Parole denied'); seed++) denied = resolveChoice({ ...card, rng: { s: seed } }, 'plans', EVENT_REGISTRY);
    expect(denied.crime.inPrison).toBe(true);
    expect(denied.pendingEvent).toBeNull();
    expect(denied.flags.paroleWaived).toBeUndefined();
  });

  it('the Activities screen says detention, not prison, for a minor', () => {
    const detained = sendToPrison(aged(15), 2);
    expect(crimeAvailability(detained, CRIME_BY_ID.shoplift!)).toEqual({ available: false, reason: 'In detention' });
    expect(activityAvailability(detained, ACTIVITY_BY_ID.movies!).reason).toBe('Not available in detention');
    const adult = sendToPrison(aged(30), 2);
    expect(crimeAvailability(adult, CRIME_BY_ID.shoplift!).reason).toBe('In prison');
    expect(activityAvailability(adult, ACTIVITY_BY_ID.movies!).reason).toBe('Not available in prison');
  });
});
