/**
 * Family, later-life, holiday and early-childhood content (the second playtest round): the home a card talks about
 * is the one I live in, a just-retired or newly widowed card opens while that is still true, a death fits the age,
 * one toast is not a habit, a warm card binds someone still on good terms with me, nobody with dementia is told
 * their forgetting is normal, juries sit where there are juries, no silence is claimed that the selector cannot see,
 * a discovery happens once, no line assumes parents, grandparents or several children I may not have, no first name
 * is hard-coded beside a bound child, winter stays where winters are cold, the wording is American and no choice
 * beats every other one.
 */
import { FLAVOR } from '@/data/flavor';
import { NAMES } from '@/data/names';
import { ADULT_LIFE_EVENTS } from '@/data/events/adult_life';
import { BABY_AND_TODDLER_EVENTS } from '@/data/events/baby_and_toddler';
import { CHILDHOOD_EVENTS } from '@/data/events/childhood';
import { EARLY_CHILDHOOD_EVENTS } from '@/data/events/early_childhood';
import { GOLDEN_YEARS_EVENTS } from '@/data/events/golden_years';
import { GRANDCHILDREN_EVENTS } from '@/data/events/grandchildren';
import { GRANDPARENTS_EVENTS } from '@/data/events/grandparents';
import { GROWN_UP_LIFE_EVENTS } from '@/data/events/grown_up_life';
import { HOLIDAYS_AND_TRADITIONS_EVENTS } from '@/data/events/holidays_and_traditions';
import { LATER_LIFE_EVENTS } from '@/data/events/later_life';
import { LOVE_AND_FAMILY_EVENTS } from '@/data/events/love_and_family';
import { applyAction } from '../actions';
import { candidatesFor } from '../events/conditions';
import { EVENT_REGISTRY } from '../events/registry';
import type { ChoiceDef, Condition, Effect, EventDef } from '../events/schema';
import { isEligible, openNextEvent, resolveChoice } from '../events/select';
import { Rng } from '../rng';
import { createLife, emptyMemory, makePerson } from '../systems/character';
import { flavorFits } from '../systems/flavor';
import type { Asset, GameState, Job, Person, RelationshipKind } from '../types';

/** The files this suite covers. */
const MINE: readonly EventDef[] = [
  ...LATER_LIFE_EVENTS,
  ...GOLDEN_YEARS_EVENTS,
  ...GROWN_UP_LIFE_EVENTS,
  ...ADULT_LIFE_EVENTS,
  ...LOVE_AND_FAMILY_EVENTS,
  ...GRANDPARENTS_EVENTS,
  ...GRANDCHILDREN_EVENTS,
  ...HOLIDAYS_AND_TRADITIONS_EVENTS,
  ...EARLY_CHILDHOOD_EVENTS,
  ...BABY_AND_TODDLER_EVENTS,
  ...CHILDHOOD_EVENTS,
];
const EVENT = (id: string): EventDef => {
  const def = MINE.find((e) => e.id === id);
  if (!def) throw new Error(`no event ${id} in these files`);
  return def;
};

/** A player of `age` in `countryCode` with only the people given. */
function life(age: number, people: Person[] = [], opts: { countryCode?: string; patch?: Partial<GameState> } = {}): GameState {
  const s = createLife({ countryCode: opts.countryCode ?? 'US', gender: 'female', firstName: 'Nora' }, 31);
  return { ...s, people: Object.fromEntries(people.map((p) => [p.id, p])), year: 2030, character: { ...s.character, age }, finances: { ...s.finances, cash: 50_000 }, eventQueue: [], firedEvents: {}, ...opts.patch };
}
let ids = 0;
function person(kind: RelationshipKind, patch: Partial<Person> = {}): Person {
  const p = makePerson(new Rng(++ids), { kind, age: 40, countryCode: 'US', playerAge: 30, gender: patch.gender ?? 'female' });
  return { ...p, id: `${kind}_${ids}`, memory: emptyMemory(30), ...patch };
}
const house = (defId: string, patch: Partial<Asset> = {}): Asset => ({ id: `a_${defId}`, defId, kind: 'house', name: defId, value: 300_000, purchasePrice: 300_000, condition: 90, yearlyUpkeep: 0, mortgage: null, boughtAtAge: 30, ...patch });
const JOB: Job = { defId: 'accountant', title: 'Accountant', company: 'Granite & Sons', salary: 60_000, level: 1, performance: 70, yearsHeld: 4, yearsAtLevel: 2, category: 'finance', partTime: false, askedThisYear: false, workedHarderThisYear: false };
const open = (s: GameState, id: string, personId?: string): GameState => openNextEvent({ ...s, pendingEvent: null, eventQueue: [{ eventId: id, context: {}, personId }] }, EVENT_REGISTRY);
const binds = (s: GameState, id: string, p: Person): boolean => candidatesFor(s, EVENT(id).person!).some((c) => c.id === p.id);

