/**
 * Work, money, health, crime and community content: the rules the final playtest found broken.
 * A taken job offer moves me to the rival, workplace cards bind a coworker, cards about driving,
 * a job, rent, weather and the era check for them, one-time scenes stay one-time, and no plain
 * choice beats the others on every stat (docs/CONTENT_STYLE.md).
 */
import { EVENTS } from '@/data/events';
import { COWORKERS_EVENTS } from '@/data/events/coworkers';
import { CRIME_AND_PRISON_EVENTS } from '@/data/events/crime_and_prison';
import { HEALTH_EVENTS } from '@/data/events/health_events';
import { JUSTICE_AND_REENTRY_EVENTS } from '@/data/events/justice_and_reentry';
import { JUVENILE_DETENTION_EVENTS } from '@/data/events/juvenile_detention';
import { MIND_AND_COMMUNITY_EVENTS } from '@/data/events/mind_and_community';
import { MONEY_EVENTS } from '@/data/events/money_events';
import { NEIGHBOURS_AND_COMMUNITY_EVENTS } from '@/data/events/neighbours_and_community';
import { PRISON_LIFE_EVENTS } from '@/data/events/prison_life';
import { STARTING_SCENARIOS_EVENTS } from '@/data/events/starting_scenarios';
import { WORK_LIFE_EVENTS } from '@/data/events/work_life';
import { candidatesFor } from '../events/conditions';
import { EVENT_REGISTRY } from '../events/registry';
import type { Condition, Effect, EventDef } from '../events/schema';
import { isEligible, openNextEvent, resolveChoice } from '../events/select';
import { Rng } from '../rng';
import { createLife, makePerson } from '../systems/character';
import { workplaceOf, worksWithMe } from '../systems/coworkers';
import type { Asset, AssetKind, GameState, Job, Person } from '../types';

const MINE: EventDef[] = [
  ...HEALTH_EVENTS, ...CRIME_AND_PRISON_EVENTS, ...NEIGHBOURS_AND_COMMUNITY_EVENTS, ...MONEY_EVENTS, ...WORK_LIFE_EVENTS, ...JUVENILE_DETENTION_EVENTS,
  ...PRISON_LIFE_EVENTS, ...MIND_AND_COMMUNITY_EVENTS, ...COWORKERS_EVENTS, ...STARTING_SCENARIOS_EVENTS, ...JUSTICE_AND_REENTRY_EVENTS,
];

function byId(id: string): EventDef {
  const def = EVENTS.find((e) => e.id === id);
  if (!def) throw new Error(`no event ${id}`);
  return def;
}

const JOB: Job = {
  defId: 'accountant', title: 'Accountant', company: 'Granite & Sons', salary: 60_000, level: 1, performance: 70, yearsHeld: 4, yearsAtLevel: 2,
  category: 'finance', partTime: false, askedThisYear: false, workedHarderThisYear: false,
};

/** An adult with nobody in their life, no job, no assets and no history of cards. */
function adult(age: number, year = 2015): GameState {
  const s = createLife({ countryCode: 'US' }, 11);
  return { ...s, year, people: {}, assets: [], firedEvents: {}, eventQueue: [], pendingEvent: null, flags: {}, character: { ...s.character, age } };
}

const withJob = (s: GameState): GameState => ({ ...s, career: { ...s.career, job: JOB, retired: false } });

function withAsset(s: GameState, defId: string, kind: AssetKind, primary = false): GameState {
  const a: Asset = { id: `a_${defId}`, defId, kind, name: defId, value: 1000, purchasePrice: 1000, condition: 100, yearlyUpkeep: 0, mortgage: null, boughtAtAge: s.character.age, primary };
  return { ...s, assets: [...s.assets, a] };
}

function withPeople(s: GameState, ...people: Person[]): GameState {
  return { ...s, people: { ...s.people, ...Object.fromEntries(people.map((p) => [p.id, p])) } };
}

