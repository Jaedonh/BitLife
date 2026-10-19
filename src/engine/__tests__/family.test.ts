import { getCountry } from '@/data/countries';
import { EVENTS } from '@/data/events';
import { applyAction } from '../actions';
import { ageUp } from '../ageUp';
import { candidatesFor } from '../events/conditions';
import { applyEffects } from '../events/effects';
import type { EventDef } from '../events/schema';
import { validateEvent } from '../events/schema';
import { isEligible, makeRegistry, openNextEvent, resolveChoice } from '../events/select';
import { personRef, renderText, scaleMoney } from '../events/text';
import { Rng } from '../rng';
import { onNpcDeath } from '../systems/aging';
import { createLife, emptyMemory, grandparentAliveChance, makePerson } from '../systems/character';
import { markDeath } from '../systems/death';
import { addGrandchild, hasMovedOut, kidsCount, MAX_KIDS_PER_CHILD, yearlyFamily } from '../systems/family';
import { availableInteractions } from '../systems/relationships';
import type { GameState, Gender, Person, RelationshipKind } from '../types';

const noEvents = makeRegistry([]);
const EVENT = (id: string): EventDef => EVENTS.find((e) => e.id === id)!;

/** A US player of `age` with only the people given, plenty of cash and energy. */
function life(age: number, people: Person[] = [], opts: { gender?: Gender; seed?: number } = {}): GameState {
  const s = createLife({ countryCode: 'US', gender: opts.gender ?? 'female', firstName: 'Nora' }, opts.seed ?? 31);
  return {
    ...s,
    people: Object.fromEntries(people.map((p) => [p.id, p])),
    year: s.character.birthYear + age,
    character: { ...s.character, age, energy: 4, energyMax: 4 },
    finances: { ...s.finances, cash: 100_000 },
    eventQueue: [],
    log: [],
  };
}

let ids = 0;
function person(kind: RelationshipKind, patch: Partial<Person> = {}, playerAge = 30): Person {
  const p = makePerson(new Rng(++ids), { kind, age: 40, countryCode: 'US', playerAge, gender: patch.gender ?? 'female' });
  return { ...p, id: `${kind}_${ids}`, memory: emptyMemory(playerAge), ...patch };
}

function texts(s: GameState): string[] {
  return s.log.map((l) => l.text);
}

