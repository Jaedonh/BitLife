import { Rng } from '../rng';
import { settleCoworkers } from '../systems/coworkers';
import type { GameState, PendingEvent, QueuedEvent } from '../types';
import { bump, log } from '../util';
import { candidatesFor, evaluateAll } from './conditions';
import { applyEffects } from './effects';
import type { EventDef } from './schema';
import { renderText } from './text';
import { SYSTEM_EVENTS } from '../systems/justice';

export interface EventRegistry {
  all: readonly EventDef[];
  byId: Record<string, EventDef>;
}

export function makeRegistry(defs: readonly EventDef[]): EventRegistry {
  // The engine's own cards (court, parole) belong to every registry, so an arrest never strands its trial.
  const ids = new Set(defs.map((d) => d.id));
  const all = [...defs, ...SYSTEM_EVENTS.filter((d) => !ids.has(d.id))];
  return { all, byId: Object.fromEntries(all.map((d) => [d.id, d])) };
}

/** How many random events to roll this year, by age band. */
export function eventCountForYear(age: number, rng: Rng): number {
  if (age < 3) return rng.chance(0.45) ? 1 : 0;
  if (age < 6) return rng.chance(0.75) ? 1 : 0;
  if (age < 18) return 1 + (rng.chance(0.35) ? 1 : 0);
  if (age < 70) return (rng.chance(0.92) ? 1 : 0) + (rng.chance(0.4) ? 1 : 0) + (rng.chance(0.08) ? 1 : 0);
  return 1 + (rng.chance(0.3) ? 1 : 0);
}

/** The event's age range and conditions hold for the current state (no once/cooldown or person check). */
export function fitsState(state: GameState, def: EventDef): boolean {
  const age = state.character.age;
  if (age < def.minAge || age > def.maxAge) return false;
  if (state.crime.inPrison && !writtenForPrison(def.conditions)) return false;
  if (state.crime.inPrison && state.crime.juvenile && !writtenForJuvenile(def.conditions)) return false;
  return evaluateAll(state, def.conditions);
}

/** Juvenile detention is its own world inside that one: only events requiring { juvenile: true } open there. */
function writtenForJuvenile(conditions: EventDef['conditions']): boolean {
  return (conditions ?? []).some((c) => ('juvenile' in c && c.juvenile) || ('all' in c && writtenForJuvenile(c.all)));
}

/**
 * Prison is its own world: only events whose conditions require { inPrison: true } (at the top
 * level or inside `all`) open there, random or queued. A follow-up queued before a choice that
 * jailed the player is dropped instead of opening behind bars.
 */
function writtenForPrison(conditions: EventDef['conditions']): boolean {
  return (conditions ?? []).some((c) => ('inPrison' in c && c.inPrison) || ('all' in c && writtenForPrison(c.all)));
}

export function isEligible(state: GameState, def: EventDef): boolean {
  const age = state.character.age;
  if (def.followUpOnly) return false;
  const last = state.firedEvents[def.id];
  if (last !== undefined) {
    if (def.once) return false;
    if (def.cooldown !== undefined && age - last < def.cooldown) return false;
    if (def.cooldown === undefined && age - last < 2) return false;
  }
  if (!fitsState(state, def)) return false;
  if (def.person && candidatesFor(state, def.person).length === 0) return false;
  return true;
}

/** Rolls this year's random events into the queue (does not open them). */
export function scheduleYearEvents(state: GameState, registry: EventRegistry, fixedCount?: number): GameState {
  const rng = new Rng(state.rng);
  const count = fixedCount ?? eventCountForYear(state.character.age, rng);
  const queued: QueuedEvent[] = [];
  const usedCategories = new Set<string>();
  let pool = registry.all.filter((d) => isEligible(state, d));
  for (let i = 0; i < count && pool.length > 0; i++) {
    const def = rng.weighted(pool, (d) => (usedCategories.has(d.category) ? d.weight * 0.25 : d.weight));
    usedCategories.add(def.category);
    pool = pool.filter((d) => d.id !== def.id);
    const personId = def.person ? rng.pick(candidatesFor(state, def.person)).id : undefined;
    queued.push({ eventId: def.id, context: {}, personId });
  }
  return { ...state, rng: rng.snapshot(), eventQueue: [...state.eventQueue, ...queued] };
}

