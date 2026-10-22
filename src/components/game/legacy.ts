/**
 * Pure helpers for the legacy screens (home, death, graveyard). No React here so they stay easy to test.
 */
import { getCountry } from '@/data/countries';
import { RIBBON_BY_ID } from '@/engine';
import type { Gender, GameState, LogEntry, Person } from '@/engine/types';
import { capitalize, deathPhrase } from '@/engine/util';
import type { GraveyardEntry } from '@/store/settingsStore';

/** Free play hands a life to a child once per family line (generation 1 → 2); premium is unlimited. */
export const FREE_GENERATIONS = 2;

/** An age- and gender-appropriate face: 👶 0-2, 👦/👧 3-17, 👨/👩 18-59, 👴/👵 60+. */
export function lifeAvatar(gender: Gender, age: number): string {
  if (age < 3) return '👶';
  if (age < 18) return gender === 'male' ? '👦' : '👧';
  if (age < 60) return gender === 'male' ? '👨' : '👩';
  return gender === 'male' ? '👴' : '👵';
}

/** "Son", "Daughter". */
export function heirLabel(p: Person): string {
  return p.gender === 'male' ? 'Son' : 'Daughter';
}

/** "Under a year old", "1 year old", "34". */
export function ageText(age: number): string {
  if (age === 0) return 'Under a year old';
  return age === 1 ? '1 year old' : `${age} years old`;
}

/** Living children who can carry on the family line, oldest first. */
export function livingHeirs(game: GameState): Person[] {
  return Object.values(game.people)
    .filter((p) => p.kind === 'child' && p.alive)
    .sort((a, b) => b.age - a.age);
}

/**
 * The share of the estate an heir receives on hand-off. Mirrors createLife in
 * src/engine/systems/character.ts: 80% of a positive net worth, split evenly between the living children.
 */
export function heirInheritance(game: GameState): number {
  const estate = Math.max(0, game.death?.netWorth ?? 0);
  const heirs = livingHeirs(game).length;
  if (!estate || !heirs) return 0;
  return Math.round((estate * 0.8) / heirs);
}

/** True when this life may be handed to a child without premium. */
export function canContinueLine(game: GameState, premium: boolean): boolean {
  return premium || game.generation < FREE_GENERATIONS;
}

/** "Died of a stroke". */
export function causeLine(cause: string): string {
  return capitalize(deathPhrase(cause));
}

/** "🇧🇷 2005 – 2079 · aged 74". */
export function lifespanLine(countryCode: string, birthYear: number, deathYear: number, age: number): string {
  return `${getCountry(countryCode).flag} ${birthYear} – ${deathYear} · ${age === 0 ? 'under a year old' : `aged ${age}`}`;
}

/** How many times each ribbon has been earned across the graveyard. */
export function ribbonTally(graveyard: readonly GraveyardEntry[]): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const g of graveyard) tally[g.ribbonId] = (tally[g.ribbonId] ?? 0) + 1;
  return tally;
}

/** One person in a family line, oldest generation first. */
export interface LineMember {
  key: string;
  name: string;
  birthYear: number;
  /** Absent for the life still being played. */
  deathYear?: number;
  age: number;
  ribbonId?: string;
  generation: number;
  /** The grave the player opened. */
  isEntry: boolean;
  /** The life currently being played. */
  playing: boolean;
}

/**
 * The family line a grave belongs to, when the current save descends from it (or is it): every earlier
 * generation from the save's ancestor list, then the save's own character. Null for a grave from another
 * family line, whose relatives the graveyard does not record.
 */
export function familyLine(entry: GraveyardEntry, game: GameState | null): LineMember[] | null {
  if (!game) return null;
  const c = game.character;
  const members: LineMember[] = game.ancestors.map((a, i) => ({
    key: `a${i}`,
    name: a.name,
    birthYear: a.birthYear,
    deathYear: a.deathYear,
    age: a.age,
    ribbonId: a.ribbonId,
    generation: i + 1,
    isEntry: a.name === entry.name && a.birthYear === entry.birthYear && a.deathYear === entry.deathYear,
    playing: false,
  }));
  members.push({
    key: 'current',
    name: `${c.firstName} ${c.lastName}`,
    birthYear: c.birthYear,
    deathYear: game.alive ? undefined : game.year,
    age: c.age,
    ribbonId: game.death?.ribbonId,
    generation: game.generation,
    isEntry: c.id === entry.id,
    playing: game.alive,
  });
  // A line of one is just the grave itself: nothing to add.
  if (members.length < 2 || !members.some((m) => m.isEntry)) return null;
  return members;
}

/** Living children left behind by the grave's life, when that life is the save's most recent death. */
export function childrenLeft(entry: GraveyardEntry, game: GameState | null): Person[] {
  if (!game || game.alive || game.character.id !== entry.id) return [];
  return livingHeirs(game);
}

/** The obituary as plain text for the share sheet. */
export function obituaryShareText(entry: Pick<GraveyardEntry, 'name' | 'birthYear' | 'deathYear' | 'ribbonId' | 'obituary' | 'epitaph'>): string {
  const ribbon = RIBBON_BY_ID[entry.ribbonId];
  return [
    `${entry.name} (${entry.birthYear}–${entry.deathYear})`,
    ribbon ? `${ribbon.emoji} ${ribbon.name}` : null,
    '',
    entry.obituary,
    '',
    `“${entry.epitaph}”`,
    '',
    'A life from Yearborn, the life simulator.',
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}

/** A journal grouped into years for the life story: each year header with the lines under it. */
export interface StoryYear {
  key: string;
  heading: string;
  entries: LogEntry[];
}

export function storyByYear(log: readonly LogEntry[]): StoryYear[] {
  const years: StoryYear[] = [];
  for (const entry of log) {
    if (entry.kind === 'year') {
      years.push({ key: `y${years.length}`, heading: `Age ${entry.age} · ${entry.year}`, entries: [] });
      continue;
    }
    let current = years[years.length - 1];
    if (!current) {
      // Lines written before the first year header (birth, an heir's opening lines).
      current = { key: 'y0', heading: `Age ${entry.age} · ${entry.year}`, entries: [] };
      years.push(current);
    }
    current.entries.push(entry);
  }
  return years.filter((y) => y.entries.length > 0);
}
