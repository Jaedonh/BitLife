import { getCountry } from '@/data/countries';
import { hasMovedOut, isMarried, kidsCount } from '../systems/family';
import type { GameState, Person } from '../types';
import { netWorth } from '../util';
import type { Comparator, Condition, PersonSelector } from './schema';
import { scaleMoney } from './text';

function cmp(value: number, c: Comparator): boolean {
  if (c.gte !== undefined && !(value >= c.gte)) return false;
  if (c.lte !== undefined && !(value <= c.lte)) return false;
  if (c.gt !== undefined && !(value > c.gt)) return false;
  if (c.lt !== undefined && !(value < c.lt)) return false;
  if (c.eq !== undefined && value !== c.eq) return false;
  return true;
}

/** Money thresholds are authored in USD like money effects, so they scale with the country's prices too. */
function usd(state: GameState, c: Comparator): Comparator {
  const f = (v: number | undefined) => (v === undefined ? undefined : scaleMoney(state, v));
  return { gte: f(c.gte), lte: f(c.lte), gt: f(c.gt), lt: f(c.lt), eq: f(c.eq) };
}

export function alivePeople(state: GameState): Person[] {
  return Object.values(state.people).filter((p) => p.alive);
}

/**
 * Whether someone of these kinds is alive and nearby (`hasPerson`, `noPerson`): a friend or grandparent left
 * behind by a move abroad (`farAway`) is not someone a card can put in the room.
 */
export function hasPersonOfKind(state: GameState, kinds: readonly Person['kind'][]): boolean {
  return alivePeople(state).some((p) => kinds.includes(p.kind) && p.farAway !== true);
}

