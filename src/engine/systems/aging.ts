import { getCountry } from '@/data/countries';
import { Rng } from '../rng';
import type { GameState, Person } from '../types';
import { addMoney, addStats, bump, clampStat, fullName, log } from '../util';

/** Yearly stat drift. Numbers are tuned so a passive life slowly declines. */
export function driftStats(state: GameState, rng: Rng): GameState {
  const c = state.character;
  const age = c.age;
  const traits = c.traits;
  const married = Object.values(state.people).some((p) => p.kind === 'spouse' && p.alive && p.relationship >= 50);
  const unemployedAdult = age >= 22 && age < 65 && !state.career.job && !state.education.enrolled && !state.career.retired && !state.crime.inPrison;

  let happiness = rng.int(-3, 2);
  if (married) happiness += 1;
  if (unemployedAdult) happiness -= 2;
  if (state.crime.inPrison) happiness -= 5;
  if (state.finances.debt > 0) happiness -= 1;
  if (traits.includes('anxious')) happiness -= 1;
  if (c.stats.happiness < 30) happiness += 1; // regression to the mean

  let health = age < 30 ? rng.int(-2, 2) : age < 50 ? rng.int(-3, 1) : age < 70 ? rng.int(-4, 0) : rng.int(-6, -1);
  if (traits.includes('iron_constitution')) health += 1;
  if (traits.includes('athletic')) health += 1;
  for (const ill of state.health.illnesses) health -= ill.treated ? Math.ceil(ill.severity / 2) : ill.severity * 2;
  for (const level of Object.values(state.health.addictions)) if ((level ?? 0) >= 40) health -= 2;

  let looks = age < 20 ? rng.int(-1, 3) : age < 35 ? rng.int(-2, 1) : age < 55 ? rng.int(-3, 0) : rng.int(-4, -1);
  if (c.stats.health < 30) looks -= 1;

  let smarts = age < 22 && state.education.enrolled ? rng.int(0, 2) : age < 22 ? rng.int(-1, 1) : age < 65 ? rng.int(-1, 1) : rng.int(-2, 0);
  if (state.health.illnesses.some((i) => i.defId === 'dementia')) smarts -= 3;

  let s = addStats(state, { happiness, health, looks, smarts });
  if (s.character.stats.happiness >= 80) s = bump(s, 'yearsHappy');
  if (s.character.stats.happiness <= 20) s = bump(s, 'yearsMiserable');
  return s;
}

const NPC_DEATH_CAUSES = ['a heart attack', 'cancer', 'a stroke', 'natural causes', 'pneumonia', 'a car accident', 'kidney failure', 'a long illness'];

function npcDeathChance(age: number, health: number): number {
  let p = age < 40 ? 0.001 : age < 55 ? 0.004 : age < 65 ? 0.009 : age < 75 ? 0.02 : age < 85 ? 0.05 : age < 95 ? 0.12 : 0.3;
  if (health < 30) p *= 2.5;
  return p;
}

/** Ages every NPC a year, applies relationship decay, and rolls NPC deaths. */
export function ageNpcs(state: GameState, rng: Rng): GameState {
  let s = state;
  const people: Record<string, Person> = {};
  const deaths: Person[] = [];
  for (const p of Object.values(s.people)) {
    if (!p.alive) {
      people[p.id] = p;
      continue;
    }
    const next: Person = { ...p, age: p.age + 1, memory: { ...p.memory } };
    const neglected = next.memory.lastInteractionAge < s.character.age;
    if (neglected) {
      next.memory.yearsNeglected += 1;
      const decay = next.kind === 'spouse' || next.kind === 'lover' ? -4 : next.kind === 'friend' || next.kind === 'bestFriend' ? -4 : -2;
      next.relationship = clampStat(next.relationship + decay);
      if (next.love !== undefined) next.love = clampStat(next.love - 5);
    } else {
      next.memory.yearsNeglected = 0;
    }
    if (next.kind !== 'pet' && next.age > 25) next.health = clampStat(next.health + rng.int(-3, 1));
    if (next.kind === 'pet') next.health = clampStat(next.health - rng.int(2, 8));
    const petOld = next.kind === 'pet' && next.age >= 12;
    if (rng.chance(next.kind === 'pet' ? (petOld ? 0.3 : 0.03) : npcDeathChance(next.age, next.health))) {
      next.alive = false;
      next.deathAge = next.age;
      next.deathCause = next.kind === 'pet' ? 'old age' : rng.pick(NPC_DEATH_CAUSES);
      deaths.push(next);
    }
    people[p.id] = next;
  }
  s = { ...s, people };
  for (const d of deaths) s = onNpcDeath(s, d, rng);
  return s;
}

function onNpcDeath(state: GameState, p: Person, rng: Rng): GameState {
  let s = state;
  const close = p.relationship >= 50;
  const label = p.kind === 'mother' ? 'mother' : p.kind === 'father' ? 'father' : p.kind === 'spouse' ? 'spouse' : p.kind === 'child' ? (p.gender === 'male' ? 'son' : 'daughter') : p.kind === 'sibling' ? (p.gender === 'male' ? 'brother' : 'sister') : p.kind === 'pet' ? (p.species ?? 'pet') : p.kind === 'bestFriend' ? 'best friend' : p.kind === 'friend' ? 'friend' : p.kind === 'lover' ? 'partner' : p.kind;
  s = log(s, `My ${label} ${fullName(p)} died of ${p.deathCause} at age ${p.age}.`, 'bad');
  const grief = p.kind === 'spouse' || p.kind === 'child' ? -25 : p.kind === 'mother' || p.kind === 'father' ? -15 : p.kind === 'pet' ? -8 : close ? -10 : -3;
  s = addStats(s, { happiness: Math.round(grief * (close ? 1 : 0.5)) });
  if ((p.kind === 'mother' || p.kind === 'father' || p.kind === 'spouse') && p.money > 0 && s.character.age >= 18) {
    const siblings = Object.values(s.people).filter((x) => x.kind === 'sibling' && x.alive).length;
    const share = Math.round((p.money * (p.kind === 'spouse' ? 1 : 0.8)) / (p.kind === 'spouse' ? 1 : siblings + 1));
    if (share > 0 && (p.kind === 'spouse' || p.relationship >= 25 || rng.chance(0.3))) {
      s = addMoney(s, share);
      s = log(s, `I inherited ${formatInherit(s, share)} from ${p.firstName}'s estate.`, 'money');
    }
  }
  if ((p.kind === 'mother' || p.kind === 'father') && s.character.age < 18) {
    const otherParent = Object.values(s.people).some((x) => (x.kind === 'mother' || x.kind === 'father') && x.alive);
    if (!otherParent) s = log(s, 'With both my parents gone, I was taken in by relatives.', 'bad');
  }
  return s;
}

function formatInherit(state: GameState, amount: number): string {
  const c = getCountry(state.character.countryCode);
  return `${c.currencySymbol}${Math.round(amount).toLocaleString('en-US')}`;
}

/** Advances age/year and resets per-year counters. */
export function advanceYear(state: GameState): GameState {
  const c = state.character;
  const energyMax = c.age + 1 < 6 ? 1 : c.age + 1 < 13 ? 2 : 3;
  return {
    ...state,
    year: state.year + 1,
    character: { ...c, age: c.age + 1, energy: energyMax, energyMax },
    actionsThisYear: {},
    education: { ...state.education, studiedThisYear: false },
    career: state.career.job ? { ...state.career, job: { ...state.career.job, askedThisYear: false, workedHarderThisYear: false } } : state.career,
    health: { ...state.health, doctorVisitsThisYear: 0 },
    lastResult: null,
  };
}
