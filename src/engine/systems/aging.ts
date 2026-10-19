import { getCountry } from '@/data/countries';
import { Rng } from '../rng';
import type { GameState, Gender, Person } from '../types';
import { personRef } from '../events/text';
import { addMoney, addStats, bump, capitalize, clampStat, clearCoupleFlags, deathPhrase, fullName, log, money, pronouns } from '../util';
import { makePerson, randomName } from './character';
import { fosterRelation } from './scenarios';

/** Yearly stat drift. Numbers are tuned so a passive life slowly declines. */
export function driftStats(state: GameState, rng: Rng): GameState {
  const c = state.character;
  const age = c.age;
  const traits = c.traits;
  const married = Object.values(state.people).some((p) => p.kind === 'spouse' && p.alive && p.relationship >= 50);
  const unemployedAdult = age >= 22 && age < 65 && !state.career.job && !state.education.enrolled && !state.career.retired && !state.crime.inPrison;

  // Mean reversion toward a set-point keeps passive lives from spiraling.
  let happiness = Math.round((55 - c.stats.happiness) * 0.15) + rng.int(-3, 3);
  if (married) happiness += 1;
  if (unemployedAdult) happiness -= 2;
  if (state.crime.inPrison) happiness -= 5;
  // A minor's debt is not theirs to worry about yet (they never pay event costs and are charged no interest).
  if (state.finances.debt > 0 && age >= 18) happiness -= 1;
  if (traits.includes('anxious')) happiness -= 1;

  let health = age < 30 ? rng.int(-1, 2) : age < 50 ? rng.int(-2, 1) : age < 70 ? rng.int(-3, 1) : age < 85 ? rng.int(-4, 0) : rng.int(-5, -1);
  if (traits.includes('iron_constitution')) health += 1;
  if (traits.includes('athletic')) health += 1;
  // The body heals a little when run down and nothing serious is wrong.
  if (c.stats.health < 40 && !state.health.illnesses.some((i) => i.severity >= 4)) health += age < 60 ? 2 : 1;
  let illnessDrain = 0;
  for (const ill of state.health.illnesses) illnessDrain += ill.chronic ? (ill.treated ? 0 : Math.max(1, ill.severity - 1)) : ill.treated ? 1 : Math.ceil(ill.severity * 1.5);
  health -= Math.min(6, illnessDrain);
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
/** Children and young adults do not die of a heart attack, a stroke or kidney failure. */
const CHILD_DEATH_CAUSES = ['a car accident', 'a sudden illness', 'pneumonia', 'meningitis', 'cancer'];
const YOUNG_ADULT_DEATH_CAUSES = ['a car accident', 'cancer', 'pneumonia', 'a sudden illness', 'a long illness', 'a swimming accident'];
/** From this age the adult causes apply. */
export const ADULT_CAUSES_FROM = 35;

/** What an NPC of `age` dies of. "Natural causes" only reads right for the old; a younger death gets a sudden illness instead. */
export function npcDeathCause(rng: Rng, age: number): string {
  const cause = rng.pick(age < 18 ? CHILD_DEATH_CAUSES : age < ADULT_CAUSES_FROM ? YOUNG_ADULT_DEATH_CAUSES : NPC_DEATH_CAUSES);
  return cause === 'natural causes' && age < 60 ? 'a sudden illness' : cause;
}

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
    // advanceYear has already incremented the age: an interaction during the year just played counts.
    const neglected = next.memory.lastInteractionAge < s.character.age - 1;
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
      next.deathCause = next.kind === 'pet' ? (petOld ? 'old age' : 'a sudden illness') : npcDeathCause(rng, next.age);
      deaths.push(next);
    }
    people[p.id] = next;
  }
  s = { ...s, people };
  // Every death of the year is announced first; a child left with nobody at home is then taken in once.
  for (const d of deaths) s = onNpcDeath(s, d, rng, { orphanCare: false });
  return takeInOrphan(s, deaths, rng);
}

const GUARDIAN_KINDS: readonly Person['kind'][] = ['mother', 'father', 'stepmother', 'stepfather'];
const isGuardian = (p: Person) => GUARDIAN_KINDS.includes(p.kind);

/**
 * Everything an NPC's death sets off: the journal line, grief, inheritance and, for a child, being taken in
 * (takeInOrphan). `p` is already marked dead in `state`. Shared by natural deaths (ageNpcs, which takes a child
 * in itself once all of the year's deaths are announced: orphanCare false) and event deaths (the `personDies`
 * effect), which pass announce: false because the event writes its own line and grief.
 */
