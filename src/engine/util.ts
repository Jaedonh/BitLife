import type { GameState, LogEntry, LogKind, Stats } from './types';
import { getCountry } from '@/data/countries';

export const clamp = (v: number, min = 0, max = 100): number => Math.max(min, Math.min(max, v));

export const clampStat = (v: number): number => Math.round(clamp(v, 0, 100));

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

export function formatMoney(amount: number, countryCode: string): string {
  const c = getCountry(countryCode);
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  let body: string;
  if (abs >= 1_000_000_000) body = `${(abs / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 0 : 1)}B`;
  else if (abs >= 1_000_000) body = `${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  else if (abs >= 100_000) body = `${Math.round(abs / 1000)}K`;
  else body = Math.round(abs).toLocaleString('en-US');
  return `${sign}${c.currencySymbol}${body}`;
}

export function formatMoneyFull(amount: number, countryCode: string): string {
  const c = getCountry(countryCode);
  const sign = amount < 0 ? '-' : '';
  return `${sign}${c.currencySymbol}${Math.round(Math.abs(amount)).toLocaleString('en-US')}`;
}

export function fullName(p: { firstName: string; lastName: string }): string {
  return `${p.firstName} ${p.lastName}`;
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
