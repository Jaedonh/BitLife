/**
 * The notes the third playtest's fix groups left for each other, applied once their work was merged: card money in the
 * currency of the year, partners and coworkers a card makes fit the player and the card, a grown child still at home
 * lives with me, nobody is named after their own surname, the rest of the move-back-home story, the appendix comes
 * out once, a partner far away can neither start a baby by phone nor stay far away once married, cards with a real
 * choice for a broke player, fixed scenes that rest, and corporate cards that need someone to answer to.
 */
import { EVENTS } from '@/data/events';
import { FLAVOR } from '@/data/flavor';
import { JOB_BY_ID } from '@/data/jobs';
import { applyAction } from '../actions';
import { candidatesFor, evaluateAll } from '../events/conditions';
import { applyEffects } from '../events/effects';
import type { Effect, EventDef } from '../events/schema';
import { isEligible } from '../events/select';
import { renderText } from '../events/text';
import { Rng } from '../rng';
import { takeInOrphan } from '../systems/aging';
import { createLife, emptyMemory, makePerson } from '../systems/character';
import { COWORKER_FRIEND_AT, hireCoworkers, workplaceOf } from '../systems/coworkers';
import { addGrandchild, markChildMilestone } from '../systems/family';
import { availableInteractions, interact } from '../systems/relationships';
import { relocateCity } from '../systems/scenarios';
import { NAMES } from '@/data/names';
import type { GameState, Job, Person, RelationshipKind } from '../types';

const ev = (id: string): EventDef => {
  const d = EVENTS.find((e) => e.id === id);
  if (!d) throw new Error(`no event ${id}`);
  return d;
};
const choice = (id: string, c: string) => ev(id).choices.find((x) => x.id === c)!;

function effectsOf(effects: readonly Effect[]): Effect[] {
  return effects.flatMap((e) => [e, ...('chance' in e ? [...effectsOf(e.then), ...effectsOf(e.else ?? [])] : []), ...('random' in e ? e.random.flatMap((o) => effectsOf(o.effects)) : [])]);
}

/** An adult with nobody in their life, no job, no assets and no history of cards. */
function adult(age: number, opts: { countryCode?: string; year?: number; people?: Person[] } = {}): GameState {
  const s = createLife({ countryCode: opts.countryCode ?? 'US', gender: 'female', firstName: 'Nora' }, 11);
  return {
    ...s,
    year: opts.year ?? 2020,
    people: Object.fromEntries((opts.people ?? []).map((p) => [p.id, p])),
    assets: [],
    firedEvents: {},
    eventQueue: [],
    pendingEvent: null,
    flags: {},
    finances: { ...s.finances, cash: 50_000 },
    character: { ...s.character, age, birthYear: (opts.year ?? 2020) - age },
  };
}

let ids = 0;
function person(kind: RelationshipKind, patch: Partial<Person> = {}): Person {
  const p = makePerson(new Rng(++ids), { kind, age: 40, countryCode: 'US', playerAge: 30, gender: patch.gender ?? 'female' });
  return { ...p, id: `${kind}_${ids}`, memory: emptyMemory(30), ...patch };
}

function job(defId: string, level: number, company = 'Keystone Group'): Job {
  const def = JOB_BY_ID[defId]!;
  return {
    defId, title: def.ladder[level]!.title, company, salary: def.ladder[level]!.salary, level, performance: 70, yearsHeld: 6, yearsAtLevel: 3,
    category: def.category, partTime: def.partTime === true, askedThisYear: false, workedHarderThisYear: false,
  };
}
const working = (s: GameState, j: Job): GameState => ({ ...s, career: { ...s.career, job: j, retired: false } });

