/**
 * Data-driven random events.
 *
 * An EventDef is plain data: who it can happen to (age range + conditions +
 * an optional bound person), how likely it is (weight), and what the player
 * can choose (choices with effects). A tiny interpreter (effects.ts) applies
 * effects, so content never needs engine code.
 */
import type {
  AddictionKind,
  AssetKind,
  EducationStage,
  Gender,
  JobCategory,
  LifetimeCounters,
  LogKind,
  RelationshipKind,
  StatId,
  Stats,
  TraitId,
} from '../types';

export interface Comparator {
  gte?: number;
  lte?: number;
  gt?: number;
  lt?: number;
  eq?: number;
}

export type Condition =
  | ({ stat: StatId } & Comparator)
  | { money: Comparator }
  | { netWorth: Comparator }
  | { income: Comparator }
  | { flag: string; eq?: number | boolean | string; exists?: boolean; gte?: number; lte?: number }
  | { hasJob: boolean }
  | { partTime: boolean }
  | { jobCategory: JobCategory[] }
  | { jobLevel: Comparator }
  | { enrolled: boolean }
  | { stage: EducationStage[] }
  | { hasDegree: boolean }
  | { grade: Comparator }
  | { married: boolean }
  | { hasLover: boolean }
  | { hasChildren: boolean }
  | { hasPerson: RelationshipKind[] }
  | { noPerson: RelationshipKind[] }
  | { country: string[] }
  | { notCountry: string[] }
  | { inPrison: boolean }
  | { criminalRecord: boolean }
  | { trait: TraitId }
  | { notTrait: TraitId }
  | { gender: Gender }
  | { karma: Comparator }
  | { fame: Comparator }
  | { addiction: AddictionKind; min?: number }
  | { noAddiction: AddictionKind }
  | { ownsAsset: AssetKind }
  | { noAsset: AssetKind }
  /** Owns at least one asset with one of these definition ids (src/data/assets.ts), e.g. a real car rather than a bicycle. */
  | { ownsAssetId: string[] }
  /** A lifetime counter, e.g. { count: 'divorces', gte: 1 } or { count: 'firings', gte: 2 }. */
  | ({ count: keyof LifetimeCounters } & Comparator)
  | { hustle: boolean }
  | { retired: boolean }
  | { illnessCount: Comparator }
  /** Serving time in juvenile detention. Only events with { juvenile: true } (and { inPrison: true }) open there. */
  | { juvenile: boolean }
  | { eventFired: string }
  | { eventNotFired: string }
  | { any: Condition[] }
  | { all: Condition[] }
  | { not: Condition };

export type Effect =
  | { stat: StatId; delta: number }
  | { stats: Partial<Stats> }
  /** Event money in USD (scaled per country). A minor's costs fall on their parents unless payer is 'self': the child spends their own savings (never more than they have). */
  | { money: number; payer?: 'self' }
  | { karma: number }
  | { fame: number }
  | { log: string; kind?: LogKind }
  | { flag: string; set?: number | boolean | string; inc?: number }
  | { relationship: 'person' | RelationshipKind; delta: number }
  | { love: number }
  | { removePerson: true }
  | { personDies: true; cause?: string }
  | { newPerson: { kind: RelationshipKind; relationship?: number; minAge?: number; maxAge?: number; gender?: Gender; species?: string; log?: string } }
  | { death: string }
  | { prison: number }
  | { arrest: true }
  | { illness: string }
  | { cureIllness: true }
  | { addiction: AddictionKind; delta: number }
  | { injury: number }
  | { loseJob: true; reason?: 'fired' | 'left' }
  | { jobPerformance: number }
  | { grade: number }
  | { expelled: true }
  | { queue: string }
  | { counter: keyof LifetimeCounters; by?: number }
  | { random: { weight: number; effects: Effect[] }[] }
  | { chance: number; then: Effect[]; else?: Effect[] }
  | { asset: 'damage' | 'lose'; kind?: AssetKind; amount?: number }
  | { achievement: string }
  | { energy: number }
  /** Code-defined court card (sys_trial) only: settles the case stored in the card's context. */
  | { trial: TrialPlea }
  /** Code-defined parole card (sys_parole) only: the board decides on early release. */
  | { paroleHearing: ParoleApproach };

