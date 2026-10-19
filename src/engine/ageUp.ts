import { EVENT_REGISTRY } from './events/registry';
import { openNextEvent, scheduleYearEvents, type EventRegistry } from './events/select';
import { Rng } from './rng';
import { advanceYear, ageNpcs, driftStats } from './systems/aging';
import { yearlyAssets } from './systems/assets';
import { rollListings, yearlyCareer } from './systems/careers';
import { namesInLife } from './systems/character';
import { settleCoworkers } from './systems/coworkers';
import { yearlyPrison } from './systems/crime';
import { yearlyEducation } from './systems/education';
import { yearlyFamily } from './systems/family';
import { yearlyFinance } from './systems/finance';
import { settleQuietYear, yearlyFlavor } from './systems/flavor';
import { yearlyHealth } from './systems/health';
import { rollMortality } from './systems/mortality';
import { yearlyRelationships } from './systems/relationships';
import { yearlyScenario } from './systems/scenarios';
import type { GameState } from './types';
import { log } from './util';

/**
 * Simulates one year. Phase order is deliberate and documented in
 * docs/GAME_DESIGN.md §2. Returns early if the life is over or a choice is pending.
 */
export function ageUp(state: GameState, registry: EventRegistry = EVENT_REGISTRY): GameState {
  if (!state.alive || state.pendingEvent) return state;
  const rng = new Rng(state.rng);
  let s = advanceYear(state);
  const yearStart = s;
  const headerIndex = s.log.length;
  s = log(s, `${s.year}: Age ${s.character.age}`, 'year');
  s = milestones(s);
  s = yearlyScenario(s, rng);
  s = driftStats(s, rng);
  // A year that started behind bars earns nothing on the outside, even if it ends in release.
  const servedYear = s.crime.inPrison;
  s = yearlyPrison(s, rng);
  s = yearlyEducation(s, rng);
  s = yearlyCareer(s, rng, servedYear);
  s = settleCoworkers(s);
  s = yearlyAssets(s, rng);
  s = yearlyFinance(s, rng);
  s = yearlyHealth(s, rng);
  s = ageNpcs(s, rng);
  // Names in the life when the year began stay taken for the whole age-up: a coworker who left with the job, or a
  // friend who drifted apart, does not hand their name to a new friend, partner, grandchild or child's spouse.
  const yearNames = namesInLife(yearStart);
  s = yearlyRelationships(s, rng, yearNames);
  s = yearlyFamily(s, rng, yearNames);
  if (s.character.age >= 14) s = rollListings(s, rng);
  s = rollMortality(s, rng);
  // A death at the birthday skips the flavor pass, which is where last year's quiet line is settled, so settle it here.
  if (!s.alive) return { ...settleQuietYear(s, headerIndex), rng: rng.snapshot() };
  s = { ...s, rng: rng.snapshot(), updatedAt: state.updatedAt };
  s = scheduleYearEvents(s, registry);
  // Chosen once the year's systems have run and its cards are scheduled, so the line fits both (no "quiet year" line in a year with a card).
  s = yearlyFlavor(s, { start: yearStart, lines: s.log.length - headerIndex - 1, event: s.eventQueue.length > 0 });
  return openNextEvent(s, registry);
}

function milestones(state: GameState): GameState {
  const age = state.character.age;
  switch (age) {
    case 13: return log(state, "I'm a teenager now.", 'milestone');
    case 18: return log(state, "I'm legally an adult. The world is mine, apparently.", 'milestone');
    case 21: return log(state, 'I turned 21.', 'milestone');
    case 30: return log(state, 'I turned 30. My knees filed a complaint.', 'milestone');
    case 40: return log(state, 'I turned 40.', 'milestone');
    case 50: return log(state, 'Half a century. I got a cake with too many candles.', 'milestone');
    case 65: return log(state, 'I turned 65.', 'milestone');
    case 80: return log(state, 'I turned 80. Still here.', 'milestone');
    case 90: return log(state, 'Ninety. The birthday card said "legend".', 'milestone');
    case 100: return log(state, 'I turned 100. The local paper sent a photographer.', 'milestone');
    default: return state;
  }
}
