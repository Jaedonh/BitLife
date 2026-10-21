/**
 * Builds the saves that the store screenshots load (scripts/store-screenshots.mjs). A showcase life is played with
 * the real engine, the way an engaged player would play it (study, work hard, date, keep up the house, invest), and
 * snapshots are taken at the moments the screenshots need:
 *
 *   teen      a teenager's journal with a full, light year and good stats
 *   event     an event card with three choices open (from a different year than the journal shot)
 *   court     the court card (plead guilty, public defender, a lawyer or yourself), on a branch of the same life
 *   adult     mid-life: a career, a spouse and a child, both parents, friends, a house, a car and investments
 *   death     the tombstone, with a ribbon, an obituary and a child to continue as
 *   fresh     no life in progress (the new-life scenario picker), with the finished life's achievements
 *
 * Each snapshot is the browser storage the web app reads (AsyncStorage keys on web are plain localStorage keys):
 * the save, the year ledger for the journal's year cards, settings (tutorial tip dismissed), premium off (the free
 * game; the web build has no ads SDK, so no banner or ad buttons are drawn), achievements unlocked along the way and
 * a graveyard with the finished life.
 *
 *   npx tsx scripts/store-saves.ts                          # write store/screenshots/saves/*.json
 *   npx tsx scripts/store-saves.ts --scan 1500 --by young   # rank seeds for the journal and card shots
 *   npx tsx scripts/store-saves.ts --scan 1500 --by old     # rank seeds for the mid-life and tombstone shots
 *   npx tsx scripts/store-saves.ts --seed 123 --show        # print the snapshots of one seed
 *   npx tsx scripts/store-saves.ts --cards 80               # list the three-choice cards seen in 80 lives
 *
 * Deterministic: the same seeds and the same game content give byte-identical saves.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { applyAction } from '../src/engine/actions';
import { ageUp } from '../src/engine/ageUp';
import { beginLife, resolveChoice } from '../src/engine/events/select';
import { EVENT_REGISTRY } from '../src/engine/events/registry';
import { Rng } from '../src/engine/rng';
import { TRIAL_EVENT_ID } from '../src/engine/systems/justice';
import { achievementContext, newAchievements, type PastLife } from '../src/engine/systems/achievements';
import { enrollOptions } from '../src/engine/systems/education';
import { createLife } from '../src/engine/systems/character';
import type { GameState, PlayerAction, Stats } from '../src/engine/types';
import { netWorth } from '../src/engine/util';

/**
 * The showcase life. The journal and card shots come from one seed and the mid-life and tombstone shots from
 * another (same name, so the set reads as one person's life). After a content update, re-run
 * `--scan 1500 --by young` and `--scan 1500 --by old`, look at the winners with `--seed N --show`, and pick again.
 */
export const SHOWCASE = {
  youngSeed: 1156,
  oldSeed: 363,
  firstName: 'Maya',
  lastName: 'Brooks',
  gender: 'female' as const,
  countryCode: 'US',
  major: 'computer_science',
};
const SCAN_DEFAULT = 300;
/** Themes kept out of the journal and card shots (fine in the game, not as the first thing a store visitor reads). */
const DARK = /\b(died|dies|funeral|police|arrest\w*|drunk|beer|vodka|weed|drugs?|fake id|steal\w*|hospital|punch\w*|fight\w*|sick|poison\w*|cop|cops|without paying|shoplift\w*|rumou?r)\b/i;
/** Event cards that read well as the store's "every year asks a question" shot, best first (see --cards). */
const PREFERRED_CARDS = ['sl_cafeteria_politics', 'lf_love_note', 'nc_street_cleanup'];

/** Fixed clock so saves do not change from run to run (achievements show it as the unlock date). 2026-10-18 18:00 UTC. */
const NOW = Date.UTC(2026, 9, 18, 18);
const KEYS = {
  save: 'lifeloop.save.v1',
  settings: 'lifeloop.settings.v1',
  graveyard: 'lifeloop.graveyard.v1',
  premium: 'lifeloop.premium.v1',
  achievements: 'lifeloop.achievements.v1',
  ledger: 'lifeloop.ledger.v1',
} as const;

type Ledger = Record<number, { stats: Stats; worth: number }>;
type Unlocks = Record<string, { unlockedAt: number; lifeName: string; age: number }>;

interface Snapshot {
  state: GameState;
  ledger: Ledger;
  unlocks: Unlocks;
}

