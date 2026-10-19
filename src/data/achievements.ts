/**
 * Achievements: meta progression that survives from life to life on this device.
 *
 * Each test is a cheap, pure check over the current life plus a small summary of the
 * device's other lives (`AchievementContext`). The checker (src/engine/systems/achievements.ts)
 * runs them after every age-up, action and death; the store keeps what was unlocked.
 * Ids never change once shipped (players' unlocks are stored under them).
 */
import type { GameState, Person } from '@/engine/types';
import { formatMoneyFull, netWorth, peakDebt, peakFame } from '@/engine/util';
import { getCountry } from './countries';
import { JOB_BY_ID } from './jobs';

export type AchievementGroup = 'life' | 'style' | 'family' | 'collection' | 'secret';

/** What the device remembers about its other lives, for the collection achievements. */
export interface AchievementContext {
  /** Distinct ribbon ids earned by finished lives (this one included once it has ended). */
  ribbons: readonly string[];
  /** Distinct countries of every life played on this device, this one included. */
  countries: readonly string[];
  /** Finished lives on this device. */
  lives: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  group: AchievementGroup;
  /** Shown as "???" until unlocked. */
  secret?: boolean;
  /** The description for a life in this country, when it names an amount of money (shown in the local currency). */
  describe?: (countryCode: string) => string;
  test: (state: GameState, ctx: AchievementContext) => boolean;
}

/** What an achievement asks for, in the currency of the life being played when there is one. */
export function achievementDescription(def: AchievementDef, countryCode?: string | null): string {
  return countryCode && def.describe ? def.describe(countryCode) : def.description;
}

export const ACHIEVEMENT_GROUPS: readonly { id: AchievementGroup; title: string }[] = [
  { id: 'life', title: 'Milestones' },
  { id: 'style', title: 'Ways to live' },
  { id: 'family', title: 'Family line' },
  { id: 'collection', title: 'Across lives' },
  { id: 'secret', title: 'Secrets' },
];

const flagNumber = (s: GameState, key: string): number => {
  const v = s.flags[key];
  return typeof v === 'number' ? v : 0;
};
const anyone = (s: GameState, test: (p: Person) => boolean): boolean => {
  for (const id in s.people) if (test(s.people[id]!)) return true;
  return false;
};
const countOf = (s: GameState, test: (p: Person) => boolean): number => {
  let n = 0;
  for (const id in s.people) if (test(s.people[id]!)) n++;
  return n;
};
/** Rounds to two significant figures: 12,450,000 → 12,000,000. */
const roundTwo = (n: number): number => {
  const unit = 10 ** Math.max(0, Math.floor(Math.log10(Math.max(1, n))) - 1);
  return Math.round(n / unit) * unit;
};

/**
 * A USD amount in the character's economy (scaled by the salary multiplier, like the ribbons), in the local
 * currency and rounded to two significant figures, so a target reads as a round number on screen:
 * $20,000 of debt is ₹250,000 in India and £13,000 in the UK.
 */
export function localTarget(countryCode: string, usd: number): number {
  const c = getCountry(countryCode);
  return roundTwo(usd * c.salaryMultiplier * c.fxRate);
}
/** An amount of USD as the player sees it, in the local currency (rounded to whole units, as on screen). */
const shown = (countryCode: string, usd: number): number => Math.round(usd * getCountry(countryCode).fxRate);
/** A local-currency target formatted as on screen: "₹250,000". */
const targetText = (countryCode: string, local: number): string => formatMoneyFull(local / getCountry(countryCode).fxRate, countryCode);

/**
 * The Millionaire target as the player sees it, in the local currency: a million US dollars at local wages,
 * and never less than a million of the local currency, so the net worth on screen always reads as a million
 * or more. $1,000,000 in the US, £1,000,000 in the UK, ₹12,000,000 in India, ₦150,000,000 in Nigeria.
 */
export function millionaireTarget(countryCode: string): number {
  return Math.max(1_000_000, localTarget(countryCode, 1_000_000));
}
const millionaire = (s: GameState): boolean => shown(s.character.countryCode, netWorth(s)) >= millionaireTarget(s.character.countryCode);
/** "₹12,000,000": the target as formatted on screen. */
const millionaireAmount = (countryCode: string): string => targetText(countryCode, millionaireTarget(countryCode));
const millionaireText = (countryCode: string): string =>
  millionaireTarget(countryCode) === 1_000_000
    ? `Reach a net worth of ${millionaireAmount(countryCode)}.`
    : `Reach a net worth of ${millionaireAmount(countryCode)}, a million US dollars at ${getCountry(countryCode).demonym} wages.`;
