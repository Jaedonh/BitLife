# Content style guide (events)

Events are the game. This is the house style every content drop must follow. The validator (`npx tsx scripts/validate-events.ts <file>`) enforces the mechanical rules; this document covers the rest.

## Files and ids

- One file per theme in `src/data/events/`, exporting `export const <THEME>_EVENTS: EventDef[]`. Run `node scripts/register-events.mjs` to wire it into the registry, then `npm test`.
- Ids are `snake_case` with a two-letter file prefix (`ec_`, `kd_`, `tn_`, `ya_`, `ad_`, `ll_`, `wk_`, `lf_`, `hl_`, `mn_`, `cp_`, `fs_`, `sl_`, `nc_`, `tr_`, `pt_`, `tm_`, `hd_`, `jd_`). `sys_` is reserved for the engine's own cards. Ids never change once shipped (saves reference them).

## Voice

- First person, past or present tense, the character narrating: "My boss pulled me aside after the meeting."
- 15-45 words of setup. Choice labels are imperative and ≤ 6 words. Every choice writes a first-person `log` line (≤ 100 characters) so the journal reads as a story.
- Deadpan, absurdist, warm. Plain and respectful for serious moments (death, illness, abuse). Never explain the joke.
- Placeholders: `{{name}} {{fullName}} {{city}} {{country}} {{demonym}} {{age}} {{year}} {{person}} {{personFull}} {{they}} {{They}} {{them}} {{their}} {{job}} {{company}} {{spouse}} {{mother}} {{father}} {{parents}} {{grandma}} {{grandpa}} {{$1000}}`. Money is authored in USD and scaled per country. A child's parents are `{{mother}}`/`{{father}}` ("Mom"/"Dad", needs `hasPerson`) or `{{parents}}` ("Mom and Dad", "Mom", "Dad and Maria", or "my family"); never write "my parents" for a child, and keep verbs after `{{parents}}` agreeing with one or two people ("{{parents}} paid", not "{{parents}} were"). A bound parent renders as "Mom"/"Dad" and a bound grandparent as "Grandma Rosa"/"Grandpa Joe", so never write "my grandma {{person}}"; `{{grandma}}`/`{{grandpa}}` name the closest living one and fall back to "Grandma"/"Grandpa", so prefer binding `person: { kind: ['grandparent'], gender: 'female' }` when the line needs a real, living one (a test rejects an event using them that can open for a child with no living grandparent).

## Design rules

