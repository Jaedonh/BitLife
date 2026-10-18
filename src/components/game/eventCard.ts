import { EVENT_REGISTRY, scaleMoney, type ChoiceDef, type EventCategory } from '@/engine/events';
import type { GameState, PendingEvent } from '@/engine/types';
import { colors } from '@/theme';

import { kindEmoji, kindLabel, personName } from './people';

/** Header badge per event category: an emoji, a spoken name and a tint taken from the stat palette. */
export const EVENT_CATEGORY_STYLE: Record<EventCategory, { emoji: string; label: string; tint: string }> = {
  childhood: { emoji: '🧸', label: 'Childhood', tint: colors.looks },
  school: { emoji: '🎒', label: 'School', tint: colors.smarts },
  work: { emoji: '💼', label: 'Work', tint: colors.info },
  family: { emoji: '🏡', label: 'Family', tint: colors.happiness },
  romance: { emoji: '💘', label: 'Romance', tint: colors.looks },
  friends: { emoji: '🤝', label: 'Friends', tint: colors.success },
  health: { emoji: '🩺', label: 'Health', tint: colors.health },
  money: { emoji: '💰', label: 'Money', tint: colors.money },
  crime: { emoji: '🚨', label: 'Crime', tint: colors.danger },
  prison: { emoji: '⛓️', label: 'Prison', tint: colors.danger },
  random: { emoji: '🎲', label: 'Life', tint: colors.primary },
  holiday: { emoji: '🎉', label: 'Holiday', tint: colors.warning },
  elderly: { emoji: '🌅', label: 'Later life', tint: colors.textMuted },
};

const FALLBACK_STYLE = { emoji: '✨', label: 'Event', tint: colors.primary };

/**
 * How a choice's hint chip reads.
 * - `cost`: money the player pays and can cover.
 * - `credit`: an adult's cost above their cash; the shortfall becomes debt, so it is flagged.
 * - `gain`: money the player receives.
 * - `neutral`: anything else (a cost hidden in a chance branch, or a non-money hint).
 */
export type HintTone = 'neutral' | 'cost' | 'credit' | 'gain';

export interface EventChoiceModel {
  id: string;
  label: string;
  /** Chip text, already including "on credit" when relevant; undefined when the choice has no hint. */
  chip?: string;
  tone: HintTone;
  accessibilityLabel: string;
}

export interface EventPersonModel {
  emoji: string;
  name: string;
  relation: string;
}

export interface EventCardModel {
  /** Changes for every card shown, so each one gets its own entrance. */
  key: string;
  title: string;
  text: string;
  emoji: string;
  categoryLabel: string;
  tint: string;
  /** "Age 14 · 2003"; null when the life is not known (tests with a stub state). */
  caption: string | null;
  person: EventPersonModel | null;
  choices: EventChoiceModel[];
}

/** Sum of the money effects that always apply (chance and random branches are uncertain, so they are left out). */
export function certainMoney(choice: ChoiceDef | undefined): number {
  if (!choice) return 0;
  let usd = 0;
  for (const e of choice.effects) if ('money' in e) usd += e.money;
  return usd;
}

function hintTone(game: GameState, usd: number): HintTone {
  if (usd > 0) return 'gain';
  if (usd === 0) return 'neutral';
  const character = game.character as GameState['character'] | undefined;
  const cash = game.finances?.cash;
  if (!character || cash === undefined) return 'cost';
  // Minors never pay for events themselves: a parent covers it and any remainder is waived (GAME_DESIGN §9).
  if (character.age < 18) return 'cost';
  return scaleMoney(game, -usd) > cash ? 'credit' : 'cost';
}

/** Everything the event card shows, derived from the game state; pure so it can be unit-tested. */
export function eventCardModel(game: GameState, pending: PendingEvent): EventCardModel {
  const def = EVENT_REGISTRY.byId[pending.eventId];
  const style = (def && EVENT_CATEGORY_STYLE[def.category]) ?? FALLBACK_STYLE;
  const character = game.character as GameState['character'] | undefined;
  const caption = character ? `Age ${character.age} · ${game.year}` : null;
  const p = pending.personId ? game.people?.[pending.personId] : undefined;
  const person = p ? { emoji: kindEmoji(p), name: personName(p), relation: kindLabel(p) } : null;
  const choices = pending.choices.map((c): EventChoiceModel => {
    if (!c.hint) return { id: c.id, label: c.label, tone: 'neutral', accessibilityLabel: c.label };
    // A code-defined card (the court's lawyer fee) sets its chip's tone itself; its hint already says it all.
    const forced = pending.context?.[`tone:${c.id}`];
    if (forced === 'cost' || forced === 'credit' || forced === 'gain' || forced === 'neutral') return { id: c.id, label: c.label, chip: c.hint, tone: forced, accessibilityLabel: `${c.label}, ${c.hint}` };
    const tone = hintTone(game, certainMoney(def?.choices.find((d) => d.id === c.id)));
    const chip = tone === 'credit' ? `${c.hint} · on credit` : c.hint;
    const spoken = tone === 'credit' ? `${c.hint}, more than your cash, the rest becomes debt` : c.hint;
    return { id: c.id, label: c.label, chip, tone, accessibilityLabel: `${c.label}, ${spoken}` };
  });
  return {
    key: `${pending.eventId}#${game.counters?.eventsFaced ?? 0}`,
    title: pending.title,
    text: pending.text,
    emoji: style.emoji,
    categoryLabel: style.label,
    tint: style.tint,
    caption,
    person,
    choices,
  };
}
