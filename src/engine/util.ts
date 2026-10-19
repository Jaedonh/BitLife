import type { GameState, LogEntry, LogKind, Stats } from './types';
import { getCountry } from '@/data/countries';

export const clamp = (v: number, min = 0, max = 100): number => Math.max(min, Math.min(max, v));

export const clampStat = (v: number): number => Math.round(clamp(v, 0, 100));

/** Peak fame this life (kept in flags so older saves need no migration). */
export function peakFame(s: GameState): number {
  const peak = s.flags.peakFame;
  return Math.max(s.character.fame, typeof peak === 'number' ? peak : 0);
}

/** Sets fame (clamped) and remembers the life's peak, which the Famous ribbon uses. */
export function withFame(s: GameState, fame: number): GameState {
  const next = clampStat(fame);
  const peak = Math.max(next, peakFame(s));
  return { ...s, character: { ...s.character, fame: next }, flags: { ...s.flags, peakFame: peak } };
}

/** The life's largest total debt (loans plus student debt), kept in flags so older saves need no migration. */
export function peakDebt(s: GameState): number {
  const peak = s.flags.peakDebt;
  return Math.max(s.finances.debt + s.education.studentDebt, typeof peak === 'number' ? peak : 0);
}

/** Remembers the current total debt if it is the life's largest yet (the Debt Free achievement reads it). */
export function notePeakDebt(s: GameState): GameState {
  const total = s.finances.debt + s.education.studentDebt;
  const peak = s.flags.peakDebt;
  return total > (typeof peak === 'number' ? peak : 0) ? { ...s, flags: { ...s.flags, peakDebt: total } } : s;
}

export function addStats(state: GameState, deltas: Partial<Stats>): GameState {
  const s = state.character.stats;
  const p = state.character.potential;
  const next: Stats = {
    happiness: clampStat(s.happiness + (deltas.happiness ?? 0)),
    health: clampStat(Math.min(s.health + (deltas.health ?? 0), Math.max(p.health, s.health))),
    smarts: clampStat(Math.min(s.smarts + (deltas.smarts ?? 0), Math.max(p.smarts, s.smarts))),
    looks: clampStat(Math.min(s.looks + (deltas.looks ?? 0), Math.max(p.looks, s.looks))),
  };
  return { ...state, character: { ...state.character, stats: next } };
}

/** Adds (or removes) cash. A shortfall never makes cash negative: it becomes debt. */
export function addMoney(state: GameState, amount: number): GameState {
  let cash = Math.round(state.finances.cash + amount);
  let debt = state.finances.debt;
  if (cash < 0) {
    debt += -cash;
    cash = 0;
  }
  return { ...state, finances: { ...state.finances, cash, debt } };
}

export function addKarma(state: GameState, delta: number): GameState {
  return { ...state, character: { ...state.character, karma: clampStat(state.character.karma + delta) } };
}

export function log(state: GameState, text: string, kind: LogKind = 'info'): GameState {
  const entry: LogEntry = { age: state.character.age, year: state.year, text, kind };
  return { ...state, log: [...state.log, entry] };
}

export function setResult(state: GameState, text: string, kind: LogKind = 'info', extra?: { statDeltas?: Partial<Stats>; moneyDelta?: number }): GameState {
  return { ...state, lastResult: { text, kind, ...extra } };
}

export function bump(state: GameState, counter: keyof GameState['counters'], by = 1): GameState {
  return { ...state, counters: { ...state.counters, [counter]: state.counters[counter] + by } };
}

export function countAction(state: GameState, key: string): GameState {
  return { ...state, actionsThisYear: { ...state.actionsThisYear, [key]: (state.actionsThisYear[key] ?? 0) + 1 } };
}

export function actionCount(state: GameState, key: string): number {
  return state.actionsThisYear[key] ?? 0;
}

export function setFlag(state: GameState, key: string, value: number | boolean | string): GameState {
  return { ...state, flags: { ...state.flags, [key]: value } };
}

export function incFlag(state: GameState, key: string, by = 1): GameState {
  const cur = state.flags[key];
  return setFlag(state, key, (typeof cur === 'number' ? cur : 0) + by);
}

export function netWorth(state: GameState): number {
  const assets = state.assets.reduce((sum, a) => sum + a.value - (a.mortgage?.remaining ?? 0), 0);
  const invest = state.finances.investments.reduce((sum, i) => sum + i.amount, 0);
  return Math.round(state.finances.cash + assets + invest - state.finances.debt - state.education.studentDebt);
}

/** "999", "12,450", "450K", "2.4M", "18M", "1.2B": an absolute amount, shortened once it gets long. */
function abbreviateAmount(abs: number): string {
  const units: [number, string][] = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M']];
  for (const [size, suffix] of units) {
    // 999,600 reads "1.0M", not "1000K".
    if (abs >= size * 0.9995) {
      const v = abs / size;
      return `${v >= 9.95 ? Math.round(v) : v.toFixed(1)}${suffix}`;
    }
  }
  if (abs >= 100_000) return `${Math.round(abs / 1000)}K`;
  return Math.round(abs).toLocaleString('en-US');
}

/**
 * Money for display, abbreviated ("₹2.4M"). Game amounts are USD-based units scaled by the
 * country's salary multiplier; the country's `fxRate` converts them to local currency here,
 * for display only. Never parse the result back into a number: keep the raw amount instead.
 */