/** Every effects list of a choice, including the branches of chance and random effects. */
function lists(effects: readonly Effect[]): (readonly Effect[])[] {
  return [effects, ...effects.flatMap((e) => ('chance' in e ? [...lists(e.then), ...lists(e.else ?? [])] : 'random' in e ? e.random.flatMap((o) => lists(o.effects)) : []))];
}
/** Every player-facing string of an event: title, text, labels, hints and journal lines. */
function strings(def: EventDef): string[] {
  return [def.title, def.text, ...def.choices.flatMap((c) => [c.label, c.hint ?? '', ...lists(c.effects).flatMap((l) => l.flatMap((e) => ('log' in e ? [e.log] : 'newPerson' in e && e.newPerson.log ? [e.newPerson.log] : [])))])];
}
/** Conditions at the top level and inside `all`. */
function flat(conditions: readonly Condition[] | undefined): Condition[] {
  return (conditions ?? []).flatMap((c) => ('all' in c ? flat(c.all) : [c]));
}

describe('home size: the home I live in, not any house I own', () => {
  const SIZED = ['ll_downsizing', 'gy_holiday_elder', 'gu_roof_leak', 'ad_hoa_door', 'ad_neighbour_fence'];
  const child = () => person('child', { age: 40, growth: { movedOut: true } });
  const ageFor = (id: string) => Math.max(EVENT(id).minAge, Math.min(EVENT(id).maxAge, 63));

  it('none opens while I live in a studio and rent out a family home (the playtest repro)', () => {
    const assets = [house('studio', { primary: true }), { ...house('suburban', { rentedOut: true }), id: 'a_family' }];
    for (const id of SIZED) expect([id, isEligible(life(ageFor(id), [child()], { patch: { assets } }), EVENT(id))]).toEqual([id, false]);
  });

  it('each still opens in the family home I live in', () => {
    for (const id of SIZED) expect([id, isEligible(life(ageFor(id), [child()], { patch: { assets: [house('suburban', { primary: true })] } }), EVENT(id))]).toEqual([id, true]);
  });

  it('buying a studio, then a family home, keeps me in the studio and the cards closed', () => {
    let s = life(63, [child()], { patch: { assets: [], finances: { ...life(63).finances, cash: 3_000_000 } } });
    s = applyAction(s, { type: 'buyAsset', defId: 'studio', financing: 'cash' });
    s = applyAction(s, { type: 'buyAsset', defId: 'suburban', financing: 'cash' });
    const family = s.assets.find((a) => a.defId === 'suburban')!;
    s = applyAction(s, { type: 'repairAsset', assetId: `rent:${family.id}` });
    expect(s.assets.find((a) => a.primary)?.defId).toBe('studio');
    expect(isEligible(s, EVENT('ll_downsizing'))).toBe(false);
    expect(isEligible(s, EVENT('gy_holiday_elder'))).toBe(false);
  });

  it('a family home I still own is not where I live once I am in assisted living or living with my kids', () => {
    const assets = [house('suburban', { primary: true })];
    for (const flag of ['gy_assisted_living', 'gy_lives_with_kids']) {
      for (const id of ['ll_downsizing', 'gy_holiday_elder']) {
        expect([id, flag, isEligible(life(80, [child()], { patch: { assets, flags: { [flag]: true } } }), EVENT(id))]).toEqual([id, flag, false]);
      }
    }
    expect(isEligible(life(80, [child()], { patch: { assets } }), EVENT('ll_downsizing'))).toBe(true);
  });

  it('every card here that names house types also rules out the others, so the one I live in is one of them', () => {
    const houses = ['studio', 'condo', 'townhouse', 'suburban', 'farmhouse', 'beach_house', 'mansion', 'penthouse'];
    for (const def of MINE) {
      const owned = flat(def.conditions).filter((c): c is { ownsAssetId: string[] } => 'ownsAssetId' in c && c.ownsAssetId.some((id) => houses.includes(id)));
      for (const c of owned) {
        const others = houses.filter((h) => !c.ownsAssetId.includes(h));
        const ruledOut = flat(def.conditions).some((x) => 'not' in x && 'ownsAssetId' in x.not && others.every((h) => (x.not as { ownsAssetId: string[] }).ownsAssetId.includes(h)));
        expect([def.id, ruledOut]).toEqual([def.id, true]);
      }
    }
  });
});

