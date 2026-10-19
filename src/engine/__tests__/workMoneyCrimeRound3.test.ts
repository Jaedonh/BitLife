/**
 * Work, money, health, crime, prison, re-entry, community, coworker, scenario and school content: the third
 * playtest's findings. Each block pins one fix: no aunt, great-aunt or cousin for a foster child, one-off moments
 * that bind a person once, clinic bills only where the doctor is not public, office cards for desk jobs, no
 * corporate cards for elected seats, judges or the armed forces, fixed scenes at most twice a life, a coworker who
 * leaves stays a friend when close, a witness whose honest choice costs something, payouts that match their words,
 * a minor's bill that does not come out of their pocket, a false accusation that is not a crime, farm cards that
 * need the farm, and the first visit to a partner's parents early in the relationship.
 */
import { EVENTS } from '@/data/events';
import { COWORKERS_EVENTS } from '@/data/events/coworkers';
import { CRIME_AND_PRISON_EVENTS } from '@/data/events/crime_and_prison';
import { HEALTH_EVENTS } from '@/data/events/health_events';
import { JUSTICE_AND_REENTRY_EVENTS } from '@/data/events/justice_and_reentry';
import { JUVENILE_DETENTION_EVENTS } from '@/data/events/juvenile_detention';
import { MIND_AND_COMMUNITY_EVENTS } from '@/data/events/mind_and_community';
import { MONEY_EVENTS } from '@/data/events/money_events';
import { PRISON_LIFE_EVENTS } from '@/data/events/prison_life';
import { SCHOOL_LIFE_EVENTS } from '@/data/events/school_life';
import { STARTING_SCENARIOS_EVENTS } from '@/data/events/starting_scenarios';
import { WORK_LIFE_EVENTS } from '@/data/events/work_life';
import { COUNTRIES, getCountry } from '@/data/countries';
import { JOB_BY_ID, JOBS } from '@/data/jobs';
import { EVENT_REGISTRY } from '../events/registry';
import type { Condition, Effect, EventDef } from '../events/schema';
import { fitsState, isEligible, openNextEvent, resolveChoice } from '../events/select';
import { Rng } from '../rng';
import { createLife, makePerson } from '../systems/character';
import { hireCoworkers, workplaceOf } from '../systems/coworkers';
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
    ...('chance' in e ? [...logs(e.then), ...logs(e.else ?? [])] : []),
    ...('random' in e ? e.random.flatMap((o) => logs(o.effects)) : []),
  ]);
}

function effectsOf(effects: readonly Effect[]): Effect[] {
  return effects.flatMap((e) => [e, ...('chance' in e ? [...effectsOf(e.then), ...effectsOf(e.else ?? [])] : []), ...('random' in e ? e.random.flatMap((o) => effectsOf(o.effects)) : [])]);
}

/** Every player-facing line of an event with the conditions in force when it shows (the event's plus its choice's). */
function lines(def: EventDef): { text: string; conds: Condition[] }[] {
  const ev = def.conditions ?? [];
  return [
    { text: def.text, conds: ev },
    ...def.choices.flatMap((c) => [c.label, ...logs(c.effects)].map((text) => ({ text, conds: [...ev, ...(c.conditions ?? [])] }))),
  ];
}

/** An adult with nobody in their life, no job, no assets and no history of cards, in the first city of a country. */
function adult(age: number, year = 2015, countryCode = 'US', flags: GameState['flags'] = {}): GameState {
  const s = createLife({ countryCode }, 11);
  return {
    ...s, year, people: {}, assets: [], firedEvents: {}, eventQueue: [], pendingEvent: null, flags,
    finances: { ...s.finances, cash: 20_000 },
    character: { ...s.character, age, countryCode, city: getCountry(countryCode).cities[0]! },
  };
}

function job(defId: string, level: number, company = 'Keystone Group'): Job {
  const def = JOB_BY_ID[defId]!;
  return {
    defId, title: def.ladder[level]!.title, company, salary: def.ladder[level]!.salary, level, performance: 70, yearsHeld: 4, yearsAtLevel: 2,
    category: def.category, partTime: def.partTime === true, askedThisYear: false, workedHarderThisYear: false,
  };
}