/** Debt Free's target: $20,000 of debt at local wages, in the local currency ("₹250,000"). */
const debtFreeTarget = (countryCode: string): number => localTarget(countryCode, 20_000);
/** An adult who left school without a diploma (a student still working toward one, as in a country whose high school runs to 19, has not). */
const noDiploma = (s: GameState): boolean =>
  s.character.age >= 18 && !s.education.degrees.includes('high_school') && !(s.education.enrolled && (s.education.stage === 'primary' || s.education.stage === 'middle' || s.education.stage === 'high'));

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  // Milestones
  { id: 'graduate', group: 'life', name: 'Cap and Gown', emoji: '🎓', description: 'Earn a university degree.', test: (s) => s.education.degrees.some((d) => d.startsWith('bachelor')) },
  { id: 'postgrad', group: 'life', name: 'Postgrad', emoji: '📜', description: "Earn a master's degree, a doctorate or a professional degree.", test: (s) => s.education.degrees.some((d) => d.startsWith('master') || d.startsWith('doctor')) },
  { id: 'doctor', group: 'life', name: 'Doctor in the House', emoji: '🩺', description: 'Work as a physician or a surgeon.', test: (s) => !!s.career.job && (s.career.job.defId === 'doctor' || s.career.job.defId === 'surgeon') && s.career.job.level >= 1 },
  { id: 'first_job', group: 'life', name: 'Clocking In', emoji: '💼', description: 'Get your first job.', test: (s) => s.counters.jobsHeld >= 1 || !!s.career.job },
  {
    id: 'top_rung',
    group: 'life',
    name: 'Top of the Ladder',
    emoji: '🏢',
    description: 'Reach the highest rung of a full-time career.',
    test: (s) => {
      const job = s.career.job;
      const def = job ? JOB_BY_ID[job.defId] : undefined;
      return !!job && !!def && !job.partTime && def.ladder.length >= 3 && job.level >= def.ladder.length - 1;
    },
  },
  { id: 'married', group: 'life', name: 'Tied the Knot', emoji: '💍', description: 'Get married.', test: (s) => s.counters.marriages >= 1 },
  { id: 'golden_anniversary', group: 'life', name: 'Golden Anniversary', emoji: '💛', description: 'Stay married to the same person for 50 years.', test: (s) => anyone(s, (p) => p.kind === 'spouse' && p.alive && p.marriedAtAge !== undefined && s.character.age - p.marriedAtAge >= 50) },
  { id: 'full_house', group: 'life', name: 'Full House', emoji: '🧸', description: 'Have three children.', test: (s) => s.counters.children >= 3 || countOf(s, (p) => p.kind === 'child') >= 3 },
  { id: 'homeowner', group: 'life', name: 'Homeowner', emoji: '🏡', description: 'Buy a home.', test: (s) => s.counters.housesOwned >= 1 || s.assets.some((a) => a.kind === 'house') },
  { id: 'mansion', group: 'life', name: 'Too Many Bathrooms', emoji: '🏰', description: 'Own a mansion.', test: (s) => s.assets.some((a) => a.defId === 'mansion') },
  {
    id: 'millionaire',
    group: 'life',
    name: 'Millionaire',
    emoji: '💰',
    description: 'Reach a net worth of a million in your currency, or a million US dollars at local wages if more.',
    describe: millionaireText,
    test: millionaire,
  },
  // A pet of my own: the family dog that was there when I was born does not count.
  { id: 'first_pet', group: 'life', name: 'Pet Person', emoji: '🐾', description: 'Bring home your first pet.', test: (s) => anyone(s, (p) => p.kind === 'pet' && p.metAtAge > 0) },
  { id: 'lifelong_friend', group: 'life', name: 'Friends for Life', emoji: '🤝', description: 'Stay close to a friend you met 40 years ago.', test: (s) => anyone(s, (p) => p.alive && (p.kind === 'friend' || p.kind === 'bestFriend') && p.relationship >= 80 && s.character.age - p.metAtAge >= 40) },
  { id: 'retired', group: 'life', name: 'Gold Watch', emoji: '⌚', description: 'Retire from work.', test: (s) => s.career.retired },
  { id: 'centenarian', group: 'life', name: 'Century', emoji: '🎂', description: 'Live to 100.', test: (s) => s.character.age >= 100 },
  { id: 'still_here', group: 'life', name: 'Still Here', emoji: '🐢', description: 'Live to 110.', test: (s) => s.character.age >= 110 },

  // Ways to live
  {
    id: 'clean_hands',
    group: 'style',
    name: 'Clean Hands',
    emoji: '🧼',
    description: 'Die at 80 or older without ever committing a crime.',
    test: (s) => !s.alive && s.character.age >= 80 && s.counters.crimes === 0 && s.crime.crimesCommitted === 0 && s.crime.arrests === 0,
  },
  { id: 'repeat_offender', group: 'style', name: 'Repeat Offender', emoji: '🔒', description: 'Be sentenced to prison three times.', test: (s) => s.crime.convictions >= 3 },
  {
    id: 'debt_free',
    group: 'style',
    name: 'Debt Free',
    emoji: '🧾',
    description: "Pay off a debt of $20,000 or more, in your country's terms, without going bankrupt.",
    describe: (cc) => `Pay off a debt of ${targetText(cc, debtFreeTarget(cc))} or more without going bankrupt.`,
    test: (s) => shown(s.character.countryCode, peakDebt(s)) >= debtFreeTarget(s.character.countryCode) && s.finances.debt <= 0 && s.education.studentDebt <= 0 && !s.finances.bankrupt,
  },
  { id: 'famous', group: 'style', name: 'Household Name', emoji: '⭐', description: 'Reach 80 fame.', test: (s) => peakFame(s) >= 80 },
  { id: 'hustle_top', group: 'style', name: 'Empire of One', emoji: '📈', description: 'Grow a side hustle to its top level.', test: (s) => (s.career.hustle?.level ?? 0) >= 5 || s.flags.hustleMaxed === true },
  { id: 'saint', group: 'style', name: 'Saint', emoji: '😇', description: 'Push your hidden karma to 95.', test: (s) => s.character.karma >= 95 },
  { id: 'full_ride', group: 'style', name: 'Full Ride', emoji: '🏅', description: 'Win a university scholarship.', test: (s) => s.education.scholarship },
  { id: 'frequent_flyer', group: 'style', name: 'Frequent Flyer', emoji: '✈️', description: 'Take 10 vacations in one life.', test: (s) => s.counters.vacations >= 10 },
  { id: 'gym_rat', group: 'style', name: 'Gym Rat', emoji: '🏋️', description: 'Work out 100 times in one life.', test: (s) => s.counters.workouts >= 100 },
  { id: 'silver_tongue', group: 'style', name: 'Silver Tongue', emoji: '💬', description: 'Give 50 compliments in one life.', test: (s) => s.counters.compliments >= 50 },
  {
    id: 'dropout_millionaire',
    group: 'style',
    name: 'Dropout Millionaire',
    emoji: '🎒',
    description: 'Become a millionaire without a high school diploma.',
    describe: (cc) => `Reach a net worth of ${millionaireAmount(cc)} without a high school diploma.`,
    test: (s) => noDiploma(s) && millionaire(s),
  },

  // Family line
  { id: 'next_generation', group: 'family', name: 'Next Generation', emoji: '🌱', description: 'Carry on the family line as your own child.', test: (s) => s.generation >= 2 },
  { id: 'dynasty', group: 'family', name: 'Dynasty', emoji: '👑', description: 'Reach the fifth generation of one family.', test: (s) => s.generation >= 5 },

  // Across lives
  { id: 'one_down', group: 'collection', name: 'One Down', emoji: '🪦', description: 'Finish your first life.', test: (_s, ctx) => ctx.lives >= 1 },
  { id: 'again_and_again', group: 'collection', name: 'Again and Again', emoji: '🔁', description: 'Finish 10 lives.', test: (_s, ctx) => ctx.lives >= 10 },
  { id: 'ribbon_collector', group: 'collection', name: 'Ribbon Collector', emoji: '🎀', description: 'Earn 10 different ribbons.', test: (_s, ctx) => ctx.ribbons.length >= 10 },
  { id: 'world_citizen', group: 'collection', name: 'Citizen of the World', emoji: '🌍', description: 'Live lives in five different countries.', test: (_s, ctx) => ctx.countries.length >= 5 },

  // Secrets
  { id: 'zookeeper', group: 'secret', secret: true, name: 'Zookeeper', emoji: '🦜', description: 'Share one life with five pets.', test: (s) => countOf(s, (p) => p.kind === 'pet') >= 5 },
  { id: 'three_strikes', group: 'secret', secret: true, name: 'Three Strikes', emoji: '📦', description: 'Get fired three times.', test: (s) => s.counters.firings >= 3 },
  // Proposals turned down are counted by the propose interaction (src/engine/systems/relationships.ts).
  { id: 'ouch', group: 'secret', secret: true, name: 'Ouch', emoji: '💔', description: 'Propose and hear no.', test: (s) => flagNumber(s, 'proposalsRejected') >= 1 },
  { id: 'practice_makes_perfect', group: 'secret', secret: true, name: 'Practice Makes Perfect', emoji: '💒', description: 'Get divorced three times.', test: (s) => s.counters.divorces >= 3 },
  { id: 'bird_brain', group: 'secret', secret: true, name: 'Bird Brain', emoji: '🐦', description: 'Take in a pigeon.', test: (s) => anyone(s, (p) => p.kind === 'pet' && p.species === 'pigeon') },
  { id: 'rock_bottom', group: 'secret', secret: true, name: 'Rock Bottom', emoji: '📉', description: 'Declare bankruptcy.', test: (s) => s.finances.bankrupt },
  // counters.surgeries also counts operations from health events (an appendix, a hip); the plastic surgery activity keeps its own count.
  { id: 'mirror_mirror', group: 'secret', secret: true, name: 'Mirror, Mirror', emoji: '🪞', description: 'Have cosmetic surgery three times.', test: (s) => flagNumber(s, 'cosmeticSurgeries') >= 3 },
];

export const ACHIEVEMENT_BY_ID: Record<string, AchievementDef> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
