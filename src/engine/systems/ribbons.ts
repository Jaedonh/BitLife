import { scaleMoney } from '../events/text';
import type { GameState } from '../types';
import { netWorth, peakFame } from '../util';

export interface RibbonDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  /** Higher priority wins when several match. */
  priority: number;
  test: (state: GameState) => boolean;
}

/** Exactly one ribbon is awarded per life (first match by priority). */
export const RIBBONS: readonly RibbonDef[] = [
  { id: 'deadly', name: 'Deadly', emoji: '💀', description: 'Took more than one life.', priority: 100, test: (s) => (typeof s.flags.murders === 'number' ? s.flags.murders : 0) >= 2 },
  { id: 'jailbird', name: 'Jailbird', emoji: '🔒', description: 'Spent 15+ years behind bars.', priority: 95, test: (s) => s.counters.yearsInPrison >= 15 },
  { id: 'tycoon', name: 'Tycoon', emoji: '🏦', description: 'Died with a vast fortune.', priority: 90, test: (s) => netWorth(s) >= scaleMoney(s, 100_000_000) },
  { id: 'famous', name: 'Famous', emoji: '⭐', description: 'Reached the top of the fame ladder.', priority: 85, test: (s) => peakFame(s) >= 90 },
  { id: 'rich', name: 'Rich', emoji: '💎', description: 'Died wealthy by local standards.', priority: 80, test: (s) => netWorth(s) >= scaleMoney(s, 1_000_000) },
  { id: 'academic', name: 'Academic', emoji: '🎓', description: 'Earned a graduate degree.', priority: 75, test: (s) => s.education.degrees.some((d) => d.startsWith('master') || d.startsWith('doctor')) },
  { id: 'family_first', name: 'Family First', emoji: '👨‍👩‍👧‍👦', description: 'Married once, raised 3+ children, never divorced.', priority: 70, test: (s) => s.counters.marriages === 1 && s.counters.divorces === 0 && s.counters.children >= 3 },
  { id: 'heartbreaker', name: 'Heartbreaker', emoji: '💔', description: 'Had 10+ lovers.', priority: 65, test: (s) => s.counters.lovers >= 10 },
  { id: 'cunning', name: 'Cunning', emoji: '🦊', description: 'Committed 10+ crimes without ever being convicted.', priority: 62, test: (s) => s.counters.crimes >= 10 && s.crime.convictions === 0 },
  { id: 'scandalous', name: 'Scandalous', emoji: '🚔', description: 'Arrested 5+ times.', priority: 60, test: (s) => s.counters.arrests >= 5 },
  { id: 'fit', name: 'Fit', emoji: '💪', description: 'Worked out 40+ times and stayed healthy.', priority: 55, test: (s) => s.counters.workouts >= 40 && s.character.stats.health >= 70 },
  { id: 'bookworm', name: 'Bookworm', emoji: '📚', description: 'Visited the library 40+ times.', priority: 52, test: (s) => s.counters.libraryVisits >= 40 },
  { id: 'globetrotter', name: 'Globetrotter', emoji: '✈️', description: 'Took 25+ vacations.', priority: 50, test: (s) => s.counters.vacations >= 25 },
  { id: 'generous', name: 'Generous', emoji: '🎁', description: 'Gave 50+ gifts and kept karma high.', priority: 48, test: (s) => s.counters.giftsGiven >= 50 && s.character.karma >= 70 },
  { id: 'loyal', name: 'Loyal', emoji: '🏢', description: 'Spent 35+ years at one employer.', priority: 46, test: (s) => (s.career.job?.yearsHeld ?? 0) >= 35 || s.career.history.some((h) => h.toAge - h.fromAge >= 35) },
  { id: 'hustler', name: 'Hustler', emoji: '📈', description: 'Built a side hustle to the top level.', priority: 44, test: (s) => (s.career.hustle?.level ?? 0) >= 5 || s.flags.hustleMaxed === true },
  { id: 'centenarian', name: 'Centenarian', emoji: '🎂', description: 'Lived to 100.', priority: 43, test: (s) => s.character.age >= 100 },
  { id: 'survivor', name: 'Survivor', emoji: '🩹', description: 'Faced 15+ diagnoses and kept going.', priority: 42, test: (s) => s.counters.illnesses >= 15 },
  { id: 'addict', name: 'Addict', emoji: '🍾', description: 'Died with an addiction.', priority: 40, test: (s) => Object.values(s.health.addictions).some((v) => (v ?? 0) >= 40) },
  { id: 'lazy', name: 'Lazy', emoji: '🛋️', description: 'Never held a job past 30.', priority: 38, test: (s) => s.character.age >= 40 && s.counters.yearsEmployed <= 2 },
  { id: 'wasted', name: 'Wasted', emoji: '🕯️', description: 'Died before 25.', priority: 34, test: (s) => s.character.age < 25 },
  { id: 'successful', name: 'Successful', emoji: '🏆', description: 'Good job, family and money.', priority: 30, test: (s) => netWorth(s) >= scaleMoney(s, 250_000) && s.counters.marriages >= 1 && s.counters.children >= 1 },
  { id: 'happy', name: 'Happy', emoji: '😊', description: 'Spent most of life happy.', priority: 25, test: (s) => s.counters.yearsHappy >= Math.max(10, s.character.age * 0.5) },
  { id: 'miserable', name: 'Miserable', emoji: '🌧️', description: 'Spent most of life unhappy.', priority: 24, test: (s) => s.counters.yearsMiserable >= Math.max(10, s.character.age * 0.4) },
  { id: 'mediocre', name: 'Mediocre', emoji: '😐', description: 'Lived an ordinary life.', priority: 0, test: () => true },
];

export const RIBBON_BY_ID: Record<string, RibbonDef> = Object.fromEntries(RIBBONS.map((r) => [r.id, r]));

export function awardRibbon(state: GameState): RibbonDef {
  const sorted = [...RIBBONS].sort((a, b) => b.priority - a.priority);
  return sorted.find((r) => r.test(state)) ?? (RIBBONS[RIBBONS.length - 1] as RibbonDef);
}
