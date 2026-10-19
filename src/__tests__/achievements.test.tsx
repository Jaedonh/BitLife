import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Alert, Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import AchievementsScreen from '@/app/achievements';
import DeathScreen from '@/app/death';
import MenuScreen from '@/app/index';
import SettingsScreen from '@/app/settings';
import { ResultToast } from '@/components/game/ResultToast';
import { Button } from '@/components/ui';
import { StorageKeys } from '@/services/storage';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-safe-area-context', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('expo-haptics', () => ({ notificationAsync: jest.fn(() => Promise.resolve()), NotificationFeedbackType: { Success: 'success', Warning: 'warning' } }));
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn(), canGoBack: () => false },
  usePathname: () => '/death',
  Redirect: () => null,
}));
const mockRouter = router as unknown as { replace: jest.Mock; push: jest.Mock };

const mounted: ReactTestRenderer[] = [];
const flush = () => new Promise<void>((r) => setTimeout(r, 0));

function render(element: React.ReactElement): ReactTestRenderer {
  let tree: ReactTestRenderer | undefined;
  act(() => {
    tree = create(element);
  });
  mounted.push(tree!);
  return tree!;
}
const texts = (tree: ReactTestRenderer) => tree.root.findAllByType(Text).map((t) => [t.props.children].flat().join(''));
const byTestId = (tree: ReactTestRenderer, id: string) => tree.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];
const button = (tree: ReactTestRenderer, id: string) => tree.root.findAll((n) => n.type === Button && n.props.testID === id)[0];
const hostText = (tree: ReactTestRenderer, id: string) => {
  const node = tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === id)[0];
  return node ? [node.props.children].flat().join('') : null;
};

function settle() {
  let g = useGameStore.getState().game!;
  while (g.pendingEvent) {
    useGameStore.getState().choose(g.pendingEvent.choices[0]!.id);
    g = useGameStore.getState().game!;
  }
}

beforeEach(async () => {
  await AsyncStorage.clear();
  mockRouter.replace.mockClear();
  mockRouter.push.mockClear();
  useGameStore.setState({ game: null, hydrated: false, adShowing: false, pendingSummary: null });
  useSettingsStore.setState({ premium: false, adsReady: false, graveyard: [], achievements: {}, achievementNotice: null });
  await useSettingsStore.getState().hydrate();
  useSettingsStore.setState({ settings: { haptics: false, showKarma: false, tutorialDone: true } });
});

afterEach(() => {
  act(() => {
    for (const tree of mounted.splice(0)) tree.unmount();
  });
  jest.restoreAllMocks();
});

describe('AchievementsScreen', () => {
  it('shows progress, greys locked ones and keeps secrets hidden until found', () => {
    useSettingsStore.getState().unlockAchievements(['married'], { lifeName: 'Ana Silva', age: 31 }, new Date(2026, 0, 2).getTime());
    const tree = render(<AchievementsScreen />);
    expect(hostText(tree, 'achievement-progress')).toBe('1 / 40');
    const all = texts(tree);
    expect(all).toEqual(expect.arrayContaining(['Tied the Knot', 'Ana Silva, age 31 · Jan 2, 2026', 'Cap and Gown', 'Earn a university degree.', '???']));
    // A locked secret is not spoiled.
    expect(all).not.toContain('Ouch');
    expect(all).not.toContain('Propose and hear no.');

    act(() => useSettingsStore.getState().unlockAchievements(['ouch'], { lifeName: 'Bo Reyes', age: 29 }));
    expect(texts(tree)).toEqual(expect.arrayContaining(['Ouch', 'Propose and hear no.']));
    expect(hostText(tree, 'achievement-progress')).toBe('2 / 40');
  });
});

describe('links to the achievements screen', () => {
  it('from the home screen', () => {
    const tree = render(<MenuScreen />);
    expect(texts(tree)).toContain('40 goals that carry over from life to life');
    act(() => (byTestId(tree, 'menu-achievements')!.props as { onPress: () => void }).onPress());
    expect(mockRouter.push).toHaveBeenCalledWith('/achievements');
    act(() => useSettingsStore.getState().unlockAchievements(['married', 'retired'], { lifeName: 'Ana Silva', age: 70 }));
    expect(texts(tree)).toContain('2/40 unlocked');
  });

  it('from the death screen, with what this life unlocked', async () => {
    // Unlocked by an earlier life: not "new this life".
    useSettingsStore.getState().unlockAchievements(['married'], { lifeName: 'Old Life', age: 40 }, 1);
    useGameStore.getState().newLife({ countryCode: 'US' });
    const g = useGameStore.getState().game!;
    useGameStore.setState({ game: { ...g, character: { ...g.character, age: 95, stats: { ...g.character.stats, health: 1 } }, year: g.character.birthYear + 95 } });
    for (let i = 0; i < 40 && useGameStore.getState().game!.alive; i++) {
      await useGameStore.getState().ageUp();
      settle();
    }
    expect(useGameStore.getState().game!.alive).toBe(false);
    const fresh = Object.values(useSettingsStore.getState().achievements).filter((u) => u.unlockedAt >= g.createdAt).length;
    expect(fresh).toBeGreaterThanOrEqual(1);
    const total = Object.keys(useSettingsStore.getState().achievements).length;
    const tree = render(<DeathScreen />);
    const b = button(tree, 'death-achievements')!;
    expect(b.props.title).toBe(`🏆 Achievements · ${total}/40 · ${fresh} new this life`);
    await act(async () => {
      (b.props as { onPress: () => void }).onPress();
      await flush();
    });
    expect(mockRouter.push).toHaveBeenCalledWith('/achievements');
  });
});

describe('Settings: reset achievements', () => {
  it('asks first, then locks everything again', async () => {
    const tree = render(<SettingsScreen />);
    expect(button(tree, 'reset-achievements')!.props.disabled).toBe(true);
    act(() => useSettingsStore.getState().unlockAchievements(['married'], { lifeName: 'Ana Silva', age: 31 }));
    await act(flush);
    expect(await AsyncStorage.getItem(StorageKeys.achievements)).toContain('married');
    expect(button(tree, 'reset-achievements')!.props.disabled).toBe(false);

    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    act(() => (button(tree, 'reset-achievements')!.props as { onPress: () => void }).onPress());
    expect(alert).toHaveBeenCalledTimes(1);
    const buttons = alert.mock.calls[0]![2]!;
    await act(async () => {
      buttons.find((x) => x.style === 'cancel')!.onPress?.();
      await flush();
    });
    expect(useSettingsStore.getState().achievements.married).toBeDefined();

    act(() => (button(tree, 'reset-achievements')!.props as { onPress: () => void }).onPress());
    await act(async () => {
      alert.mock.calls[1]![2]!.find((x) => x.style === 'destructive')!.onPress?.();
      await flush();
    });
    expect(useSettingsStore.getState().achievements).toEqual({});
    expect(await AsyncStorage.getItem(StorageKeys.achievements)).toBeNull();
  });
});

describe('unlock toast', () => {
  it('shows in the app-wide feedback host', () => {
    useGameStore.getState().newLife({ countryCode: 'US' });
    const tree = render(<ResultToast />);
    act(() => useSettingsStore.getState().unlockAchievements(['married'], { lifeName: 'Ana Silva', age: 31 }));
    expect(texts(tree)).toEqual(expect.arrayContaining(['Achievement unlocked', '💍 Tied the Knot: Get married.', '🏆']));
  });
});
