import AsyncStorage from '@react-native-async-storage/async-storage';

import type { GameState, LogEntry } from '@/engine/types';
import { StorageKeys } from '@/services/storage';
import { useGameStore, yearHighlight } from '../gameStore';
import { attachLifeLedger, hydrateLifeLedger, LEDGER_STORAGE_KEY, useLifeLedger } from '../lifeLedger';
import { useSettingsStore } from '../settingsStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const flush = () => new Promise((r) => setTimeout(r, 400));

beforeEach(async () => {
  await AsyncStorage.clear();
  useGameStore.setState({ game: null, hydrated: false, adShowing: false, pendingSummary: null });
  useLifeLedger.setState({ lifeId: null, marks: {}, hydrated: false });
  useSettingsStore.setState({ premium: false, graveyard: [] });
  await useSettingsStore.getState().hydrate();
});

describe('lastResult is a moment, not part of the save', () => {
  it('is never written to storage, so a relaunch does not replay an old toast', async () => {
    useGameStore.getState().newLife({ countryCode: 'US' }, { birthCard: false });
    useGameStore.getState().act({ type: 'study' });
    useGameStore.getState().act({ type: 'activity', id: 'library' });
    expect(useGameStore.getState().game!.lastResult).not.toBeNull();
    await flush();
    const saved = JSON.parse((await AsyncStorage.getItem(StorageKeys.save))!);
    expect(saved.lastResult).toBeNull();
    expect(saved.character.id).toBe(useGameStore.getState().game!.character.id);
  });

  it('is dropped when an older save that still carries one is loaded', async () => {
    useGameStore.getState().newLife({ countryCode: 'US' }, { birthCard: false });
    await flush();
    const saved = JSON.parse((await AsyncStorage.getItem(StorageKeys.save))!);
    await AsyncStorage.setItem(StorageKeys.save, JSON.stringify({ ...saved, lastResult: { text: "I've done that enough this year.", kind: 'info' } }));
    useGameStore.setState({ game: null, hydrated: false });
    await useGameStore.getState().hydrate();
    expect(useGameStore.getState().game!.lastResult).toBeNull();
  });
});

describe('year recap', () => {
  const at = (g: GameState, age: number, lines: [string, LogEntry['kind']][]): GameState => ({
    ...g,
    character: { ...g.character, age },
    log: [...g.log, { age, year: 2000 + age, text: `${2000 + age}: Age ${age}`, kind: 'year' }, ...lines.map(([text, kind]) => ({ age, year: 2000 + age, text, kind }))],
  });

  it('prefers milestones and skips a line that was already the news last year', () => {
    useGameStore.getState().newLife({ countryCode: 'US' }, { birthCard: false });
    const g = useGameStore.getState().game!;
    const debt = 'Debt collectors are calling. I have no income and the interest keeps piling up.';
    const y1 = at(g, 30, [[debt, 'bad']]);
    const y2 = at(y1, 31, [[debt, 'bad'], ['I made a new friend, Sam.', 'good']]);
    expect(yearHighlight(y1, y2)).toBe('I made a new friend, Sam.');
    const y3 = at(y2, 32, [[debt, 'bad'], ['I made a new friend, Kim.', 'good'], ['I turned 32.', 'milestone']]);
    expect(yearHighlight(y2, y3)).toBe('I turned 32.');
    const y4 = at(y3, 33, [[debt, 'bad']]);
    expect(yearHighlight(y3, y4)).toBeNull();
  });

  it('counts the choices made on the year cards in the recap numbers, matching the journal card', async () => {
    const detach = attachLifeLedger();
    let sawEvent = false;
    try {
      useGameStore.getState().newLife({ countryCode: 'US' }, { birthCard: false });
      for (let i = 0; i < 60 && !sawEvent; i++) {
        const before = useGameStore.getState().game!;
        await useGameStore.getState().ageUp();
        let g = useGameStore.getState().game!;
        const hadEvent = !!g.pendingEvent;
        while (g.pendingEvent) {
          useGameStore.getState().choose(g.pendingEvent.choices[0]!.id);
          g = useGameStore.getState().game!;
        }
        if (!g.alive) break;
        const recap = g.lastResult!;
        expect(recap.kind).toBe('year');
        const whole: Record<string, number> = {};
        for (const k of ['happiness', 'health', 'smarts', 'looks'] as const) {
          const d = g.character.stats[k] - before.character.stats[k];
          if (d) whole[k] = d;
        }
        expect(recap.statDeltas).toEqual(whole);
        // The ledger's start of this year is the state just before Age+.
        const start = useLifeLedger.getState().marks[g.character.age]!;
        expect(start.stats).toEqual(before.character.stats);
        sawEvent = hadEvent;
      }
      expect(sawEvent).toBe(true);
    } finally {
      detach();
    }
  });
});

describe('year ledger persistence', () => {
  it('keeps the saved year boundaries for the same life across a relaunch', async () => {
    const detach = attachLifeLedger();
    try {
      useGameStore.getState().newLife({ countryCode: 'US' }, { birthCard: false });
      await hydrateLifeLedger();
      for (let i = 0; i < 3; i++) {
        await useGameStore.getState().ageUp();
        let g = useGameStore.getState().game!;
        while (g.pendingEvent) {
          useGameStore.getState().choose(g.pendingEvent.choices[0]!.id);
          g = useGameStore.getState().game!;
        }
      }
      await flush();
      const stored = JSON.parse((await AsyncStorage.getItem(LEDGER_STORAGE_KEY))!);
      expect(Object.keys(stored.marks).sort()).toEqual(['0', '1', '2', '3']);

      // Relaunch: the game loads first (a mid-year snapshot is taken), then the saved ledger wins.
      const saved = useGameStore.getState().game!;
      useLifeLedger.setState({ lifeId: null, marks: {}, hydrated: false });
      useGameStore.setState({ game: null });
      useGameStore.setState({ game: { ...saved, character: { ...saved.character, stats: { ...saved.character.stats, happiness: 1 } } } });
      await hydrateLifeLedger();
      expect(useLifeLedger.getState().marks).toEqual(stored.marks);
    } finally {
      detach();
    }
  });
});
