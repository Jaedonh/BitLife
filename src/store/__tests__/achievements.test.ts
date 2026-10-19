import AsyncStorage from '@react-native-async-storage/async-storage';

import { createLife } from '@/engine';
import { StorageKeys } from '@/services/storage';
import { checkAchievements, useGameStore } from '../gameStore';
import { migrateSave } from '../migrations';
import { sanitizeAchievements, useSettingsStore } from '../settingsStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const flush = () => new Promise((r) => setTimeout(r, 250));

function settle() {
  let g = useGameStore.getState().game!;
  while (g.pendingEvent) {
    useGameStore.getState().choose(g.pendingEvent.choices[0]!.id);
    g = useGameStore.getState().game!;
  }
  return g;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  useGameStore.setState({ game: null, hydrated: false, adShowing: false, pendingSummary: null });
  useSettingsStore.setState({ premium: false, graveyard: [], achievements: {}, achievementNotice: null });
  await useSettingsStore.getState().hydrate();
});

describe('achievement persistence', () => {
  it('records each unlock once, with who and when, and raises one notice per batch', async () => {
    const store = useSettingsStore.getState();
    store.unlockAchievements(['married', 'first_job', 'married'], { lifeName: 'Ana Silva', age: 31 }, 1_000);
    let s = useSettingsStore.getState();
    expect(s.achievements).toEqual({
      married: { unlockedAt: 1_000, lifeName: 'Ana Silva', age: 31 },
      first_job: { unlockedAt: 1_000, lifeName: 'Ana Silva', age: 31 },
    });
    expect(s.achievementNotice).toEqual({ ids: ['married', 'first_job'], seq: 1 });

    // Already unlocked: nothing changes, no new toast.
    store.unlockAchievements(['married'], { lifeName: 'Bo Reyes', age: 50 }, 2_000);
    s = useSettingsStore.getState();
    expect(s.achievements.married!.lifeName).toBe('Ana Silva');
    expect(s.achievementNotice!.seq).toBe(1);

    store.unlockAchievements(['retired', 'married'], { lifeName: 'Bo Reyes', age: 66 }, 3_000);
    expect(useSettingsStore.getState().achievementNotice).toEqual({ ids: ['retired'], seq: 2 });

    await flush();
    const saved = JSON.parse((await AsyncStorage.getItem(StorageKeys.achievements))!);
    expect(Object.keys(saved).sort()).toEqual(['first_job', 'married', 'retired']);
  });

  it('survives a relaunch, a cleared graveyard and a premium change, but not a reset', async () => {
    useSettingsStore.getState().unlockAchievements(['one_down'], { lifeName: 'Ana Silva', age: 80 }, 5);
    useSettingsStore.getState().clearGraveyard();
    useSettingsStore.getState().setPremium(true);
    await flush();
    useSettingsStore.setState({ achievements: {}, achievementNotice: null, hydrated: false });
    await useSettingsStore.getState().hydrate();
    expect(useSettingsStore.getState().achievements.one_down).toEqual({ unlockedAt: 5, lifeName: 'Ana Silva', age: 80 });
    // A relaunch never replays the unlock toast.
    expect(useSettingsStore.getState().achievementNotice).toBeNull();

    useSettingsStore.getState().resetAchievements();
    expect(useSettingsStore.getState().achievements).toEqual({});
    await flush();
    expect(await AsyncStorage.getItem(StorageKeys.achievements)).toBeNull();
    expect(useSettingsStore.getState().premium).toBe(true);
  });

  it('drops malformed stored records instead of crashing', async () => {
    expect(sanitizeAchievements(null)).toEqual({});
    expect(sanitizeAchievements([1, 2])).toEqual({});
    expect(sanitizeAchievements('x')).toEqual({});
    const fromDisk = JSON.parse('{"__proto__": {"unlockedAt": 1}, "Bad Id": {"unlockedAt": 1}, "a": {"unlockedAt": "soon"}, "b": null, "c": {"unlockedAt": 9}, "d": {"unlockedAt": 7, "lifeName": "Ana", "age": 30}}');
    const clean = sanitizeAchievements(fromDisk);
    expect(Object.getPrototypeOf(clean)).toBe(Object.prototype);
    expect(clean).toEqual({
      c: { unlockedAt: 9, lifeName: '', age: 0 },
      d: { unlockedAt: 7, lifeName: 'Ana', age: 30 },
    });
    await AsyncStorage.setItem(StorageKeys.achievements, '{not json');
    await useSettingsStore.getState().hydrate();
    expect(useSettingsStore.getState().achievements).toEqual({});
  });
});

describe('checking from the game store', () => {
  it('unlocks after an action, naming the life that earned it', () => {
    useGameStore.getState().newLife({ firstName: 'Ana', lastName: 'Silva', countryCode: 'US' });
    const g = useGameStore.getState().game!;
    expect(useSettingsStore.getState().achievements).toEqual({});
    useGameStore.setState({ game: { ...g, character: { ...g.character, age: 30 }, counters: { ...g.counters, marriages: 1 } } });
    useGameStore.getState().act({ type: 'activity', id: 'library' });
    const a = useSettingsStore.getState().achievements;
    expect(a.married).toMatchObject({ lifeName: 'Ana Silva', age: 30 });
    expect(useSettingsStore.getState().achievementNotice!.ids).toContain('married');
  });

  it('unlocks at death with the finished life counted once', async () => {
    useGameStore.getState().newLife({ countryCode: 'US' });
    const g = useGameStore.getState().game!;
    useGameStore.setState({ game: { ...g, character: { ...g.character, age: 95, stats: { ...g.character.stats, health: 1 } }, year: g.character.birthYear + 95 } });
    for (let i = 0; i < 40 && useGameStore.getState().game!.alive; i++) {
      await useGameStore.getState().ageUp();
      settle();
    }
    expect(useGameStore.getState().game!.alive).toBe(false);
    const s = useSettingsStore.getState();
    expect(s.graveyard).toHaveLength(1);
    expect(s.achievements.one_down).toBeDefined();
    expect(s.achievements.again_and_again).toBeUndefined();
  });

  it('carries on the family line', () => {
    const prev = createLife({ countryCode: 'US' }, 3);
    useGameStore.setState({ game: { ...prev, generation: 2 } });
    checkAchievements(useGameStore.getState().game);
    expect(useSettingsStore.getState().achievements.next_generation).toBeDefined();
    // Nothing to check without a life.
    expect(() => checkAchievements(null)).not.toThrow();
  });

  it('old saves (written before achievements) load and are checked like any other', () => {
    const fresh = createLife({ countryCode: 'US' }, 21);
    // The shape of a save from before this feature: no achievement flags anywhere.
    const old = JSON.parse(JSON.stringify({ ...fresh, character: { ...fresh.character, age: 40 }, counters: { ...fresh.counters, jobsHeld: 1 }, flags: {} }));
    delete old.flags.peakDebt;
    delete old.flags.proposalsRejected;
    const migrated = migrateSave(old);
    expect(migrated).not.toBeNull();
    checkAchievements(migrated);
    expect(Object.keys(useSettingsStore.getState().achievements)).toEqual(['first_job']);
  });
});
