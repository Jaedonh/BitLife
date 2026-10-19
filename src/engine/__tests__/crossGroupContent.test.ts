/**
 * The follow-ups the fix groups left for one another's files (work, money, crime, community, school, childhood,
 * teen, young-adult, media, travel and friends content, the flavor engine and switchEmployer): twin cards guard each
 * other both ways, one found wallet per life, no new partner in the grief window, cards written for distance reach
 * friends left behind abroad, a parent named the way the family has them, a pet that fits the scene, and a rival
 * job that comes with a team.
 */
import { EVENTS } from '@/data/events';
import { BABY_AND_TODDLER_EVENTS } from '@/data/events/baby_and_toddler';
import { CHILDHOOD_EVENTS } from '@/data/events/childhood';
import { COWORKERS_EVENTS } from '@/data/events/coworkers';
import { CRIME_AND_PRISON_EVENTS } from '@/data/events/crime_and_prison';
import { EARLY_CHILDHOOD_EVENTS } from '@/data/events/early_childhood';
import { FRIENDS_AND_STRANGERS_EVENTS } from '@/data/events/friends_and_strangers';
import { HEALTH_EVENTS } from '@/data/events/health_events';
import { JUSTICE_AND_REENTRY_EVENTS } from '@/data/events/justice_and_reentry';
import { JUVENILE_DETENTION_EVENTS } from '@/data/events/juvenile_detention';
import { KID_LIFE_EVENTS } from '@/data/events/kid_life';
import { KID_YEARS_EVENTS } from '@/data/events/kid_years';
import { MIND_AND_COMMUNITY_EVENTS } from '@/data/events/mind_and_community';
import { MONEY_EVENTS } from '@/data/events/money_events';
import { NEIGHBOURS_AND_COMMUNITY_EVENTS } from '@/data/events/neighbours_and_community';
import { PRISON_LIFE_EVENTS } from '@/data/events/prison_life';
import { SCHOOL_LIFE_EVENTS } from '@/data/events/school_life';
import { TECHNOLOGY_AND_MEDIA_EVENTS } from '@/data/events/technology_and_media';
import { TEEN_LIFE_EVENTS } from '@/data/events/teen_life';
import { TEEN_YEARS_EVENTS } from '@/data/events/teen_years';
import { TRAVEL_EVENTS } from '@/data/events/travel_events';
import { WORK_LIFE_EVENTS } from '@/data/events/work_life';
import { YOUNG_ADULT_EVENTS } from '@/data/events/young_adult';
import { YOUNG_ADULT_PATHS_EVENTS } from '@/data/events/young_adult_paths';
import { candidatesFor, evaluateCondition } from '../events/conditions';
import { EVENT_REGISTRY } from '../events/registry';
import type { Condition, Effect, EventDef } from '../events/schema';
import { isEligible, openNextEvent, resolveChoice } from '../events/select';
import { renderText } from '../events/text';
import { Rng } from '../rng';
import { switchEmployer } from '../systems/careers';
import { createLife, makePerson } from '../systems/character';
import { workplaceOf, worksWithMe } from '../systems/coworkers';
import { GRIEF_FLAG } from '../systems/romance';
import type { GameState, Job, Person, RelationshipKind } from '../types';

const MINE: readonly EventDef[] = [
  ...CRIME_AND_PRISON_EVENTS, ...MONEY_EVENTS, ...WORK_LIFE_EVENTS, ...NEIGHBOURS_AND_COMMUNITY_EVENTS, ...HEALTH_EVENTS, ...MIND_AND_COMMUNITY_EVENTS,
  ...COWORKERS_EVENTS, ...PRISON_LIFE_EVENTS, ...JUVENILE_DETENTION_EVENTS, ...JUSTICE_AND_REENTRY_EVENTS, ...SCHOOL_LIFE_EVENTS, ...KID_YEARS_EVENTS,
  ...KID_LIFE_EVENTS, ...CHILDHOOD_EVENTS, ...EARLY_CHILDHOOD_EVENTS, ...BABY_AND_TODDLER_EVENTS, ...TEEN_YEARS_EVENTS, ...TEEN_LIFE_EVENTS,
  ...YOUNG_ADULT_EVENTS, ...YOUNG_ADULT_PATHS_EVENTS, ...TECHNOLOGY_AND_MEDIA_EVENTS, ...TRAVEL_EVENTS, ...FRIENDS_AND_STRANGERS_EVENTS,
];
const BY_ID: Record<string, EventDef> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
const byId = (id: string): EventDef => {
  const e = BY_ID[id];
  if (!e) throw new Error(`no event ${id}`);
  return e;
};

