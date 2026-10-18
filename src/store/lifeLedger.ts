/**
 * Year ledger for the journal's year cards: a snapshot of the character's stats and net
 * worth at every year boundary of the current life, so each card can show what that year
 * changed. The engine keeps no stat history, so this store records it by watching the game
 * store, and keeps it under its own storage key (one small write per age-up).
 */
import { create } from 'zustand';

import type { GameState, Stats } from '@/engine/types';
import { STAT_IDS } from '@/engine/types';
import { netWorth } from '@/engine/util';
import { readJson, remove, writeJson } from '@/services/storage';
import { useGameStore } from './gameStore';

export const LEDGER_STORAGE_KEY = 'lifeloop.ledger.v1';

/** Snapshot of a life at a year boundary. */
export interface LedgerMark {
  stats: Stats;
  worth: number;
}

export interface LedgerData {
  lifeId: string | null;
  /** Age -> snapshot taken when that year began (the end of the year before). */
  marks: Record<number, LedgerMark>;
}

export function markOf(g: GameState): LedgerMark {
  return { stats: { ...g.character.stats }, worth: netWorth(g) };
}

/**
 * Pure: the ledger after the game moved from `prev` to `next`. Returns the same object when
 * nothing needs recording, which is almost every change (actions, toasts, events).
 */
export function advanceLedger(ledger: LedgerData, prev: GameState | null, next: GameState | null): LedgerData {
  if (!next) return ledger.lifeId === null && !Object.keys(ledger.marks).length ? ledger : { lifeId: null, marks: {} };
  const id = next.character.id;
  const age = next.character.age;
  let out = ledger.lifeId === id ? ledger : { lifeId: id, marks: {} };
  if (prev && prev.character.id === id && age > prev.character.age && !out.marks[age]) {
    // Year boundary: the moment before Age+ is where the new year starts.
    out = { ...out, marks: { ...out.marks, [age]: markOf(prev) } };
  }
  if (!out.marks[age]) out = { ...out, marks: { ...out.marks, [age]: markOf(next) } };
  return out;
}

function isMark(v: unknown): v is LedgerMark {
  if (typeof v !== 'object' || v === null) return false;
  const m = v as { stats?: Record<string, unknown>; worth?: unknown };
  return typeof m.worth === 'number' && Number.isFinite(m.worth) && typeof m.stats === 'object' && m.stats !== null && STAT_IDS.every((k) => typeof m.stats![k] === 'number');
}

function parseLedger(raw: unknown): LedgerData | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as { lifeId?: unknown; marks?: unknown };
  if (typeof r.lifeId !== 'string' || typeof r.marks !== 'object' || r.marks === null) return null;
  const marks: Record<number, LedgerMark> = {};
  for (const [k, v] of Object.entries(r.marks as Record<string, unknown>)) {
    const age = Number(k);
    if (Number.isInteger(age) && age >= 0 && isMark(v)) marks[age] = v;
  }
  return { lifeId: r.lifeId, marks };
}

export const useLifeLedger = create<LedgerData & { hydrated: boolean }>(() => ({ lifeId: null, marks: {}, hydrated: false }));

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function save(data: LedgerData) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (data.lifeId) void writeJson(LEDGER_STORAGE_KEY, { lifeId: data.lifeId, marks: data.marks });
    else void remove(LEDGER_STORAGE_KEY);
  }, 300);
}

function apply(next: LedgerData) {
  const cur = useLifeLedger.getState();
  if (next.lifeId === cur.lifeId && next.marks === cur.marks) return;
  useLifeLedger.setState({ lifeId: next.lifeId, marks: next.marks });
  if (cur.hydrated) save(next);
}

/** Starts recording year boundaries. Call once, before the game store hydrates. */
export function attachLifeLedger(): () => void {
  return useGameStore.subscribe((s, prev) => {
    if (s.game === prev.game) return;
    apply(advanceLedger(useLifeLedger.getState(), prev.game, s.game));
  });
}

/** Loads the saved ledger. Call after the game store has hydrated. */
export async function hydrateLifeLedger(): Promise<void> {
  const stored = parseLedger(await readJson<unknown>(LEDGER_STORAGE_KEY));
  const cur = useLifeLedger.getState();
  const game = useGameStore.getState().game;
  let base: LedgerData;
  if (stored && (!cur.lifeId || cur.lifeId === stored.lifeId)) {
    // Saved boundaries win over the mid-year snapshot taken when the save loaded.
    base = { lifeId: stored.lifeId, marks: { ...cur.marks, ...stored.marks } };
  } else {
    base = { lifeId: cur.lifeId, marks: cur.marks };
  }
  const next = game ? advanceLedger(base, null, game) : base;
  useLifeLedger.setState({ lifeId: next.lifeId, marks: next.marks, hydrated: true });
  if (game) save(next);
}
