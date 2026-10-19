import { ASSET_BY_ID, type AssetDef } from '@/data/assets';
import { scaleMoney } from '../events/text';
import type { Rng } from '../rng';
import type { Asset, GameState } from '../types';
import { addMoney, addStats, bump, clampStat, log, money, setResult, withArticle } from '../util';

export const MORTGAGE_YEARS = 25;
export const MORTGAGE_RATE = 0.06;
export const DOWN_PAYMENT = 0.2;

export function assetPrice(state: GameState, def: AssetDef): number {
  return scaleMoney(state, def.price);
}

export function yearlyMortgagePayment(principal: number): number {
  const r = MORTGAGE_RATE;
  const n = MORTGAGE_YEARS;
  return Math.round((principal * r) / (1 - Math.pow(1 + r, -n)));
}

export function canBuy(state: GameState, defId: string, financing: 'cash' | 'mortgage'): { ok: boolean; reason?: string; cost: number } {
  const def = ASSET_BY_ID[defId];
  if (!def) return { ok: false, reason: 'Unknown item', cost: 0 };
  const price = assetPrice(state, def);
  if (state.character.age < def.minAge) return { ok: false, reason: `Age ${def.minAge}+`, cost: price };
  if (state.crime.inPrison) return { ok: false, reason: state.crime.juvenile ? 'Not while in detention' : 'Not while in prison', cost: price };
  if (financing === 'mortgage') {
    if (!def.mortgageable) return { ok: false, reason: 'Cannot be mortgaged', cost: price };
    const down = Math.round(price * DOWN_PAYMENT);
    if (state.finances.cash < down) return { ok: false, reason: `Needs a ${Math.round(DOWN_PAYMENT * 100)}% down payment`, cost: down };
    const income = state.finances.lastYear.income || state.career.job?.salary || 0;
    if (yearlyMortgagePayment(price - down) > income * 0.45 + 1) return { ok: false, reason: 'Income too low for this mortgage', cost: down };
    return { ok: true, cost: down };
  }
  if (state.finances.cash < price) return { ok: false, reason: 'Not enough cash', cost: price };
  return { ok: true, cost: price };
}

export function buyAsset(state: GameState, rng: Rng, defId: string, financing: 'cash' | 'mortgage'): GameState {
  const check = canBuy(state, defId, financing);
  const def = ASSET_BY_ID[defId]!;
  if (!check.ok) return setResult(state, check.reason ?? 'Cannot buy', 'bad');
  const price = assetPrice(state, def);
  const asset: Asset = {
    id: rng.id('a_'),
    defId,
    kind: def.kind,
    name: def.name,
    value: price,
    purchasePrice: price,
    condition: def.kind === 'house' ? rng.int(70, 100) : 100,
    yearlyUpkeep: Math.round(price * def.upkeepRate),
    mortgage: financing === 'mortgage' ? { remaining: price - check.cost, yearlyPayment: yearlyMortgagePayment(price - check.cost), years: MORTGAGE_YEARS } : null,
    boughtAtAge: state.character.age,
    primary: def.kind === 'house' && !state.assets.some((a) => a.kind === 'house' && a.primary) ? true : undefined,
  };
  let s = addMoney(state, -check.cost);
  s = { ...s, assets: [...s.assets, asset] };
  s = addStats(s, { happiness: def.joy });
  if (def.kind === 'car') s = bump(s, 'carsOwned');
  if (def.kind === 'house') s = bump(s, 'housesOwned');
  const text = financing === 'mortgage' ? `I bought ${withArticle(def.name.toLowerCase())} with a mortgage.` : `I bought ${withArticle(def.name.toLowerCase())}.`;
  s = log(s, text, 'money');
  return setResult(s, text, 'good', { statDeltas: { happiness: def.joy }, moneyDelta: -check.cost });
}

export function sellAsset(state: GameState, assetId: string): GameState {
  const asset = state.assets.find((a) => a.id === assetId);
  if (!asset) return state;
  const proceeds = Math.round(asset.value * 0.95 - (asset.mortgage?.remaining ?? 0));
  let s = addMoney(state, proceeds);
  s = { ...s, assets: s.assets.filter((a) => a.id !== assetId) };
  if (asset.primary) {
    const nextHouse = s.assets.find((a) => a.kind === 'house');
    if (nextHouse) s = { ...s, assets: s.assets.map((a) => (a.id === nextHouse.id ? { ...a, primary: true, rentedOut: false } : a)) };
  }
  const text = proceeds >= 0 ? `I sold my ${asset.name.toLowerCase()} and cleared ${money(state, proceeds)}.` : `I sold my ${asset.name.toLowerCase()} at a loss of ${money(state, -proceeds)}.`;
  s = log(s, text, 'money');
  return setResult(s, text, proceeds >= 0 ? 'good' : 'bad', { moneyDelta: proceeds });
}

export function repairAsset(state: GameState, assetId: string): GameState {
  const asset = state.assets.find((a) => a.id === assetId);
  if (!asset) return state;
  const cost = Math.round(asset.purchasePrice * 0.1 * ((100 - asset.condition) / 100) + asset.purchasePrice * 0.01);
  if (state.finances.cash < cost) return setResult(state, 'Not enough cash for repairs.', 'bad');
  let s = addMoney(state, -cost);
  s = { ...s, assets: s.assets.map((a) => (a.id === assetId ? { ...a, condition: 100, value: Math.round(Math.max(a.value, a.purchasePrice * 0.6)) } : a)) };
  const text = `I had my ${asset.name.toLowerCase()} fully repaired.`;
  s = log(s, text, 'money');
  return setResult(s, text, 'good', { moneyDelta: -cost });
}

export function toggleRentOut(state: GameState, assetId: string): GameState {
  const asset = state.assets.find((a) => a.id === assetId);
  if (!asset || asset.kind !== 'house') return state;
  if (asset.primary && !asset.rentedOut) return setResult(state, "I live here. I'd need to buy another home first.", 'bad');
  const rentedOut = !asset.rentedOut;
  const s = { ...state, assets: state.assets.map((a) => (a.id === assetId ? { ...a, rentedOut } : a)) };
  return setResult(s, rentedOut ? 'Tenants moved in.' : 'The tenants moved out.', 'info');
}

/** Yearly value drift and wear. */
export function yearlyAssets(state: GameState, rng: Rng): GameState {
  const assets = state.assets.map((a) => {
    const def = ASSET_BY_ID[a.defId];
    const drift = (def?.valueDrift ?? 0) + rng.float(-0.03, 0.03);
    const condition = a.kind === 'car' ? clampStat(a.condition - rng.int(3, 8)) : a.kind === 'house' ? clampStat(a.condition - rng.int(1, 3)) : a.condition;
    const conditionFactor = a.kind === 'item' ? 1 : 0.6 + condition / 250;
    const value = Math.max(0, Math.round(a.value * (1 + drift) * (a.kind === 'house' ? 1 : conditionFactor)));
    const mortgage = a.mortgage ? { ...a.mortgage, remaining: Math.max(0, a.mortgage.remaining - (a.mortgage.yearlyPayment - a.mortgage.remaining * MORTGAGE_RATE)), years: a.mortgage.years - 1 } : null;
    return { ...a, value, condition, mortgage: mortgage && mortgage.remaining <= 0 ? null : mortgage };
  });
  return { ...state, assets };
}