/** Every player-facing line of an event with the conditions in force when it shows (the event's plus its choice's). */
function lines(def: EventDef): { text: string; conds: Condition[] }[] {
  const ev = def.conditions ?? [];
  const out = [{ text: def.title, conds: ev }, { text: def.text, conds: ev }];
  for (const c of def.choices) {
    const conds = [...ev, ...(c.conditions ?? [])];
    out.push({ text: c.label, conds }, { text: c.hint ?? '', conds });
    const walk = (effects: readonly Effect[]): void => {
      for (const e of effects) {
        if ('log' in e) out.push({ text: e.log, conds });
        if ('newPerson' in e && e.newPerson.log) out.push({ text: e.newPerson.log, conds });
        if ('chance' in e) { walk(e.then); walk(e.else ?? []); }
        if ('random' in e) for (const o of e.random) walk(o.effects);
      }
    };
    walk(c.effects);
  }
  return out;
}

function mentions(conds: readonly Condition[], test: (c: Condition) => boolean): boolean {
  return conds.some((c) => test(c) || ('any' in c && mentions(c.any, test)) || ('all' in c && mentions(c.all, test)));
}

/** The earliest calendar year a line can show: players are born 1975-2010, and a { year: { gte } } gate lifts it. */
function earliestYear(def: EventDef, conds: readonly Condition[]): number {
  let year = 1975 + def.minAge;
  for (const c of conds) if ('year' in c && c.year.gte !== undefined) year = Math.max(year, c.year.gte);
  return year;
}

describe('the rival offer', () => {
  it('taking it keeps my job and rung at a new company, and leaves me jobless only when the offer falls through', () => {
    let switched = 0;
    let fellThrough = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const start: GameState = { ...withJob(adult(30)), rng: new Rng(seed).snapshot(), eventQueue: [{ eventId: 'wk_counter_offer', context: {} }] };
      const opened = openNextEvent(start, EVENT_REGISTRY);
      expect(opened.pendingEvent?.eventId).toBe('wk_counter_offer');
      const s = resolveChoice(opened, 'take', EVENT_REGISTRY);
      if (s.career.job) {
        switched++;
        expect(s.career.job).toMatchObject({ defId: 'accountant', level: 1, salary: 69_000, yearsHeld: 0 });
        expect(s.career.job.company).not.toBe('Granite & Sons');
        expect(s.career.history.at(-1)).toMatchObject({ company: 'Granite & Sons', reason: 'left' });
        // The new place hires me into a team like any full-time job (switchEmployer), so the workplace cards (which
        // bind only current coworkers) still open there; the card itself adds nobody on top.
        const team = Object.values(s.people).filter((p) => p.kind === 'coworker' && worksWithMe(s, p)).length;
        expect(team).toBeGreaterThanOrEqual(2);
        expect(team).toBeLessThanOrEqual(3);
      } else {
        fellThrough++;
        expect(s.log.some((l) => l.text.includes('restructured'))).toBe(true);
      }
    }
    expect(switched).toBeGreaterThan(fellThrough);
    expect(fellThrough).toBeGreaterThan(0);
  });

  it('only comes for a job with a rival employer (not the city police or the Army)', () => {
    const def = byId('wk_counter_offer');
    expect(isEligible(withJob(adult(30)), def)).toBe(true);
    for (const defId of ['police', 'military']) {
      const s = adult(30);
      expect(isEligible({ ...s, career: { ...s.career, job: { ...JOB, defId, category: 'public' } } }, def)).toBe(false);
    }
  });

  it('never comes for an owner or contractor, who runs the business, but does for a CFO', () => {
    const def = byId('wk_counter_offer');
    const at = (defId: string, level: number, category: Job['category']) => {
      const s = adult(45);
      return { ...s, career: { ...s.career, job: { ...JOB, defId, level, category } } };
    };
    expect(isEligible(at('hairdresser', 3, 'service'), def)).toBe(false); // Salon Owner
    expect(isEligible(at('carpenter', 3, 'trade'), def)).toBe(false); // Building Contractor
    expect(isEligible(at('dentist', 2, 'health'), def)).toBe(false); // Practice Owner
    expect(isEligible(at('carpenter', 2, 'trade'), def)).toBe(true); // Master Carpenter
    expect(isEligible(at('accountant', 4, 'finance'), def)).toBe(true); // CFO
  });
});

