import { Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { LegacyHeirCard } from '@/components/game/LegacyHeirCard';
import { LifeProfileSheet } from '@/components/game/LifeProfileSheet';
import { createLife } from '@/engine';
import type { Person } from '@/engine/types';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-safe-area-context', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('react-native-safe-area-context/jest/mock').default,
);

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
    for (const tree of mounted.splice(0)) tree.unmount();
  });
});
function allText(tree: ReactTestRenderer): string {
  const flat = (c: unknown): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : '');
  return tree.root.findAllByType(Text).map((t) => flat(t.props.children)).join('\n');
}

describe('playtest 2: profile and heir cards', () => {
  it('lists Lucky once in the profile, even for an older save that stored it twice (finding 34)', () => {
    const g = createLife({ countryCode: 'US' }, 7);
    const game = { ...g, character: { ...g.character, traits: ['lucky', 'lucky'] as const } as typeof g.character };
    const tree = render(<LifeProfileSheet game={game} visible onClose={() => {}} />);
    const cards = tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === 'profile-trait-lucky');
    expect(cards).toHaveLength(1);
  });

  it('shows a daughter who left high school as having no diploma, not as a student (finding 8)', () => {
    const g = createLife({ countryCode: 'US' }, 42);
    const mother = Object.values(g.people).find((p) => p.kind === 'mother')!;
    const harriet: Person = { ...mother, id: 'kid', kind: 'child', firstName: 'Harriet', lastName: 'Walker', age: 20, occupation: 'Student', growth: { school: 'droppedOut' } };
    const tree = render(<LegacyHeirCard heir={harriet} inheritance={0} countryCode="US" locked={false} onPress={() => {}} />);
    const text = allText(tree);
    expect(text).toContain('Daughter · 20 · No diploma');
    expect(text).not.toContain('Student');
  });
});