describe('retirement and widowhood cards open while it is still new', () => {
  const retired = (age: number, toAge: number): GameState => {
    const base = life(age);
    return { ...base, career: { ...base.career, retired: true, job: null, history: [{ title: 'Clerk', company: 'Apex Inc.', fromAge: 30, toAge, salary: 50_000, reason: 'retired' }] } };
  };

  it("the Monday problem opens in the first two years of retirement, not ten years on", () => {
    expect(isEligible(retired(61, 60), EVENT('gy_first_monday'))).toBe(true);
    expect(isEligible(retired(62, 60), EVENT('gy_first_monday'))).toBe(true);
    expect(isEligible(retired(70, 60), EVENT('gy_first_monday'))).toBe(false);
  });

  it("the journal says I haven't set an alarm 'in years' only a few years into retirement", () => {
    const alarm = FLAVOR.find((l) => l.text.includes("haven't set an alarm in years"))!;
    const at = (age: number, toAge: number) => flavorFits(alarm, retired(age - 1, toAge), retired(age, toAge));
    expect(at(65, 64)).toBe(false);
    expect(at(66, 64)).toBe(false);
    expect(at(68, 64)).toBe(true);
  });

  const FRESH_GRIEF = ['gu_widowed_casseroles', 'gu_widowed_old_number', 'gu_widowed_ring', 'gu_widowed_closet', 'gy_widow_two_cups', 'gy_widow_closet', 'gy_widow_recipe'];
  /** A widow whose husband died at `lostAt` (the player's age then): the fresh-grief cards bind only a recent loss. */
  const widow = (age: number, flags: GameState['flags'] = {}, lostAt = typeof flags.grieving === 'number' ? flags.grieving : age - 20) => {
    const late = person('spouse', { age: 40, alive: false, deathAge: 40, marriedAtAge: 28, gender: 'male', mourned: true, lostAtAge: lostAt });
    const base = life(age, [late]);
    return life(age, [late], { patch: { counters: { ...base.counters, marriages: 1 }, career: { ...base.career, job: JOB }, flags } });
  };

  it('the casseroles, the voicemail, the ring and the closet wait for the grief window, never decades after (the playtest repro)', () => {
    for (const id of FRESH_GRIEF) {
      const age = Math.min(EVENT(id).maxAge, Math.max(EVENT(id).minAge, 62));
      expect([id, isEligible(widow(age), EVENT(id))]).toEqual([id, false]);
      expect([id, isEligible(widow(age, { grieving: age - 1 }), EVENT(id))]).toEqual([id, true]);
      // A later partner's death sets the grieving flag again, but the spouse died years before: not their casseroles.
      expect([id, isEligible(widow(age, { grieving: age - 1 }, age - 12), EVENT(id))]).toEqual([id, false]);
    }
  });

  it('the pension letter comes only to someone drawing a pension', () => {
    const never = life(66, [], { patch: { career: { ...life(66).career, retired: false, job: null, history: [] } } });
    expect(isEligible(never, EVENT('ll_pension_letter'))).toBe(false);
    expect(isEligible(retired(66, 62), EVENT('ll_pension_letter'))).toBe(true);
    // Back at work, the salary replaces the pension (finance.ts); a year in, nobody has underpaid me 'for years'.
    const working = retired(66, 62);
    expect(isEligible({ ...working, career: { ...working.career, job: JOB } }, EVENT('ll_pension_letter'))).toBe(false);
    expect(isEligible(retired(66, 65), EVENT('ll_pension_letter'))).toBe(false);
  });
});