interface Played {
  seed: number;
  teen?: Snapshot;
  event?: Snapshot;
  adult?: Snapshot;
  death?: Snapshot;
  score: number;
  /** The journal and card shots alone, and the mid-life and tombstone shots alone (--scan young|old). */
  young: number;
  old: number;
  notes: string[];
  /** The life at 22, where the court shot branches off (courtSnapshot). */
  young22?: Snapshot;
  /** Every three-choice card seen from 13 to 30: id, age and title (for --cards). */
  cards: { id: string; age: number; title: string; text: string; choices: string }[];
}

const mark = (s: GameState) => ({ stats: { ...s.character.stats }, worth: netWorth(s) });
const alivePeople = (s: GameState) => Object.values(s.people).filter((p) => p.alive);
const ofKind = (s: GameState, ...kinds: string[]) => alivePeople(s).filter((p) => kinds.includes(p.kind));

/** What an engaged, kind, hard-working player does in a year (before Age+). */
function showcaseActions(s: GameState, rng: Rng): PlayerAction[] {
  const a: PlayerAction[] = [];
  const age = s.character.age;
  const st = s.character.stats;
  if (s.health.illnesses.length) a.push({ type: 'activity', id: 'doctor' });
  if (s.education.enrolled) a.push({ type: 'study' });
  if (age >= 6 && age < 60 && st.smarts < 95) a.push({ type: 'activity', id: 'library' });
  if (age >= 12 && st.health < 92) a.push({ type: 'activity', id: 'gym' });
  if (age >= 8 && age < 12) a.push({ type: 'activity', id: 'jog' });
  if (age >= 10 && st.happiness < 80) a.push({ type: 'activity', id: 'meditate' });
  if (age >= 12 && age < 18 && rng.chance(0.5)) a.push({ type: 'activity', id: 'volunteer' });
  if (age >= 18 && st.happiness < 85 && s.finances.cash > 20000) a.push({ type: 'activity', id: 'vacation' });
  // Keep the people in this life close.
  for (const p of ofKind(s, 'mother', 'father', 'stepmother', 'stepfather', 'grandparent')) if (rng.chance(0.5)) a.push({ type: 'interact', personId: p.id, interaction: 'spendTime' });
  for (const p of ofKind(s, 'bestFriend', 'friend', 'sibling')) if (rng.chance(0.45)) a.push({ type: 'interact', personId: p.id, interaction: 'spendTime' });
  for (const p of ofKind(s, 'child', 'grandchild')) if (rng.chance(0.6)) a.push({ type: 'interact', personId: p.id, interaction: 'spendTime' });
  const lover = ofKind(s, 'lover')[0];
  const spouse = ofKind(s, 'spouse')[0];
  if (lover) {
    a.push({ type: 'interact', personId: lover.id, interaction: 'date' });
    if (age >= 23 && age <= 36 && (lover.love ?? 0) > 55) a.push({ type: 'interact', personId: lover.id, interaction: 'propose' });
  }
  if (spouse) {
    a.push({ type: 'interact', personId: spouse.id, interaction: 'date' });
    if (age >= 26 && age <= 38 && ofKind(s, 'child').length < 3) a.push({ type: 'interact', personId: spouse.id, interaction: 'haveChild' });
  }
  // School and work.
  const degrees = s.education.degrees;
  if (age >= 18 && !s.education.enrolled && degrees.includes('high_school') && !degrees.some((d) => d.startsWith('bachelor'))) {
    const opt = enrollOptions(s).find((o) => o.id === SHOWCASE.major && o.eligible) ?? enrollOptions(s).find((o) => o.eligible && ['engineering', 'business', 'nursing'].includes(o.id));
    if (opt) a.push({ type: 'enroll', major: opt.id });
  }
  const graduated = degrees.some((d) => d.startsWith('bachelor'));
  if (!s.education.enrolled && age >= 18 && age < 60 && (graduated || age >= 23) && (!s.career.job || s.career.job.partTime)) {
    const best = [...s.career.listings].filter((l) => !l.partTime).sort((x, y) => y.salary - x.salary).slice(0, 4);
    for (const l of best) a.push({ type: 'applyJob', listingId: l.id });
  }
  if (s.career.job && !s.career.retired) {
    a.push({ type: 'workHarder' });
    if (s.career.job.performance >= 72 && s.career.job.yearsAtLevel >= 2) a.push({ type: 'askPromotion' });
    else if (s.career.job.performance >= 65 && rng.chance(0.4)) a.push({ type: 'askRaise' });
    if (age >= 66) a.push({ type: 'retire' });
  }
  // Money: a car (kept up and replaced when worn out), a family home, then investing what is left over.
  const cars = s.assets.filter((x) => x.kind === 'car');
  const home = s.assets.find((x) => x.kind === 'house');
  for (const x of s.assets) if (x.kind !== 'item' && x.condition < 90 && s.finances.cash > 20000) a.push({ type: 'repairAsset', assetId: x.id });
  const oldCar = cars.find((x) => x.value < x.purchasePrice * 0.25);
  if (oldCar && s.finances.cash > 80000) {
    a.push({ type: 'sellAsset', assetId: oldCar.id });
    a.push({ type: 'buyAsset', defId: s.year >= 2012 ? 'ev' : 'sedan', financing: 'cash' });
  }
  if (age >= 24 && !cars.length && s.finances.cash > 40000) a.push({ type: 'buyAsset', defId: s.year >= 2012 ? 'ev' : 'sedan', financing: 'cash' });
  if (age >= 27 && !home && s.career.job && s.finances.cash > 140000) a.push({ type: 'buyAsset', defId: 'suburban', financing: 'mortgage' });
  else if (age >= 27 && !home && s.career.job && s.finances.cash > 90000) a.push({ type: 'buyAsset', defId: 'townhouse', financing: 'mortgage' });
  if (age >= 25 && age <= 60 && s.finances.cash > 30000 && (home || age >= 34)) {
    a.push({ type: 'invest', kind: 'index', amount: Math.round(s.finances.cash * 0.15) });
    a.push({ type: 'invest', kind: 'savings', amount: Math.round(s.finances.cash * 0.05) });
  }
  if (s.finances.debt > 0 && s.finances.cash > s.finances.debt) a.push({ type: 'payDebt', amount: s.finances.debt });
  return a;
}

