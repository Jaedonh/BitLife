import { COUNTRIES, getCountry } from '@/data/countries';
import { COMPANY_NAMES, COMPANY_SUFFIXES, NAMES } from '@/data/names';
import { Rng } from '../rng';
import type {
  Character,
  GameState,
  Gender,
  LifetimeCounters,
  NewLifeOptions,
  Person,
  PersonMemory,
  RelationshipKind,
  TraitId,
} from '../types';
import { SCHEMA_VERSION } from '../types';
import { clampStat, daysInMonth, fullName, log, zodiacFor } from '../util';

const ALL_TRAITS: readonly TraitId[] = [
  'quick_learner', 'charming', 'iron_constitution', 'lucky', 'hot_headed', 'thrifty', 'creative', 'athletic', 'anxious', 'rebellious',
];

export const TRAIT_LABELS: Record<TraitId, { label: string; description: string }> = {
  quick_learner: { label: 'Quick learner', description: 'Studying and library visits give more Smarts.' },
  charming: { label: 'Charming', description: 'People warm to you faster; compliments land better.' },
  iron_constitution: { label: 'Iron constitution', description: 'Illnesses are rarer and milder.' },
  lucky: { label: 'Lucky', description: 'Better odds in gambling, lotteries and risky choices.' },
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
  const pool = NAMES[getCountry(countryCode).namePool];
  return { firstName: rng.pick(gender === 'male' ? pool.male : pool.female), lastName: rng.pick(pool.surnames) };
}

export function randomCompany(rng: Rng): string {
  return `${rng.pick(COMPANY_NAMES)} ${rng.pick(COMPANY_SUFFIXES)}`;
}

const OCCUPATIONS_ADULT = [
  'Teacher', 'Nurse', 'Electrician', 'Accountant', 'Shop Manager', 'Software Developer', 'Chef', 'Bus Driver', 'Police Officer', 'Sales Rep',
  'Mechanic', 'Pharmacist', 'Graphic Designer', 'Plumber', 'Receptionist', 'Lawyer', 'Journalist', 'Farmer', 'Dentist', 'Barber', 'Engineer',
  'Social Worker', 'Carpenter', 'Real Estate Agent', 'Librarian', 'Firefighter', 'Waiter', 'Architect', 'Photographer', 'Unemployed',
];

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
  },
): Person {
  const gender = opts.gender ?? rng.pick<Gender>(['male', 'female']);
  const name = randomName(rng, gender, opts.countryCode);
  const adult = opts.age >= 18;
  return {
    id: rng.id('p_'),
    firstName: name.firstName,
    lastName: opts.lastName ?? name.lastName,
    gender,
    age: opts.age,
    alive: true,
    kind: opts.kind,
    relationship: opts.relationship ?? rng.int(40, 90),
    looks: rng.int(10, 95),
    smarts: rng.int(10, 95),
    health: rng.int(adult ? 50 : 80, 100),
    craziness: rng.int(0, 100),
    occupation: opts.occupation ?? (adult ? rng.pick(OCCUPATIONS_ADULT) : 'Student'),
    money: opts.money ?? (adult ? rng.int(2_000, 120_000) : 0),
    memory: emptyMemory(opts.playerAge),
    metAtAge: opts.playerAge,
    biological: opts.biological,
    species: opts.species,
  };
}

function rollTraits(rng: Rng): TraitId[] {
  const n = rng.chance(0.7) ? 1 : rng.chance(0.5) ? 2 : 0;
  return rng.shuffle(ALL_TRAITS).slice(0, n);
}

