# Architecture reliability implementation plan

> **For the implementing agent:** Use `superpowers:executing-plans` to implement this plan task by task, and `superpowers:test-driven-development` for behaviour changes. Use the `codebase-design` vocabulary for module, interface, seam, adapter, depth, leverage and locality.

**Goal:** Make debrief calculations fail visibly and recover safely, keep completed-turn reporting coherent, and prevent content from using condition semantics the game cannot correctly explain.

**Architecture:** A deep debrief-calculation module owns worker lifecycle; a private session module owns completed-turn coherence. Condition truth and the supported probability subset share one semantic module, with content validation enforcing where each interpretation is allowed. Preserve the deterministic engine, public display projections and existing gameplay.

**Tech stack:** Existing TypeScript, React 18, Zod, Vitest and Playwright; browser Web Workers. No new dependencies.

**Status:** Proposed implementation plan, not implemented. Based on three Sol investigations of revision `9a1d07e`. Line anchors below describe that revision; locate named functions if they move.

## 1. Findings and priorities

| Finding | Evidence | Required response |
| --- | --- | --- |
| Native worker failures can strand calculations | `src/ui/useGame.ts:89–106` registers only messages and stores resolve-only callbacks | Own readiness, rejection, transport failure and disposal in one module |
| Soundness error replies disappear; What-if rejections are invisible | `src/ui/useGame.ts:110–117,134–143`; `src/ui/debrief/WhatIfPanel.tsx:37–45` | Explicit loading, success and failure presentation, with retry |
| Configuration with all profile weights zero prevents page startup | `src/content/overrides.ts:41–50,73–80`; configuration applied during `useGame` module import | Validate the effective configuration before committing it; ignore an invalid URL configuration as a whole |
| Completed turn is reconstructed from separately owned facts | `src/ui/App.tsx:39–41,150–153,190–215`; `src/ui/useGame.ts:48–63` | Atomic identity and before/after snapshots in the private session module |
| Accepted condition grammar exceeds probability/luck semantics | `src/content/schema.ts:44–56`; `src/engine/resolve.ts:74–103`; `src/engine/scoring.ts:78–114` | Shared semantic ownership and context-sensitive validation |

The turn finding is a maintainability risk: no player-visible failure was demonstrated. The condition finding is a verified accepted-content defect: nested hidden alternatives lose luck links, and repeated facts/draws are incorrectly treated as independent. Current authored scenarios were not shown to produce wrong outcomes from these cases.

Priority order: invalid configuration and debrief failure handling first; condition enforcement next; completed-turn coherence last. Complete all mandatory tasks below. The grammar expansion in section 7 is explicitly deferred.

## 2. Constraints and planning defaults

Read `CLAUDE.md`, `DECISIONS.md`, `docs/spec.md`, `docs/handoff.md`, `docs/plan.md`, and `docs/ui-engagement-handoff.md` before implementation. The old public-engagement execution handoff concerns that completed redesign; its historical next-task instructions are not this plan's starting point. Preserve these decisions:

- A6/B36–B39: soundness uses the published prior; What-if compares paired fresh worlds within the player's profile. No hindsight rewind or arithmetic changes.
- B20/B21/B33/B40: engine imports through its public entry, hidden content stays behind public projections, debrief reveal timing remains unchanged.
- B28/B29: legality stays in the engine; invalid actions throw without partially changing session state.
- B41: facilitator edits travel with seed links; page, worker and displayed assumptions use the same effective edits.
- F5/F6: news uses the completed turn, exposes no hidden remainder or estimate-band change, and the first-decision pause remains a reading stage outside the engine.
- F24: unaffordable alternatives remain visible and labelled, including per-world substitution wording.
- Keep the dependency set, British English, accessibility requirements, deterministic randomness and eight-turn structure.

Defaults selected for this plan (record them in `DECISIONS.md` when implemented):

