/**
 * Family, later-life and flavor content (the third playtest round): a foster child hears from no aunt or cousin, an
 * old flame waits out the grief window, no vague first word follows the real one, a lifelong friend is one I have
 * known for decades, a first visit to a partner's parents comes early, no American-only detail reaches other
 * countries, no family dog is invented, a single parent of several does not single one out, "I live alone" means it,
 * people a card makes are old enough for their story, and farm mornings end when the family moves to a city.
 */
import { FLAVOR, type FlavorLine } from '@/data/flavor';
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
import { candidatesFor } from '../events/conditions';
import { applyEffects } from '../events/effects';
import { EVENT_REGISTRY } from '../events/registry';
import type { Condition, Effect, EventDef } from '../events/schema';
import { isEligible, openNextEvent, resolveChoice } from '../events/select';
import { Rng } from '../rng';
import { createLife, emptyMemory, makePerson } from '../systems/character';
import { flavorFits } from '../systems/flavor';
import type { GameState, Person, RelationshipKind } from '../types';

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
const LINE = (start: string): FlavorLine => {
  const line = FLAVOR.find((l) => l.text.startsWith(start));
  if (!line) throw new Error(`no flavor line "${start}"`);
  return line;
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
const binds = (s: GameState, id: string, p: Person): boolean => candidatesFor(s, EVENT(id).person!).some((c) => c.id === p.id);
const FOSTER: Partial<GameState> = { flags: { foster_care: true, 'scenario:orphan': true } };
const fits = (line: FlavorLine, s: GameState): boolean => flavorFits(line, s, s);

/** Every effects list of a choice, including the branches of chance and random effects. */
function lists(effects: readonly Effect[]): (readonly Effect[])[] {
  return [effects, ...effects.flatMap((e) => ('chance' in e ? [...lists(e.then), ...lists(e.else ?? [])] : 'random' in e ? e.random.flatMap((o) => lists(o.effects)) : []))];
}
/** Every player-facing string of an event: title, text, labels, hints and journal lines. */
function strings(def: EventDef): string[] {
  return [def.title, def.text, ...def.choices.flatMap((c) => [c.label, c.hint ?? '', ...lists(c.effects).flatMap((l) => l.flatMap((e) => ('log' in e ? [e.log] : 'newPerson' in e && e.newPerson.log ? [e.newPerson.log] : [])))])];
}
const hasCondition = (def: EventDef, pred: (c: Condition) => boolean): boolean => (def.conditions ?? []).some(pred);
const notFoster = (c: Condition): boolean => 'not' in c && 'flag' in c.not && c.not.flag === 'foster_care' && c.not.eq === undefined;

describe('a foster child hears from no aunt, uncle or cousin', () => {
  /**
   * Cards whose aunt, uncle or cousin belongs to someone else (a partner's, the couple's at a wedding, a grandchild's),
   * or is a figure of speech: these suit an orphan too.
   */
  const SOMEONE_ELSES: Record<string, string> = {
    gu_table_nine: "the couple's cousin at a friend's wedding",
    gu_wedding_planning: "the partner's aunt and relatives ({{person}}'s aunt, three of {{their}} relatives)",
    lf_cheating_suspicion: "the partner's cousin",
    lf_blind_date: "'we would make excellent cousins', a figure of speech",
    gc_grandchild_wedding: "the in-laws' cousin",
    gy_record_grandkid_questions: "the grandchild's cousin",
  };
  const RELATIVE = /\b(great-)?(aunts?|uncles?|cousins?|relatives?)\b/i;
  /** Family an orphan has none of: no mother or father (only a foster parent) and so no grandparents. */
  const ORPHAN_LACKS: readonly RelationshipKind[] = ['mother', 'father', 'grandparent'];

  it('every card here that names one of my aunts, uncles, cousins or relatives rules out the orphan scenario (or needs a parent or grandparent, which an orphan has none of)', () => {
    const named = MINE.filter((d) => strings(d).some((t) => RELATIVE.test(t)));
    expect(named.length).toBeGreaterThan(5);
    for (const def of named) {
      if (SOMEONE_ELSES[def.id]) continue;
      const parentBound = !!def.person && def.person.kind.every((k) => ORPHAN_LACKS.includes(k));
      expect([def.id, hasCondition(def, notFoster) || parentBound]).toEqual([def.id, true]);
    }
  });

  it("the excused cards really do say whose relative it is, so a foster child's journal stays true", () => {
    for (const id of Object.keys(SOMEONE_ELSES)) {
      const mine = strings(EVENT(id)).filter((t) => /\b(an|my|a) (great-)?(aunt|uncle|cousin)\b|\bcousins I\b|\baunts\b|\b(two|three|some|several) relatives\b/i.test(t) && !/\b(their|his|her|{{their}}|{{person}}'s|The cousin|a cousin from out of town)\b/.test(t));
      expect([id, mine]).toEqual([id, []]);
    }
  });

  it("the cousin's wedding, the family reunion and a will from an unknown relative wait for a life with family (the playtest repros)", () => {
    const fosterSibling = person('sibling', { age: 37, foster: true, relationship: 20 });
    expect(isEligible(life(35, [fosterSibling], { patch: FOSTER }), EVENT('ad_sibling_feud'))).toBe(false);
    expect(isEligible(life(35, [fosterSibling], { patch: FOSTER }), EVENT('lf_family_reunion'))).toBe(false);
    expect(isEligible(life(40, [], { patch: FOSTER }), EVENT('ad_surprise_inheritance'))).toBe(false);
    const sibling = person('sibling', { age: 37, relationship: 20 });
    expect(isEligible(life(35, [sibling]), EVENT('ad_sibling_feud'))).toBe(true);
    expect(isEligible(life(35, [sibling]), EVENT('lf_family_reunion'))).toBe(true);
    expect(isEligible(life(40), EVENT('ad_surprise_inheritance'))).toBe(true);
  });

  it('a birthday gift of money comes from a neighbor, and a slighted wedding guest is the partner\'s aunt', () => {
    expect(strings(EVENT('hd_birthday_candles')).filter((t) => /aunt/i.test(t))).toEqual([]);
    const lover = person('lover', { age: 30, firstName: 'Theo', gender: 'male' });
    let s = life(30, [lover], { patch: { flags: { lf_engaged: true } } });
    for (let seed = 1; seed < 40 && !s.log.some((l) => /aunt/.test(l.text)); seed++) {
      s = resolveChoice(openNextEvent({ ...life(30, [lover], { patch: { flags: { lf_engaged: true } } }), rng: new Rng(seed).snapshot(), eventQueue: [{ eventId: 'gu_wedding_planning', context: {}, personId: lover.id }] }, EVENT_REGISTRY), 'small', EVENT_REGISTRY);
    }
    expect(s.log.map((l) => l.text)).toContain("Theo's aunt did not make the thirty and has stopped returning our calls.");
  });

  it('no flavor line names an aunt, uncle, cousin or relatives without ruling out the orphan scenario', () => {
    const named = FLAVOR.filter((l) => RELATIVE.test(l.text));
    expect(named.length).toBeGreaterThan(0);
    for (const l of named) expect([l.text, (l.conditions ?? []).some(notFoster)]).toEqual([l.text, true]);
  });

  it('no flavor line names relatives for a foster child (the playtest repro)', () => {
    const grad = life(24, [], { patch: { ...FOSTER, education: { ...life(24).education, enrolled: true, stage: 'graduate' } } });
    expect(fits(LINE('Relatives kept asking'), grad)).toBe(false);
    expect(fits(LINE('Relatives kept asking'), { ...grad, flags: {} })).toBe(true);
  });
});

describe('an old flame waits out the grief window', () => {
  it("'no agenda' coffee from an ex does not come in the year my spouse died (the playtest repro), only after", () => {
    const ex = person('ex', { age: 66, gender: 'male' });
    const late = person('spouse', { age: 63, alive: false, lostAtAge: 64, gender: 'male' });
    expect(isEligible(life(64, [ex, late], { patch: { flags: { grieving: 64 } } }), EVENT('ll_old_flame'))).toBe(false);
    expect(isEligible(life(66, [ex, late]), EVENT('ll_old_flame'))).toBe(true);
  });

  it("nor does a pang over an ex's new partner at the market", () => {
    const ex = person('ex', { age: 46, gender: 'male' });
    const late = person('spouse', { age: 45, alive: false, lostAtAge: 44, gender: 'male' });
    expect(isEligible(life(44, [ex, late], { patch: { flags: { grieving: 44 } } }), EVENT('gu_ex_moved_on'))).toBe(false);
    expect(isEligible(life(47, [ex, late]), EVENT('gu_ex_moved_on'))).toBe(true);
  });
});

describe('the first word', () => {
  const vague = LINE('I said something that might have been a word');

  it('no vague "might have been a word" the year after a first-word card (the playtest repro)', () => {
    for (const id of ['ec_first_word', 'ss_tc_first_word']) expect([id, fits(vague, life(2, [], { patch: { firedEvents: { [id]: 1 } } }))]).toEqual([id, false]);
  });

  it('it still babbles before any first word, and the first-word cards are the ones the guard names', () => {
    expect(fits(vague, life(1))).toBe(true);
    expect(EVENT_REGISTRY.byId.ec_first_word!.minAge).toBeGreaterThanOrEqual(1);
    expect(EVENT_REGISTRY.byId.ss_tc_first_word!.maxAge).toBeLessThanOrEqual(2);
  });

  it('"doggy", a new word, comes after either first-word card', () => {
    const doggy = EVENT('bt_doggy');
    expect(isEligible(life(2), doggy)).toBe(false);
    for (const id of ['ec_first_word', 'ss_tc_first_word']) expect([id, isEligible(life(2, [], { patch: { firedEvents: { [id]: 1 } } }), doggy)]).toEqual([id, true]);
  });
});

describe('friends of long standing', () => {
  it("'known each other longer than either of us cared to count' is a friend of twenty years or more (the playtest repro)", () => {
    const newFriend = person('friend', { age: 70, metAtAge: 70 });
    const fewYears = person('friend', { age: 70, metAtAge: 60 });
    const old = person('friend', { age: 71, metAtAge: 40 });
    const s = life(72, [newFriend, fewYears, old]);
    expect(binds(s, 'll_outlive_friend', newFriend)).toBe(false);
    expect(binds(s, 'll_outlive_friend', fewYears)).toBe(false);
    expect(binds(s, 'll_outlive_friend', old)).toBe(true);
    // The card's age range leaves room for twenty years of friendship since adulthood.
    expect(EVENT('ll_outlive_friend').minAge - 20).toBeGreaterThanOrEqual(18);
  });

  it("the canoe story 'I promised years ago' needs a friend of ten years or more", () => {
    const recent = person('friend', { age: 66, metAtAge: 60, relationship: 60 });
    const longtime = person('friend', { age: 66, metAtAge: 50, relationship: 60 });
    expect(binds(life(64, [recent]), 'gy_friend_funeral_wishes', recent)).toBe(false);
    expect(binds(life(64, [longtime]), 'gy_friend_funeral_wishes', longtime)).toBe(true);
  });
});

describe('meeting the parents is a new relationship', () => {
  const def = () => EVENT('lf_meet_their_parents');

  it('not with a partner of ten years (the playtest repro), only one of three years or less', () => {
    const decade = person('lover', { age: 34, metAtAge: 20 });
    const fresh = person('lover', { age: 31, metAtAge: 28 });
    expect(isEligible(life(30, [decade]), def())).toBe(false);
    expect(isEligible(life(30, [fresh]), def())).toBe(true);
  });

  it('not while I am married, and never the same partner twice (the cooldown outlasts the window)', () => {
    const fresh = person('lover', { age: 31, metAtAge: 29 });
    expect(isEligible(life(30, [fresh, person('spouse', { age: 31 })]), def())).toBe(false);
    expect(def().cooldown!).toBeGreaterThan(def().person!.knownFor!.lte!);
  });
});

describe('American-only details stay in America', () => {
  /**
   * Units and institutions other countries do not share: miles, inches, yards, Fahrenheit (a thermostat at 71
   * degrees), pounds, the homeowners' association, the county fair, the yearbook and the diner. "By a mile" and
   * "ten feet tall" are idioms.
   */
  const US_ONLY = /homeowners'|\bmiles?\b|\binch(es)?\b|\byards? (behind|ahead|away|long|wide)\b|\b\d+ degrees\b|\bfeet tall\b|\bfoot a\b|\bpounds?\b|county fair|yearbook|\bdiner\b/i;
  const idioms = (t: string): string => t.replace(/by a mile|ten feet tall/g, '');

  it('no card here mentions them unless it opens only in the United States (the playtest repros: HOA treasurer, odometer; also the burst pipe, the thermostat)', () => {
    for (const def of MINE) {
      const hits = strings(def).map(idioms).filter((t) => US_ONLY.test(t));
      if (!hits.length) continue;
      const usOnly = hasCondition(def, (c) => 'country' in c && c.country.length === 1 && c.country[0] === 'US');
      expect([def.id, hits, usOnly]).toEqual([def.id, hits, true]);
    }
  });

  it('nor does any flavor line', () => {
    expect(FLAVOR.filter((l) => US_ONLY.test(idioms(l.text))).map((l) => l.text)).toEqual([]);
  });

  it("the homeowners' association's door letter is American; a residents' association treasurer works anywhere", () => {
    const yard = { id: 'a_house', defId: 'suburban', kind: 'house' as const, name: 'House', value: 300_000, purchasePrice: 300_000, condition: 90, yearlyUpkeep: 0, mortgage: null, boughtAtAge: 30, primary: true };
    expect(isEligible(life(40, [], { countryCode: 'US', patch: { assets: [yard] } }), EVENT('ad_hoa_door'))).toBe(true);
    expect(isEligible(life(40, [], { countryCode: 'FR', patch: { assets: [yard] } }), EVENT('ad_hoa_door'))).toBe(false);
    expect(isEligible(life(40, [], { countryCode: 'FR', patch: { assets: [yard] } }), EVENT('gu_hoa_treasurer'))).toBe(true);
  });
});

describe('no family dog is invented', () => {
  it('a card here that talks about a dog of ours binds a pet dog or brings one home', () => {
    const OUR_DOG = /\b(our|my) (old )?dog\b|\bdog we had\b|\bfamily dog\b/i;
    for (const def of MINE) {
      if (!strings(def).some((t) => OUR_DOG.test(t))) continue;
      const boundDog = !!def.person?.species?.includes('dog');
      const newDog = def.choices.some((c) => lists(c.effects).some((l) => l.some((e) => 'newPerson' in e && e.newPerson.kind === 'pet' && e.newPerson.species === 'dog')));
      expect([def.id, boundDog || newDog]).toEqual([def.id, true]);
    }
  });

  it("the name mix-up uses the neighbor's dog, so it fits a life that never had one (the playtest repro)", () => {
    const def = EVENT('gy_name_roulette');
    expect(isEligible(life(80, [person('child', { age: 50 })]), def)).toBe(true);
    expect(def.text).not.toMatch(/dog we had/);
    expect(def.text).toMatch(/neighbor's dog/);
  });
});

describe('a single parent of several children', () => {
  const only = LINE('I raised {{person}} on my own');
  const all = LINE('I raised my kids on my own');
  const kids = (...ages: number[]) => ages.map((age) => person('child', { age }));
  const parent = (children: Person[]) => life(41, children, { patch: { counters: { ...life(41).counters, children: children.length } } });

  it("does not raise one of them 'on my own' while raising the others too (the playtest repro: four children)", () => {
    expect(fits(only, parent(kids(15, 11, 7, 4)))).toBe(false);
    expect(fits(all, parent(kids(15, 11, 7, 4)))).toBe(true);
  });

  it('an only child is named; two grown children and no young ones get neither line', () => {
    expect(fits(only, parent(kids(5)))).toBe(true);
    expect(fits(all, parent(kids(5)))).toBe(false);
    expect(fits(all, parent(kids(19, 22)))).toBe(false);
  });

  it('a partner at home ends both lines', () => {
    const s = parent([...kids(7, 4), person('spouse', { age: 40 })]);
    expect(fits(all, s)).toBe(false);
  });
});

describe('"I live alone now" means it', () => {
  const alone = LINE('I live alone now');
  const old = (flags: Record<string, boolean>, people: Person[] = [person('child', { age: 65, growth: { movedOut: true } })]) => life(92, people, { patch: { flags } });

  it('not in assisted living, nor in a grown child\'s spare room (the playtest repro)', () => {
    expect(fits(alone, old({ gy_lives_with_kids: true }))).toBe(false);
    expect(fits(alone, old({ gy_assisted_living: true }))).toBe(false);
  });

  it('a widow in a home of her own still gets it; a spouse at home does not', () => {
    expect(fits(alone, old({}))).toBe(true);
    expect(fits(alone, old({}, [person('spouse', { age: 91 })]))).toBe(false);
  });
});

describe('people a card makes are old enough for their story', () => {
  const madeBy = (id: string, choice: string, age: number): number[] => {
    const ch = EVENT(id).choices.find((c) => c.id === choice)!;
    const out: number[] = [];
    for (let seed = 1; seed < 60; seed++) {
      const s = life(age);
      const after = applyEffects(s, new Rng(seed), ch.effects);
      for (const p of Object.values(after.people)) if (!s.people[p.id] && p.kind === 'friend') out.push(p.age);
    }
    return out;
  };

  it("a grief-group friend who 'lost a husband of fifty years' is seventy or more, even beside a 60-year-old widow (the playtest repro)", () => {
    const ages = madeBy('gy_widow_two_cups', 'group', 60);
    expect(ages.length).toBeGreaterThan(0);
    expect(Math.min(...ages)).toBeGreaterThanOrEqual(70);
  });

  it("the drummer's parent is old enough to have a teenager, even beside a 30-year-old", () => {
    const ages = madeBy('ad_neighbour_noise', 'teach', 30);
    expect(ages.length).toBeGreaterThan(0);
    expect(Math.min(...ages)).toBeGreaterThanOrEqual(32);
  });
});

describe('farm mornings end when the family moves to a city', () => {
  it("gp_farm_morning needs the farm, and a grandparent left behind by the move is not bound (the playtest repro: Grand Island to Nashville)", () => {
    const def = EVENT('gp_farm_morning');
    expect(def.conditions).toEqual(expect.arrayContaining([{ flag: 'farm' }]));
    const grandpa = person('grandparent', { age: 70, gender: 'male' });
    const mom = person('mother', { age: 38 });
    const onFarm = life(8, [grandpa, mom], { patch: { flags: { farm: true, 'scenario:farm_kid': true } } });
    expect(isEligible(onFarm, def)).toBe(true);
    // The family's move to another city, by whichever card moves it (the relocate effect kid_years' kd_moving_house uses).
    const moved = applyEffects(onFarm, new Rng(7), [{ relocate: true }]);
    expect(moved.character.city).not.toBe(onFarm.character.city);
    expect(moved.people[grandpa.id]!.farAway).toBe(true);
    expect(isEligible(moved, def)).toBe(false);
  });
});
