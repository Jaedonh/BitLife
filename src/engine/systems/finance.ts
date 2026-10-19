import { ASSET_BY_ID } from '@/data/assets';
import { getCountry } from '@/data/countries';
import { movedBackHome, ownsHomeLivedIn } from '../events/conditions';
import { scaleMoney } from '../events/text';
import type { Rng } from '../rng';
import { payForMinor } from './guardians';
import type { Asset, Career, GameState, Investment, InvestmentKind } from '../types';
import { addMoney, addStats, inEra, joinList, log, lowerTitle, money, netWorth, notePeakDebt, numberWord, setResult } from '../util';

/** The investments, with the first year each can be bought (util.inEra): crypto from 2011. */
export const INVESTMENT_LABELS: Record<InvestmentKind, { name: string; description: string; prose: string; minYear?: number }> = {
  savings: { name: 'Savings account', description: 'Safe. ~2% a year.', prose: 'my savings account' },
  index: { name: 'Index fund', description: 'Steady growth with some bumps. ~7% a year on average.', prose: 'an index fund' },
  crypto: { name: 'Crypto', description: 'Wild swings. Could double, could halve.', prose: 'crypto', minYear: 2011 },
};

/** Where withdrawn money comes from: "my index fund". */
const WITHDRAW_FROM: Record<InvestmentKind, string> = { savings: 'my savings account', index: 'my index fund', crypto: 'my crypto' };

/** The order money is drawn from when cash runs short: the safest first. */
const DRAW_ORDER: readonly InvestmentKind[] = ['savings', 'index', 'crypto'];

/** The investments on offer this year, plus any already held (it can always be withdrawn). */
export function investmentKinds(state: GameState): InvestmentKind[] {
  return (Object.keys(INVESTMENT_LABELS) as InvestmentKind[]).filter((k) => inEra(state.year, INVESTMENT_LABELS[k]) || state.finances.investments.some((i) => i.kind === k));
}

/**
 * Takes up to `needed` out of the investments, safest first (DRAW_ORDER), keeping each one's cost basis in
 * proportion. Returns what was taken and from where.
 */
function drawFrom(investments: readonly Investment[], needed: number): { investments: Investment[]; taken: number; from: InvestmentKind[] } {
  let left = Math.max(0, Math.round(needed));
  const from: InvestmentKind[] = [];
  let out = [...investments];
  for (const kind of DRAW_ORDER) {
    const inv = out.find((i) => i.kind === kind);
    if (left <= 0 || !inv || inv.amount <= 0) continue;
    const take = Math.min(inv.amount, left);
    left -= take;
    from.push(kind);
    const rest = inv.amount - take;
    out = rest > 0 ? out.map((i) => (i.kind === kind ? { ...i, amount: rest, costBasis: Math.round(i.costBasis * (rest / inv.amount)) } : i)) : out.filter((i) => i.kind !== kind);
  }
  return { investments: out, taken: Math.round(needed) - left, from };
}

/** "my savings account and my index fund" */
function sourcesProse(from: readonly InvestmentKind[]): string {
  return joinList(from.map((k) => WITHDRAW_FROM[k]));
}

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

/**
 * Collections: heavy debt (over $60k, scaled) with no income at all. The stress costs happiness every
 * year it lasts, but the journal says so when it starts and then only every `DEBT_CALLS.every` years,
 * in rotating words, so a jobless stretch does not write the same sentence for decades.
 */
export const DEBT_CALLS = {
  every: 5,
  /** Number flags: the last age it held, the age of the last line, and how many stretches and reminders were written. */
  flags: { held: 'debtCallsHeld', line: 'debtCallsLine', stretches: 'debtCallsStretches', reminders: 'debtCallsReminders' },
  first: 'Debt collectors started calling. I have no income and the interest keeps piling up.',
  again: [
    'The debt collectors are calling again. No income, and the interest is piling up once more.',
    'Back in collections. With no income, the debt grows a little every month.',
    'The collection letters started again. I have no income to answer them with.',
  ],
  reminders: [
    'Still no income. My debt has grown so much that I stopped opening the letters.',
    'Another year of collection calls. I know the collectors by their first names now.',
    'I let the collectors go to voicemail now. The debt keeps growing without me.',
    'Years without an income. My debt has a life of its own now.',
  ],
} as const;

