/**
 * The person screen (follow-ups): a second father is titled Papa, Back after a reload or a deep link returns to the
 * life screen, and someone far away is reached by phone, never in person.
 */
import { Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import PersonScreen from '@/app/person/[id]';
import { Rng } from '@/engine/rng';
import { createLife, makePerson } from '@/engine/systems/character';
import { markDeath } from '@/engine/systems/death';
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
// A reload on web: no history to go back to.
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn(), canGoBack: () => false },
  Redirect: () => null,
  useLocalSearchParams: () => ({ id: mockId }),
  usePathname: () => `/person/${mockId}`,
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { router } = require('expo-router') as { router: { replace: jest.Mock; back: jest.Mock } };

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
  jest.clearAllMocks();
});

const texts = (tree: ReactTestRenderer) => tree.root.findAllByType(Text).map((n) => [n.props.children].flat().join(''));
const byTestID = (tree: ReactTestRenderer, testID: string) => tree.root.findAll((n) => typeof n.type !== 'string' && n.props.testID === testID);

/** An heir of two fathers, 12: the late player is Dad, the surviving father Papa. */
function twoFathers(): { game: GameState; papa: Person } {
  const base = createLife({ countryCode: 'IN', gender: 'male' }, 77);
  const prev0 = { ...base, character: { ...base.character, age: 40 }, year: base.character.birthYear + 40 };
  const rng = new Rng(3);
  const spouse = { ...makePerson(rng, { kind: 'spouse', gender: 'male', age: 41, countryCode: 'IN', playerAge: 40 }), firstName: 'Sanjay' };
  const kid = { ...makePerson(rng, { kind: 'child', gender: 'female', age: 12, countryCode: 'IN', playerAge: 28 }), otherParentId: spouse.id };
  const game = createLife({ heir: { childId: kid.id, previous: markDeath({ ...prev0, people: { ...prev0.people, [spouse.id]: spouse, [kid.id]: kid } }, 'a car accident') } }, 4);
  return { game, papa: Object.values(game.people).find((p) => p.kind === 'father' && p.alive)! };
}

describe('Person screen', () => {
  it('titles a second father Papa, and Back with no history returns to the life screen', () => {
    const { game, papa } = twoFathers();
    useGameStore.setState({ game: { ...game, log: [] } });
    mockId = papa.id;
    const tree = render(<PersonScreen />);
    expect(texts(tree)).toContain('Papa');
    expect(texts(tree)).not.toContain('Dad');
    expect(texts(tree)).toContain('No memories with Papa yet. Spend some time together.');
    act(() => {
      (byTestID(tree, 'back')[0]!.props as { onPress: () => void }).onPress();
    });
    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/life');
  });

  it('offers a grandmother far away a call, not a visit, and says she lives far away', () => {
    const base = createLife({ countryCode: 'US', firstName: 'Nora' }, 9);
    const grandma: Person = { ...makePerson(new Rng(5), { kind: 'grandparent', gender: 'female', age: 72, countryCode: 'MX', playerAge: 0, money: 5_000 }), firstName: 'Rosa', farAway: true };
    useGameStore.setState({ game: { ...base, log: [], character: { ...base.character, age: 10, energy: 4, energyMax: 4 }, people: { ...base.people, [grandma.id]: grandma } } });
    mockId = grandma.id;
    const tree = render(<PersonScreen />);
    expect(byTestID(tree, 'interact-visit')).toHaveLength(0);
    expect(byTestID(tree, 'interact-spendTime')).toHaveLength(0);
    expect(byTestID(tree, 'interact-conversation').length).toBeGreaterThan(0);
    expect(texts(tree).join(' ')).toMatch(/Lives far away\./);
    expect(texts(tree)).toContain('No memories with Grandma Rosa yet. Give her a call.');
  });
});
