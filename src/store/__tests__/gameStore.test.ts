import AsyncStorage from '@react-native-async-storage/async-storage';

import { ads } from '@/services/ads';
import { StorageKeys } from '@/services/storage';
import { rewardedOutcomeMessage, useGameStore } from '../gameStore';
import { useSettingsStore } from '../settingsStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const flush = () => new Promise((r) => setTimeout(r, 250));

/** Closes every event card the year opened. */
function settle() {
  let g = useGameStore.getState().game!;
  while (g.pendingEvent) {
    useGameStore.getState().choose(g.pendingEvent.choices[0]!.id);
    g = useGameStore.getState().game!;
  }
  return g;
}

/** Forces a death via engine-level state surgery: zero health at 95 until the mortality roll ends the life. */
async function dieQuickly() {
  const g = useGameStore.getState().game!;
  useGameStore.setState({ game: { ...g, character: { ...g.character, age: Math.max(g.character.age, 95), stats: { ...g.character.stats, health: 1 } }, year: g.character.birthYear + Math.max(g.character.age, 95) } });
  for (let i = 0; i < 40 && useGameStore.getState().game!.alive; i++) {
    await useGameStore.getState().ageUp();
    settle();
  }
  const dead = useGameStore.getState().game!;
  expect(dead.alive).toBe(false);
  return dead;
}

