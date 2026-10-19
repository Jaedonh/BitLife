import { FLAVOR, type FlavorLine } from '@/data/flavor';
import { candidatesFor, evaluateAll } from '../events/conditions';
import { conditionIssues, placeholderIssues, speciesIssues, textIssues, type Condition, type PersonSelector } from '../events/schema';
import { renderText } from '../events/text';
import { Rng } from '../rng';
import type { GameState, Gender, Person, RelationshipKind } from '../types';
import { log } from '../util';

/** Tuning for the yearly flavor line (docs/GAME_DESIGN.md §2, step 14). */
export const FLAVOR_RULES = {
  /** A situational line whose situation holds is this many times as likely as a generic age line. */
  situationalWeight: 3,
  /** Years before the same line can be written again. */
  repeatGap: 10,
  /** In a year that already has journal lines, the chance that a matching situational line is added. */
  busyYearChance: 0.35,
} as const;

/** What the year held by the time its flavor line is chosen (after the systems ran and the first card was opened). */
export interface FlavorYear {
  /** The state at the start of the year: the birthday has passed, nothing else has happened yet. */
  start: GameState;
  /** Journal lines the year's systems wrote, not counting the year header. */
  lines: number;
  /** An event card opens this year. */
  event: boolean;
}

/** A line with conditions, a bound person or a group describes a situation; the rest are generic age lines. */
export function isSituational(line: FlavorLine): boolean {
  return !!(line.conditions?.length || line.person || line.groups?.length);
}

/** Written for prison: requires { inPrison: true } (at the top level or inside `all`), as for events. */
function writtenForPrison(conditions: readonly Condition[] | undefined): boolean {
  return (conditions ?? []).some((c) => ('inPrison' in c && c.inPrison) || ('all' in c && writtenForPrison(c.all)));
}

/** People who fit a selector now and were already alive in that place at the start of the year. */
function heldAllYear(selector: PersonSelector, start: GameState, now: GameState): Person[] {
  return candidatesFor(now, selector).filter((p) => {
    const before = start.people[p.id];
    return !!before && before.alive && before.kind === p.kind;
  });
}

/** People the line could be about: they fit its selector now and already held that place at the start of the year. */
export function flavorCandidates(line: FlavorLine, start: GameState, now: GameState): Person[] {
  return line.person ? heldAllYear(line.person, start, now) : [];
}

/**
 * Whether a line can be written this year: the age fits, and its situation held all year, both at the start of the
 * year and after the year's systems ran. So a line never describes something that began or ended this year (a
 * diagnosis, a release, a divorce, a new pet), which the year's own journal lines already report. Prison is its own
 * world: in a year that began or ended behind bars only lines written for prison qualify (and those need both), so the
 * year of a release says nothing about the job hunt or the pet that it mostly spent inside.
 */
export function flavorFits(line: FlavorLine, start: GameState, now: GameState): boolean {
  const age = now.character.age;
  if (age < line.minAge || age > line.maxAge) return false;
  if ((now.crime.inPrison || start.crime.inPrison) && !writtenForPrison(line.conditions)) return false;
  if (line.conditions?.length && !(evaluateAll(start, line.conditions) && evaluateAll(now, line.conditions))) return false;
  if (line.person && flavorCandidates(line, start, now).length === 0) return false;
  // "The grandchildren", "my children": enough of them were there all year (one who died this year no longer counts).
  if (line.groups?.some((g) => heldAllYear(g, start, now).length < g.atLeast)) return false;
  return true;
}

/** Someone the player knew died this year (a natural death the year's systems wrote up). */
function deathThisYear(start: GameState, now: GameState): boolean {
  return Object.values(start.people).some((p) => p.alive && now.people[p.id]?.alive === false);
}

/** The year brought news too serious for a passing remark: a death, a new severe illness, or the doctor's warning. */
function graveYear(start: GameState, now: GameState): boolean {
  if (deathThisYear(start, now) || now.health.criticalYears > 0) return true;
  return now.health.illnesses.some((i) => i.severity >= 4 && !start.health.illnesses.some((x) => x.defId === i.defId));
}

/** The remembered lines still inside the no-repeat window. */
function recentlySeen(state: GameState): Record<string, number> {
  const age = state.character.age;
  const out: Record<string, number> = {};
  for (const [text, at] of Object.entries(state.flavorSeen ?? {})) if (at <= age && age - at < FLAVOR_RULES.repeatGap) out[text] = at;
  return out;
}

/**
 * A quiet line ("nothing happened") is chosen at the birthday, before the player has done anything that year. When
 * the year brought news after all (a crime and its court card, a visit, a baby), the line no longer holds, so it is
 * dropped from that year's journal once the year is over: at the next birthday, or wherever a life ends (the caller
 * passes `end`, where that year's journal stops; by default the latest year). A quiet line that is still its year's
 * only line stays, so no year is left empty. Quiet lines carry no placeholders, so their text finds them.
 */
