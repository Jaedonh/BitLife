import { ASSET_BY_ID } from '@/data/assets';
import { getCountry } from '@/data/countries';
import { scaleMoney } from '../events/text';
import type { Rng } from '../rng';
import { payForMinor } from './guardians';
import type { Career, GameState, InvestmentKind } from '../types';
import { addMoney, addStats, log, money, netWorth, setResult } from '../util';

export const INVESTMENT_LABELS: Record<InvestmentKind, { name: string; description: string; prose: string }> = {
  savings: { name: 'Savings account', description: 'Safe. ~2% a year.', prose: 'my savings account' },
  index: { name: 'Index fund', description: 'Steady growth with some bumps. ~7% a year on average.', prose: 'an index fund' },
  crypto: { name: 'Crypto', description: 'Wild swings. Could double, could halve.', prose: 'crypto' },
};

/** Where withdrawn money comes from: "my index fund". */
const WITHDRAW_FROM: Record<InvestmentKind, string> = { savings: 'my savings account', index: 'my index fund', crypto: 'my crypto' };

/** 35% of the salary the character retired from (the best one, if they retired more than once). */
export function pensionSalary(career: Career): number {
  const retiredFrom = career.history.filter((h) => h.reason === 'retired');
  const base = retiredFrom.length ? Math.max(...retiredFrom.map((h) => h.salary)) : (career.history[career.history.length - 1]?.salary ?? 0);
  return Math.round(base * 0.35);
}

/**
 * Spending rules. Dollar amounts are USD at US prices and scale with the country's salary multiplier.
 * Tuned with scripts/balance-report.ts; documented in docs/GAME_DESIGN.md §9.
 */
export const SPENDING = {
  /** Lifestyle creep: this share of gross income above `lifestyleFloor` goes on extras, up to `lifestyleCap`. */
  lifestyleShare: 0.3,
  lifestyleFloor: 12_000,
  lifestyleCap: 50_000,
  /** Wealth effect: this share of savings above `comfortable` is spent each year on a richer life. */
  wealthShare: 0.1,
  comfortable: 250_000,
} as const;

/**
 * Frugality: how much of the usual lifestyle spending happens this year (0..1).
 * Nothing on extras while in debt; below a year of expenses in savings, extras shrink in proportion.
 */
export function lifestyleFactor(savings: number, debt: number, yearOfExpenses: number): number {
  if (debt > 0) return 0;
  if (yearOfExpenses <= 0) return 1;
  return Math.max(0, Math.min(1, savings / yearOfExpenses));
}

