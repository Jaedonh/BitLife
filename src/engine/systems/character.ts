import { COUNTRIES, getCountry } from '@/data/countries';
import { COMPANY_NAMES, COMPANY_SUFFIXES, NAMES } from '@/data/names';
import { Rng } from '../rng';
import type {
  Character,
  Education,
  GameState,
  Gender,
  LifetimeCounters,
  NewLifeOptions,
  Person,
  PersonMemory,
  RelationshipKind,
  ScenarioId,
  TraitId,
} from '../types';
import { SCHEMA_VERSION } from '../types';
import { personRef } from '../events/text';
import { article, capitalize, clampStat, daysInMonth, deathPhrase, fullName, joinList, log, lowerTitle, money, numberWord, withArticle, zodiacFor } from '../util';
import { energyMaxFor, takeInOrphan } from './aging';
import { rollListings } from './careers';
import { farmTown, fosterRelation, MOVE_ABROAD_AGES, pickDestination, scenarioFlags, startingScenario } from './scenarios';

const ALL_TRAITS: readonly TraitId[] = [
  'quick_learner', 'charming', 'iron_constitution', 'lucky', 'hot_headed', 'thrifty', 'creative', 'athletic', 'anxious', 'rebellious',
];

export const TRAIT_LABELS: Record<TraitId, { label: string; description: string }> = {
  quick_learner: { label: 'Quick learner', description: 'Studying and library visits give more Smarts.' },
  charming: { label: 'Charming', description: 'People warm to you faster; compliments land better.' },
  iron_constitution: { label: 'Iron constitution', description: 'Illnesses are rarer and milder.' },
  lucky: { label: 'Lucky', description: 'Better odds in risky choices and lucky finds.' },
  hot_headed: { label: 'Hot-headed', description: 'Arguments escalate; insults sting more.' },
  thrifty: { label: 'Thrifty', description: 'Living expenses are 15% lower.' },
  creative: { label: 'Creative', description: 'Creative careers and hustles pay off faster.' },
  athletic: { label: 'Athletic', description: 'Workouts are more effective; sports careers open up.' },
  anxious: { label: 'Anxious', description: 'Happiness drops more from bad events, recovers slower.' },
  rebellious: { label: 'Rebellious', description: 'More trouble at school, better at crime.' },
};

export function emptyMemory(age: number): PersonMemory {
  return { lastInteractionAge: age, insults: 0, compliments: 0, gifts: 0, fights: 0, yearsNeglected: 0 };
}

export function emptyCounters(): LifetimeCounters {
  return {
    workouts: 0, libraryVisits: 0, meditations: 0, vacations: 0, giftsGiven: 0, compliments: 0, insults: 0, crimes: 0, arrests: 0,
    gamblingSessions: 0, gamblingWon: 0, gamblingLost: 0, lovers: 0, marriages: 0, divorces: 0, children: 0, jobsHeld: 0, promotions: 0,
    firings: 0, surgeries: 0, carsOwned: 0, housesOwned: 0, yearsEmployed: 0, yearsInPrison: 0, illnesses: 0, peakNetWorth: 0,
    yearsHappy: 0, yearsMiserable: 0, eventsFaced: 0, friendsMade: 0, rewardedAdsUsed: 0,
  };
}

export function randomName(rng: Rng, gender: Gender, countryCode: string): { firstName: string; lastName: string } {
  const firstName = freshFirstName(rng, gender, countryCode);
  return { firstName, lastName: rng.pick(NAMES[getCountry(countryCode).namePool].surnames) };
}

/**
 * Every first name already in a life (GAME_DESIGN §10): the player's, and everyone's they know or remember, alive
 * or dead (parents, siblings, children, partners, exes, friends, coworkers, pets), plus their children's spouses.
 */
export function namesInLife(state: Pick<GameState, 'character' | 'people'>): Set<string> {
  const out = new Set([state.character.firstName]);
  for (const p of Object.values(state.people)) {
    out.add(p.firstName);
    if (p.growth?.spouse) out.add(p.growth.spouse.firstName);
  }
  return out;
}

/** Whole-word search that also works for names with accents ("Zoë", "Søren"), where \b does not. */
function mentionsName(text: string, name: string): boolean {
  const letter = (ch: string | undefined) => !!ch && (/[0-9_]/.test(ch) || ch.toLowerCase() !== ch.toUpperCase());
  for (let i = text.indexOf(name); i >= 0; i = text.indexOf(name, i + 1)) {
    if (!letter(text[i - 1]) && !letter(text[i + name.length])) return true;
  }
  return false;
}

/**
 * The country's first names that this year's journal mentions (GAME_DESIGN §10). Someone who left the life since the
 * birthday (a coworker who stayed behind with the old job) keeps their name until the next one, so a coworker, baby
 * or anyone a card brings in that year is not taken for them, in the journal or on their page.
 */
export function namesInJournalThisYear(state: Pick<GameState, 'character' | 'log'>): Set<string> {
  const lines: string[] = [];
  for (let i = state.log.length - 1; i >= 0 && state.log[i]!.age === state.character.age; i--) lines.push(state.log[i]!.text);
  const out = new Set<string>();
  if (!lines.length) return out;
  const pool = NAMES[getCountry(state.character.countryCode).namePool];
  for (const name of [...pool.male, ...pool.female]) if (lines.some((l) => mentionsName(l, name))) out.add(name);
  return out;
}

