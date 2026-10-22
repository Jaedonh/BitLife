import { Platform } from 'react-native';

/**
 * Monetization configuration.
 *
 * All IDs default to Google's public TEST ad units so a fresh clone never
 * serves real ads by accident. Set the EXPO_PUBLIC_* variables in your EAS
 * project (or a local .env) to switch to production IDs.
 *
 * Test IDs: https://developers.google.com/admob/android/test-ads
 */
const TEST_IDS = {
  android: {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  },
  ios: {
    banner: 'ca-app-pub-3940256099942544/2934735716',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
  },
} as const;

const clean = (v: string | undefined): string | undefined => (v && v.trim().length > 0 ? v.trim() : undefined);

// Expo inlines EXPO_PUBLIC_* at build time, so each variable must be referenced statically.
const envIds = {
  android: {
    banner: clean(process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER),
    interstitial: clean(process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL),
    rewarded: clean(process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED),
  },
  ios: {
    banner: clean(process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER),
    interstitial: clean(process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL),
    rewarded: clean(process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED),
  },
} as const;

const platformKey = Platform.OS === 'ios' ? 'ios' : 'android';

export const adUnitIds = {
  banner: envIds[platformKey].banner ?? TEST_IDS[platformKey].banner,
  interstitial: envIds[platformKey].interstitial ?? TEST_IDS[platformKey].interstitial,
  rewarded: envIds[platformKey].rewarded ?? TEST_IDS[platformKey].rewarded,
};

export const usingTestAds =
  adUnitIds.banner === TEST_IDS[platformKey].banner ||
  adUnitIds.interstitial === TEST_IDS[platformKey].interstitial;

/** UMP debug regions (react-native-google-mobile-ads AdsConsentDebugGeography). */
export type ConsentDebugGeography = 'EEA' | 'REGULATED_US_STATE' | 'NOT_EEA' | 'OTHER';
const DEBUG_GEOGRAPHIES: readonly ConsentDebugGeography[] = ['EEA', 'REGULATED_US_STATE', 'NOT_EEA', 'OTHER'];

/**
 * Consent testing (docs/RELEASE_CHECKLIST.md §2): makes the UMP SDK act as if the device were in
 * the EEA or a regulated US state, so the GDPR and US-state messages can be checked from anywhere.
 * Set EXPO_PUBLIC_ADS_DEBUG_GEOGRAPHY (EEA | REGULATED_US_STATE | NOT_EEA | OTHER) and, for a
 * physical device, EXPO_PUBLIC_ADS_TEST_DEVICE_IDS (comma-separated hashed IDs the SDK logs).
 * Only builds on Google's test ad units honor it, so a store build (which the production guard
 * keeps off test units) never fakes a region.
 */
const debugGeography = clean(process.env.EXPO_PUBLIC_ADS_DEBUG_GEOGRAPHY)?.toUpperCase() as ConsentDebugGeography | undefined;
export const consentDebug: { geography: ConsentDebugGeography | null; testDeviceIds: string[] } =
  usingTestAds && debugGeography && DEBUG_GEOGRAPHIES.includes(debugGeography)
    ? {
        geography: debugGeography,
        testDeviceIds: (clean(process.env.EXPO_PUBLIC_ADS_TEST_DEVICE_IDS) ?? '').split(',').map((s) => s.trim()).filter(Boolean),
      }
    : { geography: null, testDeviceIds: [] };

/** RevenueCat public SDK keys (safe to ship in the binary). */
export const revenueCatApiKey: string | undefined =
  Platform.OS === 'ios' ? clean(process.env.EXPO_PUBLIC_RC_IOS_KEY) : clean(process.env.EXPO_PUBLIC_RC_ANDROID_KEY);

/** Entitlement identifier configured in the RevenueCat dashboard. */
export const PREMIUM_ENTITLEMENT = 'premium';
/** Store product identifier (same on both stores). */
export const PREMIUM_PRODUCT_ID = 'yearborn_premium';

/** Ad cadence. See docs/GAME_DESIGN.md §19 for the reasoning. */
export const adPolicyConfig = {
  /** Show an interstitial at most once every N age-ups ... */
  interstitialEveryNAgeUps: 6,
  /** ... and never more often than this many seconds apart. */
  interstitialCooldownSeconds: 150,
  /** No interstitials during the first N age-ups ever (first life tutorial). */
  interstitialGraceAgeUps: 12,
  /** No interstitials for this many seconds after app launch. */
  interstitialLaunchGraceSeconds: 90,
  /** Hard cap on interstitials per app session. */
  interstitialSessionCap: 3,
  /** Rewarded placements: hard daily caps per placement. */
  rewardedDailyCaps: {
    cashBoost: 3,
    statBoost: 3,
    secondChance: 1,
    reroll: 3,
  } as Record<string, number>,
} as const;
