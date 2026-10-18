import AsyncStorage from '@react-native-async-storage/async-storage';

import type { GameState } from '@/engine/types';
import { useGameStore } from '../gameStore';
import { useSettingsStore } from '../settingsStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

function patch(fn: (g: GameState) => GameState) {
  useGameStore.setState({ game: fn(useGameStore.getState().game!) });
}

const stats = (g: GameState, s: Partial<GameState['character']['stats']>): GameState => ({ ...g, character: { ...g.character, age: 20, stats: { ...g.character.stats, ...s } } });

describe('rewarded stat boost (F10)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useGameStore.setState({ game: null, hydrated: false, adShowing: false, pendingSummary: null });
    useSettingsStore.setState({ premium: false, graveyard: [] });
    await useSettingsStore.getState().hydrate();
    // Premium grants without an ad, so only the game's own rules decide.
    useSettingsStore.getState().setPremium(true);
    useGameStore.getState().newLife({ countryCode: 'US' });
  });

  it('is not offered or spent for a stat already at its natural limit', async () => {
    patch((g) => stats(g, { health: g.character.potential.health, happiness: 50 }));
    const before = useGameStore.getState().game!;
    expect(useGameStore.getState().canUseRewarded('statBoost', 'health')).toBe(false);
    // Other stats can still grow, so the boost section stays.
    expect(useGameStore.getState().canUseRewarded('statBoost')).toBe(true);
    expect(await useGameStore.getState().rewarded('statBoost', 'health')).toBe('ineligible');
    const after = useGameStore.getState().game!;
    expect(after.character.stats.health).toBe(before.character.stats.health);
    expect(after.counters.rewardedAdsUsed).toBe(before.counters.rewardedAdsUsed);
    expect(after.lastResult?.text).toBe('My health is already as good as it gets.');
    expect(useSettingsStore.getState().adMeta.rewardedToday.statBoost ?? 0).toBe(0);
  });

  it('reports only the part of the boost that applied', async () => {
    patch((g) => stats(g, { happiness: 90 }));
    expect(await useGameStore.getState().rewarded('statBoost', 'happiness')).toBe('granted');
    const after = useGameStore.getState().game!;
    expect(after.character.stats.happiness).toBe(100);
    expect(after.lastResult).toMatchObject({ text: "Happiness +10. That's as high as it goes.", statDeltas: { happiness: 10 } });
    expect(useSettingsStore.getState().adMeta.rewardedToday.statBoost).toBe(1);
  });
});
