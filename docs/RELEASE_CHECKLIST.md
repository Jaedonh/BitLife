# Release checklist (first store launch)

Work top to bottom. Items marked **(long pole)** take days or weeks of calendar time: start them first.

## 0. Accounts and identities

- [ ] **(long pole)** Google Play developer account ($25 one-time). Personal accounts created after Nov 2023 must run a **closed test with ≥ 12 testers opted in for 14 continuous days** before production access is granted (re-verify the current numbers in Play Console help, answer 14151465, the day you create the account). Recruit testers now.
- [ ] **(long pole)** Apple Developer Program ($99/yr). Identity verification can take days.
- [ ] Expo account; `npm i -g eas-cli && eas login`; `eas init` (writes the real `projectId`; set `EAS_PROJECT_ID` or replace the placeholder in `app.config.ts`). The free plan's monthly build quota is small (assume ~15 iOS builds): iterate with development builds and `eas update`, keep production builds to 1-2 per platform.
- [ ] AdMob account → create the app on both platforms → copy the **App IDs** (`ca-app-pub-…~…`) and create three ad units per platform: anchored banner, interstitial, rewarded. Link the AdMob app to the store listings once they exist (new accounts often serve no fill until then).
- [ ] RevenueCat project → add iOS and Android apps → create entitlement `premium`, product `lifeloop_premium` (non-consumable, one-time) on both stores, an offering `default` with a `lifetime` package → copy the public SDK keys.
- [ ] **(blocking)** Choose the final app name. "LifeLoop" is only a working title and is likely already a US software brand (a senior-living platform of that name exists), so do not create store records under it. Pick 2-3 candidates, search USPTO TESS/TSDR (classes 9 and 41), EUIPO eSearch, and exact-name searches on both stores, then change `name`/`slug`/bundle id/package in `app.config.ts`, the title in `src/app/index.tsx`, `src/app/life.tsx`, `src/app/premium.tsx`, `src/app/settings.tsx`, `scripts/generate-icons.sh` (re-run it), and `docs/STORE_LISTING.md`.

## 1. Secrets and configuration

Set these as EAS environment variables (`eas env:create --scope project --environment production`, visibility **Plain text** or **Sensitive**: all of them end up in the binary anyway, and EAS CLI only loads those two kinds when it evaluates `app.config.ts` locally before a build) or in a local `.env` for `npx expo run:*`:

| Variable | Used by |
| --- | --- |
| `ADMOB_ANDROID_APP_ID`, `ADMOB_IOS_APP_ID` | `app.config.ts` (production only) |
| `EXPO_PUBLIC_ADMOB_ANDROID_BANNER`, `…_INTERSTITIAL`, `…_REWARDED` | `src/config/monetization.ts` |
| `EXPO_PUBLIC_ADMOB_IOS_BANNER`, `…_INTERSTITIAL`, `…_REWARDED` | `src/config/monetization.ts` |
| `EXPO_PUBLIC_RC_IOS_KEY`, `EXPO_PUBLIC_RC_ANDROID_KEY` | `src/config/monetization.ts` |
| `EAS_PROJECT_ID` | `app.config.ts` |

- [ ] Development and preview builds (and Expo Go / web) run without these: Google's **sample** app IDs and **test** ad units (safe, serves test ads), purchases report "unavailable", and the Settings footer shows `· test ads`. A **production** build refuses to evaluate `app.config.ts` until every variable above is set (locally, before any build minutes are spent, and again on the EAS build server), so a store build can never ship sample IDs, test ad units or a paywall that cannot sell. Verify with `APP_VARIANT=production npx expo config --type public` once the variables are in your shell or `.env`.
- [ ] Never click live ads on your own devices (invalid traffic). Register test devices in the AdMob console.
- [ ] Fill `eas.json` → `submit.production.ios.ascAppId` after creating the App Store Connect record, and either keep `google-play-service-account.json` locally (git-ignored, as are `*service-account*.json` and `.env.*`) or upload it with `eas credentials`.
- [ ] Publish `docs/PRIVACY_POLICY.md` (fill in the legal name and email) at a public URL that contains **no third-party trademark**: it is opened from Settings → Privacy policy and entered in both store consoles. Default: a separate GitHub Pages repo named `lifeloop-privacy` whose `index.md` is the policy (repo Settings → Pages → deploy from `main`), served at `https://<user>.github.io/lifeloop-privacy/`. Then set the EAS production variables `EXPO_PUBLIC_PRIVACY_URL` and `EXPO_PUBLIC_SUPPORT_EMAIL` (visibility "Plain text") to the published URL and an inbox you read. A production build refuses to start while either is unset or still the placeholder in `src/config/legal.ts`, and every EAS production build runs `npm run check:privacy` after installing dependencies, which fails until the URL answers HTTP 200 with the policy (a dead in-app policy link is an Apple 5.1.1(i) / Play User Data rejection).

## 2. Builds

