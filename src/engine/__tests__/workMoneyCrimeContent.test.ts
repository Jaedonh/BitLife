/**
 * Work, money, health, crime, prison, re-entry, community, coworker, scenario and school content: the second
 * playtest's findings. Each block pins one fix: a customer only where customers come, a layoff recorded as a
 * layoff, a promotion card that promotes and moves me, raise cards that pay what they say, one-time scenes, no
 * radiators in Lagos, one party night that is not a habit, jury cards only where juries sit, era slips, no
 * choice that beats every other one (the youth files' metric), and American English.
 */
import { EVENTS } from '@/data/events';
import { COWORKERS_EVENTS } from '@/data/events/coworkers';
import { CRIME_AND_PRISON_EVENTS } from '@/data/events/crime_and_prison';
import { HEALTH_EVENTS } from '@/data/events/health_events';
import { JURY_TRIALS, JUSTICE_AND_REENTRY_EVENTS } from '@/data/events/justice_and_reentry';
import { JUVENILE_DETENTION_EVENTS } from '@/data/events/juvenile_detention';
import { MIND_AND_COMMUNITY_EVENTS } from '@/data/events/mind_and_community';
import { MONEY_EVENTS } from '@/data/events/money_events';
import { PRISON_LIFE_EVENTS } from '@/data/events/prison_life';
import { SCHOOL_LIFE_EVENTS } from '@/data/events/school_life';
import { STARTING_SCENARIOS_EVENTS } from '@/data/events/starting_scenarios';
import { WORK_LIFE_EVENTS } from '@/data/events/work_life';
import { getCountry } from '@/data/countries';
import { JOB_BY_ID } from '@/data/jobs';
import { evaluateCondition } from '../events/conditions';
import { EVENT_REGISTRY } from '../events/registry';
import type { ChoiceDef, Condition, Effect, EventDef } from '../events/schema';
import { isEligible, openNextEvent, resolveChoice } from '../events/select';
import { Rng } from '../rng';
import { createLife, makePerson } from '../systems/character';
import type { GameState, Job, Person } from '../types';

/** Every event in the files this content group looks after. */
const OWNED: readonly EventDef[] = [
  ...WORK_LIFE_EVENTS, ...MONEY_EVENTS, ...HEALTH_EVENTS, ...CRIME_AND_PRISON_EVENTS, ...PRISON_LIFE_EVENTS, ...JUSTICE_AND_REENTRY_EVENTS,
  ...JUVENILE_DETENTION_EVENTS, ...MIND_AND_COMMUNITY_EVENTS, ...COWORKERS_EVENTS, ...STARTING_SCENARIOS_EVENTS, ...SCHOOL_LIFE_EVENTS,
];

function byId(id: string): EventDef {
  const def = EVENTS.find((e) => e.id === id);
  if (!def) throw new Error(`no event ${id}`);
  return def;
}

function logs(effects: readonly Effect[]): string[] {
  return effects.flatMap((e) => [
    ...('log' in e ? [e.log] : []),
    ...('newPerson' in e && e.newPerson.log ? [e.newPerson.log] : []),
    ...('chance' in e ? [...logs(e.then), ...logs(e.else ?? [])] : []),
    ...('random' in e ? e.random.flatMap((o) => logs(o.effects)) : []),
  ]);
}

/** Every player-facing line of an event with the conditions in force when it shows (the event's plus its choice's). */
function lines(def: EventDef): { text: string; conds: Condition[] }[] {
  const ev = def.conditions ?? [];
  return [
    { text: def.title, conds: ev },
    { text: def.text, conds: ev },
    ...def.choices.flatMap((c) => [c.label, c.hint ?? '', ...logs(c.effects)].map((text) => ({ text, conds: [...ev, ...(c.conditions ?? [])] }))),
  ];
}

function effectsOf(effects: readonly Effect[]): Effect[] {
  return effects.flatMap((e) => [e, ...('chance' in e ? [...effectsOf(e.then), ...effectsOf(e.else ?? [])] : []), ...('random' in e ? e.random.flatMap((o) => effectsOf(o.effects)) : [])]);
}

