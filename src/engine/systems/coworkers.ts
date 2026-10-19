/**
 * Coworkers (GAME_DESIGN §10): a full-time hire brings two or three of them, linked to that job. When the job
 * ends, the ones the player grew close to (relationship 70+) stay on as friends and the rest drop out of the
 * player's life. Pure: randomness comes from the Rng passed in.
 */
import { JOB_BY_ID } from '@/data/jobs';
import type { Rng } from '../rng';
import type { GameState, Job, Person } from '../types';
import { log } from '../util';
import { makePerson, randomName } from './character';

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

/** Two or three new coworkers for the job just taken: adults near the player's age, on the same career ladder. */
export function hireCoworkers(state: GameState, rng: Rng): GameState {
  const job = state.career.job;
  if (!job || job.partTime) return state;
  const def = JOB_BY_ID[job.defId];
  const me = state.character;
  const people = { ...state.people };
  const count = rng.int(2, 3);
  for (let i = 0; i < count; i++) {
    const age = Math.max(18, Math.min(70, me.age + rng.int(-6, 8)));
    const title = def ? def.ladder[rng.int(0, Math.min(def.ladder.length - 1, job.level + 1))]!.title : job.title;
    const p = makePerson(rng, { kind: 'coworker', age, countryCode: me.countryCode, playerAge: me.age, relationship: rng.int(35, 60), occupation: title });
    // A first name nobody in my life has yet (a coworker called Willow beside a wife called Willow reads as one person).
    const taken = new Set([me.firstName, ...Object.values(people).map((x) => x.firstName)]);
    for (let n = 0; n < 8 && taken.has(p.firstName); n++) p.firstName = randomName(rng, p.gender, me.countryCode).firstName;
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
    const unlinked: Person = { ...p };
    delete unlinked.workplace;
    if (p.alive && p.relationship >= COWORKER_FRIEND_AT) {
      people[p.id] = { ...unlinked, kind: 'friend' };
      const retired = last?.reason === 'retired' && last.company === workplace?.company;
      lines.push(
        s.crime.inPrison
          ? `My old coworker ${p.firstName} kept writing to me in prison.`
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