/**
 * A first name from the country's pool that nobody in `taken` has, while the pool still has one (then any name).
 * The one helper behind every new person's name. Always a single draw, like an unchecked one, so everything rolled
 * after it uses the same dice as before.
 */
export function freshFirstName(rng: Rng, gender: Gender, countryCode: string, taken?: ReadonlySet<string>): string {
  const pool = NAMES[getCountry(countryCode).namePool];
  const names = gender === 'male' ? pool.male : pool.female;
  const free = taken?.size ? names.filter((n) => !taken.has(n)) : names;
  return rng.pick(free.length ? free : names);
}

export function randomCompany(rng: Rng): string {
  return `${rng.pick(COMPANY_NAMES)} ${rng.pick(COMPANY_SUFFIXES)}`;
}

const OCCUPATIONS_ADULT = [
  'Teacher', 'Nurse', 'Electrician', 'Accountant', 'Shop Manager', 'Software Developer', 'Chef', 'Bus Driver', 'Police Officer', 'Sales Rep',
  'Mechanic', 'Pharmacist', 'Graphic Designer', 'Plumber', 'Receptionist', 'Lawyer', 'Journalist', 'Farmer', 'Dentist', 'Barber', 'Engineer',
  'Social Worker', 'Carpenter', 'Real Estate Agent', 'Librarian', 'Firefighter', 'Waiter', 'Architect', 'Photographer', 'Unemployed',
];

/** Jobs that take a degree (or years on the ladder) first: nobody is a 19-year-old dentist. */
const OCCUPATIONS_NEED_YEARS = new Set(['Teacher', 'Nurse', 'Accountant', 'Shop Manager', 'Software Developer', 'Pharmacist', 'Lawyer', 'Journalist', 'Dentist', 'Engineer', 'Social Worker', 'Librarian', 'Architect']);

/** The well-paid professions: a family that is always short of money has none of them at home (GAME_DESIGN §4). */
const OCCUPATIONS_WELL_PAID = new Set(['Accountant', 'Software Developer', 'Pharmacist', 'Lawyer', 'Dentist', 'Engineer', 'Architect']);
/** A poor family's parents: any job but a well-paid profession (or none). */
const OCCUPATIONS_POOR = OCCUPATIONS_ADULT.filter((o) => !OCCUPATIONS_WELL_PAID.has(o));
/** A wealthy family's parents: the professions and the jobs that run a business. */
const OCCUPATIONS_WEALTHY = [...OCCUPATIONS_WELL_PAID, 'Shop Manager', 'Real Estate Agent'];

/** Someone whose life stage still says "Student" is grown up from this age: they have a job (or none) and money of their own. */
export const GROWN_UP_AGE = 23;

/** An adult's job for their age: someone under 23 drawn into a graduate's job is still a student. */
function occupationFor(drawn: string, age: number): string {
  return age < GROWN_UP_AGE && OCCUPATIONS_NEED_YEARS.has(drawn) ? 'Student' : drawn;
}

/** How old someone must be to hold this job: 23 for one that takes a degree first, else 18. */
export function occupationMinAge(occupation: string): number {
  return OCCUPATIONS_NEED_YEARS.has(occupation) ? GROWN_UP_AGE : 18;
}

/**
 * What a grown-up who was still a student when they joined the life does now (GAME_DESIGN §10): an adult job for
 * their age (or none) and savings like any adult's. The same draws makePerson makes for an adult.
 */
export function grownUpLivelihood(rng: Rng, age: number, countryCode: string): { occupation: string; money: number } {
  const occupation = occupationFor(rng.pick(OCCUPATIONS_ADULT), age);
  return { occupation, money: Math.round(rng.int(2_000, 120_000) * getCountry(countryCode).salaryMultiplier) };
}

/** Kinds that are the player's own family: they carry its surnames, so nobody else is given one (familySurnames). */
const FAMILY_KINDS: ReadonlySet<RelationshipKind> = new Set(['mother', 'father', 'stepmother', 'stepfather', 'sibling', 'grandparent', 'child', 'grandchild', 'spouse']);

/**
 * The surnames of the player's family (GAME_DESIGN §10): theirs and their relatives'. Someone new who is not family
 * (a friend, a partner, a coworker) is given another one, so they do not read as a relative.
 */
export function familySurnames(state: Pick<GameState, 'character' | 'people'>): Set<string> {
  const out = new Set([state.character.lastName]);
  for (const p of Object.values(state.people)) if (FAMILY_KINDS.has(p.kind) && !p.foster) out.add(p.lastName);
  return out;
}