/** Answers every open card (but the one to keep open, if any). A kind, careful player: never the first choice blindly, but a seeded pick. */
function settle(s: GameState, rng: Rng, keep?: string): GameState {
  let g = s;
  for (let i = 0; i < 12 && g.pendingEvent && g.pendingEvent.eventId !== keep; i++) {
    const choices = g.pendingEvent.choices;
    g = resolveChoice(g, rng.pick(choices).id, EVENT_REGISTRY);
  }
  return g;
}

function unlock(s: GameState, unlocks: Unlocks, past: PastLife[], at: number): Unlocks {
  const fresh = newAchievements(s, achievementContext(past, s), unlocks);
  if (!fresh.length) return unlocks;
  const out = { ...unlocks };
  for (const d of fresh) out[d.id] = { unlockedAt: at, lifeName: `${s.character.firstName} ${s.character.lastName}`, age: s.character.age };
  return out;
}

const yearLines = (s: GameState, age: number) => s.log.filter((e) => e.age === age && e.kind !== 'year');

/** Plays the showcase life for one seed and keeps the best snapshot for each screen. */
export function play(seed: number): Played {
  const rng = new Rng(seed ^ 0x5eed);
  const born = createLife({ firstName: SHOWCASE.firstName, lastName: SHOWCASE.lastName, gender: SHOWCASE.gender, countryCode: SHOWCASE.countryCode }, seed, NOW);
  let s = beginLife(born, EVENT_REGISTRY);
  let ledger: Ledger = { 0: mark(s) };
  let unlocks: Unlocks = {};
  const past: PastLife[] = [];
  const out: Played = { seed, score: 0, young: 0, old: 0, notes: [], cards: [] };
  let clock = NOW;
  s = settle(s, rng);
  const teens: { age: number; sc: number; snap: Snapshot }[] = [];
  const cards: { age: number; sc: number; snap: Snapshot }[] = [];
  let adultScore = -1;
  while (s.alive && s.character.age < 120) {
    for (const act of showcaseActions(s, rng)) {
      if (!s.alive) break;
      // One application at a time: once hired, the other listings are left alone.
      if (act.type === 'applyJob' && s.career.job && !s.career.job.partTime) continue;
      s = applyAction(s, act);
      s = settle(s, rng);
    }
    s = { ...s, lastResult: null };
    unlocks = unlock(s, unlocks, past, clock);
    if (!s.alive) break;
    const before = s;
    clock += 1000;
    s = ageUp(s);
    s = { ...s, updatedAt: clock };
    ledger = { ...ledger, [s.character.age]: mark(before) };
    const age = s.character.age;
    // (b) An event card with three choices, open on screen, for a teen or a young adult.
    if (s.pendingEvent && s.pendingEvent.choices.length === 3 && age >= 13 && age <= 30) {
      const p = s.pendingEvent;
      out.cards.push({ id: p.eventId, age, title: p.title, text: p.text, choices: p.choices.map((c) => c.label).join(' | ') });
      // Prefer a light, relatable card; any other three-choice card with no dark theme is a fallback.
      const preferred = PREFERRED_CARDS.indexOf(p.eventId);
      const dark = DARK.test(p.text);
      const sc = preferred >= 0 ? 100 - preferred * 10 : dark ? -50 : p.choices.every((c) => c.label.length <= 34) && p.text.length <= 240 ? 20 : 0;
      cards.push({ age, sc, snap: { state: { ...s, lastResult: null }, ledger, unlocks } });
    }
    s = settle(s, rng);
    s = { ...s, lastResult: null };
    unlocks = unlock(s, unlocks, past, clock);
    if (!s.alive) break;
    // (a) A teenager's journal: judged at the start of the next year, with the year's cards answered.
    if (age >= 14 && age <= 17) {
      const lines = yearLines(s, age);
      const kinds = new Set(lines.map((l) => l.kind));
      const st = s.character.stats;
      const minStat = Math.min(st.happiness, st.health, st.smarts, st.looks);
      // The two years below are in view too on a tablet.
      const sad = (ls: GameState['log']) => ls.some((l) => l.kind === 'death' || l.kind === 'bad' || DARK.test(l.text));
      const sc = Math.min(lines.length, 6) * 8 + kinds.size * 6 + Math.max(0, minStat - 40) - (sad(lines) ? 60 : 0) - (sad(yearLines(s, age - 1)) ? 40 : 0) - (sad(yearLines(s, age - 2)) ? 25 : 0) - (s.crime.record.length ? 80 : 0) - (s.finances.cash > 20000 ? 40 : 0);
      teens.push({ age, sc, snap: { state: s, ledger, unlocks } });
    }
    if (age === 22) out.young22 = { state: s, ledger, unlocks };
    // (c, d, e) Mid-life: a career, a family, a home.
    if (age >= 36 && age <= 48) {
      const spouse = ofKind(s, 'spouse').length;
      const kids = ofKind(s, 'child').length;
      const parents = ofKind(s, 'mother', 'father').length;
      const friends = ofKind(s, 'friend', 'bestFriend').length;
      const house = s.assets.some((x) => x.kind === 'house');
      const car = s.assets.some((x) => x.kind === 'car');
      const inv = s.finances.investments.filter((i) => i.amount > 0).length;
      const job = s.career.job && !s.career.job.partTime ? 1 + Math.min(s.career.job.level, 3) * 0.3 + (s.career.job.yearsHeld >= 3 ? 0.3 : 0) : 0;
      const kidAges = ofKind(s, 'child').reduce((n, k) => n + Math.min(k.age, 12), 0);
      const cold = alivePeople(s).filter((p) => ['mother', 'father', 'spouse', 'child', 'friend', 'bestFriend'].includes(p.kind) && p.relationship < 45).length;
      const worn = s.assets.filter((x) => x.condition < 60 || x.value < x.purchasePrice * 0.25).length;
      const sc = -cold * 8 - worn * 20 + spouse * 30 + Math.min(kids, 3) * 12 + Math.min(kidAges, 20) + parents * 8 + Math.min(friends, 3) * 6 + (house ? 25 : 0) + (car ? 10 : 0) + (inv ? inv * 8 : -40) + job * 30 - (s.crime.record.length ? 100 : 0) - (s.crime.inPrison ? 200 : 0);
      if (sc > adultScore) {
        adultScore = sc;
        // The year's wear came with the birthday: the home and the car are fixed up first, as this player does
        // every year (it also keeps the Repair buttons off the Assets shot).
        let fixed = s;
        for (const x of s.assets) if (x.kind !== 'item' && x.condition < 90) fixed = applyAction(fixed, { type: 'repairAsset', assetId: x.id });
        out.adult = { state: { ...fixed, lastResult: null }, ledger, unlocks };
      }
    }
  }
  // The journal shot and the card shot come from different years, so the card is not already answered in the journal.
  let teenScore = -1e6;
  let eventScore = -1e6;
  for (const t of teens) {
    for (const c of cards) {
      if (Math.abs(t.age - c.age) < 2 || t.sc + c.sc <= teenScore + eventScore) continue;
      [teenScore, eventScore, out.teen, out.event] = [t.sc, c.sc, t.snap, c.snap];
    }
  }
  if (!s.alive && s.death) {
    const d = s.death;
    const good = ['family_first', 'successful', 'rich', 'academic', 'happy', 'loyal', 'tycoon', 'centenarian', 'fit', 'bookworm', 'generous'];
    const heirs = alivePeople(s).filter((p) => p.kind === 'child').length;
    // One heir keeps the tombstone, the heir card and the obituary close enough to share one frame.
    const deathScore = (good.includes(d.ribbonId) ? 40 : -40) + (s.character.age >= 76 && s.character.age <= 98 ? 30 : -30) + (heirs === 1 ? 25 : heirs ? 10 : -40) + (d.obituary.length < 300 ? 10 : 0) - (/\bads?\b/i.test(d.epitaph) ? 50 : 0);
    out.death = { state: s, ledger, unlocks };
    out.score = teenScore + eventScore + adultScore + deathScore;
    out.young = teenScore + eventScore;
    out.old = adultScore + deathScore;
    out.notes.push(`death ${s.character.age} ${d.ribbonId} ${d.cause} heirs=${heirs} obit=${d.obituary.length}`);
  } else {
    out.score = out.old = -1e9;
    out.young = teenScore + eventScore;
  }
  out.notes.unshift(`teen=${teenScore} event=${eventScore} adult=${adultScore}`);
  return out;
}