1. **One worker, explicit retry.** Keep one worker per active game session. No automatic retries, arbitrary timeout, second worker, cache or background queue framework. Pending work can remain pending on a slow device; detected failures must settle. A watchdog for a genuinely hung worker is a separate product decision.
2. **Retry recreates after transport failure.** Native load/error/messageerror failures invalidate and terminate that worker; a subsequent explicit retry creates and configures a fresh worker. A calculation-specific error rejects only its request and need not kill an otherwise healthy worker.
3. **Reset cancels obsolete work.** Starting/resetting a game or disposing the hook terminates the old worker and rejects outstanding work as cancelled. Old replies cannot alter current results. React development effect cleanup must not leave a terminated worker available for reuse.
4. **Errors explain the missing result.** Soundness failure says rankings are unavailable and offers retry; it must not label the player's decision sound/risky without a ranking. What-if failure offers retry. Retain a previous successful answer only when its decision and alternative still match, and label it as the previous result while rerunning or after a failed rerun.
5. **Reject invalid shared configuration atomically.** Invalid effective profile weights discard the entire URL override set and use published content; keep direct `applyOverrides` strict. The facilitator editor should show its existing validation error rather than silently discarding edits during authoring.
6. **Constrain conditions before extending them.** Support the authored probability subset explicitly and reject unsupported expressions before play. Keep recursive truth-only conditions, including the current Unknown Frontier ending. Do not add observable-gated luck or change decision records in this implementation.
7. **Keep reading stages in App.** Session owns completed-turn facts, App owns when to show briefing/news/pause/debrief. Keep the completed turn until the next completion or start/reset; leaving news cannot clear it because pause still needs it.

These defaults allow implementation without an additional design interview. Revisit only if a verified existing behaviour conflicts; document the specific conflict rather than silently broadening scope.

## 3. Delivery sequence and verification discipline

Use a feature branch with the `codex/` prefix. If isolating work, place the worktree outside the repository; nested checkouts previously broke lint. Recheck the working tree and preserve unrelated work. Planning does not authorise merging or deployment.

Dependencies:

```text
Task 0: baseline
  ├─ Task 1: effective configuration ─ Task 2: calculation module ─ Task 3: UI recovery ─ Task 4: browser verification
  ├─ Task 5: condition contract ─ Task 6: semantic locality
  └─ Task 7: session coherence ─ Task 8: screen integration
All paths ─ Task 9: final gates and documentation
```

The sequence is conceptual; execute serially by default. Tasks 2, 3 and 7 overlap in `useGame.ts` and must not be edited concurrently. Task 7 should land after the debrief changes even though its logic is independent.

For each behaviour-changing task:

1. Add the specified regression first.
2. Run the named focused suite and observe the expected assertion failure on current behaviour, not an unrelated setup failure.
3. Implement only that task's ownership/behaviour change.
4. Run the focused suite, then `npm run typecheck` and `npm run lint`.
5. Commit the named files as one reviewable change when green. Do not commit generated browser output.

Use existing test fixtures and Node-based Vitest; do not add a DOM testing dependency. Test pure session/calculation modules through their interface and rendered interaction through Playwright. Existing deterministic-engine tests should survive intact.

### Task 0: Establish the compatibility baseline

**Read:** `tests/engine/fixture.ts`, `tests/engine/counterfactual.test.ts`, `tests/ui/consequences.test.ts`, `e2e/play.ts`, `e2e/debrief.spec.ts`, `e2e/engagement.spec.ts`, `e2e/regressions.spec.ts`.

1. Record the actual starting revision and worktree status.
2. Run `npm run lint`, `npm run test`, `npm run build` and the baseline balance gate. Record failures already present separately.
3. Capture deterministic outputs for representative existing seeds using the repository fixtures: complete history, ending, forecasts, luck links and small fixed-run counterfactual/soundness results. Store comparison data outside the repository unless a small justified fixture is needed for a regression.
4. Inspect authored condition sites, including arrays that legitimately mean unconditional truth. Verify the proposed validation subset accepts all bundled content before changing it.

**Exit:** baseline evidence exists; no balance or content change is being disguised as a refactor. Baseline failures do not justify unrelated repairs without diagnosing them.

### Task 1: Reject invalid effective URL configuration before startup

**Modify:** `src/content/overrides.ts`, `src/content/index.ts`, `src/ui/useGame.ts`.
**Inspect/modify if needed:** `src/ui/screens/Facilitator.tsx`.
**Tests:** `tests/content/overrides.test.ts`; add startup regression to `e2e/regressions.spec.ts`.

