# Release checklist (first store launch)

Facts checked on **2026-10-21**. Every rule below links its source. Store rules change every year: if a date has passed, or a step looks different on screen, trust the linked page over this file. **(unverified)** marks things I could not confirm on an official page; **(estimate)** marks my own judgment.

Work top to bottom. Items marked **(long pole)** take days or weeks: start them first. Items marked **(blocking)** stop a submission.

## Where things stand

Done in code (this repo):

- Expo SDK 57 (`expo` 57.0.30, React Native 0.86.3). Builds target Android API 36 and iOS 16.4+, and EAS builds SDK 57 with Xcode 26.6 by default. That meets both stores' current minimums (§2).
- `react-native-google-mobile-ads` 17.2.0 (Google Mobile Ads iOS 13.6.0 / Android 25.4.0, UMP iOS 3.1.0 / Android 4.0.0). `react-native-purchases` 10.14.0 ships Play Billing Library 8.3.0 (§2).
- A production build refuses to start while any ad ID, RevenueCat key, privacy URL, support email or the EAS project ID is missing, a sample or a placeholder (`app.config.ts`, tested in `src/config/__tests__/appConfig.test.ts`).
- Consent order: Google UMP message, then the iOS ATT prompt, then the ads SDK. Outside GDPR regions, players get personalized ads unless they refuse ATT. Players who refused GDPR purpose 1 are not asked again through ATT. Tested in `src/services/__tests__/adsConsent.test.ts`.
- iOS privacy manifest matches the App Privacy answers in §3. Required-reason APIs from React Native and the pods are merged automatically.
- Store builds drop the storage and "draw over other apps" permissions that the Expo template adds.
- Restore purchases is on the paywall and in Settings. No accounts, so account deletion does not apply.
- **Report an ad** (Apple 2.5.18: "Apps that contain ads must also include the ability for users to report any inappropriate or age-inappropriate ads", [guidelines](https://developer.apple.com/app-store/review/guidelines/#2.5.18)): Settings → Privacy → Report an ad, shown to free players on iOS and Android, opens an email to `EXPO_PUBLIC_SUPPORT_EMAIL` prefilled with the app version and platform and no identifier (`adReportMailto` in `src/services/ads/report.ts`). If no mail app is set up, the app shows the address instead. The privacy policy (§4) and the support page say so.

Nothing is open in code for 1.0.

## 0. Accounts, money and legal (owner only)

- [ ] **(long pole) Google Play developer account** ($25 one-time). Personal accounts created after Nov 13, 2023 must run a **closed test with at least 12 testers opted in for 14 days in a row** before Production is unlocked. Testers who leave early do not count. Google can ask for more testing if engagement is thin ([Play Console Help 14151465](https://support.google.com/googleplay/android-developer/answer/14151465)). Recruit 15-20 testers so a few dropouts do not reset the clock. An **organization** account (needs a D-U-N-S number) skips this rule.
- [ ] **Android developer verification.** Google started enforcing it on Sep 30, 2026 for installs in Brazil, Indonesia, Singapore and Thailand, and plans to go global in 2027. Google Play registers about 99% of apps automatically. Check the verification status on the Play Console home page and register the app there if it is not listed ([developer.android.com/developer-verification](https://developer.android.com/developer-verification)).
- [ ] **(long pole) Apple Developer Program** ($99 a year). Identity checks can take days.
- [ ] **Apple Paid Apps Agreement, banking and tax** in App Store Connect → Business. In-app purchases do not load, even in sandbox, until this agreement is active. **(unverified wording; standard App Store Connect behavior)**
- [ ] **Apple Small Business Program:** 15% commission instead of 30%. You must apply; it is not automatic. The rate starts 15 days after the end of the fiscal month in which Apple approves you, so apply before launch ([Apple](https://developer.apple.com/app-store/small-business-program/)).
- [ ] **Google Play service fee.** Google introduced a new fee structure in the US, UK and EEA on Jun 30, 2026, after its Epic settlement. Reports disagree on the exact rates (figures from 10% to 20%, plus an optional billing fee), so read your current rate in Play Console before you price ([report, Jul 22, 2026](https://www.iclarified.com/101291/google-opens-play-store-to-alternative-payments-under-epic-settlement), **unverified on an official Google page**).
- [ ] **EU Digital Services Act trader status, Apple (blocking).** Go to App Store Connect → Business → Agreements → Compliance → Digital Services Act. You must declare it even if you do not sell in the EU. If you sell as a trader (likely, since the app earns money), your address, phone number and email are **shown publicly** on the EU product page; a P.O. box is allowed for individuals. Apple removes apps without a trader status from the EU store ([Apple help](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements/), [Apple news, Feb 17, 2025](https://developer.apple.com/news/upcoming-requirements/)).
- [ ] **Play Console contact details:** a public support email and a **website** (AdMob needs the website for `app-ads.txt`, below).
- [ ] **(blocking) Final app name.** "LifeLoop" is only a working title and may already be a US software brand, so do not create store records under it. Pick 2-3 candidates. Search USPTO (classes 9 and 41), EUIPO eSearch, and exact names on both stores. Then change `name`, `slug`, bundle ID and package in `app.config.ts`, the titles in `src/app/*.tsx`, `scripts/generate-icons.sh` (re-run it) and `docs/STORE_LISTING.md`. The product ID `lifeloop_premium` can stay; store product IDs cannot be reused anyway.
- [ ] **(legal decision) US state age-verification laws.** Since Jun 4, 2026, new Apple Accounts in Texas fall under Texas SB 2420: age checks and parental consent for minors' downloads, in-app purchases and "significant changes". Apple tells developers to implement the Declared Age Range API, the Significant Change API (PermissionKit), a StoreKit age-rating property and a consent-revocation server notification ([Apple news, Jun 3, 2026](https://developer.apple.com/news/?id=sg176nne), [Apple age assurance Q&A](https://developer.apple.com/support/age-assurance/)). Google offers a similar Play Age Signals API ([developer.android.com](https://developer.android.com/google/play/age-signals/use-age-signals-api)). This app does none of it yet. Apple only says "in regions where legally required", and the law is still in court, so **ask a lawyer whether a 13+ offline game with one purchase must implement it**. If yes, SDK 57 includes `expo-age-range` ([Expo docs source](https://github.com/expo/expo/blob/main/docs/pages/versions/v57.0.0/sdk/age-range.mdx)); it needs a development build and the `com.apple.developer.declared-age-range` entitlement.

### Service accounts

- [ ] **Expo / EAS.** Log in with `npx eas-cli@latest login`, then run `npx eas-cli@latest init`. Paste the project ID it prints into `EAS_PROJECT_ID` in `app.config.ts`, or export `EAS_PROJECT_ID` in your shell or `.env`. It must be available locally: EAS CLI needs it to find the project before it can download the EAS environment variables. A production build refuses to start until it is a real UUID. Then run `npx eas-cli@latest build:version:set` once per platform (answer "1" for a first release). Build numbers live on EAS (`appVersionSource: "remote"`), and every production build increments them ([Expo docs: app versions](https://github.com/expo/expo/blob/main/docs/pages/build-reference/app-versions.mdx)). The free plan's build quota is small: test with development builds and `eas update`, and keep production builds to 1-2 per platform.
- [ ] **AdMob.**
  - Create the app on both platforms, copy the two **App IDs** (`ca-app-pub-…~…`) and create three ad units per platform: anchored adaptive banner, interstitial, rewarded.
  - **app-ads.txt (blocking for full ad serving):** since January 2025, new AdMob apps must be verified with an `app-ads.txt` file on the developer website from the store listing. Until then, and until AdMob's app readiness review passes, the app gets **limited ad serving** ([AdMob Help 14538460](https://support.google.com/admob/answer/14538460), [AdMob Help 10105530](https://support.google.com/admob/answer/10105530)). The file must sit at the root of the domain, which for GitHub Pages means a `<user>.github.io` repository (steps in `store/site/README.md`).
  - **Privacy & messaging:** create a **GDPR message** (EEA, UK, Switzerland; UMP is Google's certified consent platform) and a **US state regulations message**. Both need UMP 2.1.0 or later, and this build has 3.1.0 on iOS and 4.0.0 on Android ([Google: disclose to US users](https://developers.google.com/admob/ios/privacy/us-iab-support)). Optionally add an **IDFA explainer** message: if you do, UMP shows Apple's ATT alert itself, and the app's own ATT request becomes a no-op ([library consent guide](https://github.com/invertase/react-native-google-mobile-ads/blob/main/docs/european-user-consent.mdx)).
  - Register your phones as test devices. Never tap live ads on your own devices.
- [ ] **RevenueCat.**
  - Create the project and add the iOS and Android apps. Create entitlement `premium`, attach product `lifeloop_premium` from both stores, and create offering `default` with a **Lifetime** package. Copy the public SDK keys (`appl_…`, `goog_…`).
  - **Apple:** upload an **In-App Purchase Key** (.p8, App Store Connect → Users and Access → Integrations) and its Issuer ID. RevenueCat SDK 5+ on iOS uses StoreKit 2, and purchases fail to record without this key ([RevenueCat docs](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/in-app-purchase-key-configuration)).
  - **Google:** connect a Google Cloud service account with Play Console financial access, as RevenueCat's setup screen shows. New credentials can take a while to start working **(unverified how long)**.

## 1. Secrets and configuration

Set these as EAS environment variables with visibility **Plain text** or **Sensitive**, never **Secret**. EAS CLI cannot read Secret variables when it evaluates `app.config.ts` ([Expo docs: EAS environment variables](https://github.com/expo/expo/blob/main/docs/pages/eas/environment-variables/usage.mdx)). For example: `npx eas-cli@latest env:create --scope project --environment production --name ADMOB_IOS_APP_ID --value ca-app-pub-…~… --visibility plaintext`. Put the same values in a local `.env` for `npx expo run:*`. Every build profile in `eas.json` names its EAS environment (`"environment": "production"`), so the production build always reads the production variables.

| Variable | Used by |
| --- | --- |
| `ADMOB_ANDROID_APP_ID`, `ADMOB_IOS_APP_ID` | `app.config.ts` (production only) |
| `EXPO_PUBLIC_ADMOB_ANDROID_BANNER`, `…_INTERSTITIAL`, `…_REWARDED` | `src/config/monetization.ts` |
| `EXPO_PUBLIC_ADMOB_IOS_BANNER`, `…_INTERSTITIAL`, `…_REWARDED` | `src/config/monetization.ts` |
| `EXPO_PUBLIC_RC_IOS_KEY`, `EXPO_PUBLIC_RC_ANDROID_KEY` | `src/config/monetization.ts` |
| `EXPO_PUBLIC_PRIVACY_URL`, `EXPO_PUBLIC_SUPPORT_EMAIL` | `src/config/legal.ts` (Settings → Privacy policy, Contact, Report an ad) |
| `EAS_PROJECT_ID` (or paste into `app.config.ts`) | `app.config.ts` (`extra.eas.projectId`) |

- [ ] Development and preview builds (and Expo Go and web) run without these. They use Google's **sample** app IDs and **test** ad units, purchases report "unavailable", and the Settings footer shows `· test ads`.
- [ ] A **production** build refuses to evaluate `app.config.ts` until every variable above is real. EAS CLI checks this locally before any build minutes are spent, and the build server checks it again. Verify it with `APP_VARIANT=production npx expo config --type public` with the variables in your shell or `.env`.
- [ ] **Publish the privacy policy and support page** (steps in `store/site/README.md`; the policy page is built from `docs/PRIVACY_POLICY.md`) on GitHub Pages from a separate public repository with no third-party trademark in its name, for example `lifeloop-site`. Then set `EXPO_PUBLIC_PRIVACY_URL` to the **policy page itself**, `https://<user>.github.io/<repo>/privacy.html` (not the site root, which is the app page), and `EXPO_PUBLIC_SUPPORT_EMAIL` to the inbox printed on the pages. The defaults in `src/config/legal.ts` are placeholders that a production build refuses. Every EAS production build runs `npm run check:privacy` after installing dependencies: it fails while the URL is a placeholder, does not answer HTTP 200, is not the policy page, or still shows `[YOUR LEGAL NAME]` or `[CONTACT EMAIL]`. Run it yourself first: `EXPO_PUBLIC_PRIVACY_URL=https://<user>.github.io/<repo>/privacy.html npm run check:privacy`. A dead in-app policy link is grounds for rejection under Apple 5.1.1(i) ([guidelines](https://developer.apple.com/app-store/review/guidelines/#5.1.1)).
- [ ] After creating the App Store Connect record, fill `eas.json` → `submit.production.ios.ascAppId`. Keep `google-play-service-account.json` local (git-ignored), or upload it with `npx eas-cli@latest credentials --platform android`.

## 2. Builds and device tests

```bash
npm ci && npm run typecheck && npm run lint && npm test && npm run build:web && npm run e2e   # all green
npm run check:privacy                                   # policy is live at EXPO_PUBLIC_PRIVACY_URL
APP_VARIANT=production npx expo config --type public    # fails until §1 is complete
npx eas-cli@latest build --profile development --platform all   # dev client: real ads/IAP on devices
npx eas-cli@latest build --profile production --platform android
npx eas-cli@latest build --profile production --platform ios
```

Platform minimums. Each was checked against this repo; no action is needed unless a date passes.

| Requirement (as of 2026-10-21) | This app | Source |
| --- | --- | --- |
| Apple: uploads built with **Xcode 26+ and the iOS 26 SDK** (since Apr 28, 2026). Apps must target iOS 13 or later (since Sep 9, 2026). | EAS's `sdk-57` image is `macos-tahoe-26.5-xcode-26.6` (picked automatically). Deployment target is iOS 16.4. | [Apple upcoming requirements](https://developer.apple.com/news/upcoming-requirements/), [EAS build images](https://github.com/expo/expo/blob/main/docs/pages/build-reference/infrastructure.mdx) |
| Google Play: new apps and updates target **API 36** (since Aug 31, 2026; extensions to Nov 1, 2026). | `targetSdk` 36 and `compileSdk` 36 (SDK 57 defaults; do not override lower). | [developer.android.com: target SDK](https://developer.android.com/google/play/requirements/target-sdk) |
| Google Play: **Play Billing Library 8 or newer** for new apps and updates (since Aug 31, 2026). | `react-native-purchases` 10.14.0 → purchases-hybrid-common 19.12.0 → purchases-android 10.27.0 → Billing **8.3.0**. | [Billing deprecation FAQ](https://developer.android.com/google/play/billing/deprecation-faq), [purchases-android 10.27.0](https://github.com/RevenueCat/purchases-android/blob/10.27.0/gradle/libs.versions.toml) |
| Google Play: apps targeting API 35+ must support **16 KB memory pages**. Updates that do not cannot be released from Feb 1, 2027. | React Native has built 16 KB-aligned libraries since 0.77, and this app is on 0.86. Not checked for every native module **(unverified)**, so verify the build (next list). | [developer.android.com: page sizes](https://developer.android.com/guide/practices/page-sizes) |
| Apple: **privacy manifest and required-reason APIs** (since May 1, 2024). SDKs on Apple's list (here: `hermes`, via React Native) must ship a manifest and a signature. | The app manifest is in `app.config.ts`. React Native's and the pods' required reasons are merged at `pod install` (`apple.privacyManifestAggregationEnabled` defaults to true in SDK 57). Google Mobile Ads, UMP and RevenueCat are not on Apple's list but ship their own manifests. | [Apple: third-party SDK requirements](https://developer.apple.com/support/third-party-SDK-requirements/) |

- [ ] **Device tests with the development build:**
  - The consent form appears. To test from anywhere, build the development client with `EXPO_PUBLIC_ADS_DEBUG_GEOGRAPHY=EEA`, then with `REGULATED_US_STATE` (UMP 2.7.0+; [Google](https://developers.google.com/admob/ios/privacy/us-iab-support)). On a physical phone, also set `EXPO_PUBLIC_ADS_TEST_DEVICE_IDS` to the hashed ID the ads SDK logs. Only builds on test ad units honor this, so a store build never fakes a region (`src/config/monetization.ts`). To show the form again, reinstall the app.
  - On iOS, the ATT prompt appears after the consent form. After declining GDPR purpose 1 in the EEA test, it does not appear.
  - Test ads load: the banner, an interstitial after the grace period, and the rewarded windfall.
  - Settings → Ad privacy options opens the form wherever it is required.
  - The purchase works with a sandbox (iOS) or license-tester (Play) account, and **Restore purchases** works after a reinstall.
  - Report an ad opens a prefilled email.
- [ ] **16 KB check** on the Android build: `zipalign -c -P 16 -v 4 app.apk` should end with "Verification successful", or run `bundletool dump config --bundle=app.aab | grep alignment` on the bundle. Then run the app on an Android 15/16 emulator image with 16 KB pages ([developer.android.com](https://developer.android.com/guide/practices/page-sizes)).
- [ ] **SKAdNetwork IDs:** diff the 50 IDs in `app.config.ts` against [Google's current list](https://developers.google.com/admob/ios/3p-skadnetworks). Search results show that page was last updated in Feb 2026; this environment could not open it, so the diff is not done **(unverified)**.
- [ ] **iPad:** `supportsTablet: true` means App Review tests the iPad layout, Expo adds all four iPad orientations (needed for multitasking), and iPad screenshots are required. Check the game in iPad landscape and in a resized window. To avoid this work for 1.0, set `supportsTablet: false`: the iPhone layout then runs on iPad in compatibility mode, and iPad screenshots are no longer needed **(estimate: fewer review risks)**.

## 3. Store forms and metadata

Copy, screenshots, keywords, IAP text and review notes live in `docs/STORE_LISTING.md`. This section owns the answers to the regulated forms. If the two files disagree, fix both.

- [ ] Icons: `assets/images/icon.png` (1024², no alpha). The adaptive layers come from `scripts/generate-icons.sh`. Play listing icon: `store/play-icon-512.png`. Feature graphic: `store/play-feature-graphic-1024x500.png`.
- [ ] **Screenshots** are ready in `store/screenshots/` (upload order and captions in its README and in `docs/STORE_LISTING.md` §12). Apple's page now says: "To submit your app, you must provide screenshots for … iPhone: At least one screenshot for iPhone with Dynamic Island (medium display)", that is **6.3"** (1206×2622 or 1179×2556), "and iPad (if your app supports iPadOS): At least one screenshot for iPad 13-inch display" (2064×2752 or 2048×2732), required while `supportsTablet` is true. **6.9"** (1320×2868) is optional and is shown on the largest iPhones: upload `ios-6.3/` and `ios-6.9/`. Up to 10 per size, PNG or JPEG, no transparency ([Apple specs](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/), checked 2026-10-21). Google Play takes 2 to 8 per device type: upload `android-phone/` 01-08 (1080×1920; 1080×2400 breaks Play's 2:1 limit). Icons and screenshots must suit a 4+ audience even though the app is 13+ ([guideline 2.3.8](https://developer.apple.com/app-store/review/guidelines/#2.3.8)).

### Apple age rating (questionnaire in force since Jan 31, 2026; expect **13+**)

Apple replaced 12+/17+ with **4+, 9+, 13+, 16+ and 18+** and added new questions. Apps had to answer them by Jan 31, 2026 to keep submitting ([Apple upcoming requirements](https://developer.apple.com/news/upcoming-requirements/)). Answer in App Store Connect → App Information → Age Ratings ([how to](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating/)). Which answer leads to which rating comes from [Apple's values and definitions](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/).

| Section | Question | Answer | Effect |
| --- | --- | --- | --- |
| In-app controls | Parental controls | No | none |
| | Age assurance | No | none |
| Capabilities | Unrestricted web access | No | (would be 16+) |
| | User-generated content | No (typed character names never leave the device) | none |
| | Social media; messaging and chat | No | (social media would be 13+) |
| | Advertising | **Yes** | 4+ (no change) |
| Mature themes | Profanity or crude humor | Infrequent (mild jokes; no swear words found in the event text) | 9+ |
| | Horror/fear themes | None | none |
| | Alcohol, tobacco, or drug use or references | **Infrequent** | **13+** |
| Medical or wellness | Medical or treatment information | None (illness and doctor visits are story events, not advice) | none |
| | Health or wellness topics | Yes (gym, diet, therapy as activities) | 9+ |
| Sexuality or nudity | Mature or suggestive themes | Infrequent (dating, marriage, pregnancy as facts) | 9+ |
| | Sexual content or nudity; graphic sexual content | None | none |
| Violence | Cartoon or fantasy violence | None | none |
| | Realistic violence | **Infrequent** (text-only fights, assault charges, crime) | **13+** |
| | Prolonged graphic or sadistic violence | None | (would be Unrated) |
| | Guns or other weapons | None (no weapon is used in any event) | none |
| Chance-based | Gambling (real money) | No | (would be 18+) |
| | Simulated gambling | **None** (keep it that way: Infrequent is 13+ globally but **R18+ in Australia**) | none |
| | Contests | None | none |
| | Loot boxes | No | (9+; 16+ in Australia) |
| Age categories | Made for Kids | No | n/a |

Result: **13+**, driven by Infrequent alcohol/drug references and Infrequent realistic violence. Re-answer whenever a content drop adds a new kind of content. The engine has a `gambling` addiction type that no event triggers: if content ever uses it, re-check "Simulated gambling".

### Apple App Privacy ("nutrition label")

App Store Connect requires these answers for every new app and update ([Apple: submitting](https://developer.apple.com/app-store/submitting/)). This table, `ios.privacyManifests` in `app.config.ts`, the Data safety table below, `docs/STORE_LISTING.md` §9 and `docs/PRIVACY_POLICY.md` all describe the same collection; `src/config/__tests__/appConfig.test.ts` fails if this table and the manifest drift apart. Change them together.

What the code does: the app has no account and no analytics SDK (`src/services/analytics.ts` has no sink), and saves stay on the device. **Google Mobile Ads** (with Google's consent SDK) starts only for free players; Google says it collects the IP address, user interactions, diagnostics and device identifiers "for advertising, analytics, and fraud prevention". **RevenueCat** runs for every player at each launch, to check Premium, under an anonymous app user ID it creates. Apple has no "fraud prevention" purpose: its **App functionality** purpose covers "prevent fraud, implement security measures … minimize app crashes", so that is where Google's fraud prevention goes.

| Data type | Linked to the person | Used for tracking | Purposes | Collected by |
| --- | --- | --- | --- | --- |
| Identifiers → Device ID | Yes | **Yes** | Third-party advertising, Analytics, App functionality | Google Mobile Ads (IDFA only after ATT "Allow"; IDFV) |
| Usage data → Advertising data | No | **Yes** | Third-party advertising, Analytics, App functionality | Google Mobile Ads |
| Usage data → Product interaction | No | No | Third-party advertising, Analytics, App functionality | Google Mobile Ads (app launches, taps, video views) |
| Location → Coarse location | No | No | Third-party advertising, Analytics, App functionality | Google Mobile Ads (estimated from the IP address) |
| Diagnostics → Performance data | Yes | No | Third-party advertising, Analytics, App functionality | Google Mobile Ads (launch time, hang rate, energy use; Google calls it "user-associated") |
| Diagnostics → Other diagnostic data | No | No | Third-party advertising, Analytics, App functionality | Google Mobile Ads |
| Diagnostics → Crash data | No | No | Analytics, App functionality | Google Mobile Ads ("non-user related crash logs") |
| Purchases → Purchase history | No | No | App functionality, Analytics | RevenueCat (anonymous app user ID) |

Not collected: contact info, user ID (there is no account; RevenueCat's ID is anonymous), precise location, health, financial info other than purchase history, contacts, user content, browsing or search history. Sources: Google's disclosure guide for the ads SDK ([iOS data disclosure](https://developers.google.com/admob/ios/privacy/data-disclosure); this environment could not open the page, so the categories and quotes come from search snippets of it and of Google's Ad Manager copy **(unverified line by line)**); RevenueCat's own SDK manifest, which declares Purchase history, not linked, not tracking, for App functionality ([PrivacyInfo.xcprivacy](https://github.com/RevenueCat/purchases-ios/blob/main/Sources/PrivacyInfo.xcprivacy), read 2026-10-21), and its guide, which adds Analytics ([RevenueCat: Apple App Privacy](https://www.revenuecat.com/docs/platform-resources/apple-platform-resources/apple-app-privacy)). Declaring more purposes than an SDK uses is allowed; declaring fewer is what gets apps rejected. Before submitting, open the archive's privacy report (Xcode → Organizer → Generate Privacy Report on a Mac, or look in the uploaded build's App Store Connect warnings) and add anything the SDK manifests declare that is missing here, in all five places.

### App Store Connect, other fields

- [ ] Privacy policy URL, support URL and copyright line. `ITSAppUsesNonExemptEncryption` is already `false` (HTTPS only), so no export compliance documents are needed.
- [ ] **In-app purchase:** create `lifeloop_premium` as **Non-Consumable**, at a $4.99 base price (see `docs/PRICING.md`). Give it a localized name and description and a review screenshot of the Premium screen, and **attach it to the 1.0 version** before submitting. Guideline 3.1.1 requires a restore mechanism; it is on the paywall and in Settings ([guidelines](https://developer.apple.com/app-store/review/guidelines/#3.1.1)).
- [ ] **Ads (2.5.18):** ads must suit the age rating (requests are capped at Google's "T" content rating), interstitials need a visible close button (Google's formats have one), people must be able to see why an ad targets them (Google's AdChoices icon), and people must be able to **report an ad** (Settings → Privacy → Report an ad).
- [ ] Accessibility Nutrition Labels are optional ([Apple](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/overview-of-accessibility-nutrition-labels/)). Only claim a feature when every common task works with it.
- [ ] Review notes: in `docs/STORE_LISTING.md` §8. No account is needed; to restore, go to Settings → Premium → Restore purchases, or Restore purchases on the Premium screen.

### Google Play: App content

- [ ] **Ads:** Yes. **App access:** all functionality is available without special access.
- [ ] **Content rating (IARC):** answer as in the Apple table. Expect ESRB **Teen** / PEGI 12-16, with simulated gambling **None**.
- [ ] **Target audience:** 18+, or 16-17 and 18+. **Never select an age group under 13.** That puts the app under the Families policy, which requires Families-certified ad SDKs and a neutral age screen for mixed audiences ([Play Console Help 9867159](https://support.google.com/googleplay/android-developer/answer/9867159)). Avoid 13-15 unless a lawyer agrees: in several EU countries the age of digital consent is 16, and the app does not ask anyone's age **(estimate)**.
- [ ] **Advertising ID:** Yes, for Advertising, Analytics and Fraud prevention. `com.google.android.gms.permission.AD_ID` is in the merged manifest (checked with `expo prebuild`).
- [ ] **Government apps, financial features, health apps, news apps:** none apply. Answer No or None to each.
- [ ] **In-app product:** Play Console → Monetize → One-time products → `lifeloop_premium` (needs a payments profile). Billing Library 8 gives one-time products "purchase options": one "buy" option is enough **(unverified Play Console wording)**.

### Google Play: Data safety

| Question | Answer |
| --- | --- |
| Collects or shares any required user data types? | Yes |
| All user data encrypted in transit? | Yes |
| Way for users to request deletion? | Yes, by email to the support address (we delete the RevenueCat customer record; for ad data we point to Google's controls). No account, so no deletion URL. |

The same data as the Apple table above, in Play's categories. Apple's "Third-party advertising" is Play's "Advertising or marketing"; Google's fraud prevention (Apple: App functionality) is Play's "Fraud prevention, security and compliance". Play has no "free version only" answer: the ads SDK never starts for Premium players, but free players cannot turn it off, so its rows are **Required**.

| Data type | Collected | Shared | Required? | Purposes | Who |
| --- | --- | --- | --- | --- | --- |
| Location → **Approximate location** (estimated from the IP address) | Yes | Yes | Required | Advertising or marketing, Analytics, Fraud prevention, security and compliance | Google Mobile Ads |
| App activity → **App interactions** (app launches, taps, ads seen and tapped) | Yes | Yes | Required | Advertising or marketing, Analytics, Fraud prevention, security and compliance | Google Mobile Ads |
| App info and performance → **Crash logs** | Yes | Yes | Required | Analytics, Fraud prevention, security and compliance | Google Mobile Ads |
| App info and performance → **Diagnostics** (launch time, hangs, energy use) | Yes | Yes | Required | Advertising or marketing, Analytics, Fraud prevention, security and compliance | Google Mobile Ads |
| **Device or other IDs** | Yes | Yes | Required | Advertising or marketing, Analytics, Fraud prevention, security and compliance, App functionality | Google Mobile Ads (advertising ID, app set ID); RevenueCat (anonymous app user ID, App functionality only, not shared) |
| Financial info → **Purchase history** | Yes | No (RevenueCat is our service provider, which Play does not count as sharing) | Optional (only exists if the player buys) | App functionality, Analytics | RevenueCat |

Why: Google says the SDK "automatically collects and shares" the IP address, product interactions, diagnostics and device identifiers for advertising, analytics and fraud prevention ([Google: Play data disclosure](https://developers.google.com/admob/android/privacy/play-data-disclosure)). Play counts location inferred from an IP address as approximate location, and lists identifiers such as a "Firebase installation ID" (like RevenueCat's anonymous app user ID) under Device or other IDs ([Play Console Help 10787469](https://support.google.com/googleplay/android-developer/answer/10787469)). Under-declaring gets listings removed; over-declaring does not.

## 4. Submission

```bash
npx eas-cli@latest submit --platform android --latest   # internal testing track (eas.json)
npx eas-cli@latest submit --platform ios --latest       # TestFlight
```

- [ ] **Android:**
  1. Submit to the internal track; EAS can create an app's first release ([Expo docs](https://github.com/expo/expo/blob/main/docs/pages/submit/android.mdx)). If Google answers "Only releases with status draft may be created on draft app", add `"releaseStatus": "draft"` to the submit profile and roll out by hand **(unverified, from experience)**.
  2. Promote to a **closed** track and add at least 12 testers, kept for 14 days in a row.
  3. Apply for production access with a summary of the testers' feedback.
  4. Release to production, ideally as a staged rollout.
- [ ] **iOS:** internal TestFlight, then external TestFlight (beta review), then submit the version with the IAP attached. Also check the DSA trader status (§0).
- [ ] **After approval:**
  - In AdMob, link the app to its store listing so AdMob can verify `app-ads.txt` and run the readiness review.
  - Check that real ads fill in the US and in one EEA country, and watch crash reports.
  - Apple and Google both need time to index a new app; AdMob may serve limited ads for days.

## 5. Post-launch (first 90 days)

- [ ] Content drops (20-40 events, data only) via `eas update`, without a store review.
- [ ] Keep the "free forever" promise in the listing and in Settings.
- [ ] Re-answer the Apple and IARC questionnaires whenever content categories change.
- [ ] Before each release: re-diff the SKAdNetwork list, re-check this file's §2 table, and bump `version` in `app.config.ts`. Build numbers increment on EAS.

## 6. Upcoming deadlines (watch list)

| Date | What | Action for this app |
| --- | --- | --- |
| Nov 1, 2026 | End of Play's extensions for API 36 and Billing 7 | None. The app already targets API 36 and uses Billing 8.3.0. |
| Feb 1, 2027 | Play blocks updates without 16 KB page support ([source](https://developer.android.com/guide/practices/page-sizes)) | Verify each release (§2). |
| 2027 | Android developer verification goes global ([source](https://developer.android.com/developer-verification)) | Keep the Play Console registration current. |
| **April 2027** | Apple uploads need the **iOS 27 SDK (Xcode 27)** and must target iOS 15+ ([Apple: submitting](https://developer.apple.com/app-store/submitting/)). The iOS 27 SDK requires the UIKit scene lifecycle. | **Upgrade to Expo SDK 58**, which has scene support built in (SDK 58 is already `latest` on npm, 58.0.16). Or stay on SDK 57.0.23+ with `expo-build-properties` → `ios.enableSceneSupport: true`, built on an Xcode 27 image. Test on a device either way. |
| Aug 31, 2027 | Play Billing Library 8 reaches its deadline, so Billing 9 is needed ([table](https://developer.android.com/google/play/billing/deprecation-faq)). Play's target API usually moves up a level each August **(estimate: API 37)**. | Update `react-native-purchases` and the Expo SDK before then. |

## Sources

All sources were checked on 2026-10-21. Pages this environment could not open directly are cited from search results and marked (unverified) where they are used.

- Apple: [Upcoming requirements](https://developer.apple.com/news/upcoming-requirements/) · [Submitting](https://developer.apple.com/app-store/submitting/) · [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) · [Age ratings values and definitions](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/) · [Set an age rating](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating/) · [Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/) · [Third-party SDK requirements](https://developer.apple.com/support/third-party-SDK-requirements/) · [DSA trader requirements](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements/) · [Small Business Program](https://developer.apple.com/app-store/small-business-program/) · [Texas update, Jun 3, 2026](https://developer.apple.com/news/?id=sg176nne) · [Age assurance Q&A](https://developer.apple.com/support/age-assurance/)
- Google: [Target API level](https://developer.android.com/google/play/requirements/target-sdk) · [Billing Library deprecation FAQ](https://developer.android.com/google/play/billing/deprecation-faq) · [16 KB page sizes](https://developer.android.com/guide/practices/page-sizes) · [Developer verification](https://developer.android.com/developer-verification) · [Testing requirement for new personal accounts](https://support.google.com/googleplay/android-developer/answer/14151465) · [Target audience and Families](https://support.google.com/googleplay/android-developer/answer/9867159) · [Data safety help](https://support.google.com/googleplay/android-developer/answer/10787469) · [AdMob Play data disclosure](https://developers.google.com/admob/android/privacy/play-data-disclosure) · [AdMob iOS data disclosure](https://developers.google.com/admob/ios/privacy/data-disclosure) · [AdMob app-ads.txt verification](https://support.google.com/admob/answer/14538460) · [US states messages](https://developers.google.com/admob/ios/privacy/us-iab-support)
- Expo (the docs site was unreachable from this environment, so these are the docs' source files on GitHub): [SDK 57 reference](https://github.com/expo/expo/tree/main/docs/pages/versions/v57.0.0) · [EAS build images](https://github.com/expo/expo/blob/main/docs/pages/build-reference/infrastructure.mdx) · [App versions](https://github.com/expo/expo/blob/main/docs/pages/build-reference/app-versions.mdx) · [EAS environment variables](https://github.com/expo/expo/blob/main/docs/pages/eas/environment-variables/usage.mdx) · [EAS Submit for Android](https://github.com/expo/expo/blob/main/docs/pages/submit/android.mdx) · `expo-build-properties` 57.0.22 type definitions in `node_modules` (`enableSceneSupport`, `privacyManifestAggregationEnabled` default true)
- Libraries: [react-native-google-mobile-ads releases](https://github.com/invertase/react-native-google-mobile-ads/releases) · [its consent guide](https://github.com/invertase/react-native-google-mobile-ads/blob/main/docs/european-user-consent.mdx) · [RevenueCat react-native-purchases releases](https://github.com/RevenueCat/react-native-purchases/releases) · [RevenueCat In-App Purchase Key](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/in-app-purchase-key-configuration) · [RevenueCat Apple App Privacy](https://www.revenuecat.com/docs/platform-resources/apple-platform-resources/apple-app-privacy) · [RevenueCat iOS privacy manifest](https://github.com/RevenueCat/purchases-ios/blob/main/Sources/PrivacyInfo.xcprivacy)