export function makePerson(
  rng: Rng,
  opts: {
    kind: RelationshipKind;
    gender?: Gender;
    age: number;
    countryCode: string;
    lastName?: string;
    playerAge: number;
    relationship?: number;
    occupation?: string;
    money?: number;
    biological?: boolean;
    species?: string;
    /**
     * First names already in the life (namesInLife): the new person gets one nobody has while the pool allows,
     * and theirs is added to the set, so several people made in a row stay distinct.
     */
    taken?: Set<string>;
    /** Surnames to leave out of the draw (familySurnames): someone who is not family does not share the family's name. */
    avoidSurnames?: ReadonlySet<string>;
    /** The jobs an adult's occupation is drawn from (a parent's fits the family's wealth); all jobs by default. */
    occupations?: readonly string[];
  },
): Person {
  const gender = opts.gender ?? rng.pick<Gender>(['male', 'female']);
  const firstName = freshFirstName(rng, gender, opts.countryCode, opts.taken);
  // One draw either way, like the first name.
  const surnames = NAMES[getCountry(opts.countryCode).namePool].surnames;
  const otherSurnames = opts.avoidSurnames?.size ? surnames.filter((n) => !opts.avoidSurnames!.has(n)) : surnames;
  const surname = rng.pick(otherSurnames.length ? otherSurnames : surnames);
  opts.taken?.add(firstName);
  const adult = opts.age >= 18;
  return {
    id: rng.id('p_'),
    firstName,
    lastName: opts.lastName ?? surname,
    gender,
    age: opts.age,
    alive: true,
    kind: opts.kind,
    relationship: opts.relationship ?? rng.int(40, 90),
    looks: rng.int(10, 95),
    smarts: rng.int(10, 95),
    health: rng.int(adult ? 50 : 80, 100),
    craziness: rng.int(0, 100),
    occupation: opts.occupation ?? (adult ? occupationFor(rng.pick(opts.occupations ?? OCCUPATIONS_ADULT), opts.age) : 'Student'),
    money: opts.money ?? (adult ? Math.round(rng.int(2_000, 120_000) * getCountry(opts.countryCode).salaryMultiplier) : 0),
    memory: emptyMemory(opts.playerAge),
    metAtAge: opts.playerAge,
    biological: opts.biological,
    species: opts.species,
  };
}

/**
 * How old a new friend can be (GAME_DESIGN §10): a small child befriends children within a year of their own age
 * (3 at the youngest), a teenager someone within two years, an adult someone within three (16 at the youngest).
 */
export function friendAgeRange(age: number): [number, number] {
  if (age < 13) return [Math.max(3, age - 1), Math.max(3, age + 1)];
  if (age < 18) return [age - 2, age + 2];
  return [Math.max(16, age - 3), age + 3];
}

/** Chance that a grandparent of this age is still alive when the player is born: fewer when the parents are older. */
export function grandparentAliveChance(age: number): number {
  return age <= 55 ? 0.75 : age <= 65 ? 0.6 : age <= 75 ? 0.4 : age <= 85 ? 0.2 : 0.07;
}

/**
 * A newborn's living grandparents (GAME_DESIGN §10): each parent has up to two, 20-35 years older than them,
 * with health for their age and the surname of that parent's line. A mother who took the family name has a
 * maiden name of her own for her parents. Usually one to three survive; siblings share them.
 */
function rollGrandparents(rng: Rng, parents: readonly Person[], familyName: string, countryCode: string, taken: Set<string>): Person[] {
  const out: Person[] = [];
  for (const parent of parents) {
    const line = parent.kind === 'mother' && parent.lastName === familyName ? randomName(rng, 'female', countryCode).lastName : parent.lastName;
    const grandmaAge = Math.min(99, parent.age + rng.int(20, 35));
    const grandpaAge = Math.min(99, Math.max(parent.age + 18, grandmaAge + rng.int(-3, 6)));
    for (const [gender, age] of [['female', grandmaAge], ['male', grandpaAge]] as const) {
      if (!rng.chance(grandparentAliveChance(age))) continue;
      const gp = makePerson(rng, { kind: 'grandparent', gender, age, countryCode, lastName: line, playerAge: 0, relationship: rng.int(50, 90), taken });
      gp.health = clampStat(rng.int(45, 95) - Math.max(0, age - 65));
      gp.viaId = parent.id;
      out.push(gp);
    }
  }
  return out;
}

/**
 * An orphan's household (GAME_DESIGN §4a): no parents, a foster parent aged 30-55 of modest means (kind
 * stepmother/stepfather, so they act as a guardian: they pay for the child, take them to the doctor and
 * share parent events) and sometimes one or two other foster kids. All carry their own surnames.
 */
function fosterFamily(rng: Rng, countryCode: string, taken: Set<string>, familyName: string): Person[] {
  const mult = getCountry(countryCode).salaryMultiplier;
  const gender: Gender = rng.chance(0.7) ? 'female' : 'male';
  const parent = makePerson(rng, { kind: gender === 'female' ? 'stepmother' : 'stepfather', gender, age: rng.int(30, 55), countryCode, playerAge: 0, relationship: rng.int(35, 75), money: Math.round(rng.int(0, 12_000) * mult), taken });
  parent.foster = true;
  // A foster family is not the child's own: a shared surname would read as a relative.
  const ownName = (p: Person) => {
    for (let n = 0; n < 6 && p.lastName === familyName; n++) p.lastName = randomName(rng, p.gender, countryCode).lastName;
  };
  ownName(parent);
  const out = [parent];
  const kids = rng.weighted([0, 1, 2], (n) => [40, 40, 20][n]!);
  for (let i = 0; i < kids; i++) {
    const kid = makePerson(rng, { kind: 'sibling', age: rng.int(1, 14), countryCode, playerAge: 0, relationship: rng.int(30, 70), biological: false, taken });
    kid.foster = true;
    ownName(kid);
    out.push(kid);
  }
  return out;
}

function rollTraits(rng: Rng): TraitId[] {
  const n = rng.chance(0.7) ? 1 : rng.chance(0.5) ? 2 : 0;
  return rng.shuffle(ALL_TRAITS).slice(0, n);
}