1. Add tests for all-zero weights; partial overrides whose effective total is zero on supplied base content; valid partial weights; malformed encoding; valid edited facts/events; and unchanged bundled data.
2. Introduce one content-level URL-resolution operation returning both effective content and the accepted overrides. Parse first, validate effective weights against supplied content, then apply. On invalid user configuration return bundled content with `{}` accepted edits. Do not catch unrelated loader/programming errors.
3. Keep `applyOverrides(content, overrides)` throwing on impossible profile weights for trusted/programmatic use. Unknown event IDs/slots retain existing ignore behaviour; do not broaden this task into a new editor policy.
4. Build `pub`, `published`, override count, worker configuration and any exported overrides from the same resolution result. Never send the rejected edits to the worker or show an edited-assumptions notice for discarded edits.
5. Browser regression: load a seed link containing all-zero weights; title renders, a game starts, and there is no uncaught startup error. A valid edited link still uses its edits and shares them.

Representative regression input:

```ts
const invalid = { weights: { benign: 0, contested: 0, hard: 0 } };
const cfg = encodeOverrides(invalid);
// Resolve cfg against real bundled content: content equals published defaults,
// accepted overrides equal {}, count equals 0; original bundle is unchanged.
// Direct applyOverrides(content, invalid) must still throw.
```

**Run:** `npm run test -- tests/content/overrides.test.ts`.
**Commit:** `fix: safely resolve shared game configuration`.

### Task 2: Deepen the debrief-calculation lifecycle

**Create:** `src/ui/debrief/calculations.ts`, `src/workers/counterfactual.protocol.ts`, `tests/ui/debrief-calculations.test.ts`.
**Modify:** `src/workers/counterfactual.worker.ts`, `src/ui/useGame.ts`.

1. Move message types into the side-effect-free protocol file. Importing types must never initialise worker globals or load content.
2. Implement a calculation module that owns a lazy worker, configure acknowledgement, request correlation, pending resolve/reject callbacks, failure conversion and disposal. Expose the two calculation purposes and disposal, rather than a generic protocol sender callers must interpret.
3. Accept a worker factory as the internal seam. Production supplies the browser Worker adapter; tests supply a controllable adapter with actual message/error event behaviour. Keep transport details inside this module.
4. Track configuration as a real pending operation. Send calculation requests only after the matching configured acknowledgement. Configuration error rejects all waiting work and disposes the worker; a later retry starts fresh.
5. Register message, error and messageerror handlers before sending. Catch synchronous construction/postMessage errors. Remove pending entries before settling callbacks. Unexpected response kind for a known request rejects that request; unrelated or late IDs cannot settle a different call.
6. On a native transport failure or disposal, reject every pending request exactly once, clear bookkeeping, detach handlers and terminate the worker. Disposal is idempotent. A new logical session receives a fresh module instance; a disposed instance must not accept work.
7. Preserve the current request data and worker timing measurement. Do not export raw decision states from the hook or expose transport internals to screens.

**Regression matrix through the module interface:**

| Stimulus | Expected observation |
| --- | --- |
| Two calls before ready | One worker/configure; both calculations wait for acknowledgement |
| Responses arrive in reverse order | Each promise receives its matching result |
| Worker returns calculation error | Matching promise rejects; subsequent valid work succeeds |
| Constructor or postMessage throws | Caller rejects; no stranded request |
| Native error/messageerror | All affected promises reject; next explicit retry reconfigures |
| Configure fails | No calculation sent; all waiting calls reject |
| Dispose during configure or calculation | Calls reject as cancelled; worker terminates once |
| Late reply from old worker | No result applied to a new session |
| Duplicate response | Promise settles once |

Use deferred test promises and explicitly emitted events; no sleeps. Assert results, settlements and observable adapter messages rather than private map sizes.

**Run:** `npm run test -- tests/ui/debrief-calculations.test.ts tests/engine/counterfactual.test.ts`.
**Commit:** `refactor: own debrief calculation lifecycle`.

### Task 3: Show recoverable calculation failures

