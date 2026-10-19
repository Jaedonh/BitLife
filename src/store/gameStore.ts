import { create } from 'zustand';

import { achievementContext, ageUp as engineAgeUp, applyAction, beginLife, createLife, EVENT_REGISTRY, listingsBlocker, newAchievements, randomSeed, resolveChoice, secondChance, statBoostBlocker } from '@/engine';
import type { GameState, LastResult, LogKind, NewLifeOptions, PlayerAction } from '@/engine/types';
import { ads } from '@/services/ads';
import { track } from '@/services/analytics';
import { canShowRewarded, recordAgeUp, recordInterstitialShown, recordRewardedUsed, shouldShowInterstitial } from '@/services/ads/policy';
import { readJson, remove, StorageKeys, writeJson } from '@/services/storage';
import { migrateSave } from './migrations';
import { useSettingsStore } from './settingsStore';

export type RewardedPlacement = 'cashBoost' | 'statBoost' | 'secondChance' | 'reroll';
/** 'ineligible': the reward cannot apply to this life right now; the game's own message says why and nothing was spent. */
export type RewardedOutcome = 'granted' | 'unavailable' | 'dismissed' | 'capped' | 'ineligible';

const REWARDED_OUTCOME_MESSAGES: Record<RewardedOutcome, string | null> = {
  granted: null,
  unavailable: 'No ad is ready right now. Try again in a moment.',
  dismissed: 'Watch the whole ad to earn the reward.',
  capped: "You've used up this reward for today. Come back tomorrow.",
  ineligible: null,
};

/**
 * Why a rewarded placement cannot pay out for this life right now (null when it can). A stat boost
 * that would change nothing (the stat is at its cap or natural limit) is refused, not spent.
 */
function rewardedBlocker(g: GameState, placement: RewardedPlacement, option?: string): string | null {
  return placement === 'reroll' ? listingsBlocker(g) : placement === 'statBoost' ? statBoostBlocker(g, option) : null;
}

/** What to tell the player when a rewarded placement did not pay out (null when it did). */
export function rewardedOutcomeMessage(outcome: RewardedOutcome): string | null {
  return REWARDED_OUTCOME_MESSAGES[outcome];
}

interface GameStore {
  hydrated: boolean;
  game: GameState | null;
  /** True while an interstitial is on screen. */
  adShowing: boolean;
  /** Year summary waiting for the year's event cards to close. */
  pendingSummary: LastResult | null;
  /** Free generations used on this device (premium = unlimited). */
  hydrate: () => Promise<void>;
  /** Starts a life at birth. It opens with a newborn card unless birthCard is false (tests that drive the store directly). */
  newLife: (options?: NewLifeOptions, opts?: { birthCard?: boolean }) => void;
  continueAsHeir: (childId: string) => void;
  ageUp: () => Promise<void>;
  choose: (choiceId: string) => void;
  act: (action: PlayerAction) => void;
  /** Shows a rewarded ad (or grants directly for premium) and applies the reward. */
  rewarded: (placement: RewardedPlacement, option?: string) => Promise<RewardedOutcome>;
  /** With an option (the stat for a stat boost), also checks that this particular reward would change something. */
  canUseRewarded: (placement: RewardedPlacement, option?: string) => boolean;
  abandonLife: () => void;
  clearResult: () => void;
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
function persist(game: GameState | null) {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    // lastResult is a toast for the moment it happened: never saved, so a relaunch never replays it.
    if (game) void writeJson(StorageKeys.save, { ...game, lastResult: null });
    else void remove(StorageKeys.save);
  }, 150);
}

/**
 * Which of a year's journal lines is worth a toast: milestones first. A card's own line ("text → choice")
 * is what the player just read, so it is never the headline; what the choice led to can be.
 */
const HIGHLIGHT_RANK: Partial<Record<LogKind, number>> = { milestone: 4, bad: 2, good: 2, money: 1 };

/**
 * The year's most notable new line, skipping any line that also happened last year (a debt
 * reminder or a recurring chore would otherwise be the headline every single year). A milestone
 * is news every time, though: a parole granted two years running is still this year's release.
 * Once the year's cards are closed it covers their outcomes too, so the recap never contradicts
 * them ("Another year behind bars" in the year parole was granted). Lines from `cardsFrom` on were
 * written by the year's cards: they are its latest news, so they win a tie with what the year
 * wrote before them ("1 year to go" from a card that then added a year to the sentence).
 */
export function yearHighlight(before: GameState, after: GameState, cardsFrom = after.log.length): string | null {
  const lastYear = new Set(before.log.filter((l) => l.kind !== 'year' && l.age === before.character.age).map((l) => l.text));
  let best: { text: string; rank: number; card: boolean } | null = null;
  for (let i = before.log.length; i < after.log.length; i++) {
    const l = after.log[i]!;
    const rank = HIGHLIGHT_RANK[l.kind] ?? 0;
    if (!rank || (l.kind !== 'milestone' && lastYear.has(l.text))) continue;
    const card = i >= cardsFrom;
    if (!best || rank > best.rank || (rank === best.rank && card && !best.card)) best = { text: l.text, rank, card };
  }
  return best?.text ?? null;
}

