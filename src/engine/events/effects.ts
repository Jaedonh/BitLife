import { hadOnceIllness, illnessHadFlag, ILLNESS_BY_ID } from '@/data/illnesses';
import type { Rng } from '../rng';
import { onNpcDeath } from '../systems/aging';
import { promoteNow, switchEmployer } from '../systems/careers';
import { relocateCity, settleDistances } from '../systems/scenarios';
import { familySurnames, friendAgeRange, makePerson, namesInJournalThisYear, namesInLife, occupationMinAge } from '../systems/character';
import { coworkerTitle, workplaceOf } from '../systems/coworkers';
import { markChildMilestone } from '../systems/family';
import { payForMinor } from '../systems/guardians';
import { onParole, revokeParole, settleParole, settleTrial, stayLength, verdictNote } from '../systems/justice';
import { markDeath } from '../systems/death';
import { ADULT_AGE, clampRange, griefFactor, markBereaved, partnerAgeRange, partnerGender, tooSoonLine } from '../systems/romance';
import type { GameState, Illness, JobHistoryEntry, Person } from '../types';
import { addKarma, addMoney, addStats, bump, clampStat, clearCoupleFlags, incFlag, log, setFlag, withFame } from '../util';
import { settleHomeWithParents } from './conditions';
import { MET_FAR_AWAY_KINDS, type Effect } from './schema';
import { renderText, scaleMoney, type TextContext } from './text';

export interface EffectContext extends TextContext {
  /** Re-resolved after person mutations. */
  personId?: string;
  /**
   * First names that stay taken for the whole effects list (namesInLife when it began): someone a choice removes
   * (a friend who moves away and drifts off) is not replaced in the same choice by a newPerson of the same name.
   */
  reservedNames?: ReadonlySet<string>;
}

function currentPerson(state: GameState, ctx: EffectContext): Person | undefined {
  return ctx.personId ? state.people[ctx.personId] : undefined;
}

export function updatePerson(state: GameState, id: string, patch: Partial<Person>): GameState {
  const p = state.people[id];
  if (!p) return state;
  return { ...state, people: { ...state.people, [id]: { ...p, ...patch } } };
}

export function adjustRelationship(state: GameState, id: string, delta: number): GameState {
  const p = state.people[id];
  if (!p) return state;
  return updatePerson(state, id, { relationship: clampStat(p.relationship + delta) });
}

/**
 * The player was with this person this year: an interaction, or an event card about them. It ends any silence
 * ("You haven't spoken in 5 years") and spares them this year's neglect decay (aging.ts).
 */
export function markContact(state: GameState, id: string): GameState {
  const p = state.people[id];
  if (!p?.alive) return state;
  const age = state.character.age;
  if (p.memory.lastInteractionAge === age && p.memory.yearsNeglected === 0) return state;
  return updatePerson(state, id, { memory: { ...p.memory, lastInteractionAge: age, yearsNeglected: 0 } });
}

export function giveIllness(state: GameState, defId: string): GameState {
  if (state.health.illnesses.some((i) => i.defId === defId)) return state;
  const def = ILLNESS_BY_ID[defId];
  // A once-a-life illness (an appendix) is had once: a second one is not given, and the first is remembered.
  if (def && hadOnceIllness(def, state.flags, {})) return state;
  const flags = def?.oncePerLife ? { ...state.flags, [illnessHadFlag(def.id)]: state.character.age } : state.flags;
  const ill: Illness = def
    ? { defId, name: def.name, severity: def.severity, chronic: def.chronic, yearsLeft: def.chronic ? -1 : def.duration, treated: false }
    : { defId, name: defId.replace(/_/g, ' '), severity: 2, chronic: false, yearsLeft: 1, treated: false };
  let s: GameState = { ...state, flags, health: { ...state.health, illnesses: [...state.health.illnesses, ill] } };
  s = bump(s, 'illnesses');
  return s;
}

export function removeJob(state: GameState, reason: JobHistoryEntry['reason']): GameState {
  const job = state.career.job;
  if (!job) return state;
  const entry = { title: job.title, company: job.company, defId: job.defId, fromAge: state.character.age - job.yearsHeld, toAge: state.character.age, salary: job.salary, reason };
  let s: GameState = { ...state, career: { ...state.career, job: null, history: [...state.career.history, entry] } };
  if (reason === 'fired') s = bump(s, 'firings');
  return s;
}

/**
 * Convicts the player. A sentence handed down while already inside is served after the time left, never instead
 * of it. Under 18 it means juvenile detention: at most two years in all, out by 18, and school carries on inside.
 * A conviction ends parole.
 */