export function onNpcDeath(state: GameState, p: Person, rng: Rng, opts: { announce?: boolean; orphanCare?: boolean } = {}): GameState {
  let s = p.kind === 'lover' || p.kind === 'spouse' ? clearCoupleFlags(state) : state;
  const announce = opts.announce ?? true;
  const close = p.relationship >= 50;
  const male = p.gender === 'male';
  const label = fosterRelation(p) ?? (p.kind === 'spouse' ? (male ? 'husband' : 'wife') : p.kind === 'child' ? (male ? 'son' : 'daughter') : p.kind === 'sibling' ? (male ? 'brother' : 'sister') : p.kind === 'pet' ? (p.species ?? 'pet') : p.kind === 'bestFriend' ? 'best friend' : p.kind === 'lover' ? (male ? 'boyfriend' : 'girlfriend') : p.kind === 'grandparent' ? (male ? 'grandfather' : 'grandmother') : p.kind === 'grandchild' ? (male ? 'grandson' : 'granddaughter') : p.kind);
  // Pets go by their first name only; people by their full name.
  const name = p.kind === 'pet' ? p.firstName : fullName(p);
  if (announce) {
    // An event that kills someone writes its own line and grief instead.
    // Parents and grandparents go by what the player calls them (Mom, Grandma Rosa), as everywhere else in the journal.
    const who = p.kind === 'mother' || p.kind === 'father' || p.kind === 'grandparent' || p.relative ? personRef(p, s.people) : `My ${label} ${name}`;
    s = log(s, `${who} ${deathPhrase(p.deathCause)} at ${p.age}.`, 'bad');
    // A grandparent's death is a smaller grief than a parent's; a grandchild's a deep one.
    const grief = p.kind === 'spouse' || p.kind === 'child' ? -25 : p.kind === 'mother' || p.kind === 'father' ? -15 : p.kind === 'grandchild' ? -12 : p.kind === 'grandparent' ? -8 : p.kind === 'pet' ? -8 : close ? -10 : -3;
    s = addStats(s, { happiness: Math.round(grief * (close ? 1 : 0.5)) });
  }
  // A child inherits too: a minor's share goes into their own savings, as a grandparent's bequest does (GAME_DESIGN §10a),
  // and always, because parents do not write a young child out of the will (an estranged adult may be).
  if ((p.kind === 'mother' || p.kind === 'father' || p.kind === 'spouse') && p.money > 0) {
    const siblings = Object.values(s.people).filter((x) => x.kind === 'sibling' && x.alive).length;
    const share = Math.round((p.money * (p.kind === 'spouse' ? 1 : 0.8)) / (p.kind === 'spouse' ? 1 : siblings + 1));
    const minor = s.character.age < 18;
    if (share > 0 && (p.kind === 'spouse' || minor || p.relationship >= 25 || rng.chance(0.3))) {
      s = addMoney(s, share);
      s = log(s, `I inherited ${money(s, share)} from ${personRef(p, s.people)}'s estate.${minor ? ' It went into my savings.' : ''}`, 'money');
    }
  }
  if (p.kind === 'grandparent' && p.money > 0) s = grandparentEstate(s, p, rng);
  return opts.orphanCare === false ? s : takeInOrphan(s, [p], rng);
}

const isParent = (p: Person) => p.kind === 'mother' || p.kind === 'father';

/**
 * "With Mom gone", "With both my parents gone": the guardians a child just lost, as the child says it. Only a
 * child who had two parents, and lost the last of them, says "both my parents"; one who only ever had one parent
 * names them, and so does one who just lost a step-parent.
 */
function lossPhrase(state: GameState, lost: readonly Person[]): string {
  if (Object.values(state.people).filter(isParent).length === 2 && lost.every(isParent)) return 'With both my parents gone';
  const ref = (x: Person) => personRef(x, state.people);
  if (lost.length === 1) return `With ${ref(lost[0]!)} gone`;
  if (lost.length === 2) return `With ${ref(lost[0]!)} and ${ref(lost[1]!)} both gone`;
  return 'With no one left at home to raise me';
}

/**
 * A first name and surname for someone joining the family, not shared with anyone already in it (a few draws),
 * from the names of `countryCode`.
 */
function freshName(rng: Rng, state: GameState, p: Person, countryCode: string, surname?: string): void {
  const taken = new Set([state.character.firstName, ...Object.values(state.people).map((x) => x.firstName)]);
  for (let i = 0; i < 6 && taken.has(p.firstName); i++) p.firstName = randomName(rng, p.gender, countryCode).firstName;
  if (surname) p.lastName = surname;
  // A foster family is not the child's own: a shared surname would read as a relative.
  else for (let i = 0; i < 6 && p.lastName === state.character.lastName; i++) p.lastName = randomName(rng, p.gender, countryCode).lastName;
}