describe('card money in the currency of the year', () => {
  it('a card says lire before the euro and euros after it, as the journal does', () => {
    const it1995 = adult(30, { countryCode: 'IT', year: 1995 });
    expect(renderText('It cost {{$100}}.', it1995)).toMatch(/^It cost [\d,.]+K? lire\.$/);
    expect(renderText('It cost {{$100}}.', { ...it1995, year: 2010 })).toMatch(/^It cost €\d+\.$/);
    expect(renderText('It cost {{$100}}.', { ...it1995, character: { ...it1995.character, countryCode: 'GB' } })).toMatch(/^It cost £\d+\.$/);
  });

  it('no line writes "a {{$N}} fine": with a currency named after the amount it would read "a 300 francs fine"', () => {
    const AMOUNT_AS_ADJECTIVE = /\b[Aa]n? \{\{\$\d+\}\} [a-z]/;
    // Nor "the {{$25}} starter fee", "a one-time {{$2500}} adjustment" or a hint of "{{$75}} filing fee" ("120 marks
    // filing fee"): the amount follows its noun ("a fine of {{$300}}", "{{$75}} to file", "{{$900}} in moving costs").
    const AMOUNT_BEFORE_NOUN =
      /\{\{\$\d+\}\} (fine|fee|fees|bonus|bill|gap|adjustment|deductible|deposit|flights?|fare|costs?|cash|gift|limit|urn|bumper|scholarship|thank-you|amenity|starter|filing|moving|bus|check|cheque|loan|prize|tip|ticket|charge|payment|refund|voucher|budget|settlement|reward|donation|salary|rent|monthly|weekly|yearly)\b/;
    const logs = (effects: readonly Effect[]) =>
      effectsOf(effects).flatMap((e) => ('log' in e ? [e.log] : 'newPerson' in e && e.newPerson.log ? [e.newPerson.log] : []));
    const texts = [
      ...EVENTS.flatMap((d) => [d.text, ...d.choices.flatMap((c) => [c.label, c.hint ?? '', ...logs(c.effects)])]),
      ...FLAVOR.map((f) => f.text),
    ];
    expect(texts.filter((t) => AMOUNT_AS_ADJECTIVE.test(t) || AMOUNT_BEFORE_NOUN.test(t))).toEqual([]);
  });
});

