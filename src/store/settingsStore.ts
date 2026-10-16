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
  adMeta: AdMeta;
  graveyard: GraveyardEntry[];
  hydrate: () => Promise<void>;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setPremium: (premium: boolean) => void;
  updateAdMeta: (fn: (meta: AdMeta) => AdMeta) => AdMeta;
  addToGraveyard: (entry: GraveyardEntry) => void;
  /** Undoes the most recent grave of a character (second chance). */
  removeFromGraveyard: (id: string) => void;
  clearGraveyard: () => void;
}

const DEFAULT_SETTINGS: Settings = { haptics: true, showKarma: false, tutorialDone: false };

export const useSettingsStore = create<SettingsState>((set, get) => ({
  hydrated: false,
  settings: DEFAULT_SETTINGS,
  premium: false,
  adMeta: emptyAdMeta(Date.now()),
  graveyard: [],
  hydrate: async () => {
    const [settings, premium, adMeta, graveyard] = await Promise.all([
      readJson<Partial<Settings>>(StorageKeys.settings),
      readJson<{ premium: boolean }>(StorageKeys.premium),
      readJson<AdMeta>(StorageKeys.adsMeta),
      readJson<GraveyardEntry[]>(StorageKeys.graveyard),
    ]);
    set({
      hydrated: true,
      settings: { ...DEFAULT_SETTINGS, ...(settings ?? {}) },
      premium: premium?.premium === true,
      adMeta: startSession({ ...emptyAdMeta(Date.now()), ...(adMeta ?? {}) }, Date.now()),
      graveyard: Array.isArray(graveyard) ? graveyard : [],
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
}));
