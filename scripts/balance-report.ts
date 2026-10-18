/**
 * Balance report: plays many seeded lives per policy and prints the numbers the
 * game design targets (docs/GAME_DESIGN.md). Deterministic for a given --n/--seed.
 *
 *   npx tsx scripts/balance-report.ts                 # all countries, 300 lives per policy
 *   npx tsx scripts/balance-report.ts --country US    # one country
 *   npx tsx scripts/balance-report.ts --n 600 --seed 5000 --json
 *
 * Targets (balanced play unless noted):
 *   median death age 75-85 · passive median >= 60 · deaths under 18 < 2%
 *   solvent at 35 (cash > debt, among workers) >= 80% · millionaire at 60 10-25% (possible, not default)
 *   bankrupt by death <= 8% (balanced), <= 12% (grinder) · married by 40 40-70%
 *   Rich ribbon <= 25% and not the only dominant ribbon
 */
import { ageUp } from '../src/engine/ageUp';
import { applyAction } from '../src/engine/actions';
import { EVENT_REGISTRY } from '../src/engine/events/registry';
import { resolveChoice } from '../src/engine/events/select';
import { scaleMoney } from '../src/engine/events/text';
import { Rng } from '../src/engine/rng';
import { balancedPolicy, passivePolicy, recklessPolicy, type Policy } from '../src/engine/simulate';
import { createLife } from '../src/engine/systems/character';
import type { GameState, PlayerAction } from '../src/engine/types';
import { netWorth } from '../src/engine/util';

/** Balanced plus pushing the career every year. */
const grinderPolicy: Policy = (s, rng) => {
  const extra: PlayerAction[] = s.career.job ? [{ type: 'workHarder' }, { type: 'askRaise' }, { type: 'askPromotion' }] : [];
  return [...balancedPolicy(s, rng).filter((a) => a.type !== 'workHarder'), ...extra];
};

/** Balanced plus a car, a mortgaged home and regular treats. */
const spenderPolicy: Policy = (s, rng) => {
  const out = balancedPolicy(s, rng);
  const age = s.character.age;
  if (age >= 20 && s.career.job) {
    if (!s.assets.some((a) => a.kind === 'car')) out.push({ type: 'buyAsset', defId: 'sedan', financing: 'cash' });
    if (age >= 28 && !s.assets.some((a) => a.kind === 'house')) out.push({ type: 'buyAsset', defId: 'suburban', financing: 'mortgage' });
    out.push({ type: 'activity', id: 'vacation' }, { type: 'activity', id: 'movies' }, { type: 'activity', id: 'party' });
  }
  return out;
};

const POLICIES: Record<string, Policy> = { passive: passivePolicy, balanced: balancedPolicy, grinder: grinderPolicy, spender: spenderPolicy, reckless: recklessPolicy };

interface LifeStats {
  deathAge: number;
  ribbon: string;
  bankrupt: boolean;
  millionaireAt60: boolean | null;
  worthAt60Usd: number | null;
  solventAt35: boolean | null;
  marriedBy40: boolean | null;
  workYears: number;
  deficitWorkYears: number;
}

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1]! : fallback;
}

function playLife(seed: number, policy: Policy, countryCode: string | undefined): LifeStats {
  let s: GameState = createLife(countryCode ? { countryCode } : {}, seed);
  const rng = new Rng(seed ^ 0xabcdef);
  const out: LifeStats = { deathAge: 0, ribbon: '', bankrupt: false, millionaireAt60: null, worthAt60Usd: null, solventAt35: null, marriedBy40: null, workYears: 0, deficitWorkYears: 0 };
  for (let y = 0; y < 130 && s.alive; y++) {
    s = ageUp(s);
    let guard = 0;
    while (s.pendingEvent && guard++ < 20) s = resolveChoice(s, rng.pick(s.pendingEvent.choices).id, EVENT_REGISTRY);
    if (!s.alive) break;
    for (const a of policy(s, rng)) s = applyAction(s, a);
    // An arrest opens a court card; answer it before the next year, as the app does.
    while (s.pendingEvent && guard++ < 40) s = resolveChoice(s, rng.pick(s.pendingEvent.choices).id, EVENT_REGISTRY);
    const age = s.character.age;
    if (s.finances.bankrupt) out.bankrupt = true;
    if (age >= 25 && age <= 59 && s.career.job && !s.career.job.partTime) {
      out.workYears++;
      if (s.finances.lastYear.income < s.finances.lastYear.expenses) out.deficitWorkYears++;
    }
    if (age === 35 && s.career.job) out.solventAt35 = s.finances.cash > s.finances.debt;
    if (age === 40) out.marriedBy40 = s.counters.marriages > 0;
    if (age === 60) {
      const worth = netWorth(s);
      out.millionaireAt60 = worth >= scaleMoney(s, 1_000_000);
      out.worthAt60Usd = Math.round(worth / (scaleMoney(s, 1_000_000) / 1_000_000));
    }
  }
  out.deathAge = s.character.age;
  out.ribbon = s.death?.ribbonId ?? '';
  return out;
}