/** An adult with nobody in their life, no job, no assets and no history of cards, in the first city of a country. */
function adult(age: number, year = 2015, countryCode = 'US'): GameState {
  const s = createLife({ countryCode }, 11);
  return {
    ...s, year, people: {}, assets: [], firedEvents: {}, eventQueue: [], pendingEvent: null, flags: {},
    character: { ...s.character, age, countryCode, city: getCountry(countryCode).cities[0]! },
  };
}

function job(defId: string, level: number): Job {
  const def = JOB_BY_ID[defId]!;
  return {
    defId, title: def.ladder[level]!.title, company: 'Keystone Group', salary: def.ladder[level]!.salary, level, performance: 70, yearsHeld: 4, yearsAtLevel: 2,
    category: def.category, partTime: def.partTime === true, askedThisYear: false, workedHarderThisYear: false,
  };
}

const employed = (s: GameState, defId: string, level = 0): GameState => ({ ...s, career: { ...s.career, job: job(defId, level), retired: false } });
const withPeople = (s: GameState, ...people: Person[]): GameState => ({ ...s, people: { ...s.people, ...Object.fromEntries(people.map((p) => [p.id, p])) } });

/** Opens a card through the queue with a fixed seed and takes one choice. */
function take(s: GameState, eventId: string, choiceId: string, seed: number): GameState {
  const opened = openNextEvent({ ...s, rng: new Rng(seed).snapshot(), eventQueue: [{ eventId, context: {} }] }, EVENT_REGISTRY);
  expect(opened.pendingEvent?.eventId).toBe(eventId);
  return resolveChoice(opened, choiceId, EVENT_REGISTRY);
}

describe('work cards fit the job', () => {
  it('a customer screams only at a job where customers come to me, and never at an owner', () => {
    const def = byId('wk_client_scream');
    for (const [defId, level] of [['software_dev', 3], ['warehouse', 0], ['accountant', 1], ['lab_tech', 0], ['hairdresser', 3]] as const) {
      expect([defId, level, isEligible(employed(adult(40), defId, level), def)]).toEqual([defId, level, false]);
    }
    for (const defId of ['waiter', 'retail', 'pt_cashier', 'bank_teller', 'hairdresser']) expect([defId, isEligible(employed(adult(30), defId), def)]).toEqual([defId, true]);
  });

  it('a customer tips at the counter, the table, the bar or the chair, not in a warehouse or on the night watch', () => {
    const def = byId('wk_customer_tip');
    for (const defId of ['warehouse', 'janitor', 'security', 'pt_lifeguard', 'pt_babysitter']) expect([defId, isEligible(employed(adult(30), defId), def)]).toEqual([defId, false]);
    for (const defId of ['waiter', 'bartender', 'pt_barista']) expect([defId, isEligible(employed(adult(30), defId), def)]).toEqual([defId, true]);
  });

  it("a boss asks me to lie about a client's late order only where clients order things, and only when I have a boss", () => {
    const def = byId('wk_boss_asks_lie');
    for (const [defId, level] of [['nurse', 0], ['teacher', 1], ['police', 1], ['janitor', 0], ['waiter', 0], ['executive', 4], ['mechanic', 3]] as const) {
      expect([defId, level, isEligible(employed(adult(35), defId, level), def)]).toEqual([defId, level, false]);
    }
    for (const defId of ['retail', 'warehouse', 'sales', 'software_dev', 'carpenter']) expect([defId, isEligible(employed(adult(35), defId), def)]).toEqual([defId, true]);
  });

  it('a layoff on the memo card is recorded as laid off, not as moving on or a firing', () => {
    let laidOff = 0;
    for (let seed = 1; seed <= 30; seed++) {
      for (const choice of ['wait', 'lined']) {
        const start = { ...employed(adult(25), 'warehouse'), flags: { wk_resume_ready: true } };
        const s = take(start, 'wk_layoff_news', choice, seed);
        if (s.career.job) continue;
        laidOff++;
        expect(s.career.history.at(-1)).toMatchObject({ company: 'Keystone Group', reason: 'laidOff' });
        expect(s.counters.firings).toBe(start.counters.firings);
      }
    }
    expect(laidOff).toBeGreaterThan(5);
    // Every line that says "laid off" on a card here ends the job as a layoff.
    for (const def of OWNED) {
      for (const c of def.choices) {
        const walk = (effects: readonly Effect[]): void => {
          if (effects.some((e) => 'log' in e && /\blaid off\b/i.test(e.log))) {
            const loss = effects.find((e) => 'loseJob' in e);
            expect([def.id, c.id, loss && 'loseJob' in loss ? loss.reason : 'no loseJob']).toEqual([def.id, c.id, 'laidOff']);
          }
          for (const e of effects) {
            if ('chance' in e) { walk(e.then); walk(e.else ?? []); }
            if ('random' in e) for (const o of e.random) walk(o.effects);
          }
        };
        walk(c.effects);
      }
    }
  });
});

