import { avatarFor, isLifeRoute, signed, statPills, totalDebt } from '@/components/game/lifeFormat';
import { groupLogByYear, newestFirst, splitChoice, yearChange } from '@/components/game/lifeJournal';
import { EMPTY_QUEUE, enqueueToast, MAX_PENDING, nextToast, toastFromResult, type ToastItem } from '@/components/game/lifeToastQueue';
import { createLife } from '@/engine';
import type { GameState, LogEntry } from '@/engine/types';
import { advanceLedger, markOf, type LedgerMark } from '@/store/lifeLedger';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const entry = (age: number, text: string, kind: LogEntry['kind'] = 'info'): LogEntry => ({ age, year: 2000 + age, text, kind });

function life(seed = 7, countryCode = 'GB'): GameState {
  return createLife({ countryCode, firstName: 'Ada', gender: 'female' }, seed, 1);
}

describe('journal year groups', () => {
  it('opens a card at every year header and keeps the year lines in order', () => {
    const log = [entry(0, '2000: Age 0', 'year'), entry(0, 'born', 'milestone'), entry(0, 'parents'), entry(1, '2001: Age 1', 'year'), entry(1, 'cried'), entry(1, 'walked', 'good')];
    const groups = groupLogByYear(log);
    expect(groups.map((g) => [g.age, g.year, g.entries.map((e) => e.text)])).toEqual([
      [0, 2000, ['born', 'parents']],
      [1, 2001, ['cried', 'walked']],
    ]);
    expect(groups.map((g) => g.key)).toEqual(['y0', 'y3']);
  });

  it('groups header-less lines by age (older saves) and puts the newest year first', () => {
    const groups = newestFirst(groupLogByYear([entry(3, 'a'), entry(3, 'b'), entry(4, 'c')]));
    expect(groups.map((g) => g.age)).toEqual([4, 3]);
    expect(groups[1]!.entries).toHaveLength(2);
  });

  it('keeps the whole life: no cap on how many lines or years are grouped', () => {
    const log: LogEntry[] = [];
    for (let age = 0; age <= 110; age++) {
      log.push(entry(age, `${2000 + age}: Age ${age}`, 'year'));
      for (let i = 0; i < 6; i++) log.push(entry(age, `line ${i} at ${age}`));
    }
    const groups = newestFirst(groupLogByYear(log));
    expect(log.length).toBeGreaterThan(700);
    expect(groups).toHaveLength(111);
    expect(groups[0]!.age).toBe(110);
    expect(groups[groups.length - 1]!.entries[0]!.text).toBe('line 0 at 0');
  });

  it('splits an event line into the story and the choice made', () => {
    expect(splitChoice('A dog followed me. → Call the number')).toEqual({ story: 'A dog followed me.', choice: 'Call the number' });
    expect(splitChoice('No choice here.')).toEqual({ story: 'No choice here.', choice: null });
  });
});

describe('year ledger', () => {
  const mark = (h: number, worth = 0): LedgerMark => ({ stats: { happiness: h, health: 50, smarts: 50, looks: 50 }, worth });

  it('reports each year from its start to the next year start, and the current year up to now', () => {
    const marks = { 4: mark(50, 0), 5: mark(56, 100), 6: mark(52, 90) };
    expect(yearChange(marks, 4, 6, mark(60))).toEqual({ stats: { happiness: 6 }, worth: 100 });
    expect(yearChange(marks, 6, 6, mark(49, 300))).toEqual({ stats: { happiness: -3 }, worth: 210 });
    expect(yearChange(marks, 3, 6, mark(49))).toBeNull();
  });

  it('records the moment before Age+ as the start of the new year and resets for a new life', () => {
    const g0 = life();
    let ledger = advanceLedger({ lifeId: null, marks: {} }, null, g0);
    expect(ledger.lifeId).toBe(g0.character.id);
    expect(Object.keys(ledger.marks)).toEqual(['0']);
    // an action during the year changes nothing in the ledger
    const acted = { ...g0, character: { ...g0.character, stats: { ...g0.character.stats, happiness: 10 } } };
    expect(advanceLedger(ledger, g0, acted)).toBe(ledger);
    // Age+: the new year starts from the state just before it
    const aged = { ...acted, character: { ...acted.character, age: 1, stats: { ...acted.character.stats, happiness: 30 } } };
    ledger = advanceLedger(ledger, acted, aged);
    expect(ledger.marks[1]).toEqual(markOf(acted));
    expect(yearChange(ledger.marks, 0, 1, markOf(aged))!.stats.happiness).toBe(10 - g0.character.stats.happiness);
    expect(yearChange(ledger.marks, 1, 1, markOf(aged))!.stats.happiness).toBe(20);

    const other = life(99);
    const fresh = advanceLedger(ledger, aged, other);
    expect(fresh.lifeId).toBe(other.character.id);
    expect(Object.keys(fresh.marks)).toEqual([String(other.character.age)]);
    expect(advanceLedger(fresh, other, null)).toEqual({ lifeId: null, marks: {} });
  });
});

