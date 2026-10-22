import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * App configuration.
 *
 * APP_VARIANT (set by the eas.json build profiles) selects:
 *   development / preview -> Google's SAMPLE AdMob app IDs (safe, serves test ads)
 *   production            -> real IDs from ADMOB_ANDROID_APP_ID / ADMOB_IOS_APP_ID
 * A production build throws below until every monetization variable in
 * docs/RELEASE_CHECKLIST.md §1 and the EAS project ID are set, so a store build can
 * never ship sample AdMob IDs, test ad units or a paywall that cannot sell anything.
 */
const variant = process.env.APP_VARIANT ?? 'development';
const isProd = variant === 'production';

const SAMPLE_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const SAMPLE_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511';
/** Google's sample AdMob publisher: every demo app ID and test ad unit starts with it. */
const SAMPLE_PUBLISHER = 'ca-app-pub-3940256099942544';

/**
 * Everything a store build needs (docs/RELEASE_CHECKLIST.md §1). EAS CLI evaluates
 * this file locally with the build environment's "Plain text" and "Sensitive" EAS
 * variables (never "Secret" ones) before anything is uploaded, and the build server
 * evaluates it again, so a missing value fails the build before it costs anything.
 */
const REQUIRED_PRODUCTION_ENV = [
  'ADMOB_ANDROID_APP_ID',
  'ADMOB_IOS_APP_ID',
  'EXPO_PUBLIC_ADMOB_ANDROID_BANNER',
  'EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL',
  'EXPO_PUBLIC_ADMOB_ANDROID_REWARDED',
  'EXPO_PUBLIC_ADMOB_IOS_BANNER',
  'EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL',
  'EXPO_PUBLIC_ADMOB_IOS_REWARDED',
  'EXPO_PUBLIC_RC_IOS_KEY',
  'EXPO_PUBLIC_RC_ANDROID_KEY',
  'EXPO_PUBLIC_PRIVACY_URL',
  'EXPO_PUBLIC_SUPPORT_EMAIL',
] as const;

/**
 * The fallbacks in src/config/legal.ts (PLACEHOLDER_PRIVACY_URL, PLACEHOLDER_SUPPORT_EMAIL): fine for development,
 * never for a store build. Kept equal by src/config/__tests__/appConfig.test.ts. The real privacy URL is the
 * published policy page, https://<user>.github.io/<repo>/privacy.html (store/site/README.md).
 */
const PLACEHOLDER_VALUES = new Set(['https://jaedonh.github.io/yearborn-privacy/', 'support@yearborn.app']);

/**
 * EAS project ID (a UUID, not a secret). Replace the placeholder with the projectId that
 * `eas init` prints, or export EAS_PROJECT_ID in your shell or .env. It cannot live only in
 * the EAS dashboard: EAS CLI needs it to find the project before it can download the
 * project's EAS environment variables.
 */
const EAS_PROJECT_ID = 'REPLACE_WITH_EAS_PROJECT_ID';
const easProjectId = (process.env.EAS_PROJECT_ID ?? '').trim() || EAS_PROJECT_ID;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

if (isProd) {
  const missing = REQUIRED_PRODUCTION_ENV.filter((name) => {
    const value = (process.env[name] ?? '').trim();
    return value.length === 0 || value.startsWith(SAMPLE_PUBLISHER) || PLACEHOLDER_VALUES.has(value);
  });
  if (missing.length > 0) {
    throw new Error(
      `[app.config] APP_VARIANT=production but ${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} unset or still a sample or placeholder value. ` +
        'A store build must not ship sample AdMob IDs, test ad units, a disabled paywall or placeholder privacy and support contacts. ' +
        'Set them with `eas env:create --scope project --environment production` (visibility "Plain text" or "Sensitive", not "Secret": EAS CLI needs them to evaluate this config) ' +
        'or in a local .env, then retry. See docs/RELEASE_CHECKLIST.md §1.',
    );
  }
  if (!UUID.test(easProjectId)) {
    throw new Error(
      `[app.config] APP_VARIANT=production but the EAS project ID is "${easProjectId}", not a UUID. ` +
        'Run `npx eas-cli@latest init`, then paste the projectId it prints into EAS_PROJECT_ID in app.config.ts ' +
        '(or export EAS_PROJECT_ID in your shell or .env). See docs/RELEASE_CHECKLIST.md §0.',
    );
  }
}