/** Employed at this job and rung, with the coworkers a hire brings (relationship 40-60). */
const employed = (s: GameState, defId: string, level = 0, company?: string): GameState =>
  hireCoworkers({ ...s, career: { ...s.career, job: job(defId, level, company), retired: false } }, new Rng(level + 5));

const withPeople = (s: GameState, ...people: Person[]): GameState => ({ ...s, people: { ...s.people, ...Object.fromEntries(people.map((p) => [p.id, p])) } });

/** Opens a card through the queue with a fixed seed (bound to a person if given) and takes one choice. */
function take(s: GameState, eventId: string, choiceId: string, seed: number, personId?: string): GameState {
  const opened = openNextEvent({ ...s, rng: new Rng(seed).snapshot(), eventQueue: [{ eventId, context: {}, ...(personId ? { personId } : {}) }] }, EVENT_REGISTRY);
  expect(opened.pendingEvent?.eventId).toBe(eventId);
  return resolveChoice(opened, choiceId, EVENT_REGISTRY);
}

describe('a foster child has no aunt, great-aunt or cousin', () => {
  const MY_RELATIVE = /\b[Mm]y (great-)?(aunts?|uncles?|cousins?)\b|\bgreat-aunt\b|\b[Aa] cousin called\b/;
  const orphan = (age: number, flags: GameState['flags'] = {}) => adult(age, 2020, 'US', { foster_care: true, 'scenario:orphan': true, ...flags });

  it('the cousin with the crypto tip, the great-aunt with the will and the cousin getting married never reach an orphan', () => {
    const fosterParent = makePerson(new Rng(4), { kind: 'stepmother', age: 60, countryCode: 'US', playerAge: 30, relationship: 70 });
    for (const [id, flags] of [['mn_crypto_tip', {}], ['mn_distant_inheritance', {}], ['jr_parole_travel', { parole: true }]] as const) {
      expect([id, isEligible(withPeople(adult(30, 2020, 'US', { ...flags }), fosterParent), byId(id))]).toEqual([id, true]);
      expect([id, isEligible(withPeople(orphan(30, { ...flags }), fosterParent), byId(id))]).toEqual([id, false]);
    }
  });

  it('no line in these files about my own aunt, uncle or cousin can open for a foster child', () => {
    // The orphan scenario rules out every other scenario flag, so a card behind one (an immigrant's aunt back home) is safe.
    const safe = (conds: readonly Condition[]): boolean =>
      conds.some((c) => ('not' in c && 'flag' in c.not && c.not.flag === 'foster_care') || ('flag' in c && /^(immigrant|farm|prodigy|scenario:(?!orphan))/.test(c.flag)) || ('any' in c && c.any.every((x) => safe([x]))) || ('all' in c && safe(c.all)));
    const bad = OWNED.flatMap((d) => lines(d).filter((l) => MY_RELATIVE.test(l.text) && !safe(l.conds)).map((l) => `${d.id}: ${l.text}`));
    expect(bad).toEqual([]);
  });

  it('the local news card is still there for an orphan, with a neighbor instead of a cousin', () => {
    const def = byId('mc_local_news');
    expect(isEligible(orphan(40), def)).toBe(true);
    expect(lines(def).filter((l) => /cousin/i.test(l.text))).toEqual([]);
  });
});

describe('one-off moments in someone else\'s life bind them once', () => {
  it('a sentencing, a wedding and a mother\'s funeral are cards that fire once a life', () => {
    for (const id of ['jr_witness_character', 'cw_wedding_invite', 'cw_wedding_speech', 'cw_grief']) expect([id, byId(id).once]).toEqual([id, true]);
  });

  it('"a dozen real conversations" is a coworker I have known a few years at most', () => {
    const def = byId('cw_wedding_invite');
    const s = employed(adult(48), 'accountant', 1);
    const at = (metAtAge: number) => ({ ...s, people: Object.fromEntries(Object.entries(s.people).map(([id, p]) => [id, { ...p, metAtAge, relationship: 50, age: 35 }])) });
    expect(isEligible(at(45), def)).toBe(true);
    expect(isEligible(at(35), def)).toBe(false);
  });

  it('a once-a-life card does not come back, whoever it would bind', () => {
    const def = byId('cw_wedding_invite');
    const s = employed(adult(48), 'accountant', 1);
    const fresh = { ...s, people: Object.fromEntries(Object.entries(s.people).map(([id, p]) => [id, { ...p, metAtAge: 46, relationship: 50, age: 35 }])) };
    expect(isEligible({ ...fresh, firedEvents: { cw_wedding_invite: 40 } }, def)).toBe(false);
  });
});

