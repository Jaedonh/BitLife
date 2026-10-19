/**
 * Pure model of the global feedback toasts: turning a game result into a toast and
 * the queue rules (one at a time, a short backlog, a new year makes older results moot).
 */
import { achievementDescription, type AchievementDef } from '@/data/achievements';
import type { GameState, LastResult, LogKind } from '@/engine/types';
import { formatMoneyFull } from '@/engine/util';
import { moneyPill, statPills, type Pill } from './lifeFormat';

export interface ToastItem {
  id: number;
  kind: LogKind;
  /** Year recaps: "Age 12 · 2011". */
  title?: string;
  text: string;
  pills: Pill[];
  /** Identical results in a row collapse into one toast with a counter. */
  count: number;
  /** How long it stays on screen while nothing else is waiting (ms). */
  duration: number;
  /** Replaces the kind's icon (achievements show a trophy). */
  icon?: string;
  /** Not about one moment of one life (an achievement): a new year or a new life does not drop it. */
  sticky?: boolean;
}

export interface ToastQueue {
  current: ToastItem | null;
  pending: ToastItem[];
}

export const EMPTY_QUEUE: ToastQueue = { current: null, pending: [] };

/** Results waiting behind the visible one; older ones are dropped first. */
export const MAX_PENDING = 3;
/** With others waiting, a toast still stays this long so it can be read. */
export const MIN_VISIBLE_MS = 1500;

const YEAR_TEXT = /^(\d+) · Age (\d+)(?: · ([\s\S]+))?$/;

export function toastDuration(text: string, title = '', pills = 0): number {
  return Math.min(5000, Math.max(2400, 1500 + (text.length + title.length) * 32 + pills * 250));
}

/**
 * The toast for a new game result. `prev` is the game just before the result appeared, used to
 * say when money was taken on credit. Returns null for a year recap with nothing to report.
 */
export function toastFromResult(result: LastResult, game: GameState, prev: GameState | null, id: number): ToastItem | null {
  const cc = game.character.countryCode;
  const pills: Pill[] = statPills(result.statDeltas);
  const money = moneyPill('money', result.moneyDelta ?? 0, cc, { label: result.kind === 'year' ? 'Cash' : undefined, year: game.year });
  if (money) pills.push(money);
  let title: string | undefined;
  let text = result.text;
  if (result.kind === 'year') {
    const m = YEAR_TEXT.exec(result.text);
    if (m) {
      title = `Age ${m[2]} · ${m[1]}`;
      text = m[3] ?? '';
    }
    if (!text && !pills.length) return null;
  } else if (prev && prev.character.id === game.character.id) {
    const borrowed = game.finances.debt - prev.finances.debt;
    if (borrowed > 0) pills.push({ key: 'credit', label: 'On credit', value: formatMoneyFull(borrowed, cc, game.year), tone: 'down', a11y: `${formatMoneyFull(borrowed, cc, game.year)} added to debt` });
  }
  return { id, kind: result.kind, title, text, pills, count: 1, duration: toastDuration(text, title, pills.length) };
}

/** The toast for a batch of achievements unlocked by the same moment. */
export function toastFromAchievements(defs: readonly AchievementDef[], id: number, countryCode?: string | null): ToastItem | null {
  if (!defs.length) return null;
  const one = defs.length === 1 ? defs[0] : undefined;
  const title = one ? 'Achievement unlocked' : `${defs.length} achievements unlocked`;
  // An amount of money reads in the currency of the life that earned it.
  const text = one ? `${one.emoji} ${one.name}: ${achievementDescription(one, countryCode)}` : defs.map((d) => `${d.emoji} ${d.name}`).join(' · ');
  return { id, kind: 'milestone', title, text, pills: [], count: 1, duration: toastDuration(text, title), icon: '🏆', sticky: true };
}

/** A new life (or the end of one) drops what was waiting, except toasts that outlive a life. */
export function resetQueue(q: ToastQueue): ToastQueue {
  const keep = [q.current, ...q.pending].filter((t): t is ToastItem => !!t && !!t.sticky);
  if (keep.length === (q.current ? 1 : 0) + q.pending.length) return q;
  return { current: keep[0] ?? null, pending: keep.slice(1) };
}

function samePills(a: Pill[], b: Pill[]): boolean {
  return a.length === b.length && a.every((p, i) => p.key === b[i]!.key && p.value === b[i]!.value);
}

export function enqueueToast(q: ToastQueue, item: ToastItem): ToastQueue {
  // A new year makes anything still waiting from the last one stale. Achievements go before the recap and are
  // never pushed aside by one, so tapping Age+ fast cannot starve them.
  if (item.kind === 'year') {
    const achievements = [q.current, ...q.pending].filter((t): t is ToastItem => !!t && !!t.sticky);
    const [first, ...rest] = achievements;
    return first ? { current: first, pending: trimPending([...rest, item]) } : { current: item, pending: [] };
  }
  const last = q.pending[q.pending.length - 1] ?? q.current;
  if (last && last.kind === item.kind && last.text === item.text && last.title === item.title && samePills(last.pills, item.pills)) {
    const bumped = { ...last, count: last.count + 1 };
    return last === q.current ? { current: bumped, pending: q.pending } : { current: q.current, pending: [...q.pending.slice(0, -1), bumped] };
  }
  if (!q.current) return { current: item, pending: [] };
  return { current: q.current, pending: trimPending([...q.pending, item]) };
}

/** Drops the oldest waiting results past the backlog limit, ordinary ones before achievements. */
function trimPending(pending: ToastItem[]): ToastItem[] {
  const out = [...pending];
  while (out.length > MAX_PENDING) {
    const i = out.findIndex((t) => !t.sticky);
    out.splice(i < 0 ? 0 : i, 1);
  }
  return out;
}

export function nextToast(q: ToastQueue): ToastQueue {
  const [head, ...rest] = q.pending;
  return { current: head ?? null, pending: rest };
}