**Modify:** `src/ui/useGame.ts`, `src/ui/App.tsx`, `src/ui/screens/Debrief.tsx`, `src/ui/debrief/QualityPanel.tsx`, `src/ui/debrief/WhatIfPanel.tsx`, `src/ui/debrief/copy.ts` as needed.
**Tests:** extend `tests/ui/copy.test.ts`; rendered coverage in Task 4.

1. Replace ambiguous null-only soundness state with explicit idle/loading/ready/error states and a retry action. Update every ranking consumer, including debrief sharing or summaries, without synthesising rankings on failure.
2. Keep the existing stale-soundness guard and scope every result to its originating session. Reset/start clears rankings and cancels old calculation work. Cleanup/setup under Strict Mode must create a usable fresh lifecycle.
3. Catch What-if rejection in the event handler. Cancellation caused by leaving/resetting the session is silent; actual failure is rendered and retryable. Preserve the existing decision-and-alternative match check for displayed answers.
4. Soundness copy: “We couldn’t compare your decisions. Try again.” Action: “Retry decision comparison”. Do not leave “Weighing…” on screen after known failure or fabricate a quality tally.
5. What-if copy: “We couldn’t complete the rerun. Try again.” Action: “Retry rerun”. If a matching prior answer is retained, visibly distinguish it from the failed/latest attempt.
6. Announce status/error changes through an appropriate live region without forcibly moving focus. Preserve keyboard control, accessible button names and normal successful copy.
7. No new timer or automatic retry loop. An outstanding soundness calculation may still precede What-if in the single worker; retain the existing performance gate and record any observed latency issue separately.

**Run:** `npm run test -- tests/ui/copy.test.ts tests/ui/debrief-calculations.test.ts`.
**Commit:** `fix: make debrief calculation failures recoverable`.

### Task 4: Verify recovery with the built browser worker

**Create:** `e2e/debrief-recovery.spec.ts`.
**Retain:** `e2e/debrief.spec.ts`, `e2e/engagement.spec.ts` and existing successful performance checks.

1. Use existing play helpers to reach the debrief. Collect page errors/unhandled rejections.
2. Through a test-scoped Worker constructor adapter installed before page load, inject native worker failure and calculation error replies. Forward unaffected operations to the real Worker. Do not add fault switches or globals to production code.
3. Assert soundness and What-if leave loading, show the correct recoverable message, and recover after a successful retry. Confirm no unhandled rejection.
4. Start a new game while old work is outstanding; old worker is terminated and delayed old replies cannot update the new session.
5. Verify configuration in the real built worker with valid edited content and the rejected all-zero URL. Compare worker output with a deterministic expected result built from the same effective content; merely checking that a result appears is insufficient.
6. Run the new error states through axe in light/dark mode and at phone width using existing helpers. Check retry focus and keyboard operation.

**Run after a fresh build and port check:** `npm run e2e -- e2e/debrief-recovery.spec.ts e2e/debrief.spec.ts`.
**Exit:** both simulated transport failures and actual built-worker happy paths are covered. Keep the 1,000-rerun responsiveness and under-three-second gate; do not weaken it to accommodate a refactor.
**Commit:** `test: cover debrief failure and retry flows`.

### Task 5: Enforce the supported condition contract

**Create:** `src/engine/conditions.ts`, `tests/engine/conditions.test.ts`.
**Modify:** `src/content/load.ts`, `src/content/schema.ts` only if required for structural checks.
**Tests:** extend `tests/content/content.test.ts`.