describe('deaths fit the age (GAME_DESIGN §10)', () => {
  it("every card here that kills someone of 'natural causes' binds people of 60 or more", () => {
    for (const def of MINE) {
      const natural = def.choices.some((c) => lists(c.effects).some((l) => l.some((e) => 'personDies' in e && e.cause === 'natural causes')));
      if (natural) expect([def.id, (def.person?.minAge ?? 0) >= 60]).toEqual([def.id, true]);
    }
  });

  it('a 59-year-old friend is not the one who dies (the playtest repro)', () => {
    const felix = person('friend', { age: 59, gender: 'male', relationship: 60 });
    expect(binds(life(62, [felix]), 'll_outlive_friend', felix)).toBe(false);
    const older = person('friend', { age: 63, gender: 'male', relationship: 60 });
    expect(binds(life(62, [older]), 'll_outlive_friend', older)).toBe(true);
  });
});

describe('one night out is not a habit', () => {
  it('no holiday card here adds to an addiction', () => {
    for (const def of HOLIDAYS_AND_TRADITIONS_EVENTS) for (const c of def.choices) expect([def.id, c.id, lists(c.effects).some((l) => l.some((e) => 'addiction' in e))]).toEqual([def.id, c.id, false]);
  });

  it("a New Year's toast leaves no alcohol level behind", () => {
    const s = resolveChoice(open(life(41), 'hd_midnight_countdown'), 'drink', EVENT_REGISTRY);
    expect(s.health.addictions.alcohol ?? 0).toBe(0);
  });
});

describe('warm cards bind someone still on good terms with me', () => {
  const WARM = ['hd_terrible_gift', 'll_surprise_birthday', 'll_life_advice', 'ad_godparent', 'ad_mortgage_cosign', 'ad_friend_mlm', 'lf_blind_date', 'gu_table_nine', 'gu_single_supplement', 'gu_friend_custody', 'gy_friend_retires', 'gy_friend_funeral_wishes', 'gy_video_call'];

  it('a friend who stopped speaking to me (relationship 5 after the alibi, 23 after the secret) is never bound', () => {
    for (const rel of [5, 23]) {
      for (const id of WARM) {
        const def = EVENT(id);
        const friend = person('friend', { relationship: rel, age: Math.max(def.person!.minAge ?? 0, Math.min(def.person!.maxAge ?? 200, 61)) });
        expect([id, rel, binds(life(Math.max(def.minAge, Math.min(def.maxAge, 62)), [friend]), id, friend)]).toEqual([id, rel, false]);
      }
    }
  });

  it('a close friend still is', () => {
    for (const id of WARM) {
      const def = EVENT(id);
      const friend = person('friend', { relationship: 75, age: Math.max(def.person!.minAge ?? 0, Math.min(def.person!.maxAge ?? 200, 61)) });
      expect([id, binds(life(Math.max(def.minAge, Math.min(def.maxAge, 62)), [friend]), id, friend)]).toEqual([id, true]);
    }
  });

  it('an estranged grown child does not give me hearing aids for my birthday', () => {
    const cold = person('child', { age: 40, relationship: 10 });
    const warm = person('child', { age: 42, relationship: 60 });
    expect(binds(life(75, [cold, warm]), 'gy_hearing_aid_gift', cold)).toBe(false);
    expect(binds(life(75, [cold, warm]), 'gy_hearing_aid_gift', warm)).toBe(true);
  });
});

describe('dementia', () => {
  const withDementia = (age: number, people: Person[] = []) => life(age, people, { patch: { health: { ...life(age).health, illnesses: [{ defId: 'dementia', name: 'Dementia', severity: 4, chronic: true, yearsLeft: -1, treated: false }] } } });

  it("no card that can diagnose dementia opens for someone who already has it (the doctor would call it 'normal')", () => {
    const diagnosing = MINE.filter((d) => d.choices.some((c) => lists(c.effects).some((l) => l.some((e) => 'illness' in e && e.illness === 'dementia'))));
    expect(diagnosing.map((d) => d.id)).toEqual(expect.arrayContaining(['ll_memory_lapse', 'gy_name_roulette']));
    const kid = person('child', { age: 40 });
    for (const def of diagnosing) expect([def.id, isEligible(withDementia(70, [kid]), def)]).toEqual([def.id, false]);
    expect(isEligible(life(70, [kid]), EVENT('ll_memory_lapse'))).toBe(true);
  });
});