describe('US-only details stay where they belong', () => {
  it('a clinic bill with a "facility fee" comes only where the doctor is not public', () => {
    const def = byId('mn_surprise_bill');
    for (const c of COUNTRIES) expect([c.code, isEligible(adult(40, 2015, c.code), def)]).toEqual([c.code, !c.publicHealthcare]);
  });

  it('no distance in miles, homeroom or community college in these files', () => {
    const US_ONLY = /\b(two|three|four|five|ten|\d+) miles\b|\bodometer\b|\bhomeroom\b|\bcommunity college\b/i;
    const bad = OWNED.flatMap((d) => lines(d).filter((l) => US_ONLY.test(l.text)).map((l) => `${d.id}: ${l.text}`));
    expect(bad).toEqual([]);
  });
});

describe('office cards are for desk jobs', () => {
  const OFFICE = ['wk_credit_thief', 'wk_expense_report', 'wk_company_retreat'];

  it('a proposal stolen in a meeting, an expense report and a corporate retreat never reach a warehouse, a kitchen or a fire station', () => {
    for (const [defId, level] of [['warehouse', 0], ['fast_food', 1], ['electrician', 0], ['paramedic', 0], ['firefighter', 0], ['chef', 0], ['athlete', 1], ['janitor', 0], ['nurse', 0]] as const) {
      for (const id of OFFICE) expect([id, defId, isEligible(employed(adult(30), defId, level), byId(id))]).toEqual([id, defId, false]);
    }
    for (const defId of ['accountant', 'software_dev', 'marketing', 'lawyer', 'engineer']) {
      for (const id of OFFICE) expect([id, defId, isEligible(employed(adult(30), defId), byId(id))]).toEqual([id, defId, true]);
    }
  });
});

