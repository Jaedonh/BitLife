# Store listing

**Name:** Yearborn

The name was chosen on 2026-10-22 (`docs/NAME_OPTIONS.md`); the formal trademark search is still open (RELEASE_CHECKLIST.md §0). If it ever changes, replace every `Yearborn` in this file, `docs/PRIVACY_POLICY.md` and `store/site/*.html` with the new name, then run `node store/listing/count.mjs --write`. Every field below that uses the name has room for a name of up to 14 characters; a longer one needs the shorter fallback noted under the app name. The closing line "Born once. Make every year count." (description, website) plays on this name, so rewrite it with the name.

Checked against the store rules on 2026-10-21. Never mention another game or its maker by name in any field (Apple 2.3.7, Google Play metadata policy); the script refuses the common ones.

## How the counts work

Each field below is a `text` block, and the block is exactly what you paste. `node store/listing/count.mjs` counts every block against its limit and exits with an error if one is over, uses a banned word, or (for Apple keywords) repeats a word that is already in the name or subtitle. `--write` also updates the `Count:` lines and this table, and writes each field to `store/listing/<field>.txt` for copy and paste. Characters are Unicode characters (a `•` or an emoji is one); fields marked bytes are counted in UTF-8 bytes, as Apple does.

<!-- counts:start -->
| Field | Store | Count | Limit | OK |
| --- | --- | ---: | ---: | --- |
| `app-name` | App Store + Google Play | 24 | 30 | yes |
| `apple-subtitle` | App Store | 30 | 30 | yes |
| `apple-promo` | App Store | 161 | 170 | yes |
| `play-short` | Google Play | 80 | 80 | yes |
| `description` | App Store + Google Play | 3458 | 4000 | yes |
| `apple-keywords` | App Store | 100 | 100 bytes | yes |
| `whats-new` | Google Play (App Store from 1.0.1) | 314 | 500 | yes |
| `iap-name` | App Store + Google Play | 16 | 30 | yes |
| `iap-description-apple` | App Store | 44 | 45 | yes |
| `iap-description-play` | Google Play | 185 | 200 bytes | yes |
| `apple-review-notes` | App Store | 2226 | 4000 bytes | yes |
<!-- counts:end -->

## 1. Name, subtitle and short text

### App name (both stores, ≤ 30)

Google Play allows no emoji and no "free", "best", "#1", "top" or "new" in the name. Keep "Life Simulator" after the name whatever the name becomes: it is the most searched phrase for this genre and the name is the strongest ranking field on both stores. Fallback for a name over 14 characters: `<Name>: Life Sim`.

<!-- field: app-name | limit: 30 | store: App Store + Google Play -->
```text
Yearborn: Life Simulator
```
Count: 24 / 30

### Apple subtitle (≤ 30)

Shown under the name and indexed for search. It carries words the name does not have.

<!-- field: apple-subtitle | limit: 30 | store: App Store -->
```text
Text RPG of choices and family
```
Count: 30 / 30

### Apple promotional text (≤ 170)

Shown above the description. It is not indexed for search, and it can be changed at any time without a new review, so use it for news (a content update, a holiday event).

<!-- field: apple-promo | limit: 170 | store: App Store -->
```text
Over 1,100 hand-written events, 13 countries and eight ways to be born. Live a whole life in minutes, then carry on as your own child. No account. Plays offline.
```
Count: 161 / 170

### Google Play short description (≤ 80)

Indexed for search. Google asks for no emoji, no calls to action ("download now"), no prices or promotions and no ranking claims here.

<!-- field: play-short | limit: 80 | store: Google Play -->
```text
Text life simulator: real choices, a career, a family and a dynasty to carry on.
```
Count: 80 / 80

## 2. Full description (both stores, ≤ 4000)

Plain text (neither store renders HTML or Markdown here). Google indexes it; Apple does not, so on Apple it only has to sell. "Premium" is marked wherever a feature needs the purchase (Apple 2.3.2).