function debtCollectors(state: GameState): GameState {
  // Behind bars the journal is about prison (no calls reach a cell): the debt still weighs, and the
  // collectors are news again once I am out, because the stretch outside starts over.
  if (state.crime.inPrison) return addStats(state, { happiness: -4 });
  const age = state.character.age;
  const f = DEBT_CALLS.flags;
  const num = (key: string): number | null => (typeof state.flags[key] === 'number' ? (state.flags[key] as number) : null);
  const held = num(f.held);
  const lastLine = num(f.line);
  const stretches = num(f.stretches) ?? 0;
  const reminders = num(f.reminders) ?? 0;
  const flags: GameState['flags'] = { ...state.flags, [f.held]: age };
  let text: string | null = null;
  if (held !== age - 1) {
    // A new stretch (it did not hold last year) is news.
    text = lastLine === null ? DEBT_CALLS.first : DEBT_CALLS.again[Math.max(0, stretches - 1) % DEBT_CALLS.again.length]!;
    flags[f.stretches] = stretches + 1;
  } else if (lastLine === null || age - lastLine >= DEBT_CALLS.every) {
    // An ongoing one gets a reminder now and then, never the same words twice in a row.
    text = DEBT_CALLS.reminders[reminders % DEBT_CALLS.reminders.length]!;
    flags[f.reminders] = reminders + 1;
  }
  if (text) flags[f.line] = age;
  const s = addStats({ ...state, flags }, { happiness: -4 });
  return text ? log(s, text, 'bad') : s;
}

/** The whole yearly cash-flow pass. Runs after careers have updated salary. */
export function yearlyFinance(state: GameState, rng: Rng): GameState {
  // The debt carried into the year (event costs, new tuition) before any of it is repaid.
  let s = notePeakDebt(state);
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
    const ownsHome = ownsHomeLivedIn(s);
    // Under 24 on little income, or moved back in with a parent on a card (conditions.ts, movedBackHome).
    const livingWithParents = !ownsHome && (movedBackHome(s) || (c.age < 24 && gross < scaleMoney(s, 20_000) && Object.values(s.people).some((p) => (p.kind === 'mother' || p.kind === 'father') && p.alive)));
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
  let debtPayment = 0;
  if (s.finances.debt > 0 && adult) {
    const interest = Math.round(s.finances.debt * 0.15);
    const payment = Math.min(s.finances.debt + interest, Math.max(scaleMoney(s, 1_000), Math.round(s.finances.debt * 0.2)));
    debtPayment = payment;
    expenses += payment;
    s = { ...s, finances: { ...s.finances, debt: Math.max(0, s.finances.debt + interest - payment) } };
  }
  // The wealth effect only spends this year's spare income: savings stop growing, they never shrink or borrow for it.
  expenses = Math.round(expenses + Math.min(wealthSpend, Math.max(0, income - expenses)));

  let cash = s.finances.cash + income - expenses;
  let debt = s.finances.debt;
  let invested = investments;
  let unpaid = 0;
  if (cash < 0 && adult) {
    // Bills are paid out of savings before anything is borrowed: the savings account first, then the index fund, then crypto.
    const drawn = drawFrom(invested, -cash);
    invested = drawn.investments;
    cash += drawn.taken;
    // A stretch of living off investments is news when it starts, not every year it goes on; behind bars the
    // journal is about prison, and a stretch that goes on after release is news then. A few dollars short is not
    // news at all (DRAWDOWN_NEWS).
    if (drawn.taken >= scaleMoney(s, DRAWDOWN_NEWS) && !s.crime.inPrison) {
      // Mostly a debt repayment: "to keep up with my debt payments", not just "the bills".
      const what = debtPayment * 2 > drawn.taken ? 'keep up with my debt payments' : 'pay the bills';
      if (s.flags[DRAWDOWN_FLAG] !== c.age - 1) s = log(s, `Money was tight, so I cashed in ${money(s, drawn.taken)} from ${sourcesProse(drawn.from)} to ${what}.`, 'money');
      s = { ...s, flags: { ...s.flags, [DRAWDOWN_FLAG]: c.age } };
    }
  }
  if (cash < 0) {
    unpaid = -cash;
    debt += -cash;
    cash = 0;
  }
  s = {
    ...s,
    finances: {
      ...s.finances,
      cash: Math.round(cash),
      debt: Math.round(debt),
      investments: invested,
      lastYear: { income, salary, passive, expenses, taxes },
      incomeBoostYears: Math.max(0, s.finances.incomeBoostYears - 1),
    },
  };
  s = notePeakDebt(s);
  // Collectors call about heavy debt that went unpaid this year with no income at all (rent counts as income).
  if (adult && debt > scaleMoney(s, 60_000) && gross + passive === 0 && unpaid > 0) s = debtCollectors(s);
  if (adult && s.finances.debt > scaleMoney(s, BANKRUPTCY_DEBT)) s = settleDebts(s);
  const worth = netWorth(s);
  if (worth > s.counters.peakNetWorth) s = { ...s, counters: { ...s.counters, peakNetWorth: worth } };
  return s;
}

