import { SCHEMA_VERSION, type GameState } from '@/engine/types';

/**
 * Upgrades a persisted GameState from an older schema. Returns null when the
 * save cannot be understood (the caller then discards it rather than crashing).
 */
export function migrateSave(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null;
  const save = raw as Partial<GameState> & { schemaVersion?: number };
  if (typeof save.schemaVersion !== 'number') return null;
  let s = save as GameState;
  // Future migrations go here, e.g. if (s.schemaVersion === 1) { ...; s = { ...s, schemaVersion: 2 } }
  if (s.schemaVersion !== SCHEMA_VERSION) return null;
  if (!s.character || !s.finances || !s.people || !Array.isArray(s.log)) return null;
  return s;
}
