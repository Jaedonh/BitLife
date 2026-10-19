/**
 * Shared presentation helpers for the life screen: one icon and colour per journal
 * entry kind (used by the journal's year cards and the feedback toasts) and the
 * stat/money "pills" that report a change.
 */
import { getCountry } from '@/data/countries';
import { SCENARIO_BY_ID } from '@/data/scenarios';
import { countryInProse } from '@/engine/systems/scenarios';
import type { GameState, LogKind, StatId, Stats } from '@/engine/types';
import { formatMoney, formatMoneyFull } from '@/engine/util';
import { colors } from '@/theme';

export interface KindMeta {
  /** Emoji shown beside the entry; null draws a neutral dot (plain journal lines). */
  icon: string | null;
  /** Accent for borders and dots. */
  color: string;
  /** Spoken name of the kind, for screen readers. */
  label: string;
}

export const KIND_META: Record<LogKind, KindMeta> = {
  info: { icon: null, color: colors.textFaint, label: 'Note' },
  good: { icon: '✨', color: colors.success, label: 'Good news' },
  bad: { icon: '⚠️', color: colors.danger, label: 'Bad news' },
  event: { icon: '❗', color: colors.info, label: 'Choice' },
  milestone: { icon: '🎉', color: colors.accent, label: 'Milestone' },
  money: { icon: '💰', color: colors.money, label: 'Money' },
  death: { icon: '🕊️', color: colors.danger, label: 'Death' },
  year: { icon: '📅', color: colors.primary, label: 'Year' },
};

export const STAT_META: readonly { id: StatId; label: string; color: string }[] = [
  { id: 'happiness', label: 'Happiness', color: colors.happiness },
  { id: 'health', label: 'Health', color: colors.health },
  { id: 'smarts', label: 'Smarts', color: colors.smarts },
  { id: 'looks', label: 'Looks', color: colors.looks },
];

/** Signed number with a real minus sign: "+3", "−3". */
export function signed(n: number): string {
  return `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)}`;
}

export type PillTone = 'up' | 'down';

export interface Pill {
  key: string;
  /** Leading label, e.g. "Health". */
  label?: string;
  /** Dot colour before the label (the stat's own colour). */
  dot?: string;
  /** The change itself, e.g. "−3" or "+$1,200". */
  value: string;
  tone: PillTone;
  /** Full sentence for screen readers. */
  a11y: string;
}

/** One pill per stat that moved, in the header's order. */
export function statPills(deltas: Partial<Stats> | undefined): Pill[] {
  if (!deltas) return [];
  const out: Pill[] = [];
  for (const s of STAT_META) {
    const d = deltas[s.id];
    if (!d) continue;
    out.push({ key: s.id, label: s.label, dot: s.color, value: signed(d), tone: d > 0 ? 'up' : 'down', a11y: `${s.label} ${d > 0 ? 'up' : 'down'} ${Math.abs(d)}` });
  }
  return out;
}

/**
 * A signed amount in the life's local currency ("+£1,200", "−€680"). Compact for big sums. With the year, in the
 * currency of that year ("+1,800 lire" before the euro), as the journal shows it.
 */
export function moneyText(amount: number, countryCode: string, compact = false, year?: number): string {
  const body = compact ? formatMoney(Math.abs(amount), countryCode, year) : formatMoneyFull(Math.abs(amount), countryCode, year);
  return `${amount > 0 ? '+' : amount < 0 ? '−' : ''}${body}`;
}

export function moneyPill(key: string, amount: number, countryCode: string, opts: { label?: string; compact?: boolean; year?: number } = {}): Pill | null {
  if (!amount) return null;
  const value = moneyText(amount, countryCode, opts.compact, opts.year);
  return {
    key,
    label: opts.label,
    value,
    tone: amount > 0 ? 'up' : 'down',
    a11y: `${opts.label ?? 'Money'} ${amount > 0 ? 'up' : 'down'} ${formatMoneyFull(Math.abs(amount), countryCode, opts.year)}`,
  };
}

/** Screens about the life being played, where its cash means something. */
const LIFE_ROUTES = ['/occupation', '/assets', '/relationships', '/activities', '/person/'];

export function isLifeRoute(pathname: string | null | undefined): boolean {
  return !!pathname && LIFE_ROUTES.some((r) => (r.endsWith('/') ? pathname.startsWith(r) : pathname === r || pathname.startsWith(`${r}/`)));
}

/** Everything the player owes outside a mortgage: loans, fines, gambling debts and student loans. */
export function totalDebt(game: GameState): number {
  return Math.max(0, game.finances.debt) + Math.max(0, game.education.studentDebt);
}

/** Avatar for a character by life stage: baby 0-2, child 3-12, adult 13-59, older 60+. */
export function avatarFor(age: number, gender: 'male' | 'female'): string {
  const male = gender === 'male';
  if (age <= 2) return '👶';
  if (age <= 12) return male ? '👦' : '👧';
  if (age <= 59) return male ? '👨' : '👩';
  return male ? '👴' : '👵';
}

const ZODIAC_GLYPH: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
  Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

export function zodiacGlyph(sign: string): string {
  return ZODIAC_GLYPH[sign] ?? '✨';
}

/**
 * The starting scenario on the life profile ("🧸 Orphan"), with where an immigrant was born once the family has
 * moved ("✈️ Immigrant · born in the United States"). A Standard birth, an heir and an older save show nothing.
 */
export function scenarioChipText(game: GameState): string | null {
  const id = game.character.scenario;
  const def = id && id !== 'standard' ? SCENARIO_BY_ID[id] : undefined;
  if (!def) return null;
  const from = game.flags.immigrant;
  return `${def.emoji} ${def.name}${typeof from === 'string' ? ` · born in ${countryInProse(getCountry(from).name)}` : ''}`;
}