describe('promotions and raises do what the card says', () => {
  const friend = makePerson(new Rng(6), { kind: 'friend', age: 43, countryCode: 'US', playerAge: 43, relationship: 60 });

  it('taking the promotion in another city moves me up a rung with its pay, to a new city, and leaves friends behind', () => {
    const before = withPeople(employed(adult(43), 'photographer'), friend);
    const after = take(before, 'wk_promotion_relocation', 'take', 3);
    expect(after.career.job).toMatchObject({ defId: 'photographer', level: 1, title: 'Photographer' });
    expect(after.career.job!.salary).toBeGreaterThan(before.career.job!.salary);
    expect(after.counters.promotions).toBe(before.counters.promotions + 1);
    expect(after.character.city).not.toBe(before.character.city);
    expect(getCountry('US').cities).toContain(after.character.city);
    expect(after.people[friend.id]!.farAway).toBe(true);
    const moved = after.log.find((l) => l.text.includes('started over in'));
    expect(moved?.text).toContain(after.character.city);
    expect(after.log.some((l) => l.text === 'I was promoted to photographer.')).toBe(true);
  });

  it('doing it remotely promotes me in my own city, or not at all', () => {
    const before = employed(adult(43), 'software_dev');
    let promoted = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const after = take(before, 'wk_promotion_relocation', 'remote', seed);
      expect(after.character.city).toBe(before.character.city);
      const saidYes = after.log.some((l) => l.text.startsWith('They said yes'));
      expect(after.career.job!.level).toBe(saidYes ? 1 : 0);
      if (saidYes) promoted++;
    }
    expect(promoted).toBeGreaterThan(0);
  });

  it('only a desk job in the video-call years can ask to take the new role from home', () => {
    const offered = (s: GameState) => openNextEvent({ ...s, eventQueue: [{ eventId: 'wk_promotion_relocation', context: {} }] }, EVENT_REGISTRY).pendingEvent?.choices.map((c) => c.id);
    expect(offered(employed(adult(43, 2015), 'software_dev'))).toEqual(['take', 'decline', 'remote']);
    expect(offered(employed(adult(43, 2015), 'accountant', 1))).toContain('remote');
    for (const [defId, year] of [['carpenter', 2015], ['nurse', 2015], ['police', 2015], ['warehouse', 2015], ['software_dev', 2005]] as const) {
      expect([defId, year, offered(employed(adult(43, year), defId))]).toEqual([defId, year, ['take', 'decline']]);
    }
  });

  it('is only offered where the company has a rung to give', () => {
    const def = byId('wk_promotion_relocation');
    expect(isEligible(employed(adult(43), 'photographer', 1), def)).toBe(true);
    expect(isEligible(employed(adult(43), 'photographer', 2), def)).toBe(false); // next is Studio Owner, mine to open
    expect(isEligible(employed(adult(43), 'photographer', 3), def)).toBe(false); // Studio Owner: the top
    expect(isEligible(employed(adult(43), 'hairdresser', 2), def)).toBe(false); // next is Salon Owner, mine to open
    expect(isEligible(employed(adult(43), 'accountant', 4), def)).toBe(false); // CFO
    expect(isEligible(employed(adult(43), 'politician', 1), def)).toBe(false); // elected, not promoted
  });

  it('no card here claims a raise, a new title or better pay that the effects never give', () => {
    const CLAIM = /\braise (came|went) through|\bgot (a|the) raise\b|\ba raise,|\bbudget for raises\b|\bmodest bump\b|\bnew title\b|\bpay is better\b|\bmore money\b/i;
    const bad = OWNED.flatMap((def) =>
      def.choices.flatMap((c) => {
        const promotes = effectsOf(c.effects).some((e) => 'promotion' in e || 'switchEmployer' in e);
        return promotes ? [] : [def.text, ...logs(c.effects)].filter((t) => CLAIM.test(t)).map((t) => `${def.id}/${c.id}: ${t}`);
      }),
    );
    expect(bad).toEqual([]);
  });
});

