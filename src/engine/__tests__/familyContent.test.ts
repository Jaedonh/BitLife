/**
 * Family and later-life content agrees with the state it opens in (love_and_family, grown_up_life, golden_years,
 * later_life, adult_life, holidays_and_traditions, pet_events, grandparents, grandchildren): the people a card talks
 * about exist, the timing and the home fit, the pet is the right animal, and no choice beats every other one.
 */
import { EVENTS } from '@/data/events';
import { candidatesFor } from '../events/conditions';
import type { Effect, EventDef } from '../events/schema';
import { validateEvent } from '../events/schema';
import { isEligible } from '../events/select';
import { Rng } from '../rng';
import { createLife, emptyMemory, makePerson } from '../systems/character';
import type { Asset, GameState, Person, RelationshipKind } from '../types';

const EVENT = (id: string): EventDef => {
  const def = EVENTS.find((e) => e.id === id);
  if (!def) throw new Error(`no event ${id}`);
  return def;
};
const MINE = /^(lf|gu|gy|ll|ad|hd|pt|gp|gc)_/;

/** A player of `age` in `countryCode` with only the people given. */
function life(age: number, people: Person[] = [], opts: { countryCode?: string; patch?: Partial<GameState> } = {}): GameState {
  const s = createLife({ countryCode: opts.countryCode ?? 'US', gender: 'female', firstName: 'Nora' }, 31);
  return {
    ...s,
    people: Object.fromEntries(people.map((p) => [p.id, p])),
    year: 2040,
    character: { ...s.character, age },
    finances: { ...s.finances, cash: 50_000 },
    eventQueue: [],
    firedEvents: {},
    ...opts.patch,
  };
}

let ids = 0;
function person(kind: RelationshipKind, patch: Partial<Person> = {}): Person {
  const p = makePerson(new Rng(++ids), { kind, age: 40, countryCode: 'US', playerAge: 30, gender: patch.gender ?? 'female' });
  return { ...p, id: `${kind}_${ids}`, memory: emptyMemory(30), ...patch };
}

const asset = (defId: string, kind: Asset['kind']): Asset => ({ id: `a_${defId}`, defId, kind, name: defId, value: 300_000, purchasePrice: 300_000, condition: 90, yearlyUpkeep: 0, mortgage: null, boughtAtAge: 30, primary: kind === 'house' });
const house = (defId: string) => asset(defId, 'house');
const sedan = () => asset('sedan', 'car');
const bound = (s: GameState, id: string) => candidatesFor(s, EVENT(id).person!);

describe('late-life cards only talk about grandchildren who exist', () => {
  const GRANDKID_CARDS = ['gy_great_grandchild', 'gy_living_history', 'gy_grandkid_driving', 'gy_record_grandkid_questions', 'gy_grandkid_scam_call'];

  it('none opens for a 75-year-old whose only child has no children', () => {
    const child = person('child', { age: 51, growth: { movedOut: true } });
    const s = life(75, [child], { patch: { assets: [sedan()], crime: { ...life(75).crime, record: true } } });
    for (const id of GRANDKID_CARDS) expect([id, isEligible(s, EVENT(id))]).toEqual([id, false]);
  });

  it('each binds a real grandchild of a fitting age, or a child who has one', () => {
    const child = person('child', { age: 51, growth: { movedOut: true, kids: 1 } });
    const teen = person('grandchild', { age: 17, viaId: child.id });
    const young = person('grandchild', { age: 15, viaId: child.id });
    const grown = person('grandchild', { age: 24, viaId: child.id });
    const s = life(78, [child, teen, young, grown]);
    expect(bound(s, 'gy_grandkid_driving').map((p) => p.id)).toEqual([teen.id]);
    expect(bound(s, 'gy_great_grandchild').map((p) => p.id)).toEqual([grown.id]);
    expect(bound(s, 'gy_grandkid_scam_call').map((p) => p.id)).toEqual([child.id]);
    for (const id of ['gy_great_grandchild', 'gy_living_history', 'gy_grandkid_driving', 'gy_record_grandkid_questions']) expect(EVENT(id).person!.kind).toEqual(['grandchild']);
  });
});

