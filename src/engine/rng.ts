/**
 * Deterministic pseudo-random number generator (mulberry32).
 *
 * The whole simulation is driven from a single RNG whose state lives inside
 * the saved GameState. That makes every life reproducible from (seed, inputs),
 * which is what lets us unit-test outcomes and replay bug reports.
 */

export interface RngState {
  /** Unsigned 32-bit state word. */
  s: number;
}

export class Rng {
  private state: number;

  constructor(seed: number | RngState) {
    this.state = typeof seed === 'number' ? seed >>> 0 : seed.s >>> 0;
    if (this.state === 0) this.state = 0x9e3779b9;
  }

  /** Snapshot that can be stored in the save file. */
  snapshot(): RngState {
    return { s: this.state >>> 0 };
  }

  /** Uniform float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    if (max < min) [min, max] = [max, min];
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Float in [min, max). */
  float(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** True with probability p (0..1). */
  chance(p: number): boolean {
    if (p <= 0) return false;
    if (p >= 1) return true;
    return this.next() < p;
  }

  /** Uniform pick. Throws on an empty list. */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick: empty list');
    return items[this.int(0, items.length - 1)] as T;
  }

  /** Weighted pick. Items with weight <= 0 are never chosen. */
  weighted<T>(items: readonly T[], weightOf: (item: T) => number): T {
    let total = 0;
    for (const item of items) total += Math.max(0, weightOf(item));
    if (total <= 0) throw new Error('Rng.weighted: no positive weights');
    let roll = this.next() * total;
    for (const item of items) {
      const w = Math.max(0, weightOf(item));
      if (roll < w) return item;
      roll -= w;
    }
    return items[items.length - 1] as T;
  }

  /** Fisher-Yates shuffle (returns a new array). */
  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      const tmp = out[i] as T;
      out[i] = out[j] as T;
      out[j] = tmp;
    }
    return out;
  }

  /** Approximately normal sample via sum of uniforms, clamped to [min,max]. */
  normal(mean: number, stdDev: number, min = -Infinity, max = Infinity): number {
    let sum = 0;
    for (let i = 0; i < 6; i++) sum += this.next();
    const z = (sum - 3) / Math.sqrt(0.5); // ~N(0,1)
    return Math.min(max, Math.max(min, mean + z * stdDev));
  }

  /** Short unique-ish id derived from the RNG (good enough for in-save ids). */
  id(prefix = ''): string {
    const a = Math.floor(this.next() * 0xffffffff).toString(36);
    const b = Math.floor(this.next() * 0xffffffff).toString(36);
    return `${prefix}${a}${b}`;
  }
}

/** Seed from a non-deterministic source; only used when starting a new life. */
export function randomSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}