describe('people a card makes fit the card and the player', () => {
  it("a coworker's title fits the age the card drew, rather than the age being pulled to the title", () => {
    // A new hire of 22-23 at a VP's company is a management trainee, not a CEO of 34.
    const s = working(adult(45), job('executive', 3));
    for (let seed = 1; seed <= 25; seed++) {
      const after = applyEffects(s, new Rng(seed), [{ newPerson: { kind: 'coworker', minAge: 22, maxAge: 23 } }]);
      const hire = Object.values(after.people).find((p) => p.kind === 'coworker')!;
      expect([seed, hire.age >= 22 && hire.age <= 23, hire.occupation]).toEqual([seed, true, 'Management Trainee']);
    }
  });

  it('a partner a card brings follows the player leaning, as the yearly roll does', () => {
    const sameSex = (s: GameState) => {
      let n = 0;
      for (let seed = 1; seed <= 40; seed++) {
        const after = applyEffects(s, new Rng(seed), [{ newPerson: { kind: 'lover' } }]);
        const lover = Object.values(after.people).find((p) => p.kind === 'lover')!;
        if (lover.gender === s.character.gender) n++;
      }
      return n;
    };
    const fresh = adult(30);
    const settled = { ...fresh, character: { ...fresh.character, partnerYears: { same: 30, other: 0 } } };
    expect(sameSex(fresh)).toBeLessThanOrEqual(10);
    expect(sameSex(settled)).toBeGreaterThanOrEqual(32);
    // A card that names the partner's gender keeps it.
    const named = applyEffects(settled, new Rng(1), [{ newPerson: { kind: 'lover', gender: 'male' } }]);
    expect(Object.values(named.people).find((p) => p.kind === 'lover')!.gender).toBe('male');
  });

  it("a card's lone minAge (or maxAge) is a floor (or a ceiling) on someone about my age, not a wider range", () => {
    const at70 = adult(70);
    const ages = (spec: Extract<Effect, { newPerson: unknown }>['newPerson']) =>
      Array.from({ length: 30 }, (_, i) => Object.values(applyEffects(at70, new Rng(i + 1), [{ newPerson: spec }]).people)[0]!.age);
    expect(ages({ kind: 'friend', minAge: 18 }).every((a) => a >= 66 && a <= 74)).toBe(true);
    expect(new Set(ages({ kind: 'friend', maxAge: 35 }))).toEqual(new Set([35]));
    expect(ages({ kind: 'friend', minAge: 20, maxAge: 22 }).every((a) => a >= 20 && a <= 22)).toBe(true);
    // A teenager's grown-up stranger is just grown up (18-19), not a range that runs backwards.
    const at15 = adult(15);
    for (let seed = 1; seed <= 10; seed++) {
      const age = Object.values(applyEffects(at15, new Rng(seed), [{ newPerson: { kind: 'friend', minAge: 18 } }]).people)[0]!.age;
      expect([seed, age >= 18 && age <= 19]).toEqual([seed, true]);
    }
  });

  it('a coworker with small kids at home is not 67; the new hire and the mentee are early in their careers', () => {
    expect(ev('cw_shift_swap').person).toMatchObject({ kind: ['coworker'], minAge: 24, maxAge: 50 });
    for (const [id, lo, hi] of [['wk_new_hire', 18, 35], ['cw_mentor_new_hire', 20, 40]] as const) {
      const made = ev(id).choices.flatMap((c) => effectsOf(c.effects)).filter((e): e is Extract<Effect, { newPerson: unknown }> => 'newPerson' in e);
      expect(made.length).toBeGreaterThan(0);
      for (const e of made) expect([id, e.newPerson.minAge, e.newPerson.maxAge]).toEqual([id, lo, hi]);
      // No new hire on the bench: a magistrate, the first rung, is 40 or more, so the card's range could not hold.
      expect([id, evaluateAll(working(adult(45), job('judge', 1, 'the Chicago District Court')), ev(id).conditions)]).toEqual([id, false]);
    }
    // The new hire's age stays in the card's range whatever the ladder (the title follows the age).
    for (const defId of Object.values(JOB_BY_ID).filter((d) => !d.partTime && d.id !== 'judge').map((d) => d.id)) {
      const s = working(adult(40), job(defId, 1));
      for (let seed = 1; seed <= 6; seed++) {
        const after = applyEffects(s, new Rng(seed), [{ newPerson: { kind: 'coworker', minAge: 18, maxAge: 35 } }]);
        const hire = Object.values(after.people).find((p) => p.kind === 'coworker')!;
        expect([defId, seed, hire.age >= 18 && hire.age <= 35]).toEqual([defId, seed, true]);
      }
    }
  });
});

describe('a grown child who has not moved out lives with me', () => {
  it('household cards bind a grown child still at home, not one who moved out', () => {
    const home = person('child', { age: 21, growth: { movedOut: false } });
    const gone = person('child', { age: 21, growth: { movedOut: true } });
    const small = person('child', { age: 9 });
    const s = adult(50, { people: [home, gone, small] });
    expect(candidatesFor(s, { kind: ['child'], household: true }).map((p) => p.id).sort()).toEqual([home.id, small.id].sort());
  });
});

