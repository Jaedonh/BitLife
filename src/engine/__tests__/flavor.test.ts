import { FLAVOR, type FlavorLine } from '@/data/flavor';
import { ageUp } from '../ageUp';
import { evaluateCondition } from '../events/conditions';
import { giveIllness, sendToPrison } from '../events/effects';
import { validateEvent, type Condition, type EventDef } from '../events/schema';
import { Rng } from '../rng';
import { balancedPolicy, recklessPolicy, simulateLife } from '../simulate';
import { createLife, makePerson } from '../systems/character';
import { markDeath } from '../systems/death';
import { FLAVOR_RULES, flavorFits, isSituational, settleQuietYear, validateFlavor, yearlyFlavor, type FlavorYear } from '../systems/flavor';
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
      grandparent: (l) => [...(l.person ? [l.person] : []), ...(l.groups ?? [])].some((g) => g.kind.includes('grandchild')) || has(l, (c) => 'hasPerson' in c && c.hasPerson.includes('grandchild')),
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
    expect(problems({ text: 'I had a year where nothing happened in {{city}}.', quiet: true }).join()).toMatch(/quiet line has no placeholders/);
    expect(problems({ conditions: [{ hasIllness: ['space_flu'] }] }).join()).toMatch(/unknown illness space_flu/);
    expect(problems({ text: 'The sun came up.' }).join()).toMatch(/first person/);
    expect(problems({ text: `I ${'waited '.repeat(20)}.` }).join()).toMatch(/keep journal lines to 100/);
    expect(problems({ person: { kind: ['pet'] }, text: '{{They}} are loud, and I love it.' }).join()).toMatch(/singular verb/);
    expect(validateFlavor([GENERIC, GENERIC]).join()).toMatch(/duplicate/);
  });

  it('rejects family a line cannot be sure of: "my parents" for a child, plurals without two, an unbound grandmother, homework for a dropout', () => {
    const problems = (l: Partial<FlavorLine>) => validateFlavor([{ minAge: 40, maxAge: 120, text: 'I did a thing.', ...l }]).join();
    // A child may be an orphan or have one parent: {{parents}} renders whoever is there.
    expect(problems({ minAge: 10, maxAge: 14, text: 'I discovered music that my parents hated.' })).toMatch(/\{\{parents\}\}/);
    expect(problems({ minAge: 10, maxAge: 14, text: 'I discovered music that {{parents}} hated.' })).toBe('');
    // "The grandchildren" and "my children" need two living ones, not the flag the first grandchild set.
    const plural = 'I spoiled the grandchildren rotten. My own children called it hypocritical.';
    expect(problems({ conditions: [{ flag: 'grandparent' }], text: plural })).toMatch(/grandchildren but does not require 2.*\n?.*my children but does not require 2/s);
    expect(problems({ groups: [{ kind: ['grandchild'], atLeast: 2 }], text: plural })).toMatch(/my children/);
    expect(problems({ groups: [{ kind: ['grandchild'], atLeast: 2 }, { kind: ['child'], atLeast: 2 }], text: plural })).toBe('');
    expect(problems({ groups: [{ kind: ['grandchild'], atLeast: 1 }], text: 'I spoiled the grandchildren.' })).toMatch(/require 2/);
    // Being a grandparent needs a living grandchild; a grandmother needs a real one bound.
    expect(problems({ conditions: [{ flag: 'grandparent' }], text: 'Being a grandparent suits me.' })).toMatch(/a grandchild/);
    expect(problems({ conditions: [{ hasPerson: ['grandchild'] }], text: 'Being a grandparent suits me.' })).toBe('');
    expect(problems({ minAge: 1, maxAge: 3, text: 'Grandma sang to me.' })).toMatch(/a grandmother/);
    expect(problems({ minAge: 1, maxAge: 3, person: { kind: ['grandparent'] }, text: '{{grandma}} sang to me.' })).toMatch(/a grandmother/);
    expect(problems({ minAge: 1, maxAge: 3, person: { kind: ['grandparent'], gender: 'female' }, text: '{{person}} sang to me. Grandma always does.' })).toBe('');
    // Juvenile detention: classroom lines only for a student.
    expect(problems({ minAge: 12, maxAge: 17, conditions: [{ inPrison: true }], text: 'I did my homework at a bolted-down desk.' })).toMatch(/enrolled: true/);
    expect(problems({ minAge: 12, maxAge: 17, conditions: [{ inPrison: true }, { enrolled: true }], text: 'I did my homework at a bolted-down desk.' })).toBe('');
    expect(problems({ groups: [{ kind: [], atLeast: 2 }] })).toMatch(/group needs a kind/);
    // An adult in prison may take a class; only a minor's school carries on inside.
    expect(problems({ minAge: 18, maxAge: 120, conditions: [{ inPrison: true }], text: 'I took a pottery class in here. My bowls lean.' })).toBe('');
    // Singular and gendered family words, and a literal Mom or Dad, need the people they name.
    expect(problems({ text: 'My grandkid thinks I am a wizard.' })).toMatch(/a grandchild/);
    expect(problems({ person: { kind: ['grandchild'] }, text: 'My grandkid {{person}} thinks I am a wizard.' })).toBe('');
    expect(problems({ groups: [{ kind: ['child'], atLeast: 2 }], text: 'My sons argued about the barbecue.' })).toMatch(/my sons/);
    expect(problems({ groups: [{ kind: ['child'], atLeast: 2, gender: 'male' }], text: 'My sons argued about the barbecue.' })).toBe('');
    expect(problems({ text: 'Our kids grew up faster than the hedge.' })).toMatch(/my children/);
    expect(problems({ text: 'I called Mom every Sunday.' })).toMatch(/names Mom/);
    expect(problems({ conditions: [{ hasPerson: ['mother'] }], text: 'I called Mom every Sunday.' })).toBe('');
    expect(problems({ text: 'Dad and I fixed the fence.' })).toMatch(/names Dad/);
  });
});