describe('workplace cards', () => {
  const WORKPLACE = ['wk_credit_thief', 'wk_harassment_witness', 'wk_birthday_collection', 'wk_fish_microwave', 'wk_cover_sick_coworker', 'wk_wrongful_blame', 'wk_mentor_offer', 'wk_retiring_colleague', 'mn_raise_tip'];
  const me = 39;
  const friend = makePerson(new Rng(6), { kind: 'friend', age: 58, countryCode: 'US', playerAge: me, relationship: 60 });
  const coworker = { ...makePerson(new Rng(5), { kind: 'coworker', age: 58, countryCode: 'US', playerAge: me, relationship: 60 }), workplace: workplaceOf(JOB) };
  const oldCoworker = { ...makePerson(new Rng(7), { kind: 'coworker', age: 58, countryCode: 'US', playerAge: me, relationship: 60 }), workplace: { jobId: 'accountant', company: 'Old Firm' } };

  it.each(WORKPLACE)('%s binds only a coworker at my current job', (id) => {
    const def = byId(id);
    expect(def.person?.kind).toEqual(['coworker']);
    const employed = withJob(adult(me));
    // A friend from outside work is never the person microwaving fish on my floor.
    expect(isEligible(withPeople(employed, friend, oldCoworker), def)).toBe(false);
    const s = withPeople(employed, friend, oldCoworker, coworker);
    expect(isEligible(s, def)).toBe(true);
    expect(candidatesFor(s, def.person!).map((p) => p.id)).toEqual([coworker.id]);
  });
});

describe('cards that assume a car, a job or a rented home', () => {
  it('the near miss on the highway needs a real car (not a bicycle)', () => {
    const def = byId('hl_near_miss');
    expect(isEligible(adult(30), def)).toBe(false);
    expect(isEligible(withAsset(adult(30), 'bike', 'car'), def)).toBe(false);
    expect(isEligible(withAsset(adult(30), 'sedan', 'car'), def)).toBe(true);
  });

  it("'Bury myself in work' is offered only to someone with a job", () => {
    const sibling = makePerson(new Rng(3), { kind: 'sibling', age: 40, countryCode: 'US', playerAge: 62, relationship: 60 });
    const choicesFor = (s: GameState) =>
      openNextEvent({ ...withPeople(s, sibling), eventQueue: [{ eventId: 'hl_relative_diagnosis', context: {}, personId: sibling.id }] }, EVENT_REGISTRY).pendingEvent?.choices.map((c) => c.id);
    const retiree = adult(62);
    expect(choicesFor({ ...retiree, career: { ...retiree.career, retired: true, job: null } })).toEqual(['visit', 'calls']);
    expect(choicesFor(withJob(adult(62)))).toEqual(['visit', 'calls', 'avoid']);
  });

  it('a man selling roof repairs at the door needs a roof of my own', () => {
    const def = byId('nc_doorstep_scam');
    expect(isEligible(withJob(adult(30)), def)).toBe(false);
    expect(isEligible(withAsset(withJob(adult(30)), 'condo', 'house', true), def)).toBe(true);
  });

  it('a rent increase needs a rented place of my own, not my parents\' house or one I own', () => {
    const def = byId('mn_rent_increase');
    const renter = withJob(adult(30));
    expect(isEligible(renter, def)).toBe(true);
    expect(isEligible(adult(19), def)).toBe(false);
    expect(isEligible(withAsset(renter, 'condo', 'house', true), def)).toBe(false);
  });
});