describe('nobody is named after their own surname', () => {
  it('an aunt or uncle from the Bello side is never Bello Bello', () => {
    for (let seed = 1; seed <= 400; seed++) {
      const mother = person('mother', { alive: false, lastName: 'Bello', gender: 'female', age: 40 });
      const base = adult(10, { countryCode: 'NG', people: [mother] });
      const s = { ...base, character: { ...base.character, lastName: 'Okafor' } };
      const after = takeInOrphan(s, [mother], new Rng(seed));
      const carer = Object.values(after.people).find((p) => p.relative)!;
      expect([seed, carer.lastName]).toEqual([seed, 'Bello']);
      expect([seed, carer.firstName === carer.lastName]).toEqual([seed, false]);
    }
  });

  it("a grandchild and a child's spouse never take the household's surname as a first name", () => {
    const pool = NAMES.anglo.male;
    // Every other male name is taken, so only "Thomas", the surname, would be left.
    const others = new Set(pool.filter((n) => n !== 'Thomas'));
    const son = person('child', { age: 30, gender: 'male', lastName: 'Thomas', growth: { movedOut: true, spouse: { firstName: 'Ava', gender: 'female' } } });
    for (let seed = 1; seed <= 40; seed++) {
      const after = addGrandchild(adult(58, { people: [son] }), new Rng(seed), son.id, others);
      const baby = Object.values(after.people).find((p) => p.kind === 'grandchild')!;
      expect([seed, baby.firstName === baby.lastName]).toEqual([seed, false]);
    }
    const friends = [...others].map((firstName) => person('friend', { firstName, gender: 'male' }));
    const daughter = person('child', { age: 28, gender: 'female', lastName: 'Thomas', growth: { movedOut: true } });
    for (let seed = 1; seed <= 40; seed++) {
      const after = markChildMilestone(adult(55, { people: [daughter, ...friends] }), new Rng(seed), daughter.id, 'married');
      expect([seed, after.people[daughter.id]!.growth!.spouse!.firstName === 'Thomas']).toEqual([seed, false]);
    }
  });
});

describe('moving back home, the rest of the story', () => {
  it('buying a home ends living back home at once, not at the next birthday', () => {
    const mom = person('mother', { age: 55 });
    const base = adult(25, { people: [mom] });
    const s = { ...base, flags: { home_with_parents: true }, finances: { ...base.finances, cash: 500_000 } };
    const after = applyAction(s, { type: 'buyAsset', defId: 'studio', financing: 'cash' });
    expect(after.assets.some((a) => a.kind === 'house')).toBe(true);
    expect(after.flags.home_with_parents).toBeUndefined();
  });

  it('no "first apartment" ever follows the card about rent going up, even after I move out again', () => {
    const s = working(adult(24), job('retail', 0));
    expect(evaluateAll(s, ev('ya_first_apartment').conditions)).toBe(true);
    expect(evaluateAll({ ...s, firedEvents: { ya_move_back_home: 22 } }, ev('ya_first_apartment').conditions)).toBe(false);
  });

  it('the house rules wait for me to live there as the engine counts it, never for someone married', () => {
    const mom = person('mother', { age: 55 });
    const s = { ...adult(24, { people: [mom] }), flags: { home_with_parents: true } };
    expect(evaluateAll(s, ev('ya_house_rules').conditions)).toBe(true);
    const married = { ...s, people: { ...s.people, sp: person('spouse', { id: 'sp' }) } };
    expect(evaluateAll(married, ev('ya_house_rules').conditions)).toBe(false);
  });
});

describe('the appendix comes out once', () => {
  it('neither appendix card opens after appendicitis was had, or after the other card', () => {
    const teen = { ...adult(20, { people: [person('mother', { age: 50 })] }) };
    expect(isEligible(teen, ev('hl_appendix_pain'))).toBe(true);
    expect(isEligible({ ...teen, flags: { 'had:appendicitis': 12 } }, ev('hl_appendix_pain'))).toBe(false);
    expect(isEligible({ ...teen, firedEvents: { kl_appendicitis: 9 } }, ev('hl_appendix_pain'))).toBe(false);
    const kid = { ...adult(9, { people: [person('mother', { age: 38 })] }) };
    expect(isEligible(kid, ev('kl_appendicitis'))).toBe(true);
    expect(isEligible({ ...kid, flags: { 'had:appendicitis': 7 } }, ev('kl_appendicitis'))).toBe(false);
  });

  it('a branch that narrates the emergency surgery leaves no appendicitis behind to treat', () => {
    const all = ev('hl_appendix_pain').choices.flatMap((c) => effectsOf(c.effects));
    expect(all.filter((e) => 'illness' in e)).toEqual([]);
  });
});

