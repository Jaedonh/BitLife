import { ASSET_BY_ID } from '@/data/assets';
import { getCountry } from '@/data/countries';
import { scaleMoney } from '../events/text';
import type { Rng } from '../rng';
import type { GameState, InvestmentKind } from '../types';
import { addMoney, addStats, log, netWorth, setResult } from '../util';

export const INVESTMENT_LABELS: Record<InvestmentKind, { name: string; description: string }> = {
  savings: { name: 'Savings account', description: 'Safe. ~2% a year.' },
  index: { name: 'Index fund', description: 'Steady growth with some bumps. ~7% a year on average.' },
  crypto: { name: 'Crypto', description: 'Wild swings. Could double, could halve.' },
};

function investmentReturn(kind: InvestmentKind, rng: Rng): number {
  if (kind === 'savings') return 0.02;
  if (kind === 'index') return rng.normal(0.07, 0.15, -0.45, 0.6);
  return rng.normal(0.12, 0.6, -0.8, 2.5);
}

/** The whole yearly cash-flow pass. Runs after careers have updated salary. */
export function yearlyFinance(state: GameState, rng: Rng): GameState {
  let s = state;
  const c = s.character;
  const country = getCountry(c.countryCode);
  const adult = c.age >= 18;

  // Income
  const job = s.career.job;
  let salary = job ? (s.crime.inPrison ? 0 : job.salary) : 0;
  if (s.career.retired) salary = Math.round((s.career.history[s.career.history.length - 1]?.salary ?? 0) * 0.35);
  if (s.finances.incomeBoostYears > 0 && job) salary *= 2;
  const hustleIncome = s.career.hustle?.lastIncome ?? 0;

  let passive = 0;
  const investments = s.finances.investments.map((inv) => {
    const r = investmentReturn(inv.kind, rng);
    const gain = Math.round(inv.amount * r);
    passive += gain;
    return { ...inv, amount: Math.max(0, inv.amount + gain) };
  });
  for (const a of s.assets) {
    if (a.kind === 'house' && a.rentedOut) {
      const def = ASSET_BY_ID[a.defId];
      passive += Math.round(a.value * (def?.rentYield ?? 0.04));
    }
  }
  const gross = salary + hustleIncome;
  const taxes = Math.round(gross * country.taxRate * Math.min(1, 0.6 + gross / 250_000));
  const income = gross - taxes + passive;

  // Expenses
  let expenses = 0;
  if (adult && !s.crime.inPrison) {
    const ownsHome = s.assets.some((a) => a.kind === 'house' && a.primary && !a.rentedOut);
    const livingWithParents = c.age < 24 && !ownsHome && gross < scaleMoney(s, 20_000) && Object.values(s.people).some((p) => (p.kind === 'mother' || p.kind === 'father') && p.alive);
    const base = ownsHome ? 7_000 : livingWithParents ? 2_500 : 9_000 + Math.min(12_000, gross * 0.08);
    expenses += scaleMoney(s, base) * (c.traits.includes('thrifty') ? 0.85 : 1);
    const kids = Object.values(s.people).filter((p) => p.kind === 'child' && p.alive && p.age < 18).length;
    expenses += kids * scaleMoney(s, 4_000);
  }
  for (const a of s.assets) {
    expenses += a.yearlyUpkeep;
    if (a.mortgage) expenses += a.mortgage.yearlyPayment;
  }
  if (s.education.studentDebt > 0 && !s.education.enrolled && adult) {
    const payment = Math.min(s.education.studentDebt, Math.max(scaleMoney(s, 2_000), Math.round(s.education.studentDebt * 0.1)));
    expenses += payment;
    s = { ...s, education: { ...s.education, studentDebt: s.education.studentDebt - payment } };
  }
  if (s.finances.debt > 0) {
    const interest = Math.round(s.finances.debt * 0.15);
    const payment = Math.min(s.finances.debt + interest, Math.max(scaleMoney(s, 1_000), Math.round(s.finances.debt * 0.2)));
    expenses += payment;
    s = { ...s, finances: { ...s.finances, debt: Math.max(0, s.finances.debt + interest - payment) } };
  }
  expenses = Math.round(expenses);

  let cash = s.finances.cash + income - expenses;
  let debt = s.finances.debt;
  if (cash < 0) {
    debt += -cash;
    cash = 0;
  }
  s = {
    ...s,
    finances: {
      ...s.finances,
      cash: Math.round(cash),
      debt: Math.round(debt),
      investments,
      lastYear: { income, salary, passive, expenses, taxes },
      incomeBoostYears: Math.max(0, s.finances.incomeBoostYears - 1),
    },
  };
  if (adult && debt > scaleMoney(s, 60_000) && gross === 0) {
    s = log(s, 'Debt collectors are calling. I have no income and the interest keeps piling up.', 'bad');
    s = addStats(s, { happiness: -4 });
  }
  if (adult && debt > scaleMoney(s, 250_000) && debt > netWorth(s) + scaleMoney(s, 250_000)) {
    // Bankruptcy: lose non-primary assets, clear debt.
    const kept = s.assets.filter((a) => a.primary);
    s = { ...s, assets: kept, finances: { ...s.finances, debt: 0, investments: [], bankrupt: true } };
    s = log(s, 'I declared bankruptcy. The court took almost everything.', 'bad');
    s = addStats(s, { happiness: -15 });
  }
  const worth = netWorth(s);
  if (worth > s.counters.peakNetWorth) s = { ...s, counters: { ...s.counters, peakNetWorth: worth } };
  return s;
}

export function invest(state: GameState, kind: InvestmentKind, amount: number): GameState {
  amount = Math.round(amount);
  if (amount <= 0 || state.finances.cash < amount) return setResult(state, 'Not enough cash.', 'bad');
  const existing = state.finances.investments.find((i) => i.kind === kind);
  const investments = existing
    ? state.finances.investments.map((i) => (i.kind === kind ? { ...i, amount: i.amount + amount, costBasis: i.costBasis + amount } : i))
    : [...state.finances.investments, { kind, amount, costBasis: amount }];
  let s = addMoney(state, -amount);
  s = { ...s, finances: { ...s.finances, investments } };
  const text = `I put ${amount.toLocaleString('en-US')} into ${INVESTMENT_LABELS[kind].name.toLowerCase()}.`;
  s = log(s, text, 'money');
  return setResult(s, text, 'info', { moneyDelta: -amount });
}

export function withdraw(state: GameState, kind: InvestmentKind, amount: number): GameState {
  const existing = state.finances.investments.find((i) => i.kind === kind);
  if (!existing) return state;
  amount = Math.min(existing.amount, Math.round(amount));
  if (amount <= 0) return state;
  const left = existing.amount - amount;
  const investments = left > 0
    ? state.finances.investments.map((i) => (i.kind === kind ? { ...i, amount: left, costBasis: Math.round(i.costBasis * (left / existing.amount)) } : i))
    : state.finances.investments.filter((i) => i.kind !== kind);
  let s = addMoney(state, amount);
  s = { ...s, finances: { ...s.finances, investments } };
  return setResult(s, `I withdrew ${amount.toLocaleString('en-US')}.`, 'info', { moneyDelta: amount });
}

export function payDebt(state: GameState, amount: number): GameState {
  amount = Math.min(state.finances.debt, Math.round(amount), state.finances.cash);
  if (amount <= 0) return state;
  let s = addMoney(state, -amount);
  s = { ...s, finances: { ...s.finances, debt: s.finances.debt - amount } };
  return setResult(s, `I paid off ${amount.toLocaleString('en-US')} of debt.`, 'good', { moneyDelta: -amount });
}