export function evaluateCondition(state: GameState, c: Condition): boolean {
  const ch = state.character;
  if ('stat' in c) return cmp(ch.stats[c.stat], c);
  if ('money' in c) return cmp(state.finances.cash, usd(state, c.money));
  if ('netWorth' in c) return cmp(netWorth(state), usd(state, c.netWorth));
  if ('income' in c) return cmp(state.finances.lastYear.income, usd(state, c.income));
  if ('flag' in c) {
    const v = state.flags[c.flag];
    if (c.exists !== undefined) return (v !== undefined) === c.exists;
    if (c.eq !== undefined) return v === c.eq;
    if (c.gte !== undefined && !(typeof v === 'number' && v >= c.gte)) return false;
    if (c.lte !== undefined && !(typeof v === 'number' && v <= c.lte)) return false;
    return c.gte !== undefined || c.lte !== undefined ? true : v !== undefined;
  }
  if ('hasJob' in c) return (state.career.job !== null) === c.hasJob;
  if ('partTime' in c) return (state.career.job?.partTime ?? false) === c.partTime;
  if ('jobCategory' in c) return !!state.career.job && c.jobCategory.includes(state.career.job.category);
  if ('jobLevel' in c) return !!state.career.job && cmp(state.career.job.level, c.jobLevel);
  if ('enrolled' in c) return state.education.enrolled === c.enrolled;
  if ('stage' in c) return c.stage.includes(state.education.stage);
  if ('hasDegree' in c) return state.education.degrees.some((d) => d.startsWith('bachelor') || d.startsWith('master') || d.startsWith('doctor')) === c.hasDegree;
  if ('grade' in c) return cmp(state.education.grade, c.grade);
  if ('married' in c) return hasPersonOfKind(state, ['spouse']) === c.married;
  // A partner or a child is mine wherever they live (one left behind by a move to another city): no second partner,
  // no "no kids yet" card for a parent whose children live far away.
  if ('hasLover' in c) return alivePeople(state).some((p) => p.kind === 'lover' || p.kind === 'spouse') === c.hasLover;
  if ('hasChildren' in c) return alivePeople(state).some((p) => p.kind === 'child') === c.hasChildren;
  if ('hasPerson' in c) return hasPersonOfKind(state, c.hasPerson);
  if ('noPerson' in c) return !hasPersonOfKind(state, c.noPerson);
  if ('country' in c) return c.country.includes(ch.countryCode);
  if ('notCountry' in c) return !c.notCountry.includes(ch.countryCode);
  if ('inPrison' in c) return state.crime.inPrison === c.inPrison;
  if ('criminalRecord' in c) return state.crime.record === c.criminalRecord;
  if ('trait' in c) return ch.traits.includes(c.trait);
  if ('notTrait' in c) return !ch.traits.includes(c.notTrait);
  if ('gender' in c) return ch.gender === c.gender;
  if ('karma' in c) return cmp(ch.karma, c.karma);
  if ('fame' in c) return cmp(ch.fame, c.fame);
  if ('addiction' in c) return (state.health.addictions[c.addiction] ?? 0) >= (c.min ?? 1);
  if ('noAddiction' in c) return (state.health.addictions[c.noAddiction] ?? 0) <= 0;
  if ('ownsAsset' in c) return state.assets.some((a) => a.kind === c.ownsAsset);
  if ('noAsset' in c) return !state.assets.some((a) => a.kind === c.noAsset);
  if ('count' in c) return cmp(state.counters[c.count] ?? 0, c);
  if ('jobId' in c) return !!state.career.job && c.jobId.includes(state.career.job.defId);
  if ('sinceEvent' in c) {
    const at = state.firedEvents[c.sinceEvent];
    return at !== undefined && cmp(state.character.age - at, c);
  }
  if ('sinceRelease' in c) {
    const out = state.crime.lastRelease;
    if (!out || (c.sinceRelease !== 'any' && out.juvenile !== (c.sinceRelease === 'juvenile'))) return false;
    return cmp(state.character.age - out.age, c);
  }
  if ('ownsAssetId' in c) return state.assets.some((a) => c.ownsAssetId.includes(a.defId));
  if ('hustle' in c) return (state.career.hustle !== null) === c.hustle;
  if ('year' in c) return cmp(state.year, c.year);
  if ('climate' in c) return c.climate.includes(getCountry(ch.countryCode).climate);
  if ('southern' in c) return (getCountry(ch.countryCode).southern === true) === c.southern;
  if ('atHome' in c) return livesAtHome(state) === c.atHome;
  if ('sinceRetired' in c) {
    const last = state.career.history.at(-1);
    if (!state.career.retired || state.career.job || last?.reason !== 'retired') return false;
    return cmp(state.character.age - last.toAge, c);
  }
  if ('retired' in c) return state.career.retired === c.retired;
  if ('illnessCount' in c) return cmp(state.health.illnesses.length, c.illnessCount);
  if ('juvenile' in c) return (state.crime.inPrison && state.crime.juvenile === true) === c.juvenile;
  if ('eventFired' in c) return state.firedEvents[c.eventFired] !== undefined;
  if ('eventNotFired' in c) return state.firedEvents[c.eventNotFired] === undefined;
  if ('hasIllness' in c) return state.health.illnesses.some((i) => c.hasIllness.includes(i.defId));
  if ('yearsMarried' in c) {
    const wedding = alivePeople(state).find((p) => p.kind === 'spouse')?.marriedAtAge;
    return wedding !== undefined && cmp(ch.age - wedding, c.yearsMarried);
  }
  if ('hustleLevel' in c) return !!state.career.hustle && cmp(state.career.hustle.level, c.hustleLevel);
  if ('any' in c) return c.any.some((x) => evaluateCondition(state, x));
  if ('all' in c) return c.all.every((x) => evaluateCondition(state, x));
  if ('not' in c) return !evaluateCondition(state, c.not);
  return false;
}

export function evaluateAll(state: GameState, conditions: readonly Condition[] | undefined): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((c) => evaluateCondition(state, c));
}

