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

export function hasPersonOfKind(state: GameState, kinds: readonly Person['kind'][]): boolean {
  return alivePeople(state).some((p) => kinds.includes(p.kind));
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
  if ('hasLover' in c) return hasPersonOfKind(state, ['lover', 'spouse']) === c.hasLover;
  if ('hasChildren' in c) return hasPersonOfKind(state, ['child']) === c.hasChildren;
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
  if ('ownsAssetId' in c) return state.assets.some((a) => c.ownsAssetId.includes(a.defId));
  if ('hustle' in c) return (state.career.hustle !== null) === c.hustle;
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
    if (sel.minRelationship !== undefined && p.relationship < sel.minRelationship) return false;
    if (sel.maxRelationship !== undefined && p.relationship > sel.maxRelationship) return false;
    if (sel.minAge !== undefined && p.age < sel.minAge) return false;
    if (sel.maxAge !== undefined && p.age > sel.maxAge) return false;
    if (sel.household && !livesWithPlayer(state, p)) return false;
    return true;
  });
}

/** Whether the player still lives with their parents: as a minor, or under 24 with no home and little income (as in finance.ts). */
export function livesAtHome(state: GameState): boolean {
  const age = state.character.age;
  if (age < 18) return true;
  const ownsHome = state.assets.some((a) => a.kind === 'house' && a.primary && !a.rentedOut);
  return age < 24 && !ownsHome && (state.career.job?.salary ?? 0) < scaleMoney(state, 20_000) && !hasPersonOfKind(state, ['spouse']);
}

function livesWithPlayer(state: GameState, p: Person): boolean {
  switch (p.kind) {
    case 'mother': case 'father': case 'stepmother': case 'stepfather': return livesAtHome(state);
    case 'sibling': return livesAtHome(state) && p.age < 24;
    case 'spouse': case 'pet': return true;
    case 'lover': return state.flags.lf_living_together === true;
    case 'child': return p.age < 18;
    default: return false;
  }
}