<!-- field: description | limit: 4000 | store: App Store + Google Play -->
```text
Yearborn is a text life simulator. You are born into a random family, in one of 13 countries, in a random year. Every tap ages you one year, and almost every year asks you a question.

Study hard or skip class. Take the safe job or chase the dream. Fall in love, break up, start over. Buy the house, rent it out, sell it to cover your debts. Get caught. Get away with it. Grow old, or don't.

PICK HOW IT STARTS
• Eight ways to be born: an ordinary family, foster care, a big family, a single parent, a family that moves abroad, a child prodigy, a farm, or a wealthy family (Premium).
• Or leave everything to chance.

A WHOLE LIFE IN MINUTES
• One tap is one year. A full life fits in a coffee break.
• 1,147 hand-written events, from your first bath to your 100th birthday, with real choices and real consequences.
• 142 journal lines keep the quiet years personal, so every life reads like a story.
• Four stats to balance: Happiness, Health, Smarts and Looks.

13 COUNTRIES, THE RIGHT ERA
• Be born in the United States, the United Kingdom, Canada, Australia, Germany, France, Spain, Italy, Mexico, Brazil, Japan, India or Nigeria, each with its own money, school ages, taxes, health care and cost of living.
• The era matters: no smartphones or app jobs before they existed, and marks, francs, pesetas and lire before the euro.

SCHOOL, WORK AND SIDE HUSTLES
• School, university and 25 majors, with scholarships and student debt. Then medical, law or dental school, an MBA or a PhD.
• 70+ careers with real ladders: cashier to CEO, resident to surgeon, cadet to police chief.
• Side hustles that fit their time, from wedding videos and pizza delivery to streaming and making apps.

CRIME AND COURT
• Shoplifting to bank robbery. Get caught and you get your day in court: plead guilty, hire a lawyer or defend yourself.
• Teens go to juvenile detention, keep up with school, and have their record sealed at 18.
• Behave in prison and the parole board may let you out early. A new conviction on parole counts double.

LOVE, FAMILY, FRIENDS
• Date, marry, divorce, and have or adopt children. Watch them start school, move out, marry and give you grandchildren.
• Grandparents who spoil you. Coworkers who come with every job.
• Move to a new city or a new country and the friends and family you leave behind keep in touch by phone and letter.
• People remember how you treat them. Neglect someone and they drift away.

MONEY
• Cars, homes and luxuries, with mortgages, upkeep and repairs.
• A savings account, an index fund or something much riskier.
• Debt, taxes and bankruptcy are real. So are rare windfalls.

DIE WELL, THEN KEEP GOING
• Every life ends with a tombstone, a ribbon that sums you up and an obituary written from what you actually did.
• Continue as your child, inherit the fortune (or the debts) and build a family line.
• Collect ribbons in the Graveyard and earn 40 achievements across all your lives.

FAIR BY DESIGN
• Free to play. No timers and nothing to refill: your energy for activities comes back every birthday. No story locked behind a paywall.
• Ads are few and never interrupt a choice. Optional video ads give a cash windfall, a stat boost, new job listings or a second chance.
• Premium is one purchase, not a subscription: no ads, custom starting stats, the wealthy start, unlimited generations and instant second chances.
• No account. Plays offline. Your saves stay on your device.

Born once. Make every year count.
```
Count: 3458 / 4000

## 3. Apple keywords (≤ 100 bytes)

Comma-separated, no spaces. Apple combines these with the words of the name and subtitle, so `sim` + "life" from the name matches "life sim", `offline` + "rpg" from the subtitle matches "offline rpg", and `interactive` + `story` matches "interactive story". Never repeat a word from the name or subtitle, never use another game's name, and skip "game" and "app" (the category already covers them). Keywords can only change with a new app version.

<!-- field: apple-keywords | limit: 100 | unit: bytes | store: App Store -->
```text
sim,simulation,story,career,dynasty,generation,legacy,decision,interactive,virtual,adventure,offline
```
Count: 100 / 100 bytes

## 4. What's New (version 1.0, ≤ 500)

Google Play release notes take 500 characters. App Store Connect does not show What's New for a first version; keep this text for the first update, or use the promotional text for launch news. Release notes are not for promotion or calls to action (Google).

<!-- field: whats-new | limit: 500 | store: Google Play (App Store from 1.0.1) -->
```text
The first release. 1,147 hand-written events, 13 countries with money and gadgets true to their era, eight ways to start a life, 70+ careers, school and university, courts, juvenile detention and parole, grandparents and grandchildren, friends who stay in touch when you move away, generations and 40 achievements.
```
Count: 314 / 500