const pct = (num: number, den: number) => (den ? `${((100 * num) / den).toFixed(1)}%` : 'n/a');
const median = (xs: number[]) => {
  if (!xs.length) return NaN;
  const v = [...xs].sort((a, b) => a - b);
  return v[Math.floor(v.length / 2)]!;
};

function report(name: string, lives: LifeStats[]) {
  const n = lives.length;
  const at60 = lives.filter((l) => l.millionaireAt60 !== null);
  const at35 = lives.filter((l) => l.solventAt35 !== null);
  const at40 = lives.filter((l) => l.marriedBy40 !== null);
  const work = lives.reduce((a, l) => a + l.workYears, 0);
  const deficit = lives.reduce((a, l) => a + l.deficitWorkYears, 0);
  const ribbons: Record<string, number> = {};
  for (const l of lives) ribbons[l.ribbon] = (ribbons[l.ribbon] ?? 0) + 1;
  const topRibbons = Object.entries(ribbons)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, v]) => `${k} ${pct(v, n)}`)
    .join(', ');
  return {
    policy: name,
    lives: n,
    medianDeath: median(lives.map((l) => l.deathAge)),
    under18: pct(lives.filter((l) => l.deathAge < 18).length, n),
    solventAt35: pct(at35.filter((l) => l.solventAt35).length, at35.length),
    millionaireAt60: pct(at60.filter((l) => l.millionaireAt60).length, at60.length),
    medianWorthAt60Usd: median(at60.map((l) => l.worthAt60Usd ?? 0)),
    bankrupt: pct(lives.filter((l) => l.bankrupt).length, n),
    deficitWorkYears: pct(deficit, work),
    marriedBy40: pct(at40.filter((l) => l.marriedBy40).length, at40.length),
    rich: pct(ribbons.rich ?? 0, n),
    topRibbons,
  };
}

function main() {
  const n = Number(arg('n', '300'));
  const seed0 = Number(arg('seed', '5000'));
  const country = arg('country', '') || undefined;
  const only = arg('policies', Object.keys(POLICIES).join(',')).split(',');
  const rows = only.map((name) => {
    const policy = POLICIES[name];
    if (!policy) throw new Error(`unknown policy ${name}`);
    const lives: LifeStats[] = [];
    for (let i = 0; i < n; i++) lives.push(playLife(seed0 + i, policy, country));
    return report(name, lives);
  });
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ n, seed: seed0, country: country ?? 'all', rows }, null, 2));
    return;
  }
  console.log(`Balance report: ${n} lives per policy, seeds ${seed0}..${seed0 + n - 1}, country ${country ?? 'random'}\n`);
  const cols = ['policy', 'medianDeath', 'under18', 'solventAt35', 'millionaireAt60', 'medianWorthAt60Usd', 'bankrupt', 'deficitWorkYears', 'marriedBy40', 'rich'] as const;
  console.log(`| ${cols.join(' | ')} |`);
  console.log(`|${cols.map(() => '---').join('|')}|`);
  for (const r of rows) console.log(`| ${cols.map((c) => String(r[c])).join(' | ')} |`);
  console.log('\nTop ribbons:');
  for (const r of rows) console.log(`- ${r.policy}: ${r.topRibbons}`);
}

main();
