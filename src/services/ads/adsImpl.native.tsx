import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { adUnitIds } from '@/config/monetization';
import type { AdsService, RewardedResult } from './types';

/**
 * Native implementation backed by react-native-google-mobile-ads.
 *
 * The SDK is required lazily inside a try/catch so the app still runs in
 * Expo Go (where the native module is absent) — it simply behaves like the
 * web fallback there.
 */
type Gma = typeof import('react-native-google-mobile-ads');

let gma: Gma | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  gma = require('react-native-google-mobile-ads') as Gma;
} catch {
  gma = null;
}

let ready = false;
let privacyOptionsRequired = false;
let interstitial: import('react-native-google-mobile-ads').InterstitialAd | null = null;
let interstitialLoaded = false;
let rewarded: import('react-native-google-mobile-ads').RewardedAd | null = null;
let rewardedLoaded = false;
let nonPersonalized = false;

async function gatherConsent(): Promise<void> {
  if (!gma) return;
  const { AdsConsent, AdsConsentPrivacyOptionsRequirementStatus } = gma;
  try {
    const info = await AdsConsent.gatherConsent();
    privacyOptionsRequired =
      info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
    if (!info.canRequestAds) {
      nonPersonalized = true;
    } else {
      const choices = await AdsConsent.getUserChoices().catch(() => null);
      nonPersonalized = choices ? !choices.selectPersonalisedAds : false;
    }
  } catch {
    // Consent could not be gathered (offline etc.): fall back to non-personalized requests.
    nonPersonalized = true;
  }

  if (Platform.OS === 'ios') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const tt = require('expo-tracking-transparency') as typeof import('expo-tracking-transparency');
      if (tt.isAvailable()) {
        const res = await tt.requestTrackingPermissionsAsync();
        if (res.status !== 'granted') nonPersonalized = true;
      }
    } catch {
      nonPersonalized = true;
    }
  }
}

function requestOptions() {
  return { requestNonPersonalizedAdsOnly: nonPersonalized };
}

function loadInterstitial() {
  if (!gma) return;
  const { InterstitialAd, AdEventType } = gma;
  interstitialLoaded = false;
  interstitial = InterstitialAd.createForAdRequest(adUnitIds.interstitial, requestOptions());
  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
  });
  interstitial.addAdEventListener(AdEventType.ERROR, () => {
    interstitialLoaded = false;
  });
  interstitial.load();
}

function loadRewarded() {
  if (!gma) return;
  const { RewardedAd, RewardedAdEventType, AdEventType } = gma;
  rewardedLoaded = false;
  rewarded = RewardedAd.createForAdRequest(adUnitIds.rewarded, requestOptions());
  rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
    rewardedLoaded = true;
  });
  rewarded.addAdEventListener(AdEventType.ERROR, () => {
    rewardedLoaded = false;
  });
  rewarded.load();
}

async function init(): Promise<void> {
  if (!gma || ready) return;
  await gatherConsent();
  try {
    await gma.default().setRequestConfiguration({
      maxAdContentRating: gma.MaxAdContentRating.T,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });
    await gma.default().initialize();
    ready = true;
    loadInterstitial();
    loadRewarded();
  } catch {
    ready = false;
  }
}

function showInterstitial(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!gma || !ready || !interstitial || !interstitialLoaded) {
      if (ready) loadInterstitial();
      resolve(false);
      return;
    }
    const { AdEventType } = gma;
    const ad = interstitial;
    let settled = false;
    const finish = (shown: boolean) => {
      if (settled) return;
      settled = true;
      unsubClosed();
      unsubError();
      loadInterstitial();
      resolve(shown);
    };
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => finish(true));
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => finish(false));
    ad.show().catch(() => finish(false));
  });
}

function showRewarded(): Promise<RewardedResult> {
  return new Promise((resolve) => {
    if (!gma || !ready || !rewarded || !rewardedLoaded) {
      if (ready) loadRewarded();
      resolve('unavailable');
      return;
    }
    const { AdEventType, RewardedAdEventType } = gma;
    const ad = rewarded;
    let earned = false;
    let settled = false;
    const finish = (result: RewardedResult) => {
      if (settled) return;
      settled = true;
      unsubEarned();
      unsubClosed();
      unsubError();
      loadRewarded();
      resolve(result);
    };
    const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () =>
      finish(earned ? 'earned' : 'dismissed'),
    );
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => finish('error'));
    ad.show().catch(() => finish('error'));
  });
}

function Banner({ onHeight }: { onHeight?: (h: number) => void }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (failed) onHeight?.(0);
  }, [failed, onHeight]);
  if (!gma || !ready || failed) return null;
  const { BannerAd, BannerAdSize } = gma;
  return (
    <View onLayout={(e) => onHeight?.(e.nativeEvent.layout.height)}>
      <BannerAd
        unitId={adUnitIds.banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={requestOptions()}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

export const ads: AdsService = {
  init,
  isReady: () => ready,
  isSupported: () => gma != null,
  preload: () => {
    if (!ready) return;
    if (!interstitialLoaded) loadInterstitial();
    if (!rewardedLoaded) loadRewarded();
  },
  showInterstitial,
  showRewarded,
  isRewardedLoaded: () => rewardedLoaded,
  isPrivacyOptionsRequired: () => privacyOptionsRequired,
  showPrivacyOptions: async () => {
    if (!gma) return;
    try {
      await gma.AdsConsent.showPrivacyOptionsForm();
    } catch {
      // ignore
    }
  },
  Banner: gma ? Banner : null,
};