/** Builds a brand-new life. Pure: all randomness comes from `seed`. */
export function createLife(options: NewLifeOptions, seed: number, now = 0): GameState {
  const rng = new Rng(seed);
  const countryCode = options.countryCode && COUNTRIES.some((c) => c.code === options.countryCode) ? options.countryCode : rng.pick(COUNTRIES).code;
  const country = getCountry(countryCode);
  const gender: Gender = options.gender ?? rng.pick<Gender>(['male', 'female']);
  const generated = randomName(rng, gender, countryCode);
  const firstName = options.firstName?.trim() || generated.firstName;
  const lastName = options.lastName?.trim() || (options.heir ? options.heir.previous.character.lastName : generated.lastName);

  // Birth date: a random year within living memory so the era is part of the story.
  const birthYear = options.heir ? options.heir.previous.year : rng.int(1975, 2010);
  const birthMonth = rng.int(1, 12);
  const birthDay = rng.int(1, daysInMonth(birthMonth, birthYear));

  const baseStats = {
    happiness: rng.int(50, 100),
    health: rng.int(80, 100),
    smarts: rng.int(0, 100),
    looks: rng.int(0, 100),
  };
  const stats = { ...baseStats, ...(options.customStats ?? {}) };
  for (const k of Object.keys(stats) as (keyof typeof stats)[]) stats[k] = clampStat(stats[k]);

  const traits = rollTraits(rng);
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
    city: rng.pick(country.cities),
    age: 0,
    stats,
    potential,
    traits,
    karma: 50,
    fame: 0,
    energy: 3,
    energyMax: 3,
  };

  // Family
  const people: Record<string, Person> = {};
  const wealthy = options.wealthyFamily === true || rng.chance(0.08);
  const poor = !wealthy && rng.chance(0.2);
  const parentMoney = () => (wealthy ? rng.int(400_000, 3_000_000) : poor ? rng.int(0, 8_000) : rng.int(5_000, 150_000)) * country.salaryMultiplier;

  if (options.heir) {
    // Family tree carried over from the previous generation.
    const prev = options.heir.previous;
    const prevChar = prev.character;
    const child = prev.people[options.heir.childId];
    const otherParent = child?.otherParentId ? prev.people[child.otherParentId] : undefined;
    const mother = makePerson(rng, {
      kind: 'mother', gender: 'female', age: prevChar.gender === 'female' ? prevChar.age : (otherParent?.age ?? prevChar.age), countryCode,
      lastName, playerAge: 0, relationship: rng.int(60, 95), money: 0,
    });
    const father = makePerson(rng, {
      kind: 'father', gender: 'male', age: prevChar.gender === 'male' ? prevChar.age : (otherParent?.age ?? prevChar.age), countryCode,
      lastName, playerAge: 0, relationship: rng.int(60, 95), money: 0,
    });
    // The deceased player becomes a dead parent in the new tree; the other parent lives on.
    if (prevChar.gender === 'female') {
      mother.firstName = prevChar.firstName; mother.alive = false; mother.deathAge = prevChar.age; mother.deathCause = prev.death?.cause;
      if (otherParent) { father.firstName = otherParent.firstName; father.lastName = otherParent.lastName; father.alive = otherParent.alive; father.money = otherParent.money; }
    } else {
      father.firstName = prevChar.firstName; father.alive = false; father.deathAge = prevChar.age; father.deathCause = prev.death?.cause;
      if (otherParent) { mother.firstName = otherParent.firstName; mother.lastName = otherParent.lastName; mother.alive = otherParent.alive; mother.money = otherParent.money; }
    }
    people[mother.id] = mother;
    people[father.id] = father;
    for (const p of Object.values(prev.people)) {
      if (p.kind === 'child' && p.id !== options.heir.childId && p.alive) {
        const sib = makePerson(rng, { kind: 'sibling', gender: p.gender, age: p.age, countryCode, lastName: p.lastName, playerAge: 0, relationship: rng.int(40, 85) });
        sib.firstName = p.firstName;
        people[sib.id] = sib;
      }
    }
  } else {
    const motherAge = rng.int(18, 42);
    const fatherAge = clampStat(motherAge + rng.int(-4, 10));
    const mother = makePerson(rng, { kind: 'mother', gender: 'female', age: motherAge, countryCode, lastName: rng.chance(0.85) ? lastName : undefined, playerAge: 0, relationship: rng.int(60, 100), money: parentMoney() });
    people[mother.id] = mother;
    if (rng.chance(0.88)) {
      const father = makePerson(rng, { kind: 'father', gender: 'male', age: Math.max(18, fatherAge), countryCode, lastName, playerAge: 0, relationship: rng.int(55, 100), money: parentMoney() });
      people[father.id] = father;
    }
    const siblings = rng.weighted([0, 1, 2, 3], (n) => [35, 40, 18, 7][n]!);
    for (let i = 0; i < siblings; i++) {
      const sib = makePerson(rng, { kind: 'sibling', age: rng.int(1, Math.min(16, motherAge - 17)), countryCode, lastName, playerAge: 0, relationship: rng.int(40, 90), biological: true });
      people[sib.id] = sib;
    }
    if (wealthy) traits.push('lucky');
  }

  const state: GameState = {
    schemaVersion: SCHEMA_VERSION,
    seed,
    rng: rng.snapshot(),
    createdAt: now,
    updatedAt: now,
    character,
    year: birthYear,
    education: { stage: 'none', enrolled: false, grade: 0, yearsInStage: 0, major: null, degrees: [], droppedOut: false, expelled: false, studiedThisYear: false, studentDebt: 0, scholarship: false },
    career: { job: null, history: [], totalYearsWorked: 0, retired: false, experience: {}, listings: [], listingsYear: -1, hustle: null },
    finances: { cash: 0, debt: 0, investments: [], lastYear: { income: 0, salary: 0, passive: 0, expenses: 0, taxes: 0 }, incomeBoostYears: 0, bankrupt: false },
    health: { illnesses: [], addictions: {}, criticalYears: 0, doctorVisitsThisYear: 0, injuries: 0 },
    crime: { record: false, arrests: 0, convictions: 0, crimesCommitted: 0, inPrison: false, sentenceYearsLeft: 0, prisonYearsTotal: 0, notoriety: 0 },
    people,
    assets: [],
    log: [],
    pendingEvent: null,
    eventQueue: [],
    flags: wealthy ? { wealthyFamily: true } : poor ? { poorFamily: true } : {},
    firedEvents: {},
    actionsThisYear: {},
    counters: emptyCounters(),
    alive: true,
    death: null,
    generation: options.heir ? options.heir.previous.generation + 1 : 1,
    ancestors: options.heir
      ? [
          ...options.heir.previous.ancestors,
          {
            name: fullName(options.heir.previous.character),
            birthYear: options.heir.previous.character.birthYear,
            deathYear: options.heir.previous.year,
            age: options.heir.previous.character.age,
            ribbonId: options.heir.previous.death?.ribbonId ?? 'unknown',
            netWorth: options.heir.previous.death?.netWorth ?? 0,
          },
        ]
      : [],
    achievements: [],
    lastResult: null,
  };

  return writeBirthLog(state);
}

