import { DEBT_CALLS } from '@/engine/systems/finance';
import { upgradeJusticeState } from '@/engine/systems/justice';
import { SCHEMA_VERSION, STAT_IDS, type GameState } from '@/engine/types';
import { capitalize } from '@/engine/util';

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const arrayOf = (v: unknown, ok: (x: unknown) => boolean): boolean => Array.isArray(v) && v.every(ok);
const recordOf = (v: unknown, ok: (x: unknown) => boolean): boolean => isRec(v) && Object.values(v).every(ok);
const nullOr = (v: unknown, ok: (x: unknown) => boolean): boolean => v == null || ok(v);

const isDeath = (d: unknown): boolean => isRec(d) && isStr(d.cause) && isStr(d.ribbonId) && isNum(d.netWorth) && isStr(d.obituary) && isStr(d.epitaph);

/**
 * Structural check of a save. Every field the screens or the engine dereference
 * without a guard must be present with the right type, so a save edited outside
 * the app (backup tools, web localStorage) is discarded on load instead of
 * crashing the app at every launch.
 */
function isGameStateShape(s: Rec): boolean {
  const c = s.character;
  if (!isRec(c) || !isStr(c.id) || !isStr(c.firstName) || !isStr(c.lastName) || !isStr(c.countryCode)) return false;
  if (!isNum(c.age) || c.age < 0 || c.age > 130 || !isNum(c.birthYear)) return false;
  const stats = c.stats;
  if (!isRec(stats) || !STAT_IDS.every((k) => isNum(stats[k]))) return false;
  if (!isRec(c.potential) || !arrayOf(c.traits, isStr) || !isNum(c.karma) || !isNum(c.fame) || !isNum(c.energy) || !isNum(c.energyMax)) return false;
  // Starting scenarios (S2) are optional: saves from before them, and heirs, have none.
  if (!nullOr(c.scenario, isStr) || !nullOr(c.moveAbroad, (m) => isRec(m) && isNum(m.age) && isStr(m.countryCode))) return false;
  for (const k of ['seed', 'createdAt', 'updatedAt', 'year', 'generation'] as const) if (!isNum(s[k])) return false;
  if (!isRec(s.rng) || !isNum(s.rng.s) || !isBool(s.alive)) return false;
  const e = s.education;
  if (!isRec(e) || !isStr(e.stage) || !isBool(e.enrolled) || !isNum(e.grade) || !arrayOf(e.degrees, isStr) || !isNum(e.studentDebt)) return false;
  // Parents paying tuition is optional (saves from before it have none).
  if (!nullOr(e.parentsPay, isBool)) return false;
  const career = s.career;
  if (!isRec(career) || !nullOr(career.job, (j) => isRec(j) && isStr(j.title) && isNum(j.salary)) || !arrayOf(career.history, isRec) || !arrayOf(career.listings, isRec)) return false;
  if (!isRec(career.experience) || !nullOr(career.hustle, isRec) || !isNum(career.totalYearsWorked) || !isBool(career.retired)) return false;
  const f = s.finances;
  if (!isRec(f) || !isNum(f.cash) || !isNum(f.debt) || !arrayOf(f.investments, isRec) || !isRec(f.lastYear) || !isNum(f.incomeBoostYears) || !isBool(f.bankrupt)) return false;
  const h = s.health;
  if (!isRec(h) || !arrayOf(h.illnesses, isRec) || !isRec(h.addictions) || !isNum(h.criticalYears)) return false;
  const cr = s.crime;
  if (!isRec(cr) || !isBool(cr.inPrison) || !isNum(cr.sentenceYearsLeft) || !isNum(cr.notoriety)) return false;
  // Juvenile court and parole fields are optional (older saves have none of them).
  if (!nullOr(cr.juvenile, isBool) || !nullOr(cr.sentenceYears, isNum) || !nullOr(cr.paroleYearsLeft, isNum) || !nullOr(cr.sealedConvictions, isNum)) return false;
  if (!nullOr(cr.lastRelease, (r) => isRec(r) && isNum(r.age) && isBool(r.juvenile))) return false;
  if (!recordOf(s.people, (p) => isRec(p) && isStr(p.id) && isStr(p.firstName) && isStr(p.kind) && isBool(p.alive) && isNum(p.age) && isNum(p.relationship))) return false;
  // Family links and children's milestones (S1) are optional: saves from before them simply have none.
  if (!recordOf(s.people, (p) => isRec(p) && nullOr(p.viaId, isStr) && nullOr(p.growth, isRec) && nullOr(p.workplace, (w) => isRec(w) && isStr(w.jobId) && isStr(w.company)))) return false;
  if (!recordOf(s.people, (p) => isRec(p) && nullOr(p.foster, isBool))) return false;
  // A relative who took the player in and people left behind by a move abroad are optional too (older saves have neither).
  if (!recordOf(s.people, (p) => isRec(p) && nullOr(p.relative, isBool) && nullOr(p.farAway, isBool))) return false;
  if (!recordOf(s.people, (p) => isRec(p) && nullOr(p.mourned, isBool))) return false;
  if (!arrayOf(s.assets, (a) => isRec(a) && isStr(a.id) && isNum(a.value))) return false;
  if (!arrayOf(s.log, (l) => isRec(l) && isStr(l.text) && isStr(l.kind) && isNum(l.age))) return false;
  if (!arrayOf(s.eventQueue, (q) => isRec(q) && isStr(q.eventId))) return false;
  if (!isRec(s.flags) || !isRec(s.firedEvents) || !isRec(s.actionsThisYear) || !recordOf(s.counters, isNum)) return false;
  if (!arrayOf(s.ancestors, isRec) || !arrayOf(s.achievements, isStr)) return false;
  if (!nullOr(s.pendingEvent, (p) => isRec(p) && isStr(p.eventId) && isStr(p.title) && isStr(p.text) && isRec(p.context) && arrayOf(p.choices, (ch) => isRec(ch) && isStr(ch.id) && isStr(ch.label)))) return false;
  if (!nullOr(s.death, isDeath)) return false;
  // The tombstone screen renders `death` for every finished life.
  if (!s.alive && !isDeath(s.death)) return false;
  if (!nullOr(s.lastResult, (r) => isRec(r) && isStr(r.text) && isStr(r.kind))) return false;
  return true;
}