export function settleQuietYear(state: GameState, end = state.log.length, lines: readonly FlavorLine[] = FLAVOR): GameState {
  let header = end - 1;
  while (header >= 0 && state.log[header]!.kind !== 'year') header--;
  // Nothing to settle before the first birthday, or in a year whose one line is the quiet one.
  if (header < 0 || end - header - 1 <= 1) return state;
  const quiet = new Set(lines.filter((l) => l.quiet).map((l) => l.text));
  const at = state.log.findIndex((e, i) => i > header && i < end && quiet.has(e.text));
  if (at < 0) return state;
  return { ...state, log: [...state.log.slice(0, at), ...state.log.slice(at + 1)] };
}

/**
 * The year's flavor line. A quiet year (no other journal lines) always gets one, so no year is empty; it is drawn from
 * the generic age lines and every situational line whose situation holds, situational ones weighted 3x. A busy year
 * sometimes gets a situational line too, unless it brought grave news. Lines marked `quiet` ("nothing happened") are
 * only written in a year with no other lines and no event card, and taken back at the next birthday if the player's
 * own doings filled the year after all (settleQuietYear). No line repeats within ten years; a quiet year with every
 * candidate used recently takes the one written longest ago.
 */
export function yearlyFlavor(before: GameState, year: FlavorYear, lines: readonly FlavorLine[] = FLAVOR): GameState {
  const { start } = year;
  // Last year's journal ends where this year's header begins (start is the state just before it was written).
  const now = settleQuietYear(before, start.log.length, lines);
  const quietYear = year.lines === 0;
  if (!quietYear && graveYear(start, now)) return now;
  const fits = lines.filter((l) => (quietYear || isSituational(l)) && (!l.quiet || (quietYear && !year.event)) && flavorFits(l, start, now));
  if (!fits.length) return now;
  const age = now.character.age;
  const seen = recentlySeen(now);
  let pool = fits.filter((l) => seen[l.text] === undefined);
  if (!pool.length) {
    if (!quietYear) return now;
    const oldest = Math.min(...fits.map((l) => seen[l.text] ?? -1));
    pool = fits.filter((l) => (seen[l.text] ?? -1) === oldest);
  }
  const rng = new Rng(now.rng);
  if (!quietYear && !rng.chance(FLAVOR_RULES.busyYearChance)) return { ...now, rng: rng.snapshot() };
  const line = rng.weighted(pool, (l) => (isSituational(l) ? FLAVOR_RULES.situationalWeight : 1));
  const people = flavorCandidates(line, start, now);
  const person = people.length ? rng.pick(people) : undefined;
  const s = log(now, renderText(line.text, now, { person }));
  return { ...s, flavorSeen: { ...seen, [line.text]: age }, rng: rng.snapshot() };
}

/**
 * Family a line names, and how many of them it needs (docs/CONTENT_STYLE.md): a plural needs two living ones, a
 * grandmother or grandfather needs a real one bound, and being a grandparent needs a living grandchild.
 */
const FAMILY_WORDS: readonly { re: RegExp; kind: RelationshipKind; min: number; gender?: Gender; what: string }[] = [
  { re: /\bgrand(children|kids)\b/i, kind: 'grandchild', min: 2, what: 'grandchildren' },
  { re: /\bgrandsons\b/i, kind: 'grandchild', min: 2, gender: 'male', what: 'grandsons' },
  { re: /\bgranddaughters\b/i, kind: 'grandchild', min: 2, gender: 'female', what: 'granddaughters' },
  { re: /\b(my|our) (own )?(children|kids)\b/i, kind: 'child', min: 2, what: 'my children' },
  { re: /\b(my|our) (own )?sons\b/i, kind: 'child', min: 2, gender: 'male', what: 'my sons' },
  { re: /\b(my|our) (own )?daughters\b/i, kind: 'child', min: 2, gender: 'female', what: 'my daughters' },
  { re: /\b(a|my) grandparent\b|\bgrand(child|kid|son|daughter)\b/i, kind: 'grandchild', min: 1, what: 'a grandchild' },
  { re: /\bgrandparents\b/i, kind: 'grandparent', min: 2, what: 'grandparents' },
  { re: /\bgrand(ma|mother)\b|\{\{grandma\}\}/i, kind: 'grandparent', min: 1, gender: 'female', what: 'a grandmother' },
  { re: /\bgrand(pa|father)\b|\{\{grandpa\}\}/i, kind: 'grandparent', min: 1, gender: 'male', what: 'a grandfather' },
  // "Mom" and "Dad" are a living parent, as {{mother}} and {{father}} are.
  { re: /\b(mom|mommy)\b/i, kind: 'mother', min: 1, what: 'Mom' },
  { re: /\b(dad|daddy)\b/i, kind: 'father', min: 1, what: 'Dad' },
];

