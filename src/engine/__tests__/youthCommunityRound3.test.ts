/**
 * Youth, community and travel content (the third playtest's q_ca findings). Each block pins one fix: a foster child
 * hears from no aunt or cousin, moving back home is a state the card respects, lawn and hedge scenes need a house
 * with a yard, the roommate card is for a single player, a broke player still has two choices, parole keeps me home,
 * a farm or immigrant family makes no extra move, the foster parent since birth is not new at the school gate, the
 * parents are met early on, no US-only details abroad, office scenes need a desk job, and people a card makes have
 * the job and the age its text gives them.
 */
import { JOBS } from '@/data/jobs';
import { FRIENDS_AND_STRANGERS_EVENTS } from '@/data/events/friends_and_strangers';
import { KID_LIFE_EVENTS } from '@/data/events/kid_life';
import { KID_YEARS_EVENTS } from '@/data/events/kid_years';
import { LIVES_IN_HOUSE_WITH_YARD, NEIGHBOURS_AND_COMMUNITY_EVENTS } from '@/data/events/neighbours_and_community';
import { PET_EVENTS } from '@/data/events/pet_events';
import { DESK_JOB, TECHNOLOGY_AND_MEDIA_EVENTS } from '@/data/events/technology_and_media';
import { TEEN_LIFE_EVENTS } from '@/data/events/teen_life';
import { TEEN_YEARS_EVENTS } from '@/data/events/teen_years';
import { NOT_ON_PAROLE, TRAVEL_EVENTS } from '@/data/events/travel_events';
import { YOUNG_ADULT_EVENTS } from '@/data/events/young_adult';
import { YOUNG_ADULT_PATHS_EVENTS } from '@/data/events/young_adult_paths';
import { applyAction } from '../actions';
import { ageUp } from '../ageUp';
import { candidatesFor, evaluateAll, evaluateCondition } from '../events/conditions';
import { applyEffects } from '../events/effects';
import type { ChoiceDef, Condition, Effect, EventDef, PersonSelector } from '../events/schema';
import { fitsState, isEligible, makeRegistry } from '../events/select';
import { Rng } from '../rng';
import { createLife, makePerson } from '../systems/character';
import type { GameState, NewLifeOptions, Person, RelationshipKind } from '../types';

/** The files this group owns. */
const MINE: readonly EventDef[] = [
  ...KID_YEARS_EVENTS,
  ...KID_LIFE_EVENTS,
  ...NEIGHBOURS_AND_COMMUNITY_EVENTS,
  ...PET_EVENTS,
  ...FRIENDS_AND_STRANGERS_EVENTS,
  ...TEEN_YEARS_EVENTS,
  ...TEEN_LIFE_EVENTS,
  ...YOUNG_ADULT_EVENTS,
  ...YOUNG_ADULT_PATHS_EVENTS,
  ...TECHNOLOGY_AND_MEDIA_EVENTS,
  ...TRAVEL_EVENTS,
];
const ev = (id: string): EventDef => {
  const e = MINE.find((x) => x.id === id);
  if (!e) throw new Error(`no event ${id} in this group's files`);
  return e;
};
const choice = (id: string, c: string): ChoiceDef => ev(id).choices.find((x) => x.id === c)!;

function logs(effects: readonly Effect[]): string[] {
  return effects.flatMap((e) => [
    ...('log' in e ? [e.log] : []),
    ...('newPerson' in e && e.newPerson.log ? [e.newPerson.log] : []),
    ...('chance' in e ? [...logs(e.then), ...logs(e.else ?? [])] : []),
    ...('random' in e ? e.random.flatMap((o) => logs(o.effects)) : []),
  ]);
}
function allEffects(effects: readonly Effect[]): Effect[] {
  return effects.flatMap((e) => [e, ...('chance' in e ? [...allEffects(e.then), ...allEffects(e.else ?? [])] : []), ...('random' in e ? e.random.flatMap((o) => allEffects(o.effects)) : [])]);
}
const choiceLines = (c: ChoiceDef): string[] => [c.label, c.hint ?? '', ...logs(c.effects)];
const lines = (e: EventDef): string[] => [e.title, e.text, ...e.choices.flatMap(choiceLines)];
const has = (conds: readonly Condition[] | undefined, want: Condition): boolean => (conds ?? []).some((c) => JSON.stringify(c) === JSON.stringify(want));