1. Define condition-expression inspection in the engine-owned semantic module so validation and execution use the same rules. Content can import this module; engine must not import the content loader. Keep it private to the engine's public entry unless an existing public consumer actually needs it.
2. Preserve truth semantics: fields in a node are conjoined, expression arrays are conjoined, `any` is recursive, and `not` negates the whole node. Do not globally ban recursive conditions: authored endings use them correctly.
3. For probability-bearing forecast expressions, require a non-empty conjunction of plain hidden atoms: exactly one seed fact OR keyed draw per node, with optional negation. Reject `any`, observable gates, mixed atom nodes, and repeated hidden identities within that expression. Repetition across separate expressions remains valid; keyed draws with different thresholds under the same key are still one identity and must be rejected within the supported conjunction.
4. For each choice conditional-effect expression used by luck, recursively inspect for hidden dependencies. If any are present, require the same supported hidden-only conjunction. Purely observable conditions remain legal and do not become luck links. This prevents nested hidden facts from escaping detection and prevents observable gates from being re-evaluated incorrectly at debrief.
5. Reject empty condition objects (including `{not:true}` with no predicate) with a location-specific error. Preserve empty condition arrays where they already mean unconditional truth. Do not accidentally forbid default `succeedsWhen ?? []`, empty requirements, or an unconditional effect array.
6. Audit each condition-bearing site and classify it by its actual consumer: forecast, choice conditional effect, requirements, success/failure checks, event effects/mitigations/base cases, adviser memory, briefing/reveal and ending. Truth-only sites retain the recursive grammar. Do not restrict briefing signals merely because advisers are involved; inspect whether the caller asks for truth or probability.
7. Include scenario/event/choice ID and expression path in validation errors. Failure must happen at content load before gameplay, not silently omit a luck link.

Regression examples:

```ts
const nested = [{ any: [
  { seedFact: "cyberOffenceLed" }, { seedFact: "bioUpliftReal" },
] }];
const repeatedFact = [
  { seedFact: "cyberOffenceLed" }, { seedFact: "cyberOffenceLed" },
];
const repeatedDraw = [
  { draw: { key: "same", probability: 30 } },
  { draw: { key: "same", probability: 30 } },
];
// As choice hidden conditional effects or forecast expressions: reject each.
// As a truth-only ending: nested remains valid and resolves recursively.
// All bundled content must continue to pass findProblems unchanged.
```

**Run:** `npm run test -- tests/content/content.test.ts tests/engine/conditions.test.ts`.
**Commit:** `fix: reject unsupported probabilistic conditions`.

### Task 6: Concentrate condition semantics without changing model outputs

**Modify:** `src/engine/conditions.ts`, `src/engine/resolve.ts`, `src/engine/scoring.ts`, internal call sites if needed.
**Tests:** `tests/engine/conditions.test.ts`, `tests/engine/scoring.test.ts`, `tests/engine/counterfactual.test.ts`.

1. Move exact condition evaluation and supported probability interpretation into the semantic module. Remove the independent top-level probability traversal in `priorChance` and hidden-fact scan in scoring. Do not merely relocate three inconsistent implementations.
2. Within-profile chance for a supported conjunction is the product of each distinct atom's marginal (complemented for `not`). Published-prior chance is the weighted sum of those complete within-profile conjunction probabilities; never multiply globally averaged marginal probabilities, which would lose profile correlation.
3. Probability evaluation rejects expressions outside the supported subset even if called directly without content validation. It must never call realised-world truth evaluation as a fallback for nested hidden facts.
4. Keep observable truth evaluation deterministic. Extract the small composite arithmetic dependency if needed to avoid a `conditions`↔`resolve` import cycle; use the existing formula and retain one owner of it. Do not add a configurable adapter where nothing varies.
5. Assert exact behaviour for known simple facts, distinct draws, negation, weighted priors and truth-only nested alternatives. Direct probability calls on repeated facts/draws now throw a descriptive unsupported-expression error instead of returning .5625/.09.
6. Compare every authored probability expression and the Task 0 seed outputs with baseline results, including facilitator-edited profile weights/facts. Expect unchanged authored results and unchanged balance.
7. Do not freeze new luck data into `DecisionRecord` in this scope: all accepted hidden luck conditions now depend only on immutable seed facts/keyed draws. Document why observable-gated luck remains unsupported.

**Run:** `npm run test -- tests/engine/conditions.test.ts tests/engine/scoring.test.ts tests/engine/counterfactual.test.ts tests/content/content.test.ts`.
**Commit:** `refactor: centralise supported condition semantics`.

### Task 7: Make completed-turn facts atomic inside the session

**Create:** `src/ui/session.ts`, `tests/ui/session.test.ts`.
**Modify:** `src/ui/useGame.ts`, `eslint.config.js` and associated import-guard tests as needed.