describe('a partner far away', () => {
  it('is not offered "Try for a baby" by phone', () => {
    const lover = person('lover', { age: 30, love: 90, relationship: 90, farAway: true, gender: 'male' });
    const s = adult(30, { people: [lover] });
    expect(availableInteractions(s, lover).map((d) => d.id)).not.toContain('haveChild');
    const after = interact(s, new Rng(1), lover.id, 'haveChild');
    expect(after.lastResult?.text).toBe('They live far away now.');
  });

  it('moves in at the wedding: a spouse never lives far away', () => {
    const lover = person('lover', { age: 30, love: 100, relationship: 100, farAway: true, gender: 'male' });
    let married: GameState | undefined;
    for (let seed = 1; seed <= 30 && !married; seed++) {
      const after = interact(adult(30, { people: [lover] }), new Rng(seed), lover.id, 'propose');
      if (after.people[lover.id]!.kind === 'spouse') married = after;
    }
    expect(married).toBeDefined();
    expect(married!.people[lover.id]!.farAway).toBeUndefined();
  });
});

describe('a close coworker kept on a move to another city', () => {
  it('stays a friend far away, with the last day together and the goodbye recorded', () => {
    const j = job('accountant', 1);
    const close = person('coworker', { age: 35, relationship: COWORKER_FRIEND_AT + 5, workplace: workplaceOf(j) });
    const s = working(adult(36, { people: [close] }), j);
    const after = relocateCity(s, new Rng(4));
    const friend = after.people[close.id]!;
    expect(friend.kind).toBe('friend');
    expect(friend.farAway).toBe(true);
    expect(friend.memory.togetherUntil).toBe(36);
    expect(friend.memory.lastInteractionAge).toBe(36);
  });
});

describe('a card written with a real choice keeps one for a broke player', () => {
  it('every random card with two or more choices has at least two that cost nothing to pick', () => {
    const paid = (c: EventDef['choices'][number]) => JSON.stringify(c.conditions ?? []).includes('"money"');
    const short = EVENTS.filter((d) => !d.followUpOnly && d.choices.length >= 2 && d.choices.filter((c) => !paid(c)).length < 2).map((d) => d.id);
    expect(short).toEqual([]);
  });
});

describe('fixed scenes rest long enough never to open a third time', () => {
  it.each([
    'cp_falsely_accused', 'hl_food_poisoning', 'mn_wedding_gift', 'cw_cake_vote', 'mn_mlm_pitch', 'mc_work_short_staffed', 'cp_pickpocketed',
    'mc_friend_celebration', 'mn_friend_loan', 'cp_cheap_phone', 'ad_hoa_door', 'ad_new_neighbours', 'ad_neighbour_noise', 'ad_neighbour_fence',
    'ad_renovation_disaster', 'lf_meet_their_parents',
  ])('%s is once, or rests more than half its age range', (id) => {
    const d = ev(id);
    expect(d.once === true || (d.cooldown ?? 2) * 2 > d.maxAge - d.minAge).toBe(true);
  });
});

