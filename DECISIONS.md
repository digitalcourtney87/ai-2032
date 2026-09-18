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
| 9 | Pacing and commits | Commit on `main` at every green gate without asking. From the Phase 4 gate onwards, push each gate commit to GitHub (the designer asked for this on 2026-09-18; until then commits stayed local). Stop only at the Phase 2 sign-off, the Phase 4 playtest and completion | Phases 0 to 2 are engine and content work with nothing for the designer to inspect but test output |
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
| B33 | Public content view | Components read scenarios only through `src/content/index.ts`, whose `publicContent()` strips hidden effects, modifiers, conditions and queued events. A lint rule blocks any other import from `src/content` into `src/ui` | The scenario JSON holds the hidden half of every option; a client-side game cannot encrypt it, but it can make rendering it a lint failure |
| B34 | Adviser memory lines | Resolved by the engine when a turn begins and carried in the turn context, because they depend on hidden flags | Keeps condition evaluation out of the interface |
| B35 | Interrupt dates | Interrupt turns show "Unscheduled" rather than a date | Their timing varies by run; scripted scenarios keep the spec's dates |
| B36 | A sixth engine function | `soundness(decisionState, rollouts, content)` joins the five in the handoff's contract | The "sound" half of a luck tag needs rollouts over prior-sampled worlds from the state at each decision; none of the five functions can express that |
| B37 | What "could have known" keeps and resamples | Soundness rollouts keep everything observable (metrics, tracks, Political Capital, flags, decision modifiers) and resample everything hidden: the profile, the five facts, every event's base odds and every die. True values of the estimated metrics are kept, although the player saw only a band | Resampling the estimated metrics inside their bands would add noise without changing the ranking much; logged as a simplification |
| B38 | Replaying a history in a fresh world | What-if reruns replay each decision by scenario. If the rerun meets an interrupt variant the player never met, it borrows their interrupt decision by option letter, then by nearest stance. An unaffordable or locked choice falls to the nearest stance on offer. Investments replay by turn, moving to the next open track when one is full | Fresh seeds can change which crisis interrupts and what is affordable, so "the rest as played" needs a rule |
| B39 | Both what-if arms are simulated | The "as played" arm is rerun on the same fresh seeds as the changed arm, rather than using the player's one real game | One game is a single draw; comparing like with like needs the same 1,000 worlds on both sides |
| B40 | Published assumptions | `assumptionsOf(content)` exposes the hidden half of the content to debrief screens only, after the debrief unlocks | Spec Sections 6 and 11: the numbers are published in the debrief |
| B32 | Mitigated damage | Event effects scaled by a mitigation factor are rounded to whole points | Keeps metrics whole and the display tidy |

## C. Places where the spec's own tables break its rules

**Status: signed off by the designer on 2026-09-18.** Each fix is the smallest change that makes the automated test pass. The spec says "a scenario that breaks one does not ship", so these cannot be left as written.

| # | Rule | Where | As the spec has it | Fix applied |
| --- | --- | --- | --- | --- |
| C1 | 2, no dominance | Scenario 5, option D | B (PC 2, Public Trust +2) is at least as good as D (PC 4, Public Trust -1) on every visible metric and on cost | D gains a visible Social Stability +2 |
| C2 | 3, different levers | Scenario 3, options C and D | Both "Domestic law" | D (monitor and report biological queries) relabelled Evaluation access |
| C3 | 3, different levers | Scenario 4, options B and D | Both "Public investment" | B (apprenticeship incentive) relabelled Convening: an employer compact backed by the incentive |
| C4 | 3, different levers | Interrupt, options B and C | Both "Domestic law" | B (emergency agent security standards) relabelled Market access |
| C5 | 6, at most 70% visible | Scenario 2, option C | 75% visible | Added hidden: infrastructure-attack odds -4 (critical sectors are protected) |
| C6 | 6 | Scenario 4, option A | 88% visible | Added hidden: odds that graduate hiring is still depressed in 2032, +6 |
| C7 | 6 | Scenario 4, option B | 86% visible | Added hidden: odds that graduate hiring is still depressed in 2032, -8 |
| C8 | 6 | Scenario 6, option B | 100% visible (its only hidden element is a reveal) | Added hidden: Systemic Risk -4, or -2 below Evaluation science level 2. This is also how "half effect" is read |

