# Decisions

A log of every choice made where the spec (`docs/spec.md`) or the handoff (`docs/handoff.md`) was silent, ambiguous or self-contradictory. Order of authority: this file, then the spec, then the handoff.

## A. Confirmed with the designer (2026-09-18)

| # | Question | Decision | Why |
| --- | --- | --- | --- |
| 1 | What is the "ending score" in Rule 7 and the luck tags? | (Control + Prosperity + Legitimacy) / 3 | Uses only composites the spec defines, invents no weights, and keeps options that cost Public Trust costly in the balance test |
| 2 | How do the fixed strategies rank options? | An authored `stance` rank on every choice (1 = most permissive). Always-middle makes a seeded pick between the two middle ranks. Unlocked options are ignored by all three strategies | Political cost misranks Scenario 2; an explicit rank is visible and editable data |
| 3 | What does a standing investment cost, and when? | Free, mandatory, one per turn on turns 1 to 7, skipped on the final decision. Track bonuses apply once per level gained | 7 points against 12 levels forces a bet on which preparation matters; a Political Capital cost would crowd out information purchases |
| 4 | How are numbers missing from the spec filled? | The builder drafts them from the spec's own patterns, lists them in section D below, and the designer signs them off at the Phase 2 gate | Keeps every invented number visible in one place |
| 5 | How does an evidence rating "point the right way"? | Each scenario has a `briefingSignal`: a seed fact and two authored sentences, one leaning each way. The engine shows the true-leaning one with the rating's reliability, minus 10 points when State Capacity is Thin. Information purchase draws a second, independent signal at 65/75/85% | Makes Section 7's reliability table and the Thin penalty mechanical |
| 6 | How is a "sound" decision computed? | Top two options by expected ending score over worlds sampled from the published prior (30/40/30), with a neutral seeded-random continuation, about 300 rollouts per option. Luck comes from the frozen `oddsAtTheTime` versus what was drawn, weighted by damage. What-if changes one decision, replays the rest as played (nearest-stance fallback), across fresh seeds in the same profile | Judges a decision only on what the player could have known; a later mistake cannot change the verdict on an earlier decision |
| 7 | Build the facilitator editor despite the spec's commercial note? | Yes, minimal: one form behind `?facilitator=1`, overrides encoded in the share URL. No facilitator guide, no paywall | The willingness-to-pay sessions need something to show; edits must travel with the seed or shared-seed workshops break |
| 8 | Which dependencies beyond the handoff's fixed set? | Dev only: `typescript`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `@tailwindcss/vite`, `tsx`, `@playwright/test`, `@axe-core/playwright` | Needed for the isolation lint rule, the balance script, and real-browser accessibility and performance gates |
| 9 | Pacing and commits | Commit locally on `main` at every green gate without asking; never push unless asked. Stop only at the Phase 2 sign-off, the Phase 4 playtest and completion | Phases 0 to 2 are engine and content work with nothing for the designer to inspect but test output |
| 10 | Does a shared seed fix the dice? | Yes. Event rolls and briefing signals are keyed draws derived from `(seed, id)`, not from position in one stream. **This departs from the letter of handoff invariant 2** ("every draw calls the generator threaded through `rngState`") while keeping its intent: the engine stays pure and deterministic and the banned APIs stay banned. `rngState` remains for draws that are genuinely sequential | Everyone on a seed faces the same dice, so workshop comparisons measure decisions rather than luck; what-if reruns can pair seeds |
| 11 | How is run data captured with no backend? | A "Copy run summary" control in the debrief (seed, choices, forecasts, investments, Brier score, ending, as text and JSON). No network call | The spec's kill criteria need per-run data; the tester chooses whether to share it |

## B. Decided by the builder

Open to challenge at any time.

