import { ageUp, createLife, EVENT_REGISTRY, resolveChoice, SCHEMA_VERSION } from '@/engine';
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
    const played = playedSave();
    expect(played.flavorSeen).toBeDefined();
    // The old shape: no flavorSeen at all.
    const old = JSON.parse(JSON.stringify(played)) as Record<string, unknown>;
    delete old.flavorSeen;
    const loaded = migrateSave(old);
    expect(loaded).not.toBeNull();
    expect(loaded!.flavorSeen).toBeUndefined();
    // It plays on: the next years write flavor lines and start remembering them.
    let g = loaded!;
    for (let i = 0; i < 10 && g.alive; i++) {
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