describe('elected seats, judges and the armed forces get no corporate cards', () => {
  const CORPORATE = ['wk_layoff_rumour', 'wk_employee_award', 'wk_performance_review', 'wk_drug_test', 'wk_union_drive', 'wk_salary_overheard', 'wk_stock_theft', 'wk_cover_weekend', 'mn_bonus', 'mn_raise_tip'];
  /** A coworker close enough for mn_raise_tip's whisper. */
  const friendly = (s: GameState): GameState => ({ ...s, people: Object.fromEntries(Object.entries(s.people).map(([id, p]) => [id, { ...p, relationship: 60 }])) });
  const office: [string, number, string][] = [
    ...JOB_BY_ID.politician!.ladder.slice(1).map((_, i): [string, number, string] => ['politician', i + 1, 'Chicago City Hall']),
    ...JOB_BY_ID.judge!.ladder.map((_, i): [string, number, string] => ['judge', i, 'the Chicago District Court']),
    ...JOB_BY_ID.military!.ladder.map((_, i): [string, number, string] => ['military', i, 'the Army']),
  ];

  it('no annual review, employee of the month, bonus, drug test or layoff rumor for a councilor, a minister, a judge or a colonel', () => {
    for (const [defId, level, company] of office) {
      const s = friendly(employed(adult(50, 2020), defId, level, company));
      for (const id of CORPORATE) expect([id, defId, level, isEligible(s, byId(id))]).toEqual([id, defId, level, false]);
      // The layoff memo is a follow-up: queued for someone who then took office, it does not open.
      expect([defId, level, fitsState(s, byId('wk_layoff_news'))]).toEqual([defId, level, false]);
    }
  });

  it('staff still get them: a campaign aide, a warehouse associate and an accountant', () => {
    for (const [defId, level] of [['politician', 0], ['warehouse', 0], ['accountant', 1]] as const) {
      const s = friendly(employed(adult(35, 2020), defId, level));
      for (const id of ['wk_layoff_rumour', 'wk_performance_review', 'mn_bonus', 'mn_raise_tip']) expect([id, defId, isEligible(s, byId(id))]).toEqual([id, defId, true]);
      expect([defId, fitsState(s, byId('wk_layoff_news'))]).toEqual([defId, true]);
    }
  });

  it('nobody lays off, reviews or tests the owner of the business or whoever sits at the top', () => {
    for (const [defId, level] of [['hairdresser', 3], ['executive', JOB_BY_ID.executive!.ladder.length - 1], ['police', JOB_BY_ID.police!.ladder.length - 1]] as const) {
      const s = friendly(employed(adult(50, 2020), defId, level));
      for (const id of ['wk_layoff_rumour', 'wk_performance_review', 'wk_drug_test', 'wk_employee_award', 'mn_bonus']) expect([id, defId, isEligible(s, byId(id))]).toEqual([id, defId, false]);
    }
  });

  it('a part-time cashier still has a manager, so can be employee of the month', () => {
    expect(isEligible(employed(adult(16, 2020), 'pt_cashier'), byId('wk_employee_award'))).toBe(true);
  });

  it('the hero call is for uniformed shift workers who commute, not a mayor or a soldier on base', () => {
    const def = byId('wk_hero_call');
    expect(isEligible(employed(adult(40), 'firefighter', 1), def)).toBe(true);
    expect(isEligible(employed(adult(40), 'security', 1), def)).toBe(true);
    expect(isEligible(employed(adult(40), 'politician', 2, 'Chicago City Hall'), def)).toBe(false);
    expect(isEligible(employed(adult(40), 'military', 2, 'the Army'), def)).toBe(false);
  });

  it('cards about management, a supervisor or "the business" skip the owner, the top rung, an elected seat, a bench and a rank', () => {
    const top = (defId: string) => JOB_BY_ID[defId]!.ladder.length - 1;
    const noBoss: [string, number, string?][] = [
      ['electrician', top('electrician')], ['hairdresser', top('hairdresser')], ['police', top('police')], ['executive', top('executive')],
      ['politician', 2, 'Chicago City Hall'], ['judge', 1, 'the Chicago District Court'], ['military', 2, 'the Army'],
    ];
    const cards = ['wk_stock_theft', 'wk_safety_shortcut', 'wk_night_shift', 'wk_whistleblower', 'wk_trade_cash_job'];
    for (const [defId, level, company] of noBoss) {
      const s = employed(adult(40, 2020), defId, level, company);
      for (const id of cards) expect([id, defId, level, isEligible(s, byId(id))]).toEqual([id, defId, level, false]);
      for (const id of ['wk_union_vote', 'wk_whistle_fallout']) expect([id, defId, level, fitsState(s, byId(id))]).toEqual([id, defId, level, false]);
    }
    // Staff still get them.
    for (const [id, defId] of [['wk_stock_theft', 'warehouse'], ['wk_safety_shortcut', 'electrician'], ['wk_night_shift', 'nurse'], ['wk_whistleblower', 'accountant'], ['wk_trade_cash_job', 'plumber']] as const) {
      expect([id, defId, isEligible(employed(adult(40, 2020), defId, 1), byId(id))]).toEqual([id, defId, true]);
    }
  });

  it('a judge is not asked by a partner to shred files, and has no "boss" in the coworker cards', () => {
    const judge = friendly(employed(adult(50, 2020), 'judge', 1, 'the Chicago District Court'));
    for (const id of ['wk_shred_documents', 'cw_credit_misplaced', 'cw_interview_cover', 'cw_mentor_new_hire']) expect([id, isEligible(judge, byId(id))]).toEqual([id, false]);
    const lawyer = friendly(employed(adult(50, 2020), 'lawyer', 1));
    for (const id of ['wk_shred_documents', 'cw_credit_misplaced', 'cw_interview_cover', 'cw_mentor_new_hire']) expect([id, isEligible(lawyer, byId(id))]).toEqual([id, true]);
  });

  it('a star or a headliner has no paycheck to dock for a costly mistake', () => {
    expect(isEligible(employed(adult(30, 2020), 'athlete', 2), byId('wk_costly_mistake'))).toBe(false);
    expect(isEligible(employed(adult(30, 2020), 'accountant', 1), byId('wk_costly_mistake'))).toBe(true);
  });
});

