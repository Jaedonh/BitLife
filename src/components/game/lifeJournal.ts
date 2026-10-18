/**
 * Pure helpers behind the journal's year cards: grouping the append-only life log
 * into one card per year of age, and the stat/net-worth change of each year.
 */
import type { LogEntry, StatId, Stats } from '@/engine/types';
import { STAT_IDS } from '@/engine/types';
import type { LedgerMark } from '@/store/lifeLedger';

export interface YearGroup {
  /** Stable across renders: the log only grows, so the index of a year's first line never changes. */
  key: string;
  age: number;
  /** Calendar year, when the log recorded one. */
  year: number | null;
  /** The year's lines in the order they happened (the "YYYY: Age N" header itself is not included). */
  entries: LogEntry[];
}

/**
 * One group per year of age. A 'year' header always opens a new group; lines without a
 * header (older saves) start one whenever the age changes.
 */
export function groupLogByYear(log: readonly LogEntry[]): YearGroup[] {
  const groups: YearGroup[] = [];
  let cur: YearGroup | null = null;
  for (let i = 0; i < log.length; i++) {
    const e = log[i]!;
    if (e.kind === 'year' || !cur || e.age !== cur.age) {
      cur = { key: `y${i}`, age: e.age, year: typeof e.year === 'number' ? e.year : null, entries: [] };
      groups.push(cur);
      if (e.kind === 'year') continue;
    }
    cur.entries.push(e);
  }
  return groups;
}

/** Newest year first, so the current year sits at scroll offset 0 and needs no scroll math. */
export function newestFirst(groups: readonly YearGroup[]): YearGroup[] {
  return groups.slice().reverse();
}

export interface YearChange {
  stats: Partial<Stats>;
  worth: number;
}

/**
 * What changed during the year the character was `age`: from the start of that year to the
 * start of the next one (or to `now` for the current year). Null when either end is unknown.
 */
export function yearChange(marks: Readonly<Record<number, LedgerMark>>, age: number, currentAge: number, now: LedgerMark): YearChange | null {
  const start = marks[age];
  const end = age === currentAge ? now : marks[age + 1];
  if (!start || !end) return null;
  const stats: Partial<Stats> = {};
  for (const k of STAT_IDS as readonly StatId[]) {
    const d = Math.round(end.stats[k] - start.stats[k]);
    if (d) stats[k] = d;
  }
  return { stats, worth: Math.round(end.worth - start.worth) };
}

/** Splits an event line ("The bank called. → Say nothing") into the story and the choice made. */
export function splitChoice(text: string): { story: string; choice: string | null } {
  const at = text.lastIndexOf(' → ');
  if (at <= 0) return { story: text, choice: null };
  return { story: text.slice(0, at), choice: text.slice(at + 3) };
}
