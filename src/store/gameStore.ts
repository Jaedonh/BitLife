import { create } from 'zustand';

import { ageUp as engineAgeUp, applyAction, createLife, EVENT_REGISTRY, randomSeed, resolveChoice, secondChance } from '@/engine';
import type { GameState, LastResult, NewLifeOptions, PlayerAction } from '@/engine/types';
import { ads } from '@/services/ads';
import { track } from '@/services/analytics';
import { canShowRewarded, recordAgeUp, recordInterstitialShown, recordRewardedUsed, shouldShowInterstitial } from '@/services/ads/policy';
import { readJson, remove, StorageKeys, writeJson } from '@/services/storage';
import { migrateSave } from './migrations';
import { useSettingsStore } from './settingsStore';

export type RewardedPlacement = 'cashBoost' | 'statBoost' | 'secondChance' | 'reroll';

interface GameStore {
  hydrated: boolean;
  game: GameState | null;
  /** True while an interstitial is on screen. */
  adShowing: boolean;
  /** Year summary waiting for the year's event cards to close. */
  pendingSummary: LastResult | null;
  /** Free generations used on this device (premium = unlimited). */
  hydrate: () => Promise<void>;
  newLife: (options?: NewLifeOptions) => void;
  continueAsHeir: (childId: string) => void;
  ageUp: () => Promise<void>;
  choose: (choiceId: string) => void;
  act: (action: PlayerAction) => void;
  /** Shows a rewarded ad (or grants directly for premium) and applies the reward. */
  rewarded: (placement: RewardedPlacement, option?: string) => Promise<'granted' | 'unavailable' | 'dismissed' | 'capped'>;
  canUseRewarded: (placement: RewardedPlacement) => boolean;
  abandonLife: () => void;
  clearResult: () => void;
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
function persist(game: GameState | null) {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    if (game) void writeJson(StorageKeys.save, game);
    else void remove(StorageKeys.save);
  }, 150);
}

/** One-line recap of the year that just passed, shown as a toast. */
function yearSummary(before: GameState, after: GameState): LastResult {
  const statDeltas: Partial<GameState['character']['stats']> = {};
  for (const k of ['happiness', 'health', 'smarts', 'looks'] as const) {
    const d = after.character.stats[k] - before.character.stats[k];
    if (d) statDeltas[k] = d;
  }
  const moneyDelta = after.finances.cash - before.finances.cash;
  const highlight = after.log
    .slice(before.log.length)
    .find((l) => l.kind === 'milestone' || l.kind === 'bad' || l.kind === 'money' || l.kind === 'good');
  return {
    text: `${after.year} · Age ${after.character.age}${highlight ? ` · ${highlight.text}` : ''}`,
    kind: 'info',
    statDeltas,
    moneyDelta: moneyDelta || undefined,
  };
}

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

export const useGameStore = create<GameStore>((set, get) => ({
  hydrated: false,
  game: null,
  adShowing: false,
  pendingSummary: null,
  hydrate: async () => {
    const raw = await readJson<unknown>(StorageKeys.save);
    const game = migrateSave(raw);
    if (raw && !game) void remove(StorageKeys.save);
    set({ hydrated: true, game });
  },
  newLife: (options = {}) => {
    const game = createLife(options, randomSeed(), Date.now());
    set({ game });
    persist(game);
    track({ name: 'life_started', generation: game.generation, custom: !!(options.firstName || options.countryCode || options.customStats) });
  },
  continueAsHeir: (childId) => {
    const prev = get().game;
    if (!prev || prev.alive) return;
    const game = createLife({ heir: { childId, previous: prev } }, randomSeed(), Date.now());
    set({ game });
    persist(game);
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
    if (summary && !next.pendingEvent) {
      next = { ...next, lastResult: summary };
      set({ game: next, pendingSummary: null });
    } else {
      set({ game: next, pendingSummary: summary });
    }
    persist(next);
    track({ name: 'age_up', age: next.character.age });
    if (!next.alive) recordDeath(next);
    if (!settings.premium) ads.preload();
  },
  choose: (choiceId) => {
    const g = get().game;
    if (!g || !g.pendingEvent) return;
    let next = { ...resolveChoice(g, choiceId, EVENT_REGISTRY), updatedAt: Date.now() };
    const summary = get().pendingSummary;
    if (summary && !next.pendingEvent && next.alive) {
      next = { ...next, lastResult: summary };
      set({ game: next, pendingSummary: null });
    } else {
      set({ game: next });
    }
    persist(next);
    track({ name: 'event_choice', eventId: g.pendingEvent.eventId, choiceId });
    if (!next.alive) recordDeath(next);
  },
  act: (action) => {
    const g = get().game;
    if (!g) return;
    const next = { ...applyAction(g, action), updatedAt: Date.now() };
    set({ game: next });
    persist(next);
    if (!next.alive) recordDeath(next);
  },
  canUseRewarded: (placement) => {
    const g = get().game;
    if (!g) return false;
    if (placement === 'secondChance' && (g.alive || g.flags.revived === true)) return false;
    const settings = useSettingsStore.getState();
    if (!settings.premium && !ads.isSupported()) return false;
    // Premium skips the ad, not the daily cap (GAME_DESIGN §19: the same rewards, instantly).
    return canShowRewarded(settings.adMeta, placement, Date.now());
  },
  rewarded: async (placement, option) => {
    const g = get().game;
    if (!g) return 'unavailable';
    const settings = useSettingsStore.getState();
    if (!get().canUseRewarded(placement)) return 'capped';
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