| # | Topic | Decision | Why |
| --- | --- | --- | --- |
| B1 | Run length | Eight turns. The handoff's "seven-turn run" is overruled | The spec says six scenarios, one interrupt and the final decision |
| B2 | Shape of `Content` | Scenarios, an event registry, advisers, endings and config. `EventDef` carries effects, domain, `severe`, `publicIncident`, flags added, track modifiers and mitigations | The handoff's reference-integrity test assumes an event registry that the spec's types never define |
| B3 | Event roll timing | Each event rolls exactly once, on a keyed turn inside its window | Stated odds then equal the real cumulative chance, which keeps Brier scoring honest |
| B4 | Extra seed-dependent facts | Deepfake authenticity (30%) and whether the false alarm is real are keyed `draw` conditions: a yes/no fact fixed by `(seed, key)`, true with a stated chance, identical wherever the key is named. (First planned as pre-queued events; a condition is simpler and needs no silent events) | `WorldSeed` keeps exactly five facts, as the spec and the debrief promise |
| B5 | `Condition` negation | Conditions can test a seed fact or flag for false | The spec's type cannot express "if transitional" or "if artefact" |
| B6 | Turn numbering | The interrupt takes the next turn and later scenarios shift by one. Only the first severe event interrupts. If none has fired after Scenario 6, the false alarm runs as turn 7. Event timing counts scripted scenarios, not played turns: content writes windows as relative delays, state stores the absolute scripted-scenario number in `earliestTurn`, `latestTurn` and `rollTurn`. Nothing rolls on the interrupt turn except events queued with delay 0 | Always eight turns; "by the end of 2029" still means Scenario 5 wherever the interrupt lands |
| B7 | `counterfactual` signature | Gains a `{ profile, baseSeed }` argument | "Fresh seeds within the same world profile" is impossible without them; `DecisionRecord[]` holds neither |
| B8 | Display noise | Keyed by `(seed, turn, metric)`, uniform inside the band, stable within a turn, clamped to 0..100 | `displayed(state)` must be pure and must not flicker between renders |
| B9 | Unavailable options | Options the player cannot afford or has not unlocked are shown disabled | The player sees what preparation would have bought |
| B10 | Final forecast | Resolves by a keyed draw at the true if-deployed odds, labelled as a model draw | The question is conditional on deployment, which the player may not choose |
| B11 | Seed code | A short base32 string hashed to a uint32. It never encodes the profile. New codes are generated in `src/ui` only | The engine may not touch platform randomness; the code must not leak the world |
| B12 | Adviser memory lines | Optional conditional lines per adviser view. No dialogue trees | Spec Section 7 asks for memory; Section 13 rules out dialogue trees |
| B13 | Crisis clock | Steps forward with turn progress rather than wall time; static under `prefers-reduced-motion` | Meets "simulated", "cosmetic" and "no real-time timers", and stays clear of WCAG timing rules |
| B14 | Rule 6 arithmetic | Conditional effects and probability-modifier points count at full magnitude | The handoff says the remainder "lives in hidden effects and modifiers" |
| B15 | Phase 0 contradiction | The handoff wants a failing determinism test in commit 1 and a green `npm run test`. The test is committed as `test.fails` and becomes a plain test in Phase 1 | Keeps the suite green while the defect stays visible |
| B16 | Balance-harness details | Strategies share one seeded-random investment sequence, never buy information and forecast 0.5. Seeds are paired across strategies. Ties split credit | Isolates the decision posture, which is what Rule 7 tests |
| B17 | Copy and layout | British English. Player-facing copy is written after the balance harness passes. Project lives at the repository root as package `ai-2032`. Vite `base` is `./` | Spec Section 14; runs from any static host |
| B18 | `react-is` | Added as a runtime dependency, pinned to `^18.3.1` | It is a required peer of Recharts. Left to npm it resolves to the React 19 build, which cannot recognise React 18 elements |
| B19 | TypeScript version | `~6.0.3`, not 7.x | `typescript-eslint` 8.70 supports TypeScript below 6.1 only |
| B20 | UI import guard | `src/ui` may import the engine only through `src/engine/index.ts` (lint rule) | Guards handoff invariant 3, "truth stays in the engine" |
| B21 | Debrief data and the five-function surface | The debrief summary (ending, composites, Brier scores, luck links) is computed once at the final ADVANCE, stored in state, and exposed by `displayed()` only after the debrief unlocks | The debrief needs content-dependent results, but `displayed(state)` takes no content and the handoff fixes the public surface at five functions |
| B22 | `displayed(state)` signature | Kept as the spec writes it. The band formula and label thresholds are copied from config into `GameState.display` when the game is created | Keeps `displayed` pure and single-argument while the numbers stay editable data |
| B23 | `infoPurchase.fact` | Dropped. Information purchase draws its signal on the subject of the scenario's `briefingSignal`, using the same sentence pair | Follows decision 5; one subject and one sentence pair per scenario |
| B24 | Options that can fail | `Choice` gains `succeedsWhen` and `onFailure`. On failure the cost is still paid, no normal effects apply, and the failure outcome (effects, flags, queued events, headline) applies instead | Scenario 2 option B and every final-decision option "work when" something holds; the spec's types cannot say so |
| B25 | `oddsAtTheTime` | Each entry stores `before` (the chance just before the decision) and `probability` (the chance the player then faced), both 0..1. It covers the forecast event, every event the choice modifies, and every event it queues | Luck needs the odds the player faced; the causal-link copy ("raised the odds from 22% to 30%") needs both |
| B26 | Luck arithmetic | Luck = realised minus expected impact on the ending score, summed over the chance outcomes linked to the decision. Events use their frozen odds. Hidden-fact conditional effects use the published prior, marginalised over profiles. Zero or above reads as fortunate | One scale for every kind of dice; uses only what the player could have known |
| B27 | Adviser "true value" | For an event question, the event's live odds. For a question about a hidden fact, the chance as seen inside the world's profile, never the realised fact. Adviser noise is the engine's one sequential use of `rngState` | If advisers centred on the realised fact, four forecasts would reveal it |
| B28 | Buying information | Legal only on non-crisis turns, once, and only if a decision would still be affordable afterwards | Prevents a turn with no legal decision |
| B29 | Illegal actions | `reduce` throws. It never returns a half-applied state | Bugs surface at once; the property test plays only legal actions |
| B30 | Pricing order | The boom surcharge (+1) applies first, then the policy-window discount (-2), then the minimum of 1. Only restrictive options are repriced | The spec gives both rules but not their order |
| B31 | `@types/node` | Not added. The static banned-API test reads engine source through Vite's raw glob | Avoids a dependency outside the approved list |
| B32 | Mitigated damage | Event effects scaled by a mitigation factor are rounded to whole points | Keeps metrics whole and the display tidy |

## C. Places where the spec's own numbers break its rules

Filled in during Phase 2. Known so far: Rule 6 (visible effects at most 70% of total magnitude) fails for Scenario 2 option C (75% visible) and Scenario 4 option B (86% visible).

## D. Provisional numbers awaiting designer sign-off

Filled in during Phase 2. Every number that is not in the spec is listed here with its derivation before the balance harness runs.

## E. Balance-tuning log

Filled in during Phase 3. One row per change to a number in the content JSON, with the harness result before and after.