describe('grandparents at birth', () => {
  const lives = Array.from({ length: 600 }, (_, i) => createLife({}, (i + 1) * 7919));

  it('a newborn usually has one to three living grandparents, each of a parent\'s line', () => {
    const counts = lives.map((s) => Object.values(s.people).filter((p) => p.kind === 'grandparent').length);
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    expect(mean).toBeGreaterThan(1.6);
    expect(mean).toBeLessThan(2.7);
    expect(counts.filter((n) => n >= 1 && n <= 3).length / counts.length).toBeGreaterThan(0.7);
    expect(Math.max(...counts)).toBeLessThanOrEqual(4);
    for (const s of lives) {
      for (const gp of Object.values(s.people).filter((p) => p.kind === 'grandparent')) {
        const parent = s.people[gp.viaId!]!;
        expect(['mother', 'father']).toContain(parent.kind);
        // 20-35 years older than the grandparent's own child (a grandfather a few years either side of the grandmother).
        expect(gp.age - parent.age).toBeGreaterThanOrEqual(17);
        expect(gp.age - parent.age).toBeLessThanOrEqual(41);
        expect(gp.age).toBeLessThanOrEqual(99);
        expect(gp.alive).toBe(true);
        expect(gp.metAtAge).toBe(0);
        // The father's parents carry the family name; the mother's carry hers (her maiden name if she took his).
        if (parent.kind === 'father') expect(gp.lastName).toBe(parent.lastName);
        if (parent.kind === 'mother' && parent.lastName !== s.character.lastName) expect(gp.lastName).toBe(parent.lastName);
        // No more than two per parent, one of each.
        const sameLine = Object.values(s.people).filter((p) => p.kind === 'grandparent' && p.viaId === gp.viaId);
        expect(sameLine.length).toBeLessThanOrEqual(2);
        expect(new Set(sameLine.map((p) => p.gender)).size).toBe(sameLine.length);
      }
    }
  });

  it('older parents have fewer living grandparents to offer', () => {
    expect(grandparentAliveChance(50)).toBeGreaterThan(grandparentAliveChance(70));
    expect(grandparentAliveChance(70)).toBeGreaterThan(grandparentAliveChance(90));
    const mean = (xs: GameState[]) => xs.reduce((n, s) => n + Object.values(s.people).filter((p) => p.kind === 'grandparent').length, 0) / Math.max(1, xs.length);
    const motherAge = (s: GameState) => Object.values(s.people).find((p) => p.kind === 'mother')!.age;
    expect(mean(lives.filter((s) => motherAge(s) <= 25))).toBeGreaterThan(mean(lives.filter((s) => motherAge(s) >= 36)));
  });

  it('the birth journal names them, Grandma and Grandpa style', () => {
    const s = lives.find((x) => Object.values(x.people).filter((p) => p.kind === 'grandparent').length === 2)!;
    const [a, b] = Object.values(s.people).filter((p) => p.kind === 'grandparent');
    expect(texts(s)).toContain(`${personRef(a!)} and ${personRef(b!)} were first in line to hold me.`);
    expect(personRef(a!)).toMatch(/^Grand(ma|pa) /);
  });

  it('an heir\'s grandparents are the dead player\'s living parents', () => {
    let prev = life(50);
    const mom = person('mother', { firstName: 'Rosa', lastName: 'Vega', age: 76, money: 40_000, occupation: 'Lawyer', looks: 12, smarts: 91, health: 64, craziness: 7 });
    const dad = person('father', { firstName: 'Joe', gender: 'male', age: 79, alive: false });
    const kid = person('child', { firstName: 'Ana', age: 20 });
    prev = markDeath({ ...prev, people: { [mom.id]: mom, [dad.id]: dad, [kid.id]: kid } }, 'a stroke');
    const heir = createLife({ heir: { childId: kid.id, previous: prev } }, 77);
    const gps = Object.values(heir.people).filter((p) => p.kind === 'grandparent');
    expect(gps).toHaveLength(1);
    expect(gps[0]).toMatchObject({ firstName: 'Rosa', lastName: 'Vega', gender: 'female', age: 76, money: 40_000, alive: true, metAtAge: 0 });
    // The mother the last life knew, not a stranger with her name: same job, looks, smarts, health and temper.
    expect(gps[0]).toMatchObject({ occupation: 'Lawyer', looks: 12, smarts: 91, health: 64, craziness: 7 });
    const deceased = heir.people[gps[0]!.viaId!]!;
    expect(deceased).toMatchObject({ kind: 'mother', firstName: 'Nora', alive: false });
    expect(texts(heir).some((t) => t.includes('My grandmother Rosa Vega (76) is still with us.'))).toBe(true);
  });
});