export function sendToPrison(state: GameState, years: number): GameState {
  const sentence = Math.max(1, Math.round(years));
  const juvenile = state.character.age < 18;
  const prior = state.crime.inPrison ? state.crime.sentenceYearsLeft : 0;
  const left = stayLength(state, prior + sentence);
  const edu = state.education;
  const schoolGoesOn = juvenile && (edu.stage === 'primary' || edu.stage === 'middle' || edu.stage === 'high');
  // The work history says the sentence ended the job ("went to prison"), not that I moved on.
  let s = revokeParole(removeJob(state, 'prison'));
  s = {
    ...s,
    crime: {
      ...s.crime,
      record: true,
      arrests: s.crime.arrests + 1,
      convictions: s.crime.convictions + 1,
      inPrison: true,
      sentenceYearsLeft: left,
      sentenceYears: (s.crime.inPrison ? (s.crime.sentenceYears ?? prior) : 0) + left - prior,
      notoriety: clampStat(s.crime.notoriety + sentence * 3),
      ...(juvenile ? { juvenile: true } : {}),
    },
    education: schoolGoesOn ? edu : { ...edu, enrolled: false },
  };
  s = bump(s, 'arrests');
  // A cell ends living back home with my parents.
  return settleHomeWithParents(s);
}

/**
 * An event's money effect. Adults gain or pay it themselves (a shortfall becomes debt). Minors never go
 * into debt: a cost falls on their parents (see payForMinor), unless the choice has the child spend their
 * own savings (payer 'self'), which takes no more than the cash they have.
 */
export function applyEventMoney(state: GameState, amount: number, payer?: 'self' | 'family'): GameState {
  if (amount >= 0 || state.character.age >= 18) return addMoney(state, amount);
  if (payer === 'self') return addMoney(state, -Math.min(-amount, state.finances.cash));
  return payForMinor(state, -amount);
}

type NewPersonSpec = Extract<Effect, { newPerson: unknown }>['newPerson'];

/**
 * The surname a partner has once they marry the player: mine when they take it (`takes`, an even chance), keeping the
 * one they were born with as `birthLastName` (their brother or sister still carries it), else their own.
 */
export function takeSurname(person: Pick<Person, 'lastName' | 'birthLastName'>, takes: boolean, myLastName: string): Partial<Person> {
  if (!takes || person.lastName === myLastName) return { lastName: person.lastName };
  return { lastName: myLastName, birthLastName: person.birthLastName ?? person.lastName };
}

/** The player's current partner: a living spouse, else a living lover. */
function currentPartner(state: GameState): Person | undefined {
  const living = Object.values(state.people).filter((p) => p.alive);
  return living.find((p) => p.kind === 'spouse') ?? living.find((p) => p.kind === 'lover');
}

/** Only grief keeps this new partner out: the player is old enough and free, but lost a partner this year. */
function griefBlocks(state: GameState, np: NewPersonSpec): boolean {
  return (np.kind === 'lover' || np.kind === 'spouse') && !state.crime.inPrison && !!partnerAgeRange(state.character.age) && griefFactor(state) === 0;
}

/**
 * The age range for a person an event introduces, or null when nobody of that kind can join the life now.
 * Partners follow the legal-age band (romance.ts), and none joins the life in prison or in the year of losing one.
 * A step-parent is about the age of the parent they marry, and always at least 16 years older than the player.
 * Content ranges are kept where they fit those bands. Without one the person is about my age (four years either
 * way); a card that gives only `minAge` (or only `maxAge`) sets a floor (or a ceiling) on that, so "minAge: 18" for a
 * grown-up stranger does not make a 70-year-old's new friend anyone from 18 up.
 */
