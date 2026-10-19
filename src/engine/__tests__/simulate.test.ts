import { EVENTS } from '@/data/events';
import { balancedPolicy, passivePolicy, recklessPolicy, simulateLife, type LifeSummary } from '../simulate';

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
}

function run(policy: typeof passivePolicy, n: number, offset: number): LifeSummary[] {
  const out: LifeSummary[] = [];
  for (let i = 0; i < n; i++) out.push(simulateLife(offset + i, policy).summary);
  return out;
}

describe('whole-life simulation', () => {
  const N = 150;
  const passive = run(passivePolicy, N, 1000);
  const balanced = run(balancedPolicy, N, 5000);
  const reckless = run(recklessPolicy, N, 9000);

  it('every life ends, with plausible ages', () => {
    for (const set of [passive, balanced, reckless]) {
      const med = median(set.map((x) => x.ageAtDeath));
      expect(med).toBeGreaterThanOrEqual(50);
      expect(med).toBeLessThanOrEqual(92);
      expect(Math.max(...set.map((x) => x.ageAtDeath))).toBeLessThanOrEqual(120);
    }
    // A sensible player should usually reach retirement age.
    expect(median(balanced.map((x) => x.ageAtDeath))).toBeGreaterThanOrEqual(70);
  });

  it('a balanced player does better than a passive one', () => {
    const worth = (set: LifeSummary[]) => median(set.map((x) => x.netWorth));
    expect(worth(balanced)).toBeGreaterThan(worth(passive));
    expect(median(balanced.map((x) => x.jobsHeld))).toBeGreaterThanOrEqual(1);
  });

  it('years are never empty and events happen', () => {
    for (const set of [passive, balanced]) {
      expect(Math.max(...set.map((x) => x.emptyYears))).toBe(0);
      expect(median(set.map((x) => x.eventsFaced))).toBeGreaterThan(Math.min(5, EVENTS.length));
    }
  });

  it("counts a year as empty only when its finished journal is, even after a birthday took back last year's quiet line", () => {
    // The count starts at the year's header. Counted as growth since last year instead, a year looked one line short
    // whenever its birthday took back last year's quiet line (balanced seed 260 reported a false empty year).
    for (let seed = 255; seed <= 265; seed++) {
      const { state, summary } = simulateLife(seed, balancedPolicy);
      const headers = state.log.flatMap((e, i) => (e.kind === 'year' ? [i] : []));
      // Every year but the first (the newborn year, before the first birthday) and the last (the life ended in it).
      const empty = headers.slice(1, -1).filter((h, k) => headers[k + 2]! - h <= 1).length;
      expect([seed, summary.emptyYears]).toEqual([seed, empty]);
      expect([seed, summary.emptyYears]).toEqual([seed, 0]);
    }
  });

  it('reckless play leads to arrests sometimes', () => {
    expect(reckless.some((x) => x.arrests > 0)).toBe(true);
  });

  it('a working life is solvent: rare bankruptcy, and Rich is earned, not the default', () => {
    // Guards the economy tuning (docs/GAME_DESIGN.md §9; measure with npm run balance).
    const share = (set: LifeSummary[], f: (x: LifeSummary) => boolean) => set.filter(f).length / set.length;
    expect(share(balanced, (x) => x.bankrupt)).toBeLessThanOrEqual(0.08);
    expect(share(balanced, (x) => x.ribbonId === 'rich')).toBeLessThanOrEqual(0.25);
    const counts = new Map<string, number>();
    for (const x of balanced) counts.set(x.ribbonId, (counts.get(x.ribbonId) ?? 0) + 1);
    expect(Math.max(...counts.values()) / balanced.length).toBeLessThanOrEqual(0.4);
  });

  it('ribbons are diverse', () => {
    const ids = new Set([...passive, ...balanced, ...reckless].map((x) => x.ribbonId));
    expect(ids.size).toBeGreaterThanOrEqual(4);
  });
});