describe('grandparents in narration', () => {
  const grandma = person('grandparent', { firstName: 'Rosa', gender: 'female', age: 70, relationship: 60 });
  const grandma2 = person('grandparent', { firstName: 'Ines', gender: 'female', age: 74, relationship: 90 });
  const grandpa = person('grandparent', { firstName: 'Joe', gender: 'male', age: 72 });

  it('a bound grandparent is Grandma or Grandpa and their first name', () => {
    const s = life(5, [grandma, grandpa]);
    expect(renderText('{{person}} slipped me a cookie.', s, { person: grandma })).toBe('Grandma Rosa slipped me a cookie.');
    expect(renderText('I hugged {{person}}.', s, { person: grandpa })).toBe('I hugged Grandpa Joe.');
    expect(renderText("{{person}}'s garden", s, { person: grandpa })).toBe("Grandpa Joe's garden");
  });

  it('{{grandma}} and {{grandpa}} name the closest living one, the bound one first, or fall back', () => {
    const s = life(5, [grandma, grandma2, grandpa]);
    expect(renderText('{{grandma}} and {{grandpa}} came over.', s)).toBe('Grandma Ines and Grandpa Joe came over.');
    expect(renderText('{{grandma}} waved.', s, { person: grandma })).toBe('Grandma Rosa waved.');
    const none = life(5, [{ ...grandma, alive: false }]);
    expect(renderText("{{grandma}}'s card had money in it. {{grandpa}} winked.", none)).toBe("Grandma's card had money in it. Grandpa winked.");
  });

  it('event selectors can ask for a grandmother or a grandfather', () => {
    const s = life(5, [grandma, grandpa]);
    expect(candidatesFor(s, { kind: ['grandparent'], gender: 'female' }).map((p) => p.id)).toEqual([grandma.id]);
    expect(candidatesFor(s, { kind: ['grandparent'], gender: 'male' }).map((p) => p.id)).toEqual([grandpa.id]);
  });

  it('the toddler events that mention Grandma or Grandpa bind one of the right gender', () => {
    for (const [id, gender] of [['ec_grandma_visit', 'female'], ['ec_grandpa_story', 'male'], ['ch_grandma_passing', 'female']] as const) {
      expect(EVENT(id).person).toMatchObject({ kind: ['grandparent'], gender });
    }
    const s = { ...life(4, [grandma, grandpa, person('mother', { firstName: 'Lia' })]) };
    expect(isEligible(s, EVENT('ec_grandma_visit'))).toBe(true);
    expect(isEligible({ ...s, people: { [grandpa.id]: grandpa } }, EVENT('ec_grandma_visit'))).toBe(false);
  });

  it('a grandmother who dies in an event is gone, grieved by the event and not twice by the engine', () => {
    const mom = person('mother', { firstName: 'Lia' });
    const s0 = life(6, [grandma, mom]);
    const reg = makeRegistry([EVENT('ch_grandma_passing')]);
    let s = openNextEvent({ ...s0, eventQueue: [{ eventId: 'ch_grandma_passing', context: {}, personId: grandma.id }] }, reg);
    expect(s.pendingEvent?.text).toContain('Grandma Rosa died in the night.');
    s = resolveChoice(s, 'card', reg);
    expect(s.people[grandma.id]!.alive).toBe(false);
    expect(texts(s).some((t) => t.startsWith('I drew Grandma Rosa in her garden'))).toBe(true);
    expect(texts(s).some((t) => t.startsWith('My grandmother'))).toBe(false);
  });
});

describe('grandparent deaths', () => {
  it('write the family line, grieve less than a parent, and may leave a small bequest', () => {
    const mom = person('mother', { firstName: 'Lia', money: 1000 });
    const gm: Person = { ...person('grandparent', { firstName: 'Rosa', lastName: 'Vega', gender: 'female', age: 81, relationship: 80, money: 20_000, viaId: mom.id }), alive: false, deathAge: 81, deathCause: 'a stroke' };
    const sib = person('sibling', { age: 12 });
    const s0 = life(30, [mom, sib, gm]);
    const s = onNpcDeath(s0, gm, new Rng(1));
    expect(texts(s)[0]).toBe('Grandma Rosa died of a stroke at 81.');
    expect(s.character.stats.happiness - s0.character.stats.happiness).toBe(-8);
    // 15% of the estate, split with one sibling; most of the rest goes to Mom.
    expect(s.finances.cash - s0.finances.cash).toBe(1500);
    expect(texts(s)[1]).toBe(`Grandma Rosa left me $1,500 in her will.`);
    expect(s.people[mom.id]!.money).toBe(1000 + 12_000);
    // A parent's death costs more happiness.
    const dad: Person = { ...person('father', { gender: 'male', relationship: 80, money: 0 }), alive: false, deathAge: 60 };
    const p = onNpcDeath(s0, dad, new Rng(1));
    expect(p.character.stats.happiness - s0.character.stats.happiness).toBeLessThan(-8);
  });

  it("a minor's bequest goes into their own savings", () => {
    const gm: Person = { ...person('grandparent', { firstName: 'Rosa', gender: 'female', age: 81, relationship: 80, money: 10_000 }), alive: false, deathAge: 81 };
    const s0 = { ...life(9, [gm]), finances: { ...life(9).finances, cash: 0 } };
    const s = onNpcDeath(s0, gm, new Rng(1));
    expect(s.finances.cash).toBe(1500);
    expect(texts(s)).toContain('Grandma Rosa left me $1,500 in her will. It went into my savings.');
  });
});