const androidAppId = (isProd && process.env.ADMOB_ANDROID_APP_ID) || SAMPLE_ANDROID_APP_ID;
const iosAppId = (isProd && process.env.ADMOB_IOS_APP_ID) || SAMPLE_IOS_APP_ID;

/**
 * Google's recommended SKAdNetwork identifiers for AdMob. Re-diff against
 * https://developers.google.com/admob/ios/3p-skadnetworks before each release
 * (docs/RELEASE_CHECKLIST.md §2): Google adds networks a few times a year.
 */
const SK_AD_NETWORK_IDS = [
  'cstr6suwn9', '4fzdc2evr5', '2fnua5tdw4', 'ydx93a7ass', 'p78axxw29g', 'v72qych5uu', 'ludvb6z3bs', 'cp8zw746q7', '3sh42y64q3', 'c6k4g5qg8m',
  's39g8k73mm', 'wg4vff78zm', '3qy4746246', 'f38h382jlk', 'hs6bdukanm', 'mlmmfzh3r3', 'v4nxqhlyqp', 'wzmmz9fp6w', 'su67r6k2v3', 'yclnxrl5pm',
  't38b2kh725', '7ug5zh24hu', 'gta9lk7p23', 'vutu7akeur', 'y5ghdn5j9k', 'v9wttpbfk9', 'n38lu8286q', '47vhws6wlr', 'kbd757ywx3', '9t245vhmpl',
  'a2p9lx4jpn', '22mmun2rn5', '44jx6755aq', 'k674qkevps', '4468km3ulz', '2u9pt9hc89', '8s468mfl3y', 'klf5c3l5u5', 'ppxm28t8ap', 'kbmxgpxpgc',
  'uw77j35x4d', '578prtvx9j', '4dzt52r2t5', 'tl55sbb4fm', 'c3frkrj4fj', 'e5fvkxwrpn', '8c4e2ghe7u', '3rd42ekr43', '97r2b46745', '3qcr597p9d',
].map((id) => `${id}.skadnetwork`);

const TRACKING_TEXT = 'This identifier will be used to deliver personalized ads to you.';

