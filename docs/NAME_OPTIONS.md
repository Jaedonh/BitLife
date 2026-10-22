# App name options

Researched on 2026-10-21 for the text life simulator whose working title is "LifeLoop".

> **This is not legal advice.** It is a first screen for obvious conflicts, done with web search. A clean result here means "nothing turned up in a search index", not "free to use". Before launch, the owner should run (or pay a trademark attorney to run) a formal search: USPTO classes 9, 41 and 42, plus EUIPO, as described in §6.

> **Decision, 2026-10-22: Yearborn.** The owner picked the second choice, and the repo was renamed in one commit following §5: display name, `slug` and `scheme` `yearborn`, bundle ID and package `com.jaedonh.yearborn`, product ID `yearborn_premium`, the store listing, the site, the icon and the screenshots. The save keys stay `lifeloop.*` (the optional row in §5), so web-preview saves still load. The formal search in §6 is still open, including a look at the BORN registration (§2).

## Summary

- **Do not ship as "LifeLoop".** A senior-living software company publishes an app called LifeLoop on both stores, and lifeloop.com is its website. A life-sim game called "Lifeloop Ltd: Life Sim Tycoon" is also on both stores. More details in §1.
- **First choice: Lifesmith** ("Lifesmith: Life Simulator"). **Second choice: Yearborn** ("Yearborn: Life Simulator"). Backup: Everyear. Neither top pick turned up an app, game or trademark of the same name. Neither .com is free, but .game and play-prefixed .com domains are.
- **Rename before anything gets registered.** That means before `eas init`, before the App Store Connect and Play Console app records, and before the in-app purchase product exists. The bundle ID, package name and IAP product ID cannot be changed or reused later (§5). §5 lists every file to change.

## How this was checked, and its limits

- **Stores:** web search restricted to `apps.apple.com` and `play.google.com`, for the exact name and for close spellings. The sandbox could not open the stores, USPTO or EUIPO directly (every direct fetch failed with a DNS error), so these are search-index results. They are not live store searches, and results can differ by country.
- **Web:** general web search, plus Steam and itch.io for games and Instagram, TikTok, X and YouTube for social use.
- **Trademarks:** web search over trademark aggregator sites (Justia Trademarks, TrademarkElite, Gleanmark). These sites mirror USPTO data but can lag behind it. The USPTO search system itself was not queried.
- **Domains:** a read-only registry lookup (Vercel domain availability) on 2026-10-21. Availability changes daily.
- **Social handles:** not verified. Instagram, TikTok and X could not be opened. The notes below only say what a web search showed.

Verdicts:

- **Looks clear:** no app, game or software with the exact name, and no trademark for it, turned up.
- **Risky:** a close match in apps or games, a registered mark in a related class, or a strong use of the word in games.
- **Taken:** an app with the exact name, or a registered mark covering software or entertainment.

## 1. What already uses "LifeLoop"