describe('interactions with grandparents and grandchildren', () => {
  const ids = (s: GameState, p: Person) => availableInteractions(s, p).map((d) => d.id);

  it('grandparents: time, a visit, talk, compliments, gifts and, from 10, small money', () => {
    const gm = person('grandparent', { firstName: 'Rosa', age: 70, relationship: 90, money: 50_000 });
    expect(ids(life(8, [gm]), gm)).toEqual(['spendTime', 'visit', 'conversation', 'compliment', 'gift']);
    expect(ids(life(12, [gm]), gm)).toEqual(['spendTime', 'visit', 'conversation', 'compliment', 'gift', 'askMoney']);
    // A visit takes energy and happens once a year.
    let s = applyAction(life(12, [gm]), { type: 'interact', personId: gm.id, interaction: 'visit' });
    expect(s.character.energy).toBe(3);
    expect(s.people[gm.id]!.relationship).toBeGreaterThan(gm.relationship - 1);
    expect(s.log.at(-1)!.text).toMatch(/Grandma Rosa/);
    s = applyAction(s, { type: 'interact', personId: gm.id, interaction: 'visit' });
    expect(s.lastResult?.text).toBe("I've done that enough this year.");
    // Asking for money: pocket money, never rent.
    for (let seed = 1; seed <= 40; seed++) {
      const before = { ...life(12, [gm]), rng: new Rng(seed).snapshot() };
      const after = applyAction(before, { type: 'interact', personId: gm.id, interaction: 'askMoney' });
      expect(after.finances.cash - before.finances.cash).toBeLessThanOrEqual(scaleMoney(before, 300));
    }
  });

  it('grandchildren: time, gifts and money for later', () => {
    const baby = person('grandchild', { firstName: 'Lucia', age: 2 });
    expect(ids(life(60, [baby]), baby)).toEqual(['spendTime', 'gift', 'giveMoney']);
    const s = applyAction(life(60, [baby]), { type: 'interact', personId: baby.id, interaction: 'giveMoney' });
    expect(s.log.at(-1)!.text).toBe('I put some money into a savings account for Lucia.');
    const t = applyAction(life(60, [baby]), { type: 'interact', personId: baby.id, interaction: 'spendTime' });
    expect(t.log.at(-1)!.text).toMatch(/my granddaughter, Lucia|Lucia/);
  });
});