describe("the late parent's house", () => {
  const def = EVENT('lf_sibling_inheritance');
  const sib = () => person('sibling', { age: 52, biological: true });

  it('needs every parent gone, and at least one of them dead', () => {
    expect(isEligible(life(50, [person('mother', { age: 78 }), sib()]), def)).toBe(false);
    // A child who never knew a father, with Mom alive: the old any-parent-missing check let this through.
    expect(isEligible(life(50, [person('mother', { age: 78 }), sib()], { patch: { flags: { 'scenario:single_parent': true } } }), def)).toBe(false);
    expect(isEligible(life(50, [person('mother', { age: 81, alive: false, deathAge: 81 }), sib()]), def)).toBe(true);
  });

  it('never opens for an orphan and a foster sibling', () => {
    const foster = person('sibling', { age: 30, biological: false, foster: true });
    expect(isEligible(life(30, [foster], { patch: { flags: { foster_care: true } } }), def)).toBe(false);
  });

  it('pays nothing from an estate the engine already settled (only small furniture sales)', () => {
    const paid = def.choices.flatMap((c) => c.effects).filter((e): e is Extract<Effect, { money: number }> => 'money' in e);
    for (const e of paid) expect(e.money).toBeLessThanOrEqual(1000);
  });
});

describe('cards whose text has to match the family', () => {
  it("the surprise party does not say I suspected nothing and then let me admit I knew", () => {
    const def = EVENT('hd_surprise_party');
    expect(def.text).not.toMatch(/suspected nothing/);
  });

  it("Mom's new husband is not a dentist, and she is not marrying 'again' on a mother with no marriage", () => {
    expect(EVENT('lf_mother_remarries').text).not.toMatch(/again|dentist/);
  });

  it("a parent's remarriage names that parent by the bound person or {{father}}, never a hard-coded Mom or Dad", () => {
    // In a family with two fathers or two mothers the one who remarries may be Papa or Mama.
    for (const id of ['lf_mother_remarries', 'lf_father_remarries']) expect(JSON.stringify(EVENT(id))).not.toMatch(/\b(Mom|Dad)\b/);
  });

  it('a child comes out only before marrying', () => {
    const def = EVENT('lf_child_comes_out');
    const married = person('child', { age: 30, growth: { movedOut: true, spouse: { firstName: 'Rory', gender: 'male' } } });
    const single = person('child', { age: 30, growth: { movedOut: true } });
    expect(isEligible(life(55, [married]), def)).toBe(false);
    expect(bound(life(55, [married, single]), 'lf_child_comes_out').map((p) => p.id)).toEqual([single.id]);
  });

  it('a partner moving away for work never claims a new city the engine does not have', () => {
    expect(JSON.stringify(EVENT('lf_partner_job_far'))).not.toMatch(/new city|moved together/i);
  });
});

describe('widowhood cards grieve the one marriage', () => {
  const WIDOW_CARDS = EVENTS.filter((e) => /^(gu_widowed_|gy_widow_)/.test(e.id));

  it('none opens after a remarriage and a second widowhood (two late spouses)', () => {
    const first = person('spouse', { age: 45, alive: false, deathAge: 45, marriedAtAge: 25, gender: 'male' });
    const second = person('spouse', { age: 78, alive: false, deathAge: 78, marriedAtAge: 71, gender: 'male' });
    const job = { defId: 'accountant', title: 'Accountant', company: 'Granite & Sons', salary: 60_000, level: 1, performance: 70, yearsHeld: 4, yearsAtLevel: 2, category: 'finance' as const, partTime: false, askedThisYear: false, workedHarderThisYear: false };
    for (const age of [62, 80]) {
      const s = life(age, [first, second], { patch: { counters: { ...life(age).counters, marriages: 2 }, career: { ...life(age).career, job } } });
      for (const def of WIDOW_CARDS) expect([def.id, age, isEligible(s, def)]).toEqual([def.id, age, false]);
    }
  });

  it('none opens while I have a new partner', () => {
    const late = person('spouse', { age: 61, alive: false, deathAge: 61, marriedAtAge: 30, gender: 'male' });
    const s = life(64, [late, person('lover', { age: 63, gender: 'male' })], { patch: { counters: { ...life(64).counters, marriages: 1 } } });
    for (const def of WIDOW_CARDS) expect([def.id, isEligible(s, def)]).toEqual([def.id, false]);
  });

  it('a first-marriage widow still gets them, bound to that spouse', () => {
    const late = person('spouse', { age: 61, alive: false, deathAge: 61, marriedAtAge: 30, gender: 'male' });
    const s = life(64, [late], { patch: { counters: { ...life(64).counters, marriages: 1 } } });
    expect(isEligible(s, EVENT('gy_widow_two_cups'))).toBe(true);
    expect(bound(s, 'gy_widow_two_cups').map((p) => p.id)).toEqual([late.id]);
  });
});

