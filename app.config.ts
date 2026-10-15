import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * App configuration.
 *
 * APP_VARIANT (set by the eas.json build profiles) selects:
 *   development / preview -> Google's SAMPLE AdMob app IDs (safe, serves test ads)
 *   production            -> real IDs from ADMOB_ANDROID_APP_ID / ADMOB_IOS_APP_ID
 * Set those two secrets in EAS (eas env:create --scope project) before a store build.
 */
const variant = process.env.APP_VARIANT ?? 'development';
const isProd = variant === 'production';

const SAMPLE_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const SAMPLE_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511';

const androidAppId = (isProd && process.env.ADMOB_ANDROID_APP_ID) || SAMPLE_ANDROID_APP_ID;
const iosAppId = (isProd && process.env.ADMOB_IOS_APP_ID) || SAMPLE_IOS_APP_ID;

if (isProd && (androidAppId === SAMPLE_ANDROID_APP_ID || iosAppId === SAMPLE_IOS_APP_ID)) {
  console.warn('[app.config] Production build is using SAMPLE AdMob app IDs. Set ADMOB_ANDROID_APP_ID / ADMOB_IOS_APP_ID.');
}

/** Google's recommended SKAdNetwork identifiers for AdMob (re-check before each release). */
const SK_AD_NETWORK_IDS = [
  'cstr6suwn9', '4fzdc2evr5', '2fnua5tdw4', 'ydx93a7ass', 'p78axxw29g', 'v72qych5uu', 'ludvb6z3bs', 'cp8zw746q7', '3sh42y64q3', 'c6k4g5qg8m',
  's39g8k73mm', 'wg4vff78zm', '3qy4746246', 'f38h382jlk', 'hs6bdukanm', 'mlmmfzh3r3', 'v4nxqhlyqp', 'wzmmz9fp6w', 'su67r6k2v3', 'yclnxrl5pm',
  't38b2kh725', '7ug5zh24hu', 'gta9lk7p23', 'vutu7akeur', 'y5ghdn5j9k', 'v9wttpbfk9', 'n38lu8286q', '47vhws6wlr', 'kbd757ywx3', '9t245vhmpl',
  'a2p9lx4jpn', '22mmun2rn5', '44jx6755aq', 'k674qkevps', '4468km3ulz', '2u9pt9hc89', '8s468mfl3y', 'klf5c3l5u5', 'ppxm28t8ap', 'kbmxgpxpgc',
  'uw77j35x4d', '578prtvx9j', '4dzt52r2t5', 'tl55sbb4fm', 'c3frkrj4fj', 'e5fvkxwrpn', '8c4e2ghe7u', '3rd42ekr43', '97r2b46745', '3qcr597p9d',
].map((id) => `${id}.skadnetwork`);

const TRACKING_TEXT = 'This identifier will be used to deliver personalized ads to you.';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: isProd ? 'LifeLoop' : `LifeLoop (${variant})`,
  slug: 'lifeloop',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'lifeloop',
  userInterfaceStyle: 'dark',
  backgroundColor: '#0F0E1A',
  ios: {
    bundleIdentifier: isProd ? 'com.jaedonh.lifeloop' : `com.jaedonh.lifeloop.${variant}`,
    buildNumber: '1',
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    // Mirrors the App Privacy "nutrition label" answers for AdMob + RevenueCat.
    privacyManifests: {
      NSPrivacyTracking: true,
      NSPrivacyTrackingDomains: [],
      NSPrivacyCollectedDataTypes: [
        { NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeDeviceID', NSPrivacyCollectedDataTypeLinked: true, NSPrivacyCollectedDataTypeTracking: true, NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeThirdPartyAdvertising'] },
        { NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeAdvertisingData', NSPrivacyCollectedDataTypeLinked: false, NSPrivacyCollectedDataTypeTracking: true, NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeThirdPartyAdvertising'] },
        { NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeProductInteraction', NSPrivacyCollectedDataTypeLinked: false, NSPrivacyCollectedDataTypeTracking: false, NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAnalytics', 'NSPrivacyCollectedDataTypePurposeThirdPartyAdvertising'] },
        { NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypePurchaseHistory', NSPrivacyCollectedDataTypeLinked: true, NSPrivacyCollectedDataTypeTracking: false, NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality', 'NSPrivacyCollectedDataTypePurposeAnalytics'] },
        { NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeUserID', NSPrivacyCollectedDataTypeLinked: true, NSPrivacyCollectedDataTypeTracking: false, NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'] },
        { NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeCrashData', NSPrivacyCollectedDataTypeLinked: false, NSPrivacyCollectedDataTypeTracking: false, NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'] },
        { NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypePerformanceData', NSPrivacyCollectedDataTypeLinked: false, NSPrivacyCollectedDataTypeTracking: false, NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'] },
      ],
      NSPrivacyAccessedAPITypes: [
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults', NSPrivacyAccessedAPITypeReasons: ['CA92.1'] },
      ],
    },
  },
  android: {
    package: isProd ? 'com.jaedonh.lifeloop' : `com.jaedonh.lifeloop.${variant}`,
    versionCode: 1,
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
    'expo-router',
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
        android: {
          // Required by the UMP (consent) SDK when R8/ProGuard is enabled.
          extraProguardRules: '-keep class com.google.android.gms.internal.consent_sdk.** { *; }',
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? 'REPLACE_WITH_EAS_PROJECT_ID',
    },
  },
});
