# LifeLoop – Game Design (MVP)

This document describes the game **as implemented** in `src/engine` and `src/data`, with the tuning numbers that are actually in the code, plus the post-MVP roadmap. It was informed by research into BitLife, Verdant, Another Life and Mind Vacation's Life Simulator (see §20) and a design panel; where the panel's proposals differ from what shipped, the roadmap says why.

## 1. Vision and pillars

A text life simulator where **one tap is one year**, every year asks a question, and every life ends with a story worth sharing. Three pillars:

1. **Consequence over grind.** Choices move stats, money, relationships and karma; there are no timers, no energy that regenerates in real time, no content paywall.
2. **A life you can read back.** The journal, the ribbon, the obituary and the graveyard turn a run into a story.
3. **Fair monetization.** Ads are rare and never interrupt a decision; one premium purchase removes them and adds perks; "what is free forever" is published in the listing and in Settings.

Working title "LifeLoop"; Teen / 13+ content rating target.

## 2. Core loop

**Between age-ups** the player can act freely (study, work actions, interact with people, buy things, activities, crimes) limited by per-year caps and a small **energy** budget (1 at ages 0-5, 2 at 6-12, 4 from 13, 3 from 60) that gates social/physical actions so a year is a small budgeting puzzle (Another Life's idea, trimmed). Money and admin actions are free and Age+ is never blocked.

**Age up** (`src/engine/ageUp.ts`) runs these phases in this order:

1. Advance age and year; reset per-year counters and energy.
2. Milestone line (13, 18, 21, 30, 40, 50, 65, 80, 90, 100).
3. Stat drift (§3).
4. Prison year (if imprisoned).
5. Education (§6).
6. Career and side hustle (§7, §8).
7. Assets: value drift, wear, mortgage amortisation (§11).
8. Finance: income, taxes, expenses, debt, bankruptcy (§9).
9. Health: recoveries, new illness roll, addiction drift (§13).
10. NPCs age; relationship decay; NPC deaths and inheritance (§10).
11. Relationship events: break-ups, new friends, new partners (§10).
12. Job listings refresh (from age 14).
13. Mortality roll and the critical-health countdown (§5).
14. If the year was otherwise quiet, one flavour line (so no year is empty).
15. Schedule 0-3 random events (§15) and open the first one as a card.
16. The app shows a one-line **year summary** (stat deltas, cash change) once the year's cards are closed.

A card must be answered before anything else happens. Resolving it may queue follow-ups.

## 3. Stats

| Stat | Range | Start | Yearly drift | Main sources | Main sinks |
| --- | --- | --- | --- | --- | --- |
| Happiness | 0-100 | 50-100 | reverts 15% toward 55, ±3 noise; +1 married, −2 unemployed adult, −5 prison, −1 in debt, −1 anxious trait | spend time, vacations, parties, meditation, promotions, births (+20), marriage (+15) | insults, deaths of relatives (−3..−25), firings (−10), divorce (−15), prison (−15) |
| Health | 0-100 | 80-100 | <30: −1..+2 · 30-49: −2..+1 · 50-69: −3..+1 · 70-84: −4..0 · 85+: −5..−1; +2 recovery when <40 with no severe illness; illness drain capped at −6; addictions ≥40 −2 | gym (+6), jogging (+3), doctor (+4 + cures), diet (+5) | illness, job stress, injuries, parties (−1), crime injuries |
| Smarts | 0-100 | 0-100 | school years +0..+2, adults −1..+1, 65+ −2..0, dementia −3 | school (+1..3/yr), library (+5), study harder (+2), degrees (+3/+4) | age |
| Looks | 0-100 | 0-100 | <20 −1..+3 · 20-34 −2..+1 · 35-54 −3..0 · 55+ −4..−1; −1 when health <30 | gym (+3), salon (+3), surgery (+15, 12% botch −18) | age |
| Money | — | 0 | see §9 | salary, hustles, passive income, inheritance, windfalls | living costs, upkeep, taxes, debt interest |
| Karma (hidden) | 0-100 | 50 | — | compliments (+1), gifts (+1), giving money (+2), volunteering (+4), meditation (+1), kind event choices | insults (−2), crimes (−3..−20), cruel event choices |
| Fame | 0-100 | 0 | −3/yr while not in a fame job | fame-track jobs above the entry rung (job fame × rung per year: actor, musician, athlete, journalist, politician…), hustles at level ≥3 | fading out of the spotlight |

Hidden **potential** caps (Smarts 60-100, Looks 60-100, Health 85-100, raised by traits) stop training from pushing a stat past the character's natural ceiling. Each stat is shown with a coloured bar; 0-100 integer.

## 4. Character generation

Random gender, name from the birth country's name pool (9 pools), city, birth year 1975-2010 (the era is part of the story), zodiac, 0-2 **traits** from 10 (quick learner, charming, iron constitution, lucky, hot-headed, thrifty, creative, athletic, anxious, rebellious), mother (18-42) and usually a father (88%), 0-3 older siblings (35/40/18/7%), family wealth: wealthy 8%, poor 20%. Thirteen birth countries each set currency, salary multiplier (0.1-1.0), cost of living, school ages, drinking age, public healthcare, gambling legality, life expectancy and tax rate.

Custom life (free): name, gender, country. Premium: starting stats and a wealthy family.

## 5. Aging and mortality

Yearly death hazard = base(age) × (78 / country life expectancy)² × health factor + illness/addiction add-ons:

- base: <1: 0.4% · 1-14: 0.03% · 15-24: 0.08% · 25-44: 0.15% · 45-54: 0.4% · 55-64: 0.9% · 65-74: 2% · 75-84: 5% · 85-94: 12% · 95-104: 25% · 105+: 50%
- health factor: ≤10 ×6, <25 ×3.5, <40 ×2, ≥80 ×0.7
- severity-5 illness +12% (treated +4%), severity-4 +4% (treated +1%); addiction ≥60 +1%; prison +0.4%

**Critical countdown:** when health ≤ 8 the doctor warns the player; two years later without recovery the life ends ("complications from X"). Recovering above 8 clears it with a "second chance" line.

Simulated outcomes (`npm test` enforces them): passive play median death ≈ 62, balanced play ≈ 78 (must be ≥ 70), reckless ≈ 55; nobody passes 120.

## 6. Education

Country school start age → primary → middle (11) → high (14) → graduation at the country's high-school end age (17-19). Grade starts at 50 + (Smarts−50)/2 and moves each year by (Smarts−50)/10 ± 5, +10 for Study harder, −8 per Skip class (25% chance of being caught), −3 rebellious, −4 when very unhappy. Graduation needs grade ≥ 30 (honours ≥ 85). Dropping out ends schooling.

University: 25 majors with Smarts thresholds (25-65), 4-5 years, tuition $11-16k/yr (scaled) added to student debt unless on a **scholarship** (60% if grade ≥ 85 and Smarts ≥ 70; 40% if Smarts ≥ 90) or born wealthy. Graduate: medical school, law school, dental school, MBA, master's, PhD with major prerequisites. Student debt is repaid at 10%/yr (min $2k) once out of school.

## 7. Careers

71 job ladders (3-6 rungs) in 13 categories; 6 part-time teen jobs. Each listing rolls a company name and ±8-12% salary. Requirements: education level or specific professional degree, accepted majors, Smarts/Looks/Health minimums, years of experience, no criminal record. Interview success = 65% + (Smarts−50)/200 + (Looks−50)/400, +10% charming, −10% with a record (clamped 15-95%).

Yearly: performance drifts ±7 ± (Smarts−50)/20, −5 when unhappy or unhealthy, −8 with an addiction; **Work harder** +8 once a year; raise 1-5% when performance ≥ 65, capped at 125% of the rung's base pay (only a promotion moves the cap); a part-time job kept past 24 moves to full hours: its pay rises to at least an entry-level full-time wage of $24k and raises can take it to $30k; promotion chance 30% when performance ≥ 72 and 2+ years at the rung; **Ask for a raise** (60%/35%/10% by performance) and **Ask for promotion** (55%/40%/8%) once a year; fired at 50% when performance < 18; 2% random layoff; injury chance = danger/400; stress reduces Happiness/Health each year; fame jobs add fame. Retirement from 60 pays 35% of the salary retired from (the best one, if retired more than once); a retiree who takes a new job is paid that job instead, and the pension resumes when it ends. Prison ends employment.

## 8. Side hustles and investing

Six hustles (streaming, indie apps, craft shop, rideshare – needs a car, tutoring, furniture flipping), levels 0-5. Level-up chance = growth × (0.3 + stat/120) (+15% creative trait on creative hustles); 8% chance to slip a level; income by level ($0 → $18k-180k) ±20%; viral bonus chance 2-6% from level 2; level 5 sets the Hustler ribbon flag.

Investments: savings (2%), index fund (normal 7% ± 15%, clamped −45..+60%), crypto (normal 12% ± 60%, clamped −80..+250%). Invest 25% of cash per tap; withdraw all. Returns accrue to the balance (unrealised until withdrawn) and never move cash on their own.

## 9. Finances and expenses

Income = salary (×2 in a windfall-boost year; 0 in prison; pension when retired) + hustle income − taxes + passive (rent at 3.5-6% of a rented-out home's value; investment returns stay in the investment balance). Tax = gross × country rate × min(1, 0.6 + gross/250k).

Adult expenses: housing $7k (own home) / $2.5k (living with parents, under 24 and earning < $20k) / $9k (renting), plus lifestyle spending of 30% of gross income above $12k (capped at $50k) so a salary alone does not compound into a fortune; −15% thrifty trait (housing, lifestyle and wealth spending); $4k per child under 18; asset upkeep; mortgage payments; student loan repayments; debt: 15% interest, repaid at 20%/yr (min $1k).

Spending responds to the player's situation (constants in `SPENDING`, `src/engine/systems/finance.ts`):

- **Frugality.** While you carry any debt (student loans aside) you spend nothing on lifestyle extras, and until your savings (cash + investments) cover a year of expenses (housing + children + full lifestyle), extras shrink in proportion (half a year saved → half the extras). A worker climbing out of a jobless stretch therefore pays debt down instead of spiralling into it.
- **Wealth effect.** Once your savings (cash + investments − debt) pass $250k, you spend 10% of the excess each year on a richer life, but never more than that year's spare income: savings level off near $250k + 10 × your yearly surplus instead of growing for 40 years, and the wealth effect never eats into savings or creates debt. Houses and other assets are not counted, and investment returns still compound, so investing remains the way to build a fortune.

Measured with `scripts/balance-report.ts --n 300` (all countries / US), balanced play: solvent at 35 96%, millionaire at 60 15.5% / 19.8%, bankrupt 1.3% / 2.0%, deficit work-years 6.3% / 5.4%, Rich ribbon 9.7% / 11.7%; grinder millionaire at 60 18.0% / 22.4%, bankrupt 1.0% / 0.3%. Cash never goes negative: shortfalls become **debt** (also for event costs and fines). Bankruptcy when debt > $250k and exceeds net worth + $250k: non-primary assets and investments are lost, debt cleared, −15 Happiness. All dollar figures are scaled by the country's salary multiplier.

## 10. Relationships

People: parents, step-parents, siblings, children, friends/best friends, lovers, spouses, exes, coworkers, classmates, enemies, pets. Each has relationship 0-100 (lovers/spouses also **love** 0-100), looks/smarts/health, craziness (volatility), occupation, money, and a **memory** (last interaction age, insults, compliments, gifts, fights, years neglected).

Yearly: neglected people (no interaction during the year just played) lose relationship (−2 family, −4 friends/partners) and partners lose 5 love; partners with love < 20 leave (40%/yr); friends under 15 drift away; new friends appear (40%/yr under 25, 20% after, max 4); a new partner appears for singles 16-74 (25% + looks/400); NPCs age and can die (age/health curve); parents/spouses leave inheritances (80% split among children, or 100% to a spouse).

14 interactions with energy/money costs and yearly caps: spend time, conversation (argument chance from craziness and low relationship), compliment, insult (retaliation chance), gift ($150), ask for money, give money ($1k), date ($120), propose ($2.5k; needs love ≥ 55), break up, divorce (30% of cash settlement), try for a baby (55%/yr while fertile), play/walk with pets.

## 11. Assets

23 definitions: 10 vehicles ($200-450k, depreciate 10-14%/yr, condition wears 3-8/yr), 8 homes ($120k-9M, appreciate ~3%/yr, mortgageable at 20% down over 25 years at 6%, rentable), 5 items. Buying adds happiness (2-22). Selling returns 95% of value minus any mortgage. Repairs restore condition. Upkeep is a fraction of price per year. Net worth = cash + assets − mortgages + investments − debts.

## 12. Activities

15 activities in three groups (mind & body, doctor, fun) with age gates, costs, energy, yearly caps, stat effects, karma and a risk roll (e.g. gym 4% injury, surgery 12% botch, vacation 6% food poisoning, party 10% "woke up somewhere unfamiliar"). The doctor costs $400 + per-illness fees (85% cheaper with public healthcare), heals +4 and cures each illness with its cure chance; rehab ($12k) cuts addictions by 40-70.

## 13. Health, illness, addiction

25 illnesses with age-band weights, severity 1-5, chronic flags, cure chances and treatment costs. Yearly new-illness chance 10% (child) / 13% (adult) / 28% (senior) × (1.3 − health/150), ×0.6 iron constitution, ×1.5 with a drug/alcohol addiction. Children with living parents get taken to the doctor automatically. Untreated illnesses drain health (chronic: severity−1; acute: 1.5×severity, capped at 6 total); treated chronic illnesses stop draining. Addictions (alcohol, drugs, gambling) are 0-100 levels set by events; ≥30 they creep up 0-6/yr, below they fade; ≥40 costs −3 happiness, −1 health and, for gambling, $500-4k a year.

## 14. Crime and prison

Seven crimes (shoplift, pickpocket, vandalism, burglary, car theft, online fraud, bank robbery) with success chance (25-75%, +Smarts, +8% rebellious, +5% lucky, −notoriety), payouts, arrest chance on failure, sentences (0-20 years), karma hits and injury chances. Caught without a sentence → fine and a criminal record; convicted → prison: job lost, school ended, no expenses but no income, 15%/yr yard fights, release logged. Records block many jobs and reduce interview odds.

No casino, lottery or drug menus in the MVP: any simulated-gambling feature makes the iOS app R18+ in Australia and 18+ everywhere if "frequent"; alcohol and drugs appear only as event temptations with consequences (see roadmap).

## 15. Random events

Events are data (`src/data/events/*.ts`) validated by `src/engine/events/schema.ts`:

```ts
{ id, category, title, text, minAge, maxAge, weight, once?, cooldown?, conditions?, person?, followUpOnly?,
  choices: [{ id, label, hint?, conditions?, effects: Effect[] }] }
```

Conditions cover stats, money, net worth, income, flags, job/category/level, school stage/grade, marital status, children, people of a kind, country, prison, record, traits, gender, karma, fame, addictions, assets, hustles, retirement, illness count, and whether another event fired. Effects cover stat/money/karma/fame/energy deltas, journal lines, flags, relationship and love deltas, removing or killing the bound person, creating people (friend, lover, child, pet…), death, prison, arrest, illness, cure, addiction, injury, job loss, performance, grade, expulsion, queued follow-ups, counters, weighted `random` outcomes, `chance` branches, asset damage/loss and achievements. Text supports `{{name}} {{person}} {{they}} {{$1000}}`-style placeholders.

Selection per year: ages 0-2: 45% one event; 3-5: 75%; 6-17: 1 + 35% second; 18-69: 92% one, +40% second, +8% third; 70+: 1 + 30% second. Eligible = age range, conditions, `once`/`cooldown` (default 2 years), and a bindable person. Weighted pick without replacement, same-category repeats weighted ×0.25. Dead or departed bound people invalidate a queued event.

Content budget: 12 category files (early childhood, kid years, teen years, young adult, adult life, later life, work, love & family, health, money, crime & prison, friends & strangers), ≥ 300 choice events at launch, plus 50 flavour lines so no year is empty. House style: first person, 15-45 words, choices ≤ 6 words, no dominant choice, Teen rating.

## 16. Death, obituary, ribbons, legacy

On death: cause (illness-driven where one exists; otherwise age-appropriate), net worth, one **ribbon** from 25 by priority (Deadly, Jailbird, Tycoon, Famous, Rich, Academic, Family First, Heartbreaker, Cunning, Scandalous, Fit, Bookworm, Globetrotter, Generous, Loyal, Hustler, Centenarian, Survivor (15+ illnesses), Addict, Lazy, Wasted, Successful, Happy, Miserable, Mediocre; money thresholds scale with the country's salary multiplier), an **obituary** generated from career, education, family, money and convictions, and an epitaph. The tombstone screen shows all of it plus karma. The graveyard keeps the last 200 lives and the ribbon collection; **Clear graveyard** on that screen deletes them all after a confirmation (the privacy policy promises this).

**Legacy:** continue as any living child: the new life starts as that child (their name, gender, age, looks/smarts/health, country and city) in the year of the death, with their share of the estate (80% of the net worth split between the children), the family tree (the dead player becomes a dead parent; the other parent and siblings persist), generation counter and ancestor list. Free play: one hand-off per family line (generation 1 → 2); premium: unlimited. **Second chance:** once per life, death can be undone (rewarded ad, or instantly for premium): health is restored to ~45 and severe illnesses removed.

## 17. Onboarding and settings

A one-line tutorial tip on the first life ("Tap the green + …"). Settings: haptics, karma visibility, premium/restore purchases, privacy policy and ad privacy options (when required), rate/contact, delete current life. Saves persist automatically after every change (debounced), with a schema version and migration hook; corrupt saves are discarded, never crash.

## 18. Content budget (launch)

| Content | Count |
| --- | --- |
| Random events | ≥ 300 choice events + 50 flavour lines |
| Jobs | 71 ladders / ~260 titles |
| Majors / graduate programs | 25 / 6 |
| Activities / crimes | 15 / 7 |
| Assets | 23 |
| Hustles | 6 |
| Illnesses | 25 |
| Interactions | 14 |
| Ribbons | 26 |
| Countries / name pools | 13 / 9 |
| Traits | 10 |

## 19. Monetization

**Ads (free users only), `src/services/ads/policy.ts`:**

- Anchored adaptive banner on the life screen only (hidden for premium).
- Interstitials: never during the first 12 age-ups on the device, never within 90 s of launch, then at most one per 6 age-ups, ≥ 150 s apart, ≤ 3 per session, only on the Age+ tap (never over a choice card, never on launch, never on death).
- Rewarded (opt-in, capped per day): Windfall cash (3/day; max of $800, 25% of salary, 5% of cash), Stat boost (+30 Happiness or Health, or +16 Smarts or Looks; 3/day), Second chance after death (1/day, once per life), New job listings (3/day). Premium users get the same rewards instantly without an ad. Rewarded buttons appear only once the ads SDK has initialised, and a tap that does not pay out (no ad loaded, ad closed early, daily cap reached) says why under the button.
- Consent: UMP form in regulated regions, ATT on iOS, Teen max ad content rating, no child-directed tagging, privacy options in Settings.

**Premium (RevenueCat entitlement `premium`, product `lifeloop_premium`, one-time, $4.99 USD):** no ads, custom starting stats and wealthy start, unlimited generations, instant second chances, all future premium perks. ($4.99 matches Another Life's verified ad-free price and BitLife's launch price; BitLife's current $7.99-9.99 reflects eight years of content we do not yet have.) Restore purchases in Settings and on the paywall.

**What stays free forever:** every event, career, country, relationship, asset, activity, crime, ribbon, one generation hand-off per family line, and all future core content. No consumables, no loot boxes, no subscriptions at launch.

## 20. Blended ideas from the reference games

- **BitLife:** the whole information architecture (four stats, Age+, journal, four tabs, event cards, tombstone, ribbons, generations), job ladders, education path, crime/prison, assets.
- **Verdant:** random birth era and country rule tables; stat decay with hidden potential caps; relationship decay with NPC memory; side hustles; simple investing with market noise; the auto-generated obituary; a visible "no paywall" promise.
- **Another Life:** a small per-year **energy** budget so a year is a budgeting puzzle; explicit, priced stat training (gym, library, tutoring-style activities); the "promotion on request" career ladder.
- **Mind Vacation's Life Simulator:** the low-health **death countdown warning**; side hustles with viral breakouts; a transparent finances panel with last year's income/expenses/taxes; rewarded ad as an income boost rather than a gate.

## 20a. Design-panel decisions

Three independent designs (parity-first, retention-first, systems-first) were scored by two judges; both picked the systems-first design, which is the one built on this engine, and asked for a few grafts. See `DESIGN_PANEL_SYNTHESIS.md` for the full proposal. Adopted now:

- **Year summary toast** after each age-up: stat deltas and cash change, shown after the year's event cards close (never a mandatory modal).
- **Yearly energy** raised to 1 / 2 / 4 / 3 pips (ages 0-5 / 6-12 / 13-59 / 60+) so a year allows 3-4 social or physical actions; money and admin actions stay free and Age+ is never blocked.
- One premium SKU at $4.99 with the existing ids; one free generation hand-off per family line.

Deferred to the roadmap (below): a shared seeded market cycle driving index fund, house values and rental vacancy; birth-era gates and era events; near-miss ribbon hints on the tombstone; 40 achievements; a six-key skills record; a trial event with plead/lawyer choices; the "ad in N years" counter.

## 21. Post-MVP roadmap

1. **Content cadence:** bi-weekly data drops (20-40 events) via EAS Update; 600+ events within 90 days; weekly challenges and daily goals built on the same condition language.
2. **Starting scenarios and perk draws** (Mind Vacation / Life Restart pattern): orphan, heir, immigrant, prodigy.
3. **Casino and mature pack** as a separately rated decision (would move the rating to 18+ in several regions).
4. **Fame track** (social media, endorsements), **business ownership**, **real-estate landlord** depth, pets expansion, emigration, extended family (grandparents, cousins).
5. **Life Points meta-currency** across lives unlocking cosmetic/perk items (Another Life) — only if it does not become a paywall.
6. Share cards (tombstone and "life receipt"), localisation, accessibility pass (VoiceOver labels on bars and buttons).

## 22. Risks

- **Content thinness** is the top failure mode of clones: the validator, registry generator and property tests make content drops cheap; keep the event pool growing.
- **Balance drift:** every tuning change must keep `npm test` green (death ages, net-worth ordering, no empty years).
- **Ad fatigue:** the policy numbers live in `src/config/monetization.ts`; never raise them silently.
- **Rating creep:** adding casino or drug menus changes the age rating; re-run questionnaires.
- **Trademark:** never use competitor names in metadata; choose a final name after a trademark search.