export function candidatesFor(state: GameState, sel: PersonSelector): Person[] {
  return Object.values(state.people).filter((p) => {
    if (!sel.kind.includes(p.kind)) return false;
    if ((sel.alive ?? true) !== p.alive) return false;
    // Someone lost recently: the player's age at the death is recorded (an older save's undated death never matches).
    if (sel.diedWithin !== undefined && (p.lostAtAge === undefined || state.character.age - p.lostAtAge > sel.diedWithin)) return false;
    if (sel.knownFor && !cmp(state.character.age - (p.metAtAge ?? 0), sel.knownFor)) return false;
    if (sel.minRelationship !== undefined && p.relationship < sel.minRelationship) return false;
    if (sel.maxRelationship !== undefined && p.relationship > sel.maxRelationship) return false;
    if (sel.minAge !== undefined && p.age < sel.minAge) return false;
    if (sel.maxAge !== undefined && p.age > sel.maxAge) return false;
    if (sel.household && !livesWithPlayer(state, p)) return false;
    // People who live far away (left behind by a move, or met far from home) only turn up when the card is written for distance:
    // `farAway: true` binds only them, 'any' them or anyone nearby (the dead are remembered wherever they lived).
    if (p.alive && sel.farAway !== 'any' && (p.farAway === true) !== (sel.farAway === true)) return false;
    // Back home: known before the move abroad, which happens at the birthday of that age (before anyone is met that year).
    if (sel.metBeforeMoveAbroad !== undefined) {
      const move = state.character.moveAbroad;
      if ((!!move && state.flags.immigrant !== undefined && p.metAtAge < move.age) !== sel.metBeforeMoveAbroad) return false;
    }
    // A coworker linked to a job is only a coworker while the player still holds that job (see coworkers.ts).
    if (p.kind === 'coworker' && p.workplace && !(state.career.job && p.workplace.jobId === state.career.job.defId && p.workplace.company === state.career.job.company)) return false;
    if (sel.gender !== undefined && p.gender !== sel.gender) return false;
    // A grown child's milestones (systems/family.ts).
    if (sel.movedOut !== undefined && hasMovedOut(p) !== sel.movedOut) return false;
    if (sel.married !== undefined && isMarried(p) !== sel.married) return false;
    if (sel.kids !== undefined && !cmp(kidsCount(p), sel.kids)) return false;
    if (sel.species !== undefined && !sel.species.includes(p.species ?? '')) return false;
    return true;
  });
}

/**
 * Flag a card sets when I move back in with my parents (ya_move_back_home: "Move back home"). It holds while a parent
 * or step-parent nearby is alive, and ends when I buy a home, marry, move in with a partner, move to another city or
 * go to prison (`settleHomeWithParents`).
 */
export const HOME_WITH_PARENTS_FLAG = 'home_with_parents';

/** A home of my own that I live in (not one rented out). */
export function ownsHomeLivedIn(state: GameState): boolean {
  return state.assets.some((a) => a.kind === 'house' && a.primary && !a.rentedOut);
}

/** A parent or step-parent who is alive and lives nearby: someone I could live with. */
function parentNearby(state: GameState): boolean {
  return hasPersonOfKind(state, ['mother', 'father', 'stepmother', 'stepfather']);
}

/** Why moving back home is over: a home, a spouse or a partner of my own, prison, or no parent nearby to live with. */
function homeWithParentsEnded(state: GameState): boolean {
  return state.crime.inPrison || ownsHomeLivedIn(state) || hasPersonOfKind(state, ['spouse']) || state.flags.lf_living_together === true || !parentNearby(state);
}

/** I moved back in with my parents on a card and still live there (HOME_WITH_PARENTS_FLAG). */
export function movedBackHome(state: GameState): boolean {
  return state.flags[HOME_WITH_PARENTS_FLAG] !== undefined && !homeWithParentsEnded(state);
}

/**
 * Clears HOME_WITH_PARENTS_FLAG once living at home is over (a home bought, a wedding, moving in with a partner,
 * prison, no parent left nearby), so a later divorce or a sold house does not put me back in my old room.
 */
export function settleHomeWithParents(state: GameState): GameState {
  if (state.flags[HOME_WITH_PARENTS_FLAG] === undefined || !homeWithParentsEnded(state)) return state;
  const flags = { ...state.flags };
  delete flags[HOME_WITH_PARENTS_FLAG];
  return { ...state, flags };
}

/**
 * Whether the player still lives with their parents: as a minor, after moving back home on a card (movedBackHome),
 * or under 24 with no home and little income (as in finance.ts).
 */
export function livesAtHome(state: GameState): boolean {
  const age = state.character.age;
  if (age < 18) return true;
  if (movedBackHome(state)) return true;
  // An orphan ages out of foster care at 18 into a place of their own.
  if (state.flags.foster_care === true) return false;
  return age < 24 && !ownsHomeLivedIn(state) && (state.career.job?.salary ?? 0) < scaleMoney(state, 20_000) && !hasPersonOfKind(state, ['spouse']);
}

/** Whether the player lives with this person now (`household` selectors; who comes along on a move, scenarios.ts). */
export function livesWithPlayer(state: GameState, p: Person): boolean {
  switch (p.kind) {
    case 'mother': case 'father': case 'stepmother': case 'stepfather': return livesAtHome(state);
    case 'sibling': return livesAtHome(state) && p.age < 24;
    case 'spouse': case 'pet': return true;
    case 'lover': return state.flags.lf_living_together === true;
    // A grown child who has not moved out yet still lives at home (as the person page's seesDaily has it).
    case 'child': return !hasMovedOut(p);
    default: return false;
  }
}
