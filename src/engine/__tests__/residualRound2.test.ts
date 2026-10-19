/**
 * The notes the second playtest's fix groups left for each other, applied once their work was merged: the grief
 * window knows which partner died, a grown-up who moves leaves parents and siblings behind, friends met far from home
 * live there, coworkers' titles fit the country and the era, a married surname keeps the birth one, a partner who
 * leaves takes the couple's flags along, a move keeps nearby friends, names stay taken for the year, one jury list,
 * a card's house is the one I live in, job history names the job, and a few wording fixes.
 */
import { EVENTS } from '@/data/events';
import { JURY_TRIALS } from '@/data/events/justice_and_reentry';
import { JOB_BY_ID } from '@/data/jobs';
import { ageUp } from '../ageUp';
import { candidatesFor, evaluateCondition } from '../events/conditions';
import { applyEffects } from '../events/effects';
import { EVENT_REGISTRY } from '../events/registry';
import { validateEvent, type Condition, type Effect, type EventDef } from '../events/schema';
import { isEligible, openNextEvent, resolveChoice } from '../events/select';
import { Rng } from '../rng';
import { ageNpcs } from '../systems/aging';
import { createLife, emptyMemory, makePerson, namesInJournalThisYear } from '../systems/character';
import { coworkerTitle, hireCoworkers } from '../systems/coworkers';
import { careerSpans, markDeath } from '../systems/death';
import { interact } from '../systems/relationships';
import type { Asset, GameState, Job, Person, RelationshipKind } from '../types';

const EVENT = (id: string): EventDef => EVENT_REGISTRY.byId[id]!;

