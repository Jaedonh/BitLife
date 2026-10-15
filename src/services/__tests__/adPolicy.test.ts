import { adPolicyConfig } from '@/config/monetization';
import {
  canShowRewarded,
  emptyAdMeta,
  recordAgeUp,
  recordInterstitialShown,
  recordRewardedUsed,
  rewardedUsesLeft,
  shouldShowInterstitial,
} from '../ads/policy';

const T0 = Date.UTC(2026, 0, 1, 12, 0, 0);
const sec = (n: number) => n * 1000;

function ageUps(meta: ReturnType<typeof emptyAdMeta>, n: number) {
  let m = meta;
  for (let i = 0; i < n; i++) m = recordAgeUp(m);
  return m;
}

describe('interstitial policy', () => {
  it('never shows for premium users', () => {
    const m = ageUps(emptyAdMeta(T0), 100);
    expect(shouldShowInterstitial(m, T0 + sec(10_000), true)).toBe(false);
  });

  it('respects the first-session grace and launch grace', () => {
    const grace = adPolicyConfig.interstitialGraceAgeUps;
    const launchGrace = adPolicyConfig.interstitialLaunchGraceSeconds;
    const m = ageUps(emptyAdMeta(T0), grace);
    expect(shouldShowInterstitial(m, T0 + sec(launchGrace + 1), false)).toBe(false);
    const m2 = ageUps(m, 1);
    expect(shouldShowInterstitial(m2, T0 + sec(launchGrace - 1), false)).toBe(false);
    expect(shouldShowInterstitial(m2, T0 + sec(launchGrace + 1), false)).toBe(true);
  });

  it('enforces the every-N-age-ups rule and cooldown', () => {
    const launchGrace = adPolicyConfig.interstitialLaunchGraceSeconds;
    let m = ageUps(emptyAdMeta(T0), adPolicyConfig.interstitialGraceAgeUps + 1);
    const t1 = T0 + sec(launchGrace + 1);
    expect(shouldShowInterstitial(m, t1, false)).toBe(true);
    m = recordInterstitialShown(m, t1);
    expect(shouldShowInterstitial(m, t1 + 1, false)).toBe(false);
    m = ageUps(m, adPolicyConfig.interstitialEveryNAgeUps - 1);
    expect(shouldShowInterstitial(m, t1 + sec(10_000), false)).toBe(false);
    m = ageUps(m, 1);
    // enough age-ups but cooldown not elapsed
    expect(shouldShowInterstitial(m, t1 + sec(adPolicyConfig.interstitialCooldownSeconds - 1), false)).toBe(false);
    expect(shouldShowInterstitial(m, t1 + sec(adPolicyConfig.interstitialCooldownSeconds + 1), false)).toBe(true);
  });
});

describe('rewarded policy', () => {
  it('caps uses per day and resets on a new day', () => {
    let m = emptyAdMeta(T0);
    const cap = adPolicyConfig.rewardedDailyCaps.cashBoost!;
    expect(rewardedUsesLeft(m, 'cashBoost', T0)).toBe(cap);
    for (let i = 0; i < cap; i++) {
      expect(canShowRewarded(m, 'cashBoost', T0)).toBe(true);
      m = recordRewardedUsed(m, 'cashBoost', T0);
    }
    expect(canShowRewarded(m, 'cashBoost', T0)).toBe(false);
    const tomorrow = T0 + sec(60 * 60 * 24);
    expect(canShowRewarded(m, 'cashBoost', tomorrow)).toBe(true);
    expect(rewardedUsesLeft(m, 'cashBoost', tomorrow)).toBe(cap);
  });

  it('unknown placements are never allowed', () => {
    expect(canShowRewarded(emptyAdMeta(T0), 'nope', T0)).toBe(false);
  });
});