describe('corporate cards need someone to answer to', () => {
  const offices: [string, number, string][] = [
    ['politician', 4, 'Chicago City Hall'], ['politician', 1, 'Chicago City Hall'], ['judge', 2, 'the Chicago District Court'], ['military', 5, 'the Army'],
    ['executive', 4, 'Granite Corp'], ['hairdresser', 3, 'Granite Salon'], ['lawyer', 4, 'Granite LLP'],
  ];
  const at = (defId: string, level: number, company: string, age: number) => working(adult(age, { year: 2020 }), job(defId, level, company));

  it.each(['hd_holiday_shift', 'tm_old_photo_at_work', 'tm_password_sticky_note', 'tm_video_call_mishap', 'tr_work_trip', 'ya_networking_mixer', 'wk_harassment_witness'])(
    '%s does not reach the top rung, an owner, an elected seat, a bench or a rank',
    (id) => {
      const d = ev(id);
      for (const [defId, level, company] of offices) {
        const s = at(defId, level, company, Math.min(d.maxAge, Math.max(d.minAge, 45)));
        const withCoworker = { ...s, people: { cw: person('coworker', { id: 'cw', age: 40, relationship: 50, workplace: workplaceOf(s.career.job!) }) } };
        expect([id, defId, level, isEligible(withCoworker, d)]).toEqual([id, defId, level, false]);
      }
      // An employee with a boss still gets it.
      const desk = at('accountant', 1, 'Granite Corp', Math.min(d.maxAge, Math.max(d.minAge, 28)));
      const deskCw = { ...desk, people: { cw: person('coworker', { id: 'cw', age: 28, relationship: 50, workplace: workplaceOf(desk.career.job!) }) } };
      const ok = id === 'hd_holiday_shift' || id === 'wk_harassment_witness' ? isEligible(deskCw, d) : evaluateAll(deskCw, d.conditions);
      expect([id, ok]).toEqual([id, true]);
    },
  );

  it('choices that talk to "my manager" or "the boss" wait for one', () => {
    for (const [id, c] of [['ad_burnout', 'talk'], ['hd_office_party', 'network'], ['wk_counter_offer', 'leverage']] as const) {
      const ceo = at('executive', 4, 'Granite Corp', 45);
      expect([id, c, evaluateAll(ceo, choice(id, c).conditions)]).toEqual([id, c, false]);
      expect([id, c, evaluateAll(at('executive', 2, 'Granite Corp', 45), choice(id, c).conditions)]).toEqual([id, c, true]);
    }
    const senator = at('politician', 4, 'Chicago City Hall', 50);
    expect(evaluateAll(senator, choice('ad_burnout', 'talk').conditions)).toBe(false);
  });

  it('a CEO is not sent on the retreat, and no partner above the managing partner asks for the shredder', () => {
    expect(evaluateAll(at('executive', 4, 'Granite Corp', 45), ev('wk_company_retreat').conditions)).toBe(false);
    expect(evaluateAll(at('lawyer', 4, 'Granite LLP', 45), ev('wk_shred_documents').conditions)).toBe(false);
    expect(evaluateAll(at('lawyer', 2, 'Granite LLP', 45), ev('wk_shred_documents').conditions)).toBe(true);
  });

  it('the reply-all and the six-month sabbatical are for a company, not a council chamber or a courthouse', () => {
    for (const id of ['tm_reply_all', 'tr_sabbatical']) {
      expect([id, evaluateAll(at('politician', 2, 'Chicago City Hall', 45), ev(id).conditions)]).toEqual([id, false]);
      expect([id, evaluateAll(at('judge', 1, 'the Chicago District Court', 45), ev(id).conditions)]).toEqual([id, false]);
    }
  });
});