describe('children growing up', () => {
  /** A parent of 40 with one child of `age`, aged up year by year with no random events. */
  function raise(childAge: number, years: number, seed: number, patch: Partial<Person> = {}): GameState {
    const kid = person('child', { firstName: 'Maya', gender: 'female', age: childAge, lastName: 'Vega', ...patch }, 40 - childAge);
    let s = { ...life(40, [kid]), rng: new Rng(seed).snapshot() };
    for (let i = 0; i < years && s.alive; i++) s = yearlyFamily({ ...s, people: Object.fromEntries(Object.entries(s.people).map(([k, p]) => [k, { ...p, age: p.age + 1 }])), character: { ...s.character, age: s.character.age + 1 } }, new Rng(seed * 100 + i));
    return s;
  }

  it('start school at the country\'s school age and mostly graduate at the end of high school', () => {
    const start = getCountry('US').schoolStartAge;
    const s = raise(start - 1, 1, 1);
    expect(texts(s)[0]).toMatch(/^My daughter Maya started school\./);
    let graduated = 0;
    let lines = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const t = raise(getCountry('US').highSchoolEndAge - 1, 1, seed, { growth: { school: 'started' } });
      const g = Object.values(t.people)[0]!.growth!.school;
      expect(['graduated', 'droppedOut']).toContain(g);
      if (g === 'graduated') graduated++;
      lines += t.log.length;
    }
    expect(graduated / 300).toBeGreaterThan(0.72);
    expect(graduated / 300).toBeLessThan(0.88);
    // Dropping out is quiet: only graduations write a line.
    expect(lines).toBe(graduated);
  });

  it('move out between 19 and 26, and everyone has gone by 26', () => {
    const ages: number[] = [];
    for (let seed = 1; seed <= 200; seed++) {
      const kid = person('child', { firstName: 'Leo', gender: 'male', age: 18 });
      let s = { ...life(45, [kid]) };
      for (let a = 19; a <= 30; a++) {
        s = yearlyFamily({ ...s, people: { [kid.id]: { ...s.people[kid.id]!, age: a } } }, new Rng(seed * 1000 + a));
        if (s.people[kid.id]!.growth?.movedOut) {
          ages.push(a);
          expect(texts(s)).toContain('My son Leo moved out. The house is very quiet.');
          break;
        }
      }
    }
    expect(ages).toHaveLength(200);
    expect(Math.min(...ages)).toBe(19);
    expect(Math.max(...ages)).toBeLessThanOrEqual(26);
    // Older saves have no record: a child past 26 counts as moved out.
    expect(hasMovedOut(person('child', { age: 30 }))).toBe(true);
    expect(hasMovedOut(person('child', { age: 20 }))).toBe(false);
  });

  it('about 40% marry between 24 and 40', () => {
    let married = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const kid = person('child', { firstName: 'Leo', gender: 'male', age: 23, growth: { movedOut: true, kids: MAX_KIDS_PER_CHILD } });
      let s = life(50, [kid]);
      for (let a = 24; a <= 45; a++) s = yearlyFamily({ ...s, people: { [kid.id]: { ...s.people[kid.id]!, age: a } } }, new Rng(seed * 1000 + a));
      const spouse = s.people[kid.id]!.growth?.spouse;
      if (spouse) {
        married++;
        expect(texts(s).some((t) => t.startsWith(`My son Leo married ${spouse.firstName}`))).toBe(true);
      }
    }
    expect(married / 300).toBeGreaterThan(0.3);
    expect(married / 300).toBeLessThan(0.5);
  });

  it('grown children have kids of their own: the player\'s grandchildren, at most three each', () => {
    let total = 0;
    for (let seed = 1; seed <= 120; seed++) {
      const kid = person('child', { firstName: 'Diego', gender: 'male', lastName: 'Ruiz', age: 21, growth: { movedOut: true, spouse: { firstName: 'Ana', gender: 'female' } } });
      let s = life(50, [kid]);
      for (let a = 22; a <= 50; a++) s = yearlyFamily({ ...s, people: { ...s.people, [kid.id]: { ...s.people[kid.id]!, age: a } } }, new Rng(seed * 1000 + a));
      const grandkids = Object.values(s.people).filter((p) => p.kind === 'grandchild');
      expect(grandkids.length).toBeLessThanOrEqual(MAX_KIDS_PER_CHILD);
      expect(s.people[kid.id]!.growth?.kids ?? 0).toBe(grandkids.length);
      for (const g of grandkids) expect(g).toMatchObject({ lastName: 'Ruiz', viaId: kid.id, occupation: 'Baby' });
      if (grandkids.length) {
        expect(s.flags.grandparent).toBe(true);
        const first = texts(s).find((t) => t.startsWith('My son Diego and his wife Ana had a'))!;
        expect(first).toMatch(/^My son Diego and his wife Ana had a (son|daughter), \S+\. I am a grandparent\.$/);
      }
      total += grandkids.length;
    }
    // Married children average more than one child of their own over 22-42.
    expect(total / 120).toBeGreaterThan(1);
  });

  it('an unmarried child has a baby with a partner; two husbands adopt', () => {
    const single = person('child', { firstName: 'Maya', gender: 'female', age: 30 });
    const s = addGrandchild(life(55, [single]), new Rng(2), single.id);
    expect(texts(s)[0]).toMatch(/^My daughter Maya and her partner had a (son|daughter), \S+\. I am a grandparent\.$/);
    const son = person('child', { firstName: 'Leo', gender: 'male', age: 30, growth: { spouse: { firstName: 'Tom', gender: 'male' } } });
    const t = addGrandchild(addGrandchild(life(55, [son]), new Rng(3), son.id), new Rng(4), son.id);
    expect(texts(t)[0]).toMatch(/^My son Leo and his husband Tom adopted a (son|daughter), \S+\. I am a grandparent\.$/);
    expect(texts(t)[1]).toMatch(/I have two grandchildren now\.$/);
  });
});

