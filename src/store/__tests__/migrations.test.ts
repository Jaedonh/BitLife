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
