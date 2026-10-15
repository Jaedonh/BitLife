import { adPolicyConfig } from '@/config/monetization';

/**
 * Pure ad-cadence policy. Decides *whether* an ad may be shown; it never talks
 * to the SDK, so it is trivially unit-testable and the rules live in one place.
 */
export interface AdMeta {
  /** Total age-ups across all lives on this device. */
  totalAgeUps: number;
  /** Age-ups since the last interstitial. */
  ageUpsSinceInterstitial: number;
  /** Epoch ms of the last interstitial, or 0. */
  lastInterstitialAt: number;
  /** Epoch ms when the app was launched this session. */
  launchedAt: number;
  /** Rewarded uses today keyed by placement id. */
  rewardedToday: Record<string, number>;
  /** YYYY-MM-DD the rewardedToday counters belong to. */
  rewardedDay: string;
}

export function emptyAdMeta(now: number): AdMeta {
  return {
    totalAgeUps: 0,
    ageUpsSinceInterstitial: 0,
    lastInterstitialAt: 0,
    launchedAt: now,
    rewardedToday: {},
    rewardedDay: dayKey(now),
  };
}

export function dayKey(now: number): string {
  const d = new Date(now);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Call once per age-up, before deciding on an interstitial. */
export function recordAgeUp(meta: AdMeta): AdMeta {
  return {
    ...meta,
    totalAgeUps: meta.totalAgeUps + 1,
    ageUpsSinceInterstitial: meta.ageUpsSinceInterstitial + 1,
  };
}

export function shouldShowInterstitial(meta: AdMeta, now: number, isPremium: boolean): boolean {
  if (isPremium) return false;
  const c = adPolicyConfig;
  if (meta.totalAgeUps <= c.interstitialGraceAgeUps) return false;
  if (now - meta.launchedAt < c.interstitialLaunchGraceSeconds * 1000) return false;
  if (meta.ageUpsSinceInterstitial < c.interstitialEveryNAgeUps) return false;
  if (now - meta.lastInterstitialAt < c.interstitialCooldownSeconds * 1000) return false;
  return true;
}

export function recordInterstitialShown(meta: AdMeta, now: number): AdMeta {
  return { ...meta, ageUpsSinceInterstitial: 0, lastInterstitialAt: now };
}

function rolledMeta(meta: AdMeta, now: number): AdMeta {
  const today = dayKey(now);
  if (meta.rewardedDay === today) return meta;
  return { ...meta, rewardedDay: today, rewardedToday: {} };
}

export function rewardedUsesLeft(meta: AdMeta, placement: string, now: number): number {
  const m = rolledMeta(meta, now);
  const cap = adPolicyConfig.rewardedDailyCaps[placement] ?? 0;
  return Math.max(0, cap - (m.rewardedToday[placement] ?? 0));
}

export function canShowRewarded(meta: AdMeta, placement: string, now: number): boolean {
  return rewardedUsesLeft(meta, placement, now) > 0;
}

export function recordRewardedUsed(meta: AdMeta, placement: string, now: number): AdMeta {
  const m = rolledMeta(meta, now);
  return {
    ...m,
    rewardedToday: { ...m.rewardedToday, [placement]: (m.rewardedToday[placement] ?? 0) + 1 },
  };
}