const EMPTY = makeRegistry([]);
/** A life aged year by year with no cards, so scenario rules (the move abroad, foster care) play out. */
function grow(opts: NewLifeOptions, seed: number, age: number): GameState {
  let s = createLife({ countryCode: 'US', ...opts }, seed, 0);
  while (s.character.age < age) s = ageUp(s, EMPTY);
  return { ...s, pendingEvent: null, eventQueue: [] };
}
/** A plain state at an age, with cash and no cards fired. */
function at(age: number, opts: NewLifeOptions = {}, seed = 4242): GameState {
  const s = createLife({ countryCode: 'US', scenario: 'standard', ...opts }, seed);
  const noPets = Object.fromEntries(Object.entries(s.people).filter(([, p]) => p.kind !== 'pet'));
  return { ...s, people: noPets, character: { ...s.character, age }, finances: { ...s.finances, cash: 50_000 }, firedEvents: {} };
}
function withPerson(s: GameState, kind: RelationshipKind, age: number, extra: Partial<Person> = {}): [GameState, Person] {
  const p: Person = { ...makePerson(new Rng(age * 7 + kind.length), { kind, age, countryCode: s.character.countryCode, playerAge: s.character.age }), ...extra };
  return [{ ...s, people: { ...s.people, [p.id]: p } }, p];
}
function withJob(s: GameState, defId: string): GameState {
  const d = JOBS.find((j) => j.id === defId)!;
  const job = { defId, title: d.ladder[0]!.title, company: 'Evergreen Coffee', salary: d.ladder[0]!.salary, level: 0, performance: 50, yearsHeld: 1, yearsAtLevel: 1, category: d.category, partTime: !!d.partTime, askedThisYear: false, workedHarderThisYear: false };
  return { ...s, career: { ...s.career, job } };
}
function owning(s: GameState, ...defIds: string[]): GameState {
  let t: GameState = { ...s, finances: { ...s.finances, cash: 30_000_000 } };
  for (const defId of defIds) t = applyAction(t, { type: 'buyAsset', defId, financing: 'cash' });
  expect(t.assets.map((a) => a.defId)).toEqual(defIds);
  return { ...t, pendingEvent: null, lastResult: null };
}
const binds = (s: GameState, sel: PersonSelector | undefined, p: Person) => candidatesFor(s, sel!).some((x) => x.id === p.id);