function writeBirthLog(state: GameState): GameState {
  const c = state.character;
  const country = getCountry(c.countryCode);
  const mother = Object.values(state.people).find((p) => p.kind === 'mother');
  const father = Object.values(state.people).find((p) => p.kind === 'father');
  const sibs = Object.values(state.people).filter((p) => p.kind === 'sibling');
  let s = log(state, `${c.birthYear}: Age 0`, 'year');
  s = log(s, `I was born ${c.gender === 'male' ? 'a boy' : 'a girl'} named ${fullName(c)} in ${c.city}, ${country.name}. I'm a ${c.zodiac}.`, 'milestone');
  if (mother && father) s = log(s, `My parents are ${fullName(mother)} (${mother.age}), ${mother.occupation.toLowerCase()}, and ${fullName(father)} (${father.age}), ${father.occupation.toLowerCase()}.`);
  else if (mother) s = log(s, `My mother is ${fullName(mother)} (${mother.age}), ${mother.occupation.toLowerCase()}. I never knew my father.`);
  if (sibs.length === 1) s = log(s, `I have an older ${sibs[0]!.gender === 'male' ? 'brother' : 'sister'}, ${sibs[0]!.firstName}.`);
  else if (sibs.length > 1) s = log(s, `I have ${sibs.length} older siblings: ${sibs.map((x) => x.firstName).join(', ')}.`);
  if (state.flags.wealthyFamily) s = log(s, `My family is wealthy. I was born with a silver spoon in my mouth.`, 'good');
  if (state.flags.poorFamily) s = log(s, `My family doesn't have much. Money is always tight at home.`, 'bad');
  if (c.traits.length) s = log(s, `Traits: ${c.traits.map((t) => TRAIT_LABELS[t].label).join(', ')}.`);
  return s;
}
