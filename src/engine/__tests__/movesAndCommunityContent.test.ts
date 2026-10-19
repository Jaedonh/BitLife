/**
 * Moves, friends, community and youth content (the second playtest's r_c1 findings). Each block pins one fix:
 * a friend who moves away lives far away, a family move changes the city, warm cards skip a friend who fell out
 * with me, a stranger with a job is an adult who has it, no scene comes back a third time, cold-weather cards stay
 * out of hot countries, a yard sale needs a house and years of freedom, jury duty only where juries sit, lines after
 * {{parents}} agree with them, American wording, and no choice that beats every other one in the childhood,
 * neighborhood and pet files.
 */
import { EVENTS } from '@/data/events';
import { FRIENDS_AND_STRANGERS_EVENTS } from '@/data/events/friends_and_strangers';
import { KID_LIFE_EVENTS } from '@/data/events/kid_life';
import { KID_YEARS_EVENTS } from '@/data/events/kid_years';
import { NEIGHBOURS_AND_COMMUNITY_EVENTS } from '@/data/events/neighbours_and_community';
import { PET_EVENTS } from '@/data/events/pet_events';
import { TECHNOLOGY_AND_MEDIA_EVENTS } from '@/data/events/technology_and_media';
import { TEEN_LIFE_EVENTS } from '@/data/events/teen_life';
import { TEEN_YEARS_EVENTS } from '@/data/events/teen_years';
import { TRAVEL_EVENTS } from '@/data/events/travel_events';
import { YOUNG_ADULT_EVENTS } from '@/data/events/young_adult';
import { YOUNG_ADULT_PATHS_EVENTS } from '@/data/events/young_adult_paths';
import { candidatesFor, evaluateAll } from '../events/conditions';
import { applyEffects } from '../events/effects';
import { EVENT_REGISTRY } from '../events/registry';
import type { ChoiceDef, Condition, Effect, EventDef } from '../events/schema';
import { openNextEvent, resolveChoice } from '../events/select';
import { Rng } from '../rng';
import { createLife } from '../systems/character';
import { availableInteractions } from '../systems/relationships';
import type { GameState, Person } from '../types';

