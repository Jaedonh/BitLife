import { FLAVOR, type FlavorLine } from '@/data/flavor';
import { evaluateCondition } from '../events/conditions';
import { giveIllness, sendToPrison } from '../events/effects';
import { validateEvent, type Condition, type EventDef } from '../events/schema';
import { Rng } from '../rng';
import { balancedPolicy, recklessPolicy, simulateLife } from '../simulate';
import { createLife, makePerson } from '../systems/character';
import { FLAVOR_RULES, flavorFits, isSituational, validateFlavor, yearlyFlavor, type FlavorYear } from '../systems/flavor';
import type { GameState, Person, RelationshipKind } from '../types';

/** A 40-year-old with no job, nobody around and an empty queue, at the start of a year. */
function adult(age = 40, seed = 1): GameState {
  const s = createLife({ countryCode: 'US' }, 42);
  return { ...s, rng: new Rng(seed).snapshot(), year: s.character.birthYear + age, character: { ...s.character, age }, people: {}, eventQueue: [], flavorSeen: {} };
}

function person(kind: RelationshipKind, extra: Partial<Person> = {}): Person {
  return { ...makePerson(new Rng(5), { kind, age: 30, countryCode: 'US', playerAge: 40 }), ...extra };
}

const withPeople = (s: GameState, ...people: Person[]): GameState => ({ ...s, people: Object.fromEntries(people.map((p) => [p.id, p])) });

const quietYear = (start: GameState): FlavorYear => ({ start, lines: 0, event: false });

/** The flavor line written this call, if any. */
function picked(s: GameState, year: FlavorYear, lines: readonly FlavorLine[]): string | undefined {
  const out = yearlyFlavor(s, year, lines);
  expect(out.log.length - s.log.length).toBeLessThanOrEqual(1);
  return out.log.length > s.log.length ? out.log[out.log.length - 1]!.text : undefined;
}

const GENERIC: FlavorLine = { minAge: 0, maxAge: 120, text: 'I generic.' };
const JOBLESS: FlavorLine = { minAge: 0, maxAge: 120, conditions: [{ hasJob: false }], text: 'I jobless.' };
const QUIET: FlavorLine = { minAge: 0, maxAge: 120, quiet: true, text: 'Nothing happened to me.' };
const PRISON: FlavorLine = { minAge: 18, maxAge: 120, conditions: [{ inPrison: true }], text: 'I prison.' };