/** Builds a brand-new life. Pure: all randomness comes from `seed`. */
export function createLife(options: NewLifeOptions, seed: number, now = 0): GameState {
  const rng = new Rng(seed);
  // An heir takes over the chosen child's identity: name, gender, country, age and stats.
  const prev = options.heir?.previous;
  const heirId = options.heir?.childId;
  const heir = prev && heirId ? prev.people[heirId] : undefined;
  const countryCode = prev
    ? prev.character.countryCode
    : options.countryCode && COUNTRIES.some((c) => c.code === options.countryCode) ? options.countryCode : rng.pick(COUNTRIES).code;
  const country = getCountry(countryCode);
  const gender: Gender = heir?.gender ?? options.gender ?? rng.pick<Gender>(['male', 'female']);
  const generated = randomName(rng, gender, countryCode);
  const firstName = heir?.firstName ?? (options.firstName?.trim() || generated.firstName);
  const lastName = heir?.lastName ?? (options.lastName?.trim() || (prev ? prev.character.lastName : generated.lastName));
  const startAge = heir?.age ?? 0;
  // How a new life starts (GAME_DESIGN §4a); an heir's life simply continues.
  const scenario: ScenarioId | undefined = prev ? undefined : startingScenario(options);

  // Birth date: a random year within living memory so the era is part of the story.
  const birthYear = prev ? prev.year - startAge : rng.int(1975, 2010);
  const birthMonth = rng.int(1, 12);
  const birthDay = rng.int(1, daysInMonth(birthMonth, birthYear));

  const baseStats = {
    happiness: rng.int(50, 100),
    health: heir?.health ?? rng.int(80, 100),
    smarts: heir?.smarts ?? rng.int(0, 100),
    looks: heir?.looks ?? rng.int(0, 100),
  };
  const stats = { ...baseStats, ...(options.customStats ?? {}) };
  for (const k of Object.keys(stats) as (keyof typeof stats)[]) stats[k] = clampStat(stats[k]);

  const traits = rollTraits(rng);
  if (scenario === 'prodigy') {
    // Brilliant from the start, whatever the custom stats said, and a quick learner (still at most two traits).
    stats.smarts = Math.max(stats.smarts, rng.int(85, 100));
    if (!traits.includes('quick_learner')) traits.splice(0, traits.length, 'quick_learner', ...traits.slice(0, 1));
  }
  const potential = {
    smarts: clampStat(Math.max(stats.smarts, rng.int(60, 100) + (traits.includes('quick_learner') ? 5 : 0))),
    looks: clampStat(Math.max(stats.looks, rng.int(60, 100))),
    health: clampStat(Math.max(stats.health, rng.int(85, 100) + (traits.includes('iron_constitution') ? 5 : 0))),
  };

  const character: Character = {
    id: rng.id('c_'),
    firstName,
    lastName,
    gender,
    birthYear,
    birthMonth,
    birthDay,
    zodiac: zodiacFor(birthMonth, birthDay),
    countryCode,
    city: prev ? prev.character.city : rng.pick(country.cities),
    age: startAge,
    stats,
    potential,
    traits,
    karma: 50,
    fame: 0,
    energy: energyMaxFor(startAge),
    energyMax: energyMaxFor(startAge),
    ...(scenario ? { scenario } : {}),
  };
  if (scenario === 'farm_kid') character.city = farmTown(rng, countryCode, character.city);
  if (scenario === 'immigrant') character.moveAbroad = { age: rng.int(MOVE_ABROAD_AGES.min, MOVE_ABROAD_AGES.max), countryCode: pickDestination(rng, countryCode) };

  // Family
  const people: Record<string, Person> = {};
  // An orphan's foster home and a big family are never rich; a big family is always short of money.
  const rollsWealth = scenario !== 'orphan' && scenario !== 'big_family';
  const wealthy = !prev && (scenario === 'wealthy' || (rollsWealth && rng.chance(0.08)));
  const poor = !prev && !wealthy && (scenario === 'big_family' || (rollsWealth && rng.chance(0.2)));
  const parentMoney = () => (wealthy ? rng.int(400_000, 3_000_000) : poor ? rng.int(0, 8_000) : rng.int(5_000, 150_000)) * country.salaryMultiplier;

  // The previous player, as a dead parent in an heir's family tree.
  let deceasedId: string | undefined;
  if (prev) {
    // Family tree carried over from the previous generation (GAME_DESIGN §16): everyone stays who they were, and
    // only how they are related changes. The heir has known their parents and older siblings since birth.
    const prevChar = prev.character;
    const otherParent = heir?.otherParentId ? prev.people[heir.otherParentId] : undefined;
    const parentKind = (g: Gender): RelationshipKind => (g === 'female' ? 'mother' : 'father');
    // The deceased player becomes a dead parent in the new tree, with the looks, smarts, health and job they died
    // with, and the bond they had with this child.
    const deceased = makePerson(rng, { kind: parentKind(prevChar.gender), gender: prevChar.gender, age: prevChar.age, countryCode, lastName: prevChar.lastName, playerAge: startAge, relationship: heir?.relationship ?? rng.int(60, 95), money: 0 });
    Object.assign(deceased, {
      firstName: prevChar.firstName, alive: false, deathAge: prevChar.age, deathCause: prev.death?.cause, metAtAge: 0,
      looks: prevChar.stats.looks, smarts: prevChar.stats.smarts, health: prevChar.stats.health, occupation: lastOccupation(prev),
    });
    people[deceased.id] = deceased;
    deceasedId = deceased.id;
    // The other parent carries over as they were (two mothers or two fathers included). A child with no
    // recorded other parent gets none: nobody is invented.
    if (otherParent) {
      const survivor = makePerson(rng, {
        kind: parentKind(otherParent.gender), gender: otherParent.gender, age: otherParent.age, countryCode, lastName: otherParent.lastName, playerAge: startAge, relationship: rng.int(60, 95), money: otherParent.money,
      });
      carryOver(survivor, otherParent);
      survivor.metAtAge = 0;
      people[survivor.id] = survivor;
    }
    for (const p of Object.values(prev.people)) {
      if (p.kind === 'child' && p.id !== heirId && p.alive) {
        const sib = makePerson(rng, { kind: 'sibling', gender: p.gender, age: p.age, countryCode, lastName: p.lastName, playerAge: startAge, relationship: rng.int(40, 85) });
        carryOver(sib, p);
        // An older sibling (or a twin) was there from the start; a younger one was born when the heir was that much older.
        sib.metAtAge = Math.max(0, startAge - p.age);
        people[sib.id] = sib;
      }
    }
    for (const p of heirFamily(rng, prev, heir, deceased.id, countryCode, startAge)) people[p.id] = p;
  } else if (scenario === 'orphan') {
    for (const p of fosterFamily(rng, countryCode, new Set([firstName]), lastName)) people[p.id] = p;
  } else {
    const big = scenario === 'big_family';
    const single = scenario === 'single_parent';
    // Rich parents are established in their professions (GAME_DESIGN §4), so they are past their student years.
    const motherAge = big ? rng.int(26, 42) : rng.int(wealthy ? 25 : 18, 42);
    const fatherAge = Math.max(wealthy ? 23 : 18, clampStat(motherAge + rng.int(-4, 10)));
    // Nobody at home shares a first name, the player's included (five children in one house need five names).
    const taken = new Set([firstName]);
    // A single parent is a mother three times in four, otherwise a father.
    const singleDad = single && rng.chance(0.25);
    // The parents' jobs fit the family's money: no lawyer in a home where money is always tight (GAME_DESIGN §4).
    const occupations = wealthy ? OCCUPATIONS_WEALTHY : poor ? OCCUPATIONS_POOR : undefined;
    if (!singleDad) {
      const mother = makePerson(rng, { kind: 'mother', gender: 'female', age: motherAge, countryCode, lastName: rng.chance(0.85) ? lastName : undefined, playerAge: 0, relationship: rng.int(60, 100), money: parentMoney(), taken, occupations });
      people[mother.id] = mother;
    }
    if (singleDad || (!single && rng.chance(0.88))) {
      const father = makePerson(rng, { kind: 'father', gender: 'male', age: fatherAge, countryCode, lastName, playerAge: 0, relationship: rng.int(55, 100), money: parentMoney(), taken, occupations });
      people[father.id] = father;
    }
    // Every parent at home was at least 17 when the eldest was born: the youngest parent caps the older siblings' ages,
    // and so how many there can be (an 18-year-old has room for one, not three born the same year as each other).
    const youngestParent = Math.min(...Object.values(people).map((p) => p.age));
    const room = Math.max(1, Math.min(16, youngestParent - 17));
    const siblings = Math.min(room, big ? rng.int(3, 5) : rng.weighted([0, 1, 2, 3], (n) => [35, 40, 18, 7][n]!));
    for (let i = 0; i < siblings; i++) {
      const sib = makePerson(rng, { kind: 'sibling', age: rng.int(1, room), countryCode, lastName, playerAge: 0, relationship: rng.int(40, 90), biological: true, taken });
      people[sib.id] = sib;
    }
    const parents = Object.values(people).filter((p) => p.kind === 'mother' || p.kind === 'father');
    if (scenario === 'farm_kid') {
      // The farm is the family business: the father (or a single mother) farms it, and often the mother too.
      const father = parents.find((p) => p.kind === 'father');
      for (const p of parents) if (p === father || !father || rng.chance(0.5)) p.occupation = 'Farmer';
    }
    for (const gp of rollGrandparents(rng, parents, lastName, countryCode, taken)) people[gp.id] = gp;
    // The Wealthy start's Lucky trait, once: a wealthy birth that already rolled it keeps the one.
    if (wealthy && !traits.includes('lucky')) traits.push('lucky');
  }

  // An heir's share of the estate: 80% of what the previous character left, split between the children.
  const estate = prev ? Math.max(0, prev.death?.netWorth ?? 0) : 0;
  const coHeirs = prev ? Object.values(prev.people).filter((p) => p.kind === 'child' && p.alive).length : 0;
  const inheritance = heir && estate > 0 ? Math.round((estate * 0.8) / Math.max(1, coHeirs)) : 0;
  // A grown heir had a working life before taking over, so the years nobody played are not judged as idle.
  const workYears = prev ? priorWorkYears(startAge, country) : 0;

  const state: GameState = {
    schemaVersion: SCHEMA_VERSION,
    seed,
    rng: rng.snapshot(),
    createdAt: now,
    updatedAt: now,
    character,
    year: birthYear + startAge,
    education: heir?.growth?.school === 'droppedOut' && startAge >= country.highSchoolEndAge
      ? { ...startingEducation(0, country, stats.smarts), stage: 'done', droppedOut: true }
      : startingEducation(startAge, country, stats.smarts),
    career: { job: null, history: [], totalYearsWorked: workYears, retired: false, experience: {}, listings: [], listingsYear: -1, hustle: null },
    finances: { cash: (heir?.money ?? 0) + inheritance, debt: 0, investments: [], lastYear: { income: 0, salary: 0, passive: 0, expenses: 0, taxes: 0 }, incomeBoostYears: 0, bankrupt: false },
    health: { illnesses: [], addictions: {}, criticalYears: 0, doctorVisitsThisYear: 0, injuries: 0 },
    crime: { record: false, arrests: 0, convictions: 0, crimesCommitted: 0, inPrison: false, sentenceYearsLeft: 0, prisonYearsTotal: 0, notoriety: 0 },
    people,
    assets: [],
    log: [],
    pendingEvent: null,
    eventQueue: [],
    flags: { ...(wealthy ? { wealthyFamily: true } : poor ? { poorFamily: true } : {}), ...(scenario ? scenarioFlags(scenario) : {}) },
    firedEvents: {},
    actionsThisYear: {},
    counters: heirCounters(people, workYears),
    alive: true,
    death: null,
    generation: prev ? prev.generation + 1 : 1,
    ancestors: prev
      ? [
          ...prev.ancestors,
          {
            name: fullName(prev.character),
            birthYear: prev.character.birthYear,
            deathYear: prev.year,
            age: prev.character.age,
            ribbonId: prev.death?.ribbonId ?? 'unknown',
            netWorth: prev.death?.netWorth ?? 0,
          },
        ]
      : [],
    achievements: [],
    lastResult: null,
  };

  if (!prev) return writeBirthLog(state);
  let begun = writeHeirLog(state, prev, inheritance);
  // A minor heir whose only parent was the previous player is taken in from the first day (GAME_DESIGN §10, orphan
  // care): by that player's own grown brother or sister when one is alive, otherwise by an aunt or uncle found as
  // for any orphan. With a parent still at home this does nothing.
  const atHome = Object.values(people).some((p) => p.alive && (p.kind === 'mother' || p.kind === 'father' || p.kind === 'stepmother' || p.kind === 'stepfather'));
  if (startAge < 18 && deceasedId && !atHome) {
    begun = takeInOrphan(begun, [], rng, heirGuardian(rng, prev, deceasedId, countryCode, startAge));
    begun = { ...begun, rng: rng.snapshot() };
  }
  // An heir old enough to work can apply right away rather than wait a year for the listings ageUp rolls from 14.
  if (startAge < 14) return begun;
  return { ...rollListings(begun, rng), rng: rng.snapshot() };
}

