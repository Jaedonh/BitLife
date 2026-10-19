import { ageUp, createLife, EVENT_REGISTRY, resolveChoice, SCHEMA_VERSION } from '@/engine';
import { Rng } from '@/engine/rng';
import { DEBT_CALLS, yearlyFinance } from '@/engine/systems/finance';
import type { GameState } from '@/engine/types';
import { migrateSave } from '../migrations';

/** A real save after a few decades of play, exactly as it comes back from AsyncStorage. */
function playedSave(years = 40): GameState {
  let g = createLife({ countryCode: 'US' }, 1234, 1_700_000_000_000);
  for (let i = 0; i < years && g.alive; i++) {
    g = ageUp(g);
    while (g.pendingEvent) g = resolveChoice(g, g.pendingEvent.choices[0]!.id, EVENT_REGISTRY);
  }
  return JSON.parse(JSON.stringify(g)) as GameState;
}

const withField = (save: GameState, path: string, value: unknown): unknown => {
  const copy = JSON.parse(JSON.stringify(save));
  const keys = path.split('.');
  let cursor = copy;
  for (const k of keys.slice(0, -1)) cursor = cursor[k];
  cursor[keys[keys.length - 1]!] = value;
  return copy;
};

describe('migrateSave', () => {
  it('accepts real saves unchanged', () => {
    const fresh = JSON.parse(JSON.stringify(createLife({}, 7, Date.now()))) as GameState;
    expect(migrateSave(fresh)).toEqual(fresh);
    const played = playedSave();
    expect(played.character.age).toBeGreaterThan(10);
    expect(migrateSave(played)).toEqual(played);
    // a finished life (death screen) is a valid save too
    const dead = playedSave(130);
    expect(dead.alive).toBe(false);
    expect(migrateSave(dead)).toEqual(dead);
  });

  it('rejects things that are not saves', () => {
    expect(migrateSave(null)).toBeNull();
    expect(migrateSave('{not json')).toBeNull();
    expect(migrateSave([])).toBeNull();
    expect(migrateSave({})).toBeNull();
    expect(migrateSave({ schemaVersion: SCHEMA_VERSION + 1 })).toBeNull();
    // passes the old presence check but every screen would crash on it
    expect(migrateSave({ schemaVersion: SCHEMA_VERSION, character: {}, finances: {}, people: {}, log: [], alive: true })).toBeNull();
  });

  it('rejects a save with a missing or mistyped field instead of crashing later', () => {
    const save = playedSave();
    const broken: [string, unknown][] = [
      ['character.stats', null],
      ['character.stats.happiness', 'high'],
      ['character.age', 999],
      ['character.age', -1],
      ['character.id', 42],
      ['education', null],
      ['career', null],
      ['career.job', 'none'],
      ['career.listings', null],
      ['finances', null],
      ['finances.cash', Infinity],
      ['finances.cash', '1000'],
      ['finances.investments', {}],
      ['health', null],
      ['health.illnesses', null],
      ['crime', null],
      ['people', []],
      ['people', { p1: 'Bob' }],
      ['assets', null],
      ['log', {}],
      ['log', [{ text: 1 }]],
      ['eventQueue', null],
      ['flags', null],
      ['firedEvents', null],
      ['actionsThisYear', null],
      ['counters', null],
      ['counters.jobsHeld', 'many'],
      ['ancestors', null],
      ['achievements', [1]],
      ['rng', null],
      ['rng.s', 'x'],
      ['year', null],
      ['generation', '1'],
      ['alive', 'yes'],
      ['pendingEvent', { eventId: 'x' }],
    ];
    for (const [path, value] of broken) {
      expect(migrateSave(withField(save, path, value))).toBeNull();
    }
    // a dead save needs the death record the tombstone screen renders
    const dead = playedSave(130);
    expect(migrateSave(withField(dead, 'death', null))).toBeNull();
    expect(migrateSave(withField(dead, 'death', { cause: 'x' }))).toBeNull();
    // ...and the untouched copy still passes
    expect(migrateSave(withField(save, 'character.age', save.character.age))).not.toBeNull();
  });

  it('loads saves from before juvenile court and parole, moving a jailed teen to juvenile detention', () => {
    // Saved by the old engine: a 15-year-old serving five years with adults, school ended, no juvenile or parole fields.
    const g = createLife({ countryCode: 'US' }, 1234, 1_700_000_000_000);
    const old = JSON.parse(
      JSON.stringify({
        ...g,
        year: g.character.birthYear + 15,
        character: { ...g.character, age: 15 },
        education: { ...g.education, stage: 'high', enrolled: false, grade: 55 },
        crime: { record: true, arrests: 1, convictions: 1, crimesCommitted: 3, inPrison: true, sentenceYearsLeft: 5, prisonYearsTotal: 1, notoriety: 15 },
      }),
    );
    const teen = migrateSave(old);
    expect(teen?.crime.juvenile).toBe(true);
    expect(teen?.crime.sentenceYearsLeft).toBe(2);
    expect(teen?.education.enrolled).toBe(true);
    // An adult inside gets the length of the stay, so parole can be worked out; mistyped new fields are rejected.
    const adult = migrateSave({ ...old, character: { ...old.character, age: 30 }, year: g.character.birthYear + 30 });
    expect(adult?.crime.juvenile).toBeUndefined();
    expect(adult?.crime.sentenceYears).toBe(5);
    expect(migrateSave(withField(old, 'crime.paroleYearsLeft', 'two'))).toBeNull();
    expect(migrateSave(withField(old, 'crime.juvenile', 1))).toBeNull();
  });

  it('loads a save from before flavor lines were remembered, and forgets a mangled memory instead of failing', () => {
    // Saved mid-life, so there are years left to play on.
    const played = playedSave(20);
    expect(played.flavorSeen).toBeDefined();
    // The old shape: no flavorSeen at all.
    const old = JSON.parse(JSON.stringify(played)) as Record<string, unknown>;
    delete old.flavorSeen;
    const loaded = migrateSave(old);
    expect(loaded).not.toBeNull();
    expect(loaded!.flavorSeen).toBeUndefined();
    // It plays on: the next years write flavor lines and start remembering them (flavor lines are rare, so up to 30 years).
    let g = loaded!;
    for (let i = 0; i < 30 && g.alive && !Object.keys(g.flavorSeen ?? {}).length; i++) {
      g = ageUp(g);
      while (g.pendingEvent) g = resolveChoice(g, g.pendingEvent.choices[0]!.id, EVENT_REGISTRY);
    }
    expect(Object.keys(g.flavorSeen ?? {}).length).toBeGreaterThan(0);
    for (const mangled of [null, 'yes', [1, 2], { 'A line.': 'thirty' }]) {
      const fixed = migrateSave(withField(played, 'flavorSeen', mangled));
      expect(fixed).not.toBeNull();
      expect(fixed!.flavorSeen).toBeUndefined();
      expect(fixed!.character).toEqual(played.character);
    }
    expect(migrateSave(played)!.flavorSeen).toEqual(played.flavorSeen);
  });
});