/** The files this group owns. */
const MINE: readonly EventDef[] = [
  ...KID_YEARS_EVENTS,
  ...KID_LIFE_EVENTS,
  ...NEIGHBOURS_AND_COMMUNITY_EVENTS,
  ...PET_EVENTS,
  ...FRIENDS_AND_STRANGERS_EVENTS,
  ...TEEN_YEARS_EVENTS,
  ...TEEN_LIFE_EVENTS,
  ...YOUNG_ADULT_EVENTS,
  ...YOUNG_ADULT_PATHS_EVENTS,
  ...TECHNOLOGY_AND_MEDIA_EVENTS,
  ...TRAVEL_EVENTS,
];
const BY_ID: Record<string, EventDef> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
const ev = (id: string): EventDef => {
  const e = MINE.find((x) => x.id === id);
  if (!e) throw new Error(`no event ${id} in this group's files`);
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
function allEffects(effects: readonly Effect[]): Effect[] {
  return effects.flatMap((e) => [e, ...('chance' in e ? [...allEffects(e.then), ...allEffects(e.else ?? [])] : []), ...('random' in e ? e.random.flatMap((o) => allEffects(o.effects)) : [])]);
}
const lines = (e: EventDef): string[] => [e.title, e.text, ...e.choices.flatMap((c) => [c.label, c.hint ?? '', ...logs(c.effects)])];
const hasCond = (conds: readonly Condition[] | undefined, pred: (c: Condition) => boolean): boolean =>
  (conds ?? []).some((c) => pred(c) || ('all' in c && hasCond(c.all, pred)));

function open(s: GameState, eventId: string, personId?: string): GameState {
  return openNextEvent({ ...s, pendingEvent: null, eventQueue: [{ eventId, context: {}, personId }] }, EVENT_REGISTRY);
}
function withFriend(s: GameState, relationship = 75, seed = 11): [GameState, Person] {
  const before = new Set(Object.keys(s.people));
  const t = applyEffects(s, new Rng(seed), [{ newPerson: { kind: 'friend', relationship } }]);
  return [t, Object.values(t.people).find((p) => !before.has(p.id))!];
}
function atAge(countryCode: string, seed: number, age: number, extra: Partial<GameState['education']> = {}): GameState {
  const s = createLife({ countryCode, scenario: 'standard' }, seed);
  const pets = Object.fromEntries(Object.entries(s.people).filter(([, p]) => p.kind !== 'pet'));
  return { ...s, people: pets, character: { ...s.character, age }, education: { ...s.education, ...extra }, finances: { ...s.finances, cash: 100_000 }, firedEvents: {} };
}

describe('a friend who moves to another city or country lives far away from then on', () => {
  const MOVES: readonly [string, () => GameState][] = [
    ['tn_friend_moving', () => atAge('US', 1, 15, { enrolled: true })],
    ['nc_friend_moving_away', () => atAge('FR', 13579, 34)],
    ['fs_big_news', () => atAge('ES', 2808, 36)],
    ['pt_friends_dog_rehome', () => atAge('IT', 2707, 34)],
  ];

  it.each(MOVES)('%s: every choice leaves the friend far away (no visits, no block party) or out of my life', (id, make) => {
    const [s, friend] = withFriend(make());
    for (const choice of ev(id).choices) {
      const o = open(s, id, friend.id);
      expect(o.pendingEvent?.eventId).toBe(id);
      let r = resolveChoice(o, choice.id, EVENT_REGISTRY);
      for (let i = 0; i < 5 && r.pendingEvent; i++) r = resolveChoice(r, r.pendingEvent.choices[0]!.id, EVENT_REGISTRY);
      const p = r.people[friend.id];
      if (!p) continue;
      expect([choice.id, p.farAway]).toEqual([choice.id, true]);
      expect(availableInteractions(r, p).map((d) => d.id)).not.toContain('spendTime');
      expect(candidatesFor(r, BY_ID['nc_block_party']!.person!).map((x) => x.id)).not.toContain(friend.id);
    }
  });

  it('every card in these files whose bound friend moves away applies moveAway (or lets them go) on every choice', () => {
    const MOVING = /moving (abroad|to another city|away)|move: away from|other side of the country/i;
    const moving = MINE.filter((e) => e.person?.kind.some((k) => k === 'friend' || k === 'bestFriend') && MOVING.test(e.text));
    expect(moving.map((e) => e.id).sort()).toEqual(['fs_big_news', 'nc_friend_moving_away', 'pt_friends_dog_rehome', 'tn_friend_moving']);
    for (const e of moving) {
      for (const c of e.choices) {
        const kinds = allEffects(c.effects).map((x) => Object.keys(x)[0]);
        expect([e.id, c.id, kinds.includes('moveAway') || kinds.includes('removePerson')]).toEqual([e.id, c.id, true]);
      }
    }
  });

  it("'Let it drift' makes the new friend before the old one leaves, so the old friend's name is still taken", () => {
    const drift = ev('tn_friend_moving').choices.find((c) => c.id === 'drift')!;
    const kinds = allEffects(drift.effects).map((x) => Object.keys(x)[0]);
    expect(kinds.indexOf('newPerson')).toBeLessThan(kinds.indexOf('removePerson'));
    // The playtest's clash, rebuilt: even removing first no longer frees the departed friend's name, since the
    // engine keeps the names in the life at the start of the effects taken.
    const sure = drift.effects.flatMap((e) => ('chance' in e ? e.then : [e]));
    const reorder = [...sure.filter((e) => 'removePerson' in e), ...sure.filter((e) => !('removePerson' in e))];
    for (let seed = 1; seed <= 400; seed++) {
      const [s, friend] = withFriend(atAge('JP', seed, 14, { enrolled: true }), 60, seed);
      const nameAfter = (effects: readonly Effect[]) => {
        const r = applyEffects(s, new Rng(seed * 31), effects, { personId: friend.id });
        return Object.values(r.people).find((p) => !s.people[p.id])?.firstName;
      };
      expect(nameAfter(reorder)).not.toBe(friend.firstName);
      expect(nameAfter(sure)).not.toBe(friend.firstName);
    }
  });
});

describe('the family move changes the city and leaves my friends behind', () => {
  it.each(['pack', 'refuse', 'goodbye'])('kd_moving_house/%s relocates before the new-town card, which names the new city', (choiceId) => {
    let [s] = withFriend(atAge('US', 97531, 9), 60, 3);
    [s] = withFriend(s, 55, 4);
    const city = s.character.city;
    const friends = Object.values(s.people).filter((p) => p.kind === 'friend' || p.kind === 'bestFriend');
    const r = resolveChoice(open(s, 'kd_moving_house'), choiceId, EVENT_REGISTRY);
    expect(r.character.city).not.toBe(city);
    for (const f of friends) expect(r.people[f.id] === undefined || r.people[f.id]!.farAway === true).toBe(true);
    expect(r.pendingEvent?.eventId).toBe('kd_new_town');
    expect(r.pendingEvent?.text).toContain(`First week in ${r.character.city}.`);
    const kinds = ev('kd_moving_house').choices.find((c) => c.id === choiceId)!.effects.map((x) => Object.keys(x)[0]);
    expect(kinds.indexOf('relocate')).toBeLessThan(kinds.indexOf('queue'));
  });

  it('an immigrant family makes its move abroad, not a move to another city before it', () => {
    const s = { ...createLife({ scenario: 'immigrant' }, 5), firedEvents: {} };
    expect(s.flags['scenario:immigrant']).toBe(true);
    expect(s.flags.immigrant).toBeUndefined();
    const at8 = { ...s, character: { ...s.character, age: 8 } };
    expect(evaluateAll(at8, ev('kd_moving_house').conditions)).toBe(false);
    // After the move abroad a move inside the new country can still happen.
    expect(evaluateAll({ ...at8, flags: { ...at8.flags, immigrant: 'IN' } }, ev('kd_moving_house').conditions)).toBe(true);
    expect(evaluateAll(atAge('US', 97531, 8), ev('kd_moving_house').conditions)).toBe(true);
  });

  it('the card no longer reads "the other side of United States" or claims a move the engine does not make', () => {
    expect(ev('kd_moving_house').text).not.toMatch(/\{\{country\}\}|other side of/);
    expect(ev('kd_new_town').text).toContain('{{city}}');
  });

  it('the online friend lives across town, since a new person is always made nearby', () => {
    for (const l of lines(ev('tl_online_friend'))) expect(l).not.toMatch(/across the country|never met/i);
  });

  it('a friend met at a faraway wedding, a conference or a volunteer trip turns out to live nearby, as newPerson makes them', () => {
    for (const id of ['tr_destination_wedding', 'tr_work_trip', 'tr_volunteer_trip']) {
      const made = ev(id).choices.flatMap((c) => allEffects(c.effects)).flatMap((x) => ('newPerson' in x && x.newPerson.kind === 'friend' ? [x.newPerson.log ?? ''] : []));
      expect(made.length).toBeGreaterThan(0);
      for (const l of made) expect([id, l]).toEqual([id, expect.stringMatching(/live near me|across town|one town over/)]);
    }
  });
});

describe('warm cards skip a friend who just fell out with me', () => {
  it("after 'Tell absolutely everyone', the sleepover, the party and the yard sale do not bind that friend", () => {
    const [s, friend] = withFriend(atAge('US', 1, 11), 43);
    const r = resolveChoice(open(s, 'fs_secret_keeper', friend.id), 'broadcast', EVENT_REGISTRY);
    expect(r.people[friend.id]!.relationship).toBeLessThan(30);
    expect(r.log.at(-1)!.text).not.toMatch(/does not speak to me/);
    for (const id of ['fs_sleepover', 'kd_sleepover', 'kd_birthday_worry', 'kl_no_present_money', 'fs_blanket_fort', 'nc_block_party', 'nc_yard_sale', 'kd_game_weekend', 'fs_secret_keeper']) {
      expect([id, candidatesFor(r, ev(id).person!).some((p) => p.id === friend.id)]).toEqual([id, false]);
    }
  });

  it('every card where a friend invites, confides in, visits or helps me asks for a working friendship', () => {
    const WARM = /invited me|invite[sd]? me|sleepover|promised to be there|came to help|swore me to secrecy|showed up with|turned up with|built a blanket fort|dragged me|asked me to look after|set up a coffee|has booked a table|told me over dinner|calling me|covered in sticky notes|asked to borrow|needs a place to stay/i;
    const warm = MINE.filter((e) => !e.followUpOnly && e.person?.kind.some((k) => k === 'friend' || k === 'bestFriend') && e.person.maxRelationship === undefined && WARM.test(e.text));
    expect(warm.length).toBeGreaterThan(15);
    for (const e of warm) expect([e.id, (e.person!.minRelationship ?? 0) >= 30]).toEqual([e.id, true]);
  });
});

describe('a person a card introduces by their job is a grown-up who has it', () => {
  it('the road-trip mechanic, the street musician and the night baker carry an occupation and an adult age', () => {
    const JOB = /\b(mechanic|musician|bakery|nurse|chef|teacher|plumber|barber|farmer|photographer)\b/i;
    const made = MINE.flatMap((e) => e.choices.flatMap((c) => allEffects(c.effects).flatMap((x) => ('newPerson' in x && x.newPerson.kind !== 'coworker' && JOB.test(x.newPerson.log ?? '') ? [{ id: e.id, np: x.newPerson }] : []))));
    expect(made.map((m) => m.id).sort()).toEqual(['fs_road_trip', 'fs_street_musician', 'yp_invisible_roommate']);
    for (const { np } of made) {
      expect(np.occupation).toBeTruthy();
      expect(np.minAge ?? 0).toBeGreaterThanOrEqual(18);
    }
  });

  it('a friend who takes a job across the country is a working-age adult', () => {
    const sel = ev('fs_big_news').person!;
    expect(sel.minAge).toBeGreaterThanOrEqual(18);
    expect(sel.maxAge).toBeLessThanOrEqual(70);
  });

  it('an 18-year-old on a road trip meets a mechanic who is at least 25 and works as one', () => {
    const go = ev('fs_road_trip').choices.find((c) => c.id === 'go')!;
    const mech = allEffects(go.effects).find((x) => 'newPerson' in x)!;
    const s = atAge('US', 2, 18);
    const before = new Set(Object.keys(s.people));
    const r = applyEffects(s, new Rng(5), [mech]);
    const m = Object.values(r.people).find((p) => !before.has(p.id))!;
    expect(m.age).toBeGreaterThanOrEqual(25);
    expect(m.occupation).toBe('Mechanic');
  });
});

describe('no scene comes back a third time', () => {
  it('every repeatable card in these files rests more than half its age range (and ten years over fifteen)', () => {
    const repeatable = MINE.filter((e) => !e.followUpOnly && !e.once);
    const short = repeatable.filter((e) => {
      const span = e.maxAge - e.minAge;
      const cd = e.cooldown ?? 2;
      return cd * 2 <= span || (span >= 15 && cd < 10);
    });
    expect(short.map((e) => `${e.id} ${e.minAge}-${e.maxAge} cooldown ${e.cooldown ?? 2}`)).toEqual([]);
  });

  it('cards that settle something or discover something open once', () => {
    for (const id of ['nc_town_hall', 'fs_mystery_package', 'ya_terrible_landlord', 'tl_classmates_at_work']) expect([id, ev(id).once]).toEqual([id, true]);
  });
});

describe('cold-weather cards stay out of hot countries', () => {
  const COLD = /\bradiator(?! hose)|furnace|dead of winter|the heat went out|\bheating\b|holiday sweater|ugly sweater|all winter|\bsnow|freezing/i;

  it('every card that names a radiator, a furnace, deep winter or a holiday sweater has a climate gate without "hot"', () => {
    const cold = MINE.filter((e) => lines(e).some((l) => COLD.test(l)));
    expect(cold.map((e) => e.id)).toEqual(expect.arrayContaining(['ya_terrible_landlord', 'yp_building_super', 'tl_ugly_sweater']));
    for (const e of cold) expect([e.id, hasCond(e.conditions, (c) => 'climate' in c && !c.climate.includes('hot'))]).toEqual([e.id, true]);
  });

  it('the playtest examples no longer open in Benin City, Delhi, Pune, Brasília or Perth', () => {
    const closed = (cc: string, age: number, id: string) => {
      const s = createLife({ countryCode: cc }, 1);
      const conds = ev(id).conditions?.filter((c) => 'climate' in c || 'southern' in c);
      return !evaluateAll({ ...s, character: { ...s.character, age } }, conds);
    };
    expect(closed('NG', 25, 'ya_terrible_landlord')).toBe(true);
    expect(closed('IN', 27, 'ya_terrible_landlord')).toBe(true);
    expect(closed('IN', 13, 'tl_ugly_sweater')).toBe(true);
    expect(closed('BR', 24, 'yp_building_super')).toBe(true);
    expect(closed('AU', 14, 'tl_ugly_sweater')).toBe(true);
    expect(closed('GB', 25, 'ya_terrible_landlord')).toBe(false);
  });
});

describe('the yard sale', () => {
  const sale = () => ev('nc_yard_sale');
  const at = (age: number, lastRelease?: { age: number; juvenile: boolean }): GameState => {
    const s = atAge('US', 5, age);
    return { ...s, crime: { ...s.crime, inPrison: false, lastRelease } };
  };

  it('waits for a few decades of clutter in a home of my own', () => {
    expect(sale().minAge).toBeGreaterThanOrEqual(30);
    expect(sale().conditions).toContainEqual({ atHome: false });
    expect(evaluateAll(at(40), sale().conditions)).toBe(true);
  });

  it('does not open in the years right after a release from prison', () => {
    expect(evaluateAll(at(40, { age: 40, juvenile: false }), sale().conditions)).toBe(false);
    expect(evaluateAll(at(40, { age: 37, juvenile: false }), sale().conditions)).toBe(false);
    expect(evaluateAll(at(40, { age: 30, juvenile: false }), sale().conditions)).toBe(true);
  });
});

describe('jury duty only where ordinary people sit on juries', () => {
  it.each(['IN', 'MX', 'NG', 'DE'])('no summons in %s', (cc) => {
    const s = createLife({ countryCode: cc }, 4321);
    expect(evaluateAll({ ...s, character: { ...s.character, age: 40 } }, ev('nc_jury_duty').conditions)).toBe(false);
  });

  it('a summons in the United States, and the deliberation does not count the jurors', () => {
    const s = createLife({ countryCode: 'US' }, 4321);
    expect(evaluateAll({ ...s, character: { ...s.character, age: 40 } }, ev('nc_jury_duty').conditions)).toBe(true);
    for (const l of lines(ev('nc_jury_verdict'))) expect(l).not.toMatch(/eleven|twelve/i);
  });

  it.each([
    ['JP', 2005, false],
    ['JP', 2012, true],
    ['ES', 1994, false],
    ['ES', 2000, true],
  ] as const)('in %s in %i a summons is %s (lay jurors from 2009 in Japan, 1996 in Spain)', (cc, year, ok) => {
    const s = createLife({ countryCode: cc }, 4321);
    const at = { ...s, year, character: { ...s.character, age: 30 } };
    expect(evaluateAll(at, ev('nc_jury_duty').conditions)).toBe(ok);
  });
});

describe('words for the people at home', () => {
  it('a line after a {{parents}} choice names them again instead of saying "They"', () => {
    for (const e of MINE) for (const c of e.choices) if (c.label.includes('{{parents}}')) for (const l of logs(c.effects)) expect([e.id, l]).not.toEqual([e.id, expect.stringMatching(/^They\b/)]);
  });

  it('American English: no corner shop, kettle, cheeky note, full stop or top mark', () => {
    const BRIT = /corner shop|put the kettle on|\bcheeky\b|full stop|top mark|\bcar park\b|\bmotorbike/i;
    for (const e of MINE) for (const l of lines(e)) expect([e.id, BRIT.test(l)]).toEqual([e.id, false]);
  });

  it('the free piano is sold through a classified ad, which needs no era gate', () => {
    const sell = ev('nc_free_piano').choices.find((c) => c.id === 'sell')!;
    expect(sell.label).not.toMatch(/online/i);
    expect(sell.conditions ?? []).toEqual([]);
    for (const l of logs(sell.effects)) expect(l).not.toMatch(/online|internet|sign\b/i);
  });
});

describe('every choice trades something (childhood, neighborhood and pet files)', () => {
  // The same expected-value metric as youthContent.test.ts, run over the files that test does not cover.
  type Vec = Record<string, number>;
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

  it('no choice beats every other choice a player can see beside it', () => {
    const dominant = new Set<string>();
    for (const e of [...KID_YEARS_EVENTS, ...KID_LIFE_EVENTS, ...NEIGHBOURS_AND_COMMUNITY_EVENTS, ...PET_EVENTS]) {
      for (const shown of visibleSets(e.choices)) {
        const priced: Priced[] = shown.map((c) => ({ c, v: vec(c.effects) }));
        for (const a of priced) if (priced.every((b) => b === a || beats(a, b))) dominant.add(`${e.id}/${a.c.id}`);
      }
    }
    expect([...dominant]).toEqual([]);
  });
});
