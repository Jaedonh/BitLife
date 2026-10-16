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
  TraitId,
} from '../types';
import { SCHEMA_VERSION } from '../types';
import { clampStat, daysInMonth, fullName, log, zodiacFor } from '../util';
import { energyMaxFor } from './aging';

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
    money: opts.money ?? (adult ? Math.round(rng.int(2_000, 120_000) * getCountry(opts.countryCode).salaryMultiplier) : 0),
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
  };

  // Family
  const people: Record<string, Person> = {};
  const wealthy = !prev && (options.wealthyFamily === true || rng.chance(0.08));
  const poor = !prev && !wealthy && rng.chance(0.2);
  const parentMoney = () => (wealthy ? rng.int(400_000, 3_000_000) : poor ? rng.int(0, 8_000) : rng.int(5_000, 150_000)) * country.salaryMultiplier;

  if (prev) {
    // Family tree carried over from the previous generation.
    const prevChar = prev.character;
    const otherParent = heir?.otherParentId ? prev.people[heir.otherParentId] : undefined;
    const mother = makePerson(rng, {
      kind: 'mother', gender: 'female', age: prevChar.gender === 'female' ? prevChar.age : (otherParent?.age ?? prevChar.age), countryCode,
      lastName, playerAge: startAge, relationship: rng.int(60, 95), money: 0,
    });
    const father = makePerson(rng, {
      kind: 'father', gender: 'male', age: prevChar.gender === 'male' ? prevChar.age : (otherParent?.age ?? prevChar.age), countryCode,
      lastName, playerAge: startAge, relationship: rng.int(60, 95), money: 0,
    });
    // The deceased player becomes a dead parent in the new tree; the other parent lives on.
    const survivor = prevChar.gender === 'female' ? father : mother;
    const deceased = prevChar.gender === 'female' ? mother : father;
    deceased.firstName = prevChar.firstName; deceased.alive = false; deceased.deathAge = prevChar.age; deceased.deathCause = prev.death?.cause;
    if (otherParent) {
      survivor.firstName = otherParent.firstName; survivor.lastName = otherParent.lastName; survivor.alive = otherParent.alive; survivor.money = otherParent.money;
      survivor.deathAge = otherParent.deathAge; survivor.deathCause = otherParent.deathCause;
    }
    people[mother.id] = mother;
    people[father.id] = father;
    for (const p of Object.values(prev.people)) {
      if (p.kind === 'child' && p.id !== heirId && p.alive) {
        const sib = makePerson(rng, { kind: 'sibling', gender: p.gender, age: p.age, countryCode, lastName: p.lastName, playerAge: startAge, relationship: rng.int(40, 85) });
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

  // An heir's share of the estate: 80% of what the previous character left, split between the children.
  const estate = prev ? Math.max(0, prev.death?.netWorth ?? 0) : 0;
  const coHeirs = prev ? Object.values(prev.people).filter((p) => p.kind === 'child' && p.alive).length : 0;
  const inheritance = heir && estate > 0 ? Math.round((estate * 0.8) / Math.max(1, coHeirs)) : 0;

  const state: GameState = {
    schemaVersion: SCHEMA_VERSION,
    seed,
    rng: rng.snapshot(),
    createdAt: now,
    updatedAt: now,
    character,
    year: birthYear + startAge,
    education: startingEducation(startAge, country, stats.smarts),
    career: { job: null, history: [], totalYearsWorked: 0, retired: false, experience: {}, listings: [], listingsYear: -1, hustle: null },
    finances: { cash: (heir?.money ?? 0) + inheritance, debt: 0, investments: [], lastYear: { income: 0, salary: 0, passive: 0, expenses: 0, taxes: 0 }, incomeBoostYears: 0, bankrupt: false },
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

  return prev ? writeHeirLog(state, prev, inheritance) : writeBirthLog(state);
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

/** Opening lines for a life taken over mid-way by an heir. */
function writeHeirLog(state: GameState, prev: GameState, inheritance: number): GameState {
  const c = state.character;
  const country = getCountry(c.countryCode);
  const living = Object.values(state.people).filter((p) => (p.kind === 'mother' || p.kind === 'father') && p.alive);
  const sibs = Object.values(state.people).filter((p) => p.kind === 'sibling');
  const parentLabel = prev.character.gender === 'female' ? 'mother' : 'father';
  let s = log(state, `${state.year}: Age ${c.age}`, 'year');
  s = log(s, `I'm ${fullName(c)}, ${c.age}, of ${c.city}, ${country.name}. My ${parentLabel} ${fullName(prev.character)} died${prev.death ? ` of ${prev.death.cause}` : ''} at ${prev.character.age}, and the family story continues with me.`, 'milestone');
  if (living.length) s = log(s, `My ${living.map((p) => `${p.kind} ${fullName(p)} (${p.age})`).join(' and ')} ${living.length === 1 ? 'is' : 'are'} still with us.`);
  if (sibs.length === 1) s = log(s, `I have a ${sibs[0]!.gender === 'male' ? 'brother' : 'sister'}, ${sibs[0]!.firstName} (${sibs[0]!.age}).`);
  else if (sibs.length > 1) s = log(s, `I have ${sibs.length} siblings: ${sibs.map((x) => `${x.firstName} (${x.age})`).join(', ')}.`);
  if (inheritance > 0) s = log(s, `I inherited ${country.currencySymbol}${inheritance.toLocaleString('en-US')} from ${prev.character.firstName}'s estate.`, 'money');
  if (c.traits.length) s = log(s, `Traits: ${c.traits.map((t) => TRAIT_LABELS[t].label).join(', ')}.`);
  return s;
}
