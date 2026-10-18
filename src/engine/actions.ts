import { scaleMoney } from './events/text';
import { Rng } from './rng';
import { buyAsset, repairAsset, sellAsset, toggleRentOut } from './systems/assets';
import { applyForJob, askForPromotion, askForRaise, quitJob, retire, rollListings, startHustle, stopHustle, workHarder } from './systems/careers';
import { commitCrime } from './systems/crime';
import { dropOut, enroll, skipClass, studyHarder } from './systems/education';
import { invest, payDebt, withdraw } from './systems/finance';
import { doActivity } from './systems/activities';
import { interact } from './systems/relationships';
import type { GameState, PlayerAction } from './types';
import { addMoney, addStats, bump, log, money, setResult } from './util';

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
    case 'sellAsset': s = sellAsset(s, action.assetId); break;
    case 'repairAsset': s = action.assetId.startsWith('rent:') ? toggleRentOut(s, action.assetId.slice(5)) : repairAsset(s, action.assetId); break;
    case 'invest': s = invest(s, action.kind, action.amount); break;
    case 'withdraw': s = withdraw(s, action.kind, action.amount); break;
    case 'payDebt': s = payDebt(s, action.amount); break;
    case 'crime': s = commitCrime(s, rng, action.id); break;
    case 'refreshListings': s = rollListings(s, rng); s = setResult(s, 'New job listings are in.', 'info'); break;
    case 'rewarded': s = rewardedBoost(s, rng, action.placement, action.option); break;
    default: break;
  }
  return { ...s, rng: rng.snapshot() };
}

function rewardedBoost(state: GameState, rng: Rng, placement: 'cashBoost' | 'statBoost' | 'secondChance' | 'reroll', option?: string): GameState {
  let s = bump(state, 'rewardedAdsUsed');
  if (placement === 'statBoost') {
    const stat = option === 'health' || option === 'smarts' || option === 'looks' ? option : 'happiness';
    const delta = stat === 'happiness' || stat === 'health' ? 30 : 16;
    s = addStats(s, { [stat]: delta });
    const kid = s.character.age < 13;
    const labels: Record<typeof stat, string> = kid
      ? { happiness: 'the best week of my whole childhood', health: 'a summer of running around outside until dark', smarts: 'a sudden obsession with library books', looks: 'a haircut that finally suited me' }
      : { happiness: 'a weekend that fixed everything', health: 'a health kick that actually stuck', smarts: 'a documentary binge that rewired my brain', looks: 'a glow-up' };
    s = log(s, `I had ${labels[stat]}.`, 'good');
    return setResult(s, `${stat[0]!.toUpperCase()}${stat.slice(1)} +${delta}.`, 'good', { statDeltas: { [stat]: delta } });
  }
  if (placement === 'cashBoost') {
    const salary = s.career.job?.salary ?? 0;
    const amount = Math.max(scaleMoney(s, s.character.age < 18 ? 150 : 800), Math.round(salary * 0.25), Math.round(Math.abs(s.finances.cash) * 0.05));
    s = addMoney(s, amount);
    s = log(s, s.character.age < 13 ? `A windfall! A relative slipped me ${money(s, amount)} for my piggy bank.` : `A windfall! I found ${money(s, amount)} I'd forgotten about.`, 'money');
    return setResult(s, `Windfall: +${money(s, amount)}.`, 'good', { moneyDelta: amount });
  }
  if (placement === 'reroll') {
    s = rollListings(s, rng);
    return setResult(s, 'A fresh batch of job listings arrived.', 'good');
  }
  return s;
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