describe('flavor content', () => {
  it('every line passes the content checks', () => {
    expect(validateFlavor(FLAVOR)).toEqual([]);
  });

  it('seeds at least 60 situational lines covering every listed topic', () => {
    const situational = FLAVOR.filter(isSituational);
    expect(situational.length).toBeGreaterThanOrEqual(60);
    const has = (l: FlavorLine, test: (c: Condition) => boolean) => (l.conditions ?? []).some(test);
    const topics: Record<string, (l: FlavorLine) => boolean> = {
      prison: (l) => l.minAge >= 18 && has(l, (c) => 'inPrison' in c && c.inPrison),
      juvenile: (l) => l.maxAge <= 17 && has(l, (c) => 'inPrison' in c && c.inPrison),
      university: (l) => has(l, (c) => 'stage' in c && c.stage.includes('university')),
      grad: (l) => has(l, (c) => 'stage' in c && c.stage.includes('graduate')),
      retirement: (l) => l.minAge >= 65 && has(l, (c) => 'retired' in c && c.retired),
      married10: (l) => has(l, (c) => 'yearsMarried' in c && c.yearsMarried.eq === 10),
      married25: (l) => has(l, (c) => 'yearsMarried' in c && c.yearsMarried.eq === 25),
      married40: (l) => has(l, (c) => 'yearsMarried' in c && c.yearsMarried.eq === 40),
      pets: (l) => !!l.person?.kind.includes('pet'),
      chronic: (l) => has(l, (c) => 'hasIllness' in c),
      addiction: (l) => has(l, (c) => 'addiction' in c),
      hustle: (l) => has(l, (c) => 'hustleLevel' in c),
      unemployed: (l) => has(l, (c) => 'hasJob' in c && !c.hasJob) && !has(l, (c) => 'retired' in c && c.retired),
      debt: (l) => has(l, (c) => 'netWorth' in c),
      singleParent: (l) => !!l.person?.kind.includes('child') && has(l, (c) => 'married' in c && !c.married),
      grandparent: (l) => has(l, (c) => 'flag' in c && c.flag === 'grandparent'),
      ninety: (l) => l.minAge >= 90 && isSituational(l),
    };
    for (const [topic, test] of Object.entries(topics)) expect([topic, situational.filter(test).length >= 2]).toEqual([topic, true]);
  });

  it('job hunting is for players without a living, and the 90+ couple line for a couple of an age', () => {
    const line = (start: string) => FLAVOR.find((l) => l.text.startsWith(start))!;
    const hunting = line('I refreshed the job listings');
    const idle = adult(40);
    const hustle = (level: number): GameState => ({ ...idle, career: { ...idle.career, hustle: { defId: 'app_dev', name: 'Indie app developer', level, followers: 0, yearsActive: 5, lastIncome: 0 } } });
    expect(flavorFits(hunting, idle, idle)).toBe(true);
    expect(flavorFits(hunting, hustle(1), hustle(1))).toBe(true);
    // A side hustle at level 4 pays the bills: no job listings to refresh.
    expect(flavorFits(hunting, hustle(4), hustle(4))).toBe(false);
    const older = line('{{person}} and I sat together most evenings and argued about which of us is older');
    const couple = (spouseAge: number) => withPeople(adult(92), person('spouse', { age: spouseAge, marriedAtAge: 40 }));
    expect(flavorFits(older, couple(88), couple(88))).toBe(true);
    expect(flavorFits(older, couple(61), couple(61))).toBe(false);
  });

  it('rejects broken lines', () => {
    const problems = (l: Partial<FlavorLine>) => validateFlavor([{ minAge: 0, maxAge: 120, text: 'I did a thing.', ...l }]);
    expect(problems({})).toEqual([]);
    expect(problems({ text: 'I met {{nobody}}.' }).join()).toMatch(/unknown placeholder nobody/);
    expect(problems({ text: 'I walked {{person}}.' }).join()).toMatch(/no person selector/);
    expect(problems({ text: 'I had a year where nothing happened.' }).join()).toMatch(/quiet: true/);
    expect(problems({ text: 'I had a year where nothing happened.', quiet: true })).toEqual([]);
    expect(problems({ conditions: [{ hasIllness: ['space_flu'] }] }).join()).toMatch(/unknown illness space_flu/);
    expect(problems({ text: 'The sun came up.' }).join()).toMatch(/first person/);
    expect(problems({ text: `I ${'waited '.repeat(20)}.` }).join()).toMatch(/keep journal lines to 100/);
    expect(problems({ person: { kind: ['pet'] }, text: '{{They}} are loud, and I love it.' }).join()).toMatch(/singular verb/);
    expect(validateFlavor([GENERIC, GENERIC]).join()).toMatch(/duplicate/);
  });
});

describe('new conditions', () => {
  it('hasIllness, yearsMarried and hustleLevel read the state', () => {
    let s = adult(40);
    expect(evaluateCondition(s, { hasIllness: ['arthritis'] })).toBe(false);
    s = giveIllness(s, 'arthritis');
    expect(evaluateCondition(s, { hasIllness: ['asthma', 'arthritis'] })).toBe(true);
    expect(evaluateCondition(s, { yearsMarried: { gte: 0 } })).toBe(false);
    const married = withPeople(s, person('spouse', { marriedAtAge: 15 }));
    expect(evaluateCondition(married, { yearsMarried: { eq: 25 } })).toBe(true);
    expect(evaluateCondition(married, { yearsMarried: { gte: 26 } })).toBe(false);
    expect(evaluateCondition(s, { hustleLevel: { gte: 0 } })).toBe(false);
    const hustling: GameState = { ...s, career: { ...s.career, hustle: { defId: 'etsy', name: 'Craft shop', level: 1, followers: 0, yearsActive: 2, lastIncome: 0 } } };
    expect(evaluateCondition(hustling, { hustleLevel: { lte: 1 } })).toBe(true);
    expect(evaluateCondition(hustling, { hustleLevel: { gte: 2 } })).toBe(false);
  });

  it('the event validator rejects an unknown illness id too', () => {
    const def: EventDef = {
      id: 'test_ill', category: 'health', title: 'Test', text: 'I felt odd.', minAge: 0, maxAge: 120, weight: 1,
      conditions: [{ any: [{ hasIllness: ['space_flu'] }] }],
      choices: [{ id: 'ok', label: 'Shrug', conditions: [{ hasIllness: ['arthritis'] }], effects: [] }],
    };
    expect(validateEvent(def, new Set([def.id]))).toEqual(['event test_ill: unknown illness space_flu (see src/data/illnesses.ts)']);
  });
});