/**
 * The newborn year: a brand-new life opens with one card written for age 0 (a first bath, the first night
 * home), since ageUp moves to age 1 before it rolls events. Only for a life starting at birth, not an heir.
 */
export function beginLife(state: GameState, registry: EventRegistry): GameState {
  if (state.character.age !== 0 || state.pendingEvent || !state.alive || state.eventQueue.length) return state;
  return openNextEvent(scheduleYearEvents(state, registry, 1), registry);
}

/** Pops the next queued event into `pendingEvent` (if nothing is pending). */
export function openNextEvent(state: GameState, registry: EventRegistry): GameState {
  if (state.pendingEvent || !state.alive) return state;
  let s = state;
  while (s.eventQueue.length > 0) {
    const [next, ...rest] = s.eventQueue;
    s = { ...s, eventQueue: rest };
    const def = registry.byId[next!.eventId];
    if (!def) continue;
    // Re-validate: an earlier card this year may have jailed the player, cost them their job, spent their
    // money or brought home a pet since scheduling. Once/cooldown already passed then. Follow-ups are checked
    // too, after the choice that queued them, so their conditions may rely on the state it created.
    if (!fitsState(s, def)) continue;
    // ...or killed, dumped or alienated the bound person.
    const person = next!.personId ? s.people[next!.personId] : undefined;
    if (next!.personId && !person) continue;
    if (person && def.person && !candidatesFor(s, def.person).some((p) => p.id === person.id)) continue;
    // A code-defined card can withdraw choices for this showing (context.hide: "id,id"), e.g. a lawyer who was refused.
    const hidden = new Set((next!.context.hide ?? '').split(','));
    const choices = def.choices.filter((c) => evaluateAll(s, c.conditions) && !hidden.has(c.id));
    if (choices.length === 0) continue;
    const tc = { person, vars: def.vars?.length ? next!.context : undefined };
    const pending: PendingEvent = {
      eventId: def.id,
      title: renderText(def.title, s, tc),
      text: renderText(def.text, s, tc),
      choices: choices.map((c) => ({ id: c.id, label: renderText(c.label, s, tc), hint: c.hint ? renderText(c.hint, s, tc) : undefined })),
      context: next!.context,
      personId: next!.personId,
    };
    return { ...s, pendingEvent: pending };
  }
  return s;
}

/** Applies the chosen option of the pending event, then opens the next one. */
export function resolveChoice(state: GameState, choiceId: string, registry: EventRegistry): GameState {
  const pending = state.pendingEvent;
  if (!pending) return state;
  const def = registry.byId[pending.eventId];
  if (!def) return openNextEvent({ ...state, pendingEvent: null }, registry);
  const choice = def.choices.find((c) => c.id === choiceId) ?? def.choices[0]!;
  // The journal shows the label exactly as the player saw it (placeholders already rendered).
  const shownLabel = pending.choices.find((c) => c.id === choice.id)?.label ?? choice.label;
  const rng = new Rng(state.rng);
  let s: GameState = { ...state, pendingEvent: null, firedEvents: { ...state.firedEvents, [def.id]: state.character.age } };
  s = bump(s, 'eventsFaced');
  s = log(s, `${pending.text} → ${shownLabel}`, 'event');
  // Only a code-defined card's context feeds its effects (its case, e.g. the court's charge and fee).
  const vars = def.vars?.length ? pending.context : undefined;
  s = applyEffects(s, rng, choice.effects, { personId: pending.personId, person: pending.personId ? s.people[pending.personId] : undefined, vars });
  // A choice that cost the player their job (fired, jailed) also parts them from that job's coworkers.
  s = settleCoworkers(s);
  s = { ...s, rng: rng.snapshot() };
  return openNextEvent(s, registry);
}
