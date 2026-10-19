/**
 * The complete, serialisable game state and the player-facing action types.
 *
 * Rules:
 *  - Everything here must survive JSON.stringify/parse (no classes, Dates, Maps).
 *  - The engine never mutates a GameState; every function returns a new one.
 *  - `schemaVersion` must be bumped (and a migration added) whenever a field
 *    changes meaning or type.
 */
import type { RngState } from './rng';

export const SCHEMA_VERSION = 1;

export type Gender = 'male' | 'female';

export type StatId = 'happiness' | 'health' | 'smarts' | 'looks';
export const STAT_IDS: readonly StatId[] = ['happiness', 'health', 'smarts', 'looks'];

export interface Stats {
  happiness: number;
  health: number;
  smarts: number;
  looks: number;
}

/** Hidden ceilings fixed at birth ("natural potential"). */
export interface Potential {
  smarts: number;
  looks: number;
  health: number;
}

export type TraitId =
  | 'quick_learner'
  | 'charming'
  | 'iron_constitution'
  | 'lucky'
  | 'hot_headed'
  | 'thrifty'
  | 'creative'
  | 'athletic'
  | 'anxious'
  | 'rebellious';

export interface Character {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthYear: number;
  birthMonth: number; // 1-12
  birthDay: number; // 1-31
  zodiac: string;
  countryCode: string;
  city: string;
  age: number;
  stats: Stats;
  potential: Potential;
  traits: TraitId[];
  /** Hidden 0-100; nudged by kind/cruel acts; shown on the tombstone. */
  karma: number;
  /** 0-100; only matters for fame-track careers. */
  fame: number;
  /** Social energy budget for the current year (Another Life style). */
  energy: number;
  energyMax: number;
  /** How this life started (GAME_DESIGN §4a). Absent for heirs and saves from before scenarios. */
  scenario?: ScenarioId;
  /** Immigrant scenario: the age at which the family moves abroad, and where to. */
  moveAbroad?: { age: number; countryCode: string };
}

/** Starting scenarios offered on the new-life screen (src/data/scenarios.ts). */
export type ScenarioId = 'standard' | 'orphan' | 'big_family' | 'single_parent' | 'immigrant' | 'prodigy' | 'farm_kid' | 'wealthy';

export type RelationshipKind =
  | 'mother'
  | 'father'
  | 'stepmother'
  | 'stepfather'
  | 'sibling'
  | 'child'
  | 'friend'
  | 'bestFriend'
  | 'lover'
  | 'spouse'
  | 'ex'
  | 'coworker'
  | 'classmate'
  | 'enemy'
  | 'pet'
  | 'grandparent'
  | 'grandchild';

export interface PersonMemory {
  /** Age (of the player) of the last interaction. */
  lastInteractionAge: number;
  insults: number;
  compliments: number;
  gifts: number;
  fights: number;
  yearsNeglected: number;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  age: number;
  alive: boolean;
  kind: RelationshipKind;
  /** 0-100 relationship quality. */
  relationship: number;
  /** For lovers/spouses: 0-100 romantic bond that decays if neglected. */
  love?: number;
  looks: number;
  smarts: number;
  health: number;
  /** 0-100 "craziness": volatility in arguments and events. */
  craziness: number;
  occupation: string;
  money: number;
  memory: PersonMemory;
  metAtAge: number;
  marriedAtAge?: number;
  deathAge?: number;
  deathCause?: string;
  /** Pets only. */
  species?: string;
  /** Parent linkage for children (ids of the other parent). */
  otherParentId?: string;
  /** True when the player is the biological parent/child. */
  biological?: boolean;
  /**
   * The relative who makes them family: for a grandparent, the player's parent they are the parent of;
   * for a grandchild, the player's child they are the child of.
   */
  viaId?: string;
  /** Coworkers: the job they share with the player (job definition id and employer). Gone when that job ends. */
  workplace?: { jobId: string; company: string };
  /** The player's children: how they are getting on as they grow up (engine milestones, systems/family.ts). */
  growth?: ChildGrowth;
  /** Orphan scenario: a foster parent (kind stepmother/stepfather) or foster sibling, labelled "foster". */
  foster?: boolean;
}

/** Milestones of one of the player's children. Every field is optional so older saves need no migration. */
export interface ChildGrowth {
  /** 'started' at the country's school age, then 'graduated' or 'droppedOut' at the end of high school. */
  school?: 'started' | 'graduated' | 'droppedOut';
  movedOut?: boolean;
  /** Who they married (they are not a person in the player's life). */
  spouse?: { firstName: string; gender: Gender };
  /** Children of their own born so far: the player's grandchildren through them. */
  kids?: number;
  /** Babies on the way (announced by an event); one is born each year. */
  expecting?: number;
  /** A name promised for the next baby (named after the player). */
  babyName?: { firstName: string; gender: Gender };
}

export type EducationStage = 'none' | 'primary' | 'middle' | 'high' | 'university' | 'graduate' | 'done';

