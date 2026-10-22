> **Status: design-panel proposal, not the shipped spec.** This document is the synthesized output of a three-design judge panel run before most content existed. `GAME_DESIGN.md` describes what is actually implemented and lists which of these proposals were adopted now and which are on the roadmap. Numbers here may differ from the code; the code wins.

# Yearborn – Final Game Design (MVP)

This is the design the engineering team codes against: the "systems" design grafted with the judged-best ideas from the "retention" and "parity" designs, written against the engine that already exists in `src/engine`, `src/data`, `src/services/ads` and `src/config/monetization.ts`. Every rule is numeric. Where this document and the current `docs/GAME_DESIGN.md` differ, this document wins and replaces it. Money is authored in USD and scaled by `country.salaryMultiplier` (prices, salaries, thresholds) and `country.costOfLiving` (living expenses only). **M** means the country's median salary, `M = 40,000 × salaryMultiplier`, so "25 M" is $1,000,000 in the US and the local equivalent in India.

## 1. Vision and pillars

Yearborn is a text life simulator for iOS and Android where **one tap is one year**. You are born into a random family in one of 13 countries in a random year between 1975 and 2005, grow up, study, work, love, buy, break the law or do not, and die. The journal is the story; the ribbon on the tombstone is the score; your heir is the next chapter.

Four pillars, in priority order:

1. **Systems that talk to each other.** One seeded market cycle moves your index fund, your house price and your rental vacancy together. People remember how you treated them. Hidden potential caps mean the body you were born with matters. Energy pips make each year a small plan instead of a tapping contest.
2. **A life you can read back.** Journal lines carry an impact score, the obituary is assembled from the moments that scored highest, the tombstone shows the ribbon you earned and the two you nearly earned, and the graveyard keeps the last 25 lives.
3. **Fairness you can see.** No roll-based death before 25. No roll in the year you first cross a million. A doctor's warning three years before health kills you. A free Second Chance once per life. A visible "Ad in N years" counter. These promises are shown on a first-launch card and kept by tests.
4. **Honest money.** Ads are rare, predictable and never interrupt a decision. One $4.99 purchase removes them and adds conveniences. Every system, country, job, event and ribbon is free forever.

Content rating target: Teen (Google Play / IARC) and 12+ (Apple). Offline-first, no accounts, no server, no timers, no real-time energy.

## 2. Core loop

### Between age-ups

The Life screen shows: header (name, age, calendar year, flag, job title, cash), the scrolling journal (newest at bottom, sticky year headers "1993 · Age 18"), four stat bars, an energy row of pips, and the tab bar `Occupation/School | Assets | [Age+] | People | Activities`.