describe('events and the milestones agree', () => {
  const kid = (patch: Partial<Person> = {}) => person('child', { firstName: 'Maya', gender: 'female', age: 23, relationship: 80, ...patch });

  it('a move-out card is for a child still at home, and leaving there is the move', () => {
    const def = EVENT('lf_child_moves_out');
    const home = kid();
    expect(isEligible(life(50, [home]), def)).toBe(true);
    expect(isEligible(life(50, [kid({ growth: { movedOut: true } })]), def)).toBe(false);
    const reg = makeRegistry([def]);
    let s = openNextEvent({ ...life(50, [home]), eventQueue: [{ eventId: def.id, context: {}, personId: home.id }] }, reg);
    s = resolveChoice(s, 'bless', reg);
    expect(s.people[home.id]!.growth?.movedOut).toBe(true);
    // The engine does not move them out a second time.
    const after = ageUp({ ...s, pendingEvent: null }, noEvents);
    expect(texts(after).some((t) => t.includes('moved out'))).toBe(false);
  });

  it('a wedding card is for an unmarried child and marries them', () => {
    const def = EVENT('lf_child_wedding');
    const single = kid({ age: 30 });
    expect(isEligible(life(55, [single]), def)).toBe(true);
    expect(isEligible(life(55, [kid({ age: 30, growth: { spouse: { firstName: 'Tom', gender: 'male' } } })]), def)).toBe(false);
    const reg = makeRegistry([def]);
    let s = openNextEvent({ ...life(55, [single]), eventQueue: [{ eventId: def.id, context: {}, personId: single.id }] }, reg);
    s = resolveChoice(s, 'speech', reg);
    expect(s.people[single.id]!.growth?.spouse?.firstName).toBeTruthy();
  });

  it('a baby on the way is born the next year, named after me when they said so', () => {
    const def = EVENT('ll_grandchild_born');
    const parent = kid({ age: 30 });
    const reg = makeRegistry([def]);
    let s = openNextEvent({ ...life(62, [parent]), eventQueue: [{ eventId: def.id, context: {}, personId: parent.id }] }, reg);
    s = resolveChoice(s, 'knit', reg);
    expect(kidsCount(s.people[parent.id]!)).toBe(1);
    expect(Object.values(s.people).some((p) => p.kind === 'grandchild')).toBe(false);
    s = ageUp({ ...s, pendingEvent: null }, noEvents);
    const born = Object.values(s.people).filter((p) => p.kind === 'grandchild');
    expect(born).toHaveLength(1);
    expect(s.people[parent.id]!.growth).toMatchObject({ kids: 1, expecting: 0 });
    // Named after me: the baby gets my name and gender.
    const named = applyEffects(life(62, [parent]), new Rng(1), [{ childMilestone: 'expecting', namedAfterMe: true }], { personId: parent.id });
    const t = addGrandchild(named, new Rng(2), parent.id);
    const baby = Object.values(t.people).find((p) => p.kind === 'grandchild')!;
    expect(baby).toMatchObject({ firstName: 'Nora', gender: 'female' });
    expect(texts(t)[0]).toBe('My daughter Maya and her partner had a daughter. They named her Nora, after me. I am a grandparent.');
  });

  it('no more announcements past three, and "going to be a grandparent" only before the first', () => {
    const full = kid({ age: 32, growth: { kids: 2, expecting: 1 } });
    expect(isEligible(life(62, [full]), EVENT('ll_grandchild_born'))).toBe(false);
    expect(applyEffects(life(62, [full]), new Rng(1), [{ childMilestone: 'expecting' }], { personId: full.id }).people[full.id]!.growth?.expecting).toBe(1);
    const news = EVENT('lf_grandparent_news');
    expect(isEligible(life(50, [kid({ age: 30 })]), news)).toBe(true);
    expect(isEligible({ ...life(50, [kid({ age: 30 })]), flags: { grandparent: true } }, news)).toBe(false);
  });

  it('grandchild cards bind a real grandchild', () => {
    const g = person('grandchild', { firstName: 'Lucia', age: 7 });
    expect(isEligible(life(66, [g]), EVENT('ll_grandkid_weekend'))).toBe(true);
    expect(isEligible(life(66, [kid({ age: 40 })]), EVENT('ll_grandkid_weekend'))).toBe(false);
    expect(isEligible(life(66, [{ ...g, age: 12 }]), EVENT('ll_grandkid_tech'))).toBe(true);
  });

  it('the validator rejects milestones on events not bound to a child', () => {
    const base = { id: 'x_test', category: 'family', title: 'T', text: 'Something happened to me today, quite unexpectedly.', minAge: 30, maxAge: 80, weight: 1 } as const;
    const ok: EventDef = { ...base, person: { kind: ['child'], movedOut: false }, choices: [{ id: 'a', label: 'Fine', effects: [{ childMilestone: 'movedOut' }] }] };
    expect(validateEvent(ok, new Set())).toEqual([]);
    const friend: EventDef = { ...base, person: { kind: ['friend'], married: false }, choices: [{ id: 'a', label: 'Fine', effects: [{ childMilestone: 'married' }] }] };
    expect(validateEvent(friend, new Set()).length).toBe(2);
    const fake: EventDef = { ...base, choices: [{ id: 'a', label: 'Fine', effects: [{ newPerson: { kind: 'grandchild' } }] }] };
    expect(validateEvent(fake, new Set())[0]).toMatch(/cannot create a grandchild/);
    const placeholders: EventDef = { ...base, choices: [{ id: 'a', label: 'Call {{grandma}}', effects: [{ log: '{{grandpa}} answered.' }] }] };
    expect(validateEvent(placeholders, new Set())).toEqual([]);
  });
});

