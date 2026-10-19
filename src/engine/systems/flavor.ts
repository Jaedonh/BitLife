import { FLAVOR, type FlavorLine } from '@/data/flavor';
import { candidatesFor, evaluateAll } from '../events/conditions';
import { conditionIssues, placeholderIssues, textIssues, type Condition } from '../events/schema';
import { renderText } from '../events/text';
import { Rng } from '../rng';
import type { GameState, Person } from '../types';
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

/** A line with conditions or a bound person describes a situation; the rest are generic age lines. */
export function isSituational(line: FlavorLine): boolean {
  return !!(line.conditions?.length || line.person);
}

/** Written for prison: requires { inPrison: true } (at the top level or inside `all`), as for events. */
function writtenForPrison(conditions: readonly Condition[] | undefined): boolean {
  return (conditions ?? []).some((c) => ('inPrison' in c && c.inPrison) || ('all' in c && writtenForPrison(c.all)));
}

/** People the line could be about: they fit its selector now and already held that place at the start of the year. */
export function flavorCandidates(line: FlavorLine, start: GameState, now: GameState): Person[] {
  if (!line.person) return [];
  return candidatesFor(now, line.person).filter((p) => {
    const before = start.people[p.id];
    return !!before && before.alive && before.kind === p.kind;
  });
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
 * The year's flavor line. A quiet year (no other journal lines) always gets one, so no year is empty; it is drawn from
 * the generic age lines and every situational line whose situation holds, situational ones weighted 3x. A busy year
 * sometimes gets a situational line too, unless it brought grave news. Lines marked `quiet` ("nothing happened") are
 * only written in a year with no other lines and no event card. No line repeats within ten years; a quiet year with
 * every candidate used recently takes the one written longest ago.
 */
export function yearlyFlavor(now: GameState, year: FlavorYear, lines: readonly FlavorLine[] = FLAVOR): GameState {
  const { start } = year;
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
    for (const issue of [...textIssues(l.text), ...placeholderIssues(l.text), ...conditionIssues(l.conditions)]) errors.push(`${where}: ${issue}`);
    if (PERSON_PLACEHOLDER.test(l.text) && !l.person) errors.push(`${where}: uses person placeholders but has no person selector`);
    if (l.person && !l.person.kind.length) errors.push(`${where}: person selector lists no kind`);
    for (const k of ['mother', 'father'] as const) {
      const required = (l.conditions ?? []).some((c) => 'hasPerson' in c && c.hasPerson.length === 1 && c.hasPerson[0] === k);
      if (l.text.includes(`{{${k}}}`) && !required) errors.push(`${where}: uses {{${k}}} but does not require a living ${k} ({ hasPerson: ['${k}'] })`);
    }
  }
  return errors;
}