describe('a foster child hears from no aunt, great-aunt, uncle or cousin', () => {
  // The player's own relatives, not someone else's ("the manager's nephew", "their cousin").
  const RELATIVE = /\b(my|a visiting) (great-)?(aunt|uncle|cousin)s?\b|\bgreat-(aunt|uncle)\b|\bI have a cousin\b|\bOne was my cousin\b/i;
  const FOSTER_GUARD: Condition = { not: { flag: 'foster_care' } };
  const parentsOnly = (e: EventDef) => !!e.person && e.person.kind.every((k) => k === 'mother' || k === 'father');

  it('every card or choice that names one of my relatives leaves foster children out', () => {
    const open: string[] = [];
    for (const e of MINE) {
      if (parentsOnly(e) || has(e.conditions, FOSTER_GUARD)) continue; // an orphan has no mother or father to bind
      if ([e.title, e.text].some((l) => RELATIVE.test(l))) open.push(e.id);
      for (const c of e.choices) if (choiceLines(c).some((l) => RELATIVE.test(l)) && !has(c.conditions, FOSTER_GUARD)) open.push(`${e.id}/${c.id}`);
    }
    expect(open).toEqual([]);
  });

  it("the great-aunt's twenty, the aunt's card, the reindeer sweater and the great-uncle's call skip an orphan", () => {
    const orphan8 = grow({ scenario: 'orphan' }, 31001, 8);
    const orphan15 = grow({ scenario: 'orphan' }, 31001, 15);
    expect(orphan8.flags.foster_care).toBe(true);
    const kid8 = grow({ scenario: 'standard' }, 31001, 8);
    for (const id of ['kl_birthday_money', 'kl_eyebrow_call']) {
      expect([id, isEligible({ ...orphan8, year: 2020 }, ev(id))]).toEqual([id, false]);
      expect([id, isEligible({ ...kid8, year: 2020 }, ev(id))]).toEqual([id, true]);
    }
    expect(isEligible(orphan8, ev('kl_reindeer_sweater'))).toBe(false);
    expect(isEligible(orphan15, ev('tl_birthday_15'))).toBe(false);
    expect(isEligible(grow({ scenario: 'standard' }, 31001, 15), ev('tl_birthday_15'))).toBe(true);
  });
});

describe('moving back home', () => {
  const card = () => ev('ya_move_back_home');
  const flagOf = (effects: readonly Effect[]) => allEffects(effects).find((e) => 'flag' in e && e.flag === 'home_with_parents') as { set?: unknown } | undefined;

  it("'Move back home' and 'ended up home anyway' set home_with_parents, which the engine reads as living at home", () => {
    expect(flagOf(choice('ya_move_back_home', 'move').effects)?.set).toBe(true);
    expect(flagOf(choice('ya_move_back_home', 'tough').effects)?.set).toBe(true);
    expect(flagOf(choice('ya_move_back_home', 'couch').effects)).toBeUndefined();
  });

  it('the card does not offer the move again while I live there, nor a "first apartment" after it', () => {
    let s = withJob(at(22), 'retail');
    s = { ...s, career: { ...s.career, job: { ...s.career.job!, salary: 25_000 } }, finances: { ...s.finances, cash: 100 } };
    expect(evaluateAll(s, card().conditions)).toBe(true);
    expect(evaluateAll(s, ev('ya_first_apartment').conditions)).toBe(true);
    const moved = applyEffects(s, new Rng(1), choice('ya_move_back_home', 'move').effects);
    const home = { ...moved, firedEvents: { ...moved.firedEvents, ya_move_back_home: 22 } };
    expect(home.flags.home_with_parents).toBe(true);
    expect(evaluateAll(home, card().conditions)).toBe(false);
    expect(evaluateAll(home, ev('ya_first_apartment').conditions)).toBe(false);
    // The engine clears the flag once I move out (a home, a wedding, a partner, a move); then the card can come back.
    const { home_with_parents: _gone, ...flags } = home.flags;
    expect(evaluateAll({ ...home, flags }, card().conditions)).toBe(true);
  });

  it('is not offered to someone the move could not hold: married, living with a partner or owning a home', () => {
    const s = { ...withJob(at(27), 'retail'), finances: { ...at(27).finances, cash: 100 } };
    expect(evaluateAll(s, card().conditions)).toBe(true);
    const [married] = withPerson(s, 'spouse', 27);
    const together = { ...s, flags: { ...s.flags, lf_living_together: true } };
    const owner = owning(s, 'studio');
    for (const t of [married, together, { ...owner, finances: { ...owner.finances, cash: 100 } }]) expect(evaluateAll(t, card().conditions)).toBe(false);
  });

  it('the house rules wait for me to still be living there', () => {
    const rules = ev('ya_house_rules');
    const s = at(24);
    expect(evaluateAll(s, rules.conditions)).toBe(false);
    expect(evaluateAll({ ...s, flags: { ...s.flags, home_with_parents: true } }, rules.conditions)).toBe(true);
  });

  it('the childhood-bedroom cards know I am back home, and not once I have moved out again', () => {
    const s = { ...at(22), flags: { home_with_parents: true }, firedEvents: { ya_first_apartment: 19, ya_move_back_home: 21, ya_house_rules: 21 } };
    for (const id of ['yp_home_rent', 'yp_home_gym']) {
      const back = ev(id).conditions!.find((c) => 'any' in c)!;
      expect([id, evaluateCondition(s, back)]).toEqual([id, true]);
      // The house rules card fired once, but the flag is gone: I moved out again.
      expect([id, evaluateCondition({ ...s, flags: {} }, back)]).toEqual([id, false]);
      // They describe living at home as the engine counts it (atHome: the living-with-parents housing).
      expect(ev(id).conditions).toContainEqual({ atHome: true });
    }
  });
});

