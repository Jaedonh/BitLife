import { COUNTRIES, getCountry } from '@/data/countries';
import { FARM_TOWNS, isScenarioId } from '@/data/scenarios';
import type { Rng } from '../rng';
import type { GameState, NewLifeOptions, Person, ScenarioId } from '../types';
import { addStats, log } from '../util';

/**
 * Starting scenarios (GAME_DESIGN §4a). The family a scenario starts with is built in createLife
 * (systems/character.ts); this module holds the scenario's rules that play out later (the immigrant
 * family's move abroad, an orphan aging out of foster care) and the small helpers both share.
 */

/** Age range of the immigrant family's move abroad. */
export const MOVE_ABROAD_AGES = { min: 6, max: 14 } as const;

/** The scenario a new life starts in: an unknown id is Standard, and the old wealthy-family option is Wealthy. */
export function startingScenario(options: Pick<NewLifeOptions, 'scenario' | 'wealthyFamily'>): ScenarioId {
  const chosen = isScenarioId(options.scenario) ? options.scenario : 'standard';
  return chosen === 'standard' && options.wealthyFamily === true ? 'wealthy' : chosen;
}

/** Story flags a scenario sets at birth: `scenario:<id>` for every life, plus one per special start. */
export function scenarioFlags(scenario: ScenarioId): Record<string, boolean> {
  const flags: Record<string, boolean> = { [`scenario:${scenario}`]: true };
  if (scenario === 'orphan') flags.foster_care = true;
  if (scenario === 'prodigy') flags.prodigy = true;
  if (scenario === 'farm_kid') flags.farm = true;
  return flags;
}

/** A farm kid's hometown: one of the country's farm towns, or "a small town near <city>". */
export function farmTown(rng: Rng, countryCode: string, nearCity: string): string {
  const towns = FARM_TOWNS[countryCode];
  return towns?.length ? rng.pick(towns) : `a small town near ${nearCity}`;
}

/** Where an immigrant family moves: any other country, three times as likely to be one that pays better. */
export function pickDestination(rng: Rng, originCode: string): string {
  const origin = getCountry(originCode);
  const options = COUNTRIES.filter((c) => c.code !== origin.code);
  return rng.weighted(options, (c) => (c.salaryMultiplier > origin.salaryMultiplier ? 3 : 1)).code;
}

/** "Foster mother", "foster brother": how a foster relative is named, or null for anyone else. */
export function fosterRelation(p: Pick<Person, 'foster' | 'kind' | 'gender'>): string | null {
  if (!p.foster) return null;
  const male = p.gender === 'male';
  if (p.kind === 'stepmother' || p.kind === 'stepfather') return male ? 'foster father' : 'foster mother';
  if (p.kind === 'sibling') return male ? 'foster brother' : 'foster sister';
  return null;
}

/** "the United States" in running prose; other countries need no article. */
export function countryInProse(name: string): string {
  return /^United /.test(name) ? `the ${name}` : name;
}

const NEW_COUNTRY_LINES = [
  'At my new school, I was the new kid with the accent.',
  'Everything was new: the food, the weather, the words for things.',
  'I missed my old friends, but my new bedroom had a window that opened.',
  'I learned the bus routes before anyone else in my family did.',
] as const;

function hasGuardian(state: GameState): boolean {
  return Object.values(state.people).some((p) => p.alive && (p.kind === 'mother' || p.kind === 'father' || p.kind === 'stepmother' || p.kind === 'stepfather'));
}

/**
 * The immigrant family's move: country and city change, classmates stay behind, and the `immigrant` flag
 * records the country of birth. A child with no parent left, or one in detention, does not move.
 */
export function moveAbroad(state: GameState, rng: Rng, countryCode: string): GameState {
  const from = getCountry(state.character.countryCode);
  const to = getCountry(countryCode);
  if (from.code === to.code || state.crime.inPrison || !hasGuardian(state)) return state;
  const city = rng.pick(to.cities);
  const people = Object.fromEntries(Object.entries(state.people).filter(([, p]) => p.kind !== 'classmate'));
  let s: GameState = { ...state, people, character: { ...state.character, countryCode: to.code, city }, flags: { ...state.flags, immigrant: from.code } };
  s = log(s, `My family moved from ${countryInProse(from.name)} to ${countryInProse(to.name)}. We started over in ${city}.`, 'milestone');
  s = log(s, rng.pick(NEW_COUNTRY_LINES));
  return addStats(s, { happiness: -4 });
}

/** An orphan turns 18: the end of foster care, with or without the foster parent's help. */
function ageOutOfFosterCare(state: GameState): GameState {
  if (state.crime.inPrison) return state;
  const foster = Object.values(state.people).find((p) => p.foster && p.alive && (p.kind === 'stepmother' || p.kind === 'stepfather'));
  const text = foster && foster.relationship >= 50
    ? `I aged out of foster care. ${foster.firstName} helped me carry my boxes to my first place.`
    : 'I aged out of foster care with two bags and a bus pass.';
  return log(state, text, 'milestone');
}

/** A scenario's yearly rules, run right after the birthday milestone line (ageUp). Uses no randomness for most lives. */
export function yearlyScenario(state: GameState, rng: Rng): GameState {
  let s = state;
  const plan = s.character.moveAbroad;
  if (plan && s.character.age === plan.age && s.flags.immigrant === undefined) s = moveAbroad(s, rng, plan.countryCode);
  if (s.flags.foster_care === true && s.character.age === 18) s = ageOutOfFosterCare(s);
  return s;
}