/** How many living people of one kind (and gender) a line is sure to have all year: its bound person, a group or a hasPerson condition. */
function guaranteed(l: FlavorLine, kind: RelationshipKind, gender: Gender | undefined): number {
  const only = (sel: PersonSelector) => sel.kind.length > 0 && sel.kind.every((k) => k === kind) && (gender === undefined || sel.gender === gender);
  const counts = [
    l.person && only(l.person) ? 1 : 0,
    ...(l.groups ?? []).map((g) => (only(g) ? g.atLeast : 0)),
    gender === undefined && (l.conditions ?? []).some((c) => 'hasPerson' in c && c.hasPerson.length > 0 && c.hasPerson.every((k) => k === kind)) ? 1 : 0,
  ];
  return Math.max(...counts);
}

/**
 * School goes on in juvenile detention only for a student, so classroom words in a line for a minor locked up need
 * { enrolled: true }. (An adult may take a class in prison; that is not school carrying on.)
 */
const CLASSROOM_WORDS = /\b(homework|grades?|class(es|room)?|teachers?|exams?)\b/i;

/** Wording that claims the whole year was uneventful; such a line must be marked `quiet`. */
const QUIET_WORDING = /\b(nothing (much |else )?happened|uneventful|quiet year|(greatest|biggest|best|only|highlight)\b[\w ]* of the year|spent (the|this) year)\b/i;
const FIRST_PERSON = /\b(I|my|me|mine|myself|we|our|us)\b/i;
const PERSON_PLACEHOLDER = /\{\{(person|personFull|they|They|them|their)\}\}/;

/** Problems with flavor lines (see docs/CONTENT_STYLE.md); empty means valid. Reachability is checked by the validator. */
export function validateFlavor(lines: readonly FlavorLine[] = FLAVOR): string[] {
  const errors: string[] = [];
  const texts = new Set<string>();
  for (const l of lines) {
    const where = `flavor "${l.text}"`;
    if (!l.text) errors.push('flavor line with no text');
    if (texts.has(l.text)) errors.push(`${where}: duplicate line`);
    texts.add(l.text);
    if (!(l.minAge >= 0 && l.maxAge >= l.minAge && l.maxAge <= 120)) errors.push(`${where}: bad age range`);
    if (l.text.length > 100) errors.push(`${where}: ${l.text.length} characters; keep journal lines to 100`);
    if (!FIRST_PERSON.test(l.text)) errors.push(`${where}: journal lines are first person`);
    if (QUIET_WORDING.test(l.text) && !l.quiet) errors.push(`${where}: says the year was uneventful; mark it quiet: true so it never shares a year with other lines or an event`);
    // The engine finds a quiet line again by its text, to take it back from a year that filled up (settleQuietYear).
    if (l.quiet && /\{\{/.test(l.text)) errors.push(`${where}: a quiet line has no placeholders (the engine finds it again by its text)`);
    for (const issue of [...textIssues(l.text), ...placeholderIssues(l.text), ...conditionIssues(l.conditions)]) errors.push(`${where}: ${issue}`);
    if (PERSON_PLACEHOLDER.test(l.text) && !l.person) errors.push(`${where}: uses person placeholders but has no person selector`);
    if (l.person && !l.person.kind.length) errors.push(`${where}: person selector lists no kind`);
    for (const g of l.groups ?? []) if (!g.kind.length || !(g.atLeast >= 1)) errors.push(`${where}: a group needs a kind and atLeast >= 1`);
    // A child does not say "my parents" (one may be dead, or a foster parent at home): {{parents}} renders whoever is there.
    if (l.minAge < 18 && /\b(my|our) parents\b/i.test(l.text)) errors.push(`${where}: says "my parents" in a line open to children; use {{parents}} (renders "Mom and Dad", "Mom", "Dad and Maria" or "my family")`);
    for (const w of FAMILY_WORDS) {
      if (!w.re.test(l.text) || guaranteed(l, w.kind, w.gender) >= w.min) continue;
      const fix = w.min > 1 ? `groups: [{ kind: ['${w.kind}'], atLeast: ${w.min} }]` : `person: { kind: ['${w.kind}']${w.gender ? `, gender: '${w.gender}'` : ''} }`;
      errors.push(`${where}: names ${w.what} but does not require ${w.min > 1 ? `${w.min} living ones` : 'a living one'} (${fix})`);
    }
    if (writtenForPrison(l.conditions) && l.minAge < 18 && CLASSROOM_WORDS.test(l.text) && !(l.conditions ?? []).some((c) => 'enrolled' in c && c.enrolled)) {
      errors.push(`${where}: a classroom line behind bars needs { enrolled: true } (a dropout does no homework)`);
    }
    for (const issue of speciesIssues(l.person)) errors.push(`${where}: ${issue}`);
    for (const k of ['mother', 'father'] as const) {
      const required = (l.conditions ?? []).some((c) => 'hasPerson' in c && c.hasPerson.length === 1 && c.hasPerson[0] === k);
      if (l.text.includes(`{{${k}}}`) && !required) errors.push(`${where}: uses {{${k}}} but does not require a living ${k} ({ hasPerson: ['${k}'] })`);
    }
  }
  return errors;
}