describe('a front lawn, a garage and a hedge need a house with a yard', () => {
  const yardCards = ['nc_yard_sale', 'fs_hedge_war'];
  it.each(yardCards)('%s requires LIVES_IN_HOUSE_WITH_YARD', (id) => {
    expect(has(ev(id).conditions, LIVES_IN_HOUSE_WITH_YARD)).toBe(true);
  });

  it.each([
    [['studio'], false],
    [['condo'], false],
    [['penthouse'], false],
    [['suburban'], true],
    [['townhouse'], true],
    [['suburban', 'studio'], false],
  ])('a player owning %j: yard scenes %s', (homes, ok) => {
    const s = owning(at(45), ...(homes as string[]));
    for (const id of yardCards) expect([id, fitsState(s, ev(id))]).toEqual([id, ok]);
  });

  it('a renter with no home of their own has no lawn either', () => {
    for (const id of yardCards) expect([id, fitsState(at(45), ev(id))]).toEqual([id, false]);
  });

  it('no other card here puts a yard, a lawn or a hedge on a dog walk or a found dog', () => {
    expect(lines(ev('pt_ate_something')).join(' ')).not.toMatch(/\byard\b/);
    expect(lines(ev('fs_lost_dog')).join(' ')).not.toMatch(/\bmy yard\b/);
  });
});

describe('the roommate who never buys toilet paper', () => {
  const card = () => ev('ya_roommate_food');
  const base = () => at(28);

  it('opens for a single player renting with a friend', () => {
    const [s] = withPerson(base(), 'friend', 27, { relationship: 60 });
    expect(fitsState(s, card())).toBe(true);
    expect(candidatesFor(s, card().person!)).toHaveLength(1);
  });

  it('not for a married parent, a parent, or someone who lives with a partner', () => {
    let [s] = withPerson(base(), 'friend', 27, { relationship: 60 });
    const [married] = withPerson(s, 'spouse', 29);
    const [parent] = withPerson(s, 'child', 1);
    const together = { ...s, flags: { ...s.flags, lf_living_together: true } };
    for (const t of [married, parent, together]) expect(fitsState(t, card())).toBe(false);
    // The sibling sharing the flat is a young adult, not a 37-year-old sister.
    [s] = withPerson(s, 'sibling', 37);
    expect(candidatesFor(s, card().person!).map((p) => p.kind)).toEqual(['friend']);
  });
});