describe('choosing the yearly flavor line', () => {
  it('a quiet year always gets one line, and a situational line is three times as likely as a generic one', () => {
    let situational = 0;
    const n = 2000;
    for (let i = 0; i < n; i++) {
      const s = adult(40, i + 1);
      const text = picked(s, quietYear(s), [GENERIC, JOBLESS]);
      expect(text).toBeDefined();
      if (text === JOBLESS.text) situational++;
    }
    const expected = FLAVOR_RULES.situationalWeight / (FLAVOR_RULES.situationalWeight + 1);
    expect(Math.abs(situational / n - expected)).toBeLessThan(0.04);
  });

  it('a busy year only sometimes adds a situational line, and never a generic one', () => {
    let added = 0;
    const n = 2000;
    for (let i = 0; i < n; i++) {
      const s = adult(40, i + 1);
      const text = picked(s, { start: s, lines: 2, event: true }, [GENERIC, JOBLESS]);
      expect(text).not.toBe(GENERIC.text);
      if (text) added++;
    }
    expect(Math.abs(added / n - FLAVOR_RULES.busyYearChance)).toBeLessThan(0.04);
  });

  it('keeps "nothing happened" lines for years with no other lines and no event card', () => {
    const s = adult(40);
    expect(picked(s, { start: s, lines: 0, event: false }, [QUIET])).toBe(QUIET.text);
    for (let i = 1; i <= 50; i++) {
      const t = adult(40, i);
      expect(picked(t, { start: t, lines: 0, event: true }, [QUIET])).toBeUndefined();
      expect(picked(t, { start: t, lines: 1, event: false }, [QUIET])).toBeUndefined();
      // With a card coming, a quiet year still gets an ordinary line.
      expect(picked(t, { start: t, lines: 0, event: true }, [QUIET, GENERIC])).toBe(GENERIC.text);
    }
  });

  it('adds nothing to a busy year that brought a death, a severe diagnosis or the doctor warning', () => {
    const mother = person('mother');
    const start = withPeople(adult(40), mother);
    const grieving = withPeople(start, { ...mother, alive: false, deathAge: 70 });
    const diagnosed = giveIllness(start, 'cancer');
    const warned: GameState = { ...start, health: { ...start.health, criticalYears: 1 } };
    for (let i = 1; i <= 60; i++) {
      for (const now of [grieving, diagnosed, warned]) expect(picked({ ...now, rng: new Rng(i).snapshot() }, { start, lines: 1, event: false }, [JOBLESS])).toBeUndefined();
    }
    // The same busy year without that news can carry the line.
    expect(Array.from({ length: 60 }, (_, i) => picked({ ...start, rng: new Rng(i + 1).snapshot() }, { start, lines: 1, event: false }, [JOBLESS])).some(Boolean)).toBe(true);
  });

  it('never repeats a line within ten years, and a quiet year with every line used recently still gets one', () => {
    const twelve = Array.from({ length: 12 }, (_, i): FlavorLine => ({ minAge: 0, maxAge: 120, text: `I did thing ${i + 1}.` }));
    for (const lines of [twelve, twelve.slice(0, 2)]) {
      let s = adult(30, 9);
      const lastSeen = new Map<string, number>();
      for (let age = 30; age < 60; age++) {
        s = { ...s, character: { ...s.character, age } };
        const before = s.log.length;
        s = yearlyFlavor(s, quietYear(s), lines);
        expect(s.log.length).toBe(before + 1);
        const text = s.log[s.log.length - 1]!.text;
        const prev = lastSeen.get(text);
        // With enough lines nothing comes back within the gap; with two, the one written longest ago does.
        if (prev !== undefined && lines.length > FLAVOR_RULES.repeatGap) expect(age - prev).toBeGreaterThanOrEqual(FLAVOR_RULES.repeatGap);
        if (prev !== undefined && lines.length === 2) expect(age - prev).toBe(2);
        lastSeen.set(text, age);
        // The memory keeps only the window.
        for (const at of Object.values(s.flavorSeen ?? {})) expect(age - at).toBeLessThan(FLAVOR_RULES.repeatGap);
      }
    }
  });

  it('only writes about a situation that held all year', () => {
    const jailed = sendToPrison(adult(30), 3);
    const released: GameState = { ...jailed, crime: { ...jailed.crime, inPrison: false, sentenceYearsLeft: 0 } };
    expect(flavorFits(PRISON, jailed, jailed)).toBe(true);
    expect(flavorFits(PRISON, jailed, released)).toBe(false);
    const ARTHRITIS: FlavorLine = { minAge: 35, maxAge: 120, conditions: [{ hasIllness: ['arthritis'] }], text: 'I creak.' };
    const before = adult(50);
    const after = giveIllness(before, 'arthritis');
    expect(flavorFits(ARTHRITIS, before, after)).toBe(false);
    expect(flavorFits(ARTHRITIS, after, after)).toBe(true);
    // A pet that arrived this year is not written about yet; one that was already there is, by name.
    const PET: FlavorLine = { minAge: 6, maxAge: 120, person: { kind: ['pet'] }, text: '{{person}} snored and {{they}} regrets nothing.' };
    const pet = person('pet', { firstName: 'Biscuit', gender: 'male' });
    const home = withPeople(adult(40), pet);
    expect(flavorFits(PET, adult(40), home)).toBe(false);
    expect(picked(home, quietYear(home), [PET])).toBe('Biscuit snored and he regrets nothing.');
  });

  it('counts anniversaries from the wedding, as of this birthday', () => {
    const TEN: FlavorLine = { minAge: 20, maxAge: 120, person: { kind: ['spouse'] }, conditions: [{ yearsMarried: { eq: 10 } }], text: 'Ten years married to {{person}}.' };
    const spouse = person('spouse', { firstName: 'Ana', marriedAtAge: 30 });
    const at = (age: number) => withPeople(adult(age), spouse);
    expect(flavorFits(TEN, at(40), at(40))).toBe(true);
    expect(flavorFits(TEN, at(39), at(39))).toBe(false);
    expect(picked(at(40), quietYear(at(40)), [TEN])).toBe('Ten years married to Ana.');
  });

  it('in prison, only lines written for prison', () => {
    const s = sendToPrison(adult(30), 4);
    for (let i = 1; i <= 50; i++) expect(picked({ ...s, rng: new Rng(i).snapshot() }, quietYear(s), [GENERIC, JOBLESS, PRISON])).toBe(PRISON.text);
  });

  it('a year that began behind bars and ended in release gets no line about life outside', () => {
    // Released at this birthday's year: most of it was spent inside, so no job hunting, no pet in my spot "all year".
    const pet = person('pet', { firstName: 'Biscuit' });
    const jailed = withPeople(sendToPrison(adult(30), 1), pet);
    const released: GameState = { ...jailed, crime: { ...jailed.crime, inPrison: false, sentenceYearsLeft: 0 } };
    const PET: FlavorLine = { minAge: 6, maxAge: 120, person: { kind: ['pet'] }, text: '{{person}} slept in my spot all year.' };
    for (const line of [JOBLESS, PET, PRISON]) expect([line.text, flavorFits(line, jailed, released)]).toEqual([line.text, false]);
    for (let i = 1; i <= 50; i++) expect(picked({ ...released, rng: new Rng(i).snapshot() }, { start: jailed, lines: 1, event: false }, [JOBLESS, PET, PRISON])).toBeUndefined();
    // The next year, out all year, they fit again.
    expect(flavorFits(JOBLESS, released, released)).toBe(true);
    expect(flavorFits(PET, released, released)).toBe(true);
  });
});