/** How old the previous player's brother or sister can be to take a minor heir in: grown, and not past raising a child. */
const HEIR_GUARDIAN_AGES = { min: 18, max: 75 } as const;
/** ...and at least this much older than the heir. */
const HEIR_GUARDIAN_GAP = 10;

/**
 * The previous player's own brother or sister who would take in a minor heir left with no parent (GAME_DESIGN
 * §10): the closest one to that player who is alive and grown (not a foster sibling), carried over as they were
 * and known since the heir's birth, as the heir's aunt or uncle (kind stepmother/stepfather marked `relative`,
 * linked to the dead parent). None when there is no such sibling.
 */
function heirGuardian(rng: Rng, prev: GameState, deceasedId: string, countryCode: string, startAge: number): Person | undefined {
  const sib = Object.values(prev.people)
    .filter((p) => p.kind === 'sibling' && p.alive && !p.foster && p.age >= Math.max(HEIR_GUARDIAN_AGES.min, startAge + HEIR_GUARDIAN_GAP) && p.age <= HEIR_GUARDIAN_AGES.max)
    .sort((a, b) => b.relationship - a.relationship || a.id.localeCompare(b.id))[0];
  if (!sib) return undefined;
  const carer = makePerson(rng, { kind: sib.gender === 'female' ? 'stepmother' : 'stepfather', gender: sib.gender, age: sib.age, countryCode, lastName: sib.lastName, playerAge: startAge, relationship: rng.int(45, 75), money: sib.money });
  carryOver(carer, sib);
  carer.relative = true;
  carer.viaId = deceasedId;
  carer.metAtAge = 0;
  return carer;
}