## 5. Categories and tags

- **App Store:** primary category Games, subcategories **Simulation** and **Role Playing**. Secondary category: Entertainment (optional; it adds little for a game).
- **Google Play:** app type Game, category **Simulation**. In Store settings, pick up to five tags from Google's list; choose the closest to: life simulation, single player, offline, story-driven (or narrative), casual.
- **Age rating:** Apple **13+**, IARC (Google Play) expect **Teen / PEGI 12-16**. See §11.

## 6. ASO notes

- **Name first.** Both stores weigh the app name most. "Life Simulator" stays in the name through any rename. The subtitle (Apple) and the short description (Google) come next.
- **Apple indexes** the name, subtitle and keyword field (and promoted in-app purchases), not the description. A word counts once across them, so this listing spreads its words over the three fields and repeats none (the script checks). Re-check rankings two weeks after launch and swap the weakest keywords at the next version.
- **Google indexes** the name, short description and full description. There is no keyword field. The description says "life simulator" and "text" naturally a few times; do not add keyword lists or repeat phrases to game it (that breaks the metadata policy and can get the listing suspended).
- **No other games' names**, anywhere: not in keywords, description, screenshots, promotional text or ads. Comparisons ("like X") invite trademark complaints and rejections.
- **Promotional text** (Apple) changes without review: update it with each content drop ("40 new events: ...").
- **Screenshots sell more than text.** The first three (§12) show a full journal, an event card with choices and the tombstone. Use Apple's Product Page Optimization and Google's store listing experiments to test icons and the first screenshot after launch.
- **Ratings matter for both stores.** The app already has Settings → Rate Yearborn; a prompt after the first finished life (the tombstone) is the natural moment, at most a few times a year (Apple caps the system prompt at three a year).
- **Localize later, in order:** Spanish (Mexico and Spain), Portuguese (Brazil), German, French, Japanese. They match countries already in the game. A Spanish (Mexico) App Store localization also gets its own keyword field, which the US store indexes too.

## 7. In-app purchase

| | App Store Connect | Google Play Console |
| --- | --- | --- |
| Type | Non-consumable | One-time product (not a subscription) |
| Product ID | `yearborn_premium` | `yearborn_premium` |
| Reference name (Apple, internal, ≤ 64) | `Premium (lifetime)` | — |
| RevenueCat | entitlement `premium`, offering `default`, package `lifetime` | same |
| Price | USD 4.99 base price (regional prices: `docs/PRICING.md`) | USD 4.99 default price (regional prices: `docs/PRICING.md`) |

The product ID is fixed in code (`src/config/monetization.ts`) and cannot be reused once created, so it keeps the working-title prefix even after a rename. Apple asks for a review screenshot of the Premium screen (any size from the web export is fine) and the purchase must be attached to the 1.0 version before submitting.

Display name (Apple ≤ 30; Google Play allows 55 but shows 20 or fewer on one line; one text keeps both stores alike):

<!-- field: iap-name | limit: 30 | store: App Store + Google Play -->
```text
Yearborn Premium
```
Count: 16 / 30

Apple description (≤ 45):

<!-- field: iap-description-apple | limit: 45 | store: App Store -->
```text
No ads, custom starts, unlimited generations
```
Count: 44 / 45

Google Play description (≤ 200 single-byte characters, so it is counted in bytes):

<!-- field: iap-description-play | limit: 200 | unit: bytes | store: Google Play -->
```text
One-time purchase, not a subscription. Removes all ads and adds custom starting stats, the wealthy start, unlimited generations and instant second chances. Every story event stays free.
```
Count: 185 / 200 bytes

### Price

