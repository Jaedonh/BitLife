import { achievementFace, achievementProgress, formatUnlockDate, unlockedSince, unlockLine } from '@/components/game/achievements';
import { EMPTY_QUEUE, enqueueToast, MAX_PENDING, nextToast, resetQueue, toastFromAchievements, type ToastItem } from '@/components/game/lifeToastQueue';
import { ACHIEVEMENT_BY_ID, ACHIEVEMENTS } from '@/data/achievements';

const item = (id: number, text: string, kind: ToastItem['kind'] = 'info'): ToastItem => ({ id, kind, text, pills: [], count: 1, duration: 2400 });
const trophy = (id: number, ...ids: string[]) => toastFromAchievements(ids.map((x) => ACHIEVEMENT_BY_ID[x]!), id)!;

describe('achievement toasts', () => {
  it('names one unlock in full and lists a batch', () => {
    const one = trophy(1, 'married');
    expect(one).toMatchObject({ kind: 'milestone', title: 'Achievement unlocked', text: '💍 Tied the Knot: Get married.', icon: '🏆', sticky: true });
    const many = trophy(2, 'married', 'first_job', 'homeowner');
    expect(many.title).toBe('3 achievements unlocked');
    expect(many.text).toBe('💍 Tied the Knot · 💼 Clocking In · 🏡 Homeowner');
    expect(toastFromAchievements([], 3)).toBeNull();
  });

  it('is never pushed aside by a year recap', () => {
    // On screen (or waiting behind an event card) when the recap arrives: it finishes first.
    let q = enqueueToast(EMPTY_QUEUE, trophy(1, 'married'));
    q = enqueueToast(q, item(2, 'a result'));
    q = enqueueToast(q, item(3, '2031 · Age 30', 'year'));
    expect(q.current?.id).toBe(1);
    expect(q.pending.map((t) => t.id)).toEqual([3]);
    // Tapping Age+ again only replaces the stale recap, never the achievement.
    q = enqueueToast(q, item(4, '2032 · Age 31', 'year'));
    expect(q.current?.id).toBe(1);
    expect(q.pending.map((t) => t.id)).toEqual([4]);
    expect(nextToast(q).current?.id).toBe(4);
  });

  it('goes before the recap when it was waiting behind an ordinary result', () => {
    let q = enqueueToast(EMPTY_QUEUE, item(1, 'a result'));
    q = enqueueToast(q, trophy(2, 'retired'));
    q = enqueueToast(q, item(3, 'another result'));
    q = enqueueToast(q, item(4, '2031 · Age 30', 'year'));
    expect(q.current?.id).toBe(2);
    expect(q.pending.map((t) => t.id)).toEqual([4]);
    q = enqueueToast(q, item(5, '2032 · Age 31', 'year'));
    expect(q.current?.id).toBe(2);
    expect(q.pending.map((t) => t.id)).toEqual([5]);
    // Without achievements a recap still replaces everything.
    expect(enqueueToast({ current: item(6, 'x'), pending: [item(7, 'y')] }, item(8, '2033 · Age 32', 'year'))).toEqual({ current: expect.objectContaining({ id: 8 }), pending: [] });
  });

  it('outlives the end of a life and a new one', () => {
    let q = enqueueToast(EMPTY_QUEUE, item(1, 'old result'));
    q = enqueueToast(q, trophy(2, 'one_down'));
    q = enqueueToast(q, item(3, 'another'));
    q = resetQueue(q);
    expect(q).toEqual({ current: expect.objectContaining({ id: 2 }), pending: [] });
    expect(resetQueue(EMPTY_QUEUE)).toBe(EMPTY_QUEUE);
    expect(resetQueue({ current: item(4, 'x'), pending: [item(5, 'y')] })).toEqual(EMPTY_QUEUE);
  });

  it('is never the one dropped when the backlog overflows', () => {
    let q = enqueueToast(EMPTY_QUEUE, item(1, 'showing'));
    q = enqueueToast(q, trophy(2, 'retired'));
    for (let i = 3; i <= 8; i++) q = enqueueToast(q, item(i, `r${i}`));
    expect(q.pending).toHaveLength(MAX_PENDING);
    expect(q.pending.map((t) => t.id)).toEqual([2, 7, 8]);
  });
});

describe('achievement presentation', () => {
  const unlock = (unlockedAt: number) => ({ unlockedAt, lifeName: 'Ana Silva', age: 34 });

  it('counts only shipped achievements', () => {
    expect(achievementProgress({})).toEqual({ unlocked: 0, total: ACHIEVEMENTS.length });
    expect(achievementProgress({ married: unlock(1), retired: unlock(2), removed_in_v2: unlock(3) })).toEqual({ unlocked: 2, total: 40 });
  });

  it('counts what this life unlocked', () => {
    const u = { married: unlock(100), retired: unlock(200), saint: unlock(300) };
    expect(unlockedSince(u, 150)).toBe(2);
    expect(unlockedSince(u, 400)).toBe(0);
  });

  it('says who unlocked it and when', () => {
    const ms = new Date(2026, 2, 4, 12).getTime();
    expect(formatUnlockDate(ms)).toBe('Mar 4, 2026');
    expect(unlockLine(unlock(ms))).toBe('Ana Silva, age 34 · Mar 4, 2026');
    expect(unlockLine({ unlockedAt: Number.NaN, lifeName: '', age: 7 })).toBe('Age 7');
  });

  it('keeps secrets until they are found', () => {
    const secret = ACHIEVEMENT_BY_ID.ouch!;
    expect(achievementFace(secret, false)).toEqual({ emoji: '❓', name: '???', description: 'A secret. Keep living to find it.' });
    expect(achievementFace(secret, true).name).toBe('Ouch');
    expect(achievementFace(ACHIEVEMENT_BY_ID.married!, false).name).toBe('Tied the Knot');
  });
});