1. Extract the existing reducer into a private, pure session implementation accepting content. Keep game state and decision snapshots internal to that implementation/hook; screens must never import raw session state.
2. Extend the session with one completed-turn record containing the outgoing turn/scenario identity and before/after `displayed()` snapshots. Derive all three in the same transition around ADVANCE. Do not accept an identity provided by App.
3. Hide completion ordering behind the session's completion operations: non-final completion invests then advances; final completion decides then advances. Keep forecasting, analysis purchase and ordinary decisions behaving as before. Capture the soundness decision snapshot once per accepted decision.
4. Build the new completed-turn value only after the whole operation succeeds. An illegal action must not replace the game, prior completed turn or decision snapshots. Retain immutable reduction.
5. Clear completion on start/reset and replace it on the next completed turn. Keep it available throughout news and pause. A final completed-turn after-view may contain debrief fields internally; only the existing safe projection is consumed during news.
6. Add narrow import guards so only `useGame.ts` and tests may use private session implementation. If a lint exemption is needed for the new owner of raw state, exempt that exact file, not all UI modules. This explicitly replaces the literal “raw state never leaves this file” comment with “raw state stays inside the private session and hook”; the disclosure invariant is unchanged.

Regression cases: ordinary successor, real interrupt, false alarm, final turn, first-turn pause retention, restart, illegal completion and failed action batch. Assert identity equals the before snapshot, the after snapshot is the exact resulting displayed view, decision capture count is correct, and no partial update occurs. Do not assert that `DisplayedState` lacks debrief fields after the final turn; test the news projection instead.

**Run:** `npm run test -- tests/ui/session.test.ts tests/ui/consequences.test.ts tests/engine/headlines.test.ts`.
**Commit:** `refactor: keep completed turns coherent in session`.

### Task 8: Remove duplicated turn identity from screens

**Modify:** `src/ui/App.tsx`, `src/ui/useGame.ts`, `src/ui/screens/News.tsx`, `src/ui/screens/FirstDecision.tsx`, `src/ui/components/StatusPanel.tsx` only if required by changed prop wiring.
**Retain:** `src/ui/consequences.ts`, `tests/ui/consequences.test.ts`.
**Tests:** existing `e2e/regressions.spec.ts`, `e2e/engagement.spec.ts`; extend only for an uncovered transition.

1. Remove App's independent `resolved` state and its render-closure capture. App consumes the completed-turn fact produced by the session and switches reading stage after successful completion.
2. Build `consequencesOf` once from that coherent record for news/pause. Keep the helper as the tested privacy implementation; do not duplicate it or move presentation rules into the engine. App may still use safe snapshot fields for the status rail.
3. News and pause receive the coherent public result and required public identity/seed information. Remove the partial-news fallback for a missing pre-view: reaching news without a completed turn is an invariant failure, not valid partial content.
4. Preserve the existing rail/final-turn distinction, crisis clock steps, title/restart seed handling, focus movement, one-time pause, Stop here behaviour and disclosure restrictions.
5. Existing consequences/privacy tests and full journey tests should remain behaviourally unchanged. Verify continuing after Stop here produces the same game as uninterrupted play.

**Run:** `npm run test -- tests/ui/session.test.ts tests/ui/consequences.test.ts`; after build, `npm run e2e -- e2e/regressions.spec.ts e2e/engagement.spec.ts`.
**Commit:** `refactor: render completed turns from one session fact`.

### Task 9: Final verification, records and handoff

**Modify:** `DECISIONS.md`, `docs/plan.md`, `README.md`, and this plan's status as appropriate after implementation.

1. Record actual decisions and validation evidence, including explicit retry, cancellation, effective configuration fallback, supported condition contexts and private session ownership. Do not record unimplemented optional grammar expansion as an accepted decision.
2. Update README organisation notes where the literal useGame-only raw-state claim changes. Keep public projections and authoring restrictions explicit. Link this plan from `docs/plan.md` without marking historical human playtests complete.
3. Compare Task 0 deterministic results. Any authored output difference needs a concrete explanation and separate model-change decision; do not update expected values just to make tests green.
4. Run the full local gate, in order:

```bash
npm run lint
npm run test
npm run balance
npm run build
lsof -nP -iTCP:4173 -sTCP:LISTEN
npm run e2e
du -sk dist
```