describe('timing', () => {
  const retired = (age: number, toAge: number, job: GameState['career']['job'] = null): GameState => {
    const base = life(age);
    const entry = { title: 'Accountant', company: 'Granite & Sons', fromAge: 30, toAge, salary: 90_000, reason: 'retired' as const };
    return { ...base, career: { ...base.career, retired: true, job, history: [entry] } };
  };

  it('the retirement party opens the year after retiring, never years later or back at work', () => {
    const def = EVENT('ll_retirement_party');
    expect(isEligible(retired(64, 63), def)).toBe(true);
    expect(isEligible(retired(66, 63), def)).toBe(false);
    const janitor = { defId: 'janitor', title: 'Janitor', company: 'Vertex Group', salary: 30_000, level: 0, performance: 60, yearsHeld: 1, yearsAtLevel: 1, category: 'service' as const, partTime: false, askedThisYear: false, workedHarderThisYear: false };
    expect(isEligible(retired(64, 63, janitor), def)).toBe(false);
  });

  it('nobody remembers my birthday only when nobody lives with me', () => {
    const def = EVENT('hd_forgotten_birthday');
    expect(isEligible(life(49, [person('spouse', { age: 50 })]), def)).toBe(false);
    expect(isEligible(life(49, [person('child', { age: 10 })]), def)).toBe(false);
    expect(isEligible(life(49, [person('friend', { age: 50 })]), def)).toBe(true);
  });

  it("a grown child's new partner is never brought home after the wedding", () => {
    const married = person('child', { age: 30, growth: { movedOut: true, spouse: { firstName: 'Alfie', gender: 'male' } } });
    expect(isEligible(life(60, [married]), EVENT('gu_child_brings_partner'))).toBe(false);
  });
});

describe('home', () => {
  it('a landlord and my own holiday dinner wait until I have left my family home', () => {
    const pet = person('pet', { species: 'cat', age: 3 });
    // 18 and earning nothing: still living with my family (finance.ts, livesAtHome).
    const atHome = life(18, [pet, person('mother', { age: 45 })], { patch: { finances: { ...life(18).finances, cash: 50_000 } } });
    expect(isEligible(atHome, EVENT('pt_landlord'))).toBe(false);
    const grown = life(30, [pet]);
    expect(isEligible(grown, EVENT('pt_landlord'))).toBe(true);
    expect(EVENT('hd_host_dinner').conditions).toContainEqual({ atHome: false });
  });
});

describe('home size', () => {
  it('rooms to spare and a table for fourteen need a big home', () => {
    const child = person('child', { age: 40, growth: { movedOut: true } });
    for (const id of ['ll_downsizing', 'gy_holiday_elder']) {
      expect([id, isEligible(life(70, [child], { patch: { assets: [house('studio')] } }), EVENT(id))]).toEqual([id, false]);
      expect([id, isEligible(life(70, [child], { patch: { assets: [house('suburban')] } }), EVENT(id))]).toEqual([id, true]);
    }
  });

  it('no choice claims a move the assets never show, or a spare room in any home', () => {
    expect(JSON.stringify(EVENT('ll_downsizing').choices)).not.toMatch(/I moved:|Move somewhere smaller|Move closer/);
    // ad_parent_care opens whatever the home, so its move-in has no spare room in it.
    expect(JSON.stringify(EVENT('ad_parent_care').choices)).not.toMatch(/spare room/);
  });
});