function newPersonAgeRange(state: GameState, np: NewPersonSpec, bound: Person | undefined): [number, number] | null {
  const me = state.character.age;
  const near: [number, number] = [Math.max(1, me - 4), me + 4];
  const range: [number, number] =
    np.minAge !== undefined && np.maxAge !== undefined
      ? [np.minAge, np.maxAge]
      : np.minAge !== undefined
        ? [Math.max(np.minAge, near[0]), Math.max(np.minAge, near[1])]
        : np.maxAge !== undefined
          ? [Math.min(np.maxAge, near[0]), Math.min(np.maxAge, near[1])]
          : near;
  if (np.kind === 'lover' || np.kind === 'spouse') {
    const band = state.crime.inPrison || griefFactor(state) === 0 ? null : partnerAgeRange(me);
    return band && clampRange(range, band);
  }
  if (np.kind === 'stepfather' || np.kind === 'stepmother') {
    const parentKind = np.kind === 'stepfather' ? 'mother' : 'father';
    const parent = bound?.kind === parentKind ? bound : Object.values(state.people).find((p) => p.kind === parentKind && p.alive);
    const floor = Math.max(18, me + 16);
    const lo = Math.max(floor, parent ? parent.age - 10 : floor);
    return clampRange(range, [lo, Math.max(lo, Math.min(95, parent ? parent.age + 10 : lo + 25))]);
  }
  // A child's friends and classmates are children close to their age (as in relationships.ts), unless the card
  // asks for a grown-up ("the man I saved").
  if ((np.kind === 'friend' || np.kind === 'bestFriend' || np.kind === 'classmate') && me < ADULT_AGE && range[0] < ADULT_AGE) {
    return clampRange(range, friendAgeRange(me));
  }
  // Someone the card gives a job ("the mechanic") is old enough to hold it when I am grown up myself (a child's new
  // friends stay children, and students, as above).
  if (np.occupation && np.kind !== 'coworker') {
    const floor = occupationMinAge(np.occupation);
    return [Math.max(range[0], floor), Math.max(range[1], floor)];
  }
  // A coworker is old enough for the job: an adult beside a full-time one, 14+ (the youngest age with a job) beside a teen one.
  if (np.kind === 'coworker') {
    const floor = state.career.job?.partTime === false ? 18 : 14;
    return clampRange(range, [floor, Math.max(floor, range[1])]);
  }
  return range;
}

/** Applies a list of effects in order. Pure except for `rng`, whose state the caller must persist. */
export function applyEffects(state: GameState, rng: Rng, effects: readonly Effect[], context: EffectContext = {}): GameState {
  let s = state;
  // Names in the life when the list began stay taken to its end (nested lists share them).
  const ctx = context.reservedNames ? context : { ...context, reservedNames: namesInLife(state) };
  for (const e of effects) {
    if (!s.alive) break;
    s = applyEffect(s, rng, e, ctx);
  }
  // A card about someone is time spent with them, whatever the choice.
  if (ctx.personId) s = markContact(s, ctx.personId);
  // A sentence in this list: after the event's own verdict line, say how parole or juvenile court changed it.
  const jail = effects.find((e) => 'prison' in e);
  return jail && 'prison' in jail ? verdictNote(state, s, jail.prison) : s;
}