**USD 4.99, one time**: the US base price on the App Store and the default price on Google Play. The reasoning, hand-set prices for lower-income countries, store fees (enroll in Apple's Small Business Program before launch) and income estimates are in `docs/PRICING.md`; this file only holds the listing copy.

## 8. Apple App Review notes (≤ 4000 bytes)

Paste into App Store Connect → the version → App Review Information → Notes. Sign-in required: **No** (leave the demo account empty). Contact: your name, email and phone in international format (+1 …).

<!-- field: apple-review-notes | limit: 4000 | unit: bytes | store: App Store -->
```text
Thank you for reviewing Yearborn, a text-only life simulator.

NO ACCOUNT, NO LOGIN
The game needs no account and no sign-in. It plays offline; saves stay on the device.

IN-APP PURCHASE (sandbox)
One non-consumable product: "Yearborn Premium", product ID yearborn_premium, processed through RevenueCat. To buy it with a sandbox account: Home screen -> "Go Premium" (or Settings -> Premium -> "Go Premium") -> "Unlock Premium".
Premium removes all ads and unlocks:
- custom starting stats and the Wealthy start: Home -> "Custom life";
- unlimited generations: on the tombstone after a death, "Continue the family line" works every time (free players get one hand-off per family line);
- instant second chances: the "Second chance" button on the tombstone, without an ad.

RESTORE PURCHASES
Settings -> Premium -> "Restore purchases", or the "Restore purchases" button under "Unlock Premium" on the Premium screen.

ADS AND CONSENT
Free players see Google AdMob ads: a banner on the life screen, an occasional full-screen ad after tapping "Age +" (never in the first 12 years played or the first 90 seconds after launch, never over a choice), and optional rewarded ads. A new AdMob account may serve no ads during review; the game works the same without them. To report an inappropriate ad (guideline 2.5.18): Settings -> Privacy -> "Report an ad" opens a prefilled email to us; it is shown to free players only, since Premium has no ads.
Where the law requires it, Google's consent form appears at first launch, then the App Tracking Transparency prompt (skipped if the player already refused in the consent form). If tracking is denied, only non-personalized ads are requested. Settings -> Privacy -> "Ad privacy options" reopens the consent choices where they apply.

CONTENT
Text only, rated 13+. Crime, court, prison, alcohol and dating appear as story events with consequences. No gambling, casino or lottery features, no loot boxes, no chat and no user-generated content.

PRIVACY AND SUPPORT
Settings -> Privacy -> "Privacy policy" opens the policy. Settings -> Support -> "Contact" opens an email to us. Settings also lets the player delete the current life and reset achievements; the Graveyard has "Clear graveyard".
```
Count: 2226 / 4000 bytes

## 9. Google Play: App content answers

Consistent with RELEASE_CHECKLIST.md §3. If the two ever disagree, fix both.

- **Privacy policy:** the published `privacy.html` URL (store/site/README.md).
- **App access:** all functionality is available without special access (no login).
- **Ads:** **Yes, my app contains ads** (Google AdMob).
- **Content rating:** IARC questionnaire, answers as in §11 → expect ESRB Teen / PEGI 12-16. Simulated gambling: none.
- **Target audience:** 18 and over (or 16-17 and 18+). Never select an age group under 13 (that would put the app under the Families policy and require certified family ad networks).
- **Advertising ID:** Yes, the app uses the advertising ID, for Advertising or marketing, Analytics, and Fraud prevention, security and compliance (AdMob). The `AD_ID` permission is in the merged manifest (added by the ads SDK and the tracking-transparency plugin).
- **Government, financial, health, news apps:** No to each.

### Data safety and Apple App Privacy

The answers live in **RELEASE_CHECKLIST.md §3** (Apple App Privacy table, then Play Data safety table). They match the iOS privacy manifest in `app.config.ts` (a test fails if the Apple table and the manifest drift) and `docs/PRIVACY_POLICY.md` §2, §3 and §7. In short:

- **Google Mobile Ads** (free version only): device or other IDs, approximate location estimated from the IP address, app and ad interactions, crash logs and diagnostics. Collected and shared, for advertising, analytics and fraud prevention (Apple: Third-party advertising, Analytics, App functionality). On Apple, Device ID and Advertising data are used for tracking (the IDFA only after the player allows tracking); Device ID and Performance data are linked.
- **RevenueCat** (every player, at each launch): an anonymous app user ID (Play: Device or other IDs, App functionality) and purchase history (App functionality, Analytics; not linked, not tracking, not shared: RevenueCat is our service provider).
- **Not collected:** name, email, contacts, photos, files, precise location, messages, health, user ID, or any game content. Data is encrypted in transit. Deletion requests go to the support email (no accounts, so no account-deletion URL).

## 10. URLs and contact (both stores)

| Field | Value |
| --- | --- |
| Privacy policy URL | `https://<github-user>.github.io/<repo>/privacy.html` |
| Support URL (Apple, required) | `https://<github-user>.github.io/<repo>/support.html` |
| Marketing URL (Apple, optional) / Website (Google) | `https://<github-user>.github.io/<repo>/` |
| Support email (public on Google Play) | the inbox you set as `EXPO_PUBLIC_SUPPORT_EMAIL` |
| Copyright (Apple) | `2026 [YOUR LEGAL NAME]` |

How to publish the site and fill the build variables: `store/site/README.md`.

## 11. Content rating answers

Target **Teen (ESRB) / 13+ (Apple)**; full Apple questionnaire in RELEASE_CHECKLIST.md §3. Infrequent/mild: alcohol and drug references, crime, violence (text only, no gore), mature/suggestive themes (dating, marriage). **No simulated gambling** (any amount makes the app R18+ in Australia). Re-answer both questionnaires whenever a content drop adds a new kind of content.

## 12. Screenshots

The final images are in `store/screenshots/` (how they are made and the rules they follow: `store/screenshots/README.md`). They are real captures of the free game: no ads, and the Wealthy start shows its Premium lock (Apple 2.3.2). Captions are short and plain; no other game's name or look.

Upload in this order. The App Store shows the first three in search results.

| # | File | Caption | Shows |
| --- | --- | --- | --- |
| 1 | `01-life.png` | One tap. One year. | A teenager's journal: a full year of events, four stats |
| 2 | `02-event.png` | Every year asks a question. | An event card with three choices |
| 3 | `03-death.png` | Die well. Start a dynasty. | Tombstone, ribbon, obituary and the child who continues the family line |
| 4 | `04-people.png` | Be kind. They remember. | Parents, a daughter, a husband and friends, with relationship bars |
| 5 | `05-work.png` | 70+ careers. Real ladders. | Work & School: a top job and job listings |
| 6 | `06-assets.png` | Build wealth. Or debt. | An index fund, crypto, a car and a house with a mortgage |
| 7 | `07-start.png` | Eight ways to be born. | The eight starting scenarios (Wealthy marked Premium) |
| 8 | `08-achievements.png` | 40 achievements. Every life counts. | Achievements, 11 of 40 unlocked |
| 9 | `09-court.png` | Get caught? Your day in court. | The court card: plead guilty, public defender, lawyer or yourself |

| Store slot | Folder | Size (px) | Upload |
| --- | --- | --- | --- |
| App Store, iPhone 6.3" (medium display with Dynamic Island) | `ios-6.3/` | 1206 × 2622 | **Required.** All nine. |
| App Store, iPhone 6.9" (large display) | `ios-6.9/` | 1320 × 2868 | Optional, shown on the largest iPhones. All nine. |
| App Store, iPad 13" | `ipad-13/` | 2064 × 2752 | **Required** while `supportsTablet` is true. All nine. |
| Google Play, phone | `android-phone/` | 1080 × 1920 | **Required.** At most **8** per device type: `01` to `08` (or swap `09-court` in for `08-achievements`). |
| Google Play, 7" tablet | `android-tablet-7/` | 1440 × 2560 | Optional (needed for tablet featuring). Same eight. |
| Google Play, 10" tablet | `android-tablet-10/` | 1800 × 3200 | Optional. Same eight. |

Apple takes up to 10 per size; its page now names the 6.3" display, not 6.9", as the required iPhone size ([screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/), checked 2026-10-21). Play needs 9:16 at 1080 px or more for promotion; 1080 × 2400 is refused (over Play's 2:1 limit), so the phone set is 1080 × 1920. Also upload the feature graphic `store/play-feature-graphic-1024x500.png` and the Play icon `store/play-icon-512.png`.

## 13. What's free forever

Publish this in the listing (it is in the description) and keep it true in Settings (Settings → Premium says it in these words) and on the Premium screen: every event, career, country, relationship, asset, activity, crime and ribbon, one generation hand-off per family line, and all future core content. Premium only adds no ads, custom starting stats and the wealthy start, unlimited generations and instant second chances.