/**
 * How old the aunt or uncle on `side` is: within eight years of that parent when they died this year, else 22-44
 * years older than the child; always 18+ years older than the child and 18+ years younger than their own parents
 * (the grandparents on that side), and at most 55 years older than the child.
 */
function relativeAge(rng: Rng, state: GameState, side: Person | undefined, justLost: readonly Person[]): number {
  const me = state.character;
  const near = side && justLost.some((x) => x.id === side.id) ? side.age + rng.int(-8, 8) : me.age + rng.int(22, 44);
  const ownParents = side ? Object.values(state.people).filter((x) => x.kind === 'grandparent' && x.alive && x.viaId === side.id) : [];
  const ceiling = Math.min(me.age + 55, ...ownParents.map((g) => g.age - 18));
  return Math.max(me.age + 18, Math.min(near, ceiling));
}

/**
 * The late player in an heir's family: the dead parent who was the last life (the last ancestor). Players never
 * change their surname, so theirs is their family's.
 */
function lateParent(state: GameState): Person | undefined {
  const last = state.ancestors[state.ancestors.length - 1];
  if (!last) return undefined;
  return Object.values(state.people).find((x) => isParent(x) && !x.alive && fullName(x) === last.name && x.deathAge === last.age);
}

/**
 * The surname of a parent's family: the one they were born with (`birthLastName`, when a marriage changed it), the
 * one their own parents carry (a mother's maiden name), or their own. In an heir's life the late player kept the
 * surname they were born with, so their brother or sister carries it too ("Mom's brother" of a late mother is a
 * Hughes like her); the other parent married the late player, and one whose surname is the late player's took it
 * at the wedding, so their family's is not known (undefined: the relative gets a surname of their own). The same
 * goes for a mother who carries the child's.
 */
function familyName(state: GameState, parent: Person): string | undefined {
  if (parent.birthLastName) return parent.birthLastName;
  const late = lateParent(state);
  if (late && late.id === parent.id) return parent.lastName;
  const ownParent = Object.values(state.people).find((x) => x.kind === 'grandparent' && x.viaId === parent.id);
  if (ownParent) return ownParent.lastName;
  if (late && parent.lastName === late.lastName) return undefined;
  if (parent.kind === 'father') return parent.lastName;
  return parent.lastName === state.character.lastName ? undefined : parent.lastName;
}

/**
 * A child (under 18) left with no living parent, step-parent or guardian is taken in, once, with one journal line:
 * a foster child by a new foster parent (`foster`), anyone else by an aunt or uncle, the brother or sister of a
 * parent they lost (`relative`, linked by `viaId`). Both are kind stepmother/stepfather, so like any parent they
 * pay for the child, take them to the doctor and are who {{parents}} names ("Aunt Rosa"). `lost` are the people
 * who just died, and the line opens with them ("With Mom gone, I went to live with her sister, Aunt Rosa.").
 * With none of them a guardian (an heir whose only parent was the last player, or an older save whose orphan was
 * never taken in) the child is taken in now, and the line does not tell the loss again ("I went to live with
 * Mom's sister, Aunt Rosa.").
 *
 * `relative` is a real brother or sister of a lost parent, ready to step in (an heir's aunt or uncle: the last
 * player's own sibling, kind stepmother/stepfather marked `relative` and linked by `viaId`); without one, an aunt
 * or uncle is found here.
 */