- No strictly dominant choice. Each option trades something: money vs happiness, karma vs gain, safety vs upside.
- Uncertainty lives in effects (`chance`, `random`), not in the player's head: a choice is a gamble with readable odds in the text ("probably", "might").
- Magnitudes: minor ±2-4, notable ±6-10, major ±15-25 (rare), life-changing ±30-50 (very rare). Money: small 20-300, medium 500-5k, big 10k-100k (rare, weight ≤ 1), huge 250k+ (once, weight ≤ 0.3).
- Death only when the situation is genuinely lethal and always behind `chance ≤ 0.15`. Prison 1-8 years; a sentence passed while already inside is added to the time left.
- An event with an `arrest` or `prison` effect says where it happens: `inPrison: false` in its conditions (or `inPrison: true` if it is written for prison, or on the jailing choice itself). The validator rejects one that does not, so a raid, a court date or a dare never reaches a player who is already serving time.
- Prison is its own world: while the player is in prison, only events whose conditions include `{ inPrison: true }` can open (random or queued). Everything else waits until release, so ordinary events do not need an `inPrison: false` guard just to stay out of prison.
- Juvenile detention is its own world inside that one: a player sentenced before 18 serves in detention, where only events with both `{ inPrison: true }` and `{ juvenile: true }` open (`juvenile_detention.ts`), and those never open in adult prison. School carries on inside, so a classroom card also needs `{ enrolled: true }`. Re-entry cards can use the `released` flag (set at every release) and the `parole` flag (two years after an early release).
- A `personDies` effect is announced and grieved by the content, not the engine: the same effects list (or every branch of a `chance`/`random` in it) needs a `log` line and a happiness loss, and `personDies` goes after the log so the story line comes before any inheritance line. The engine still handles inheritance and orphan care.
- Costs for a player under 18 fall on their parents. A choice that has the child spend their own money (offered only with a `money` condition) marks its costs `payer: 'self'` (or `payer: 'family'` when the parents pay on purpose); the validator enforces this.
- Weights: 0.3 rare, 1 normal, 3 common. Use `once` for life milestones and `cooldown` (years) for things that should not repeat soon; the engine's default minimum gap is 2 years.
- Conditions must match the text: an event about a spouse needs `person: { kind: ['spouse'] }` or `married: true`; a work event needs `hasJob: true`.
- Prefer binding a person (`person` selector) so names and pronouns make the event personal; move the bond with `relationship: 'person'`. When the text assumes you live together ("we stood in the kitchen"), add `household: true` so a 40-year-old's mother is not bound. A car means a real car: `{ ownsAssetId: [...] }` (kind `car` includes the bicycle). Era, weather and home: phones, apps, video calls, streaming and vapes need `{ year: { gte: ... } }` (smartphones from about 2010); snow needs `{ climate: ['snowy'] }`, coats and cold weather `['snowy', 'mild']`, and December-as-winter `{ southern: false }`; a landlord or roommate card needs `{ atHome: false }`. A card that has the player take another job uses `{ switchEmployer: true, raise }` rather than `loseJob`. Coworkers exist only while the player holds that job; a card where a coworker retires, quits or is let go ends with `{ coworkerLeaves: true }` (a close one stays as a friend).
- The engine already narrates the player's children growing up (school, graduation, moving out, marriage, grandchildren; GAME_DESIGN §10a). An event about one of those moments binds a child who has not reached it (`movedOut: false`, `married: false`, `kids: { lte: 2 }`) and makes it happen with `childMilestone`, so the story is never told twice. Grandparents and grandchildren come from the engine: bind them, never create them with `newPerson`.
- Starting scenarios (GAME_DESIGN §4a) set flags events can condition on: `scenario:<id>` for every new life, plus `foster_care` (orphan), `immigrant` (the birth country code, set when the family moves abroad), `farm` and `prodigy`. An orphan has no mother or father but a foster parent of kind `stepmother`/`stepfather`, who renders by first name; an event about whoever raises the child binds `kind: ['mother', 'father', 'stepmother', 'stepfather']` and keeps its text parent-neutral (no "Mom", "Dad" or "my parents").
- Follow-ups: `followUpOnly: true` events reached only through `queue`, in the same file. Every queued card (random or follow-up) has its age range and `conditions` re-checked when it opens and is skipped if they no longer hold, because an earlier card that year may have jailed the player or cost them their job. A follow-up is checked after the choice that queued it, so give it the guards its text needs that the choice leaves true (usually the source's `inPrison: false`, or `hasJob: true` for work).

## Flavor lines (`src/data/flavor.ts`)

- One first-person journal line, at most 100 characters, no choices. Same voice and placeholders as events; a line that uses `{{person}}`/`{{they}}` binds someone with `person` (a pet, the spouse, a young child).
- Generic lines have only an age range. Situational lines add `conditions` and are written only while that situation held all year, so describe the ongoing situation ("I read every book in the prison library"), never its start or end (no "I was diagnosed", "I got out").
- Prison lines need `{ inPrison: true }` and `minAge: 18`; lines for a minor locked up use `maxAge: 17`. Behind bars nothing else is written.
- A line that says the year was uneventful ("nothing happened", "my greatest achievement of the year") is marked `quiet: true`; the engine keeps it for years with no other line and no event card, and the validator rejects quiet wording without the mark.
- Illness lines name a real illness id with `{ hasIllness: [...] }` and stay plain and respectful; addiction lines describe consequences only and never gambling.

## Content rating (Teen / 13+)

Allowed: dating, kissing, marriage, pregnancy as a fact; alcohol and drug **references** only as temptations with consequences; crime described abstractly; fights without gore; death handled plainly.

Not allowed: explicit sexual content, sexual violence, self-harm or suicide, drug-use instructions or glamour, torture, slurs, real brand names, real people, **any simulated gambling** (lottery, casino, betting, poker, slots, raffles for money). Gambling of any frequency makes the app R18+ in Australia and "frequent" makes it 18+ everywhere.

## Review checklist before a drop

1. Validator OK; `npm test` green (the simulation harness re-runs with the new pool).
2. Read every event aloud once. Cut anything that needs a footnote.
3. Grep the drop for `lottery|casino|bet |poker|slot` and brand names.
4. Ship as an EAS Update (data only) when no engine change is involved.