describe('a broke player still has a choice (house style: 2-4 choices)', () => {
  it('every card here with more than one choice keeps two that need no money, job or flag', () => {
    const single = MINE.filter((e) => e.choices.length > 1 && e.choices.filter((c) => !c.conditions?.length).length < 2).map((e) => e.id);
    expect(single).toEqual([]);
  });

  it("the playtest's single-button cards show a broke, jobless player two choices, one with no price", () => {
    const s = { ...at(30), finances: { ...at(30).finances, cash: 0 } };
    for (const id of ['pt_noise_complaint', 'pt_vet_bill', 'pt_lonely_pet', 'nc_storm_warning', 'ya_quarter_life_crisis', 'ya_car_breakdown']) {
      const shown = ev(id).choices.filter((c) => evaluateAll(s, c.conditions));
      expect([id, shown.length >= 2]).toEqual([id, true]);
      // No up-front cost (a risk inside a chance or random outcome is not a price).
      expect([id, shown.some((c) => !c.effects.some((e) => 'money' in e && e.money < 0))]).toEqual([id, true]);
    }
    expect(choice('pt_noise_complaint', 'talk').conditions).toBeUndefined();
  });

  it('the free storm potluck still costs something: it is not better than ignoring the storm in every way', () => {
    const potluck = choice('nc_storm_warning', 'party');
    expect(potluck.effects).toContainEqual({ energy: -1 });
    expect(allEffects(choice('nc_storm_warning', 'ignore').effects).some((e) => 'energy' in e)).toBe(false);
  });
});

describe('parole keeps me close to home', () => {
  // Cards in travel_events.ts that never leave home: a passport mailed back, a letter from the village, a local beach.
  const STAY_HOME = new Set(['tr_passport_returned', 'tr_volunteer_letter', 'tr_rip_current']);
  const TRIPS = [...TRAVEL_EVENTS.filter((e) => !STAY_HOME.has(e.id)).map((e) => e.id), 'ya_backpacking', 'ya_backpack_passport', 'ya_surprise_reunion', 'fs_road_trip'];

  it.each(TRIPS)('%s does not open on parole', (id) => {
    expect(has(ev(id).conditions, NOT_ON_PAROLE)).toBe(true);
  });

  it('a parolee with money, a job and friends gets no trip; the same player off parole does', () => {
    let s = withJob(at(24), 'admin');
    [s] = withPerson(s, 'friend', 24, { relationship: 70 });
    const parole = { ...s, flags: { ...s.flags, parole: true } };
    expect(TRIPS.filter((id) => fitsState(parole, ev(id)))).toEqual([]);
    expect(TRIPS.filter((id) => fitsState(s, ev(id))).length).toBeGreaterThan(10);
    // The gap year's farm abroad is not offered either.
    const gap = choice('yp_gap_year', 'farm');
    expect(evaluateAll({ ...at(18), flags: { parole: true } }, gap.conditions)).toBe(false);
    expect(evaluateAll(at(18), gap.conditions)).toBe(true);
  });
});

describe('a farm family stays on the farm; an immigrant family moves once', () => {
  it.each([7, 32, 83, 299])('farm kid (seed %i): no move to a city for work and no layoff', (seed) => {
    const s = grow({ scenario: 'farm_kid' }, seed, 8);
    expect(s.flags.farm).toBe(true);
    expect(isEligible(s, ev('kd_moving_house'))).toBe(false);
    expect(isEligible(s, ev('kd_parent_lost_job'))).toBe(false);
    const town = grow({ scenario: 'standard' }, seed, 8);
    expect(isEligible(town, ev('kd_moving_house'))).toBe(true);
    expect(isEligible(town, ev('kd_parent_lost_job'))).toBe(true);
  });

  it('no immigrant family gets the big move in the year of its move abroad or the next', () => {
    const offered: string[] = [];
    for (let seed = 1; seed <= 40; seed++) {
      const born = createLife({ countryCode: 'US', scenario: 'immigrant' }, seed, 0);
      const moveAge = born.character.moveAbroad!.age;
      for (const age of [moveAge, moveAge + 1]) {
        if (age > 12) continue;
        const s = grow({ scenario: 'immigrant' }, seed, age);
        if (isEligible(s, ev('kd_moving_house'))) offered.push(`${seed}@${age}`);
      }
    }
    expect(offered).toEqual([]);
  });
});

