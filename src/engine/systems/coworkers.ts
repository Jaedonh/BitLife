/**
 * Coworkers (GAME_DESIGN §10): a full-time hire brings two or three of them, linked to that job. When the job
 * ends, the ones the player grew close to (relationship 70+) stay on as friends and the rest drop out of the
 * player's life. Pure: randomness comes from the Rng passed in.
 */
import { JOB_BY_ID, rungTitle, type JobDef } from '@/data/jobs';
import type { Rng } from '../rng';
import type { GameState, Job, Person } from '../types';
import { log } from '../util';
import { familySurnames, makePerson, namesInJournalThisYear, namesInLife, OLDEST_COWORKER, rungAgeBand } from './character';

/** Relationship at which a coworker stays a friend after the job ends. */
export const COWORKER_FRIEND_AT = 70;

/** The job a coworker shares with the player. */
export function workplaceOf(job: Pick<Job, 'defId' | 'company'>): { jobId: string; company: string } {
  return { jobId: job.defId, company: job.company };
}

/** Whether this coworker works with the player in their current job. */
export function worksWithMe(state: GameState, p: Person): boolean {
  const job = state.career.job;
  return !!job && !!p.workplace && p.workplace.jobId === job.defId && p.workplace.company === job.company;
}

/** The rungs a coworker can hold: the player's own ladder, up to one above theirs. */
function coworkerRungs(job: Pick<Job, 'level'>, def: JobDef): number[] {
  return Array.from({ length: Math.min(def.ladder.length - 1, job.level + 1) + 1 }, (_, i) => i);
}

/**
 * A coworker's title: a rung of the player's own career ladder, at most one above theirs, named as the player's own
 * rungs are for the country and the year (rungTitle: no Member of Parliament beside a US congressman, no food blogger
 * before 2004). Given the coworker's age, only a rung someone that old holds (rungAgeBand: no 62-year-old pharmacy
 * intern, no 19-year-old therapist), or the nearest one when none fits. One draw either way.
 */
export function coworkerTitle(rng: Rng, job: Pick<Job, 'defId' | 'level' | 'title'>, state: Pick<GameState, 'character' | 'year'>, age?: number): string {
  const def = JOB_BY_ID[job.defId];
  if (!def) return job.title;
  let rungs = coworkerRungs(job, def);
  if (age !== undefined) {
    const off = (r: number) => {
      const [lo, hi] = rungAgeBand(def, r);
      return age < lo ? lo - age : age > hi ? age - hi : 0;
    };
    const best = Math.min(...rungs.map(off));
    rungs = rungs.filter((r) => off(r) === best);
  }
  return rungTitle(def, rng.pick(rungs), { countryCode: state.character.countryCode, year: state.year });
}

/**
 * A new coworker's age for their rung (rungAgeBand): near the player's, within a few years, where the rung allows;
 * otherwise close to the edge of the rung's band (a young intern beside a 55-year-old one, a physician past medical
 * school beside a new one).
 */
function coworkerAge(rng: Rng, playerAge: number, band: readonly [number, number]): number {
  const [lo, hi] = band;
  const near = playerAge + rng.int(-6, 8);
  if (near >= lo && near <= hi) return near;
  return near < lo ? rng.int(lo, Math.min(hi, lo + 6)) : rng.int(Math.max(lo, hi - 8), hi);
}

/**
 * Two or three new coworkers for the job just taken (GAME_DESIGN §10a): on the same career ladder, up to a rung above
 * the player, each of an age for their rung and near the player's where it allows.
 */
export function hireCoworkers(state: GameState, rng: Rng): GameState {
  const job = state.career.job;
  if (!job || job.partTime) return state;
  const me = state.character;
  const def = JOB_BY_ID[job.defId];
  const people = { ...state.people };
  // First names nobody in my life has yet (a coworker called Willow beside a wife called Willow reads as one person),
  // nor anyone the journal mentions this year: the old job's Willow, left behind on a job change, is not hired again.
  const taken = new Set([...namesInLife(state), ...namesInJournalThisYear(state)]);
  // ...and a surname that is not the family's: a coworker is not a relative.
  const avoidSurnames = familySurnames(state);
  const count = rng.int(2, 3);
  for (let i = 0; i < count; i++) {
    const rung = def ? rng.pick(coworkerRungs(job, def)) : 0;
    const age = coworkerAge(rng, me.age, def ? rungAgeBand(def, rung) : [18, OLDEST_COWORKER]);
    const title = def ? rungTitle(def, rung, { countryCode: me.countryCode, year: state.year }) : job.title;
    const p = makePerson(rng, { kind: 'coworker', age, countryCode: me.countryCode, playerAge: me.age, relationship: rng.int(35, 60), occupation: title, taken, avoidSurnames });
    p.workplace = workplaceOf(job);
    people[p.id] = p;
  }
  return { ...state, people };
}

/**
 * Coworkers from a job the player no longer has: close ones become friends (with a line), the rest are gone.
 * Coworkers with no workplace (older saves) are left as they are. Runs after anything that can end a job, so
 * the line follows the one about leaving.
 */
export function settleCoworkers(state: GameState): GameState {
  const leaving = Object.values(state.people).filter((p) => p.kind === 'coworker' && p.workplace && !worksWithMe(state, p));
  if (!leaving.length) return state;
  let s: GameState = state;
  const people = { ...s.people };
  const lines: string[] = [];
  const last = s.career.history[s.career.history.length - 1];
  for (const p of leaving) {
    const workplace = p.workplace;
    // We worked side by side until now: a silence on their page counts from the last day (GAME_DESIGN §10).
    const unlinked: Person = p.alive ? { ...p, memory: { ...p.memory, togetherUntil: s.character.age } } : { ...p };
    delete unlinked.workplace;
    if (p.alive && p.relationship >= COWORKER_FRIEND_AT) {
      people[p.id] = { ...unlinked, kind: 'friend' };
      const retired = last?.reason === 'retired' && last.company === workplace?.company;
      lines.push(
        s.crime.inPrison
          ? `My old coworker ${p.firstName} kept writing to me in ${s.crime.juvenile ? 'detention' : 'prison'}.`
          : retired
            ? `Even after I retired, ${p.firstName} and I stayed friends.`
            : `Even after I left ${workplace?.company ?? 'that job'}, ${p.firstName} and I stayed friends.`,
      );
    } else if (p.alive) {
      delete people[p.id];
    } else {
      // A coworker who died stays in memory, just no longer tied to a job.
      people[p.id] = unlinked;
    }
  }
  s = { ...s, people };
  for (const line of lines) s = log(s, line, 'good');
  return s;
}
