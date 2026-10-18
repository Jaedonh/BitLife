import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Text } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';

import NotFoundScreen from '@/app/+not-found';
import DeathScreen from '@/app/death';
import GraveyardScreen from '@/app/graveyard';
import MenuScreen from '@/app/index';
import { familyLine, heirInheritance, lifeAvatar, livingHeirs, obituaryShareText, ribbonTally, storyByYear } from '@/components/game/legacy';
import { createLife, RIBBONS } from '@/engine';
import { markDeath } from '@/engine/systems/death';
import type { GameState, Person } from '@/engine/types';
import { useGameStore } from '@/store/gameStore';
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

/** Host nodes (what web/native actually render) with this testID. */
function hosts(tree: ReactTestRenderer, testID: string): ReactTestInstance[] {
  return tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === testID);
}

/** Taps the nth element with this testID that handles presses (a Pressable, Button or Card). */
function press(tree: ReactTestRenderer, testID: string, nth = 0) {
  const node = tree.root.findAll((n) => n.props.testID === testID && typeof n.props.onPress === 'function')[nth];
  if (!node) throw new Error(`nothing to press: ${testID}`);
  act(() => (node.props as { onPress: () => void }).onPress());
}

/** Every string rendered by Text nodes, joined, for loose content checks. */
function allText(tree: ReactTestRenderer): string {
  const flat = (c: unknown): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : '');
  return tree.root.findAllByType(Text).map((t) => flat(t.props.children)).join('\n');
}

function child(base: Person, id: string, firstName: string, age: number, relationship: number): Person {
  return { ...base, id, kind: 'child', firstName, age, relationship, alive: true, metAtAge: 30, money: 0, occupation: 'Student' };
}

/** A finished life with `kids` living children, a fixed estate and a known karma. */
function deadLife(kids: [string, number, number][], netCash = 100_000, generation = 1): GameState {
  const g = createLife({ countryCode: 'US' }, 42, 0);
  const mother = Object.values(g.people).find((p) => p.kind === 'mother')!;
  const people = { ...g.people };
  kids.forEach(([name, age, rel], i) => {
    people[`kid${i}`] = child(mother, `kid${i}`, name, age, rel);
  });
  const aged: GameState = { ...g, generation, people, year: g.year + 70, character: { ...g.character, age: 70, karma: 77 }, finances: { ...g.finances, cash: netCash } };
  return markDeath(aged, 'a stroke');
}

function graveOf(g: GameState): GraveyardEntry {
  return {
    id: g.character.id,
    name: `${g.character.firstName} ${g.character.lastName}`,
    birthYear: g.character.birthYear,
    deathYear: g.year,
    age: g.character.age,
    cause: g.death!.cause,
    ribbonId: g.death!.ribbonId,
    netWorth: g.death!.netWorth,
    countryCode: g.character.countryCode,
    generation: g.generation,
    obituary: g.death!.obituary,
    epitaph: g.death!.epitaph,
    diedAt: 1,
  };
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
  act(() => {
    for (const tree of mounted.splice(0)) tree.unmount();
  });
  jest.restoreAllMocks();
});

describe('legacy helpers', () => {
  it('picks an avatar that ages with the character', () => {
    expect(lifeAvatar('female', 1)).toBe('👶');
    expect(lifeAvatar('male', 9)).toBe('👦');
    expect(lifeAvatar('female', 30)).toBe('👩');
    expect(lifeAvatar('male', 71)).toBe('👴');
  });

  it('splits 80% of a positive estate between the living children, like the engine hand-off', () => {
    const g = deadLife([['Ana', 40, 80], ['Ben', 36, 50]], 100_000);
    expect(livingHeirs(g).map((p) => p.firstName)).toEqual(['Ana', 'Ben']);
    expect(heirInheritance(g)).toBe(Math.round((g.death!.netWorth * 0.8) / 2));
    const heir = createLife({ heir: { childId: 'kid0', previous: g } }, 7, 0);
    expect(heir.finances.cash).toBe(heirInheritance(g));
    expect(heirInheritance(deadLife([['Ana', 40, 80]], 0))).toBe(0);
  });

  it('groups the journal by year and keeps the opening lines', () => {
    const years = storyByYear([
      { age: 0, year: 2000, text: '2000: Age 0', kind: 'year' },
      { age: 0, year: 2000, text: 'I was born.', kind: 'milestone' },
      { age: 1, year: 2001, text: '2001: Age 1', kind: 'year' },
      { age: 1, year: 2001, text: 'I walked.', kind: 'good' },
    ]);
    expect(years.map((y) => [y.heading, y.entries.length])).toEqual([
      ['Age 0 · 2000', 1],
      ['Age 1 · 2001', 1],
    ]);
  });

  it('counts ribbons and finds the family line a grave belongs to', () => {
    const g = deadLife([['Ana', 40, 80]]);
    const grave = graveOf(g);
    expect(ribbonTally([grave, grave])).toEqual({ [grave.ribbonId]: 2 });
    const heir = createLife({ heir: { childId: 'kid0', previous: g } }, 7, 0);
    const line = familyLine(grave, heir)!;
    expect(line.map((m) => [m.generation, m.isEntry, m.playing])).toEqual([
      [1, true, false],
      [2, false, true],
    ]);
    expect(familyLine({ ...grave, name: 'Someone Else' }, heir)).toBeNull();
    expect(obituaryShareText(grave)).toContain(grave.obituary);
  });
});

