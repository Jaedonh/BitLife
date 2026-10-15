import { ageUp } from './ageUp';
import { applyAction } from './actions';
import { EVENT_REGISTRY } from './events/registry';
import { resolveChoice } from './events/select';
import { Rng } from './rng';
import { createLife } from './systems/character';
import type { GameState, PlayerAction } from './types';

export type Policy = (state: GameState, rng: Rng) => PlayerAction[];

/** Does nothing but age up and pick the first choice. */
export const passivePolicy: Policy = () => [];

/** A sensible player: studies, works, keeps healthy, dates. */
export const balancedPolicy: Policy = (s, rng) => {
  const actions: PlayerAction[] = [];
  const age = s.character.age;
  if (s.education.enrolled && rng.chance(0.6)) actions.push({ type: 'study' });
  if (age >= 18 && !s.education.enrolled && !s.career.job && s.education.degrees.includes('high_school') && !s.education.degrees.some((d) => d.startsWith('bachelor')) && !s.education.droppedOut && rng.chance(0.5)) {
    const majors = ['business', 'computer_science', 'nursing', 'education', 'psychology'];
    actions.push({ type: 'enroll', major: rng.pick(majors) });
  }
  if (age >= 16 && !s.career.job && !s.education.enrolled && s.career.listings.length) {
    const eligible = s.career.listings.filter((l) => !l.partTime || age < 25);
    if (eligible.length) actions.push({ type: 'applyJob', listingId: rng.pick(eligible).id });
  }
  if (s.career.job && rng.chance(0.5)) actions.push({ type: 'workHarder' });
  if (s.character.stats.health < 60 && age >= 12) actions.push({ type: 'activity', id: 'gym' });
  if (s.character.stats.happiness < 50 && age >= 10) actions.push({ type: 'activity', id: 'meditate' });
  if (s.health.illnesses.length && s.finances.cash > 2000) actions.push({ type: 'activity', id: 'doctor' });
  const people = Object.values(s.people).filter((p) => p.alive);
  if (people.length && rng.chance(0.7)) actions.push({ type: 'interact', personId: rng.pick(people).id, interaction: 'spendTime' });
  const lover = people.find((p) => p.kind === 'lover');
  if (lover && age >= 22 && (lover.love ?? 0) > 60 && rng.chance(0.4)) actions.push({ type: 'interact', personId: lover.id, interaction: 'propose' });
  const spouse = people.find((p) => p.kind === 'spouse');
  if (spouse && age >= 24 && age <= 40 && rng.chance(0.4)) actions.push({ type: 'interact', personId: spouse.id, interaction: 'haveChild' });
  if (age >= 60 && s.career.job && rng.chance(0.3)) actions.push({ type: 'retire' });
  return actions;
};

/** A reckless player: crime, parties, no school. */
export const recklessPolicy: Policy = (s, rng) => {
  const actions: PlayerAction[] = [];
  const age = s.character.age;
  if (s.education.enrolled && rng.chance(0.3)) actions.push({ type: 'skipClass' });
  if (age >= 13 && rng.chance(0.5)) actions.push({ type: 'crime', id: rng.pick(['shoplift', 'pickpocket', 'burglary', 'car_theft']) });
  if (age >= 16 && rng.chance(0.6)) actions.push({ type: 'activity', id: 'party' });
  if (age >= 18 && rng.chance(0.3)) actions.push({ type: 'activity', id: 'lottery' });
  if (age >= 16 && !s.career.job && s.career.listings.length && rng.chance(0.3)) actions.push({ type: 'applyJob', listingId: rng.pick(s.career.listings).id });
  return actions;
};

export interface LifeSummary {
  seed: number;
  ageAtDeath: number;
  cause: string;
  ribbonId: string;
  netWorth: number;
  eventsFaced: number;
  years: number;
  maxLogPerYear: number;
  emptyYears: number;
  jobsHeld: number;
  children: number;
  marriages: number;
  arrests: number;
  peakSmarts: number;
}

/** Plays a whole life with a policy. Throws if an invariant breaks. */
export function simulateLife(seed: number, policy: Policy, maxYears = 130): { state: GameState; summary: LifeSummary } {
  let s = createLife({}, seed);
  const rng = new Rng(seed ^ 0xabcdef);
  let years = 0;
  let maxLogPerYear = 0;
  let emptyYears = 0;
  let peakSmarts = s.character.stats.smarts;
  while (s.alive && years < maxYears) {
    const before = s.log.length;
    s = ageUp(s);
    years++;
    let guard = 0;
    while (s.pendingEvent && guard++ < 20) {
      const choice = rng.pick(s.pendingEvent.choices);
      s = resolveChoice(s, choice.id, EVENT_REGISTRY);
    }
    if (s.pendingEvent) throw new Error(`event loop did not terminate at age ${s.character.age}`);
    if (!s.alive) break;
    for (const a of policy(s, rng)) s = applyAction(s, a);
    checkInvariants(s);
    const added = s.log.length - before;
    maxLogPerYear = Math.max(maxLogPerYear, added);
    if (added <= 1) emptyYears++;
    peakSmarts = Math.max(peakSmarts, s.character.stats.smarts);
  }
  if (s.alive) throw new Error(`life did not end within ${maxYears} years (seed ${seed})`);
  return {
    state: s,
    summary: {
      seed,
      ageAtDeath: s.character.age,
      cause: s.death?.cause ?? '',
      ribbonId: s.death?.ribbonId ?? '',
      netWorth: s.death?.netWorth ?? 0,
      eventsFaced: s.counters.eventsFaced,
      years,
      maxLogPerYear,
      emptyYears,
      jobsHeld: s.counters.jobsHeld,
      children: s.counters.children,
      marriages: s.counters.marriages,
      arrests: s.counters.arrests,
      peakSmarts,
    },
  };
}

export function checkInvariants(s: GameState): void {
  const st = s.character.stats;
  for (const [k, v] of Object.entries(st)) {
    if (!(v >= 0 && v <= 100 && Number.isInteger(v))) throw new Error(`stat ${k}=${v} out of range at age ${s.character.age}`);
  }
  if (!Number.isFinite(s.finances.cash) || !Number.isFinite(s.finances.debt)) throw new Error('non-finite money');
  if (s.finances.cash < 0) throw new Error(`negative cash ${s.finances.cash} at age ${s.character.age}`);
  if (s.finances.debt < 0) throw new Error('negative debt');
  for (const p of Object.values(s.people)) {
    if (!(p.relationship >= 0 && p.relationship <= 100)) throw new Error(`relationship out of range for ${p.id}`);
    if (p.love !== undefined && !(p.love >= 0 && p.love <= 100)) throw new Error('love out of range');
  }
  if (s.character.energy < 0 || s.character.energy > s.character.energyMax) throw new Error('energy out of range');
  if (s.year !== s.character.birthYear + s.character.age) throw new Error('year drift');
  for (let i = 1; i < s.log.length; i++) if (s.log[i]!.age < s.log[i - 1]!.age) throw new Error('log not monotonic');
}