describe('scenes that should not replay', () => {
  it('a discovery or a gag with a fixed amount happens once in a life', () => {
    for (const id of ['mn_bank_error', 'hl_snoring', 'mn_spouse_spending', 'hl_mystery_rash', 'cp_neighbour_fence']) expect([id, byId(id).once]).toEqual([id, true]);
  });

  it('a scene with the same place and the same people comes at most twice in a life', () => {
    const twiceAtMost = (d: EventDef) => d.once === true || 2 * (d.cooldown ?? 2) > d.maxAge - d.minAge;
    for (const id of ['mn_scam_email', 'cp_witness_crime', 'jr_witness_crash', 'cw_last_slice', 'mc_long_outage']) expect([id, twiceAtMost(byId(id))]).toEqual([id, true]);
  });

  it('the bank error comes once even in a long life with the same balance', () => {
    const def = byId('mn_bank_error');
    const s = adult(40);
    expect(isEligible(s, def)).toBe(true);
    expect(isEligible({ ...s, firedEvents: { mn_bank_error: 20 } }, def)).toBe(false);
  });
});

describe('weather and home', () => {
  it('no radiator, furnace, heating or coat in a card that can open in a hot country', () => {
    const COLD_HOME = /\b(radiators?|furnace|heating|coats?|dead of winter)\b/i;
    const hot = (conds: readonly Condition[]) => !conds.some((c) => 'climate' in c || 'country' in c);
    const bad = OWNED.flatMap((d) => lines(d).filter((l) => COLD_HOME.test(l.text) && hot(l.conds)).map((l) => `${d.id}: ${l.text}`));
    expect(bad).toEqual([]);
  });

  it('a rent increase in Lagos complains about a faucet, not a radiator', () => {
    const def = byId('mn_rent_increase');
    const renter = employed(adult(30, 2015, 'NG'), 'retail');
    expect(isEligible(renter, def)).toBe(true);
    expect(lines(def).some((l) => /radiator/i.test(l.text))).toBe(false);
  });
});

describe('one party night is not a drinking habit', () => {
  it('the office party and the night before an exam add no addiction', () => {
    for (const [id, choice] of [['wk_office_party', 'drink'], ['sl_night_before_exam', 'party']] as const) {
      const c = byId(id).choices.find((x) => x.id === choice)!;
      expect([id, effectsOf(c.effects).filter((e) => 'addiction' in e)]).toEqual([id, []]);
    }
    const s = take(employed(adult(40), 'accountant', 1), 'wk_office_party', 'drink', 4);
    expect(s.health.addictions.alcohol ?? 0).toBe(0);
  });

  it('cards about a drinking problem wait for a habit (5 or more), not a toast that is fading', () => {
    const friend = makePerson(new Rng(2), { kind: 'friend', age: 40, countryCode: 'US', playerAge: 40, relationship: 60 });
    const at = (alcohol: number): GameState => {
      const s = withPeople(adult(40), friend);
      return { ...s, health: { ...s.health, addictions: { alcohol } } };
    };
    for (const id of ['mc_drink_noticed', 'mc_drink_corner_store', 'mc_recovery_meeting']) {
      expect([id, isEligible(at(3), byId(id))]).toEqual([id, false]);
      expect([id, isEligible(at(6), byId(id))]).toEqual([id, true]);
    }
    const craving = byId('pl_brew').choices.find((c) => c.id === 'craving')!;
    expect(craving.conditions?.every((c) => evaluateCondition(at(3), c))).toBe(false);
    expect(craving.conditions?.every((c) => evaluateCondition(at(6), c))).toBe(true);
  });
});