describe('climate', () => {
  it('sleet and winter heating only where winters are cold', () => {
    expect(isEligible(life(30, [], { countryCode: 'NG', patch: { assets: [sedan()] } }), EVENT('hd_storm_travel'))).toBe(false);
    expect(isEligible(life(30, [], { countryCode: 'GB', patch: { assets: [sedan()] } }), EVENT('hd_storm_travel'))).toBe(true);
    const gp = person('grandparent', { age: 80 });
    expect(isEligible(life(30, [gp], { countryCode: 'BR' }), EVENT('gp_two_coats'))).toBe(false);
  });

  it('sleet on the way home for the year-end holidays never happens south of the equator', () => {
    expect(isEligible(life(30, [], { countryCode: 'AU', patch: { assets: [sedan()] } }), EVENT('hd_storm_travel'))).toBe(false);
  });

  it('no card in these files mentions winter, coats or heating unless it requires a cold climate', () => {
    const COLD = /\b(winter|wintry|snow\w*|sleet|icy|mittens?|heating|coats?)\b/i;
    // Painting, hangers and racks are not about the weather.
    const NOT_WEATHER = /coats? of paint|three coats|coat hanger|coat rack/gi;
    const strings = (def: EventDef): string[] => {
      const out = [def.title, def.text];
      const walk = (es: readonly Effect[]) => {
        for (const e of es) {
          if ('log' in e) out.push(e.log);
          if ('newPerson' in e && e.newPerson.log) out.push(e.newPerson.log);
          if ('chance' in e) { walk(e.then); walk(e.else ?? []); }
          if ('random' in e) for (const o of e.random) walk(o.effects);
        }
      };
      for (const c of def.choices) { out.push(c.label); walk(c.effects); }
      return out;
    };
    const coldOnly = (def: EventDef) => (def.conditions ?? []).some((c) => 'climate' in c && !c.climate.includes('hot'));
    const found = EVENTS.filter((e) => MINE.test(e.id) && !coldOnly(e)).flatMap((e) => strings(e).filter((t) => COLD.test(t.replace(NOT_WEATHER, ''))).map((t) => `${e.id}: ${t}`));
    expect(found).toEqual([]);
  });

  it('family holidays say nothing about winter coats', () => {
    for (const id of ['hd_winter_gathering', 'hd_school_concert', 'hd_charity_drive']) expect(EVENT(id).text).not.toMatch(/winter|coats/);
  });
});

describe('pets', () => {
  const pet = (species: string, patch: Partial<Person> = {}) => person('pet', { species, age: 4, ...patch });

  it('a person selector can ask for a species, and only pet selectors may', () => {
    const s = life(30, [pet('pigeon'), pet('dog')]);
    expect(candidatesFor(s, { kind: ['pet'], species: ['dog'] }).map((p) => p.species)).toEqual(['dog']);
    const bad: EventDef = { ...EVENT('pt_park_regulars'), id: 'pt_bad', person: { kind: ['friend'], species: ['dog'] } };
    expect(validateEvent(bad, new Set())).toContainEqual(expect.stringContaining('species'));
  });

  it('nobody walks a pigeon in the park, and birds bring no fur allergy', () => {
    const s = life(30, [pet('pigeon', { age: 12 }), pet('parrot', { age: 12 })]);
    for (const id of ['pt_park_regulars', 'pt_allergy', 'pt_bring_to_work', 'pt_furniture', 'pt_bed_dispute', 'pt_getting_old', 'pt_ate_something', 'pt_ran_away']) expect([id, bound(s, id)]).toEqual([id, []]);
    expect(isEligible(life(30, [pet('dog')]), EVENT('pt_park_regulars'))).toBe(true);
    expect(bound(life(30, [pet('parrot', { age: 12 })]), 'pt_noise_complaint')).toHaveLength(1);
  });

  it("an old pet's things do not still smell of a pet that died decades ago", () => {
    const def = EVENT('pt_old_toy');
    expect(def.text).not.toMatch(/smell/);
    expect(def.person).toMatchObject({ kind: ['pet'], alive: false, species: ['dog', 'cat'] });
  });
});