/** Privacy manifest purposes (Apple's names), used below. */
const ADS = 'NSPrivacyCollectedDataTypePurposeThirdPartyAdvertising';
const ANALYTICS = 'NSPrivacyCollectedDataTypePurposeAnalytics';
const APP_FUNCTIONALITY = 'NSPrivacyCollectedDataTypePurposeAppFunctionality';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: isProd ? 'Yearborn' : `Yearborn (${variant})`,
  slug: 'yearborn',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'yearborn',
  userInterfaceStyle: 'dark',
  backgroundColor: '#0F0E1A',
  // Build numbers (ios.buildNumber, android.versionCode) are not set here: eas.json uses
  // "appVersionSource": "remote", so EAS stores them and autoIncrement bumps them on every
  // production build. Values here would be ignored. Only `version` (the store version) lives here.
  ios: {
    bundleIdentifier: isProd ? 'com.jaedonh.yearborn' : `com.jaedonh.yearborn.${variant}`,
    // iPad: App Review also runs the app on iPad, and supportsTablet means iPad screenshots
    // are required and iPad gets all four orientations (Expo adds them for multitasking).
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    // The app's own PrivacyInfo.xcprivacy. Required-reason APIs from React Native and every
    // pod are merged in at `pod install` (privacy manifest aggregation is on by default in
    // SDK 57); the Google Mobile Ads, UMP and RevenueCat binaries ship their own manifests.
    // The data types mirror the App Privacy answers in docs/RELEASE_CHECKLIST.md §3, row for row:
    // AdMob (device ID, coarse location from the IP address, ad and product interaction, diagnostics),
    // used for ads, analytics and fraud prevention (Apple files fraud prevention under App Functionality),
    // and RevenueCat (purchase history under an anonymous app user ID, so not linked to the person).
    privacyManifests: {
      NSPrivacyTracking: true,
      NSPrivacyTrackingDomains: [],
      NSPrivacyCollectedDataTypes: [
        { NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeDeviceID', NSPrivacyCollectedDataTypeLinked: true, NSPrivacyCollectedDataTypeTracking: true, NSPrivacyCollectedDataTypePurposes: [ADS, ANALYTICS, APP_FUNCTIONALITY] },
        { NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeAdvertisingData', NSPrivacyCollectedDataTypeLinked: false, NSPrivacyCollectedDataTypeTracking: true, NSPrivacyCollectedDataTypePurposes: [ADS, ANALYTICS, APP_FUNCTIONALITY] },
        { NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeCoarseLocation', NSPrivacyCollectedDataTypeLinked: false, NSPrivacyCollectedDataTypeTracking: false, NSPrivacyCollectedDataTypePurposes: [ADS, ANALYTICS, APP_FUNCTIONALITY] },
        { NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeProductInteraction', NSPrivacyCollectedDataTypeLinked: false, NSPrivacyCollectedDataTypeTracking: false, NSPrivacyCollectedDataTypePurposes: [ADS, ANALYTICS, APP_FUNCTIONALITY] },
        // Google calls the SDK's performance data (launch time, hangs, energy use) "user-associated", so it is linked.
        { NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypePerformanceData', NSPrivacyCollectedDataTypeLinked: true, NSPrivacyCollectedDataTypeTracking: false, NSPrivacyCollectedDataTypePurposes: [ADS, ANALYTICS, APP_FUNCTIONALITY] },
        { NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeOtherDiagnosticData', NSPrivacyCollectedDataTypeLinked: false, NSPrivacyCollectedDataTypeTracking: false, NSPrivacyCollectedDataTypePurposes: [ADS, ANALYTICS, APP_FUNCTIONALITY] },
        { NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeCrashData', NSPrivacyCollectedDataTypeLinked: false, NSPrivacyCollectedDataTypeTracking: false, NSPrivacyCollectedDataTypePurposes: [ANALYTICS, APP_FUNCTIONALITY] },
        { NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypePurchaseHistory', NSPrivacyCollectedDataTypeLinked: false, NSPrivacyCollectedDataTypeTracking: false, NSPrivacyCollectedDataTypePurposes: [APP_FUNCTIONALITY, ANALYTICS] },
      ],
      NSPrivacyAccessedAPITypes: [
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults', NSPrivacyAccessedAPITypeReasons: ['CA92.1'] },
      ],
    },
  },
  android: {
    package: isProd ? 'com.jaedonh.yearborn' : `com.jaedonh.yearborn.${variant}`,
    // The Expo template asks for storage and "draw over other apps" access; the game uses
    // neither, and both show up in the Play listing's permission list. SYSTEM_ALERT_WINDOW
    // stays in development builds, where React Native's dev tools can use it.
    blockedPermissions: [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      ...(isProd ? ['android.permission.SYSTEM_ALERT_WINDOW'] : []),
    ],
    adaptiveIcon: {
      backgroundColor: '#4338CA',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    ['expo-router', { sitemap: false }],
    './plugins/withAndroidGameCategory',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#4338CA',
        image: './assets/images/splash-icon.png',
        imageWidth: 160,
      },
    ],
    [
      'react-native-google-mobile-ads',
      {
        androidAppId,
        iosAppId,
        userTrackingUsageDescription: TRACKING_TEXT,
        delayAppMeasurementInit: true,
        skAdNetworkItems: SK_AD_NETWORK_IDS,
      },
    ],
    ['expo-tracking-transparency', { userTrackingPermission: TRACKING_TEXT }],
    [
      'expo-build-properties',
      {
        // iOS: nothing to set while EAS builds SDK 57 with its default image (Xcode 26.6, which meets
        // Apple's Xcode 26 minimum). From April 2027 Apple requires the iOS 27 SDK (Xcode 27), which
        // also requires the UIKit scene lifecycle: upgrade to SDK 58 before then, or set
        // `ios: { enableSceneSupport: true }` here and build on an Xcode 27 image (RELEASE_CHECKLIST §6).
        android: {
          // Required by the UMP (consent) SDK when R8/ProGuard is enabled.
          extraProguardRules: '-keep class com.google.android.gms.internal.consent_sdk.** { *; }',
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    // Web preview on GitHub Pages lives under /<repo>/ (set by .github/workflows/preview.yml).
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
  extra: {
    eas: {
      projectId: easProjectId,
    },
  },
});