describe('DeathScreen', () => {
  it('shows karma only when the setting is on (UI-16)', () => {
    act(() => useGameStore.setState({ game: deadLife([]) }));
    const tree = render(<DeathScreen />);
    expect(hosts(tree, 'death-karma')).toHaveLength(0);
    act(() => useSettingsStore.getState().setSetting('showKarma', true));
    expect(hosts(tree, 'death-karma')).toHaveLength(1);
    expect(allText(tree)).toContain('77%');
  });

  it('lists heirs right after the tombstone with relationship and inheritance, and continues the line', () => {
    const g = deadLife([['Ana', 40, 80], ['Ben', 2, 50]]);
    act(() => useGameStore.setState({ game: g }));
    const tree = render(<DeathScreen />);
    const heirs = hosts(tree, 'continue-heir');
    expect(heirs).toHaveLength(2);
    const text = allText(tree);
    expect(text).toContain('Relationship 80%');
    expect(text).toMatch(/Inherits \$\d/);
    expect(text.indexOf('CONTINUE THE FAMILY LINE')).toBeLessThan(text.indexOf('OBITUARY'));
    expect(text.indexOf('OBITUARY')).toBeLessThan(text.indexOf('LIFE IN NUMBERS'));
    press(tree, 'continue-heir');
    expect(useGameStore.getState().game!.character.firstName).toBe('Ana');
    expect(mockRouter.replace).toHaveBeenCalledWith('/life');
  });

  it('marks heirs as Premium once the free hand-off is used, and sends a tap to the paywall', () => {
    act(() => useGameStore.setState({ game: deadLife([['Ana', 40, 80]], 100_000, 2) }));
    const tree = render(<DeathScreen />);
    expect(allText(tree)).toContain('🔒 Premium');
    press(tree, 'continue-heir');
    expect(mockRouter.push).toHaveBeenCalledWith('/premium');
    expect(useGameStore.getState().game!.alive).toBe(false);
  });

  it('opens the full life story from the first year', () => {
    act(() => useGameStore.setState({ game: deadLife([]) }));
    const tree = render(<DeathScreen />);
    press(tree, 'read-life-story');
    expect(hosts(tree, 'life-story').length).toBeGreaterThan(0);
    expect(allText(tree)).toContain('I was born');
  });
});

describe('GraveyardScreen', () => {
  it('opens a grave to its obituary and epitaph, and explains locked ribbons (UI-19)', async () => {
    const g = deadLife([['Ana', 40, 80]]);
    useSettingsStore.getState().addToGraveyard(graveOf(g));
    await flush();
    const tree = render(<GraveyardScreen />);
    press(tree, 'grave');
    expect(hosts(tree, 'grave-obituary')[0]!.props.children).toBe(g.death!.obituary);
    expect(allText(tree)).toContain(g.death!.epitaph);

    press(tree, 'graveyard-tab-ribbons');
    expect(allText(tree)).toContain(`1/${RIBBONS.length}`);
    const locked = RIBBONS.find((r) => r.id !== g.death!.ribbonId)!;
    press(tree, `ribbon-${locked.id}`);
    expect(allText(tree)).toContain(locked.description);
    expect(allText(tree)).toContain('Not earned yet');
  });
});

describe('MenuScreen', () => {
  it('shows the current life with Continue, and karma only when enabled', () => {
    act(() => useGameStore.getState().newLife({ countryCode: 'US' }));
    const tree = render(<MenuScreen />);
    const g = useGameStore.getState().game!;
    expect(hosts(tree, 'home-life-name')[0]).toBeDefined();
    expect(allText(tree)).toContain(`${g.character.firstName} ${g.character.lastName}`);
    expect(hosts(tree, 'home-karma')).toHaveLength(0);
    act(() => useSettingsStore.getState().setSetting('showKarma', true));
    expect(hosts(tree, 'home-karma')).toHaveLength(1);
    press(tree, 'continue-life');
    expect(mockRouter.replace).toHaveBeenCalledWith('/life');
  });
});

describe('NotFoundScreen', () => {
  it('offers a way back home', () => {
    const tree = render(<NotFoundScreen />);
    press(tree, 'not-found-home');
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
  });
});