describe('an heir who grew up in the family', () => {
  it('keeps their spouse and children, and a dropout heir has no diploma', () => {
    const kid = person('child', { firstName: 'Ana', gender: 'female', lastName: 'Vega', age: 34, growth: { school: 'droppedOut', movedOut: true, spouse: { firstName: 'Tom', gender: 'male' }, kids: 2 } });
    const g1 = person('grandchild', { firstName: 'Lucia', age: 6, lastName: 'Vega', viaId: kid.id, looks: 88, smarts: 15, health: 71, craziness: 93 });
    const g2 = person('grandchild', { firstName: 'Mateo', gender: 'male', age: 3, lastName: 'Vega', viaId: kid.id });
    const other = person('child', { firstName: 'Ben', age: 30 });
    const g3 = person('grandchild', { firstName: 'Ivy', age: 1, viaId: other.id });
    const prev = markDeath(life(64, [kid, other, g1, g2, g3]), 'a heart attack');
    const heir = createLife({ heir: { childId: kid.id, previous: prev } }, 5);
    const people = Object.values(heir.people);
    const spouse = people.find((p) => p.kind === 'spouse')!;
    expect(spouse).toMatchObject({ firstName: 'Tom', gender: 'male', alive: true });
    const kids = people.filter((p) => p.kind === 'child');
    expect(kids.map((p) => p.firstName).sort()).toEqual(['Lucia', 'Mateo']);
    for (const k of kids) expect(k.otherParentId).toBe(spouse.id);
    expect(kids.find((k) => k.firstName === 'Lucia')!.metAtAge).toBe(28);
    // The grandchild the last life knew grows up as the same child.
    expect(kids.find((k) => k.firstName === 'Lucia')).toMatchObject({ looks: 88, smarts: 15, health: 71, craziness: 93 });
    // A niece is not the heir's child.
    expect(people.some((p) => p.firstName === 'Ivy')).toBe(false);
    expect(heir.counters).toMatchObject({ children: 2, marriages: 1 });
    expect(heir.education).toMatchObject({ stage: 'done', droppedOut: true, degrees: [] });
    expect(texts(heir)).toEqual(expect.arrayContaining(["I'm married to Tom.", 'I have two children: Lucia (6) and Mateo (3).', 'I left high school without a diploma.']));
  });
});

