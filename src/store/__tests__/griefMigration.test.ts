import { createLife, SCHEMA_VERSION } from '@/engine';
import { Rng } from '@/engine/rng';
import { makePerson } from '@/engine/systems/character';
import { yearlyRelationships } from '@/engine/systems/relationships';
import { GRIEF_FLAG, inGrief } from '@/engine/systems/romance';
import type { GameState } from '@/engine/types';
import { migrateSave } from '../migrations';

/**
 * A save from before the grief window (GAME_DESIGN §10): a widow of 60 whose husband died at 41, stored with no
 * `mourned` mark on anyone and no grief flag, exactly as the old engine wrote it.
 */
function oldWidowSave(): Record<string, unknown> {
  const base = createLife({ countryCode: 'US', gender: 'female' }, 77, 1_700_000_000_000);
  const husband = { ...makePerson(new Rng(5), { kind: 'spouse', gender: 'male', age: 41, countryCode: 'US', playerAge: 25 }), alive: false, deathAge: 41, deathCause: 'a heart attack' };
  const ex = { ...makePerson(new Rng(6), { kind: 'lover', gender: 'male', age: 50, countryCode: 'US', playerAge: 45 }), alive: false, deathAge: 50, deathCause: 'a stroke' };
  const g: GameState = {
    ...base,
    year: base.character.birthYear + 60,
    character: { ...base.character, age: 60, stats: { ...base.character.stats, looks: 100 } },
    people: { ...base.people, [husband.id]: husband, [ex.id]: ex },
  };
  const old = JSON.parse(JSON.stringify(g)) as Record<string, unknown>;
  for (const p of Object.values(old.people as Record<string, Record<string, unknown>>)) delete p.mourned;
  return old;
}

describe('saves from before the grief window', () => {
  it('load with long-dead partners counted as mourned, so no window opens on load', () => {
    const old = oldWidowSave();
    expect(old.schemaVersion).toBe(SCHEMA_VERSION);
    const loaded = migrateSave(old);
    expect(loaded).not.toBeNull();
    const partners = Object.values(loaded!.people).filter((p) => p.kind === 'spouse' || p.kind === 'lover');
    expect(partners).toHaveLength(2);
    for (const p of partners) expect(p.mourned).toBe(true);
    // Everyone else is untouched.
    for (const p of Object.values(loaded!.people)) if (p.kind !== 'spouse' && p.kind !== 'lover') expect(p).toEqual((old.people as Record<string, unknown>)[p.id]);
    // The next years: no grief flag, and she can meet someone new.
    let met = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const next = yearlyRelationships({ ...loaded!, character: { ...loaded!.character, age: 61 } }, new Rng(seed));
      expect(next.flags[GRIEF_FLAG]).toBeUndefined();
      expect(inGrief(next)).toBe(false);
      if (Object.values(next.people).some((p) => p.kind === 'lover' && p.alive)) met++;
    }
    expect(met).toBeGreaterThan(5);
  });

  it('rejects a mistyped mourned mark', () => {
    const old = oldWidowSave();
    const id = Object.keys(old.people as object)[0]!;
    const broken = JSON.parse(JSON.stringify(old));
    broken.people[id].mourned = 'yes';
    expect(migrateSave(broken)).toBeNull();
  });
});