describe('jury duty', () => {
  it('a summons only where ordinary people sit on juries (the shared JURY_TRIALS), and a deliberation that fits all of them', () => {
    for (const cc of ['IN', 'MX', 'NG', 'DE']) expect([cc, isEligible(life(40, [], { countryCode: cc }), EVENT('ad_jury_duty'))]).toEqual([cc, false]);
    for (const cc of ['US', 'GB', 'CA', 'AU', 'FR', 'IT', 'BR', 'ES', 'JP']) expect([cc, isEligible(life(40, [], { countryCode: cc }), EVENT('ad_jury_duty'))]).toEqual([cc, true]);
    expect(isEligible(life(40, [], { countryCode: 'JP', patch: { year: 2005 } }), EVENT('ad_jury_duty'))).toBe(false);
    expect(open(life(40, [], { countryCode: 'IN' }), 'ad_jury_verdict').pendingEvent).toBeNull();
    // Juries differ in size and in how a split ends: no juror count, no hung jury.
    const words = [EVENT('ad_jury_verdict').text, ...EVENT('ad_jury_verdict').choices.flatMap((c) => JSON.stringify(c.effects))].join(' ');
    expect(words).not.toMatch(/eleven|twelve|hung jury/i);
  });
});

describe('no claimed history the selector cannot see', () => {
  it('cards for a cooled bond do not claim years without talking (contact is not tracked by the selector)', () => {
    const cooled = MINE.filter((e) => e.person?.maxRelationship !== undefined);
    expect(cooled.map((e) => e.id)).toEqual(expect.arrayContaining(['ll_sibling_reunion', 'hd_estranged_sibling', 'ad_sibling_feud', 'gu_estranged_child']));
    for (const e of cooled) expect([e.id, /in years|in a long time|not (properly )?(spoken|talked)|years of silence|lost touch/i.test(e.title + ' ' + e.text)]).toEqual([e.id, false]);
    expect(EVENT('ll_old_flame').text).not.toMatch(/in years/);
  });

  it('a grandparent who may have had none does not recall their own grandparents', () => {
    for (const def of MINE.filter((d) => d.minAge >= 50)) for (const l of strings(def)) expect([def.id, /my (own )?grandparents/i.test(l)]).toEqual([def.id, false]);
  });

  it('no adult line says I look like, or am laughed at by, my parents (an orphan never knew them)', () => {
    for (const def of MINE.filter((d) => d.minAge >= 18)) for (const l of strings(def)) expect([def.id, /\bmy (own )?parents\b/i.test(l)]).toEqual([def.id, false]);
  });
});

describe('a scene that happens once', () => {
  it('the secret candy drawer and the phone that talks are found once', () => {
    expect(EVENT('gp_candy_drawer').once).toBe(true);
    expect(EVENT('ll_grandkid_tech').once).toBe(true);
    const gm = person('grandparent', { age: 70, gender: 'female' });
    expect(isEligible(life(7, [gm], { patch: { firedEvents: { gp_candy_drawer: 3 } } }), EVENT('gp_candy_drawer'))).toBe(false);
  });
});

describe('names and numbers that fit the family', () => {
  it('no first name from a name pool is written into these cards (a bound child may have it)', () => {
    const pool = new Set(Object.values(NAMES).flatMap((t) => [...t.male, ...t.female]));
    for (const def of MINE) for (const l of strings(def)) for (const w of l.match(/\b[A-Z][a-z]+\b/g) ?? []) expect([def.id, w, pool.has(w)]).toEqual([def.id, w, false]);
  });

  it("a choice offered to a parent of one child does not talk about 'the kids' or 'the children'", () => {
    const own = (c: ChoiceDef) => (c.conditions ?? []).some((x) => 'hasChildren' in x && x.hasChildren);
    for (const def of MINE) {
      for (const c of def.choices.filter(own)) {
        const words = [c.label, ...lists(c.effects).flatMap((l) => l.flatMap((e) => ('log' in e ? [e.log] : [])))];
        for (const w of words) expect([def.id, c.id, /\b(the|my) (kids|children)\b|\beach chose\b|\bmy youngest\b|\bthe kids\b/i.test(w)]).toEqual([def.id, c.id, false]);
      }
    }
  });

  it('the will of a parent of one child leaves it to my family (the playtest repro)', () => {
    const miles = person('child', { age: 40, firstName: 'Miles', gender: 'male' });
    const s = resolveChoice(open(life(68, [miles]), 'll_will'), 'kids', EVENT_REGISTRY);
    expect(s.log.at(-1)?.text).not.toMatch(/children|kids/);
  });
});