export type TrialPlea = 'plea' | 'public' | 'lawyer' | 'self';
export const TRIAL_PLEAS: readonly TrialPlea[] = ['plea', 'public', 'lawyer', 'self'];
export type ParoleApproach = 'remorse' | 'plans' | 'waive';
export const PAROLE_APPROACHES: readonly ParoleApproach[] = ['remorse', 'plans', 'waive'];

export interface ChoiceDef {
  id: string;
  label: string;
  /** Short hint under the label, e.g. a cost. Supports placeholders. */
  hint?: string;
  /** Hidden when conditions fail (a choice-less event is auto-resolved with its first choice). */
  conditions?: Condition[];
  effects: Effect[];
}

export type EventCategory =
  | 'childhood'
  | 'school'
  | 'work'
  | 'family'
  | 'romance'
  | 'friends'
  | 'health'
  | 'money'
  | 'crime'
  | 'prison'
  | 'random'
  | 'holiday'
  | 'elderly';

export interface PersonSelector {
  kind: RelationshipKind[];
  alive?: boolean;
  minRelationship?: number;
  maxRelationship?: number;
  minAge?: number;
  maxAge?: number;
}

export interface EventDef {
  id: string;
  category: EventCategory;
  title: string;
  /** Supports placeholders: {{name}} {{fullName}} {{city}} {{country}} {{age}} {{person}} {{personFull}} {{they}} {{them}} {{their}} {{job}} {{company}} {{$1000}} */
  text: string;
  minAge: number;
  maxAge: number;
  /** Relative likelihood among eligible events (1 = normal, 3 = common, 0.3 = rare). */
  weight: number;
  /** Fire at most once per life. */
  once?: boolean;
  /** Minimum years between repeats. */
  cooldown?: number;
  conditions?: Condition[];
  person?: PersonSelector;
  choices: ChoiceDef[];
  /** Follow-ups only: never picked randomly, only via a `queue` effect. */
  followUpOnly?: boolean;
  /** Code-defined (sys_) cards only: placeholders filled from the queued card's context, e.g. ['charge']. */
  vars?: readonly string[];
}

const PLACEHOLDER_RE = /\{\{([^}]+)\}\}/g;
const KNOWN_PLACEHOLDERS = new Set([
  'name', 'fullName', 'city', 'country', 'age', 'person', 'personFull', 'they', 'them', 'their', 'They', 'job', 'company', 'spouse', 'mother', 'father', 'he', 'she', 'his', 'him', 'demonym', 'year',
]);

/** Returns a list of human-readable problems; empty means valid. */
/**
 * {{they}}/{{They}} render as "he"/"she" (every NPC has a gender), so the verb after them must be singular:
 * "{{They}} is", "{{they}} was", "{{they}} has", "{{they}} knows". Flags the plural forms writers reach for.
 */
const PLURAL_AFTER_THEY = new RegExp(
  "\\{\\{[Tt]hey\\}\\}(?:'re|'ve|\\s+(?:(?:also|always|still|just|really|even|never|now|actually|all|both|only)\\s+)?" +
    "(are|were|have|do|don't|aren't|weren't|haven't|know|notice|visit|need|tell|snore|want|say|think|like|love|hate|look|seem|keep|make|take|come|go|get|live|work|call|ask|try|sound|feel|mean|insist|refuse|agree|promise|sell|buy|own|play|walk|talk|sit|stand|laugh|cry|write|eat|drink|sleep|hold|give|show|turn|start|stop|help|move|pay|send|bring|leave|hope|wish|plan|wear|carry|watch|follow|mind|care|swear|claim|demand|expect|deserve|remember|forget|understand|explain|offer|deny|admit|blame|owe|wait|worry|wonder)\\b)",
);