/** A life of `countryCode` at `age` in `year`, with no people, cards or history unless given. */
function life(age: number, people: Person[] = [], opts: { countryCode?: string; year?: number; patch?: Partial<GameState> } = {}): GameState {
  const s = createLife({ countryCode: opts.countryCode ?? 'US', gender: 'female', firstName: 'Nora' }, 41);
  const year = opts.year ?? 2030;
  return {
    ...s,
    people: Object.fromEntries(people.map((p) => [p.id, p])),
    year,
    character: { ...s.character, age, birthYear: year - age },
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

const bound = (s: GameState, id: string) => candidatesFor(s, EVENT(id).person!).map((p) => p.id);
const JOB = (defId: string, level: number, title: string): Job => ({ defId, title, company: 'Granite & Sons', salary: 60_000, level, performance: 70, yearsHeld: 4, yearsAtLevel: 2, category: JOB_BY_ID[defId]!.category, partTime: false, askedThisYear: false, workedHarderThisYear: false });

function allEffects(effects: readonly Effect[]): Effect[] {
  return effects.flatMap((e) => [e, ...('chance' in e ? [...allEffects(e.then), ...allEffects(e.else ?? [])] : 'random' in e ? e.random.flatMap((o) => allEffects(o.effects)) : [])]);
}
function lines(d: EventDef): string[] {
  const out = [d.title, d.text];
  for (const c of d.choices) {
    out.push(c.label);
    for (const e of allEffects(c.effects)) {
      if ('log' in e) out.push(e.log);
      if ('newPerson' in e && e.newPerson.log) out.push(e.newPerson.log);
    }
  }
  return out;
}

describe('the grief window knows which partner died', () => {
  it('a death records the player age at it, natural or on a card', () => {
    const frail = person('spouse', { age: 104, health: 1, love: 80 });
    let s = life(70, [frail]);
    for (let i = 0; i < 40 && s.people[frail.id]!.alive; i++) s = ageNpcs({ ...s, character: { ...s.character, age: s.character.age + 1 } }, new Rng(i));
    expect(s.people[frail.id]!.alive).toBe(false);
    expect(s.people[frail.id]!.lostAtAge).toBe(s.character.age);
    const lover = person('lover', { age: 50, love: 70 });
    const after = applyEffects(life(52, [lover]), new Rng(1), [{ log: 'I lost {{person}}.' }, { stat: 'happiness', delta: -20 }, { personDies: true }], { personId: lover.id });
    expect(after.people[lover.id]!.lostAtAge).toBe(52);
  });

  it('diedWithin binds only someone lost recently; an undated death in an older save never matches', () => {
    const recent = person('spouse', { alive: false, deathAge: 60, lostAtAge: 62 });
    const old = person('spouse', { alive: false, deathAge: 50, lostAtAge: 52 });
    const undated = person('spouse', { alive: false, deathAge: 61 });
    const s = life(63, [recent, old, undated]);
    expect(candidatesFor(s, { kind: ['spouse'], alive: false, diedWithin: 1 }).map((p) => p.id)).toEqual([recent.id]);
    expect(candidatesFor(s, { kind: ['spouse'], alive: false, diedWithin: 11 }).map((p) => p.id).sort()).toEqual([recent.id, old.id].sort());
  });

  it("a girlfriend's death years after the wife's does not bring back the casseroles for the wife (the playtest repro)", () => {
    // Married once; the wife died at 58, a girlfriend at 62: the grieving flag holds 62.
    const wife = person('spouse', { alive: false, deathAge: 57, lostAtAge: 58, gender: 'female', mourned: true, marriedAtAge: 30 });
    const girlfriend = person('lover', { alive: false, deathAge: 60, lostAtAge: 62, gender: 'female', mourned: true });
    const s = life(63, [wife, girlfriend], { patch: { flags: { grieving: 62 }, counters: { ...life(63).counters, marriages: 1 } } });
    for (const id of ['gu_widowed_casseroles', 'gu_widowed_old_number', 'gu_widowed_closet', 'gy_widow_two_cups', 'gy_widow_closet', 'gy_widow_recipe']) {
      expect([id, isEligible(s, EVENT(id))]).toEqual([id, false]);
    }
    // The year after the wife's own death, they open for her.
    const fresh = life(59, [{ ...wife }], { patch: { flags: { grieving: 58 }, counters: { ...life(59).counters, marriages: 1 } } });
    expect(isEligible(fresh, EVENT('gu_widowed_casseroles'))).toBe(true);
    expect(bound(fresh, 'gu_widowed_casseroles')).toEqual([wife.id]);
  });

  it('the validator wants diedWithin on the dead only', () => {
    const card = (sel: EventDef['person']): EventDef => ({ id: 'gu_test_loss', category: 'family', title: 'Gone', text: 'I miss {{person}}.', minAge: 20, maxAge: 90, weight: 1, person: sel, choices: [{ id: 'a', label: 'Remember', effects: [{ log: 'I remembered.' }] }, { id: 'b', label: 'Look away', effects: [{ log: 'I looked away.' }] }] });
    expect(validateEvent(card({ kind: ['spouse'], alive: false, diedWithin: 1 }), new Set())).toEqual([]);
    expect(validateEvent(card({ kind: ['spouse'], diedWithin: 1 }), new Set()).join(' ')).toMatch(/diedWithin/);
  });
});

describe('a grown-up who moves for work leaves parents and siblings behind', () => {
  const working = (people: Person[]): GameState => life(35, people, { patch: { career: { ...life(35).career, job: JOB('accountant', 1, 'Accountant') } } });

  it('taking the promotion in another city: Mom lives far away, calls still reach her, a house call does not', () => {
    const mom = person('mother', { age: 64, gender: 'female', relationship: 70 });
    const brother = person('sibling', { age: 38, gender: 'male', relationship: 60 });
    const spouse = person('spouse', { age: 36, gender: 'male', love: 70, marriedAtAge: 30 });
    let s: GameState = { ...working([mom, brother, spouse]), eventQueue: [{ eventId: 'wk_promotion_relocation', context: {} }] };
    s = openNextEvent(s, EVENT_REGISTRY);
    expect(s.pendingEvent?.eventId).toBe('wk_promotion_relocation');
    s = resolveChoice(s, 'take', EVENT_REGISTRY);
    expect(s.people[mom.id]!.farAway).toBe(true);
    expect(s.people[brother.id]!.farAway).toBe(true);
    expect(s.people[spouse.id]!.farAway).toBeUndefined();
    // A phone call, a letter or a post online reaches them; dinner, a visit or a house call does not.
    expect(bound(s, 'hl_relative_diagnosis')).toEqual(expect.arrayContaining([mom.id, brother.id]));
    expect(bound(s, 'tm_sibling_video')).toEqual([brother.id]);
    expect(bound(s, 'ad_parent_tech_support')).toEqual([]);
    expect(bound(s, 'gu_settle_down')).toEqual([]);
    expect(evaluateCondition(s, { hasPerson: ['mother'] })).toBe(false);
  });

  it('a card that reaches family far away has no in-person choice', () => {
    const remote = EVENTS.filter((d) => d.person?.farAway === 'any' && d.person.kind.some((k) => ['mother', 'father', 'stepmother', 'stepfather', 'sibling'].includes(k)));
    expect(remote.map((d) => d.id)).toEqual(expect.arrayContaining(['hl_relative_diagnosis', 'hl_relative_prognosis', 'pl_letter_mother', 'tm_sibling_video', 'jr_parole_travel']));
    for (const d of remote) for (const c of d.choices) expect([d.id, c.label]).not.toEqual([d.id, expect.stringMatching(/go over|come over|visit (me|us)|spend the day|drop by|teach/i)]);
  });
});

describe('friends met far from home live there', () => {
  it('newPerson farAway makes a friend who lives far away, and only friends or rivals can be met that way', () => {
    const s = applyEffects(life(30), new Rng(3), [{ newPerson: { kind: 'friend', farAway: true, log: 'I met {{person}} on a train.' } }]);
    const friend = Object.values(s.people).find((p) => p.kind === 'friend')!;
    expect(friend.farAway).toBe(true);
    // They take no place among the four friends nearby, and an in-person card does not bind them.
    expect(candidatesFor(s, { kind: ['friend'] })).toEqual([]);
    expect(candidatesFor(s, { kind: ['friend'], farAway: 'any' }).map((p) => p.id)).toEqual([friend.id]);
    const card: EventDef = { id: 'tr_test_meet', category: 'random', title: 'A train', text: 'A long train ride.', minAge: 18, maxAge: 90, weight: 1, choices: [{ id: 'a', label: 'Talk', effects: [{ newPerson: { kind: 'lover', farAway: true } }] }, { id: 'b', label: 'Sleep', effects: [{ log: 'I slept.' }] }] };
    expect(validateEvent(card, new Set()).join(' ')).toMatch(/farAway/);
  });

  it('the mechanic, the tourist, the hostel bunkmate, the train stranger and the reception guest are made far away', () => {
    for (const id of ['fs_road_trip', 'fs_lost_tourist', 'tr_hostel_bunkmate', 'tr_train_stranger', 'tr_destination_wedding', 'tr_work_trip', 'tr_volunteer_trip', 'gu_party_of_one', 'gy_retiree_cruise']) {
      const made = EVENT(id).choices.flatMap((c) => allEffects(c.effects)).flatMap((e) => ('newPerson' in e && e.newPerson.kind === 'friend' ? [e.newPerson] : []));
      expect([id, made.length > 0, made.every((np) => np.farAway === true)]).toEqual([id, true, true]);
    }
  });
});

describe("coworkers' titles fit the country and the era", () => {
  it('a US politician has no Member of Parliament or Minister beside them, and a 1995 TV chef no food blogger', () => {
    const titles = (s: GameState, job: Job) => {
      const out = new Set<string>();
      for (let seed = 1; seed <= 120; seed++) out.add(coworkerTitle(new Rng(seed), job, s));
      return out;
    };
    const us = titles(life(50, [], { countryCode: 'US' }), JOB('politician', 4, 'Senator'));
    expect(us.has('Member of Parliament')).toBe(false);
    expect(us.has('Minister')).toBe(false);
    expect(us.has('Senator')).toBe(true);
    expect(titles(life(50, [], { countryCode: 'GB' }), JOB('politician', 4, 'Minister')).has('Member of Parliament')).toBe(true);
    const chef = JOB('chef_tv', 1, 'TV Cook');
    expect(titles(life(30, [], { year: 1995 }), chef).has('Food Blogger')).toBe(false);
    expect(titles(life(30, [], { year: 1995 }), chef).has('Food Columnist')).toBe(true);
    expect(titles(life(30, [], { year: 2015 }), chef).has('Food Blogger')).toBe(true);
  });

  it('hired coworkers use the same titles and the same dice', () => {
    const s = life(50, [], { patch: { career: { ...life(50).career, job: JOB('politician', 3, 'Member of Congress') } } });
    const hired = hireCoworkers(s, new Rng(9));
    for (const p of Object.values(hired.people)) expect(['Member of Parliament', 'Minister']).not.toContain(p.occupation);
    // One draw per title, as before: the rest of the hire rolls the same.
    const a = new Rng(5);
    coworkerTitle(a, JOB('politician', 3, 'Member of Congress'), s);
    const b = new Rng(5);
    b.int(0, 4);
    expect(a.snapshot()).toEqual(b.snapshot());
  });
});

describe('a married surname keeps the birth one', () => {
  it('a partner who takes my surname at the wedding keeps theirs as birthLastName, on a card or by proposing', () => {
    let took = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const lover = person('lover', { age: 30, lastName: 'Kelly', love: 90, relationship: 90, gender: 'male' });
      const s = life(30, [lover]);
      const wed = applyEffects(s, new Rng(seed), [{ marry: true }], { personId: lover.id }).people[lover.id]!;
      expect(wed.kind).toBe('spouse');
      if (wed.lastName === s.character.lastName) {
        took++;
        expect(wed.birthLastName).toBe('Kelly');
      } else expect(wed.birthLastName).toBeUndefined();
      const proposed = interact({ ...s, finances: { ...s.finances, cash: 50_000 } }, new Rng(seed), lover.id, 'propose').people[lover.id]!;
      if (proposed.kind === 'spouse' && proposed.lastName === s.character.lastName) expect(proposed.birthLastName).toBe('Kelly');
    }
    expect(took).toBeGreaterThan(0);
  });

  it("an heir's surviving parent keeps the birth surname from the last life", () => {
    let prev = createLife({ countryCode: 'US', firstName: 'Oliver', lastName: 'Collins', gender: 'male' }, 52);
    const rng = new Rng(4);
    const daniel: Person = { ...makePerson(rng, { kind: 'spouse', gender: 'male', age: 50, countryCode: 'US', lastName: 'Collins', playerAge: 25 }), firstName: 'Daniel', birthLastName: 'Kelly' };
    const son: Person = { ...makePerson(rng, { kind: 'child', gender: 'male', age: 20, countryCode: 'US', lastName: 'Collins', playerAge: 32 }), firstName: 'Eli', otherParentId: daniel.id };
    prev = { ...prev, character: { ...prev.character, age: 52 }, year: prev.character.birthYear + 52, people: { ...prev.people, [daniel.id]: daniel, [son.id]: son } };
    const heir = createLife({ heir: { childId: son.id, previous: markDeath(prev, 'a stroke') } }, 1);
    const papa = Object.values(heir.people).find((p) => p.firstName === 'Daniel')!;
    expect(papa.lastName).toBe('Collins');
    expect(papa.birthLastName).toBe('Kelly');
    // The late player is a parent who died the year the heir took over.
    const dad = Object.values(heir.people).find((p) => p.firstName === 'Oliver')!;
    expect(dad.lostAtAge).toBe(heir.character.age);
  });
});

describe('a partner who leaves on a card takes the couple flags along', () => {
  it('a lover removed by a card is an ex, and the next partner is not taken to live with me', () => {
    const lover = person('lover', { age: 30, love: 60 });
    const s = life(30, [lover], { patch: { flags: { lf_living_together: true, lf_engaged: true } } });
    const after = applyEffects(s, new Rng(1), [{ log: 'We split.' }, { removePerson: true }], { personId: lover.id });
    expect(after.people[lover.id]!.kind).toBe('ex');
    expect(after.flags.lf_living_together).toBeUndefined();
    expect(after.flags.lf_engaged).toBeUndefined();
  });

  it("moving in on the young-adult card means we live together, so the partner's page and household cards know it", () => {
    for (const choice of ['yes', 'trial']) {
      const lover = person('lover', { age: 25, love: 70 });
      let s: GameState = { ...life(25, [lover]), eventQueue: [{ eventId: 'ya_move_in_together', context: {}, personId: lover.id }] };
      s = resolveChoice(openNextEvent(s, EVENT_REGISTRY), choice, EVENT_REGISTRY);
      expect([choice, s.flags.lf_living_together]).toEqual([choice, true]);
      expect(candidatesFor(s, { kind: ['lover'], household: true }).map((p) => p.id)).toEqual([lover.id]);
      // And neither move-in card asks again.
      expect(isEligible(s, EVENT('lf_move_in_together'))).toBe(false);
    }
    const lover = person('lover', { age: 25, love: 70 });
    let s: GameState = { ...life(25, [lover]), eventQueue: [{ eventId: 'ya_move_in_together', context: {}, personId: lover.id }] };
    s = resolveChoice(openNextEvent(s, EVENT_REGISTRY), 'notyet', EVENT_REGISTRY);
    expect(s.flags.lf_living_together).toBeUndefined();
  });
});

describe('a second move keeps nearby friends', () => {
  it('a friend already far away takes no kept place: the two closest nearby friends are kept, and the old one stays far away', () => {
    const old = person('bestFriend', { age: 30, relationship: 99, farAway: true });
    const close = person('friend', { age: 30, relationship: 90 });
    const closer = person('friend', { age: 30, relationship: 95 });
    const third = person('friend', { age: 30, relationship: 50 });
    const s = life(9, [old, close, closer, third, person('mother', { age: 38 })]);
    const moved = applyEffects(s, new Rng(2), [{ relocate: true }]);
    expect(moved.people[old.id]!.farAway).toBe(true);
    expect(moved.people[closer.id]!.farAway).toBe(true);
    expect(moved.people[close.id]!.farAway).toBe(true);
    expect(moved.people[third.id]).toBeUndefined();
  });
});

describe('a name freed during the year stays taken until the next birthday', () => {
  it('ageUp records the names in the life at the birthday, and they are held all year', () => {
    let s = createLife({ countryCode: 'US' }, 77);
    s = ageUp(s);
    while (s.pendingEvent) s = resolveChoice(s, s.pendingEvent.choices[0]!.id, EVENT_REGISTRY);
    expect(s.namesThisYear?.age).toBe(s.character.age);
    const someone = Object.values(s.people)[0]!;
    // They leave the life without a journal line: their name is still held this year, and free again next year.
    const people = { ...s.people };
    delete people[someone.id];
    const gone = { ...s, people, log: s.log.filter((l) => !l.text.includes(someone.firstName)) };
    expect(namesInJournalThisYear(gone).has(someone.firstName)).toBe(true);
    const nextYear = { ...gone, character: { ...gone.character, age: gone.character.age + 1 } };
    expect(namesInJournalThisYear(nextYear).has(someone.firstName)).toBe(false);
  });

  it('a card does not give a held name to someone new', () => {
    const s = life(30);
    const pool = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const made = applyEffects(s, new Rng(seed), [{ newPerson: { kind: 'friend', gender: 'female' } }]);
      pool.add(Object.values(made.people)[0]!.firstName);
    }
    const held = [...pool][0]!;
    const holding = { ...s, namesThisYear: { age: 30, names: [held] } };
    for (let seed = 1; seed <= 40; seed++) {
      const made = applyEffects(holding, new Rng(seed), [{ newPerson: { kind: 'friend', gender: 'female' } }]);
      expect(Object.values(made.people)[0]!.firstName).not.toBe(held);
    }
  });
});