| What | Evidence | Why it matters |
| --- | --- | --- |
| **LifeLoop**: communications and operations app for senior-living communities, by LifeLoop LLC. It needs a community subscription. | App Store: [id1245703605](https://apps.apple.com/us/app/lifeloop/id1245703605), [developer page](https://apps.apple.com/sk/developer/lifeloop-llc/id1245703604). Google Play: [com.lifeloopproject](https://play.google.com/store/apps/details?id=com.lifeloopproject&hl=en_US). Website: [lifeloop.com](https://lifeloop.com) | An established software brand with the exact name, on both stores. In the US, trademark rights come from use, even without a registration ([USPTO, "Protecting Your Trademark"](https://www.uspto.gov/sites/default/files/trademarks/basics/BasicFacts.pdf)). |
| **Bridge Seniors by LifeLoop**, from the same company | [App Store id1569642687](https://apps.apple.com/us/app/bridge-seniors-by-lifeloop/id1569642687), [Google Play com.lifeloop.bridge](https://play.google.com/store/apps/details?id=com.lifeloop.bridge&hl=en_US) | The company uses the name on more than one app. |
| **Lifeloop Ltd: Life Sim Tycoon**: a free life-sim, roguelike and idle tycoon game (the listing seen in search results credits Oleksandr Orlov) | [App Store id6744413317](https://apps.apple.com/us/app/lifeloop-ltd-life-sim-tycoon/id6744413317), [Google Play com.sync.luximetr.businessclicker](https://play.google.com/store/apps/details?id=com.sync.luximetr.businessclicker&hl=en) | **Same genre, same name.** Players searching for one would find the other. |
| Another App Store listing titled "LifeLoop" | [App Store id6748470715](https://apps.apple.com/us/app/lifeloop/id6748470715) | Seen in search results. Developer and category **not verified**. |
| "Life Loop" (two listings) and "LyfeLoop" on Google Play | [com.VisualsDeveloper.LifeLoop](https://play.google.com/store/apps/details?id=com.VisualsDeveloper.LifeLoop&hl=it), [com.hypernovatech.lifeloop](https://play.google.com/store/apps/details?id=com.hypernovatech.lifeloop&hl=tr), [LyfeLoop](https://play.google.com/store/apps/details?id=lyfeLoop.app.webview) | Seen in search results. What they are is **not verified**. |
| LifeLoop video diary app | [Product Hunt](https://www.producthunt.com/p/lifeloop/lifeloop) | Another software product with the exact name. |
| Smaller uses: a Rust cellular-automaton crate and several game-jam games called "Life Loop" | [lib.rs/crates/lifeloop](https://lib.rs/crates/lifeloop), [greenmonk3.itch.io/life-loop](https://greenmonk3.itch.io/life-loop), [alexunz.itch.io/life-loop](https://alexunz.itch.io/life-loop) | Make the name hard to find in search. |
| Trademark | No LIFELOOP filing turned up in aggregator searches (for example the [Justia](https://trademarks.justia.com/) and [TrademarkElite](https://www.trademarkelite.com/) results returned for "LIFELOOP trademark") | **Unverified.** USPTO was not searched directly. Rights from use (row 1) apply either way. |

**Verdict: taken.** Apple asks for a unique app name (App Review Guideline 2.3.7) and warns against names "too similar to existing app names" ([App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [Creating your product page](https://developer.apple.com/app-store/product-page/)). An app with this exact name, and a life-sim game whose name starts with it, are already on the App Store, so "LifeLoop" fails both points. It also carries trademark risk from the senior-living company.

## 2. Alternative names and what turned up

Each name was searched on its own and with "app" or "game", restricted to each store, then on the general web, on Steam, itch.io and social sites, and on trademark aggregator sites.

| # | Name | Idea | App Store / Google Play | Web, games, trademarks | Verdict |
| --- | --- | --- | --- | --- | --- |
| 1 | **Lifesmith** | You forge a life, one year at a time | No exact match. Nearest: "LifeSmart" lifestyle and health-device apps | No product of that name. A hero in a Warlock 2 fan mod, a player name on TikTok, one YouTube wellness episode. LIFESMART marks cover grills, furniture and fitness equipment, not software | **Looks clear** |
| 2 | **Yearborn** | You are born into a random year, and the era matters | No exact match. Fantasy "-born" games exist (Runeborn, Ruinborn) | No product of that name. Used as a TikTok hashtag in birth-year memes. No YEARBORN mark found. A registered "BORN" mark covers video game software (see notes) | **Looks clear** |
| 3 | **Everyear** | One tap, one year | No exact match. "EveryYear" is a calendar app, one letter away | No product of that name. Search engines treat it as a typo of "every year". A small Instagram account, @everyearservices | **Looks clear (one near-miss)** |
| 4 | Heirline | A family line you carry on | No exact match. Near: "Herline" (safety app) | HEIRLINES is a registered US mark for genealogy research. Sounds like "airline" | **Risky** |
| 5 | Lifelot | Your lot in life | No exact match. "LifeLet" (AI journal app on Google Play) is one letter away | An itch.io game is called "Lot in Life". The name can read as "life lot" (a parking lot) | **Risky** |
| 6 | Storyborn | Born into a story | No exact match | "Storyborn" is a character type printed on most Disney Lorcana character cards, a Disney and Ravensburger card game. An Indie Hackers page uses the slug /storyborn | **Risky** |
| 7 | Lifetale | Every life reads like a story | No exact match. "Lifetales Inc." is an App Store developer, and "OneLifeTale" is on Google Play | Several "LifeTales" memoir projects | **Risky** |
| 8 | Lifespun | A life spun like thread | No exact match. "LifeSpin" (App Store) is one letter away, and **"Lifespan - Life Simulator"** is a same-genre game | No other uses found | **Risky** |

Also screened and dropped:

| Name | Finding | Verdict |
| --- | --- | --- |
| Kinfold | An App Store app called "Kinfold" (family photo sharing) | Taken |
| Lifelore | An App Store app called "LifeLore" (AI memoir), and a Google Play developer called "Lifelore Games" | Taken |
| Lifebound | LIFEBOUND is a registered US mark in class 41 (publishing and training) and class 16 | Taken |
| Everlived | Too close to the "Everlife - Life Simulator" games, which use the word "Everlives" | Risky (same genre) |
| Yearling | A registered YEARLING mark tied to Penguin Random House (a children's book imprint). Also an everyday word (a one-year-old horse), so weak for search | Risky |
| Lifeloom | One letter from LifeLoop. Contains "Loom", the name of Atlassian's video app. "Loom: Life Manager" is on the App Store | Risky |

### Evidence by name

**Lifesmith**
- Stores: a search for "Lifesmith app" on both stores returned only [LifeSmart (App Store, Lifestyle)](https://apps.apple.com/us/app/lifesmart/id717760736), [WordSmith: Life Journal](https://apps.apple.com/us/app/wordsmith-life-journal/id6748769021) and [LifeSmart Health (Google Play)](https://play.google.com/store/apps/details?id=com.lifesmart.health.app&hl=en_US).
- Web: a fan-mod hero name in a [Steam Workshop thread for Warlock 2](https://steamcommunity.com/workshop/filedetails/discussion/493257789/412449508287780127/), a [YouTube "Lifesmith Live" wellness episode](https://www.youtube.com/watch?v=EmSN1YT0wqg), and a player name on TikTok. No company, app or game called Lifesmith turned up.
- Trademarks: a search for "LIFESMITH" returned only LIFESMART marks: [88275414 (grills and furniture)](https://trademark.justia.com/882/75/lifesmart-88275414.html) and [98210699 (fitness equipment)](https://www.trademarkelite.com/trademark/trademark-detail/98210699/LIFESMART).

**Yearborn**
- Stores: a search for "Yearborn app game" returned only other "-born" titles, such as [Runeborn](https://play.google.com/store/apps/details?id=com.goblinzpublishing.runeborn&hl=en) and [Ruinborn](https://play.google.com/store/apps/details?id=com.opmera.ruinborn&hl=en).
- Web and social: no product. Used as a hashtag in birth-year meme videos ([TikTok example](https://www.tiktok.com/@joemanuelsalinas/video/7350720973290917162)).
- Trademarks: no YEARBORN filing turned up. A registered mark [BORN (Justia 79445171)](https://trademarks.justia.com/794/45/born-79445171.html) lists computer and video game software. Many game names end in "-born", but whether that mark matters is a question for the formal search.

**Everyear**
- Stores: the nearest matches are [EveryYear, a calendar app (App Store id593355952)](https://apps.apple.com/us/app/everyyear/id593355952) and [Every Year Calendar (id6468367187)](https://apps.apple.com/us/app/every-year-calendar/id6468367187). Both are calendar apps, not games.
- Web: general search returned "everyday" and "every year" results instead, which suggests word-of-mouth searches will be misspelled. Social: [@everyearservices on Instagram](https://www.instagram.com/everyearservices/) (a small account).
- Trademarks: no EVERYEAR or EVERYYEAR filing turned up.

**Heirline**: [HEIRLINES (Justia 78500967)](https://trademarks.justia.com/785/00/heirlines-78500967.html) is registered and renewed for genealogy research services. Other near-misses: [Herline (Google Play)](https://play.google.com/store/apps/details?id=com.herline&hl=en_US).

**Lifelot**: [LifeLet (Google Play)](https://play.google.com/store/apps/details?id=com.lifelet.app&hl=en) and the itch.io game [Lot in Life](https://hekus.itch.io/lot-in-life).

**Storyborn**: an [explainer on Storyborn, Dreamborn and Floodborn in Disney Lorcana](https://cardgamer.com/games/storyborn-dreamborn-floodborn-disney-lorcana/), [Disney Lorcana (Wikipedia)](https://en.wikipedia.org/wiki/Disney_Lorcana) and [indiehackers.com/storyborn](https://www.indiehackers.com/storyborn). In games, the word already belongs to a Disney product.

**Lifetale**: the [Lifetales Inc. developer page](https://apps.apple.com/ml/developer/lifetales-inc/id994200172) and [OneLifeTale (Google Play)](https://play.google.com/store/apps/details?id=com.onelifetale).

**Lifespun**: [LifeSpin (App Store id6759068809)](https://apps.apple.com/us/app/lifespin/id6759068809) and [Lifespan - Life Simulator (App Store id6758562482)](https://apps.apple.com/us/app/lifespan-life-simulator/id6758562482).

**Dropped names**: [Kinfold](https://apps.apple.com/us/app/kinfold/id6760758433), [LifeLore](https://apps.apple.com/il/app/lifelore/id6777709400), Lifelore Games on [Majestic Dash](https://play.google.com/store/apps/details?id=com.majesticdash.game), [LIFEBOUND 88370223 (class 41)](https://trademarks.justia.com/883/70/lifebound-88370223.html) and [76976237](https://trademark.justia.com/769/76/lifebound-76976237.html), [Everlife - Life Simulator](https://apps.apple.com/us/app/everlife-life-simulator/id1603664467) and [Everlife 2](https://play.google.com/store/apps/details?id=com.playeverlife.generations&hl=en_US), [YEARLING 72365217](https://trademark.justia.com/723/65/yearling-72365217.html), and [Loom: Life Manager](https://apps.apple.com/us/app/loom-life-manager/id6759817760).

## 3. Store title, subtitle and web presence for the viable names

Rules used:
- Both stores cap the app name at 30 characters ([App Review Guidelines 2.3.7](https://developer.apple.com/app-store/review/guidelines/), [Google Play Metadata policy](https://support.google.com/googleplay/android-developer/answer/9898842?hl=en)).
- The Apple subtitle is also capped at 30 ([App Store Connect app information](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information/)).
- Google bans ranking and promotional words and emoji in the title.
- `docs/STORE_LISTING.md` keeps "Life Simulator" after the name and leaves room for a name of up to 14 characters. Every name below is 9 characters or fewer.

A subtitle must not reuse a word from the Apple keyword field. `node store/listing/count.mjs` checks this. Neither subtitle option uses one.

| Name | Store title (both stores) | Apple subtitle: keep the current one | Apple subtitle: alternative | .com | Free on 2026-10-21 | Social (unverified) |
| --- | --- | --- | --- | --- | --- | --- |
| Lifesmith | `Lifesmith: Life Simulator` (25) | `Text RPG of choices and family` (30) | `Text RPG: one tap, one year` (27) | Taken (.app and .io also taken) | lifesmith.game, lifesmithgame.com, playlifesmith.com | No brand account seen |
| Yearborn | `Yearborn: Life Simulator` (24) | `Text RPG of choices and family` (30) | `A text RPG, one year per tap` (28) | Taken | yearborn.app, yearborn.game, yearborn.io, yearborngame.com, playyearborn.com | Meme hashtag on TikTok, no brand account seen |
| Everyear | `Everyear: Life Simulator` (24) | `Text RPG of choices and family` (30) | `One tap, one year. Choose well` (30) | Taken (.app also taken) | everyear.game, everyear.io, everyeargame.com, playeveryear.com | @everyearservices exists |
| Heirline (risky) | `Heirline: Life Simulator` (24) | `Text RPG of choices and family` (30) | `Raise a family line for ages` (28) | Taken (.app also taken) | heirlinegame.com | Not checked |
| Lifelot (risky) | `Lifelot: Life Simulator` (23) | `Text RPG of choices and family` (30) | `Your lot, your choices` (22) | Taken | lifelot.app, lifelotgame.com | Not checked |

Storyborn, Lifetale and Lifespun are not treated as viable, because each has a close match in games or apps (§2).

A taken .com does not block the name. The privacy policy can stay on GitHub Pages (docs/RELEASE_CHECKLIST.md §1), and a `play<name>.com` or `<name>.game` domain can serve as the website. If the owner picks a name, register the domain the same day.

## 4. Recommendation

**1. Lifesmith**

For:
- A made-up word, which is the strongest kind of name for a trademark.
- Spelled the way it sounds.
- "Life" in the name backs up the genre on top of the "Life Simulator" suffix.
- The idea (you shape a life) fits the game.
- No app, game or trademark with this name turned up. The near-misses are LifeSmart apps and LIFESMART marks for grills, furniture and fitness equipment, none of them games.

Against:
- lifesmith.com, .app and .io are all registered by someone. What, if anything, they host is unknown.
- "Smith" can read as a surname.

**2. Yearborn**

For:
- A made-up word, spelled the way it sounds.
- Ties to the core mechanic: you are born into a random year between 1975 and 2010 (docs/GAME_DESIGN.md §4), the era shapes your life, and one tap is one year.
- No app, game or trademark with this name turned up.
- yearborn.app, .game and .io are free.

Against:
- No "life" in the name. The title suffix covers it.
- "-born" is common in fantasy game names.
- A registered BORN mark covers game software (§2). It needs a look in the formal search.
- The word appears as a TikTok meme hashtag.

**Backup: Everyear.** It describes the one-tap-per-year loop well. It is weaker on spelling, though: people who hear it will type "every year", and a calendar app called "EveryYear" exists.

Before choosing, say each name out loud to a few people in the target age group (13 and up) and ask them to spell it. This is a cheap test of whether players can find it by name.

## 5. What changes in the repo if the owner picks one

### Order of work

Rename first, then register things. After a build is uploaded, Apple does not allow the bundle ID to change ([App Store Connect, App information](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information/)). Google Play package names are "unique and permanent" ([Play Console Help](https://support.google.com/googleplay/android-developer/answer/9859152?hl=en-GB)). An in-app purchase product ID cannot be reused, even after the product is deleted ([App Store Connect, In-App Purchase information](https://developer.apple.com/help/app-store-connect/reference/in-app-purchases-and-subscriptions/in-app-purchase-information/)).

1. Run the formal trademark search (§6) and pick the name.
2. Make the code and doc changes below in one commit.
3. Then run `eas init`, create the App Store Connect and Play Console records under the new name, create the IAP with the new product ID, and add the AdMob and RevenueCat apps.

Expo's app config reference describes `slug` as a URL-friendly name that is unique across the Expo account, and `extra.eas.projectId` as a separate ID ([Expo app config reference](https://docs.expo.dev/versions/latest/config/app/)). `eas init` has not run yet (`projectId` is still the `REPLACE_WITH_EAS_PROJECT_ID` placeholder), so changing `slug` now costs nothing. If no `scheme` is set, Expo falls back to the package and bundle ID as deep-link schemes ([Expo linking guide](https://docs.expo.dev/linking/into-your-app/)). This app sets `scheme` explicitly.

### Changes

The examples use "Lifesmith". Use `lifesmith` for slugs and IDs, and swap in "Yearborn" and `yearborn` the same way.

Line numbers are from this branch on 2026-10-21. Other release work is editing `app.config.ts` and its test, so their rows give the field names instead of line numbers. The `grep` under "Checks after the rename" finds every remaining mention.

**App identity (required)**

| File | Where | Now | Change to |
| --- | --- | --- | --- |
| `app.config.ts` | `name` | `'LifeLoop'` in production, `LifeLoop (<variant>)` otherwise | `'Lifesmith'`, and `Lifesmith (<variant>)` |
| `app.config.ts` | `slug` | `'lifeloop'` | `'lifesmith'` |
| `app.config.ts` | `scheme` | `'lifeloop'` | `'lifesmith'` |
| `app.config.ts` | `ios.bundleIdentifier` | `com.jaedonh.lifeloop` (plus `.<variant>` outside production) | `com.jaedonh.lifesmith` (same variant suffix) |
| `app.config.ts` | `android.package` | `com.jaedonh.lifeloop` (plus `.<variant>`) | `com.jaedonh.lifesmith` (same variant suffix) |
| `app.config.ts` | `PLACEHOLDER_VALUES` | The lifeloop privacy URL and support email | Keep equal to the two placeholders in `src/config/legal.ts` |
| `src/config/legal.ts` | lines 11-12 | `PLACEHOLDER_PRIVACY_URL` (`…/lifeloop-privacy/`), `PLACEHOLDER_SUPPORT_EMAIL` (`support@lifeloop.app`) | New placeholders with the new name |
| `src/config/monetization.ts` | line 60 | `PREMIUM_PRODUCT_ID = 'lifeloop_premium'` | `'lifesmith_premium'`, or a name-free ID such as `'premium_lifetime'` that survives any future rename. Keep the RevenueCat entitlement `premium`. |

**Text players see (required)**

| File | Line | What |
| --- | --- | --- |
| `src/app/index.tsx` | 46, 120 | Home title, and "Thank you for supporting LifeLoop" |
| `src/app/life.tsx` | 41 | `LIFELOOP` header label |
| `src/app/premium.tsx` | 49 | `"LifeLoop Premium"` screen title |
| `src/app/settings.tsx` | Privacy section, Support section, footer | Privacy note, "Rate LifeLoop" button, version footer |
| `src/services/ads/report.ts` | `adReportMailto` | `App: LifeLoop …` line in the Report an ad email (and its test, `src/services/__tests__/adReport.test.ts`) |
| `src/app/+not-found.tsx` | 24 | "Back to LifeLoop" |
| `src/services/monetization.ts` | 76 | `PURCHASES_UNAVAILABLE` message |
| `src/components/game/LegacyHeirCard.tsx` | 38 | Accessibility hint "Opens LifeLoop Premium" |
| `src/components/game/legacy.ts` | 140 | Obituary line `'Lived in LifeLoop.'`. Rewrite it rather than swap the name: "Lived in Lifesmith." does not read well. |

**Tests that assert the name (required, or the test suite fails)**

| File | What |
| --- | --- |
| `src/config/__tests__/appConfig.test.ts` | The placeholder privacy URL and support email, the production name, bundle ID and package, and the development and preview names and IDs |
| `src/__tests__/systemsScreens.test.tsx` | Lines 110 and 118 (`PURCHASES_UNAVAILABLE` text) |

**Store and legal documents (required before submission)**

| File | What |
| --- | --- |
| `docs/STORE_LISTING.md` | Change the `**Name:**` line, the app-name field, the first word of the description, the closing line "Life is short. Loop it." (a pun on "Loop", so write a new one), the IAP name "LifeLoop Premium", and the App Review notes. Then run `node store/listing/count.mjs --write` to regenerate `store/listing/*.txt`. Also fix the example in the header comment of `store/listing/count.mjs` (line 13). |
| `docs/PRIVACY_POLICY.md` | Title and every mention of the name in the body |
| `docs/RELEASE_CHECKLIST.md` | The naming item in §0 (mark it done), the product ID `lifeloop_premium` in §0 and §3 (only if the ID changes), and the example site repository `lifeloop-site` in §1 |
| `store/site/` | `index.html` and `support.html` carry the name; `privacy.html` is rebuilt from `docs/PRIVACY_POLICY.md` by `node store/site/tools/build.mjs`. The README's example repository `lifeloop-site` can change too (a new repository means a new `EXPO_PUBLIC_PRIVACY_URL`). |
| `README.md` | Lines 1, 3 and 5 |
| `docs/GAME_DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN_PANEL_SYNTHESIS.md` | Titles and mentions. Not required for release. |

**Icons and art**

| File | What |
| --- | --- |
| `scripts/generate-icons.sh` | Line 8, `APP_NAME`, is used only in the Google Play feature graphic. Set it, then re-run `bash scripts/generate-icons.sh`. This rewrites `assets/images/*` and `store/play-feature-graphic-1024x500.png`. |
| `scripts/generate-icons.sh` | The icon glyph (`∞`, a loop) and `TAGLINE="Live a thousand lives"` fit "LifeLoop". The tagline still works. The glyph is optional to change: an anvil or hammer would suit Lifesmith, a sunrise or calendar Yearborn. This is a design choice, not a requirement. |
| Store screenshots | The Life screen header shows the name (`src/app/life.tsx:41`), so retake any screenshot taken before the rename. |

**Optional: internal names players never see**

| File | Lines | Note |
| --- | --- | --- |
| `src/services/storage.ts` | 8-14 | Save keys `lifeloop.*.v1` |
| `src/store/lifeLedger.ts` | 15 | `lifeloop.ledger.v1` |
| `scripts/store-saves.ts` | `KEYS` block | Must match the two files above |
| `e2e/life-ui.mjs` | 100-102 | Must match the two files above |
| `package.json`, `package-lock.json` | 2 | `"name": "lifeloop"` |

Leaving these as they are is safe and is the simplest option. If they are renamed, rename all of them in the same commit and before the first release. After release, renaming a save key without a migration would lose players' saves.

**Outside the repo (owner)**

- Create the privacy-policy Pages repo under the new name (for example `lifesmith-privacy`). Then set the EAS variables `EXPO_PUBLIC_PRIVACY_URL` and `EXPO_PUBLIC_SUPPORT_EMAIL` (docs/RELEASE_CHECKLIST.md §1).
- Use the new name for the AdMob apps, the RevenueCat project and apps, and the App Store Connect and Play Console records.

**Checks after the rename**

```bash
grep -rIn -i "lifeloop" --exclude-dir=node_modules --exclude-dir=.git .   # only intended leftovers (optional storage keys)
npm run typecheck && npm run lint && npm test
node store/listing/count.mjs
APP_VARIANT=production npx expo config --type public   # with the docs/RELEASE_CHECKLIST.md §1 variables set
```

## 6. Formal clearance before launch (owner)

This document is not legal advice. Before spending money on store listings or marketing:

1. **USPTO Trademark Search** ([tmsearch.uspto.gov](https://tmsearch.uspto.gov/)):
   - Search the exact name, sound-alikes and spelling variants (Lifesmith, LifeSmith, Life Smith, Lifesmyth; Yearborn, Year Born, Yearbourne).
   - Cover class 9 (downloadable game software), class 41 (online game entertainment services) and class 42 (non-downloadable software), which a software search should include ([Gerben Law on software classes](https://www.gerbenlaw.com/?p=81), [an example of a class 9 + 41 game filing](https://www.ipo.gov.uk/t-tmj/tm-journals/2025-031/WO0000001864111.html)).
   - For Yearborn, have the BORN registration weighed (§2).
2. **EUIPO eSearch plus and TMview.** eSearch plus covers EU trade marks. TMview covers about 60 IP offices, including every EU national office, the EUIPO and many offices outside the EU ([EUIPO search tools](https://www.euipo.europa.eu/en/search), [EUIPO availability guidance](https://www.euipo.europa.eu/en/trade-marks/before-applying/availability)). This matters because four of the game's 13 countries are in the EU (Germany, France, Spain, Italy), and the UK is another.
3. **Exact-name search in both stores from a phone,** in the US and at least one other country. Apple requires a unique app name (2.3.7, [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)), so confirm that no app uses the name before creating the App Store Connect record.
4. **Consider a trademark attorney's clearance opinion,** and filing in classes 9 and 41 once the name is chosen. Filing costs and timelines were not researched here.

## Sources

All accessed on 2026-10-21 through web search, unless noted.

- Apple, App Review Guidelines (2.3.7): https://developer.apple.com/app-store/review/guidelines/
- Apple, Creating your product page: https://developer.apple.com/app-store/product-page/
- Apple, App Store Connect, App information (name and subtitle limits, bundle ID lock): https://developer.apple.com/help/app-store-connect/reference/app-information/app-information/
- Apple, App Store Connect, In-App Purchase information (product ID reuse): https://developer.apple.com/help/app-store-connect/reference/in-app-purchases-and-subscriptions/in-app-purchase-information/
- Google, Play Console Metadata policy: https://support.google.com/googleplay/android-developer/answer/9898842?hl=en
- Google, Create and set up your app (package names): https://support.google.com/googleplay/android-developer/answer/9859152?hl=en-GB
- Expo, app config reference: https://docs.expo.dev/versions/latest/config/app/
- Expo, linking into your app: https://docs.expo.dev/linking/into-your-app/
- USPTO, Protecting Your Trademark (rights from use): https://www.uspto.gov/sites/default/files/trademarks/basics/BasicFacts.pdf
- EUIPO search tools: https://www.euipo.europa.eu/en/search
- Store listings, trademark records and web pages: linked inline in §1 and §2.
- Domain availability: Vercel registry lookup, 2026-10-21 (read-only; no domain was reserved).
