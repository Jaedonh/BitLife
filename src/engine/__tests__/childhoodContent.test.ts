import { BABY_AND_TODDLER_EVENTS } from '@/data/events/baby_and_toddler';
import { CHILDHOOD_EVENTS } from '@/data/events/childhood';
import { EARLY_CHILDHOOD_EVENTS } from '@/data/events/early_childhood';
import { KID_LIFE_EVENTS } from '@/data/events/kid_life';
import { KID_YEARS_EVENTS } from '@/data/events/kid_years';
import { SCHOOL_LIFE_EVENTS } from '@/data/events/school_life';
import { TEEN_YEARS_EVENTS } from '@/data/events/teen_years';
import { EVENT_REGISTRY } from '../events/registry';
import type { Condition, Effect, EventDef } from '../events/schema';
import { beginLife, isEligible } from '../events/select';
import { createLife } from '../systems/character';
import type { GameState } from '../types';

/** The childhood files: baby and toddler cards through primary and middle school. */
const EVENTS: readonly EventDef[] = [...BABY_AND_TODDLER_EVENTS, ...EARLY_CHILDHOOD_EVENTS, ...CHILDHOOD_EVENTS, ...KID_LIFE_EVENTS, ...KID_YEARS_EVENTS, ...SCHOOL_LIFE_EVENTS];
const byId = (id: string) => [...EVENTS, ...TEEN_YEARS_EVENTS].find((e) => e.id === id)!;

function logs(effects: readonly Effect[]): string[] {
  return effects.flatMap((e) => [
    ...('log' in e ? [e.log] : []),
    ...('chance' in e ? [...logs(e.then), ...logs(e.else ?? [])] : []),
    ...('random' in e ? e.random.flatMap((r) => logs(r.effects)) : []),
  ]);
}

/** Every player-facing string of an event, with the conditions that hold whenever it can be shown. */
function strings(e: EventDef): { text: string; conditions: readonly Condition[] }[] {
  const base = e.conditions ?? [];
  return [
    { text: e.title, conditions: base },
    { text: e.text, conditions: base },
    ...e.choices.flatMap((c) => [c.label, c.hint ?? '', ...logs(c.effects)].filter(Boolean).map((text) => ({ text, conditions: [...base, ...(c.conditions ?? [])] }))),
  ];
}

/** Players are born 1975-2010, so a card for age A can open in 1975 + A at the earliest, unless a year condition says later. */
function earliestYear(e: EventDef, conditions: readonly Condition[]): number {
  const gates = conditions.flatMap((c) => ('year' in c ? [c.year.gte ?? c.year.gt ?? -Infinity] : []));
  return Math.max(1975 + e.minAge, ...gates);
}

function climates(conditions: readonly Condition[]): string[] | undefined {
  return conditions.find((c): c is { climate: ('snowy' | 'mild' | 'hot')[] } => 'climate' in c)?.climate;
}

