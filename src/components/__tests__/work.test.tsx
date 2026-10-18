import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Text } from 'react-native';

import { Chip } from '@/components/game/WorkChip';
import { Disclosure } from '@/components/game/WorkDisclosure';
import { earlyStage, upcomingUnlocks } from '@/components/game/workEarlyYears';
import { jobRequirementBadges } from '@/components/game/workRequirements';
import { JOB_BY_ID } from '@/data/jobs';
import { createLife, meetsRequirements, type GameState } from '@/engine';

function render(element: React.ReactElement): ReactTestRenderer {
  let tree: ReactTestRenderer | undefined;
  act(() => {
    tree = create(element);
  });
  return tree!;
}

function hostProps(tree: ReactTestRenderer, testID: string) {
  const node = tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === testID)[0];
  if (!node) throw new Error(`no host node with testID ${testID}`);
  return node.props as Record<string, unknown>;
}

const at = (s: GameState, age: number, patch: Partial<GameState> = {}): GameState => ({ ...s, ...patch, character: { ...s.character, age } });

describe('Work & School early years (UI-15)', () => {
  const us = createLife({ countryCode: 'US' }, 21);
  const gb = createLife({ countryCode: 'GB' }, 21);

  it('gives every pre-school age something to show', () => {
    expect(earlyStage(at(us, 0))?.title).toMatch(/^At home with (Mom|Dad|family)$/);
    expect(earlyStage(at(us, 3))?.title).toBe('Daycare');
    expect(earlyStage(at(us, 5))?.title).toBe('Preschool');
    expect(earlyStage(at(gb, 4))?.title).toBe('Preschool');
    expect(earlyStage(at(us, 6))).toBeNull();
    expect(earlyStage(at(gb, 5))).toBeNull();
  });

  it('lists what unlocks next, soonest first', () => {
    const baby = upcomingUnlocks(at(us, 0));
    expect(baby.slice(0, 3).map((u) => [u.label, u.inYears])).toEqual([
      ['Daycare', 2],
      ['Preschool', 4],
      ['Elementary school', 6],
    ]);
    const pupil = upcomingUnlocks(at(us, 8, { education: { ...us.education, enrolled: true, stage: 'primary' } }));
    expect(pupil[0]).toEqual(expect.objectContaining({ label: 'Side hustles', age: 13, inYears: 5 }));
  });
});

describe('job requirement badges (UI-21)', () => {
  const base = createLife({ countryCode: 'US' }, 5);

  it('marks each requirement as met or missing', () => {
    const def = JOB_BY_ID.software_dev!;
    const grad = at(base, 23, {
      education: { ...base.education, degrees: ['high_school', 'bachelor:computer_science'] },
    });
    const smart = { ...grad, character: { ...grad.character, stats: { ...grad.character.stats, smarts: 80 } } };
    const dull = { ...grad, character: { ...grad.character, stats: { ...grad.character.stats, smarts: 30 } } };
    const ok = jobRequirementBadges(smart, def, meetsRequirements(smart, def));
    expect(ok.every((b) => b.tone === 'good')).toBe(true);
    const missing = jobRequirementBadges(dull, def, meetsRequirements(dull, def));
    expect(missing.find((b) => b.label.includes('Smarts'))?.tone).toBe('bad');
    expect(missing.find((b) => b.label.includes('🎓'))?.tone).toBe('good');
  });

  it("adds the engine's reason when no badge explains a refusal", () => {
    const def = JOB_BY_ID.pt_cashier!;
    const adult = at(base, 30);
    const verdict = meetsRequirements(adult, def);
    expect(verdict.ok).toBe(false);
    expect(jobRequirementBadges(adult, def, verdict)).toContainEqual({ label: verdict.reason, tone: 'bad' });
  });
});

describe('Work controls', () => {
  it('a Disclosure announces whether it is open and only renders rows when it is', () => {
    const onToggle = jest.fn();
    const tree = render(
      <Disclosure title="Go to university" summary="25 majors" open={false} onToggle={onToggle} testID="d">
        <Text testID="row">Business</Text>
      </Disclosure>,
    );
    expect(hostProps(tree, 'd').accessibilityState).toEqual(expect.objectContaining({ expanded: false }));
    expect(tree.root.findAll((n) => n.props.testID === 'row')).toHaveLength(0);
    act(() => {
      tree.update(
        <Disclosure title="Go to university" summary="25 majors" open onToggle={onToggle} testID="d">
          <Text testID="row">Business</Text>
        </Disclosure>,
      );
    });
    expect(hostProps(tree, 'd').accessibilityState).toEqual(expect.objectContaining({ expanded: true }));
    expect(tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === 'row')).toHaveLength(1);
  });

  it('a Chip is a radio that reports its checked state', () => {
    const tree = render(<Chip label="25%" selected onPress={() => {}} testID="c" />);
    const props = hostProps(tree, 'c');
    expect(props.accessibilityRole).toBe('radio');
    expect(props.accessibilityState).toEqual(expect.objectContaining({ checked: true }));
  });
});