/**
 * The working years an heir brings into the life (GAME_DESIGN §16): every adult year since leaving school counts,
 * as years worked (so the obituary and the Lazy ribbon judge only the years played) and as general experience. No
 * job or employer is carried over: the previous life never gives the player's children one (their milestones are
 * school, moving out, marriage and children), so a grown heir starts between jobs with this year's listings open.
 */
function priorWorkYears(age: number, country: ReturnType<typeof getCountry>): number {
  return Math.max(0, age - Math.max(18, country.highSchoolEndAge));
}

/**
 * Someone the last life knew stays who they were in the heir's (GAME_DESIGN §16): name, gender, age, job, looks,
 * smarts, health, temper and money, and whether and how they died. `p` is the heir's new record of them (their
 * relation to the heir, a fresh bond and memory); it is updated in place and returned.
 */
function carryOver(p: Person, was: Person): Person {
  Object.assign(p, {
    firstName: was.firstName, lastName: was.lastName, gender: was.gender, age: was.age, alive: was.alive,
    occupation: was.occupation, looks: was.looks, smarts: was.smarts, health: was.health, craziness: was.craziness, money: was.money,
  });
  if (was.deathAge !== undefined) p.deathAge = was.deathAge;
  if (was.deathCause !== undefined) p.deathCause = was.deathCause;
  return p;
}