function flat(effects: readonly Effect[]): Effect[] {
  return effects.flatMap((e) => [e, ...('chance' in e ? flat([...e.then, ...(e.else ?? [])]) : 'random' in e ? flat(e.random.flatMap((o) => o.effects)) : [])]);
}
function lines(e: EventDef): string[] {
  const effectLines = (c: EventDef['choices'][number]) => flat(c.effects).flatMap((x) => ('log' in x ? [x.log] : 'newPerson' in x && x.newPerson.log ? [x.newPerson.log] : []));
  return [e.title, e.text, ...e.choices.flatMap((c) => [c.label, c.hint ?? '', ...effectLines(c)])];
}

/** The window (years) of a card's top-level { not: { sinceEvent: other, lte } } guard, if it has one. */
function guardYears(e: EventDef, other: string): number | undefined {
  for (const c of e.conditions ?? []) if ('not' in c && 'sinceEvent' in c.not && c.not.sinceEvent === other) return c.not.lte;
  return undefined;
}

const JOB: Job = {
  defId: 'accountant', title: 'Accountant', company: 'Granite & Sons', salary: 60_000, level: 1, performance: 70, yearsHeld: 4, yearsAtLevel: 2,
  category: 'finance', partTime: false, askedThisYear: false, workedHarderThisYear: false,
};

/** Someone with nobody in their life, no job, no history of cards and an empty queue. */
function blank(age: number, year = 2020): GameState {
  const s = createLife({ countryCode: 'US' }, 11);
  return { ...s, year, people: {}, assets: [], firedEvents: {}, eventQueue: [], pendingEvent: null, flags: {}, character: { ...s.character, age } };
}
const withJob = (s: GameState, job: Job = JOB): GameState => ({ ...s, career: { ...s.career, job, retired: false } });
const withPeople = (s: GameState, ...people: Person[]): GameState => ({ ...s, people: { ...s.people, ...Object.fromEntries(people.map((p) => [p.id, p])) } });
function person(kind: RelationshipKind, id: string, extra: Partial<Person> = {}, playerAge = 30): Person {
  return { ...makePerson(new Rng(id.length * 7 + 3), { kind, age: playerAge, countryCode: 'US', playerAge, relationship: 60 }), id, ...extra };
}

describe('twins guard each other both ways', () => {
  // [card, its twin, years]: neither opens within that many years of the other (the twin's own guard, where it
  // has one, keeps the same distance).
  const PAIRS: readonly [string, string, number][] = [
    ['cp_scam_call', 'ya_scam_call', 2],
    ['mn_mlm_pitch', 'fs_powder_pitch', 2],
    ['mn_car_repair', 'ya_car_breakdown', 2],
    ['wk_mentor_offer', 'ya_mentor_offer', 2],
    ['nc_friend_moving_away', 'tn_friend_moving', 2],
    ['sl_dorm_fridge', 'ya_roommate_food', 2],
    ['sl_group_project_freeloader', 'ya_group_project', 2],
    ['sl_pop_quiz', 'tn_pop_quiz', 2],
    ['sl_sports_tryout', 'tn_tryouts', 2],
    ['sl_science_fair', 'tn_science_fair', 2],
    ['wk_workplace_flirt', 'lf_coworker_asks_out', 6],
    ['wk_burnout', 'ad_burnout', 5],
    ['tm_parent_tech_help', 'ad_parent_tech_support', 5],
    ['ya_blind_date', 'lf_blind_date', 4],
    ['wk_retiring_colleague', 'cw_retiring_box', 2],
    ['tn_viral_fall', 'fs_viral_moment', 2],
  ];

  it.each(PAIRS)('%s waits for %s, and the other way round', (id, twin, years) => {
    const mine = byId(id);
    expect(guardYears(mine, twin)).toBe(years);
    const back = guardYears(byId(twin), id);
    if (MINE.includes(byId(twin))) expect(back).toBe(years);
    else if (back !== undefined) expect(back).toBe(years);
    const guard: Condition = { not: { sinceEvent: twin, lte: years } };
    const s = blank(40);
    const fired = (ago: number): GameState => ({ ...s, firedEvents: { [twin]: 40 - ago } });
    expect(evaluateCondition(fired(years), guard)).toBe(false);
    expect(evaluateCondition(fired(years + 1), guard)).toBe(true);
  });

  it('the cafeteria clip goes viral once, not again a few years later', () => {
    expect(byId('tn_viral_fall').once).toBe(true);
  });

  it('the two scam calls no longer share the supervisor gag', () => {
    const text = (id: string) => lines(byId(id)).join(' ');
    expect(text('ya_scam_call')).toMatch(/supervisor/);
    expect(text('cp_scam_call')).not.toMatch(/supervisor/);
  });
});

