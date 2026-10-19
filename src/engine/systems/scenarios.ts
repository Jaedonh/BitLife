import { COUNTRIES, getCountry } from '@/data/countries';
import { FARM_TOWNS, isScenarioId } from '@/data/scenarios';
import type { Rng } from '../rng';
import { FAR_AWAY_KINDS } from '../events/schema';
import { personRef } from '../events/text';
import type { GameState, NewLifeOptions, Person, ScenarioId } from '../types';
import { addStats, capitalize, fullName, joinList, log } from '../util';

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

/**
 * "Foster mother", "foster brother", "aunt": how someone who is not a step-parent or sibling by marriage is named
 * (a foster relative, or an aunt or uncle who took the player in), or null for anyone else. Labels on the people
 * screens, the obituary and the journal all use it.
 */
export function fosterRelation(p: Pick<Person, 'foster' | 'kind' | 'gender'> & Partial<Pick<Person, 'relative'>>): string | null {
  const male = p.gender === 'male';
  const guardian = p.kind === 'stepmother' || p.kind === 'stepfather';
  if (p.relative && guardian) return male ? 'uncle' : 'aunt';
  if (!p.foster) return null;
  if (guardian) return male ? 'foster father' : 'foster mother';
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

/** A parent or step-parent at home to carry out the family's move (an aunt or uncle who took the child in does not). */
function hasGuardian(state: GameState): boolean {
  return Object.values(state.people).some((p) => p.alive && !p.relative && (p.kind === 'mother' || p.kind === 'father' || p.kind === 'stepmother' || p.kind === 'stepfather'));
}

/** Who stays in the old country when the family moves: friends, rivals and grandparents (classmates leave the life). */
const STAY_BEHIND = FAR_AWAY_KINDS;
/**
 * Friends who keep in touch from the old country: the best friend first, then the closest. The others stay behind
 * and leave the life like classmates, so old friends do not fill the places new ones in the new country would take
 * (systems/relationships.ts makes new friends only while there are fewer than four).
 */
export const FRIENDS_KEPT_ABROAD = 2;

const isFriend = (p: Person) => p.kind === 'friend' || p.kind === 'bestFriend';

/** The living friends who keep in touch after a move, closest first (a best friend before any other). */
function friendsKept(state: GameState): Set<string> {
  const friends = Object.values(state.people)
    .filter((p) => p.alive && isFriend(p))
    .sort((a, b) => Number(b.kind === 'bestFriend') - Number(a.kind === 'bestFriend') || b.relationship - a.relationship || a.id.localeCompare(b.id));
  return new Set(friends.slice(0, FRIENDS_KEPT_ABROAD).map((p) => p.id));
}

/**
 * The goodbye at the move: the grandparents staying behind (by name for one or two), then the closest friend
 * (by full name when a grandparent in the line shares the first name). Null when nobody is left behind.
 */
function goodbyeLine(rng: Rng, behind: readonly Person[]): string | null {
  const grands = behind.filter((p) => p.kind === 'grandparent');
  const who = grands.length > 2 ? 'my grandparents' : joinList(grands.map((p) => personRef(p)));
  const friend = [...behind.filter((p) => p.kind === 'bestFriend'), ...behind.filter((p) => p.kind === 'friend').sort((a, b) => b.relationship - a.relationship)][0];
  const shared = !!friend && grands.length <= 2 && grands.some((g) => g.firstName === friend.firstName);
  const friendRef = friend && `${friend.kind === 'bestFriend' ? 'my best friend' : 'my friend'} ${shared ? fullName(friend) : friend.firstName}`;
  if (grands.length && friendRef) {
    return rng.pick([
      `I hugged ${who} goodbye. ${capitalize(friendRef)} made me promise to write.`,
      `${capitalize(who)} came to see us off. ${capitalize(friendRef)} gave me a drawing to keep.`,
    ]);
  }
  if (grands.length) return rng.pick([`I hugged ${who} goodbye before we left. We promised to call every week.`, `${capitalize(who)} came to see us off and waved until the car turned the corner.`]);
  if (friendRef) return rng.pick([`I said goodbye to ${friendRef} the day before we left. We promised to write.`, `${capitalize(friendRef)} gave me a drawing to keep and made me promise to write.`]);
  return null;
}

/**
 * The immigrant family's move: country and city change, classmates and all but the two closest friends stay
 * behind and leave the life, those two friends, rivals and grandparents stay behind as people who live far away
 * (`farAway`: only long-distance cards bind them), and the `immigrant` flag records the country of birth. A child
 * with no parent left, or one in detention, does not move.
 */
export function moveAbroad(state: GameState, rng: Rng, countryCode: string): GameState {
  const from = getCountry(state.character.countryCode);
  const to = getCountry(countryCode);
  if (from.code === to.code || state.crime.inPrison || !hasGuardian(state)) return state;
  const city = rng.pick(to.cities);
  const kept = friendsKept(state);
  const leaves = (p: Person) => p.kind === 'classmate' || (p.alive && isFriend(p) && !kept.has(p.id));
  const behind = Object.values(state.people).filter((p) => p.alive && STAY_BEHIND.includes(p.kind) && !leaves(p));
  const people = Object.fromEntries(
    Object.entries(state.people)
      .filter(([, p]) => !leaves(p))
      .map(([id, p]) => [id, p.alive && STAY_BEHIND.includes(p.kind) ? { ...p, farAway: true } : p]),
  );
  let s: GameState = { ...state, people, character: { ...state.character, countryCode: to.code, city }, flags: { ...state.flags, immigrant: from.code } };
  s = log(s, `My family moved from ${countryInProse(from.name)} to ${countryInProse(to.name)}. We started over in ${city}.`, 'milestone');
  const goodbye = goodbyeLine(rng, behind);
  if (goodbye) s = log(s, goodbye);
  s = log(s, rng.pick(NEW_COUNTRY_LINES));
  return addStats(s, { happiness: -4 });
}

/**
 * An orphan turns 18: the end of foster care, with or without the foster parent's help. One still in juvenile
 * detention on their birthday ages out on release day later that year (releaseFromPrison, justice.ts).
 */
export function ageOutOfFosterCare(state: GameState): GameState {
  if (state.crime.inPrison || state.flags.foster_care !== true) return state;
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
