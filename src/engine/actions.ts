import { settleHomeWithParents } from './events/conditions';
import { personRef, scaleMoney } from './events/text';
import { Rng } from './rng';
import { buyAsset, repairAsset, sellAsset, toggleRentOut } from './systems/assets';
import { applyForJob, askForPromotion, askForRaise, dropCarlessHustle, listingsBlocker, quitJob, retire, rollListings, startHustle, stopHustle, workHarder } from './systems/careers';
import { commitCrime } from './systems/crime';
import { dropOut, enroll, skipClass, studyHarder } from './systems/education';
import { invest, payDebt, withdraw } from './systems/finance';
import { doActivity } from './systems/activities';
import { settleCoworkers } from './systems/coworkers';
import { interact } from './systems/relationships';
import type { GameState, LastResult, PlayerAction, Stats } from './types';
import { addMoney, addStats, bump, capitalize, log, money, setResult } from './util';

/** Applies a between-age-ups player action. Pure; RNG state is persisted. */
export function applyAction(state: GameState, action: PlayerAction): GameState {
  if (action.type === 'rewarded' && action.placement === 'secondChance') return secondChance(state);
  if (!state.alive) return state;
  const rng = new Rng(state.rng);
  let s: GameState = { ...state, lastResult: null };
  switch (action.type) {
    case 'activity': s = doActivity(s, rng, action.id); break;
    case 'study': s = studyHarder(s); break;
    case 'skipClass': s = skipClass(s, rng); break;
    case 'dropOut': s = dropOut(s); break;
    case 'enroll': s = enroll(s, rng, action.major); break;
    case 'applyJob': s = applyForJob(s, rng, action.listingId); break;
    case 'quitJob': s = quitJob(s); break;
    case 'workHarder': s = workHarder(s); break;
    case 'askRaise': s = askForRaise(s, rng); break;
    case 'askPromotion': s = askForPromotion(s, rng); break;
    case 'retire': s = retire(s); break;
    case 'startHustle': s = startHustle(s, action.defId); break;
    case 'stopHustle': s = stopHustle(s); break;
    case 'interact': s = interact(s, rng, action.personId, action.interaction); break;
    case 'buyAsset': s = buyAsset(s, rng, action.defId, action.financing); break;
    case 'sellAsset': s = dropCarlessHustle(sellAsset(s, action.assetId)); break;
    case 'repairAsset': s = action.assetId.startsWith('rent:') ? toggleRentOut(s, action.assetId.slice(5)) : repairAsset(s, action.assetId); break;
    case 'invest': s = invest(s, action.kind, action.amount); break;
    case 'withdraw': s = withdraw(s, action.kind, action.amount); break;
    case 'payDebt': s = payDebt(s, action.amount); break;
    case 'crime': s = commitCrime(s, rng, action.id); break;
    case 'refreshListings': {
      const blocked = listingsBlocker(s);
      s = blocked ? setResult(s, blocked, 'info') : setResult(rollListings(s, rng), 'New job listings are in.', 'info');
      break;
    }
    case 'rewarded': s = rewardedBoost(s, rng, action.placement, action.option); break;
    default: break;
  }
  // Quitting, retiring, switching jobs or a crime that ends in prison parts the player from the old job's coworkers;
  // buying a home, a wedding or a prison sentence ends living back home with my parents now, not at the next birthday.
  s = settleHomeWithParents(settleCoworkers(s));
  // The toast reports what actually changed: caps and hidden potential can swallow some or all of a nominal gain.
  if (s.lastResult) s = { ...s, lastResult: withAppliedStatDeltas(s.lastResult, state.character.stats, s.character.stats) };
  return { ...s, rng: rng.snapshot() };
}

function withAppliedStatDeltas(result: LastResult, before: Stats, after: Stats): LastResult {
  const applied: Partial<Stats> = {};
  for (const k of STAT_KEYS) if (after[k] !== before[k]) applied[k] = after[k] - before[k];
  const out: LastResult = { ...result, statDeltas: applied };
  if (!Object.keys(applied).length) delete out.statDeltas;
  return out;
}

const STAT_KEYS = ['happiness', 'health', 'smarts', 'looks'] as const;

/** Nominal size of the rewarded stat boost for each stat. */
export const STAT_BOOST: Readonly<Record<keyof Stats, number>> = { happiness: 30, health: 30, smarts: 16, looks: 16 };

function boostStat(option: string | undefined): keyof Stats {
  return option === 'health' || option === 'smarts' || option === 'looks' ? option : 'happiness';
}

/** How much the rewarded stat boost would really add to this stat now: 0 when it is already at its cap or natural limit. */
export function statBoostGain(state: GameState, stat: keyof Stats): number {
  return addStats(state, { [stat]: STAT_BOOST[stat] }).character.stats[stat] - state.character.stats[stat];
}