describe('saves from before grandparents, coworker links and children growing up (S1)', () => {
  /** An older save: no grandparents or grandchildren, no family links, milestones or coworker workplaces. */
  function oldShapeSave(): GameState {
    const save = playedSave(45) as unknown as Record<string, unknown> & GameState;
    const people: Record<string, unknown> = {};
    for (const [id, p] of Object.entries(save.people)) {
      if (p.kind === 'grandparent' || p.kind === 'grandchild') continue;
      const { viaId: _v, growth: _g, workplace: _w, ...rest } = p;
      people[id] = rest;
    }
    // A grown child and a coworker as they were stored back then.
    people.kid_old = { id: 'kid_old', firstName: 'Ada', lastName: save.character.lastName, gender: 'female', age: 30, alive: true, kind: 'child', relationship: 70, looks: 50, smarts: 50, health: 90, craziness: 10, occupation: 'Student', money: 0, memory: { lastInteractionAge: 44, insults: 0, compliments: 0, gifts: 0, fights: 0, yearsNeglected: 0 }, metAtAge: 15 };
    people.mate_old = { ...(people.kid_old as object), id: 'mate_old', firstName: 'Bo', kind: 'coworker', age: 44, metAtAge: 40 };
    const flags = { ...save.flags };
    delete flags.grandchildren;
    return JSON.parse(JSON.stringify({ ...save, people, flags })) as GameState;
  }

  it('loads unchanged and keeps playing', () => {
    const old = oldShapeSave();
    const loaded = migrateSave(old);
    expect(loaded).toEqual(old);
    let g = loaded!;
    const linesBefore = g.log.length;
    for (let i = 0; i < 5 && g.alive; i++) {
      g = ageUp(g);
      while (g.pendingEvent) g = resolveChoice(g, g.pendingEvent.choices[0]!.id, EVENT_REGISTRY);
    }
    // A child past 26 with no record has long since moved out: no move-out line for them now.
    expect(g.log.slice(linesBefore).some((l) => l.text.startsWith('My daughter Ada moved out'))).toBe(false);
    // A coworker with no workplace link stays where they are.
    if (g.alive) expect(g.people.mate_old?.kind).toBe('coworker');
  });

  it('rejects a mistyped family link or milestone record', () => {
    const save = playedSave(20);
    const id = Object.keys(save.people)[0]!;
    expect(migrateSave(withField(save, `people.${id}.growth`, 'grown'))).toBeNull();
    expect(migrateSave(withField(save, `people.${id}.viaId`, 7))).toBeNull();
    expect(migrateSave(withField(save, `people.${id}.workplace`, { jobId: 'x' }))).toBeNull();
    expect(migrateSave(withField(save, `people.${id}.growth`, { movedOut: true }))).not.toBeNull();
  });
});

