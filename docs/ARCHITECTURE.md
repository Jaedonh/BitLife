# LifeLoop – Architecture

LifeLoop is an Expo (React Native + TypeScript) app. The game itself is a **pure,
deterministic TypeScript simulation** with no React or native dependencies; the
app is a thin shell that renders the simulation state and forwards player
actions to it. That split is what makes the game testable, replayable, and
cheap to extend with content.

```
┌──────────────────────────────── app (src/app, expo-router) ───────────────────────────────┐
│  screens: menu · new life · life (stats, log, Age+) · occupation · assets · relationships  │
│           · activities · event modal · death/legacy · settings · premium                    │
└───────────────┬────────────────────────────────────────────────────────────────────────────┘
                │ reads state, dispatches intents
┌───────────────▼────────────────  store (src/store, zustand)  ──────────────────────────────┐
│  gameStore: GameState + actions (ageUp, choose, doActivity …)  · settingsStore · adsStore   │
│  persistence: debounced AsyncStorage writes, schema version + migrations                   │
└───────────────┬────────────────────────────────────────────────────────────────────────────┘
                │ pure function calls
┌───────────────▼────────────────  engine (src/engine)  ─────────────────────────────────────┐
│  createLife · ageUp · applyAction · resolveChoice · selectors · narrative (log text)       │
│  systems/: aging · education · careers · relationships · assets · activities · events ·    │
│            health · crime · finance · death · ribbons · legacy                             │
│  rng.ts (seeded)   types.ts (GameState)   content registry (src/data)                      │
└───────────────┬────────────────────────────────────────────────────────────────────────────┘
                │ data tables only (no logic)
┌───────────────▼────────────────  data (src/data)  ─────────────────────────────────────────┐
│  countries · names · events/* · jobs · majors · activities · assets · illnesses · ribbons  │
└────────────────────────────────────────────────────────────────────────────────────────────┘

services (src/services): ads (AdMob) · purchases (RevenueCat) · storage · analytics seam (no SDK shipped)
```

## Layering rules

1. `src/engine` and `src/data` import nothing from React, React Native, Expo, or
   `src/services`. They must run in Node under Jest with no mocks.
2. `src/store` is the only place that calls engine functions and the only place
   that touches persistence.
3. `src/app` screens never mutate state directly; they call store actions.
4. `src/services/*` wrap native SDKs behind interfaces with no-op fallbacks so
   the app runs in Expo Go, on web, and in tests.

## The engine API

```ts
createLife(options: NewLifeOptions, seed: number): GameState
ageUp(state: GameState): GameState              // one simulated year; may set state.pendingEvent
resolveChoice(state: GameState, choiceId: string): GameState
applyAction(state: GameState, action: PlayerAction): GameState  // activities, job apply, interact …
```

Every function is **pure**: it returns a new `GameState` and never mutates its
input. Randomness comes exclusively from `state.rng` (a mulberry32 state word),
so the same seed and the same sequence of inputs always produce the same life.
That property is relied on by tests (`simulateLife(seed, policy)`) and makes bug
reports reproducible from a save file.

### Yearly phase order (ageUp)

The exact order is fixed and documented in `docs/GAME_DESIGN.md §2`. In short:
advance age and year → stat drift and decay → finances (salary, passive income,
expenses, debt) → education progress → career progress → relationships drift and
family events (births, deaths, divorces) → health, illness, addiction → mortality
roll → schedule the year's random events → write the log header. When an event
needs a decision, `ageUp` stops with `state.pendingEvent` set and the UI shows a
modal; `resolveChoice` applies the chosen effect and continues the queue.

### Events are data

Random events live in `src/data/events/*.ts` as plain objects validated by a
schema (`src/engine/events/schema.ts`). An event declares: id, age range,
weight, `conditions` (declarative predicates over state: flags, stats, job,
relationships, country…), text with `{{placeholders}}`, and 2–4 choices, each
with `effects` (stat deltas, money, flags, relationship deltas, follow-up event,
death, prison…). A small interpreter applies effects, so writers never touch
engine code and AI-generated content can be validated mechanically
(`npm test` runs `events.validate.test.ts` over every event).

## State and persistence

`GameState` is a single JSON-serialisable object (`src/engine/types.ts`). It has
a `schemaVersion`; `src/store/migrations.ts` upgrades older saves on load. The
store writes to AsyncStorage (debounced, after every state change) under the
keys in `src/services/storage.ts`. A corrupt save is quarantined, never crashed
on. The graveyard (completed lives), settings, premium flag, and ad cadence meta
are stored under separate keys so clearing a life never loses purchases.

## Monetization wiring

* `src/services/ads/policy.ts` is a pure cadence policy (grace period, every-N
  age-ups, cooldown, rewarded daily caps). `gameStore.ageUp` consults it; the
  SDK is only asked to show when the policy says yes and the user is not
  premium.
* `src/services/ads/adsImpl.native.tsx` gathers UMP consent (and ATT on iOS)
  before initialising the SDK, uses Google test unit IDs unless `EXPO_PUBLIC_ADMOB_*`
  are set (`app.config.ts` refuses to evaluate a production build without them),
  and exposes a `Banner` component plus `showInterstitial` / `showRewarded`
  promises.
* `src/services/purchases/*` wraps RevenueCat. The `premium` entitlement unlocks
  ad removal and premium perks (see `GAME_DESIGN.md §19`). The premium flag is
  cached locally and re-validated on launch; "Restore purchases" is in Settings.

## Navigation

`expo-router` with a root `Stack`. The life screen hosts the four section tabs
as a segmented control inside one route (so the Age+ button and stat header
stay fixed), and event/choice dialogs are route-less modals driven by
`state.pendingEvent`.

## Testing strategy

* Unit tests per system (`src/engine/**/__tests__`).
* Property tests: simulate thousands of random lives with random policies and
  assert invariants (stats within 0–100, money finite, log monotonic in age,
  every event's conditions evaluable, no unreachable event).
* Content validation: every data table is schema-checked.
* `npm run e2e`: builds nothing itself; plays through the static web export in
  headless Chromium and screenshots each screen.

## Adding content (the common case)

1. Add rows to a table in `src/data/*` (events, jobs, activities…).
2. `npm test` validates the schema and that referenced ids exist.
3. No engine change needed. Ship as an OTA update (EAS Update) if desired.
