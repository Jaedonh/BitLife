/**
 * Validates one or more event content files without touching the registry.
 *
 *   npx tsx scripts/validate-events.ts src/data/events/childhood.ts [more files]
 *
 * Checks: schema validity, unique ids across the given files + the registry,
 * placeholders, queued follow-ups exist, and that every event is reachable
 * (eligible for at least one of a few thousand simulated states). The yearly
 * flavor lines (src/data/flavor.ts) are always checked the same way: wording,
 * placeholders, conditions, and that each one fits some sampled year.
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { EVENTS } from '../src/data/events';
import { FLAVOR } from '../src/data/flavor';
import { isEligible } from '../src/engine/events/select';
import { validateEvent, type EventDef } from '../src/engine/events/schema';
import { ageUp } from '../src/engine/ageUp';
import { resolveChoice } from '../src/engine/events/select';
import { beginLife, makeRegistry } from '../src/engine/events/select';
import { createLife } from '../src/engine/systems/character';
import { Rng } from '../src/engine/rng';
import { balancedPolicy, recklessPolicy } from '../src/engine/simulate';
import { applyAction } from '../src/engine/actions';
import { varyLife } from './varied-lives';
import { applyEffects } from '../src/engine/events/effects';
import { advanceYear } from '../src/engine/systems/aging';
import { flavorFits, validateFlavor } from '../src/engine/systems/flavor';
import type { GameState, ScenarioId } from '../src/engine/types';

async function loadFile(file: string): Promise<EventDef[]> {
  const mod = (await import(pathToFileURL(path.resolve(file)).href)) as Record<string, unknown>;
  const defs: EventDef[] = [];
  for (const v of Object.values(mod)) if (Array.isArray(v)) defs.push(...(v as EventDef[]));
  return defs;
}

/**
 * The policies never buy assets, so ownsAsset/ownsAssetId conditions would be unreachable:
 * most lives buy a used car from 22 and a mortgaged condo from 32 when they can afford it.
 */
function buyHomeAndCar(s: GameState, seed: number): GameState {
  if (seed % 4 === 3 || s.crime.inPrison) return s;
  const age = s.character.age;
  if (age >= 22 && !s.assets.some((a) => a.kind === 'car')) s = applyAction(s, { type: 'buyAsset', defId: seed % 2 ? 'old_hatchback' : 'sedan', financing: 'cash' });
  if (age >= 32 && !s.assets.some((a) => a.kind === 'house')) s = applyAction(s, { type: 'buyAsset', defId: seed % 2 ? 'condo' : 'suburban', financing: 'mortgage' });
  return s;
}

/** Each sampled year as the flavor picker sees it: its start (the birthday just passed) and how it ended. */
const flavorYears: { start: GameState; now: GameState }[] = [];
/** Every special start gets a couple of lives, so events gated on `scenario:<id>`, `foster_care`, `immigrant` or `farm` are reachable. */
const SCENARIO_LIVES: readonly ScenarioId[] = ['orphan', 'big_family', 'single_parent', 'immigrant', 'prodigy', 'farm_kid', 'wealthy'];

/**
 * Plays seeded lives and keeps every year's state. With the default empty registry no events
 * fire (so eligibility isn't skewed by what happened to fire); with a full registry events fire
 * and random choices are taken, so flags and follow-up chains set by other events are represented.
 */
