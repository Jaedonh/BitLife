# Pricing and monetization recommendation

Prepared 2026-10-21. Anything marked *guess* is my assumption, not data. The research environment could not open apps.apple.com or play.google.com directly, so competitor prices come from search-indexed store listings and the App Pricing Lab tracker. Check them in the stores before you quote them anywhere. Numbers in [brackets] point to the sources at the end.

## Summary

- **Launch Premium at $4.99 (US base price) and keep it there for at least 6-12 months.** That matches the closest competitors' remove-ads price (Another Life and AltLife, both $4.99) and is under BitLife's $7.99 Bitizenship, even though Premium also includes perks [1][3][5].
- **Skip a launch discount.** Hold rare sales at $2.99 alongside big updates, at most 2-3 times a year. Later, consider $5.99 for new buyers.
- **Set lower prices by hand in about 10 lower-income countries** (40-60% of the auto-converted price), and let Apple and Google convert the price everywhere else [12][13].
- **Before launch, enroll in Apple's Small Business Program,** which is not automatic, and confirm your Google Play fee. Both should be 15% on your first $1M [10][11].
- **Keep the current ad cadence for launch.** In the model, interstitials earn about 58% of ad revenue, so change them only after you have measured retention.
- **Later, add at most two products:** a $2.99 one-time "Power Pack" (included free in Premium) and a tip jar. Never add subscriptions, loot boxes, energy timers or pay-per-use items.
- **Year one, realistically:** 100k installs earn about $5k-$38k after store fees (middle case about $15k). 10k installs earn under $4k. 1M installs earn about $47k-$380k. Ads bring in roughly 65-80% of the money.
- **What moves the result most:** install volume first, then the share of US and UK players, retention, and Premium conversion.

## 1. Competitor prices (US App Store)

| Game (developer) | Product | Type | Price | Source, data date |
|---|---|---|---|---|
| BitLife (Candywriter) | Bitizenship (no ads, perks) | one-time | $7.99 | [1] 2026-03-21 |
| | God Mode | one-time | $9.99 | [1] |
| | Bitizenship + God Mode | bundle | $15.99 | [1] |
| | Boss Mode (all job packs) | one-time | $20.99 | [1] |
| | Time Machine | per use | $0.99 | [1] |
| | Expansion / job packs | one-time | about $4.99 each | [2] 2023-24 reviews |
| | Subscription | none found | n/a | [1][2] |
| Another Life (AnotherByte) | Remove Ads Forever | one-time | $4.99 | [3] 2026 |
| | LifePoints | consumable | $0.99-$16.99 | [3] |
| The Life Simulator (Mind Vacation) | Unlock All Content | one-time | $9.99 | [4] 2026-05-08 |
| | Sandbox mode; All Perks | one-time | $2.99 each | [4] |
| | Revive; Starter Pack | consumable | $0.99 | [4] |
| AltLife (Mark Benyei) | No Ads / Premium (permanent) / Ultimate bundle | one-time | $4.99 / $9.99 / $17.99 | [5] about 2024 |
| Life Choices (Unico Studio) | Remove Ads | one-time | $5.99 | [6] undated |
| Life Sim: Real Life Simulator | Remove Ads | one-time | $7.99 | [6] undated |
| Life Simulator: Role Playing | Remove Ads / Premium Bundle | one-time | $2.99 / $4.99 | [6] undated |
| L.I.F.E. Sim | Remove Ads | one-time | $8.99 | [6] undated |
| Idle Life - Simulator (Mamboo) | Remove Ads / Ultimate Bundle | one-time | $9.99 / $19.99 | [6] undated |
| Verdant; InstLife | free | n/a | in-app purchases not verified | [7] |

Across these eight competitors, remove-ads purchases cost $2.99-$9.99, with a median of about $6.99. So $4.99 for ad removal plus perks is on the generous side, which suits a new game with no reviews. The genre's big sellers are power unlocks (God Mode, Unlock All Content) and bundles. I found no subscriptions. For scale, Sensor Tower estimated BitLife's US in-app revenue at over $263K a week in Q1 2025, on about 85K weekly downloads [8]. That is a mature game, not a forecast for this one.

## 2. Benchmarks

