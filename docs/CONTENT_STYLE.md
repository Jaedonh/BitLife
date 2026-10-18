# Content style guide (events)

Events are the game. This is the house style every content drop must follow. The validator (`npx tsx scripts/validate-events.ts <file>`) enforces the mechanical rules; this document covers the rest.

## Files and ids

- One file per theme in `src/data/events/`, exporting `export const <THEME>_EVENTS: EventDef[]`. Run `node scripts/register-events.mjs` to wire it into the registry, then `npm test`.
- Ids are `snake_case` with a two-letter file prefix (`ec_`, `kd_`, `tn_`, `ya_`, `ad_`, `ll_`, `wk_`, `lf_`, `hl_`, `mn_`, `cp_`, `fs_`, `sl_`, `nc_`, `tr_`, `pt_`, `tm_`, `hd_`). Ids never change once shipped (saves reference them).

## Voice

- First person, past or present tense, the character narrating: "My boss pulled me aside after the meeting."
- 15-45 words of setup. Choice labels are imperative and ≤ 6 words. Every choice writes a first-person `log` line (≤ 100 characters) so the journal reads as a story.
- Deadpan, absurdist, warm. Plain and respectful for serious moments (death, illness, abuse). Never explain the joke.
- Placeholders: `{{name}} {{fullName}} {{city}} {{country}} {{demonym}} {{age}} {{year}} {{person}} {{personFull}} {{they}} {{They}} {{them}} {{their}} {{job}} {{company}} {{spouse}} {{mother}} {{father}} {{parents}} {{$1000}}`. Money is authored in USD and scaled per country. A child's parents are `{{mother}}`/`{{father}}` ("Mom"/"Dad", needs `hasPerson`) or `{{parents}}` ("Mom and Dad", "Mom", "Dad and Maria", or "my family"); never write "my parents" for a child, and keep verbs after `{{parents}}` agreeing with one or two people ("{{parents}} paid", not "{{parents}} were").

## Design rules

- No strictly dominant choice. Each option trades something: money vs happiness, karma vs gain, safety vs upside.
- Uncertainty lives in effects (`chance`, `random`), not in the player's head: a choice is a gamble with readable odds in the text ("probably", "might").
- Magnitudes: minor ±2-4, notable ±6-10, major ±15-25 (rare), life-changing ±30-50 (very rare). Money: small 20-300, medium 500-5k, big 10k-100k (rare, weight ≤ 1), huge 250k+ (once, weight ≤ 0.3).
- Death only when the situation is genuinely lethal and always behind `chance ≤ 0.15`. Prison 1-8 years; a sentence passed while already inside is added to the time left.
- An event with an `arrest` or `prison` effect says where it happens: `inPrison: false` in its conditions (or `inPrison: true` if it is written for prison, or on the jailing choice itself). The validator rejects one that does not, so a raid, a court date or a dare never reaches a player who is already serving time.
- Prison is its own world: while the player is in prison, only events whose conditions include `{ inPrison: true }` can open (random or queued). Everything else waits until release, so ordinary events do not need an `inPrison: false` guard just to stay out of prison.
- A `personDies` effect is announced and grieved by the content, not the engine: the same effects list (or every branch of a `chance`/`random` in it) needs a `log` line and a happiness loss, and `personDies` goes after the log so the story line comes before any inheritance line. The engine still handles inheritance and orphan care.
- Costs for a player under 18 fall on their parents. A choice that has the child spend their own money (offered only with a `money` condition) marks its costs `payer: 'self'` (or `payer: 'family'` when the parents pay on purpose); the validator enforces this.
- Weights: 0.3 rare, 1 normal, 3 common. Use `once` for life milestones and `cooldown` (years) for things that should not repeat soon; the engine's default minimum gap is 2 years.
- Conditions must match the text: an event about a spouse needs `person: { kind: ['spouse'] }` or `married: true`; a work event needs `hasJob: true`.
- Prefer binding a person (`person` selector) so names and pronouns make the event personal; move the bond with `relationship: 'person'`.
- Follow-ups: `followUpOnly: true` events reached only through `queue`, in the same file. Every queued card (random or follow-up) has its age range and `conditions` re-checked when it opens and is skipped if they no longer hold, because an earlier card that year may have jailed the player or cost them their job. A follow-up is checked after the choice that queued it, so give it the guards its text needs that the choice leaves true (usually the source's `inPrison: false`, or `hasJob: true` for work).

## Content rating (Teen / 13+)

Allowed: dating, kissing, marriage, pregnancy as a fact; alcohol and drug **references** only as temptations with consequences; crime described abstractly; fights without gore; death handled plainly.

Not allowed: explicit sexual content, sexual violence, self-harm or suicide, drug-use instructions or glamour, torture, slurs, real brand names, real people, **any simulated gambling** (lottery, casino, betting, poker, slots, raffles for money). Gambling of any frequency makes the app R18+ in Australia and "frequent" makes it 18+ everywhere.

## Review checklist before a drop

1. Validator OK; `npm test` green (the simulation harness re-runs with the new pool).
2. Read every event aloud once. Cut anything that needs a footnote.
3. Grep the drop for `lottery|casino|bet |poker|slot` and brand names.
4. Ship as an EAS Update (data only) when no engine change is involved.