describe('gameStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useGameStore.setState({ game: null, hydrated: false, adShowing: false, pendingSummary: null });
    useSettingsStore.setState({ premium: false, graveyard: [] });
    await useSettingsStore.getState().hydrate();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates, ages, resolves events and persists a life', async () => {
    const store = useGameStore.getState();
    store.newLife({ firstName: 'Test', countryCode: 'US' });
    let g = useGameStore.getState().game!;
    expect(g.character.firstName).toBe('Test');
    for (let i = 0; i < 12; i++) {
      await useGameStore.getState().ageUp();
      g = settle();
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
    const g = await dieQuickly();
    expect(useSettingsStore.getState().graveyard.length).toBe(1);
    expect(useSettingsStore.getState().graveyard[0]!.ribbonId).toBe(g.death!.ribbonId);
  });

  it('still ages up after an interstitial when the year toast clears during the ad', async () => {
    useGameStore.getState().newLife({ countryCode: 'US' });
    const g0 = useGameStore.getState().game!;
    // A toast is on screen (the previous year's summary) when the player taps Age+ again.
    useGameStore.setState({ game: { ...g0, lastResult: { text: 'Age 0', kind: 'info' } } });
    // Past the first-life grace, the launch grace and the cooldown: the next Age+ shows an interstitial.
    useSettingsStore.getState().updateAdMeta((m) => ({ ...m, totalAgeUps: 50, ageUpsSinceInterstitial: 10, lastInterstitialAt: 0, launchedAt: Date.now() - 10 * 60_000, interstitialsThisSession: 0 }));
    let closeAd!: (shown: boolean) => void;
    jest.spyOn(ads, 'isReady').mockReturnValue(true);
    const show = jest.spyOn(ads, 'showInterstitial').mockImplementation(() => new Promise<boolean>((r) => { closeAd = r; }));

    const ageBefore = useGameStore.getState().game!.character.age;
    const logBefore = useGameStore.getState().game!.log.length;
    const pending = useGameStore.getState().ageUp();
    expect(useGameStore.getState().adShowing).toBe(true);
    // ResultToast's auto-clear timer fires while the ad is on screen.
    useGameStore.getState().clearResult();
    expect(useGameStore.getState().game!.lastResult).toBeNull();
    closeAd(true);
    await pending;

    expect(show).toHaveBeenCalledTimes(1);
    expect(useGameStore.getState().adShowing).toBe(false);
    const after = useGameStore.getState().game!;
    expect(after.character.age).toBe(ageBefore + 1);
    expect(after.log.length).toBeGreaterThan(logBefore);
    expect(useSettingsStore.getState().adMeta.lastInterstitialAt).toBeGreaterThan(0);
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

  it('premium rewards are instant but share the daily caps', async () => {
    useSettingsStore.getState().setPremium(true);
    useGameStore.getState().newLife({ countryCode: 'US' });
    const results: string[] = [];
    for (let i = 0; i < 5; i++) results.push(await useGameStore.getState().rewarded('cashBoost'));
    expect(results).toEqual(['granted', 'granted', 'granted', 'capped', 'capped']);
    expect(useSettingsStore.getState().adMeta.rewardedToday.cashBoost).toBe(3);
    expect(useGameStore.getState().canUseRewarded('cashBoost')).toBe(false);
    // other placements keep their own counter
    expect(useGameStore.getState().canUseRewarded('statBoost')).toBe(true);
    expect(await useGameStore.getState().rewarded('statBoost', 'happiness')).toBe('granted');
    expect(useSettingsStore.getState().adMeta.rewardedToday.statBoost).toBe(1);
  });

  it('a second chance takes the tombstone back until the life really ends', async () => {
    useSettingsStore.getState().setPremium(true);
    useGameStore.getState().newLife({ countryCode: 'US' });
    const dead = await dieQuickly();
    const id = dead.character.id;
    expect(useSettingsStore.getState().graveyard.length).toBe(1);
    expect(useGameStore.getState().canUseRewarded('secondChance')).toBe(true);

    expect(await useGameStore.getState().rewarded('secondChance')).toBe('granted');
    expect(useGameStore.getState().game!.alive).toBe(true);
    // alive again: no grave while the life goes on
    expect(useSettingsStore.getState().graveyard).toEqual([]);
    expect(useGameStore.getState().canUseRewarded('secondChance')).toBe(false);

    const dead2 = await dieQuickly();
    const graveyard = useSettingsStore.getState().graveyard;
    expect(graveyard.length).toBe(1);
    expect(graveyard[0]!.id).toBe(id);
    expect(graveyard[0]!.age).toBe(dead2.character.age);
    await flush();
    expect(JSON.parse((await AsyncStorage.getItem(StorageKeys.graveyard))!)).toHaveLength(1);
  });

  it('free users only get rewarded buttons once the ads SDK is initialised, and a tap with no ad loaded reports it', async () => {
    useGameStore.getState().newLife({ countryCode: 'US' });
    jest.spyOn(ads, 'isSupported').mockReturnValue(true);
    const ready = jest.spyOn(ads, 'isReady').mockReturnValue(false);
    // SDK linked but not initialised (still booting, init failed, consent blocked): no dead button.
    expect(useGameStore.getState().canUseRewarded('cashBoost')).toBe(false);
    expect(await useGameStore.getState().rewarded('cashBoost')).toBe('capped');
    ready.mockReturnValue(true);
    expect(useGameStore.getState().canUseRewarded('cashBoost')).toBe(true);
    // Initialised but nothing loaded yet: the tap says so and kicks a preload instead of showing.
    jest.spyOn(ads, 'isRewardedLoaded').mockReturnValue(false);
    const preload = jest.spyOn(ads, 'preload').mockImplementation(() => {});
    const show = jest.spyOn(ads, 'showRewarded');
    expect(await useGameStore.getState().rewarded('cashBoost')).toBe('unavailable');
    expect(preload).toHaveBeenCalled();
    expect(show).not.toHaveBeenCalled();
    expect(useSettingsStore.getState().adMeta.rewardedToday.cashBoost ?? 0).toBe(0);
  });

  it('every non-granted rewarded outcome has a distinct player-facing message', () => {
    expect(rewardedOutcomeMessage('granted')).toBeNull();
    const messages = (['unavailable', 'dismissed', 'capped'] as const).map(rewardedOutcomeMessage);
    for (const m of messages) expect(typeof m === 'string' && m.length > 0).toBe(true);
    expect(new Set(messages).size).toBe(3);
  });

  it('free users cannot use rewarded placements where ads are unsupported', () => {
    useGameStore.getState().newLife({});
    expect(useGameStore.getState().canUseRewarded('cashBoost')).toBe(false);
  });
});