| Metric | Figure | Source |
|---|---|---|
| Rewarded eCPM, US | iOS $19.63, Android $16.49 (Q4 2024); iOS $24.39, Android $30.25 (Q2 2024) | [14]; [15] |
| Interstitial eCPM, US | iOS $14.32 (Q4 2024); iOS $23.17, Android $16.15 (Q2 2024) | [14]; [15] |
| Banner eCPM, US | about $0.50-$1.18 | [15][16] |
| Interstitial (video), elsewhere | W. Europe $8-18, Latin America $3-8, SE Asia $2-6 | [17] (vendor, 2026) |
| Rewarded, elsewhere | W. Europe iOS $5-12; Brazil about $1-3; India about $0.30-1.20 | [17][18] (single blogs, unverified) |
| eCPM trend | iOS up 8% or more in every format from Q1 to Q2 2026; India Android down | [19] |
| ARPDAU | ads-only casual $0.01-0.05; hybrid casual $0.15-0.50 | [20] (vendor) |
| Payer conversion | 2-5% of players in typical free-to-play games; no data for remove-ads purchases alone | [21] (vendor) |
| Rewarded engagement | under 15% of DAU is weak, over 30% is strong; casual 36% (2023) | [22] |
| Retention (2025 data, all games) | median D1 about 22%, D7 under 4%, D30 about 0.7%; top 10% D1 about 40% | [23] |
| Session length | median 5-6 min; top games 8-9 min | [24] |
| Apple fee | 15% under the Small Business Program (up to $1M a year); must enroll | [10] |
| Google fee | US, UK, EEA since 2026-06-30: 10% service fee on the first $1M plus 5% billing fee with Play Billing (15% in total). Elsewhere the old 15% tier applies until rollout (Australia 2026-09-30, Japan and Korea 2026-12-31, rest by 2027-09-30) | [11][25] |
| Regional prices | Apple generates prices for 174 storefronts from your base price, adjusted for exchange rates and taxes, and lets you override any storefront. Google converts at exchange rates using local price patterns and supports price experiments | [12][13] |

Most eCPM figures come from ad-mediation vendors and disagree by up to 2x. A game using AdMob alone may earn less (*guess*).

## 3. Recommendation

**Premium price.** Launch at $4.99. Avoid $3.99: I found no evidence that it sells enough extra copies to make up a 20% lower price, and only one close peer charges less. Avoid $6.99: it is defensible next to the median, but it is a hard sell before you have reviews. Revisit after 6-12 months. If at least 1% of installs buy and the perks list has grown, move new buyers to $5.99. A sale is just a temporary price change, so keep sales rare and players won't learn to wait.

**Regional prices.** Make the US Apple's base storefront and set a default USD price on Google Play. Then set prices by hand at about 40-60% of the auto price (roughly $1.99-$2.99 equivalent) in India, Brazil, Indonesia, Mexico, the Philippines, Turkey, Egypt, Vietnam, Pakistan and Nigeria. Both stores convert by exchange rate, not by local income [12][13]. These countries bring many installs but little ad money, so a fair price there is nearly pure gain (*guess*). Apple stops updating storefronts you set by hand, so review them once a year [12].

**Fees, before launch.** Enroll in Apple's Small Business Program [10]. In Play Console, confirm which fee applies to your account and whether you need to opt in [11][25]. RevenueCat is reported to be free below $2,500 of monthly tracked revenue and to charge 1% above that. That comes from a third-party source, so verify it [26].

**Products to add later (optional, fair):**
1. **Power Pack, $2.99, one-time:** edit stats or looks at any time, and rewind a life up to 5 years. These are the genre's proven sellers (God Mode, Time Machine), sold once instead of per use. Consider giving it free to existing Premium owners as goodwill. The paywall lists only what Premium unlocks today and promises no future perks (App Review checks that a purchase delivers what it describes), so this is a choice, not an obligation. Then move Premium to $5.99.
2. **Tip jar ($1.99 / $4.99 / $9.99):** a thank-you plus a cosmetic supporter ribbon. Apple explicitly allows tips through in-app purchase [9].
3. **A cheaper "remove ads only" tier: not now.** Premium already costs what peers charge for ad removal alone, so a $2.99 tier would mostly pull sales away from Premium.

**What not to add.** Subscriptions: Apple requires "ongoing value" [9], which a one-time text sim doesn't provide, and players resent paying monthly for it. Loot boxes: Apple requires published odds [9], and since 2024-09-22 Australia rates games with paid loot boxes M (15+) at minimum [27], which clashes with your Teen rating. Energy timers and pay-per-use items (like BitLife's $0.99 Time Machine) break "one tap per year" and invite bad reviews.

