import { getCountry } from '@/data/countries';
import { HUSTLES } from '@/data/hustles';
import { personRef } from '@/engine/events/text';
import type { GameState } from '@/engine/types';

export type EarlyStage = { emoji: string; title: string; body: string };
export type Unlock = { emoji: string; label: string; age: number; inYears: number };

/** Ages at which the next parts of Work & School open up (mirrors the engine's own gates). */
const PART_TIME_AGE = 14;
const FULL_TIME_AGE = 18;
const PRESCHOOL_AGE = 4;
const DAYCARE_AGE = 2;

/**
 * Who a baby is at home with, as the journal names them: Mom, else Dad (a second mother or father is Mama or Papa,
 * so an heir whose late parent was Dad is at home with Papa), else the aunt or uncle who took them in, else "family".
 */
function caregiver(state: GameState): string {
  const living = Object.values(state.people).filter((p) => p.alive);
  const who = living.find((p) => p.kind === 'mother') ?? living.find((p) => p.kind === 'father') ?? living.find((p) => p.relative && (p.kind === 'stepmother' || p.kind === 'stepfather'));
  return who ? personRef(who, state.people) : 'family';
}

/**
 * What a child too young for school is doing, for the Work & School screen: at home as a
 * baby, daycare as a toddler, preschool the year or two before school. Null once school age.
 */
export function earlyStage(state: GameState): EarlyStage | null {
  const age = state.character.age;
  const schoolAge = getCountry(state.character.countryCode).schoolStartAge;
  if (age >= schoolAge || state.education.enrolled) return null;
  if (age < DAYCARE_AGE) return { emoji: '👶', title: `At home with ${caregiver(state)}`, body: 'Naps, bottles and being carried everywhere. Nothing to sign up for yet.' };
  if (age < PRESCHOOL_AGE || schoolAge <= PRESCHOOL_AGE) return { emoji: '🧸', title: 'Daycare', body: 'Finger paint, snack time and your very first friends.' };
  return { emoji: '🎨', title: 'Preschool', body: 'Letters, numbers and learning to share the crayons.' };
}

/** The next milestones still ahead (school, preschool, side hustles, jobs), soonest first. */
export function upcomingUnlocks(state: GameState): Unlock[] {
  const age = state.character.age;
  const country = getCountry(state.character.countryCode);
  const hustleAge = Math.min(...HUSTLES.map((h) => h.minAge));
  const all: Omit<Unlock, 'inYears'>[] = [
    { emoji: '🧸', label: 'Daycare', age: DAYCARE_AGE },
    ...(country.schoolStartAge > PRESCHOOL_AGE ? [{ emoji: '🎨', label: 'Preschool', age: PRESCHOOL_AGE }] : []),
    { emoji: '🏫', label: 'Elementary school', age: country.schoolStartAge },
    { emoji: '💡', label: 'Side hustles', age: hustleAge },
    { emoji: '🧾', label: 'Part-time jobs', age: PART_TIME_AGE },
    { emoji: '💼', label: 'Full-time jobs', age: FULL_TIME_AGE },
  ];
  const ahead = state.education.enrolled ? all.filter((u) => u.age > country.schoolStartAge) : all;
  return ahead
    .filter((u) => u.age > age)
    .sort((a, b) => a.age - b.age)
    .map((u) => ({ ...u, inYears: u.age - age }));
}