/** Wording problems the renderer cannot fix (see CONTENT_STYLE.md). */
export function textIssues(text: string): string[] {
  const issues: string[] = [];
  const m = text.match(PLURAL_AFTER_THEY);
  if (m) issues.push(`"${m[0]}" renders as "he/she ${m[1] ?? m[0].slice(-3)}"; use the singular verb`);
  if (/ {2,}/.test(text)) issues.push('double space');
  if (/\s[,.!?;:]/.test(text.replace(/ \{\{/g, ' x'))) issues.push('space before punctuation');
  return issues;
}

export function validateEvent(def: EventDef, knownIds: Set<string>): string[] {
  const errors: string[] = [];
  const where = `event ${def.id}`;
  if (!def.id || !/^[a-z0-9_]+$/.test(def.id)) errors.push(`${where}: id must be snake_case`);
  if (!def.title) errors.push(`${where}: missing title`);
  if (!def.text) errors.push(`${where}: missing text`);
  if (!(def.minAge >= 0 && def.maxAge >= def.minAge && def.maxAge <= 120)) errors.push(`${where}: bad age range`);
  if (!(def.weight >= 0)) errors.push(`${where}: weight must be >= 0`);
  if (!def.choices || def.choices.length < 1 || def.choices.length > 4) errors.push(`${where}: needs 1-4 choices`);
  const seen = new Set<string>();
  for (const c of def.choices ?? []) {
    if (seen.has(c.id)) errors.push(`${where}: duplicate choice id ${c.id}`);
    seen.add(c.id);
    if (!c.label) errors.push(`${where}: choice ${c.id} missing label`);
    for (const e of c.effects ?? []) checkEffect(e, where, knownIds, errors);
    if (!def.id.startsWith('sys_') && effectLists([c.effects ?? []]).some((l) => l.some((e) => 'trial' in e || 'paroleHearing' in e))) {
      errors.push(`${where}: choice ${c.id} uses a court or parole effect, which only the engine's own sys_ cards can use`);
    }
    // An arrest or a sentence written for the outside must not reach a player already in prison (and one
    // written for the inside must not reach a free one), so the event or the choice says which it is.
    if (canJail(c.effects ?? []) && !mentionsInPrison(def.conditions) && !mentionsInPrison(c.conditions)) {
      errors.push(`${where}: choice ${c.id} can arrest or jail the player; add { inPrison: false } to the event's conditions (or { inPrison: true } if it is written for prison)`);
    }
    // A choice offered only when the player has the cash is the player spending their own money: for a
    // minor that must come out of their savings, not their parents' (which is the default for minors).
    if (def.minAge < 18 && (c.conditions ?? []).some((x) => 'money' in x) && unpaidCost(c.effects ?? [])) {
      errors.push(`${where}: choice ${c.id} needs the player's own cash but a cost has no payer: 'self'; a minor's costs otherwise fall on their parents`);
    }
  }
  for (const list of effectLists(def.choices.flatMap((c) => [c.effects ?? []]))) {
    // An event death is announced and grieved by the content itself (the engine adds neither).
    const grieves = (e: Effect) => ('stat' in e && e.stat === 'happiness' && e.delta < 0) || ('stats' in e && (e.stats.happiness ?? 0) < 0);
    if (list.some((e) => 'personDies' in e) && !(always(list, (e) => 'log' in e) && always(list, grieves))) {
      errors.push(`${where}: a personDies effect needs a log line and a happiness loss in the same effects list`);
    }
  }
  // {{mother}}/{{father}} name a living parent ("Mom"/"Dad"), so the event must require one.
  const blob = JSON.stringify(def.choices) + def.title + def.text;
  for (const k of ['mother', 'father'] as const) {
    const bound = def.person?.kind.length === 1 && def.person.kind[0] === k;
    if (blob.includes(`{{${k}}}`) && !bound && !requiresPerson(def.conditions, k)) errors.push(`${where}: uses {{${k}}} but does not require a living ${k} ({ hasPerson: ['${k}'] })`);
  }
  if (def.vars?.length && !def.id.startsWith('sys_')) errors.push(`${where}: only the engine's own sys_ cards can declare vars`);
  const known = def.vars?.length ? new Set([...KNOWN_PLACEHOLDERS, ...def.vars]) : KNOWN_PLACEHOLDERS;
  const usesPerson = /\{\{(person|personFull|they|them|their|They)\}\}/.test(def.text + def.choices.map((c) => c.label + (c.hint ?? '')).join(' '));
  if (usesPerson && !def.person) errors.push(`${where}: uses person placeholders but has no person selector`);
  for (const text of [def.title, def.text, ...def.choices.map((c) => c.label), ...def.choices.map((c) => c.hint ?? '')]) {
    for (const issue of textIssues(text)) errors.push(`${where}: ${issue}`);
    for (const m of text.matchAll(PLACEHOLDER_RE)) {
      const key = m[1]!.trim();
      if (key.startsWith('$')) {
        if (!/^\$\d+$/.test(key)) errors.push(`${where}: bad money placeholder ${key}`);
      } else if (!known.has(key)) errors.push(`${where}: unknown placeholder ${key}`);
    }
  }
  return errors;
}

function requiresPerson(conditions: readonly Condition[] | undefined, kind: 'mother' | 'father'): boolean {
  return (conditions ?? []).some((c) => ('hasPerson' in c && c.hasPerson.length === 1 && c.hasPerson[0] === kind) || ('all' in c && requiresPerson(c.all, kind)));
}

/** Every effects list in these lists, including the branches of chance and random effects. */
function effectLists(lists: readonly (readonly Effect[])[]): (readonly Effect[])[] {
  return lists.flatMap((l) => [l, ...effectLists(l.flatMap((e) => ('chance' in e ? [e.then, e.else ?? []] : 'random' in e ? e.random.map((o) => o.effects) : [])))]);
}

/** Whether every path through this effects list hits an effect matching `test` (directly, or in every branch of a chance/random). */
function always(list: readonly Effect[], test: (e: Effect) => boolean): boolean {
  return list.some((e) => test(e) || ('chance' in e && always(e.then, test) && always(e.else ?? [], test)) || ('random' in e && e.random.every((o) => always(o.effects, test))));
}

function unpaidCost(effects: readonly Effect[]): boolean {
  return effectLists([effects]).some((l) => l.some((e) => 'money' in e && e.money < 0 && e.payer !== 'self'));
}

function canJail(effects: readonly Effect[]): boolean {
  return effects.some((e) => 'prison' in e || 'arrest' in e || 'trial' in e || ('random' in e && e.random.some((o) => canJail(o.effects))) || ('chance' in e && (canJail(e.then) || canJail(e.else ?? []))));
}

function mentionsInPrison(conditions: readonly Condition[] | undefined): boolean {
  return (conditions ?? []).some((c) => 'inPrison' in c || ('any' in c && mentionsInPrison(c.any)) || ('all' in c && mentionsInPrison(c.all)) || ('not' in c && mentionsInPrison([c.not])));
}

function checkEffect(e: Effect, where: string, knownIds: Set<string>, errors: string[]): void {
  if ('queue' in e && !knownIds.has(e.queue)) errors.push(`${where}: queues unknown event ${e.queue}`);
  if ('trial' in e && !TRIAL_PLEAS.includes(e.trial)) errors.push(`${where}: unknown trial plea ${String(e.trial)}`);
  if ('paroleHearing' in e && !PAROLE_APPROACHES.includes(e.paroleHearing)) errors.push(`${where}: unknown parole approach ${String(e.paroleHearing)}`);
  if ('random' in e) {
    if (!e.random.length) errors.push(`${where}: empty random outcome list`);
    for (const o of e.random) for (const x of o.effects) checkEffect(x, where, knownIds, errors);
  }
  if ('chance' in e) {
    if (!(e.chance >= 0 && e.chance <= 1)) errors.push(`${where}: chance must be 0..1`);
    for (const x of e.then) checkEffect(x, where, knownIds, errors);
    for (const x of e.else ?? []) checkEffect(x, where, knownIds, errors);
  }
  if ('log' in e) {
    for (const issue of textIssues(e.log)) errors.push(`${where}: ${issue}`);
    for (const m of e.log.matchAll(PLACEHOLDER_RE)) {
      const key = m[1]!.trim();
      if (key.startsWith('$')) {
        if (!/^\$\d+$/.test(key)) errors.push(`${where}: bad money placeholder ${key}`);
      } else if (!KNOWN_PLACEHOLDERS.has(key)) errors.push(`${where}: unknown placeholder ${key}`);
    }
  }
}
