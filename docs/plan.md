# AI 2032 Implementation Plan

**Overall Progress:** `86%` of build steps (54 of 63). Phases 0 to 7, the original build, are complete; Phases 8 to 15 are the public-audience redesign. The items only people can complete are listed at the end and remain open.

Sources: `docs/spec.md` (Game Design Specification v2) and `docs/handoff.md` (Claude Code Build Handoff). Where they disagree the spec wins. Every decision below is copied into `DECISIONS.md` in Phase 0.

## TLDR

Build AI 2032, a static single-page decision game (React 18, TypeScript strict, Vite, Tailwind, Zod, Recharts, Vitest) about governing frontier AI from a UK middle-power position. The engine is pure, deterministic TypeScript and is the whole game; content is Zod-validated JSON; the UI only renders `displayed(state)`. Work follows the handoff's seven gated phases: scaffold, engine, content, balance harness, turn interface, crisis turns, debrief, polish. A run is always eight turns (the handoff's "seven-turn run" is overruled by the spec).

## Critical Decisions

Confirmed with the designer on 2026-09-18:

1. **Ending score** = (Control + Prosperity + Legitimacy) / 3. Uses only spec-defined composites, no invented weights, keeps trust-burning options costly in the balance test.
2. **Fixed strategies** use an authored `stance` rank (1 = most permissive) on every choice. Always-middle picks between the two middle ranks with a seeded draw. Investment-unlocked options are ignored by all three strategies.
3. **Standing investment** is free, mandatory, one per turn on turns 1 to 7, skipped on the final decision. Track bonuses apply once per level gained.
4. **Missing numbers** (event damage, base odds, bio and false-alarm interrupts, final-decision costs and effects, adviser biases, State Capacity label thresholds, "Mixed" reliability): drafted from the spec's own patterns, listed as provisional in one `DECISIONS.md` table, signed off by the designer at the Phase 2 gate.
5. **Evidence reliability** is mechanical: each scenario gets a `briefingSignal` (seed fact plus two authored sentences, one leaning each way). The engine picks which to show using the rating's reliability, minus 10 points when capacity is Thin. Information purchase draws a second independent signal at 65/75/85%.
6. **Luck tags.** "Sound" = top two options by expected ending score over worlds sampled from the published prior, with a neutral seeded-random continuation, about 300 rollouts per option. "Fortunate/unlucky" comes from the frozen `oddsAtTheTime` versus what was drawn, weighted by damage. The What-if panel changes one decision, replays the rest as played (nearest-stance fallback when a choice is unavailable), across fresh seeds in the same profile.
7. **Facilitator editor** is built in Phase 7 as one minimal form behind `?facilitator=1`, with overrides encoded into the share URL. No facilitator guide, no paywall.
8. **Dev-only dependencies approved:** `typescript`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `@tailwindcss/vite` (Tailwind v4), `tsx`, `@playwright/test`, `@axe-core/playwright`. Runtime dependencies stay `react`, `react-dom`, `zod`, `recharts`.
9. **Pacing.** Commit on `main` at every green gate without asking, and push each gate commit to GitHub (authorised by the designer on 2026-09-18; before that, commits stayed local). Stop and wait only at the Phase 2 numbers sign-off, the Phase 4 playtest, and completion.
10. **Keyed draws.** Each event roll and briefing signal derives from `(seed, id)` rather than stream position, so everyone on a seed faces the same dice and what-ifs are coherent. Deviates from the letter of handoff invariant 2 while keeping determinism and the banned-API rule; logged prominently.
11. **Copy run summary** control in the debrief (seed, choices, forecasts, investments, Brier, ending as text and JSON). No network call.
12. **Rule 7 is judged pooled** across all worlds at their published weights, not per profile, and Rules 4 and 5 are enforced per profile in every scripted scenario. Decided after the build, when the harness showed the spec's wording cannot hold all three at once (`DECISIONS.md` section E).

Decided by the builder, logged, open to challenge:

