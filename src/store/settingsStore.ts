import { create } from 'zustand';

import { emptyAdMeta, startSession, type AdMeta } from '@/services/ads/policy';
import { readJson, remove, StorageKeys, writeJson } from '@/services/storage';

export interface Settings {
  haptics: boolean;
  /** Show hidden karma on the profile (debug / premium perk). */
  showKarma: boolean;
  /** Completed the first-life tutorial hints. */
  tutorialDone: boolean;
}

/** One unlocked achievement: when, and by which life at what age. */
export interface AchievementUnlock {
  unlockedAt: number;
  lifeName: string;
  age: number;
}

/** The latest batch of unlocks, for the feedback toast. Never persisted, so a relaunch never replays it. */
export interface AchievementNotice {
  ids: string[];
  seq: number;
}

export interface GraveyardEntry {
  id: string;
  name: string;
  birthYear: number;
  deathYear: number;
  age: number;
  cause: string;
  ribbonId: string;
  netWorth: number;
  countryCode: string;
  generation: number;
  obituary: string;
  epitaph: string;
  diedAt: number;
}

interface SettingsState {
  hydrated: boolean;
  settings: Settings;
  premium: boolean;
  /** True once the ads SDK has started (consent gathered, SDK initialised). Not persisted. */
  adsReady: boolean;
  adMeta: AdMeta;
  graveyard: GraveyardEntry[];
  /** Achievements unlocked on this device, by id. */
  achievements: Record<string, AchievementUnlock>;
  achievementNotice: AchievementNotice | null;
  hydrate: () => Promise<void>;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setPremium: (premium: boolean) => void;
  setAdsReady: (ready: boolean) => void;
  updateAdMeta: (fn: (meta: AdMeta) => AdMeta) => AdMeta;
  addToGraveyard: (entry: GraveyardEntry) => void;
  /** Undoes the most recent grave of a character (second chance). */
  removeFromGraveyard: (id: string) => void;
  clearGraveyard: () => void;
  /** Records newly unlocked achievements (ids already unlocked are ignored) and raises the toast notice. */
  unlockAchievements: (ids: readonly string[], by: { lifeName: string; age: number }, now?: number) => void;
  /** Locks every achievement again (Settings, after a confirmation). */
  resetAchievements: () => void;
}

/** Keeps only well-formed unlock records from storage; anything else is dropped rather than crashing the screen. */
export function sanitizeAchievements(raw: unknown): Record<string, AchievementUnlock> {
  const out: Record<string, AchievementUnlock> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    // Achievement ids are snake_case; anything else (say "__proto__") is not one of ours.
    if (!/^[a-z0-9_]+$/.test(id) || id === '__proto__' || !v || typeof v !== 'object') continue;
    const r = v as Partial<AchievementUnlock>;
    if (typeof r.unlockedAt !== 'number' || !Number.isFinite(r.unlockedAt)) continue;
    out[id] = { unlockedAt: r.unlockedAt, lifeName: typeof r.lifeName === 'string' ? r.lifeName : '', age: typeof r.age === 'number' && Number.isFinite(r.age) ? r.age : 0 };
  }
  return out;
}

const DEFAULT_SETTINGS: Settings = { haptics: true, showKarma: false, tutorialDone: false };

export const useSettingsStore = create<SettingsState>((set, get) => ({
  hydrated: false,
  settings: DEFAULT_SETTINGS,
  premium: false,
  adsReady: false,
  adMeta: emptyAdMeta(Date.now()),
  graveyard: [],
  achievements: {},
  achievementNotice: null,
  hydrate: async () => {
    const [settings, premium, adMeta, graveyard, achievements] = await Promise.all([
      readJson<Partial<Settings>>(StorageKeys.settings),
      readJson<{ premium: boolean }>(StorageKeys.premium),
      readJson<AdMeta>(StorageKeys.adsMeta),
      readJson<GraveyardEntry[]>(StorageKeys.graveyard),
      readJson<unknown>(StorageKeys.achievements),
    ]);
    set({
      hydrated: true,
      settings: { ...DEFAULT_SETTINGS, ...(settings ?? {}) },
      premium: premium?.premium === true,
      adMeta: startSession({ ...emptyAdMeta(Date.now()), ...(adMeta ?? {}) }, Date.now()),
      graveyard: Array.isArray(graveyard) ? graveyard : [],
      achievements: sanitizeAchievements(achievements),
    });
  },
  setSetting: (key, value) => {
    const settings = { ...get().settings, [key]: value };
    set({ settings });
    void writeJson(StorageKeys.settings, settings);
  },
  setPremium: (premium) => {
    set({ premium });
    void writeJson(StorageKeys.premium, { premium });
  },
  setAdsReady: (adsReady) => {
    if (get().adsReady !== adsReady) set({ adsReady });
  },
  updateAdMeta: (fn) => {
    const adMeta = fn(get().adMeta);
    set({ adMeta });
    void writeJson(StorageKeys.adsMeta, adMeta);
    return adMeta;
  },
  addToGraveyard: (entry) => {
    const graveyard = [entry, ...get().graveyard].slice(0, 200);
    set({ graveyard });
    void writeJson(StorageKeys.graveyard, graveyard);
  },
  removeFromGraveyard: (id) => {
    // Newest first, so the first match is this character's latest grave.
    const i = get().graveyard.findIndex((e) => e.id === id);
    if (i < 0) return;
    const graveyard = get().graveyard.filter((_, idx) => idx !== i);
    set({ graveyard });
    void writeJson(StorageKeys.graveyard, graveyard);
  },
  clearGraveyard: () => {
    set({ graveyard: [] });
    void remove(StorageKeys.graveyard);
  },
  unlockAchievements: (ids, by, now = Date.now()) => {
    const current = get().achievements;
    const fresh = [...new Set(ids)].filter((id) => !Object.prototype.hasOwnProperty.call(current, id));
    if (!fresh.length) return;
    const achievements = { ...current };
    for (const id of fresh) achievements[id] = { unlockedAt: now, lifeName: by.lifeName, age: by.age };
    set({ achievements, achievementNotice: { ids: fresh, seq: (get().achievementNotice?.seq ?? 0) + 1 } });
    void writeJson(StorageKeys.achievements, achievements);
  },
  resetAchievements: () => {
    set({ achievements: {}, achievementNotice: null });
    void remove(StorageKeys.achievements);
  },
}));
