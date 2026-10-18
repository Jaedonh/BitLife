import type { GameState } from '../types';
import { addMoney } from '../util';

/**
 * A cost for a player under 18 (an event, a fine, upkeep): their living parents and step-parents pay it,
 * richest first, and whatever they cannot cover is waived, so a child never goes into debt.
 */
export function payForMinor(state: GameState, cost: number): GameState {
  const guardians = Object.values(state.people)
    .filter((p) => p.alive && (p.kind === 'mother' || p.kind === 'father' || p.kind === 'stepmother' || p.kind === 'stepfather') && p.money > 0)
    .sort((a, b) => b.money - a.money);
  let owed = cost;
  const people = { ...state.people };
  for (const g of guardians) {
    if (owed <= 0) break;
    const paid = Math.min(owed, g.money);
    people[g.id] = { ...g, money: g.money - paid };
    owed -= paid;
  }
  return { ...state, people };
}

/** What the player's living parents and step-parents could pay toward a minor's cost right now. */
export function guardianFunds(state: GameState): number {
  return Object.values(state.people)
    .filter((p) => p.alive && (p.kind === 'mother' || p.kind === 'father' || p.kind === 'stepmother' || p.kind === 'stepfather'))
    .reduce((sum, p) => sum + Math.max(0, p.money), 0);
}

/** Whether the player can pay `cost` for something they choose to do: a minor's parents chip in first. */
export function canPay(state: GameState, cost: number): boolean {
  return cost <= state.finances.cash + (state.character.age < 18 ? guardianFunds(state) : 0);
}

/**
 * The player pays for something they chose to do (an activity, a doctor visit). An adult pays it all; for a
 * minor the parents cover what they can and the child's own cash covers the rest. Check canPay first.
 */
export function spend(state: GameState, cost: number): GameState {
  if (cost <= 0) return state;
  if (state.character.age >= 18) return addMoney(state, -cost);
  const covered = Math.min(cost, guardianFunds(state));
  const s = payForMinor(state, covered);
  const rest = Math.min(cost - covered, s.finances.cash);
  return { ...s, finances: { ...s.finances, cash: s.finances.cash - rest } };
}
