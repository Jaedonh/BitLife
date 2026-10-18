import { ILLNESS_BY_ID } from '@/data/illnesses';
import type { Rng } from '../rng';
import { makePerson } from '../systems/character';
import { markDeath } from '../systems/death';
import { clampRange, partnerAgeRange } from '../systems/romance';
import type { GameState, Illness, Person } from '../types';
import { addKarma, addMoney, addStats, bump, clampStat, incFlag, log, setFlag, withFame } from '../util';
import type { Effect } from './schema';
import { renderText, scaleMoney, type TextContext } from './text';

export interface EffectContext extends TextContext {
  /** Re-resolved after person mutations. */
  personId?: string;
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

export function giveIllness(state: GameState, defId: string): GameState {
  if (state.health.illnesses.some((i) => i.defId === defId)) return state;
  const def = ILLNESS_BY_ID[defId];
  const ill: Illness = def
    ? { defId, name: def.name, severity: def.severity, chronic: def.chronic, yearsLeft: def.chronic ? -1 : def.duration, treated: false }
    : { defId, name: defId.replace(/_/g, ' '), severity: 2, chronic: false, yearsLeft: 1, treated: false };
  let s: GameState = { ...state, health: { ...state.health, illnesses: [...state.health.illnesses, ill] } };
  s = bump(s, 'illnesses');
  return s;
}

export function removeJob(state: GameState, reason: 'quit' | 'fired' | 'promoted' | 'retired' | 'left'): GameState {
  const job = state.career.job;
  if (!job) return state;
  const entry = { title: job.title, company: job.company, fromAge: state.character.age - job.yearsHeld, toAge: state.character.age, salary: job.salary, reason };
  let s: GameState = { ...state, career: { ...state.career, job: null, history: [...state.career.history, entry] } };
  if (reason === 'fired') s = bump(s, 'firings');
  return s;
}

export function sendToPrison(state: GameState, years: number): GameState {
  let s = removeJob(state, 'left');
  s = {
    ...s,
    crime: {
      ...s.crime,
      record: true,
      arrests: s.crime.arrests + 1,
      convictions: s.crime.convictions + 1,
      inPrison: true,
      sentenceYearsLeft: Math.max(1, Math.round(years)),
      notoriety: clampStat(s.crime.notoriety + years * 3),
    },
    education: { ...s.education, enrolled: false },
  };
  s = bump(s, 'arrests');
  return s;
}

type NewPersonSpec = Extract<Effect, { newPerson: unknown }>['newPerson'];

/** The player's current partner: a living spouse, else a living lover. */
function currentPartner(state: GameState): Person | undefined {
  const living = Object.values(state.people).filter((p) => p.alive);
  return living.find((p) => p.kind === 'spouse') ?? living.find((p) => p.kind === 'lover');
}

/**
 * The age range for a person an event introduces, or null when nobody of that kind can join the life now.
 * Partners follow the legal-age band (romance.ts). A step-parent is about the age of the parent they marry,
 * and always at least 16 years older than the player. Content ranges are kept where they fit those bands.
 */
function newPersonAgeRange(state: GameState, np: NewPersonSpec, bound: Person | undefined): [number, number] | null {
  const me = state.character.age;
  const range: [number, number] = [np.minAge ?? Math.max(1, me - 4), np.maxAge ?? me + 4];
  if (np.kind === 'lover' || np.kind === 'spouse') {
    const band = state.crime.inPrison ? null : partnerAgeRange(me);
    return band && clampRange(range, band);
  }
  if (np.kind === 'stepfather' || np.kind === 'stepmother') {
    const parentKind = np.kind === 'stepfather' ? 'mother' : 'father';
    const parent = bound?.kind === parentKind ? bound : Object.values(state.people).find((p) => p.kind === parentKind && p.alive);
    const floor = Math.max(18, me + 16);
    const lo = Math.max(floor, parent ? parent.age - 10 : floor);
    return clampRange(range, [lo, Math.max(lo, Math.min(95, parent ? parent.age + 10 : lo + 25))]);
  }
  return range;
}

/** Applies a list of effects in order. Pure except for `rng`, whose state the caller must persist. */
export function applyEffects(state: GameState, rng: Rng, effects: readonly Effect[], ctx: EffectContext = {}): GameState {
  let s = state;
  for (const e of effects) {
    if (!s.alive) break;
    s = applyEffect(s, rng, e, ctx);
  }
  return s;
}

export function applyEffect(state: GameState, rng: Rng, e: Effect, ctx: EffectContext): GameState {
  let s = state;
  const person = currentPerson(s, ctx);
  const textCtx: TextContext = { person };

  if ('stat' in e) return addStats(s, { [e.stat]: e.delta });
  if ('stats' in e) return addStats(s, e.stats);
  if ('money' in e) return addMoney(s, scaleMoney(s, e.money));
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
    for (const p of Object.values(s.people)) if (p.kind === e.relationship && p.alive) s = adjustRelationship(s, p.id, e.delta);
    return s;
  }
  if ('love' in e) {
    if (!person || person.love === undefined) return s;
    return updatePerson(s, person.id, { love: clampStat(person.love + e.love) });
  }
  if ('removePerson' in e) {
    if (!person) return s;
    if (person.kind === 'lover' || person.kind === 'spouse') return updatePerson(s, person.id, { kind: 'ex', love: 0 });
    const people = { ...s.people };
    delete people[person.id];
    return { ...s, people };
  }
  if ('personDies' in e) {
    if (!person) return s;
    return updatePerson(s, person.id, { alive: false, deathAge: person.age, deathCause: e.cause ?? 'natural causes' });
  }
  if ('newPerson' in e) {
    const np = e.newPerson;
    let age: number;
    if (np.kind === 'child') age = 0;
    else if (np.kind === 'pet') age = rng.int(0, 3);
    else {
      const range = newPersonAgeRange(s, np, person);
      // No partner joins the life of someone under 16 or in prison, whatever the content says.
      if (!range) return s;
      age = rng.int(range[0], range[1]);
    }
    // A baby belongs to the partner the event is about, else to the player's current partner.
    const boundPartner = person?.alive && (person.kind === 'lover' || person.kind === 'spouse') ? person : undefined;
    const otherParent = np.kind === 'child' ? (boundPartner ?? currentPartner(s)) : undefined;
    const p = makePerson(rng, {
      kind: np.kind, age, countryCode: s.character.countryCode, playerAge: s.character.age, relationship: np.relationship ?? rng.int(45, 80), gender: np.gender, species: np.species,
      lastName: np.kind === 'child' || np.kind === 'sibling' ? s.character.lastName : undefined,
      // With a same-sex partner the child came by adoption or a donor, so it is not marked as the player's biological child.
      biological: np.kind === 'child' && otherParent?.gender !== s.character.gender ? true : undefined,
    });
    if (otherParent) p.otherParentId = otherParent.id;
    if (np.kind === 'lover' || np.kind === 'spouse') p.love = rng.int(50, 85);
    s = { ...s, people: { ...s.people, [p.id]: p } };
    if (np.kind === 'friend') s = bump(s, 'friendsMade');
    if (np.kind === 'lover') s = bump(s, 'lovers');
    if (np.kind === 'child') s = bump(s, 'children');
    if (np.log) s = log(s, renderText(np.log, s, { person: p }), 'milestone');
    return s;
  }
  if ('death' in e) return markDeath(s, e.death);
  if ('prison' in e) return sendToPrison(s, e.prison);
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
    const target = rng.pick(pool);
    if (e.asset === 'lose') return { ...s, assets: s.assets.filter((a) => a.id !== target.id) };
    const dmg = e.amount ?? 25;
    return {
      ...s,
      assets: s.assets.map((a) => (a.id === target.id ? { ...a, condition: clampStat(a.condition - dmg), value: Math.round(a.value * (1 - dmg / 200)) } : a)),
    };
  }
  if ('achievement' in e) return s.achievements.includes(e.achievement) ? s : { ...s, achievements: [...s.achievements, e.achievement] };
  return s;
}