/** What the previous player did for a living, as their children remember it: the job they died in, else the last one they held. */
function lastOccupation(prev: GameState): string {
  const history = prev.career.history;
  return prev.career.job?.title ?? history[history.length - 1]?.title ?? 'Unemployed';
}

/**
 * The rest of an heir's family (GAME_DESIGN §16): the previous player's living parents become grandparents, and
 * an heir who had married or had children (family.ts) keeps that spouse and those children, now their own.
 */
function heirFamily(rng: Rng, prev: GameState, heir: Person | undefined, deceasedId: string, countryCode: string, startAge: number): Person[] {
  const out: Person[] = [];
  for (const p of Object.values(prev.people)) {
    if ((p.kind !== 'mother' && p.kind !== 'father') || !p.alive) continue;
    const gp = makePerson(rng, { kind: 'grandparent', gender: p.gender, age: p.age, countryCode, lastName: p.lastName, playerAge: startAge, relationship: rng.int(55, 90), money: p.money });
    carryOver(gp, p);
    gp.viaId = deceasedId;
    gp.metAtAge = 0;
    out.push(gp);
  }
  if (!heir) return out;
  const married = heir.growth?.spouse;
  let spouse: Person | undefined;
  if (married) {
    spouse = makePerson(rng, { kind: 'spouse', gender: married.gender, age: Math.max(18, startAge + rng.int(-3, 3)), countryCode, lastName: heir.lastName, playerAge: startAge, relationship: rng.int(60, 90) });
    spouse.firstName = married.firstName;
    spouse.love = rng.int(55, 85);
    out.push(spouse);
  }
  for (const g of Object.values(prev.people)) {
    if (g.kind !== 'grandchild' || g.viaId !== heir.id || !g.alive) continue;
    const kid = makePerson(rng, { kind: 'child', gender: g.gender, age: g.age, countryCode, lastName: g.lastName, playerAge: Math.max(0, startAge - g.age), relationship: rng.int(60, 95), money: 0, biological: married && married.gender === heir.gender ? undefined : true });
    carryOver(kid, g);
    kid.memory = emptyMemory(startAge);
    if (spouse) kid.otherParentId = spouse.id;
    out.push(kid);
  }
  // The spouse is the other parent of those children, so the heir has known them at least since the eldest was born
  // (the last life kept no wedding date; without children it is the takeover year).
  const eldest = Math.max(0, ...out.filter((p) => p.kind === 'child').map((p) => p.age));
  if (spouse) spouse.metAtAge = Math.max(0, startAge - eldest);
  return out;
}

/** Where an heir of `age` stands in school: not yet, in the stage for their age, or finished with a diploma. */
function startingEducation(age: number, country: ReturnType<typeof getCountry>, smarts: number): Education {
  const base: Education = { stage: 'none', enrolled: false, grade: 0, yearsInStage: 0, major: null, degrees: [], droppedOut: false, expelled: false, studiedThisYear: false, studentDebt: 0, scholarship: false };
  if (age < country.schoolStartAge) return base;
  if (age >= country.highSchoolEndAge) return { ...base, stage: 'done', degrees: ['high_school'] };
  const stage = age < 11 ? 'primary' : age < 14 ? 'middle' : 'high';
  const stageStart = stage === 'primary' ? country.schoolStartAge : stage === 'middle' ? 11 : 14;
  return { ...base, stage, enrolled: true, grade: clampStat(50 + (smarts - 50) / 2), yearsInStage: Math.max(0, age - stageStart) };
}

/**
 * A new life's counters: an heir who arrives married with children counts the marriage and the children as theirs,
 * and a grown heir the years they worked before taking over.
 */
function heirCounters(people: Record<string, Person>, workYears: number): LifetimeCounters {
  const counters = emptyCounters();
  const all = Object.values(people);
  return { ...counters, children: all.filter((p) => p.kind === 'child').length, marriages: all.some((p) => p.kind === 'spouse') ? 1 : 0, yearsEmployed: workYears };
}

/** "Grandma Rosa and Grandpa Joe were first in line to hold me." */
function grandparentsLine(state: GameState): string | null {
  const gps = Object.values(state.people).filter((p) => p.kind === 'grandparent' && p.alive);
  if (!gps.length) return null;
  const names = joinList(gps.map((p) => personRef(p)));
  return gps.length <= 2 ? `${names} ${gps.length === 1 ? 'was' : 'were'} first in line to hold me.` : `${names} took turns holding me.`;
}

/** "Traits: Lucky, Charming." A trait listed twice (a lucky roll plus a wealthy birth) shows once. */
function traitLine(traits: readonly TraitId[]): string {
  return `Traits: ${[...new Set(traits)].map((t) => TRAIT_LABELS[t].label).join(', ')}.`;
}

/** A parent's job as it reads after their name: "a nurse", "an engineer", "unemployed". */
function parentJob(occupation: string): string {
  return occupation === 'Unemployed' ? 'unemployed' : withArticle(lowerTitle(occupation));
}