describe('fixed scenes come at most twice in a life', () => {
  const twiceAtMost = (d: EventDef) => d.once === true || 2 * (d.cooldown ?? 2) > d.maxAge - d.minAge;
  it.each([
    'cp_dodgy_job', 'hl_wellness_scam', 'mn_scratch_card', 'mn_debt_collector', 'mc_storm_cleanup', 'mc_community_supper', 'mn_surprise_bill', 'mn_crypto_tip',
    'mn_identity_theft', 'mn_charity_ask', 'mn_tax_audit', 'mn_bistro_pitch', 'mn_side_gig', 'hl_car_accident', 'hl_near_miss', 'cp_scam_call', 'cp_old_cellmate_offer',
    'jr_witness_alibi', 'mc_cooling_center', 'mc_snowstorm', 'mc_work_missing_money', 'mc_work_near_miss', 'mc_work_inspection', 'mc_work_rollout',
    'mc_work_student_worry', 'mc_work_free_consult', 'mc_work_creative_block', 'mc_work_case_home', 'mc_work_reorg', 'wk_shred_documents', 'wk_company_retreat',
    'wk_coffee_rota', 'wk_hero_call', 'cp_falsely_accused', 'cp_cheap_phone', 'hl_food_poisoning', 'mn_wedding_gift', 'mn_mlm_pitch', 'cw_cake_vote',
    'mc_work_short_staffed', 'cp_pickpocketed', 'mc_friend_celebration', 'mn_friend_loan',
  ])('%s', (id) => expect(twiceAtMost(byId(id))).toBe(true));
});