**Ad cadence.** The current policy (GAME_DESIGN §19) is sound: no interstitials in the first 12 age-ups or 90 seconds, then at most 1 every 6 age-ups, at least 150 s apart, and 3 per session at most. In a 7,000-player Deloitte/AdMob study, 1 in 5 had quit a game they liked over a bad ad experience. The worst offenders were hidden close buttons and forced redirects [28]. Suggestions:
- Keep the cap at 3 per session until you have measured D7 retention. Then test 2 against 3 on one platform.
- Use AdMob's blocking controls to block unsuitable ad categories, and report bad creatives.
- Banners earn about 18% of ad revenue in the model. Use Google-optimized refresh (30 s minimum) [29], and drop banners first if reviews complain.
- Put a quiet "Remove ads" link under the banner, with no pop-ups.
- After launch, consider AdMob mediation with 1-2 bidding networks. It needs native SDKs and a new build, and any gain is a *guess*.

## 4. Rough income model (after store fees, before income tax)

| Assumption | Low | Middle | High | Basis |
|---|---|---|---|---|
| Retention D1 / D30 | 22% / 2% | 30% / 4% | 40% / 6% | [23]; genre placement *guess* |
| Active days per install, first 365 days | 4.6 | 8.6 | 12.6 | power-law curve through D1 and D30 |
| Blended eCPM: rewarded / interstitial / banner | $4.0 / $3.3 / $0.23 | $6.0 / $5.0 / $0.38 | $8.1 / $6.7 / $0.55 | section 2 by region |
| Impressions per free DAU: rewarded / interstitial / banner | 0.5 / 1.5 / 6 | 0.75 / 2.2 / 9 | 1.0 / 3.0 / 12 | [22], current policy, 2-3 sessions a day; *guess* |
| Ad revenue per free DAU | $0.008 | $0.019 | $0.035 | fits [20] |
| Premium conversion (share of installs) | 0.5% | 1% | 2% | below [21]; *guess* |
| Net per Premium sale | $3.30 | $3.50 | $3.70 | $4.99 minus 15% = $4.24 in the US, then VAT, regional prices and about 3% refunds (*guess*) |

Other assumptions, all *guesses*: installs arrive evenly over 12 months. The install mix is 30% US/Canada, 15% UK/Western Europe/Australia, 15% Latin America and 40% India/Southeast Asia/other, a plausible mix for an English-only game. Ad money lost when players buy Premium is ignored.

| Year one | 10k installs | 100k installs | 1M installs |
|---|---|---|---|
| Average DAU | 100-240 | 1,000-2,400 | 10,000-24,000 |
| Ad revenue | $300-$3,100 | $3,100-$31,000 | $31,000-$308,000 |
| Premium revenue | $170-$740 | $1,650-$7,400 | $16,500-$74,000 |
| **Total for year one** | **$470-$3,800** (middle $1,500) | **$4,700-$38,000** (middle $15,000) | **$47,000-$382,000** (middle $152,000) |
| Average per month | $40-$320 | $390-$3,200 | $3,900-$32,000 |
| Monthly revenue in month 12 | $45-$420 | $460-$4,200 | $4,600-$42,000 |

Fixed costs are $99 a year for Apple and $25 once for Google. Reaching 100k installs needs steady organic discovery or featuring. I can't predict install volume, and it outweighs every other assumption here.

**Levers (from the model):**
- **Country mix:** raising the US/Canada share from 30% to 50% lifts ad revenue per player about 40%. Dropping it to 15% cuts ad revenue per player about 35%.
- **Retention:** the high curve yields about 2.5x the player-days of the low one. Content depth and generations matter more than any ad setting.
- **Conversion:** each extra 0.5 percentage point is worth about $1,750 per 100k installs. Show the offer at natural moments (after a death, at the generation hand-off) without nagging.
- **eCPM:** a larger iOS share and mediation can raise it (*guess*).

## Sources

All accessed 2026-10-21. Dates in the tables are data or publish dates.