function yearDeltas(before: GameState, after: GameState): Pick<LastResult, 'statDeltas' | 'moneyDelta'> {
  const statDeltas: Partial<GameState['character']['stats']> = {};
  for (const k of ['happiness', 'health', 'smarts', 'looks'] as const) {
    const d = after.character.stats[k] - before.character.stats[k];
    if (d) statDeltas[k] = d;
  }
  const moneyDelta = after.finances.cash - before.finances.cash;
  return { statDeltas, moneyDelta: moneyDelta || undefined };
}

/** One-line recap of the year that just passed, shown as a toast ("2011 · Age 12 · highlight"). */
function yearSummary(before: GameState, after: GameState, cardsFrom?: number): LastResult {
  const highlight = yearHighlight(before, after, cardsFrom);
  return {
    text: `${after.year} · Age ${after.character.age}${highlight ? ` · ${highlight}` : ''}`,
    kind: 'year',
    ...yearDeltas(before, after),
  };
}

/** The state just before the Age+ whose recap is waiting for that year's event cards to close. */
let summaryBase: GameState | null = null;
/** Where that year's card outcomes start in the journal (its length when the first card opened). */
let summaryCardsFrom = 0;

function recordDeath(game: GameState) {
  if (game.alive || !game.death) return;
  track({ name: 'life_ended', age: game.character.age, ribbon: game.death.ribbonId, cause: game.death.cause });
  useSettingsStore.getState().addToGraveyard({
    id: game.character.id,
    name: `${game.character.firstName} ${game.character.lastName}`,
    birthYear: game.character.birthYear,
    deathYear: game.year,
    age: game.character.age,
    cause: game.death.cause,
    ribbonId: game.death.ribbonId,
    netWorth: game.death.netWorth,
    countryCode: game.character.countryCode,
    generation: game.generation,
    obituary: game.death.obituary,
    epitaph: game.death.epitaph,
    diedAt: Date.now(),
  });
}

/**
 * Unlocks whatever achievements this state has earned (after an age-up, an action, a choice or a
 * death; never per render). The checker is pure and skips what is already unlocked, so it is cheap.
 */
export function checkAchievements(game: GameState | null) {
  if (!game) return;
  const settings = useSettingsStore.getState();
  const fresh = newAchievements(game, achievementContext(settings.graveyard, game), settings.achievements);
  if (!fresh.length) return;
  settings.unlockAchievements(
    fresh.map((a) => a.id),
    { lifeName: `${game.character.firstName} ${game.character.lastName}`, age: game.character.age },
  );
}