describe('jury cards', () => {
  const arrested = (s: GameState): GameState => ({ ...s, counters: { ...s.counters, arrests: 1 } });
  const juror = (s: GameState): GameState => ({ ...s, firedEvents: { ad_jury_verdict: s.character.age - 5 } });

  it('only open where lay jurors sit: not in India, Mexico, Nigeria or Germany, Spain from 1996, Japan from 2009', () => {
    for (const [code, year, ok] of [['US', 1995, true], ['GB', 2015, true], ['BR', 2015, true], ['ES', 2000, true], ['ES', 1994, false], ['JP', 2012, true], ['JP', 2005, false], ['IN', 2015, false], ['MX', 2015, false], ['NG', 2015, false], ['DE', 2015, false]] as const) {
      const s = adult(40, year, code);
      expect([code, year, evaluateCondition(s, JURY_TRIALS)]).toEqual([code, year, ok]);
      expect([code, year, isEligible(arrested(s), byId('jr_jury_arrest_question'))]).toEqual([code, year, ok]);
      expect([code, year, isEligible(juror(s), byId('mc_jury_aftermath'))]).toEqual([code, year, ok]);
    }
    // The juror card is a follow-up: queued in a country with no jury, it is skipped when it opens.
    expect(openNextEvent({ ...adult(40, 2015, 'IN'), eventQueue: [{ eventId: 'jr_jury_note', context: {} }] }, EVENT_REGISTRY).pendingEvent).toBeNull();
    expect(openNextEvent({ ...adult(40, 2015, 'US'), eventQueue: [{ eventId: 'jr_jury_note', context: {} }] }, EVENT_REGISTRY).pendingEvent?.eventId).toBe('jr_jury_note');
  });
});

describe('era', () => {
  it('juror number seven follows the news, which works in any year (no phone, no paper under the table)', () => {
    expect(lines(byId('jr_jury_note')).filter((l) => /phone|paper/i.test(l.text))).toEqual([]);
  });

  it('nobody carries a phone in a card that can open before mobile phones (about 2000)', () => {
    const CARRIED = /\b(my|his|her|their|no) phone\b(?! (time|calls?|number|bill))/i;
    const yearOf = (conds: readonly Condition[]): number =>
      Math.max(0, ...conds.map((c) => ('year' in c && c.year.gte ? c.year.gte : 'all' in c ? yearOf(c.all) : 0)));
    const bad = OWNED.flatMap((d) =>
      lines(d)
        .filter((l) => CARRIED.test(l.text) && Math.max(1975 + d.minAge, yearOf(l.conds)) < 2000)
        .map((l) => `${d.id}: ${l.text}`),
    );
    expect(bad).toEqual([]);
  });

  it('the newest phone at the market is a smartphone-era deal', () => {
    const rich = (s: GameState): GameState => ({ ...s, finances: { ...s.finances, cash: 5000 } });
    expect(isEligible(rich(adult(14, 1989)), byId('cp_cheap_phone'))).toBe(false);
    expect(isEligible(rich(adult(30, 2012)), byId('cp_cheap_phone'))).toBe(true);
  });

  it('a guard offers a smuggled phone only once phones fit under a mattress', () => {
    const inside = (year: number): GameState => {
      const s = adult(30, year);
      return { ...s, crime: { ...s.crime, inPrison: true, record: true }, finances: { ...s.finances, cash: 5000 } };
    };
    const choices = (year: number) => openNextEvent({ ...inside(year), eventQueue: [{ eventId: 'cp_prison_bribe_guard', context: {} }] }, EVENT_REGISTRY).pendingEvent;
    expect(choices(1995)?.choices.map((c) => c.id)).not.toContain('phone');
    expect(choices(1995)?.text).not.toMatch(/phone/i);
    expect(choices(2012)?.choices.map((c) => c.id)).toContain('phone');
  });
});