- `Content` = scenarios, events, advisers, endings, config. A new event registry (`EventDef`: effects, domain, `severe`, `publicIncident`, flags added, track modifiers, mitigations) fills the gap the handoff's reference-integrity test already assumes.
- Each event rolls exactly once, on a keyed turn inside its window, so stated odds equal real cumulative odds and Brier scoring is honest.
- Deepfake authenticity (30%) and false-alarm reality are pre-queued events that set flags. `WorldSeed` keeps exactly five facts.
- `Condition` gains negation; the spec's type cannot express "if transitional" or "if artefact".
- The interrupt takes the next turn and later scenarios shift by one. Only the first severe event interrupts. If none has fired after Scenario 6, the false alarm runs as turn 7. Content writes event windows as relative delays; state stores absolute turns.
- `counterfactual` gains a `{ profile, baseSeed }` argument; "same world profile" is impossible without it.
- `displayed()` noise is keyed by `(seed, turn, metric)`, uniform inside the band, stable within a turn, clamped to 0..100.
- Options the player cannot afford or has not unlocked are shown disabled.
- The final forecast resolves by a keyed draw at the true if-deployed odds, labelled as a model draw.
- Seed code is a short base32 string hashed to a uint32 and never encodes the profile. New codes are generated in `src/ui` only.
- Adviser memory lines (spec Section 7) are optional conditional lines per adviser view. No dialogue trees.
- The crisis clock steps with turn progress rather than wall time, and is static under `prefers-reduced-motion`.
- Rule 6 counts conditional effects and probability-modifier points at full magnitude. The spec's own tables break Rule 6 in places (Scenario 2 option C is 75% visible, Scenario 4 option B is 86%); minimal hidden-effect adjustments go into the Phase 2 sign-off table.
- Phase 0 contradiction: the handoff wants a failing determinism test in commit 1 and a green `npm run test`. The test is committed as an expected failure (`test.fails`) and flipped in commit 2.
- Harness details: strategies share one seeded-random investment sequence, never buy information, forecast 0.5; seeds are paired across strategies; ties split credit.
- British English copy, written after the balance harness passes (spec Section 14). Project lives at the repo root with package name `ai-2032`; Vite `base: './'`; a GitHub Actions workflow is added but inert until a remote exists.

## Tasks

- [x] 🟩 **Phase 0: Scaffold**
  - [x] 🟩 `git init`; Vite + React 18 + TypeScript (`strict`, `noUncheckedIndexedAccess`) + Tailwind v4 + Vitest
  - [x] 🟩 ESLint with the engine-isolation rule and a banned-API rule (`Math.random`, `Date`, `crypto`, `performance`) for `src/engine`
  - [x] 🟩 Typed stubs in `src/engine/index.ts`; determinism test as an expected failure
  - [x] 🟩 `CLAUDE.md` (handoff Section 8), `DECISIONS.md` seeded from this plan, `README.md`, `docs/spec.md`, `docs/handoff.md`, CI workflow
  - [x] 🟩 Gate: `dev`, `build`, `test`, `lint` all succeed. Commit.

- [x] 🟩 **Phase 1: Engine core**
  - [x] 🟩 `rng.ts` (mulberry32, string hash, keyed draw), `types.ts` (spec Section 12 plus logged extensions), `seed.ts` (profile then five facts)
  - [x] 🟩 `reduce.ts` and `resolve.ts`: the eight-step resolution order, event queue, 2..95% clamp, Political Capital rules, policy windows, interrupt insertion
  - [x] 🟩 `display.ts` (bands, keyed noise, capacity label, truth hidden until debrief) and `scoring.ts` (Brier, composites, ending score, endings, luck)
  - [x] 🟩 Tests: every row of the handoff Section 6 engine table, keyed-draw invariance (different action order, same event dice), seeded property test (1,000 seeds, no throw, no NaN, exactly one ending)
  - [x] 🟩 Gate: all Phase 1 tests green (59 tests). Commit.

- [x] 🟩 **Phase 2: Content and schema**
  - [x] 🟩 Zod schemas: `Scenario` (with `briefingSignal`), `Choice` (with `stance`), `EventDef`, `Adviser`, `Ending` (with `furtherReading`), config; loader that fails loudly
  - [x] 🟩 Author JSON: six scenarios, three interrupt variants (cyber, bio, false alarm), final decision, event registry, advisers, endings with Section 15 reading lists
  - [x] 🟩 Content tests: schema, no free option, no dominance, distinct levers, hidden ratio, reference integrity, complete stance ranks, source review-date warning
  - [x] 🟩 Provisional-numbers table in `DECISIONS.md` (sections C and D)
  - [x] 🟩 Gate: all content parses and tests pass (130 tests green, committed). Designer signed off `DECISIONS.md` sections C and D on 2026-09-18.

- [x] 🟩 **Phase 3: Balance harness**
  - [x] 🟩 `simulate.ts` and `scripts/balance.ts`: 10,000 paired-seed games per profile for the three fixed strategies; report names the scenarios where a strategy runs away
  - [x] 🟩 Rules 4 and 5 enforced per scenario by `npm run balance`. They conflict with Rule 7 as the spec words it; the designer chose to judge Rule 7 pooled across worlds (decision 12), and all seven rules now hold
  - [x] 🟩 Tune JSON only, never the engine; log every change; wire `npm run balance` into CI
  - [x] 🟩 Gate: no fixed strategy above 40% (pooled shares 35.4 / 27.5 / 37.1 at 10,000 runs per profile); Rules 4 and 5 hold in all seven scripted scenarios. Commit.