describe('flavor lines about family', () => {
  const line = (start: string) => FLAVOR.find((l) => l.text.startsWith(start))!;
  const grandkid = (age: number, extra: Partial<Person> = {}) => person('grandchild', { age, ...extra });
  const GRANDPARENT_LINES = FLAVOR.filter((l) => /grandchild|grandparent/.test(JSON.stringify(l)));

  it('a group needs enough of them all year, and one who died this year no longer counts', () => {
    const TWO: FlavorLine = { minAge: 40, maxAge: 120, groups: [{ kind: ['grandchild'], atLeast: 2 }], text: 'I spoiled the grandchildren.' };
    const a = grandkid(6, { id: 'gc_a' });
    const b = grandkid(8, { id: 'gc_b' });
    const one = withPeople(adult(60), a);
    const two = withPeople(adult(60), a, b);
    expect(isSituational(TWO)).toBe(true);
    expect(flavorFits(TWO, one, one)).toBe(false);
    expect(flavorFits(TWO, two, two)).toBe(true);
    // Born this year: not there at its start.
    expect(flavorFits(TWO, one, two)).toBe(false);
    // Died this year: not there at its end.
    expect(flavorFits(TWO, two, withPeople(two, a, { ...b, alive: false }))).toBe(false);
    // An age floor on the group: two toddlers do not teach anyone a dance.
    const OLD_ENOUGH: FlavorLine = { ...TWO, groups: [{ kind: ['grandchild'], atLeast: 2, minAge: 5 }] };
    const toddlers = withPeople(adult(60), grandkid(2, { id: 'gc_c' }), grandkid(3, { id: 'gc_d' }));
    expect(flavorFits(OLD_ENOUGH, toddlers, toddlers)).toBe(false);
    expect(flavorFits(OLD_ENOUGH, two, two)).toBe(true);
  });

  it('a grandparent of one gets no plural line, and nothing about grandchildren after the only one died', () => {
    const only = grandkid(7, { id: 'gc_only', firstName: 'Anika', gender: 'female' });
    const one = withPeople(adult(60), only);
    const plural = GRANDPARENT_LINES.filter((l) => /grandchildren/.test(l.text));
    expect(plural.length).toBeGreaterThanOrEqual(2);
    for (const l of plural) expect([l.text, flavorFits(l, one, one)]).toEqual([l.text, false]);
    // One grandchild still gets a line, by name.
    expect(GRANDPARENT_LINES.some((l) => flavorFits(l, one, one))).toBe(true);
    expect(picked(one, quietYear(one), [line('I showed photos of')])).toBe('I showed photos of Anika to anyone who stood still long enough.');
    // The only grandchild died: no grandparent line that year or after, though the grandparent flag stays set.
    const gone = withPeople({ ...one, flags: { ...one.flags, grandparent: true, grandchildren: 1 } }, { ...only, alive: false });
    for (const l of GRANDPARENT_LINES) {
      expect([l.text, flavorFits(l, one, gone)]).toEqual([l.text, false]);
      expect([l.text, flavorFits(l, gone, gone)]).toEqual([l.text, false]);
    }
    // The dance needs a grandchild old enough to teach it.
    const dance = line('{{person}} taught me a dance');
    const baby = withPeople(adult(55), grandkid(1));
    expect(flavorFits(dance, baby, baby)).toBe(false);
    expect(picked(one, quietYear(one), [dance])).toBe('Anika taught me a dance. I did it badly on purpose, and she loved it.');
  });

  it('the candy, the spoiling and the dance are for grandchildren who are still kids', () => {
    const grown = withPeople(adult(88), person('child', { id: 'c1', age: 60 }), person('child', { id: 'c2', age: 58 }), grandkid(31, { id: 'g1' }), grandkid(27, { id: 'g2' }));
    const kids = withPeople(adult(68), person('child', { id: 'c1', age: 40 }), person('child', { id: 'c2', age: 38 }), grandkid(9, { id: 'g1' }), grandkid(6, { id: 'g2' }));
    for (const start of ['I kept a drawer of candy', 'I spoiled the grandchildren rotten', '{{person}} taught me a dance']) {
      expect([start, flavorFits(line(start), grown, grown)]).toEqual([start, false]);
      expect([start, flavorFits(line(start), kids, kids)]).toEqual([start, true]);
    }
    // Grown grandchildren still get a line: their photos, and being a grandparent.
    expect(flavorFits(line('I showed photos of'), grown, grown)).toBe(true);
    expect(flavorFits(line('Being a grandparent'), grown, grown)).toBe(true);
  });

  it('"my children" needs two living children', () => {
    const old = line('My children are getting old');
    const kid = (id: string) => person('child', { id, age: 65 });
    const oneChild = withPeople(adult(92), kid('c1'));
    const twoChildren = withPeople(adult(92), kid('c1'), kid('c2'));
    expect(flavorFits(old, oneChild, oneChild)).toBe(false);
    expect(flavorFits(old, twoChildren, twoChildren)).toBe(true);
    const spoiled = line('I spoiled the grandchildren rotten');
    const grand = withPeople(adult(70), kid('c1'), grandkid(6, { id: 'g1' }), grandkid(9, { id: 'g2' }));
    expect(flavorFits(spoiled, grand, grand)).toBe(false);
    const both = withPeople(grand, ...Object.values(grand.people), kid('c2'));
    expect(flavorFits(spoiled, both, both)).toBe(true);
  });

  it('a child\'s music line names whoever raises them', () => {
    const music = line('I discovered music that');
    const kid = (...people: Person[]) => withPeople(adult(12), ...people);
    const both = kid(person('mother', { id: 'mom' }), person('father', { id: 'dad', gender: 'male' }));
    expect(picked(both, quietYear(both), [music])).toBe('I discovered music that Mom and Dad hated. This was the point.');
    const single = kid(person('mother'));
    expect(picked(single, quietYear(single), [music])).toBe('I discovered music that Mom hated. This was the point.');
    const foster = kid(person('stepfather', { firstName: 'Ethan', gender: 'male' }));
    expect(picked(foster, quietYear(foster), [music])).toBe('I discovered music that Ethan hated. This was the point.');
  });

  it('the detention homework line is for a student, not a dropout', () => {
    const homework = line('I did my homework at a bolted-down desk');
    const teen = adult(16);
    const student = sendToPrison({ ...teen, education: { ...teen.education, stage: 'high', enrolled: true, droppedOut: false } }, 2);
    const dropout = sendToPrison({ ...teen, education: { ...teen.education, stage: 'done', enrolled: false, droppedOut: true } }, 2);
    expect([student.crime.juvenile, student.education.enrolled]).toEqual([true, true]);
    expect(flavorFits(homework, student, student)).toBe(true);
    expect(flavorFits(homework, dropout, dropout)).toBe(false);
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

  it('takes a "nothing happened" line back at the next birthday when the player\'s own doings filled that year', () => {
    const header = (s: GameState, age: number) => ({ age, year: s.character.birthYear + age, text: `${s.character.birthYear + age}: Age ${age}`, kind: 'year' as const });
    const base = adult(41);
    const quietLine = { age: 40, year: base.year - 1, text: QUIET.text, kind: 'info' as const };
    const arrest = { age: 40, year: base.year - 1, text: 'I was arrested for shoplifting. My case went to court.', kind: 'bad' as const };
    // Last year: the quiet line at the birthday, then an arrest the player brought on later that year.
    const busy: GameState = { ...base, log: [...base.log, header(base, 40), quietLine, arrest] };
    // This year's header is written, then the flavor pass runs: last year keeps its news and loses the quiet line.
    const now: GameState = { ...busy, log: [...busy.log, header(base, 41)] };
    const out = yearlyFlavor(now, { start: busy, lines: 0, event: true }, [GENERIC, QUIET]);
    expect(out.log.map((e) => e.text)).not.toContain(QUIET.text);
    expect(out.log.map((e) => e.text)).toContain(arrest.text);
    expect(out.log.filter((e) => e.kind === 'year')).toHaveLength(now.log.filter((e) => e.kind === 'year').length);
    // A year that stayed quiet keeps its line, so no year is left empty.
    const calm: GameState = { ...base, log: [...base.log, header(base, 40), quietLine] };
    const kept = yearlyFlavor({ ...calm, log: [...calm.log, header(base, 41)] }, { start: calm, lines: 0, event: true }, [GENERIC, QUIET]);
    expect(kept.log.map((e) => e.text)).toContain(QUIET.text);
    // Only last year is settled; an older year was settled at its own next birthday. Wherever a life ends, the
    // caller can settle its last year directly.
    expect(settleQuietYear(busy, busy.log.length, [QUIET]).log.map((e) => e.text)).toEqual([...base.log, header(base, 40), arrest].map((e) => e.text));
    expect(settleQuietYear(calm, calm.log.length, [QUIET])).toBe(calm);
    expect(settleQuietYear(base, base.log.length, [QUIET])).toBe(base);
  });

  it('settles the quiet line when the life ends: a death at the next birthday, or one during the year', () => {
    // The engine settles with the real catalog, so this uses a real quiet line.
    const quiet = FLAVOR.find((l) => l.quiet)!.text;
    const base = adult(40);
    const line = (age: number, text: string, kind: 'info' | 'bad' | 'year' = 'info') => ({ age, year: base.character.birthYear + age, text, kind });
    const header = (age: number) => line(age, `${base.character.birthYear + age}: Age ${age}`, 'year');
    const arrest = 'I was arrested for shoplifting. My case went to court.';
    const texts = (s: GameState) => s.log.map((e) => e.text);
    const busy: GameState = { ...base, log: [...base.log, header(40), line(40, quiet), line(40, arrest, 'bad')] };

    // The doctor's last warning runs out at the next birthday: the life ends before the flavor pass that settles last
    // year, so ageUp settles it itself. Last year keeps its header and its news.
    const failing: GameState = { ...busy, character: { ...busy.character, stats: { ...busy.character.stats, health: 1 } }, health: { ...busy.health, criticalYears: 1 } };
    const died = ageUp(failing);
    expect(died.alive).toBe(false);
    expect(died.character.age).toBe(41);
    expect(texts(died)).not.toContain(quiet);
    expect(texts(died).slice(base.log.length, base.log.length + 3)).toEqual([header(40).text, arrest, header(41).text]);

    // A death during the year (an event card) fills that year, so its own quiet line goes, even when it was the only one.
    const midYear = markDeath(busy, 'a car accident');
    expect(texts(midYear)).not.toContain(quiet);
    expect(texts(midYear).slice(base.log.length, base.log.length + 2)).toEqual([header(40).text, arrest]);
    const calmYear = markDeath({ ...base, log: [...base.log, header(40), line(40, quiet)] }, 'a car accident');
    expect(texts(calmYear)).not.toContain(quiet);
    expect(calmYear.log.slice(base.log.length + 1).map((e) => e.kind)).toEqual(['death', 'death']);

    // An earlier year that stayed quiet was settled at its own birthday and keeps its line.
    const earlier: GameState = { ...base, log: [...base.log, header(39), line(39, quiet), header(40), line(40, arrest, 'bad')] };
    expect(texts(markDeath(earlier, 'a car accident'))).toContain(quiet);
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

  /** Years that kept a quiet line. */
  const quietYears = (s: GameState) => years(s).filter((y) => y.some((e) => quiet.has(e.text))).length;
  // Quiet years are rare (a handful in the lives above), so more lives are played until enough turn up: the check
  // below never runs on nothing, whatever the seeds and the content's dice.
  const quietLives = [...lives];
  for (let seed = 1000, found = lives.reduce((n, s) => n + quietYears(s), 0); found < 5 && seed < 1400; seed++) {
    const s = simulateLife(seed, seed % 3 ? balancedPolicy : recklessPolicy).state;
    found += quietYears(s);
    quietLives.push(s);
  }

  it('a "nothing happened" line never shares its year with other news or an event card', () => {
    let seen = 0;
    for (const life of quietLives) {
      for (const year of years(life)) {
        const i = year.findIndex((e) => quiet.has(e.text));
        if (i < 0) continue;
        seen++;
        // The line is chosen at the birthday and taken back if the player's own doings (a crime, its court card, a
        // visit) filled the year: at the next birthday, or when the life ends (a death at that birthday, or during
        // the year). So every year of every life, its last two included, keeps it only as its one line.
        expect(year.map((e) => e.text)).toEqual([year[0]!.text, year[i]!.text]);
      }
    }
    expect(seen).toBeGreaterThanOrEqual(5);
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
