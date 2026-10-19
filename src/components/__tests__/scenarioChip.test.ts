import { scenarioChipText } from '@/components/game/lifeFormat';
import { createLife } from '@/engine/systems/character';
import type { GameState } from '@/engine/types';

describe('the starting scenario on the life profile', () => {
  it('names a special start, and where an immigrant was born in running prose', () => {
    const standard = createLife({ countryCode: 'US' }, 3);
    expect(scenarioChipText(standard)).toBeNull();
    expect(scenarioChipText(createLife({ scenario: 'orphan' }, 3))).toBe('🧸 Orphan');
    const moved = (from: string): GameState => {
      const s = createLife({ scenario: 'immigrant', countryCode: 'CA' }, 3);
      return { ...s, flags: { ...s.flags, immigrant: from } };
    };
    expect(scenarioChipText(moved('US'))).toBe('✈️ Immigrant · born in the United States');
    expect(scenarioChipText(moved('GB'))).toBe('✈️ Immigrant · born in the United Kingdom');
    expect(scenarioChipText(moved('MX'))).toBe('✈️ Immigrant · born in Mexico');
    // Before the move, or for an heir with no scenario recorded, nothing about birth is claimed.
    expect(scenarioChipText(createLife({ scenario: 'immigrant', countryCode: 'CA' }, 3))).toBe('✈️ Immigrant');
    expect(scenarioChipText({ ...standard, character: { ...standard.character, scenario: undefined } })).toBeNull();
  });
});
