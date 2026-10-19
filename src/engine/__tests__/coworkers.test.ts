import { applyAction } from '../actions';
import { ageUp } from '../ageUp';
import { candidatesFor } from '../events/conditions';
import { applyEffects } from '../events/effects';
import type { EventDef } from '../events/schema';
import { makeRegistry, openNextEvent, resolveChoice } from '../events/select';
import { Rng } from '../rng';
import { createLife, emptyMemory, makePerson } from '../systems/character';
import { COWORKER_FRIEND_AT, settleCoworkers } from '../systems/coworkers';
import type { GameState, JobListing, Person } from '../types';

const noEvents = makeRegistry([]);

/** A 25-year-old with a fast-food and a cashier listing on the board, nobody else in their life. */
function jobSeeker(seed = 1): GameState {
  const s = createLife({ countryCode: 'US', firstName: 'Sam' }, 41);
  const listings: JobListing[] = [
    { id: 'l_full', defId: 'fast_food', title: 'Fast Food Worker', company: 'Ember Burger', salary: 24_000, category: 'service', partTime: false },
    { id: 'l_part', defId: 'pt_cashier', title: 'Cashier', company: 'Ember Market', salary: 11_000, category: 'service', partTime: true },
  ];
  return {
    ...s,
    people: {},
    year: s.character.birthYear + 22,
    character: { ...s.character, age: 22, energy: 4, energyMax: 4, stats: { ...s.character.stats, smarts: 90, looks: 90 } },
    career: { ...s.career, listings },
    rng: new Rng(seed).snapshot(),
    log: [],
  };
}

/** Applies to a listing until hired (each attempt on a fresh copy with another seed). */
function hire(listingId: string): GameState {
  for (let seed = 1; seed < 50; seed++) {
    const s = applyAction(jobSeeker(seed), { type: 'applyJob', listingId });
    if (s.career.job) return s;
  }
  throw new Error('never hired');
}

const coworkers = (s: GameState) => Object.values(s.people).filter((p) => p.kind === 'coworker');

