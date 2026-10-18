import { Alert, Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import PersonScreen from '@/app/person/[id]';
import RelationshipsScreen from '@/app/relationships';
import { StatBar } from '@/components/ui';
import type { GameState, Person } from '@/engine/types';
import { useGameStore } from '@/store/gameStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-safe-area-context', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('react-native-safe-area-context/jest/mock').default,
);
let mockId = '';
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn(), canGoBack: () => false },
  Redirect: () => null,
  useLocalSearchParams: () => ({ id: mockId }),
}));

const mounted: ReactTestRenderer[] = [];
function render(element: React.ReactElement): ReactTestRenderer {
  let tree: ReactTestRenderer | undefined;
  act(() => {
    tree = create(element);
  });
  mounted.push(tree!);
  return tree!;
}
afterEach(() => {
  act(() => {
    for (const t of mounted.splice(0)) t.unmount();
  });
  jest.restoreAllMocks();
});

/** An adult life with a partner of the given kind, plenty of cash and energy. */
function adultWith(kind: 'lover' | 'spouse'): { game: GameState; partner: Person } {
  useGameStore.getState().newLife({ countryCode: 'US' }, { birthCard: false });
  const g = useGameStore.getState().game!;
  const mom = Object.values(g.people).find((p) => p.kind === 'mother')!;
  const partner: Person = { ...mom, id: 'partner', kind, firstName: 'Sam', lastName: 'Rivera', gender: 'male', age: 30, love: 70, relationship: 70, metAtAge: 25, marriedAtAge: kind === 'spouse' ? 27 : undefined };
  const game: GameState = { ...g, character: { ...g.character, age: 30, energy: 4, energyMax: 4 }, finances: { ...g.finances, cash: 10_000 }, people: { ...g.people, partner } };
  useGameStore.setState({ game });
  mockId = partner.id;
  return { game, partner };
}

/** The outermost composite node with this testID: the Pressable as the screen wrote it (onPress, disabled, label). */
function byTestID(tree: ReactTestRenderer, testID: string) {
  return tree.root.findAll((n) => typeof n.type !== 'string' && n.props.testID === testID);
}

function tile(tree: ReactTestRenderer, id: string) {
  return byTestID(tree, `interact-${id}`)[0];
}

async function pressTile(tree: ReactTestRenderer, id: string) {
  const t = tile(tree, id);
  if (!t) throw new Error(`no tile ${id}`);
  await act(async () => {
    (t.props as { onPress: () => void }).onPress();
    await new Promise((r) => setTimeout(r, 0));
  });
}

function texts(tree: ReactTestRenderer): string[] {
  return tree.root.findAllByType(Text).map((n) => [n.props.children].flat().join(''));
}

describe('Person screen', () => {
  it('asks before a break up and does nothing when cancelled (UI-05)', async () => {
    adultWith('lover');
    const alert = jest.spyOn(Alert, 'alert');
    const tree = render(<PersonScreen />);

    alert.mockImplementationOnce((_t, _m, buttons) => buttons?.find((b) => b.style === 'cancel')?.onPress?.());
    await pressTile(tree, 'breakUp');
    expect(alert).toHaveBeenCalledWith('Break up with Sam?', expect.stringContaining("can't take this back"), expect.any(Array), expect.any(Object));
    expect(useGameStore.getState().game!.people.partner!.kind).toBe('lover');

    alert.mockImplementationOnce((_t, _m, buttons) => buttons?.find((b) => b.style === 'destructive')?.onPress?.());
    await pressTile(tree, 'breakUp');
    expect(useGameStore.getState().game!.people.partner!.kind).toBe('ex');
    // The outcome is shown on the screen, not only in the journal.
    expect(texts(tree)).toContain('I broke up with Sam.');
  });

  it('puts the divorce settlement in the confirmation (UI-05)', async () => {
    adultWith('spouse');
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const tree = render(<PersonScreen />);
    act(() => {
      (tile(tree, 'divorce')!.props as { onPress: () => void }).onPress();
    });
    expect(alert).toHaveBeenCalledWith('Divorce Sam?', expect.stringContaining('$3,000 (30% of your cash)'), expect.any(Array), expect.any(Object));
    expect(useGameStore.getState().game!.people.partner!.kind).toBe('spouse');
  });

  it('disables interactions with the reason instead of failing silently (UI-04)', async () => {
    const { game } = adultWith('lover');
    useGameStore.setState({ game: { ...game, character: { ...game.character, energy: 0 }, finances: { ...game.finances, cash: 0 } } });
    const tree = render(<PersonScreen />);
    const date = tile(tree, 'date')!;
    expect(date.props.disabled).toBe(true);
    expect(date.props.accessibilityLabel).toBe('Go on a date. Unavailable: No energy left.');
    expect(tile(tree, 'gift')!.props.accessibilityLabel).toBe("Give a gift. Unavailable: Can't afford it.");
    expect(tile(tree, 'compliment')!.props.disabled).toBe(false);
    expect(tile(tree, 'compliment')!.props.accessibilityLabel).toBe('Compliment, 2 left this year.');
  });

  it('titles a parent Mom and does not claim a child has not spoken to her for years (UI-12, UI-23)', () => {
    useGameStore.getState().newLife({ countryCode: 'US' }, { birthCard: false });
    const g = useGameStore.getState().game!;
    const mom = Object.values(g.people).find((p) => p.kind === 'mother')!;
    useGameStore.setState({ game: { ...g, character: { ...g.character, age: 8 } } });
    mockId = mom.id;
    const tree = render(<PersonScreen />);
    const all = texts(tree);
    expect(all).toContain('Mom');
    expect(all).toContain(`${mom.firstName} ${mom.lastName}`);
    expect(all.join(' ')).not.toMatch(/haven't spoken/);
  });
});

describe('People list', () => {
  it('groups people under Family first and keeps the person row test ids', () => {
    adultWith('spouse');
    const tree = render(<RelationshipsScreen />);
    const all = texts(tree);
    expect(all.indexOf('FAMILY')).toBeGreaterThanOrEqual(0);
    expect(all.indexOf('FAMILY')).toBeLessThan(all.indexOf('PARTNER'));
    expect(byTestID(tree, 'person-mother').length).toBeGreaterThan(0);
    expect(byTestID(tree, 'person-spouse').length).toBeGreaterThan(0);
  });
});

describe('StatBar (UI-07)', () => {
  it('keeps the label on one line in a column that grows to fit it', () => {
    const tree = render(<StatBar label="Relationship" value={62} color="#fff" />);
    const label = tree.root.findAllByType(Text)[0]!;
    expect(label.props.numberOfLines).toBe(1);
    const style = Object.assign({}, ...[label.props.style].flat(3).filter(Boolean));
    expect(style).toMatchObject({ minWidth: 72, flexShrink: 0 });
    expect(style.width).toBeUndefined();
  });
});