describe('nobody at the top, in an elected seat, on the bench or in uniform is told about "my boss"', () => {
  const at = (defId: string, level: number, company: string, age: number) => working(adult(age, { year: 2020 }), job(defId, level, company));

  it('no card or choice open to them talks about my boss, my manager or my supervisor', () => {
    const BOSS = /\b(my boss|my manager|my supervisor|the boss|boss's)\b/i;
    const cases: [string, number, string][] = [
      ['politician', 1, 'Chicago City Hall'], ['politician', 4, 'Chicago City Hall'], ['judge', 0, 'the Chicago District Court'], ['judge', 3, 'the Chicago District Court'],
      ['military', 0, 'the Army'], ['military', 5, 'the Army'],
      ...Object.values(JOB_BY_ID).filter((d) => !d.partTime).map((d): [string, number, string] => [d.id, d.ladder.length - 1, 'Granite Co']),
    ];
    const found = new Set<string>();
    for (const [defId, level, company] of cases) {
      for (const age of [30, 45, 60]) {
        for (const low of [false, true]) {
          let s = hireCoworkers(at(defId, level, company, age), new Rng(5));
          s = { ...s, crime: { ...s.crime, record: true }, people: Object.fromEntries(Object.entries(s.people).map(([k, p]) => [k, { ...p, relationship: 66, metAtAge: age - 2, age: Math.max(p.age, 56) }])) };
          // Low spirits and health open the burnout cards.
          if (low) s = { ...s, character: { ...s.character, stats: { ...s.character.stats, happiness: 35, health: 45 } } };
          for (const d of EVENTS) {
            if (d.followUpOnly || age < d.minAge || age > d.maxAge || !isEligible(s, d)) continue;
            for (const c of d.choices) {
              if (!evaluateAll(s, c.conditions)) continue;
              const texts = [d.text, c.label, ...effectsOf(c.effects).flatMap((e) => ('log' in e ? [e.log] : []))];
              if (texts.some((t) => BOSS.test(t))) found.add(`${d.id}/${c.id} (${defId} ${level})`);
            }
          }
        }
      }
    }
    expect([...found]).toEqual([]);
  });

  it('the burnout talk, the screaming customer, the background check, the coffee rota and the reorg need someone above me', () => {
    const ceo = at('executive', 4, 'Granite Corp', 45);
    const mayor = at('politician', 2, 'Chicago City Hall', 45);
    const director = at('executive', 2, 'Granite Corp', 45);
    expect(evaluateAll(ceo, choice('wk_burnout', 'talk').conditions)).toBe(false);
    expect(evaluateAll(mayor, choice('wk_burnout', 'talk').conditions)).toBe(false);
    expect(evaluateAll(director, choice('wk_burnout', 'talk').conditions)).toBe(true);
    // A restaurant manager has nobody to hand the screamer to; a waiter does.
    expect(evaluateAll(at('waiter', 2, 'Granite Diner', 30), ev('wk_client_scream').conditions)).toBe(false);
    expect(evaluateAll(at('waiter', 0, 'Granite Diner', 30), ev('wk_client_scream').conditions)).toBe(true);
    const record = (s: GameState) => ({ ...s, crime: { ...s.crime, record: true } });
    for (const s of [ceo, mayor, at('judge', 1, 'the Chicago District Court', 45), at('military', 3, 'the Army', 45)]) {
      expect(evaluateAll(record(s), ev('cp_record_found_out').conditions)).toBe(false);
      expect(evaluateAll(s, ev('wk_coffee_rota').conditions)).toBe(false);
    }
    expect(evaluateAll(record(director), ev('cp_record_found_out').conditions)).toBe(true);
    expect(evaluateAll(director, ev('wk_coffee_rota').conditions)).toBe(true);
    // The office manager at the top of the receptionist's ladder has no new boss to ask about; the coordinator below does.
    expect(evaluateAll(at('receptionist', 2, 'Granite Corp', 40), ev('mc_work_reorg').conditions)).toBe(false);
    expect(evaluateAll(at('receptionist', 1, 'Granite Corp', 40), ev('mc_work_reorg').conditions)).toBe(true);
    expect(evaluateAll(at('bank_teller', 2, 'Granite Bank', 40), choice('mc_work_missing_money', 'flag').conditions)).toBe(false);
    expect(evaluateAll(at('bank_teller', 1, 'Granite Bank', 40), choice('mc_work_missing_money', 'flag').conditions)).toBe(true);
  });
});

describe('an assault on the wrong man is a crime', () => {
  it('the neighborhood-watch tackle that ends in a year for assault counts as one', () => {
    const confront = effectsOf(choice('nc_neighbourhood_watch', 'confront').effects);
    const jailing = confront.filter((e): e is Extract<Effect, { random: unknown }> => 'random' in e).flatMap((e) => e.random).find((o) => o.effects.some((x) => 'prison' in x))!;
    expect(jailing.effects).toContainEqual({ counter: 'crimes' });
  });
});