export function applyEffect(state: GameState, rng: Rng, e: Effect, ctx: EffectContext): GameState {
  let s = state;
  const person = currentPerson(s, ctx);
  const textCtx: TextContext = { person, vars: ctx.vars };

  if ('stat' in e) return addStats(s, { [e.stat]: e.delta });
  if ('stats' in e) return addStats(s, e.stats);
  if ('money' in e) return applyEventMoney(s, scaleMoney(s, e.money), e.payer);
  if ('karma' in e) return addKarma(s, e.karma);
  if ('fame' in e) return withFame(s, s.character.fame + e.fame);
  if ('energy' in e) return { ...s, character: { ...s.character, energy: Math.max(0, Math.min(s.character.energyMax, s.character.energy + e.energy)) } };
  if ('log' in e) return log(s, renderText(e.log, s, textCtx), e.kind ?? 'info');
  if ('flag' in e) {
    if (e.inc !== undefined) return incFlag(s, e.flag, e.inc);
    return setFlag(s, e.flag, e.set ?? true);
  }
  if ('relationship' in e) {
    if (e.relationship === 'person') return person ? adjustRelationship(s, person.id, e.delta) : s;
    // Everyone of that kind the moment touches: people nearby, not friends or grandparents far away.
    for (const p of Object.values(s.people)) if (p.kind === e.relationship && p.alive && !p.farAway) s = adjustRelationship(s, p.id, e.delta);
    return s;
  }
  if ('love' in e) {
    if (!person || person.love === undefined) return s;
    return updatePerson(s, person.id, { love: clampStat(person.love + e.love) });
  }
  if ('coworkerLeaves' in e) {
    if (!person || person.kind !== 'coworker') return s;
    if (person.alive && person.relationship >= 50) {
      const friend: Person = { ...person, kind: 'friend' };
      delete friend.workplace;
      return { ...s, people: { ...s.people, [person.id]: friend } };
    }
    const people = { ...s.people };
    delete people[person.id];
    return { ...s, people };
  }
  if ('removePerson' in e) {
    if (!person) return s;
    // A partner who leaves becomes an ex, and the couple's flags go with them (as with a break-up), so the next partner
    // is not taken to be engaged to me or living with me.
    if (person.kind === 'lover' || person.kind === 'spouse') return clearCoupleFlags(updatePerson(s, person.id, { kind: 'ex', love: 0 }));
    const people = { ...s.people };
    delete people[person.id];
    return { ...s, people };
  }
  if ('marry' in e) {
    if (!person?.alive || person.kind !== 'lover' || person.age < ADULT_AGE || state.character.age < ADULT_AGE || state.crime.inPrison) return s;
    s = updatePerson(s, person.id, { kind: 'spouse', marriedAtAge: s.character.age, ...takeSurname(person, rng.chance(0.5), s.character.lastName) });
    // A partner married from a long-distance relationship (left behind by a move) comes to live with me.
    return settleDistances(clearCoupleFlags(bump(s, 'marriages'), ['lf_living_together']));
  }
  if ('personDies' in e) {
    if (!person?.alive) return s;
    // Inheritance and orphan care as for a natural death; the event's own lines announce and grieve it.
    const dead: Person = { ...person, alive: false, deathAge: person.age, deathCause: e.cause ?? 'natural causes', lostAtAge: s.character.age };
    s = onNpcDeath({ ...s, people: { ...s.people, [dead.id]: dead } }, dead, rng, { announce: false });
    // Losing a partner starts the grief window (romance.ts): no new partner by chance for a while.
    return dead.kind === 'lover' || dead.kind === 'spouse' ? markBereaved(s, dead.id) : s;
  }
  if ('newPerson' in e) {
    const np = e.newPerson;
    let age: number;
    if (np.kind === 'child') age = 0;
    else if (np.kind === 'pet') age = rng.int(0, 3);
    else {
      const range = newPersonAgeRange(s, np, person);
      // No partner joins the life of someone under 16, in prison or just bereaved, whatever the content says. A date
      // the player chose in the year of a loss still gets its line: it was too soon.
      if (!range) return griefBlocks(s, np) ? log(s, tooSoonLine(s)) : s;
      age = rng.int(range[0], range[1]);
    }
    // A baby belongs to the partner the event is about, else to the player's current partner.
    const boundPartner = person?.alive && (person.kind === 'lover' || person.kind === 'spouse') ? person : undefined;
    const otherParent = np.kind === 'child' ? (boundPartner ?? currentPartner(s)) : undefined;
    // A coworker an event introduces holds a post on the player's own career ladder, like the ones a hire brings, one
    // that fits the age the card drew (a new hire of 25 is not the chief).
    const occupation = np.kind === 'coworker' && s.career.job ? coworkerTitle(rng, s.career.job, s, age) : np.occupation && age >= 18 ? np.occupation : undefined;
    // A partner a card brings follows the player's leaning, as the yearly roll does (romance.ts): one draw either way.
    const gender = np.gender ?? (np.kind === 'lover' || np.kind === 'spouse' ? partnerGender(rng, s) : undefined);
    const p = makePerson(rng, {
      kind: np.kind, age, countryCode: s.character.countryCode, playerAge: s.character.age, relationship: np.relationship ?? rng.int(45, 80), gender, species: np.species,
      // Nor a name this year's journal mentions: someone who left since the birthday is not met again under it.
      occupation, taken: new Set([...(ctx.reservedNames ?? []), ...namesInLife(s), ...namesInJournalThisYear(s)]),
      lastName: np.kind === 'child' || np.kind === 'sibling' ? s.character.lastName : undefined,
      // Anyone else a card brings in is not family: they get a surname of their own.
      avoidSurnames: familySurnames(s),
      // With a same-sex partner the child came by adoption or a donor, so it is not marked as the player's biological child.
      biological: np.kind === 'child' && otherParent?.gender !== s.character.gender ? true : undefined,
    });
    if (otherParent) p.otherParentId = otherParent.id;
    // A coworker an event introduces works with the player at their current job, and goes when it ends.
    if (np.kind === 'coworker' && s.career.job) p.workplace = workplaceOf(s.career.job);
    if (np.kind === 'lover' || np.kind === 'spouse') p.love = rng.int(50, 85);
    // Met far from home (a fellow traveler, a wedding guest from abroad): they live there, like a friend who moved away.
    if (np.farAway && MET_FAR_AWAY_KINDS.includes(np.kind)) p.farAway = true;
    s = { ...s, people: { ...s.people, [p.id]: p } };
    if (np.kind === 'friend') s = bump(s, 'friendsMade');
    if (np.kind === 'lover') s = bump(s, 'lovers');
    if (np.kind === 'child') s = bump(s, 'children');
    if (np.log) s = log(s, renderText(np.log, s, { person: p }), 'milestone');
    return s;
  }
  if ('death' in e) return markDeath(s, e.death);
  // On parole it counts double; applyEffects notes it after the event's own verdict.
  if ('prison' in e) return sendToPrison(s, onParole(s) ? e.prison * 2 : e.prison);
  if ('trial' in e) return settleTrial(s, rng, e.trial, ctx.vars ?? {}, sendToPrison);
  if ('paroleHearing' in e) return settleParole(s, rng, e.paroleHearing);
  if ('arrest' in e) return bump({ ...s, crime: { ...s.crime, record: true, arrests: s.crime.arrests + 1 } }, 'arrests');
  if ('illness' in e) return giveIllness(s, e.illness);
  if ('cureIllness' in e) return { ...s, health: { ...s.health, illnesses: s.health.illnesses.filter((i) => i.chronic) } };
  if ('addiction' in e) {
    const cur = s.health.addictions[e.addiction] ?? 0;
    const next = clampStat(cur + e.delta);
    const addictions = { ...s.health.addictions, [e.addiction]: next };
    if (next <= 0) delete addictions[e.addiction];
    return { ...s, health: { ...s.health, addictions } };
  }
  if ('injury' in e) {
    s = addStats(s, { health: -Math.abs(e.injury) });
    return { ...s, health: { ...s.health, injuries: s.health.injuries + 1 } };
  }
  if ('loseJob' in e) return removeJob(s, e.reason ?? 'fired');
  if ('switchEmployer' in e) return switchEmployer(s, rng, e.raise);
  if ('promotion' in e) return promoteNow(s, rng);
  if ('relocate' in e) return relocateCity(s, rng);
  if ('moveAway' in e) {
    const p = ctx.personId ? s.people[ctx.personId] : undefined;
    if (!p || !p.alive) return s;
    return { ...s, people: { ...s.people, [p.id]: { ...p, farAway: true } } };
  }
  if ('jobPerformance' in e) {
    if (!s.career.job) return s;
    return { ...s, career: { ...s.career, job: { ...s.career.job, performance: clampStat(s.career.job.performance + e.jobPerformance) } } };
  }
  if ('grade' in e) return { ...s, education: { ...s.education, grade: clampStat(s.education.grade + e.grade) } };
  if ('expelled' in e) return { ...s, education: { ...s.education, enrolled: false, expelled: true } };
  if ('queue' in e) return { ...s, eventQueue: [...s.eventQueue, { eventId: e.queue, context: {}, personId: ctx.personId }] };
  if ('counter' in e) return bump(s, e.counter, e.by ?? 1);
  if ('random' in e) {
    const outcome = rng.weighted(e.random, (o) => o.weight);
    return applyEffects(s, rng, outcome.effects, ctx);
  }
  if ('chance' in e) {
    const lucky = s.character.traits.includes('lucky') ? 0.05 : 0;
    return rng.chance(Math.min(1, e.chance + lucky)) ? applyEffects(s, rng, e.then, ctx) : applyEffects(s, rng, e.else ?? [], ctx);
  }
  if ('asset' in e) {
    const pool = s.assets.filter((a) => !e.kind || a.kind === e.kind);
    if (!pool.length) return s;
    const picked = rng.pick(pool);
    // A house a card damages or takes is the one I live in (a storm, a burst pipe, a fire at home), not one rented out.
    const target = e.kind === 'house' ? (pool.find((a) => a.primary && !a.rentedOut) ?? picked) : picked;
    if (e.asset === 'lose') {
      const assets = s.assets.filter((a) => a.id !== target.id);
      // As when a home is sold (assets.ts): the next house becomes the one I live in.
      const next = target.primary ? assets.find((a) => a.kind === 'house') : undefined;
      return { ...s, assets: next ? assets.map((a) => (a.id === next.id ? { ...a, primary: true, rentedOut: false } : a)) : assets };
    }
    const dmg = e.amount ?? 25;
    return {
      ...s,
      assets: s.assets.map((a) => (a.id === target.id ? { ...a, condition: clampStat(a.condition - dmg), value: Math.round(a.value * (1 - dmg / 200)) } : a)),
    };
  }
  if ('childMilestone' in e) return person ? markChildMilestone(s, rng, person.id, e.childMilestone, { namedAfterMe: e.namedAfterMe }) : s;
  if ('achievement' in e) return s.achievements.includes(e.achievement) ? s : { ...s, achievements: [...s.achievements, e.achievement] };
  return s;
}