describe('one-time scenes', () => {
  const WALLETS = ['kd_found_wallet', 'cp_found_wallet', 'mn_lucky_find', 'nc_found_wallet'];

  it.each(['cp_found_wallet', 'mn_lucky_find', 'nc_found_wallet'])('%s happens once, and never after another found wallet', (id) => {
    const def = byId(id);
    expect(def.once).toBe(true);
    expect(isEligible(adult(30), def)).toBe(true);
    for (const other of WALLETS) expect(isEligible({ ...adult(30), firedEvents: { [other]: 20 } }, def)).toBe(false);
    // kid_years' wallet (a child's) does not look for these, so they start only once it can no longer open.
    expect(def.minAge).toBeGreaterThan(byId('kd_found_wallet').maxAge);
  });

  it('the lost dog Biscuit is lost once, and no other dog in the game is called Biscuit', () => {
    expect(byId('nc_lost_dog_poster').once).toBe(true);
    expect(EVENTS.filter((e) => JSON.stringify(e).includes('Biscuit')).map((e) => e.id)).toEqual(['nc_lost_dog_poster']);
  });

  it('vignettes whose repeat reads as broken come back after six years at the soonest', () => {
    const REPEATERS = [
      'mn_surprise_bill', 'mn_car_repair', 'mn_scam_email', 'mn_parking_fine', 'mn_rent_increase', 'mn_charity_ask', 'mn_debt_collector', 'nc_noisy_neighbour', 'nc_petition',
      'nc_neighbour_moving', 'nc_street_festival', 'nc_block_party', 'nc_yard_sale', 'hl_food_poisoning', 'hl_dentist', 'hl_allergies', 'hl_near_miss', 'cp_pickpocketed',
      'cp_cheap_phone', 'wk_cover_sick_coworker', 'wk_birthday_collection', 'wk_cover_weekend',
    ];
    const tooSoon = REPEATERS.map(byId).filter((d) => !d.once && (d.cooldown ?? 2) < 6).map((d) => `${d.id} (${d.cooldown ?? 2})`);
    expect(tooSoon).toEqual([]);
  });
});

describe('weather and era', () => {
  it('the big snowstorm buries a city that gets snow (not Miami or Lagos)', () => {
    const def = byId('mc_snowstorm');
    const inCountry = (countryCode: string) => {
      const s = adult(30);
      return { ...s, character: { ...s.character, countryCode } };
    };
    for (const code of ['CA', 'DE', 'JP', 'GB']) expect(isEligible(inCountry(code), def)).toBe(true);
    for (const code of ['US', 'BR', 'NG', 'AU', 'IN']) expect(isEligible(inCountry(code), def)).toBe(false);
  });

  it('snow and winter only where the country has them', () => {
    const WINTRY = /\b(winter|snow\w*|blizzard|sled\w*|mittens)\b/i;
    const bad = MINE.flatMap((d) => lines(d).filter((l) => WINTRY.test(l.text) && !mentions(l.conds, (c) => 'climate' in c || 'country' in c)).map((l) => `${d.id}: ${l.text}`));
    expect(bad).toEqual([]);
  });

  it('phones, apps, the internet and crypto only once they existed', () => {
    const ERA: [RegExp, number][] = [
      [/\bcrypto|\bcoin\b/i, 2013],
      [/\bapps?\b|group chat|video call|emoji|screenshot|selfie|podcast|\bviral\b|\bon read\b|bank app|\blikes\b|\bscroll/i, 2008],
      [/\btext(s|ed|ing)?\b|lit up my phone|phone lit up|pings? my phone/i, 2003],
      [/\bonline\b|internet|website|\bemails?\b|\bforum\b|\binbox\b/i, 1998],
    ];
    const bad = MINE.flatMap((d) =>
      lines(d).flatMap((l) => ERA.filter(([re, year]) => re.test(l.text) && earliestYear(d, l.conds) < year).map(([, year]) => `${d.id} (from ${earliestYear(d, l.conds)}, needs ${year}): ${l.text}`)),
    );
    expect(bad).toEqual([]);
  });
});

describe('choices', () => {
  /** What a choice certainly does, stat by stat; undefined when it involves chance or an effect that cannot be scored. */
  function sure(effects: readonly Effect[]): { score: Record<string, number>; other: string } | undefined {
    const score: Record<string, number> = {};
    const other: string[] = [];
    const add = (k: string, v: number) => (score[k] = (score[k] ?? 0) + v);
    for (const e of effects) {
      if ('chance' in e || 'random' in e) return undefined;
      if ('stat' in e) add(e.stat, e.delta);
      else if ('stats' in e) for (const [k, v] of Object.entries(e.stats)) add(k, v ?? 0);
      else if ('money' in e) add('money', e.money);
      else if ('karma' in e) add('karma', e.karma);
      else if ('fame' in e) add('fame', e.fame);
      else if ('relationship' in e) add(`rel:${e.relationship}`, e.delta);
      else if ('love' in e) add('love', e.love);
      else if ('energy' in e) add('energy', e.energy);
      else if ('jobPerformance' in e) add('performance', e.jobPerformance);
      else if ('grade' in e) add('grade', e.grade);
      else if ('injury' in e) add('health', -e.injury);
      else if ('addiction' in e) add(`sober:${e.addiction}`, -e.delta);
      else if (!('log' in e) && !('counter' in e)) other.push(JSON.stringify(e));
    }
    return { score, other: other.sort().join('|') };
  }

  it('no plain choice beats another on every stat (CONTENT_STYLE: each option trades something)', () => {
    const dominated: string[] = [];
    for (const def of MINE) {
      const scored = def.choices.map((c) => ({ c, s: sure(c.effects) }));
      for (const a of scored) {
        for (const b of scored) {
          if (a === b || !a.s || !b.s || a.s.other !== b.s.other) continue;
          const keys = new Set([...Object.keys(a.s.score), ...Object.keys(b.s.score)]);
          const va = (k: string) => a.s!.score[k] ?? 0;
          const vb = (k: string) => b.s!.score[k] ?? 0;
          if (keys.size && [...keys].every((k) => va(k) >= vb(k)) && [...keys].some((k) => va(k) > vb(k))) dominated.push(`${def.id}: '${a.c.label}' beats '${b.c.label}'`);
        }
      }
    }
    expect(dominated).toEqual([]);
  });
});