describe('every choice trades something (the youth files\' metric, over these files)', () => {
  type Vec = Record<string, number>;
  /** Expected stat changes of a choice; effects it cannot price are listed apart. */
  function vec(effects: readonly Effect[], p = 1, acc: Vec = {}, other = new Set<string>()): [Vec, Set<string>] {
    const add = (k: string, v: number) => { acc[k] = (acc[k] ?? 0) + p * v; };
    for (const e of effects) {
      if ('stat' in e) add(e.stat, e.delta);
      else if ('money' in e) add('money', e.money);
      else if ('karma' in e) add('karma', e.karma);
      else if ('fame' in e) add('fame', e.fame);
      else if ('relationship' in e) add(`rel:${e.relationship}`, e.delta);
      else if ('love' in e) add('love', e.love);
      else if ('energy' in e) add('energy', e.energy);
      else if ('jobPerformance' in e) add('perf', e.jobPerformance);
      else if ('grade' in e) add('grade', e.grade);
      else if ('injury' in e) add('health', -e.injury);
      else if ('addiction' in e) add('addiction', -e.delta);
      else if ('illness' in e) add('health', -5);
      else if ('chance' in e) { vec(e.then, p * e.chance, acc, other); vec(e.else ?? [], p * (1 - e.chance), acc, other); }
      else if ('random' in e) { const t = e.random.reduce((a, o) => a + o.weight, 0) || 1; for (const o of e.random) vec(o.effects, (p * o.weight) / t, acc, other); }
      else if (!('log' in e) && !('counter' in e)) other.add(JSON.stringify(e));
    }
    return [acc, other];
  }
  const trait = (c: ChoiceDef, k: 'trait' | 'notTrait') => (c.conditions ?? []).map((x) => (k in x ? (x as Record<string, string>)[k] : undefined)).find(Boolean);
  /** Every set of choices a player can be shown (a conditioned choice may be hidden; of a trait / notTrait pair exactly one shows). */
  function visibleSets(choices: readonly ChoiceDef[]): ChoiceDef[][] {
    const optional = choices.filter((c) => c.conditions?.length);
    const sets: ChoiceDef[][] = [];
    for (let mask = 0; mask < 1 << optional.length; mask++) {
      const shown = choices.filter((c) => !c.conditions?.length || mask & (1 << optional.indexOf(c)));
      const oneOfPair = choices.every((c) => {
        const t = trait(c, 'trait');
        const twin = t ? choices.find((d) => trait(d, 'notTrait') === t) : undefined;
        return !twin || shown.includes(c) !== shown.includes(twin);
      });
      if (oneOfPair && shown.length >= 2) sets.push(shown);
    }
    return sets;
  }
  type Priced = { c: ChoiceDef; v: [Vec, Set<string>] };
  const beats = (a: Priced, b: Priced) => {
    const keys = new Set([...Object.keys(a.v[0]), ...Object.keys(b.v[0])]);
    const ge = [...keys].every((k) => (a.v[0][k] ?? 0) >= (b.v[0][k] ?? 0) - 1e-9);
    const gt = [...keys].some((k) => (a.v[0][k] ?? 0) > (b.v[0][k] ?? 0) + 1e-9);
    const unpriced = [...b.v[1]].every((x) => a.v[1].has(x)) && [...a.v[1]].filter((x) => x.includes('"queue"')).every((x) => b.v[1].has(x));
    return keys.size > 0 && ge && gt && unpriced;
  };

  it('no choice beats every other choice a player can see beside it, in any era or situation', () => {
    const dominant = new Set<string>();
    for (const e of OWNED) {
      for (const shown of visibleSets(e.choices)) {
        const priced: Priced[] = shown.map((c) => ({ c, v: vec(c.effects) }));
        for (const a of priced) {
          if (priced.every((b) => b === a || beats(a, b))) dominant.add(`${e.id}/${a.c.id} over ${shown.filter((c) => c !== a.c).map((c) => c.id).join(',')}`);
        }
      }
    }
    expect([...dominant]).toEqual([]);
  });
});

describe('American English', () => {
  it('no British vocabulary in a title, setup, label or journal line', () => {
    const BRIT = /\b(sweets|cupboards?|full stop|corner shop|top marks?|cheeky|fortnight|queue[ds]?|petrol|lorry|car park|pavement|whilst|learnt|in hospital|at university|mum)\b/i;
    const bad = OWNED.flatMap((d) => lines(d).filter((l) => BRIT.test(l.text)).map((l) => `${d.id}: ${l.text}`));
    expect(bad).toEqual([]);
  });
});