/**
 * The court card: the life at 22 takes a wrong turn (a break-in, then a stolen car) until an arrest opens the court
 * card, exactly as the Crime menu would. It is a branch: nothing else in the saves comes from it.
 */
function courtSnapshot(base: Snapshot): Snapshot {
  const rng = new Rng(base.state.seed ^ 0xc0de);
  let s: GameState = base.state;
  let ledger = base.ledger;
  for (let tries = 0; tries < 60 && s.alive; tries++) {
    for (const id of ['burglary', 'car_theft']) {
      if (s.pendingEvent?.eventId === TRIAL_EVENT_ID) break;
      s = settle(applyAction(s, { type: 'crime', id }), rng, TRIAL_EVENT_ID);
    }
    if (s.pendingEvent?.eventId === TRIAL_EVENT_ID) return { state: { ...s, lastResult: null }, ledger, unlocks: base.unlocks };
    if (s.crime.inPrison) break;
    const before = s;
    s = settle(ageUp(s), rng, TRIAL_EVENT_ID);
    ledger = { ...ledger, [s.character.age]: mark(before) };
  }
  throw new Error(`seed ${base.state.seed}: no court card from the life at 22`);
}

function storage(snap: Snapshot | null, graveyard: unknown[], unlocks: Unlocks): Record<string, string> {
  const items: Record<string, string> = {
    [KEYS.settings]: JSON.stringify({ haptics: true, showKarma: false, tutorialDone: true }),
    // The free game, as most players see it. The web build has no ads SDK, so no banner or rewarded-ad
    // buttons are drawn, and premium-only options show their lock.
    [KEYS.premium]: JSON.stringify({ premium: false }),
    [KEYS.graveyard]: JSON.stringify(graveyard),
    [KEYS.achievements]: JSON.stringify(unlocks),
  };
  if (snap) {
    items[KEYS.save] = JSON.stringify({ ...snap.state, lastResult: null });
    items[KEYS.ledger] = JSON.stringify({ lifeId: snap.state.character.id, marks: snap.ledger });
  }
  return items;
}

