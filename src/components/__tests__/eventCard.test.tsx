import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { StyleSheet, Text } from 'react-native';

import { EventModal } from '@/components/game/EventModal';
import { eventCardModel } from '@/components/game/eventCard';
import { Button, ListRow } from '@/components/ui';
import { createLife, EVENT_REGISTRY, openNextEvent } from '@/engine';
import { trialCard } from '@/engine/systems/justice';
import type { GameState, PendingEvent } from '@/engine/types';
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

function flat(style: unknown): Record<string, unknown> {
  return (StyleSheet.flatten(style as never) ?? {}) as Record<string, unknown>;
}

function texts(node: ReactTestInstance): string[] {
  return node.findAll((n) => n.type === Text).map((n) => ([] as unknown[]).concat(n.props.children).filter((c) => typeof c === 'string').join(''));
}

/** A 31-year-old American with `cash`, so costs are in unscaled dollars. */
function adult(cash: number, age = 31): GameState {
  const g = createLife({ firstName: 'Ana', lastName: 'Reyes', gender: 'female', countryCode: 'US' }, 7);
  return { ...g, character: { ...g.character, age }, year: g.character.birthYear + age, finances: { ...g.finances, cash } };
}

const taxAudit: PendingEvent = {
  eventId: 'mn_tax_audit',
  title: 'Tax audit',
  text: 'A thick envelope from the tax agency arrived.',
  context: {},
  choices: [
    { id: 'accountant', label: 'Hire an accountant', hint: '$800' },
    { id: 'myself', label: 'Handle it myself' },
  ],
};

describe('eventCardModel', () => {
  it('shows the category emoji and an "Age · year" caption', () => {
    const game = adult(5000);
    const m = eventCardModel(game, taxAudit);
    expect(m.emoji).toBe('💰');
    expect(m.categoryLabel).toBe('Money');
    expect(m.caption).toBe(`Age 31 · ${game.year}`);
    expect(m.person).toBeNull();
  });

  it('marks a cost the adult cannot cover as going on credit', () => {
    const [hire, myself] = eventCardModel(adult(50), taxAudit).choices;
    expect(hire).toMatchObject({ tone: 'credit', chip: '$800 · on credit' });
    expect(hire!.accessibilityLabel).toContain('becomes debt');
    expect(myself!.tone).toBe('neutral');
    expect(myself!.chip).toBeUndefined();
  });

  it('shows an affordable cost plainly, and never flags credit for a minor (parents pay)', () => {
    expect(eventCardModel(adult(5000), taxAudit).choices[0]).toMatchObject({ tone: 'cost', chip: '$800' });
    expect(eventCardModel(adult(0, 12), taxAudit).choices[0]).toMatchObject({ tone: 'cost', chip: '$800' });
  });

  it('colours money the player receives as a gain', () => {
    const pending: PendingEvent = { eventId: 'tm_free_products', title: 'Free stuff', text: '…', context: {}, choices: [{ id: 'gush', label: 'Gush for the money', hint: '+$400' }] };
    expect(eventCardModel(adult(0), pending).choices[0]!.tone).toBe('gain');
  });

  it('adds a person chip with name and relation when the card is about someone', () => {
    const game = adult(5000);
    const mother = Object.values(game.people).find((p) => p.kind === 'mother')!;
    const m = eventCardModel(game, { ...taxAudit, personId: mother.id });
    expect(m.person).toEqual({ emoji: '👩', name: `${mother.firstName} ${mother.lastName}`, relation: 'Mother' });
  });

  it("shows the court card's lawyer fee as a cost, or a warning when it is more than the player has", () => {
    const court = (cash: number) => {
      const g = openNextEvent({ ...adult(cash), eventQueue: [trialCard(adult(cash), 'car_theft', 3)] }, EVENT_REGISTRY);
      return eventCardModel(g, g.pendingEvent!);
    };
    const rich = court(50_000);
    expect(rich.emoji).toBe('🚨');
    expect(rich.choices.map((c) => c.tone)).toEqual(['neutral', 'neutral', 'cost', 'neutral']);
    expect(rich.choices[2]!.chip).toMatch(/^\$12,000 · /);
    const broke = court(0).choices[2]!;
    expect(broke).toMatchObject({ tone: 'credit', chip: '$12,000 · more than I have' });
    expect(broke.accessibilityLabel).toBe('Hire a lawyer, $12,000 · more than I have');
  });

  it('falls back gracefully for an unknown event and a partial state', () => {
    const m = eventCardModel({ pendingEvent: taxAudit } as unknown as GameState, { ...taxAudit, eventId: 'nope' });
    expect(m.emoji).toBe('✨');
    expect(m.caption).toBeNull();
    expect(m.choices[0]).toMatchObject({ tone: 'neutral', chip: '$800' });
  });
});