function sampleStates(n: number, recklessLives = 20, registry = makeRegistry([]), seedOffset = 0): GameState[] {
  const states: GameState[] = [];
  const choiceRng = new Rng(seedOffset + 99);
  // Seeds 1..n play a sensible life; the extra seeds play recklessly so that
  // states with a criminal record or in prison are represented.
  for (let i = 1; i <= n + recklessLives + SCENARIO_LIVES.length * 2; i++) {
    const seed = i + seedOffset;
    // After the standard and reckless lives come two lives per starting scenario, played sensibly.
    const extra = i - n - recklessLives;
    const scenario = extra > 0 ? SCENARIO_LIVES[(extra - 1) % SCENARIO_LIVES.length] : undefined;
    const policy = i > n && !scenario ? recklessPolicy : balancedPolicy;
    let s = createLife(scenario ? { scenario } : {}, seed * 7919);
    // The newborn state (age 0) is where a new life's first card is rolled (beginLife).
    states.push(s);
    s = beginLife(s, registry);
    while (s.pendingEvent) s = resolveChoice(s, choiceRng.pick(s.pendingEvent.choices).id, registry);
    const rng = new Rng(seed);
    const petRng = new Rng(seed * 31 + 7);
    // Most lives run until death so late-life states (grandchildren, retirement) are well represented;
    // every third life is cut short so early states keep their weight too.
    const years = seed % 3 === 0 ? 5 + (seed % 90) : 100;
    for (let y = 0; y < years && s.alive; y++) {
      const start = advanceYear(s);
      s = ageUp(s, registry);
      let guard = 0;
      while (s.pendingEvent && guard++ < 20) {
        const choice = seedOffset ? choiceRng.pick(s.pendingEvent.choices) : s.pendingEvent.choices[0]!;
        s = resolveChoice(s, choice.id, registry);
      }
      if (!s.alive) break;
      // Pets only enter a life through events, which the sampler does not fire;
      // give every other life a pet at a few ages so pet events are reachable.
      if (seed % 2 === 0 && (s.character.age === 8 || s.character.age === 25 || s.character.age === 45)) {
        s = applyEffects(s, petRng, [{ newPerson: { kind: 'pet', species: seed % 4 === 0 ? 'dog' : 'cat' } }]);
      }
      for (const a of policy(s, rng)) s = applyAction(s, a);
      // An arrest opens a court card; answer it before the next year, as the app does.
      while (s.pendingEvent && guard++ < 40) {
        const choice = seedOffset ? choiceRng.pick(s.pendingEvent.choices) : s.pendingEvent.choices[0]!;
        s = resolveChoice(s, choice.id, registry);
      }
      s = buyHomeAndCar(s, seed);
      s = varyLife(s, seed);
      states.push(s);
      flavorYears.push({ start, now: s });
    }
  }
  return states;
}

async function main() {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('usage: npx tsx scripts/validate-events.ts <file.ts> [...]');
    process.exit(2);
  }
  const fileDefs: { file: string; defs: EventDef[] }[] = [];
  for (const f of files) fileDefs.push({ file: f, defs: await loadFile(f) });
  // Files already wired into the registry resolve to the same module instances; skip those to avoid false duplicates.
  const loaded = new Set(fileDefs.flatMap((x) => x.defs));
  const all = [...EVENTS.filter((e) => !loaded.has(e)), ...fileDefs.flatMap((x) => x.defs)];
  const ids = new Set<string>();
  const dupes = new Set<string>();
  for (const e of all) {
    if (ids.has(e.id)) dupes.add(e.id);
    ids.add(e.id);
  }
  const errors: string[] = [];
  for (const d of dupes) errors.push(`duplicate id: ${d}`);
  for (const { file, defs } of fileDefs) {
    if (!defs.length) errors.push(`${file}: exports no event arrays`);
    for (const e of defs) for (const err of validateEvent(e, ids)) errors.push(`${file}: ${err}`);
  }
  // Reachability
  // Lives without events, plus lives where every event (registry + these files) can fire, so
  // events gated on flags or eventFired from other events are reachable when their setup is.
  const states = [...sampleStates(60), ...sampleStates(90, 20, makeRegistry(all), 50_000)];
  const registry = makeRegistry(all);
  const unseenEvents = () => fileDefs.flatMap(({ file, defs }) => defs.filter((e) => !e.followUpOnly && !states.some((s) => isEligible(s, e))).map((e) => ({ file, e })));
  const unseenFlavor = () => FLAVOR.filter((line) => !flavorYears.some((y) => flavorFits(line, y.start, y.now)));
  // Rare but real situations (a law career, a teen in detention, a long marriage) may miss the first sample; anything
  // unseen gets a second, larger sample of event-firing lives before it is reported as unreachable.
  if (unseenEvents().length || unseenFlavor().length) states.push(...sampleStates(240, 40, registry, 150_000));
  for (const { file, e } of unseenEvents()) errors.push(`${file}: event ${e.id} was never eligible in ${states.length} sampled states (check age range / conditions / person selector)`);
  // Flavor lines: wording and conditions, and that each one can be written in some sampled year.
  for (const err of validateFlavor(FLAVOR)) errors.push(`src/data/flavor.ts: ${err}`);
  for (const line of unseenFlavor()) {
    if (line) errors.push(`src/data/flavor.ts: flavor line "${line.text}" never fit any of ${flavorYears.length} sampled years (check age range / conditions / person selector)`);
  }
  const total = fileDefs.reduce((n, x) => n + x.defs.length, 0);
  if (errors.length) {
    console.error(`${errors.length} problem(s):\n` + errors.map((e) => ` - ${e}`).join('\n'));
    process.exit(1);
  }
  console.log(`OK: ${total} events in ${files.length} file(s) valid and reachable (registry now ${all.length}); ${FLAVOR.length} flavor lines valid and reachable.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