function graveOf(s: GameState) {
  const d = s.death!;
  return {
    id: s.character.id,
    name: `${s.character.firstName} ${s.character.lastName}`,
    birthYear: s.character.birthYear,
    deathYear: s.year,
    age: s.character.age,
    cause: d.cause,
    ribbonId: d.ribbonId,
    netWorth: d.netWorth,
    countryCode: s.character.countryCode,
    generation: s.generation,
    obituary: d.obituary,
    epitaph: d.epitaph,
    diedAt: s.updatedAt,
  };
}

function describe(p: Played) {
  const show = (label: string, snap?: Snapshot) => {
    if (!snap) return console.log(`${label}: none`);
    const s = snap.state;
    const st = s.character.stats;
    console.log(`\n== ${label}: age ${s.character.age} (${s.year}) H${st.happiness} He${st.health} S${st.smarts} L${st.looks} cash ${s.finances.cash} job ${s.career.job?.title ?? '-'} @ ${s.career.job?.company ?? '-'}`);
    const recent = s.log.filter((e) => e.age >= s.character.age - 1 && e.kind !== 'year');
    for (const e of recent) console.log(`  [${e.age} ${e.kind}] ${e.text}`);
    if (s.pendingEvent) console.log(`  CARD ${s.pendingEvent.eventId}: ${s.pendingEvent.title} | ${s.pendingEvent.text}\n    -> ${s.pendingEvent.choices.map((c) => c.label + (c.hint ? ` (${c.hint})` : '')).join(' | ')}`);
    console.log(`  people: ${alivePeople(s).map((x) => `${x.kind}:${x.firstName}(${x.age})`).join(', ')}`);
    console.log(`  assets: ${s.assets.map((x) => x.name).join(', ')} | investments: ${s.finances.investments.map((i) => `${i.kind}:${i.amount}`).join(', ')} | worth ${netWorth(s)}`);
    if (s.death) console.log(`  DEATH ${s.death.cause} ribbon=${s.death.ribbonId}\n  OBIT ${s.death.obituary}\n  EPITAPH ${s.death.epitaph}`);
  };
  console.log(`seed ${p.seed} score ${p.score} ${p.notes.join(' | ')}`);
  show('teen', p.teen);
  show('event', p.event);
  show('adult', p.adult);
  show('death', p.death);
}