const BOOST_MAXED: Record<keyof Stats, string> = {
  happiness: "I'm already as happy as I can be.",
  health: 'My health is already as good as it gets.',
  smarts: "I'm already as smart as I can get.",
  looks: 'My looks are already as good as they get.',
};

/**
 * Why the rewarded stat boost cannot pay out (null when it can). With a stat, that stat must still be able
 * to grow; without one, at least one stat must.
 */
export function statBoostBlocker(state: GameState, option?: string): string | null {
  // With no option the boost goes to happiness (boostStat), so that is what is checked.
  const stat = boostStat(option);
  return statBoostGain(state, stat) > 0 ? null : BOOST_MAXED[stat];
}

function rewardedBoost(state: GameState, rng: Rng, placement: 'cashBoost' | 'statBoost' | 'secondChance' | 'reroll', option?: string): GameState {
  // A refused reward is not spent: the reroll and the stat boost are checked before the ad counts.
  const blocked = placement === 'reroll' ? listingsBlocker(state) : placement === 'statBoost' ? statBoostBlocker(state, option) : null;
  if (blocked) return setResult(state, blocked, 'info');
  let s = bump(state, 'rewardedAdsUsed');
  if (placement === 'statBoost') {
    const stat = boostStat(option);
    const gain = statBoostGain(s, stat);
    s = addStats(s, { [stat]: STAT_BOOST[stat] });
    const kid = s.character.age < 13;
    const labels: Record<typeof stat, string> = kid
      ? { happiness: 'the best week of my whole childhood', health: 'a summer of running around outside until dark', smarts: 'a sudden obsession with library books', looks: 'a haircut that finally suited me' }
      : { happiness: 'a weekend that fixed everything', health: 'a health kick that actually stuck', smarts: 'a documentary binge that rewired my brain', looks: 'a glow-up' };
    s = log(s, `I had ${labels[stat]}.`, 'good');
    const capped = gain < STAT_BOOST[stat] ? " That's as high as it goes." : '';
    return setResult(s, `${capitalize(stat)} +${gain}.${capped}`, 'good', { statDeltas: { [stat]: gain } });
  }
  if (placement === 'cashBoost') {
    const salary = s.career.job?.salary ?? 0;
    const amount = Math.max(scaleMoney(s, s.character.age < 18 ? 150 : 800), Math.round(salary * 0.25), Math.round(Math.abs(s.finances.cash) * 0.05));
    s = addMoney(s, amount);
    s = log(s, windfallLine(s, money(s, amount)), 'money');
    return setResult(s, `Windfall: +${money(s, amount)}.`, 'good', { moneyDelta: amount });
  }
  if (placement === 'reroll') {
    s = rollListings(s, rng);
    return setResult(s, 'A fresh batch of job listings arrived.', 'good');
  }
  return s;
}

/**
 * The Windfall's journal line. A child's comes from family who would slip them money: a grandparent by name (sent
 * from far away), else "a relative" when they have family; a child with no family at all (an orphan in foster care)
 * finds it instead.
 */
function windfallLine(state: GameState, amount: string): string {
  if (state.character.age >= 13) return `A windfall! I found ${amount} I'd forgotten about.`;
  const living = Object.values(state.people).filter((p) => p.alive);
  const grand = living.filter((p) => p.kind === 'grandparent').sort((a, b) => b.relationship - a.relationship || a.id.localeCompare(b.id))[0];
  if (grand) return `A windfall! ${personRef(grand)} ${grand.farAway ? 'sent' : 'slipped'} me ${amount} for my piggy bank.`;
  const family = living.some((p) => p.kind === 'mother' || p.kind === 'father' || p.relative || ((p.kind === 'stepmother' || p.kind === 'stepfather' || p.kind === 'sibling') && !p.foster));
  return family ? `A windfall! A relative slipped me ${amount} for my piggy bank.` : `A windfall! I found ${amount} tucked in an old coat pocket. Straight into the piggy bank.`;
}

/** Revive once per life after death (rewarded ad or premium). */
export function secondChance(state: GameState): GameState {
  if (state.alive || !state.death || state.flags.revived === true) return state;
  const cutoff = state.log.findIndex((l, i) => l.kind === 'death' && i >= state.log.length - 2);
  let s: GameState = {
    ...state,
    alive: true,
    death: null,
    flags: { ...state.flags, revived: true },
    log: cutoff >= 0 ? state.log.slice(0, cutoff) : state.log,
    health: { ...state.health, criticalYears: 0, illnesses: state.health.illnesses.filter((i) => i.severity < 4) },
  };
  s = addStats(s, { health: Math.max(0, 45 - s.character.stats.health) });
  s = bump(s, 'rewardedAdsUsed');
  s = log(s, 'I was clinically dead for four minutes. Then I wasn\'t. The doctors are still arguing about it.', 'milestone');
  return setResult(s, 'Second chance granted.', 'good');
}