Rule 6 counts a track level as its bonus plus a share of the odds it unlocks (each event's track modifier divided by the level it needs). On that basis Scenario 1 option D passes at 42% visible; counting the bonus alone it would fail at 71%.

Two observations that are not rule breaks, for the designer's attention:

- **Scenario 2 option B cannot fail as written.** It fails "if Cooperation is below 40", but Cooperation starts at 45 and drifts -1 a turn, and nothing before Scenario 2 lowers it. It will be 43 or 44 when the option is taken. The mechanic is built and tested; the threshold never bites.
- **Random play lands in The Dependent State 80% of the time** (3,000 games: Dependent 80%, Fortress 18%, Deregulated 1.5%, Responsible 0.1%, Unknown Frontier 0%). Mean final Control is 51 and Prosperity 47 against thresholds of 55, because drift alone costs State Capacity 16 points and adds 24 to Systemic Risk over eight turns. Random play is not skilled play, and Phase 3 measures the fixed strategies properly, but the 55 thresholds may be high for the spec's drift.

## D. Provisional numbers awaiting designer sign-off

**Status: signed off by the designer on 2026-09-18 as the starting point for balance tuning.** Every number below is absent from the spec. Each was derived from the spec's own patterns: the largest single effects in the spec's tables are 7 to 8 points, severe events are sized just above that, and the interrupt variants mirror the cyber variant's costs and magnitudes. Numbers the spec does give are not listed. All of these live in `src/content/` as data and can be changed without touching the engine.

### D1. Rules

| Number | Value | Derivation |
| --- | --- | --- |
| State Capacity labels | Thin below 35, Adequate 35 to 64, Strong 65 and above | The start value of 40 reads as Adequate but three turns of neglect (drift -2) make it Thin. Strong sits just below the 70 the Unknown Frontier needs |
| Reliability of "Mixed" evidence | 60% | Same as Weak: mixed evidence points both ways |

### D2. Events

| Event | Provisional numbers | Derivation |
| --- | --- | --- |
| Infrastructure attack (base odds, track modifier and halving are the spec's) | Can fire during Scenarios 2 to 5. Damage: National Security -10, Economy -5, Public Trust -5 | "By the end of 2029" is Scenario 5. Damage sits just above the spec's largest single effects |
| Open-weight model family implicated in an incident (Scenario 2 forecast) | Base 22% offence-led, 8% defence-led. Scenarios 3 to 6. Damage: National Security -6, Public Trust -4, Systemic Risk +3. Severe: can trigger the cyber interrupt. Option A raises it by 8 | 22% and +8 come from the spec's Section 11 example ("from 22% to 30%") |
| Open-weight benefit: a UK government defence model (the other half of Scenario 2 option A's joint-outcome draw) | 40% in every world. National Security +5, Innovation +2, and a further National Security +4 if offence leads. One to three scenarios later (tuned in E8; first drafted as 30% offence-led, 55% defence-led) | The spec says the seed shifts the four-way weights; harm and benefit are drawn independently. A defence model is worth most where offence leads |
| Biological plot (Scenario 3 forecast) | Base 30% if uplift is real, 6% if marginal. Scenarios 4 to 6. Damage: National Security -6, Public Trust -5, Systemic Risk +4 | Sized below the infrastructure attack: it happens in an allied country |
| Privacy controversy (Scenario 3 option D) | 40% chance, Public Trust -4 (tuned in E7; first drafted as -3), one or two scenarios later | The spec makes it text-only; a small effect keeps option D's hidden cost real |
| Labour data signal (Scenario 4 option A) | 70% reliable | Between the purchased-information reliabilities of 65% and 85% |
| Graduate roles move offshore (Scenario 4 option C; the 25% is the spec's) | Social Stability -4, Economy -2 | Undoes most of option C's Social Stability +5 |
| Graduate hiring still depressed in 2032 (Scenario 4 forecast) | Base 75% if structural, 25% if transitional. Social Stability -4. Resolves at the final decision | Needed to resolve the forecast |
| Free-speech legal challenge (Scenario 5 option C; the 30% is the spec's) | Public Trust -4 (tuned in E7; first drafted as -3) | As the privacy controversy |
| Cause of sandbagging revealed (Scenario 6 option B; the 80% is the spec's) | 65% reliable below Evaluation science level 2 | "Half effect": half of the edge over a coin flip |
| Follow-on cyber attack (cyber interrupt forecast; the -12 is the spec's) | Base 35% offence-led, 10% defence-led. National Security -6, Public Trust -3. One or two scenarios after the incident | Smaller than the first attack in both odds and damage |
| Major provider limits UK service (interrupt option C; the 20% is the spec's) | Innovation -5, Economy -3 | Slightly larger than the developer delay in Scenario 1 |
| Follow-on biological plot (biological interrupt forecast) | Base 25% if uplift is real, 5% if marginal. National Security -6, Public Trust -4 | Mirrors the follow-on cyber attack |
| Severe incident after deployment (final forecast; the 40% is the spec's) | 8% when Systemic Risk is 35 or below and sandbagging was an artefact; 20% between the spec's two cases. Damage: National Security -12, Public Trust -8, Systemic Risk +10 | The spec gives only the two ends. Largest damage in the game |

### D3. Scenario options

| Where | Provisional numbers | Derivation |
| --- | --- | --- |
| Scenario 5 option A | "Unverified by polling day" happens 60% of the time | The spec gives the consequence but not the chance |
| Scenario 5 option E (the 90% is the spec's) | A wrong result costs Public Trust -8, Social Stability -4 | An authoritative result that proves wrong backfires harder than silence |
| Cyber interrupt option D | "Damage halved" returns National Security +5, Economy +2, Public Trust +2 after an infrastructure attack; National Security +3, Public Trust +2 after an open-weight incident | Half of each event's damage |
| Biological interrupt, all options | A: PC 1, Public Trust -3. B (emergency synthesis screening): PC 3, National Security +5, Innovation -3, follow-on odds -12. C (allied synthesis controls): PC 5, National Security +4, Cooperation +3, Economy -3, follow-on odds -15, fails below Cooperation 55 (Public Trust -2, cost still paid). D (Evaluation science level 3): as the cyber variant, returning National Security +3, Public Trust +3 | Mirrors the cyber variant option for option; the spec names the options and the Cooperation 55 condition |
| False alarm, all options | The warning is real in 40% of worlds (the spec's "wrong in 60%"). A: PC 1, Public Trust -1; if real, National Security -6, Public Trust -3; if false, Public Trust +2 (tuned in E2). B: PC 3, National Security +4, Innovation -3; if real, National Security -3; if false, Public Trust -2. C (public warning and shutdown): PC 5, National Security +6, Economy -4; if real, Public Trust +4; if false, Public Trust -5. D (Evaluation science level 3): PC 2, National Security +4, Public Trust +2; if real, National Security -3 | Mirrors the cyber variant's costs. Acting on a false alarm costs credibility; ignoring a true one costs more |
| Final decision: costs | A 0, B 4, C 4, D 4, E 6 | The intervention-type cost table: market-access conditions and mandated evaluation 4, restriction 6 |
| Final decision: visible effects | A: Innovation +6, Economy +4, Public Trust -2. B: Innovation +3, Economy +2, National Security +1. C: National Security +2, Innovation -3, Economy -2. D: Cooperation +4, Innovation -3. E: National Security +5, Innovation -7, Economy -4 | A mirrors Scenario 2 option A. E mirrors the Scenario 6 moratorium. B is half of A |
| Final decision: outcomes (failure effects are the spec's) | B: incident odds 6% when State Capacity is 60 or above and Systemic Risk 50 or below, otherwise as A. C has three zones (E1): an economy below 50 is "weak" and forces the spec's reversal, which also means deployment goes ahead; an economy of 55 or above with Public Trust 50 or above earns State Capacity +4, Systemic Risk -5; in between, the delay holds and earns nothing. D succeeding: Systemic Risk -12, National Security +4. E: Systemic Risk -6 if sandbagging was strategic; State Capacity -4 if Innovation is 39 or below (tuned in E6; first drafted as -10 and -8). D is always selectable and fails unless all three of its conditions hold | The spec gives "works when" and "fails when" but no success effects |

### D4. Advisers

| Adviser | Shift applied to the true probability | Derivation |
| --- | --- | --- |
| Shah | -3 points; a further -10 when evidence is Weak, Speculative or Mixed | "Under-weights risks that lack data" |
| Harcourt | +15 points | "Over-estimates threat probability" |
| Chen | -8 points; -10 on labour questions | "Over-estimates the cost of intervention", so discounts the threat that would justify it |
| Okafor | +4 points; +18 on labour, +10 on information | "Over-estimates the permanence of disruption" |
| All four | Noise of up to 8 points either way | Enough that no adviser is reliably best |

### D5. Authored classifications

**Stance ranks** (1 = most permissive; decision 2). Unlocked options have none.

| Scenario | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- |
| 1 Attribution Gap | A reporting pact | D defensive tooling | B procurement standards | C market-access evaluation | |
| 2 Open-Weight Release | A welcome | B evaluation access | D convene allies | C bar derivatives | |
| 3 Biology Result | A fund studies | C synthesis screening | D monitor queries | B tiered access | |
| 4 Graduate Collapse | A let the market adjust | B apprenticeships | D retraining | C levy | |
| 5 Deepfake Election | A say nothing | B unverified statement | C platform friction | D emergency rules | |
| 6 Sandbagging Finding | A evaluation redesign | C joint interpretability | B unannounced evaluations | D moratorium | |
| Interrupts (all three) | A | B | C | | |
| 2032 Threshold | A permit | B strict controls | C delay | D allied pause | E prohibit |

In Scenario 3, tiered access ranks as most restrictive because it is the only option that withholds capability from users; screening and monitoring are duties on providers.

**Restrictive options** (priced by the policy window and the boom surcharge): Scenario 1 B, C. Scenario 2 C. Scenario 3 B, C, D. Scenario 4 C. Scenario 5 C, D. Scenario 6 B, D. Every interrupt's B and C. Final decision B, C, D, E.

**Severe events** (the first to fire triggers the interrupt): infrastructure attack and open-weight incident (cyber variant), biological plot (biological variant). The post-deployment incident is severe but falls on the last turn, so it cannot interrupt.

## E. Balance-tuning log

Phase 3, 2026-09-18. Every change is to a number in `src/content/`; the engine was not touched. Win shares are permissive / middle / restrictive, as percentages of paired-seed runs in which each fixed strategy gave the best ending score.

**Result: Rule 7 passes at 10,000 runs per profile.**

| Profile | Permissive | Middle | Restrictive | Mean ending scores |
| --- | --- | --- | --- | --- |
| Benign | 36.5% | 38.4% | 25.1% | 47.1 / 47.6 / 46.8 |
| Contested | 32.9% | 37.3% | 29.8% | 46.5 / 47.2 / 46.9 |
| Hard | 29.1% | 37.0% | 33.9% | 46.0 / 46.8 / 46.9 |

The harness is deterministic, so this result is exact until content changes. `npm run balance` runs in CI.

| # | Change | Kind of number | Why | Win shares before | After |
| --- | --- | --- | --- | --- | --- |
| E0 | Starting point: section D as signed off | | | Benign 55/13/32, contested 45/14/41, hard 37/15/49 | |
| E1 | Final decision option C gains a middle zone. It had failed whenever the economy was below 55 or Public Trust below 50. Now an economy below 50 is "weak" (the spec's forced reversal, Public Trust -8); 55 and above with Public Trust 50 and above earns the dividend; in between the delay holds and earns nothing | Provisional structure | The spec says C works at 55 and fails when the economy is "weak", and is silent in between. Always-middle takes C and was failing it in 100% of games, losing 2.7 points of ending score each time | As E0 | Benign 39/50/11, contested 33/45/21, hard 26/46/28 (with E2) |
| E2 | False alarm option A: if the warning is real, National Security -6, Public Trust -3 (was -8, -4); if false, Public Trust +2 (was nothing) | Provisional | A was the worst option whether the alarm was real or false, so it was never a real choice | | |
| E3 | Scenario 2 option B fails below Cooperation 45 (the spec says 40) | **Spec number** | Section C noted that the threshold of 40 can never bite. At 45, the starting level, B succeeds only if the player has invested in Diplomacy first, which makes it a gamble on the Cooperation metric as the spec intends | | |
| E4 | Added, then withdrawn: one fact-conditional hidden effect on the waiting option and one on the most restrictive option in each fact-linked scenario | Additions | They made Rules 4 and 5 hold in every fact-linked scenario, and made Rule 7 unpassable. See "Rules 4 and 5" below | Benign 39/50/11, hard 26/46/28 | Benign 61/20/19, hard 16/10/74. Withdrawn |
| E5 | Scenario 6 option D (moratorium): if the behaviour was an artefact, Public Trust -1 (the spec says -3) | **Spec number** | The moratorium's fact-conditional outcomes are the largest source of always-restrictive's tilt between benign and hard worlds. Softening the penalty lifts always-restrictive in benign worlds without lifting it in hard ones | Benign 40/39/21, contested 33/38/29, hard 24/35/40 | As the result table (with E6 to E8) |
| E6 | Final decision option E: Systemic Risk -6 if sandbagging was strategic (was -10); State Capacity -4 if Innovation is 39 or below (was -8) | Provisional | As E5: flattens always-restrictive's tilt, and halves a penalty that always-restrictive triggers in every game | | |
| E7 | Privacy controversy and free-speech challenge: Public Trust -4 (was -3) | Provisional | Both fall only on always-middle's options; always-middle led in every profile | | |
| E8 | Open-weight defence model: 40% in every world, with a further National Security +4 if offence leads (was 30% offence-led, 55% defence-led, no bonus) | Provisional | The draft made always-permissive's one upside pay out mostly in benign worlds, where it already led. A defence model is plausibly worth most where offence leads | | |

E5 to E8 were chosen from a grid of 144 configurations evaluated in memory; the seven best were re-run at 10,000 runs. The configuration adopted changes the fewest spec numbers among those with a worst share below 39%.

### Rules 4 and 5: an open design question for the designer

**Status: open. Rule 7 is the automated gate in both documents, and it passes. Rules 4 and 5 do not hold in most scenarios, and they cannot be made to hold alongside Rule 7 as the spec words them.**

`npm run balance -- --rules` values every option by forcing it and playing every other decision with the neutral policy. On the shipped numbers:

| Scenario | Rule 4: is the waiting option ever best? | Rule 5: is the most restrictive option ever best? |
| --- | --- | --- |
| 1 Attribution Gap | No | Only in the benign profile, by a margin inside the noise |
| 2 Open-Weight Release | Yes, in every profile | No |
| 3 Biology Result | Yes, in every profile | No |
| 4 Graduate Collapse | No | No |
| 5 Deepfake Election | No | Yes, in every profile |
| 6 Sandbagging Finding | No | No |
| 2032 Threshold | Only when sandbagging was an artefact | Yes, in every profile |

Two findings explain this.

1. **The spec's odds modifiers are additive, so their value does not depend on the world.** Cutting attack odds by 10 points is worth the same ending score whether the base is 50% or 15% (the clamp aside). An option's rank therefore barely moves between profiles. Only effects that are conditional on a latent fact ("plot odds -10 if uplift is real") make an option better in one world than another, and the spec has few of them.
2. **Judged by profile, Rules 4 and 5 pull against Rule 7.** All five latent facts move with the profile. If in every scenario the most restrictive option is best in the hard profile, then always-restrictive is close to the best policy in hard worlds, and it wins far more than 40% of runs there. E4 tested this directly: with Rules 4 and 5 holding in every fact-linked scenario, always-permissive won 61% of benign runs and always-restrictive 74% of hard runs. The grid search confirmed it from the other side: every configuration within reach of Rule 7 had those fact-conditional effects at zero.

Options for the designer (all are changes to JSON or to one line of the harness, not to the engine):

- **A. Keep the spec's wording; accept the current state.** Rule 7 passes. The game does not push a policy line through the fixed strategies, but in several scenarios the most restrictive option is never the best choice, which is a neutrality risk of its own.
- **B. Judge Rule 7 across all worlds pooled, rather than per profile.** Then a strategy may dominate the profile it suits, which is what Rules 4 and 5 ask for. The E4 effects can be restored and re-tuned so that the pooled shares stay under 40% (E4 as first drafted gave pooled shares of 38 / 15 / 47, so it needs rebalancing, not redesign).
- **C. Judge Rules 4 and 5 by latent fact rather than by profile** ("restriction is best when offence leads") and restore smaller fact-conditional effects. This lessens the conflict but does not remove it, because facts and profiles are correlated.

The builder's recommendation is B: it is the only reading under which all seven rules can hold at once, and it matches the thesis that restriction is right in some worlds and wrong in others. Until the designer decides, the game ships on option A.