describe('one found wallet per life', () => {
  const WALLETS = ['kd_found_wallet', 'cp_found_wallet', 'nc_found_wallet', 'mn_lucky_find'];

  it.each(WALLETS)('%s opens once, and never after any other wallet', (id) => {
    const e = byId(id);
    expect(e.once).toBe(true);
    for (const other of WALLETS.filter((w) => w !== id)) {
      expect((e.conditions ?? []).some((c) => 'eventNotFired' in c && c.eventNotFired === other)).toBe(true);
    }
  });

  it('the kid wallet checks the other three as well, so the guard holds whichever fires first', () => {
    const kid = blank(9);
    expect(isEligible(kid, byId('kd_found_wallet'))).toBe(true);
    for (const other of ['cp_found_wallet', 'nc_found_wallet', 'mn_lucky_find']) expect(isEligible({ ...kid, firedEvents: { [other]: 8 } }, byId('kd_found_wallet'))).toBe(false);
  });
});

describe('no new partner in the grief window', () => {
  const makesPartner = (e: EventDef) => e.choices.some((c) => flat(c.effects).some((x) => 'newPerson' in x && (x.newPerson.kind === 'lover' || x.newPerson.kind === 'spouse')));
  const waits = (e: EventDef) => (e.conditions ?? []).some((c) => 'flag' in c && c.flag === GRIEF_FLAG && c.exists === false);

  it('every card here that can bring a new partner waits out the grieving flag', () => {
    const dating = MINE.filter(makesPartner);
    expect(dating.map((e) => e.id)).toEqual(expect.arrayContaining(['wk_workplace_flirt', 'tm_catfish_match', 'ya_blind_date', 'tl_ask_out']));
    expect(dating.filter((e) => !waits(e)).map((e) => e.id)).toEqual([]);
  });

  it('the dinner invitation at work does not come the year after my partner died', () => {
    const ready = withJob(blank(35));
    const flirt = byId('wk_workplace_flirt');
    expect(isEligible(ready, flirt)).toBe(true);
    expect(isEligible({ ...ready, flags: { [GRIEF_FLAG]: 34 } }, flirt)).toBe(false);
  });
});

describe('cards written for distance reach friends left behind abroad', () => {
  const LONG_DISTANCE = ['fs_ghost_returns', 'fs_three_am_call', 'tm_group_chat_drama', 'ya_group_chat_drama', 'jd_mail_call', 'mn_friend_loan', 'mn_friend_loan_followup'];
  // A friend in another country is not in the room: no visits, no kitchen floors, no hugs.
  const IN_PERSON = /\b(go(es)? over|came over|come over|in person|kitchen floor|hug(ged|s)?|on my doorstep|until the cake|across the table|showed up)\b/i;

  it.each(LONG_DISTANCE)('%s binds a friend at any distance and asks nothing in person', (id) => {
    const e = byId(id);
    expect(e.person?.farAway).toBe('any');
    for (const l of lines(e)) expect([id, l, IN_PERSON.test(l)]).toEqual([id, l, false]);
  });

  it('an immigrant whose only friend stayed behind still gets the 3 a.m. call and the group chat, but not a scene in the room', () => {
    const far = person('friend', 'far_friend', { relationship: 60, farAway: true, age: 24 }, 24);
    const s = withPeople(blank(24), far);
    for (const id of ['fs_three_am_call', 'ya_group_chat_drama', 'tm_group_chat_drama']) expect(candidatesFor(s, byId(id).person!).map((p) => p.id)).toEqual(['far_friend']);
    expect(candidatesFor(s, { kind: ['friend', 'bestFriend'] })).toEqual([]);
    expect(candidatesFor(s, byId('nc_friend_moving_away').person!)).toEqual([]);
  });

  it('a loan sent abroad comes back as the same follow-up, bound to the same friend', () => {
    const far = person('friend', 'far_friend', { relationship: 60, farAway: true, age: 35 }, 35);
    const s: GameState = { ...withPeople(blank(35), far), finances: { ...blank(35).finances, cash: 5000 }, eventQueue: [{ eventId: 'mn_friend_loan', context: {}, personId: 'far_friend' }] };
    const opened = openNextEvent(s, EVENT_REGISTRY);
    expect(opened.pendingEvent?.eventId).toBe('mn_friend_loan');
    const after = resolveChoice(opened, 'lend', EVENT_REGISTRY);
    expect(after.pendingEvent).toMatchObject({ eventId: 'mn_friend_loan_followup', personId: 'far_friend' });
  });
});