export function formatMoney(amount: number, countryCode: string): string {
  const c = getCountry(countryCode);
  const local = amount * c.fxRate;
  const sign = Math.round(local) < 0 ? '-' : '';
  return `${sign}${c.currencySymbol}${abbreviateAmount(Math.abs(local))}`;
}

/** Money for display with full digits ("₹2,412,000"), converted to local currency like formatMoney. */
export function formatMoneyFull(amount: number, countryCode: string): string {
  const c = getCountry(countryCode);
  const local = Math.round(amount * c.fxRate);
  const sign = local < 0 ? '-' : '';
  return `${sign}${c.currencySymbol}${Math.abs(local).toLocaleString('en-US')}`;
}

export function fullName(p: { firstName: string; lastName: string }): string {
  return `${p.firstName} ${p.lastName}`;
}

// ---- Prose helpers: one place for articles, lists and phrasing the engine reuses. ----

/** Upper-cases the first letter. */
export function capitalize(text: string): string {
  return text ? text[0]!.toUpperCase() + text.slice(1) : text;
}

/** Letters whose spoken name starts with a vowel sound ("an EMT", "an HR assistant", but "a UX lead"). */
const VOWEL_SOUND_LETTERS = 'AEFHILMNORSX';

/** "a" or "an" for a noun phrase, by sound rather than spelling. */
export function article(phrase: string): 'a' | 'an' {
  const word = phrase.trim().split(/[\s-]/)[0] ?? '';
  if (!word) return 'a';
  if (word.length > 1 && word === word.toUpperCase() && /^[A-Z]+$/.test(word)) return VOWEL_SOUND_LETTERS.includes(word[0]!) ? 'an' : 'a';
  const w = word.toLowerCase();
  if (/^(hour|honest|honor|heir)/.test(w)) return 'an';
  if (/^(uni|use|usu|ute|uti|uro|one|once|eu|ewe)/.test(w)) return 'a';
  return /^[aeiou]/.test(w) ? 'an' : 'a';
}

/** "an engineer", "a nurse", "an EMT". */
export function withArticle(phrase: string): string {
  return `${article(phrase)} ${phrase}`;
}

/** A job title as it reads mid-sentence: lower case, but acronyms stay ("EMT", "HR assistant", "VP of sales"). */
export function lowerTitle(title: string): string {
  return title
    .split(' ')
    .map((w) => (w.length > 1 && w === w.toUpperCase() && /[A-Z]/.test(w) ? w : w.toLowerCase()))
    .join(' ');
}

/**
 * A job title with its article, mid-sentence: "a nurse", "an EMT". Offices held by one person read
 * without one ("mayor"), and proper nouns keep their capitals ("a member of Parliament").
 */
export function roleWithArticle(title: string): string {
  switch (title) {
    case 'Mayor': return 'mayor';
    case 'Member of Parliament': return 'a member of Parliament';
    case 'Supreme Court Justice': return 'a Supreme Court justice';
    case 'Hall of Famer': return 'a Hall of Famer';
    default: return withArticle(lowerTitle(title));
  }
}

/** "a", "a and b", "a, b, and c". */
export function joinList(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

/** Small counts spelled out ("two siblings"), larger ones as digits. */
export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

/** "1 year", "3 years". */
export function plural(n: number, singular: string, pluralForm = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

/** Ends a sentence without doubling a period that is already there ("at Crescent Ltd."). */
export function sentence(text: string): string {
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

/**
 * How a death reads in a sentence, from its cause: "died of cancer", "died in a car crash".
 * Causes written as a full verb phrase ("drowned in a rip current") are used as they are.
 */
export function deathPhrase(cause: string | undefined): string {
  const c = (cause ?? 'natural causes').trim();
  if (/^(died|drowned|was |passed away|perished|froze|fell|burned)\b/i.test(c)) return c;
  if (/^(a|an) (long|short|brief) illness\b/i.test(c)) return `died after ${c}`;
  if (/^(a|an|the) ([\w-]+ ){0,2}(accident|crash|fire|wildfire|flood|riot|storm|explosion|avalanche|earthquake|shipwreck|collision)\b/i.test(c)) return `died in ${c}`;
  return `died of ${c}`;
}

/** An employer as it reads in a list or header, without a leading "the". */
export function employerLabel(company: string): string {
  return company.replace(/^the /, '');
}

/** Money for prose and toasts, with the local currency symbol and full digits. */
export function money(state: GameState, amount: number): string {
  return formatMoneyFull(amount, state.character.countryCode);
}

export function pronouns(gender: 'male' | 'female') {
  return gender === 'male'
    ? { subject: 'he', object: 'him', possessive: 'his', Subject: 'He', title: 'Mr.' }
    : { subject: 'she', object: 'her', possessive: 'her', Subject: 'She', title: 'Ms.' };
}

export function zodiacFor(month: number, day: number): string {
  const z: [number, number, string][] = [
    [1, 20, 'Capricorn'], [2, 19, 'Aquarius'], [3, 20, 'Pisces'], [4, 20, 'Aries'], [5, 21, 'Taurus'], [6, 21, 'Gemini'],
    [7, 22, 'Cancer'], [8, 23, 'Leo'], [9, 23, 'Virgo'], [10, 23, 'Libra'], [11, 22, 'Scorpio'], [12, 22, 'Sagittarius'],
  ];
  for (const [m, d, sign] of z) if (month === m) return day < d ? sign : z[m % 12]![2];
  return 'Capricorn';
}

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function daysInMonth(month: number, year: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