describe('the school-gate pickup is a new step-parent, not the foster parent since birth', () => {
  const card = () => ev('kl_step_pickup');

  it('an orphan at 12 binds nobody: the foster parent has raised them since birth', () => {
    const s = grow({ scenario: 'orphan' }, 31001, 12);
    const foster = Object.values(s.people).find((p) => p.foster && p.alive)!;
    expect(foster.metAtAge).toBe(0);
    expect(binds(s, card().person, foster)).toBe(false);
  });

  it('a stepfather who joined two years ago is bound', () => {
    const [s, step] = withPerson(at(9), 'stepfather', 40, { metAtAge: 7 });
    expect(binds(s, card().person, step)).toBe(true);
  });
});

describe('meeting the parents happens early in a relationship', () => {
  it('a partner of thirteen years is not bound; one met last year is', () => {
    const [s1, old] = withPerson(at(29), 'lover', 29, { metAtAge: 16, love: 80 });
    expect(binds(s1, ev('ya_meet_the_parents').person, old)).toBe(false);
    const [s2, fresh] = withPerson(at(29), 'lover', 28, { metAtAge: 28, love: 80 });
    expect(binds(s2, ev('ya_meet_the_parents').person, fresh)).toBe(true);
    expect(ev('ya_meet_the_parents').conditions).toContainEqual({ married: false });
  });
});

describe('no US-only details abroad', () => {
  it.each(['IN', 'BR', 'DE', 'JP', 'FR', 'NG'])('no permit test, parking-lot lessons or prom in %s', (cc) => {
    let s: GameState = { ...at(16, { countryCode: cc }), education: { ...at(16).education, enrolled: true, stage: 'high' } };
    [s] = withPerson(s, 'friend', 16, { relationship: 70 });
    for (const id of ['tl_permit_test', 'tn_learning_to_drive', 'tn_prom']) expect([id, fitsState(s, ev(id))]).toEqual([id, false]);
  });

  it('the same cards open in the United States', () => {
    let s: GameState = { ...at(16), education: { ...at(16).education, enrolled: true, stage: 'high' } };
    [s] = withPerson(s, 'friend', 16, { relationship: 70 });
    for (const id of ['tl_permit_test', 'tn_learning_to_drive', 'tn_prom']) expect([id, fitsState(s, ev(id))]).toEqual([id, true]);
    expect(evaluateAll(s, ev('tn_driving_test').conditions)).toBe(true);
  });

  it('distances and speeds are not in miles, and the college card has no American counselor', () => {
    const miles = MINE.filter((e) => lines(e).some((l) => /\bmiles?\b/i.test(l.replace(/\bby a mile\b/gi, '')))).map((e) => e.id);
    expect(miles).toEqual([]);
    // Nor heights and weights in feet, inches or pounds ("I felt two inches tall" is a figure of speech, not a measure).
    const imperial = MINE.filter((e) => lines(e).some((l) => /\b(pounds?|inches|feet tall|foot tall)\b/i.test(l.replace(/\bfelt (about )?\w+ (inches|feet) tall\b/gi, '')))).map((e) => e.id);
    expect(imperial).toEqual([]);
    expect(ev('tn_college_apps').text).not.toMatch(/senior year|counselor/i);
  });
});

describe('office scenes need a desk job', () => {
  const OFFICE = ['tm_video_call_mishap', 'tm_reply_all', 'tm_password_sticky_note', 'tm_old_photo_at_work', 'ya_networking_mixer', 'tr_work_trip', 'tr_sabbatical', 'pt_bring_to_work'];

  it.each(OFFICE)('%s requires DESK_JOB', (id) => {
    expect(has(ev(id).conditions, DESK_JOB)).toBe(true);
  });

  it('every job DESK_JOB names exists', () => {
    const ids = new Set(JOBS.map((j) => j.id));
    for (const c of (DESK_JOB as { any: Condition[] }).any) if ('jobId' in c) for (const id of c.jobId) expect([id, ids.has(id)]).toEqual([id, true]);
  });

  it.each([
    ['pt_barista', false],
    ['warehouse', false],
    ['pt_babysitter', false],
    ['firefighter', false],
    ['pt_tutor', false],
    ['athlete', false],
    ['admin', true],
    ['software_dev', true],
    ['accountant', true],
    ['teacher', true],
  ])('a %s: desk job %s', (job, desk) => {
    expect(evaluateCondition(withJob(at(30), job), DESK_JOB)).toBe(desk);
  });
});