describe('parents are named the way the family has them', () => {
  it('the dinner with my date names the mother at home, Mama when Mom is gone', () => {
    const e = byId('tn_meet_parents');
    for (const l of lines(e)) expect(l).not.toMatch(/\b(Mom|my mom)\b/i);
    const lover = person('lover', 'date', { age: 16, gender: 'male' }, 16);
    const mom = person('mother', 'mom', { gender: 'female', age: 45, alive: false }, 16);
    const mama = person('mother', 'mama', { gender: 'female', age: 44 }, 16);
    const twoMothers = withPeople(blank(16), mom, mama, lover);
    expect(renderText(e.text, twoMothers, { person: lover })).toMatch(/dinner with Mama\. .* Mama opened with "So\."$/);
    const both = withPeople(blank(16), { ...mom, alive: true }, mama, lover);
    expect(renderText(e.text, both, { person: lover })).toMatch(/dinner with Mom and Mama\. .* Mom opened with "So\."$/);
  });
});

describe('a rival job comes with a team', () => {
  it('switchEmployer hires two or three coworkers at the new company and leaves the old ones at the old one', () => {
    const old = { ...person('coworker', 'old_desk', {}, 30), workplace: workplaceOf(JOB) };
    const s = withPeople(withJob(blank(30)), old);
    const after = switchEmployer(s, new Rng(5), 0.1);
    expect(after.career.job?.company).not.toBe(JOB.company);
    const team = Object.values(after.people).filter((p) => p.kind === 'coworker' && worksWithMe(after, p));
    expect(team.length).toBeGreaterThanOrEqual(2);
    expect(team.length).toBeLessThanOrEqual(3);
    expect(team.map((p) => p.id)).not.toContain('old_desk');
    expect(new Set(Object.values(after.people).map((p) => p.firstName)).size).toBe(Object.keys(after.people).length);
  });

  it('a job only the city offers has no rival: nothing changes, and no history line says I left', () => {
    const police: Job = { ...JOB, defId: 'police', title: 'Police Officer', company: 'the Springfield Police Department', category: 'public' };
    const s = withJob({ ...blank(30), character: { ...blank(30).character, city: 'Springfield' } }, police);
    expect(switchEmployer(s, new Rng(5), 0.1)).toBe(s);
  });

  it('the rival offer adds nobody on top of the new team, and skips the bottom rung of a service job', () => {
    const e = byId('wk_counter_offer');
    expect(e.choices.flatMap((c) => flat(c.effects)).some((x) => 'newPerson' in x)).toBe(false);
    const at = (defId: string, level: number, category: Job['category']) => withJob(blank(30), { ...JOB, defId, level, category });
    expect(isEligible(at('fast_food', 0, 'service'), e)).toBe(false);
    expect(isEligible(at('fast_food', 2, 'service'), e)).toBe(true);
    expect(isEligible(at('accountant', 0, 'finance'), e)).toBe(true);
  });
});

describe('pets', () => {
  it('the homework goes to a pet that chews or shreds paper, never a pigeon or a hamster in its cage', () => {
    const e = byId('kl_pet_homework');
    const kid = (species: string) => withPeople(blank(9), person('pet', `pet_${species}`, { species, age: 3 }, 9));
    for (const species of ['dog', 'cat', 'rabbit', 'parrot']) expect(candidatesFor(kid(species), e.person!).map((p) => p.species)).toEqual([species]);
    for (const species of ['pigeon', 'hamster']) expect(candidatesFor(kid(species), e.person!)).toEqual([]);
  });
});

describe('homes and roofs', () => {
  it('the storm card (my windows, my insurer, my party) is for a place of my own', () => {
    const e = byId('nc_storm_warning');
    expect(e.conditions).toContainEqual({ atHome: false });
    for (const l of lines(e)) expect(l).not.toMatch(/\bmy roof\b/i);
  });
});