The port check must print nothing before the e2e run; inspect and stop only a known stale project preview if necessary. Expect all suites to pass, balance rules unchanged and bundle below 16,384 KB. If a focused browser check already left a preview running, do not accidentally verify stale output.

5. Review the diff for accidental public raw state, weakened lint rules, new dependencies, hidden-data rendering, changed probabilities and generated files. Record results and remaining human-only items accurately.
6. Commit documentation and final verification record. Prepare a reviewable summary/PR when requested by the execution workflow; merge and deployment remain outside this plan's authorisation.

**Done means:** known failures settle and recover visibly; effective configuration cannot break startup; supported content and interpretation agree; completed turns have one owner; current authored gameplay is unchanged; all required gates pass.

## 4. Why these modules earn their depth

- Deleting the calculation module would force readiness, request matching, cancellation and failure policy into both callers. A generic send-message helper alone would not solve this.
- Deleting the session completion record would restore independent identity and snapshot coordination. Do not turn every engine action into a trivial pass-through method; deepen only the completion seam.
- Deleting the condition module would recreate subset validation and probability interpretation in multiple places. Validation and interpretation must consume the same rules.
- Deleting `consequencesOf` would duplicate privacy logic in news and pause. Preserve it.

## 5. Review boundaries and risks

Review the debrief failure copy and accessibility as part of the built result, not as a blocker to writing the fixes. The main migration risks are stale callbacks, Strict Mode cleanup, rejected configuration reaching the worker, overly broad condition rejection, weakened raw-state import rules, and final-turn news revealing debrief data. Each has a named regression above.

This plan does not claim that worker load failures, all-zero links or unsupported authored conditions occurred in an actual player's session. The source paths and in-memory examples establish reachable failure behaviour. The completed-turn work reduces coordination risk rather than fixing a reproduced current bug.

## 6. Coverage of subagent recommendations

| Recommendation | Disposition |
| --- | --- |
| Readiness handshake, errors, disposal, stale replies | Tasks 2–4 |
| UI-visible failure and retry | Tasks 3–4 |
| Invalid effective facilitator configuration | Task 1 |
| Atomic completed turn and simpler callers | Tasks 7–8 |
| Keep consequences privacy helper and reading stages | Tasks 7–8 |
| Detect nested hidden dependencies and repeated keyed facts | Tasks 5–6 |
| Shared condition ownership | Task 6 |
| Full recursive probabilistic grammar | Deferred extension below; mandatory work rejects unsupported uses |
| Decision-time frozen observable-gated luck | Deferred with grammar expansion; currently unsupported uses are rejected |
| Multiple workers, timeouts, automatic retries | Not needed for demonstrated defects; revisit only with measured need |

## 7. Deferred extension: full probabilistic condition grammar

No current authored scenario requires this extension. The mandatory plan closes the accepted-content defect by validation and makes the implementation agree with the supported contract. If authors need recursive probability conditions later, implement a separate model extension:

1. Specify which observable values are known and at what instant; metrics may represent hidden truth and must not automatically count as player knowledge.
2. Use one recursive truth evaluator over assignments. Within a profile enumerate the five seed facts and each unique keyed-draw variable, then weight assignments. Mix complete profile probabilities for published-prior belief.
3. Repeated keyed draws share one uniform variable. Different thresholds on one key require partitioning that variable's range at the thresholds; treating each predicate as an independent Boolean is wrong.
4. Define a complexity limit for authored expressions before implementing enumeration. Avoid unbounded exponential work when unique draw keys grow.
5. Freeze luck probability and realised outcome at the exact pre-effect state used by `applyDecision`, alongside decision records, before later observable values can change. Keep those fields private until debrief and do not silently add a second capture policy based on an earlier UI click.
6. Add truth/probability equivalence tests, De Morgan cases, repeated/complementary predicates, threshold correlations, profile mixtures, observable-gate timing and no-information-leak checks. Extend player-facing condition descriptions for newly supported expressions as well.
7. Remove restrictions only after the new semantics, validation, copy and balance gates agree. Treat any changes to existing authored outputs as model changes requiring explicit review.

This is a deliberate deferral of capability, not an unresolved blocker for Tasks 0–9.
