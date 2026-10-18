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
  | { hustle: boolean }
  | { retired: boolean }
  | { illnessCount: Comparator }
  | { eventFired: string }
  | { eventNotFired: string }
  | { any: Condition[] }
  | { all: Condition[] }
  | { not: Condition };

export type Effect =
  | { stat: StatId; delta: number }
  | { stats: Partial<Stats> }
  | { money: number }
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
  | { energy: number };

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
    // An arrest or a sentence written for the outside must not reach a player already in prison (and one
    // written for the inside must not reach a free one), so the event or the choice says which it is.
    if (canJail(c.effects ?? []) && !mentionsInPrison(def.conditions) && !mentionsInPrison(c.conditions)) {
      errors.push(`${where}: choice ${c.id} can arrest or jail the player; add { inPrison: false } to the event's conditions (or { inPrison: true } if it is written for prison)`);
    }
  }
  const usesPerson = /\{\{(person|personFull|they|them|their|They)\}\}/.test(def.text + def.choices.map((c) => c.label + (c.hint ?? '')).join(' '));
  if (usesPerson && !def.person) errors.push(`${where}: uses person placeholders but has no person selector`);
  for (const text of [def.title, def.text, ...def.choices.map((c) => c.label), ...def.choices.map((c) => c.hint ?? '')]) {
    for (const issue of textIssues(text)) errors.push(`${where}: ${issue}`);
    for (const m of text.matchAll(PLACEHOLDER_RE)) {
      const key = m[1]!.trim();
      if (key.startsWith('$')) {
        if (!/^\$\d+$/.test(key)) errors.push(`${where}: bad money placeholder ${key}`);
      } else if (!KNOWN_PLACEHOLDERS.has(key)) errors.push(`${where}: unknown placeholder ${key}`);
    }
  }
  return errors;
}

function canJail(effects: readonly Effect[]): boolean {
  return effects.some((e) => 'prison' in e || 'arrest' in e || ('random' in e && e.random.some((o) => canJail(o.effects))) || ('chance' in e && (canJail(e.then) || canJail(e.else ?? []))));
}

function mentionsInPrison(conditions: readonly Condition[] | undefined): boolean {
  return (conditions ?? []).some((c) => 'inPrison' in c || ('any' in c && mentionsInPrison(c.any)) || ('all' in c && mentionsInPrison(c.all)) || ('not' in c && mentionsInPrison([c.not])));
}

function checkEffect(e: Effect, where: string, knownIds: Set<string>, errors: string[]): void {
  if ('queue' in e && !knownIds.has(e.queue)) errors.push(`${where}: queues unknown event ${e.queue}`);
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
