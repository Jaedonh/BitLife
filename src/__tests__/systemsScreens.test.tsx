/**
 * Screen fixes from the final playtest: Activities' energy chips, Work & School after retiring,
 * money targets on the achievements screen, and Restore purchases where purchases are not available.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import AchievementsScreen from '@/app/achievements';
import ActivitiesScreen from '@/app/activities';
import OccupationScreen from '@/app/occupation';
import PremiumScreen from '@/app/premium';
import SettingsScreen from '@/app/settings';
import { Button } from '@/components/ui';
import type { Job } from '@/engine/types';
import { purchases } from '@/services/purchases';
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
  usePathname: () => '/activities',
  Redirect: () => null,
}));

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
const button = (tree: ReactTestRenderer, id: string) => tree.root.findAll((n) => n.type === Button && n.props.testID === id)[0];

beforeEach(async () => {
  await AsyncStorage.clear();
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

function lifeAt(age: number, countryCode = 'US') {
  useGameStore.getState().newLife({ countryCode }, { birthCard: false });
  const g = useGameStore.getState().game!;
  const next = { ...g, character: { ...g.character, age, energy: 4, energyMax: 4 }, year: g.character.birthYear + age };
  useGameStore.setState({ game: next });
  return next;
}

describe('Activities energy chips', () => {
  it('an activity that takes no energy has no "No energy" chip, while the energy is full', () => {
    lifeAt(30);
    const tree = render(<ActivitiesScreen />);
    const all = texts(tree);
    expect(all).toContain('⚡ 4 of 4 energy left');
    expect(all).not.toContain('No energy');
    // Activities that take energy still say how much.
    expect(all).toContain('⚡ 1');
  });
});

describe('Work & School after retiring', () => {
  it('says Retired with the pension, not "Looking for work"', () => {
    const g = lifeAt(60);
    const job: Job = { defId: 'janitor', title: 'Janitor', company: 'Vertex Group', salary: 40_000, level: 0, performance: 60, yearsHeld: 20, yearsAtLevel: 5, category: 'service', partTime: false, askedThisYear: false, workedHarderThisYear: false };
    useGameStore.setState({ game: { ...g, education: { ...g.education, enrolled: false, stage: 'done' }, career: { ...g.career, job } } });
    act(() => useGameStore.getState().act({ type: 'retire' }));
    expect(useGameStore.getState().game!.career.retired).toBe(true);
    const tree = render(<OccupationScreen />);
    const all = texts(tree);
    expect(all).toContain('Retired · $14,000/yr pension');
    expect(all).not.toContain('Looking for work');
  });
});

describe('achievements screen money targets', () => {
  it('names the target in the currency of the life being played', () => {
    lifeAt(33, 'IN');
    const tree = render(<AchievementsScreen />);
    expect(texts(tree)).toContain('Reach a net worth of ₹12,000,000, a million US dollars at Indian wages.');
  });
});

describe('Restore purchases where purchases are not available (web)', () => {
  it('the paywall explains it and offers no Restore button', () => {
    expect(purchases.isSupported()).toBe(false);
    const tree = render(<PremiumScreen />);
    expect(button(tree, 'premium-restore')).toBeUndefined();
    expect(texts(tree)).toContain('Purchases are not available in this version. Get LifeLoop from the App Store or Google Play to buy or restore Premium.');
    expect(texts(tree).some((t) => /No previous purchase/.test(t))).toBe(false);
  });

  it('Settings explains it instead of reporting "no purchase found"', async () => {
    const tree = render(<SettingsScreen />);
    expect(button(tree, 'restore-purchases')).toBeUndefined();
    await act(flush);
    expect(texts(tree)).toContain('Purchases are not available in this version. Get LifeLoop from the App Store or Google Play to buy or restore Premium.');
  });

  it('where the store exists, Restore is offered and reports what it found', async () => {
    jest.spyOn(purchases, 'isSupported').mockReturnValue(true);
    jest.spyOn(purchases, 'restore').mockResolvedValue(false);
    const tree = render(<SettingsScreen />);
    await act(async () => {
      (button(tree, 'restore-purchases')!.props as { onPress: () => void }).onPress();
      await flush();
    });
    expect(texts(tree)).toContain('No previous purchase found for this store account.');
  });
});

describe('Report an ad (App Store Review Guideline 2.5.18)', () => {
  it('free players can report an ad by email; Premium players see no ads and no button', async () => {
    const { Linking } = jest.requireActual('react-native') as typeof import('react-native');
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const tree = render(<SettingsScreen />);
    const report = button(tree, 'report-ad');
    expect(report).toBeDefined();
    await act(async () => {
      (report!.props as { onPress: () => void }).onPress();
      await flush();
    });
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/^mailto:.+\?subject=Report%20an%20ad&body=/));
    act(() => useSettingsStore.setState({ premium: true }));
    const paid = render(<SettingsScreen />);
    expect(button(paid, 'report-ad')).toBeUndefined();
  });

  it('with no email app set up, the button shows the address instead of doing nothing', async () => {
    const { Linking } = jest.requireActual('react-native') as typeof import('react-native');
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no mail app'));
    const tree = render(<SettingsScreen />);
    await act(async () => {
      (button(tree, 'report-ad')!.props as { onPress: () => void }).onPress();
      await flush();
    });
    expect(texts(tree).some((t) => /^No email app is set up on this device\. Write to .+@.+\.$/.test(t))).toBe(true);
  });
});