```bash
npm ci && npm run typecheck && npm run lint && npm test && npm run build:web && npm run e2e   # all green
npm run check:privacy   # the published privacy policy answers HTTP 200 at PRIVACY_URL
APP_VARIANT=production npx expo config --type public   # with the §1 variables in your shell/.env: fails until all are set
eas build --profile development --platform all   # dev client: test real ads/IAP on devices
eas build --profile production --platform android
eas build --profile production --platform ios
```

- [ ] On a device with the development build: consent form appears (test with AdMob "debug geography" if outside the EEA), ATT prompt appears on iOS, test ads load (banner, interstitial after the grace period, rewarded windfall), purchase flow works with a sandbox tester, **Restore purchases** works after reinstall.
- [ ] Verify 16 KB page-size alignment of the Android build (`zipalign -c -P 16 -v 4 app.apk` or inspect in Android Studio's APK Analyzer) and test on an Android 15/16 emulator image with 16 KB pages.
- [ ] Confirm `targetSdkVersion` is 36 (default in this Expo SDK; do not override lower).

## 3. Store metadata

- [ ] Icons: `assets/images/icon.png` (1024², no alpha) and adaptive layers are generated by `scripts/generate-icons.sh`; Play listing icon `store/play-icon-512.png`; feature graphic `store/play-feature-graphic-1024x500.png`.
- [ ] Screenshots per `docs/STORE_LISTING.md` (keep imagery 4+-appropriate even though the app is 13+/Teen).
- [ ] Copy from `docs/STORE_LISTING.md`; no competitor names anywhere.

### Apple age rating questionnaire (expect **13+**)

| Question | Answer |
| --- | --- |
| Cartoon or fantasy violence | None |
| Realistic violence | Infrequent/Mild (text-only fights, crime) |
| Profanity or crude humor | Infrequent/Mild |
| Mature/suggestive themes | Infrequent/Mild (dating, marriage, pregnancy as facts) |
| Horror/fear themes | None |
| Medical/treatment information | None (no advice; wellness topics = No) |
| Alcohol, tobacco, or drug use or references | Infrequent/Mild (temptation events with consequences) |
| Simulated gambling | None (no casino, lottery or betting features; keep it that way: even Infrequent is R18+ in Australia) |
| Gambling (real money) | No |
| Sexual content or nudity | None |
| Contests | No |
| Loot boxes | No |
| Unrestricted web access | No |
| Messaging / user-generated content / social media capability | No |
| Advertising | Yes |
| In-app controls (parental controls) | No |
| Made for Kids | No |

### Google Play

- [ ] App content → **Ads: Yes**; **Target audience: 18+** (or 16-17 and 18+; never under 13); **Content rating (IARC)**: answer as above → expect ESRB Teen / PEGI 12-16. Keep simulated gambling at None.
- [ ] **Data safety**: Collects data: Yes. Shares data: Yes (advertising partners). Declare: Device or other IDs (advertising ID) – collected & shared – Advertising/analytics; App interactions – collected & shared – Advertising/analytics; Crash logs & diagnostics – collected – Analytics; Purchase history – collected – App functionality; Encryption in transit: Yes; Deletion request: Yes (contact email). `com.google.android.gms.permission.AD_ID` is declared by the tracking-transparency plugin.
- [ ] Government ID verification; public contact email/address shown on the listing for monetised apps.

### App Store Connect

- [ ] **App Privacy** (nutrition label): "Yes, we collect data": Device ID (linked, **tracking**), Advertising Data (**tracking**), Product Interaction, Purchase History (App Functionality; RevenueCat uses an anonymous id, so not linked and not tracking), User ID (linked), Crash Data, Performance Data. Generate Xcode's privacy report from the production archive and reconcile; the iOS privacy manifest in `app.config.ts` mirrors this. No location, contacts, or health data. The 50 SKAdNetwork ids in `app.config.ts` match Google's current list; re-diff before each release.
- [ ] Privacy policy URL; support URL; copyright line; `ITSAppUsesNonExemptEncryption` is already `false`.
- [ ] Create the in-app purchase `lifeloop_premium` (non-consumable), attach it to the version, with a localized display name, description and a review screenshot of the Premium screen.
- [ ] Review notes: "Free game with ads (Google AdMob). One non-consumable IAP removes ads and unlocks perks. No account. Restore purchases: Settings → Restore purchases."

## 4. Submission

```bash
eas submit --platform android --latest   # internal testing track first, then closed → production
eas submit --platform ios --latest       # TestFlight → App Review
```

- [ ] Android: internal test → the 14-day closed test with 12 testers → apply for production access → production.
- [ ] iOS: TestFlight internal → external (beta review) → submit for review.
- [ ] After approval: link the AdMob app to the store listing; verify real ads fill; watch crash reports.

## 5. Post-launch (first 90 days)

- [ ] Bi-weekly content drops (20-40 events, data only) via `eas update` without a store review.
- [ ] Keep the "what is free forever" promise in the listing and Settings.
- [ ] Re-run the IARC/Apple questionnaire whenever content categories change.