describe('weather and seasons', () => {
  it('winter, snow and heating only where winters are cold, and never as December south of the equator', () => {
    const cold = /\b(winter|snow\w*|sleet|blizzard|furnace|radiator|the heat went out|heating broke|holiday sweater|reindeer sweater|two coats indoors)\b/i;
    for (const def of MINE) {
      if (!strings(def).some((l) => cold.test(l))) continue;
      const cs = flat(def.conditions);
      expect([def.id, cs.some((c) => 'climate' in c && !c.climate.includes('hot'))]).toEqual([def.id, true]);
    }
  });

  it('the resolution check-in does not say spring follows New Year (it does not in Australia or Brazil)', () => {
    for (const l of strings(EVENT('hd_resolution_spring'))) expect(l).not.toMatch(/\bspring\b/i);
    // Kept going three months in, then fell off: later than the check-in itself, not 'until March'.
    for (const l of strings(EVENT('hd_resolution_spring'))) expect(l).not.toMatch(/\buntil (January|February|March)\b/);
  });
});

describe('American English', () => {
  it('no British words in these files', () => {
    const british = /\b(full stop|top mark|motorbike|cupboard|corner shop|put the kettle on|cheeky|nappy|nappies|pram|lorry|petrol|fortnight|queue|rubbish|trainers|jumper|mum|colour|favourite|neighbour|realise|organise|centre|theatre|grey)\b/i;
    for (const def of MINE) for (const l of strings(def)) expect([def.id, l, british.test(l)]).toEqual([def.id, l, false]);
  });
});

describe('every choice trades something (expected value, every set of choices a player can see)', () => {
  type Vec = Record<string, number>;
  function vec(effects: readonly Effect[], p = 1, acc: Vec = {}, other = new Set<string>()): [Vec, Set<string>] {
    const add = (k: string, v: number) => (acc[k] = (acc[k] ?? 0) + p * v);
    for (const e of effects) {
      if ('stat' in e) add(e.stat, e.delta);
      else if ('stats' in e) for (const [k, v] of Object.entries(e.stats)) add(k, v ?? 0);
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
      else if ('chance' in e) {
        vec(e.then, p * e.chance, acc, other);
        vec(e.else ?? [], p * (1 - e.chance), acc, other);
      } else if ('random' in e) {
        const t = e.random.reduce((a, o) => a + o.weight, 0) || 1;
        for (const o of e.random) vec(o.effects, (p * o.weight) / t, acc, other);
      } else if (!('log' in e) && !('counter' in e)) other.add(JSON.stringify(e));
    }
    return [acc, other];
  }
  const trait = (c: ChoiceDef, k: 'trait' | 'notTrait') => (c.conditions ?? []).map((x) => (k in x ? (x as Record<string, string>)[k] : undefined)).find(Boolean);
  /** A conditioned choice may be hidden; of a trait / notTrait pair exactly one shows. */
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

  it('no choice beats every other choice shown beside it', () => {
    const dominant: string[] = [];
    for (const e of MINE) {
      for (const shown of visibleSets(e.choices)) {
        const priced: Priced[] = shown.map((c) => ({ c, v: vec(c.effects) }));
        for (const a of priced) if (priced.every((b) => b === a || beats(a, b))) dominant.push(`${e.id}/${a.c.id} over ${shown.filter((c) => c !== a.c).map((c) => c.id).join(',')}`);
      }
    }
    expect([...new Set(dominant)]).toEqual([]);
  });

  it("a parent's blessing costs the effort of the wedding that going along with it does not", () => {
    for (const [id, warm, cool] of [['lf_mother_remarries', 'bless', 'along'], ['lf_father_remarries', 'welcome', 'polite']] as const) {
      const [a] = vec(EVENT(id).choices.find((c) => c.id === warm)!.effects);
      const [b] = vec(EVENT(id).choices.find((c) => c.id === cool)!.effects);
      expect([id, (a.energy ?? 0) < (b.energy ?? 0)]).toEqual([id, true]);
    }
  });
});