describe('twins and repeats', () => {
  const lines = (def: EventDef): string[] => {
    const out: string[] = [];
    const walk = (es: readonly Effect[]) => {
      for (const e of es) {
        if ('log' in e) out.push(e.log);
        if ('chance' in e) { walk(e.then); walk(e.else ?? []); }
        if ('random' in e) for (const o of e.random) walk(o.effects);
      }
    };
    for (const c of def.choices) walk(c.effects);
    return out;
  };

  it('no title in these files is shared with another event', () => {
    const titles = new Map<string, string[]>();
    for (const e of EVENTS) titles.set(e.title.toLowerCase(), [...(titles.get(e.title.toLowerCase()) ?? []), e.id]);
    const shared = [...titles.values()].filter((idsOf) => idsOf.length > 1 && idsOf.some((id) => MINE.test(id)));
    expect(shared).toEqual([]);
  });

  it('the coworker, blind-date and MLM cards share no scene with their twins elsewhere', () => {
    for (const [mine, theirs] of [['lf_coworker_asks_out', 'wk_workplace_flirt'], ['lf_blind_date', 'ya_blind_date'], ['ad_friend_mlm', 'mn_mlm_pitch'], ['ad_parent_tech_support', 'tm_parent_tech_help']] as const) {
      const other = new Set(lines(EVENT(theirs)));
      expect(lines(EVENT(mine)).filter((l) => other.has(l))).toEqual([]);
      expect(EVENT(mine).text).not.toMatch(/starter kit|second one never happened|ninety minutes|printer/);
    }
    // The two setups by a friend never open within a few years of each other.
    expect(EVENT('lf_blind_date').conditions).toContainEqual({ not: { sinceEvent: 'ya_blind_date', lte: 4 } });
  });

  it("a parent's health scare and a fall at home, which both offer to move the parent in, keep years apart", () => {
    const mom = person('mother', { age: 70 });
    const at = (fired: Record<string, number>) => ({ ...life(45, [mom]), firedEvents: fired });
    for (const [id, other] of [['lf_parent_health_scare', 'ad_parent_care'], ['ad_parent_care', 'lf_parent_health_scare']] as const) {
      expect([id, isEligible(at({}), EVENT(id))]).toEqual([id, true]);
      expect([id, isEligible(at({ [other]: 41 }), EVENT(id))]).toEqual([id, false]);
      expect([id, isEligible(at({ [other]: 39 }), EVENT(id))]).toEqual([id, true]);
    }
  });

  it('the yearly holiday vignettes wait years before coming back', () => {
    for (const id of ['hd_winter_gathering', 'hd_resolution', 'hd_terrible_gift', 'hd_gift_budget', 'hd_birthday_plans', 'hd_midnight_countdown', 'hd_charity_drive', 'hd_costume_party', 'hd_roast_disaster', 'll_scam_call']) {
      expect([id, (EVENT(id).cooldown ?? 2) >= 6]).toEqual([id, true]);
    }
  });
});

describe('no strictly dominant choice', () => {
  /** Stat, money, karma, relationship and energy totals of a choice with no chance, random or other effects; null otherwise. */
  function vector(effects: readonly Effect[]): Record<string, number> | null {
    const v: Record<string, number> = {};
    const add = (k: string, n: number) => (v[k] = (v[k] ?? 0) + n);
    for (const e of effects) {
      if ('log' in e || 'counter' in e) continue;
      if ('stat' in e) add(e.stat, e.delta);
      else if ('stats' in e) for (const [k, n] of Object.entries(e.stats)) add(k, n ?? 0);
      else if ('money' in e) add('money', e.money);
      else if ('karma' in e) add('karma', e.karma);
      else if ('fame' in e) add('fame', e.fame);
      else if ('relationship' in e) add(`rel:${e.relationship}`, e.delta);
      else if ('love' in e) add('love', e.love);
      else if ('energy' in e) add('energy', e.energy);
      else if ('jobPerformance' in e) add('perf', e.jobPerformance);
      else if ('grade' in e) add('grade', e.grade);
      else return null;
    }
    return v;
  }

  it('in these files, no sure-thing choice is at least as good as another on every count and better on one', () => {
    const found: string[] = [];
    for (const def of EVENTS.filter((e) => MINE.test(e.id))) {
      const vs = def.choices.map((c) => ({ id: c.id, v: vector(c.effects) }));
      for (const a of vs) for (const b of vs) {
        if (a === b || !a.v || !b.v) continue;
        const keys = new Set([...Object.keys(a.v), ...Object.keys(b.v)]);
        const ge = [...keys].every((k) => (a.v![k] ?? 0) >= (b.v![k] ?? 0));
        const gt = [...keys].some((k) => (a.v![k] ?? 0) > (b.v![k] ?? 0));
        if (keys.size && ge && gt) found.push(`${def.id}: ${a.id} > ${b.id}`);
      }
    }
    expect(found).toEqual([]);
  });
});