- [x] 🟩 **Phase 4: Turn interface**
  - [x] 🟩 `App.tsx` view state over `useReducer` wrapping the engine; title screen with disclaimer and seed-code entry
  - [x] 🟩 Screens: Briefing, Forecast (adviser estimates as anchors), Buy Information, Decision (lever, cost with window pricing, disabled states), Invest, News
  - [x] 🟩 Components: `MetricBar`, `EstimateBand` (range plus midpoint, never one number), `EvidenceTag`, `AdviserCard`; briefing-document theme. Components read scenarios only through `src/content/index.ts`, which strips hidden effects (lint-enforced)
  - [x] 🟩 Briefing, headline and adviser copy (first full draft; open to the playtester's comments)
  - [x] 🟩 Builder smoke run of all eight turns in the browser: no console errors, no horizontal overflow at 375px. Gate: the designer completed a playtest run on 2026-09-18 with nothing to report.

- [x] 🟩 **Phase 5: Crisis turns and the interrupt**
  - [x] 🟩 Crisis variant: stepped clock, no information purchase, reduced evidence text, advisers flagged as in open disagreement, unlocked options surfaced first
  - [x] 🟩 Interrupt drawn from the queue (cyber or bio) with the false-alarm fallback at turn 7 (engine, Phase 1; content, Phase 2)
  - [x] 🟩 Gate: four Playwright tests in a real browser. Both crisis turns render differently from normal turns; an unlocked option appears only when its threshold is met. Commit and push.

- [x] 🟩 **Phase 6: Debrief and counterfactuals**
  - [x] 🟩 Six panels: world reveal (with every briefing marked right or wrong), calibration (Recharts chart, adviser Brier scores), quality versus luck, governance record with further reading, what you never saw, what if
  - [x] 🟩 `counterfactual.worker.ts`: 1,000 paired-seed reruns and the soundness rollouts (300 per option, prior-sampled worlds, neutral continuation); read-only "View assumptions" table
  - [x] 🟩 Copy rules enforced by unit tests on every sentence builder (prefix, no right or wrong, causal links with their probability change); Copy run summary control, no network call
  - [x] 🟩 Gate: Playwright against the production bundle. 1,000 reruns finish in under 3 seconds while the main thread keeps painting; the Brier score shown equals a hand calculation from the forecasts shown. Commit and push.

- [x] 🟩 **Phase 7: Polish and facilitator mode**
  - [x] 🟩 Responsive layout (no sideways scroll at 360px), full keyboard operation with focus following each step, `prefers-reduced-motion`, light and dark, WCAG 2.2 AA
  - [x] 🟩 Facilitator editor behind `?facilitator=1`; overrides and seed round-trip through the URL; the worker and View assumptions use the edited numbers
  - [x] 🟩 Bundle-size check (under 1 MB against a 16 MB limit); README and `DECISIONS.md` completed
  - [x] 🟩 Gate: axe reports no violations at any impact on any screen, in light and dark; the same seed code reproduces an identical run start to finish in the browser. Commit and push.

Phases 8 to 15 are the public-audience redesign: the brief is `docs/ui-engagement-handoff.md`, the decisions are `DECISIONS.md` decision 14 and section F, and every step is planned task by task in [`docs/plans/2026-09-19-public-engagement-ui.md`](plans/2026-09-19-public-engagement-ui.md). The work happens on a feature branch and reaches `main` only by a pull request the designer approves. GitHub Actions has never run, so every gate is run locally: `npm run lint && npm run test && npm run balance && npm run build && npm run e2e`. Status: 🟩 done, 🟨 in progress, ⬜ not started. Optional Phase 14 is not counted in the progress figure unless the designer approves it.

- [x] 🟩 **Phase 8: Baseline and safety net**
  - [x] 🟩 Baseline before any change: `npm ci`, Playwright Chromium, all local gates green. `npm run test` 166 passed; `npm run e2e` 17 passed in 13.2 s (Playwright's figure), 13.53 s wall clock including the build
  - [x] 🟩 End-to-end helpers hardened: `LABEL` constants in `e2e/play.ts`, helpers wait for the next screen, the debrief is found by `data-testid="debrief"`, luck tags are read only after the rankings arrive; the axe check fails on any violation, heading order and one h1 included (`DECISIONS.md` B42)
  - [x] 🟩 Fix: an option priced out by commissioning analysis no longer stays picked with Confirm enabled (the page went blank), and focus moves to the analysis bought; regression test in `e2e/regressions.spec.ts`
  - [x] 🟩 Fix: the steps rail lists Investment on turn 7's consequences and not on the final turn's; regression test
  - [x] 🟩 Guards: `tests/content/public.test.ts` fails if a hidden key reaches `publicContent()`; a lint rule keeps `published`, `defaults`, `assumptionsOf`, `view.truth`, `view.debrief`, `view.history` and `halfWidth` out of play screens
  - [x] 🟩 Docs: `DECISIONS.md` decision 14 and section F; Phases 8 to 15 here; `CLAUDE.md` reading list and branch workflow
  - [x] 🟩 Gate: all local gates green (e2e 19 passed in 13.8 s); baseline e2e timing recorded; crash bug fixed with a regression test. Committed on the feature branch.

- [x] 🟩 **Phase 9: The opening**
  - [x] 🟩 Dilemma-first title screen; the primary button reads "Try your first decision" and sits inside the first viewport at 375×667, 726×900 and 1280×800
  - [x] 🟩 Seed field inside "Play the same world as a friend", open when the link carries a seed; the fictional-unit disclaimer stays
  - [x] 🟩 Print-production labels removed (figure ids, 720PT, 48MM, "Fig. NN"); mono microlabels at least 12px
  - [x] 🟩 Gate: `e2e/engagement.spec.ts` checks the button position at the three sizes; all local gates green (e2e 29 passed in 12.8 s). Committed on the feature branch.

- [x] � **Phase 10: Briefing and forecast**
  - [x] 🟩 Advisers: "Cares about", "Backs option X" and a "Who backs what" split, from public content only
  - [x] 🟩 Forecast: gut feel first, then "Compare with your advisers" on the same 0 to 100 scale; "Lock in N%" always enabled
  - [x] 🟩 Play-screen sentence builders in `src/ui/copy.ts`, unit-tested against the copy rules
  - [x] 🟩 Gate: all local gates green; axe clean on the new states in light and dark. Commit on the feature branch.

- [ ] 🟨 **Phase 11: Decision, investment and consequences** — built; awaiting the designer's review
  - [x] 🟩 `publicContent()` gains the Political Capital rules and track bonuses; investment copy corrected (`DECISIONS.md` F10, F11)
  - [x] 🟩 Choice preview (Political Capital left, stated effects) and a track ladder with the next unlock, from pure, unit-tested helpers
  - [x] 🟩 Consequences in four parts in the main column: Your decision, What the world noticed, What you can measure now, Still unknown
  - [x] 🟩 Gate: all local gates green. Stop for the designer's review of the opening and one representative turn.

- [ ] ⬜ **Phase 12: First-decision pause (the five-minute taster)**
  - [ ] ⬜ A pause after turn 1's consequences in every game, with "Keep going" and "Stop here"; no engine or content change
  - [ ] ⬜ End-to-end helpers click through the pause
  - [ ] ⬜ Gate: all local gates green; a run that pauses and continues reproduces an uninterrupted run. Commit on the feature branch.

- [ ] ⬜ **Phase 13: A debrief for everyone**
  - [ ] ⬜ New order: At a glance, What if (preselected), Decision quality versus luck, collapsible reference panels, Talk it over, Share your run
  - [ ] ⬜ Existing panel headings, test ids and copy rules kept
  - [ ] ⬜ Gate: all local gates green. Stop for the designer's review.

- [ ] ⬜ **Phase 14 (optional): Save and resume**, only if the designer approves `DECISIONS.md` F7
  - [ ] ⬜ The action log, never the game state, saved in this browser; opt-in "Continue" on the title screen
  - [ ] ⬜ Gate: all local gates green; replay unit tests; resume end-to-end test. Commit on the feature branch.

- [ ] ⬜ **Phase 15: Accessibility sweep, docs and handover**
  - [ ] ⬜ Extended axe, overflow and keyboard walk over every new screen and state, in light and dark, at phone and desktop sizes
  - [ ] ⬜ README, `DECISIONS.md` and this plan updated; human-only items listed as open
  - [ ] ⬜ Gate: all local gates green; the pull request is ready for the designer. Stop at completion.

## Owned by the designer, not the build

These parts of the definition of done cannot be passed by the builder and will be reported as open, never as done:

- The Phase 4 playtest (a person finishing a run without code or docs)
- Spec milestone M5: ten solo testers and one facilitated group of eight
- First-time completion in under 30 minutes, and two of five testers naming a decision they would defend despite its outcome
- The three willingness-to-pay sessions in the spec's commercial note
- Whether the spec's commercial note (a paid workshop layer, and the three willingness-to-pay sessions above) still applies now that the game is a personal project for everyone (`DECISIONS.md` decision 14)
- Sign-off of `DECISIONS.md` decision 14 and section F (the public-audience redesign)
- The design reviews at the Phase 11 and Phase 13 gates, and the decision on optional Phase 14
- The Phase 11 newcomer check: at least one person new to the game plays the opening and one turn, then answers the handoff's four questions: can they understand the dilemma, choose without specialist knowledge, explain the visible consequences, and do they want to continue? Open until run and written up.
- Merging the redesign's pull request, and any deploy