function writeBirthLog(state: GameState): GameState {
  const c = state.character;
  const country = getCountry(c.countryCode);
  const scenario = c.scenario ?? 'standard';
  const mother = Object.values(state.people).find((p) => p.kind === 'mother');
  const father = Object.values(state.people).find((p) => p.kind === 'father');
  const foster = Object.values(state.people).find((p) => p.foster && (p.kind === 'stepmother' || p.kind === 'stepfather'));
  const sibs = Object.values(state.people).filter((p) => p.kind === 'sibling');
  let s = log(state, `${c.birthYear}: Age 0`, 'year');
  s = log(s, `I was born ${c.gender === 'male' ? 'a boy' : 'a girl'} named ${fullName(c)} in ${c.city}, ${country.name}. I'm ${article(c.zodiac)} ${c.zodiac}.`, 'milestone');
  if (scenario === 'orphan') {
    s = log(s, 'I never knew my birth parents. I went home from the hospital to a foster family.', 'bad');
    if (foster) s = log(s, `My ${fosterRelation(foster)} is ${fullName(foster)} (${foster.age}), ${parentJob(foster.occupation)}.`);
    if (sibs.length === 1) s = log(s, `Another foster kid, ${sibs[0]!.firstName}, lives with us.`);
    else if (sibs.length > 1) s = log(s, `${capitalize(numberWord(sibs.length))} other foster kids live with us: ${joinList(sibs.map((x) => x.firstName))}.`);
  } else {
    if (mother && father) s = log(s, `My parents are ${fullName(mother)} (${mother.age}), ${parentJob(mother.occupation)}, and ${fullName(father)} (${father.age}), ${parentJob(father.occupation)}.`);
    else if (mother && scenario === 'single_parent') s = log(s, `My mother is ${fullName(mother)} (${mother.age}), ${parentJob(mother.occupation)}. She's raising me on her own.`);
    else if (father && scenario === 'single_parent') s = log(s, `My father is ${fullName(father)} (${father.age}), ${parentJob(father.occupation)}. He's raising me on his own.`);
    else if (mother) s = log(s, `My mother is ${fullName(mother)} (${mother.age}), ${parentJob(mother.occupation)}. I never knew my father.`);
    if (sibs.length === 1) s = log(s, `I have an older ${sibs[0]!.gender === 'male' ? 'brother' : 'sister'}, ${sibs[0]!.firstName}.`);
    else if (sibs.length > 1) s = log(s, `I have ${numberWord(sibs.length)} older siblings: ${joinList(sibs.map((x) => x.firstName))}.`);
  }
  if (scenario === 'big_family') s = log(s, 'Our house is loud, and the bathroom is never free.');
  const grand = grandparentsLine(state);
  if (grand) s = log(s, grand);
  if (scenario === 'farm_kid') s = log(s, 'My family runs a farm just outside town. The cows were unimpressed by my arrival.');
  if (scenario === 'prodigy') s = log(s, 'The nurses swore I was reading their name tags.', 'good');
  if (state.flags.wealthyFamily) s = log(s, `My family is wealthy. I was born with a silver spoon in my mouth.`, 'good');
  if (state.flags.poorFamily) s = log(s, `My family doesn't have much. Money is always tight at home.`, 'bad');
  if (c.traits.length) s = log(s, traitLine(c.traits));
  return s;
}

/** Opening lines for a life taken over mid-way by an heir. */
function writeHeirLog(state: GameState, prev: GameState, inheritance: number): GameState {
  const c = state.character;
  const country = getCountry(c.countryCode);
  const living = Object.values(state.people).filter((p) => (p.kind === 'mother' || p.kind === 'father' || p.kind === 'grandparent') && p.alive);
  const sibs = Object.values(state.people).filter((p) => p.kind === 'sibling');
  const spouse = Object.values(state.people).find((p) => p.kind === 'spouse');
  const kids = Object.values(state.people).filter((p) => p.kind === 'child');
  const parentLabel = prev.character.gender === 'female' ? 'mother' : 'father';
  const relation = (p: Person) => (p.kind === 'grandparent' ? (p.gender === 'male' ? 'grandfather' : 'grandmother') : p.kind);
  let s = log(state, `${state.year}: Age ${c.age}`, 'year');
  s = log(s, `I'm ${fullName(c)}, ${c.age}, of ${c.city}, ${country.name}. My ${parentLabel} ${fullName(prev.character)} ${prev.death ? deathPhrase(prev.death.cause) : 'died'} at ${prev.character.age}, and the family story continues with me.`, 'milestone');
  if (living.length) s = log(s, `My ${joinList(living.map((p) => `${relation(p)} ${fullName(p)} (${p.age})`))} ${living.length === 1 ? 'is' : 'are'} still with us.`);
  if (sibs.length === 1) s = log(s, `I have ${sibs[0]!.gender === 'male' ? 'a brother' : 'a sister'}, ${sibs[0]!.firstName} (${sibs[0]!.age}).`);
  else if (sibs.length > 1) s = log(s, `I have ${numberWord(sibs.length)} siblings: ${joinList(sibs.map((x) => `${x.firstName} (${x.age})`))}.`);
  if (spouse) s = log(s, `I'm married to ${spouse.firstName}.`);
  if (kids.length === 1) s = log(s, `I have ${kids[0]!.gender === 'male' ? 'a son' : 'a daughter'}, ${kids[0]!.firstName} (${kids[0]!.age}).`);
  else if (kids.length > 1) s = log(s, `I have ${numberWord(kids.length)} children: ${joinList(kids.map((x) => `${x.firstName} (${x.age})`))}.`);
  if (state.education.droppedOut) s = log(s, 'I left high school without a diploma.');
  if (inheritance > 0) s = log(s, `I inherited ${money(s, inheritance)} from ${prev.character.gender === 'female' ? 'Mom' : 'Dad'}'s estate.`, 'money');
  if (c.traits.length) s = log(s, traitLine(c.traits));
  return s;
}