describe('one jury list', () => {
  const usesJuryTrials = (cs: readonly Condition[] | undefined) => (cs ?? []).includes(JURY_TRIALS);

  it('every card about a summons, a jury room or a juror uses JURY_TRIALS', () => {
    const jury = EVENTS.filter((d) => /\bjur(y|or|ors)\b|deliberation/i.test(d.title + ' ' + d.text));
    expect(jury.map((d) => d.id)).toEqual(expect.arrayContaining(['ad_jury_duty', 'ad_jury_verdict', 'nc_jury_duty', 'nc_jury_verdict', 'jr_jury_arrest_question', 'jr_jury_note', 'mc_jury_aftermath']));
    for (const d of jury) expect([d.id, usesJuryTrials(d.conditions)]).toEqual([d.id, true]);
    for (const d of jury) for (const l of lines(d)) expect([d.id, l]).not.toEqual([d.id, expect.stringMatching(/eleven to one|twelve (jurors|people)|hung jury|never agreed|tried again|retrial/i)]);
  });

  it('a juror from the trial with juror seven can be asked about it later', () => {
    const s = life(50, [], { patch: { firedEvents: { jr_jury_note: 45 } } });
    expect(isEligible(s, EVENT('mc_jury_aftermath'))).toBe(true);
    expect(isEligible({ ...s, character: { ...s.character, countryCode: 'IN' } }, EVENT('mc_jury_aftermath'))).toBe(false);
  });
});

