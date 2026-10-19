import { settleHomeWithParents } from './events/conditions';
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
import { settleDistances, yearlyScenario } from './systems/scenarios';
import type { GameState } from './types';
import { log } from './util';

/**
 * Simulates one year. Phase order is deliberate and documented in
 * docs/GAME_DESIGN.md §2. Returns early if the life is over or a choice is pending.
 */
export function ageUp(state: GameState, registry: EventRegistry = EVENT_REGISTRY): GameState {
  if (!state.alive || state.pendingEvent) return state;
  const rng = new Rng(state.rng);
  // Living back home ends with a home, a spouse, a partner to live with or a cell, whichever way it came (conditions.ts).
  let s = settleHomeWithParents(advanceYear(state));
  // Names in the life at the birthday stay taken until the next one (namesInJournalThisYear), whoever leaves meanwhile.
  s = { ...s, namesThisYear: { age: s.character.age, names: [...namesInLife(s)] } };
  const yearStart = s;
  const headerIndex = s.log.length;
  s = log(s, `${s.year}: Age ${s.character.age}`, 'year');
  // A birthday that ends a sentence is told after the walk out ("I walked out of prison...", then "I turned 40."), so
  // neither the journal nor the year's recap has me "behind bars" on the day I left (yearlyPrison's release rule).
  const releasedToday = s.crime.inPrison && (s.crime.sentenceYearsLeft <= 1 || (s.crime.juvenile === true && s.character.age >= 18));
  if (!releasedToday) s = milestones(s);
  s = yearlyScenario(s, rng);
  s = driftStats(s, rng);
  // A year that started behind bars earns nothing on the outside, even if it ends in release.
  const servedYear = s.crime.inPrison;
  s = yearlyPrison(s, rng);
  if (releasedToday) s = milestones(s);
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
  // A grandchild born far away lives far away; a partner married from far away has moved in (scenarios.ts).
  s = settleDistances(s);
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

/** The birthday line for a milestone age, outside. */
const MILESTONES: Record<number, string> = {
  13: "I'm a teenager now.",
  18: "I'm legally an adult. The world is mine, apparently.",
  21: 'I turned 21.',
  30: 'I turned 30. My knees filed a complaint.',
  40: 'I turned 40.',
  50: 'Half a century. I got a cake with too many candles.',
  65: 'I turned 65.',
  80: 'I turned 80. Still here.',
  90: 'Ninety. The birthday card said "legend".',
  100: 'I turned 100. The local paper sent a photographer.',
};

/** The same birthdays behind bars: no cake, no photographer (GAME_DESIGN §2: behind bars the journal is about prison). */
const PRISON_MILESTONES: Record<number, string> = {
  21: 'I turned 21 behind bars.',
  30: 'I turned 30 in a prison cell. My knees filed a complaint with the warden.',
  40: 'I turned 40 behind bars.',
  50: 'Half a century old, and I spent the birthday behind bars.',
  65: 'I turned 65 in prison. Retirement would have to wait.',
  80: 'I turned 80 behind bars. Still here.',
  90: 'Ninety, and still behind bars. A guard wished me a happy birthday.',
  100: 'I turned 100 in prison. The warden came by to shake my hand.',
};

/** A minor's milestones in juvenile detention (detention ends at 18, and that birthday is told after the release). */
const DETENTION_MILESTONES: Record<number, string> = {
  13: 'I turned 13 in juvenile detention.',
};

function milestones(state: GameState): GameState {
  const age = state.character.age;
  const inside = state.crime.inPrison ? (state.crime.juvenile ? DETENTION_MILESTONES[age] : PRISON_MILESTONES[age]) : undefined;
  const text = inside ?? MILESTONES[age];
  return text ? log(state, text, 'milestone') : state;
}
