import { Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { LifeLog } from '@/components/game/LifeLog';
import { ResultToast } from '@/components/game/ResultToast';
import { ScreenHeader } from '@/components/game/ScreenHeader';
import { StatsHeader } from '@/components/game/StatsHeader';
import type { GameState, LogEntry } from '@/engine/types';
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
const mockPath = { current: '/assets' };
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn(), canGoBack: () => true },
  usePathname: () => mockPath.current,
}));

const mounted: ReactTestRenderer[] = [];
function render(el: React.ReactElement): ReactTestRenderer {
  let tree: ReactTestRenderer | undefined;
  act(() => {
    tree = create(el);
  });
  mounted.push(tree!);
  return tree!;
}
const hostIds = (tree: ReactTestRenderer, prefix: string) =>
  tree.root.findAll((n) => typeof n.type === 'string' && typeof n.props.testID === 'string' && n.props.testID.startsWith(prefix)).map((n) => n.props.testID as string);
const has = (tree: ReactTestRenderer, id: string) => hostIds(tree, id).includes(id);
const texts = (tree: ReactTestRenderer) => tree.root.findAllByType(Text).map((t) => [t.props.children].flat().join(''));

function newLife(): GameState {
  useGameStore.getState().newLife({ countryCode: 'GB', firstName: 'Ada', gender: 'female' });
  return useGameStore.getState().game!;
}

beforeEach(() => {
  mockPath.current = '/assets';
  useGameStore.setState({ game: null, adShowing: false, pendingSummary: null });
  useSettingsStore.setState({ settings: { haptics: false, showKarma: false, tutorialDone: true } });
});

afterEach(() => {
  act(() => {
    for (const t of mounted.splice(0)) t.unmount();
  });
});

describe('LifeLog', () => {
  it('renders year cards with the current year on top, from the whole history', () => {
    const g = newLife();
    const log: LogEntry[] = [];
    for (let age = 0; age <= 80; age++) {
      log.push({ age, year: 2000 + age, text: `${2000 + age}: Age ${age}`, kind: 'year' });
      for (let i = 0; i < 7; i++) log.push({ age, year: 2000 + age, text: `Line ${i} at ${age}`, kind: i === 0 ? 'milestone' : 'info' });
    }
    const game = { ...g, log, character: { ...g.character, age: 80 } };
    const tree = render(<LifeLog game={game} />);
    const cards = hostIds(tree, 'year-card-');
    expect(cards[0]).toBe('year-card-80');
    expect(cards[1]).toBe('year-card-79');
    expect(texts(tree)).toContain('This year');
  });
});

describe('StatsHeader', () => {
  it('shows an age-appropriate avatar, energy, debt, and fame and karma only when they apply', () => {
    const g = newLife();
    const onOpen = jest.fn();
    const tree = render(<StatsHeader game={g} onOpenProfile={onOpen} />);
    expect(texts(tree)).toContain('👶');
    expect(has(tree, 'chip-energy')).toBe(true);
    expect(has(tree, 'chip-fame')).toBe(false);
    expect(has(tree, 'chip-karma')).toBe(false);
    expect(has(tree, 'char-debt')).toBe(false);

    act(() => useSettingsStore.setState({ settings: { haptics: false, showKarma: true, tutorialDone: true } }));
    const older = { ...g, character: { ...g.character, age: 72, fame: 34, energy: 0 }, finances: { ...g.finances, debt: 15480 } };
    act(() => tree.update(<StatsHeader game={older} onOpenProfile={onOpen} />));
    expect(texts(tree)).toContain('👵');
    expect(has(tree, 'chip-fame')).toBe(true);
    expect(has(tree, 'chip-karma')).toBe(true);
    expect(texts(tree)).toContain('£12,229 debt');
    expect(texts(tree)).toContain('⚡ Out of energy');
    const header = tree.root.find((n) => typeof n.type === 'string' && n.props.testID === 'stats-header');
    expect(header.props.accessibilityLabel).toContain('debt');
    const pressable = tree.root.findAll((n) => n.props.testID === 'stats-header' && typeof n.props.onPress === 'function')[0]!;
    act(() => pressable.props.onPress());
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

describe('ScreenHeader', () => {
  it('shows cash only for a living character on the screens about that life', () => {
    const g = newLife();
    let tree = render(<ScreenHeader title="Assets" />);
    expect(has(tree, 'header-money')).toBe(true);

    mockPath.current = '/settings';
    tree = render(<ScreenHeader title="Settings" />);
    expect(has(tree, 'header-money')).toBe(false);
    tree = render(<ScreenHeader title="Settings" showMoney />);
    expect(has(tree, 'header-money')).toBe(true);

    mockPath.current = '/graveyard';
    act(() => useGameStore.setState({ game: { ...g, alive: false } }));
    tree = render(<ScreenHeader title="Graveyard" showMoney />);
    expect(has(tree, 'header-money')).toBe(false);
  });
});

describe('ResultToast (global feedback host)', () => {
  it('shows each new result wherever the player is, waits behind event cards, and forgets results from another life', () => {
    const g = newLife();
    const tree = render(<ResultToast />);
    expect(has(tree, 'result-toast')).toBe(false);

    act(() => useGameStore.setState({ game: { ...g, lastResult: { text: "I can't afford that right now.", kind: 'info' } } }));
    expect(has(tree, 'result-toast')).toBe(true);
    expect(texts(tree)).toContain("I can't afford that right now.");

    // Behind an event card the toast waits, hidden.
    const withEvent = { ...useGameStore.getState().game!, pendingEvent: { eventId: 'x', title: 'X', text: 'x', choices: [{ id: 'a', label: 'A' }], context: {} } };
    act(() => useGameStore.setState({ game: withEvent }));
    expect(has(tree, 'result-toast')).toBe(false);
    act(() => useGameStore.setState({ game: { ...withEvent, pendingEvent: null } }));
    expect(has(tree, 'result-toast')).toBe(true);

    // A new life drops whatever the old one left behind.
    act(() => {
      newLife();
    });
    expect(has(tree, 'result-toast')).toBe(false);
  });

  it('colours stat pills by sign and reports money in the local currency', () => {
    const g = newLife();
    const tree = render(<ResultToast />);
    act(() => useGameStore.setState({ game: { ...g, lastResult: { text: 'I hit the gym.', kind: 'good', statDeltas: { health: 2, happiness: -1 }, moneyDelta: -24 } } }));
    const all = texts(tree);
    expect(all).toEqual(expect.arrayContaining(['Happiness', '−1', 'Health', '+2', '−£19']));
  });
});
