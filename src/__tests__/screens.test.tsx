import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Alert, Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import DeathScreen from '@/app/death';
import GraveyardScreen from '@/app/graveyard';
import { Button } from '@/components/ui';
import { ads } from '@/services/ads';
import { StorageKeys } from '@/services/storage';
import { rewardedOutcomeMessage, useGameStore } from '@/store/gameStore';
import { useSettingsStore, type GraveyardEntry } from '@/store/settingsStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-safe-area-context', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn(), canGoBack: () => false },
  Redirect: () => null,
}));
const mockRouter = router as unknown as { replace: jest.Mock; push: jest.Mock };

const mounted: ReactTestRenderer[] = [];

const flush = () => new Promise((r) => setTimeout(r, 0));

function render(element: React.ReactElement): ReactTestRenderer {
  let tree: ReactTestRenderer | undefined;
  act(() => {
    tree = create(element);
  });
  mounted.push(tree!);
  return tree!;
}

/** The screen-level Button with this testID (its onPress is the screen's own handler). */
function button(tree: ReactTestRenderer, testID: string) {
  return tree.root.findAll((n) => n.type === Button && n.props.testID === testID)[0];
}

async function press(tree: ReactTestRenderer, testID: string) {
  const b = button(tree, testID);
  if (!b) throw new Error(`no button ${testID}`);
  await act(async () => {
    (b.props as { onPress: () => void }).onPress();
    await flush();
  });
}

function hasText(tree: ReactTestRenderer, text: string): boolean {
  return tree.root.findAll((n) => n.type === Text && n.props.children === text).length > 0;
}

/** Closes every event card the year opened. */
function settle() {
  let g = useGameStore.getState().game!;
  while (g.pendingEvent) {
    useGameStore.getState().choose(g.pendingEvent.choices[0]!.id);
    g = useGameStore.getState().game!;
  }
  return g;
}

/** Forces a death via engine-level state surgery: near-zero health at 95 until the mortality roll ends the life. */
async function dieQuickly() {
  const g = useGameStore.getState().game!;
  useGameStore.setState({ game: { ...g, character: { ...g.character, age: Math.max(g.character.age, 95), stats: { ...g.character.stats, health: 1 } }, year: g.character.birthYear + Math.max(g.character.age, 95) } });
  for (let i = 0; i < 40 && useGameStore.getState().game!.alive; i++) {
    await useGameStore.getState().ageUp();
    settle();
  }
  expect(useGameStore.getState().game!.alive).toBe(false);
}

beforeEach(async () => {
  await AsyncStorage.clear();
  mockRouter.replace.mockClear();
  mockRouter.push.mockClear();
  useGameStore.setState({ game: null, hydrated: false, adShowing: false, pendingSummary: null });
  useSettingsStore.setState({ premium: false, adsReady: false, graveyard: [] });
  await useSettingsStore.getState().hydrate();
});

afterEach(() => {
  // Unmount before the next beforeEach resets the stores, so no stale subscriber re-renders outside act().
  act(() => {
    for (const tree of mounted.splice(0)) tree.unmount();
  });
  jest.restoreAllMocks();
});

describe('DeathScreen second chance (free user)', () => {
  it('hides the rewarded button until the ads SDK is initialised', async () => {
    useGameStore.getState().newLife({ countryCode: 'US' }, { birthCard: false });
    await dieQuickly();
    jest.spyOn(ads, 'isSupported').mockReturnValue(true);
    const ready = jest.spyOn(ads, 'isReady').mockReturnValue(false);

    const tree = render(<DeathScreen />);
    // SDK linked but not initialised (still booting, init failed or consent blocked): no dead button.
    expect(button(tree, 'second-chance')).toBeUndefined();

    // Startup finishes while the tombstone is open: the store flag alone must re-render it.
    ready.mockReturnValue(true);
    act(() => useSettingsStore.getState().setAdsReady(true));
    expect(button(tree, 'second-chance')).toBeDefined();
  });

  it('tells the player when no ad is ready or the ad was closed early, and revives on an earned reward', async () => {
    useGameStore.getState().newLife({ countryCode: 'US' }, { birthCard: false });
    await dieQuickly();
    jest.spyOn(ads, 'isSupported').mockReturnValue(true);
    jest.spyOn(ads, 'isReady').mockReturnValue(true);
    const loaded = jest.spyOn(ads, 'isRewardedLoaded').mockReturnValue(false);
    const preload = jest.spyOn(ads, 'preload').mockImplementation(() => {});
    const show = jest.spyOn(ads, 'showRewarded').mockResolvedValue('dismissed');

    const tree = render(<DeathScreen />);
    expect(hasText(tree, rewardedOutcomeMessage('unavailable')!)).toBe(false);

    // Nothing loaded yet (right after launch, after a previous ad, or no fill).
    await press(tree, 'second-chance');
    expect(show).not.toHaveBeenCalled();
    expect(preload).toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(useGameStore.getState().game!.alive).toBe(false);
    expect(hasText(tree, rewardedOutcomeMessage('unavailable')!)).toBe(true);

    // Loaded, but the player closed the ad before the reward.
    loaded.mockReturnValue(true);
    await press(tree, 'second-chance');
    expect(show).toHaveBeenCalledTimes(1);
    expect(useGameStore.getState().game!.alive).toBe(false);
    expect(hasText(tree, rewardedOutcomeMessage('dismissed')!)).toBe(true);
    expect(button(tree, 'second-chance')).toBeDefined();

    // Watched to the end: revived and sent back to the life screen.
    show.mockResolvedValue('earned');
    await press(tree, 'second-chance');
    expect(useGameStore.getState().game!.alive).toBe(true);
    expect(mockRouter.replace).toHaveBeenCalledWith('/life');
  });
});

describe('GraveyardScreen', () => {
  it('lets the player delete every remembered life after confirming', async () => {
    const entry: GraveyardEntry = { id: 'c1', name: 'Jamie Realperson', birthYear: 1990, deathYear: 2060, age: 70, cause: 'old age', ribbonId: 'mediocre', netWorth: 100, countryCode: 'US', generation: 1, obituary: 'Jamie lived.', epitaph: 'Here lies Jamie', diedAt: 1 };
    useSettingsStore.getState().addToGraveyard(entry);
    await flush();
    expect(await AsyncStorage.getItem(StorageKeys.graveyard)).toContain('Jamie Realperson');
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const tree = render(<GraveyardScreen />);
    expect(tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === 'grave')).toHaveLength(1);

    act(() => (button(tree, 'clear-graveyard')!.props as { onPress: () => void }).onPress());
    expect(alert).toHaveBeenCalledTimes(1);
    const buttons = alert.mock.calls[0]![2]!;
    buttons.find((b) => b.style === 'cancel')!.onPress?.();
    expect(useSettingsStore.getState().graveyard).toHaveLength(1);

    await act(async () => {
      buttons.find((b) => b.style === 'destructive')!.onPress?.();
      await flush();
    });
    expect(useSettingsStore.getState().graveyard).toEqual([]);
    expect(await AsyncStorage.getItem(StorageKeys.graveyard)).toBeNull();
    expect(tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === 'grave')).toHaveLength(0);
    expect(button(tree, 'clear-graveyard')).toBeUndefined();
  });
});