describe('coworkers', () => {
  it('a full-time hire brings two or three adult coworkers near my age, linked to the job', () => {
    let s = hire('l_full');
    const team = coworkers(s);
    expect(team.length).toBeGreaterThanOrEqual(2);
    expect(team.length).toBeLessThanOrEqual(3);
    for (const p of team) {
      expect(p.age).toBeGreaterThanOrEqual(18);
      expect(Math.abs(p.age - 22)).toBeLessThanOrEqual(8);
      expect(p.workplace).toEqual({ jobId: 'fast_food', company: 'Ember Burger' });
      expect(['Fast Food Worker', 'Shift Lead']).toContain(p.occupation);
    }
    // A part-time job does not.
    expect(coworkers(hire('l_part'))).toHaveLength(0);
  });

  it('a new coworker never shares a first name with someone already in my life', () => {
    // A spouse called Willow and a coworker called Willow make "Willow forgave me" ambiguous.
    let clashes = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const base = jobSeeker(seed);
      const family = ['Olivia', 'Liam', 'Emma', 'Noah', 'Ava', 'James', 'Sophia', 'William', 'Mia', 'Lucas'].map((firstName, i) =>
        ({ ...makePerson(new Rng(seed * 100 + i), { kind: i % 2 ? 'child' : 'friend', age: 30, countryCode: 'US', playerAge: 22 }), firstName }),
      );
      const s = applyAction({ ...base, people: Object.fromEntries(family.map((p) => [p.id, p])) }, { type: 'applyJob', listingId: 'l_full' });
      if (!s.career.job) continue;
      const taken = new Set([s.character.firstName, ...family.map((p) => p.firstName)]);
      clashes += coworkers(s).filter((p) => taken.has(p.firstName)).length;
    }
    expect(clashes).toBe(0);
  });

  it('leaving a job: close coworkers stay as friends, with a line after the one about quitting; the rest are gone', () => {
    let s = hire('l_full');
    const [close, distant] = coworkers(s);
    const before = { ...s, people: { ...s.people, [close!.id]: { ...close!, relationship: COWORKER_FRIEND_AT } } };
    const after = applyAction(before, { type: 'quitJob' });
    expect(after.people[close!.id]).toMatchObject({ kind: 'friend' });
    expect(after.people[close!.id]!.workplace).toBeUndefined();
    expect(after.people[distant!.id]).toBeUndefined();
    const lines = after.log.map((l) => l.text);
    const quit = lines.indexOf('I quit my job as a fast food worker.');
    expect(quit).toBeGreaterThanOrEqual(0);
    expect(lines[quit + 1]).toBe(`Even after I left Ember Burger, ${close!.firstName} and I stayed friends.`);
  });

  it('switching jobs settles the old team, and the new job brings its own', () => {
    let s = hire('l_full');
    const old = coworkers(s).map((p) => p.id);
    const next: JobListing = { id: 'l_next', defId: 'fast_food', title: 'Fast Food Worker', company: 'Copper Grill', salary: 25_000, category: 'service', partTime: false };
    let t = s;
    for (let seed = 1; seed < 50 && t.career.job?.company !== 'Copper Grill'; seed++) {
      // Seeds other than the ones hire() used, so the new team does not reuse the old ids.
      t = applyAction({ ...s, career: { ...s.career, listings: [next] }, rng: new Rng(1000 + seed).snapshot() }, { type: 'applyJob', listingId: 'l_next' });
    }
    expect(t.career.job?.company).toBe('Copper Grill');
    for (const id of old) expect(t.people[id]?.kind === 'coworker').toBe(false);
    expect(coworkers(t).every((p) => p.workplace?.company === 'Copper Grill')).toBe(true);
    expect(coworkers(t).length).toBeGreaterThanOrEqual(2);
  });

  it('retiring, being fired by an event, and going to prison each part me from the team', () => {
    let s = hire('l_full');
    const [mate] = coworkers(s);
    const close = { ...s, people: { [mate!.id]: { ...mate!, relationship: 90 } } };
    const retired = applyAction({ ...close, character: { ...close.character, age: 62 } }, { type: 'retire' });
    expect(retired.log.at(-1)!.text).toBe(`Even after I retired, ${mate!.firstName} and I stayed friends.`);

    const fired: EventDef = { id: 'test_fired', category: 'work', title: 'Fired', text: 'My boss called me in.', minAge: 0, maxAge: 120, weight: 1, choices: [{ id: 'go', label: 'Go', effects: [{ loseJob: true }, { log: 'I was fired.' }] }] };
    const reg = makeRegistry([fired]);
    let f = openNextEvent({ ...close, eventQueue: [{ eventId: 'test_fired', context: {} }] }, reg);
    f = resolveChoice(f, 'go', reg);
    const lines = f.log.map((l) => l.text);
    expect(lines.slice(-2)).toEqual(['I was fired.', `Even after I left Ember Burger, ${mate!.firstName} and I stayed friends.`]);

    const jailed = settleCoworkers(applyEffects(close, new Rng(1), [{ prison: 2 }]));
    expect(jailed.people[mate!.id]!.kind).toBe('friend');
    expect(jailed.log.at(-1)!.text).toBe(`My old coworker ${mate!.firstName} kept writing to me in prison.`);
  });

  it('a yearly layoff settles the team in the same year', () => {
    let s = hire('l_full');
    const team = coworkers(s).map((p) => p.id);
    // Performance this low gets the player fired at the next age-up about half the time.
    let fired: GameState | undefined;
    for (let seed = 1; seed < 40 && !fired; seed++) {
      const t = ageUp({ ...s, career: { ...s.career, job: { ...s.career.job!, performance: 0 } }, rng: new Rng(seed).snapshot() }, noEvents);
      if (!t.career.job) fired = t;
    }
    expect(fired).toBeDefined();
    for (const id of team) expect(fired!.people[id]?.kind === 'coworker').toBe(false);
  });

  it('a coworker an event introduces works with me at my current job', () => {
    let s = hire('l_full');
    const t = applyEffects(s, new Rng(3), [{ newPerson: { kind: 'coworker', relationship: 50 } }]);
    const added = Object.values(t.people).find((p) => !s.people[p.id])!;
    expect(added.workplace).toEqual({ jobId: 'fast_food', company: 'Ember Burger' });
  });

  it("an event's new coworker is old enough for the job: an adult at a full-time one, 14+ at a teen one", () => {
    const ages = (s: GameState, playerAge: number) => {
      const young = { ...s, character: { ...s.character, age: playerAge } };
      const out: number[] = [];
      for (let seed = 1; seed <= 80; seed++) {
        const t = applyEffects(young, new Rng(seed), [{ newPerson: { kind: 'coworker', relationship: 50 } }]);
        out.push(Object.values(t.people).find((p) => !young.people[p.id])!.age);
      }
      return out;
    };
    // A 19-year-old on full hours: the new hire is no 15-year-old.
    const full = ages(hire('l_full'), 19);
    expect(Math.min(...full)).toBeGreaterThanOrEqual(18);
    expect(Math.max(...full)).toBeLessThanOrEqual(23);
    // A 16-year-old cashier: teen coworkers, but nobody under 14 (the youngest age with a job).
    const part = ages(hire('l_part'), 16);
    expect(Math.min(...part)).toBeGreaterThanOrEqual(14);
    expect(Math.max(...part)).toBeLessThanOrEqual(20);
  });

  it('coworkers from an older save, with no workplace, are left alone', () => {
    let s = hire('l_full');
    const legacy: Person = { ...makePerson(new Rng(8), { kind: 'coworker', age: 30, countryCode: 'US', playerAge: 22 }), id: 'old_mate', memory: emptyMemory(22) };
    const t = applyAction({ ...s, people: { ...s.people, old_mate: legacy } }, { type: 'quitJob' });
    expect(t.people.old_mate).toMatchObject({ kind: 'coworker' });
  });
});

describe('coworkers in event cards', () => {
  it('a leaving coworker stays as a friend only if close, and cards bind only the current job\'s coworkers', () => {
    let s = hire('l_full');
    const team = Object.values(s.people).filter((p) => p.kind === 'coworker');
    expect(team.length).toBeGreaterThan(1);
    const [close, distant] = team as [Person, Person];
    s = { ...s, people: { ...s.people, [close.id]: { ...close, relationship: 80 }, [distant.id]: { ...distant, relationship: 20 } } };
    const left = applyEffects(applyEffects(s, new Rng(1), [{ coworkerLeaves: true }], { personId: close.id }), new Rng(1), [{ coworkerLeaves: true }], { personId: distant.id });
    expect(left.people[close.id]?.kind).toBe('friend');
    expect(left.people[close.id]?.workplace).toBeUndefined();
    expect(left.people[distant.id]).toBeUndefined();
    // After a job change, the old workplace's coworkers no longer match a coworker card.
    const moved = { ...s, career: { ...s.career, job: { ...s.career.job!, company: 'Somewhere Else' } } };
    expect(candidatesFor(moved, { kind: ['coworker'] })).toEqual([]);
    expect(candidatesFor(s, { kind: ['coworker'] }).length).toBe(team.length);
  });
});