export interface Education {
  stage: EducationStage;
  enrolled: boolean;
  /** 0-100 grade/GPA in the current stage. */
  grade: number;
  yearsInStage: number;
  major: string | null;
  /** Completed credentials, e.g. 'high_school', 'bachelor:computer_science'. */
  degrees: string[];
  droppedOut: boolean;
  expelled: boolean;
  studiedThisYear: boolean;
  studentDebt: number;
  scholarship: boolean;
}

export type JobCategory =
  | 'service'
  | 'trade'
  | 'office'
  | 'tech'
  | 'health'
  | 'law'
  | 'education'
  | 'creative'
  | 'public'
  | 'finance'
  | 'science'
  | 'sports'
  | 'crime';

export interface Job {
  /** Id of the job definition in src/data/jobs. */
  defId: string;
  title: string;
  company: string;
  salary: number;
  /** Rung on the career ladder (0 = entry). */
  level: number;
  /** 0-100 performance; drives raises, promotions and firing. */
  performance: number;
  yearsHeld: number;
  yearsAtLevel: number;
  category: JobCategory;
  partTime: boolean;
  /** Player asked for a raise/promotion this year already. */
  askedThisYear: boolean;
  workedHarderThisYear: boolean;
}

export interface JobHistoryEntry {
  title: string;
  company: string;
  fromAge: number;
  toAge: number;
  salary: number;
  reason: 'quit' | 'fired' | 'promoted' | 'retired' | 'left';
}

export interface Career {
  job: Job | null;
  history: JobHistoryEntry[];
  totalYearsWorked: number;
  retired: boolean;
  /** Years of experience by category, used by job requirements. */
  experience: Partial<Record<JobCategory, number>>;
  /** Available job listings for this year (ids into src/data/jobs + rolled company/salary). */
  listings: JobListing[];
  listingsYear: number;
  /** Active side hustle, if any. */
  hustle: Hustle | null;
}

export interface JobListing {
  id: string;
  defId: string;
  title: string;
  company: string;
  salary: number;
  category: JobCategory;
  partTime: boolean;
}

export interface Hustle {
  defId: string;
  name: string;
  level: number; // 0-5
  followers: number;
  yearsActive: number;
  lastIncome: number;
}

export type AssetKind = 'car' | 'house' | 'item';

export interface Asset {
  id: string;
  defId: string;
  kind: AssetKind;
  name: string;
  value: number;
  purchasePrice: number;
  /** 0-100 condition; affects value and some events. */
  condition: number;
  yearlyUpkeep: number;
  mortgage: { remaining: number; yearlyPayment: number; years: number } | null;
  boughtAtAge: number;
  /** For houses: whether the player lives here. */
  primary?: boolean;
  /** For houses rented out. */
  rentedOut?: boolean;
}

export type InvestmentKind = 'savings' | 'index' | 'crypto';

export interface Investment {
  kind: InvestmentKind;
  amount: number;
  costBasis: number;
}

export interface Finances {
  cash: number;
  /** Non-student debt (loans, gambling, fines). */
  debt: number;
  investments: Investment[];
  lastYear: {
    income: number;
    salary: number;
    passive: number;
    expenses: number;
    taxes: number;
  };
  /** Rewarded-ad boost: multiplies next year's salary. */
  incomeBoostYears: number;
  bankrupt: boolean;
}

export type AddictionKind = 'alcohol' | 'drugs' | 'gambling';

export interface Illness {
  defId: string;
  name: string;
  /** 1-5 severity; health drain per year scales with it. */
  severity: number;
  chronic: boolean;
  yearsLeft: number; // -1 for chronic
  treated: boolean;
}

export interface HealthState {
  illnesses: Illness[];
  addictions: Partial<Record<AddictionKind, number>>; // 0-100 dependency
  /** Years of the "you will die soon" countdown (0 = not active). */
  criticalYears: number;
  doctorVisitsThisYear: number;
  injuries: number;
}

export interface CrimeRecord {
  record: boolean;
  arrests: number;
  convictions: number;
  crimesCommitted: number;
  inPrison: boolean;
  sentenceYearsLeft: number;
  prisonYearsTotal: number;
  notoriety: number; // 0-100
  /** Serving in juvenile detention (sentenced before 18): school continues, at most 2 years, out by 18. */
  juvenile?: boolean;
  /** Length in years of the current stay, sentences added inside included; parole needs half of it served. */
  sentenceYears?: number;
  /** Years of parole left after an early release (the `parole` flag mirrors it for events). */
  paroleYearsLeft?: number;
  /** Convictions sealed with the juvenile record at 18: no longer on the record or in the obituary. */
  sealedConvictions?: number;
}

export type LogKind = 'info' | 'good' | 'bad' | 'event' | 'milestone' | 'money' | 'death' | 'year';

export interface LogEntry {
  age: number;
  year: number;
  text: string;
  kind: LogKind;
}