export const useGameStore = create<GameStore>((set, get) => ({
  hydrated: false,
  game: null,
  adShowing: false,
  pendingSummary: null,
  hydrate: async () => {
    const raw = await readJson<unknown>(StorageKeys.save);
    const migrated = migrateSave(raw);
    if (raw && !migrated) void remove(StorageKeys.save);
    // Saves written before results were stripped may still carry one: it must not replay at launch.
    const game = migrated && migrated.lastResult ? { ...migrated, lastResult: null } : migrated;
    set({ hydrated: true, game });
  },
  newLife: (options = {}, { birthCard = true } = {}) => {
    // The wealthy family is a premium perk: without premium the Wealthy scenario starts a Standard life.
    const premium = useSettingsStore.getState().premium;
    const allowed: NewLifeOptions = premium ? options : { ...options, scenario: options.scenario === 'wealthy' ? 'standard' : options.scenario, wealthyFamily: undefined };
    // A life starts with a newborn card, so the first thing the player sees is being a baby.
    const born = createLife(allowed, randomSeed(), Date.now());
    const game = birthCard ? beginLife(born, EVENT_REGISTRY) : born;
    set({ game });
    persist(game);
    checkAchievements(game);
    track({ name: 'life_started', generation: game.generation, custom: !!(options.firstName || options.countryCode || options.customStats), scenario: game.character.scenario ?? 'standard' });
  },
  continueAsHeir: (childId) => {
    const prev = get().game;
    if (!prev || prev.alive) return;
    const game = createLife({ heir: { childId, previous: prev } }, randomSeed(), Date.now());
    set({ game });
    persist(game);
    checkAchievements(game);
    track({ name: 'heir_continued', generation: game.generation });
  },
  ageUp: async () => {
    const g = get().game;
    if (!g || !g.alive || g.pendingEvent || get().adShowing) return;
    const settings = useSettingsStore.getState();
    const now = Date.now();
    let meta = settings.updateAdMeta((m) => recordAgeUp(m));
    if (shouldShowInterstitial(meta, now, settings.premium) && ads.isReady()) {
      set({ adShowing: true });
      const shown = await ads.showInterstitial();
      set({ adShowing: false });
      if (shown) {
        meta = settings.updateAdMeta((m) => recordInterstitialShown(m, Date.now()));
        track({ name: 'interstitial_shown' });
      }
    }
    const current = get().game;
    // Compare a gameplay marker, not object identity: the toast's clearResult replaces the game
    // object without changing the life, and must not swallow the age-up the player just sat through an ad for.
    if (!current || current.character.id !== g.character.id || current.updatedAt !== g.updatedAt) return;
    let next = { ...engineAgeUp(current), updatedAt: Date.now() };
    const summary = next.alive ? yearSummary(current, next) : null;
    summaryBase = summary && next.pendingEvent ? current : null;
    summaryCardsFrom = next.log.length;
    if (summary && !next.pendingEvent) {
      next = { ...next, lastResult: summary };
      set({ game: next, pendingSummary: null });
    } else {
      set({ game: next, pendingSummary: summary });
    }
    persist(next);
    track({ name: 'age_up', age: next.character.age });
    if (!next.alive) recordDeath(next);
    checkAchievements(next);
    if (!settings.premium) ads.preload();
  },
  choose: (choiceId) => {
    const g = get().game;
    if (!g || !g.pendingEvent) return;
    let next = { ...resolveChoice(g, choiceId, EVENT_REGISTRY), updatedAt: Date.now() };
    const summary = get().pendingSummary;
    if (summary && !next.pendingEvent && next.alive) {
      // The recap covers the whole Age+, the choices just made on the year's cards included: their
      // numbers, and their news (parole granted outranks "Another year behind bars").
      const base = summaryBase && summaryBase.character.id === next.character.id ? summaryBase : null;
      summaryBase = null;
      next = { ...next, lastResult: base ? yearSummary(base, next, summaryCardsFrom) : summary };
      set({ game: next, pendingSummary: null });
    } else {
      set({ game: next });
    }
    persist(next);
    track({ name: 'event_choice', eventId: g.pendingEvent.eventId, choiceId });
    if (!next.alive) recordDeath(next);
    checkAchievements(next);
  },
  act: (action) => {
    const g = get().game;
    if (!g) return;
    const next = { ...applyAction(g, action), updatedAt: Date.now() };
    set({ game: next });
    persist(next);
    if (!next.alive) recordDeath(next);
    checkAchievements(next);
  },
  canUseRewarded: (placement, option) => {
    const g = get().game;
    if (!g) return false;
    if (placement === 'secondChance' && (g.alive || g.flags.revived === true)) return false;
    if (rewardedBlocker(g, placement, option)) return false;
    const settings = useSettingsStore.getState();
    // Free users need the ads SDK linked *and* initialised: before init (or when consent blocked it)
    // no rewarded ad can ever show, so the button would be a dead tap.
    if (!settings.premium && !(ads.isSupported() && ads.isReady())) return false;
    // Premium skips the ad, not the daily cap (GAME_DESIGN §19: the same rewards, instantly).
    return canShowRewarded(settings.adMeta, placement, Date.now());
  },
  rewarded: async (placement, option) => {
    const g = get().game;
    if (!g) return 'unavailable';
    const settings = useSettingsStore.getState();
    const blocked = rewardedBlocker(g, placement, option);
    if (blocked) {
      // Say why, and never show the ad or count it against the daily cap.
      set({ game: { ...g, lastResult: { text: blocked, kind: 'info' } } });
      return 'ineligible';
    }
    if (!get().canUseRewarded(placement)) {
      // Distinguish 'no ad can show yet' from 'daily cap reached' so the message is honest.
      const adsUsable = settings.premium || (ads.isSupported() && ads.isReady());
      return adsUsable ? 'capped' : 'unavailable';
    }
    if (!settings.premium) {
      if (!ads.isRewardedLoaded()) {
        ads.preload();
        return 'unavailable';
      }
      set({ adShowing: true });
      const result = await ads.showRewarded();
      set({ adShowing: false });
      track({ name: 'rewarded_ad', placement, result });
      if (result !== 'earned') return result === 'dismissed' ? 'dismissed' : 'unavailable';
    }
    settings.updateAdMeta((m) => recordRewardedUsed(m, placement, Date.now()));
    const current = get().game ?? g;
    const next = { ...(placement === 'secondChance' ? secondChance(current) : applyAction(current, { type: 'rewarded', placement, option })), updatedAt: Date.now() };
    // The death was undone: take the tombstone back so the graveyard only lists finished lives.
    if (placement === 'secondChance' && !current.alive && next.alive) useSettingsStore.getState().removeFromGraveyard(current.character.id);
    set({ game: next });
    persist(next);
    checkAchievements(next);
    return 'granted';
  },
  abandonLife: () => {
    set({ game: null, pendingSummary: null });
    persist(null);
  },
  clearResult: () => {
    const g = get().game;
    if (!g || !g.lastResult) return;
    set({ game: { ...g, lastResult: null } });
  },
}));