describe("a card's house is the one I live in", () => {
  const house = (id: string, patch: Partial<Asset> = {}): Asset => ({ id, defId: 'suburban', kind: 'house', name: id, value: 300_000, purchasePrice: 300_000, condition: 90, yearlyUpkeep: 0, mortgage: null, boughtAtAge: 30, ...patch });

  it('damage lands on the home, not the one rented out, and losing the home moves me into the next', () => {
    const home = house('home', { primary: true });
    const rental = house('rental', { rentedOut: true });
    for (let seed = 1; seed <= 20; seed++) {
      const s = life(40, [], { patch: { assets: [rental, home] } });
      const hit = applyEffects(s, new Rng(seed), [{ asset: 'damage', kind: 'house', amount: 40 }]);
      expect(hit.assets.find((a) => a.id === 'home')!.condition).toBe(50);
      expect(hit.assets.find((a) => a.id === 'rental')!.condition).toBe(90);
      const lost = applyEffects(s, new Rng(seed), [{ asset: 'lose', kind: 'house' }]);
      expect(lost.assets.map((a) => a.id)).toEqual(['rental']);
      expect(lost.assets[0]!.primary).toBe(true);
      expect(lost.assets[0]!.rentedOut).toBe(false);
    }
  });
});

describe('job history names the job', () => {
  it('a job that ends records its definition, so a title on two ladders is not guessed', () => {
    const s = life(40, [], { patch: { career: { ...life(40).career, job: JOB('lawyer', 3, 'Partner') } } });
    const after = applyEffects(s, new Rng(1), [{ loseJob: true, reason: 'left' }]);
    expect(after.career.history.at(-1)!.defId).toBe('lawyer');
    // A consultant's years and then a lawyer's Partner years: two careers, though the history never says Associate.
    const spans = careerSpans([
      { title: 'Consultant', company: 'A', defId: 'management_consultant', fromAge: 25, toAge: 30, salary: 1, reason: 'quit' },
      { title: 'Partner', company: 'B', defId: 'lawyer', fromAge: 30, toAge: 50, salary: 1, reason: 'retired' },
    ]);
    expect(spans.map((x) => [x.key, x.years])).toEqual([['management_consultant', 5], ['lawyer', 20]]);
    // An older save's entry without the job still goes with the rest of the history.
    expect(careerSpans([{ title: 'Consultant', company: 'A', fromAge: 25, toAge: 30, salary: 1, reason: 'quit' }, { title: 'Partner', company: 'B', fromAge: 30, toAge: 50, salary: 1, reason: 'retired' }]).map((x) => x.key)).toEqual(['management_consultant']);
  });
});