describe('a coworker who leaves stays a friend when close', () => {
  it('no card in these files deletes a coworker outright', () => {
    const bad = OWNED.filter((d) => d.person?.kind.includes('coworker')).flatMap((d) => d.choices.filter((c) => effectsOf(c.effects).some((e) => 'removePerson' in e)).map((c) => `${d.id}/${c.id}`));
    expect(bad).toEqual([]);
  });

  it('a glowing reference for a coworker at 69 who gets the job leaves a friend at 77', () => {
    let s = employed(adult(35), 'accountant', 1);
    const cw = Object.values(s.people).find((p) => p.kind === 'coworker')!;
    s = withPeople(s, { ...cw, relationship: 69 });
    let checked = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const after = take(s, 'cw_reference', 'glowing', seed, cw.id);
      if (!after.log.some((l) => l.text.includes('got the job and called me first'))) continue;
      checked++;
      expect(after.people[cw.id]).toMatchObject({ kind: 'friend', relationship: 77 });
      expect(after.people[cw.id]!.workplace).toBeUndefined();
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('a coworker I barely know who leaves drops out of my life', () => {
    let s = employed(adult(35), 'accountant', 1);
    const cw = Object.values(s.people).find((p) => p.kind === 'coworker')!;
    s = withPeople(s, { ...cw, relationship: 30, workplace: workplaceOf(s.career.job!) });
    const after = take(s, 'cw_leaving_party', 'skip', 1, cw.id);
    expect(after.people[cw.id]).toBeUndefined();
  });

  it('"I have spoken to them maybe four times" never binds a coworker who would stay on as a friend', () => {
    const def = byId('cw_leaving_card');
    const s = employed(adult(35), 'accountant', 1);
    const at = (relationship: number) => ({ ...s, people: Object.fromEntries(Object.entries(s.people).map(([id, p]) => [id, { ...p, relationship }])) });
    expect(isEligible(at(45), def)).toBe(true);
    expect(isEligible(at(50), def)).toBe(false);
  });
});

describe('the witness summons has no free choice', () => {
  /** Expected stats of a choice, pricing an arrest and spent energy; a queued card and the log are neutral. */
  function priced(effects: readonly Effect[], p = 1, acc: Record<string, number> = {}): Record<string, number> {
    const add = (k: string, v: number) => { acc[k] = (acc[k] ?? 0) + p * v; };
    for (const e of effects) {
      if ('stat' in e) add(e.stat, e.delta);
      else if ('money' in e) add('money', e.money);
      else if ('karma' in e) add('karma', e.karma);
      else if ('energy' in e) add('energy', e.energy);
      else if ('arrest' in e) add('record', -1);
      else if ('chance' in e) { priced(e.then, p * e.chance, acc); priced(e.else ?? [], p * (1 - e.chance), acc); }
      else if ('random' in e) { const t = e.random.reduce((a, o) => a + o.weight, 0); for (const o of e.random) priced(o.effects, (p * o.weight) / t, acc); }
    }
    return acc;
  }
  it('telling the truth, forgetting and ignoring the letter each lose on something', () => {
    const def = byId('cp_witness_summons');
    const v = def.choices.map((c) => ({ id: c.id, v: priced(c.effects) }));
    for (const a of v) {
      const beatsAll = v.every((b) => {
        if (b === a) return true;
        const keys = new Set([...Object.keys(a.v), ...Object.keys(b.v)]);
        return [...keys].every((k) => (a.v[k] ?? 0) >= (b.v[k] ?? 0) - 1e-9) && [...keys].some((k) => (a.v[k] ?? 0) > (b.v[k] ?? 0) + 1e-9);
      });
      expect([a.id, beatsAll]).toEqual([a.id, false]);
    }
  });
});

describe('payouts match their words', () => {
  /** What a branch returns on the stake its choice paid up front. */
  function ratios(id: string): { choice: string; ratio: number; line: string }[] {
    return byId(id).choices.flatMap((c) => {
      const stake = -(c.effects.find((e): e is Extract<Effect, { money: number }> => 'money' in e)?.money ?? 0);
      if (stake <= 0) return [];
      return c.effects.flatMap((e) => ('random' in e ? e.random.map((o) => o.effects) : [])).map((b) => ({
        choice: c.id,
        ratio: b.reduce((n, x) => n + ('money' in x ? x.money : 0), 0) / stake,
        line: logs(b)[0] ?? '',
      }));
    });
  }
  it('the crypto tip: "sideways" is about the stake back, and no line claims a ten-x it does not pay', () => {
    for (const r of ratios('mn_crypto_tip')) {
      if (/sideways/i.test(r.line)) expect([r.line, r.ratio >= 0.8 && r.ratio <= 1.2]).toEqual([r.line, true]);
      if (/tripled/i.test(r.line)) expect([r.line, r.ratio]).toEqual([r.line, 3]);
      if (/four-x/i.test(r.line)) expect([r.line, r.ratio]).toEqual([r.line, 4]);
      if (/^Ten-x|Actual ten-x/i.test(r.line)) expect([r.line, r.ratio >= 9]).toEqual([r.line, true]);
    }
  });
});

describe("a minor's bill is paid by the family, and the journal does not say otherwise", () => {
  it('the appendix taken out at 14: the parents pay and the line does not say I am poorer', () => {
    const s0 = createLife({ countryCode: 'US' }, 11);
    const s: GameState = { ...s0, year: 2010, eventQueue: [], pendingEvent: null, character: { ...s0.character, age: 14 }, finances: { ...s0.finances, cash: 120 } };
    const mom = Object.values(s.people).find((p) => p.kind === 'mother')!;
    let surgeries = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const after = take(s, 'hl_appendix_pain', 'er', seed);
      expect(after.finances.cash).toBe(120);
      const line = after.log.at(-1)!.text;
      expect(line).not.toMatch(/\bless\b|\bpoorer\b/);
      if (/Appendicitis/.test(line)) { surgeries++; expect(after.people[mom.id]!.money).toBeLessThan(mom.money); }
    }
    expect(surgeries).toBeGreaterThan(0);
  });

  it('a fake ID bought with "my savings" comes out of my own cash', () => {
    const buy = byId('cp_fake_id').choices.find((c) => c.id === 'buy')!;
    for (const e of effectsOf(buy.effects)) if ('money' in e && e.money < 0) expect(e.payer).toBe('self');
  });
});

describe('a false accusation is not a crime', () => {
  it('taking the deal or losing at trial goes on the record but counts no crime', () => {
    const start = adult(40);
    const plea = take(start, 'cp_false_charge_court', 'plea', 1);
    expect(plea.crime).toMatchObject({ arrests: start.crime.arrests + 1, record: true, crimesCommitted: 0 });
    expect(plea.counters.crimes ?? 0).toBe(start.counters.crimes ?? 0);
    let lost = 0;
    for (let seed = 1; seed <= 30 && !lost; seed++) {
      const after = take(start, 'cp_false_charge_court', 'fight', seed);
      if (!after.crime.inPrison) continue;
      lost++;
      expect(after.crime).toMatchObject({ arrests: start.crime.arrests + 1, crimesCommitted: 0 });
      expect(after.counters.crimes ?? 0).toBe(start.counters.crimes ?? 0);
    }
    expect(lost).toBe(1);
  });

  it('every choice here that commits a crime counts it, whether or not anyone finds out', () => {
    // Clean Hands counts crimes (the crime menu and this counter), not arrests, so a card crime must bump the counter.
    for (const [id, choice] of [['wk_expense_report', 'pad'], ['wk_expense_report', 'big'], ['wk_shred_documents', 'shred'], ['cp_cheap_phone', 'buy'], ['cp_neighbour_fence', 'buy'], ['cp_fake_id', 'buy'], ['jr_witness_crash', 'fee'], ['jr_witness_alibi', 'lie'], ['mc_drug_text', 'answer'], ['pl_package', 'hide'], ['cp_dodgy_job', 'drive'], ['cp_prison_riot', 'join'], ['pl_new_kid', 'rent'], ['pl_laundry_pocket', 'keep'], ['sl_president_term', 'skim']] as const) {
      const c = byId(id).choices.find((x) => x.id === choice)!;
      expect([id, choice, c.effects.some((e) => 'counter' in e && e.counter === 'crimes')]).toEqual([id, choice, true]);
    }
    for (const [id, choice, defId] of [['wk_expense_report', 'pad', 'accountant'], ['wk_shred_documents', 'shred', 'accountant']] as const) {
      const s = employed(adult(40), defId, 1);
      const after = take(s, id, choice, 3);
      expect([id, (after.counters.crimes ?? 0) - (s.counters.crimes ?? 0)]).toEqual([id, 1]);
    }
  });
});

describe('farm cards need the farm', () => {
  it('every farm card requires the farm flag, so none opens once the family has left the farm', () => {
    const FARM_WORDS = /\b(farm|tractor|calf|calves|calving|lamb|harvest|chickens|troughs)\b/i;
    const farmCards = OWNED.filter((d) => FARM_WORDS.test(d.text));
    expect(farmCards.length).toBeGreaterThan(5);
    for (const d of farmCards) expect([d.id, (d.conditions ?? []).some((c) => 'flag' in c && c.flag === 'farm')]).toEqual([d.id, true]);
    const kid = createLife({ countryCode: 'US', scenario: 'farm_kid' }, 32);
    const at11: GameState = { ...kid, year: 2015, character: { ...kid.character, age: 11 }, education: { ...kid.education, enrolled: true, stage: 'primary' } };
    expect(farmCards.filter((d) => fitsState(at11, d)).length).toBeGreaterThan(3);
    const { farm: _farm, ...moved } = at11.flags;
    expect(farmCards.filter((d) => fitsState({ ...at11, flags: moved }, d)).map((d) => d.id)).toEqual([]);
  });
});

describe('meeting the parents is early in a relationship', () => {
  it('pl_meet_parents binds a partner of a few years at most', () => {
    const def = byId('pl_meet_parents');
    const s = adult(45, 2020, 'AU');
    const withRecord: GameState = { ...s, crime: { ...s.crime, record: true } };
    const lover = (metAtAge: number) => ({ ...makePerson(new Rng(9), { kind: 'lover', age: 44, countryCode: 'AU', playerAge: 45, relationship: 80 }), metAtAge, love: 80 });
    expect(isEligible(withPeople(withRecord, lover(43)), def)).toBe(true);
    expect(isEligible(withPeople(withRecord, lover(30)), def)).toBe(false);
  });
});

it('every job with more than one rung has a top rung the corporate cards leave out', () => {
  // A guard against a ladder added later without a top: HAS_A_BOSS leaves out each full-time ladder's last rung.
  for (const d of JOBS.filter((x) => !x.partTime && x.ladder.length > 1)) {
    const top = employed(adult(50, 2020), d.id, d.ladder.length - 1);
    expect([d.id, isEligible(top, byId('wk_performance_review'))]).toEqual([d.id, false]);
  }
});