describe('twins', () => {
  it('no title here is shared with another event', () => {
    const byTitle = new Map<string, string[]>();
    for (const e of EVENTS) byTitle.set(e.title.toLowerCase(), [...(byTitle.get(e.title.toLowerCase()) ?? []), e.id]);
    const shared = MINE.filter((d) => byTitle.get(d.title.toLowerCase())!.length > 1).map((d) => `${d.id}: ${d.title} (${byTitle.get(d.title.toLowerCase())!.join(', ')})`);
    expect(shared).toEqual([]);
  });

  it('no sentence here (six words or more) is word for word in another event', () => {
    const norm = (t: string) => t.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
    const owners = new Map<string, Set<string>>();
    for (const def of EVENTS) {
      for (const { text } of lines(def)) {
        for (const sentence of text.split(/(?<=[.!?])\s+/)) {
          const key = norm(sentence);
          if (key.split(' ').length >= 6) owners.set(key, new Set([...(owners.get(key) ?? []), def.id]));
        }
      }
    }
    const mine = new Set(MINE.map((d) => d.id));
    const shared = [...owners].filter(([, ids]) => ids.size > 1 && [...ids].some((id) => mine.has(id))).map(([k, ids]) => `${[...ids].join(', ')}: ${k}`);
    expect(shared).toEqual([]);
  });

  it.each([
    ['wk_workplace_flirt', 'lf_coworker_asks_out', 6],
    ['wk_burnout', 'ad_burnout', 5],
    ['pl_meet_parents', 'lf_meet_their_parents', 5],
  ] as const)('%s stays away from its twin %s for %i years', (id, twin, years) => {
    const def = byId(id);
    const s: GameState = { ...withJob(adult(def.minAge + years + 1)), flags: {} };
    // Whatever else the card needs (a record, low spirits, no partner), the twin's guard is the only thing that changes here.
    const ready: GameState = {
      ...s,
      crime: { ...s.crime, record: true },
      character: { ...s.character, stats: { ...s.character.stats, happiness: 30 } },
      people: def.person ? { p: { ...makePerson(new Rng(9), { kind: 'lover', age: def.minAge + years, countryCode: 'US', playerAge: def.minAge + years + 1, relationship: 60 }), id: 'p' } } : {},
    };
    const age = ready.character.age;
    expect(isEligible(ready, def)).toBe(true);
    expect(isEligible({ ...ready, firedEvents: { [twin]: age - years } }, def)).toBe(false);
    expect(isEligible({ ...ready, firedEvents: { [twin]: age - years - 1 } }, def)).toBe(true);
  });

  it('one pyramid pitch per life: no wellness oils after the triangle-shaped one', () => {
    const def = byId('mn_mlm_pitch');
    const friend = makePerson(new Rng(4), { kind: 'friend', age: 40, countryCode: 'US', playerAge: 40, relationship: 60 });
    const s = withPeople(adult(40), friend);
    const ready: GameState = { ...s, finances: { ...s.finances, cash: 5000 } };
    expect(isEligible(ready, def)).toBe(true);
    expect(isEligible({ ...ready, firedEvents: { ad_friend_mlm: 33 } }, def)).toBe(false);
  });
});