describe('obituaries', () => {
  it("a child's lists grandparents; an adult's lists grandchildren", () => {
    const mom = person('mother', { firstName: 'Lia' });
    const gm = person('grandparent', { firstName: 'Rosa', gender: 'female', age: 70 });
    const child = markDeath(life(9, [mom, gm]), 'pneumonia').death!.obituary;
    expect(child).toMatch(/survived by her mother Lia and her grandmother Rosa\./);
    const two = markDeath(life(9, [mom, gm, person('grandparent', { gender: 'male', age: 72 })]), 'pneumonia').death!.obituary;
    expect(two).toMatch(/survived by her mother Lia and two grandparents\./);
    const spouse = person('spouse', { firstName: 'Tom', gender: 'male', age: 70 });
    const kids = [person('child', { age: 40 }), person('child', { age: 38 })];
    const grand = [person('grandchild', { age: 10 }), person('grandchild', { age: 8 }), person('grandchild', { age: 3 })];
    const adult = markDeath(life(72, [spouse, ...kids, ...grand]), 'a stroke').death!.obituary;
    // In a longer list the name loses its commas, or "her husband, Tom, two children" reads as four survivors.
    expect(adult).toMatch(/survived by her husband Tom, two children, and three grandchildren\./);
    const widow = markDeath(life(72, [...kids, grand[0]!]), 'a stroke').death!.obituary;
    expect(widow).toMatch(/survived by two children and one grandchild\./);
    const justTom = markDeath(life(72, [spouse, kids[0]!]), 'a stroke').death!.obituary;
    expect(justTom).toMatch(/survived by her husband, Tom, and one child\./);
  });
});

describe('grandparent wording in content', () => {
  it('never doubles up a bound grandparent ("my grandma Grandma Rosa") or mixes up their gender', () => {
    const grandma = person('grandparent', { firstName: 'Rosa', gender: 'female', age: 72 });
    const grandpa = person('grandparent', { firstName: 'Joe', gender: 'male', age: 75 });
    const s = life(6, [grandma, grandpa, person('mother', { firstName: 'Lia' })]);
    const AWKWARD = [/\b(my|your|the|a|his|her) (grandma|grandpa|grandmother|grandfather|granny|nana)\b,? Grand(ma|pa)\b/i, /\bGrand(ma|pa) Grand(ma|pa)\b/];
    const problems: string[] = [];
    const walk = (effects: readonly unknown[] | undefined, out: string[]) => {
      for (const x of (effects ?? []) as Record<string, unknown>[]) {
        if (typeof x.log === 'string') out.push(x.log);
        if (Array.isArray(x.random)) for (const o of x.random as { effects: unknown[] }[]) walk(o.effects, out);
        if (Array.isArray(x.then)) walk(x.then as unknown[], out);
        if (Array.isArray(x.else)) walk(x.else as unknown[], out);
      }
    };
    for (const e of EVENTS) {
      const blob = JSON.stringify(e);
      if (!e.person?.kind.includes('grandparent') && !/\{\{grand(ma|pa)\}\}/.test(blob)) continue;
      const bound = e.person?.kind.includes('grandparent') ? (e.person.gender === 'male' ? grandpa : grandma) : undefined;
      const gendered = !!e.person?.gender;
      const all = [e.title, e.text, ...e.choices.flatMap((c) => [c.label, c.hint ?? ''])];
      for (const c of e.choices) walk(c.effects, all);
      for (const t of all.filter(Boolean)) {
        const r = renderText(t, s, { person: bound });
        if (AWKWARD.some((re) => re.test(r))) problems.push(`${e.id}: ${r}`);
        // A grandmother is "she", a grandfather "he".
        if (gendered && bound?.gender === 'female' && /\{\{person\}\} [^.]*\b(he|his|him)\b/.test(t)) problems.push(`${e.id}: ${t}`);
        if (gendered && bound?.gender === 'male' && /\{\{person\}\} [^.]*\b(she|her)\b/.test(t)) problems.push(`${e.id}: ${t}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('{{grandma}} and {{grandpa}} never name a grandparent the child does not have (an orphan, or one whose grandmother died)', () => {
    // A child with a mother and father but no living grandparents: the fallback "Grandma" would invent one.
    const dead = person('grandparent', { firstName: 'Rosa', gender: 'female', age: 70, alive: false });
    const problems: string[] = [];
    for (const e of EVENTS.filter((x) => /\{\{grand(ma|pa)\}\}/.test(JSON.stringify(x)))) {
      for (const age of [e.minAge, Math.min(e.maxAge, e.minAge + 3)]) {
        const s = life(age, [person('mother', { age: 30 + age }), person('father', { gender: 'male', age: 32 + age }), dead]);
        if (isEligible(s, e)) problems.push(`${e.id} (age ${age})`);
      }
    }
    expect(problems).toEqual([]);
  });
});