describe('flavor lines over whole lives', () => {
  const lives = [
    ...Array.from({ length: 40 }, (_, i) => simulateLife(300 + i, balancedPolicy).state),
    ...Array.from({ length: 15 }, (_, i) => simulateLife(700 + i, recklessPolicy).state),
  ];
  const templates = new Set(FLAVOR.filter((l) => !l.text.includes('{{')).map((l) => l.text));
  const quiet = new Set(FLAVOR.filter((l) => l.quiet).map((l) => l.text));
  const situational = new Set(FLAVOR.filter((l) => isSituational(l) && !l.text.includes('{{')).map((l) => l.text));

  /** Each year's journal entries, header first. */
  function years(s: GameState) {
    const out: GameState['log'][] = [];
    for (const entry of s.log) {
      if (entry.kind === 'year') out.push([entry]);
      else out[out.length - 1]?.push(entry);
    }
    return out;
  }

  it('a "nothing happened" line never shares its year with other news or an event card', () => {
    let seen = 0;
    for (const life of lives) {
      for (const year of years(life)) {
        const i = year.findIndex((e) => quiet.has(e.text));
        if (i < 0) continue;
        seen++;
        expect(i).toBe(1);
        expect(year.some((e) => e.kind === 'event' || e.kind === 'death')).toBe(false);
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('no line comes back within ten years, and situational lines show up', () => {
    let situationalSeen = 0;
    for (const life of lives) {
      const last = new Map<string, number>();
      for (const entry of life.log) {
        if (!templates.has(entry.text)) continue;
        const prev = last.get(entry.text);
        if (prev !== undefined) expect(entry.age - prev).toBeGreaterThanOrEqual(FLAVOR_RULES.repeatGap);
        last.set(entry.text, entry.age);
        if (situational.has(entry.text)) situationalSeen++;
      }
    }
    expect(situationalSeen).toBeGreaterThan(lives.length);
  });
});