/** Wealth effect: yearly spending from savings (cash + investments − debt) above the comfortable threshold. */
export function wealthSpending(state: GameState, savings: number): number {
  return Math.max(0, savings - scaleMoney(state, SPENDING.comfortable)) * SPENDING.wealthShare;
}

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

  // Income: a job pays its own salary; a retiree without a job draws the pension.
  const job = s.career.job;
  let salary = job ? (s.crime.inPrison ? 0 : job.salary) : s.career.retired ? pensionSalary(s.career) : 0;
  if (s.finances.incomeBoostYears > 0 && job) salary *= 2;
  const hustleIncome = s.career.hustle?.lastIncome ?? 0;

  // Investment returns stay in the investment balance (unrealized until withdrawn);
  // only rent is paid out as passive cash income.
  let passive = 0;
  const investments = s.finances.investments.map((inv) => {
    const r = investmentReturn(inv.kind, rng);
    const gain = Math.round(inv.amount * r);
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
  let wealthSpend = 0;
  if (adult && !s.crime.inPrison) {
    const thrift = c.traits.includes('thrifty') ? 0.85 : 1;
    const ownsHome = s.assets.some((a) => a.kind === 'house' && a.primary && !a.rentedOut);
    const livingWithParents = c.age < 24 && !ownsHome && gross < scaleMoney(s, 20_000) && Object.values(s.people).some((p) => (p.kind === 'mother' || p.kind === 'father') && p.alive);
    const housing = scaleMoney(s, ownsHome ? 7_000 : livingWithParents ? 2_500 : 9_000);
    const kids = Object.values(s.people).filter((p) => p.kind === 'child' && p.alive && p.age < 18).length * scaleMoney(s, 4_000);
    // Lifestyle creep: spending rises with income above the basics, so a salary alone does not compound into a fortune.
    const fullLifestyle = Math.min(scaleMoney(s, SPENDING.lifestyleCap), Math.max(0, gross - scaleMoney(s, SPENDING.lifestyleFloor)) * SPENDING.lifestyleShare);
    // Frugality: a player in debt or without a year's cushion cuts back on extras first.
    const savings = s.finances.cash + s.finances.investments.reduce((sum, i) => sum + i.amount, 0) - s.finances.debt;
    const lifestyle = fullLifestyle * lifestyleFactor(savings, s.finances.debt, housing + kids + fullLifestyle);
    expenses += (housing + lifestyle) * thrift + kids;
    // Wealth effect: savings above a comfortable level fund a richer life, so wealth plateaus instead of piling up.
    wealthSpend = wealthSpending(s, savings) * thrift;
  }
  for (const a of s.assets) {
    // A minor's upkeep (a bike bought at 8) is covered by their parents, never a child's debt.
    if (!adult) s = payForMinor(s, a.yearlyUpkeep + (a.mortgage?.yearlyPayment ?? 0));
    else expenses += a.yearlyUpkeep + (a.mortgage?.yearlyPayment ?? 0);
  }
  if (s.education.studentDebt > 0 && !s.education.enrolled && adult) {
    const payment = Math.min(s.education.studentDebt, Math.max(scaleMoney(s, 2_000), Math.round(s.education.studentDebt * 0.1)));
    expenses += payment;
    s = { ...s, education: { ...s.education, studentDebt: s.education.studentDebt - payment } };
  }
  // Debt is charged interest and repaid only from 18: a minor's debt waits until they are an adult.
  if (s.finances.debt > 0 && adult) {
    const interest = Math.round(s.finances.debt * 0.15);
    const payment = Math.min(s.finances.debt + interest, Math.max(scaleMoney(s, 1_000), Math.round(s.finances.debt * 0.2)));
    expenses += payment;
    s = { ...s, finances: { ...s.finances, debt: Math.max(0, s.finances.debt + interest - payment) } };
  }
  // The wealth effect only spends this year's spare income: savings stop growing, they never shrink or borrow for it.
  expenses = Math.round(expenses + Math.min(wealthSpend, Math.max(0, income - expenses)));

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

/** Investment accounts open at this age. */
export const INVEST_MIN_AGE = 18;

export function invest(state: GameState, kind: InvestmentKind, amount: number): GameState {
  if (state.character.age < INVEST_MIN_AGE) return setResult(state, `I have to be ${INVEST_MIN_AGE} to open an investment account.`, 'bad');
  amount = Math.round(amount);
  if (amount <= 0 || state.finances.cash < amount) return setResult(state, 'Not enough cash.', 'bad');
  const existing = state.finances.investments.find((i) => i.kind === kind);
  const investments = existing
    ? state.finances.investments.map((i) => (i.kind === kind ? { ...i, amount: i.amount + amount, costBasis: i.costBasis + amount } : i))
    : [...state.finances.investments, { kind, amount, costBasis: amount }];
  let s = addMoney(state, -amount);
  s = { ...s, finances: { ...s.finances, investments } };
  const text = `I put ${money(state, amount)} into ${INVESTMENT_LABELS[kind].prose}.`;
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
  return setResult(s, `I withdrew ${money(s, amount)} from ${WITHDRAW_FROM[kind]}.`, 'info', { moneyDelta: amount });
}

export function payDebt(state: GameState, amount: number): GameState {
  if (state.finances.debt <= 0) return setResult(state, "I don't have any debt to pay.", 'info');
  if (state.finances.cash <= 0) return setResult(state, 'I have no cash to pay my debt with.', 'bad');
  amount = Math.min(state.finances.debt, Math.round(amount), state.finances.cash);
  if (amount <= 0) return setResult(state, 'I need to pay at least something.', 'bad');
  let s = addMoney(state, -amount);
  s = { ...s, finances: { ...s.finances, debt: s.finances.debt - amount } };
  return setResult(s, `I paid off ${money(s, amount)} of debt.`, 'good', { moneyDelta: -amount });
}
