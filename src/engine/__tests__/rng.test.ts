import { Rng } from '../rng';

describe('Rng', () => {
  it('is deterministic for a given seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('produces floats in [0,1) and ints within bounds', () => {
    const r = new Rng(7);
    for (let i = 0; i < 5000; i++) {
      const f = r.next();
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
      const n = r.int(3, 9);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(9);
    }
  });

  it('can be snapshotted and resumed', () => {
    const r = new Rng(99);
    r.next();
    r.next();
    const snap = r.snapshot();
    const resumed = new Rng(snap);
    expect(resumed.next()).toBe(r.next());
  });

  it('respects weights', () => {
    const r = new Rng(1234);
    const items = [
      { k: 'never', w: 0 },
      { k: 'rare', w: 1 },
      { k: 'common', w: 9 },
    ];
    const counts: Record<string, number> = { never: 0, rare: 0, common: 0 };
    for (let i = 0; i < 10000; i++) counts[r.weighted(items, (x) => x.w).k]!++;
    expect(counts.never).toBe(0);
    expect(counts.common).toBeGreaterThan(counts.rare! * 5);
  });

  it('chance() handles edge probabilities', () => {
    const r = new Rng(5);
    expect(r.chance(0)).toBe(false);
    expect(r.chance(1)).toBe(true);
    let hits = 0;
    for (let i = 0; i < 10000; i++) if (r.chance(0.25)) hits++;
    expect(hits).toBeGreaterThan(2200);
    expect(hits).toBeLessThan(2800);
  });

  it('normal() clamps to bounds', () => {
    const r = new Rng(8);
    for (let i = 0; i < 1000; i++) {
      const v = r.normal(50, 30, 0, 100);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});