**Energy** is the yearly action budget (Another Life's idea, loosened). `energyMax` by age: 0-5 → 2, 6-12 → 4, 13-17 → 5, 18-59 → 6, 60-74 → 5, 75+ → 4; +1 with `athletic`; −1 while Health < 25; fixed at 3 in prison. Energy refills at every age-up and never carries over. Age+ is always allowed; unspent pips are lost.

**1 pip**: every social, study, work-harder, self-care, fun and crime action (§10, §12, §14; burglary, car theft and fraud cost 2, bank robbery 3). **0 pips**: every money and admin action (doctor, salon, surgery, movies, driving test, charity, will, insult, ask/give money, propose, break up, divorce, babies, job applications and asks, retire, hustle start/stop/reinvest, assets, investing, borrowing, skip class, drop out, enrol).

Per-year caps on top of energy (`actionsThisYear`): study harder 1, work harder 1, ask raise 1, ask promotion 1, gym 2, library 2, meditate 2, jog 3, doctor 3, party 3, vacation 1, salon 1, surgery 1, same person 3. Rhythm: 3-6 actions, then Age+; 25-40 seconds per year engaged, 3 seconds for a "just age" player.

### Age+ (`ageUp(state)`), fixed phase order, pure and seeded

1. **Advance.** `age += 1`, `year += 1`, reset `actionsThisYear`, refill energy. Move every `scheduledEvents[]` entry with `dueAge <= age` to the front of `eventQueue`. Write the year header.
2. **Milestones.** Lines and milestone events for this age (13, 18, 21, 30, 40, 50, 65, 80, 90, 100; school start at `country.schoolStartAge`; licence prompt at `country.licenceAge`; graduation choice at `country.highSchoolEndAge`; retirement prompts at 60/65/70).
3. **Stat drift** (§3), clamped to potential caps.
4. **Prison year** if imprisoned (§14).
5. **Education** (§6).
6. **Career** (§7) and **hustle** (§8): performance, promotion/firing/layoff rolls, experience, pension, hustle auto-pip and growth.
7. **Assets** (§11): market-aware value drift, wear, mortgage amortisation, vacancy.
8. **Finance** (§9): advance the market state once, then the itemised ledger; `incomeBoostYears` decrements.
9. **Health** (§13): illness roll and progression, injury healing, addiction drift.
10. **People** (§10): NPCs age, decay for anyone not interacted with, NPC mortality, inheritance.
11. **Relationship events**: spouse-initiated divorce roll, pregnancy resolution, children leaving home at 18, grief events queued.
12. **Job listings** regenerated from age 14 (8 listings, 2 "reach" postings).
13. **Mortality** (§5): fairness guards, roll, critical countdown. If dead: ribbon, obituary, near-miss hints; stop.
14. **Flavour line** if the year wrote only the header (no year is empty).
15. **Random events** (§15): draw k events under quotas, open the first as a card. `ageUp` returns with `pendingEvent` set; `resolveChoice` applies effects, may schedule follow-ups, opens the next card.
16. **Year summary.** `state.yearSummary = { age, statDeltas, cashIn, cashOut, netWorthDelta, highlights[1-3], nextRibbonHint?, adDue }`, rendered as a one-line toast under the header, tap to expand. Never a mandatory modal.

The store layer consults `shouldShowInterstitial` **after the year's last card resolves** (§19). An interstitial never appears while a card is open and never on the Age+ tap itself.

## 3. Stats

Visible stats are 0-100 integers; drift runs in phase 3 and is clamped to potential.

| Stat | Range / start | Yearly drift | Sources | Sinks | Hidden |
| --- | --- | --- | --- | --- | --- |
| Happiness | start `int(50,85)` | `round((55 − h) × 0.15) + int(−3,3)`; +1 spouse rel ≥ 50; +1 primary home; −2 unemployed 22-64 (not enrolled/retired/imprisoned); −5 prison; −1 any debt; −3 debt > 2× income; −2 per addiction ≥ 40; −1 per untreated chronic illness (max −3); −1 `anxious`; −(jobStress/20) employed | spend time +2, vacation +12, party +6, meditate +4, therapy +8, promotion +8, wedding +15/+20/+25, child +15, movies +3 | insult −3, job loss −12, divorce −20, bereavement −(10..25)×rel/100, bankruptcy −20, arrest −8, botched surgery −10 | no |
| Health | start `int(80,100)` ≤ potential; 0 = death | <30 `int(−1,2)`; 30-49 `int(−2,1)`; 50-69 `int(−3,1)`; 70-84 `int(−4,0)`; 85+ `int(−5,−1)`; +1 `iron_constitution`; +1 `athletic`; +2 recovery when < 40 with no severity ≥ 4 illness (+1 after 60); illness drain (§13) capped −6; −2 per addiction ≥ 40 | gym +6, jog +3, doctor +5, diet +5, meditate +2, vacation +2 | illnesses, injuries −2 × points, party −1, job danger, prison −2 | no |
| Smarts | start `clamp(round(0.5 × parentAvg + int(0,40)), 5, 70)`; potential `max(start, int(60,100))` (+5 `quick_learner`) | enrolled < 22 `int(0,2)`; not enrolled < 22 `int(−1,1)`; 22-64 `int(−1,1)`; 65+ `int(−2,0)`; dementia −3; university +2, graduate school +3 | library +5/+3/+1 by age, study harder +1 | age, head injury −3 | no |
| Looks | start `clamp(round(0.5 × parentAvg + int(0,40)), 5, 75)`; potential `max(start, int(60,100))` | <20 `int(−1,3)`; 20-34 `int(−2,1)`; 35-54 `int(−3,0)`; 55+ `int(−4,−1)`; −1 while Health < 30; −2 per addiction ≥ 40 | gym +3, salon +3, diet +3, surgery +15 | age, botch −20, injury ≥ 5 points −3 | no |
| Cash | integer; start 0 | ledger §9 | salary, hustle, rent, pension, investments, inheritance, cashBoost | tax, living, upkeep, mortgage, loans, children, purchases, fines, settlements | no |
| Energy | 0-energyMax pips | refill at age-up; hustle takes 1 | — | 1 per energy action | no |
| Karma | start 50; no regression | — | compliment +1, gift +2, give money +3, meditate +1, volunteer +4, charity +3/+8/+15, honest choices +1..+5 | insult −2, crimes −3..−20 (§14), cruel choices −2..−8 | yes: tombstone bar; luck/bad event weights ×1.5 at > 70 / < 30; parole; funerals; Generous ribbon |
| Potential | smarts 60-100, looks 60-100, health 85-100 | fixed; a capped stat logs "I think I have hit my ceiling" once | — | severity-5 illness untreated: health cap −5/yr | yes |
| Grade | per stage; start `40 + 0.4 × smarts` | `+= round(0.15 × (smarts − grade)) + (studied ? 8 : 0) − 10 × skips + int(−4,4)`; +5 `quick_learner`; −5 `rebellious`; −3 with a part-time job | study harder, tutoring events +6 | skip class, illness severity ≥ 3 −5 | no |
| Performance | 50 on hire (60 with ≥ 3 years' category experience) | `+= round(0.2 × (target − perf)) + (workedHarder ? 12 : 0) + int(−6,6)`, `target = 40 + 0.3 × smarts + 0.1 × (health − 50) − stress/10`; −5 per addiction ≥ 40; −6 with a severity ≥ 3 illness | work harder, experience | refused promotion −5, refused raise −3 | no |
| Relationship (per person) | parents 70-95, siblings 40-90, friend 40, lover 30, coworker 30, child 80 | no interaction: family `−2 − min(yearsNeglected,3)`, partner `−4 − min(yearsNeglected,3)`, friends −4, coworkers −3, children −2; interacted: 0 | §10 | insults, fights, neglect, every conviction −5 to all family | no |
| Love (lover/spouse) | new lover 40 | no interaction −5; one −2; two or more 0 | date +6, vacation together +6, wedding | neglect, affairs (events only) | no |
| Alcohol dependency | chip shown from 20 | −5/yr with no use | party +8, drinking choices +10..+15 | therapy −15, rehab −40, support-group event −20 | no |
| Notoriety | — | −3/yr | +5 per crime, +10 per arrest | — | yes |
| Fame | — | −5/yr without a source | hustle level ≥ 3 (+1..+4), fame-flagged jobs +2 | — | yes: counter only, bar hidden until a fame track ships |
| Skills (reserved) | `Record<SkillId, number>`, 6 keys at 0 | — | none at MVP | none | yes: v1.1 data |

`drugs` and `gambling` stay in `AddictionKind` for save compatibility with no sources (§14).

## 4. Character generation

`createLife(options, seed)`: `rng = mulberry32(seed)`; every later roll uses `state.rng`, so a life replays from (seed, action log).

- **Country**: weighted pick over the 13 shipped rows: US 22, GB 12, CA 8, DE 8, FR 7, AU 6, MX 6, BR 6, JP 6, IN 6, ES 5, IT 5, NG 3. Each row: currency, `salaryMultiplier` (0.1-1.0), `costOfLiving`, new `tuitionMultiplier` (US/CA/AU/GB/JP 1.0, DE/FR/ES/IT 0.3, MX/BR/IN/NG 0.4), new `licenceAge` (16-18), name pool (9 pools × 60 male, 60 female, 60 surnames), 8-12 cities, `schoolStartAge` 5-7, `highSchoolEndAge` 17-19, `drinkingAge` 16-21, `publicHealthcare`, `lifeExpectancy` 70-84, `taxRate` 0.15-0.30.
- **Birth year** `int(1975, 2005)` (narrowed from 1975-2010 so era content spans most lives). Gender 50/50.
- **Era gates** by calendar year: phone ≥ 1998; dating app ≥ 2008 (needs phone); streamer ≥ 2007; app developer ≥ 2009; rideshare ≥ 2012 (needs car); crypto ≥ 2013. `eraRates` by decade: mortgage 1970s 9%, 1980s 11%, 1990s 8%, 2000s 6%, 2010s 4%, 2020s 6%, 2030s+ 5%; savings 7/9/5/3/1/4/3%. Years after 2022 use 2022 rules.
- **Parents**: mother 18-42 at birth, father 20-50; 88% both present, 12% single mother; parent smarts/looks `int(20,90)`; occupations from the jobs table by education none/high_school/bachelor at 45/35/20. Household wealth: poor 20% (`int(0, 8,000)`), middle 72% (`int(5,000, 150,000)`), wealthy 8% (`int(400,000, 3,000,000)`), × salaryMultiplier, held on the parents' `money` (allowance, tuition help, inheritance).
- **Siblings**: 0/1/2/3 older at 35/40/18/7%, ages 1-16.
- **Traits**: each of the 10 shipped traits rolls at 15%, max 2; a wealthy family adds `lucky`. `quick_learner` grade +5/yr, smarts potential +5; `charming` first-meet relationship +10, compliment 95%; `iron_constitution` illness ×0.6, health drift +1, health potential +5; `lucky` luck-tagged weight ×1.5; `hot_headed` argument/fight events ×1.5, insult backfire 50%; `thrifty` living ×0.9; `creative` creative-hustle growth ×1.3, hobby +2; `athletic` energyMax +1, gym +8; `anxious` happiness −1, meditate ×2; `rebellious` crime success +10 points, grade −5/yr.

New Life screen: one card (name, flag, city, birth year, parents with occupations, siblings, trait chips) with **Start**, **Reroll** (free, unlimited) and **Customise**. Custom Life is free for name, gender and country; Plus adds +10 allocatable stat points, a wealthy-family toggle, one chosen trait and a custom seed.

## 5. Aging and mortality

Death has three always-on sources: Health ≤ 0 at the end of any phase, the critical countdown reaching 0, or an event `{ death }` effect (always behind `chance ≤ 0.15`). The mortality roll is a fourth source only from age 25.

**Roll**: `p = base(age) × (78 / lifeExpectancy)² × healthMult + surcharges`; `base`: 25-44 0.0010, 45-54 0.0035, 55-64 0.009, 65-74 0.02, 75-84 0.05, 85-94 0.12, 95-104 0.25, 105+ 0.50; `healthMult`: ≤ 10 ×6, 11-24 ×3.5, 25-39 ×2, 40-79 ×1, ≥ 80 ×0.7; surcharges +0.12 per untreated severity-5 illness (+0.04 treated), +0.04 per untreated severity-4 (+0.01 treated), +0.01 alcohol ≥ 60, +0.004 in prison; cap 0.95.

**Fairness invariants (engine tests)**: no roll below 25; the roll is skipped in any year net worth first crosses 25 M or 250 M; `rollMortality` never runs while `pendingEvent` is set. All three are printed on the first-launch "How Yearborn treats you" card.

**Doctor's warning**: Health ≤ 12 with `criticalYears == 0` sets `criticalYears = 3` and logs the warning; each year still ≤ 12 decrements; 0 means death "from complications of poor health"; Health > 20 clears it. The header shows "Doctor's warning: N years".

**Second Chance**: once per life (`flags.revived`), rewarded ad or free for Plus: Health set to 45, severity ≥ 4 illnesses removed, countdown cleared. Not offered at age ≥ 100.

NPCs: `npcDeathChance(age, health)` < 40 0.001, 40-54 0.004, 55-64 0.009, 65-74 0.02, 75-84 0.05, 85-94 0.12, 95+ 0.30, ×2.5 when NPC health < 30; NPC health drifts `int(−3,1)` after 25.

Targets (CI, 5,000 seeds, US): passive median death age 74-80, 10th percentile ≥ 52; balanced median 78-84; < 2% die before 30; 0.5-3% reach 100.

## 6. Education

Enrolment is automatic at `schoolStartAge`: primary to 11, middle 12-14, high 15 to `highSchoolEndAge − 1`, graduation at `highSchoolEndAge` (US: 6-11, 12-14, 15-17, graduate at 18).

- **Grade** per §3; held back once if grade < 25 in two consecutive high-school years (happiness −5). **Study harder**: 1 pip, once/yr, grade +8, smarts +1, happiness −1. **Skip class**: 0 pips, max 2/yr, grade −10, happiness +3, 25% caught → both parents −8, karma −1. **Drop out** from 16: only `education: 'none'` jobs until the GED activity (18+, $800, one year).
- **Part-time job** in high school (8 rows, from 13-16): grade −3/yr.
- **Graduation choice** (card with eligibility badges): **University** (grade ≥ 50 or smarts ≥ `major.minSmarts`; 4 years, 5 for architecture; tuition `major.tuition` 11,000-16,000 × tuitionMultiplier × salaryMultiplier per year); **Community college** (2 years, 4,000/yr, grade ≥ 30, grants `associate`: +10% salary on `high_school` jobs); **Trade apprenticeship** (2 years, paid 14,000/yr × salaryMultiplier, grants `trade` and `experience.trade = 2`); **Work**. A rejected applicant is offered community college.
- **Funding** in order: scholarship (grade ≥ 85 full, 75-84 half), parents (household cash ≥ 4× total tuition, both parents' relationship ≥ 50, 70% yes), student loan (5%/yr; repaid after leaving at `max(2,000, 10% of balance)`/yr), cash.
- **University**: 1 of the 31 shipped majors; grade continues; smarts +2/yr; Study harder and Party available; dropout event if grade < 30 at year end; `bachelor:<major>` on completion; Dean's list event at ≥ 90.
- **Graduate programmes**: Master's (2 yrs, 15,000/yr, grade ≥ 60, same field), Law (3 yrs, 25,000/yr, grade ≥ 65; political_science, history, english, economics, finance, philosophy), Medicine (4 yrs, 30,000/yr, grade ≥ 70; biology, chemistry, nursing, psychology), Dentistry (4 yrs, 28,000/yr; biology, chemistry). Smarts +3/yr. Stored as `master:<major>`, `doctor:law`, `doctor:medicine`, `doctor:dentistry`.

Targets: an average-smarts (45) child who never studies finishes at grade ~48, so university is a real decision; studying every year from 13 reaches ~80 and a half scholarship. A US bachelor with no help leaves 48,000 of debt; medical school 168,000, repaid in ~12 years on a doctor's salary.

## 7. Careers

**Data**: 73 definitions in `src/data/jobs.ts` (71 shipped plus `pt_dog_walker` 13+ and `pt_stockroom` 16+): 8 part-time, 65 full-time across 12 categories (service 14, health 9, creative 7, office 7, public 6, trade 6, education 4, finance 4, science 4, tech 4, law 3, sports 3), ladders of 1-5 rungs (~250 titles), 40 companies. Each row: `requirements { education, majors, minSmarts, minLooks, minHealth, experience, noRecord, minAge, trait }`, `stress` 10-70, `danger` 0-30, `fame`, `hoursPerWeek`.

**Tiers** (USD entry → top rung): T0 part-time 9,000-13,000; T1 no-degree 22,000-32,000 → 41,000-85,000; T2 trade or experience 30,000-45,000 → 85,000; T3 bachelor 42,000-70,000 → 140,000-260,000; T4 professional doctorate 95,000-180,000 → 380,000-420,000; T5 executive rungs (managing director 450,000) reachable only by promotion.

**Listings**: 8 per year from age 14: 5 the player qualifies for (weighted to the highest qualifying tier), **2 reach postings** missing exactly one requirement (rendered as a red chip, "Needs Smarts 60"), 1 part-time (under 18: all part-time). Posted salary `ladder[0].salary × salaryMultiplier × float(0.9, 1.15)`. One free refresh per year; more via the `reroll` placement (3/day).

**Apply** (0 pips): part-time 100%; full-time `0.70 + (smarts − 50)/500 + (looks − 50)/1000 for service/creative − 0.15 for 3 years after a firing`; `noRecord` jobs refuse a record outright; three rejections in a year queue a pep-talk event.

**Yearly**: performance per §3; `yearsHeld`, `yearsAtLevel`, `experience[category]` +1; cost-of-living raise +2%; automatic promotion 25%/yr when `yearsAtLevel ≥ (level == 0 ? 2 : 3)`, perf ≥ 65 and a rung exists; firing 80% after two years perf < 25, 100% at perf < 15, 100% on conviction (happiness −12); layoff 2%/yr (4% service); stress happiness −(stress/20); injury event at `danger%`.

**Actions**: Work harder (1 pip, once/yr, perf +12, health −1). Ask raise (once/yr): success `0.8 × perf/100`, +4..8%; refusal perf −3. Ask promotion (once/yr): 60% at perf ≥ 75, 35% at 65-74, 5% otherwise, years rule applies; refusal perf −5; success: next rung × salaryMultiplier × (current ÷ posted ratio), happiness +8. Socialise (1 pip, once/yr): 60% new coworker friend at 40. Quit: no penalty. Retire: offered at 60 with `totalYearsWorked ≥ 20` (again at 65, 70); pension `min(0.60, 0.015 × yearsWorked) × final salary`/yr for life; a new job suspends it.

Target: a study-and-work-harder policy reaches rung 3 of a bachelor career by ~32 and the top rung by ~45 (CI: balanced median `promotions ≥ 2`).

## 8. Side income: hustles and the small business

One active hustle at a time. Starting costs `setupCost × salaryMultiplier` and 0 pips; the hustle **auto-consumes 1 pip at every age-up**; with no pip left the growth roll is skipped and income is ×0.7 ("stagnated" chip). Level 0-5. Growth: `chance = growth × (drivingStat/100) × traitBonus` → +1 level. Income `incomeByLevel[level] × salaryMultiplier × float(0.8, 1.2)`, taxed with salary. Viral `viralChance`/yr → `viralBonus`, fame +10. Decline: driving stat < 30 → 20%/yr lose a level. Stopping keeps the level in `flags` for 2 years (restart at level − 1). Cap: `incomeByLevel[5] ≤ 1.2 × top rung of the related job category`.

| Hustle | Min age / era | Stat | Setup | Income by level (USD) | Growth |
| --- | --- | --- | --- | --- | --- |
| Streaming channel | 13 / ≥ 2007, phone | looks | 0 | 0 / 600 / 3k / 12k / 45k / 160k | 0.45 |
| Indie app developer | 15 / ≥ 2009 | smarts | 0 | 0 / 800 / 4k / 15k / 50k / 180k | 0.40 |
| Craft shop | 14 | happiness | 300 | 0 / 500 / 2.5k / 8k / 20k / 45k | 0.50 |
| Rideshare driving | 21 / ≥ 2012, car + licence | health | 0 | 0 / 4k / 8k / 12k / 15k / 18k | 0.70 |
| Private tutoring | 16, smarts ≥ 55 | smarts | 0 | 0 / 2k / 5k / 9k / 14k / 20k | 0.60 |
| Flipping furniture | 16 | health | 500 | 0 / 1.5k / 4k / 8k / 15k / 25k | 0.55 |
| Market stall | 16 | happiness | 1,000 | 0 / 2k / 6k / 12k / 22k / 40k | 0.50 |
| Small business | 21, cash ≥ 25,000 | smarts | 25,000 | 0 / 6k / 15k / 35k / 70k / 120k | 0.50 |

The **small business** (parity's graft, trimmed) adds one action, `reinvestHustle`: pay `20,000 × salaryMultiplier` for an immediate +1 level (once/yr, max 5), and one risk: a 5%/yr **bust** event (level −2, cash −12,500 × salaryMultiplier; borrow and rebuild, or close). Selling returns `setupCost × 0.8 × level/5`. Two bespoke events per hustle (16) live in the pool.

## 9. Finances and expenses

Phase 8 writes `finances.lastYear` as an itemised ledger (every income and expense line), shown as the "Last year" card on the Assets tab: the fix for "money disappears".

- **Income**: salary + hustle + pension; passive = rent + investment returns. **Tax** `gross × taxRate × min(1, 0.6 + gross/250,000)`.
- **Expenses** (× costOfLiving): living 7,000 with an owned primary home; 2,500 while living with parents (age < 24, gross < 20,000 × salaryMultiplier, a parent alive); otherwise `9,000 + min(12,000, 8% of gross)`; children under 18 at home 3,000 each; `thrifty` ×0.9; asset upkeep; mortgage payments; student loan `max(2,000, 10%)`; diet 600.
- **Allowance** ages 6-17: `parentWealthTier × 120`/yr (poor 1, middle 2, wealthy 5).
- **Debt**: negative cash at year end converts to `finances.debt`; interest 12%/yr; automatic payment `max(1,000, 20%)`. **Borrow** (new action): up to 2× last year's gross, one loan open. **Debt collectors** event at debt > 60,000 × salaryMultiplier with no income. **Bankruptcy** when debt > 6 M and debt > net worth + 6 M: non-primary assets sold at 60%, investments liquidated, debt cleared, happiness −20, `bankrupt` blocks mortgages and finance/law jobs for 5 years.
- **Investments** (0 pips, min 100): **Savings** at `eraRates.savings`; **Index fund** on the life's **market cycle** `finances.marketState ∈ {bull, flat, bear}` (starts `flat`; transitions bull→bull 0.65 / flat 0.25 / bear 0.10; flat→bull 0.40 / flat 0.40 / bear 0.20; bear→bull 0.35 / flat 0.45 / bear 0.20; returns bull `+12% ± 6`, flat `+3% ± 5`, bear `−18% ± 8`); the same state moves house values (bear −5%) and vacancy (bear ×2) and gates finance events. **Crypto** (year ≥ 2013): yearly return from {−60%, −30%, 0, +40%, +120%, +300%} at weights 20/25/15/20/15/5. Realised gains feed the Investor ribbon.
- **Net worth** = cash + investments + assets − debt − mortgages − student debt. Thresholds in M keep Rich reachable in Lagos and Tokyo alike.
- **Inheritance**: on a parent's death, 50% of their money split equally among the player and siblings; a parent with relationship < 20 or a grudge leaves the player nothing.

Targets: index ≈ 5.5%/yr expected, worst-decade drawdown ≈ 35%; crypto ≈ +19% expected with a 45% chance of a losing year. A US office career investing 20% of salary from 25 retires at 65 with ≈ 1.1 M; doing nothing ≈ 150 k. CI: median net worth at 40 between 50 k and 400 k (US), balanced beats passive 3-8× at 65, bankruptcies < 8%.

## 10. Relationships

Each `Person` has `relationship`, optional `love`, `craziness` (argument volatility only) and `memory { lastInteractionAge, insults, compliments, gifts, fights, yearsNeglected, asks }` (`asks` is new). Decay per §3.

**Grudge** (derived): `relationship < 25 && (fights ≥ 2 || insults − compliments ≥ 3)`. A grudge holder refuses money (0%), refuses gifts, uses the grudge snippet pool, shows "Holds a grudge", can fire `fs_grudge_reunion`, and as a parent leaves nothing. **Favour**: `gifts + moneyGiven ≥ 3` → +10 points on money asks and "Thinks you are generous".

**16 interactions** (pips · effect): Spend time (1 · rel +int(4,8), happiness +2); Conversation (1 · 1 of 60 snippets by occupation/age/grudge; +int(2,6); 10% awkward −3); Compliment (1 · 85% rel +4 and karma +1, 95% `charming`, 50% when insults > compliments); Insult (0 · rel −10, karma −2; 30% insult back happiness −3; craziness > 70 → 20% fight, injury 2); Gift (1 · $50/$500/$5,000 → +4/+8/+14; refused below rel 15); Ask for money (0 · parents/spouse/friends, `p = 0.7 × rel/100` +0.1 favour, 0 with grudge; `int(2,5)%` of their money; −2 rel per ask; 3 asks without giving back −10); Give money (0 · rel +6, karma +3); Apologise (1 · rel < 40 only: 70% +8 and clears the grudge if fights ≤ 3, else −2); Date (1 · $60, love +6, rel +4); Propose (0 · love ≥ 60, rel ≥ 60, both ≥ 18; `p = love/100` +0.05/+0.10/+0.15 by ring; prenup accepted 60% else love −10; refusal rel −10); Break up (0 · happiness −8); Divorce (0 · settlement 50% of net worth without prenup; happiness −20; ex at rel 20); Try for a baby (0 · married or partner ≥ 2 years; 70% if the mother < 40, 35% at 40-45; once/yr; max 6; birth next year, happiness +15, child stats = parents' average ± 15); Adopt (0 · 18+, $15,000, child 0-6, 70% approval); Play with (1 · child < 13: rel +6, happiness +3, child smarts +1); Spend time with family (1 · every alive parent/sibling/spouse/child +3, happiness +3; **never ad-gated, tested**).

**Meeting people**: Date (Activities › Love, 1 pip, $50, from `licenceAge`): 3 candidates ±6 years, looks `normal(yourLooks, 15)`, acceptance `0.5 + (yourLooks − theirLooks)/200 + (charming ? 0.1 : 0)`; Dating app (18+, year ≥ 2008, phone, $100, candidates +10 looks); Socialise; school, childhood and party events. One lover at a time; friends capped at 8 (the most neglected is dropped); best friend after rel ≥ 80 for 3 years.

**Marriage**: venues $2,000 / $15,000 / $60,000 → happiness +15/+20/+25, love +0/+5/+10; relatives with rel ≥ 40 attend; spouse income joins the household. Spouse-initiated divorce: love < 25 two consecutive years → 40%/yr. Affairs are events only (karma −5; 35% discovered → love −40), abstract.

**Children** grow through 20 child-bound events, leave home at 18, remain interactable and are the heirs. **NPC death**: grief happiness −(10..25) × rel/100; funeral event with a "Give the eulogy (Smarts 40)" check.

Targets: three years of neglect take spouse love 80 → ~62; two dates a year hold it. Divorce under neutral play ≈ 18% per marriage over 30 years; balanced lives average 1.3 marriages and 1.8 children.

## 11. Assets

Prices `basePrice × salaryMultiplier`. 32 definitions: 14 houses, 12 vehicles, 6 items.

- **Houses** (base): trailer 60k, studio 120k, condo 260k, cottage 320k, townhouse 380k, suburban 450k, family home 520k, loft 650k, farmhouse 750k, beach house 900k, villa 1.6M, penthouse 2.8M, mansion 5M, estate 12M. Condition starts `int(60,100)`, −3/yr; below 40 value ×0.85 and repair events ×2; **Repair** 2% of value → +25. Upkeep 2%/yr plus property tax 0.8%. **Appreciation** `+3% ± 4` plus market (bear −5%), **0% real growth once value > 10 M** (the anti-"housing outruns wages" rule). **Mortgage** 20% down, 25-year annuity at `eraRates.mortgage`, only if the yearly payment ≤ 35% of last year's gross and not bankrupt; two years of negative cash → foreclosure event. **Primary**: no rent line, happiness +1/yr. **Rent out** (non-primary): `rentYield` 5.5-6% of value, vacancy 10%/yr (20% in bear), condition −5 extra, 6 tenant events. **Sell** 94% minus mortgage.
- **Vehicles**: bicycle 200, scooter 2.5k, old hatchback 4.5k, motorcycle 9k, sedan 24k, van 30k, pickup 38k, electric (≥ 2012) 46k, luxury sedan 95k, classic (+3%/yr) 120k, sports car 180k, supercar 450k. Licence required (`licenceAge`; test $200, pass `0.6 + smarts/250`). Depreciation 10-14%/yr, condition −8/yr, breakdown below 30 (repair 10%), upkeep 5-15%, purchase happiness +2..+18.
- **Items**: phone 800 (≥ 1998; dating app and streaming), rings 500 / 5,000 / 25,000, piano 12,000 (6 creative hobby events), boat 80,000 (licence; happiness +2/yr; upkeep 6%). Items depreciate 10%/yr.

Assets tab: ledger card; Money (cash, net worth, investments with Add/Withdraw, Borrow, Pay debt, "Markets: bull/flat/bear" chip); Owned list with condition bars and row actions (Set as home, Rent out/Evict, Repair, Sell); **Shop** with price, yearly cost and Buy / Mortgage (payment shown before confirming).

## 12. Activities

18 rows (15 shipped plus driving test, charity, will). Gates: 6+ library, movies; 8+ jog; 10+ meditate; 12+ gym, volunteer; 14+ diet, salon, therapy; 16+ rehab; `licenceAge` driving test; `drinkingAge` party; 18+ the rest. No "end life" option exists.

| Activity | Pips · cost · cap/yr | Effect |
| --- | --- | --- |
| Gym | 1 · $40 · 2 | Health +6, Looks +3, Happiness +1; 4% pulled muscle (Health −6, injury 1); `athletic` +8 |
| Library | 1 · free · 2 | Smarts +5 (< 25), +3 (25-59), +1 (60+); Happiness +1 |
| Meditate | 1 · free · 2 | Happiness +4, Health +2, Karma +1; ×2 `anxious` |
| Jog | 1 · free · 3 | Health +3, Looks +1, Happiness +1 |
| Diet | 1 · $600 · 1 | Health +5, Looks +3, Happiness −2 |
| Salon | 0 · $80 · 1 | Looks +3 |
| Plastic surgery | 0 · $8,000 · 1 | 85% Looks +15 (to cap); 12% +4; 3% botch Looks −20, Health −10, Happiness −10 |
| Doctor | 0 · 400 × treatCost (free with public healthcare) · 3 | Health +5; cures at `cureChance`; chronic drain halved; injuries −3 |
| Therapy | 1 · $150 · 2 | Happiness +8, alcohol −15; ends Dark Days |
| Rehab | 1 · $10,000 · 1 | 70% alcohol −40 else −10; Happiness −5 |
| Movies | 0 · $20 · 2 | Happiness +3 |
| Vacation | 1 · $2,000 · 1 | Happiness +12, Health +2; +8 and spouse love +6 when love ≥ 60 |
| Party | 1 · $150 · 3 | Happiness +6, alcohol +8, Health −1; 10% event (new friend / meet someone / fight, injury 2) |
| Hobby | 1 · $100 · 2 | Happiness +4, Smarts +1; `creative` +2 |
| Volunteer | 1 · free · 2 | Karma +4, Happiness +2 |
| Driving test | 0 · $200 · 1 | pass `0.6 + smarts/250`; sets `licence` |
| Charity | 0 · 1/5/10% of cash · 1 | Karma +3/+8/+15, Happiness +3 |
| Will | 0 · free · ∞ | equal split / one heir / 20% to charity (Karma +10 at death) |

Costs × costOfLiving. A self-care round (gym, library, meditate, jog) costs 4 pips and $40 and offsets mid-life drift until ~60, after which decline wins by design.

## 13. Health, illness and addiction

**Illness roll**: base 3% (< 40), 6% (40-64), 12% (65+) × `(1 + clamp((50 − health)/100, 0, 0.5))` × 0.6 `iron_constitution` × 1.3 if alcohol ≥ 40; pick from the 25 shipped illnesses by age-band weight; max 3 concurrent, 1 new per year (2 after 70).

Drain per year (into Health drift, total capped −6): chronic untreated `max(1, severity − 1)`, chronic treated 0; acute untreated `ceil(severity × 1.5)`, acute treated 1. Happiness −severity/2 untreated. Severity ≥ 4 untreated adds the §5 surcharges. Acute illnesses expire after `duration`.

**Injuries**: points 1-10 from events and job danger: Health −2 × points, `injuries++`, heal 1/yr, doctor heals 3. A serious accident (≥ 7 points) sets `lastingInjury` once: health potential −5 and −1/yr for 3 years.

**Addiction** (alcohol only; abstract): dependency per §3; at ≥ 40 the "struggling with drink" chip: Health −2, Happiness −3, performance −5, $1,500 × costOfLiving/yr; at ≥ 60 the **family intervention** event (Rehab / Promise −10 / Deny: all family −10) and a 10%/yr "missed work" event (perf −10).

**Dark Days** (retention's graft): Happiness < 20 in two consecutive years (`flags.lowHappyYears`) fires a chain offering Therapist ($150) / Talk to a friend (friend rel ≥ 60) / Keep going (follow-up in 1 year at 60%); every branch resolves within 2 years; no self-harm.

Targets: 3-5 illnesses per average life, chronic ones clustering after 45; untreated flu costs 2 Health and clears in a year; untreated severity-4 heart disease kills within ~6 years, so the doctor is a real late-life money sink.

## 14. Crime, prison and gambling

**Seven crimes** (Activities › Crime; abstract, no weapons detail, no murder). Success `base − notoriety/400 + (rebellious ? 0.10 : 0)`.

| Crime | Min age · pips | Success | Payout | Arrest on fail | Sentence (yrs) | Karma |
| --- | --- | --- | --- | --- | --- | --- |
| Shoplift | 12 · 1 | 0.70 | 20-300 | 0.60 | 0-1 | −3 |
| Pickpocket | 13 · 1 | 0.60 | 50-600 | 0.50 | 0-1 | −4 |
| Vandalism | 12 · 1 | 0.75 | 0 (Happiness +3) | 0.50 | 0-1 | −3 |
| Burglary | 16 · 2 | 0.70 / 0.50 / 0.35 by target | 1-4k / 3-8k / 15-40k | 0.70 | 1-4 | −8 |
| Car theft | 16 · 2, licence | 0.45 | 2k-25k | 0.75 | 1-5 | −10 |
| Online fraud | 18 · 2 | 0.50 + (smarts − 50)/500 | 3k-60k | 0.60 | 2-7 | −10 |
| Bank robbery | 18 · 3 | 0.25 | 50k-900k | 0.90 | 8-20 | −20 |

Burglary is a 3-button text pick (dark house / lights on / mansion with alarm); 30% of failures end in a chase (injury 5) instead of arrest. Notoriety +5 per crime, +10 per arrest. Conviction: all family −5, `record = true` (locks `noRecord` jobs for life), job and hustle lost.

**Trial event** on arrest: Plead guilty (sentence ×0.7) / Plead not guilty (walk 40% if smarts ≥ 60 else 25%; lose ×1.2) / Hire a lawyer ($5,000 × costOfLiving, +20 points). Under 18: juvenile, sentence capped at 2 years, record wiped at 18 if clean.

**Prison**: the Occupation tab becomes Prison; energy 3; no income, expenses 0; Happiness −6 and Health −2 per year; decay ×2; 2 events per year from 15 (cellmate, fight: injury 3 and `fights++`, library Smarts +1, visit: spouse love +5, work detail +500, riot, parole officer). **Parole** at 50% served: `0.40 + karma/500 − 0.10 × prison fights`. **Escape** once/yr: 3-choice text puzzle, 30% success → `fugitive` (jobs tier ≥ 2 refuse; 15%/yr recapture +2 years); failure +2 years. Release: Happiness +10, "fresh start" event.

**Gambling is not in the MVP.** Simulated gambling of any kind, lottery included, has been R18+ in Australia since September 2024 and casino-style games trigger PEGI 18, which would split the Play rating and sink the Teen target. Blackjack and the lottery ship in v1.3 as a region-flagged module once the IARC outcome is confirmed per storefront; the `gambling` key and counters stay in the types with no sources, and no ribbon depends on them.

Target: a pure-crime policy from 16 is in prison by ~22 in 85% of lives; burglary EV is positive only while notoriety < 20, so crime pays briefly then stops.

## 15. Random events

### Schema

The shipped `EventDef` / `Condition` / `Effect` / `ChoiceDef` in `src/engine/events/schema.ts` stay as they are; these are the only additions:

```ts
// Conditions (NEW)
| {debt:Comparator}|{performance:Comparator}|{energy:Comparator}|{year:Comparator}|{decade:number[]}
| {personMemory:keyof PersonMemory; cmp:Comparator}|{personRelationship:Comparator}|{personLove:Comparator}|{personGrudge:boolean} // bound person
| {ownsAssetDef:string}|{rentedOut:boolean}|{assetCondition:Comparator} // bound asset
| {hustleLevel:Comparator}|{investment:{kind:InvestmentKind} & Comparator}|{marketState:('bull'|'flat'|'bear')[]}
// Effects (NEW)
| {moneyPct:number}|{notoriety:number}|{memory:keyof PersonMemory; inc:number}|{salaryPct:number}|{promote:true}
| {asset: 'repair'; amount:number}|{investmentPct:{kind:InvestmentKind; pct:number}}|{hustleLevel:number}
| {queueIn:{eventId:string; delayYears:number; chance?:number}} // -> state.scheduledEvents
// ChoiceDef (NEW fields): energy?, cost? (badges; unaffordable or unmet conditions = greyed with a reason, not hidden)
check?:{stat:StatId | 'karma' | 'grade' | 'performance'; req:number}; // p = clamp(0.5 + (value − req)/100, 0.1, 0.95)
failEffects?:Effect[];
// EventDef (NEW fields)
tags?:('luck'|'bad'|'good'|'tutorial')[]; asset?:{kind:AssetKind; rentedOut?:boolean; maxCondition?:number}; // binds {{asset}}
category adds 'era' | 'asset' | 'finance' | 'hustle' | 'trial';
```

`GameState` gains `scheduledEvents: { eventId; dueAge; context; personId? }[]`, `yearSummary`, `finances.marketState`, `character.skills` and `LogEntry.impact`; `SCHEMA_VERSION` becomes 2 with a defaults migration.

### Selection (phase 15)

Count `k`: ages 0-2 → 1 at 45%; 3-5 → 1 at 75%; 6-17 → 1 + 1 at 35%; 18-69 → 1 at 92% + 1 at 40% + 1 at 8%; 70+ → 1 + 1 at 30%; prison → 2 from the prison pool. Eligible: age range, conditions, not `once`-fired, cooldown satisfied (default gap 2 years), person and asset selectors satisfiable. Weight `base × 0.5^timesFiredThisLife × 1.5 (luck-tagged, karma > 70) × 1.5 (bad-tagged, karma < 30) × 0.25 if the category was already drawn this year`. **Quotas**: at most 1 bad-tagged event per year; at least 1 drawn event with ≥ 2 choices. `queueIn` follow-ups resolve in phase 1, bypass quotas, chain depth ≤ 2. `check` choices show a "(Smarts 60)" chip; `tutorial`-tagged events show effect hints.

### Eight worked examples

```ts
{id: 'tn_house_party',category: 'friends',title: 'House party',text: '{{person}} is throwing a party while the parents are away. There will be drinking.',minAge:15,maxAge:17,weight:1,cooldown:2,person:{kind:['friend'],alive:true,minRelationship:40},choices:[
  {id: 'drink',label: 'Go and drink',effects:[{addiction: 'alcohol',delta:12},{random:[
    {weight:65,effects:[{stat: 'happiness',delta:10},{relationship: 'person',delta:6},{log: 'Best night of the year. I regret nothing yet.' }]},
    {weight:35,effects:[{stats:{happiness:-4,health:-3}},{relationship: 'mother',delta:-8},{log: 'The police drove me home.',kind: 'bad' }]}]}]},
  {id: 'sober',label: 'Go but stay sober',effects:[{stat: 'happiness',delta:5},{relationship: 'person',delta:4},{log: 'I was the designated sensible one.' }]},
  {id: 'study',label: 'Stay home and study',effects:[{grade:5},{stat: 'happiness',delta:-2},{relationship: 'person',delta:-4},{log: 'I could hear the music from my window.' }]}]}

{id: 'ya_lost_wallet',category: 'random',title: 'Lost wallet',text: 'I found a wallet on a bench in {{city}} with {{$400}} in cash and an ID.',minAge:16,maxAge:110,weight:1,cooldown:5,choices:[
  {id: 'return',label: 'Return it',effects:[{karma:5},{chance:0.8,then:[{money:50},{stat: 'happiness',delta:4},{log: 'The owner gave me a reward.' }],else:[{log: 'The owner took it without a word.' }]}]},
  {id: 'cash',label: 'Keep the cash',effects:[{money:400},{karma:-5},{log: 'I kept the cash and posted the wallet.' }]},
  {id: 'cards',label: 'Keep it all',effects:[{karma:-10},{chance:0.6,then:[{money:1500},{log: 'I spent on the cards before they were cancelled.' }],else:[{arrest:true},{prison:1},{log: 'The purchases were traced. Fraud charges.',kind: 'bad' }]}]}]}

{id: 'wk_quiet_favour',category: 'work',title: 'Quiet favour',text: 'My manager {{person}} asked me to sign off a report I know is wrong.',minAge:18,maxAge:70,weight:1,cooldown:4,conditions:[{hasJob:true}],person:{kind:['coworker'],alive:true},choices:[
  {id: 'sign',label: 'Sign it',effects:[{karma:-4},{chance:0.65,then:[{jobPerformance:8},{relationship: 'person',delta:12},{log: 'Nobody noticed. {{person}} owes me.' }],else:[{loseJob:true,reason: 'fired' },{stat: 'happiness',delta:-15},{log: 'An audit found it. I was the name on the page.',kind: 'bad' }]}]},
  {id: 'refuse',label: 'Refuse',effects:[{karma:4},{chance:0.7,then:[{relationship: 'person',delta:-10},{jobPerformance:-5},{log: '{{person}} was cold with me for months.' }],else:[{salaryPct:5},{log: 'My honesty reached the director. A raise followed.',kind: 'good' }]}]},
  {id: 'report',label: 'Report it',effects:[{karma:5},{chance:0.5,then:[{promote:true},{log: '{{person}} was dismissed. I got the chair.',kind: 'good' }],else:[{jobPerformance:-10},{log: 'HR sided with {{person}}.',kind: 'bad' }]}]}]}

{id: 'mn_market_panic',category: 'finance',title: 'Red screens',text: 'Markets fell for the third week running. Everyone at work is pretending not to check their phone.',minAge:18,maxAge:110,weight:2,cooldown:4,conditions:[{marketState:['bear']},{investment:{kind: 'index',gte:5000}}],choices:[
  {id: 'hold',label: 'Hold',effects:[{stat: 'happiness',delta:-2},{log: 'I closed the app and went for a walk.' }]},
  {id: 'sell',label: 'Sell everything',effects:[{investmentPct:{kind: 'index',pct:-8}},{flag: 'sold_in_panic',inc:1},{log: 'I sold at the bottom. The relief lasted a month.',kind: 'bad' }]},
  {id: 'buy',label: 'Buy the dip',hint: '10% of cash',conditions:[{money:{gte:1000}}],effects:[{moneyPct:-10},{log: 'A tenth of my cash went into the fund. Brave or stupid; time will tell.' }]}]}

{id: 'as_tenant_leak',category: 'asset',title: 'The tenant calls',text: 'My tenant at {{asset}} says the ceiling is dripping into a saucepan.',minAge:18,maxAge:110,weight:2,cooldown:3,asset:{kind: 'house',rentedOut:true,maxCondition:60},choices:[
  {id: 'fix',label: 'Send a plumber',cost:1500,effects:[{asset: 'repair',amount:15},{karma:1},{log: 'Fixed within the week. The tenant renewed.' }]},
  {id: 'wait',label: 'Suggest a bigger saucepan',effects:[{karma:-2},{asset: 'damage',amount:20},{chance:0.4,then:[{flag: 'vacancy_next_year',set:true},{log: 'They moved out and left a review that will haunt me.',kind: 'bad' }],else:[{log: 'They stayed. The ceiling did not.' }]}]}]}

{id: 'fs_grudge_reunion',category: 'friends',title: 'Old wounds',text: '{{person}} is at the same party. The last few things I said to {{them}} were not kind.',minAge:16,maxAge:110,weight:2,cooldown:5,person:{kind:['friend', 'sibling', 'ex'],alive:true,maxRelationship:35},conditions:[{personMemory: 'insults',cmp:{gte:2}}],choices:[
  {id: 'apologize',label: 'Apologise properly',effects:[{chance:0.65,then:[{relationship: 'person',delta:18},{memory: 'insults',inc:-2},{karma:2},{log: '{{person}} listened, then hugged me.',kind: 'good' }],else:[{relationship: 'person',delta:3},{log: '{{person}} said thanks, and nothing else.' }]}]},
  {id: 'avoid',label: 'Avoid eye contact all night',effects:[{stat: 'happiness',delta:-3},{memory: 'yearsNeglected',inc:1},{log: 'I spent the evening on the balcony.' }]},
  {id: 'dig',label: 'Make another joke',effects:[{relationship: 'person',delta:-15},{memory: 'insults',inc:1},{karma:-2},{chance:0.3,then:[{memory: 'fights',inc:1},{injury:2},{log: 'It ended with a shove and a spilled drink.',kind: 'bad' }]}]}]}

{id: 'hl_dark_days',category: 'health',title: 'Dark days',text: 'Two years of grey. Getting out of bed has become a project.',minAge:14,maxAge:110,weight:3,cooldown:6,conditions:[{stat: 'happiness',lte:20},{flag: 'lowHappyYears',gte:2}],choices:[
  {id: 'therapy',label: 'See a therapist',cost:150,effects:[{stat: 'happiness',delta:12},{flag: 'lowHappyYears',set:0},{log: 'I talked to someone whose job is to listen. It helped.',kind: 'good' }]},
  {id: 'friend',label: 'Talk to a friend',conditions:[{hasPerson:['friend', 'bestFriend']}],effects:[{stat: 'happiness',delta:8},{relationship: 'friend',delta:6},{flag: 'lowHappyYears',set:0},{log: 'We sat on the kerb and talked until it was cold.' }]},
  {id: 'push',label: 'Keep going',effects:[{stat: 'happiness',delta:2},{queueIn:{eventId: 'hl_dark_days_again',delayYears:1,chance:0.6}},{log: 'I kept going. It did not get worse, which counts.' }]}]}

{id: 'ad_highway_rain',category: 'random',tags:['bad'],title: 'Rain on the highway',text: 'A truck hydroplaned in front of me. There was half a second to react.',minAge:17,maxAge:110,weight:0.3,cooldown:10,conditions:[{flag: 'licence',eq:true}],choices:[
  {id: 'brake',label: 'Brake hard',effects:[{random:[
    {weight:60,effects:[{stat: 'happiness',delta:-3},{log: 'I stopped a metre short. My hands shook for an hour.' }]},
    {weight:40,effects:[{injury:5},{money:-1500},{log: 'I clipped the barrier. A broken arm and a wrecked bumper.',kind: 'bad' }]}]}]},
  {id: 'swerve',label: 'Swerve onto the shoulder',check:{stat: 'health',req:45},effects:[{log: 'I threaded the gap. Reflexes, apparently.' }],failEffects:[{injury:8},{money:-9000},{log: 'The shoulder was softer than it looked.',kind: 'bad' }]}]}
```

### Content pipeline

AI drafts events in the shipped voice (first person, deadpan, 15-45 words of setup, ≤ 6-word labels, every choice writes a `log`). The validator enforces: snake_case ids with file prefixes, unique ids and **unique titles**, 2-4 choices on random events, text ≤ 280 characters, every choice has an effect or a log, deltas within ±30 unless `once`, known placeholders, `queue`/`queueIn` targets exist, a forbidden-word list (the reference games' names and brand terms, slurs, `lottery|casino|bet |poker|slot`), and **coverage**: ≥ 15 eligible events for every (age band × {inSchool, hasJob, married, hasChildren, inPrison}) combination. The sim harness reports per-event frequency and a never-fired list; every non-`followUpOnly` event must fire at least once across 5,000 seeds.

## 16. Death, obituary, ribbons and legacy

**On death** (`markDeath`): cause, age, net worth, funeral attendees (relatives rel ≥ 40, friends ≥ 50; thresholds −10 when karma ≥ 70), ribbon, two near-miss hints, obituary, epitaph (30 templates keyed to the ribbon).

**Impact scoring** (parity's graft): the effects interpreter tags every `LogEntry` with `impact = |Σ stat deltas| + |money| / (50,000 × salaryMultiplier) + bonuses` (marriage 30, birth 30, prison 25, bankruptcy 25, relative's death 20, promotion 15, graduation 15, home purchase 15). The **obituary** fills 8 slots × 4 variants: birth and decade; education; career (longest-held and peak title); family; wealth tier (< 0.25 M broke, < 2.5 M modest, < 25 M comfortable, < 250 M wealthy, else rich); the **top-2 impact moments** through 12 moment templates; a closer by karma tier (< 30 / 30-70 / > 70). Share exports the obituary as plain text.

**Ribbons** (one per life, first match by priority; thresholds in M):

| # | Ribbon | Condition |
| --- | --- | --- |
| 1 | Centenarian | age ≥ 100 |
| 2 | Jailbird | yearsInPrison ≥ 15 |
| 3 | Houdini | successful escapes ≥ 2 |
| 4 | Loaded | net worth ≥ 250 M |
| 5 | Rich | net worth ≥ 25 M |
| 6 | Academic | a doctorate, or ≥ 2 degrees beyond high school |
| 7 | Hustler | any hustle reached level 5 |
| 8 | Landlord | ≥ 3 rented properties for ≥ 10 years |
| 9 | Investor | realised investment gains ≥ 12.5 M |
| 10 | Family First | marriages = 1, divorces = 0, ≥ 2 children with rel ≥ 60 at death, 0 prison years |
| 11 | Generous | gifts + money given ≥ 40 and karma ≥ 70 |
| 12 | Globetrotter | vacations ≥ 25 |
| 13 | Heartbreaker | lovers ≥ 10 |
| 14 | Cunning | crimes ≥ 10 and convictions = 0 |
| 15 | Scandalous | arrests ≥ 5 |
| 16 | Survivor | illnesses ≥ 8 and age ≥ 70 |
| 17 | Fit | workouts ≥ 40 and Health ≥ 70 at death |
| 18 | Bookworm | library visits ≥ 40 |
| 19 | Addict | alcohol ≥ 40 at death |
| 20 | Lazy | age ≥ 40 and yearsEmployed ≤ 2 |
| 21 | Unlucky | died < 30 of illness or accident with karma ≥ 50 |
| 22 | Successful | net worth ≥ 6 M, married ≥ 1, children ≥ 1 |
| 23 | Happy | yearsHappy ≥ max(10, 0.5 × age) |
| 24 | Ordinary | fallback |

**Near-miss hints** (retention's graft): for the 8 numeric ribbons Rich, Globetrotter, Heartbreaker, Generous, Fit, Bookworm, Survivor, Centenarian compute `value / threshold`; show the two closest with `value ≥ 0.7 × threshold` ("$340,000 short of Rich", "3 more vacations for Globetrotter"). Pure function, unit-tested.

**Achievements**: 20 device-level (first job, first home, first 25 M, graduate, married, three generations, hustle level 5, 100 years old, and so on), toast on unlock, gallery on the main menu.

**Legacy**: Continue as heir picks any living child; `createLife({ heir })` starts at the child's current age in the same world: surname, country and city kept, the spouse becomes a parent, siblings persist, assets transfer (upkeep applies; a minor's vehicles sold at 80%), cash per the will (children with rel < 20 get nothing), debt inherited up to the value of inherited assets (never a negative start), 50% chance to inherit one trait, `ancestors[]` appended, header shows "Gen 3". Free: 3 generations per dynasty; Plus unlimited. **Graveyard** keeps the last 25 lives free (Plus unlimited) with tombstone, obituary and journal.

Tombstone screen: ribbon badge, name, years, cause, net worth, survived-by line, obituary, Happiness and Karma bars, near-miss hints; buttons Second Chance, Read journal, Share, Continue as heir, New life. Target: Ordinary ≤ 35% of balanced lives, no other ribbon > 12%, every ribbon reachable by a scripted policy test.

## 17. Onboarding and settings

**First life on a device is guided**: the first four random events are pinned (`src/data/tutorial.ts` lists four shipped ids for ages 1, 6, 8 and 13) and tagged `tutorial` so their choices show effect hints; nine dismissible coach marks fire once: age 6 (energy pips, School tab), 13 (People tab and decay), 14 (listings and reach postings), 18 (graduation and the ledger), 22 (investing), 25 (assets and mortgages), first illness (doctor), first "Ad in N years" pill, first death (ribbons, near-miss hints, heirs). A **"How Yearborn treats you"** card on first launch lists the fairness and ad promises. The first life shows no banner and no interstitial.

**Settings**: theme (system / light / dark, all free), text size S/M/L, haptics, sound, confirm before Age+, compact result cards (skip cards for changes of ±3 or less), replay tutorial, Restore purchases, Privacy choices (re-open the UMP form), rate the app (expo-store-review, once, after the second death with a non-Ordinary ribbon), delete all data, privacy policy, licences, version.

**Persistence**: one `GameState` under `lifeloop.save.v1` plus `lifeloop.save.backup` written on alternate saves; `schemaVersion` migrations in `src/store/migrations.ts`; autosave after every action and phase boundary; a corrupt save offers the backup; `lifeloop.graveyard.v1`, `lifeloop.settings.v1`, `lifeloop.premium.v1`, `lifeloop.adsmeta.v1` stay separate. No streaks, no notifications at MVP.

Targets: 90 seconds to the first Age+, first job by ~6 minutes, first death within 15 minutes, first heir within 20.

## 18. Content budget

| Table | MVP count | Notes |
| --- | --- | --- |
| Events | 450 target = 270 shipped (ages 0-12) + 180 new; shippable floor 120 new | teen 45, young adult 45, adult 40, elderly 20, prison 15, milestone/trial 10; era 12, hustle 16, tenant 6 and intervention/Dark Days 4 counted inside the bands; ~25 follow-up-only; 2-4 choices, ≤ 60 words |
| Jobs | 73 (8 part-time, 65 full-time), ~250 rung titles, 40 companies | 12 categories |
| Majors | 31 + 4 graduate programmes | shipped |
| Hustles | 8 | + 16 hustle events |
| Activities | 18 (+ 7 crimes, 2 love actions) | ~80 result lines |
| Assets | 32 (14 houses, 12 vehicles, 6 items) | + 6 tenant, 8 home events |
| Interactions | 16 | + 60 conversation snippets, 3 gift tiers, 3 rings, 3 wedding tiers |
| Illnesses | 25 | shipped |
| Crime | 7 crimes, 15 prison events, 1 trial, 3 escape options, 3 burglary targets | — |
| Countries | 13, 8-12 cities each | 9 name pools × 180 = 1,620 names |
| Traits | 10 | shipped |
| Ribbons / achievements | 24 / 20 | — |
| Obituary | 32 slot fragments, 12 moment templates, 5 wealth and 3 karma lines, 30 epitaphs | — |
| Coach marks | 9 | + 1 fairness card |

About 2,400 authored rows, ~1,700 of them bulk-generated names, fragments and titles; the hand-reviewed core is ~600 rows.

## 19. Monetization

### Principles

1. The free game is the whole game: every system, country, job, event, ribbon and three generations are free; Plus removes ads and sells convenience, never content or progress.
2. Interstitials are rare, predictable and never interrupt a decision.
3. Rewarded ads are opt-in, labelled with the exact reward, capped per day, and never attached to an action that was free yesterday (Spend time, Study harder, Work harder, Doctor and Spend time with family are tested as never ad-gated).
4. One purchase, one price, restorable, valid offline after the first verification.
5. No dark patterns: no fake timers, no ad after an ad, no purchase prompts on the first life or on the death screen beyond the single Second Chance row.
6. Nothing in the app or listing references the reference games (CI grep).

### Banner

AdMob adaptive anchored banner, bottom of the **Life screen only**, under the tab bar, above the safe area, `collapsible` off. Hidden on New Life, event cards, the expanded year card, death, graveyard, settings, premium, and while any modal is open. Hidden for the **entire first life and the first 10 minutes** of play. Never shown to Plus. Shown only after UMP consent (non-personalised when declined) and, on iOS, after the ATT prompt.

### Interstitial

Placements: (a) **year-end**, after the year's last card resolves and the summary toast shows; (b) **obituary dismissed**. Never on the Age+ tap, never while a card is open, never within 30 s of a purchase flow. Shown only when **all** hold:

- grace: the first life has ended **and** `totalAgeUps > 40` **and** play time ≥ 600 s;
- `ageUpsSinceInterstitial ≥ 6`; ≥ 150 s since the last interstitial; ≥ 60 s since any rewarded ad; ≥ 90 s since launch;
- not within 3 age-ups after a death (the obituary ad counts as the death's ad);
- session cap 3 (a session ends after 5 minutes in the background); daily cap 12 (local date);
- the ad is preloaded; otherwise skip, never delay the game.

**Predictability**: an "Ad in N years" pill next to Age+ counts down from 6 (from `ageUpsSinceInterstitial`); tapping it explains the rule and links to Plus. Expected cadence at 25 s/year: one interstitial every ~2.5-3 minutes, at most 3 per session, against the ~50/hour players revolt at. Constants live in `adPolicyConfig`; the floor is 6 age-ups / 150 s.

### Rewarded (three placements, opt-in; Plus gets each instantly at the same caps)

| id | Reward | Daily cap |
| --- | --- | --- |
| `cashBoost` | "Double next year's pay": `incomeBoostYears = 1` doubles next year's salary + hustle income (earned, not passive) | 3 |
| `secondChance` | Revive at Health 45 on the death screen; once per life | 1 |
| `reroll` | A fresh set of 8 job listings after the free yearly refresh | 3 |

The shipped `statBoost` placement is removed (it sold stat progress); there is no energy refill, inheritance or lucky-ticket placement. Buttons hide when no ad is filled; a failed load grants nothing; rewarded buttons appear only after the first life has ended.

### Premium: Yearborn Plus

Single non-consumable, **$4.99 USD** (store tiers elsewhere), product id `yearborn_premium`, RevenueCat entitlement `premium`, Restore purchases in Settings and on the paywall, entitlement cached in `lifeloop.premium.v1` and re-verified on launch when online. Unlocks: (1) all banners and interstitials removed forever; (2) the three rewarded perks without watching; (3) Custom Life extras: +10 allocatable stat points, wealthy-family toggle, one chosen trait, custom seed; (4) unlimited generations (free 3) and unlimited graveyard (free 25); (5) a Life Stats screen (lifetime totals across lives); (6) a Plus mark on the share text. Paywall surfaces: a Settings row, a main-menu card, the pill explanation, and one non-blocking card at most once per day after a session's third interstitial. **Stays free**: name, gender and country in Custom Life, every event, job, major, hustle, asset, activity, crime, interaction, ribbon, achievement and theme, three generations, the ledger, the tutorial. No consumables, job packs or God Mode at MVP.

### Compliance

UMP consent before SDK initialisation; ATT on iOS after the tutorial's first Age+, not on launch; `maxAdContentRating: 'T'`, `tagForChildDirectedTreatment: false`, `tagForUnderAgeOfConsent: false`; test ad unit ids until `EXPO_PUBLIC_ADMOB_*` is set; Data Safety and App Privacy forms list AdMob and RevenueCat; questionnaires: infrequent mild violence (text), alcohol references, mild suggestive themes, **no simulated gambling**, not child-directed.

## 20. Blend features from Verdant, Another Life and Mind Vacation

| From | Feature | Yearborn adaptation | Scope |
| --- | --- | --- | --- |
| Verdant | Random country and birth decade | 13 countries; birth year 1975-2005; era gates and era rates by decade; 12 era events | MVP |
| Verdant | Living People who remember | `PersonMemory` + derived grudge/favour gating compliments, gifts, money asks, inheritance, snippet pools and the reunion event | MVP |
| Verdant | Obituary from the life lived; heir continuation | 8-slot generator fed by impact-scored journal lines; heir keeps world, assets, capped debt, grudges and a trait | MVP |
| Verdant | Property, stocks with cycles, real borrow costs | 14 houses with condition/repair/rent/vacancy; one 3-state market shared by index, house values and vacancy; era mortgage rates; the appreciation cap | MVP |
| Verdant | 50+ hustles | 8 levelled hustles including a small business, capped against the job ladder | MVP |
| Verdant | Fixed IQ cap; stats decay with age | hidden potential caps; age-band drift | MVP |
| Verdant | Lasting injuries; 8-substance addictions | one `lastingInjury` flag; alcohol only, abstract | MVP |
| Verdant | First-life tutorial, faster age-ups, card UI | 4 pinned tutorial events, 9 coach marks, synchronous `ageUp` < 50 ms, compact result cards | MVP |
| Verdant | No content paywall | all content free; Plus = ad removal + conveniences; "what is free" list on the paywall | MVP |
| Another Life | Social/focus energy budget | one pool of 2-6 pips by age; money actions free; Age+ never blocked; hustle auto-pip | MVP |
| Another Life | Skills that unlock jobs | `skills` reserved on `Character`; reach postings already teach requirements; six-skill axis as data in v1.1 | post-MVP |
| Another Life | Life Points and perks; paid stat training | achievements only at MVP, Life Points in v1.2; training folded into activities and 6 tutoring events | mixed |
| Mind Vacation | "Dead in five weeks" warning | doctor's warning: 3-year countdown at Health ≤ 12 | MVP |
| Mind Vacation | Rewarded "double income"; viral hustles; transparent living costs | `cashBoost` doubles next year's earned income; `viralChance` with a capped bonus; the itemised ledger | MVP |
| Mind Vacation | Starting scenarios, perks, business levels | scenarios and perks in v1.2; business ownership lite in v1.3 | post-MVP |
| Retention and parity designs | Year summary, near-miss hints, reach postings, checks, scheduled follow-ups, quotas, Dark Days, tutorial seed, lint; "Ad in N years" pill, impact-scored obituary, fairness invariants, small business, three-policy sim | grafted as specified above | MVP |

## 21. Post-MVP roadmap

- **v1.1 (weeks 2-5)**: +120 events (570), the six-skill axis as data (Fitness, Charisma, Craft, Tech, Creativity, Business: courses in Activities, `reqSkills` on jobs, +2/yr job affinity, −1/yr decay above 30 after age 30), a work-hours setting (light/normal/heavy), 10 more jobs, Spanish and Portuguese UI strings, a balance pass from sim and reviews, ad constants in a bundled JSON shipped by EAS Update.
- **v1.2 (month 2)**: Life Points from achievements and heirs spent on starting perks and scenarios (park bench, indebted graduate, trust fund); 30 daily goals; pets (shelter, 6 species); grandparents and cousins; expunge a record after 7 clean years.
- **v1.3 (month 3)**: business ownership lite from a level-5 hustle (staff, launches, board confidence); the games-of-chance module (blackjack with a 10-hand cap, lottery) behind a per-storefront flag, enabled only where the confirmed rating stays Teen/12+; emigration between the 13 countries; half-year ageing toggle.
- **v1.4 (months 4-5)**: fame track (musician, actor, athlete) with the Fame bar unhidden and 12 fame events; weekly challenges; holiday events; an opt-in notification for an unfinished dynasty (asked after the third session).
- **v2.0**: cloud save via platform accounts (still no Yearborn account), accessibility pass (VoiceOver labels, dynamic type), an optional second one-time expansion SKU only if its content clearly exceeds the base and never gates basics.
- **Ongoing**: a free content drop every 2-3 weeks via EAS Update; ribbons to 36, achievements to 60.

## 22. Risks

1. **Economy balance** (housing outruns wages; hustles beat careers). Mitigation: the 10 M appreciation cap, the 1.2× hustle cap, thresholds in M; CI runs 5,000 seeded lives under three policies (passive, balanced, reckless) per country multiplier and asserts death-age and net-worth bands, bankruptcies < 8%, balanced > passive 3-8×, no empty years, every event reachable, ribbon spread.
2. **Content thinness**. Mitigation: 450 events with cooldowns, seen-weighting and person/asset/era binding; repeat rate ≤ 15% per 80-year life measured by the harness; the coverage check; biweekly OTA drops.
3. **Unfair death**. Mitigation: no roll before 25, the milestone-year skip, the 3-year warning, Second Chance; all tested and printed on the first-launch card.
4. **Ad fatigue and review bombs**. Mitigation: year-end-only placements, 6 / 150 s / 3 per session / 12 per day, whole-first-life grace, the countdown pill; local counters for sessions ending within 10 s of an ad in a debug screen; the rate prompt never follows an ad.
5. **Rating and store policy**. Mitigation: no gambling, murder, weapons detail, drug instructions, explicit sex or self-harm; alcohol and crime abstract; consistent IARC and Apple answers; UMP + ATT; `maxAdContentRating T`; not child-directed; forbidden-word lint.
6. **Save and purchase loss**. Mitigation: schema version 2 with migration tests, alternate backup copy, corrupt-save recovery, entitlement cached and re-verified, Restore purchases visible, Playwright smoke test on the web export.
7. **Determinism leaks**. Mitigation: all randomness through `state.rng`; an eslint rule banning `Math.random` outside `randomSeed()`; a replay test re-running a recorded action list from a seed and comparing state hashes.
8. **Energy feels restrictive**. Mitigation: 6 adult pips with all money and admin actions free; Age+ never blocked; the age-6 coach mark; the sim asserts the balanced policy wants a pip it lacks in < 20% of years.
9. **Scope creep**. Mitigation: the engine additions are exactly the NEW schema kinds, `scheduledEvents`, `marketState`, `yearSummary`, `impact`, reach postings, near-miss hints and the trial/escape/burglary pickers; everything else is data; the 120-event floor is explicit; post-MVP items stay off the launch branch.
10. **Low ad revenue from conservative caps**. Mitigation: Plus conversion target 2-3% of D7-retained users; the AdMob and RevenueCat dashboards decide whether the session cap moves from 3 to 5 in v1.1, never below the published floor.