describe('wording', () => {
  it('no coats in a card that can open in a hot country, and no cupboards', () => {
    const climates = (cs: readonly Condition[] | undefined): string[] | undefined => {
      for (const c of cs ?? []) if ('climate' in c) return c.climate;
      return undefined;
    };
    for (const d of EVENTS) {
      const hotToo = !climates(d.conditions) || climates(d.conditions)!.includes('hot');
      for (const l of lines(d)) {
        if (hotToo) expect([d.id, l]).not.toEqual([d.id, expect.stringMatching(/\b(a|an|my|his|her|their|the|winter|warm|heavy|wool|stranger's) coats?\b(?! of paint| hanger)|\bcoat rack/i)]);
        expect([d.id, l]).not.toEqual([d.id, expect.stringMatching(/\bcupboards?\b/i)]);
      }
    }
  });
});

describe('parents left in another city stay there', () => {
  it("an heir's grandparents are far away when the last player had moved away from them", () => {
    let prev = createLife({ countryCode: 'US', firstName: 'Ruth', lastName: 'Okafor', gender: 'female' }, 61);
    const rng = new Rng(8);
    const far = { ...makePerson(rng, { kind: 'mother', gender: 'female', age: 74, countryCode: 'US', playerAge: 0 }), firstName: 'Edith', farAway: true };
    const near = { ...makePerson(rng, { kind: 'father', gender: 'male', age: 76, countryCode: 'US', playerAge: 0 }), firstName: 'Walter' };
    const son: Person = { ...makePerson(rng, { kind: 'child', gender: 'male', age: 14, countryCode: 'US', lastName: 'Okafor', playerAge: 36 }), firstName: 'Eli' };
    prev = { ...prev, character: { ...prev.character, age: 50 }, year: prev.character.birthYear + 50, people: { [far.id]: far, [near.id]: near, [son.id]: son } };
    const heir = createLife({ heir: { childId: son.id, previous: markDeath(prev, 'a stroke') } }, 2);
    const gran = Object.values(heir.people).find((p) => p.kind === 'grandparent' && p.firstName === 'Edith')!;
    const grandpa = Object.values(heir.people).find((p) => p.kind === 'grandparent' && p.firstName === 'Walter')!;
    expect(gran.farAway).toBe(true);
    expect(grandpa.farAway).toBeUndefined();
    // Grandma is a call away, not someone at the kitchen table.
    expect(candidatesFor(heir, { kind: ['grandparent'] }).map((p) => p.id)).toEqual([grandpa.id]);
  });

  it('the holiday host with a parent alive in another city is not called the head of the family', () => {
    const mom = person('mother', { age: 92, gender: 'female', farAway: true });
    const kid = person('child', { age: 40, gender: 'female' });
    const home: Asset = { id: 'home', defId: 'suburban', kind: 'house', name: 'Home', value: 300_000, purchasePrice: 300_000, condition: 90, yearlyUpkeep: 0, mortgage: null, boughtAtAge: 40, primary: true };
    const s = life(70, [mom, kid], { patch: { assets: [home] } });
    // noPerson counts only people nearby, so the card can open while she is alive far away.
    expect(isEligible(s, EVENT('gy_holiday_elder'))).toBe(true);
    for (const l of lines(EVENT('gy_holiday_elder'))) expect(l).not.toMatch(/head of the family/i);
  });
});