/**
 * Older saves recorded two things wrongly, and both can be read back from the journal:
 * - a yearly layoff was stored as a firing (history 'fired', +1 `firings`): its line names the company and the year;
 * - a wealthy family paying tuition set `scholarship`: a real scholarship always wrote "I won a full scholarship".
 * Each repair changes what it matched, so loading the same save again changes nothing.
 */
function repairCareerAndSchool(state: GameState): GameState {
  let s = state;
  const layoffs = new Set(s.log.filter((l) => l.kind === 'bad' && (/ made cutbacks and I was laid off\.$/.test(l.text) || l.text === 'The Army cut its numbers and I was discharged.')).map((l) => `${l.age}|${l.text}`));
  if (layoffs.size && s.career.history.some((h) => h.reason === 'fired')) {
    let fixed = 0;
    const history = s.career.history.map((h) => {
      const line = h.company === 'the Army' ? 'The Army cut its numbers and I was discharged.' : `${capitalize(h.company)} made cutbacks and I was laid off.`;
      if (h.reason !== 'fired' || !layoffs.has(`${h.toAge}|${line}`)) return h;
      fixed++;
      return { ...h, reason: 'laidOff' as const };
    });
    if (fixed) s = { ...s, career: { ...s.career, history }, counters: { ...s.counters, firings: Math.max(0, s.counters.firings - fixed) } };
  }
  const e = s.education;
  if (e.scholarship && e.parentsPay === undefined && s.flags.wealthyFamily === true && !s.log.some((l) => l.text.startsWith('I won a full scholarship'))) {
    s = { ...s, education: { ...e, scholarship: false, parentsPay: true } };
  }
  return s;
}

/** The line older saves wrote every year of collections. */
const OLD_DEBT_CALLS_LINE = 'Debt collectors are calling. I have no income and the interest keeps piling up.';

/**
 * A save from before the debt-collector line was throttled may be in the middle of collections: it carries on
 * from its last old line (a reminder only after `DEBT_CALLS.every` years, "again" for a new stretch) instead of
 * announcing the calls as if they had just started. Once the flags exist this changes nothing.
 */
function carryDebtCalls(state: GameState): GameState {
  const f = DEBT_CALLS.flags;
  if (state.flags[f.line] !== undefined) return state;
  let last: number | null = null;
  for (const l of state.log) if (l.text === OLD_DEBT_CALLS_LINE) last = l.age;
  if (last === null) return state;
  return { ...state, flags: { ...state.flags, [f.held]: last, [f.line]: last, [f.stretches]: 1 } };
}

/**
 * Upgrades a persisted GameState from an older schema. Returns null when the
 * save cannot be understood (the caller then discards it rather than crashing).
 */
export function migrateSave(raw: unknown): GameState | null {
  if (!isRec(raw) || typeof raw.schemaVersion !== 'number') return null;
  let s: Rec = raw;
  // Future migrations go here, e.g. if (s.schemaVersion === 1) { ...; s = { ...s, schemaVersion: 2 }; }
  if (s.schemaVersion !== SCHEMA_VERSION) return null;
  if (!isGameStateShape(s)) return null;
  // Optional memory of recent flavor lines: saves from before it have none, and a mangled one is just forgotten.
  if (s.flavorSeen !== undefined && !recordOf(s.flavorSeen, isNum)) {
    s = { ...s };
    delete s.flavorSeen;
  }
  // The grief window (romance.ts) starts when a partner's death is first counted. A save from before it has
  // partners who died long ago and were never counted: they count as mourned, so loading starts no window.
  const people = s.people as Record<string, Rec>;
  const unmourned = (p: Rec) => p.alive === false && (p.kind === 'lover' || p.kind === 'spouse') && p.mourned === undefined;
  if (Object.values(people).some(unmourned)) {
    s = { ...s, people: Object.fromEntries(Object.entries(people).map(([id, p]) => [id, unmourned(p) ? { ...p, mourned: true } : p])) };
  }
  return carryDebtCalls(repairCareerAndSchool(upgradeJusticeState(s as unknown as GameState)));
}