describe('saves from before starting scenarios (S2)', () => {
  /** A life saved before scenarios: no scenario or move plan on the character, no scenario flag, no foster links. */
  function preScenarioSave(): GameState {
    const save = playedSave(12) as unknown as GameState;
    const { scenario: _s, moveAbroad: _m, ...character } = save.character;
    const flags = Object.fromEntries(Object.entries(save.flags).filter(([k]) => !k.startsWith('scenario:')));
    const people = Object.fromEntries(Object.entries(save.people).map(([id, p]) => {
      const { foster: _f, ...rest } = p;
      return [id, rest];
    }));
    return JSON.parse(JSON.stringify({ ...save, character, flags, people })) as GameState;
  }

  it('loads unchanged and keeps playing with no scenario rules', () => {
    const old = preScenarioSave();
    expect(old.character.scenario).toBeUndefined();
    const loaded = migrateSave(old);
    expect(loaded).toEqual(old);
    let g = loaded!;
    for (let i = 0; i < 8 && g.alive; i++) {
      g = ageUp(g);
      while (g.pendingEvent) g = resolveChoice(g, g.pendingEvent.choices[0]!.id, EVENT_REGISTRY);
    }
    expect(g.character.countryCode).toBe('US');
    expect(g.flags.immigrant).toBeUndefined();
  });

  it('loads an orphan and an immigrant life, and rejects mistyped scenario fields', () => {
    for (const scenario of ['orphan', 'immigrant'] as const) {
      const save = JSON.parse(JSON.stringify(createLife({ scenario }, 21, 1_700_000_000_000))) as GameState;
      expect(migrateSave(save)).toEqual(save);
    }
    const save = playedSave(5);
    const id = Object.keys(save.people)[0]!;
    expect(migrateSave(withField(save, 'character.scenario', 7))).toBeNull();
    expect(migrateSave(withField(save, 'character.moveAbroad', { age: 9 }))).toBeNull();
    expect(migrateSave(withField(save, `people.${id}.foster`, 'yes'))).toBeNull();
    expect(migrateSave(withField(save, 'character.moveAbroad', { age: 9, countryCode: 'CA' }))).not.toBeNull();
  });
});

describe('saves from before guardians for orphans and far-away people', () => {
  it('loads an orphaned child who was never taken in, and the next birthday finds them a guardian', () => {
    // Saved by the old engine: a 10-year-old whose parents both died, with nobody looking after them and no new fields.
    const g = createLife({ countryCode: 'US' }, 3, 1_700_000_000_000);
    const people = Object.fromEntries(Object.entries(g.people).map(([id, p]) => [id, p.kind === 'mother' || p.kind === 'father' ? { ...p, alive: false, deathAge: p.age, deathCause: 'cancer' } : p]));
    const old = JSON.parse(JSON.stringify({ ...g, year: g.character.birthYear + 10, character: { ...g.character, age: 10 }, people, log: [...g.log, { age: 9, year: g.character.birthYear + 9, text: 'With both my parents gone, I was taken in by relatives.', kind: 'bad' }] })) as GameState;
    for (const p of Object.values(old.people)) expect(p.relative ?? p.farAway).toBeUndefined();
    const loaded = migrateSave(old);
    expect(loaded).toEqual(old);
    const next = ageUp(loaded!);
    const carers = Object.values(next.people).filter((p) => p.alive && (p.kind === 'stepmother' || p.kind === 'stepfather'));
    expect(carers).toHaveLength(1);
    expect(carers[0]!.relative).toBe(true);
    // ...and the new fields survive a round trip, and are rejected when mistyped.
    const saved = JSON.parse(JSON.stringify(next));
    expect(migrateSave(saved)).toEqual(saved);
    const id = carers[0]!.id;
    expect(migrateSave(withField(saved, `people.${id}.relative`, 'aunt'))).toBeNull();
    expect(migrateSave(withField(saved, `people.${id}.farAway`, 1))).toBeNull();
    expect(migrateSave(withField(saved, `people.${id}.farAway`, true))).not.toBeNull();
  });
});