describe('EventModal', () => {
  afterEach(() => {
    act(() => useGameStore.setState({ game: null }));
  });

  it('gives every choice the same style and keeps each hint chip inside its own button', () => {
    const game = adult(50);
    const mother = Object.values(game.people).find((p) => p.kind === 'mother')!;
    act(() => useGameStore.setState({ game: { ...game, pendingEvent: { ...taxAudit, personId: mother.id } } }));
    const tree = render(<EventModal />);
    const host = (id: string) => tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === id)[0]!;

    // Equal weight: identical button styles whatever the index.
    expect(flat(host('choice-0').props.style)).toEqual(flat(host('choice-1').props.style));
    // The hint lives in the first choice, not floating between buttons.
    expect(texts(host('choice-0'))).toContain('$800 · on credit');
    expect(texts(host('choice-1'))).not.toContain('$800 · on credit');

    const all = texts(tree.root);
    expect(all).toContain(`Age 31 · ${game.year}`);
    expect(all.join(' ')).toContain(mother.firstName);
    expect(all).toContain(' ·\u00A0Mother');
    act(() => tree.unmount());
  });

  it('answers with the tapped choice', () => {
    const choose = jest.fn();
    act(() => useGameStore.setState({ game: { ...adult(5000), pendingEvent: taxAudit }, choose }));
    const tree = render(<EventModal />);
    const choice = tree.root.findAll((n) => n.props.testID === 'choice-1' && typeof n.props.onPress === 'function')[0]!;
    act(() => choice.props.onPress());
    expect(choose).toHaveBeenCalledWith('myself');
    act(() => tree.unmount());
  });
});

describe('ListRow', () => {
  it('dims only the title and emoji of a locked row and keeps its reason at full contrast', () => {
    const tree = render(<ListRow title="Gym" subtitle="Age 12+" emoji="🏋️" right="$40" onPress={() => {}} disabled testID="row" />);
    const row = tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === 'row')[0]!;
    expect(flat(row.props.style).opacity).toBeUndefined();
    const title = tree.root.findAll((n) => n.type === Text && n.props.children === 'Gym')[0]!;
    expect(flat(title.props.style).opacity).toBe(0.5);
    const reason = tree.root.findAll((n) => n.type === Text && n.props.children === '🔒 Age 12+')[0]!;
    expect(flat(reason.props.style).opacity).toBeUndefined();
    // No chevron: a locked row does not look tappable.
    expect(texts(tree.root)).not.toContain('›');
  });

  it('keeps the chevron on a tappable row', () => {
    const tree = render(<ListRow title="Library" subtitle="Read a while." onPress={() => {}} />);
    expect(texts(tree.root)).toContain('›');
  });
});

describe('Button', () => {
  it('sets a wrapped label slightly smaller instead of cutting it off', () => {
    const tree = render(<Button title="Study harder this year" size="sm" />);
    const label = () => tree.root.findByType(Text);
    expect(flat(label().props.style).fontSize).toBe(13);
    act(() => label().props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 80, height: 34 } } }));
    expect(flat(label().props.style).fontSize).toBe(12);
    expect(label().props.numberOfLines).toBe(2);
  });

  it('keeps a one-line label at full size', () => {
    const tree = render(<Button title="Go" />);
    const label = tree.root.findByType(Text);
    act(() => label.props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 30, height: 20 } } }));
    expect(flat(tree.root.findByType(Text).props.style).fontSize).toBe(15);
  });
});
