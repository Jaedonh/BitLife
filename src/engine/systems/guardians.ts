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

/**
 * Who looks after a minor, for journal lines: both parents ("My parents"), the one parent left ("Mom", "Dad"),
 * else a step- or foster parent by first name ("Hazel"), else "My family". `they` is the matching pronoun and
 * `plural` picks the verb ("were" or "was"). Use `caregiversInProse` mid-sentence.
 */
export function caregivers(state: GameState): { who: string; they: 'they' | 'she' | 'he'; plural: boolean } {
  const alive = Object.values(state.people).filter((p) => p.alive);
  const parents = alive.filter((p) => p.kind === 'mother' || p.kind === 'father');
  const steps = alive.filter((p) => p.kind === 'stepmother' || p.kind === 'stepfather');
  if (parents.length >= 2 || (!parents.length && steps.length >= 2)) return { who: 'My parents', they: 'they', plural: true };
  const one = parents[0] ?? steps[0];
  if (!one) return { who: 'My family', they: 'they', plural: false };
  const who = one.kind === 'mother' ? 'Mom' : one.kind === 'father' ? 'Dad' : one.firstName;
  return { who, they: one.gender === 'male' ? 'he' : 'she', plural: false };
}

/** `caregivers(state).who` for the middle of a sentence: "my parents", "Mom", "Hazel". */
export function caregiversInProse(state: GameState): string {
  return caregivers(state).who.replace(/^My /, 'my ');
}
