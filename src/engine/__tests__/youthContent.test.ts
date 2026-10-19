/**
 * Teen, young-adult, media, travel and friends content (the final playtest's "youth" findings).
 * Each block pins one fix: era gates, parents who exist, twins that read as different scenes and
 * never open within two years of each other, vignettes that do not come back, no claimed silence the
 * selector cannot see, workplace cards that bind coworkers, and no choice that beats every other one.
 */
import { EVENTS } from '@/data/events';
import { FRIENDS_AND_STRANGERS_EVENTS } from '@/data/events/friends_and_strangers';
import { TECHNOLOGY_AND_MEDIA_EVENTS } from '@/data/events/technology_and_media';
import { TEEN_LIFE_EVENTS } from '@/data/events/teen_life';
import { TEEN_YEARS_EVENTS } from '@/data/events/teen_years';
import { TRAVEL_EVENTS } from '@/data/events/travel_events';
import { YOUNG_ADULT_EVENTS } from '@/data/events/young_adult';
import { YOUNG_ADULT_PATHS_EVENTS } from '@/data/events/young_adult_paths';
import { candidatesFor, evaluateAll, evaluateCondition } from '../events/conditions';
import type { ChoiceDef, Condition, Effect, EventDef } from '../events/schema';
import { createLife } from '../systems/character';
import type { GameState, Person } from '../types';

const YOUTH: readonly EventDef[] = [
  ...TEEN_LIFE_EVENTS,
  ...TEEN_YEARS_EVENTS,
  ...YOUNG_ADULT_EVENTS,
  ...YOUNG_ADULT_PATHS_EVENTS,
  ...TECHNOLOGY_AND_MEDIA_EVENTS,
  ...TRAVEL_EVENTS,
  ...FRIENDS_AND_STRANGERS_EVENTS,
];
const BY_ID: Record<string, EventDef> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
const youth = (id: string): EventDef => {
  const e = YOUTH.find((x) => x.id === id);
  if (!e) throw new Error(`no youth event ${id}`);
  return e;
};

function logs(effects: readonly Effect[]): string[] {
  return effects.flatMap((e) => [
    ...('log' in e ? [e.log] : []),
    ...('newPerson' in e && e.newPerson.log ? [e.newPerson.log] : []),
    ...('chance' in e ? [...logs(e.then), ...logs(e.else ?? [])] : []),
    ...('random' in e ? e.random.flatMap((o) => logs(o.effects)) : []),
  ]);
}
const choiceLines = (c: ChoiceDef): string[] => [c.label, c.hint ?? '', ...logs(c.effects)];
const allLines = (e: EventDef): string[] => [e.title, e.text, ...e.choices.flatMap(choiceLines)];
/** The calendar year a top-level { year: { gte } } condition requires (0 when there is none). */
const yearGate = (conds: readonly Condition[] | undefined): number =>
  Math.max(0, ...(conds ?? []).map((c) => ('year' in c ? (c.year.gte ?? (c.year.gt ?? -1) + 1) : 0)));

