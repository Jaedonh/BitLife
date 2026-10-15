import AsyncStorage from '@react-native-async-storage/async-storage';

import { StorageKeys } from '@/services/storage';
import { useGameStore } from '../gameStore';
import { useSettingsStore } from '../settingsStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const flush = () => new Promise((r) => setTimeout(r, 250));

describe('gameStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useGameStore.setState({ game: null, hydrated: false, adShowing: false, pendingSummary: null });
    useSettingsStore.setState({ premium: false, graveyard: [] });
    await useSettingsStore.getState().hydrate();
  });

  it('creates, ages, resolves events and persists a life', async () => {
    const store = useGameStore.getState();
    store.newLife({ firstName: 'Test', countryCode: 'US' });
    let g = useGameStore.getState().game!;
    expect(g.character.firstName).toBe('Test');
    for (let i = 0; i < 12; i++) {
      await useGameStore.getState().ageUp();
      g = useGameStore.getState().game!;
      while (g.pendingEvent) {
        useGameStore.getState().choose(g.pendingEvent.choices[0]!.id);
        g = useGameStore.getState().game!;
      }
    }
    expect(g.character.age).toBe(12);
    // a year summary toast is queued once the year's cards are closed
    expect(g.lastResult?.text).toContain('Age 12');
    await flush();
    const raw = await AsyncStorage.getItem(StorageKeys.save);
    expect(raw).toBeTruthy();
    const saved = JSON.parse(raw!);
    expect(saved.character.age).toBe(12);
  });

  it('hydrates a saved life and discards corrupt saves', async () => {
    useGameStore.getState().newLife({ countryCode: 'GB' });
    await flush();
    useGameStore.setState({ game: null, hydrated: false });
    await useGameStore.getState().hydrate();
    expect(useGameStore.getState().game?.character.countryCode).toBe('GB');

    await AsyncStorage.setItem(StorageKeys.save, '{"schemaVersion": 999}');
    useGameStore.setState({ game: null, hydrated: false });
    await useGameStore.getState().hydrate();
    expect(useGameStore.getState().game).toBeNull();
    expect(await AsyncStorage.getItem(StorageKeys.save)).toBeNull();
  });

  it('records deaths in the graveyard and supports heirs', async () => {
    useGameStore.getState().newLife({ countryCode: 'US' });
    // Force a death via engine-level state surgery: zero health until the mortality roll ends the life.
    let g = useGameStore.getState().game!;
    useGameStore.setState({ game: { ...g, character: { ...g.character, age: 95, stats: { ...g.character.stats, health: 1 } }, year: g.character.birthYear + 95 } });
    for (let i = 0; i < 40 && useGameStore.getState().game!.alive; i++) {
      await useGameStore.getState().ageUp();
      g = useGameStore.getState().game!;
      while (g.pendingEvent) {
        useGameStore.getState().choose(g.pendingEvent.choices[0]!.id);
        g = useGameStore.getState().game!;
      }
    }
    g = useGameStore.getState().game!;
    expect(g.alive).toBe(false);
    expect(useSettingsStore.getState().graveyard.length).toBe(1);
    expect(useSettingsStore.getState().graveyard[0]!.ribbonId).toBe(g.death!.ribbonId);
  });

  it('premium users get rewards without ads', async () => {
    useSettingsStore.getState().setPremium(true);
    useGameStore.getState().newLife({ countryCode: 'US' });
    const before = useGameStore.getState().game!.finances.cash;
    expect(useGameStore.getState().canUseRewarded('cashBoost')).toBe(true);
    const r = await useGameStore.getState().rewarded('cashBoost');
    expect(r).toBe('granted');
    expect(useGameStore.getState().game!.finances.cash).toBeGreaterThan(before);
  });

  it('free users cannot use rewarded placements where ads are unsupported', () => {
    useGameStore.getState().newLife({});
    expect(useGameStore.getState().canUseRewarded('cashBoost')).toBe(false);
  });
});