function main() {
  const args = process.argv.slice(2);
  const arg = (name: string) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : undefined;
  };
  if (args.includes('--cards')) {
    const n = Number(arg('--cards') ?? 40);
    const seen = new Map<string, Played['cards'][number] & { seeds: number[] }>();
    for (let seed = 1; seed <= n; seed++) {
      for (const c of play(seed).cards) {
        const known = seen.get(c.id);
        if (known) known.seeds.push(seed);
        else seen.set(c.id, { ...c, seeds: [seed] });
      }
    }
    for (const c of seen.values()) console.log(`${c.id} [age ${c.age}, seeds ${c.seeds.slice(0, 5).join(',')}] ${c.title} :: ${c.text} -> ${c.choices}`);
    return;
  }
  if (args.includes('--scan')) {
    const n = Number(arg('--scan') ?? SCAN_DEFAULT);
    const by = (arg('--by') ?? 'score') as 'score' | 'young' | 'old';
    const ranked = Array.from({ length: n }, (_, i) => play(i + 1)).sort((a, b) => b[by] - a[by]).slice(0, 10);
    for (const p of ranked) console.log(`seed ${p.seed}\t${by} ${p[by]}\t${p.notes.join(' | ')}`);
    return;
  }
  const seedArg = Number(arg('--seed') ?? 0);
  if (args.includes('--show')) {
    describe(play(seedArg || SHOWCASE.youngSeed));
    return;
  }
  const young = play(seedArg || SHOWCASE.youngSeed);
  const old = play(seedArg || SHOWCASE.oldSeed);
  if (!young.teen || !young.event || !young.young22) throw new Error(`seed ${young.seed} has no journal or card shot: ${young.notes.join(' | ')}`);
  if (!old.adult || !old.death) throw new Error(`seed ${old.seed} has no mid-life or tombstone shot: ${old.notes.join(' | ')}`);
  const out = path.resolve(arg('--out') ?? 'store/screenshots/saves');
  mkdirSync(out, { recursive: true });
  // The finished life is in the graveyard (its ribbon reads as new on the tombstone) and its achievements are unlocked.
  const graveyard = [graveOf(old.death.state)];
  const files: Record<string, Record<string, string>> = {
    teen: storage(young.teen, [], young.teen.unlocks),
    event: storage(young.event, [], young.event.unlocks),
    court: storage(courtSnapshot(young.young22), [], young.young22.unlocks),
    adult: storage(old.adult, [], old.adult.unlocks),
    death: storage(old.death, graveyard, old.death.unlocks),
    fresh: storage(null, graveyard, old.death.unlocks),
  };
  const seeds = { teen: young.seed, event: young.seed, court: young.seed, adult: old.seed, death: old.seed, fresh: old.seed };
  for (const [name, items] of Object.entries(files)) writeFileSync(path.join(out, `${name}.json`), JSON.stringify({ seed: seeds[name as keyof typeof seeds], localStorage: items }) + '\n');
  console.log(`seeds ${young.seed} (journal, card) and ${old.seed} (mid-life, tombstone): wrote ${Object.keys(files).length} saves to ${path.relative(process.cwd(), out)}`);
}

main();