describe('era: technology waits for its year (players are born 1975-2010)', () => {
  // The earliest year each technology belongs in a life story (docs/CONTENT_STYLE.md).
  const ERA: readonly [RegExp, number][] = [
    [/\bvap(e|es|ing)\b|rocket emoji/i, 2013],
    [/screen time|video[- ]call|\bstreamer\b|\bapps?\b|smartphone|emoji|screenshot|followers|group chat|\bviral\b|social media|two-factor|smart speaker|data breach|message request|\bfeed\b|\bonline\b(?! game)|on read/i, 2010],
    [/online game|leaderboard/i, 2003],
    [/\btext(s|ed|ing)?\b|voicemail|\binbox\b/i, 2000],
    [/e-?mail|website|reply all|internet|spam folder/i, 1997],
  ];
  const needs = (lines: readonly string[]): { year: number; term: string } => {
    let best = { year: 0, term: '' };
    for (const line of lines) for (const [re, year] of ERA) {
      const m = line.match(re);
      if (m && year > best.year) best = { year, term: m[0] };
    }
    return best;
  };

  it('every card (or choice) that names a phone, app, chat or the internet has a year gate at least that late', () => {
    const problems: string[] = [];
    for (const e of YOUTH) {
      const gate = yearGate(e.conditions);
      const head = needs([e.title, e.text]);
      if (head.year > gate) problems.push(`${e.id}: "${head.term}" needs ${head.year}, gate ${gate || 'none'}`);
      for (const c of e.choices) {
        const n = needs(choiceLines(c));
        if (n.year > Math.max(gate, yearGate(c.conditions))) problems.push(`${e.id}/${c.id}: "${n.term}" needs ${n.year}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('the playtest examples no longer open in their old years', () => {
    const at = (year: number): GameState => {
      const s = createLife({ countryCode: 'NG' }, 4);
      return { ...s, year, character: { ...s.character, age: 14 } };
    };
    const yearOnly = (id: string, year: number) => evaluateAll(at(year), youth(id).conditions?.filter((c) => 'year' in c));
    expect(yearOnly('tm_screen_time_intervention', 1994)).toBe(false);
    expect(yearOnly('tm_internet_outage', 1996)).toBe(false);
    expect(yearOnly('tn_vape_offer', 1991)).toBe(false);
    expect(yearOnly('tn_vape_offer', 2012)).toBe(false);
    expect(yearOnly('ya_hot_tip', 1998)).toBe(false);
    expect(yearOnly('tl_grade_group_chat', 1998)).toBe(false);
    expect(yearOnly('tm_screen_time_intervention', 2016)).toBe(true);
    expect(yearOnly('tn_vape_offer', 2016)).toBe(true);
  });
});

describe('parents: lines about Mom, Dad or the parents need them to exist', () => {
  const own = (line: string) =>
    line.replace(/(\{\{\w+\}\}'s|\{\{their\}\}|\b\w+'s|\b(a|her|his|their|the|whose)) (mom|dad|mother|father|parents)\b/gi, '').replace(/\{\{\w+\}\}/g, '');
  const requires = (conds: readonly Condition[] | undefined, kind: Person['kind']) =>
    (conds ?? []).some((c) => 'hasPerson' in c && c.hasPerson.length === 1 && c.hasPerson[0] === kind);

  it('no youth card says "our parents" or "my parents" (they render through {{parents}})', () => {
    const hits = YOUTH.flatMap((e) => allLines(e).filter((l) => /\b(our|my) parents\b/i.test(own(l))).map((l) => `${e.id}: ${l}`));
    expect(hits).toEqual([]);
  });

  it('a literal Mom / my mother (or Dad) comes with a living one', () => {
    const problems: string[] = [];
    for (const e of YOUTH) {
      for (const [kind, re] of [['mother', /\bmom\b|\bmy mother\b/i], ['father', /\bdad\b|\bmy father\b/i]] as const) {
        const bound = e.person?.kind.length === 1 && e.person.kind[0] === kind;
        if (bound || requires(e.conditions, kind)) continue;
        if ([e.title, e.text].some((l) => re.test(own(l)))) problems.push(`${e.id} text`);
        for (const c of e.choices) if (choiceLines(c).some((l) => re.test(own(l))) && !requires(c.conditions, kind)) problems.push(`${e.id}/${c.id}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('the golden-sibling card names whoever is at home, and only opens when someone is', () => {
    const e = youth('tn_golden_sibling');
    expect(e.text).toContain('{{parents}}');
    const orphan = createLife({ scenario: 'orphan' }, 3);
    const noGuardian: GameState = { ...orphan, people: Object.fromEntries(Object.entries(orphan.people).filter(([, p]) => !['mother', 'father', 'stepmother', 'stepfather'].includes(p.kind))) };
    expect(evaluateAll(noGuardian, e.conditions)).toBe(false);
    expect(evaluateAll(createLife({}, 3), e.conditions)).toBe(true);
    expect(youth('ya_debt_collector').text).not.toMatch(/\bmom/i);
  });
});

describe('twins: my copy reads as its own scene and never opens within two years of the other', () => {
  const PAIRS: readonly [string, string][] = [
    ['ya_scam_call', 'cp_scam_call'],
    ['ya_blind_date', 'lf_blind_date'],
    ['tm_parent_tech_help', 'ad_parent_tech_support'],
    ['tm_group_chat_drama', 'ya_group_chat_drama'],
    ['ya_group_chat_drama', 'tm_group_chat_drama'],
    ['tn_pop_quiz', 'sl_pop_quiz'],
    ['tn_tryouts', 'sl_sports_tryout'],
    ['ya_group_project', 'sl_group_project_freeloader'],
    ['ya_mentor_offer', 'wk_mentor_offer'],
    ['tn_science_fair', 'sl_science_fair'],
    ['tn_science_fair', 'kd_science_fair'],
    ['tn_friend_moving', 'nc_friend_moving_away'],
    ['ya_car_breakdown', 'mn_car_repair'],
    ['ya_long_distance', 'lf_partner_job_far'],
    ['ya_roommate_food', 'sl_dorm_fridge'],
    // Three "strangers know my face" cards: the bow video, the evening news and the cafeteria fall.
    ['tm_viral_post', 'fs_viral_moment'],
    ['tm_viral_post', 'tn_viral_fall'],
    ['fs_viral_moment', 'tm_viral_post'],
    ['fs_viral_moment', 'tn_viral_fall'],
    // The powder aftermath is not a third pyramid pitch, and does not land beside one.
    ['fs_powder_pitch', 'ad_friend_mlm'],
    ['fs_powder_pitch', 'mn_mlm_pitch'],
  ];
  const words = (s: string) => s.toLowerCase().replace(/\{\{[^}]+\}\}/g, 'x').replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean);
  const runs = (e: EventDef, k = 6) => new Set(allLines(e).flatMap((l) => { const w = words(l); return w.slice(0, Math.max(0, w.length - k + 1)).map((_, i) => w.slice(i, i + k).join(' ')); }));

  it.each(PAIRS)('%s guards against %s and shares no six-word run with it', (mine, other) => {
    expect(BY_ID[other]).toBeDefined();
    const e = youth(mine);
    const guard = (e.conditions ?? []).find((c): c is { not: Condition } => 'not' in c && 'sinceEvent' in c.not && c.not.sinceEvent === other);
    expect(guard).toBeDefined();
    // The guard holds while the other card is two years old or less (or as long as the other card's own guard
    // against this one, so the pair keeps one distance both ways), and lets go after.
    const years = 'sinceEvent' in guard!.not ? (guard!.not.lte ?? 0) : 0;
    expect(years).toBeGreaterThanOrEqual(2);
    const s = createLife({}, 11);
    const fired = (yearsAgo: number): GameState => ({ ...s, character: { ...s.character, age: 25 }, firedEvents: { ...s.firedEvents, [other]: 25 - yearsAgo } });
    expect(evaluateCondition(fired(1), guard!)).toBe(false);
    expect(evaluateCondition(fired(years), guard!)).toBe(false);
    expect(evaluateCondition(fired(years + 1), guard!)).toBe(true);
    expect(evaluateCondition(s, guard!)).toBe(true);
    const shared = [...runs(e)].filter((r) => runs(BY_ID[other]!).has(r));
    expect(shared).toEqual([]);
  });

  it('no youth card shares its title with any other card', () => {
    const norm = (t: string) => t.toLowerCase().replace(/[?.!]+$/, '').trim();
    const clashes = YOUTH.flatMap((e) => EVENTS.filter((o) => o.id !== e.id && norm(o.title) === norm(e.title)).map((o) => `${e.id} = ${o.id}`));
    expect(clashes).toEqual([]);
  });
});

describe('vignettes do not come back', () => {
  it('the mystery skewer happens once, abroad, on a trip I can afford', () => {
    const e = youth('tr_mystery_skewer');
    expect(e.once).toBe(true);
    expect(e.text).toMatch(/abroad/);
    expect((e.conditions ?? []).some((c) => 'money' in c && (c.money.gte ?? 0) > 0)).toBe(true);
  });

  it('a card that spans fifteen years or more opens once or rests ten years or more', () => {
    // Binding someone does not make a scene new: the soup-song video, the raccoon thread at dinner or the ex
    // at the hotel pool read as reruns with any name in them.
    const short = YOUTH.filter((e) => !e.followUpOnly && e.maxAge - e.minAge >= 15 && !e.once && (e.cooldown ?? 2) < 10);
    expect(short.map((e) => `${e.id} cooldown ${e.cooldown ?? 2}`)).toEqual([]);
  });

  it('one-off gags open once', () => {
    for (const id of ['tm_group_chat_drama', 'tm_sibling_video', 'tm_parent_tech_help', 'tr_mystery_skewer']) expect(youth(id).once).toBe(true);
  });

  it('the stranger scenes the playtest saw three to five times are rare now', () => {
    for (const id of ['fs_pigeon_situation', 'fs_viral_moment', 'fs_lookalike', 'fs_wrong_number', 'fs_lost_dog', 'fs_hedge_war']) expect(youth(id).once).toBe(true);
    for (const id of ['fs_street_musician', 'fs_lost_tourist', 'fs_coffee_paid', 'fs_film_crew', 'tr_hopelessly_lost', 'tr_language_mixup']) {
      expect(youth(id).cooldown ?? 0).toBeGreaterThanOrEqual(15);
    }
  });
});

describe('people: no claimed history the selector cannot see', () => {
  it('cards for a cooled friendship do not claim years of silence', () => {
    const cooled = YOUTH.filter((e) => e.person?.maxRelationship !== undefined);
    expect(cooled.map((e) => e.id)).toEqual(expect.arrayContaining(['fs_ghost_returns', 'ya_surprise_reunion']));
    for (const e of cooled) expect(e.text).not.toMatch(/vanished|without a word|years without|long time|lost touch|\bages\b/i);
  });

  it('friend cards do not assume a lifelong friendship (an immigrant makes new friends after the move)', () => {
    const friendCards = YOUTH.filter((e) => e.person?.kind.some((k) => k === 'friend' || k === 'bestFriend'));
    for (const e of friendCards) for (const l of allLines(e)) expect(l).not.toMatch(/since forever|since we were (kids|little|small)|since kindergarten|all my life/i);
  });

  it('a workplace card binds someone I work with, never a friend', () => {
    const work = YOUTH.filter((e) => e.text.includes('{{company}}') && /\{\{person/.test(e.text));
    expect(work.map((e) => e.id)).toContain('tr_work_trip');
    for (const e of work) expect(e.person?.kind).toEqual(['coworker']);
    // The playtest's repro: a friend from school and no coworkers. The trip finds nobody to take.
    const s = createLife({ countryCode: 'GB' }, 777);
    const friend: Person = { ...Object.values(s.people)[0]!, id: 'priya', firstName: 'Priya', kind: 'friend', relationship: 70, metAtAge: 12 };
    const people = Object.fromEntries(Object.entries(s.people).filter(([, p]) => p.kind !== 'coworker'));
    expect(candidatesFor({ ...s, people: { ...people, priya: friend } }, youth('tr_work_trip').person!)).toEqual([]);
  });
});

describe('every choice trades something', () => {
  type Vec = Record<string, number>;
  /** Expected stat changes of a choice, like final/sweep/dominance.py; effects it cannot price are listed apart. */
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
  /**
   * Every set of choices a player can be shown: a conditioned choice may be hidden (an era gate, too little
   * money, nobody to call), and of a trait / notTrait pair exactly one shows.
   */
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
    // Unpriced effects: b's must all come with a too, and a queued follow-up of a's (often a bill) is not a free extra.
    const unpriced = [...b.v[1]].every((x) => a.v[1].has(x)) && [...a.v[1]].filter((x) => x.includes('"queue"')).every((x) => b.v[1].has(x));
    return keys.size > 0 && ge && gt && unpriced;
  };

  it('no choice beats every other choice a player can see beside it, in any era or situation', () => {
    const dominant = new Set<string>();
    for (const e of YOUTH) {
      for (const shown of visibleSets(e.choices)) {
        const priced: Priced[] = shown.map((c) => ({ c, v: vec(c.effects) }));
        for (const a of priced) {
          if (priced.every((b) => b === a || beats(a, b))) dominant.add(`${e.id}/${a.c.id} over ${shown.filter((c) => c !== a.c).map((c) => c.id).join(',')}`);
        }
      }
    }
    expect([...dominant]).toEqual([]);
  });

  it('the dominance check sees a choice that wins only once an era gate hides its rival', () => {
    const card: ChoiceDef[] = [
      { id: 'bring', label: 'Bring them', effects: [{ stat: 'happiness', delta: 2 }, { log: 'x' }] },
      { id: 'wait', label: 'Wait', effects: [{ stat: 'happiness', delta: 1 }, { log: 'x' }] },
      { id: 'call', label: 'Video call', conditions: [{ year: { gte: 2010 } }], effects: [{ stat: 'smarts', delta: 3 }, { log: 'x' }] },
    ];
    const sets = visibleSets(card).map((s) => s.map((c) => c.id).join(','));
    expect(sets).toEqual(['bring,wait', 'bring,wait,call']);
    const [early] = visibleSets(card).map((s) => s.map((c) => ({ c, v: vec(c.effects) })));
    expect(beats(early![0]!, early![1]!)).toBe(true);
  });
});
