import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Text } from 'react-native';

import { EventModal } from '@/components/game/EventModal';
import { Button, Card } from '@/components/ui';
import type { GameState } from '@/engine/types';
import { useGameStore } from '@/store/gameStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn(() => Promise.resolve()) }));

function render(element: React.ReactElement): ReactTestRenderer {
  let tree: ReactTestRenderer | undefined;
  act(() => {
    tree = create(element);
  });
  return tree!;
}

/** Host-level props of the first node with this testID (what native/web accessibility actually sees). */
function hostProps(tree: ReactTestRenderer, testID: string) {
  const node = tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === testID)[0];
  if (!node) throw new Error(`no host node with testID ${testID}`);
  return node.props as Record<string, unknown>;
}

describe('Card', () => {
  it('renders a static (non-pressable) card as a plain View so its children stay reachable by screen readers', () => {
    const tree = render(
      <Card testID="card">
        <Button title="Restore purchases" onPress={() => {}} testID="inner" />
      </Card>,
    );
    const card = hostProps(tree, 'card');
    // A disabled Pressable would expose accessible=true + accessibilityState.disabled, hiding its children.
    expect(card.accessible).not.toBe(true);
    expect(card.accessibilityState).toBeUndefined();
    expect(card.accessibilityRole).toBeUndefined();
    expect(card['aria-disabled']).toBeUndefined();

    const inner = hostProps(tree, 'inner');
    expect(inner.accessibilityRole).toBe('button');
    expect(inner.accessibilityState).toEqual({ disabled: false });
  });

  it('keeps tappable cards accessible as a single pressable element', () => {
    const onPress = jest.fn();
    const tree = render(<Card testID="card" onPress={onPress} disabled />);
    const card = hostProps(tree, 'card');
    expect(card.accessible).toBe(true);
    expect(card.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
  });
});

describe('Button', () => {
  function labelProps(tree: ReactTestRenderer) {
    return tree.root.findByType(Text).props as { numberOfLines?: number; style: unknown };
  }

  it('truncates to a single line by default', () => {
    expect(labelProps(render(<Button title="Go" />)).numberOfLines).toBe(1);
  });

  it('forwards numberOfLines and centres wrapped labels', () => {
    const props = labelProps(render(<Button title="Go to the appointment with them" numberOfLines={3} />));
    expect(props.numberOfLines).toBe(3);
    const flat = ([] as unknown[]).concat(props.style).flat(Infinity).filter(Boolean) as { textAlign?: string }[];
    expect(flat.some((s) => s.textAlign === 'center')).toBe(true);
  });
});

describe('EventModal', () => {
  afterEach(() => {
    act(() => useGameStore.setState({ game: null }));
  });

  it('lets long choice labels wrap instead of cutting them with an ellipsis', () => {
    const label = 'Send them for a left-handed stapler';
    const pendingEvent = { eventId: 'test', title: 'Test', text: 'Text', context: {}, choices: [{ id: 'a', label }, { id: 'b', label: 'No' }] };
    // EventModal only reads game.pendingEvent, so a stub game is enough here.
    useGameStore.setState({ game: { pendingEvent } as unknown as GameState });

    const tree = render(<EventModal />);
    const choice = tree.root.findAll((n) => n.type === Text && n.props.children === label)[0];
    expect(choice).toBeDefined();
    expect(choice!.props.numberOfLines).toBeGreaterThanOrEqual(2);
    act(() => tree.unmount());
  });
});