1. App Pricing Lab, BitLife (data 2026-03-21): https://www.apppricinglab.com/app/apple/1374403536 ; App Store: https://apps.apple.com/us/app/bitlife-life-simulator/id1374403536
2. Escapist: https://www.escapistmagazine.com/best-bitlife-packs-amp-add-ons-to-buy/ ; GameSkinny: https://www.gameskinny.com/culture/top-10-best-bitlife-expansions-and-job-packs-worth-buying/ ; Fandom: https://bitlife-life-simulator.fandom.com/f/p/4400000000000071687
3. App Store, Another Life: https://apps.apple.com/us/app/another-life-life-simulator/id1501803368
4. App Pricing Lab, The Life Simulator (data 2026-05-08): https://apppricinglab.com/app/apple/1439862818
5. App Store, AltLife: https://apps.apple.com/us/app/altlife-life-simulator/id1567044511
6. App Pricing Lab, Life Choices: https://www.apppricinglab.com/app/apple/1585419012 ; App Store: https://apps.apple.com/app/id1524045453 , https://apps.apple.com/us/app/life-simulator-role-playing/id1546543821 , https://apps.apple.com/us/app/l-i-f-e-sim-life-simulator/id1623979922 , https://apps.apple.com/app/id6752850512
7. Verdant: https://mwm.ai/apps/verdant-life-simulation/6761405460 ; InstLife: https://apptopia.com/ios/app/1438883182/about
8. Sensor Tower, US simulator games Q1 2025: https://sensortower.com/blog/2025-q1-unified-top-5-simulator%20games-units-us-60416e41241bc16eb8905c2f
9. Apple App Review Guidelines 3.1.1 and 3.1.2(a): https://developer.apple.com/app-store/review/guidelines/
10. Apple Small Business Program: https://developer.apple.com/app-store/small-business-program/
11. Android Developers Blog, 2026-03-04: https://developer.android.com/blog/posts/a-new-era-for-choice-and-openness ; June 2026: https://android-developers.googleblog.com/2026/06/play-expanded-billing.html
12. Apple, set an IAP price: https://developer.apple.com/help/app-store-connect/manage-in-app-purchases/set-a-price-for-an-in-app-purchase/ ; price update notice 2026-08-27: https://developer.apple.com/news/?id=artln8br
13. Play Console Help, prices: https://support.google.com/googleplay/android-developer/answer/6334373 ; price experiments (2023): https://android-developers.googleblog.com/2023/05/price-experiments-in-play-console.html
14. Appodeal eCPM report (Q4 2024 data): https://appodeal.com/wp-content/uploads/2025/03/Appodeal-The-Latest-eCPM-Report-2025.pdf
15. Tenjin x CAS, Q2 2024 (summary): https://gamedevreports.substack.com/p/tenjin-ad-monetization-in-mobile-00b
16. Mistplay: https://business.mistplay.com/resources/mobile-ads-ecpm
17. Playio, 2026 eCPM benchmarks: https://blog.playio.co/mobile-game-ecpm-benchmarks-2026 ; interstitials: https://blog.playio.co/interstitial-ads-mobile-games
18. Udonis: https://www.blog.udonis.co/mobile-marketing/mobile-apps/ecpms
19. Bidlogic, Q2 2026: https://bidlogic.io/2026/07/31/q2-2026-ecpm-growth-interstitial-rewarded-video-and-banner-trends/
20. Game Growth Advisor, 2026: https://gamegrowthadvisor.com/blog/2026-03-17-mobile-game-kpis-benchmarks-2026/ ; Playio ARPDAU: https://blog.playio.co/arpdau-benchmarks-mobile-games
21. Kevuru Games: https://kevurugames.com/blog/game-monetization-statistics-in-app-purchases-ads-and-premium-models/
22. AppLovin, ad viewer rate: https://applovin.com/?p=7802 ; Unity via PocketGamer.biz: https://www.pocketgamer.biz/unity-global-rewarded-ad-engagement-rose-by-32-in-2023
23. GameAnalytics 2026 benchmarks (2025 data): https://www.gameanalytics.com/reports/2026-mobile-pc-gaming-benchmarks
24. GameAnalytics 2025 benchmarks (summary): https://gamedevreports.substack.com/p/gameanalytics-mobile-gaming-benchmarks
25. Play Console Help, lower fees: https://support.google.com/googleplay/android-developer/answer/16954621 ; older fee page: https://support.google.com/googleplay/android-developer/answer/112622
26. CostBench, RevenueCat (verified 2026-04): https://costbench.com/software/subscription-billing/revenuecat/
27. Australian Government, gambling-like content: https://www.infrastructure.gov.au/department/media/news/new-mandatory-minimum-classifications-gambling-games-content
28. Deloitte press release, 2025-06-10: https://www.deloitte.com/us/en/about/press-room/deloitte-improve-mobile-game-advertising.html
29. AdMob Help, banner refresh: https://support.google.com/admob/answer/3245199
