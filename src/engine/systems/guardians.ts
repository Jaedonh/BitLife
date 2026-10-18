import type { GameState } from '../types';

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