describe('people a card makes have the job and the age its text gives them', () => {
  const made = (id: string, c: string) => allEffects(choice(id, c).effects).flatMap((e) => ('newPerson' in e ? [e.newPerson] : []));

  it('the reading partner is a retired bus driver of sixty-seven', () => {
    expect(ev('yp_reading_volunteer').text).toContain('sixty-seven');
    const [np] = made('yp_reading_volunteer', 'year');
    expect(np).toMatchObject({ occupation: 'Bus Driver', minAge: 67, maxAge: 67, gender: 'male' });
    const s = at(20);
    const after = applyEffects(s, new Rng(3), [{ newPerson: np! }]);
    const p = Object.values(after.people).find((x) => !s.people[x.id])!;
    expect([p.age, p.occupation]).toEqual([67, 'Bus Driver']);
  });

  it.each([
    ['ya_dorm_roommate', 'transfer', 18],
    ['ya_campus_club', 'debate', 18],
    ['ya_campus_club', 'improv', 18],
    ['ya_first_apartment', 'party', 18],
    ['ya_blind_date', 'go', 18],
    ['fs_flat_tyre', 'help', 18],
    ['fs_lost_tourist', 'walk', 18],
    ['fs_coffee_paid', 'chase', 18],
    ['tr_hostel_bunkmate', 'talk', 18],
    ['tr_hostel_bunkmate', 'swap', 18],
    ['tr_train_stranger', 'share', 30],
    ['tr_work_trip', 'dinner', 22],
    ['tr_volunteer_trip', 'go', 18],
    ['tr_destination_wedding', 'go', 18],
    ['nc_noisy_neighbour', 'join', 18],
    ['nc_noisy_neighbour', 'retaliate', 18],
    ['nc_neighbourhood_watch', 'snoop', 18],
    ['fs_hedge_war', 'cake', 21],
    ['pt_park_regulars', 'chat', 25],
  ])('%s/%s makes a friend or a rival aged %i or more', (id, c, floor) => {
    const people = made(id, c).filter((np) => np.kind === 'friend' || np.kind === 'enemy');
    expect(people.length).toBeGreaterThan(0);
    for (const np of people) expect([id, c, (np.minAge ?? 0) >= floor]).toEqual([id, c, true]);
  });

  it('an old school friend is about my age: a 29-year-old does not meet an 18-year-old schoolmate', () => {
    const [np] = made('ya_old_friend_online', 'meet');
    expect(np!.minAge).toBeUndefined();
    for (const me of [18, 23, 29]) {
      for (let seed = 1; seed <= 20; seed++) {
        const s = at(me);
        const after = applyEffects(s, new Rng(seed), [{ newPerson: np! }]);
        const p = Object.values(after.people).find((x) => !s.people[x.id])!;
        expect([me, Math.abs(p.age - me) <= 4]).toEqual([me, true]);
      }
    }
  });

  it('college friends are students, and the greyhound man is a man', () => {
    for (const [id, c] of [['ya_dorm_roommate', 'transfer'], ['ya_campus_club', 'debate'], ['ya_campus_club', 'improv']] as const) {
      for (const np of made(id, c)) expect(np.occupation).toBe('Student');
    }
    expect(made('pt_park_regulars', 'chat')[0]!.gender).toBe('male');
  });
});

describe('pet continuity', () => {
  it('a child asking for an account posts no pictures of a dog the family may never have had', () => {
    for (const l of lines(ev('tm_child_social'))) expect(l).not.toMatch(/\bdog\b/i);
  });
});