export interface EventChoiceView {
  id: string;
  label: string;
  /** Optional cost/hint shown under the label. */
  hint?: string;
}

export interface PendingEvent {
  eventId: string;
  title: string;
  text: string;
  choices: EventChoiceView[];
  /** Bound placeholders (names etc.) so effects can reference them. */
  context: Record<string, string>;
  /** Person this event is about, if any. */
  personId?: string;
}

export interface QueuedEvent {
  eventId: string;
  context: Record<string, string>;
  personId?: string;
}

export interface LifetimeCounters {
  workouts: number;
  libraryVisits: number;
  meditations: number;
  vacations: number;
  giftsGiven: number;
  compliments: number;
  insults: number;
  crimes: number;
  arrests: number;
  gamblingSessions: number;
  gamblingWon: number;
  gamblingLost: number;
  lovers: number;
  marriages: number;
  divorces: number;
  children: number;
  jobsHeld: number;
  promotions: number;
  firings: number;
  surgeries: number;
  carsOwned: number;
  housesOwned: number;
  yearsEmployed: number;
  yearsInPrison: number;
  illnesses: number;
  peakNetWorth: number;
  yearsHappy: number; // years with happiness >= 80
  yearsMiserable: number; // years with happiness <= 20
  eventsFaced: number;
  friendsMade: number;
  rewardedAdsUsed: number;
}

export interface DeathInfo {
  age: number;
  year: number;
  cause: string;
  netWorth: number;
  ribbonId: string;
  obituary: string;
  epitaph: string;
}

export interface Ancestor {
  name: string;
  birthYear: number;
  deathYear: number;
  age: number;
  ribbonId: string;
  netWorth: number;
}

export interface LastResult {
  text: string;
  kind: LogKind;
  statDeltas?: Partial<Stats>;
  moneyDelta?: number;
}

export interface GameState {
  schemaVersion: number;
  seed: number;
  rng: RngState;
  createdAt: number;
  updatedAt: number;
  character: Character;
  year: number;
  education: Education;
  career: Career;
  finances: Finances;
  health: HealthState;
  crime: CrimeRecord;
  people: Record<string, Person>;
  assets: Asset[];
  log: LogEntry[];
  pendingEvent: PendingEvent | null;
  eventQueue: QueuedEvent[];
  /** Free-form story flags and counters set by events. */
  flags: Record<string, number | boolean | string>;
  /** eventId -> player age when it last fired. */
  firedEvents: Record<string, number>;
  /** Per-year action counts (reset on ageUp), e.g. { gym: 1 }. */
  actionsThisYear: Record<string, number>;
  counters: LifetimeCounters;
  alive: boolean;
  death: DeathInfo | null;
  generation: number;
  ancestors: Ancestor[];
  /** Achievements unlocked in this life (ids). */
  achievements: string[];
  lastResult: LastResult | null;
  /**
   * Yearly flavor lines written recently: line template -> player age when written, so a line is not
   * repeated within FLAVOR_RULES.repeatGap years. Optional: saves from before it start empty.
   */
  flavorSeen?: Record<string, number>;
}

export interface NewLifeOptions {
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  countryCode?: string;
  /** Premium: start with chosen stats. */
  customStats?: Partial<Stats>;
  /** Premium: start in a wealthy family. */
  wealthyFamily?: boolean;
  /** Starting scenario (default 'standard'); 'wealthy' is the premium wealthy family. Ignored for heirs. */
  scenario?: ScenarioId;
  /** Continue as an heir: carries over surname, family, inheritance. */
  heir?: HeirSeed;
}

export interface HeirSeed {
  childId: string;
  previous: GameState;
}

/** Everything the UI can ask the engine to do between age-ups. */
export type PlayerAction =
  | { type: 'activity'; id: string; option?: string }
  | { type: 'study' }
  | { type: 'skipClass' }
  | { type: 'dropOut' }
  | { type: 'enroll'; major: string }
  | { type: 'applyJob'; listingId: string }
  | { type: 'quitJob' }
  | { type: 'workHarder' }
  | { type: 'askRaise' }
  | { type: 'askPromotion' }
  | { type: 'retire' }
  | { type: 'startHustle'; defId: string }
  | { type: 'stopHustle' }
  | { type: 'interact'; personId: string; interaction: string; option?: string }
  | { type: 'buyAsset'; defId: string; financing: 'cash' | 'mortgage' }
  | { type: 'sellAsset'; assetId: string }
  | { type: 'repairAsset'; assetId: string }
  | { type: 'invest'; kind: InvestmentKind; amount: number }
  | { type: 'withdraw'; kind: InvestmentKind; amount: number }
  | { type: 'payDebt'; amount: number }
  | { type: 'crime'; id: string }
  | { type: 'rewarded'; placement: 'cashBoost' | 'statBoost' | 'secondChance' | 'reroll'; option?: string }
  | { type: 'refreshListings' };

export interface ActionAvailability {
  available: boolean;
  reason?: string;
  cost?: number;
}