/** Number flag: the age of the last year investments paid the bills. */
const DRAWDOWN_FLAG = 'drawdownHeld';

/** A year's draw on investments under this (USD, country-scaled) is quietly taken: "I cashed in $53" is not news. */
export const DRAWDOWN_NEWS = 1_000;

/** Debt above this (USD, country-scaled) has to be settled: by selling what I own, or in bankruptcy. */
export const BANKRUPTCY_DEBT = 250_000;

/** What selling an asset clears after the mortgage (95% of its value, as sellAsset pays). */
function saleProceeds(a: Asset): number {
  return Math.round(a.value * 0.95 - (a.mortgage?.remaining ?? 0));
}

/** "speedboat" -> "speedboats", "luxury watch" -> "luxury watches", "farmhouse with land" -> "farmhouses with land". */
function pluralThing(name: string): string {
  const [head, ...rest] = name.split(' with ');
  const many = /(s|x|z|ch|sh)$/.test(head!) ? `${head}es` : `${head}s`;
  return [many, ...rest].join(' with ');
}

/** What was sold, as the journal says it: "my home", "my speedboat", "my two used bicycles", "my gaming PC". */
function soldProse(sold: readonly Asset[]): string {
  const counts = new Map<string, number>();
  for (const a of sold) {
    const name = a.primary ? 'home' : lowerTitle(a.name);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return joinList([...counts].map(([name, n]) => (n === 1 ? `my ${name}` : `my ${numberWord(n)} ${pluralThing(name)}`)));
}

/**
 * Debt over the bankruptcy line (BANKRUPTCY_DEBT). A player who owns enough to cover it sells or cashes in first:
 * cash, then investments (safest first) pay the debt down as far as they go, then things other than the home are
 * sold, as few as it takes to bring the debt back under the line (the smallest one that covers what is left, or
 * else the biggest, and again). The home is sold only when everything else together would not do (and then first,
 * so no bicycle is sold for nothing). Only a player whose everything cannot bring the debt under the line is
 * insolvent: bankruptcy clears the debt and takes everything but the home (GAME_DESIGN §9).
 */
function settleDebts(state: GameState): GameState {
  const line = scaleMoney(state, BANKRUPTCY_DEBT);
  const f = state.finances;
  const sellable = state.assets.filter((a) => saleProceeds(a) > 0);
  const worth = f.cash + f.investments.reduce((sum, i) => sum + i.amount, 0) + sellable.reduce((sum, a) => sum + saleProceeds(a), 0);
  if (f.debt - worth > line) return declareBankruptcy(state);
  let debt = f.debt;
  let cash = f.cash;
  const paidFromCash = Math.min(cash, debt);
  cash -= paidFromCash;
  debt -= paidFromCash;
  const drawn = drawFrom(f.investments, debt);
  debt -= drawn.taken;
  const actions: string[] = [];
  if (drawn.taken > 0) actions.push(`cashed in ${money(state, drawn.taken)} from ${sourcesProse(drawn.from)}`);
  const sold: Asset[] = [];
  const sell = (a: Asset) => {
    sold.push(a);
    const proceeds = saleProceeds(a);
    const paid = Math.min(debt, proceeds);
    debt -= paid;
    cash += proceeds - paid;
  };
  // The home goes only if everything else together will not do, and then first, so nothing else is sold for nothing.
  const others = sellable.filter((a) => !a.primary);
  const othersCover = others.reduce((sum, a) => sum + saleProceeds(a), 0) >= debt - line;
  if (!othersCover) for (const home of sellable.filter((a) => a.primary)) if (debt > line) sell(home);
  // Then as few other things as it takes: the smallest sale that covers what is left over the line, else the biggest.
  while (debt > line) {
    const left = others.filter((a) => !sold.includes(a));
    if (!left.length) break;
    const gap = debt - line;
    const covers = left.filter((a) => saleProceeds(a) >= gap).sort((a, b) => saleProceeds(a) - saleProceeds(b))[0];
    sell(covers ?? left.sort((a, b) => saleProceeds(b) - saleProceeds(a))[0]!);
  }
  if (sold.length) actions.push(`sold ${soldProse(sold)}`);
  const soldIds = new Set(sold.map((a) => a.id));
  let s: GameState = { ...state, assets: state.assets.filter((a) => !soldIds.has(a.id)), finances: { ...f, cash: Math.round(cash), debt: Math.round(debt), investments: drawn.investments } };
  // A home sold out from under me: another one I own becomes home, as when I sell it myself.
  if (sold.some((a) => a.primary)) {
    const next = s.assets.find((a) => a.kind === 'house');
    if (next) s = { ...s, assets: s.assets.map((a) => (a.id === next.id ? { ...a, primary: true, rentedOut: false } : a)) };
  }
  if (actions.length) s = log(s, `With my debts piling up, I ${joinList(actions)} to pay ${debt > 0 ? 'them down' : 'them off'}.`, 'bad');
  return s.finances.debt > line ? declareBankruptcy(s) : s;
}

/**
 * The bankruptcy lines: the first, the second ("again"), the third, and after that in turns. Number flag
 * `bankruptcies` counts them (an older save that went bankrupt counts as one).
 */
export const BANKRUPTCY_LINES = {
  first: 'I declared bankruptcy. The court took almost everything.',
  second: 'I declared bankruptcy again. Once more, the court took almost everything.',
  third: 'I went bankrupt a third time. The court clerk knew my name before I said it.',
  later: ['Bankruptcy number {n}. I could fill in the forms with my eyes closed.', 'I declared bankruptcy for the {nth} time. The judge barely looked up.'],
} as const;

const ORDINALS: Record<number, string> = { 4: 'fourth', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'eighth', 9: 'ninth', 10: 'tenth' };

/** The line for bankruptcy number `n`. */
export function bankruptcyLine(n: number): string {
  if (n <= 1) return BANKRUPTCY_LINES.first;
  if (n === 2) return BANKRUPTCY_LINES.second;
  if (n === 3) return BANKRUPTCY_LINES.third;
  return BANKRUPTCY_LINES.later[(n - 4) % BANKRUPTCY_LINES.later.length]!.replace('{nth}', ORDINALS[n] ?? `${n}th`).replace('{n}', numberWord(n));
}

/** Bankruptcy: everything but the home is lost (cash and investments included), and the debt is cleared. */
function declareBankruptcy(state: GameState): GameState {
  const before = typeof state.flags.bankruptcies === 'number' ? state.flags.bankruptcies : state.finances.bankrupt ? 1 : 0;
  const kept = state.assets.filter((a) => a.primary);
  let s: GameState = { ...state, assets: kept, flags: { ...state.flags, bankruptcies: before + 1 }, finances: { ...state.finances, cash: 0, debt: 0, investments: [], bankrupt: true } };
  s = log(s, bankruptcyLine(before + 1), 'bad');
  return addStats(s, { happiness: -15 });
}

/** Investment accounts open at this age. */
export const INVEST_MIN_AGE = 18;

export function invest(state: GameState, kind: InvestmentKind, amount: number): GameState {
  if (state.character.age < INVEST_MIN_AGE) return setResult(state, `I have to be ${INVEST_MIN_AGE} to open an investment account.`, 'bad');
  if (!inEra(state.year, INVESTMENT_LABELS[kind])) return setResult(state, `Nobody I know has heard of ${INVESTMENT_LABELS[kind].prose} yet.`, 'bad');
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
  let s = addMoney(notePeakDebt(state), -amount);
  s = { ...s, finances: { ...s.finances, debt: s.finances.debt - amount } };
  return setResult(s, `I paid off ${money(s, amount)} of debt.`, 'good', { moneyDelta: -amount });
}