describe('saves from before layoffs and parents paying tuition were told apart', () => {
  /** A 45-year-old saved by the old engine: one layoff stored as a firing, one real firing, and a degree the family paid for. */
  function oldSave(): GameState {
    const g = createLife({ countryCode: 'US' }, 4321, 1_700_000_000_000);
    const at = (age: number, text: string) => ({ age, year: g.character.birthYear + age, text, kind: 'bad' as const });
    return JSON.parse(
      JSON.stringify({
        ...g,
        year: g.character.birthYear + 45,
        character: { ...g.character, age: 45 },
        flags: { ...g.flags, wealthyFamily: true },
        education: { ...g.education, stage: 'graduate', enrolled: true, major: 'mba', degrees: ['high_school', 'bachelor:business'], scholarship: true },
        career: {
          ...g.career,
          history: [
            { title: 'Analyst', company: 'Quantum Systems', fromAge: 22, toAge: 34, salary: 70_000, reason: 'fired' },
            { title: 'Clerk', company: 'Granite Media', fromAge: 35, toAge: 40, salary: 40_000, reason: 'fired' },
          ],
        },
        counters: { ...g.counters, firings: 2 },
        log: [...g.log, at(34, 'Quantum Systems made cutbacks and I was laid off.'), at(40, 'I was fired from Granite Media for poor performance.'), { ...at(43, 'Mom and Dad will pay for business school. I know how lucky I am.'), kind: 'good' }],
      }),
    ) as GameState;
  }

  it('relabels the layoff, keeps the real firing, and moves the family-paid tuition off the scholarship', () => {
    const loaded = migrateSave(oldSave())!;
    expect(loaded.career.history.map((h) => h.reason)).toEqual(['laidOff', 'fired']);
    expect(loaded.counters.firings).toBe(1);
    expect(loaded.education.scholarship).toBe(false);
    expect(loaded.education.parentsPay).toBe(true);
    // Loading it again changes nothing.
    expect(migrateSave(JSON.parse(JSON.stringify(loaded)))).toEqual(loaded);
  });

  it('leaves a real scholarship alone, and rejects a mistyped parentsPay', () => {
    const old = oldSave();
    const won = { ...old, log: [...old.log, { age: 43, year: old.year - 2, text: 'I won a full scholarship to business school!', kind: 'good' as const }] };
    expect(migrateSave(won)!.education.scholarship).toBe(true);
    expect(migrateSave(withField(old, 'education.parentsPay', 'yes'))).toBeNull();
  });
});

describe('saves from before the debt-collector line was throttled', () => {
  const OLD = 'Debt collectors are calling. I have no income and the interest keeps piling up.';
  /** A 44-year-old in collections since 40, saved when the old engine wrote the same line every year. */
  function oldSave(): GameState {
    const g = createLife({ countryCode: 'US' }, 2468, 1_700_000_000_000);
    const lines = [40, 41, 42, 43, 44].map((age) => ({ age, year: g.character.birthYear + age, text: OLD, kind: 'bad' as const }));
    return JSON.parse(JSON.stringify({ ...g, year: g.character.birthYear + 44, character: { ...g.character, age: 44 }, finances: { ...g.finances, debt: 70_000 }, log: [...g.log, ...lines] })) as GameState;
  }

  it('carries on from the last old line instead of announcing the calls as new', () => {
    let s = migrateSave(oldSave())!;
    expect(s.flags).toMatchObject({ [DEBT_CALLS.flags.held]: 44, [DEBT_CALLS.flags.line]: 44, [DEBT_CALLS.flags.stretches]: 1 });
    expect(migrateSave(JSON.parse(JSON.stringify(s)))).toEqual(s);
    const ours = new Set<string>([DEBT_CALLS.first, ...DEBT_CALLS.again, ...DEBT_CALLS.reminders]);
    for (let age = 45; age <= 49; age++) s = yearlyFinance({ ...s, character: { ...s.character, age }, finances: { ...s.finances, cash: 0 } }, new Rng(age));
    // Still in collections: nothing new until the five-year reminder, which is not "started calling".
    expect(s.log.filter((l) => ours.has(l.text)).map((l) => [l.age, l.text])).toEqual([[49, DEBT_CALLS.reminders[0]]]);
  });

  it('leaves a save without the old line alone', () => {
    const fresh = JSON.parse(JSON.stringify(createLife({ countryCode: 'US' }, 2468, 1_700_000_000_000))) as GameState;
    expect(migrateSave(fresh)!.flags[DEBT_CALLS.flags.line]).toBeUndefined();
  });
});
