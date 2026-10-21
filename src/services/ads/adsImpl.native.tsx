import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { adUnitIds, consentDebug } from '@/config/monetization';
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
let consentBlocked = false;

/** Debug region for consent testing; empty (real region) unless the build serves test ads. */
function consentOptions() {
  if (!gma || !consentDebug.geography) return {};
  return {
    debugGeography: gma.AdsConsentDebugGeography[consentDebug.geography],
    testDeviceIdentifiers: consentDebug.testDeviceIds,
  };
}

async function gatherConsent(): Promise<void> {
  if (!gma) return;
  const { AdsConsent, AdsConsentPrivacyOptionsRequirementStatus } = gma;
  try {
    const info = await AdsConsent.gatherConsent(consentOptions());
    privacyOptionsRequired =
      info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
    consentBlocked = !info.canRequestAds;
    if (!info.canRequestAds) {
      nonPersonalized = true;
    } else {
      // The TCF choices only exist where GDPR applies. Elsewhere there is no TC string and
      // getUserChoices() reports every purpose as refused, which used to force
      // non-personalized ads on every player outside the EEA, UK and Switzerland.
      // US state opt-outs reach the ads SDK through the GPP string UMP stores, not through this flag.
      const gdprApplies = await AdsConsent.getGdprApplies().catch(() => true);
      if (gdprApplies) {
        const choices = await AdsConsent.getUserChoices().catch(() => null);
        nonPersonalized = choices ? !choices.selectPersonalisedAds : true;
      } else {
        nonPersonalized = false;
      }
    }
  } catch {
    // Consent could not be gathered (offline etc.). Per the UMP docs, still try to
    // use the status from the last session; otherwise request non-personalized ads.
    nonPersonalized = true;
    try {
      const info = await AdsConsent.getConsentInfo();
      privacyOptionsRequired =
        info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
      if (!info.canRequestAds) {
        consentBlocked = true;
      }
    } catch {
      consentBlocked = true;
    }
  }
}

/**
 * iOS App Tracking Transparency prompt, shown after the UMP message and before the SDK starts.
 * Following the library's consent guide (Google's sample flow), it is skipped where GDPR applies
 * and the player refused purpose 1 (storing and accessing information on the device): they have
 * already said no, so asking again would only nag. Anything short of "granted" means
 * non-personalized ads.
 */
async function requestTrackingIfAllowed(): Promise<void> {
  if (!gma) return;
  try {
    const gdprApplies = await gma.AdsConsent.getGdprApplies();
    const purposeOneConsent = gdprApplies && (await gma.AdsConsent.getPurposeConsents()).startsWith('1');
    if (gdprApplies && !purposeOneConsent) {
      nonPersonalized = true;
      return;
    }
  } catch {
    // The consent state cannot be read: fall through and let the player decide in the ATT prompt.
  }
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
  if (consentBlocked) {
    // The user declined in a regulated region and no form is available: do not request ads
    // (and do not show the ATT prompt for ads that will never load).
    ready = false;
    return;
  }
  if (Platform.OS === 'ios') await requestTrackingIfAllowed();
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
        size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
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