describe('childhood cards fit the family, the weather and the era', () => {
  it('never name a grandmother or grandfather the card has not bound', () => {
    const problems: string[] = [];
    for (const e of EVENTS) {
      for (const { text } of strings(e)) {
        for (const [re, gender] of [[/\bGrand(ma|mother)\b|\{\{grandma\}\}/i, 'female'], [/\bGrand(pa|father)\b|\{\{grandpa\}\}/i, 'male']] as const) {
          const bound = e.person?.kind.every((k) => k === 'grandparent') && e.person.gender === gender;
          if (re.test(text) && !bound) problems.push(`${e.id}: ${text}`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it('the newborn card only quotes a grandparent who is alive', () => {
    let quoted = 0;
    for (let seed = 1; seed <= 3000; seed++) {
      const s = beginLife(createLife(seed % 3 === 0 ? { scenario: 'single_parent' } : {}, seed), EVENT_REGISTRY);
      const named = s.pendingEvent?.text.match(/\bGrand(ma|pa) ([^\s',.]+)/);
      if (/\bGrand(ma|pa)\b/.test(s.pendingEvent?.text ?? '')) {
        quoted++;
        const alive = Object.values(s.people).some((p) => p.kind === 'grandparent' && p.alive && p.firstName === named?.[2] && (p.gender === 'female') === (named?.[1] === 'ma'));
        expect([seed, s.pendingEvent!.text, alive]).toEqual([seed, s.pendingEvent!.text, true]);
      }
    }
    expect(quoted).toBeGreaterThan(20);
  });

  it('snow needs a snowy country, coats and knitwear a cold one, and a reindeer a northern December', () => {
    const problems: string[] = [];
    for (const e of EVENTS) {
      for (const { text, conditions } of strings(e)) {
        const climate = climates(conditions);
        if (/\b(snow\w*|sleet|blizzard|sled\w*|icicles?)\b/i.test(text) && !(climate && climate.every((c) => c === 'snowy'))) problems.push(`${e.id} (snow): ${text}`);
        if (/\b(winter|coats?|mittens|knitted|sweaters?|reindeer)\b/i.test(text) && !(climate && climate.every((c) => c !== 'hot'))) problems.push(`${e.id} (cold): ${text}`);
        if (/\b(december|christmas|reindeer)\b/i.test(text) && !conditions.some((c) => 'southern' in c && c.southern === false)) problems.push(`${e.id} (December): ${text}`);
      }
    }
    expect(problems).toEqual([]);
    const snow = byId('ch_snow_day');
    const kid = (countryCode: string): GameState => {
      const s = createLife({ countryCode }, 7);
      const sibling = { ...Object.values(s.people)[0]!, id: 'sib', kind: 'sibling' as const, age: 9, alive: true };
      return { ...s, character: { ...s.character, age: 6 }, people: { ...s.people, sib: sibling } };
    };
    expect(isEligible(kid('CA'), snow)).toBe(true);
    expect(isEligible(kid('NG'), snow)).toBe(false);
  });

  it('phones, tablets, apps, video calls, texting and the internet only once they exist', () => {
    const ERA: readonly [RegExp, number][] = [
      [/\b(smartphones?|tablets?|apps?|video call|group chat|screen time|selfies?|stream(s|ed|ing|ers?)?|gems|phones? came out|on (their|my) phone|holding up a phone|'s phone|mid-recording)\b/i, 2010],
      [/\b(vapes?|vaping)\b/i, 2013],
      [/\b(text(ed|ing)|text messages?|group texts?)\b/i, 2000],
      [/\b(online|internet|e-?mail(ed)?|websites?|wi-?fi|game's chat|chat window)\b/i, 1997],
    ];
    const problems: string[] = [];
    for (const e of EVENTS) {
      for (const { text, conditions } of strings(e)) {
        for (const [re, from] of ERA) if (re.test(text) && earliestYear(e, conditions) < from) problems.push(`${e.id} (from ${from}, can open in ${earliestYear(e, conditions)}): ${text}`);
      }
    }
    expect(problems).toEqual([]);
  });
});

describe('twin scenes in different files', () => {
  /** Word sequences of this length that two texts share. */
  function shared(a: string, b: string, n = 4): string[] {
    const grams = (t: string) => {
      const w = t.toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean);
      return new Set(w.slice(0, Math.max(0, w.length - n + 1)).map((_, i) => w.slice(i, i + n).join(' ')));
    };
    const gb = grams(b);
    return [...grams(a)].filter((g) => gb.has(g));
  }
  const TWINS: readonly [string, string][] = [['sl_pop_quiz', 'tn_pop_quiz'], ['sl_sports_tryout', 'tn_tryouts'], ['kd_science_fair', 'sl_science_fair'], ['sl_science_fair', 'tn_science_fair']];
  /** Cards elsewhere that told a scene of mine with the same title or the same lines. */
  const NEIGHBORS: readonly [string, string][] = [
    ['bt_first_night_home', 'pt_first_night_home'],
    ['first_steps', 'gc_first_steps'],
    ['kl_first_flight', 'bt_first_flight'],
    ['sl_show_and_tell', 'bt_show_and_tell'],
    ['kd_bully_crying', 'tn_vape_offer'],
    ['kd_report_card', 'tn_report_card'],
    ['sl_hallway_fight', 'jd_hallway'],
    ['kl_conference_night', 'ad_parent_teacher_night'],
    ['kd_found_wallet', 'mn_lucky_find'],
  ];
  const all = (e: EventDef) => strings(e).map((x) => x.text).join(' / ');

  it('read as different scenes, with different titles, setups and lines', () => {
    for (const [a, b] of [...TWINS, ...NEIGHBORS]) {
      const [x, y] = [EVENT_REGISTRY.byId[a]!, EVENT_REGISTRY.byId[b]!];
      expect([a, b, x.title.toLowerCase() === y.title.toLowerCase()]).toEqual([a, b, false]);
      expect([a, b, shared(x.text, y.text)]).toEqual([a, b, []]);
      expect([a, b, shared(all(x), all(y), 6)]).toEqual([a, b, []]);
    }
  });

  it('the childhood card of a pair never opens within two years of the other one', () => {
    const teen = (age: number, fired: Record<string, number>): GameState => {
      const s = createLife({ countryCode: 'US' }, 11);
      return { ...s, character: { ...s.character, age, stats: { ...s.character.stats, smarts: 70 } }, education: { ...s.education, stage: age >= 14 ? 'high' : 'middle', enrolled: true }, firedEvents: fired, flags: {} };
    };
    for (const [mine, other] of TWINS) {
      const card = byId(mine);
      if (!EVENTS.includes(card)) continue;
      const age = Math.min(card.maxAge, 13);
      expect([mine, isEligible(teen(age, {}), card)]).toEqual([mine, true]);
      for (const ago of [0, 1, 2]) expect([mine, other, ago, isEligible(teen(age, { [other]: age - ago }), card)]).toEqual([mine, other, ago, false]);
      expect([mine, other, isEligible(teen(age, { [other]: age - 4 }), card)]).toEqual([mine, other, true]);
    }
    // Nor once the teen tryouts put me on the team.
    expect(isEligible({ ...teen(14, {}), flags: { tn_team: true } }, byId('sl_sports_tryout'))).toBe(false);
  });
});

describe('every option trades something (docs/CONTENT_STYLE.md)', () => {
  /** Expected stat deltas of a choice, as the playtest's dominance sweep measured them. */
  function expected(effects: readonly Effect[], p = 1, acc: Record<string, number> = {}, other = new Set<string>()) {
    const add = (k: string, v: number) => (acc[k] = (acc[k] ?? 0) + p * v);
    for (const e of effects) {
      if ('stat' in e && 'delta' in e) add(e.stat, e.delta);
      else if ('money' in e) add('money', e.money);
      else if ('karma' in e) add('karma', e.karma);
      else if ('fame' in e) add('fame', e.fame);
      else if ('relationship' in e) add(`rel:${e.relationship}`, e.delta);
      else if ('grade' in e) add('grade', e.grade);
      else if ('injury' in e) add('health', -e.injury);
      else if ('illness' in e) add('health', -5);
      else if ('chance' in e) {
        expected(e.then, p * e.chance, acc, other);
        expected(e.else ?? [], p * (1 - e.chance), acc, other);
      } else if ('random' in e) {
        const total = e.random.reduce((n, r) => n + r.weight, 0);
        for (const r of e.random) expected(r.effects, (p * r.weight) / total, acc, other);
      } else if (!('log' in e) && !('counter' in e)) other.add(JSON.stringify(e));
    }
    return { acc, other };
  }
  /** Telling a grown-up about an allergic reaction or appendicitis is the point of those cards, as refusing a temptation is. */
  const INTENDED = new Set(['kl_party_allergy', 'kl_appendicitis']);

  it('no choice beats every other choice of its card on every stat', () => {
    const problems: string[] = [];
    for (const e of EVENTS.filter((x) => !INTENDED.has(x.id) && x.choices.length > 1)) {
      const cs = e.choices.map((c) => ({ c, ...expected(c.effects) }));
      for (const a of cs) {
        const beatsAll = cs.every((b) => {
          if (a === b) return true;
          const keys = [...new Set([...Object.keys(a.acc), ...Object.keys(b.acc)])];
          const ge = keys.every((k) => (a.acc[k] ?? 0) >= (b.acc[k] ?? 0) - 1e-9);
          const gt = keys.some((k) => (a.acc[k] ?? 0) > (b.acc[k] ?? 0) + 1e-9);
          return ge && gt && [...b.other].every((x) => a.other.has(x));
        });
        if (beatsAll) problems.push(`${e.id}: '${a.c.label}' beats every other option`);
      }
    }
    expect(problems).toEqual([]);
  });
});