describe('feedback toasts', () => {
  const item = (id: number, text: string, kind: ToastItem['kind'] = 'info'): ToastItem => ({ id, kind, text, pills: [], count: 1, duration: 2400 });

  it('shows one at a time, keeps a short backlog, and lets a new year replace stale results', () => {
    let q = enqueueToast(EMPTY_QUEUE, item(1, 'a'));
    expect(q.current?.id).toBe(1);
    for (let i = 2; i <= 6; i++) q = enqueueToast(q, item(i, `r${i}`));
    expect(q.current?.id).toBe(1);
    expect(q.pending.map((t) => t.id)).toEqual([4, 5, 6]);
    expect(q.pending).toHaveLength(MAX_PENDING);
    q = nextToast(q);
    expect(q.current?.id).toBe(4);
    q = enqueueToast(q, item(9, '2001 · Age 1', 'year'));
    expect(q).toEqual({ current: expect.objectContaining({ id: 9 }), pending: [] });
  });

  it('collapses identical results in a row into a counter', () => {
    let q = enqueueToast(EMPTY_QUEUE, item(1, "I'm out of energy this year."));
    q = enqueueToast(q, item(2, "I'm out of energy this year."));
    expect(q.pending).toHaveLength(0);
    expect(q.current).toMatchObject({ id: 1, count: 2 });
  });

  it('builds year recaps with a title, sign-coloured stat pills and money in the local currency', () => {
    const g = life(3, 'GB');
    const t = toastFromResult({ text: '2011 · Age 12 · I made the team.', kind: 'year', statDeltas: { health: -3, happiness: 6 }, moneyDelta: 1200 }, g, null, 1)!;
    expect(t.title).toBe('Age 12 · 2011');
    expect(t.text).toBe('I made the team.');
    expect(t.pills.map((p) => [p.label, p.value, p.tone])).toEqual([
      ['Happiness', '+6', 'up'],
      ['Health', '−3', 'down'],
      ['Cash', '+£948', 'up'],
    ]);
    // A quiet year with nothing to say shows nothing.
    expect(toastFromResult({ text: '2011 · Age 12', kind: 'year', statDeltas: {} }, g, null, 2)).toBeNull();
  });

  it('says when an action was paid for on credit, in the currency of the year', () => {
    const before = { ...life(5, 'FR'), year: 2010 };
    const after = { ...before, finances: { ...before.finances, debt: before.finances.debt + 680 } };
    const t = toastFromResult({ text: 'Paid the audit.', kind: 'bad', moneyDelta: -680 }, after, before, 1)!;
    expect(t.pills.map((p) => [p.key, p.value])).toEqual([
      ['money', '−€626'],
      ['credit', '€626'],
    ]);
    // Before the euro notes of 2002 a French life pays in francs, as its journal does.
    const old = { ...after, year: 1990 };
    const f = toastFromResult({ text: 'Paid the audit.', kind: 'bad', moneyDelta: -680 }, old, { ...before, year: 1990 }, 2)!;
    expect(f.pills.map((p) => [p.key, p.value])).toEqual([
      ['money', '−4,100 francs'],
      ['credit', '4,100 francs'],
    ]);
  });
});

describe('header helpers', () => {
  it('ages the avatar by life stage and gender', () => {
    expect([0, 2, 3, 12, 13, 59, 60, 95].map((a) => avatarFor(a, 'female'))).toEqual(['👶', '👶', '👧', '👧', '👩', '👩', '👵', '👵']);
    expect([1, 8, 30, 71].map((a) => avatarFor(a, 'male'))).toEqual(['👶', '👦', '👨', '👴']);
  });

  it('counts consumer and student debt, and signs numbers with a real minus', () => {
    const g = life();
    expect(totalDebt({ ...g, finances: { ...g.finances, debt: 100 }, education: { ...g.education, studentDebt: 50 } })).toBe(150);
    expect([signed(3), signed(-3), signed(0)]).toEqual(['+3', '−3', '0']);
    expect(statPills({ looks: -2 })[0]).toMatchObject({ label: 'Looks', tone: 'down' });
  });

  it('shows cash only on the screens about the life being played', () => {
    for (const p of ['/occupation', '/assets', '/relationships', '/activities', '/person/abc']) expect(isLifeRoute(p)).toBe(true);
    for (const p of ['/', '/settings', '/graveyard', '/premium', '/new-life', '/death', '/life', null]) expect(isLifeRoute(p)).toBe(false);
  });
});