export function takeInOrphan(state: GameState, lost: readonly Person[], rng: Rng, relative?: Person): GameState {
  const me = state.character;
  if (me.age >= 18 || Object.values(state.people).some((x) => x.alive && isGuardian(x))) return state;
  const everyone = Object.values(state.people).filter(isGuardian);
  if (!everyone.length) return state;
  const justLost = lost.filter(isGuardian);
  const loss = justLost.length ? lossPhrase(state, justLost) : undefined;
  const foster = state.flags.foster_care === true || everyone.some((x) => x.foster);
  const inside = state.crime.inPrison;
  if (relative && !foster) return relativeTakesIn(state, relative, relative.viaId ? state.people[relative.viaId] : undefined, justLost, loss);
  const gender: Gender = rng.chance(foster ? 0.7 : 0.6) ? 'female' : 'male';
  const kind = gender === 'female' ? 'stepmother' : 'stepfather';
  if (foster) {
    const age = Math.max(me.age + 16, rng.int(30, 55));
    const carer = makePerson(rng, { kind, gender, age, countryCode: me.countryCode, playerAge: me.age, relationship: rng.int(35, 65), money: Math.round(rng.int(0, 12_000) * getCountry(me.countryCode).salaryMultiplier) });
    carer.foster = true;
    freshName(rng, state, carer, me.countryCode);
    const s: GameState = { ...state, people: { ...state.people, [carer.id]: carer } };
    const placed = `my caseworker ${inside ? 'found me' : 'placed me with'} a new ${fosterRelation(carer)!}, ${fullName(carer)}.`;
    return log(s, loss ? `${loss}, ${placed}` : capitalize(placed), 'bad');
  }
  // The brother or sister of a parent the child lost: about that parent's age, with that side's surname and a
  // name from the family's country of birth (an immigrant family's relatives are from the old country).
  const parents = everyone.filter(isParent);
  const side = parents.length ? rng.pick(parents) : undefined;
  const origin = typeof state.flags.immigrant === 'string' ? getCountry(state.flags.immigrant).code : me.countryCode;
  const age = relativeAge(rng, state, side, justLost);
  const money = Math.round(rng.int(2_000, 120_000) * getCountry(me.countryCode).salaryMultiplier);
  const carer = makePerson(rng, { kind, gender, age, countryCode: origin, playerAge: me.age, relationship: rng.int(45, 75), money });
  carer.relative = true;
  if (side) carer.viaId = side.id;
  freshName(rng, state, carer, origin, side ? familyName(state, side) : undefined);
  return relativeTakesIn(state, carer, side, justLost, loss);
}

/**
 * The aunt or uncle `carer` (the brother or sister of `side`, a parent the child lost) joins the family as the
 * child's guardian, with the line that says so: "With Mom gone, I went to live with her sister, Aunt Rosa."
 */
function relativeTakesIn(state: GameState, carer: Person, side: Person | undefined, justLost: readonly Person[], loss: string | undefined): GameState {
  const s: GameState = { ...state, people: { ...state.people, [carer.id]: carer } };
  const who = personRef(carer);
  const sibling = carer.gender === 'female' ? 'sister' : 'brother';
  // "her sister" when the loss just named that parent ("With Mom gone"), else "Mom's sister".
  const namedAlone = !!side && !!loss && justLost.length === 1 && justLost[0]!.id === side.id && !loss.startsWith('With both');
  const whose = !side ? '' : namedAlone ? pronouns(side.gender).possessive : `${personRef(side, s.people)}'s`;
  const clause = !side ? `${who} took me in.` : state.crime.inPrison ? `${whose} ${sibling}, ${who}, became my guardian.` : `I went to live with ${whose} ${sibling}, ${who}.`;
  return log(s, loss ? `${loss}, ${clause}` : capitalize(clause), 'bad');
}

/** Share of a grandparent's estate left to the grandchildren (the player and siblings); most goes to their own child. */
export const GRANDPARENT_BEQUEST = 0.15;

/**
 * A grandparent's estate: most of it passes to the player's parent on that side, and a small bequest to the
 * player, split with their siblings, when they were close (or, sometimes, anyway). A minor's bequest goes into
 * their own savings, which only their own choices spend (see guardians.ts).
 */
function grandparentEstate(state: GameState, p: Person, rng: Rng): GameState {
  let s = state;
  const parent = p.viaId ? s.people[p.viaId] : undefined;
  if (parent?.alive) s = { ...s, people: { ...s.people, [parent.id]: { ...parent, money: parent.money + Math.round(p.money * 0.6) } } };
  const siblings = Object.values(s.people).filter((x) => x.kind === 'sibling' && x.alive).length;
  const share = Math.round((p.money * GRANDPARENT_BEQUEST) / (siblings + 1));
  if (share <= 0 || !(p.relationship >= 40 || rng.chance(0.3))) return s;
  s = addMoney(s, share);
  const pp = p.gender === 'male' ? 'his' : 'her';
  return log(s, s.character.age < 18 ? `${personRef(p)} left me ${money(s, share)} in ${pp} will. It went into my savings.` : `${personRef(p)} left me ${money(s, share)} in ${pp} will.`, 'money');
}

/** Yearly social-energy budget by age (GAME_DESIGN §2). */
export function energyMaxFor(age: number): number {
  return age < 6 ? 1 : age < 13 ? 2 : age < 60 ? 4 : 3;
}

/** Advances age/year and resets per-year counters. */
export function advanceYear(state: GameState): GameState {
  const c = state.character;
  const nextAge = c.age + 1;
  const energyMax = energyMaxFor(nextAge);
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
