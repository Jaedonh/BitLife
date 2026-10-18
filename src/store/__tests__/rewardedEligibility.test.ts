import AsyncStorage from '@react-native-async-storage/async-storage';

import type { GameState } from '@/engine/types';
import { useGameStore } from '../gameStore';
import { useSettingsStore } from '../settingsStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

/** Replaces the current life with a tweaked copy. */
function patch(fn: (g: GameState) => GameState) {
  useGameStore.setState({ game: fn(useGameStore.getState().game!) });
}

describe('rewarded job-listing reroll (F18)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useGameStore.setState({ game: null, hydrated: false, adShowing: false, pendingSummary: null });
    useSettingsStore.setState({ premium: false, graveyard: [] });
    await useSettingsStore.getState().hydrate();
    // Premium grants without an ad, so only the game's own rules decide.
    useSettingsStore.getState().setPremium(true);
    useGameStore.getState().newLife({ countryCode: 'US' });
  });

  it('is hidden and never spent below 14 or in prison, and says why', async () => {
    for (const tweak of [(g: GameState) => ({ ...g, character: { ...g.character, age: 10 } }), (g: GameState) => ({ ...g, character: { ...g.character, age: 30 }, crime: { ...g.crime, inPrison: true, sentenceYearsLeft: 3 } })]) {
      patch(tweak);
      const before = useGameStore.getState().game!;
      expect(useGameStore.getState().canUseRewarded('reroll')).toBe(false);
      expect(await useGameStore.getState().rewarded('reroll')).toBe('ineligible');
      const after = useGameStore.getState().game!;
      expect(after.counters.rewardedAdsUsed).toBe(before.counters.rewardedAdsUsed);
      expect(after.career.listings).toEqual(before.career.listings);
      expect(after.lastResult?.text).toMatch(/too young for job listings|job-hunt from a prison cell/);
      expect(useSettingsStore.getState().adMeta.rewardedToday.reroll ?? 0).toBe(0);
    }
  });

  it('still works for a working-age player', async () => {
    patch((g) => ({ ...g, character: { ...g.character, age: 20 } }));
    expect(useGameStore.getState().canUseRewarded('reroll')).toBe(true);
    expect(await useGameStore.getState().rewarded('reroll')).toBe('granted');
    expect(useGameStore.getState().game!.career.listings.length).toBeGreaterThan(0);
    expect(useSettingsStore.getState().adMeta.rewardedToday.reroll).toBe(1);
  });
});
