# Public-engagement UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild AI 2032's interface for a general, non-professional audience — dilemma-first opening, approachable briefing and forecast, a legible decision–investment–consequences turn, a five-minute first-decision pause, a debrief built for conversation — while keeping the engine, content, determinism and hidden-information boundary untouched.

**Architecture:** Eight phases (8–15, continuing `docs/plan.md`). Every change is UI-only in `src/ui/**`, plus e2e/unit test guards and docs; `src/engine/**` is never edited and `src/content/**` gains only new public fields. Each phase is TDD task-by-task (failing test → implement → pass → commit) and ends at a local gate (`npm run lint && npm run test && npm run balance && npm run build && npm run e2e`). The work happens on a feature branch and reaches `main` only by a pull request the designer approves.

**Tech Stack:** React 18 + TypeScript (strict, `noUncheckedIndexedAccess`), Vite, Tailwind-style utility classes on the existing ink/paper design tokens, Zod-validated JSON content, Vitest for pure helpers, Playwright + axe for e2e and accessibility. Fixed dependencies — nothing may be added.

**Brief:** `docs/ui-engagement-handoff.md` (the user's audience clarification there is authoritative: everyone, not policy professionals).

---

## Shared contract

Every phase below was drafted against this contract. When a phase cites "contract D7", "non-negotiable 6" or a "shared name", it means this section. The plan's decisions D1–D13 are logged into `DECISIONS.md` by Phase 8 (Task 8.7): D1 becomes section A row 14; D2–D13 become section F rows F1–F12 in the order given (D2→F1 … D13→F12). Phase 11 adds rows F13 onward. Later phases cite the F numbers, because in `DECISIONS.md` "D1" to "D5" already name the provisional-numbers subsections.

### 1. Decisions (defaults the plan adopts; each can be overturned by the designer at a review gate)

- **D1 Audience.** Everyone. New `DECISIONS.md` row 14 (the user's clarification in the handoff is authoritative). Solo public play is primary; "play the same world as a friend" is optional; the facilitator panel stays behind `?facilitator=1` unchanged.
- **D2 Visual system.** Keep `DECISIONS.md` decision 13 (IBM Plex, square corners, ink/paper/canvas, hairlines, inversion, one navy accent for function, no shadows, no gradients, no emoji). Remove print-production TEXT labels only: the `figureId` strip text ("COVER · 720PT", "TURN 1 · BRIEFING · 720PT"), `Figure` `state` ("720PT", "48MM") and the "Fig. NN" prefix in captions. Keep the artboard corner ticks and the plate captions (they are the only description of each image). Mono microlabels become at least 12px (`text-xs`). Engagement comes from content order, pacing and feedback, never from points, badges, streaks, scores to beat, confetti, sound, real-time timers, red/green good-bad colouring, or animation beyond simple CSS transitions (`DECISIONS.md` F1).
- **D3 Opening.** Dilemma first. Primary CTA text is exactly **"Try your first decision"** (replaces "Begin"). The seed field moves into a `<details>` titled "Play the same world as a friend", open by default when `?seed=` is present; its label still starts with "Seed code". The fictional-unit disclaimer stays on the title screen. The CTA must be inside the first viewport at 375×667, 726×900 and 1280×800.
- **D4 Forecast.** Gut feel first, then compare. The single native range slider stays the first tab stop after the h1 and defaults to 50. After it in DOM order: a quiet button "Compare with your advisers" that reveals the four adviser estimates as marks on the same 0–100 scale plus the sentence "You said N%. Your advisers range from A% to B%." The primary button "Lock in N%" is always enabled (reveal is optional). No average/consensus marker. The first guess is not stored (YAGNI).
- **D5 Advisers.** Zero new content: each card shows name and role, "Cares about: {lens}" (public field never rendered today), "Backs option X: {choice text}", then the stance. A "Who backs what" split lists every open option with the advisers backing it. Authored one-line gists are deferred until a playtest asks for them.
- **D6 Consequences.** Four parts in the main column, built by a pure helper: Your decision; What the world noticed (keep this exact h2); What you can measure now; Still unknown. Never show a per-metric "stated minus measured" remainder. Never show estimate-band deltas. Never read `view.current`, `view.truth`, `view.debrief` or `view.history` on the News screen.
- **D7 Five-minute taster (handoff "introductory route").** Option A: a UI-only "pause" stage after turn 1's consequences, in every game: a reflection card with "Keep going" and "Stop here". No engine or content change. Continuing plays the same state.
- **D8 Save and resume.** OPTIONAL phase (Phase 14). Needs designer approval because spec §13 lists "saved games" as out. If approved: store only `{v, contentId, seedCode, cfg, actions, stage, resolved, at}` in localStorage key `ai-2032:save:v1`; rebuild by replaying through the session reducer; opt-in "Continue" on the title, never auto-resume.
- **D9 Debrief.** Order: header, "At a glance" (new), What if (moved second, preselected on the most arguable decision, shows how the 1,000 replays ended), Decision quality versus luck, then collapsible reference panels (The world you were in, Calibration, Governance record, What you never saw), "Talk it over" prompts, "Share your run". All six existing panel h2 titles keep their current text as a prefix. No same-world rewind.
- **D10 Workflow.** Work on a branch and merge by PR (PR #1 precedent). No deploy without the designer's approval. CI has never run on GitHub (billing block), so every gate is run locally: `npm run lint && npm run test && npm run balance && npm run build && npm run e2e`.
- **D11 Public rules.** `publicContent()` gains `rules: { perTurn, carryCap, trustBonusAt, trustPenaltyAt, windowTurns, windowDiscount, windowMinCost, boomEconomyAt, boomSurcharge }` copied field by field from `content.config.politicalCapital` (these are the exact names in `src/content/game.json`; `infoCost` is already exposed separately) and `trackBonuses: Record<Track, Effects>` from `content.config.trackBonuses`. Nothing hidden (no stance, no drift, no hidden effects, no band formula). This is `src/content/public.ts`, not the engine. A new `tests/content/public.test.ts` (Phase 8) asserts `publicContent()` never contains hidden keys.
- **D12 Track copy.** Remove the Diplomacy "Level 2: joint evaluations" promise (not implemented in any content); say "in the unscheduled crisis" instead of "in crisis turns" for Evaluation level 3. Generate per-level bonus text from `pub.trackBonuses`.
- **D13 Copy-rule interpretation.** A group of simulated figures (e.g. a list of metric changes) is introduced by a caption that begins "Under this game's assumptions"; every sentence builder that states a simulated statistic begins with it. Never "right/wrong/correct/incorrect/mistake/should have/good decision/bad decision". British English. Biosecurity stays at policy level.

### 2. Phases (numbering continues `docs/plan.md`, which ends at Phase 7)

| Phase | Title | Gate |
|---|---|---|
| 8 | Baseline and safety net | all local gates green; baseline e2e timing recorded; crash bug fixed with regression test |
| 9 | The opening | CTA inside first viewport at 3 sizes (new e2e); print labels gone; all gates |
| 10 | Briefing and forecast | all gates; axe clean on new states |
| 11 | Decision, investment and consequences | all gates; **designer review of the opening and one representative turn** (stop and wait) |
| 12 | First-decision pause (the five-minute taster) | all gates; taster-then-continue reproducibility e2e |
| 13 | A debrief for everyone | all gates; **designer review** (stop and wait) |
| 14 | OPTIONAL save and resume (only if D8 approved) | all gates; replay unit tests; resume e2e |
| 15 | Accessibility sweep, docs and handover | extended axe/overflow/keyboard walk; README/DECISIONS/plan updated; human-only items listed open |

### 3. Shared names (later phases assume earlier ones exist)

- `e2e/play.ts` (Phase 8): export `const LABEL = { start: "Begin", continueToForecast: "Continue to your forecast", lockIn: /^Lock in/, decisionGroup: "Your decision", confirm: /^Confirm option/, investGroup: "Standing investment", investIn: /^Invest in/, newsHeading: "What the world noticed", next: /^(Next briefing|Read your debrief)$/ } as const`. Phase 9 changes `start` to "Try your first decision". Phase 8 adds `data-testid="debrief"` to the Debrief root and `playToDebrief` waits on it instead of `getByText("Your record")`. Phase 8 makes `finishTurn` wait for "Standing investment" OR the news heading instead of a non-waiting `isVisible()`. Phase 12 adds `LABEL.keepGoing = "Keep going"` and teaches `finishTurn`/`playUntil` to click through the pause card after turn 1.
- Pure, window-free helper modules under `src/ui/` (import only types from `../engine`, helpers from `./format`; take `PublicContent`/`PublicScenario`/`DisplayedState` as parameters; never import `./useGame`):
  - `src/ui/copy.ts` (Phase 10) — play-screen sentence builders, e.g. `verbalChance(percent)`, `adviserRange(...)`. Debrief builders stay in `src/ui/debrief/copy.ts`.
  - `src/ui/preview.ts` (Phase 11) — `choicePreview(view, scenario, choiceId)`.
  - `src/ui/preparation.ts` (Phase 11) — `unlockTargets(pub)`, `runPosition(view, pub)`, `milestonesFor(track, view, pub)`.
  - `src/ui/consequences.ts` (Phase 11) — `consequencesOf(before, after, resolved, pub)`.
  - `src/ui/session.ts`, `src/ui/save.ts` (Phase 14 only).
- `src/ui/format.ts` additions: `METRIC_ORDER`, `DOMAIN_LABEL`, `effectRows(effects)` (Phase 11); `ADVISER_ORDER` already exists.
- Components: `BriefingContent` and `BriefingRecap` (Phase 10, extracted from `Briefing.tsx`), `AdviserSplit` (Phase 10), `ForecastScale` (Phase 10), `ChoicePreview` (Phase 11), `TrackLadder` (Phase 11), `screens/FirstDecision.tsx` (Phase 12), `debrief/AtAGlance.tsx`, `debrief/Panel.tsx`, `debrief/TalkItOver.tsx` (Phase 13).
- `App.tsx` `Stage` gains `"pause"` in Phase 12. `News` props become `{ view, before, scenario, resolvedTurn, onContinue }` in Phase 11.
- `PublicContent` gains `rules` and `trackBonuses` in Phase 11 Task 1.
- Tests: Vitest for pure helpers in `tests/ui/*.test.ts` (node environment; build real states with `createGame`/`reduce`/`displayed` from `src/engine` and `publicContent(loadContent())` from `src/content`; `tests/engine/fixture.ts` has helpers). Playwright for flows in `e2e/*.spec.ts`; new behaviour goes in `e2e/engagement.spec.ts` (created in Phase 9); Phase 8's two regression tests live in `e2e/regressions.spec.ts`. No jsdom/testing-library (not approved).
- Hidden-information invariance test pattern (Phase 11 helpers): deep-clone content, perturb `hiddenEffects`/`conditionalEffects`/`probabilityModifiers`/event base odds, and assert identical helper output; and assert the serialised helper output never contains `halfWidth`, `truth`, `history`, `debrief`, `oddsAtTheTime`, `succeeded`.

### 4. Non-negotiables every task must respect

1. Engine untouched: no edits under `src/engine/**` except adding tests under `tests/engine/`. No `Math.random`/`Date`/`crypto`/`performance` in `src/engine`.
2. UI imports the engine only via `src/engine/index.ts` and content only via `src/content/index.ts`. Play screens never import `published`, `defaults` (from `useGame`) or `assumptionsOf`.
3. Components render only `displayed(state)` and `publicContent()`; `assumptionsOf()` and `view.truth/debrief/history` only inside the debrief after its guard.
4. Never render or derive from `Estimate.halfWidth` (it equals 30 − 0.25 × true State Capacity). Never show estimate midpoint/band changes as a change.
5. Never compute a residual of measured change minus stated effects. Never write "because you chose…" during play (odds are stripped until the debrief).
6. Never name which interrupt variant will come or when. Never give numbers for odds or damage before the debrief.
7. e2e contracts: exactly one h1 per screen (the scenario title on turn screens, focused on each step change); exactly one `role=slider` on Forecast and it is the first tab stop after the h1; native radios `input[name="choice"]` with ids `choice-X` and `input[name="track"]`; one Confirm and one Invest button; "Commission analysis" is immediately followed in tab order by the option group; on Invest the first tab stop after the h1 is a track radio; debrief test ids (`brier`, `forecast-row`, `luck-tag`, `decision-review`, `what-if-result`) and strings ("Rerun 1,000 games", "View assumptions", "This is the model's output, not a finding.", "Copy run summary", "Copied as text.", "Show as JSON", label "Run summary") stay; crisis strings stay ("This is a crisis turn.", /Your advisers are in open disagreement/, "No analysis can be commissioned in a crisis.", "Real-world evidence behind this fictional scenario", "Locked: needs Provenance infrastructure at level 2.", "Open to you because you prepared.", "Open to you because of your investment in Provenance infrastructure."); the crisis clock shows "6:00 remaining" on the briefing and "3:00 remaining" on the decision (driven by `stepIndex`). If a task changes any of these, the same task updates the tests.
8. Accessibility: axe zero violations light and dark; heading levels never skip; WCAG 2.2 target size ≥ 24px; focus visible with ≥ 3:1 contrast; no horizontal overflow at 360px; `prefers-reduced-motion` honoured; meaning never by colour alone.
9. Runtime dependencies fixed (react, react-dom, react-is, zod, recharts). No new dev dependencies.
10. TypeScript strict with `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`; `tsc` also checks `tests/` and `e2e/`. eslint-plugin-react-hooks 7 recommended rules apply to `src/ui` (no synchronous setState inside an effect body; derive instead).
11. Copy rules per D13.

### 5. How each task is written

Each phase is a list of tasks in the form: **Files** (Create / Modify / Test with exact paths) → **Step 1: Write the failing test** (complete code) → **Step 2: Run it and watch it fail** (exact command and expected failure) → **Step 3: Implement** (complete code; exact old → new replacements, no placeholders) → **Step 4: Run it and watch it pass** → **Step 5: Commit**. Steps are 2–5 minutes each. TDD where there is logic (pure helpers, copy builders); for purely presentational changes the "failing test" is an e2e assertion (Playwright) or an axe/overflow check written first. British English in all player-facing copy.

Planning notes that apply throughout:

- Quoted line numbers and test counts were measured against commit `a11ef34` on the planning machine (10 cores, 5 Playwright workers). Earlier phases re-measure and record the real figures where a phase says so; later phases anchor on the text earlier phases write, not on `a11ef34` strings.
- Pull request #2 (`fix/estimate-halfwidth-leak`, the `Estimate.halfWidth` fix) was open at planning time. Phase 8 Task 8.1 Step 2 checks whether it merged and brings `origin/main` in if so; where a count depends on it the plan writes both figures as "N (M with PR #2)".
- Each phase's gate commits to the feature branch and does not push. The branch is pushed and the pull request opened only at the Phase 15 gate, or earlier if the designer asks (`DECISIONS.md` F9).

---
## Phase 8: Baseline and safety net

**Goal:** before any screen changes, prove every local gate is green, record how long the browser suite takes, make the end-to-end helpers and the accessibility check survive the copy and pacing changes to come, fix the two live bugs found during planning, add guards that keep hidden information out of play screens, and log the redesign's decisions. **Handoff items addressed:** none of observations 1 to 10 directly. This phase makes them safe to change: the `LABEL` constants absorb the CTA rename (observation 1); transition-tolerant helpers absorb new steps (observations 2, 5 and 9, and the taster); the stricter axe check catches skipped heading levels in every new screen; the `publicContent()` test and lint guard enforce the handoff's caution "Do not reveal hidden simulation facts through choice previews or consequence explanations"; the two bugs were found while investigating observations 4 (choice preview) and 6 (the steps rail). **Depends on:** nothing earlier in the redesign, except that open pull request #2 (the `Estimate.halfWidth` fix) is checked in Task 8.1 Step 2. Decisions D1 to D13 of this plan are logged here (Task 8.7). The plan file `docs/plans/2026-09-19-public-engagement-ui.md` must be in the repository (it is committed with this plan).

Conventions for every task in this phase:

- Run every command from the repository root. Paths are relative to it.
- `npm run e2e` builds the production bundle and serves it on port 4173 (`playwright.config.ts`). It reuses any server already listening there (`reuseExistingServer: true`), so a stale `vite preview` would make it test an old build. Before any Playwright run, `lsof -nP -iTCP:4173 -sTCP:LISTEN` must print nothing; stop any process it lists. A single spec runs with `npx playwright test <file>`, which also rebuilds first.
- Never use `git stash`. To undo a temporary edit, use `git checkout -- <file>` on that file only.
- Commit messages below are the subject and body. Add whatever attribution trailer your session requires.
- Current line numbers below were checked against commit `a11ef34`. Pull request #2, if merged in Task 8.1 Step 2, changes only `DECISIONS.md` (one new row, B43, after B32), `src/engine/display.ts`, `src/engine/types.ts` and `tests/engine/rules.test.ts`, so every line number quoted here still holds.
- Unit-test counts are written as "N (M with PR #2)": use M if Task 8.1 Step 2 merged pull request #2, otherwise N.

### Task 8.1: Environment and baseline

**Files:**
- None changed. The numbers recorded here are written into `docs/plan.md` in Task 8.7.

**Step 1: Confirm the branch and a clean tree**

```bash
git branch --show-current
git status --short
test -f docs/plans/2026-09-19-public-engagement-ui.md && echo PLAN-PRESENT
```

Expected: the branch is a feature branch, not `main` (DECISIONS F9). If it prints `main`, run `git switch -c redesign/public-engagement` and continue there. `git status --short` prints nothing, or only `?? docs/plans/` if the plan file is not yet committed (then include it in the Task 8.7 commit). The last command prints `PLAN-PRESENT`; if it does not, stop and ask the designer where the plan file is.

**Step 2: Bring in pull request #2 if it has merged**

Pull request #2, "Truth: stop the estimate half-width revealing State Capacity" (branch `fix/estimate-halfwidth-leak`), was open on 2026-09-19. It removes `halfWidth` from the engine's `Estimate` type (the exact half-width gave the true State Capacity away), adds 3 engine tests and adds `DECISIONS.md` row B43. The redesign must build on it if it has merged, and must never copy its changes by hand.

```bash
git fetch origin
gh pr view 2 --json state --jq .state
```

Expected: `git fetch` completes (it also brings `origin/main` up to date, which the Phase 8 gate compares against). `gh` prints one word:

- `MERGED`: run `git merge --no-edit origin/main`. Expected: the merge completes with no conflict (this branch has not yet touched any file the pull request changes). If Git reports a conflict, run `git merge --abort` and stop and ask the designer. Then `grep -c halfWidth src/engine/types.ts` prints `0`. From here on use the "with PR #2" unit-test counts.
- `OPEN`: stop and ask the designer whether to wait for it to merge, or to start now and merge `origin/main` into this branch once it has. If they say start now, continue with the counts as written; after a later merge every unit-test count rises by 3.
- `CLOSED`: continue with the counts as written.

**Step 3: Install dependencies and the browser**

```bash
node --version
npm ci
npx playwright install chromium
```

Expected: `npm ci` ends with `added … packages` and no `ERR!`. CI uses Node 22; the planning machine used Node 26.7 and every gate passed. `npx playwright install chromium` downloads Chromium for `@playwright/test` 1.63.0, or prints nothing if it is already installed.

**Step 4: Free port 4173**

```bash
lsof -nP -iTCP:4173 -sTCP:LISTEN
```

Expected: no output. If a process is listed, stop it (`kill <PID>`) and run the command again.

**Step 5: Run the full local gate on the untouched tree**

GitHub Actions has never run for this repository: every run so far (ten by 2026-09-19, the latest on pull request #2) stopped within ten seconds on a billing block ("The job was not started because recent account payments have failed…"). Every gate is therefore local.

```bash
npm run lint
npm run test
npm run balance
npm run build && du -sk dist
/usr/bin/time -p npm run e2e
```

Expected, in order:

- `npm run lint`: exits 0 and prints no problems.
- `npm run test`: `Test Files  9 passed (9)` and `Tests  166 passed (166)` (169 with PR #2).
- `npm run balance`: the Rule 7 table shows `ALL WORLDS  35.4%  27.5%  37.1%`, every scripted scenario passes Rules 4 and 5, and the last line is `Balance check passed.` (about 16 s).
- `npm run build`: `✓ built in …`; the chunk-size warning about `index-….js` over 500 kB is expected. `du -sk dist` prints about `1972`, well under the 16384 limit.
- `npm run e2e`: `17 passed (…s)`: 4 in `crisis.spec.ts`, 5 in `debrief.spec.ts`, 8 in `polish.spec.ts`. `time -p` then prints `real …`. On the planning machine (10 cores, 5 workers) this was `17 passed (12.0s)` and about 12.3 s wall clock including the build.

If any gate fails on the untouched tree, stop and report it. Do not start Task 8.2.

**Step 6: Record the baseline (no commit)**

Write down three numbers for Task 8.7: `<UNIT>`, the unit-test total from `Tests  … passed` (166, or 169 with PR #2); `<PW>`, the seconds in Playwright's `17 passed (…s)` line; and `<WALL>`, the `real` seconds from `time -p`. Nothing in the repository changed apart from a possible merge of `origin/main` in Step 2 (already committed by `git merge`), so there is nothing to commit.

### Task 8.2: Harden the end-to-end helpers and the axe check

**Files:**
- Modify: `e2e/play.ts` (whole file; Phase 8 owns the new `LABEL` constant, which later phases extend)
- Modify: `e2e/debrief.spec.ts` (`scriptedRun`, line 15)
- Modify: `e2e/polish.spec.ts` (header comment, lines 1-2; import on line 8; the reproducibility test at line 23; every label literal: lines 33, 40, 68, 91, 96, 98, 102, 105, 107, 114, 116, 117, 140, 143, 157, 162, 164, 165, 179, 182, 187; the axe helper, lines 78-82, and the axe test title, line 85)
- Modify: `src/ui/screens/Debrief.tsx` (root element, line 61)
- Test: the existing Playwright suite. `e2e/crisis.spec.ts` needs no change: none of its literals is a `LABEL` value (it uses the helpers plus crisis-only strings and `/^Commission analysis/`).

What changes and why:

- `LABEL` collects every label the helpers and specs steer by. Phase 9 renames the start button by changing `LABEL.start` alone.
- `finishTurn` used a non-waiting `invest.isVisible()` (`e2e/play.ts:44-45`). It now waits until either the "Standing investment" group or the "What the world noticed" heading is visible, then branches. A transition between Decision and Invest can no longer make it skip the investment.
- `playToDebrief` looped on a non-waiting `getByText("Your record").isVisible()` (`e2e/play.ts:68`). It now waits for either the next briefing's "Continue to your forecast" button or `getByTestId("debrief")`, then branches, and gives up after nine checks.
- The reproducibility test read luck tags with `allInnerTexts()` (`e2e/polish.spec.ts:23`) without waiting for the soundness rankings, so a slow worker could capture "Weighing the options you had…". It now waits for that text to reach count 0, as `debrief.spec.ts:43` already does.
- The shared axe check `expectNoSeriousViolations` (`e2e/polish.spec.ts:78-82`) ran only the WCAG-tagged rules and failed only on serious or critical impact. axe's `heading-order` and `page-has-heading-one` rules are tagged `best-practice`, so they never ran: a skipped heading level or a missing h1 passed. Every later phase adds headings and relies on this check ("heading levels never skip", contract non-negotiable 8; `docs/plan.md`'s Phase 7 gate already claims "no violations at any impact"). It now runs WCAG 2.2 AA plus `best-practice` and fails on any violation at any impact. The build already meets this: a full-rule run finds nothing on any screen in light or dark. The function keeps its name because later phases call it.

**Step 1: Write the failing test**

Replace the whole of `e2e/play.ts` with:

```ts
// Helpers that play the game the way a person does: by role and visible label.
// Nothing here reaches into the engine or the page's state.

import { expect, type Page } from "@playwright/test";

/**
 * Every visible label the helpers and specs steer by, in one place, so a copy
 * change touches this file rather than every spec.
 */
export const LABEL = {
  start: "Begin",
  continueToForecast: "Continue to your forecast",
  lockIn: /^Lock in/,
  decisionGroup: "Your decision",
  confirm: /^Confirm option/,
  investGroup: "Standing investment",
  investIn: /^Invest in/,
  newsHeading: "What the world noticed",
  next: /^(Next briefing|Read your debrief)$/,
} as const;

export type TrackName = "Evaluation science" | "Provenance infrastructure" | "Diplomacy" | "Defensive cyber";

export async function startGame(page: Page, seedCode: string) {
  await page.goto(`/?seed=${encodeURIComponent(seedCode)}`);
  await page.getByRole("button", { name: LABEL.start }).click();
}

export const scenarioTitle = (page: Page) => page.getByRole("heading", { level: 1 }).innerText();

/** From a briefing to the decision step. */
export async function toDecision(page: Page, forecast = 50) {
  await page.getByRole("button", { name: LABEL.continueToForecast }).click();
  await page.getByRole("slider").fill(String(forecast));
  await page.getByRole("button", { name: LABEL.lockIn }).click();
  await expect(page.getByRole("group", { name: LABEL.decisionGroup })).toBeVisible();
}

export interface TurnPlan {
  /** Option letter to prefer. Falls back to the first option that is open. */
  prefer?: string;
  track?: TrackName;
  forecast?: number;
}

/** Plays one whole turn from its briefing through to the next briefing (or the debrief). Returns the option taken. */
export async function playTurn(page: Page, plan: TurnPlan = {}): Promise<string> {
  await toDecision(page, plan.forecast);
  return finishTurn(page, plan);
}

/** From the decision step to the next briefing (or the debrief). Returns the option taken. */
export async function finishTurn(page: Page, plan: TurnPlan = {}): Promise<string> {
  const preferred = plan.prefer ? page.locator(`#choice-${plan.prefer}`) : null;
  const pick = preferred && (await preferred.isEnabled()) ? preferred : page.locator('input[name="choice"]:enabled').first();
  const taken = (await pick.getAttribute("id"))!.replace("choice-", "");
  await pick.check();
  await page.getByRole("button", { name: LABEL.confirm }).click();

  // Wait for whichever step comes next: the investment, or (after the final decision) the news.
  const invest = page.getByRole("group", { name: LABEL.investGroup });
  const news = page.getByRole("heading", { name: LABEL.newsHeading });
  await expect(invest.or(news).first()).toBeVisible();
  if (await invest.isVisible()) {
    const wanted = page.getByRole("radio", { name: new RegExp(`^${plan.track ?? "Evaluation science"}`) });
    const track = (await wanted.isEnabled()) ? wanted : page.locator('input[name="track"]:enabled').first();
    await track.check();
    await page.getByRole("button", { name: LABEL.investIn }).click();
  }
  await expect(news).toBeVisible();
  await page.getByRole("button", { name: LABEL.next }).click();
  return taken;
}

/** Plays turns until the named scenario's briefing is on screen. */
export async function playUntil(page: Page, title: string, plan: TurnPlan = {}) {
  for (let turn = 0; turn < 8; turn++) {
    if ((await scenarioTitle(page)) === title) return;
    await playTurn(page, plan);
  }
  throw new Error(`Never reached "${title}"`);
}

/** Plays a whole game and returns the options taken, in order. */
export async function playToDebrief(page: Page, plan: TurnPlan = {}): Promise<string[]> {
  const taken: string[] = [];
  const debrief = page.getByTestId("debrief");
  const briefing = page.getByRole("button", { name: LABEL.continueToForecast });
  for (let turn = 0; turn <= 8; turn++) {
    // Wait for the next briefing or the debrief, so a screen transition cannot fool the check.
    await expect(debrief.or(briefing).first()).toBeVisible();
    if (await debrief.isVisible()) return taken;
    taken.push(await playTurn(page, plan));
  }
  throw new Error("Never reached the debrief");
}
```

In `e2e/debrief.spec.ts`, inside `scriptedRun`, replace line 15:

```ts
  await expect(page.getByText("Your record")).toBeVisible();
```

with:

```ts
  await expect(page.getByTestId("debrief")).toBeVisible();
```

**Step 2: Run it and watch it fail**

```bash
npx playwright test e2e/debrief.spec.ts -g "six panels"
```

Expected: 1 failed, after about 7 s:

```
Error: expect(locator).toBeVisible() failed
Locator: getByTestId('debrief')
Error: element(s) not found
```

**Step 3: Implement**

In `src/ui/screens/Debrief.tsx`, line 61, replace:

```tsx
    <div className="space-y-8">
```

with:

```tsx
    <div className="space-y-8" data-testid="debrief">
```

Then route every label literal in `e2e/polish.spec.ts` through `LABEL`, and add the rankings wait. Run this script once from the repository root (it checks each replacement count and stops without writing if the file has drifted):

```bash
node --input-type=module - <<'EOF'
// Replaces the label literals in e2e/polish.spec.ts with LABEL keys. Each
// replacement states how many times it must match, so a drifted file fails loudly.
import { readFileSync, writeFileSync } from "node:fs";

const path = "e2e/polish.spec.ts";
let text = readFileSync(path, "utf8");
const swaps = [
  [`import { playToDebrief, playTurn, playUntil, startGame, toDecision } from "./play";`, `import { LABEL, playToDebrief, playTurn, playUntil, startGame, toDecision } from "./play";`, 1],
  [`    const tags = await page.getByTestId("luck-tag").allInnerTexts();`, `    await expect(page.getByText("Weighing the options you had")).toHaveCount(0, { timeout: 10_000 });  // rankings arrive from the worker\n    const tags = await page.getByTestId("luck-tag").allInnerTexts();`, 1],
  [`getByRole("button", { name: "Begin" })`, `getByRole("button", { name: LABEL.start })`, 7],
  [`getByRole("button", { name: "Continue to your forecast" })`, `getByRole("button", { name: LABEL.continueToForecast })`, 1],
  [`getByRole("button", { name: /^Lock in/ })`, `getByRole("button", { name: LABEL.lockIn })`, 1],
  [`getByRole("button", { name: /^Confirm option/ })`, `getByRole("button", { name: LABEL.confirm })`, 2],
  [`getByRole("button", { name: /^Invest in/ })`, `getByRole("button", { name: LABEL.investIn })`, 2],
  [`getByRole("button", { name: "Next briefing" })`, `getByRole("button", { name: LABEL.next })`, 1],
  [`getByRole("button", { name: /^(Next briefing|Read your debrief)$/ })`, `getByRole("button", { name: LABEL.next })`, 1],
  [`getByRole("heading", { name: "What the world noticed" })`, `getByRole("heading", { name: LABEL.newsHeading })`, 1],
  ["focusOn(/^Begin$/)", "focusOn(new RegExp(`^${LABEL.start}$`))", 1],
  ["focusOn(/^Continue to your forecast$/)", "focusOn(new RegExp(`^${LABEL.continueToForecast}$`))", 1],
  ["focusOn(/^Confirm option/)", "focusOn(LABEL.confirm)", 1],
  ["focusOn(/^Invest in/)", "focusOn(LABEL.investIn)", 1],
  ["focusOn(/^Next briefing$/)", "focusOn(LABEL.next)", 1],
];
for (const [from, to, times] of swaps) {
  const found = text.split(from).length - 1;
  if (found !== times) throw new Error(`Expected ${times} of ${from}, found ${found}`);
  text = text.split(from).join(to);
}
writeFileSync(path, text);
console.log(`Updated ${path}: ${swaps.length} replacements`);
EOF
```

Expected: `Updated e2e/polish.spec.ts: 15 replacements`. The same replacements, for reference:

| Line | Before | After |
| --- | --- | --- |
| 8 | `import { playToDebrief, playTurn, playUntil, startGame, toDecision } from "./play";` | `import { LABEL, playToDebrief, playTurn, playUntil, startGame, toDecision } from "./play";` |
| 23 | `const tags = await page.getByTestId("luck-tag").allInnerTexts();` | preceded by a new line: `await expect(page.getByText("Weighing the options you had")).toHaveCount(0, { timeout: 10_000 });  // rankings arrive from the worker` |
| 33, 40, 68, 91, 179, 182, 187 | `getByRole("button", { name: "Begin" })` | `getByRole("button", { name: LABEL.start })` |
| 96 | `{ name: "Continue to your forecast" }` | `{ name: LABEL.continueToForecast }` |
| 98 | `{ name: /^Lock in/ }` | `{ name: LABEL.lockIn }` |
| 102, 114 | `{ name: /^Confirm option/ }` | `{ name: LABEL.confirm }` |
| 105, 116 | `{ name: /^Invest in/ }` | `{ name: LABEL.investIn }` |
| 107 | `{ name: "Next briefing" }` | `{ name: LABEL.next }` |
| 117 | `{ name: /^(Next briefing\|Read your debrief)$/ }` | `{ name: LABEL.next }` |
| 140 | `focusOn(/^Begin$/)` | ``focusOn(new RegExp(`^${LABEL.start}$`))`` |
| 143 | `focusOn(/^Continue to your forecast$/)` | ``focusOn(new RegExp(`^${LABEL.continueToForecast}$`))`` |
| 157 | `focusOn(/^Confirm option/)` | `focusOn(LABEL.confirm)` |
| 162 | `focusOn(/^Invest in/)` | `focusOn(LABEL.investIn)` |
| 164 | `getByRole("heading", { name: "What the world noticed" })` | `getByRole("heading", { name: LABEL.newsHeading })` |
| 165 | `focusOn(/^Next briefing$/)` | `focusOn(LABEL.next)` |

Literals that stay as they are, because they are not `LABEL` values: `/^Commission analysis/`, `"Lock in 35%"` and `/^Lock in 35%$/` (a specific value), `"Show as JSON"`, `"Run summary"`, `"Assessment"`, `/^Seed code/`, the facilitator strings, the evidence summary and the debrief strings.

Then tighten the shared axe check. Run this second script from the repository root (same safety: it stops without writing if the file has drifted). After the first script the helper sits at lines 79-83, one line lower than at `a11ef34`.

```bash
node --input-type=module - <<'EOF'
// Makes the shared axe check fail on any violation, best-practice rules included.
import { readFileSync, writeFileSync } from "node:fs";

const path = "e2e/polish.spec.ts";
let text = readFileSync(path, "utf8");
const swaps = [
  [
    `// Phase 7 gate: an automated accessibility pass (axe) reports no serious
// violations, and the same seed code reproduces an identical run start to finish.`,
    `// Phase 7 gate: an automated accessibility pass (axe) reports no violations at any
// impact, best-practice rules included, and the same seed code reproduces an
// identical run start to finish.`,
  ],
  [
    `async function expectNoSeriousViolations(page: Page, where: string) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => \`\${where}: \${v.id} (\${v.nodes.length}) \${v.nodes[0]?.target}\`)).toEqual([]);
}`,
    `/**
 * No axe violations at any impact, with axe's best-practice rules as well as WCAG 2.2 AA.
 * heading-order and page-has-heading-one are best-practice rules: they are what checks that
 * heading levels never skip and that each screen has one h1. The name is kept because later phases call it.
 */
async function expectNoSeriousViolations(page: Page, where: string) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
  expect(results.violations.map((v) => \`\${where}: \${v.impact} \${v.id} (\${v.nodes.length}) \${v.nodes[0]?.target}\`)).toEqual([]);
}`,
  ],
  [
    "  test(`axe finds no serious violations on any screen (${colorScheme})`, async ({ page }) => {",
    "  test(`axe finds no violations on any screen (${colorScheme})`, async ({ page }) => {",
  ],
];
for (const [from, to] of swaps) {
  const found = text.split(from).length - 1;
  if (found !== 1) throw new Error(`Expected 1 of ${from.slice(0, 60)}…, found ${found}`);
  text = text.split(from).join(to);
}
writeFileSync(path, text);
console.log(`Updated ${path}: ${swaps.length} replacements`);
EOF
```

Expected: `Updated e2e/polish.spec.ts: 3 replacements`. The helper is now:

```ts
/**
 * No axe violations at any impact, with axe's best-practice rules as well as WCAG 2.2 AA.
 * heading-order and page-has-heading-one are best-practice rules: they are what checks that
 * heading levels never skip and that each screen has one h1. The name is kept because later phases call it.
 */
async function expectNoSeriousViolations(page: Page, where: string) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
  expect(results.violations.map((v) => `${where}: ${v.impact} ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target}`)).toEqual([]);
}
```

and the two axe tests are titled `axe finds no violations on any screen (light)` and `(dark)`. Later phases select them with `-g "axe"`, which still matches.

**Step 4: Run it and watch it pass**

```bash
npm run typecheck
npm run lint
grep -nE '"Begin"|"Continue to your forecast"|/\^Lock in/|"Your decision"|/\^Confirm option/|"Standing investment"|/\^Invest in/|"What the world noticed"|Next briefing|Read your debrief|"Your record"' e2e/*.spec.ts
npx playwright test e2e/polish.spec.ts -g axe
```

Expected: `typecheck` and `lint` exit 0 with no output beyond the script banners. The `grep` prints nothing (no label literal is left outside `e2e/play.ts`). Playwright prints `2 passed`: the build already meets the stricter bar.

Prove the stricter check bites. In `src/ui/screens/Decision.tsx`, line 31, temporarily replace:

```tsx
          <h2 className="font-semibold">Commission analysis</h2>
```

with:

```tsx
          <h4 className="font-semibold">Commission analysis</h4>
```

```bash
npx playwright test e2e/polish.spec.ts -g axe
```

Expected: `2 failed`, each listing `"decision: moderate heading-order (1) h4"` (the old check passed this). Undo the probe and run the whole suite:

```bash
git checkout -- src/ui/screens/Decision.tsx
git diff --quiet src/ui/screens/Decision.tsx && echo RESTORED
npm run e2e
```

Expected: `RESTORED`, then `17 passed`.

**Step 5: Commit**

```bash
git add e2e/play.ts e2e/debrief.spec.ts e2e/polish.spec.ts src/ui/screens/Debrief.tsx
git commit -m "test(e2e): centralise labels, wait for each next screen, fail axe on any violation" -m "LABEL in e2e/play.ts holds every label the specs steer by. finishTurn waits for the investment or the news instead of a non-waiting isVisible(); playToDebrief waits for the next briefing or data-testid=\"debrief\". The reproducibility test reads luck tags only after the rankings arrive. The shared axe check now runs the best-practice rules too (heading-order, page-has-heading-one) and fails at any impact; the build already passes."
```

### Task 8.3: Fix a stale pick after commissioning analysis (the page went blank)

**Files:**
- Create: `e2e/regressions.spec.ts` (Phase 8 owns this file: one regression test per bug found during planning)
- Modify: `src/ui/screens/Decision.tsx` (lines 1, 18-20, 34, 60 and 117-119)
- Test: `e2e/regressions.spec.ts`

The bug: `Decision.tsx:18` keeps the picked option in local state. `BUY_INFO` does not change the phase, so the screen is not remounted (`App.tsx:36,130`), while the reducer recomputes every option's status after the purchase (`src/engine/reduce.ts:360`). If the player picks an option that costs exactly their Political Capital and then commissions analysis, that option becomes `unaffordable` and its radio is disabled, but it stays checked and "Confirm option X" stays enabled (`Decision.tsx:117`). Clicking it dispatches an illegal `DECIDE`. The reducer throws `Choice "C" is not available` (`reduce.ts:366-367`, DECISIONS B29) inside `useReducer`, and with no error boundary the page goes blank. This was reproduced in the browser during planning (seed `STALE-PICK`, below: a `pageerror` with that message, then no `h1` and an empty body).

The fix derives the pick from the live status in `view.current.choices`, with no `setState` in an effect (the react-hooks 7 rules forbid synchronous setState in an effect body). The same interaction also loses keyboard focus: the "Commission analysis" button unmounts when the analysis arrives (`Decision.tsx:32-46`), so focus falls to `<body>` (WCAG 2.4.3). The fix moves focus to the analysis the player just paid for; the effect only calls `focus()`, which the hooks rules allow. Announcing the priced-out pick is left to Phase 11, whose live preview line ("Option C: Costs 5; you have 4. Choose another option.") replaces this screen's bottom bar; the branch is not released in between.

A deterministic path, found with the engine: on seed `STALE-PICK`, commissioning analysis and taking options C, D and B on turns 1 to 3 (forecast 50, Evaluation science every turn, which is what `finishTurn` does by default) leaves exactly 5 Political Capital on turn 4, The Graduate Collapse, where option C costs 5 and analysis (1) is still on sale. No interrupt comes before turn 4 on this seed. To re-derive the seed if content changes, save the script below as `stale-pick.ts` in the repository root, run `npx tsx stale-pick.ts`, then delete it (never commit it: `eslint .` and `tsc` would pick it up). It printed `STALE-PICK turn 4 graduate-collapse PC 5 analysis on sale: true HIT C` at `a11ef34`; nine of the ten `STALE-PICK-n` variants hit too, and `STALE-PICK-3` meets the cyber interrupt instead.

```ts
// Finds seeds where analysis plus options C, D and B on turns 1 to 3 leave an open
// option costing exactly the player's Political Capital on turn 4, with analysis
// still on sale. Mirrors e2e/play.ts: forecast 50, the preferred option, Evaluation science.
import { createGame, displayed, reduce, type GameState } from "./src/engine";
import { loadContent } from "./src/content";

const content = loadContent();
const PATH = ["C", "D", "B"];

function play(seedCode: string): GameState | string {
  let s = createGame(seedCode, content);
  for (const prefer of PATH) {
    s = reduce(s, { type: "FORECAST", value: 0.5 }, content);
    if (!s.current!.canBuyInfo) return `no analysis on sale on turn ${s.turn}`;
    s = reduce(s, { type: "BUY_INFO" }, content);
    if (s.current!.choices.find((c) => c.id === prefer)?.status !== "available") return `${prefer} not open on turn ${s.turn}`;
    s = reduce(s, { type: "DECIDE", choiceId: prefer }, content);
    s = reduce(s, { type: "INVEST", track: "evaluation" }, content);
    s = reduce(s, { type: "ADVANCE" }, content);
  }
  return reduce(s, { type: "FORECAST", value: 0.5 }, content);
}

for (const seed of ["STALE-PICK", ...Array.from({ length: 10 }, (_, i) => `STALE-PICK-${i + 1}`)]) {
  const s = play(seed);
  if (typeof s === "string") { console.log(seed, s); continue; }
  const v = displayed(s);
  const exact = v.current!.choices.filter((c) => c.status === "available" && c.cost === v.politicalCapital).map((c) => c.id);
  console.log(seed, `turn ${v.turn}`, v.current!.scenarioId, `PC ${v.politicalCapital}`, `analysis on sale: ${v.current!.canBuyInfo}`, exact.length && v.current!.canBuyInfo ? `HIT ${exact.join(",")}` : "no hit");
}
```

**Step 1: Write the failing test**

Create `e2e/regressions.spec.ts`:

```ts
// Phase 8 regressions: bugs found while planning the public-audience redesign.
// Each test failed before its fix landed.

import { expect, test } from "@playwright/test";
import { finishTurn, LABEL, scenarioTitle, startGame, toDecision } from "./play";

test("commissioning analysis after picking an option it makes unaffordable clears the pick instead of crashing", async ({ page }) => {
  // Seed STALE-PICK: buying analysis and taking C, D and B on turns 1 to 3 leaves
  // exactly 5 Political Capital on turn 4, The Graduate Collapse, where option C costs 5.
  await startGame(page, "STALE-PICK");
  for (const prefer of ["C", "D", "B"]) {
    await toDecision(page);
    await page.getByRole("button", { name: /^Commission analysis/ }).click();
    await finishTurn(page, { prefer });
  }
  expect(await scenarioTitle(page)).toBe("The Graduate Collapse");
  await toDecision(page);
  await page.locator("#choice-C").check();
  await expect(page.getByRole("button", { name: "Confirm option C" })).toBeEnabled();

  await page.getByRole("button", { name: /^Commission analysis/ }).click();         // costs 1, so C is now out of reach
  await expect(page.locator("#choice-C")).toBeDisabled();
  await expect(page.getByRole("button", { name: LABEL.confirm, disabled: false })).toHaveCount(0);
  await expect(page.locator("#choice-C")).not.toBeChecked();
  // The Commission button is gone, so focus moves to the analysis rather than falling to the page.
  await expect(page.getByRole("region", { name: "Commission analysis" }).locator('[tabindex="-1"]')).toBeFocused();

  // The player can still take an option they can afford, and the game goes on.
  expect(await finishTurn(page, { prefer: "D" })).toBe("D");
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText("The Graduate Collapse");
});
```

**Step 2: Run it and watch it fail**

```bash
npx playwright test e2e/regressions.spec.ts
```

Expected: 1 failed (the stale pick is caught before the focus check is reached):

```
Error: expect(locator).toHaveCount(expected) failed
Locator:  getByRole('button', { name: /^Confirm option/, disabled: false })
Expected: 0
Received: 1
```

**Step 3: Implement**

In `src/ui/screens/Decision.tsx`, replace line 1:

```tsx
import { useState } from "react";
```

with:

```tsx
import { useEffect, useRef, useState } from "react";
```

Replace lines 18-20:

```tsx
  const [selected, setSelected] = useState<string | null>(null);
  const ctx = view.current!;
  const purchased = view.intel.find((r) => r.turn === view.turn && r.source === "purchase");
```

with:

```tsx
  const [selected, setSelected] = useState<string | null>(null);
  const ctx = view.current!;
  // Commissioning analysis costs Political Capital and can put the picked option out of reach.
  // The pick counts only while its live status is "available": a stale pick would send an illegal DECIDE.
  const chosen = ctx.choices.find((o) => o.id === selected && o.status === "available")?.id ?? null;
  const purchased = view.intel.find((r) => r.turn === view.turn && r.source === "purchase");
  const bought = purchased !== undefined;
  const analysis = useRef<HTMLParagraphElement>(null);
  // The Commission button unmounts once the analysis arrives, so focus moves to what was bought.
  useEffect(() => {
    if (bought) analysis.current?.focus();
  }, [bought]);
```

Replace line 34:

```tsx
              <p className="mt-1">{purchased.text}</p>
```

with:

```tsx
              <p ref={analysis} tabIndex={-1} className="mt-1 outline-none">
                {purchased.text}
              </p>
```

(`tabIndex={-1}` makes the paragraph focusable by script only; it does not join the tab order, so one Tab from it still reaches the option group. `outline-none` matches the step `h1`, which is focused the same way.)

Replace line 60:

```tsx
            const on = selected === choice.id;
```

with:

```tsx
            const on = chosen === choice.id;
```

Replace lines 117-119:

```tsx
      <Button disabled={selected === null} onClick={() => selected && onDecide(selected)}>
        {selected ? `Confirm option ${selected}` : "Choose an option"}
      </Button>
```

with:

```tsx
      <Button disabled={chosen === null} onClick={() => chosen && onDecide(chosen)}>
        {chosen ? `Confirm option ${chosen}` : "Choose an option"}
      </Button>
```

`setSelected` and the radios' `onChange` stay as they are. A priced-out option now renders unchecked and disabled, keeps its existing line "You do not have the Political Capital for this.", and the button falls back to "Choose an option".

**Step 4: Run it and watch it pass**

```bash
npm run typecheck
npm run lint
npx playwright test e2e/regressions.spec.ts
lsof -nP -iTCP:4173 -sTCP:LISTEN
npm run e2e
```

Expected: `typecheck` and `lint` exit 0; the regression run prints `1 passed`; `lsof` prints nothing; the whole suite prints `18 passed` (the 17 baseline tests, whose axe, keyboard and crisis walks all go through this screen, plus this one).

**Step 5: Commit**

```bash
git add e2e/regressions.spec.ts src/ui/screens/Decision.tsx
git commit -m "fix(ui): drop a pick that commissioning analysis puts out of reach" -m "Decision derived Confirm from local state that survived BUY_INFO. An option costing exactly the player's Political Capital stayed checked after the purchase, and Confirm sent an illegal DECIDE that threw inside the reducer and blanked the page. The pick now counts only while view.current.choices marks it available. Focus also fell to the page when the Commission button unmounted; it now moves to the analysis bought. Regression test on seed STALE-PICK, turn 4."
```

### Task 8.4: Fix the final turn's steps rail

**Files:**
- Modify: `e2e/regressions.spec.ts` (import line; append one test)
- Modify: `src/ui/App.tsx` (line 97)
- Test: `e2e/regressions.spec.ts`

The bug: `App.tsx:97` drops "Investment" from the steps rail when `view.current?.isFinal`, but on a consequences screen `view.current` is no longer the turn being reported, because `App.tsx:143` and `App.tsx:153` dispatch `ADVANCE` before the news renders. It fails both ways:

- On the final turn's consequences the engine has already cleared `current` (`reduce.ts:308-309`, phase `debrief`), so "Investment" comes back: the rail shows four steps while the player decides and five on the consequences.
- On the consequences of the turn before the final one (turn 7), `ADVANCE` has already begun the final turn (`reduce.ts:312-324` calls `beginTurn`, and `reduce.ts:117` marks it final), so `view.current.isFinal` is true and the rail drops "Investment" although the player has just invested: `01Briefing 02Forecast 03Decision 04Consequences`.

**Step 1: Write the failing test**

In `e2e/regressions.spec.ts`, replace the import line:

```ts
import { finishTurn, LABEL, scenarioTitle, startGame, toDecision } from "./play";
```

with:

```ts
import { finishTurn, LABEL, playTurn, scenarioTitle, startGame, toDecision } from "./play";
```

Append at the end of the file, after a blank line. Turns 1 to 6 go through `playTurn`, so when Phase 12 teaches `finishTurn` to pass the pause after turn 1, this test needs no change.

```ts
test("the final turn never lists an investment step, even on its consequences", async ({ page }) => {
  await startGame(page, "FINAL-RAIL");
  const rail = page.getByRole("navigation", { name: "Steps in this turn" });
  for (let turn = 1; turn <= 6; turn++) await playTurn(page);

  // Turn 7 took an investment. Its consequences show while view.current is already the final turn.
  await toDecision(page);
  await page.locator('input[name="choice"]:enabled').first().check();
  await page.getByRole("button", { name: LABEL.confirm }).click();
  await page.locator('input[name="track"]:enabled').first().check();
  await page.getByRole("button", { name: LABEL.investIn }).click();
  await expect(page.getByRole("heading", { name: LABEL.newsHeading })).toBeVisible();
  await expect(rail).toContainText("Investment");
  await page.getByRole("button", { name: LABEL.next }).click();

  expect(await scenarioTitle(page)).toBe("The 2032 Threshold");
  await toDecision(page);
  await expect(rail).not.toContainText("Investment");
  await page.locator('input[name="choice"]:enabled').first().check();
  await page.getByRole("button", { name: LABEL.confirm }).click();
  await expect(page.getByRole("heading", { name: LABEL.newsHeading })).toBeVisible();
  await expect(rail.locator('[aria-current="step"]')).toContainText("Consequences");
  await expect(rail).not.toContainText("Investment");
  await page.getByRole("button", { name: LABEL.next }).click();
  await expect(page.getByTestId("debrief")).toBeVisible();
});
```

**Step 2: Run it and watch it fail**

```bash
npx playwright test e2e/regressions.spec.ts -g "final turn"
```

Expected: 1 failed, at the turn-7 check, the first `toContainText("Investment")` after the loop:

```
Error: expect(locator).toContainText(expected) failed
Locator: getByRole('navigation', { name: 'Steps in this turn' })
Expected substring: "Investment"
Received string:    "01Briefing02Forecast03Decision04Consequences"
```

(At `a11ef34` the final turn's consequences would fail next, with `Received string: "01Briefing02Forecast03Decision04Investment05Consequences"` at the last `not.toContainText("Investment")`.)

**Step 3: Implement**

In `src/ui/App.tsx`, replace line 97:

```tsx
  const visibleSteps = STEPS.filter((step) => !(step === "Investment" && view.current?.isFinal));
```

with:

```tsx
  // The final decision takes no investment. While the news reports a turn, the engine has already
  // moved on: after the investment of the turn before the final one, `current` is the final turn,
  // and after the final decision it is cleared. So while reporting, the finished game is what marks
  // the final turn.
  const finalTurn = reporting ? view.phase === "debrief" : Boolean(current?.isFinal);
  const visibleSteps = STEPS.filter((step) => !(step === "Investment" && finalTurn));
```

(`reporting` is defined at line 88 and `current` at line 96, both above this line.)

**Step 4: Run it and watch it pass**

```bash
npm run typecheck
npm run lint
npx playwright test e2e/regressions.spec.ts
lsof -nP -iTCP:4173 -sTCP:LISTEN
npm run e2e
```

Expected: `typecheck` and `lint` exit 0; the regression run prints `2 passed`; `lsof` prints nothing; the whole suite prints `19 passed`.

**Step 5: Commit**

```bash
git add e2e/regressions.spec.ts src/ui/App.tsx
git commit -m "fix(ui): list Investment on the steps rail exactly when the turn on screen takes one" -m "The rail read view.current.isFinal, but on a consequences screen the engine has already moved on. On the final turn's consequences current is null, so the rail re-added the Investment step; on the consequences of turn 7 current is already the final turn, so the rail dropped the step the player had just taken. While reporting, the final turn is now recognised from the finished game. Regression test on seed FINAL-RAIL, turns 7 and 8."
```

### Task 8.5: Test that `publicContent()` carries nothing hidden

**Files:**
- Create: `tests/content/public.test.ts`
- Test: `tests/content/public.test.ts`

No test covers `publicContent()` today (`grep -rn publicContent tests/` finds nothing), yet the redesign renders more of it. The hidden keys below are every container key of the hidden half of content, taken from `src/content/schema.ts` and `src/engine/types.ts` (`Choice`, `Scenario`, `Condition`, `BaseProbability`, `EventDef`, `Adviser`, `Ending`, `GameConfig`), plus the nested keys that carry queued-consequence timing (`eventId`, `minDelay`, `maxDelay`), odds (`factor`, `delta`, `probability`, the per-profile `benign`, `contested`, `hard`), condition operands (`metric`, `op`, `not`), the event registry (`events`), the forecast's resolution (`forecast`, `question`) and adviser memory lines (`line`). None of them is a JSON key of `publicContent()` at `a11ef34`. The list deliberately leaves out keys the public view legitimately uses: `stance` (the advisers' one-line views), `track` (in `unlock`), `infoCost`, and the names Phase 11 adds from DECISIONS F10 (`rules` with `perTurn`, `carryCap`, `trustBonusAt`, `trustPenaltyAt`, `windowTurns`, `windowDiscount`, `windowMinCost`, `boomEconomyAt`, `boomSurcharge`, and `trackBonuses`, whose values are keyed by track and metric). Generic operand names (`key`, `value`) are left out too. An option's `stance`, `politicalCost` and `restrictive`, and any new scenario or ending field, are caught by the exact-key checks instead: for advisers, adviser views, scenarios, options and endings. The latent-fact names come from a `Record<SeedFact, true>`, so a fact added to `WorldSeed` and missing from the test fails the type check.

**Step 1: Write the failing test**

Create `tests/content/public.test.ts`:

```ts
// The interface reads content only through publicContent() (DECISIONS.md B33).
// These tests fail if a hidden field ever reaches that view, for example when a
// redesign renders more of it.

import { describe, expect, test } from "vitest";
import { loadContent, publicContent } from "../../src/content";
import type { SeedFact } from "../../src/engine";

const pub = publicContent(loadContent());
const json = JSON.stringify(pub);

/**
 * Keys that exist only in the hidden half of content (src/content/schema.ts, src/engine/types.ts):
 * every container key, and the nested keys that carry timing, odds and conditions.
 */
const HIDDEN_KEYS = [
  // Choice
  "hiddenEffects", "probabilityModifiers", "conditionalEffects", "trackChange", "flagsAdded", "flagsRemoved",
  "queues", "baseProbability", "requires", "succeedsWhen", "onFailure", "headline",
  // Scenario: how the forecast resolves, what the briefing signal is about, adviser memory conditions
  "resolution", "briefingSignal", "about", "adviserViews", "memory",
  // Condition
  "seedFact", "flag", "composite", "draw", "minLevel", "any",
  // BaseProbability
  "fact", "whenTrue", "whenFalse", "cases", "otherwise",
  // EventDef
  "base", "initial", "earliestTurn", "latestTurn", "effects", "mitigations", "trackModifiers",
  "reveal", "reliability", "weakened", "severe", "publicIncident", "interruptScenarioId",
  // Adviser
  "bias", "forecastBias", "byDomain", "whenEvidenceThin", "noise",
  // Ending
  "priority", "when",
  // GameConfig, apart from the Political Capital rules and track bonuses
  "startingMetrics", "drift", "profiles", "facts", "weight", "band", "perCapacityPoint", "capacityLabels",
  "adequateFrom", "strongFrom", "evidenceReliability", "thinEvidencePenalty", "infoReliability", "oddsClamp",
  "falseAlarmScenarioId", "legitimacyBacklash", "below",
  // Nested inside the hidden structures above: the event registry, queued-consequence timing,
  // odds modifiers, condition operands, adviser memory lines and per-profile odds
  "events", "eventId", "minDelay", "maxDelay", "factor", "delta", "metric", "op", "not", "probability",
  "forecast", "question", "line", "benign", "contested", "hard",
] as const;

/**
 * The latent facts of a world (WorldSeed). Their names appear only inside hidden conditions.
 * A Record, so a fact added to WorldSeed and missing here fails the type check.
 */
const SEED_FACT_SET: Record<SeedFact, true> = {
  cyberOffenceLed: true, bioUpliftReal: true, sandbaggingStrategic: true, labourShockStructural: true, foreignPostureOpen: true,
};
const SEED_FACTS = Object.keys(SEED_FACT_SET) as SeedFact[];

const keysOf = (value: object) => Object.keys(value).sort();

describe("publicContent() carries nothing hidden (DECISIONS.md B33)", () => {
  test.each(HIDDEN_KEYS)("no %s key", (key) => {
    expect(json).not.toContain(`"${key}":`);
  });

  test.each(SEED_FACTS)("no mention of the latent fact %s", (fact) => {
    expect(json).not.toContain(fact);
  });

  test("advisers expose exactly id, name, role and lens", () => {
    expect(pub.advisers).toHaveLength(4);
    for (const adviser of pub.advisers) expect(keysOf(adviser)).toEqual(["id", "lens", "name", "role"]);
  });

  test("each scenario's adviser views expose exactly stance and recommends", () => {
    for (const scenario of Object.values(pub.scenarios)) {
      for (const view of Object.values(scenario.advisers)) expect(keysOf(view)).toEqual(["recommends", "stance"]);
    }
  });

  test("each scenario exposes exactly its public fields", () => {
    // A new public field on a scenario is a deliberate decision: add it here and log it in DECISIONS.md.
    for (const scenario of Object.values(pub.scenarios)) {
      expect(keysOf(scenario)).toEqual([
        "advisers", "briefing", "choices", "date", "domain", "evidencePanel", "evidenceStrength",
        "forecastQuestion", "id", "isCrisis", "resolvesBy", "severity", "signal", "title",
      ]);
    }
  });

  test("each option exposes exactly id, text, lever, visible effects and its unlock", () => {
    // A new public field on an option is a deliberate decision: add it here and log it in DECISIONS.md.
    for (const scenario of Object.values(pub.scenarios)) {
      for (const choice of scenario.choices) {
        expect(keysOf(choice)).toEqual(["id", "lever", "text", "unlock", "visibleEffects"]);
        if (choice.unlock) expect(keysOf(choice.unlock)).toEqual(["level", "track"]);
      }
    }
  });

  test("each ending exposes exactly id, title, text and further reading", () => {
    for (const ending of Object.values(pub.endings)) expect(keysOf(ending)).toEqual(["furtherReading", "id", "text", "title"]);
  });
});
```

**Step 2: Run it, and prove it bites**

This guards code that is already correct, so it passes at once:

```bash
npx vitest run tests/content/public.test.ts
```

Expected: `Tests  91 passed (91)` (81 hidden keys, 5 latent facts, 5 shape checks).

Prove it fails on a leak. In `src/content/public.ts`, line 98, temporarily replace:

```ts
    advisers: content.advisers.map(({ id, name, role, lens }) => ({ id, name, role, lens })),
```

with:

```ts
    advisers: content.advisers.map((adviser) => ({ ...adviser })),
```

```bash
npx vitest run tests/content/public.test.ts
```

Expected: `Tests  6 failed | 85 passed (91)`: the `bias`, `forecastBias`, `byDomain`, `whenEvidenceThin` and `noise` keys, and "advisers expose exactly id, name, role and lens". Then undo the temporary edit (`git checkout -- src/content/public.ts` discards only this file's uncommitted change) and confirm the file is untouched:

```bash
git checkout -- src/content/public.ts
git diff --quiet src/content/public.ts && echo RESTORED
```

Expected: `RESTORED`.

**Step 3: Implement**

No production change: `publicContent()` already strips every hidden field. The test is the deliverable.

**Step 4: Run it and watch it pass**

```bash
npm run test
npm run typecheck
npm run lint
```

Expected: `Test Files  10 passed (10)` and `Tests  257 passed (257)` (260 with PR #2: 166 or 169 before, plus 91); `typecheck` and `lint` exit 0.

**Step 5: Commit**

```bash
git add tests/content/public.test.ts
git commit -m "test(content): fail if a hidden key reaches publicContent()" -m "Checks the serialised public view for every container key of the hidden half of content and the nested keys that carry timing, odds and conditions, for the names of the five latent facts (typed, so a new fact must be added), and for the exact keys of advisers, adviser views, scenarios, options and endings."
```

### Task 8.6: Lint guard: no published assumptions or debrief-only fields in play screens

**Files:**
- Modify: `eslint.config.js` (append a block after the last one, between line 62 `  },` and line 63 `);`)
- Test: a throwaway probe file, deleted in the same task

Two kinds of hidden information can reach a play screen today, and only convention (DECISIONS B40) stops either:

- The published assumptions. Only the debrief (`src/ui/debrief/Assumptions.tsx:2`, `src/ui/debrief/WorldPanel.tsx:2`), the facilitator panel (`src/ui/screens/Facilitator.tsx:4`) and `src/ui/useGame.ts` itself (which defines `published` and `defaults` from `assumptionsOf`, line 16) use these names, but nothing stops a new preview or consequences component from importing them.
- The debrief-only fields of `DisplayedState`. `displayed()` adds `truth`, `debrief` and `history` once the debrief unlocks (`src/engine/display.ts:56-58`). That happens in the `ADVANCE` that `App.tsx:143` dispatches with the final decision (`src/engine/reduce.ts:308-309`), before the final turn's consequences render, so these fields already exist on a play screen. Phases 11 to 13 rewrite that screen and add a pause card; DECISIONS F5 says the consequences screen never reads them. The same rule also bans `.halfWidth`, which equals 30 − 0.25 × the true State Capacity (contract non-negotiable 4); pull request #2 removes the field, and the rule is harmless either way.

In flat config a later block that sets `no-restricted-imports` for the same files replaces the earlier block's options, so the new block repeats the engine and content patterns from `eslint.config.js:55-58`. No earlier block sets `no-restricted-syntax`, so that rule replaces nothing. Today no file under `src/ui` outside the exempt ones reads `truth`, `debrief`, `history` or `halfWidth` as a property; `App.tsx:52` and `App.tsx:80` read `window.history`, which the selector excludes.

**Step 1: Write the failing test**

Create `src/ui/screens/LintProbe.tsx`:

```tsx
// Temporary probe for the hidden-information lint guard. Delete it once eslint has run.
import { defaults, published } from "../useGame";
import { assumptionsOf } from "../../content";
import type { DisplayedState, GameState } from "../../engine/types";
import type { PublicContent } from "../../content/public";

export const probe: [unknown, unknown, unknown, GameState | null, PublicContent | null] = [published, defaults, assumptionsOf, null, null];
export const hidden = (view: DisplayedState) => [view.truth, view.debrief, view.history, window.history.length];
export const band = (view: DisplayedState) => {
  const { halfWidth } = view.estimates.systemicRisk;
  return [halfWidth, view.estimates.cooperation.halfWidth];
};
```

**Step 2: Run it and watch it fail**

```bash
npx eslint src/ui/screens/LintProbe.tsx
```

Expected: `✖ 2 problems (2 errors, 0 warnings)`: only the two deep imports (`'../../engine/types' import is restricted…` and `'../../content/public' import is restricted…`). The three debrief-only imports on lines 2 and 3, the reads of `truth`, `debrief` and `history` on line 8 and the half-width on lines 10 and 11 are not flagged: that is the gap.

**Step 3: Implement**

In `eslint.config.js`, insert this block between line 62 (`  },`, the end of the "Truth stays in the engine" block) and line 63 (`);`):

```js
  {
    // Hidden information stays hidden until the debrief (DECISIONS.md B40): play
    // screens and components may not import the published assumptions, or read the
    // debrief-only fields of the displayed state. In flat config this block replaces
    // the no-restricted-imports options of the block above for these files, so it
    // repeats the engine and content patterns.
    files: ["src/ui/**/*.{ts,tsx}"],
    ignores: ["src/ui/debrief/**", "src/ui/screens/Debrief.tsx", "src/ui/screens/Facilitator.tsx", "src/ui/useGame.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["**/engine/*", "!**/engine/index"], message: "Import the engine only through src/engine/index.ts." },
            { group: ["**/content/*", "!**/content/index"], message: "Import content only through src/content/index.ts, which hides hidden effects from components." },
            { group: ["**/useGame"], importNames: ["published", "defaults"], message: "The published assumptions are for the debrief and the facilitator panel only (DECISIONS.md B40)." },
            { group: ["**/content", "**/content/index"], importNames: ["assumptionsOf"], message: "assumptionsOf() is for the debrief and the facilitator panel only (DECISIONS.md B40)." },
          ],
        },
      ],
      // The debrief-only fields of DisplayedState, and the band half-width, never reach a play screen.
      // On the final turn's consequences truth, debrief and history already exist. No earlier block
      // sets this rule, so nothing is replaced.
      "no-restricted-syntax": [
        "error",
        { selector: "MemberExpression[property.name=/^(truth|debrief|history)$/]:not([object.name='window'])", message: "truth, debrief and history are for the debrief only; on the final turn's consequences they already exist (DECISIONS.md B40, F5)." },
        { selector: "ObjectPattern > Property[key.name=/^(truth|debrief|history|halfWidth)$/]", message: "Do not destructure debrief-only fields or the band half-width outside the debrief (DECISIONS.md B40)." },
        { selector: "MemberExpression[property.name='halfWidth']", message: "The band half-width is 30 - 0.25 x true State Capacity: use low, mid and high only." },
      ],
    },
  },
```

**Step 4: Run it and watch it pass**

```bash
npx eslint src/ui/screens/LintProbe.tsx
```

Expected: `✖ 10 problems (10 errors, 0 warnings)`:

- line 2: `'defaults' import from '../useGame' is restricted…` and `'published' import from '../useGame' is restricted…`;
- line 3: `'assumptionsOf' import from '../../content' is restricted…`;
- lines 4 and 5: the two deep imports, which proves the repeated patterns still apply;
- line 8: three times `truth, debrief and history are for the debrief only…`, and nothing for `window.history`;
- line 10: `Do not destructure debrief-only fields or the band half-width…`;
- line 11: `The band half-width is 30 - 0.25 x true State Capacity…`.

Then check that the debrief folder is exempt, and remove both probes:

```bash
cp src/ui/screens/LintProbe.tsx src/ui/debrief/LintProbe.tsx
npx eslint src/ui/debrief/LintProbe.tsx
rm src/ui/screens/LintProbe.tsx src/ui/debrief/LintProbe.tsx
npm run lint
git status --short
```

Expected: the debrief probe reports `✖ 2 problems` (the deep imports only). `npm run lint` then exits 0 with no problems, so no existing file breaks either rule (`App.tsx` imports only `pub` and `useGame` from `./useGame`; screens import only `pub` or `overrideCount`). `git status --short` shows ` M eslint.config.js`, plus `?? docs/plans/` if the plan file is still untracked (Task 8.1 Step 1); nothing else (no `LintProbe.tsx`).

**Step 5: Commit**

```bash
git add eslint.config.js
git commit -m "chore(lint): keep published assumptions and debrief-only fields out of play screens" -m "Outside the debrief, the facilitator panel and useGame itself, src/ui may not import published or defaults from useGame, or assumptionsOf from content, and may not read truth, debrief, history or an estimate's halfWidth (DECISIONS B40). The debrief-only fields already exist on the final turn's consequences. The block repeats the engine and content import patterns because a later flat-config block replaces the rule's options."
```

### Task 8.7: Log the decisions and the new phases

**Files:**
- Modify: `DECISIONS.md` (section A heading, line 5; new row 14 after line 21; row B42, line 69; new section F at the end of the file)
- Modify: `docs/plan.md` (progress line 3; Phases 8 to 15 inserted after line 98; the list at lines 104-107)
- Modify: `CLAUDE.md` (reading list, lines 6-7; Workflow, lines 30-35; Copy rules, after line 47; the `npm run e2e` line, lines 56-57)
- Test: a shell check that fails before the edits and passes after

How this plan's decisions map to `DECISIONS.md` rows (the table style there is `| # | Question | Decision | Why |`; section A rows are plain numbers):

| Plan decision | `DECISIONS.md` row |
| --- | --- |
| D1 Audience | 14 (section A) records the audience, which the designer stated. The defaults that follow from it (solo play first, same-world play optional, facilitator panel unchanged, the aim of curiosity and conversation) are proposed in the section F status paragraph, not confirmed |
| D2 Visual system | F1 |
| D3 Opening | F2 |
| D4 Forecast | F3 |
| D5 Advisers | F4 |
| D6 Consequences | F5 |
| D7 Five-minute taster | F6 |
| D8 Save and resume | F7 |
| D9 Debrief | F8 |
| D10 Workflow | F9 |
| D11 Public rules | F10 |
| D12 Track copy | F11 |
| D13 Copy-rule interpretation | F12 |

**Step 1: Write the failing test**

```bash
grep -q '^| 14 | Who is the game for?' DECISIONS.md \
  && grep -q '^## F. Public-audience redesign' DECISIONS.md \
  && [ "$(grep -cE '^\| F([1-9]|1[0-2]) \|' DECISIONS.md)" -eq 12 ] \
  && grep -q '^- \[ \] ⬜ \*\*Phase 15: Accessibility sweep, docs and handover\*\*' docs/plan.md \
  && grep -q 'plans/2026-09-19-public-engagement-ui.md' docs/plan.md \
  && grep -q 'docs/ui-engagement-handoff.md' CLAUDE.md \
  && grep -q 'also follow `DECISIONS.md` F12' CLAUDE.md \
  && grep -q '^| B42 | Accessibility bar | The gate is no axe violations at any impact' DECISIONS.md \
  && echo DOCS-OK
```

**Step 2: Run it and watch it fail**

Expected: no output (the first `grep` fails, so `DOCS-OK` is never printed).

**Step 3: Implement**

*`DECISIONS.md`, section A heading.* Replace line 5:

```markdown
## A. Confirmed with the designer (2026-09-18)
```

with:

```markdown
## A. Confirmed with the designer (2026-09-18; decision 14 on 2026-09-19)
```

*`DECISIONS.md`, row 14.* Insert this line directly after row 13 (line 21, the row ending `serif-on-paper sentence.** |`) and before the blank line above `## B. Decided by the builder`:

```markdown
| 14 | Who is the game for? | Everyone. AI 2032 is a personal, non-professional project, a response to worries about AI shared in the designer's network, and it should interest people with no background in government, forecasting or AI policy. This supersedes the spec's primary audience of policy professionals and students in facilitated workshops (Section 1). Confirmed on 2026-09-19 | The designer's clarification, recorded in `docs/ui-engagement-handoff.md`, is authoritative on audience. What follows from it for play modes, pacing and the interface is proposed in section F, not confirmed here |
```

*`DECISIONS.md`, row B42.* Replace the whole row (line 69 at `a11ef34`, line 70 once row 14 is in):

```markdown
| B42 | Accessibility bar | The gate is "no serious violations"; the build was taken to no axe violations at any impact on every screen, in light and dark. Heading levels never skip; focus moves to the step heading on every step; the crisis clock is static text | Cheap to reach once the structure was right, and it keeps later regressions visible |
```

with:

```markdown
| B42 | Accessibility bar | The gate is no axe violations at any impact, with axe's best-practice rules (heading order, one h1, landmarks) as well as WCAG 2.2 AA, on every screen in light and dark. Tightened on 2026-09-19 at the start of the public-audience redesign; the build already met it. Heading levels never skip; focus moves to the step heading on every step; the crisis clock is static text | Cheap to reach once the structure was right, and it keeps later regressions visible. The best-practice rules are the ones that check heading order and a single h1 |
```

*`DECISIONS.md`, section F.* After the file's last line (`What this means for a player: … No fixed posture wins more than 37% of the time across all worlds.`), add one blank line and then:

```markdown
## F. Public-audience redesign

**Status: proposed on 2026-09-19; awaiting designer sign-off.** The brief is `docs/ui-engagement-handoff.md`; the work is planned task by task in `docs/plans/2026-09-19-public-engagement-ui.md` (Phases 8 to 15 of `docs/plan.md`). Rows F1 to F12 are that plan's decisions D2 to D13. Its D1 is split. The audience itself is decision 14 above. These defaults that follow from it are proposed here: solo play on the web is the main mode; playing the same world as a friend, by sharing a seed code, is an optional extra; the facilitator panel stays behind `?facilitator=1`, unchanged; and the aim is curiosity and thoughtful conversation, with AI's possible benefits and dangers both represented, never a warning, a knowledge test or a score to maximise. The engine, the content JSON, the balance rules and the hidden-information rules do not change unless a row says so. Rows move to section A as the designer confirms them.

| # | Question | Decision | Why |
| --- | --- | --- | --- |
| F1 | The visual system for a public audience (decision 13; spec Section 14's "no game-style chrome") | Decision 13 stands: IBM Plex, square corners, ink, paper and canvas, hairline rules, inversion for emphasis, one navy accent used only for function, no shadows, no gradients, no emoji. Only the print-production text labels go: the figure-id strip ("COVER · 720PT", "TURN 1 · BRIEFING · 720PT"), the `Figure` state labels ("720PT", "48MM") and the "Fig. NN" prefix in plate captions. The artboard corner ticks and the plate captions stay. Mono microlabels are at least 12px (`text-xs`). Engagement comes from content order, pacing and feedback, never from points, badges, streaks, scores to beat, confetti, sound, real-time timers, red-and-green good-or-bad colouring or animation beyond simple CSS transitions | The labels help no player (engagement handoff, observation 7), and decision 13 fixes type, chrome and constraints rather than these labels. The captions are the only description of each plate. The exclusions keep spec Section 13's out-of-scope list and the handoff's warning against a score-maximising exercise, and give a reviewer something testable |
| F2 | How does the game open for a first-time visitor? | Dilemma first. The title screen leads with the dilemma, and its primary button reads exactly "Try your first decision" (replacing "Begin"). The seed field moves into a disclosure titled "Play the same world as a friend", open by default when the link carries `?seed=`; its label still starts with "Seed code". The notice that the unit and advisers are fictional stays on the title screen. The button sits inside the first viewport at 375×667, 726×900 and 1280×800 | Observation 1: the cover, three paragraphs and the optional seed setup put Begin below the fold at every width. The spec teaches through mechanics rather than text (Section 2), which favours one clear first action. The disclaimer is required by the spec's risk table (Section 13) |
| F3 | How are the advisers' estimates shown beside the forecast slider? | Gut feel first, then compare. The single native range slider stays the first control after the heading and starts at 50. After it in page order comes a quiet button, "Compare with your advisers", which reveals the four estimates as marks on the same 0 to 100 scale and the sentence "You said N%. Your advisers range from A% to B%." The primary button, "Lock in N%", is always enabled, so the comparison is optional. There is no average or consensus mark. The first guess is not stored | Observation 8. The spec's risk table wants the estimates beside the slider as anchors; the engagement handoff warns about anchoring. Asking first and comparing second keeps both. A consensus mark would make one number more salient than the disagreement |
| F4 | How are the advisers made approachable without new content? | Each adviser card shows name and role, "Cares about: {lens}" (a public field not shown until now), "Backs option X: {option text}", then the stance. A "Who backs what" split lists every open option with the advisers backing it. No new authored text: one-line summaries wait until a playtest asks for them | The engagement handoff asks for short, recognisable perspectives without a correct expert set against foils. Everything shown comes from `publicContent()`; adviser bias stays hidden (B33) and dialogue trees stay out (B12) |
| F5 | What does the consequences screen show? | Four parts in the main column, built by one pure helper: Your decision; What the world noticed (the heading keeps this exact text); What you can measure now; Still unknown. It never shows a per-metric remainder of measured change minus stated effects, and never presents a change in an estimate's band or midpoint as a change. The screen never reads `view.current`, `view.truth`, `view.debrief` or `view.history` | Observation 5: below 1024px wide the measured changes sat below the whole page. Hidden and fact-conditional effects move exact metrics at once, so a remainder would reveal a latent fact; band noise is redrawn every turn (B8); the odds behind a decision are withheld until the debrief, so no sentence during play may say "because you chose" |
| F6 | A five-minute introductory route | A pause after the first turn's consequences, in every game: a short reflection with "Keep going" and "Stop here". Continuing plays the same game from the same state. No engine or content change: the full game stays eight turns (B1). Stopping never shows the debrief, the world reveal or the assumptions | A visitor can try one real decision before committing 25 minutes. A shorter game would need its own balance, luck-tag and debrief checks, and the truth unlocks only after the final decision (B21, B40) |
| F7 | Saved progress (spec Section 13 lists saved games as out of scope; Section 14 keeps all state in memory) | Optional: built in Phase 14 only if the designer approves. One save in this browser's local storage under `ai-2032:save:v1`, holding only `{v, contentId, seedCode, cfg, actions, stage, resolved, at}`: the seed code, any facilitator edits, the player's own actions and where they were, never the game state. Resuming replays the actions through the session reducer, which determinism makes exact. "Continue" on the title screen is opt-in; the game never resumes by itself. Nothing is sent anywhere, and a seed link still reproduces a world, not progress | A 25-minute game on a phone is often interrupted. Storing actions rather than state keeps the world profile, the facts and the true metrics out of storage and needs no engine change. Resuming by itself would break the shared-link reload (the seed round-trip test) |
| F8 | The order of the debrief (spec Section 11) | The header; "At a glance" (new); What if, moved second, preselected on the most arguable decision and showing how the 1,000 replays ended; Decision quality versus luck; then the reference panels (The world you were in, Calibration, Governance record, What you never saw), each collapsible; "Talk it over" prompts; "Share your run". The six existing panel headings keep their current text as a prefix. No same-world rewind | Observation 9: the strongest invitation to experiment came last. A single same-seed replay read as cause would bring back the deterministic blame that spec Section 1 removes; What if across 1,000 fresh seeds (B39) is the sanctioned counterfactual |
| F9 | How is the redesign built and shipped? | On a feature branch, merged to `main` by a pull request the designer approves, as PR #1 was. Gate commits go to that branch, not to `main`. Nothing is deployed without the designer's approval. GitHub Actions has never run (every run stopped on a billing block), so each gate runs locally: `npm run lint && npm run test && npm run balance && npm run build && npm run e2e`, with `du -sk dist` under 16384 | The engagement handoff gives no approval to publish or deploy. Decision 9's gate pushes to `main` covered the seven build phases, which are complete |
| F10 | May the Political Capital rules and the track bonuses reach the interface? | Yes. `publicContent()` gains `rules: { perTurn, carryCap, trustBonusAt, trustPenaltyAt, windowTurns, windowDiscount, windowMinCost, boomEconomyAt, boomSurcharge }`, copied field by field from `config.politicalCapital` (`infoCost` is already public), and `trackBonuses`, copied from `config.trackBonuses`. Nothing hidden joins them: no stance, no drift, no hidden effects, no band formula. The change is in `src/content/public.ts`; the engine does not change. `tests/content/public.test.ts` fails if a hidden key reaches `publicContent()` | These rules are published in spec Section 5 and B30, and the interface already hard-codes them (the per-level bonuses in `TRACK_DETAIL`, "2 less Political Capital" on the news screen). Reading them from content keeps the copy and the engine in step |
| F11 | The investment copy promises what the content does not model | The Diplomacy line "Level 2: joint evaluations" is removed: no content implements it. Evaluation science level 3 opens an option "in the unscheduled crisis", not "in crisis turns". The per-level bonus text is generated from `trackBonuses` | Spec Section 5 lists joint evaluations, but no scenario or event tests Diplomacy level 2; the only Diplomacy test is level 3, one of the conditions on the 2032 Threshold's option D. The level-3 Evaluation science option exists only in the three interrupt variants, not in the Deepfake Election |
| F12 | How does the prefix rule apply to groups of figures and to new copy? | A group of simulated figures, such as a list of metric changes, is introduced by a caption that begins "Under this game's assumptions", and every sentence builder that states a simulated statistic begins with it. New player-facing copy never uses right, wrong, correct, incorrect, mistake, should have, good decision or bad decision. It names an everyday subject (jobs, elections, scams, hospitals, public services) as something the game covers only where a scenario deals with it, and it sets AI's possible benefits beside its dangers: the game is not a warning, a quiz or a score to beat. British English. Biosecurity stays at policy level | Short copy cannot repeat the prefix on every number, and the copy tests check it sentence by sentence. The banned words are the list `tests/ui/copy.test.ts` already enforces. The engagement handoff lists everyday stakes as framing ideas, not scenarios, and asks for both benefits and dangers |
```

*`docs/plan.md`, progress line.* Replace line 3:

```markdown
**Overall Progress:** `100%` of build steps (35 of 35). The items only people can complete are listed at the end and remain open.
```

with:

```markdown
**Overall Progress:** `65%` of build steps (41 of 63). Phases 0 to 7, the original build, are complete; Phases 8 to 15 are the public-audience redesign. The items only people can complete are listed at the end and remain open.
```

The count: the 35 original steps, plus 28 new ones (Phase 8: 7, Phase 9: 4, Phase 10: 4, Phase 11: 4, Phase 12: 3, Phase 13: 3, Phase 15: 3). Optional Phase 14's 2 steps are not counted unless the designer approves it. Done: 35 plus the six Phase 8 steps this commit completes = 41. 41 / 63 = 65%.

*`docs/plan.md`, new phases.* After line 98 (the Phase 7 gate line, ending `Commit and push.`), insert one blank line and then the block below. Keep the existing blank line above `## Owned by the designer, not the build`. Replace `<UNIT>`, `<PW>` and `<WALL>` with the three numbers recorded in Task 8.1 Step 6.

```markdown
Phases 8 to 15 are the public-audience redesign: the brief is `docs/ui-engagement-handoff.md`, the decisions are `DECISIONS.md` decision 14 and section F, and every step is planned task by task in [`docs/plans/2026-09-19-public-engagement-ui.md`](plans/2026-09-19-public-engagement-ui.md). The work happens on a feature branch and reaches `main` only by a pull request the designer approves. GitHub Actions has never run, so every gate is run locally: `npm run lint && npm run test && npm run balance && npm run build && npm run e2e`. Status: 🟩 done, 🟨 in progress, ⬜ not started. Optional Phase 14 is not counted in the progress figure unless the designer approves it.

- [ ] 🟨 **Phase 8: Baseline and safety net**
  - [x] 🟩 Baseline before any change: `npm ci`, Playwright Chromium, all local gates green. `npm run test` <UNIT> passed; `npm run e2e` 17 passed in <PW> s (Playwright's figure), <WALL> s wall clock including the build
  - [x] 🟩 End-to-end helpers hardened: `LABEL` constants in `e2e/play.ts`, helpers wait for the next screen, the debrief is found by `data-testid="debrief"`, luck tags are read only after the rankings arrive; the axe check fails on any violation, heading order and one h1 included (`DECISIONS.md` B42)
  - [x] 🟩 Fix: an option priced out by commissioning analysis no longer stays picked with Confirm enabled (the page went blank), and focus moves to the analysis bought; regression test in `e2e/regressions.spec.ts`
  - [x] 🟩 Fix: the steps rail lists Investment on turn 7's consequences and not on the final turn's; regression test
  - [x] 🟩 Guards: `tests/content/public.test.ts` fails if a hidden key reaches `publicContent()`; a lint rule keeps `published`, `defaults`, `assumptionsOf`, `view.truth`, `view.debrief`, `view.history` and `halfWidth` out of play screens
  - [x] 🟩 Docs: `DECISIONS.md` decision 14 and section F; Phases 8 to 15 here; `CLAUDE.md` reading list and branch workflow
  - [ ] ⬜ Gate: all local gates green; baseline e2e timing recorded; crash bug fixed with a regression test. Commit on the feature branch.

- [ ] ⬜ **Phase 9: The opening**
  - [ ] ⬜ Dilemma-first title screen; the primary button reads "Try your first decision" and sits inside the first viewport at 375×667, 726×900 and 1280×800
  - [ ] ⬜ Seed field inside "Play the same world as a friend", open when the link carries a seed; the fictional-unit disclaimer stays
  - [ ] ⬜ Print-production labels removed (figure ids, 720PT, 48MM, "Fig. NN"); mono microlabels at least 12px
  - [ ] ⬜ Gate: `e2e/engagement.spec.ts` checks the button position at the three sizes; all local gates green. Commit on the feature branch.

- [ ] ⬜ **Phase 10: Briefing and forecast**
  - [ ] ⬜ Advisers: "Cares about", "Backs option X" and a "Who backs what" split, from public content only
  - [ ] ⬜ Forecast: gut feel first, then "Compare with your advisers" on the same 0 to 100 scale; "Lock in N%" always enabled
  - [ ] ⬜ Play-screen sentence builders in `src/ui/copy.ts`, unit-tested against the copy rules
  - [ ] ⬜ Gate: all local gates green; axe clean on the new states in light and dark. Commit on the feature branch.

- [ ] ⬜ **Phase 11: Decision, investment and consequences**
  - [ ] ⬜ `publicContent()` gains the Political Capital rules and track bonuses; investment copy corrected (`DECISIONS.md` F10, F11)
  - [ ] ⬜ Choice preview (Political Capital left, stated effects) and a track ladder with the next unlock, from pure, unit-tested helpers
  - [ ] ⬜ Consequences in four parts in the main column: Your decision, What the world noticed, What you can measure now, Still unknown
  - [ ] ⬜ Gate: all local gates green. Stop for the designer's review of the opening and one representative turn.

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
```

*`docs/plan.md`, human-only items.* Replace line 107:

```markdown
- The three willingness-to-pay sessions in the spec's commercial note
```

with:

```markdown
- The three willingness-to-pay sessions in the spec's commercial note
- Whether the spec's commercial note (a paid workshop layer, and the three willingness-to-pay sessions above) still applies now that the game is a personal project for everyone (`DECISIONS.md` decision 14)
- Sign-off of `DECISIONS.md` decision 14 and section F (the public-audience redesign)
- The design reviews at the Phase 11 and Phase 13 gates, and the decision on optional Phase 14
- Merging the redesign's pull request, and any deploy
```

*`CLAUDE.md`, reading list.* Replace lines 6-7:

```markdown
the spec was silent is in `DECISIONS.md`.
Read all four before writing code. Where spec and handoff disagree, the spec
```

with:

```markdown
the spec was silent is in `DECISIONS.md`. The public-audience redesign is briefed
in `docs/ui-engagement-handoff.md` and planned task by task in
`docs/plans/2026-09-19-public-engagement-ui.md`.
Read all six before writing code. Where spec and handoff disagree, the spec
```

*`CLAUDE.md`, Workflow.* Replace these six lines (lines 30-35 at `a11ef34`; the reading-list edit above moves them down by two):

```markdown
- Build in the seven phases in `docs/plan.md`. Each has an acceptance gate.
  Do not start a phase until the previous gate is green.
- Commit on `main` at each green gate without asking, and push the gate commit to GitHub
  (the designer authorised gate pushes on 2026-09-18). CI runs lint, tests, balance and build.
- Stop and wait for the designer at: the Phase 2 provisional-numbers sign-off,
  the Phase 4 human playtest, and completion.
```

with:

```markdown
- Build in the phases in `docs/plan.md`: Phases 0 to 7 are the original build,
  Phases 8 to 15 the public-audience redesign. Each has an acceptance gate.
  Do not start a phase until the previous gate is green.
- Phases 0 to 7: commit on `main` at each green gate without asking, and push the gate
  commit to GitHub (the designer authorised gate pushes on 2026-09-18).
- Phases 8 to 15: work on a feature branch, never on `main`. Commit each green gate to
  that branch without asking. The branch reaches `main` only through a pull request the
  designer approves, and nothing is deployed without their approval. Push the branch and
  open the pull request at the Phase 15 gate, or earlier if the designer asks.
- GitHub Actions has never run (every run stopped on a billing block), so run every gate
  locally: `npm run lint && npm run test && npm run balance && npm run build && npm run e2e`.
- Stop and wait for the designer at: the Phase 2 provisional-numbers sign-off,
  the Phase 4 human playtest, the Phase 11 and Phase 13 design reviews, the decision
  on optional Phase 14, and completion.
```

*`CLAUDE.md`, Copy rules.* Directly after the line `- Biosecurity content stays at policy level: no technical specifics.` (line 47 at `a11ef34`; the edits above move it down), insert:

```markdown
- Public-audience redesign (Phases 8 to 15): also follow `DECISIONS.md` F12: captions carry
  the prefix for groups of figures, no subject is promised that the content does not cover,
  and benefits and dangers are both represented.
```

*`CLAUDE.md`, the e2e command.* Replace the two lines below (lines 56-57 at `a11ef34`; the edits above move them down):

```markdown
- `npm run e2e` - Playwright browser tests against the production bundle (crisis
  turns, debrief, 3-second budget, axe, keyboard, reproducibility)
```

with:

```markdown
- `npm run e2e` - Playwright browser tests against the production bundle (crisis
  turns, debrief, 3-second budget, axe, keyboard, reproducibility, regressions).
  It reuses any server already on port 4173, so stop a stale `vite preview` first
```

**Step 4: Run it and watch it pass**

Run the Step 1 check again, then:

```bash
grep -n '<UNIT>\|<PW>\|<WALL>' docs/plan.md
awk -F'|' '/^\| (F[0-9]+|14|B42) \|/ { if (NF != 6) print "bad row: " $2 }' DECISIONS.md
grep -cE '^  - \[x\] 🟩' docs/plan.md
npm run lint
```

Expected: `DOCS-OK`; the placeholder `grep` prints nothing; the `awk` prints nothing (every new or changed row has exactly four cells); the count of done steps is `41`; `lint` exits 0.

**Step 5: Commit**

```bash
git add DECISIONS.md docs/plan.md CLAUDE.md
git commit -m "docs: log the public-audience decisions and plan Phases 8 to 15" -m "DECISIONS.md gains decision 14 (the audience is everyone, as the designer stated) and section F, the redesign's proposed decisions F1 to F12 and the defaults that follow from the audience, awaiting the designer's sign-off. B42 records the stricter axe bar. docs/plan.md gains Phases 8 to 15, the recorded baseline, and the open question of whether the commercial note still applies. CLAUDE.md adds the engagement handoff and the plan to the reading list, points the copy rules at F12, and moves redesign gate commits to a feature branch."
```

If `docs/plans/2026-09-19-public-engagement-ui.md` was untracked in Task 8.1, add it to this commit too.

### Phase 8 gate

Free port 4173 first (`lsof -nP -iTCP:4173 -sTCP:LISTEN` prints nothing), then run the full local gate:

```bash
npm run lint && npm run test && npm run balance && npm run build && du -sk dist && /usr/bin/time -p npm run e2e
git diff --stat origin/main...HEAD -- src/engine src/content package.json package-lock.json
```

(`origin/main...HEAD` compares this branch with the point where it left `origin/main`, as fetched in Task 8.1 Step 2. If pull request #2 was merged in there, its engine change is part of `origin/main` and is not counted as this branch's.)

What must be true:

- `npm run lint` exits 0.
- `npm run test`: `Test Files  10 passed (10)`, `Tests  257 passed (257)` (166 before, plus the 91 in `tests/content/public.test.ts`), or `Tests  260 passed (260)` with PR #2.
- `npm run balance` ends `Balance check passed.` with pooled shares still 35.4% / 27.5% / 37.1%.
- `npm run build` succeeds and `du -sk dist` stays about 1972, under 16384.
- `npm run e2e`: `19 passed` (the 17 from the baseline plus the 2 in `e2e/regressions.spec.ts`). On the planning machine: `19 passed (12.3s)` to `19 passed (13.7s)`. Note the Playwright figure and the `real` seconds. From here on the e2e baseline is 19 (crisis 4, debrief 5, polish 8, regressions 2); later phases add to this.
- The `git diff --stat` prints nothing: no change under `src/engine` or `src/content`, and no dependency change.
- The stale-pick crash is fixed and covered, with the focus move, by "commissioning analysis after picking an option it makes unaffordable clears the pick instead of crashing"; both forms of the rail bug (turn 7 and the final turn) by "the final turn never lists an investment step, even on its consequences".
- The axe walk (`axe finds no violations on any screen`, light and dark) passes with the best-practice rules on.

Update `docs/plan.md`:

- Replace `- [ ] 🟨 **Phase 8: Baseline and safety net**` with `- [x] 🟩 **Phase 8: Baseline and safety net**`.
- Replace `  - [ ] ⬜ Gate: all local gates green; baseline e2e timing recorded; crash bug fixed with a regression test. Commit on the feature branch.` with `  - [x] 🟩 Gate: all local gates green (e2e 19 passed in <PW8> s); baseline e2e timing recorded; crash bug fixed with a regression test. Committed on the feature branch.`, where `<PW8>` is the Playwright figure from this gate run.
- Replace the progress line's `` `65%` of build steps (41 of 63) `` with `` `67%` of build steps (42 of 63) ``.

Check that no placeholder is left and the count of done steps moved on:

```bash
grep -n '<UNIT>\|<PW>\|<WALL>\|<PW8>' docs/plan.md
grep -cE '^  - \[x\] 🟩' docs/plan.md
```

Expected: the first prints nothing; the second prints `42`.

Commit on the feature branch; do not push (CLAUDE.md: the branch is pushed at the Phase 15 gate or when the designer asks):

```bash
git add docs/plan.md
git commit -m "docs(plan): Phase 8 gate green" -m "All local gates pass: lint, unit tests (public-content guard included), balance, build, 19 browser tests (axe with best-practice rules). Baseline and post-change e2e timings are recorded in docs/plan.md."
```

No designer stop at this gate. DECISIONS.md section F stays "proposed; awaiting designer sign-off" and is reviewed at the Phase 11 gate together with the opening and one representative turn. Continue to Phase 9.


---

## Phase 9: The opening

**Goal:** a newcomer lands on a dilemma, not a print proof: the first decision is one tap away on the first screen of a phone, a tablet window and a laptop, and no screen shows print-production labels or text under 12px.
**Handoff items addressed:** observation 1 (Begin below the fold; seed setup in the way), observation 7 (`720PT`, `48MM`, "Fig. NN"), proposals "Start with a dilemma" and "Teach through play" (shared-seed play becomes an optional "Play the same world as a friend"), the share-link part of "everyday stakes" (link-preview text), and the constraint to maintain keyboard operation (focus comes back to the title's h1 after Play again). Contract decisions D2, D3, D10, D13; non-negotiables 6, 7 and 8.
**Depends on:** the Phase 8 gate. Phase 8 provides `LABEL` in `e2e/play.ts` (with `start: "Begin"`), a `playToDebrief` that waits for the debrief (`data-testid="debrief"`), DECISIONS.md section F with a row for the print-production labels and 12px microlabels (contract D2; F1 in the Phase 8 draft, which the Phase 9 brief called F3) and a row for the opening (contract D3; F2 in the Phase 8 draft), the Phase 9 block in `docs/plan.md` (status legend 🟩 done, 🟨 in progress, ⬜ not started), the redesign branch, and installed `node_modules` plus Chromium. Phase 8's gate leaves `npm run test` at `Tests  257 passed (257)` in 10 files (`Tests  260 passed (260)` if pull request #2 was merged) and `npm run e2e` at `19 passed` (the 17 baseline tests plus the 2 in `e2e/regressions.spec.ts`); every count below builds on those.

### Before you start

- Work on the redesign branch Phase 8 created, never on `main`: `git branch --show-current` must not print `main`. `git status --short` must print nothing.
- If `node_modules` is missing, run `npm ci` and `npx playwright install chromium`.
- `playwright.config.ts` reuses any server already on port 4173 (`reuseExistingServer: true`), which would test a stale bundle. Before every e2e run, `lsof -ti tcp:4173` must print nothing; if it prints a process id, `kill <id>`.
- `npm run e2e` starts with `npm run build`, which starts with `tsc --noEmit` over `src`, `tests`, `scripts` and `e2e`. A type error anywhere makes Playwright stop with `Process from config.webServer was not able to start. Exit code: 2`. Run `npx tsc --noEmit` first to see the real error. E2e files cannot import `node:*` modules (there is no `@types/node`).
- Everything below was dry-run on a copy of HEAD `a11ef34` carrying Phase 8's real `e2e/play.ts` (`LABEL`, the waiting `finishTurn`, `playToDebrief` on `data-testid="debrief"`), the Debrief test id and Phase 8's `e2e/debrief.spec.ts` change, but not Phase 8's `e2e/regressions.spec.ts`. On that copy the full e2e suite passed (27 tests: the 17 at HEAD plus the 10 below; with Phase 8's two regression tests the count is 29). `npm run lint` and `tsc` were clean. Axe found no violations at any impact on the new title (light and dark, 375 and 1280 wide, plain, with a facilitator's `cfg` link, and with `?facilitator=1`). `npm run balance` printed `Balance check passed.`, and `dist` was 1,972 KB. Each new assertion was also checked against the defect it guards: it passes on the finished code and fails when that defect is put back. The revised section was then run whole on a copy of Phase 8's executed branch, which includes `e2e/regressions.spec.ts`: `npm run lint` clean, `Tests  257 passed (257)`, `29 passed`, and `dist` at 1,976 KB.

**Lines that change here and are quoted from HEAD by later phases.** After Phase 9, later tasks must anchor on the new text:

| File | HEAD text | After Phase 9 |
|---|---|---|
| `src/ui/App.tsx` | `<AppShell chrome={{}} steps={["Cover"]} stepIndex={0} stepsLabel="Document" figureId="Cover · 720pt">` | `<AppShell>` |
| `src/ui/App.tsx` | `figureId="Debrief · Record · 720pt"` and ``figureId={`Turn ${turn} · ${currentStep} · 720pt`}`` | lines deleted |
| `src/ui/screens/Briefing.tsx` | `{plate && <Figure src={plate.src} figure={plate.figure} caption={plate.caption} state="720pt" />}` | `{plate && <Figure {...plate} />}` |
| `src/ui/screens/Debrief.tsx` | `{mark && <Figure src={mark.src} figure={mark.figure} caption={mark.caption} state="48mm" className="mb-6 max-w-[12rem]" />}` | `{mark && <Figure {...mark} className="mb-6 max-w-[12rem]" />}` |
| `Briefing.tsx`, `Forecast.tsx`, `Debrief.tsx`, `AdviserCard.tsx`, `IntelFile.tsx`, `EvidenceTag.tsx`, `CrisisClock.tsx` | `text-[10px]`, `text-[11px]` | `text-xs` |
| `src/ui/debrief/CalibrationPanel.tsx` | `fontSize: 11,` (two ticks) | `fontSize: 12,` |
| `AppShell` props | `steps`, `stepIndex`, `stepsLabel`, `figureId` required | `figureId` gone; the other three optional |
| `Figure` props / `Plate` | `{ src, caption, figure, state? }` / `{ src, figure, caption }` | `{ src, caption, width, height, alt?, className? }` / `{ src, caption, width, height }`. Any later `figure={….figure}` or `state="…"` on a `Figure` no longer compiles: pass the plate with `{...plate}` |
| `src/ui/screens/Title.tsx` | `export function Title({ initialSeed, onStart }: Props) {` | `export function Title({ initialSeed, onStart, headingRef }: Props) {`. In `Props`, `headingRef?` sits between `initialSeed` and `onStart`, so the two lines `  onStart: (seedCode: string) => void;` and `}` still end the interface |
| `src/ui/screens/Title.tsx` | `<p className="mt-4 text-sm text-muted">About 25 minutes. There is no correct AI policy to find.</p>` | `About 25 minutes for {pub.totalTurns} decisions. There is no correct AI policy to find.`, directly under the button; the edited-assumptions notice (facilitator links only) follows it, then the `<details className="mt-6 border-y border-rule py-2" open={Boolean(initialSeed)}>` disclosure |
| `src/ui/App.tsx` | `        <Title` then `          initialSeed={seedFromUrl()}` | `          headingRef={heading}` inserted between them; the `initialSeed` line is unchanged |
| `src/ui/App.tsx` (step-focus effect) | `  useEffect(() => {` then `    heading.current?.focus();` | `  const started = useRef(false);` sits above `  useEffect(() => {`, and `    heading.current?.focus();` becomes `    if (stepKey !== "title") started.current = true;` then `    if (started.current) heading.current?.focus();`. The closing line `  }, [stepKey]);`, which Phases 12 and 14 anchor on, is unchanged |
| `src/ui/art/plates.ts` | `  caption: "Cover sheet. Frontier Technology Risk Unit, 2026–2032.",` | `  caption: "A government building, a map of Britain and Ireland, and a table stacked with files.",` |

Page order on the title after Phase 9, for later phases' prose: the "A decision game" eyebrow, the h1, the dilemma, the role sentence, the button, "About 25 minutes for 8 decisions…", the edited-assumptions notice (facilitator `cfg` links only), then "Play the same world as a friend", the cover plate, "How it works", "What you will face" and the disclaimer.

---

### Task 9.1: Print-production labels leave the shell and the plates

**Files:**
- Create: `e2e/engagement.spec.ts`
- Modify: `src/ui/shell/Artboard.tsx` (whole file), `src/ui/shell/AppShell.tsx` (whole file), `src/ui/components/Figure.tsx` (whole file), `src/ui/art/plates.ts` (whole file)
- Modify: `src/ui/App.tsx` (the three `AppShell` calls: HEAD lines 44, 68, 118, which are 44, 68, 123 after Phase 8's rail fix), `src/ui/screens/Title.tsx` (line 26), `src/ui/screens/Briefing.tsx` (line 30), `src/ui/screens/Debrief.tsx` (line 63)
- Modify: `docs/plan.md` (Phase 9 marker to 🟨)
- Test: `e2e/engagement.spec.ts`

**Step 1: Write the failing test.** First confirm the `LABEL` keys this spec uses exist: `grep -n -A 12 "export const LABEL" e2e/play.ts` must list `start`, `continueToForecast`, `lockIn`, `decisionGroup`, `confirm`, `investGroup`, `investIn` and `newsHeading`. Then create `e2e/engagement.spec.ts`:

```ts
// Public-audience redesign (docs/ui-engagement-handoff.md, DECISIONS.md section F).
// New behaviour is tested here; the older gates keep their own spec files.

import { expect, test, type Page } from "@playwright/test";
import { LABEL, playToDebrief, startGame } from "./play";

// ---------------------------------------------------------------- print-production labels

/**
 * Width and state labels such as "720pt" or "48mm", and figure numbers such as "Fig. 01".
 * Case-insensitive: innerText applies CSS text-transform, so an uppercase label reads "FIG. 01".
 */
const PRINT_LABELS = [/\b\d+\s?(pt|mm)\b/i, /\bFig\.\s?\w+/i];

/**
 * Only rendered text counts: innerText skips hidden elements and closed disclosures.
 * Some plates have a figure number drawn into the artwork itself; those are pixels, not text.
 */
async function expectNoPrintLabels(page: Page, where: string) {
  const text = await page.locator("body").innerText();
  for (const pattern of PRINT_LABELS) expect(text, `${where} shows ${pattern}`).not.toMatch(pattern);
}

test("no screen shows print-production labels", async ({ page }) => {
  await page.goto("/?seed=LABELS-1");
  await expectNoPrintLabels(page, "title");

  await page.getByRole("button", { name: LABEL.start }).click();
  await expect(page.getByRole("button", { name: LABEL.continueToForecast })).toBeVisible();
  await expectNoPrintLabels(page, "briefing");

  await page.getByRole("button", { name: LABEL.continueToForecast }).click();
  await expect(page.getByRole("slider")).toBeVisible();
  await expectNoPrintLabels(page, "forecast");

  await page.getByRole("button", { name: LABEL.lockIn }).click();
  await expect(page.getByRole("group", { name: LABEL.decisionGroup })).toBeVisible();
  await expectNoPrintLabels(page, "decision");

  await page.locator('input[name="choice"]:enabled').first().check();
  await page.getByRole("button", { name: LABEL.confirm }).click();
  await expect(page.getByRole("group", { name: LABEL.investGroup })).toBeVisible();
  await expectNoPrintLabels(page, "investment");

  await page.locator('input[name="track"]:enabled').first().check();
  await page.getByRole("button", { name: LABEL.investIn }).click();
  await expect(page.getByRole("heading", { name: LABEL.newsHeading })).toBeVisible();
  await expectNoPrintLabels(page, "consequences");

  await startGame(page, "LABELS-1");                                         // the helpers play the rest
  await playToDebrief(page);
  await expectNoPrintLabels(page, "debrief");
});

test("the title screen has no steps rail", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "AI 2032" })).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
});
```

The walk stops at turn 1's consequences and restarts with `startGame`, so it does not depend on what comes after turn 1 (Phase 12 adds a pause card there and teaches the helpers to pass it). The fixed seed `LABELS-1` matters: a generated seed such as `12PT-ABCD` would itself match the pattern. Both patterns need the `i` flag: `Figure` sets the figure number in an `uppercase` span (`src/ui/components/Figure.tsx:21`), and `innerText` returns the text as displayed, so the page reads "FIG. 01", which a case-sensitive `/Fig\./` never matches. `grep -rniE "\bfig\.\s?\w+" src/content` prints nothing, so the flag adds no false alarms.

**Step 2: Run it and watch it fail.**

```
npx tsc --noEmit && npx playwright test e2e/engagement.spec.ts
```

Expected: `2 failed`.
- "no screen shows print-production labels": `Error: title shows /\b\d+\s?(pt|mm)\b/i`. The received string starts `"AI 2032` and contains `COVER · 720PT` (and `FIG. 00`, but the pt/mm pattern is checked first).
- "the title screen has no steps rail": `Expected: 0`, `Received: 1` for `getByRole('navigation')`.

**Step 3: Implement.**

3a. Replace the whole of `src/ui/shell/Artboard.tsx`:

```tsx
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

/** Grey canvas, centred page with a 1px rule and corner ticks. */
export function Artboard({ children }: Props) {
  return (
    <main id="main" className="min-w-0 bg-canvas px-3 py-4 sm:px-4 lg:px-6 lg:py-6">
      <div className="relative mx-auto max-w-3xl bg-paper">
        <span className="pointer-events-none absolute -left-px -top-px h-2.5 w-2.5 border-l border-t border-ink" aria-hidden="true" />
        <span className="pointer-events-none absolute -right-px -top-px h-2.5 w-2.5 border-r border-t border-ink" aria-hidden="true" />
        <span className="pointer-events-none absolute -bottom-px -left-px h-2.5 w-2.5 border-b border-l border-ink" aria-hidden="true" />
        <span className="pointer-events-none absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-ink" aria-hidden="true" />
        <div className="border border-rule px-4 py-6 sm:px-8 sm:py-8">{children}</div>
      </div>
    </main>
  );
}
```

3b. Replace the whole of `src/ui/shell/AppShell.tsx`. The rail becomes optional; the prop names stay, so the other call sites do not change:

```tsx
import type { ReactNode } from "react";
import { Artboard } from "./Artboard";
import { ChromeBar } from "./ChromeBar";
import { StepsRail } from "./StepsRail";

export interface ShellChrome {
  turn?: number;
  totalTurns?: number;
  dateLabel?: string | null;
  seedCode?: string | null;
}

interface Props {
  chrome?: ShellChrome;
  /** The steps rail. Left out where there are no steps yet, as on the title screen. */
  steps?: readonly string[];
  stepIndex?: number;
  stepsLabel?: string;
  status?: ReactNode;
  skip?: { href: string; label: string } | null;
  children: ReactNode;
}

/**
 * Chrome, an optional compact step index, the inspected page, and an optional status rail.
 * Desktop (`lg+`): 12rem | minmax(0,1fr) | 18rem, dropping the columns not in use. Below that, stacked.
 */
export function AppShell({ chrome = {}, steps, stepIndex = 0, stepsLabel = "Steps", status, skip, children }: Props) {
  // Whole class names, so Tailwind finds each one in the source.
  const columns = steps
    ? status ? "lg:grid-cols-[12rem_minmax(0,1fr)_18rem]" : "lg:grid-cols-[12rem_minmax(0,1fr)]"
    : status ? "lg:grid-cols-[minmax(0,1fr)_18rem]" : "lg:grid-cols-1";

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      {skip && (
        <a href={skip.href} className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:bg-paper focus:p-2">
          {skip.label}
        </a>
      )}
      <ChromeBar {...chrome} />
      <div className={`flex min-h-0 flex-1 flex-col lg:grid ${columns}`}>
        {steps && <StepsRail steps={steps} activeIndex={stepIndex} label={stepsLabel} />}
        <Artboard>{children}</Artboard>
        {status && (
          <div className="min-w-0 border-t border-rule lg:sticky lg:top-0 lg:max-h-dvh lg:overflow-y-auto lg:border-l lg:border-t-0">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
```

3c. Replace the whole of `src/ui/components/Figure.tsx`. The caption stays (it is each plate's only description, because `alt` is empty); the figure number and state label go. The plates' real sizes were checked from the webp headers: the cover and all ten scenario plates are 960 × 540; the five ending marks are 384 × 384. So the size comes from the plate, not a constant:

```tsx
interface Props {
  src: string;
  caption: string;
  /** The plate's own pixel size, so the page reserves its space before the image loads. */
  width: number;
  height: number;
  /** Decorative plates use an empty alt; the caption carries the meaning. */
  alt?: string;
  className?: string;
}

/** A plate: a raster drawing with its caption beneath. */
export function Figure({ src, caption, width, height, alt = "", className = "" }: Props) {
  return (
    <figure className={className}>
      <div className="border border-rule bg-paper">
        <img src={src} alt={alt} width={width} height={height} className="figure-raster block h-auto w-full" />
      </div>
      <figcaption className="mt-2 font-mono text-xs text-muted">{caption}</figcaption>
    </figure>
  );
}
```

3d. Replace the whole of `src/ui/art/plates.ts` (`figure` removed; `width` and `height` added; every caption unchanged except the cover's). The cover's caption was "Cover sheet. Frontier Technology Risk Unit, 2026–2032.": print wording, and after Task 9.3 the plate is no longer a cover, since it sits below the button. Because `alt` is empty, the caption is the only description a screen-reader user gets, so it now says what the drawing shows: a columned government building, a wall map of Great Britain and Ireland, and a side table stacked with files. No test matches the old caption (`grep -rn "Cover sheet" e2e` prints nothing).

```ts
import attributionGap from "./attribution-gap.webp";
import biologyResult from "./biology-result.webp";
import cover from "./cover.webp";
import deepfakeElection from "./deepfake-election.webp";
import endingDependentState from "./ending-dependent-state.webp";
import endingDeregulatedFrontier from "./ending-deregulated-frontier.webp";
import endingFortress from "./ending-fortress.webp";
import endingResponsibleAiPower from "./ending-responsible-ai-power.webp";
import endingUnknownFrontier from "./ending-unknown-frontier.webp";
import falseAlarm from "./false-alarm.webp";
import graduateCollapse from "./graduate-collapse.webp";
import incidentBio from "./incident-bio.webp";
import incidentCyber from "./incident-cyber.webp";
import openWeightRelease from "./open-weight-release.webp";
import sandbaggingFinding from "./sandbagging-finding.webp";
import threshold2032 from "./threshold-2032.webp";

export interface Plate {
  src: string;
  caption: string;
  /** Pixel size of the webp file, so the page reserves the plate's space before it loads. */
  width: number;
  height: number;
}

/** The cover and scenario plates are 960 by 540; the ending marks are 384 by 384. */
const WIDE = { width: 960, height: 540 } as const;
const MARK = { width: 384, height: 384 } as const;

export const COVER: Plate = {
  src: cover,
  caption: "A government building, a map of Britain and Ireland, and a table stacked with files.",
  ...WIDE,
};

export const SCENARIO_PLATES: Record<string, Plate> = {
  "attribution-gap": {
    src: attributionGap,
    caption: "Unattributed links between sites on a public network.",
    ...WIDE,
  },
  "open-weight-release": {
    src: openWeightRelease,
    caption: "Weights leaving a store as open cargo.",
    ...WIDE,
  },
  "biology-result": {
    src: biologyResult,
    caption: "A screening desk and a locked cabinet. Policy, not a protocol.",
    ...WIDE,
  },
  "graduate-collapse": {
    src: graduateCollapse,
    caption: "An empty professional floor after hiring stalled.",
    ...WIDE,
  },
  "deepfake-election": {
    src: deepfakeElection,
    caption: "A polling station and a wall of identical blank screens.",
    ...WIDE,
  },
  "sandbagging-finding": {
    src: sandbaggingFinding,
    caption: "An evaluation room with a second room behind the glass.",
    ...WIDE,
  },
  "incident-cyber": {
    src: incidentCyber,
    caption: "A substation and a control room after a disruption.",
    ...WIDE,
  },
  "incident-bio": {
    src: incidentBio,
    caption: "A customs hall. An allied plot is a policy event, not a specimen.",
    ...WIDE,
  },
  "false-alarm": {
    src: falseAlarm,
    caption: "A situation room waiting on a warning that may be empty.",
    ...WIDE,
  },
  "threshold-2032": {
    src: threshold2032,
    caption: "A gate on a map. The 2032 deployment line.",
    ...WIDE,
  },
};

export const ENDING_PLATES: Record<string, Plate> = {
  "responsible-ai-power": {
    src: endingResponsibleAiPower,
    caption: "A civic plan in balance.",
    ...MARK,
  },
  fortress: {
    src: endingFortress,
    caption: "A thick-walled station, well informed and closed.",
    ...MARK,
  },
  "deregulated-frontier": {
    src: endingDeregulatedFrontier,
    caption: "An open gate and unfenced ground.",
    ...MARK,
  },
  "dependent-state": {
    src: endingDependentState,
    caption: "A small hall beside a much larger terminal.",
    ...MARK,
  },
  "unknown-frontier": {
    src: endingUnknownFrontier,
    caption: "A surveyed horizon with nothing resolved.",
    ...MARK,
  },
};
```

3e. The three `Figure` call sites now spread the plate, whose fields match `Figure`'s props exactly:

- `src/ui/screens/Title.tsx` line 26:
  old `      <Figure src={COVER.src} figure={COVER.figure} caption={COVER.caption} state="720pt" className="mb-6" />`
  new `      <Figure {...COVER} className="mb-6" />`
  (Task 9.3 rewrites this file; this edit only keeps it compiling in between.)
- `src/ui/screens/Briefing.tsx` line 30:
  old `      {plate && <Figure src={plate.src} figure={plate.figure} caption={plate.caption} state="720pt" />}`
  new `      {plate && <Figure {...plate} />}`
- `src/ui/screens/Debrief.tsx` line 63:
  old `        {mark && <Figure src={mark.src} figure={mark.figure} caption={mark.caption} state="48mm" className="mb-6 max-w-[12rem]" />}`
  new `        {mark && <Figure {...mark} className="mb-6 max-w-[12rem]" />}`

3f. `src/ui/App.tsx`, three edits. `currentStep` is still used by `activeIndex`, so nothing else changes.

Title branch (HEAD line 44), old:
```tsx
      <AppShell chrome={{}} steps={["Cover"]} stepIndex={0} stepsLabel="Document" figureId="Cover · 720pt">
```
new:
```tsx
      <AppShell>
```

Debrief branch (HEAD lines 67–68), old:
```tsx
        stepsLabel="Record contents"
        figureId="Debrief · Record · 720pt"
```
new:
```tsx
        stepsLabel="Record contents"
```

Turn branch (HEAD lines 117–118; 122–123 after Phase 8's rail fix), old:
```tsx
      stepsLabel="Steps in this turn"
      figureId={`Turn ${turn} · ${currentStep} · 720pt`}
```
new:
```tsx
      stepsLabel="Steps in this turn"
```

3g. Check nothing is left: `grep -rn "figureId\|720pt\|48mm\|figure=\|\.figure}\|state=\"" src/ui` must print nothing (exit status 1). The pattern avoids `img.figure-raster` in `theme.css`, which stays.

**Step 4: Run it and watch it pass.**

```
npm run lint && npx tsc --noEmit && npm run e2e
```

Expected: lint prints no problems; `tsc` prints nothing; Playwright prints `21 passed`: the 19 Phase 8 left (the 17 baseline tests plus the 2 in `e2e/regressions.spec.ts`) and these 2.

**Step 5: Commit.** In `docs/plan.md`, change the marker on the `**Phase 9: The opening**` line from ⬜ to 🟨 (in progress), leaving its `[ ]`. Then:

```
git add e2e/engagement.spec.ts src/ui/shell/Artboard.tsx src/ui/shell/AppShell.tsx src/ui/components/Figure.tsx src/ui/art/plates.ts src/ui/App.tsx src/ui/screens/Title.tsx src/ui/screens/Briefing.tsx src/ui/screens/Debrief.tsx docs/plan.md
git commit -m "feat(ui): remove print-production labels and the title rail

The figureId strip, Figure's width/state label and the Fig. NN caption
prefix are gone; captions and corner ticks stay, and the cover's caption
now describes the drawing instead of calling it a cover sheet. Plates
carry their pixel size so the page reserves their space. AppShell's rail
is optional.
New e2e/engagement.spec.ts checks every screen for pt/mm/Fig. labels."
```

---

### Task 9.2: Every label at least 12px

**Files:**
- Modify: `e2e/engagement.spec.ts` (insert a section)
- Modify: `src/ui/screens/Title.tsx:27`, `src/ui/screens/Forecast.tsx:24,50`, `src/ui/screens/Briefing.tsx:41`, `src/ui/screens/Debrief.tsx:64`, `src/ui/components/IntelFile.tsx:23`, `src/ui/components/CrisisClock.tsx:25,27`, `src/ui/components/AdviserCard.tsx:17,23`, `src/ui/components/EvidenceTag.tsx:20,28`, `src/ui/debrief/CalibrationPanel.tsx:38,42`
- Test: `e2e/engagement.spec.ts`

**Step 1: Write the failing test.** In `e2e/engagement.spec.ts`, replace the import line
`import { LABEL, playToDebrief, startGame } from "./play";`
with
`import { LABEL, finishTurn, playToDebrief, playTurn, playUntil, startGame, toDecision } from "./play";`
(all five helpers exist in `e2e/play.ts` at HEAD). Then insert this block immediately above the line `test("the title screen has no steps rail", async ({ page }) => {`:

```ts
// ---------------------------------------------------------------- readable labels

/** Every piece of rendered text, chart ticks included, whose computed size is under 12px (Tailwind's text-xs). */
async function expectNoTextUnder12px(page: Page, where: string) {
  const tiny = await page.evaluate(() => {
    const found: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const element = node.parentElement;
      const text = node.textContent?.trim();
      if (!text || !element || !element.checkVisibility()) continue;       // hidden, or inside a closed disclosure
      const box = element.getBoundingClientRect();
      if (box.bottom + window.scrollY <= 0) continue;                      // the chart library's measuring span, parked off the page
      const size = parseFloat(getComputedStyle(element).fontSize);
      if (size < 12) found.push(`${size}px "${text.slice(0, 40)}"`);
    }
    return found;
  });
  expect(tiny, `${where}: text under 12px`).toEqual([]);
}

test("no text in the game is smaller than 12px", async ({ page }) => {
  await page.goto("/?facilitator=1&seed=LABELS-1");                         // the facilitator panel sits on the title
  await page.getByText("Base odds of events").click();
  await expectNoTextUnder12px(page, "title and facilitator panel");

  await page.getByRole("button", { name: LABEL.start }).click();
  await page.getByText("Real-world evidence behind this fictional scenario").click();
  await expectNoTextUnder12px(page, "briefing with evidence open");

  await page.getByRole("button", { name: LABEL.continueToForecast }).click();
  await expect(page.getByRole("slider")).toBeVisible();
  await expectNoTextUnder12px(page, "forecast");

  await page.getByRole("button", { name: LABEL.lockIn }).click();
  await page.getByRole("button", { name: /^Commission analysis/ }).click();
  await expectNoTextUnder12px(page, "decision with analysis");

  await page.locator('input[name="choice"]:enabled').first().check();
  await page.getByRole("button", { name: LABEL.confirm }).click();
  await expect(page.getByRole("group", { name: LABEL.investGroup })).toBeVisible();
  await expectNoTextUnder12px(page, "investment");

  await page.locator('input[name="track"]:enabled').first().check();
  await page.getByRole("button", { name: LABEL.investIn }).click();
  await expect(page.getByRole("heading", { name: LABEL.newsHeading })).toBeVisible();
  await expectNoTextUnder12px(page, "consequences");

  await startGame(page, "LABELS-1");
  await playTurn(page);                                                     // turn 2's briefing lists what turn 1 told you
  await expectNoTextUnder12px(page, "second briefing");
  await playUntil(page, "The Deepfake Election");                          // a crisis turn shows the clock
  await expectNoTextUnder12px(page, "crisis briefing");
  await toDecision(page);
  await expectNoTextUnder12px(page, "crisis decision");
  await finishTurn(page);
  await playToDebrief(page);
  await expectNoTextUnder12px(page, "debrief");
});
```

Why the off-page check: Recharts appends a `<span>` to `<body>` at 11px to measure text, parked at `top: -20000px`. It is never seen, and without the check the test fails on it (found on the dry run as `11px "0"`).

Why the extra stops: three of the labels in the Step 3 table never appear on turn 1. The intel file (row 6) is listed only on a later non-crisis briefing, because on turn 1 it is empty (`src/ui/screens/Briefing.tsx:22` filters out the current assessment, and `:109` hides the file in a crisis). The crisis clock (rows 7 and 8) is drawn only on crisis turns (the `{scenario.isCrisis && (` block in `src/ui/App.tsx`), and The Deepfake Election is a crisis turn in every run (`"isCrisis": true` in `src/content/scenarios/deepfake-election.json`). The facilitator panel shows only behind `?facilitator=1`. On the dry run, putting `text-[10px]` back on `IntelFile.tsx:23` failed the test with `second briefing: text under 12px`, and putting it back on `CrisisClock.tsx:25` failed it with `crisis briefing: text under 12px` and `10px "Crisis"`. Opening the facilitator link does not change the game: the start button drops `facilitator` from the URL, and there is no `cfg`, so `LABELS-1` plays the same world as in the other test.

**Step 2: Run it and watch it fail.**

```
npx tsc --noEmit && npx playwright test e2e/engagement.spec.ts -g "12px"
```

Expected: `1 failed`, with `title and facilitator panel: text under 12px` and a received array holding exactly one entry, `10px "A decision game"` (the facilitator panel itself has no text under 12px). (With only the class edits below and not the chart edit, it fails later at the debrief with the calibration chart's ticks: `11px "0%"`, `11px "20%"` and so on.)

**Step 3: Implement.** These are the only sub-12px sizes left in `src/ui` after Task 9.1 (the artboard strip and the figure caption went with 9.1). Every class change is `text-[10px]` or `text-[11px]` to `text-xs`:

| # | File:line | Text it sets | Old class fragment | New |
|---|---|---|---|---|
| 1 | `src/ui/screens/Title.tsx:27` | "A decision game" | `font-mono text-[10px] uppercase tracking-[0.18em]` | `font-mono text-xs uppercase tracking-[0.18em]` |
| 2 | `src/ui/screens/Forecast.tsx:24` | "Forecast" eyebrow in the h2 | `font-mono text-[10px] font-medium uppercase` | `font-mono text-xs font-medium uppercase` |
| 3 | `src/ui/screens/Forecast.tsx:50` | "0% will not happen / 50% / 100% certain" | `font-mono text-[10px] uppercase tracking-wider` | `font-mono text-xs uppercase tracking-wider` |
| 4 | `src/ui/screens/Briefing.tsx:41` | "Assessment" / "Unconfirmed report" h2 | `font-mono text-[10px] uppercase tracking-wider` | `font-mono text-xs uppercase tracking-wider` |
| 5 | `src/ui/screens/Debrief.tsx:64` | "October 2032 · Your record" | `font-mono text-[10px] uppercase tracking-[0.18em]` | `font-mono text-xs uppercase tracking-[0.18em]` |
| 6 | `src/ui/components/IntelFile.tsx:23` | "Turn N · Briefing assessment" | `block font-mono text-[10px] uppercase` | `block font-mono text-xs uppercase` |
| 7 | `src/ui/components/CrisisClock.tsx:25` | "Crisis" | `font-mono text-[10px] font-medium uppercase tracking-widest` | `font-mono text-xs font-medium uppercase tracking-widest` |
| 8 | `src/ui/components/CrisisClock.tsx:27` | "simulated" | `font-mono text-[10px] uppercase tracking-wider` | `font-mono text-xs uppercase tracking-wider` |
| 9 | `src/ui/components/AdviserCard.tsx:17` | "Adviser file" | `font-mono text-[10px] uppercase tracking-wider` | `font-mono text-xs uppercase tracking-wider` |
| 10 | `src/ui/components/AdviserCard.tsx:23` | "Recommends option X" | `mt-1 font-mono text-[11px] text-muted` | `mt-1 font-mono text-xs text-muted` |
| 11 | `src/ui/components/EvidenceTag.tsx:20` | "Evidence" | `font-mono text-[10px] uppercase tracking-wider` | `font-mono text-xs uppercase tracking-wider` |
| 12 | `src/ui/components/EvidenceTag.tsx:28` | "Severity if it goes wrong" | `font-mono text-[10px] uppercase tracking-wider` | `font-mono text-xs uppercase tracking-wider` |
| 13 | `src/ui/debrief/CalibrationPanel.tsx:38` and `:42` | chart axis ticks, X and Y | `fontSize: 11,` | `fontSize: 12,` |

Rows 1–12 in one command (it touches only those twelve lines), then row 13:

```
perl -pi -e 's/text-\[1[01]px\]/text-xs/g' src/ui/screens/Title.tsx src/ui/screens/Forecast.tsx src/ui/screens/Briefing.tsx src/ui/screens/Debrief.tsx src/ui/components/IntelFile.tsx src/ui/components/CrisisClock.tsx src/ui/components/AdviserCard.tsx src/ui/components/EvidenceTag.tsx
perl -pi -e 's/fontSize: 11,/fontSize: 12,/g' src/ui/debrief/CalibrationPanel.tsx
```

Check: `grep -rn "text-\[[0-9]*px\]\|fontSize: 1[01]\b" src/ui` must print nothing, and `git diff --stat` must show 9 source files, 14 lines changed in each direction, plus the spec.

The forecast scale (row 3) was checked by hand at 360 × 740 on the dry run: the row "0% WILL NOT HAPPEN / 50% / 100% CERTAIN" fills its 302px exactly (`clientWidth` 302, `scrollWidth` 302) and the page does not scroll sideways. It fits with no room to spare, and the polish overflow test (`e2e/polish.spec.ts`, "reduced motion is honoured, and no screen scrolls sideways on a phone") measures the title, briefing, decision and debrief but not the forecast step. Phase 10, which replaces `Forecast.tsx`, checks the forecast step at 360px in its own gate.

**Step 4: Run it and watch it pass.**

```
npm run lint && npx tsc --noEmit && npm run e2e
```

Expected: Playwright prints `22 passed` (the 19 from Phase 8 plus 3 in `e2e/engagement.spec.ts`).

**Step 5: Commit.**

```
git add e2e/engagement.spec.ts src/ui/screens/Title.tsx src/ui/screens/Forecast.tsx src/ui/screens/Briefing.tsx src/ui/screens/Debrief.tsx src/ui/components/IntelFile.tsx src/ui/components/CrisisClock.tsx src/ui/components/AdviserCard.tsx src/ui/components/EvidenceTag.tsx src/ui/debrief/CalibrationPanel.tsx
git commit -m "feat(ui): set every label at 12px or more

The 10px and 11px mono labels become text-xs and the calibration chart's
ticks go from 11px to 12px. An e2e walk fails on any rendered text under
12px: the title with the facilitator panel, a whole turn, a later briefing
with its intel file, a crisis turn with its clock, and the debrief."
```

---

### Task 9.3: A dilemma-first title and "Try your first decision"

**Files:**
- Modify: `e2e/engagement.spec.ts` (insert a section)
- Modify: `src/ui/screens/Title.tsx` (whole file)
- Modify: `src/ui/App.tsx` (the `<Title` element in the title branch: one line added; the step-focus effect: a ref added and one line replaced by two)
- Modify: `e2e/play.ts` (`LABEL.start`), `e2e/polish.spec.ts` (every "Begin")
- Modify: `README.md` (one bullet under "Seed codes")
- Test: `e2e/engagement.spec.ts`, `e2e/polish.spec.ts`

**Step 1: Write the failing test.** In `e2e/engagement.spec.ts`, insert this block immediately above the line `// ---------------------------------------------------------------- print-production labels`:

```ts
// ---------------------------------------------------------------- the opening (dilemma first)

/** A phone, the reviewer's window and a laptop: the first decision must be on the first screen of each. */
const FIRST_SCREENS = [
  { width: 375, height: 667 },
  { width: 726, height: 900 },
  { width: 1280, height: 800 },
];

/** A facilitator's link with one edited probability (the same edit polish.spec.ts makes), so the title shows its notice. */
const FACILITATOR_LINK = "/?seed=WORKSHOP&cfg=eyJldmVudHMiOnsiaW5mcmEtYXR0YWNrIjp7IndoZW5UcnVlIjo5MH19fQ";

for (const viewport of FIRST_SCREENS) {
  test(`the first decision is on the first screen at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const url of ["/", "/?seed=FRIEND-01", FACILITATOR_LINK]) {        // plain, a friend's link, a facilitator's link
      await page.goto(url);
      await page.evaluate(async () => { await document.fonts.ready; });     // measure the real type, not the fallback
      const box = await page.getByRole("button", { name: LABEL.start }).boundingBox();
      expect(box, url).not.toBeNull();
      expect(box!.y, `${url}: top of the button`).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height, `${url}: bottom of the button`).toBeLessThanOrEqual(viewport.height);
      expect(box!.x + box!.width, `${url}: right edge of the button`).toBeLessThanOrEqual(viewport.width);
    }
  });
}

test("the opening leads with the dilemma and counts the decisions from the content", async ({ page }) => {
  await startGame(page, "COUNT-1");                                         // the game's own count, from the header
  const total = /^Turn 1 of (\d+)/.exec(await page.getByText(/^Turn 1 of \d+/).innerText())?.[1];
  expect(total).toBeTruthy();

  await page.goto("/");
  await expect(page.getByText(/^AI could make us healthier, wealthier and safer\./)).toBeVisible();
  await expect(page.getByText(new RegExp(`^About 25 minutes for ${total} decisions\\.`))).toBeVisible();
  // One line per decision: the static list must change when the content does.
  await expect(page.getByRole("region", { name: "What you will face" }).getByRole("listitem")).toHaveCount(Number(total));
  await expect(page.getByText("The Frontier Technology Risk Unit and its advisers are fictional.")).toBeVisible();
});

test("the seed code waits in a disclosure, and the first decision plays the code it holds", async ({ page }) => {
  await page.goto("/");
  const seedField = page.getByLabel(/^Seed code/);
  await expect(seedField).toBeHidden();
  await page.getByText("Play the same world as a friend").click();
  await seedField.fill("FRIEND-02");
  await expect(seedField).toBeVisible();                                   // typing does not close the disclosure
  await page.getByRole("button", { name: LABEL.start }).click();
  await expect(page.getByRole("button", { name: LABEL.continueToForecast })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("seed")).toBe("FRIEND-02");

  await page.goto("/?seed=FRIEND-01");                                     // a friend's link opens it, filled in
  await expect(seedField).toBeVisible();
  await expect(seedField).toHaveValue("FRIEND-01");
  await page.getByRole("button", { name: LABEL.start }).click();
  await expect(page.getByRole("button", { name: LABEL.continueToForecast })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("seed")).toBe("FRIEND-01");
});

test("Play again brings focus back to the title heading", async ({ page }) => {
  const title = page.getByRole("heading", { level: 1, name: "AI 2032" });
  await page.goto("/");
  await page.evaluate(async () => { await document.fonts.ready; });        // React has rendered and run its effects
  await expect(title).toBeVisible();
  // A first visit leaves focus alone: focusing the h1 by script on load draws the focus ring round the name.
  expect(await page.evaluate(() => document.activeElement === document.body), "first visit: focus stays on the page").toBe(true);

  await startGame(page, "FOCUS-1");
  await playToDebrief(page);
  await page.getByRole("button", { name: /^Play (again|a new world)$/ }).click();   // Phase 13 renames it "Play a new world"
  await expect(title).toBeFocused();
});
```

Leave `LABEL.start` as `"Begin"` for now, so the viewport tests measure today's button and fail on the layout rather than on a missing button.

What each new test guards, and why it is written this way:
- The viewport test loads a facilitator's link as well. Its edited-assumptions notice is the only optional block near the top of the title, and it must not push the button down. The `cfg` value is base64 for `{"events":{"infra-attack":{"whenTrue":90}}}`.
- The dilemma test reads the decision count from the game's own header ("Turn 1 of 8"), so the title's count must come from `pub.totalTurns`, not from a number typed into the copy. The same number sets how many lines "What you will face" must have: the list is static copy, and the test fails if the content gains or loses a decision and the list does not follow. The disclaimer is matched by its own first sentence: a looser `/fictional/` would also match the role sentence ("a small, fictional UK government team") and would still pass with the disclaimer deleted.
- The focus test: App's step-focus effect (`heading.current?.focus()` in `src/ui/App.tsx`) runs on every step change, including the return to the title, but at HEAD the title's h1 has no ref, so focus falls to `<body>` and a screen-reader user hears nothing after Play again. The regular expression also accepts Phase 13's new name for the button, so that phase does not need to edit this test.
- The first half of the focus test guards the opposite mistake. Simply giving the title h1 the step-heading ref also makes the effect focus it on the very first load. A script focus before any user input matches `:focus-visible` in Chromium, and the unlayered `:focus-visible { outline: 3px solid var(--accent); }` in `src/ui/theme.css` beats Tailwind's layered `outline-none`, so every first-time visitor, touch phones included, would see a heavy navy box (light blue in dark mode) round "AI 2032", just above the dilemma. It also makes a screen reader start after the h1, skipping the "A decision game" eyebrow. The check is a plain `expect`, not a retrying `not.toBeFocused()`: it runs once, after `document.fonts.ready`, when the effect has already run. On the dry run it failed 6 times out of 6 with the h1 focused on load (`first visit: focus stays on the page`, `Expected: true`, `Received: false`), and passed with the Step 3 fix.

**Step 2: Run it and watch it fail.**

```
npx tsc --noEmit && npx playwright test e2e/engagement.spec.ts -g "first screen|dilemma|disclosure|Play again"
```

Expected: `6 failed` (dry-run output):
- 375x667: `Error: /: bottom of the button`, `Expected: <= 667`, `Received: 1180.34375`.
- 726x900: `Expected: <= 900`, `Received: 1080.09375`.
- 1280x800: `Expected: <= 800`, `Received: 1076.921875`.
- The dilemma test: `expect(locator).toBeVisible() failed`, `element(s) not found` for `/^AI could make us healthier…/` (the header count it reads first is found).
- The disclosure test: `expect(locator).toBeHidden() failed`, `Received: visible` (the seed field is on the page today).
- The focus test: `expect(locator).toBeFocused() failed`, `Expected: focused`, `Received: inactive`, on its last line. Its first-visit check passes at this point, because the title h1 has no ref yet.

**Step 3: Implement.**

3a. Point the shared label at the new button text. In `e2e/play.ts`, inside `LABEL`, old `  start: "Begin",` new `  start: "Try your first decision",`. Every test that starts a game (through `startGame`) now presses the new button.

3b. Replace the whole of `src/ui/screens/Title.tsx`. Layout decisions, all measured on the dry run with the production bundle:
- Nothing sits above the dilemma. The cover plate moves below the button and the disclosure (hiding the plate alone was enough at 726 and 1280, but at 375 the plate, the seed block and the long second paragraph all had to move).
- The button's bottom edge lands at 510px on a 375 × 667 phone, 388px at 726 × 900 and 396px at 1280 × 800 (and 510px at 360 × 640, 535px at 320 × 568). Neither a friend's link nor a facilitator's link moves it: the disclosure opens below it, and the edited-assumptions notice sits under the count line, below the button. (An earlier draft kept the notice above the form, as HEAD does; there it pushed the button down to 640px at 375 × 667 and 685px at 320 × 568, off a small phone's first screen.)
- One form holds the button and the seed field, so the button uses whatever the field holds (a friend's code, typed or from `?seed=`) and otherwise `newSeedCode()`. Pressing Enter in the field submits the form through that button.
- `<details open={Boolean(initialSeed)}>`: `initialSeed` never changes after mount, so React never rewrites `open` and a player's own toggling sticks (the disclosure test types into the field to prove it). The polish round-trip test (reload with `?seed=`, then `getByLabel(/^Seed code/)` has the value) needs it open.
- The h1 takes App's step-heading ref through a `headingRef` prop, with `tabIndex={-1}` and `outline-none`, like the scenario h1 on turn screens. React 18 does not pass `ref` through to a function component, hence the named prop. `headingRef` sits before `onStart` in `Props`, so the interface still ends with `onStart`, which Phase 14 anchors on.
- App's step-focus effect then focuses the title h1 whenever the game comes back to the title (Play again, and Phase 12's "Back to the start"), so focus never drops to `<body>`. It does not focus it on a first visit: see the App.tsx edit below and the first half of the focus test.
- The button is still the first focusable element on the page. On a first visit nothing is focused, and the first Tab reaches the button: the header has no controls, the title has no skip link, and the h1 is `tabIndex={-1}`. After Play again, the first Tab from the focused h1 reaches it too. Both were checked on the dry run with a plain link, a friend's link, `?facilitator=1` and a facilitator's `cfg` link. The keyboard test is unchanged. Do not put a link or control between the h1 and the button.
- The decision count comes from `pub.totalTurns` (8 today), in "About 25 minutes for 8 decisions." (the sentence does not open with a numeral). Title already imports from `../useGame`; `pub` is the public content, not `published` or `defaults`.
- "How it works" says only what holds on every turn. The final decision has no investment step (`visibleSteps` in `src/ui/App.tsx` drops it when `isFinal`), hence "until the last decision". Odds are hidden until the debrief, hence "chance plays a part" rather than "drawn from stated chances". The briefing is not called short (the engagement handoff's observation 2 says it asks for substantial reading). The last sentence promises only what the debrief shows: the hidden world, every probability, and "where chance helped or hurt" (the fortunate and unlucky tags). It does not promise a split between judgement and luck. The debrief gives no such split and never judges the player: its tags describe "the option's standing, never the player's judgement" (`src/ui/debrief/copy.ts:13`).
- The "What you will face" list follows `src/content/game.json` `sequence` (attribution-gap, open-weight-release, biology-result, graduate-collapse, deepfake-election, sandbagging-finding, threshold-2032) plus the one unscheduled crisis every run has (B6). "Unscheduled" matters, because The Deepfake Election is a crisis turn too. The list names no interrupt variant and no timing (contract non-negotiable 6) and keeps biology at policy level. Each line gives the other side of its scenario where the content has one, so the list does not read as a catalogue of harms: the breach line carries the adviser warning that market-access conditions "will cost us launches" (`src/content/scenarios/attribution-gap.json`); the sandbagging line carries the briefing's "strategic behaviour or a training artefact"; the 2032 line carries "conducts scientific research" beside "no reliable way to show deployment is safe" (`threshold-2032.json`); the graduate line keeps the briefing's "Unemployment is stable and productivity is rising" beside the fall in recruitment, without the simulated figure (`graduate-collapse.json`). The crisis line says the clock "moves only when you do", as the clock's own label does (`src/ui/components/CrisisClock.tsx:22`). Every possible interrupt (`incident-cyber`, `incident-bio`, `false-alarm`) is a crisis turn, so that holds in every run, and it reassures a slower reader that there is no real-time timer. Every adviser set has at least three different recommendations, hence "four advisers who do not all agree".
- The seed help text also fits a player whose own code is in the box, after a reload mid-game or from their own link: it says "A link with a code fills this in for you" and "Clear the box for a new world", not "Enter the code a friend sent you".

```tsx
import { useState, type FormEvent, type Ref } from "react";
import { COVER } from "../art/plates";
import { Button } from "../components/Button";
import { Figure } from "../components/Figure";
import { newSeedCode } from "../format";
import { overrideCount, pub } from "../useGame";
import { Facilitator } from "./Facilitator";

interface Props {
  /** A seed code carried in the URL, so friends can play the same world. */
  initialSeed: string | null;
  /** App's step heading, so focus comes back to this h1 after Play again. */
  headingRef?: Ref<HTMLHeadingElement>;
  onStart: (seedCode: string) => void;
}

/**
 * The opening leads with the dilemma and puts the first decision on the first
 * screen, even on a small phone. The cover, how a turn works and what the game
 * covers sit below it for anyone who wants them first.
 */
export function Title({ initialSeed, onStart, headingRef }: Props) {
  const [seed, setSeed] = useState(initialSeed ?? "");
  const facilitator = new URLSearchParams(window.location.search).get("facilitator") === "1";

  function submit(event: FormEvent) {
    event.preventDefault();
    onStart(seed.trim() || newSeedCode());
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">A decision game</p>
      <h1 ref={headingRef} tabIndex={-1} className="mt-2 text-4xl outline-none">
        AI 2032
      </h1>
      <p className="mt-5 text-xl">
        AI could make us healthier, wealthier and safer. It could also make serious harm easier. What would you do?
      </p>
      <p className="mt-4">
        You play the Director of the Frontier Technology Risk Unit, a small, fictional UK government team advising the Prime Minister
        on AI from 2026 to 2032. Explore what you think about AI, and discover what might change your mind.
      </p>

      {/* One form: the button uses the seed code in the disclosure below it, if there is one. */}
      <form onSubmit={submit} className="mt-6">
        <Button type="submit">Try your first decision</Button>
        <p className="mt-3 text-sm text-muted">
          About 25 minutes for {pub.totalTurns} decisions. There is no correct AI policy to find.
        </p>
        {overrideCount > 0 && (
          <p className="mt-4 border border-ink p-3 text-sm" role="note">
            <span className="font-semibold">This session uses edited assumptions.</span> A facilitator has changed {overrideCount} of the
            game&rsquo;s probabilities. The debrief shows every number in use.
          </p>
        )}

        <details className="mt-6 border-y border-rule py-2" open={Boolean(initialSeed)}>
          <summary className="cursor-pointer py-1 font-semibold">Play the same world as a friend</summary>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center">
            <label htmlFor="seed" className="font-mono text-xs font-medium uppercase tracking-wider">
              Seed code
            </label>
            <input
              id="seed"
              aria-describedby="seed-help"
              value={seed}
              onChange={(event) => setSeed(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder="For example K7Q2-M9XD"
              className="block w-full max-w-xs border border-rule bg-paper px-3 py-2 font-mono uppercase tracking-wider"
            />
          </div>
          <p id="seed-help" className="mt-2 pb-1 text-sm text-muted">
            A code fixes the hidden world and the dice. With the same code as a friend, you both face the same world, so you can
            compare what you decided afterwards. A link with a code fills this in for you. Your own code appears at the top of the
            screen once you start. Clear the box for a new world.
          </p>
        </details>
      </form>

      <Figure {...COVER} className="mt-10" />

      <section aria-labelledby="how-it-works" className="mt-10">
        <h2 id="how-it-works" className="text-xl">How it works</h2>
        <p className="mt-2">
          Each decision starts with a briefing and four advisers who do not all agree. You say how likely you think something is and
          choose what to do; until the last decision, you also pick one area to prepare for what comes later. Your unit coordinates;
          it does not command departments, regulators or foreign laboratories.
        </p>
        <p className="mt-3">
          The world you are governing has hidden facts that your evidence only partly reveals, and chance plays a part in what
          happens, so a sound decision can still end badly. At the end you see the hidden world, every probability the game used, and
          where chance helped or hurt.
        </p>
      </section>

      <section aria-labelledby="what-you-face" className="mt-8">
        <h2 id="what-you-face" className="text-xl">What you will face</h2>
        {/* One line per scripted scenario in src/content/game.json "sequence", in order, plus the unscheduled crisis. */}
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>A breach at a UK firm that an AI may have largely carried out. Experts disagree, and tougher rules could cost Britain new products.</li>
          <li>A powerful AI model released for anyone to download: useful to researchers and start-ups, and impossible to recall.</li>
          <li>A finding that AI helps scientists with difficult laboratory work, which may also lower the barrier to misuse.</li>
          <li>Graduate hiring falling as AI takes on junior work, while productivity rises and unemployment holds steady.</li>
          <li>Audio of a senior politician, three days before a general election, that may or may not be a deepfake.</li>
          <li>An AI system that does worse when it seems to know it is being tested: a quirk of its training, or a sign it is hiding what it can do?</li>
          <li>A final call in 2032 on a system that can do scientific research by itself, when no test can yet show that it is safe.</li>
          <li>And one unscheduled crisis, on a clock that moves only when you do.</li>
        </ul>
      </section>

      {facilitator && <Facilitator seedCode={seed} />}

      <p className="mt-10 border-t border-rule pt-4 text-xs text-muted">
        The Frontier Technology Risk Unit and its advisers are fictional. This game is not endorsed by any government body.
        Every probability in it is a design assumption, not a forecast, and is published at the end of the game.
      </p>
    </div>
  );
}
```

Then two edits in `src/ui/App.tsx`.

First, hand the title the step heading's ref. In the title branch, old:

```tsx
        <Title
          initialSeed={seedFromUrl()}
```

new:

```tsx
        <Title
          headingRef={heading}
          initialSeed={seedFromUrl()}
```

`heading` is the existing `useRef<HTMLHeadingElement>(null)` that the turn screens' h1 already uses. The `initialSeed={seedFromUrl()}` line stays as it is, because Phase 14 inserts its own props directly after it.

Second, keep the step-focus effect off the title on a first visit. Old (HEAD lines 35–40, unchanged by Phase 8):

```tsx
  // Move focus to the step heading whenever the step changes, for keyboard and screen-reader users.
  const stepKey = view ? `${view.turn}:${view.phase}:${stage}` : "title";
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
  }, [stepKey]);
```

new:

```tsx
  // Move focus to the step heading whenever the step changes, for keyboard and screen-reader users.
  // Not on a first visit to the title: focusing its h1 by script on load draws the focus ring round
  // "AI 2032" for every visitor. Once any game has started, coming back to the title focuses it.
  const stepKey = view ? `${view.turn}:${view.phase}:${stage}` : "title";
  const started = useRef(false);
  useEffect(() => {
    if (stepKey !== "title") started.current = true;
    if (started.current) heading.current?.focus();
    window.scrollTo(0, 0);
  }, [stepKey]);
```

Why this shape:
- `useRef` is already imported, and the new hook sits above the early `if (!view) return`, like the other hooks.
- The flag is set by the step key itself, not by whichever handler started the game. So every way into a game counts, including Phase 12's paths and optional Phase 14's "Continue", and those phases need no change for it.
- It does not count effect runs. `src/main.tsx` wraps the app in `StrictMode`, which runs each effect twice on mount in development; a "skip the first run" ref would then focus the h1 on the second run. Here both runs see `stepKey === "title"` with the flag still false. Checked on the dev server as well as the production bundle.
- Only `.current` is written, and only inside the effect, so the react-hooks rules pass. Nothing calls `setState` in the effect.
- The closing line `  }, [stepKey]);` is unchanged, because Phases 12 and 14 anchor on it.

3c. Replace every remaining "Begin" in the e2e suite, in this same task, so no test looks for a button that no longer exists. Run:

```
grep -n "Begin" e2e/*.ts
```

At HEAD this printed nine lines. The Phase 8 draft routes all of them through `LABEL.start` (its Task 8.2), so normally nothing prints and there is nothing to do. If any `e2e/polish.spec.ts` lines do print, replace them using these rules:

| HEAD line | Old | New |
|---|---|---|
| `polish.spec.ts:8` (import) | `import { playToDebrief, playTurn, playUntil, startGame, toDecision } from "./play";` | `import { LABEL, playToDebrief, playTurn, playUntil, startGame, toDecision } from "./play";` (skip if `LABEL` is already imported) |
| `:33`, `:40`, `:68`, `:91`, `:182`, `:187` (seed round-trip, facilitator link, axe walk, phone test) | `page.getByRole("button", { name: "Begin" })` | `page.getByRole("button", { name: LABEL.start })` |
| `:140` (keyboard test) | ``await focusOn(/^Begin$/);`` | ``await focusOn(new RegExp(`^${LABEL.start}$`));`` |
| `:179` (reduced motion reads the button's `transitionDuration`) | `page.getByRole("button", { name: "Begin" }).evaluate(` | `page.getByRole("button", { name: LABEL.start }).evaluate(` |

Seven `getByRole` replacements in all (lines 33, 40, 68, 91, 179, 182, 187) plus the keyboard line. `LABEL.start` contains no regular-expression metacharacters, so the `RegExp` is exact. Afterwards `grep -rn "Begin" e2e src` must print nothing.

3d. `README.md`, section "Seed codes", old:

```
- Codes are case-insensitive. Leave the box blank and the game makes a new eight-character code (Crockford base32, so no I, L, O or U to misread).
```

new:

```
- Codes are case-insensitive. The box is under **Play the same world as a friend** on the title screen, and opens by itself when the URL carries a code. Leave it blank and the game makes a new eight-character code (Crockford base32, so no I, L, O or U to misread).
```

(The workshop wording elsewhere in README is Phase 15's job: Task 15.7, "README for a general audience", which keeps this bullet.)

**Step 4: Run it and watch it pass.**

```
npm run lint && npx tsc --noEmit && npm run e2e
```

Expected: Playwright prints `28 passed` (the 19 from Phase 8 plus 9 in `e2e/engagement.spec.ts`). `e2e/polish.spec.ts` still has `8 passed`, including "the seed code round-trips through the URL" (the disclosure is open on reload), "a whole turn can be played with the keyboard alone" (nothing is focused on load, and the first Tab reaches "Try your first decision") and "reduced motion is honoured…" (the button's `transitionDuration` is under 0.001s through the global rule in `theme.css`). Then look at the page once: `npm run preview -- --port 4173` and open `http://localhost:4173/` at a phone width; stop the server afterwards (`lsof -ti tcp:4173` must print nothing before the next e2e run).

**Step 5: Commit.**

```
git add e2e/engagement.spec.ts e2e/play.ts e2e/polish.spec.ts src/ui/screens/Title.tsx src/ui/App.tsx README.md
git commit -m "feat(ui): open with the dilemma and 'Try your first decision'

The title leads with AI's benefits and harms, the role in one sentence and
one call to action, which now sits on the first screen at 375x667, 726x900
and 1280x800, a facilitator's notice included. The seed code moves into
'Play the same world as a friend', open when the URL carries one. The
decision count comes from pub.totalTurns. The title h1 takes App's step
heading ref, so focus returns to it after Play again; a first visit
leaves focus alone, so no focus ring is drawn round the name on load.
LABEL.start and every e2e reference follow the new text."
```

---

### Task 9.4: Link-preview text in index.html

**Files:**
- Modify: `e2e/engagement.spec.ts` (append a section)
- Modify: `index.html` (whole file)
- Test: `e2e/engagement.spec.ts`

**Step 1: Write the failing test.** Append to the end of `e2e/engagement.spec.ts`:

```ts

// ---------------------------------------------------------------- sharing a link

/** The same words describe the page to search engines and to link previews in chat apps. */
const DESCRIPTION =
  "A browser game about the benefits and dangers of AI. Govern as a fictional UK official from 2026 to 2032 and see what might change your mind. About 25 minutes.";

test("a shared link carries a plain description for link previews", async ({ page }) => {
  await page.goto("/");
  const meta = (attribute: string) => page.locator(`head > meta[${attribute}]`);
  await expect(meta('name="description"')).toHaveAttribute("content", DESCRIPTION);
  await expect(meta('property="og:title"')).toHaveAttribute("content", "AI 2032");
  await expect(meta('property="og:description"')).toHaveAttribute("content", DESCRIPTION);
  await expect(meta('property="og:type"')).toHaveAttribute("content", "website");
});
```

(`toHaveAttribute` fails after 5 seconds; `locator.getAttribute` on a missing element would wait for the full 30-second test timeout.)

**Step 2: Run it and watch it fail.**

```
npx playwright test e2e/engagement.spec.ts -g "shared link"
```

Expected: `1 failed`: `expect(locator).toHaveAttribute(expected) failed`, `Error: element(s) not found`.

**Step 3: Implement.** Replace the whole of `index.html`. No `og:image`: Open Graph needs an absolute image URL, the bundle is built with relative paths (`base: "./"` in `vite.config.ts`), the plates are hashed build assets with no stable public path, and no public host is approved (D10: no deploy without the designer). Add `og:image` with the first approved deployment, from a stable file under a new `public/` folder.

```html
<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <title>AI 2032</title>
    <meta name="description" content="A browser game about the benefits and dangers of AI. Govern as a fictional UK official from 2026 to 2032 and see what might change your mind. About 25 minutes." />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="AI 2032" />
    <meta property="og:description" content="A browser game about the benefits and dangers of AI. Govern as a fictional UK official from 2026 to 2032 and see what might change your mind. About 25 minutes." />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 4: Run it and watch it pass.**

```
npx playwright test e2e/engagement.spec.ts && grep -c 'og:' dist/index.html
```

Expected: `10 passed` (this command runs only `e2e/engagement.spec.ts`, and builds `dist` first); the grep prints `3` (Vite copies the tags into the built page unchanged).

**Step 5: Commit.**

```
git add e2e/engagement.spec.ts index.html
git commit -m "feat: add a description and Open Graph text for shared links

No og:image until there is an approved host to give it an absolute URL."
```

---

### Task 9.5: Record what was implemented

**Files:**
- Modify: `DECISIONS.md` (section F, which Phase 8 created)
- Modify: `docs/plan.md` (the Phase 9 block, which Phase 8 created)

**Step 1: Find the rows.** There is no code to test here, so check the anchors first. Phase 8's draft numbers the rows F1 (the visual system, whose Decision removes the print-production labels and sets mono labels at 12px or more) and F2 (the opening); the Phase 9 brief called the print-label row F3, so find both rows by their text, not their number:

```
sed -n '/^## F\./,$p' DECISIONS.md | grep -n "^## F\.\|^\*\*Status:\|print-production\|Try your first decision"
grep -n -A 5 "Phase 9: The opening" docs/plan.md
grep -c " | The labels help no player" DECISIONS.md
grep -c " | Observation 1: the cover" DECISIONS.md
```

The `sed` keeps only section F, which Phase 8 put at the end of the file; sections C and D have `**Status:` lines of their own (`DECISIONS.md:74` and `:96` at HEAD), which a plain `grep` would also print. The line numbers it prints count from the section heading, not from the top of the file.

Expected, from the first command, exactly four lines: `1:## F. Public-audience redesign`, then exactly one `**Status:` line (`3:**Status: proposed on 2026-09-19; awaiting designer sign-off.** …` in Phase 8's draft), then one row containing "print-production" (note its number, written `F<labels>` below; F1 in Phase 8's draft) and one containing "Try your first decision" (`F<opening>`; F2 in Phase 8's draft). In `docs/plan.md`: the `- [ ] 🟨 **Phase 9: The opening**` line (Task 9.1 set 🟨) and its four sub-items, three work items and a gate item, each `- [ ] ⬜`. The last two commands each print `1`: those are the points where the two rows' Decision cells end in Phase 8's wording (see 3a).

**Step 2: Watch the record lag behind the code.** `grep -c "Implemented in Phase 9" DECISIONS.md` prints `0`.

**Step 3: Implement.**

3a. In `DECISIONS.md`, first mark the two rows implemented, as later phases do for theirs (they add "**Implemented in Phase N.**" to the row's Decision cell, the third cell). Each command below ends the row's Decision cell with a full stop and the marker, just before the ` | ` that opens its Why cell:

```
perl -pi -e 's/ \| The labels help no player/. **Implemented in Phase 9.** See "Implemented in Phase 9" under the Status line. | The labels help no player/' DECISIONS.md
perl -pi -e 's/ \| Observation 1: the cover/. **Implemented in Phase 9.** See "Implemented in Phase 9" under the Status line. | Observation 1: the cover/' DECISIONS.md
```

In Phase 8's wording the F1 row then reads `…animation beyond simple CSS transitions. **Implemented in Phase 9.** See "Implemented in Phase 9" under the Status line. | The labels help no player…`, and the F2 row `…at 375×667, 726×900 and 1280×800. **Implemented in Phase 9.** See … | Observation 1: the cover…`. If either `grep -c` in Step 1 printed `0` (Phase 8 worded the Why cell differently), add the same sentence by hand at the end of that row's Decision cell instead.

Then, directly below section F's `**Status:` paragraph (if Phase 8 gave section F its own "Implemented" list, add these lines to it instead), insert the paragraph below, with a blank line before and after. Replace `DATE` with the output of `date +%F`, and `F<labels>` and `F<opening>` with the numbers from Step 1:

```
**Implemented in Phase 9 (DATE):** F<labels> (the print-production labels and 12px labels; its engagement rules bind every later phase) and F<opening> (the dilemma-first opening). Choices made on the way, open to challenge:

- The `figureId` strip, `Figure`'s width/state label and the "Fig. NN" caption prefix are gone, and `Plate` no longer has a `figure` field. The artboard keeps its corner ticks and every plate keeps its caption, which is still its only description. The cover's caption no longer reads "Cover sheet. Frontier Technology Risk Unit, 2026–2032.", which was print wording and did not describe the drawing. It now reads "A government building, a map of Britain and Ireland, and a table stacked with files." The other captions are unchanged. The title screen has no steps rail: `AppShell`'s rail props are optional.
- `Plate` gains `width` and `height` (960 × 540 for the cover and scenario plates, 384 × 384 for the ending marks) and `Figure` passes them to the image, so the page reserves each plate's space before it loads.
- No text in the game is set below 12px: every 10px and 11px mono label became `text-xs`, and the calibration chart's axis ticks went from 11px to 12px. `e2e/engagement.spec.ts` holds this across the title with the facilitator panel open, a whole turn, a later briefing with its intel file, a crisis turn with its clock, and the debrief.
- The cover plate moved below the call to action and the "Play the same world as a friend" disclosure. With the production bundle, the button's bottom edge sits at 510px on a 375 × 667 phone, 388px at 726 × 900 and 396px at 1280 × 800. On a facilitator's link the edited-assumptions notice sits just below the button, under the count line, so it does not move the button; the e2e test loads such a link at all three sizes.
- Below the fold, the title says how a turn works and lists what the seven scripted scenarios are about in plain words, each with its other side where the content gives one, plus "one unscheduled crisis, on a clock that moves only when you do" (every possible interrupt is a crisis turn, and the clock never runs on wall time). It names no interrupt variant and no timing. The "How it works" section promises that the debrief shows the hidden world, every probability and "where chance helped or hurt", not a split between judgement and luck, because the debrief never judges the player. The list is static copy that follows `src/content/game.json` `sequence`; the e2e test fails if the number of decisions changes and the list does not, but a change of subject has to be caught by hand.
- The decision count on the title ("About 25 minutes for 8 decisions.") comes from `pub.totalTurns`, and the e2e test takes the expected number from the game's own header. "About 25 minutes" stays a design estimate for the playtest to confirm.
- Coming back to the title (Play again) now moves focus to its h1, as every other step change does, instead of dropping it to the page body. A first visit leaves focus alone: focusing the h1 by script on load draws the 3px focus ring round "AI 2032" for every visitor, touch phones included. App's step-focus effect therefore skips the title until a game has started. The first Tab still reaches the button.
- Shared links get `description`, `og:title`, `og:description` and `og:type`, but no `og:image`: Open Graph needs an absolute image URL, the bundle uses relative paths, and no public host is approved yet. Add one with the first approved deployment.
- Still open: several plates have figure numbers and drafting notes drawn into the artwork itself, for example "FIG. 00" on the cover, "FIG. 04." and "SCALE 1:100" on the Graduate Collapse plate, and "FIG. E2." on the Fortress mark. They are pixels, not text, so the e2e check cannot see them; removing them means re-exporting the art, which is the designer's call.
```

3b. In `docs/plan.md`, tick Phase 9's three work sub-items, keeping Phase 8's wording: change `- [ ] ⬜` to `- [x] 🟩` on each of them. Leave the gate sub-item at `- [ ] ⬜` and the Phase 9 heading at `- [ ] 🟨` until the gate. In Phase 8's draft the three work items read:

```
  - [x] 🟩 Dilemma-first title screen; the primary button reads "Try your first decision" and sits inside the first viewport at 375×667, 726×900 and 1280×800
  - [x] 🟩 Seed field inside "Play the same world as a friend", open when the link carries a seed; the fictional-unit disclaimer stays
  - [x] 🟩 Print-production labels removed (figure ids, 720PT, 48MM, "Fig. NN"); mono microlabels at least 12px
```

Then update the progress line. Phase 9 counts four steps, and three are now done. On the `**Overall Progress:**` line, replace `` `67%` of build steps (42 of 63) `` with `` `71%` of build steps (45 of 63) `` and keep the rest of the line as Phase 8 wrote it. If Phase 8 left a different count, add 3 to the number before "of 63" and recompute the percentage, rounded to the nearest whole number.

**Step 4: Check it.**

```
grep -c "Implemented in Phase 9" DECISIONS.md
grep -n -A 5 "Phase 9: The opening" docs/plan.md
grep -n "Overall Progress" docs/plan.md
```

Expected: `3` (the paragraph and the two rows); the Phase 9 block shows three `[x] 🟩` work items and the gate item still `[ ] ⬜`; the progress line shows `` `71%` of build steps (45 of 63) ``.

**Step 5: Commit.**

```
git add DECISIONS.md docs/plan.md
git commit -m "docs: record the Phase 9 opening and print-label changes"
```

---

### Phase 9 gate

Run everything locally (CI has never run on GitHub, D10). First: `git branch --show-current` is the redesign branch, not `main`; `git status --short` prints nothing; `lsof -ti tcp:4173` prints nothing.

```
npm run lint && npm run test && npm run balance && npm run build && du -sk dist && npm run e2e
```

What must be true:
- `npm run lint`: no problems reported.
- `npm run test`: `Test Files  10 passed (10)` and the same `Tests` total that Phase 8's gate recorded: `Tests  257 passed (257)`, or `Tests  260 passed (260)` if pull request #2 was merged. Phase 9 adds no Vitest test, because it changes no pure helper.
- `npm run balance`: ends with `Balance check passed.` (content is untouched, so the numbers match Phase 8's).
- `npm run build` succeeds and `du -sk dist` prints under 16384 (1,972 KB and 1,976 KB on the two dry runs).
- `npm run e2e`: `29 passed` (the 19 Phase 8 left, plus the ten in `e2e/engagement.spec.ts`). The ten are: the first decision on the first screen at 375x667, 726x900 and 1280x800 (plain, with a friend's `?seed=`, and with a facilitator's `cfg` link); the dilemma, the count taken from the content and the disclaimer; the friend disclosure; focus left alone on a first visit and back on the title h1 after Play again; no print-production labels on any screen of a turn or the debrief; no text under 12px on the title with the facilitator panel, a whole turn, a later briefing, a crisis turn or the debrief; no steps rail on the title; the link-preview text. The older gates (crisis, debrief, polish: axe light and dark, keyboard, reduced motion, seed round-trip, facilitator link; and Phase 8's two regression tests) still pass unchanged except for the button's name.
- `grep -rn "Begin" src e2e` and `grep -rn "figureId\|720pt\|48mm" src` both print nothing. (Leave `e2e` out of the second: the new spec names "720pt" and "48mm" in a comment.)

Then in `docs/plan.md`: change the gate sub-item to `- [x] 🟩`, change the `**Phase 9: The opening**` line to `- [x] 🟩`, and on the `**Overall Progress:**` line replace `` `71%` of build steps (45 of 63) `` with `` `73%` of build steps (46 of 63) `` (if Task 9.5 left a different count, add 1 to the number before "of 63" and recompute the rounded percentage). `grep -n -A 5 "Phase 9: The opening" docs/plan.md` must show no `[ ]` left in the block. Commit:

```
git add docs/plan.md
git commit -m "docs(plan): Phase 9 gate green"
```

Do not push: the branch is pushed at the Phase 15 gate or when the designer asks (CLAUDE.md, as Phase 8 amended it). Never push to `main`, never merge the PR, never deploy. There is no designer stop at this gate: the opening is reviewed together with one representative turn at the Phase 11 gate, so carry on to Phase 10.


---

## Phase 10: Briefing and forecast

**Goal:** Make the representative turn's first two steps approachable. Advisers are shown in plain terms, with who backs what. The forecast asks for a gut feel first and then offers the advisers' estimates on the slider's own scale. The briefing can be read again, folded away, while forecasting and deciding. **Handoff items addressed:** observation 2 (reading load before the first action) from turn 2 onwards, where earlier reports are folded (turn 1 grows by about 36 words, which the designer decides on at the Phase 11 review); observations 6 (revisit the briefing and advisers while deciding) and 8 (adviser estimates on a common scale, with anchoring handled); proposals "Make advisers approachable" and "Teach through play" (verbal anchors on the slider). **Depends on:** D4 and D5 (contract section 1); Phase 8 (`LABEL` in `e2e/play.ts`, section F rows for D4 and D5 in `DECISIONS.md`, the Phase 10 block in `docs/plan.md`, and the Decision-screen crash fix); Phase 9 (`e2e/engagement.spec.ts` exists, `startGame` clicks "Try your first decision", print labels and 10px microlabels are gone).

What this phase deliberately does not do:
- No engine or content change. Everything shown is already public: `publicContent()` and `displayed()`.
- The player's first guess is not stored (D4). There is no average, consensus, bias-corrected or "true value" mark.
- No adviser estimate appears until the player asks for it with "Compare with your advisers". The forecast step's recap never shows estimates; the decision step's recap does, because the forecast is locked by then.

Measured on the trial build (turn 1, seed `TEST-SEED1`), so the designer can weigh it at the Phase 11 review:
- The briefing grows from 290 to 326 visible words (the whole `<main>` text, once the plate image has loaded). "Continue to your forecast" moves from 2102/1847/1787px to 2310/1930/1869px (375/726/1280 wide).
- D5's two new lines per card ("Cares about" and "Backs option X: {full option text}") outweigh the cut lever parentheticals (about 30 words). An option backed by two advisers has its text printed three times: once in the split and once on each backer's card. Task 10.4 makes the lighter card ("Backs option A.") a one-line switch for the designer.
- The saving comes on later turns. "What you have been told so far" is now folded, and by the final turn it held about 150 to 350 words.
- "Lock in" moves up, from 743 to 636px at 375 wide, because the estimates list is hidden until asked for.

**Before Task 10.1.** Run these from the repository root:

```bash
git status --short                 # expect: no output (clean tree)
git tag -f phase-10-start          # local marker for the gate's "engine untouched" check
grep -n "continueToForecast" e2e/play.ts          # expect: the Phase 8 LABEL line
ls e2e/engagement.spec.ts                         # expect: the file exists (Phase 9)
```

If the `grep` prints nothing, or `ls` reports `No such file or directory`, Phase 8 or Phase 9 is not finished. Stop.

This phase replaces the following files in full. Each replacement already includes the only Phase 9 changes expected in them: no `state="720pt"`, and mono labels at `text-xs` rather than `text-[10px]`/`text-[11px]`.
- `src/ui/screens/Briefing.tsx`
- `src/ui/screens/Forecast.tsx`
- `src/ui/components/AdviserCard.tsx`
- `src/ui/components/IntelFile.tsx`
- `src/ui/shell/StepsRail.tsx`

Before each replacement, run `git diff a11ef34 -- <file>`. `a11ef34` is the commit this redesign plan started from, so the diff shows everything Phases 8 and 9 changed in that file. Carry over by hand anything beyond those two points. In `Briefing.tsx`, Phase 9 leaves the plate line as `{plate && <Figure {...plate} />}`; this phase keeps it. Phase 9's guard `grep -rn "figureId\|720pt\|48mm\|figure=\|\.figure}\|state=\"" src/ui` must still print nothing after this phase.

---

### Task 10.1: Forecast sentence builders in `src/ui/copy.ts`

**Files:**
- Create: `src/ui/copy.ts`
- Modify: `docs/plan.md` (Phase 10 marker to 🟨)
- Test: `tests/ui/play-copy.test.ts` (new)

**Step 1: Write the failing test.** Create `tests/ui/play-copy.test.ts`:

```ts
// Sentence builders for the play screens (briefing and forecast). The copy rules
// of spec Section 14 apply to them as they do to the debrief's builders.

import { describe, expect, test } from "vitest";
import { adviserRange, capitalise, estimateLine, initials, resolvesLine, verbalChance } from "../../src/ui/copy";
import { loadContent, publicContent } from "../../src/content";

const pub = publicContent(loadContent());
const scenario = (id: string) => {
  const found = pub.scenarios[id];
  if (!found) throw new Error(`No scenario ${id}`);
  return found;
};

describe("verbalChance: the words beside the slider", () => {
  test.each([
    [0, "certain not to happen"],
    [1, "almost certainly not"],
    [5, "almost certainly not"],
    [6, "unlikely"],
    [35, "unlikely"],
    [39, "unlikely"],
    [40, "a toss-up"],
    [50, "a toss-up"],
    [60, "a toss-up"],
    [61, "likely"],
    [94, "likely"],
    [95, "almost certain"],
    [99, "almost certain"],
    [100, "certain to happen"],
  ])("%i%% reads as %s", (percent, words) => {
    expect(verbalChance(percent)).toBe(words);
  });

  test("the bands mirror each other around 50%", () => {
    const mirror: Record<string, string> = {
      "certain not to happen": "certain to happen",
      "almost certainly not": "almost certain",
      unlikely: "likely",
      "a toss-up": "a toss-up",
      likely: "unlikely",
      "almost certain": "almost certainly not",
      "certain to happen": "certain not to happen",
    };
    for (let percent = 0; percent <= 100; percent++) expect(verbalChance(100 - percent), `${percent}`).toBe(mirror[verbalChance(percent)]);
  });

  test("a value off the 0 to 100 scale is refused", () => {
    expect(() => verbalChance(-1)).toThrow(RangeError);
    expect(() => verbalChance(101)).toThrow(RangeError);
    expect(() => verbalChance(Number.NaN)).toThrow(RangeError);
  });

  test("capitalise makes a label of it", () => {
    expect(capitalise(verbalChance(1))).toBe("Almost certainly not");
  });
});

describe("adviserRange: the sentence shown after comparing", () => {
  test("states the player's guess, then the lowest and highest adviser estimate", () => {
    expect(adviserRange(35, [0.52, 0.68, 0.47, 0.54])).toBe("You said 35%. Your advisers range from 47% to 68%.");
  });

  test("rounds estimates as the list beside it does", () => {
    expect(adviserRange(50, [0.29, 0.57])).toBe("You said 50%. Your advisers range from 29% to 57%.");
  });

  test("says so when every adviser gives the same number", () => {
    expect(adviserRange(10, [0.4, 0.4, 0.4, 0.4])).toBe("You said 10%. Your advisers all say 40%.");
  });

  test("a player who compares before moving the slider is not told they said 50%", () => {
    expect(adviserRange(null, [0.52, 0.68, 0.47, 0.54])).toBe("You compared before moving the slider. Your advisers range from 47% to 68%.");
  });

  test("needs at least one estimate", () => {
    expect(() => adviserRange(50, [])).toThrow();
  });
});

describe("resolvesLine: when the answer is known", () => {
  test("a scripted question names its month", () => {
    expect(resolvesLine("2029-12", false)).toBe("We will find out by December 2029.");
  });

  test("the final question, which would resolve after the game, is settled by the game's simulation (DECISIONS B10)", () => {
    expect(scenario("threshold-2032").resolvesBy).toBe("2034-10");
    expect(resolvesLine("2034-10", true)).toBe(
      "We would only find out by October 2034, after the game ends, so the game's simulation settles it when you finish.",
    );
    // On that turn "the model" is the AI system in the question, so the line never says it.
    expect(resolvesLine("2034-10", true)).not.toMatch(/\bmodel\b/);
  });
});

describe("the estimates list and the marks", () => {
  test("estimateLine gives a name and a whole percentage", () => {
    expect(estimateLine("Dr Maya Shah", 0.52)).toBe("Dr Maya Shah: 52%");
  });

  test("initials drop a title, and every adviser's initials differ", () => {
    expect(initials("Dr Maya Shah")).toBe("MS");
    expect(initials("James Harcourt")).toBe("JH");
    const all = pub.advisers.map((a) => initials(a.name));
    expect(new Set(all).size).toBe(pub.advisers.length);
  });
});
```

**Step 2: Run it and watch it fail.**

```bash
npx vitest run tests/ui/play-copy.test.ts
```

Expected: `FAIL tests/ui/play-copy.test.ts` with `Error: Cannot find module '../../src/ui/copy'`.

**Step 3: Implement.** Create `src/ui/copy.ts`:

```ts
// Sentence builders for the play screens. Pure and window-free, so Vitest can run
// them in Node (tests/ui/play-copy.test.ts checks them against the copy rules).
// They take public content as parameters and never import ./useGame.
// The debrief's builders live in ./debrief/copy.ts.

import { formatMonth, percent } from "./format";

// ---------------------------------------------------------------- the forecast

/** Upper bound (inclusive, whole percent) of each band. Symmetric around 50; only 0 and 100 say "certain". */
const CHANCE_WORDS: readonly (readonly [number, string])[] = [
  [0, "certain not to happen"],
  [5, "almost certainly not"],
  [39, "unlikely"],
  [60, "a toss-up"],
  [94, "likely"],
  [99, "almost certain"],
  [100, "certain to happen"],
];

/** 35 becomes "unlikely". Describes the player's own slider value, nothing else. */
export function verbalChance(percentValue: number): string {
  if (!Number.isFinite(percentValue) || percentValue < 0 || percentValue > 100) {
    throw new RangeError(`A chance is between 0 and 100, not ${percentValue}`);
  }
  const whole = Math.round(percentValue);
  return CHANCE_WORDS.find(([upTo]) => whole <= upTo)![1];
}

export const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * "You said 35%. Your advisers range from 47% to 68%." The guess is the slider's
 * whole percent when the player first compared, or null if they compared before
 * moving the slider: the default of 50 is not their guess. The estimates are the
 * engine's 0..1 probabilities. No average: one number would read as the answer
 * and flatten the disagreement.
 */
export function adviserRange(guessPercent: number | null, estimates: readonly number[]): string {
  if (estimates.length === 0) throw new Error("adviserRange needs at least one estimate");
  const shown = estimates.map((p) => Math.round(p * 100));
  const low = Math.min(...shown);
  const high = Math.max(...shown);
  const said = guessPercent === null ? "You compared before moving the slider." : `You said ${Math.round(guessPercent)}%.`;
  return low === high ? `${said} Your advisers all say ${low}%.` : `${said} Your advisers range from ${low}% to ${high}%.`;
}

/**
 * When the forecast question is settled. The final question would resolve after the
 * game ends, so the game's own simulation settles it (DECISIONS B10). It says
 * "simulation", not "model": on that turn "the model" is the AI system in the question.
 */
export function resolvesLine(resolvesBy: string, isFinal: boolean): string {
  return isFinal
    ? `We would only find out by ${formatMonth(resolvesBy)}, after the game ends, so the game's simulation settles it when you finish.`
    : `We will find out by ${formatMonth(resolvesBy)}.`;
}

/** "Dr Maya Shah: 52%", for the list of estimates beside the scale. */
export const estimateLine = (name: string, probability: number) => `${name}: ${percent(probability)}`;

const TITLES = new Set(["Dr", "Prof", "Sir", "Dame", "Mr", "Mrs", "Ms"]);

/** "Dr Maya Shah" becomes "MS": the label on an adviser's mark. */
export function initials(name: string): string {
  const words = name.split(/\s+/).filter((word) => word && !TITLES.has(word));
  const firstWord = words[0] ?? "";
  const lastWord = words[words.length - 1] ?? "";
  return `${firstWord.charAt(0)}${words.length > 1 ? lastWord.charAt(0) : ""}`.toUpperCase();
}
```

Notes for the executor:
- The only final question is `threshold-2032`. Its `resolvesBy` is `2034-10`, and every other scenario resolves by October 2032 at the latest. `Forecast` passes `view.current.isFinal`, which the engine sets only for the last scripted scenario.
- `formatMonth("2029-12")` returns `"December 2029"` (`src/ui/format.ts`).
- The final line avoids the word "model". The final question reads "Chance of a severe incident within two years if the model is deployed in the UK." (`src/content/scenarios/threshold-2032.json`), so "decided by the model" would read as the AI system deciding. DECISIONS B10 only asks that the draw be labelled as the game's own.
- Only 0 and 100 are "certain". In a game that scores calibration, a player who picks 100% has said "certain", so the words must say so and not "almost certain". The previous slider's end labels made the same distinction ("0% will not happen", "100% certain").
- `adviserRange(null, …)` says "You compared before moving the slider." rather than "You said 50%.". The slider starts at 50, and a player who presses Compare without touching it has not said anything. The sentence describes the moment of comparing, so it stays true if the player moves the slider afterwards. `Forecast` (Task 10.6) passes `null` in that case.
- The sentence itself keeps D4's wording, with no "Under this game's assumptions" prefix. It is never shown on its own: it belongs to the group of adviser estimates, which opens with a caption beginning with the prefix (`ESTIMATES_CAPTION`, Task 10.2; placed in Task 10.6). That is how DECISIONS F12 treats a group of simulated figures, and the adviser estimates are figures the engine generates. This is logged in Task 10.9.

**Step 4: Run it and watch it pass.**

```bash
npx vitest run tests/ui/play-copy.test.ts && npx eslint src/ui/copy.ts tests/ui/play-copy.test.ts
```

Expected: `Test Files  1 passed (1)`, `Tests  26 passed (26)`, and no ESLint output.

**Step 5: Commit.** In `docs/plan.md`, change the line `- [ ] ⬜ **Phase 10: Briefing and forecast**` to `- [ ] 🟨 **Phase 10: Briefing and forecast**` (in progress; leave its `[ ]` and its four step lines as they are). Then:

```bash
git add src/ui/copy.ts tests/ui/play-copy.test.ts docs/plan.md
git commit -m "feat(ui): forecast copy builders (verbal chance, adviser range, resolves line)"
```

---

### Task 10.2: Adviser sentence builders, "who backs what" rows and two fixed captions

**Files:**
- Modify: `src/ui/copy.ts` (the import line; append an adviser section and a fixed-captions section)
- Test: `tests/ui/play-copy.test.ts` (the import line; append three `describe` blocks)

**Step 1: Write the failing test.** In `tests/ui/play-copy.test.ts`, replace the import line

```ts
import { adviserRange, capitalise, estimateLine, initials, resolvesLine, verbalChance } from "../../src/ui/copy";
```

with

```ts
import {
  adviserRange,
  ASSESSMENT_CAVEAT,
  backersLine,
  backsLine,
  capitalise,
  estimateLine,
  ESTIMATES_CAPTION,
  initials,
  listOf,
  PREPARED_UNBACKED,
  resolvesLine,
  verbalChance,
  whoBacksWhat,
} from "../../src/ui/copy";
```

and append at the end of the file:

```ts
describe("advisers", () => {
  test("backsLine names the option and its text, or the option alone", () => {
    expect(backsLine("A", "Voluntary incident-reporting pact with developers and insurers.")).toBe(
      "Backs option A: Voluntary incident-reporting pact with developers and insurers.",
    );
    expect(backsLine("A")).toBe("Backs option A.");
  });

  test("listOf joins names the British way, with no serial comma", () => {
    expect(listOf([])).toBe("");
    expect(listOf(["Dr Maya Shah"])).toBe("Dr Maya Shah");
    expect(listOf(["Dr Maya Shah", "Amelia Chen"])).toBe("Dr Maya Shah and Amelia Chen");
    expect(listOf(["A", "B", "C"])).toBe("A, B and C");
  });

  test("backersLine covers an option nobody backs", () => {
    expect(backersLine(["Dr Maya Shah", "Amelia Chen"])).toBe("Backed by Dr Maya Shah and Amelia Chen.");
    expect(backersLine([])).toBe("No adviser backs this option.");
  });

  test("an option opened by investment that nobody backs is not described as rejected", () => {
    expect(PREPARED_UNBACKED).toBe("Your advisers' recommendations do not include this option.");
    expect(backersLine([], true)).toBe(PREPARED_UNBACKED);
    expect(backersLine(["Dr Maya Shah"], true)).toBe("Backed by Dr Maya Shah.");
  });
});

describe("whoBacksWhat: one row per open option", () => {
  test("lists every open option in order, with its backers in adviser order, including options nobody backs", () => {
    const s = scenario("attribution-gap");
    const rows = whoBacksWhat(s, s.choices, pub.advisers);
    expect(rows.map((r) => [r.id, r.backers])).toEqual([
      ["A", ["Dr Maya Shah", "Amelia Chen"]],
      ["B", []],
      ["C", ["James Harcourt"]],
      ["D", ["David Okafor"]],
    ]);
    expect(rows[0]!.text).toBe(s.choices[0]!.text);
  });

  test("marks an option opened by investment", () => {
    const s = scenario("deepfake-election");
    const rows = whoBacksWhat(s, s.choices, pub.advisers);
    expect(rows.find((r) => r.id === "E")?.prepared).toBe(true);
    expect(rows.find((r) => r.id === "A")?.prepared).toBe(false);
  });

  test("no adviser in any scenario backs an option that can be locked, so the split always names all four", () => {
    for (const s of Object.values(pub.scenarios)) {
      const open = s.choices.filter((c) => c.unlock === null);
      const named = whoBacksWhat(s, open, pub.advisers).flatMap((r) => r.backers);
      expect(named.length, s.id).toBe(pub.advisers.length);
    }
  });
});

describe("copy rules (spec Section 14) for the play screens", () => {
  const s = scenario("attribution-gap");
  const everySentence = [
    ...Array.from({ length: 101 }, (_, p) => verbalChance(p)),
    adviserRange(35, [0.52, 0.68]),
    adviserRange(10, [0.4, 0.4]),
    adviserRange(null, [0.52, 0.68]),
    resolvesLine("2029-12", false),
    resolvesLine("2034-10", true),
    backersLine([]),
    backersLine([], true),
    backersLine(["Dr Maya Shah"]),
    backsLine("A"),
    ...s.choices.map((c) => backsLine(c.id, c.text)),
    estimateLine("Dr Maya Shah", 0.52),
    ASSESSMENT_CAVEAT,
    ESTIMATES_CAPTION,
  ];

  test("no sentence tells the player a decision was right or wrong", () => {
    for (const sentence of everySentence) expect(sentence).not.toMatch(/\b(right|wrong|correct|incorrect|mistake|should have|good decision|bad decision)\b/i);
  });

  test("British spelling in the fixed copy", () => {
    for (const sentence of everySentence) expect(sentence).not.toMatch(/\b(color|favor|honor|center|behavior|defense|analyze|organize|realize|recognize|prioritize|catalog)\b/i);
  });

  test("the caption over the advisers' estimates begins with the prefix (DECISIONS F12)", () => {
    expect(ESTIMATES_CAPTION).toMatch(/^Under this game's assumptions, /);
  });
});
```

**Step 2: Run it and watch it fail.**

```bash
npx vitest run tests/ui/play-copy.test.ts
```

Expected: `Test Files  1 failed (1)`, `Tests  no tests`, with `TypeError: backersLine is not a function`. The copy-rules `describe` calls the missing builders while Vitest is collecting the file, so no test runs, not even the 26 from Task 10.1.

**Step 3: Implement.** In `src/ui/copy.ts`, replace

```ts
import { formatMonth, percent } from "./format";
```

with

```ts
import { ADVISER_ORDER, formatMonth, percent } from "./format";
import type { PublicAdviser, PublicChoice, PublicScenario } from "../content";
```

and append at the end of the file:

```ts

// ---------------------------------------------------------------- the advisers

/** "A, B and C" (no serial comma). */
export function listOf(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * "Backs option A: Voluntary incident-reporting pact with developers and insurers.",
 * or "Backs option A." when the card leaves the option's text to the split.
 */
export const backsLine = (choiceId: string, choiceText?: string) =>
  choiceText ? `Backs option ${choiceId}: ${choiceText}` : `Backs option ${choiceId}.`;

/**
 * Under an option opened by investment that no adviser backs. In the content every
 * such option is unbacked, because each adviser's recommendation was written among the
 * base options, so "No adviser backs this option." would read as a verdict on the
 * player's preparation.
 */
export const PREPARED_UNBACKED = "Your advisers' recommendations do not include this option.";

/** The line under an option in the split. `prepared`: the option was opened by the player's investment. */
export const backersLine = (names: readonly string[], prepared = false) =>
  names.length > 0 ? `Backed by ${listOf(names)}.` : prepared ? PREPARED_UNBACKED : "No adviser backs this option.";

export interface WhoBacksRow {
  id: string;
  text: string;
  /** Opened by the player's investment. */
  prepared: boolean;
  /** Adviser names, in ADVISER_ORDER. Empty when nobody backs the option. */
  backers: string[];
}

/** One row per open option, in the order given, with the advisers who recommend it. Uses only public fields. */
export function whoBacksWhat(scenario: PublicScenario, options: readonly PublicChoice[], advisers: readonly PublicAdviser[]): WhoBacksRow[] {
  const nameOf = (id: string) => {
    const adviser = advisers.find((a) => a.id === id);
    if (!adviser) throw new Error(`Unknown adviser "${id}"`);
    return adviser.name;
  };
  return options.map((choice) => ({
    id: choice.id,
    text: choice.text,
    prepared: choice.unlock !== null,
    backers: ADVISER_ORDER.filter((id) => scenario.advisers[id].recommends === choice.id).map(nameOf),
  }));
}

// ---------------------------------------------------------------- fixed captions

/** Under the analysts' assessment on the briefing. New copy avoids "wrong" (DECISIONS F12). */
export const ASSESSMENT_CAVEAT = "Analysts can misjudge this. How often depends on how strong the evidence is and on your State Capacity.";

/**
 * Opens the advisers' estimates once the player compares. The estimates are figures the
 * game generates, so the group begins with the prefix (DECISIONS F12).
 */
export const ESTIMATES_CAPTION =
  "Under this game's assumptions, these are your advisers' own estimates, not facts, and each adviser is sometimes off. At the end you will see how close each of them came.";
```

`../content` is the content index; the lint rule only blocks deep imports such as `../content/public`. Every choice text in the content ends with a full stop, so `backsLine` adds none.

Why the two captions are constants here: they replace sentences that said "sometimes wrong" (HEAD `Briefing.tsx` line 44 and `Forecast.tsx` line 67). DECISIONS F12 (Phase 8) bars "wrong" from new player-facing copy, and the copy-rules test above only sees strings that live in this module. `BriefingContent` (Task 10.4) renders `ASSESSMENT_CAVEAT`; `Forecast` (Task 10.6) renders `ESTIMATES_CAPTION` as the first line of the revealed estimates.

Why `PREPARED_UNBACKED` exists: the options opened by investment (Deepfake Election E; D in False Alarm and in both Incident variants) are recommended by no adviser in `src/content/scenarios/*.json`. Without it, the moment the spec calls "where preparation pays" would always print "No adviser backs this option." under "Open to you because you prepared.". The wording is on the Phase 11 designer-review list (see the gate).

**Step 4: Run it and watch it pass.**

```bash
npx vitest run tests/ui/play-copy.test.ts && npx eslint src/ui/copy.ts tests/ui/play-copy.test.ts
```

Expected: `Tests  36 passed (36)`, and no ESLint output.

**Step 5: Commit.**

```bash
git add src/ui/copy.ts tests/ui/play-copy.test.ts
git commit -m "feat(ui): adviser copy builders, the who-backs-what rows and two fixed captions"
```

---

### Task 10.3: Scale geometry for adviser marks (`src/ui/scale.ts`)

**Files:**
- Create: `src/ui/scale.ts`
- Test: `tests/ui/scale.test.ts` (new)

**Step 1: Write the failing test.** Create `tests/ui/scale.test.ts`:

```ts
// Placing adviser marks on the forecast slider's own 0-100 scale.

import { describe, expect, test } from "vitest";
import { MARK_GAP, scaleLeft, stackRows } from "../../src/ui/scale";

describe("scaleLeft: the same position as the slider thumb's centre", () => {
  test("offsets by half a thumb and spans the track less one thumb", () => {
    expect(scaleLeft(0)).toBe("calc(var(--thumb) / 2 + (100% - var(--thumb)) * 0)");
    expect(scaleLeft(0.35)).toBe("calc(var(--thumb) / 2 + (100% - var(--thumb)) * 0.35)");
    expect(scaleLeft(1)).toBe("calc(var(--thumb) / 2 + (100% - var(--thumb)) * 1)");
  });

  test("clamps to the scale", () => {
    expect(scaleLeft(-0.2)).toBe(scaleLeft(0));
    expect(scaleLeft(1.4)).toBe(scaleLeft(1));
  });
});

describe("stackRows: marks too close to share a row go on the next row up", () => {
  test("far-apart marks share row 0", () => {
    expect(stackRows([0.1, 0.4, 0.7, 0.95], MARK_GAP)).toEqual([0, 0, 0, 0]);
  });

  test("a mark within the gap of another moves up, and the first row with room is reused", () => {
    // Sorted: 0.47 (row 0), 0.52 (row 1), 0.54 (row 2), 0.68 (back to row 0).
    expect(stackRows([0.52, 0.68, 0.47, 0.54], MARK_GAP)).toEqual([1, 0, 0, 2]);
  });

  test("identical estimates never overlap", () => {
    expect(stackRows([0.4, 0.4, 0.4, 0.4], MARK_GAP)).toEqual([0, 1, 2, 3]);
  });

  test("exactly one gap apart is far enough, measured in whole points", () => {
    expect(MARK_GAP).toBe(10);
    expect(stackRows([0.47, 0.57], MARK_GAP)).toEqual([0, 0]);
    expect(stackRows([0.47, 0.56], MARK_GAP)).toEqual([0, 1]);
  });

  test("returns rows in the order the values came in", () => {
    expect(stackRows([0.9, 0.1, 0.12], MARK_GAP)).toEqual([0, 0, 1]);
  });
});
```

**Step 2: Run it and watch it fail.**

```bash
npx vitest run tests/ui/scale.test.ts
```

Expected: `Error: Cannot find module '../../src/ui/scale'`.

**Step 3: Implement.** Create `src/ui/scale.ts`:

```ts
// Geometry for the forecast scale: where a mark sits on the slider's 0-100 track,
// and which marks must stack so their labels do not overlap. Pure, window-free.

/**
 * CSS `left` for a point on the scale. A range thumb's centre travels from half a
 * thumb in from the left edge (at 0) to half a thumb in from the right (at 100),
 * so marks use the same formula. `--thumb` is fixed in theme.css (.forecast-scale).
 */
export function scaleLeft(probability: number): string {
  const p = Math.min(1, Math.max(0, probability));
  return `calc(var(--thumb) / 2 + (100% - var(--thumb)) * ${p})`;
}

/**
 * Marks closer than this many percentage points stack. At a 360px phone width the
 * track is about 282px, so 10 points is about 28px, just wider than one mark's
 * initials box (about 25px).
 */
export const MARK_GAP = 10;

/**
 * Row for each value (0 = nearest the track), in input order. Values are placed
 * lowest first; each takes the lowest row whose last mark is at least `gap`
 * points to its left, so identical or near values climb and distant ones share.
 */
export function stackRows(probabilities: readonly number[], gap: number): number[] {
  const points = probabilities.map((p) => Math.round(p * 100));
  const order = points.map((point, index) => ({ point, index })).sort((a, b) => a.point - b.point || a.index - b.index);
  const lastInRow: number[] = [];
  const rows = new Array<number>(points.length).fill(0);
  for (const { point, index } of order) {
    let row = lastInRow.findIndex((last) => point - last >= gap);
    if (row === -1) row = lastInRow.length;
    lastInRow[row] = point;
    rows[index] = row;
  }
  return rows;
}
```

Why 10 points and not the ~6 suggested in the investigation map: at 360px a 6-point gap is about 17px, and two 25px initials boxes would overlap by about 8px. Whole points are compared, so 0.47 and 0.57 (a float difference of 0.0999…) count as exactly 10 apart.

**Step 4: Run it and watch it pass.**

```bash
npx vitest run tests/ui/scale.test.ts && npx eslint src/ui/scale.ts tests/ui/scale.test.ts
```

Expected: `Tests  7 passed (7)`, and no ESLint output.

**Step 5: Commit.**

```bash
git add src/ui/scale.ts tests/ui/scale.test.ts
git commit -m "feat(ui): scale geometry for adviser marks on the forecast slider"
```

---

### Task 10.4: Briefing: plain adviser cards, who backs what, and `BriefingContent`

The briefing body moves into a reusable `BriefingContent`, which has no plate and no Continue button (Task 10.7 reuses it). The separate "The options on the table" list is replaced by `AdviserSplit`. That list showed each open option once, with the lever and visible-effects parenthetical that the decision step repeats. `AdviserSplit`, headed "Who backs what" (the name contract D5, DECISIONS F4 and Phase 15's playtest checklist use), shows each open option once, with the advisers who back it. It comes after the four adviser cards, so a newcomer meets each adviser (name, role, what they care about) before reading "Backed by Dr Maya Shah and Amelia Chen." The split does not cut repetition on turn 1. Each option's text still appears once in the split and once on the card of each adviser who backs it, three times for an option with two backers, because D5 puts the text on the card. To try the lighter card, delete the `recommendsText=` line in `BriefingContent`: the card then says "Backs option A." (this is on the Phase 11 designer-review list). Every string the tests depend on is kept:
- "Open to you because you prepared."
- the crisis notice beginning "This is a crisis turn."
- the crisis h2 "Your advisers are in open disagreement: N different recommendations"
- `<section aria-label="Assessment">`
- the evidence `<details>` text
- "Continue to your forecast"

**Files:**
- Create: `src/ui/components/AdviserSplit.tsx`, `src/ui/components/BriefingContent.tsx`
- Modify (replace in full): `src/ui/components/AdviserCard.tsx`, `src/ui/screens/Briefing.tsx`
- Test: `e2e/engagement.spec.ts` (append a `describe` block), `e2e/crisis.spec.ts` (one line in "the same option is open, and listed first, once Provenance reaches level 2")

**Step 1: Write the failing test.**

Make sure the imports at the top of `e2e/engagement.spec.ts` include `expect` and `test` from `"@playwright/test"`, and `startGame` from `"./play"`. Merge them into the existing import statements; do not add a second import from the same module.

Then append at the end of the file:

```ts

// ---------------------------------------------------------------- Phase 10: briefing and forecast

test.describe("briefing and forecast", () => {
  test("each adviser says what they care about and what they back, and every open option shows who backs it", async ({ page }) => {
    await startGame(page, "BRIEF-1");
    const cards = page.getByRole("region", { name: "Advisers" }).getByRole("article");
    await expect(cards).toHaveCount(4);
    for (const card of await cards.all()) {
      await expect(card.getByRole("heading", { level: 3 })).toBeVisible();
      await expect(card).toContainText("Cares about:");
      await expect(card).toContainText(/Backs option [A-E]: /);
    }
    await expect(page.getByText("Adviser file")).toHaveCount(0);
    await expect(page.getByText(/Recommends option/)).toHaveCount(0);

    const split = page.getByRole("region", { name: "Who backs what" });
    await expect(split.getByRole("listitem")).toHaveCount(4);
    await expect(split.getByText(/^(Backed by .+|No adviser backs this option)\.$/)).toHaveCount(4);
    // The lever and the visible effects are on the decision step; the briefing no longer repeats them.
    await expect(page.getByText(/Convening and alliances/)).toHaveCount(0);

    await expect(page.getByRole("region", { name: "Assessment" }).getByRole("heading", { name: "What your analysts think" })).toBeVisible();
  });
});
```

In `e2e/crisis.spec.ts`, in the test "the same option is open, and listed first, once Provenance reaches level 2", replace

```ts
  await expect(page.getByText("Open to you because you prepared.")).toBeVisible();
```

with

```ts
  await expect(page.getByText("Open to you because you prepared.")).toBeVisible();
  await expect(page.getByText("Your advisers' recommendations do not include this option.")).toBeVisible();
```

Do not assert that "No adviser backs this option." is absent: the Deepfake Election's option D is also backed by nobody and is not opened by investment, so it keeps that line.

**Step 2: Run it and watch it fail.**

```bash
lsof -i :4173    # expect no output; a stale preview server would be reused and test an old build
npx playwright test e2e/engagement.spec.ts e2e/crisis.spec.ts -g "briefing and forecast|listed first"
```

Expected: 2 failed.
- The engagement test fails with `Expected substring: "Cares about:"`, and the received text starts `Adviser file…`.
- The crisis test fails after 5 s on the new line with `element(s) not found`. The line above it still passes, because the old options list says "Open to you because you prepared.".

**Step 3: Implement.**

Replace `src/ui/components/AdviserCard.tsx` in full:

```tsx
import { backsLine } from "../copy";
import { percent } from "../format";
import type { PublicAdviser } from "../../content";

interface Props {
  adviser: PublicAdviser;
  stance: string;
  /** The option this adviser backs, and that option's text. Leave the text out to print only "Backs option X." */
  recommends: string;
  recommendsText?: string;
  /** A line recalling an earlier decision, when one applies. */
  memory: string | null;
  /** The adviser's probability for this turn's forecast question. Pass it only once the player's own forecast is locked. */
  forecast?: number;
}

/** One adviser, in plain terms: who they are, what they care about, what they back and why. All four carry equal weight. */
export function AdviserCard({ adviser, stance, recommends, recommendsText, memory, forecast }: Props) {
  return (
    <article className="border border-rule p-3">
      <h3 className="font-semibold">
        {adviser.name} <span className="font-normal text-muted">&middot; {adviser.role}</span>
      </h3>
      <p className="mt-1 text-sm">
        <span className="text-muted">Cares about:</span> {adviser.lens}
      </p>
      <p className="mt-2 text-sm font-semibold">{backsLine(recommends, recommendsText)}</p>
      <blockquote className="mt-1 text-sm">&ldquo;{stance}&rdquo;</blockquote>
      {memory && (
        <p className="mt-2 text-sm">
          <span className="text-muted">Remembers:</span> <span className="italic">&ldquo;{memory}&rdquo;</span>
        </p>
      )}
      {forecast !== undefined && (
        <p className="mt-2 text-sm">
          <span className="text-muted">Puts the chance at</span> <span className="font-mono">{percent(forecast)}</span>
        </p>
      )}
    </article>
  );
}
```

Create `src/ui/components/AdviserSplit.tsx`:

```tsx
import { backersLine, whoBacksWhat } from "../copy";
import type { PublicAdviser, PublicChoice, PublicScenario } from "../../content";

interface Props {
  scenario: PublicScenario;
  /** The options open this turn, in the order to show them. */
  options: PublicChoice[];
  advisers: PublicAdviser[];
}

/**
 * The options on the table, each with the advisers who back it, so the
 * disagreement is visible on every turn and not only in a crisis. Text, not
 * colour; no option is marked as the consensus or the answer.
 */
export function AdviserSplit({ scenario, options, advisers }: Props) {
  const rows = whoBacksWhat(scenario, options, advisers);
  return (
    <section aria-label="Who backs what">
      <h2 className="text-sm font-semibold">Who backs what</h2>
      <ul className="mt-2 space-y-3 text-sm">
        {rows.map((row) => (
          <li key={row.id}>
            <p>
              <span className="font-semibold">{row.id}.</span> {row.text}
              {row.prepared && (
                <>
                  {" "}
                  <span className="font-semibold">Open to you because you prepared.</span>
                </>
              )}
            </p>
            <p className="mt-0.5 pl-5">{backersLine(row.backers, row.prepared)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

Create `src/ui/components/BriefingContent.tsx`:

```tsx
import { AdviserCard } from "./AdviserCard";
import { AdviserSplit } from "./AdviserSplit";
import { EvidenceTag } from "./EvidenceTag";
import { IntelFile } from "./IntelFile";
import { ASSESSMENT_CAVEAT } from "../copy";
import { ADVISER_ORDER } from "../format";
import { pub } from "../useGame";
import type { PublicScenario } from "../../content";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  scenario: PublicScenario;
  /** Show each adviser's forecast on their card. Only after the player's own forecast is locked. */
  showForecasts?: boolean;
}

/**
 * The body of a briefing: the situation, the evidence, what the analysts think, the
 * four advisers, then who backs which option (after the cards, so the reader
 * has met each backer). No plate and no way on, so the same body can be shown again,
 * folded, on the forecast and decision steps.
 */
export function BriefingContent({ view, scenario, showForecasts = false }: Props) {
  const ctx = view.current!;
  const assessment = view.intel.find((r) => r.turn === view.turn && r.source === "briefing" && r.scenarioId === scenario.id);
  // Earlier turns only: on the decision step this turn's commissioned analysis is shown above the options.
  const earlier = view.intel.filter((r) => r.turn < view.turn);
  const crisis = scenario.isCrisis;
  const open = scenario.choices.filter((c) => ctx.choices.find((o) => o.id === c.id)?.status !== "locked");
  const positions = new Set(ADVISER_ORDER.map((id) => scenario.advisers[id].recommends)).size;

  return (
    <div className="space-y-6">
      <p className="text-lg">{scenario.briefing}</p>
      <EvidenceTag evidence={scenario.evidenceStrength} severity={scenario.severity} reduced={crisis} />
      {crisis && (
        <p className="text-sm font-semibold">
          This is a crisis turn. There is no time to commission analysis or to review the evidence file. You decide on what is in front of you.
        </p>
      )}

      {assessment && (
        <section aria-label="Assessment" className="border-l-2 border-ink pl-4">
          <h2 className="text-sm font-semibold">{crisis ? "Unconfirmed report" : "What your analysts think"}</h2>
          <p className="mt-1">{assessment.text}</p>
          {!crisis && (
            <p className="mt-1 text-xs text-muted">{ASSESSMENT_CAVEAT}</p>
          )}
        </section>
      )}

      <section aria-label="Advisers" className="space-y-4">
        <h2 className="text-sm font-semibold">
          {crisis ? `Your advisers are in open disagreement: ${positions} different recommendations` : "Your advisers"}
        </h2>
        {showForecasts && (
          <p className="text-sm text-muted">
            Under this game&rsquo;s assumptions, these are their forecasts for this turn&rsquo;s question: {scenario.forecastQuestion}
          </p>
        )}
        {ADVISER_ORDER.map((id) => {
          const { stance, recommends } = scenario.advisers[id];
          return (
            <AdviserCard
              key={id}
              adviser={pub.advisers.find((a) => a.id === id)!}
              stance={stance}
              recommends={recommends}
              recommendsText={scenario.choices.find((c) => c.id === recommends)?.text ?? ""}
              memory={ctx.adviserMemory[id]}
              forecast={showForecasts ? ctx.adviserForecasts[id] : undefined}
            />
          );
        })}
      </section>

      <AdviserSplit scenario={scenario} options={open} advisers={pub.advisers} />

      {!crisis && (
        <details className="border border-rule p-4">
          <summary className="cursor-pointer font-semibold">Real-world evidence behind this fictional scenario</summary>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="font-semibold">What we know</dt>
              <dd>{scenario.evidencePanel.known}</dd>
            </div>
            <div>
              <dt className="font-semibold">What we do not know</dt>
              <dd>{scenario.evidencePanel.unknown}</dd>
            </div>
            <div>
              <dt className="font-semibold">Why it matters</dt>
              <dd>{scenario.evidencePanel.whyItMatters}</dd>
            </div>
          </dl>
          <ul className="mt-3 space-y-1 text-sm">
            {scenario.evidencePanel.sources.map((source) => (
              <li key={source.url}>
                <a className="text-accent underline" href={source.url} target="_blank" rel="noreferrer">
                  {source.label}
                </a>{" "}
                <span className="text-xs text-muted">(reviewed {source.reviewed})</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {!crisis && <IntelFile reports={earlier} heading="What you have been told so far" />}
    </div>
  );
}
```

The "Under this game's assumptions, these are their forecasts for this turn's question" line appears only with `showForecasts`, that is on the decision step's recap (Task 10.7). It does two jobs. The decision step never shows the forecast question anywhere else, so without it "Puts the chance at 52%" would not say what the chance is of. And the four "Puts the chance at" lines are a group of figures the game generates, so the line that introduces them begins with the prefix (DECISIONS F12).

The assessment caveat is `ASSESSMENT_CAVEAT` from `src/ui/copy.ts` (Task 10.2), so the copy-rules test covers it. It replaces HEAD's "Assessments are sometimes wrong. …", because F12 bars "wrong" from new copy.

`earlier` changes from `r !== assessment` to `r.turn < view.turn`. On the briefing the two give the same list: the only intel entry with the current turn number is the assessment, and findings are stamped with the turn that resolved them. On the decision step (Task 10.7) the new filter also leaves out this turn's commissioned analysis, which is already shown above the options.

Replace `src/ui/screens/Briefing.tsx` in full. The plate line is Phase 9's (`Plate` carries `src`, `caption`, `width` and `height`). If Phase 9 left it different, keep Phase 9's line.

```tsx
import { SCENARIO_PLATES } from "../art/plates";
import { BriefingContent } from "../components/BriefingContent";
import { Button } from "../components/Button";
import { Figure } from "../components/Figure";
import type { PublicScenario } from "../../content";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  scenario: PublicScenario;
  onContinue: () => void;
}

/** Step 1 of the turn: the situation, the evidence, four adviser positions, and who backs which option. */
export function Briefing({ view, scenario, onContinue }: Props) {
  const plate = SCENARIO_PLATES[scenario.id];

  return (
    <div className="space-y-6">
      {plate && <Figure {...plate} />}
      <BriefingContent view={view} scenario={scenario} />
      <Button onClick={onContinue}>Continue to your forecast</Button>
    </div>
  );
}
```

Hidden-information check:
- `lens`, `stance` and `recommends` are public: they come from `PublicAdviser` and `PublicScenario.advisers`.
- The memory line is the engine-resolved string. The card never explains why it appeared (B34).
- No `bias` and no ordering by any hidden value.

**Step 4: Run it and watch it pass.**

```bash
npx tsc --noEmit -p . && npx eslint src/ui e2e
npx playwright test e2e/engagement.spec.ts e2e/crisis.spec.ts e2e/polish.spec.ts
```

Expected:
- `tsc` and ESLint print nothing.
- All tests in the three files pass, including the new briefing test.
- `crisis.spec.ts` still finds "Open to you because you prepared.", "This is a crisis turn." and /Your advisers are in open disagreement/, and now also "Your advisers' recommendations do not include this option." under the prepared option E.
- The seed round-trip in `polish.spec.ts` still reads the region "Assessment".

**Step 5: Commit.**

```bash
git add src/ui/components/AdviserCard.tsx src/ui/components/AdviserSplit.tsx src/ui/components/BriefingContent.tsx src/ui/screens/Briefing.tsx e2e/engagement.spec.ts e2e/crisis.spec.ts
git commit -m "feat(ui): plain adviser cards and who-backs-what on the briefing; extract BriefingContent"
```

---

### Task 10.5: Fold "What you have been told so far" behind a count

**Files:**
- Modify (replace in full): `src/ui/components/IntelFile.tsx`
- Modify: `src/ui/components/BriefingContent.tsx` (the `IntelFile` line)
- Test: `e2e/engagement.spec.ts`

**Step 1: Write the failing test.**

Make sure the imports in `e2e/engagement.spec.ts` include:
- `import AxeBuilder from "@axe-core/playwright";` (add it if absent)
- `type Page` in the `"@playwright/test"` import
- `playTurn` in the `"./play"` import

Then insert this helper directly below the line `test.describe("briefing and forecast", () => {`:

```ts
  /** The same bar as Phase 8's expectNoSeriousViolations in polish.spec.ts (DECISIONS B42): no violations at any impact, best-practice rules included. */
  const expectAxeClean = async (page: Page, where: string) => {
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
    expect(results.violations.map((v) => `${where}: ${v.impact} ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target}`)).toEqual([]);
  };

```

It copies Phase 8's helper rather than importing it, because Playwright spec files should not import from one another.

Insert this test before the final `});` of the `test.describe("briefing and forecast", …)` block:

```ts

  test("earlier reports are folded behind a count on the briefing", async ({ page }) => {
    await startGame(page, "BRIEF-2");
    await playTurn(page);
    const summary = page.getByText(/^What you have been told so far \(\d+ reports?\)$/);
    await expect(summary).toBeVisible();
    await expect(page.getByText(/Turn 1 · Briefing assessment/i)).toBeHidden();
    await summary.click();
    await expect(page.getByText(/Turn 1 · Briefing assessment/i)).toBeVisible();
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      await expectAxeClean(page, `briefing with earlier reports open (${colorScheme})`);
    }
  });
```

This check lives here rather than in the `polish.spec.ts` axe walk. The walk's turn-1-to-turn-2 transition is where Phase 12 adds its pause card, and `playTurn` is the helper Phase 12 teaches to step past it.

**Step 2: Run it and watch it fail.**

```bash
npx playwright test e2e/engagement.spec.ts -g "earlier reports"
```

Expected: 1 failed. `expect(locator).toBeVisible()` fails on the summary with `element(s) not found`, because the file is open under an h2 today.

**Step 3: Implement.**

Replace `src/ui/components/IntelFile.tsx` in full. `News.tsx` keeps calling it without the new prop, so the news screen's file stays open.

```tsx
import type { IntelReport } from "../../engine";

const SOURCE_LABEL: Record<IntelReport["source"], string> = {
  briefing: "Briefing assessment",
  purchase: "Commissioned analysis",
  reveal: "Finding delivered",
};

interface Props {
  reports: IntelReport[];
  heading?: string;
  /** Fold the file behind a summary that counts the reports. The briefing's file grows every turn; the news screen's stays open. */
  collapsible?: boolean;
}

/** What the Director has been told about the hidden world. Any of it may be wrong. */
export function IntelFile({ reports, heading = "Intelligence file", collapsible = false }: Props) {
  if (reports.length === 0) return null;
  const list = (
    <ul className="mt-2 space-y-2 text-sm">
      {reports.map((report, index) => (
        <li key={index} className="border-t border-rule pt-2 first:border-t-0 first:pt-0">
          <span className="block font-mono text-xs uppercase tracking-wider text-muted">
            Turn {report.turn} &middot; {SOURCE_LABEL[report.source]}
          </span>
          {report.text}
        </li>
      ))}
    </ul>
  );

  if (collapsible) {
    const count = `${reports.length} ${reports.length === 1 ? "report" : "reports"}`;
    return (
      <details className="border border-rule p-3">
        <summary className="cursor-pointer py-1 text-sm font-semibold">
          {heading} ({count})
        </summary>
        {list}
      </details>
    );
  }
  return (
    <section aria-label={heading} className="border border-rule p-3">
      <h2 className="text-sm font-semibold">{heading}</h2>
      {list}
    </section>
  );
}
```

The `py-1` on the summary makes it 28px tall, above the WCAG 2.2 minimum of 24px.

In `src/ui/components/BriefingContent.tsx`, replace

```tsx
      {!crisis && <IntelFile reports={earlier} heading="What you have been told so far" />}
```

with

```tsx
      {!crisis && <IntelFile reports={earlier} heading="What you have been told so far" collapsible />}
```

**Step 4: Run it and watch it pass.**

```bash
npx tsc --noEmit -p . && npx eslint src/ui e2e
npx playwright test e2e/engagement.spec.ts -g "briefing and forecast"
```

Expected: 2 passed.

**Step 5: Commit.**

```bash
git add src/ui/components/IntelFile.tsx src/ui/components/BriefingContent.tsx e2e/engagement.spec.ts
git commit -m "feat(ui): fold the briefing's intelligence file behind a report count"
```

---

### Task 10.6: Forecast: gut feel first, then compare on one scale (`ForecastScale`)

The screen now works like this:
- The h2 reads "How likely do you think this is?", with the forecast question beneath it and the `resolvesLine` sentence below that.
- The single native slider keeps `id="forecast"`, min 0, max 100, step 1 and a default of 50. It gains `aria-valuetext` (for example "35%, unlikely") and visible verbal anchors.
- After the slider in DOM order comes a quiet "Compare with your advisers" button. It shows the four estimates as marks on the slider's own scale. Below the button it shows, in order: a caption beginning "Under this game's assumptions" (`ESTIMATES_CAPTION`), the sentence "You said N%. Your advisers range from A% to B%.", and a "Name: N%" list. If the player compares before moving the slider, the sentence begins "You compared before moving the slider." instead, because the default of 50 is not their guess.
- "Lock in N%" is always enabled.
- The old separate "Your advisers’ estimates" section is removed.
- The line under the question no longer says "scored". It says when the answer is known (`resolvesLine`), then "You will see the answer, and how your guess and your advisers’ compared with it, at the end of the game." That second sentence matters because some questions are settled by hidden draws that no headline ever reports. The Deepfake Election, for example, says "We will find out by June 2029.", but nothing in play says whether the recording was authentic.

**Files:**
- Create: `src/ui/components/ForecastScale.tsx`
- Modify (replace in full): `src/ui/screens/Forecast.tsx`
- Modify: `src/ui/theme.css` (insert a `.forecast-scale` block before the focus-style comment)
- Test: `e2e/engagement.spec.ts`, `e2e/polish.spec.ts` (axe walk)

**Step 1: Write the failing test.**

Make sure the imports in `e2e/engagement.spec.ts` also include `LABEL` and `playUntil` from `"./play"`, and `type Locator` in the `"@playwright/test"` import (for example `import { expect, test, type Locator, type Page } from "@playwright/test";`).

Insert directly below the line `test.describe("briefing and forecast", () => {`:

```ts
  const COMPARE = "Compare with your advisers";

  const toForecast = async (page: Page) => {
    await page.getByRole("button", { name: LABEL.continueToForecast }).click();
    await expect(page.getByRole("slider")).toBeVisible();
  };

```

Insert these six tests before the final `});` of the describe block:

```ts

  test("the advisers' estimates stay hidden until the player compares, then sit on the slider's own scale", async ({ page }) => {
    await startGame(page, "FORECAST-1");
    await toForecast(page);
    await expect(page.getByRole("heading", { level: 2, name: "How likely do you think this is?" })).toBeVisible();
    await expect(page.getByText("We will find out by December 2029.")).toBeVisible();
    await expect(page.getByTestId("adviser-mark")).toHaveCount(0);
    await expect(page.getByText(/^You said/)).toHaveCount(0);

    const slider = page.getByRole("slider");
    await slider.fill("35");
    await expect(slider).toHaveAttribute("aria-valuetext", "35%, unlikely");

    const compare = page.getByRole("button", { name: COMPARE });
    await expect(compare).toHaveAttribute("aria-expanded", "false");
    await compare.click();
    await expect(compare).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("adviser-mark")).toHaveCount(4);
    await expect(page.getByText(/^You said 35%\. Your advisers (range from \d+% to \d+%|all say \d+%)\.$/)).toBeVisible();
    const estimates = page.getByRole("list", { name: "Your advisers’ estimates" }).getByRole("listitem");
    await expect(estimates).toHaveCount(4);

    // A mark sits where the thumb's centre would be: pressing the track under a mark sets that estimate.
    const first = Number((await estimates.first().innerText()).match(/(\d+)%/)![1]);
    const mark = (await page.getByTestId("adviser-mark").first().boundingBox())!;
    const track = (await slider.boundingBox())!;
    await slider.click({ position: { x: mark.x + mark.width / 2 - track.x, y: track.height / 2 } });
    expect(Math.abs(Number(await slider.inputValue()) - first)).toBeLessThanOrEqual(1);

    // Moving the slider afterwards changes the forecast, not what the player first said.
    await slider.fill("60");
    await expect(page.getByText(/^You said 35%\./)).toBeVisible();
    await page.getByRole("button", { name: "Lock in 60%" }).click();
    await expect(page.getByRole("group", { name: LABEL.decisionGroup })).toBeVisible();
  });

  test("Lock in works without comparing", async ({ page }) => {
    await startGame(page, "FORECAST-2");
    await toForecast(page);
    await page.getByRole("slider").fill("70");
    await page.getByRole("button", { name: "Lock in 70%" }).click();
    await expect(page.getByRole("group", { name: LABEL.decisionGroup })).toBeVisible();
  });

  test("by keyboard: the slider comes first after the title, then Compare, then Lock in", async ({ page }) => {
    await startGame(page, "FORECAST-KEYS");
    await toForecast(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("slider")).toBeFocused();
    for (let i = 0; i < 15; i++) await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("slider")).toHaveAttribute("aria-valuetext", "35%, unlikely");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: COMPARE })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("adviser-mark")).toHaveCount(4);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Lock in 35%" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("group", { name: LABEL.decisionGroup })).toBeVisible();
  });

  test("comparing before moving the slider does not claim a guess", async ({ page }) => {
    await startGame(page, "FORECAST-3");
    await toForecast(page);
    await page.getByRole("button", { name: COMPARE }).click();
    await expect(page.getByText(/^Under this game's assumptions, these are your advisers' own estimates/)).toBeVisible();
    await expect(page.getByText(/^You compared before moving the slider\. Your advisers (range from \d+% to \d+%|all say \d+%)\.$/)).toBeVisible();
    await expect(page.getByText(/^You said/)).toHaveCount(0);
    // Moving the slider afterwards does not rewrite what the player had done when they compared.
    await page.getByRole("slider").fill("40");
    await expect(page.getByText(/^You compared before moving the slider\./)).toBeVisible();
    await expect(page.getByRole("button", { name: "Lock in 40%" })).toBeVisible();
  });

  test("the final question says the game settles it", async ({ page }) => {
    await startGame(page, "FINAL-Q");
    await playUntil(page, "The 2032 Threshold");
    await toForecast(page);
    await expect(page.getByText(/^We would only find out by October 2034, after the game ends/)).toBeVisible();
  });

  test("in forced colours the track and the marks' stems are still drawn", async ({ page }) => {
    await startGame(page, "FORCED-1");
    await toForecast(page);
    const slider = page.getByRole("slider");
    await slider.fill("0"); // the thumb sits at the left end, clear of the stretch of track checked below
    await page.getByRole("button", { name: COMPARE }).click();
    await page.emulateMedia({ forcedColors: "active" });
    await slider.scrollIntoViewIfNeeded();

    // Each check photographs a small area, hides the element, and photographs it again.
    // Identical pictures mean forced colours had already painted the element out.
    const drawn = async (element: Locator, clip: { x: number; y: number; width: number; height: number }) => {
      const shown = await page.screenshot({ clip });
      await element.evaluate((node) => { (node as HTMLElement).style.visibility = "hidden"; });
      const hidden = await page.screenshot({ clip });
      await element.evaluate((node) => { (node as HTMLElement).style.visibility = ""; });
      return !shown.equals(hidden);
    };
    const track = (await slider.boundingBox())!;
    // By id, not by role: a role locator no longer finds the slider once it is hidden.
    expect(await drawn(page.locator("#forecast"), { x: track.x + track.width * 0.6, y: track.y + track.height / 2 - 4, width: track.width * 0.3, height: 8 })).toBe(true);
    const stem = page.getByTestId("adviser-mark").first().locator(":scope > span").last();
    const stemBox = (await stem.boundingBox())!;
    expect(await drawn(stem, { x: stemBox.x - 1, y: stemBox.y, width: stemBox.width + 2, height: stemBox.height })).toBe(true);
  });
```

The forced-colours test needs no image library. It compares two screenshots of the same few pixels, one with the element shown and one with it hidden. If forced colours have painted the track or a stem out, the two are identical. It was checked on the trial build: it passes with Step 3's code, fails on the track check without the `@media (forced-colors: active)` block, and fails on the stem check if the stem is drawn with `bg-ink` instead of a border.

In `e2e/polish.spec.ts`, in the axe walk, replace

```ts
    await expectNoSeriousViolations(page, "forecast");
```

with

```ts
    await expectNoSeriousViolations(page, "forecast");
    await page.getByRole("button", { name: "Compare with your advisers" }).click();
    await expectNoSeriousViolations(page, "forecast with the advisers' estimates shown");
```

The existing "briefing" scan in that walk already covers the new adviser cards and the who-backs-what list from Task 10.4. The existing keyboard test (`polish.spec.ts`, "a whole turn can be played with the keyboard alone") needs no change. It presses Tab once after the h1 and expects the slider, presses ArrowLeft 15 times from the default of 50, then tabs forward until it reaches "Lock in 35%". That now passes through "Compare with your advisers" on the way.

**Step 2: Run it and watch it fail.**

```bash
npx playwright test e2e/engagement.spec.ts -g "briefing and forecast"
npx playwright test e2e/polish.spec.ts -g "axe"
```

Expected:
- In `engagement.spec.ts`, 5 of the 6 new tests fail. The h2 "How likely do you think this is?" is not found. `aria-valuetext` is received as `""`. The text /^We would only find out by October 2034, after the game ends/ is not found. The forced-colours test and "comparing before moving the slider does not claim a guess" both time out after 30 s waiting to click "Compare with your advisers".
- "Lock in works without comparing" already passes. It guards D4 ("Lock in is always enabled") and must keep passing.
- Both axe tests fail, timing out on the click on "Compare with your advisers".

**Step 3: Implement.**

In `src/ui/theme.css`, insert this block immediately above the line `/* One visible focus style everywhere, for keyboard operation (WCAG 2.4.7). */`:

```css
/* The forecast slider draws its own thumb at a fixed width.
   A range thumb's centre does not sit at value% of the input's width: it travels
   from half a thumb in from the left edge (at 0) to half a thumb in from the right
   edge (at 100). Adviser marks and the verbal anchors are placed with the same
   formula, left: calc(var(--thumb) / 2 + (100% - var(--thumb)) * p) (src/ui/scale.ts),
   which only lines up if every browser draws the thumb exactly --thumb wide. So the
   native look is switched off and the thumb, square like everything else
   (decision 13), is drawn here. The input stays 24px tall, the WCAG 2.2 minimum
   target, and keeps the global focus outline. */
.forecast-scale {
  --thumb: 1.25rem;
}

.forecast-scale input[type="range"] {
  appearance: none;
  display: block;
  width: 100%;
  height: 1.5rem;
  margin: 0;
  background: transparent;
  cursor: pointer;
}

.forecast-scale input[type="range"]::-webkit-slider-runnable-track {
  height: 0.25rem;
  background: var(--muted);
}

.forecast-scale input[type="range"]::-moz-range-track {
  height: 0.25rem;
  background: var(--muted);
}

.forecast-scale input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  box-sizing: border-box;
  width: var(--thumb);
  height: var(--thumb);
  margin-top: calc((0.25rem - var(--thumb)) / 2); /* centre it on the 4px track */
  border: 2px solid var(--paper);
  border-radius: 0;
  background: var(--accent);
}

.forecast-scale input[type="range"]::-moz-range-thumb {
  box-sizing: border-box;
  width: var(--thumb);
  height: var(--thumb);
  border: 2px solid var(--paper);
  border-radius: 0;
  background: var(--accent);
}

/* Forced colours (Windows High Contrast) replace background colours with Canvas,
   which would erase the drawn track and the thumb's fill. Only the track and the
   thumb opt out, so the input keeps the forced focus outline. One rule per
   pseudo-element: a browser drops a whole rule if one selector in it is unknown. */
@media (forced-colors: active) {
  .forecast-scale input[type="range"]::-webkit-slider-runnable-track {
    forced-color-adjust: none;
    background: CanvasText;
  }

  .forecast-scale input[type="range"]::-moz-range-track {
    forced-color-adjust: none;
    background: CanvasText;
  }

  .forecast-scale input[type="range"]::-webkit-slider-thumb {
    forced-color-adjust: none;
    border-color: Canvas;
    background: Highlight;
  }

  .forecast-scale input[type="range"]::-moz-range-thumb {
    forced-color-adjust: none;
    border-color: Canvas;
    background: Highlight;
  }
}

```

Forced colours matter here because `appearance: none` gives up the native slider, which browsers keep visible in High Contrast mode on their own. Without the `@media (forced-colors: active)` block the track vanishes there, and the thumb becomes an outline floating in space. The adviser marks' stems are drawn as a left border, not a background (below), because forced colours keep borders. The `forced-color-adjust: none` sits on the pseudo-elements only. On the input itself it would also stop the browser forcing the focus outline, which would then keep the page's own `--accent` in place of the user's chosen system colours. On the trial build, in forced colours, the track, thumb and stems were visible in light and dark, and the keyboard focus outline (checked in dark) was forced to the system highlight colour.

Create `src/ui/components/ForecastScale.tsx`:

```tsx
import { capitalise, verbalChance } from "../copy";
import { MARK_GAP, scaleLeft, stackRows } from "../scale";

export interface ScaleMark {
  id: string;
  /** Shown on the mark. The full name is in the list that follows the compare button. */
  initials: string;
  /** 0..1, as the engine gives it. */
  probability: number;
}

interface Props {
  /** Whole percent, 0 to 100. */
  value: number;
  onChange: (value: number) => void;
  /** Adviser estimates to draw on the scale, or null while they are hidden. */
  marks: ScaleMark[] | null;
  /** Id of the element holding the forecast question, read out with the slider. */
  describedBy: string;
}

/** Verbal anchors under the track. 25 and 75 appear only where there is room for them. */
const ANCHORS = [0, 25, 50, 75, 100] as const;
/** Height of one row of stacked marks, in rem. */
const ROW = 1.5;

/**
 * The forecast slider: one native range input (the only role=slider on the step),
 * with the player's value in words, and, once revealed, each adviser's estimate as
 * a mark on the same 0-100 scale. Marks and anchors are decorative (aria-hidden);
 * the slider's aria-valuetext and the list after the compare button carry the same
 * information in text. See `.forecast-scale` in theme.css for the thumb width.
 */
export function ForecastScale({ value, onChange, marks, describedBy }: Props) {
  const words = verbalChance(value);
  const rows = marks ? stackRows(marks.map((m) => m.probability), MARK_GAP) : [];
  const depth = rows.length > 0 ? Math.max(...rows) + 1 : 0;

  return (
    <div className="forecast-scale @container mt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <label htmlFor="forecast" className="font-semibold">
          Your guess
        </label>
        <p aria-hidden="true">
          <span className="font-mono text-2xl">{value}%</span> <span className="text-muted">{words}</span>
        </p>
      </div>

      {marks && (
        <div aria-hidden="true" data-testid="adviser-marks" className="relative mt-3" style={{ height: `${depth * ROW}rem` }}>
          {marks.map((mark, index) => {
            const row = rows[index] ?? 0;
            return (
              <span
                key={mark.id}
                data-testid="adviser-mark"
                className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center"
                // Lower rows paint on top, so a higher mark's stem passes behind the labels below it.
                style={{ left: scaleLeft(mark.probability), zIndex: depth - row }}
              >
                <span className="border border-ink bg-paper px-1 font-mono text-xs leading-4">{mark.initials}</span>
                {/* A border, not a background: forced colours keep borders and blank out backgrounds. */}
                <span className="w-0 border-l border-ink" style={{ height: `${row * ROW + 0.25}rem` }} />
              </span>
            );
          })}
        </div>
      )}

      <input
        id="forecast"
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        aria-valuetext={`${value}%, ${words}`}
        aria-describedby={describedBy}
        onChange={(event) => onChange(Number(event.target.value))}
      />

      <div aria-hidden="true" className="relative mt-1 h-10 text-xs text-muted">
        {ANCHORS.map((point) => {
          const place =
            point === 0 ? "left-0 text-left" : point === 100 ? "right-0 text-right" : "-translate-x-1/2 text-center";
          const room = point === 25 || point === 75 ? "hidden @2xl:block" : "block";
          return (
            <span
              key={point}
              className={`absolute top-0 w-max max-w-[7rem] ${place} ${room}`}
              style={point === 0 || point === 100 ? undefined : { left: scaleLeft(point / 100) }}
            >
              {capitalise(verbalChance(point))}
            </span>
          );
        })}
      </div>
    </div>
  );
}
```

Notes:
- `@container` and `@2xl:` are Tailwind v4 core container queries, and the project is on 4.3.3. The 25% and 75% anchors ("Unlikely", "Likely") appear only where the scale is at least 42rem (672px) wide. At a 1280px viewport the scale is 686px with overlay scrollbars (headless Chromium, and macOS by default), so they show. With a classic 15px scrollbar (Windows, Linux, macOS set to always show scrollbars) it is 671px, so they do not. They never show at 375px, at 726px (628px scale) or in the narrower `lg` column at about 1024px. The end anchors read "Certain not to happen", which wraps to two lines at the 7rem cap, and "Certain to happen". On the trial build no anchors overlapped at 360, 375, 726, 1265 or 1280px wide. Dropping the threshold to `@xl:` (36rem) would show the 25% and 75% anchors at 726px too, but that layout was not tested.
- There is no class on the `<input>`. `theme.css` rules sit outside any `@layer`, so the `.forecast-scale input[type="range"]` rule's `margin: 0` would beat a layered utility such as `mt-1` whatever its specificity.
- Each anchor is placed at its own point (0, 25, 50, 75, 100), and `verbalChance` of that point is the anchor's own band, so the labels never contradict the `aria-valuetext`.
- Each mark is its own stacking context, because `-translate-x-1/2` sets a transform. That is why the per-mark `zIndex` (lower rows on top) is needed and a `z-10` on the label would not work.

Replace `src/ui/screens/Forecast.tsx` in full:

```tsx
import { useState } from "react";
import { Button } from "../components/Button";
import { ForecastScale } from "../components/ForecastScale";
import { adviserRange, estimateLine, ESTIMATES_CAPTION, initials, resolvesLine } from "../copy";
import { ADVISER_ORDER } from "../format";
import { pub } from "../useGame";
import type { PublicScenario } from "../../content";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  scenario: PublicScenario;
  onForecast: (probability: number) => void;
}

/**
 * Step 2: one probability, one slider. Gut feel first: the advisers' estimates stay
 * hidden until the player asks to compare, then appear on the slider's own scale.
 * Comparing is optional and Lock in never waits for it (DECISIONS F, D4; this
 * amends the spec's "adviser estimates shown beside it as anchors").
 */
export function Forecast({ view, scenario, onForecast }: Props) {
  const [value, setValue] = useState(50);
  /** Whether the player has moved the slider at all. The default of 50 is not their guess. */
  const [moved, setMoved] = useState(false);
  const [revealed, setRevealed] = useState(false);
  /**
   * What the player had said when they first compared: a whole percent, or null if they
   * had not moved the slider. Undefined until then. Only for the sentence below; never stored (D4).
   */
  const [firstGuess, setFirstGuess] = useState<number | null | undefined>(undefined);
  const ctx = view.current!;
  const advisers = ADVISER_ORDER.map((id) => {
    const { name } = pub.advisers.find((a) => a.id === id)!;
    return { id, name, initials: initials(name), probability: ctx.adviserForecasts[id] };
  });

  function change(next: number) {
    setValue(next);
    setMoved(true);
  }

  function compare() {
    if (firstGuess === undefined) setFirstGuess(moved ? value : null);
    setRevealed(!revealed);
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="forecast-heading">
        <h2 id="forecast-heading" className="text-xl">
          How likely do you think this is?
        </h2>
        <p id="forecast-question" className="mt-2 text-lg">
          {scenario.forecastQuestion}
        </p>
        <p className="mt-1 text-sm text-muted">
          {resolvesLine(scenario.resolvesBy, ctx.isFinal)} You will see the answer, and how your guess and your advisers&rsquo; compared with it,
          at the end of the game.
        </p>

        <ForecastScale value={value} onChange={change} marks={revealed ? advisers : null} describedBy="forecast-question" />

        <Button variant="quiet" className="mt-4" aria-expanded={revealed} aria-controls="adviser-estimates" onClick={compare}>
          Compare with your advisers
        </Button>
        <div id="adviser-estimates" className="mt-3">
          {/* The caption comes first so the group of figures opens with the prefix (DECISIONS F12). */}
          {revealed && <p className="mb-1 text-xs text-muted">{ESTIMATES_CAPTION}</p>}
          <p aria-live="polite" className="text-sm font-semibold">
            {revealed && firstGuess !== undefined ? adviserRange(firstGuess, advisers.map((a) => a.probability)) : ""}
          </p>
          {revealed && (
            <ul aria-label="Your advisers’ estimates" className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
              {advisers.map((adviser) => (
                <li key={adviser.id} className="flex gap-2 border-b border-rule py-1">
                  <span aria-hidden="true" className="w-7 shrink-0 font-mono text-xs leading-5">
                    {adviser.initials}
                  </span>
                  <span>{estimateLine(adviser.name, adviser.probability)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <Button onClick={() => onForecast(value / 100)}>Lock in {value}%</Button>
    </div>
  );
}
```

Design notes:
- "Compare with your advisers" is a disclosure button. It keeps a stable name and toggles `aria-expanded`, and pressing it again hides the marks. Because it stays in the DOM after the reveal, keyboard focus is never lost.
- `#adviser-estimates` is always rendered, so `aria-controls` always points at an element that exists.
- The `aria-live` paragraph is also always rendered, so screen readers announce the sentence when the estimates appear. The caption above it is a conditional sibling in its own slot, so the live paragraph is never remounted.
- `firstGuess` is set only on the first reveal. It holds the slider value if the player had moved the slider by then, and `null` if not; `undefined` means they have not compared yet. So "You said N%" keeps reporting the gut feel from before comparing, and "You compared before moving the slider." stays true after the player moves it. "Lock in" always follows the slider. `moved` is set by the slider's own change handler, so pressing Compare straight after "Continue to your forecast" never claims the default of 50 as the player's guess.
- There is no `useEffect` and no setState during render, which satisfies the react-hooks 7 rules.
- The eyebrow icon and its "FORECAST" label are dropped, because the h2 says what the step is.
- The copy under the question no longer says "scored" or "scores". "You will see the answer, and how your guess and your advisers’ compared with it, at the end of the game" and "how close each of them came" keep the end-of-game comparison without the quiz framing the handoff warns against ("a knowledge exam or a score-maximising exercise"). It says the answer comes at the end because on questions settled by a hidden draw, such as the Deepfake Election's, no headline in play ever reports it. The debrief's calibration panel is unchanged.
- `ESTIMATES_CAPTION` replaces HEAD's "Each adviser has a track record, and each is sometimes wrong. You will see their scores at the end." It moves above the sentence so that it opens the group of figures (DECISIONS F12), and it drops "wrong" and "scores".

Hidden-information check:
- The marks show `ctx.adviserForecasts`, which the old list already showed and which `displayed()` passes through.
- There is no average, consensus, bias-corrected or truth mark.
- Nothing reads `halfWidth`, `truth`, `history` or `debrief`.

**Step 4: Run it and watch it pass.**

```bash
npx tsc --noEmit -p . && npx eslint src/ui e2e
npx playwright test e2e/engagement.spec.ts e2e/polish.spec.ts e2e/crisis.spec.ts
```

Expected:
- All tests pass: 8 in the "briefing and forecast" block so far, both axe walks (light and dark), the keyboard test and the crisis tests.
- `e2e/play.ts` `toDecision` still works unchanged. It fills the single `role=slider` and clicks `/^Lock in/` without revealing anything.

**Step 5: Commit.**

```bash
git add src/ui/components/ForecastScale.tsx src/ui/screens/Forecast.tsx src/ui/theme.css e2e/engagement.spec.ts e2e/polish.spec.ts
git commit -m "feat(ui): forecast gut feel first, then compare with advisers on the slider's own scale"
```

---

### Task 10.7: `BriefingRecap` at the foot of the forecast and decision steps

**Files:**
- Create: `src/ui/components/BriefingRecap.tsx`
- Modify: `src/ui/screens/Forecast.tsx` (one import; one element after "Lock in")
- Modify: `src/ui/screens/Decision.tsx` (one import; one element after the Confirm button)
- Test: `e2e/engagement.spec.ts`, `e2e/polish.spec.ts` (axe walk)

**Step 1: Write the failing test.**

In `e2e/engagement.spec.ts`, insert directly below `test.describe("briefing and forecast", () => {`:

```ts
  const RECAP = "Look again at the briefing and your advisers";
```

Insert these two tests before the final `});` of the describe block:

```ts

  test("the briefing can be read again, folded, on the forecast and decision steps", async ({ page }) => {
    await startGame(page, "RECAP-1");
    const stances = await page.getByRole("region", { name: "Advisers" }).locator("article blockquote").allInnerTexts();
    expect(stances).toHaveLength(4);

    await toForecast(page);
    const recap = page.locator("#briefing-recap");
    await expect(recap).not.toHaveAttribute("open");
    await recap.getByText(RECAP).click();
    await expect(recap.locator("article blockquote")).toHaveText(stances);
    await expect(recap.getByText(/Puts the chance at \d+%/)).toHaveCount(0); // no estimates before the player's own forecast
    await expect(recap.getByText(/^Under this game’s assumptions, these are their forecasts for this turn’s question: /)).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("region", { name: "Assessment" })).toHaveCount(1);

    await page.getByRole("button", { name: LABEL.lockIn }).click();
    await expect(page.getByRole("group", { name: LABEL.decisionGroup })).toBeVisible();
    await expect(recap).not.toHaveAttribute("open"); // a new step, so a new, folded recap
    await recap.getByText(RECAP).click();
    await expect(recap.locator("article blockquote")).toHaveText(stances);
    await expect(recap.getByText(/Puts the chance at \d+%/)).toHaveCount(4); // the forecast is locked now
    await expect(recap.getByText(/^Under this game’s assumptions, these are their forecasts for this turn’s question: /)).toBeVisible(); // what the chance is of
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  });

  test("nothing scrolls sideways on a phone with the estimates or the recap open", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await startGame(page, "PHONE-FORECAST");
    await toForecast(page);
    await page.getByRole("button", { name: COMPARE }).click();
    await page.getByText(RECAP).click();
    expect(await overflow(), "forecast with the estimates and the recap open").toBeLessThanOrEqual(0);

    // The decision step with the recap open adds the split, four cards and their estimates.
    await page.getByRole("button", { name: LABEL.lockIn }).click();
    await expect(page.getByRole("group", { name: LABEL.decisionGroup })).toBeVisible();
    await page.getByText(RECAP).click();
    await expect(page.locator("#briefing-recap")).toHaveAttribute("open", "");
    expect(await overflow(), "decision with the recap open").toBeLessThanOrEqual(0);
  });
```

In `e2e/polish.spec.ts`, in the axe walk, replace

```ts
    await expectNoSeriousViolations(page, "forecast with the advisers' estimates shown");
```

with

```ts
    await expectNoSeriousViolations(page, "forecast with the advisers' estimates shown");
    await page.getByText("Look again at the briefing and your advisers").click();
    await expectNoSeriousViolations(page, "forecast with the briefing recap open");
```

and replace

```ts
    await expectNoSeriousViolations(page, "decision");
```

with

```ts
    await expectNoSeriousViolations(page, "decision");
    await page.getByText("Look again at the briefing and your advisers").click();
    await expectNoSeriousViolations(page, "decision with the briefing recap open");
```

**Step 2: Run it and watch it fail.**

```bash
npx playwright test e2e/engagement.spec.ts -g "recap open|read again"
```

Expected: 2 failed, because no recap exists yet.
- "the briefing can be read again…" fails after 5 s at `expect(recap).not.toHaveAttribute("open")` with `element(s) not found` (there is no `#briefing-recap` yet).
- "nothing scrolls sideways…" times out after 30 s waiting to click "Look again at the briefing and your advisers".

The regular expressions match the curly apostrophes in "game’s" and "turn’s", which `BriefingContent` writes as `&rsquo;` (Task 10.4).

**Step 3: Implement.**

Create `src/ui/components/BriefingRecap.tsx`:

```tsx
import { BriefingContent } from "./BriefingContent";
import type { PublicScenario } from "../../content";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  scenario: PublicScenario;
  /** Show the advisers' forecasts: only on the decision step, once the player's own is locked. */
  showForecasts?: boolean;
}

/**
 * The briefing again, folded, at the foot of the forecast and decision steps
 * (observation 6). It sits after the step's own buttons so the keyboard order of
 * the step is unchanged, it adds no h1, and closed it keeps its regions out of the
 * accessibility tree. The step stays mounted, so the slider or selected option
 * survives, and the crisis clock does not rewind.
 */
export function BriefingRecap({ view, scenario, showForecasts = false }: Props) {
  return (
    <details id="briefing-recap" className="border border-rule p-4">
      <summary className="cursor-pointer font-semibold">Look again at the briefing and your advisers</summary>
      <div className="mt-4">
        <BriefingContent view={view} scenario={scenario} showForecasts={showForecasts} />
      </div>
    </details>
  );
}
```

In `src/ui/screens/Forecast.tsx`, replace

```tsx
import { Button } from "../components/Button";
```

with

```tsx
import { BriefingRecap } from "../components/BriefingRecap";
import { Button } from "../components/Button";
```

and replace

```tsx
      <Button onClick={() => onForecast(value / 100)}>Lock in {value}%</Button>
    </div>
```

with

```tsx
      <Button onClick={() => onForecast(value / 100)}>Lock in {value}%</Button>

      <BriefingRecap view={view} scenario={scenario} />
    </div>
```

In `src/ui/screens/Decision.tsx`, replace

```tsx
import { Button } from "../components/Button";
```

with

```tsx
import { BriefingRecap } from "../components/BriefingRecap";
import { Button } from "../components/Button";
```

This line appears once in the file, and Phase 8 does not change it. Line 1 reads `import { useEffect, useRef, useState } from "react";` after Phase 8's crash fix (Task 8.3); leave it as it is.

Then make the recap the last child of the component's root `<div className="space-y-6">`, straight after the Confirm `<Button>` element. After Phase 8's crash fix (which renamed the confirmable selection `chosen`), the file ends like this:

```tsx
      <Button disabled={chosen === null} onClick={() => chosen && onDecide(chosen)}>
        {chosen ? `Confirm option ${chosen}` : "Choose an option"}
      </Button>
    </div>
  );
}
```

It becomes:

```tsx
      <Button disabled={chosen === null} onClick={() => chosen && onDecide(chosen)}>
        {chosen ? `Confirm option ${chosen}` : "Choose an option"}
      </Button>

      {/* After Confirm, so the keyboard order above is unchanged. The forecast is locked, so the advisers' estimates can show. */}
      <BriefingRecap view={view} scenario={scenario} showForecasts />
    </div>
  );
}
```

If the button's lines read differently, leave them exactly as they are and insert only the blank line, the comment and `<BriefingRecap … />` between `</Button>` and the root's closing `</div>`.

Why these contracts still hold:
- **Exactly one h1.** `BriefingContent` has only h2 and h3 headings.
- **One `role=slider`, first after the h1.** The recap follows "Lock in" and holds no range input.
- **"Commission analysis", then the option group.** The recap follows Confirm.
- **A single region "Assessment".** The forecast and decision steps have no other "Assessment" region, and the briefing screen, where `polish.spec.ts` reads that region, has no recap.
- **Clock and selections survive.** `stepIndex` and `stepKey` do not change, so the crisis clock still reads 3:00 on the decision step, and Decision's `selected` state survives opening the recap.
- **Unique text on the decision step.** In `crisis.spec.ts`, "Open to you because of your investment in Provenance infrastructure." and "Locked: needs Provenance infrastructure at level 2." appear only in Decision's own option list. The recap lists open options only, using the briefing wording.

**Step 4: Run it and watch it pass.**

```bash
npx tsc --noEmit -p . && npx eslint src/ui e2e
npx playwright test
```

Expected: every e2e test passes, including 10 tests in the "briefing and forecast" block and both axe walks with the three new scans.

**Step 5: Commit.**

```bash
git add src/ui/components/BriefingRecap.tsx src/ui/screens/Forecast.tsx src/ui/screens/Decision.tsx e2e/engagement.spec.ts e2e/polish.spec.ts
git commit -m "feat(ui): fold the briefing and advisers into the forecast and decision steps"
```

---

### Task 10.8: The rail's past "Briefing" step opens the recap

This task takes up the optional rail link. On the forecast and decision steps, the rail's "01 Briefing" entry becomes a link to `#briefing-recap`. Its click handler unfolds the `<details>`, scrolls to it and moves focus to its summary. With JavaScript unavailable it still works as an in-page link. The rail stays before `<main>` in the DOM, so Tab from the focused h1 never reaches it, and the keyboard contracts are unchanged.

The prop names and shape match Phase 13's debrief table of contents, so the two phases compose: `StepsRail` takes `hrefs?: readonly string[]` (anchors by step index) and `AppShell` takes `stepHrefs`. Phase 13 Task 13.7 builds on this: it passes debrief anchors through the same `stepHrefs` and extends only `unfold`, so it must keep the rule that the current step is never a link and this task's e2e test "the rail's past Briefing step opens the folded briefing".

**Files:**
- Modify (replace in full): `src/ui/shell/StepsRail.tsx`
- Modify: `src/ui/shell/AppShell.tsx` (an optional `stepHrefs` prop, passed through as `hrefs`)
- Modify: `src/ui/App.tsx` (the turn `AppShell`: add `stepHrefs`, and relabel its skip link)
- Test: `e2e/engagement.spec.ts`

**Step 1: Write the failing test.** Insert before the final `});` of the describe block:

```ts

  test("the rail's past Briefing step opens the folded briefing", async ({ page }) => {
    await startGame(page, "RECAP-2");
    const rail = page.getByRole("navigation", { name: "Steps in this turn" });
    await expect(rail.getByRole("link")).toHaveCount(0); // nothing to go back to on the briefing itself

    await toForecast(page);
    const link = rail.getByRole("link", { name: /Briefing/ });
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(24); // WCAG 2.2 target size
    await link.click();
    await expect(page.locator("#briefing-recap")).toHaveAttribute("open", "");
    await expect(page.locator("#briefing-recap > summary")).toBeFocused();

    await page.getByRole("button", { name: LABEL.lockIn }).click();
    await expect(page.getByRole("group", { name: LABEL.decisionGroup })).toBeVisible();
    await rail.getByRole("link", { name: /Briefing/ }).click();
    await expect(page.locator("#briefing-recap")).toHaveAttribute("open", "");
    await expect(page.locator("#briefing-recap > summary")).toBeFocused();
    // The skip link leads to the step itself, which on this step is not the briefing.
    await expect(page.getByRole("link", { name: "Skip to the main content" })).toHaveCount(1);
  });
```

**Step 2: Run it and watch it fail.**

```bash
npx playwright test e2e/engagement.spec.ts -g "rail's past Briefing"
```

Expected: 1 failed. `locator.boundingBox` times out after 30 s, because the rail has no link.

**Step 3: Implement.**

Replace `src/ui/shell/StepsRail.tsx` in full:

```tsx
import type { MouseEvent } from "react";

interface Props {
  steps: readonly string[];
  activeIndex: number;
  label: string;
  /** Anchors by step index. A step with one becomes a link, unless it is the current step. */
  hrefs?: readonly string[];
}

/** A rail link to a folded <details> unfolds it, scrolls to it and moves focus to its summary. Any other target is left to the browser. */
function unfold(event: MouseEvent<HTMLAnchorElement>) {
  const id = event.currentTarget.hash.slice(1);
  const target = id ? document.getElementById(id) : null;
  if (!(target instanceof HTMLDetailsElement)) return;
  event.preventDefault();
  target.open = true;
  target.scrollIntoView({ block: "start" });
  target.querySelector<HTMLElement>(":scope > summary")?.focus({ preventScroll: true });
}

/** Compact inspector index. The active step is an inverted label; a step with an anchor is a link to it. */
export function StepsRail({ steps, activeIndex, label, hrefs }: Props) {
  return (
    <nav aria-label={label} className="border-b border-rule lg:border-b-0 lg:border-r">
      <ol className="flex flex-wrap gap-1 px-3 py-2 lg:sticky lg:top-0 lg:flex-col lg:gap-0 lg:px-3 lg:py-4">
        {steps.map((step, index) => {
          const active = index === activeIndex;
          const href = active ? undefined : hrefs?.[index];
          const text = (
            <>
              <span className="mr-2 tabular-nums">{String(index + 1).padStart(2, "0")}</span>
              {step}
            </>
          );
          return (
            <li
              key={step}
              aria-current={active ? "step" : undefined}
              className={`font-mono text-xs tracking-wide ${active ? "bg-ink px-2 py-1 text-paper" : href ? "" : "px-2 py-1 text-muted"}`}
            >
              {href ? (
                // min-h-6: at least 24px tall, the WCAG 2.2 target size.
                <a href={href} onClick={unfold} className="inline-flex min-h-6 items-center px-2 text-accent underline">
                  {text}
                </a>
              ) : (
                text
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

`details.open` is not a React-controlled prop here (`BriefingRecap` never passes `open`), so setting it from an event handler is safe. The handler runs on a click, not in an effect. It reads the target from the link's own `hash`, so it works for any rail link, and leaves any target that is not a `<details>` to the browser.

In `src/ui/shell/AppShell.tsx`, as Phase 9 left it, make three localized edits:
1. In `interface Props`, directly below `  stepsLabel?: string;`, add:
   ```ts
     /** Anchors for the steps, by index; a step with one becomes a link (see StepsRail). */
     stepHrefs?: readonly string[];
   ```
2. In the parameter list, replace
   ```tsx
   export function AppShell({ chrome = {}, steps, stepIndex = 0, stepsLabel = "Steps", status, skip, children }: Props) {
   ```
   with
   ```tsx
   export function AppShell({ chrome = {}, steps, stepIndex = 0, stepsLabel = "Steps", stepHrefs, status, skip, children }: Props) {
   ```
3. Replace
   ```tsx
           {steps && <StepsRail steps={steps} activeIndex={stepIndex} label={stepsLabel} />}
   ```
   with
   ```tsx
           {steps && <StepsRail steps={steps} activeIndex={stepIndex} label={stepsLabel} hrefs={stepHrefs} />}
   ```

If any of these lines differs, for example because Phase 9's rewrite differs from its plan, make the equivalent change: declare an optional `stepHrefs`, destructure it, and pass it to `StepsRail` as `hrefs`.

In `src/ui/App.tsx`, in the turn shell's `<AppShell …>` (the one with `stepsLabel="Steps in this turn"`), replace

```tsx
      stepsLabel="Steps in this turn"
```

with

```tsx
      stepsLabel="Steps in this turn"
      // On the forecast and decision steps the briefing is folded at the foot of the page (BriefingRecap).
      stepHrefs={stage === "play" && (view.phase === "forecast" || view.phase === "decide") ? ["#briefing-recap"] : undefined}
```

In the same `<AppShell …>`, replace

```tsx
      skip={{ href: "#main", label: "Skip to the briefing" }}
```

with

```tsx
      skip={{ href: "#main", label: "Skip to the main content" }}
```

The skip link jumps to `<main id="main">` (`src/ui/shell/Artboard.tsx`), which on the forecast and decision steps holds that step, not the briefing. Now that those steps also have a folded briefing and a rail "Briefing" link, a screen-reader user would otherwise hear two "briefing" targets that lead to different places. Phase 12 uses the same wording on its own shell. No test used the old label (`grep -rn "Skip to the briefing" e2e tests` prints nothing).

Index 0 is always "Briefing": `visibleSteps` only ever drops "Investment". A one-entry array gives an anchor to step 0 only; every other `hrefs[index]` is `undefined`. Title, Debrief, Invest and News pass no anchors, so their rails are unchanged. Phase 13 passes its own `stepHrefs` on the debrief shell.

**Step 4: Run it and watch it pass.**

```bash
npx tsc --noEmit -p . && npx eslint src/ui e2e
npx playwright test e2e/engagement.spec.ts e2e/polish.spec.ts e2e/crisis.spec.ts
```

Expected: all pass, 11 tests in the "briefing and forecast" block. The keyboard test in `polish.spec.ts` still passes, because the rail comes before `<main>` and focus starts from the h1.

**Step 5: Commit.**

```bash
git add src/ui/shell/StepsRail.tsx src/ui/shell/AppShell.tsx src/ui/App.tsx e2e/engagement.spec.ts
git commit -m "feat(ui): the rail's past Briefing step opens the folded briefing"
```

---

### Task 10.9: Log the decisions

**Files:**
- Modify: `DECISIONS.md` (section F: the D4 row, the D5 row, one new row)

**Step 1: Find the rows.** Phase 8 logged D4 and D5 in section F.

```bash
grep -n "Compare with your advisers" DECISIONS.md   # the D4 row
grep -n "Cares about" DECISIONS.md                 # the D5 row
grep -o '^| F[0-9]*' DECISIONS.md | tail -1        # the last F number, for the new row
```

Expected: one line each. If either of the first two prints nothing, Phase 8's row uses other wording. Find the row for "gut feel first" (D4) or "Backs option" (D5) by eye.

**Step 2: Check nothing is logged yet.**

```bash
grep -c "Implemented in Phase 10" DECISIONS.md
```

Expected: `0`.

**Step 3: Edit.**

Phase 8's cells end without a full stop (in its draft, F3's Decision cell ends "The first guess is not stored", its Why cell "than the disagreement", and F4's Decision cell "until a playtest asks for them"). So in each of the three appends below: if the cell does not already end with a full stop, add one and a space, then the text, before the cell's closing ` |`. For example, `…The first guess is not stored |` becomes `…The first guess is not stored. **Implemented in Phase 10.** … |`.

(a) In the **D4 row**, append this to the end of its Decision cell:

> **Implemented in Phase 10.** The slider draws its own square thumb at a fixed width (`.forecast-scale` in `src/ui/theme.css`), so the adviser marks line up with it; in forced colours (Windows High Contrast) the track and thumb opt out of forcing and the marks' stems are borders, so all stay visible. Marks closer than 10 points stack, because a 6-point gap overlaps at 360px. The slider's `aria-valuetext` reads, for example, "35%, unlikely", using seven bands (0 certain not to happen, 1–5 almost certainly not, 6–39 unlikely, 40–60 a toss-up, 61–94 likely, 95–99 almost certain, 100 certain to happen), and the same words sit under the track. The step asks "How likely do you think this is?" above the question and says "We will find out by {month}." The final question, a draw by the game's own simulation (B10), says "We would only find out by October 2034, after the game ends, so the game's simulation settles it when you finish." It avoids "the model", which on that turn means the AI system in the question. The copy says the player sees the answer, and how the guesses compared with it, at the end of the game, not that forecasts are "scored"; some questions are settled by hidden draws that no headline reports during play. If the player compares before moving the slider, the sentence reads "You compared before moving the slider. Your advisers range from A% to B%.", because the default of 50 is not their guess; it describes the moment of comparing, so it stays true if they move the slider afterwards. The revealed estimates open with a caption, "Under this game's assumptions, these are your advisers' own estimates, not facts, and each adviser is sometimes off. At the end you will see how close each of them came." The default stays 50 with Lock in enabled, so the spec's "slider left at 50%" playtest metric still measures engagement.

In the same row's Why cell, append:

> This amends the spec's risk-register mitigation for "Forecasting feels like homework" (Section 13: "adviser estimates shown beside it as anchors"). The estimates are still offered, now on the slider's own scale, but only after the player asks to compare, so the first number is the player's own. The marks show the same numbers the old list showed. On event questions those estimates already centre on odds that depend on the hidden world (B27), and a common scale makes that easier to see; no average, consensus, bias-corrected or "true value" mark is drawn. The sentence keeps D4's wording; the group it belongs to is introduced by a caption beginning "Under this game's assumptions" (F12), because the estimates are figures the engine generates (the true chance, shifted by the adviser's bias, plus noise). On the decision step's recap, the line naming the forecast question opens the advisers' "Puts the chance at N%" figures the same way.

(b) In the **D5 row**, append to the end of its Decision cell:

> **Implemented in Phase 10.** The "who backs what" split replaces the briefing's separate options list and comes after the four adviser cards, so the reader meets each adviser before seeing their name against an option. It is headed "Who backs what", and each open option says "Backed by …" or "No adviser backs this option." An option opened by investment that nobody backs says "Your advisers' recommendations do not include this option." instead: every such option in the content is unbacked, because the advisers' recommendations were written among the base options, and "No adviser backs this option." would read as a verdict on the player's preparation. The lever and visible-effects parenthetical is gone from the briefing; it stays on the decision step. The cards drop the "Adviser file" label. A unit test checks that no adviser backs an option that can be locked, so the split always names all four. The split does not cut repetition on turn 1: an option's text appears once in the split and once on each backer's card, three times for an option with two backers. Measured at turn 1 (seed `TEST-SEED1`), the briefing grows from 290 to 326 words and "Continue to your forecast" moves 82–208px lower (375/726/1280px wide), because each card now carries its lens and the full text of the option it backs. The folded "What you have been told so far" file (Phase 10) saves up to about 150–350 words by the final turn. The lighter card is a one-line switch: delete the `recommendsText=` line in `src/ui/components/BriefingContent.tsx`, and each card says only "Backs option A." (the Task 10.4 e2e pattern `/Backs option [A-E]: /` then becomes `/Backs option [A-E][:.]/`).

(c) **Add a row** at the end of section F's table. Number it one after the last F number found in Step 1; this template writes it as `F<n>`, so replace `<n>`:

```markdown
| F<n> | Looking back at the briefing while forecasting and deciding (engagement handoff observation 6) | The briefing body (`BriefingContent`) is shown again inside a folded `<details id="briefing-recap">`, "Look again at the briefing and your advisers", at the foot of the forecast step (after Lock in) and the decision step (after Confirm). On the decision step the cards also show each adviser's estimate ("Puts the chance at N%"), because the player's forecast is locked, and a line under the advisers' heading, beginning "Under this game's assumptions" (F12), names the forecast question the estimates answer; on the forecast step they do not. The rail's past "Briefing" step becomes a link that unfolds the recap and moves focus to it. The turn's skip link now reads "Skip to the main content", because on these steps it leads to the step, not the briefing. On the briefing itself, "What you have been told so far" is folded behind a report count; the news screen's "Findings delivered this turn" list stays open. There is no stage switch: the step stays mounted, so the slider value and the selected option survive and the crisis clock does not rewind | Keeps adviser context in reach without an extra step. The recap follows each step's buttons, so the keyboard contracts hold (the slider first on the forecast; Commission analysis, then the options on the decision). Folded, it adds no duplicate regions; it never adds an h1 |
```

**Step 4: Check.**

```bash
grep -c "Implemented in Phase 10" DECISIONS.md   # expect: 2
grep -n "briefing-recap" DECISIONS.md            # expect: the new F row
```

Open `DECISIONS.md` and check that each edited row is still a single line with the same number of `|` separators as the header row.

**Step 5: Commit.**

```bash
git add DECISIONS.md
git commit -m "docs: log the forecast reveal, plain adviser cards and the briefing recap"
```

---

### Phase 10 gate

Run every command from the repository root. CI does not run (billing block, D10), so this local run is the gate.

```bash
lsof -i :4173                                  # expect: no output (a stale preview server would be reused)
npm run lint                                   # expect: no errors
npm run test                                   # expect: all pass; 43 more tests than at the Phase 9 gate
                                               #   (tests/ui/play-copy.test.ts 36, tests/ui/scale.test.ts 7)
npm run balance                                # expect: passes, with the same pooled shares as at the Phase 9 gate (no content change)
npm run build                                  # expect: tsc clean, vite build succeeds
du -sk dist                                    # expect: under 16384
npm run e2e                                    # expect: all pass, 11 new tests in "briefing and forecast";
                                               #   both axe walks include the 3 new scans
git diff --stat phase-10-start -- src/engine src/content   # expect: no output (engine and content untouched)
grep -nE "published|defaults|assumptionsOf|halfWidth|view\.(truth|history|debrief)|oddsAtTheTime" \
  src/ui/copy.ts src/ui/scale.ts \
  src/ui/components/AdviserCard.tsx src/ui/components/AdviserSplit.tsx src/ui/components/BriefingContent.tsx \
  src/ui/components/BriefingRecap.tsx src/ui/components/ForecastScale.tsx src/ui/components/IntelFile.tsx \
  src/ui/screens/Briefing.tsx src/ui/screens/Forecast.tsx src/ui/shell/StepsRail.tsx
                                               # expect: no output (no hidden data on play screens)
git tag -d phase-10-start
```

What must be true:
- **Advisers.** Each adviser card shows name · role, "Cares about: {lens}", "Backs option X: {text}", the stance as a quote, and "Remembers: …" when a memory line applies. After the cards, the briefing lists every open option with its backers, including options nobody backs. An option opened by investment that nobody backs says "Your advisers' recommendations do not include this option." No lever or effects parenthetical remains on the briefing.
- **Forecast.** The slider is the only `role=slider` and the first tab stop after the h1. It defaults to 50. `aria-valuetext` reads "N%, {words}", and only 0% and 100% say "certain". The final question says the game's simulation settles it and never says "the model".
- **Compare.** "Compare with your advisers" comes after the slider and reveals four marks on the same scale, a caption beginning "Under this game's assumptions", and "You said N%. Your advisers range from A% to B%.". A player who compares before moving the slider reads "You compared before moving the slider. …", never "You said 50%.". "Lock in N%" works whether or not the player compares. No average mark.
- **Copy.** No new sentence on these screens says "wrong" or "scored" (DECISIONS F12); the analysts' caveat and the estimates caption live in `src/ui/copy.ts`, where the copy-rules test reads them.
- **Recap.** The recap opens on the forecast and decision steps, contains the advisers' stances, adds no h1, and never creates a second "Assessment" region. It shows estimates only on the decision step, under a line that begins "Under this game's assumptions" and names the forecast question.
- **Accessibility.** axe finds no violations at any impact, best-practice rules included (DECISIONS B42), in light and dark, on the briefing, on the forecast with the estimates shown and with the recap open, on the decision with the recap open, and on a turn-2 briefing with the earlier-reports file open.
- **Forced colours.** With `emulateMedia({ forcedColors: "active" })` the slider's track and the adviser marks' stems are still drawn (the e2e test "in forced colours the track and the marks' stems are still drawn").
- **Skip link.** The turn's skip link reads "Skip to the main content".
- **Layout.** No horizontal overflow at 360px on the forecast step with the estimates and the recap open, or on the decision step with the recap open.

Then update `docs/plan.md`. Phase 8 set out the block: status ⬜ not started, 🟨 in progress, 🟩 done. Progress counts step lines only, which are indented two spaces; phase heading lines do not count.
1. In the **Phase 10: Briefing and forecast** block, change the heading line `- [ ] 🟨 **Phase 10: Briefing and forecast**` (Task 10.1 set 🟨) to `- [x] 🟩 **Phase 10: Briefing and forecast**`, and each of its four step lines from `- [ ] ⬜` to `- [x] 🟩`.
2. Count the done steps:
   ```bash
   grep -cE '^  - \[x\]' docs/plan.md
   ```
   The result should be exactly 4 more than before this edit.
3. On the **Overall Progress** line, set the done count to that number and keep the total Phase 8 set: 63, plus 2 only if the designer has approved optional Phase 14. Recompute the rounded percentage, in the format Phase 8 used. For example, if the Phase 9 gate left `46 of 63`, this gate makes it `50 of 63`, `79%`.
4. Commit the branch; do not push. Per F9 the branch is pushed at the Phase 15 gate, or earlier if the designer asks. D10: no merge to `main` and no deploy without the designer.
   ```bash
   git add docs/plan.md
   git commit -m "docs(plan): Phase 10 gate green"
   ```

No designer stop at this gate. The designer reviews the opening and this representative turn at the Phase 11 gate. The Phase 11 review script must include these four items; if its STOP list does not name them, add them there:
1. **Turn-1 reading length.** The briefing grows from 290 to 326 words, and a twice-backed option's text is printed three times (Task 10.9(b)). The lighter card, "Backs option A.", is the one-line switch described there.
2. **The hidden-world signal.** The advisers' estimates, now on one scale with a stated range, make the signal about the hidden world easier to read on event questions. On turn 1 the event odds are 50% in an offence-led world and 15% otherwise (`src/content/events.json`, `infra-attack`), and each estimate is those odds plus the adviser's bias and noise (`src/engine/reduce.ts`: `const estimate = truth + shift + (draw.value * 2 - 1) * adviser.noise;`). DECISIONS B27 allows this by design, but the common scale makes it plainer.
3. **Prepared options that no adviser backs.** The wording "Your advisers' recommendations do not include this option." (Task 10.2).
4. **Where the split sits.** It comes after the adviser cards, so the backers are met first. The alternative is to keep it before the cards and give each backer's role in it, for example "Backed by Dr Maya Shah (Chief Scientist) and Amelia Chen (Economic Adviser).", which adds words.

For Phase 15, which reuses this phase's strings: its sweep clicks "Compare with your advisers" without moving the slider, so the sentence it waits for begins "You compared before moving the slider.", not "You said". Its `COMPARED` constant (`/^You said \d+%\. Your advisers/` in the Phase 15 draft) must accept both, for example `/Your advisers (range from|all say)/`, or the sweep must move the slider (`await page.getByRole("slider").fill("35")`) before it compares. The split's heading is "Who backs what", as Phase 15's playtest checklist already says.


---

## Phase 11: Decision, investment and consequences

**Goal:** make one representative turn legible to a newcomer: a live preview of what an option costs and what officials expect, a standing-investment ladder that looks and reads differently from the policy cards, and a consequences screen that separates what you chose, what the world noticed, what you can measure and what is still unknown, all built from `displayed()` and `publicContent()` only. **Handoff items addressed:** observations 3, 4 and 5; proposals "Make consequences memorable" and "Make preparation visible"; the approachability question "choose without specialist knowledge" (glossary); the plan's decisions D6, D11, D12 and D13, which Phase 8 logged as rows F5, F10, F11 and F12 of section F in `DECISIONS.md` (Phase 8 numbered the plan's D2 to D13 as F1 to F12; code comments and new rows cite the F numbers, because in `DECISIONS.md` "D1" to "D5" are the provisional-numbers subsections). **Depends on:** Phase 8 (`LABEL` in `e2e/play.ts`, waiting `finishTurn`, the stale-selection crash fix in `Decision.tsx` with its regression test in `e2e/regressions.spec.ts`, `tests/content/public.test.ts`, section F of `DECISIONS.md`, the Phase 8 to 15 blocks in `docs/plan.md`), Phase 9 (`e2e/engagement.spec.ts` exists; `LABEL.start` is "Try your first decision"), Phase 10 (`src/ui/copy.ts` exists; `src/ui/components/BriefingRecap.tsx` exists and is the last child of `Decision.tsx`'s root, after the Confirm button; its e2e tests "the briefing can be read again…" and "the rail's past Briefing step opens the folded briefing" are in `e2e/engagement.spec.ts`).

Names this phase leaves for later phases: `consequencesOf(before, after, resolved, pub)` in `src/ui/consequences.ts` returns `TurnConsequences` with `chose: { id, text, costPaid, boughtAnalysis } | null`, `unknown: { forecast, question, resolvesBy } | null` (no `unclear` field: the briefing's evidence-panel text stays on the briefing, see Task 11.5), and `measured` as a flat array of all five exact-metric rows `{ metric, before, after, delta }`. `src/ui/copy.ts` exports no `investedLine`, and no phase needs one (the investment sentence here is `investmentPointLine`).

Ground rules for every task in this phase:

- Engine untouched. The only file added under `tests/engine/` is a test. Nothing under `src/engine/**` changes.
- New helpers (`src/ui/preview.ts`, `src/ui/preparation.ts`, `src/ui/consequences.ts`) import only types from `../engine` and `../content`, and values from `./format`. They never import `./useGame`, so Vitest can load them in Node.
- No component or helper reads `Estimate.halfWidth`, `view.truth`, `view.debrief`, `view.history`, `oddsAtTheTime` or `succeeded`. The News screen never reads `view.current` (it is already the next turn).
- Line numbers quoted below are at commit `a11ef34` (before Phases 8 to 10). Earlier phases may have moved them; always find the quoted text, not the number.
- Run every command from the repository root. If `node_modules` is missing, run `npm ci` and `npx playwright install chromium` first. Before any `npm run e2e`, check that nothing is listening on port 4173 (`lsof -i :4173` prints nothing); `playwright.config.ts` reuses a running server, and a stale one would test an old bundle.
- The investment ladder never says whether the unscheduled crisis is still to come or has passed. Late in a run that would pin its timing: on turn 6 of 8, with the final decision still ahead, "still ahead" can only mean turn 7 (non-negotiable 6; `DECISIONS.md` B6).

### Task 11.1: Publish the Political Capital rules and the track bonuses

**Depends on:** Phase 8 (`tests/content/public.test.ts` and its hidden-key test).

**Files:**
- Modify: `src/content/public.ts` (the `PublicContent` interface, lines 81-93, and `publicContent()`, lines 95-106)
- Modify: `src/content/index.ts` (the `export type` line, line 8)
- Test: `tests/content/public.test.ts` (created in Phase 8; append one `describe` block)

**Step 1: Write the failing test.** Append this block at the end of `tests/content/public.test.ts`. The file already imports `describe`, `expect` and `test` from `vitest` and `loadContent` and `publicContent` from `../../src/content` (Phase 8); add any of those names that are missing to the existing import lines. If a Phase 8 test in this file pins the exact list of top-level keys of `publicContent()`, add `"rules"` and `"trackBonuses"` to that list in this same step.

```ts
describe("the public rules and track bonuses (Phase 11)", () => {
  const content = loadContent();
  const pub = publicContent(content);
  const rules = content.config.politicalCapital;

  test("publish the Political Capital rules field by field, without the analysis cost", () => {
    expect(pub.rules).toEqual({
      perTurn: rules.perTurn,
      carryCap: rules.carryCap,
      trustBonusAt: rules.trustBonusAt,
      trustPenaltyAt: rules.trustPenaltyAt,
      windowTurns: rules.windowTurns,
      windowDiscount: rules.windowDiscount,
      windowMinCost: rules.windowMinCost,
      boomEconomyAt: rules.boomEconomyAt,
      boomSurcharge: rules.boomSurcharge,
    });
    expect(Object.keys(pub.rules)).not.toContain("infoCost");
    expect(pub.rules.windowDiscount).toBe(2);                      // the number News used to hard-code
  });

  test("publish each track's per-level bonus as a copy of the config", () => {
    expect(pub.trackBonuses).toEqual({
      evaluation: { stateCapacity: 4 },
      provenance: { publicTrust: 1 },
      diplomacy: { cooperation: 4 },
      defensiveCyber: { nationalSecurity: 2 },
    });
    expect(pub.trackBonuses.evaluation).not.toBe(content.config.trackBonuses.evaluation);
  });

  test("the new fields carry nothing hidden", () => {
    const json = JSON.stringify({ rules: pub.rules, trackBonuses: pub.trackBonuses });
    for (const key of ["drift", "band", "profiles", "stance", "hiddenEffects", "conditionalEffects", "probabilityModifiers", "trackModifiers", "mitigations", "base"]) {
      expect(json).not.toContain(`"${key}"`);
    }
  });
});
```

**Step 2: Run it and watch it fail.**

```bash
npx vitest run tests/content/public.test.ts
```

Expected: the two new tests fail with `AssertionError: expected undefined to deeply equal { perTurn: 5, carryCap: 3, …(7) }` and `expected undefined to deeply equal { …(4) }`. Phase 8's tests in the file still pass.

**Step 3: Implement.** In `src/content/public.ts`, insert this block immediately above `export interface PublicContent {`:

```ts
/**
 * The Political Capital and pricing rules (spec Section 5; DECISIONS.md B30), so
 * the interface can explain a price or an income without hard-coding numbers.
 * Fixed rules, not world state. `infoCost` is exposed on its own, below.
 */
export interface PublicRules {
  perTurn: number;
  carryCap: number;
  trustBonusAt: number;
  trustPenaltyAt: number;
  windowTurns: number;
  windowDiscount: number;
  windowMinCost: number;
  boomEconomyAt: number;
  boomSurcharge: number;
}

function publicRules(rules: GameConfig["politicalCapital"]): PublicRules {
  // Field by field, so nothing added to the config later is published by accident.
  return {
    perTurn: rules.perTurn,
    carryCap: rules.carryCap,
    trustBonusAt: rules.trustBonusAt,
    trustPenaltyAt: rules.trustPenaltyAt,
    windowTurns: rules.windowTurns,
    windowDiscount: rules.windowDiscount,
    windowMinCost: rules.windowMinCost,
    boomEconomyAt: rules.boomEconomyAt,
    boomSurcharge: rules.boomSurcharge,
  };
}
```

In the `PublicContent` interface, replace

```ts
  infoCost: number;
  totalTurns: number;
}
```

with

```ts
  infoCost: number;
  totalTurns: number;
  rules: PublicRules;
  /** The bonus each standing-investment level applies once, when it is gained. */
  trackBonuses: Record<Track, Effects>;
}
```

In `publicContent()`, replace

```ts
    totalTurns: content.sequence.length + 1,
  };
}
```

with

```ts
    totalTurns: content.sequence.length + 1,
    rules: publicRules(content.config.politicalCapital),
    trackBonuses: {
      evaluation: { ...content.config.trackBonuses.evaluation },
      provenance: { ...content.config.trackBonuses.provenance },
      diplomacy: { ...content.config.trackBonuses.diplomacy },
      defensiveCyber: { ...content.config.trackBonuses.defensiveCyber },
    },
  };
}
```

`GameConfig`, `Track` and `Effects` are already imported on line 5. In `src/content/index.ts`, replace

```ts
export type { Assumptions, PublicAdviser, PublicChoice, PublicContent, PublicEnding, PublicScenario } from "./public";
```

with

```ts
export type { Assumptions, PublicAdviser, PublicChoice, PublicContent, PublicEnding, PublicRules, PublicScenario } from "./public";
```

**Step 4: Run it and watch it pass.**

```bash
npx vitest run tests/content/public.test.ts && npx tsc --noEmit
```

Expected: every test in the file passes (the Phase 11 block adds 3), and `tsc` prints nothing.

**Step 5: Commit.**

```bash
git add src/content/public.ts src/content/index.ts tests/content/public.test.ts
git commit -m "feat(content): publish Political Capital rules and track bonuses (F10)"
```

### Task 11.2: Metric order, policy-area labels, effect rows and honest track milestones

**Depends on:** Task 11.1 (`pub.trackBonuses`).

**Files:**
- Modify: `src/ui/format.ts` (the engine type import, line 3; `TRACK_DETAIL`, lines 45-57; after `ADVISER_ORDER`, line 83; `formatEffects` and `percent`, lines 95-101)
- Modify: `src/ui/screens/Invest.tsx` (interim, lines 4 and 57-63: keeps the build green until Task 11.8 replaces the screen)
- Test: `tests/ui/turn-format.test.ts` (new)

**Step 1: Write the failing test.** Create `tests/ui/turn-format.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { loadContent, publicContent } from "../../src/content";
import {
  DOMAIN_LABEL, effectRows, EXACT_METRICS, formatEffects, isExactMetric, METRIC_LABEL, METRIC_ORDER, TRACK_MILESTONES, trackBonusText, TRACKS,
} from "../../src/ui/format";

const pub = publicContent(loadContent());

describe("metric order and stated effects", () => {
  test("METRIC_ORDER names every metric once, exact ones first", () => {
    expect([...METRIC_ORDER].sort()).toEqual(Object.keys(METRIC_LABEL).sort());
    expect(METRIC_ORDER.slice(0, 5)).toEqual([...EXACT_METRICS]);
    expect(METRIC_ORDER.filter(isExactMetric)).toEqual([...EXACT_METRICS]);
  });

  test("effectRows and formatEffects list stated effects in METRIC_ORDER and drop zeros", () => {
    expect(effectRows({ innovation: -3, cooperation: 5, nationalSecurity: 4, economy: 0 })).toEqual([
      { metric: "nationalSecurity", delta: 4 },
      { metric: "innovation", delta: -3 },
      { metric: "cooperation", delta: 5 },
    ]);
    expect(effectRows({})).toEqual([]);
    // An option's card uses the same order as its preview (attribution-gap A is stored innovation first).
    expect(formatEffects({ innovation: 1, nationalSecurity: 1 })).toBe("National Security +1, Innovation +1");
    expect(formatEffects({})).toBe("No immediate visible effect");
  });

  test("every policy area has a label", () => {
    const domains = new Set(Object.values(pub.scenarios).map((s) => s.domain));
    for (const domain of domains) expect(DOMAIN_LABEL[domain]).toBeTruthy();
  });
});

describe("standing-investment copy (DECISIONS.md, F11)", () => {
  test("the per-level bonus is generated from the published track bonuses", () => {
    expect(TRACKS.map((track) => trackBonusText(pub.trackBonuses[track]))).toEqual([
      "State Capacity +4", "Public Trust +1", "International Cooperation +4", "National Security +2",
    ]);
    expect(trackBonusText({ economy: -2 })).toBe("Economy −2");
    expect(trackBonusText({})).toBe("No bonus");
  });

  test("no promise the content does not keep, and no odds or damage numbers", () => {
    expect(TRACK_MILESTONES.diplomacy.map((m) => m.level)).toEqual([3]);           // "joint evaluations" is gone
    const all = Object.values(TRACK_MILESTONES).flat().map((m) => m.text).join(" ");
    expect(all).toContain("in the unscheduled crisis");
    expect(all).not.toMatch(/crisis turns|joint evaluations|halves|\d/);
  });

  test("every option unlock in content has an 'unlock' milestone at the same track and level, and vice versa", () => {
    const fromContent = new Set(
      Object.values(pub.scenarios).flatMap((s) => s.choices.flatMap((c) => (c.unlock ? [`${c.unlock.track}:${c.unlock.level}`] : []))),
    );
    const authored = new Set(TRACKS.flatMap((t) => TRACK_MILESTONES[t].filter((m) => m.applies === "unlock").map((m) => `${t}:${m.level}`)));
    expect([...authored].sort()).toEqual([...fromContent].sort());
  });
});
```

**Step 2: Run it and watch it fail.**

```bash
npx vitest run tests/ui/turn-format.test.ts
```

Expected: all 6 tests fail (`METRIC_ORDER`, `effectRows`, `DOMAIN_LABEL`, `TRACKS`, `TRACK_MILESTONES` and `trackBonusText` do not exist yet, so each test throws a `TypeError`).

**Step 3: Implement.** In `src/ui/format.ts`, make four edits.

(a) Replace line 3

```ts
import type { AdviserId, Condition, Effects, EvidenceStrength, Lever, MetricKey, Profile, SeedFact, Severity, Track } from "../engine";
```

with

```ts
import type { AdviserId, Condition, Domain, Effects, EvidenceStrength, Lever, MetricKey, Profile, SeedFact, Severity, Track } from "../engine";
```

(b) Replace the whole `TRACK_DETAIL` block (the comment `/** Spec Section 5: what each track gives per level and what it unlocks. */` through its closing `};`) with the following. It drops the Diplomacy "Level 2: joint evaluations" promise, which no content implements; says "in the unscheduled crisis" instead of "in crisis turns"; replaces "halves their damage" with words that give no number; and moves the per-level bonus to `trackBonusText`, generated from `pub.trackBonuses` (D12; `DECISIONS.md` F11).

```ts
/** The four standing-investment tracks, in display order. */
export const TRACKS: Track[] = ["evaluation", "provenance", "diplomacy", "defensiveCyber"];

/**
 * Spec Section 5, as far as the content implements it: what a level opens beyond its
 * per-level bonus (the bonus itself comes from `pub.trackBonuses`, see `trackBonusText`).
 * `applies` tells the investment ladder whether a remaining turn can still use it:
 * "unlock" reads the options in content that name this track and level; "final" is the
 * final decision; "standing" has no single turn, so the ladder shows no status for it.
 * Diplomacy level 2 ("joint evaluations") is not listed because no content implements
 * it, and no damage or odds numbers appear before the debrief (DECISIONS.md, F11).
 */
export interface TrackMilestone {
  level: 2 | 3;
  text: string;
  applies: "unlock" | "final" | "standing";
}

export const TRACK_MILESTONES: Record<Track, TrackMilestone[]> = {
  evaluation: [
    { level: 2, text: "Stronger unannounced evaluations", applies: "standing" },
    { level: 3, text: "A government incident-response model in the unscheduled crisis", applies: "unlock" },
  ],
  provenance: [{ level: 2, text: "Rapid authentication in a crisis about disputed media", applies: "unlock" }],
  diplomacy: [{ level: 3, text: "A credible coordinated pause in the final decision", applies: "final" }],
  defensiveCyber: [{ level: 2, text: "Lower odds of cyber events, and less damage when they happen", applies: "standing" }],
};
```

(c) Replace

```ts
export const ADVISER_ORDER: AdviserId[] = ["shah", "harcourt", "chen", "okafor"];
```

with

```ts
export const ADVISER_ORDER: AdviserId[] = ["shah", "harcourt", "chen", "okafor"];

/** Every metric in one fixed reading order: the five exact ones, the two estimates, then State Capacity. */
export const METRIC_ORDER: MetricKey[] = [
  "nationalSecurity", "economy", "publicTrust", "innovation", "socialStability",
  "systemicRisk", "cooperation", "stateCapacity",
];

/** The five metrics the Director sees exactly. The other three are an estimate band or a label. */
export const EXACT_METRICS = ["nationalSecurity", "economy", "publicTrust", "innovation", "socialStability"] as const;
export type ExactMetric = (typeof EXACT_METRICS)[number];
export const isExactMetric = (metric: MetricKey): metric is ExactMetric => (EXACT_METRICS as readonly MetricKey[]).includes(metric);

/** A policy area as it reads mid-sentence: "a policy window is open for cyber security". */
export const DOMAIN_LABEL: Record<Domain, string> = {
  cyber: "cyber security",
  bio: "biosecurity",
  labour: "jobs and skills",
  information: "information and elections",
  frontier: "frontier AI",
};
```

(If Phase 10 already added an `EXACT_METRICS` or `TRACKS` export with the same values, keep one copy and delete the duplicate.)

(d) Replace `formatEffects` and the `percent` line after it (lines 95-101 at `a11ef34`):

```ts
/** "National Security +4, Innovation −3". An empty set reads as "No immediate visible effect". */
export function formatEffects(effects: Effects): string {
  const parts = (Object.keys(effects) as MetricKey[]).map((key) => `${METRIC_LABEL[key]} ${signed(effects[key] ?? 0)}`);
  return parts.length > 0 ? parts.join(", ") : "No immediate visible effect";
}

export const percent = (probability: number) => `${Math.round(probability * 100)}%`;
```

with the block below. `formatEffects` now lists effects in `METRIC_ORDER` instead of the JSON key order, so an option's card ("Officials expect: …", Task 11.7) and its preview read in the same order. It is also used by `Briefing.tsx` and the debrief's `Assumptions.tsx`; only the order changes there, because no content effect has a value of 0 and no test pins the old order.

```ts
/** Stated effects as rows in METRIC_ORDER, leaving out zeros. */
export function effectRows(effects: Effects): { metric: MetricKey; delta: number }[] {
  return METRIC_ORDER.flatMap((metric) => {
    const delta = effects[metric];
    return delta === undefined || delta === 0 ? [] : [{ metric, delta }];
  });
}

/**
 * "National Security +4, Innovation −3", in METRIC_ORDER, so an option's card and its
 * preview list the same effects in the same order. An empty set reads as "No immediate visible effect".
 */
export function formatEffects(effects: Effects): string {
  const parts = effectRows(effects).map(({ metric, delta }) => `${METRIC_LABEL[metric]} ${signed(delta)}`);
  return parts.length > 0 ? parts.join(", ") : "No immediate visible effect";
}

/** "State Capacity +4": one track's per-level bonus, from `pub.trackBonuses[track]`. */
export function trackBonusText(bonus: Effects): string {
  return effectRows(bonus).length > 0 ? formatEffects(bonus) : "No bonus";
}

export const percent = (probability: number) => `${Math.round(probability * 100)}%`;
```

`TRACK_DETAIL` was used only by `src/ui/screens/Invest.tsx`. Keep that screen compiling until Task 11.8 replaces it: replace

```ts
import { TRACK_DETAIL, TRACK_LABEL } from "../format";
import type { DisplayedState, Track } from "../../engine";
```

with

```ts
import { TRACK_LABEL, TRACK_MILESTONES, trackBonusText } from "../format";
import { pub } from "../useGame";
import type { DisplayedState, Track } from "../../engine";
```

and replace

```tsx
                      <p>{TRACK_DETAIL[track].perLevel}</p>
                      <ul className={on ? "opacity-80" : "text-muted"}>
                        {TRACK_DETAIL[track].unlocks.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
```

with

```tsx
                      <p>{trackBonusText(pub.trackBonuses[track])} per level</p>
                      <ul className={on ? "opacity-80" : "text-muted"}>
                        {TRACK_MILESTONES[track].map((milestone) => (
                          <li key={milestone.text}>
                            Level {milestone.level}: {milestone.text}
                          </li>
                        ))}
                      </ul>
```

**Step 4: Run it and watch it pass.**

```bash
npx vitest run tests/ui/turn-format.test.ts && npx tsc --noEmit && npx eslint src/ui tests/ui
```

Expected: `Tests  6 passed (6)`; `tsc` and `eslint` print nothing.

**Step 5: Commit.**

```bash
git add src/ui/format.ts src/ui/screens/Invest.tsx tests/ui/turn-format.test.ts
git commit -m "feat(ui): metric order, area labels, effect rows and honest track milestones (F11)"
```

### Task 11.3: `choicePreview` and `pricingNotes`, with shared test states

**Depends on:** Tasks 11.1 and 11.2 (`pub.rules`, `effectRows`, `isExactMetric`); `tests/engine/fixture.ts` (`nextAction`, `Policy`).

**Files:**
- Create: `tests/ui/states.ts` (shared by Tasks 11.3 to 11.5; not a test file, so Vitest does not collect it)
- Create: `src/ui/preview.ts`
- Test: `tests/ui/preview.test.ts` (new)

**Step 1: Write the failing test.** Create `tests/ui/states.ts`:

```ts
// Real game states for the pure UI helpers' tests, built with the engine and the
// real content, plus the hidden-information checks those tests share. Not a test
// file itself (Vitest collects only *.test.ts).

import { reduce, type Content, type GameState, type Track } from "../../src/engine";
import { nextAction, type Policy } from "../engine/fixture";

/** Keys that must never appear in anything a play screen renders (handoff invariant 3). */
export const FORBIDDEN_KEYS = ["halfWidth", "truth", "history", "debrief", "oddsAtTheTime", "succeeded"];

/** Every object key anywhere inside a value. */
export function keysOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(keysOf);
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key, child]) => [key, ...keysOf(child)]);
  return [];
}

/** The cheapest open option each turn; investment goes to the first open track in `tracks`. */
export const cheapest = (...tracks: Track[]): Policy => ({
  choose: (state, ids) => [...ids].sort((a, b) => cost(state, a) - cost(state, b))[0]!,
  invest: (_state, open) => tracks.find((t) => open.includes(t)) ?? open[0]!,
});

/** The dearest open option each turn: spends Political Capital down, so later options become unaffordable. */
export const dearest = (...tracks: Track[]): Policy => ({
  choose: (state, ids) => [...ids].sort((a, b) => cost(state, b) - cost(state, a))[0]!,
  invest: (_state, open) => tracks.find((t) => open.includes(t)) ?? open[0]!,
});

const cost = (state: GameState, id: string) => state.current!.choices.find((c) => c.id === id)!.cost;

/** Plays legal actions until `stop` holds. Throws if the game ends first. */
export function advanceUntil(state: GameState, content: Content, policy: Policy, stop: (s: GameState) => boolean): GameState {
  let next = state;
  while (!stop(next)) {
    if (next.phase === "debrief") throw new Error("The game ended before the state was reached");
    next = reduce(next, nextAction(next, policy), content);
  }
  return next;
}

/**
 * The same content with its hidden half changed everywhere: hidden effects, conditional
 * effects and odds modifiers on every option (except those of `spare`, whose resolution
 * a test compares), and every event's base odds. Public fields are untouched.
 */
export function perturbHidden(content: Content, spare: string | null = null): Content {
  const copy = structuredClone(content);
  const bump = (n: number) => Math.min(100, n + 7);
  for (const scenario of copy.scenarios) {
    for (const choice of scenario.choices) {
      choice.probabilityModifiers = [...choice.probabilityModifiers, { eventId: "infra-attack", delta: 17 }];
      if (scenario.id === spare) continue;
      choice.hiddenEffects = { ...choice.hiddenEffects, systemicRisk: (choice.hiddenEffects.systemicRisk ?? 0) + 9, economy: (choice.hiddenEffects.economy ?? 0) - 5 };
      choice.conditionalEffects = [...choice.conditionalEffects, { when: [{ seedFact: "cyberOffenceLed" }], effects: { nationalSecurity: -6 } }];
    }
  }
  for (const event of copy.events) {
    const base = event.base;
    if (base === undefined || base === "certain") continue;
    if ("cases" in base) event.base = { cases: base.cases.map((c) => ({ ...c, probability: bump(c.probability) })), otherwise: bump(base.otherwise) };
    else if ("fact" in base) event.base = { ...base, whenTrue: bump(base.whenTrue), whenFalse: bump(base.whenFalse) };
    else event.base = { benign: bump(base.benign), contested: bump(base.contested), hard: bump(base.hard) };
  }
  return copy;
}
```

Create `tests/ui/preview.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { createGame, displayed, reduce, type DisplayedState } from "../../src/engine";
import { loadContent, publicContent, type PublicScenario } from "../../src/content";
import { choicePreview, pricingNotes } from "../../src/ui/preview";
import { advanceUntil, cheapest, dearest, FORBIDDEN_KEYS, keysOf, perturbHidden } from "./states";

const content = loadContent();
const pub = publicContent(content);
const scenario = (id: string) => pub.scenarios[id]!;
const deciding = (seed: string) => reduce(createGame(seed, content), { type: "FORECAST", value: 0.5 }, content);

describe("choicePreview", () => {
  test("states the cost, the Political Capital left, and the stated effects in a fixed order", () => {
    const view = displayed(deciding("PREVIEW-1"));
    expect(choicePreview(view, scenario("attribution-gap"), "A")).toEqual({
      id: "A",
      text: scenario("attribution-gap").choices.find((c) => c.id === "A")!.text,
      cost: 2,
      status: "available",
      capitalNow: 5,
      capitalAfter: 3,
      rows: [
        { metric: "nationalSecurity", delta: 1, now: 50 },
        { metric: "innovation", delta: 1, now: 50 },
      ],
      unlock: null,
    });
  });

  test("an estimated metric gets its stated change and never a current value", () => {
    const state = advanceUntil(createGame("PREVIEW-2", content), content, cheapest(), (s) => s.phase === "decide" && s.current!.scenarioId === "open-weight-release");
    const view = displayed(state);
    expect(choicePreview(view, scenario("open-weight-release"), "D")!.rows).toEqual([
      { metric: "innovation", delta: -1, now: view.exact.innovation },
      { metric: "cooperation", delta: 5, now: null },
    ]);
  });

  test("an option that cannot be chosen has no Political Capital after, and its status says why", () => {
    const locked = advanceUntil(createGame("PREVIEW-3", content), content, cheapest("evaluation", "diplomacy", "defensiveCyber"), (s) => s.phase === "decide" && s.current!.scenarioId === "deepfake-election");
    const e = choicePreview(displayed(locked), scenario("deepfake-election"), "E")!;
    expect(e).toMatchObject({ status: "locked", capitalAfter: null, unlock: { track: "provenance", level: 2 } });

    // Spending on the dearest option and buying analysis every turn soon leaves an option out of reach.
    const spender = { ...dearest(), buyInfo: true };
    const short = advanceUntil(createGame("PREVIEW-4", content), content, spender, (s) => s.phase === "decide" && s.current!.choices.some((c) => c.status === "unaffordable"));
    const view = displayed(short);
    const option = view.current!.choices.find((c) => c.status === "unaffordable")!;
    const preview = choicePreview(view, scenario(view.current!.scenarioId), option.id)!;
    expect(preview).toMatchObject({ status: "unaffordable", cost: option.cost, capitalNow: view.politicalCapital, capitalAfter: null });
    expect(preview.cost).toBeGreaterThan(preview.capitalNow);
  });

  test("returns null for an option the scenario does not have", () => {
    expect(choicePreview(displayed(deciding("PREVIEW-1")), scenario("attribution-gap"), "Z")).toBeNull();
  });
});

describe("pricingNotes", () => {
  test("report the boom from the published threshold, and no window when none is open", () => {
    const view = displayed(deciding("PREVIEW-1"));
    const at = (economy: number): DisplayedState => ({ ...view, exact: { ...view.exact, economy } });
    expect(pricingNotes(at(pub.rules.boomEconomyAt - 1), scenario("attribution-gap"), pub.rules)).toEqual({ window: null, boom: false });
    expect(pricingNotes(at(pub.rules.boomEconomyAt), scenario("attribution-gap"), pub.rules)).toEqual({ window: null, boom: true });
  });

  test("name the open window in the scenario's area, with the longest time left", () => {
    const view: DisplayedState = { ...displayed(deciding("PREVIEW-1")), policyWindows: [{ domain: "cyber", turnsLeft: 1 }, { domain: "bio", turnsLeft: 2 }, { domain: "cyber", turnsLeft: 2 }] };
    expect(pricingNotes(view, scenario("attribution-gap"), pub.rules).window).toEqual({ domain: "cyber", turnsLeft: 2 });
    expect(pricingNotes(view, scenario("graduate-collapse"), pub.rules).window).toBeNull();
  });
});

describe("hidden information", () => {
  const perturbed = perturbHidden(content);
  const pubB = publicContent(perturbed);
  /** A view in which every option of `s` is on offer, so any option can be previewed. */
  const asIfDeciding = (view: DisplayedState, s: PublicScenario): DisplayedState => ({
    ...view,
    current: { ...view.current!, scenarioId: s.id, choices: s.choices.map((c) => ({ id: c.id, cost: 3, status: "available" as const })) },
  });

  test("changing every hidden effect, odds modifier and base odd changes nothing in any preview", () => {
    const a = displayed(deciding("SAME-WORLD"));
    const b = displayed(reduce(createGame("SAME-WORLD", perturbed), { type: "FORECAST", value: 0.5 }, perturbed));
    for (const choice of scenario("attribution-gap").choices) {
      expect(choicePreview(b, pubB.scenarios["attribution-gap"]!, choice.id)).toEqual(choicePreview(a, scenario("attribution-gap"), choice.id));
    }
    for (const s of Object.values(pub.scenarios)) {
      const view = asIfDeciding(a, s);
      for (const choice of s.choices) {
        expect(choicePreview(view, pubB.scenarios[s.id]!, choice.id)).toEqual(choicePreview(view, s, choice.id));
      }
    }
  });

  test("a preview carries no hidden key", () => {
    const view = displayed(deciding("SAME-WORLD"));
    for (const s of Object.values(pub.scenarios)) {
      for (const choice of s.choices) {
        const keys = keysOf(choicePreview(asIfDeciding(view, s), s, choice.id));
        for (const key of FORBIDDEN_KEYS) expect(keys).not.toContain(key);
      }
    }
  });
});
```

**Step 2: Run it and watch it fail.**

```bash
npx vitest run tests/ui/preview.test.ts
```

Expected: `FAIL tests/ui/preview.test.ts` with `Error: Cannot find module '../../src/ui/preview'` and `Tests  no tests`.

**Step 3: Implement.** Create `src/ui/preview.ts`:

```ts
// What the Decision screen can say about an option before it is confirmed. Pure, and
// fed only what the player can already see: the displayed state and the public
// scenario. It never reads hidden effects, odds or true values (handoff invariant 3).

import type { PublicRules, PublicScenario } from "../content";
import type { ChoiceStatus, DisplayedState, Domain, MetricKey, Track } from "../engine";
import { effectRows, isExactMetric } from "./format";

export interface PreviewRow {
  metric: MetricKey;
  /** The stated change: what officials expect, not a promise. */
  delta: number;
  /** The current value, for the five exact metrics only. null for an estimate or a label. */
  now: number | null;
}

export interface ChoicePreview {
  id: string;
  text: string;
  /** The price this turn, after any boom surcharge or policy-window discount. */
  cost: number;
  status: ChoiceStatus;
  capitalNow: number;
  /** Political Capital left after paying. null when the option cannot be chosen. */
  capitalAfter: number | null;
  rows: PreviewRow[];
  unlock: { track: Track; level: number } | null;
}

/** The preview of one option, or null if the scenario has no such option. */
export function choicePreview(view: DisplayedState, scenario: PublicScenario, choiceId: string): ChoicePreview | null {
  const option = view.current?.choices.find((o) => o.id === choiceId);
  const choice = scenario.choices.find((c) => c.id === choiceId);
  if (!option || !choice) return null;
  return {
    id: choice.id,
    text: choice.text,
    cost: option.cost,
    status: option.status,
    capitalNow: view.politicalCapital,
    capitalAfter: option.status === "available" ? view.politicalCapital - option.cost : null,
    rows: effectRows(choice.visibleEffects).map(({ metric, delta }) => ({ metric, delta, now: isExactMetric(metric) ? view.exact[metric] : null })),
    unlock: choice.unlock ? { track: choice.unlock.track, level: choice.unlock.level } : null,
  };
}

export interface PricingNotes {
  /** The policy window open in this scenario's area, if any. */
  window: { domain: Domain; turnsLeft: number } | null;
  /** The economy is at or above the boom threshold, so some options that restrict AI cost more. */
  boom: boolean;
}

/** Why this turn's prices may differ from usual. The prices themselves are already in `view.current.choices`. */
export function pricingNotes(view: DisplayedState, scenario: PublicScenario, rules: PublicRules): PricingNotes {
  const here = view.policyWindows.filter((w) => w.domain === scenario.domain);
  const turnsLeft = Math.max(0, ...here.map((w) => w.turnsLeft));
  return {
    window: here.length > 0 ? { domain: scenario.domain, turnsLeft } : null,
    boom: view.exact.economy >= rules.boomEconomyAt,
  };
}
```

**Step 4: Run it and watch it pass.**

```bash
npx vitest run tests/ui/preview.test.ts && npx tsc --noEmit && npx eslint src/ui tests/ui
```

Expected: `Tests  8 passed (8)`; `tsc` and `eslint` print nothing. The hidden-information tests prove two things: changing every hidden effect, conditional effect, odds modifier and event base odd leaves every preview identical, and no preview contains `halfWidth`, `truth`, `history`, `debrief`, `oddsAtTheTime` or `succeeded`.

**Step 5: Commit.**

```bash
git add tests/ui/states.ts tests/ui/preview.test.ts src/ui/preview.ts
git commit -m "feat(ui): pure choice preview and pricing notes with hidden-information tests"
```

### Task 11.4: `preparation.ts`: unlock targets, run position and track milestones

**Depends on:** Tasks 11.2 and 11.3 (`TRACK_MILESTONES`, `tests/ui/states.ts`).

**Files:**
- Create: `src/ui/preparation.ts`
- Test: `tests/ui/preparation.test.ts` (new)

**Step 1: Write the failing test.** Create `tests/ui/preparation.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { createGame, displayed, reduce, type GameState, type Track } from "../../src/engine";
import { loadContent, publicContent } from "../../src/content";
import { TRACKS } from "../../src/ui/format";
import { milestonesFor, runPosition, unlockTargets } from "../../src/ui/preparation";
import { advanceUntil, cheapest, FORBIDDEN_KEYS, keysOf } from "./states";
import { nextAction } from "../engine/fixture";

const content = loadContent();
const pub = publicContent(content);
const investing = (state: GameState) => state.phase === "invest";

describe("unlockTargets", () => {
  test("lists every option a track level opens, scripted first", () => {
    expect(unlockTargets(pub)).toEqual([
      { track: "provenance", level: 2, scenarioId: "deepfake-election", choiceId: "E", scheduled: true },
      { track: "evaluation", level: 3, scenarioId: "false-alarm", choiceId: "D", scheduled: false },
      { track: "evaluation", level: 3, scenarioId: "incident-bio", choiceId: "D", scheduled: false },
      { track: "evaluation", level: 3, scenarioId: "incident-cyber", choiceId: "D", scheduled: false },
    ]);
  });
});

describe("runPosition", () => {
  test("matches the engine's own bookkeeping on every turn of many runs", () => {
    for (let i = 0; i < 60; i++) {
      let state = createGame(`POSITION-${i}`, content);
      const policy = cheapest("provenance", "evaluation");
      while (state.phase !== "debrief") {
        if (state.phase === "decide" || state.phase === "invest") {
          // The test may read the hidden bookkeeping; the helper may not.
          expect(runPosition(displayed(state), pub)).toEqual({ remainingScripted: content.sequence.slice(state.slot) });
        }
        state = reduce(state, nextAction(state, policy), content);
      }
    }
  });
});

describe("milestonesFor", () => {
  test("on turn 1 every scripted rung is ahead, and level 1 is the next rung", () => {
    const view = displayed(advanceUntil(createGame("LADDER-1", content), content, cheapest(), investing));
    expect(milestonesFor("evaluation", view, pub)).toEqual([
      { level: 1, reached: false, next: true, milestones: [] },
      { level: 2, reached: false, next: false, milestones: [{ text: "Stronger unannounced evaluations", status: "standing" }] },
      { level: 3, reached: false, next: false, milestones: [{ text: "A government incident-response model in the unscheduled crisis", status: "standing" }] },
    ]);
    expect(milestonesFor("provenance", view, pub)[1]!.milestones).toEqual([{ text: "Rapid authentication in a crisis about disputed media", status: "ahead" }]);
    expect(milestonesFor("diplomacy", view, pub)[2]!.milestones).toEqual([{ text: "A credible coordinated pause in the final decision", status: "ahead" }]);
  });

  test("filled rungs follow the track level", () => {
    const state = advanceUntil(createGame("LADDER-2", content), content, cheapest("evaluation"), (s) => investing(s) && s.tracks.evaluation === 1);
    const rungs = milestonesFor("evaluation", displayed(state), pub);
    expect(rungs.map((r) => [r.reached, r.next])).toEqual([[true, false], [false, true], [false, false]]);
  });

  test("a scripted unlock whose turn has passed says so; the unscheduled crisis never gets a status", () => {
    const onElection = advanceUntil(createGame("LADDER-3", content), content, cheapest(), (s) => investing(s) && s.current!.scenarioId === "deepfake-election");
    expect(milestonesFor("provenance", displayed(onElection), pub)[1]!.milestones[0]!.status).toBe("passed");
    const duringCrisis = advanceUntil(createGame("LADDER-3", content), content, cheapest(), (s) => investing(s) && s.current!.isInterrupt);
    expect(milestonesFor("evaluation", displayed(duringCrisis), pub)[2]!.milestones[0]!.status).toBe("standing");
  });

  test("a level too far to reach before the turn that uses it says so", () => {
    // Evaluation first, then Provenance: Diplomacy stays at 0, and from turn 6 two points are left before the final.
    const at = (turn: number) => displayed(advanceUntil(createGame("LADDER-4", content), content, cheapest("evaluation", "provenance"), (s) => investing(s) && s.turn === turn));
    expect(at(5).tracks.diplomacy).toBe(0);
    expect(milestonesFor("diplomacy", at(5), pub)[2]!.milestones[0]!.status).toBe("ahead");
    expect(milestonesFor("diplomacy", at(6), pub)[2]!.milestones[0]!.status).toBe("outOfReach");
  });

  test("never names the unscheduled crisis's variant or says whether it is still to come, and gives no odds", () => {
    for (let i = 0; i < 20; i++) {
      let state = createGame(`LADDER-NAMES-${i}`, content);
      while (state.phase !== "debrief") {
        if (investing(state)) {
          const view = displayed(state);
          const json = JSON.stringify(TRACKS.map((t: Track) => milestonesFor(t, view, pub)));
          expect(json).not.toMatch(/The Incident|The Warning|incident-cyber|incident-bio|false-alarm|%/);
          for (const key of FORBIDDEN_KEYS) expect(keysOf(JSON.parse(json))).not.toContain(key);
          // Whether the unscheduled crisis is ahead or behind is never shown (non-negotiable 6).
          const crisisLines = TRACKS.flatMap((t) => milestonesFor(t, view, pub).flatMap((r) => r.milestones)).filter((m) => m.text.includes("unscheduled crisis"));
          for (const m of crisisLines) expect(m.status).toBe("standing");
        }
        state = reduce(state, nextAction(state, cheapest()), content);
      }
    }
  });
});
```

**Step 2: Run it and watch it fail.**

```bash
npx vitest run tests/ui/preparation.test.ts
```

Expected: `Error: Cannot find module '../../src/ui/preparation'`, `Tests  no tests`.

**Step 3: Implement.** Create `src/ui/preparation.ts`. The run-position derivation needs no hidden field: `reduce.ts` numbers turns as scripted slot plus one once the interrupt has run, so during the interrupt the last scripted index is `turn − 2`. The test checks this against the engine's own `slot` on every turn of 60 runs. Scripted scenarios are never named ("a crisis about disputed media", "the final decision"), and the three interrupt variants are always "the unscheduled crisis". A rung carries no bonus text: every level of a track adds the same bonus, so the ladder states it once per track (Task 11.8) instead of repeating it on all three rungs.

Four statuses, and what each may reveal:

- The unscheduled crisis never gets one ("standing", shown as no status). `reduce.ts:319-322` runs the false alarm on the turn before the final whenever no interrupt has come, so late in a run "still ahead" would pin it to the next turn, and "passed" would say that no other crisis is coming.
- A scripted unlock or the final decision is "passed" once no remaining turn uses it.
- It is "outOfReach" when the levels still missing exceed the investment points left before that turn begins. For the final decision (always the last turn) that count is exact: `pub.totalTurns − view.turn`. For a scripted unlock it is an upper bound: this turn's point, one per scripted turn in between, plus one for an unscheduled turn that may come first. The bound counts that turn whether or not it has come, so it never says when. Over 1,500 random runs (10,500 investment screens), all 1,119 "outOfReach" statuses were truly out of reach; the bound still marks 557 of the 15,824 "ahead" statuses on rungs that could no longer be reached, which is the price of revealing nothing.
- Otherwise it is "ahead".

```ts
// What standing investment prepares for, derived only from public content and the
// displayed state (handoff invariant 3). Only scripted scenarios and the final decision
// get a status. The unscheduled crisis never does: late in a run "still ahead" would pin
// it to the next turn (turn 6 of 8 with the final still ahead means turn 7), and "passed"
// would say that no other crisis is coming (non-negotiable 6; DECISIONS.md, B6).

import type { PublicContent } from "../content";
import type { DisplayedState, Track } from "../engine";
import { TRACK_MILESTONES } from "./format";

/** An option in content that a track level opens. */
export interface UnlockTarget {
  track: Track;
  level: number;
  scenarioId: string;
  choiceId: string;
  /** In the scripted sequence. False for the three interrupt variants. */
  scheduled: boolean;
}

/** Every option that a track level opens, scripted scenarios in play order first. */
export function unlockTargets(pub: PublicContent): UnlockTarget[] {
  const unscheduled = Object.keys(pub.scenarios).filter((id) => !pub.sequence.includes(id)).sort();
  return [...pub.sequence, ...unscheduled].flatMap((scenarioId) =>
    (pub.scenarios[scenarioId]?.choices ?? []).flatMap((choice) =>
      choice.unlock
        ? [{ track: choice.unlock.track, level: choice.unlock.level, scenarioId, choiceId: choice.id, scheduled: pub.sequence.includes(scenarioId) }]
        : [],
    ),
  );
}

export interface RunPosition {
  /** Scripted scenarios still to come after the current turn, in order. */
  remainingScripted: string[];
}

/**
 * Where the run stands, from the displayed turn and scenario only. The engine numbers
 * turns as scripted slot + 1 once the interrupt has run (reduce.ts), so during the
 * interrupt the last scripted scenario played is at index turn − 2.
 */
export function runPosition(view: DisplayedState, pub: PublicContent): RunPosition {
  const current = view.current;
  if (!current) return { remainingScripted: [] };
  if (current.isInterrupt) return { remainingScripted: pub.sequence.slice(Math.max(0, view.turn - 1)) };
  return { remainingScripted: pub.sequence.slice(pub.sequence.indexOf(current.scenarioId) + 1) };
}

/**
 * "ahead": a remaining turn uses it, and the level can still be reached in time.
 * "outOfReach": a remaining turn uses it, but too few investment points are left to reach the level.
 * "passed": no remaining turn uses it.
 * "standing": no status, because it has no single turn or it belongs to the unscheduled crisis.
 */
export type MilestoneStatus = "ahead" | "outOfReach" | "passed" | "standing";

export interface Milestone {
  text: string;
  status: MilestoneStatus;
}

export interface Rung {
  level: 1 | 2 | 3;
  reached: boolean;
  /** The level an investment this turn would reach. */
  next: boolean;
  milestones: Milestone[];
}

/**
 * The three rungs of one track, as the investment screen shows them. A level gained
 * this turn first counts on the next turn, because option statuses are fixed when a
 * turn begins, so "remaining" means after the current turn.
 */
export function milestonesFor(track: Track, view: DisplayedState, pub: PublicContent): Rung[] {
  const have = view.tracks[track];
  const { remainingScripted } = runPosition(view, pub);
  const targets = unlockTargets(pub).filter((t) => t.track === track);
  const final = pub.sequence[pub.sequence.length - 1];
  // At most this many investment points are left before a scripted scenario begins: this
  // turn's, one for each scripted turn in between, and one for an unscheduled turn that
  // may come first. The bound counts that turn whether or not it has come, so it says
  // nothing about when. The final decision is always the last turn, so its count is exact.
  const lastPlayed = pub.sequence.length - 1 - remainingScripted.length;
  const pointsBefore = (scenarioId: string) =>
    scenarioId === final ? pub.totalTurns - view.turn : pub.sequence.indexOf(scenarioId) - lastPlayed + 1;
  const statusFor = (level: number, scenarioIds: string[]): MilestoneStatus => {
    const ahead = scenarioIds.filter((id) => remainingScripted.includes(id));
    if (ahead.length === 0) return "passed";
    return ahead.some((id) => level - have <= pointsBefore(id)) ? "ahead" : "outOfReach";
  };
  // Only scripted targets get a status (see the header). A level that also opens an
  // option in the unscheduled crisis shows none unless a scripted turn can still use it.
  const unlockStatus = (level: number, atLevel: UnlockTarget[]): MilestoneStatus => {
    const scripted = atLevel.filter((t) => t.scheduled).map((t) => t.scenarioId);
    const status = scripted.length > 0 ? statusFor(level, scripted) : "standing";
    return status !== "ahead" && atLevel.some((t) => !t.scheduled) ? "standing" : status;
  };

  return ([1, 2, 3] as const).map((level) => {
    const atLevel = targets.filter((t) => t.level === level);
    const authored = TRACK_MILESTONES[track].filter((m) => m.level === level);
    const milestones: Milestone[] = authored.map((m) => ({
      text: m.text,
      status:
        m.applies === "unlock" ? unlockStatus(level, atLevel)
        : m.applies === "final" && final !== undefined ? statusFor(level, [final])
        : "standing",
    }));
    // An unlock in content with no authored line still shows, in words that name no scenario.
    if (atLevel.length > 0 && !authored.some((m) => m.applies === "unlock")) {
      const unscheduled = atLevel.every((t) => !t.scheduled);
      milestones.push({
        text: unscheduled ? "Opens an option in the unscheduled crisis" : "Opens an option in a later scenario",
        status: unlockStatus(level, atLevel),
      });
    }
    return { level, reached: have >= level, next: have + 1 === level, milestones };
  });
}
```

**Step 4: Run it and watch it pass.**

```bash
npx vitest run tests/ui/preparation.test.ts && npx tsc --noEmit && npx eslint src/ui tests/ui
```

Expected: `Tests  7 passed (7)`; `tsc` and `eslint` print nothing.

**Step 5: Commit.**

```bash
git add src/ui/preparation.ts tests/ui/preparation.test.ts
git commit -m "feat(ui): derive standing-investment milestones from public data only"
```

### Task 11.5: `consequencesOf`, and pin the headline order in the engine tests

**Depends on:** Tasks 11.2 and 11.3 (`EXACT_METRICS`, `TRACKS`, `tests/ui/states.ts`).

**Files:**
- Create: `src/ui/consequences.ts`
- Test: `tests/ui/consequences.test.ts` (new)
- Test: `tests/engine/headlines.test.ts` (new; a test only, no engine change)

**Step 1: Write the failing test.** Create `tests/ui/consequences.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { createGame, displayed, reduce, type Content, type GameState, type Track } from "../../src/engine";
import { loadContent, publicContent, type PublicContent } from "../../src/content";
import { consequencesOf } from "../../src/ui/consequences";
import { EXACT_METRICS } from "../../src/ui/format";
import { nextAction, type Policy } from "../engine/fixture";
import { advanceUntil, cheapest, FORBIDDEN_KEYS, keysOf, perturbHidden } from "./states";

const content = loadContent();
const pub = publicContent(content);

/** Plays turn 1 with the given choice and track, as the interface would: forecast, decide, invest, advance. */
function firstTurn(c: Content, seed: string, choiceId: string, track: Track, buy = false) {
  let state = reduce(createGame(seed, c), { type: "FORECAST", value: 0.35 }, c);
  if (buy) state = reduce(state, { type: "BUY_INFO" }, c);
  state = reduce(state, { type: "DECIDE", choiceId }, c);
  state = reduce(state, { type: "INVEST", track }, c);
  return resolve(state, c);
}

/** ADVANCE from phase "advance", keeping the two views the interface keeps. */
function resolve(state: GameState, c: Content) {
  const before = displayed(state);
  const after = displayed(reduce(state, { type: "ADVANCE" }, c));
  return { before, after, resolved: { turn: state.turn, scenarioId: state.current!.scenarioId } };
}

const turnOf = (r: ReturnType<typeof resolve>, p: PublicContent = pub) => consequencesOf(r.before, r.after, r.resolved, p);

describe("consequencesOf: your decision", () => {
  test("reads what was chosen from before the turn resolved, not from the next turn", () => {
    const r = firstTurn(content, "NEWS-1", "C", "evaluation", true);
    expect(r.after.current!.scenarioId).toBe("open-weight-release");            // `after` is already the next turn
    expect(turnOf(r).chose).toEqual({
      id: "C", text: pub.scenarios["attribution-gap"]!.choices.find((c) => c.id === "C")!.text, costPaid: 4, boughtAnalysis: true,
    });
    expect(turnOf(r).investment).toBe("evaluation");
  });

  test("every track level that changed is listed, with no cause, and the investment names only where the point went", () => {
    // Option D also raises Defensive cyber, through a hidden track change (spec Section 9, Scenario 1).
    const r = firstTurn(content, "NEWS-2", "D", "evaluation");
    expect(turnOf(r).investment).toBe("evaluation");
    expect(turnOf(r).trackChanges).toEqual([{ track: "evaluation", from: 0, to: 1 }, { track: "defensiveCyber", from: 0, to: 1 }]);
    const same = firstTurn(content, "NEWS-2", "D", "defensiveCyber");
    expect(turnOf(same).investment).toBe("defensiveCyber");
    expect(turnOf(same).trackChanges).toEqual([{ track: "defensiveCyber", from: 0, to: 2 }]);
  });
});

describe("consequencesOf: what the world noticed", () => {
  test("the first headline is the decision as reported; the rest are other news", () => {
    const r = firstTurn(content, "NEWS-1", "A", "provenance");
    const headline = content.scenarios.find((s) => s.id === "attribution-gap")!.choices.find((c) => c.id === "A")!.headline;
    expect(turnOf(r).news).toEqual({ decision: headline, elsewhere: [] });   // nothing can fire on turn 1
  });

  test("findings are this turn's reveals, titled by their event; new policy windows only", () => {
    let seenFinding = false;
    let seenWindow = false;
    for (let i = 0; i < 200 && !(seenFinding && seenWindow); i++) {
      let state = createGame(`NEWS-EVENTS-${i}`, content);
      const policy = { ...cheapest(), buyInfo: false };
      while (state.phase !== "debrief") {
        if (state.phase === "advance") {
          const r = resolve(state, content);
          const c = turnOf(r);
          const reveals = r.after.intel.filter((x) => x.turn === r.resolved.turn && x.source === "reveal");
          expect(c.findings).toEqual(reveals.map((x) => ({ title: pub.eventTitles[x.eventId!] ?? null, text: x.text })));
          const opened = r.after.policyWindows.filter((w, i, all) => w.turnsLeft === pub.rules.windowTurns && all.findIndex((x) => x.domain === w.domain && x.turnsLeft === w.turnsLeft) === i);
          expect(c.windowsOpened).toEqual(r.before.current!.isFinal ? [] : opened);
          seenFinding ||= c.findings.length > 0;
          seenWindow ||= c.windowsOpened.length > 0;
        }
        state = reduce(state, nextAction(state, policy), content);
      }
    }
    expect(seenFinding && seenWindow).toBe(true);
  });
});

describe("consequencesOf: what you can measure now", () => {
  test("all five exact metrics, largest change first, unchanged ones last in reading order", () => {
    const r = firstTurn(content, "NEWS-3", "B", "provenance");
    const { measured } = turnOf(r);
    expect(measured.map((m) => m.metric).sort()).toEqual([...EXACT_METRICS].sort());
    for (const m of measured) expect(m).toEqual({ metric: m.metric, before: r.before.exact[m.metric], after: r.after.exact[m.metric], delta: r.after.exact[m.metric] - r.before.exact[m.metric] });
    const sizes = measured.map((m) => Math.abs(m.delta));
    expect(sizes).toEqual([...sizes].sort((a, b) => b - a));
    const unchanged = measured.filter((m) => m.delta === 0).map((m) => m.metric);
    expect(unchanged).toEqual(EXACT_METRICS.filter((m) => unchanged.includes(m)));
    expect(measured.some((m) => m.delta !== 0)).toBe(true);
  });

  test("Political Capital left and for next turn; estimates as they stand, low, mid and high only", () => {
    const r = firstTurn(content, "NEWS-1", "A", "provenance");
    const c = turnOf(r);
    expect(c.capital).toEqual({ leftAfterSpending: 3, nextTurn: r.after.politicalCapital });
    const { low, mid, high } = r.after.estimates.systemicRisk;
    expect(c.estimatesNow.systemicRisk).toEqual({ low, mid, high });
    expect(Object.keys(c.estimatesNow.cooperation).sort()).toEqual(["high", "low", "mid"]);
  });

  test("a State Capacity label change is reported, and only then", () => {
    // Rotating through the options and never investing in Evaluation lets drift pull State Capacity down to Thin.
    const drifting: Policy = { choose: (s, ids) => ids[s.turn % ids.length]!, invest: (_s, open) => open.find((t) => t !== "evaluation") ?? open[0]! };
    const labelChanges = (s: GameState) => s.phase === "advance" && displayed(reduce(s, { type: "ADVANCE" }, content)).stateCapacity !== displayed(s).stateCapacity;
    const state = advanceUntil(createGame("NEWS-0", content), content, drifting, labelChanges);
    const r = resolve(state, content);
    expect(turnOf(r).capacity).toEqual({ before: r.before.stateCapacity, after: r.after.stateCapacity });
    expect(turnOf(firstTurn(content, "NEWS-1", "A", "evaluation")).capacity).toBeNull();
  });
});

describe("consequencesOf: still unknown", () => {
  test("the player's forecast and its question, until the final turn", () => {
    const c = turnOf(firstTurn(content, "NEWS-1", "A", "provenance"));
    const scenario = pub.scenarios["attribution-gap"]!;
    expect(c.unknown).toEqual({ forecast: 0.35, question: scenario.forecastQuestion, resolvesBy: scenario.resolvesBy });
  });

  test("on the final turn: no capital, no windows, no open question, and nothing from the debrief", () => {
    const state = advanceUntil(createGame("NEWS-FINAL", content), content, cheapest(), (s) => s.phase === "advance" && s.current!.isFinal);
    const r = resolve(state, content);
    expect(r.after.truth).toBeDefined();                                   // the debrief has unlocked in `after`
    const c = turnOf(r);
    expect(c.capital).toBeNull();
    expect(c.unknown).toBeNull();
    expect(c.windowsOpened).toEqual([]);
    for (const key of FORBIDDEN_KEYS) expect(keysOf(c)).not.toContain(key);
  });
});

describe("hidden information", () => {
  test("changing the hidden half of the content changes nothing on turn 1's consequences", () => {
    // Turn 1's own hidden effects are spared: they change the measured metrics, which the player can see.
    const perturbed = perturbHidden(content, "attribution-gap");
    for (const choiceId of ["A", "B", "C", "D"]) {
      const a = turnOf(firstTurn(content, "SAME-WORLD", choiceId, "diplomacy"));
      const b = turnOf(firstTurn(perturbed, "SAME-WORLD", choiceId, "diplomacy"), publicContent(perturbed));
      expect(b).toEqual(a);
    }
  });

  test("the same two views give the same consequences whichever content's hidden half is loaded", () => {
    const r = firstTurn(content, "SAME-WORLD", "C", "evaluation");
    expect(turnOf(r, publicContent(perturbHidden(content)))).toEqual(turnOf(r));
  });

  test("no hidden key on any turn of a whole run", () => {
    let state = createGame("NO-LEAK", content);
    while (state.phase !== "debrief") {
      if (state.phase === "advance") for (const key of FORBIDDEN_KEYS) expect(keysOf(turnOf(resolve(state, content)))).not.toContain(key);
      state = reduce(state, nextAction(state, cheapest()), content);
    }
  });
});
```

Create `tests/engine/headlines.test.ts`. It pins behaviour the engine already has (`reduce.ts:305`, `headlines: [decided.headline, ...rolled.headlines]`), which the consequences screen now relies on:

```ts
// The consequences screen leads with the first headline as "your decision, as
// reported" (src/ui/consequences.ts). That relies on reduce.ts putting the decision's
// headline first. This test pins it, so an engine change cannot silently break the copy.

import { describe, expect, test } from "vitest";
import { createGame, reduce, type GameState } from "../../src/engine";
import { loadContent } from "../../src/content";
import { nextAction, type Policy } from "./fixture";

const content = loadContent();

describe("headlines after a turn resolves", () => {
  test("the first is the chosen option's headline, or its failure headline", () => {
    let normal = 0;
    let failed = 0;
    for (let i = 0; i < 150; i++) {
      const policy: Policy = { choose: (s, ids) => ids[(s.turn + i) % ids.length]!, invest: (_s, open) => open[(i + 1) % open.length]! };
      let state: GameState = createGame(`HEADLINE-${i}`, content);
      while (state.phase !== "debrief") {
        if (state.phase === "advance") {
          const { scenarioId, choiceId } = state.current!;
          const choice = content.scenarios.find((s) => s.id === scenarioId)!.choices.find((c) => c.id === choiceId)!;
          const lead = reduce(state, { type: "ADVANCE" }, content).headlines[0];
          expect([choice.headline, choice.onFailure?.headline]).toContain(lead);
          if (lead === choice.headline) normal++;
          else failed++;
        }
        state = reduce(state, nextAction(state, policy), content);
      }
    }
    expect(normal).toBeGreaterThan(0);
    expect(failed).toBeGreaterThan(0);                  // both branches were exercised
  });
});
```

**Step 2: Run it and watch it fail.**

```bash
npx vitest run tests/ui/consequences.test.ts tests/engine/headlines.test.ts
```

Expected: `tests/ui/consequences.test.ts` fails with `Error: Cannot find module '../../src/ui/consequences'`. `tests/engine/headlines.test.ts` passes (`1 passed`): it is a characterisation test of existing engine behaviour, not new behaviour.

**Step 3: Implement.** Create `src/ui/consequences.ts`. It reads what was chosen from `before.current` (on a non-final turn `after.current` is already the next turn), picks `low`, `mid` and `high` from each estimate explicitly (never spreading `Estimate`, which carries `halfWidth`), computes no remainder against the stated effects, and never touches `after.truth`, `after.debrief` or `after.history`, which are present on the final turn.

Three shape choices matter to later phases and to what the screen may imply:

- `measured` is one flat array of all five exact metrics, largest change first, unchanged ones last in reading order. Phase 12's pause filters it with `measured.filter((row) => row.delta !== 0)`, so it must stay an array of rows with `metric`, `before`, `after` and `delta`.
- `investment` is only the track the point went into. Every track whose level changed is in `trackChanges`, with no cause. A rise beyond the point can only come from an option's hidden `trackChange` (spec Section 9, Scenario 1 D raises Defensive cyber), so the News screen lists these with the measured changes, never under "Your decision", and never credits both levels to the investment.
- `unknown` holds the player's forecast and its question only. The briefing's "What we do not know" belongs to its real-world evidence panel and refers back to that panel's "What we know" ("that operation", "any of this"); shown alone after a fictional turn it dangles, and crisis turns withhold the panel altogether (`Briefing.tsx:79`).

```ts
// What the consequences screen may say about the turn that has just resolved. Pure,
// and fed only two displayed states and public content. Three rules keep it honest:
// - what was chosen comes from `before.current`, because on a non-final turn
//   `after.current` is already the next turn;
// - measured changes are the five exact metrics only, with no remainder against the
//   stated effects (a remainder would expose hidden effects; DECISIONS.md, F5);
// - estimates are reported as they stand now, never as a change, and `halfWidth`,
//   `truth`, `debrief` and `history` are never read (handoff invariant 3).

import type { PublicContent } from "../content";
import type { CapacityLabel, DisplayedState, Domain, Track } from "../engine";
import { EXACT_METRICS, TRACKS, type ExactMetric } from "./format";

export interface MeasuredChange {
  metric: ExactMetric;
  before: number;
  after: number;
  delta: number;
}

export interface Band {
  low: number;
  mid: number;
  high: number;
}

export interface TurnConsequences {
  chose: { id: string; text: string; costPaid: number; boughtAnalysis: boolean } | null;
  /** Where this turn's investment point went. Its effect is in `trackChanges`, with any other change. */
  investment: Track | null;
  /**
   * Every track whose level changed, in display order. A rise beyond the investment point
   * can only come from an option's hidden track change, so no cause is named and the
   * screen lists these with the measured changes, never under "Your decision".
   */
  trackChanges: { track: Track; from: number; to: number }[];
  news: { decision: string | null; elsewhere: string[] };
  findings: { title: string | null; text: string }[];
  /** Policy windows opened by this turn's events. Empty on the final turn. */
  windowsOpened: { domain: Domain; turnsLeft: number }[];
  /** All five exact metrics, largest change first; unchanged ones last, in reading order. */
  measured: MeasuredChange[];
  /** null on the final turn: there is no next turn to fund. */
  capital: { leftAfterSpending: number; nextTurn: number } | null;
  capacity: { before: CapacityLabel; after: CapacityLabel } | null;
  estimatesNow: { systemicRisk: Band; cooperation: Band };
  /** null on the final turn: the debrief follows at once. */
  unknown: { forecast: number | null; question: string; resolvesBy: string } | null;
}

const band = ({ low, mid, high }: Band): Band => ({ low, mid, high });

/**
 * `before` is the view captured just before ADVANCE (useGame.ts); `after` is the view
 * now. `resolved` names the turn and scenario that have just resolved.
 */
export function consequencesOf(
  before: DisplayedState,
  after: DisplayedState,
  resolved: { turn: number; scenarioId: string },
  pub: PublicContent,
): TurnConsequences {
  const ctx = before.current;
  const scenario = pub.scenarios[resolved.scenarioId];
  const isFinal = ctx?.isFinal ?? true;
  const picked = ctx?.choiceId ? scenario?.choices.find((c) => c.id === ctx.choiceId) : undefined;
  const invested = ctx?.investedIn ?? null;

  const changes = EXACT_METRICS.map((metric) => ({ metric, before: before.exact[metric], after: after.exact[metric], delta: after.exact[metric] - before.exact[metric] }));
  const survived = before.policyWindows.filter((w) => w.turnsLeft > 1).length;

  return {
    chose: ctx && picked
      ? { id: picked.id, text: picked.text, costPaid: ctx.choices.find((c) => c.id === picked.id)?.cost ?? 0, boughtAnalysis: ctx.boughtInfo }
      : null,
    investment: invested,
    trackChanges: TRACKS.filter((t) => after.tracks[t] !== before.tracks[t]).map((t) => ({ track: t, from: before.tracks[t], to: after.tracks[t] })),
    news: { decision: after.headlines[0] ?? null, elsewhere: after.headlines.slice(1) },
    findings: after.intel
      .filter((r) => r.turn === resolved.turn && r.source === "reveal")
      .map((r) => ({ title: r.eventId ? pub.eventTitles[r.eventId] ?? null : null, text: r.text })),
    // Two incidents in one area open two windows that behave as one, so each area is named once.
    windowsOpened: isFinal
      ? []
      : after.policyWindows.slice(survived).filter((w, i, all) => all.findIndex((x) => x.domain === w.domain) === i).map((w) => ({ domain: w.domain, turnsLeft: w.turnsLeft })),
    // The sort is stable, so unchanged metrics keep their reading order at the end.
    measured: [...changes].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
    capital: isFinal ? null : { leftAfterSpending: before.politicalCapital, nextTurn: after.politicalCapital },
    capacity: before.stateCapacity === after.stateCapacity ? null : { before: before.stateCapacity, after: after.stateCapacity },
    estimatesNow: { systemicRisk: band(after.estimates.systemicRisk), cooperation: band(after.estimates.cooperation) },
    unknown: isFinal || !scenario
      ? null
      : { forecast: ctx?.forecast ?? null, question: scenario.forecastQuestion, resolvesBy: scenario.resolvesBy },
  };
}
```

**Step 4: Run it and watch it pass.**

```bash
npx vitest run tests/ui/consequences.test.ts tests/engine/headlines.test.ts && npx tsc --noEmit && npx eslint src/ui tests
```

Expected: `Tests  13 passed (13)` (12 plus 1); `tsc` and `eslint` print nothing.

**Step 5: Commit.**

```bash
git add src/ui/consequences.ts tests/ui/consequences.test.ts tests/engine/headlines.test.ts
git commit -m "feat(ui): pure consequences summary; pin the decision headline's position in engine tests"
```

### Task 11.6: Sentence builders for the decision, the ladder and the consequences

**Depends on:** Phase 10 (`src/ui/copy.ts`); Tasks 11.1 to 11.5 (types `PublicRules`, `ChoicePreview`, `MilestoneStatus`, `TurnConsequences`).

**Files:**
- Modify: `src/ui/copy.ts` (created in Phase 10; append one section and merge its imports)
- Test: `tests/ui/turn-copy.test.ts` (new)

**Step 1: Write the failing test.** Create `tests/ui/turn-copy.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { loadContent, publicContent } from "../../src/content";
import {
  boomNote, capacityLine, capitalLine, capitalRulesLine, chosenLine, DECISION_INTRO, estimatesNowLine, FINDINGS_CAVEAT, investmentPointLine,
  LADDER_CAPTION, ladderIntro, levelHaveLine, measuredCaption, measuredRowText, MILESTONE_STATUS, NO_STATED_EFFECT, OFFICIALS_EXPECT,
  openQuestionLine, PREVIEW_PROMPT, previewCaveat, previewRowText, previewSummary, spentLine, thisTurnLine, trackLevelsLine, unaffordableLine,
  unchangedLine, windowNote, windowOpenedNote,
} from "../../src/ui/copy";
import type { ChoicePreview } from "../../src/ui/preview";

const pub = publicContent(loadContent());
const PREFIX = "Under this game's assumptions";
const VERDICT = /\b(right|wrong|correct|incorrect|mistake|should have|good decision|bad decision)\b/i;

const preview = (overrides: Partial<ChoicePreview> = {}): ChoicePreview => ({
  id: "C", text: "Market access conditional on evaluation.", cost: 4, status: "available", capitalNow: 5, capitalAfter: 1,
  rows: [], unlock: null, ...overrides,
});

describe("decision copy", () => {
  test("the live summary gives the capital before and after, and the cost", () => {
    expect(previewSummary(preview())).toBe("Option C: Political Capital 5 → 1 (costs 4).");
    expect(previewSummary(null)).toBe("Choose an option to see what it would cost.");
    expect(previewSummary(preview({ status: "unaffordable", cost: 6, capitalAfter: null }))).toBe("Option C: Costs 6; you have 5. Choose another option.");
  });

  test("exact metrics show their current value; estimates and the label show only the stated change", () => {
    expect(previewRowText({ metric: "nationalSecurity", delta: 4, now: 52 })).toBe("National Security +4 (now 52)");
    expect(previewRowText({ metric: "innovation", delta: -3, now: 50 })).toBe("Innovation −3 (now 50)");
    expect(previewRowText({ metric: "cooperation", delta: 5, now: null })).toBe("International Cooperation +5 (an estimate, with no exact figure)");
    expect(previewRowText({ metric: "stateCapacity", delta: 2, now: null })).toBe("State Capacity +2 (shown only as a label)");
  });

  test("the caveat reads with or without a selection, and drops the investment on the final decision", () => {
    expect(previewCaveat(false)).toBe(
      "Officials' expectations are not promises: plans do not always work out. Other effects are not shown, and background change, events and this turn's investment also move the numbers.",
    );
    expect(previewCaveat(true)).not.toContain("investment");
    expect(PREVIEW_PROMPT).toContain("Choose an option above");
    expect(unaffordableLine(4, 3)).toBe("Costs 4; you have 3.");
    expect(levelHaveLine(1)).toBe("You have level 1.");
  });

  test("price notes say which way prices moved, for how long, and take their numbers from the published rules", () => {
    expect(windowNote("cyber", 2, pub.rules)).toBe(
      "Some options here cost 2 less Political Capital than usual (never below 1) this turn and next, because a public incident in cyber security has made restrictions easier to pass. The costs shown already include this.",
    );
    expect(windowNote("bio", 1, pub.rules)).toContain("(never below 1) this turn only, because");
    expect(boomNote(pub.rules)).toBe(
      "Under this game's assumptions, the economy is booming (Economy 65 or above), so some of the more restrictive options cost 1 more Political Capital than usual. The costs shown already include this.",
    );
  });
});

describe("investment and consequences copy", () => {
  test("the ladder's numbers are derived, the level change is spelt out, and every status has words", () => {
    expect(ladderIntro(pub.totalTurns - 1, 12, 3)).toContain("You have 7 points in the whole game and 12 levels to fill");
    expect(thisTurnLine(1)).toBe("This turn: level 1 → 2. Takes effect when the turn ends.");
    expect(MILESTONE_STATUS.outOfReach).toBe("too few turns left to reach this level in time");
    expect(MILESTONE_STATUS.standing).toBeNull();
  });

  test("the investment names where the point went; the level changes are listed on their own", () => {
    expect(investmentPointLine("evaluation")).toBe("You put this turn's investment point into Evaluation science.");
    expect(trackLevelsLine([{ track: "evaluation", from: 0, to: 1 }, { track: "defensiveCyber", from: 0, to: 1 }])).toBe(
      "Standing investment: Evaluation science level 0 → 1; Defensive cyber level 0 → 1.",
    );
  });

  test("a policy window opened this turn says how long it lasts, capped at the turns left", () => {
    expect(windowOpenedNote("bio", 2, pub.rules)).toBe(
      "After this public incident in biosecurity, some options in that area will cost 2 less Political Capital (never below 1) for the next 2 turns. Restrictions are easiest to pass after harm.",
    );
    expect(windowOpenedNote("bio", 1, pub.rules)).toContain("(never below 1) next turn.");
  });

  test("measured changes, capital and estimates", () => {
    expect(measuredRowText({ metric: "economy", before: 50, after: 51, delta: 1 })).toBe("Economy: 50 → 51 (+1)");
    expect(unchangedLine(["publicTrust", "innovation"])).toBe("No change: Public Trust, Innovation.");
    expect(capitalLine({ leftAfterSpending: 3, nextTurn: 8 })).toBe("Political Capital: 3 left after this turn's spending; 8 to start the next turn.");
    expect(capitalRulesLine(pub.rules)).toBe(
      "Under this game's assumptions, each turn adds 5 Political Capital; at most 3 unspent points carry over; Public Trust at 60 or above adds 1, and at 40 or below takes 1 away.",
    );
    expect(estimatesNowLine({ low: 7, mid: 27, high: 46 }, { low: 9, mid: 28, high: 47 })).toContain("Systemic AI Risk is now estimated at 7–46");
    expect(measuredCaption(true)).not.toContain("investment");
  });

  test("the open question uses the player's own forecast and the question's date", () => {
    expect(openQuestionLine({ forecast: 0.35, question: "Chance of an attack by 2029.", resolvesBy: "2029-12" })).toBe(
      "You forecast 35%. Chance of an attack by 2029. It resolves by December 2029; you will see how it turned out in the debrief.",
    );
  });
});

describe("copy rules (DECISIONS.md, F12)", () => {
  const statistics = [
    DECISION_INTRO, OFFICIALS_EXPECT, NO_STATED_EFFECT, LADDER_CAPTION, measuredCaption(false), measuredCaption(true), boomNote(pub.rules),
    capacityLine("Adequate", "Thin"), estimatesNowLine({ low: 1, mid: 2, high: 3 }, { low: 1, mid: 2, high: 3 }), capitalRulesLine(pub.rules),
  ];
  const everything = [
    ...statistics, PREVIEW_PROMPT, previewSummary(preview()), previewSummary(null), previewCaveat(false), previewCaveat(true),
    windowNote("frontier", 2, pub.rules), windowNote("frontier", 1, pub.rules), ladderIntro(7, 12, 1), thisTurnLine(0),
    ...Object.values(MILESTONE_STATUS).filter((s): s is string => s !== null), chosenLine("A", "Voluntary pact."),
    spentLine({ id: "A", text: "", costPaid: 2, boughtAnalysis: true }, 1), investmentPointLine("evaluation"),
    trackLevelsLine([{ track: "defensiveCyber", from: 0, to: 1 }]), FINDINGS_CAVEAT, windowOpenedNote("bio", 2, pub.rules),
    windowOpenedNote("bio", 1, pub.rules), capitalLine({ leftAfterSpending: 3, nextTurn: 8 }),
  ];

  test("every caption over simulated figures begins \"Under this game's assumptions\"", () => {
    for (const sentence of statistics) expect(sentence.startsWith(PREFIX), sentence).toBe(true);
  });

  test("no sentence calls a decision right or wrong", () => {
    for (const sentence of everything) expect(sentence).not.toMatch(VERDICT);
  });
});
```

**Step 2: Run it and watch it fail.**

```bash
npx vitest run tests/ui/turn-copy.test.ts
```

Expected: `FAIL tests/ui/turn-copy.test.ts` with `TypeError: measuredCaption is not a function` and `Tests  no tests`. The `copy rules` block builds its sentence lists while the file is collected, and `measuredCaption(false)` is the first builder it calls. If Phase 10 did not create `copy.ts`, the error is `Cannot find module '../../src/ui/copy'` instead.

**Step 3: Implement.** First make sure no name below already exists in `src/ui/copy.ts` (`grep -nE "export (const|function) (DECISION_INTRO|OFFICIALS_EXPECT|NO_STATED_EFFECT|PREVIEW_PROMPT|previewSummary|previewRowText|previewCaveat|unaffordableLine|levelHaveLine|windowNote|boomNote|ladderIntro|LADDER_CAPTION|thisTurnLine|TRACK_COMPLETE|MILESTONE_STATUS|chosenLine|spentLine|investmentPointLine|trackLevelsLine|HEADLINES_NOTE|DECISION_AS_REPORTED|ALSO_REPORTED|NOTHING_ELSE|FINDINGS_CAVEAT|windowOpenedNote|measuredCaption|measuredRowText|unchangedLine|capitalLine|capitalRulesLine|capacityLine|estimatesNowLine|openQuestionLine|LATER_NOTE)\b" src/ui/copy.ts` prints nothing; if it prints a line, stop and ask rather than overwrite a Phase 10 builder). Do not add a builder called `investedLine`: no phase uses one, and the investment sentence here is `investmentPointLine`. Merge these imports into the top of `src/ui/copy.ts`, adding only the names that are not already imported (if `copy.ts` does not exist, create it with these imports and a one-line header comment, "Play-screen sentence builders. Pure functions, so the copy rules can be tested."):

```ts
import type { PublicRules } from "../content";
import type { CapacityLabel, Domain, Track } from "../engine";
import type { Band, MeasuredChange, TurnConsequences } from "./consequences";
import { DOMAIN_LABEL, formatMonth, METRIC_LABEL, percent, signed, TRACK_LABEL, type ExactMetric } from "./format";
import type { MilestoneStatus } from "./preparation";
import type { ChoicePreview, PreviewRow } from "./preview";
```

Then append this section at the end of the file. Four choices in it: the price notes say "some options", because which options are repriced (the `restrictive` pricing class) is not public, and the costs on the cards already include the change; the boom note states a simulated figure (Economy 65 or above), so it carries the prefix; `capitalLine` gives only the two numbers, and the income rules move to the glossary's Political Capital entry (`capitalRulesLine`, rendered by `StatusPanel` in Task 11.10), which carries the prefix because it names a Public Trust threshold; the window notes take a turn count that the caller has already capped at the turns left in the game (Tasks 11.7 and 11.9).

```ts
// ---------------------------------------------------------------- Phase 11: decision, investment and consequences
// A group of simulated figures is introduced by a caption that begins "Under this
// game's assumptions" (DECISIONS.md, F12). Political Capital is the player's own
// budget, not a simulated statistic, so capital sentences carry no prefix, except the
// income rules, which name a Public Trust threshold.

/** The caption over the options' stated effects, on the Decision screen. */
export const DECISION_INTRO = "Under this game's assumptions, each option lists the effects officials expect. Every option also has effects you cannot see from here.";
export const OFFICIALS_EXPECT = "Under this game's assumptions, officials expect:";
export const NO_STATED_EFFECT = "Under this game's assumptions, officials expect no immediate effect you can see.";
/** The preview before any option is selected. */
export const PREVIEW_PROMPT = "Choose an option above to see the Political Capital it would leave and what officials expect it to do.";

/** The one-line, live summary beside the Confirm button. */
export function previewSummary(preview: ChoicePreview | null): string {
  if (!preview) return "Choose an option to see what it would cost.";
  if (preview.capitalAfter !== null) return `Option ${preview.id}: Political Capital ${preview.capitalNow} → ${preview.capitalAfter} (costs ${preview.cost}).`;
  if (preview.status === "unaffordable") return `Option ${preview.id}: ${unaffordableLine(preview.cost, preview.capitalNow)} Choose another option.`;
  return `Option ${preview.id} is locked. Choose another option.`;
}

/** "National Security +4 (now 52)". Estimates and the label get the stated change only. */
export function previewRowText(row: PreviewRow): string {
  const change = `${METRIC_LABEL[row.metric]} ${signed(row.delta)}`;
  if (row.now !== null) return `${change} (now ${row.now})`;
  return row.metric === "stateCapacity" ? `${change} (shown only as a label)` : `${change} (an estimate, with no exact figure)`;
}

/**
 * Always shown in the preview, with or without a selection. Never a per-option "may
 * fail", which would expose hidden conditions.
 */
export function previewCaveat(isFinal: boolean): string {
  const movers = isFinal ? "background change and events" : "background change, events and this turn's investment";
  return `Officials' expectations are not promises: plans do not always work out. Other effects are not shown, and ${movers} also move the numbers.`;
}

export const unaffordableLine = (cost: number, have: number) => `Costs ${cost}; you have ${have}.`;
export const levelHaveLine = (level: number) => `You have level ${level}.`;

/**
 * Why some options in this scenario cost less. `turnsLeft` counts this turn, capped at
 * the turns left in the game. The pricing class ("restrictive") is not public, so the
 * note says "some options" and the prices on the cards already include the discount.
 */
export function windowNote(domain: Domain, turnsLeft: number, rules: PublicRules): string {
  const span = turnsLeft === 1 ? "this turn only" : turnsLeft === 2 ? "this turn and next" : `for ${turnsLeft} turns, counting this one`;
  return `Some options here cost ${rules.windowDiscount} less Political Capital than usual (never below ${rules.windowMinCost}) ${span}, because a public incident in ${DOMAIN_LABEL[domain]} has made restrictions easier to pass. The costs shown already include this.`;
}

/** Why some options cost more while the economy booms. Economy is a simulated figure, so the note carries the prefix. */
export function boomNote(rules: PublicRules): string {
  return `Under this game's assumptions, the economy is booming (Economy ${rules.boomEconomyAt} or above), so some of the more restrictive options cost ${rules.boomSurcharge} more Political Capital than usual. The costs shown already include this.`;
}

// The investment ladder.

export function ladderIntro(points: number, levels: number, thisPoint: number): string {
  return `One point each turn, into one track. It costs no Political Capital. You have ${points} points in the whole game and ${levels} levels to fill, so you cannot prepare for everything. This is point ${thisPoint} of ${points}.`;
}
export const LADDER_CAPTION = "Under this game's assumptions, each level adds its bonus once, when you reach it.";
export const thisTurnLine = (from: number) => `This turn: level ${from} → ${from + 1}. Takes effect when the turn ends.`;
export const TRACK_COMPLETE = "Complete: all three levels reached.";
export const MILESTONE_STATUS: Record<MilestoneStatus, string | null> = {
  ahead: "still ahead",
  outOfReach: "too few turns left to reach this level in time",
  passed: "no remaining turn uses this",
  standing: null,
};

// The consequences screen.

export const chosenLine = (id: string, text: string) => `You chose option ${id}: ${text}`;
export function spentLine(chose: NonNullable<TurnConsequences["chose"]>, infoCost: number): string {
  return chose.boughtAnalysis
    ? `It cost ${chose.costPaid} Political Capital, and the analysis ${infoCost} more.`
    : `It cost ${chose.costPaid} Political Capital.`;
}
/** Under "Your decision": where the point went, never the level change (see trackLevelsLine). */
export const investmentPointLine = (track: Track) => `You put this turn's investment point into ${TRACK_LABEL[track]}.`;
/**
 * Every track level that changed, listed with the measured changes and never under "Your
 * decision": a rise beyond the investment point comes from effects the player cannot see.
 */
export const trackLevelsLine = (changes: TurnConsequences["trackChanges"]) =>
  `Standing investment: ${changes.map((c) => `${TRACK_LABEL[c.track]} level ${c.from} → ${c.to}`).join("; ")}.`;
export const HEADLINES_NOTE = "Headlines report what was noticed, which is not always what happened.";
export const DECISION_AS_REPORTED = "Your decision, as reported";
export const ALSO_REPORTED = "Also reported";
export const NOTHING_ELSE = "Nothing else made the news this turn.";
/** Revealed findings are drawn at a reliability below 100 (resolve.ts), like the briefing's assessment. */
export const FINDINGS_CAVEAT = "Findings are not always accurate, like any assessment.";

/** A policy window opened by this turn's events. `turnsLeft` is capped at the turns left in the game. */
export function windowOpenedNote(domain: Domain, turnsLeft: number, rules: PublicRules): string {
  const span = turnsLeft === 1 ? "next turn" : `for the next ${turnsLeft} turns`;
  return `After this public incident in ${DOMAIN_LABEL[domain]}, some options in that area will cost ${rules.windowDiscount} less Political Capital (never below ${rules.windowMinCost}) ${span}. Restrictions are easiest to pass after harm.`;
}

export function measuredCaption(isFinal: boolean): string {
  const causes = isFinal ? "your decision, any events reported above, background trends and effects you cannot see" : "your decision, your investment, any events reported above, background trends and effects you cannot see";
  return `Under this game's assumptions, these are the changes you can measure since you decided. Each one combines ${causes}.`;
}
export const measuredRowText = (row: MeasuredChange) => `${METRIC_LABEL[row.metric]}: ${row.before} → ${row.after} (${signed(row.delta)})`;
export const unchangedLine = (metrics: ExactMetric[]) => `No change: ${metrics.map((m) => METRIC_LABEL[m]).join(", ")}.`;

/** Next turn's Political Capital. How income works is in the glossary (capitalRulesLine). */
export function capitalLine(capital: NonNullable<TurnConsequences["capital"]>): string {
  return `Political Capital: ${capital.leftAfterSpending} left after this turn's spending; ${capital.nextTurn} to start the next turn.`;
}

/** How Political Capital comes in, for the glossary. It names a Public Trust threshold, so it carries the prefix. */
export function capitalRulesLine(rules: PublicRules): string {
  return `Under this game's assumptions, each turn adds ${rules.perTurn} Political Capital; at most ${rules.carryCap} unspent points carry over; Public Trust at ${rules.trustBonusAt} or above adds 1, and at ${rules.trustPenaltyAt} or below takes 1 away.`;
}

export const capacityLine = (before: CapacityLabel, after: CapacityLabel) => `Under this game's assumptions, State Capacity is now ${after} (it was ${before}).`;

/** The estimates as they stand. Never a change: the bands are redrawn every turn. */
export function estimatesNowLine(systemicRisk: Band, cooperation: Band): string {
  return `Under this game's assumptions, Systemic AI Risk is now estimated at ${systemicRisk.low}–${systemicRisk.high} and International Cooperation at ${cooperation.low}–${cooperation.high}. Estimates are redrawn every turn, so a shift in a band is not a measured change.`;
}

export function openQuestionLine(unknown: NonNullable<TurnConsequences["unknown"]>): string {
  const yours = unknown.forecast === null ? "" : `You forecast ${percent(unknown.forecast)}. `;
  return `${yours}${unknown.question} It resolves by ${formatMonth(unknown.resolvesBy)}; you will see how it turned out in the debrief.`;
}
export const LATER_NOTE = "Some effects of decisions may surface later, if at all.";
```

**Step 4: Run it and watch it pass.**

```bash
npx vitest run tests/ui && npx tsc --noEmit && npx eslint src/ui tests/ui
```

Expected: every file in `tests/ui` passes (the new file adds 11 tests, and Phase 10's copy tests still pass); `tsc` and `eslint` print nothing.

**Step 5: Commit.**

```bash
git add src/ui/copy.ts tests/ui/turn-copy.test.ts
git commit -m "feat(ui): copy builders for the preview, the ladder and the consequences (F12)"
```

### Task 11.7: The choice preview on the Decision screen

**Depends on:** Phase 8 (`LABEL`; the stale-selection crash fix and its regression test in `e2e/regressions.spec.ts`), Phase 9 (`e2e/engagement.spec.ts`), Phase 10 (`BriefingRecap`, already the last child of `Decision.tsx`'s root); Tasks 11.3 and 11.6.

**Files:**
- Create: `src/ui/components/ChoicePreview.tsx`
- Modify: `src/ui/screens/Decision.tsx` (whole component; see the preservation note in Step 3)
- Modify: `src/ui/theme.css` (after the `:focus-visible` rule, lines 116-120)
- Test: `e2e/engagement.spec.ts` (created in Phase 9; add a Phase 11 block)
- Test: `e2e/polish.spec.ts` (one axe scan in the walk, after the first option `check()` that follows the "decision" scan)

**Step 1: Write the failing test.** In `e2e/engagement.spec.ts`, make sure the imports include `expect` and `test` from `@playwright/test` and `LABEL`, `startGame` and `toDecision` from `./play` (merge names into the existing import lines). Append at the end of the file:

```ts
// ---------------------------------------------------------------- Phase 11: decision, investment and consequences

test.describe("decision, investment and consequences", () => {
  test("choosing an option previews the Political Capital it would leave", async ({ page }) => {
    await startGame(page, "PREVIEW-E2E");
    await toDecision(page);
    await expect(page.getByText("Choose an option to see what it would cost.")).toBeVisible();
    const capital = Number((await page.getByLabel(/^\d+ Political Capital$/).getAttribute("aria-label"))!.split(" ")[0]);
    const option = page.locator('input[name="choice"]:enabled').first();
    const id = (await option.getAttribute("id"))!.replace("choice-", "");
    const cost = Number(/Cost:\s*(\d+) Political Capital/.exec(await page.locator(`#choice-${id}-detail`).innerText())![1]);

    await option.check();
    await expect(page.getByText(`Option ${id}: Political Capital ${capital} → ${capital - cost} (costs ${cost}).`)).toBeVisible();
    await expect(page.getByRole("heading", { name: `If you choose option ${id}` })).toBeVisible();
    await expect(page.getByText("plans do not always work out", { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: `Confirm option ${id}` })).toBeEnabled();
  });

  test("on a desktop, the Political Capital an option would leave is in view as soon as it is picked", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await startGame(page, "PREVIEW-DESKTOP");
    await toDecision(page);
    await page.locator('input[name="choice"]:enabled').first().check();
    await expect(page.getByText(/^Option [A-E]: Political Capital \d+ → \d+/)).toBeInViewport();
    await expect(page.getByRole("button", { name: LABEL.confirm })).toBeInViewport();
  });
});
```

In `e2e/polish.spec.ts`, in the axe walk, find the first line

```ts
    await page.locator('input[name="choice"]:enabled').first().check();
```

that follows `await expectNoSeriousViolations(page, "decision");`. After Phase 10 it follows the recap scan instead, and the lines read:

```ts
    await expectNoSeriousViolations(page, "decision");
    await page.getByText("Look again at the briefing and your advisers").click();
    await expectNoSeriousViolations(page, "decision with the briefing recap open");
    await page.locator('input[name="choice"]:enabled').first().check();
```

(At `a11ef34`, without Phase 10, the `check()` line comes straight after the "decision" scan, at line 101.) Insert one line directly after that `check()` line. The same `check()` text appears again later for the crisis decision; leave that one alone.

```ts
    await expectNoSeriousViolations(page, "decision with a choice previewed");
```

**Step 2: Run it and watch it fail.**

```bash
npm run e2e -- e2e/engagement.spec.ts -g "previews the Political Capital|on a desktop"
```

Expected: 2 failed. The first: `expect(locator).toBeVisible()` on `getByText('Choose an option to see what it would cost.')` reports `element(s) not found`. The second: `toBeInViewport()` on `getByText(/^Option [A-E]: Political Capital \d+ → \d+/)` reports `element(s) not found`.

**Step 3: Implement.** Create `src/ui/components/ChoicePreview.tsx`. Its stated-effects section follows the option group in DOM order (so one Tab from "Commission analysis" still lands on the first radio), and its bar (`data-decision-bar`) holds the one-line `aria-live="polite"` summary and the Confirm button. Before anything is picked, the section says what picking will show. The bar sticks to the bottom of the viewport at every width, but only when the viewport is at least 36rem (576px) tall (see the `theme.css` step below). Without it on a desktop, the capital left sits several hundred pixels below the fold when the player picks an option (the bar measured 1117px from the top of an 800px viewport). With it at every height, the bar would take 46% of a 320 × 256 viewport (400% zoom) and 26% of a landscape phone. The bar is a direct child of the Decision root, so it sticks for the whole option list; Phase 10's recap comes after it, so once the player scrolls down into the open recap, the bar settles above it.

```tsx
import { Button } from "./Button";
import { NO_STATED_EFFECT, OFFICIALS_EXPECT, PREVIEW_PROMPT, previewCaveat, previewRowText, previewSummary } from "../copy";
import type { ChoicePreview as Preview } from "../preview";

interface Props {
  /** The selected option's preview, or null before anything is selected. */
  preview: Preview | null;
  /** The final decision takes no investment, so the caveat leaves it out. */
  isFinal: boolean;
  onConfirm: () => void;
}

/**
 * What the selected option would cost and what officials expect it to do. It sits
 * after the option group in reading order, so one Tab from "Commission analysis"
 * still lands on the options. The bar (`data-decision-bar`) holds the live summary and
 * the Confirm button; theme.css makes it sticky at the bottom of the viewport whenever
 * the viewport is tall enough, and keeps focus from scrolling under it.
 */
export function ChoicePreview({ preview, isFinal, onConfirm }: Props) {
  // Confirmable only while the live status says so: buying analysis can price a selection out (the Phase 8 fix).
  const confirmId = preview?.status === "available" ? preview.id : null;
  return (
    <>
      <section aria-labelledby="choice-preview-heading" className="border border-rule p-4">
        <h2 id="choice-preview-heading" className="font-semibold">
          {preview ? `If you choose option ${preview.id}` : "Before you choose"}
        </h2>
        {!preview && <p className="mt-1 text-sm">{PREVIEW_PROMPT}</p>}
        {preview && preview.rows.length > 0 && (
          <>
            <p className="mt-1 text-sm">{OFFICIALS_EXPECT}</p>
            <ul className="mt-1 space-y-0.5 font-mono text-sm">
              {preview.rows.map((row) => (
                <li key={row.metric}>{previewRowText(row)}</li>
              ))}
            </ul>
          </>
        )}
        {preview && preview.rows.length === 0 && <p className="mt-1 text-sm">{NO_STATED_EFFECT}</p>}
        <p className="mt-2 text-sm text-muted">{previewCaveat(isFinal)}</p>
      </section>

      <div data-decision-bar className="-mx-4 border-t border-ink bg-paper px-4 py-3 sm:-mx-8 sm:px-8">
        <p aria-live="polite" className="text-sm font-semibold">
          {previewSummary(preview)}
        </p>
        <Button className="mt-2" disabled={confirmId === null} onClick={onConfirm}>
          {confirmId ? `Confirm option ${confirmId}` : "Choose an option"}
        </Button>
      </div>
    </>
  );
}
```

Replace `src/ui/screens/Decision.tsx` with the file below. **Preservation note:** before replacing, diff the current file against this listing. The listing contains both parts of Phase 8's fix, and `e2e/regressions.spec.ts` asserts both: (1) the pick counts only while its live status is `"available"`, re-implemented here in derived form (the radio is `checked` only when available, `ChoicePreview` enables Confirm only for an available preview, and the Confirm handler re-checks the status), in place of Phase 8's `chosen` variable; (2) focus moves to the purchased analysis, kept verbatim from Phase 8 (the `useEffect`/`useRef` import, `bought`, the `analysis` ref with its focus-only effect, and `ref={analysis} tabIndex={-1} className="mt-1 outline-none"` on the analysis paragraph). If the diff shows any other Phase 8 line that the listing lacks, keep that line. Phase 10's `BriefingRecap` import and element are already in the listing: the element stays the last child of the root, after `<ChoicePreview>` (which now holds the Confirm button), exactly where Phase 10 put it after Confirm. Phase 10's recap tests and its rail link to `#briefing-recap` rely on that. Do not move it up next to Commission analysis: its `<summary>` would then sit between the "Commission analysis" button and the option group and break the keyboard contract. If Phase 10 did not land, delete the `BriefingRecap` import and the two recap lines (the comment and the element). If Phase 8 or Phase 10 added anything else to the screen, keep it, and keep nothing focusable between the "Commission analysis" button and the option group. What changes: the intro replaces "Visible effects apply at once." with the D13 caption; cards say "Officials expect:" instead of "Visible effects:"; an unaffordable option says "Costs N; you have M."; a locked option keeps the exact sentence "Locked: needs … at level N." and adds "You have level N." as a separate sentence; "Open to you because of your investment in …" is unchanged; policy-window and boom notes appear inside the fieldset (no focusable content), and the window note never promises more turns than the game has left; the Confirm button moves into `ChoicePreview`.

```tsx
import { useEffect, useRef, useState } from "react";
import { BriefingRecap } from "../components/BriefingRecap";
import { Button } from "../components/Button";
import { ChoicePreview } from "../components/ChoicePreview";
import { Icon } from "../components/Icon";
import { boomNote, DECISION_INTRO, levelHaveLine, unaffordableLine, windowNote } from "../copy";
import { formatEffects, LEVER_LABEL, TRACK_LABEL } from "../format";
import { choicePreview, pricingNotes } from "../preview";
import { pub } from "../useGame";
import type { PublicScenario } from "../../content";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  scenario: PublicScenario;
  onBuyInfo: () => void;
  onDecide: (choiceId: string) => void;
}

/** Steps 3 and 4: an optional information purchase, then one decision. */
export function Decision({ view, scenario, onBuyInfo, onDecide }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const ctx = view.current!;
  const purchased = view.intel.find((r) => r.turn === view.turn && r.source === "purchase");
  const bought = purchased !== undefined;
  const analysis = useRef<HTMLParagraphElement>(null);
  // Phase 8: the Commission button unmounts once the analysis arrives, so focus moves to what was bought.
  useEffect(() => {
    if (bought) analysis.current?.focus();
  }, [bought]);
  const statusOf = (id: string) => ctx.choices.find((o) => o.id === id)!.status;
  // Options opened by earlier investment come first: this is where preparation pays (spec Section 4).
  const prepared = (id: string, unlock: unknown) => (unlock && statusOf(id) !== "locked" ? 0 : 1);
  const ordered = [...scenario.choices].sort((a, b) => prepared(a.id, a.unlock) - prepared(b.id, b.unlock));
  // Buying analysis recomputes every status, so a selection can stop being affordable.
  // Whether it can be confirmed is derived from the live status, never from `selected` alone.
  const preview = selected ? choicePreview(view, scenario, selected) : null;
  const notes = pricingNotes(view, scenario, pub.rules);
  // A window can outlast the game: never promise more turns than are left, counting this one.
  const windowTurns = notes.window ? Math.min(notes.window.turnsLeft, pub.totalTurns - view.turn + 1) : 0;

  return (
    <div className="space-y-6">
      {scenario.isCrisis && <p className="text-sm font-semibold">No analysis can be commissioned in a crisis.</p>}
      {!scenario.isCrisis && (
        <section aria-label="Commission analysis" className="border border-rule p-4">
          <h2 className="font-semibold">Commission analysis</h2>
          {purchased ? (
            <>
              <p ref={analysis} tabIndex={-1} className="mt-1 outline-none">
                {purchased.text}
              </p>
              <p className="mt-1 text-xs text-muted">A second, independent reading. It is more reliable when State Capacity is higher, and it can still be wrong.</p>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm">
                For {pub.infoCost} Political Capital, your analysts return a second, independent reading of what lies behind this briefing.
              </p>
              <Button variant="quiet" className="mt-3" disabled={!ctx.canBuyInfo} onClick={onBuyInfo}>
                Commission analysis ({pub.infoCost} Political Capital)
              </Button>
              {!ctx.canBuyInfo && <p className="mt-2 text-xs text-muted">You cannot afford analysis and a decision this turn.</p>}
            </>
          )}
        </section>
      )}

      <fieldset>
        <legend className="text-xl font-semibold">Your decision</legend>
        <p className="mt-1 text-sm text-muted">
          You have {view.politicalCapital} Political Capital. {DECISION_INTRO}
        </p>
        {notes.window && <p className="mt-2 border-l-2 border-ink pl-3 text-sm">{windowNote(notes.window.domain, windowTurns, pub.rules)}</p>}
        {notes.boom && <p className="mt-2 border-l-2 border-ink pl-3 text-sm">{boomNote(pub.rules)}</p>}
        <div className="mt-4 space-y-3">
          {ordered.map((choice) => {
            const option = ctx.choices.find((o) => o.id === choice.id)!;
            const available = option.status === "available";
            const on = selected === choice.id && available;
            const inputId = `choice-${choice.id}`;
            return (
              <div key={choice.id} className={`border p-4 ${on ? "border-ink bg-ink text-paper" : "border-rule"} ${available ? "" : "opacity-60"}`}>
                <div className="flex gap-3">
                  <input
                    id={inputId}
                    type="radio"
                    name="choice"
                    className="mt-1.5 size-4 accent-current"
                    checked={on}
                    disabled={!available}
                    onChange={() => setSelected(choice.id)}
                    aria-describedby={`${inputId}-detail`}
                  />
                  <div>
                    <label htmlFor={inputId} className="font-semibold">
                      {choice.id}. {choice.text}
                    </label>
                    <p id={`${inputId}-detail`} className="mt-1 text-sm">
                      <span className={on ? "opacity-80" : "text-muted"}>Lever:</span> {LEVER_LABEL[choice.lever]} &middot;{" "}
                      <span className={on ? "opacity-80" : "text-muted"}>Cost:</span>{" "}
                      <Icon name="capital" className="mx-0.5" />
                      {option.cost} Political Capital
                      <br />
                      <span className={on ? "opacity-80" : "text-muted"}>Officials expect:</span> {formatEffects(choice.visibleEffects)}
                      {choice.unlock && option.status !== "locked" && (
                        <>
                          <br />
                          <Icon name="unlock" className="mr-1" />
                          <span className="font-semibold">Open to you because of your investment in {TRACK_LABEL[choice.unlock.track]}.</span>
                        </>
                      )}
                      {option.status === "unaffordable" && (
                        <>
                          <br />
                          <span className="font-semibold">{unaffordableLine(option.cost, view.politicalCapital)}</span>
                        </>
                      )}
                      {option.status === "locked" && choice.unlock && (
                        <>
                          <br />
                          <Icon name="lock" className="mr-1" />
                          <span className="font-semibold">
                            Locked: needs {TRACK_LABEL[choice.unlock.track]} at level {choice.unlock.level}.
                          </span>{" "}
                          <span>{levelHaveLine(view.tracks[choice.unlock.track])}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>

      <ChoicePreview
        preview={preview}
        isFinal={ctx.isFinal}
        onConfirm={() => {
          if (selected && preview?.status === "available") onDecide(selected);
        }}
      />

      {/* Phase 10: after the confirm bar, so the keyboard order above is unchanged. The forecast is locked, so the advisers' estimates can show. */}
      <BriefingRecap view={view} scenario={scenario} showForecasts />
    </div>
  );
}
```

In `src/ui/theme.css`, replace

```css
/* One visible focus style everywhere, for keyboard operation (WCAG 2.4.7). */
:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}
```

with

```css
/* One visible focus style everywhere, for keyboard operation (WCAG 2.4.7). */
:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

/* On an inverted (ink) ground, such as a selected option card, the accent ring falls
   below 3:1 against ink; draw it in the paper colour there (WCAG 1.4.11). */
.bg-ink :focus-visible {
  outline-color: var(--paper);
}

/* The Decision screen's confirm bar sticks to the bottom of the viewport at every width,
   so the Political Capital an option would leave is in view as soon as it is picked; but
   only when the viewport is tall enough. At high zoom or on a landscape phone it would
   cover half the screen (WCAG 1.4.10). Keep keyboard focus from scrolling under it
   (WCAG 2.4.11). */
@media (min-height: 36rem) {
  [data-decision-bar] {
    position: sticky;
    bottom: 0;
    z-index: 10;
  }
  html:has([data-decision-bar]) {
    scroll-padding-bottom: 9rem;
  }
}
```

(Navy `#1f4e79` on ink `#16181d` is about 2.0:1, and `#8fb8de` on `#ecebe6` about 1.8:1 in dark mode; paper on ink is well above 3:1 in both themes. A focused radio inside a selected card now computes `outline-color: rgb(247, 245, 240)` on an `rgb(22, 24, 29)` card in light mode. The bar's `-mx-4 … sm:-mx-8` matches the Artboard's `px-4 sm:px-8` padding at every width, so it spans the paper edge to edge and adds no sideways scroll. Measured with an option picked: the bar is sticky, 97px tall and flush with the bottom at 1280 × 800, 1024 × 768, 375 × 667 and 360 × 740; it is static at 667 × 375 and 320 × 256; sideways overflow is 0 at all six.)

**Step 4: Run it and watch it pass.**

```bash
npx tsc --noEmit && npx eslint src/ui e2e && npm run e2e -- e2e/engagement.spec.ts e2e/polish.spec.ts e2e/crisis.spec.ts e2e/regressions.spec.ts
```

Expected: `tsc` and `eslint` print nothing; all tests in the four files pass. They include the two new tests; Phase 10's recap and rail tests in `e2e/engagement.spec.ts` (the recap is still the last child of the Decision root); both axe walks (light and dark) with the new "decision with a choice previewed" scan; the keyboard test (one Tab from Commission analysis lands in the option group, and Confirm is still reachable); the crisis tests ("Locked: needs Provenance infrastructure at level 2." and "Open to you because of your investment in Provenance infrastructure." still match); and Phase 8's regression test in `e2e/regressions.spec.ts`, which checks both that the priced-out pick is cleared and that focus lands on the purchased analysis (`[tabindex="-1"]` inside the "Commission analysis" region). If that last check fails with `element(s) not found`, the focus-move lines from the preservation note are missing.

**Step 5: Commit.**

```bash
git add src/ui/components/ChoicePreview.tsx src/ui/screens/Decision.tsx src/ui/theme.css e2e/engagement.spec.ts e2e/polish.spec.ts
git commit -m "feat(ui): preview the cost and stated effects of the selected option"
```

### Task 11.8: The standing-investment ladder

**Depends on:** Phase 8 (`LABEL`, waiting `finishTurn`); Tasks 11.4 and 11.6. Replaces the interim `Invest.tsx` edit from Task 11.2.

**Files:**
- Create: `src/ui/components/TrackLadder.tsx`
- Modify: `src/ui/screens/Invest.tsx` (whole component)
- Test: `e2e/engagement.spec.ts` (one test inside the Phase 11 block)
- Test: `e2e/polish.spec.ts` (one axe scan in the walk, around lines 103-104)

**Step 1: Write the failing test.** Inside `test.describe("decision, investment and consequences", …)` in `e2e/engagement.spec.ts`, after the preview test, add:

```ts
  test("the investment ladder spells out this turn's level change", async ({ page }) => {
    await startGame(page, "LADDER-E2E");
    await toDecision(page);
    await page.locator('input[name="choice"]:enabled').first().check();
    await page.getByRole("button", { name: LABEL.confirm }).click();
    await expect(page.getByRole("group", { name: LABEL.investGroup })).toBeVisible();
    await expect(page.getByText(/^This turn: level/)).toHaveCount(0);

    await page.getByRole("radio", { name: /^Evaluation science/ }).check();
    await expect(page.getByText("This turn: level 0 → 1. Takes effect when the turn ends.")).toBeVisible();
    await expect(page.getByText("Bonus per level: State Capacity +4")).toBeVisible();
    await expect(page.getByText("A government incident-response model in the unscheduled crisis")).toBeVisible();
    await expect(page.getByText("(still ahead)").first()).toBeVisible();
  });
```

In `e2e/polish.spec.ts`, find the line `await expectNoSeriousViolations(page, "investment");` and the track `check()` line that follows it (lines 103-104 at `a11ef34`):

```ts
    await expectNoSeriousViolations(page, "investment");
    await page.locator('input[name="track"]:enabled').first().check();
```

and insert one line directly after that `check()` line:

```ts
    await expectNoSeriousViolations(page, "investment ladder with a track selected");
```

**Step 2: Run it and watch it fail.**

```bash
npm run e2e -- e2e/engagement.spec.ts -g "investment ladder"
```

Expected: 1 failed; `getByText('This turn: level 0 → 1. Takes effect when the turn ends.')` reports `element(s) not found`.

**Step 3: Implement.** Create `src/ui/components/TrackLadder.tsx`. It is visibly different from the policy cards: no inverted card, a thick left rule that darkens on selection, the per-level bonus stated once under the track name ("Bonus per level: State Capacity +4", passed in by `Invest.tsx` from `trackBonusText`, and part of the radio's description), three rungs whose squares fill as levels are reached ("(reached)" in words too, so meaning is not carried by fill alone), and the rung this turn would reach outlined with "This turn: level n → n+1. Takes effect when the turn ends." Native radios keep `name="track"` and ids `track-{track}`, and the label starts with the track label (the icon is `aria-hidden`), which `e2e/play.ts` relies on.

```tsx
import { Icon, type IconName } from "./Icon";
import { MILESTONE_STATUS, thisTurnLine, TRACK_COMPLETE } from "../copy";
import { TRACK_LABEL } from "../format";
import type { Rung } from "../preparation";
import type { Track, TrackLevel } from "../../engine";

const TRACK_ICON: Record<Track, IconName> = {
  evaluation: "evaluation",
  provenance: "provenance",
  diplomacy: "diplomacy",
  defensiveCyber: "defensiveCyber",
};

interface Props {
  track: Track;
  level: TrackLevel;
  /** What each level adds once, when reached: "State Capacity +4". */
  bonus: string;
  rungs: Rung[];
  selected: boolean;
  onSelect: () => void;
}

/**
 * One standing-investment track as a ladder of three rungs. Deliberately unlike the
 * policy cards: no inverted card, the per-level bonus stated once, a rail of rungs that
 * fill as levels are reached, and the rung this turn would reach outlined and spelt out
 * when the track is selected.
 * The radio's accessible name starts with the track label (e2e/play.ts relies on it).
 */
export function TrackLadder({ track, level, bonus, rungs, selected, onSelect }: Props) {
  const full = level >= 3;
  const inputId = `track-${track}`;
  return (
    <div className={`border-l-4 py-1 pl-3 ${selected ? "border-ink" : "border-rule"}`}>
      <div className="flex items-start gap-3">
        <input
          id={inputId}
          type="radio"
          name="track"
          className="mt-1.5 size-4 accent-current"
          checked={selected}
          disabled={full}
          onChange={onSelect}
          aria-describedby={`${inputId}-bonus ${inputId}-ladder`}
        />
        <label htmlFor={inputId} className="font-semibold">
          <Icon name={TRACK_ICON[track]} className="mr-1" />
          {TRACK_LABEL[track]} <span className="whitespace-nowrap font-mono font-normal text-muted">&middot; level {level} of 3</span>
        </label>
      </div>
      <p id={`${inputId}-bonus`} className="ml-7 mt-1 text-sm">
        Bonus per level: {bonus}
      </p>
      {/* No aria-label here: the radio's description is this list's text, and an aria-label would replace all of it. */}
      <ol id={`${inputId}-ladder`} className="ml-7 mt-2 space-y-1 text-sm">
        {rungs.map((rung) => {
          const target = selected && rung.next;
          return (
            <li key={rung.level} className={`flex gap-2 border px-2 py-1 ${target ? "border-dashed border-ink" : "border-transparent"}`}>
              <span aria-hidden="true" className={`mt-1 inline-block size-3 shrink-0 border border-current ${rung.reached ? "bg-current" : ""}`} />
              <div className="min-w-0">
                <span className="font-mono">Level {rung.level}</span>
                {rung.reached && <span className="text-muted"> (reached)</span>}
                {rung.milestones.map((milestone) => (
                  <span key={milestone.text} className="block">
                    <Icon name={rung.reached ? "unlock" : "lock"} className="mr-1" />
                    {milestone.text}
                    {MILESTONE_STATUS[milestone.status] && <span className="text-muted"> ({MILESTONE_STATUS[milestone.status]})</span>}
                  </span>
                ))}
                {target && <span className="block font-semibold">{thisTurnLine(level)}</span>}
              </div>
            </li>
          );
        })}
      </ol>
      {full && <p className="ml-7 mt-1 text-sm">{TRACK_COMPLETE}</p>}
    </div>
  );
}
```

Replace `src/ui/screens/Invest.tsx` with the file below. The fieldset legend stays exactly "Standing investment"; the intro numbers are derived (`pub.totalTurns - 1` points; `TRACKS.length * 3` levels); nothing focusable precedes the first radio, so the first Tab stop after the h1 is still a track radio. Do not touch the StatusPanel's "Standing investments" section: it must stay a `section` (role region), never a `fieldset`, or `getByRole("group", { name: "Standing investment" })` would match two elements.

```tsx
import { useState } from "react";
import { Button } from "../components/Button";
import { TrackLadder } from "../components/TrackLadder";
import { LADDER_CAPTION, ladderIntro } from "../copy";
import { TRACK_LABEL, trackBonusText, TRACKS } from "../format";
import { milestonesFor } from "../preparation";
import { pub } from "../useGame";
import type { DisplayedState, Track } from "../../engine";

interface Props {
  view: DisplayedState;
  onInvest: (track: Track) => void;
}

/** Step 5: one point into one track. Tracks unlock later options, which is where preparation pays. */
export function Invest({ view, onInvest }: Props) {
  const [selected, setSelected] = useState<Track | null>(null);
  const points = pub.totalTurns - 1;                // one a turn; the final decision takes none (decision 3)
  const levels = TRACKS.length * 3;

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-xl font-semibold">Standing investment</legend>
        <p className="mt-1 text-sm text-muted">{ladderIntro(points, levels, Math.min(view.turn, points))}</p>
        <p className="mt-1 text-sm text-muted">{LADDER_CAPTION}</p>
        <div className="mt-4 space-y-4">
          {TRACKS.map((track) => (
            <TrackLadder
              key={track}
              track={track}
              level={view.tracks[track]}
              bonus={trackBonusText(pub.trackBonuses[track])}
              rungs={milestonesFor(track, view, pub)}
              selected={selected === track}
              onSelect={() => setSelected(track)}
            />
          ))}
        </div>
      </fieldset>
      <Button disabled={selected === null} onClick={() => selected && onInvest(selected)}>
        {selected ? `Invest in ${TRACK_LABEL[selected]} and see what follows` : "Choose a track"}
      </Button>
    </div>
  );
}
```

**Step 4: Run it and watch it pass.**

```bash
npx tsc --noEmit && npx eslint src/ui e2e && npm run e2e -- e2e/engagement.spec.ts e2e/polish.spec.ts e2e/crisis.spec.ts
```

Expected: `tsc` and `eslint` print nothing; all tests in the three files pass, including the ladder test (its level-change line and its "Bonus per level" line), the new axe scan in both themes, the keyboard test (Tab then Space on Invest selects a track radio) and the crisis tests (which invest through `e2e/play.ts` by track name).

**Step 5: Commit.**

```bash
git add src/ui/components/TrackLadder.tsx src/ui/screens/Invest.tsx e2e/engagement.spec.ts e2e/polish.spec.ts
git commit -m "feat(ui): standing investment as a ladder with milestones and this turn's level change"
```

### Task 11.9: Consequences in four parts, in the main column

**Depends on:** Phase 8 (`LABEL`); Tasks 11.5 and 11.6. Phase 12 later changes `onContinue` on the same `<News … />` element.

**Files:**
- Modify: `src/ui/screens/News.tsx` (whole component; new props `{ view, before, scenario, resolvedTurn, onContinue }`)
- Modify: `src/ui/App.tsx` (the `<News … />` render, lines 158-160)
- Test: `e2e/engagement.spec.ts` (a helper above the Phase 11 block and two tests inside it)

**Step 1: Write the failing test.** In `e2e/engagement.spec.ts`, add `type Locator` to the `@playwright/test` import. Directly above `test.describe("decision, investment and consequences", …)`, add:

```ts
/** True when `a` comes before `b` in document order (reading and tab order). */
async function precedes(a: Locator, b: Locator): Promise<boolean> {
  const other = await b.elementHandle();
  return a.evaluate((el, node) => Boolean(el.compareDocumentPosition(node as Node) & Node.DOCUMENT_POSITION_FOLLOWING), other);
}
```

Inside the describe block, after the ladder test, add:

```ts
  test("on a phone, the news screen puts your decision and the measured changes before Next briefing", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await startGame(page, "NEWS-E2E");
    await toDecision(page);
    await page.locator("#choice-A").check();
    await page.getByRole("button", { name: LABEL.confirm }).click();
    await page.locator('input[name="track"]:enabled').first().check();
    await page.getByRole("button", { name: LABEL.investIn }).click();

    await expect(page.getByRole("heading", { name: LABEL.newsHeading })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Your decision" })).toBeVisible();
    await expect(page.getByText(/^You chose option A: /)).toBeVisible();
    const next = page.getByRole("button", { name: LABEL.next });
    const firstChange = page.getByText(/^(National Security|Economy|Public Trust|Innovation|Social Stability): \d+ → \d+ \([+−]\d+\)$/).first();
    expect(await precedes(page.getByRole("heading", { name: "What you can measure now" }), next)).toBe(true);
    expect(await precedes(firstChange, next)).toBe(true);
    await expect(page.getByText("shown beside this page", { exact: false })).toHaveCount(0);
  });

  test("no band width or odds figure appears on the decision, investment or news screens", async ({ page }) => {
    const clean = async (where: string, scope: Locator) => {
      const text = await scope.innerText();
      expect(text, where).not.toContain("halfWidth");
      expect(text, where).not.toMatch(/\d\s?%/);
    };
    await startGame(page, "NO-LEAK-E2E");
    await toDecision(page, 35);
    await page.locator('input[name="choice"]:enabled').first().check();
    await clean("the options", page.getByRole("group", { name: LABEL.decisionGroup }));
    await clean("the preview", page.getByRole("region", { name: /^If you choose option/ }));
    await page.getByRole("button", { name: LABEL.confirm }).click();
    await page.getByRole("radio", { name: /^Diplomacy/ }).check();
    await clean("the ladder", page.getByRole("group", { name: LABEL.investGroup }));
    await page.getByRole("button", { name: LABEL.investIn }).click();

    await expect(page.getByRole("heading", { name: LABEL.newsHeading })).toBeVisible();
    for (const name of ["Your decision", LABEL.newsHeading, "What you can measure now"]) await clean(name, page.getByRole("region", { name }));
    // The only percentage on the news screen is the player's own forecast.
    expect((await page.getByRole("region", { name: "Still unknown" }).innerText()).match(/\d+%/g)).toEqual(["35%"]);
  });
```

**Step 2: Run it and watch it fail.**

```bash
npm run e2e -- e2e/engagement.spec.ts -g "news screen|no band width"
```

Expected: 2 failed. The first reports `element(s) not found` for `getByRole('heading', { level: 2, name: 'Your decision' })`; the second fails when `getByRole('region', { name: 'Your decision' })` never appears (test timeout).

**Step 3: Implement.** Replace `src/ui/screens/News.tsx` with the file below. It keeps the h2 "What the world noticed" and the buttons "Next briefing" / "Read your debrief" exactly; removes the inaccurate "shown beside this page" sentence; names the policy area and takes the discount from `pub.rules`, and only for windows opened this turn; and gets every figure from `consequencesOf`. It never reads `view.current`, `view.truth`, `view.debrief` or `view.history`. It does not repeat the chosen option's stated effects (see the DECISIONS row in Task 11.12). The StatusPanel stays below `lg` on this screen as a reference; the main column now carries the changes.

```tsx
import { Button } from "../components/Button";
import { consequencesOf } from "../consequences";
import {
  ALSO_REPORTED, capacityLine, capitalLine, chosenLine, DECISION_AS_REPORTED, estimatesNowLine, FINDINGS_CAVEAT, HEADLINES_NOTE,
  investmentPointLine, LATER_NOTE, measuredCaption, measuredRowText, NOTHING_ELSE, openQuestionLine, spentLine, trackLevelsLine,
  unchangedLine, windowOpenedNote,
} from "../copy";
import { pub } from "../useGame";
import type { PublicScenario } from "../../content";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  /** The view captured just before the turn resolved. */
  before: DisplayedState | null;
  /** The scenario whose turn has just resolved. */
  scenario: PublicScenario;
  /** The turn that has just resolved. */
  resolvedTurn: number;
  onContinue: () => void;
}

/**
 * Step 6: consequences, in four parts in the main column: your decision, what the
 * world noticed, what you can measure now, and what is still unknown. Every figure
 * comes from `consequencesOf`, which reads only displayed states and public content.
 * On the final turn `view` already carries the debrief; nothing here reads it.
 */
export function News({ view, before, scenario, resolvedTurn, onContinue }: Props) {
  const over = view.phase === "debrief";
  const turn = before ? consequencesOf(before, view, { turn: resolvedTurn, scenarioId: scenario.id }, pub) : null;
  const headlines = turn ? turn.news : { decision: view.headlines[0] ?? null, elsewhere: view.headlines.slice(1) };
  const changed = turn ? turn.measured.filter((m) => m.delta !== 0) : [];
  const unchanged = turn ? turn.measured.filter((m) => m.delta === 0).map((m) => m.metric) : [];
  // A window can outlast the game: never promise more turns than are left.
  const turnsLeft = pub.totalTurns - resolvedTurn;

  return (
    <div className="space-y-8">
      {turn?.chose && (
        <section aria-labelledby="news-decision">
          <h2 id="news-decision" className="text-xl">Your decision</h2>
          <p className="mt-2">{chosenLine(turn.chose.id, turn.chose.text)}</p>
          <p className="mt-1 text-sm text-muted">{spentLine(turn.chose, pub.infoCost)}</p>
          {turn.investment && <p className="mt-1 text-sm">{investmentPointLine(turn.investment)}</p>}
        </section>
      )}

      <section aria-labelledby="news-noticed">
        <h2 id="news-noticed" className="text-xl">What the world noticed</h2>
        <div aria-live="polite">
          {headlines.decision && (
            <>
              <h3 className="mt-3 text-sm font-semibold">{DECISION_AS_REPORTED}</h3>
              <p className="mt-1 border-l-2 border-ink pl-4 text-lg">{headlines.decision}</p>
            </>
          )}
          <h3 className="mt-4 text-sm font-semibold">{ALSO_REPORTED}</h3>
          {headlines.elsewhere.length > 0 ? (
            <ul className="mt-1 space-y-3">
              {headlines.elsewhere.map((headline, index) => (
                <li key={index} className="border-l-2 border-ink pl-4 text-lg">
                  {headline}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm">{NOTHING_ELSE}</p>
          )}
        </div>
        <p className="mt-3 text-sm text-muted">{HEADLINES_NOTE}</p>
        {turn && turn.findings.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-semibold">Findings delivered this turn</h3>
            <ul className="mt-1 space-y-2 text-sm">
              {turn.findings.map((finding, index) => (
                <li key={index} className="border border-rule p-3">
                  {finding.title && <span className="block font-semibold">{finding.title}</span>}
                  {finding.text}
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-muted">{FINDINGS_CAVEAT}</p>
          </>
        )}
        {turn?.windowsOpened.map((w) => (
          <p key={w.domain} className="mt-3 border border-rule p-3 text-sm">
            {windowOpenedNote(w.domain, Math.min(w.turnsLeft, turnsLeft), pub.rules)}
          </p>
        ))}
      </section>

      {turn && (
        <section aria-labelledby="news-measured">
          <h2 id="news-measured" className="text-xl">What you can measure now</h2>
          <p className="mt-2 text-sm text-muted">{measuredCaption(over)}</p>
          {changed.length > 0 && (
            <ul className="mt-2 space-y-1 font-mono text-sm">
              {changed.map((row) => (
                <li key={row.metric}>{measuredRowText(row)}</li>
              ))}
            </ul>
          )}
          {unchanged.length > 0 && <p className="mt-1 text-sm">{unchangedLine(unchanged)}</p>}
          {turn.trackChanges.length > 0 && <p className="mt-2 text-sm">{trackLevelsLine(turn.trackChanges)}</p>}
          {turn.capacity && <p className="mt-2 text-sm">{capacityLine(turn.capacity.before, turn.capacity.after)}</p>}
          {turn.capital && <p className="mt-3 text-sm">{capitalLine(turn.capital)}</p>}
        </section>
      )}

      {turn?.unknown && (
        <section aria-labelledby="news-unknown">
          <h2 id="news-unknown" className="text-xl">Still unknown</h2>
          <p className="mt-2 text-sm">{openQuestionLine(turn.unknown)}</p>
          <p className="mt-2 text-sm">{estimatesNowLine(turn.estimatesNow.systemicRisk, turn.estimatesNow.cooperation)}</p>
          <p className="mt-1 text-sm text-muted">{LATER_NOTE}</p>
        </section>
      )}

      <Button onClick={onContinue}>{over ? "Read your debrief" : "Next briefing"}</Button>
    </div>
  );
}
```

In `src/ui/App.tsx`, replace (the `onContinue` expression may differ if an earlier phase changed it; keep whatever `onContinue` is there and change only the other props)

```tsx
          <News view={view} resolvedTurn={resolved.turn} onContinue={() => setStage(view.phase === "debrief" ? "debrief" : "briefing")} />
```

with

```tsx
          <News
            view={view}
            before={before}
            scenario={scenario}
            resolvedTurn={resolved.turn}
            onContinue={() => setStage(view.phase === "debrief" ? "debrief" : "briefing")}
          />
```

`before` comes from `useGame()` (App.tsx line 29) and `scenario` is already the resolved scenario on the news stage (App.tsx lines 88-90), so no other App change is needed.

**Step 4: Run it and watch it pass.**

```bash
npx tsc --noEmit && npx eslint src/ui e2e && npm run e2e
```

Expected: `tsc` and `eslint` print nothing; the whole e2e suite passes, including the two new tests, the axe "news" scans in both themes (now of the new screen), the keyboard test (it reaches "Next briefing" by Tab and presses it), `finishTurn` in `e2e/play.ts` (it waits for the heading "What the world noticed"), and the debrief and reproducibility tests.

**Step 5: Commit.**

```bash
git add src/ui/screens/News.tsx src/ui/App.tsx e2e/engagement.spec.ts
git commit -m "feat(ui): consequences in four parts in the main column (F5)"
```

### Task 11.10: A glossary for the measures, in the same place on every screen

**Depends on:** Task 11.1 (`pub.rules`), Task 11.2 (`METRIC_ORDER`), Task 11.6 (`capitalRulesLine`).

**Files:**
- Modify: `src/ui/components/StatusPanel.tsx` (the `../format` import, line 4, gains two neighbouring imports; the end of the component, lines 71-76)
- Test: `e2e/polish.spec.ts` (two lines in the axe walk after the "news" scan, around line 106)

**Step 1: Write the failing test.** In `e2e/polish.spec.ts`, directly after the line

```ts
    await expectNoSeriousViolations(page, "news");
```

insert

```ts
    await page.getByText("What these measures mean").click();
    await expect(page.getByText(/each turn adds \d+ Political Capital/)).toBeVisible();
    await expectNoSeriousViolations(page, "news with the measures explained");
```

(`expect` is already imported from `@playwright/test` in this file.)

**Step 2: Run it and watch it fail.**

```bash
npm run e2e -- e2e/polish.spec.ts -g "axe"
```

Expected: 2 failed (light and dark); `locator.click` on `getByText('What these measures mean')` times out because the text does not exist.

**Step 3: Implement.** `METRIC_MEANING` reaches players today only through `title=` tooltips, which keyboard and touch users never see. In `src/ui/components/StatusPanel.tsx`, replace

```ts
import { METRIC_MEANING, TRACK_LABEL } from "../format";
```

with

```ts
import { capitalRulesLine } from "../copy";
import { METRIC_LABEL, METRIC_MEANING, METRIC_ORDER, TRACK_LABEL } from "../format";
import { pub } from "../useGame";
```

(`pub` is the public content that `Decision.tsx` and `Invest.tsx` already import from `../useGame`; the panel imports nothing else from that module.)

and replace the end of the component

```tsx
        </ul>
      </section>
    </aside>
  );
}
```

with

```tsx
        </ul>
      </section>

      {/* The meanings were only in title= tooltips, which keyboard and touch users never see. */}
      <details className="border-t border-rule pt-4 text-sm">
        <summary className="cursor-pointer py-1 font-semibold">What these measures mean</summary>
        <dl className="mt-2 space-y-2">
          <div>
            <dt className="font-semibold">Political Capital</dt>
            <dd className="text-muted">What you spend on decisions and analysis. {capitalRulesLine(pub.rules)}</dd>
          </div>
          {METRIC_ORDER.map((metric) => (
            <div key={metric}>
              <dt className="font-semibold">{METRIC_LABEL[metric]}</dt>
              <dd className="text-muted">{METRIC_MEANING[metric]}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-muted">
          The first five are known exactly. Systemic AI Risk and International Cooperation are estimates shown as a range; State Capacity is
          shown only as a label.
        </p>
      </details>
    </aside>
  );
}
```

The Political Capital entry reads "What you spend on decisions and analysis. Under this game's assumptions, each turn adds 5 Political Capital; at most 3 unspent points carry over; Public Trust at 60 or above adds 1, and at 40 or below takes 1 away." Every number comes from `pub.rules`, and this is the only place the income rules reach the player. Keep the "Standing investments" `section` as it is (a region, not a group). The panel renders after `<main>` in DOM order at every width, so the new `summary` adds no Tab stop before the slider, the option group or the track radios.

**Step 4: Run it and watch it pass.**

```bash
npx tsc --noEmit && npx eslint src/ui e2e && npm run e2e -- e2e/polish.spec.ts
```

Expected: `tsc` and `eslint` print nothing; every test in `e2e/polish.spec.ts` passes, including both axe walks with the glossary open and its income-rules line visible, and the keyboard test.

**Step 5: Commit.**

```bash
git add src/ui/components/StatusPanel.tsx e2e/polish.spec.ts
git commit -m "feat(ui): explain the measures in a glossary instead of tooltips only"
```

### Task 11.11: No sideways scroll at 360px on the forecast, preview, ladder and news screens

**Depends on:** Phase 8 (`LABEL`); Tasks 11.7 to 11.9.

**Files:**
- Test: `e2e/polish.spec.ts` (the reduced-motion and phone test, lines 170-191)

**Step 1: Write the test.** In the test "reduced motion is honoured, and no screen scrolls sideways on a phone", replace

```ts
  await overflows("briefing");
  await toDecision(page);
  await overflows("decision");
```

with

```ts
  await overflows("briefing");
  await page.getByRole("button", { name: LABEL.continueToForecast }).click();
  await overflows("forecast");
  await page.getByRole("button", { name: LABEL.lockIn }).click();
  await overflows("decision");
  await page.locator('input[name="choice"]:enabled').first().check();
  await overflows("decision with a choice previewed");
  await page.getByRole("button", { name: LABEL.confirm }).click();
  await page.locator('input[name="track"]:enabled').first().check();
  await overflows("investment");
  await page.getByRole("button", { name: LABEL.investIn }).click();
  await overflows("news");
```

Add `LABEL` to the `./play` import at the top of the file if it is not there. If Phase 10 already added an `overflows("forecast")` call in this test, keep one and drop the duplicate. If `toDecision` is no longer used anywhere in the file after this edit, remove it from the import (it is still used by the axe walk at `a11ef34`). The lines that follow (`page.goto("/?seed=PHONE-2")`, `playTurn`, `playToDebrief`, `overflows("debrief")`) stay as they are.

**Step 2: Run it.**

```bash
npm run e2e -- e2e/polish.spec.ts -g "reduced motion"
```

Expected: 1 passed. This is a guard for Tasks 11.7 to 11.9, so it passes on first run; a failure names the screen that scrolls sideways and is a real regression to fix (usually a long unbroken string, or the sticky bar's negative margin) before committing.

**Step 3: Implement.** No product change expected.

**Step 4: Run the whole suite.**

```bash
npm run e2e
```

Expected: every test passes.

**Step 5: Commit.**

```bash
git add e2e/polish.spec.ts
git commit -m "test(e2e): check forecast, preview, ladder and news for sideways scroll at 360px"
```

### Task 11.12: Log the decisions and the open human check

**Depends on:** Phase 8 (section F of `DECISIONS.md`; the Phase 8 to 15 blocks in `docs/plan.md`).

**Files:**
- Modify: `DECISIONS.md` (section F, added in Phase 8)
- Modify: `docs/plan.md` (the Phase 11 block and the "Owned by the designer, not the build" list)

**Step 1: Write the check.** Run

```bash
grep -c "Sticky confirm bar" DECISIONS.md
```

Expected now: `0`.

**Step 2: Watch it fail.** The count is 0, so the decisions below are not yet logged.

**Step 3: Implement.** Append these rows to the end of the table in section F of `DECISIONS.md`, replacing each `F?` with the next free F number in order. Phase 8 created the table with rows F1 to F12 and Phases 9 and 10 add none, so these are normally F13 to F22; if the table already ends later, continue from its last row. Keep section F's column layout (`| # | Question | Decision | Why |`): the second column names the topic.

```markdown
| F? | Choice preview figures | The preview lists each stated effect as a change. Exact metrics add their current value ("National Security +4 (now 52)"); estimates and State Capacity show the change only, never a projected value. No option carries its own "may fail" flag; one permanent caveat says plans do not always work out, other effects are not shown, and background change, events and this turn's investment also move the numbers | Drift, hidden effects, events and the investment move every number, so an "after" value would be false precision; a per-option flag would expose which options have hidden success conditions (B24) |
| F? | Sticky confirm bar | At every width, while the viewport is at least 36rem (576px) tall, the one-line capital summary and the Confirm button stick to the bottom of the viewport; below that height (a landscape phone, high zoom) the bar stays in the flow. The stated effects stay in the flow after the option group. `scroll-padding-bottom: 9rem` keeps focused controls clear of the bar | The capital left is the number a player needs while comparing options. Without the bar it sat below the fold on a 1280×800 desktop (measured 1117px down) as well as on a phone. Sticky at every height, the bar would cover 46% of a 320×256 viewport (400% zoom) and about a quarter of a 667×375 landscape phone (WCAG 1.4.10) |
| F? | Focus ring on inverted cards | Inside `.bg-ink` the focus outline uses the paper colour | Navy on ink is about 2:1 in both themes; WCAG 1.4.11 needs 3:1 |
| F? | The consequences screen does not repeat the stated effects | "Your decision" names the option, its cost and the investment; it does not restate what officials expected. The measured changes follow under their own caption, with no remainder | On turn 1, stated-versus-measured isolates Scenario 1's hidden fact-conditional effects in about 38% of runs (F5); the Decision screen already showed the stated effects |
| F? | Future scenarios are not named during play | Unlock milestones use generic wording: "a crisis about disputed media", "the unscheduled crisis", "the final decision" | Names and dates are public data, but naming "The Deepfake Election, May 2029" would spoil the story for a general audience |
| F? | The unscheduled crisis during play | The investment ladder names "the unscheduled crisis" but never gives it a status: no "still ahead" and no "no remaining turn uses this", before or after it has been played. It never names the variant or when it comes. Known limit: the definite wording (F11) implies one per run, which B6 guarantees, so a careful player who has not met it by turn 6 can still infer turn 7; whether to say "an unscheduled crisis" instead is put to the designer | Late in a run either status would reveal when it comes: on turn 6 of 8 with the final decision still ahead, "still ahead" can only mean turn 7, and "no remaining turn uses this" would say that no other crisis is coming (non-negotiable 6; B6). The cost: once the crisis has been played, its Evaluation science level 3 line still shows with no status |
| F? | Milestone statuses on the ladder | Evaluation level 2 and Defensive cyber level 2 show no status: no single turn uses them. The Defensive cyber line says "less damage" instead of "halves their damage". A scripted unlock or the final decision shows "still ahead", "too few turns left to reach this level in time" or "no remaining turn uses this". For the final decision's Diplomacy level 3 line ("A credible coordinated pause in the final decision"), "too few turns left" tells the player that a coordinated pause can no longer be credible: it is computed from public levels and turn numbers only, but it is the only place the interface signals one option's prospects. The designer confirms it, or that line becomes "standing" (no status) | Their benefit depends on events whose timing is hidden; no odds or damage numbers before the debrief. The Diplomacy level 3 condition on the pause is already public (spec Section 5; F11), so the status only does arithmetic the player could do |
| F? | The StatusPanel below `lg` on the consequences screen | Kept as reference; the main column now carries the changes. No next-unlock line was added to the panel | Hiding it would make the panel come and go between steps; a next-unlock line there would change meaning from step to step, and the ladder and the consequences screen already carry it |
| F? | The first headline after a turn | Shown as "Your decision, as reported". `tests/engine/headlines.test.ts` pins that it is the chosen option's headline or its failure headline; the engine is unchanged | Turn 1 always has exactly one headline, the player's own; labelling it makes that clear instead of looking thin |
| F? | Policy-window and boom notices | The Decision screen names an open window in the scenario's area and the boom surcharge; the consequences screen names only windows opened that turn, with their area. All numbers come from `pub.rules` | The old notice repeated for two turns, never named the area and hard-coded "2" |
```

In `docs/plan.md`, in the Phase 11 block that Phase 8 added, mark each build item `[x] 🟩` as its task lands, leave the designer-review item and the newcomer-check item open, and recompute the "Overall Progress" percentage as completed build items over all build items. In the list under "## Owned by the designer, not the build", add:

```markdown
- The Phase 11 newcomer check: at least one person new to the game plays the opening and one turn, then answers the handoff's four questions: can they understand the dilemma, choose without specialist knowledge, explain the visible consequences, and do they want to continue? Open until run and written up.
```

**Step 4: Watch it pass.**

```bash
grep -c "Sticky confirm bar" DECISIONS.md && grep -c "Phase 11 newcomer check" docs/plan.md
```

Expected: `1` and `1`.

**Step 5: Commit.**

```bash
git add DECISIONS.md docs/plan.md
git commit -m "docs: log Phase 11 decisions and the open newcomer check"
```

### Phase 11 gate

Run every gate locally (CI cannot run; `DECISIONS.md` F9):

```bash
npm run lint && npm run test && npm run balance && npm run build && npm run e2e && du -sk dist
```

What must be true:

- `npm run lint` prints nothing. `npm run test` passes, with 48 more tests than at the end of Phase 10: public 3 + turn-format 6 + preview 8 + preparation 7 + consequences 12 + turn-copy 11 + headlines 1. `npm run balance` still passes (no content numbers changed). `npm run build` succeeds and `du -sk dist` prints a number below 16384.
- `npm run e2e` passes in full: the five Phase 11 tests in `e2e/engagement.spec.ts` (the preview, the desktop bar, the ladder, the phone news screen, no band width or odds); the axe walk in light and dark with the new scans ("decision with a choice previewed", "investment ladder with a track selected", "news", "news with the measures explained"); the keyboard walk; the 360px walk over forecast, decision, preview, investment and news; Phase 8's regression test (cleared pick and focus on the analysis); the crisis strings; reproducibility.
- `git diff --stat <commit before Task 11.1>..HEAD -- src/engine` prints nothing (the engine is untouched).
- `grep -rn "halfWidth\|published\|assumptionsOf" src/ui/preview.ts src/ui/preparation.ts src/ui/consequences.ts src/ui/screens/Decision.tsx src/ui/screens/Invest.tsx src/ui/screens/News.tsx src/ui/components/ChoicePreview.tsx src/ui/components/TrackLadder.tsx` prints only the comment line in `src/ui/consequences.ts` that names `halfWidth` as never read.

Then:

1. Update `docs/plan.md`: mark the Phase 11 build items `[x] 🟩`; set the Phase 11 line to 🟨 (built, awaiting the designer review); recompute "Overall Progress". Commit with `git commit -am "docs: Phase 11 gate green, awaiting designer review"`. Do not push the branch (it is pushed at the Phase 15 gate, or earlier if the designer asks), do not merge and do not deploy (`DECISIONS.md` F9).
2. **STOP and wait for the designer.** Ask for a review of the opening (Phase 9) and one representative turn (Phases 10 and 11). Give the designer this script:
   - `npm run build && npm run preview`, then open `http://localhost:4173/?seed=REVIEW-11` at phone width (375px) and at desktop width, in light and dark.
   - Title → "Try your first decision" → briefing → forecast → decision: select an option, then another; commission analysis; check the sticky bar at 375px and at desktop width, and that it does not stick on a landscape phone (667×375) → investment: select a track and read the ladder → consequences: read the four parts, open "What these measures mean".
   - Decisions to confirm or overturn: F2 to F5 and F10 to F12 as built (the plan's D3 to D6 and D11 to D13), and the new section F rows from Task 11.12, in particular: the preview shows no projected values; the consequences screen does not repeat the stated effects; future scenarios are not named; the ladder names "the unscheduled crisis" but never says whether it is still to come or has passed, even after it has been played; the StatusPanel stays on the phone news screen.
   - Three questions to answer: (a) the definite wording "the unscheduled crisis" (F11) implies exactly one per run, so a player who has not met it by turn 6 can infer turn 7 without any status: keep it, or say "in an unscheduled crisis"? (b) once the crisis has been played, should its Evaluation science level 3 line say "no remaining turn uses this"? That would confirm that no second crisis comes, so the build withholds it. (c) the final decision's Diplomacy level 3 line can read "too few turns left to reach this level in time", which tells the player a coordinated pause can no longer be credible: keep it, or show no status there?
   Record the designer's answers in `DECISIONS.md` (move confirmed rows' status or amend them), and do not start Phase 12 until the designer has answered.
3. Record the human newcomer check as **open** in `docs/plan.md` (added in Task 11.12). It is not a build step and must never be reported as done by the builder.


---

## Phase 12: First-decision pause (the five-minute taster)

**Goal:** After turn 1's consequences, every game pauses once on a short, UI-only card ("That was your first decision") that puts the choice to go on first ("Keep going": same game, same state; "Stop here": a link to play the same world with a friend, from the start, clearly not saved progress), then shows who backed each option and asks two open questions about the player's own forecast and advisers, with no engine or content change.

**Handoff items addressed:** proposal "Explore a five-minute introductory route" (decision D7, option A of the short-route map); suggested next step 5, whether a newcomer "wants to continue" (the pause is where a playtest can see that choice); proposal "End with discussion and agency" and the central promise "discover what might change your mind" (Think it over asks two open questions that nothing answers or scores, so a player who stops at five minutes still leaves with something to argue about); proposal "Make advisers approachable ... Avoid flattening them into a correct expert and incorrect foils" (every option is listed alike, with its backers); D1 and D3's optional "play the same world as a friend" (the Stop here panel offers the link for a friend); constraint "A seed link reproduces a world; it is not a saved-progress link" (observation 10).

**Depends on:** D7, D13 and non-negotiables 3–7 of the contract.
- Phase 8: `LABEL` in `e2e/play.ts`; `finishTurn` waits for "Standing investment" or the news heading; `data-testid="debrief"` on the Debrief root; `e2e/regressions.spec.ts` (2 tests); `DECISIONS.md` section F, where D7 is row **F6**; Phases 8–15 listed in `docs/plan.md`, with a three-item Phase 12 entry.
- Phase 9: `LABEL.start` is `"Try your first decision"`; `e2e/engagement.spec.ts` exists; `AppShell` no longer takes a `figureId` prop (D2); the title's h1 takes App's heading ref through a `headingRef` prop, so App's step-focus effect focuses it whenever the game returns to the title (this phase's Back to the start test checks that).
- Phase 10: `src/ui/copy.ts` exports `listOf`, `backersLine` and `whoBacksWhat(scenario, options, advisers)`; `tests/ui/play-copy.test.ts` exists.
- Phase 11: `consequencesOf(before, after, resolved, pub)` in `src/ui/consequences.ts`, returning `TurnConsequences` with `chose` and `unknown` (this phase reads nothing else, not `measured`); `News` props are `{ view, before, scenario, resolvedTurn, onContinue }`. Neither Phase 11 nor this phase declares `investedLine`.
- **Later phases depend on this one.** Phase 13 imports `worldLink` from `src/ui/copy.ts` (Task 12.1) for the debrief's share control; do not create a second link builder there. Optional Phase 14 anchors on three things this phase writes, so keep them exactly as given: the `backToStart` function in `App.tsx` (Task 12.4), the panel line `          <p className="mt-2 text-sm">{stopHereNote(view.seedCode)}</p>` in `FirstDecision.tsx`, and the phrase "and offers Back to the start, which behaves like Play again" in `DECISIONS.md` row F6. Phase 15 relies on `#stop-here`, the button names "Stop here", "Copy link to this world" and "Back to the start", and the literal `focusOn(/^Keep going$/)` in the keyboard test.

**Before every `npm run e2e` or `npx playwright test` below**, run `lsof -ti tcp:4173`. It must print nothing; if it prints a process id, `kill <id>` and run it again. `playwright.config.ts` has `reuseExistingServer: true` on port 4173, so Playwright tests whatever is already listening there. A preview server left running from an earlier phase (Phase 9 and the Phase 11 designer review both start one) serves the old bundle, and the new tests then fail even after the code is right.

### What the pause reads, and what it never shows

At the pause stage `view` is already turn 2 (phase `"forecast"`), because `ADVANCE` begins the next turn before returning. `before` is the turn-1 snapshot `useGame` takes just before `ADVANCE` (`src/ui/useGame.ts`, the `ENGINE` branch of `sessionReducer`). `FirstDecision` calls Phase 11's `consequencesOf(before, view, resolved, pub)` once and reads only its `chose` and `unknown` fields. So:

| Part of the card, in page order | Source (all public) |
|---|---|
| What happens next | `pub.totalTurns` and `resolved.turn` → "Keep going: 7 more decisions, about 20 minutes, then your debrief." Then the Keep going and Stop here buttons |
| Stop here panel (when open) | `view.seedCode` and the page URL's `cfg` → `worldLink(...)` |
| Your choice, and who backed each option | every option in `scenario.choices` with its backers, from Phase 10's `whoBacksWhat(scenario, scenario.choices, pub.advisers)` and `backersLine`; the player's own option (`consequencesOf(...).chose.id`, from `before.current.choiceId`) marked "(your choice)" in words and by a rule |
| Think it over | `consequencesOf(...).unknown.question` (`scenario.forecastQuestion`) and `.unknown.forecast` (`before.current.forecast`), then two fixed open questions (`THINK_IT_OVER`, static copy that reads no state) |

Never on the pause: anything from `view.current` (that is turn 2), `view.truth`, `view.debrief`, `view.history`; the option's stated `visibleEffects` (beside measured changes it would let a player subtract Scenario 1's hidden cyber-balance effects); any estimate-band change or `halfWidth`; any number for odds; any sentence implying chance has played out (turn 1 never fires a world event under current content); the name or timing of any interrupt. Also left out on purpose:
- The measured changes (`consequencesOf(...).measured`). The consequences screen one click earlier has just listed them; repeating them made the card about 300 words long, with Keep going nearly three phone screens down.
- Any adviser's stance. Quoting only the advisers who backed other options reads as a verdict on the player's choice; quoting everyone repeats the briefing. The card shows who backed what, for every option alike.
- `scenario.evidencePanel`. Phase 11's `unknown` does not carry it either. That text is about the real-world case behind the scenario and belongs on the briefing, under "Real-world evidence behind this fictional scenario". Shown unlabelled under the fictional question, "that operation" would read as the fictional breach.

Why the card asks questions instead of recapping. The news screen one click earlier already restates the forecast ("Still unknown"), and the briefing already showed who backs what. A card that only repeated them would give a newcomer who stops here nothing new. So the one new thing on the card is **Think it over**: the forecast question and the player's own number, as the anchor, then two open questions ("What would you need to see to move your forecast up or down?" and "Which adviser's concern weighed most with you, and what would change your mind about it?"). Nothing answers, scores or stores them. They sit below the buttons, so Keep going stays on the first screen of a 375×667 phone.

Before Task 12.1, confirm the earlier phases left what this phase assumes. From the repository root:

```bash
ls src/ui/copy.ts tests/ui/play-copy.test.ts e2e/engagement.spec.ts e2e/regressions.spec.ts src/ui/consequences.ts
grep -n "export function consequencesOf" src/ui/consequences.ts
grep -nE "^  (chose|unknown): \{" src/ui/consequences.ts
grep -nE "export (const|function) (listOf|backersLine|whoBacksWhat)\b" src/ui/copy.ts
grep -nE "\b(PAUSE_HEADING|remainingLine|WHAT_NEXT_NOTE|forecastRecap|STILL_OPEN_NOTE|THINK_IT_OVER|stopHereNote|worldLink|MINUTES_PER_DECISION)\b" src/ui/copy.ts
grep -n "export const LABEL" e2e/play.ts
grep -n 'data-testid="debrief"' src/ui/screens/Debrief.tsx
grep -n "figureId" src/ui/shell/AppShell.tsx
grep -n "headingRef" src/ui/screens/Title.tsx src/ui/App.tsx
grep -n "introductory route" DECISIONS.md
lsof -ti tcp:4173
```

Expected:
- `ls` lists the five files, and `consequencesOf` is exported.
- The `chose|unknown` grep prints the two `TurnConsequences` fields Phase 11 declared:
  `  chose: { id: string; text: string; costPaid: number; boughtAnalysis: boolean } | null;` and
  `  unknown: { forecast: number | null; question: string; resolvesBy: string } | null;`
  `FirstDecision` reads only `chose.id`, `unknown.question` and `unknown.forecast`. Any other fields Phase 11 declares do not matter here.
- The Phase 10 grep prints three lines: `export function listOf(`, `export const backersLine =` and `export function whoBacksWhat(`. This phase reuses them and declares none of them.
- The next grep prints **nothing**: none of this phase's names exists yet. If one does, stop and ask. Declaring a name twice in `copy.ts` breaks `tsc`, and Vite then refuses to load the file, so every test in `tests/ui/play-copy.test.ts` fails.
- `LABEL` exists; the Debrief root has the test id; `figureId` is **not** found in `AppShell.tsx`; the `headingRef` grep prints at least one line in each file (Phase 9's title h1 ref); `DECISIONS.md` prints one line, row F6 ("A five-minute introductory route"); `lsof` prints nothing.

If Phase 11 named `chose`, `chose.id`, `unknown.question` or `unknown.forecast` differently, use its names where `FirstDecision.tsx` reads them (Task 12.3, Step 3); do not re-derive them. If `whoBacksWhat` takes other parameters, adapt the one call. If `figureId` is still found, see the note after edit (D) in Task 12.3, Step 3. If `headingRef` is not found, Phase 9 did not wire the title h1 to App's focus effect: stop and ask, because the Back to the start test in Task 12.4 checks that focus lands there.

### Task 12.1: Copy builders for the pause, and the shared world link

**Files:**
- Modify: `src/ui/copy.ts` (append a Phase 12 block; no new import)
- Test: `tests/ui/play-copy.test.ts` (append one `describe` block; merge one import)

**Step 1: Write the failing test.** In `tests/ui/play-copy.test.ts`, add these names to the existing import from `"../../src/ui/copy"` (keep one import statement per module; Phase 10 already imports `describe, expect, test` from `"vitest"` and `loadContent, publicContent` from `"../../src/content"`; add either line only if it is missing):

```ts
import {
  forecastRecap, PAUSE_HEADING, remainingLine, STILL_OPEN_NOTE, stopHereNote, THINK_IT_OVER, WHAT_NEXT_NOTE, worldLink,
} from "../../src/ui/copy";
```

Then append this block to the end of the file. Its constants are declared inside the `describe` callback, and every builder is called inside a `test`, so a missing builder fails only these tests, not Phase 10's and 11's.

```ts
// ---------------------------------------------------------------- Phase 12: the first-decision pause

describe("the first-decision pause", () => {
  const content = publicContent(loadContent());
  const verdict = /\b(right|wrong|correct|incorrect|mistake|should have|good decision|bad decision)\b/i;

  test("counts the decisions left from the run length, never a fixed number, and mentions the debrief", () => {
    expect(remainingLine(8, 1)).toBe("Keep going: 7 more decisions, about 20 minutes, then your debrief.");
    expect(remainingLine(content.totalTurns, 1)).toContain(`${content.totalTurns - 1} more decisions`);
    expect(remainingLine(5, 1)).toBe("Keep going: 4 more decisions, about 10 minutes, then your debrief.");
    expect(remainingLine(8, 7)).toBe("Keep going: 1 more decision, about 5 minutes, then your debrief.");
  });

  test("a link to this world keeps the seed and a facilitator's edits, and drops everything else", () => {
    expect(worldLink("https://example.test/ai-2032/", "?seed=OLD1-OLD2&cfg=eyJ3Ijp7fX0&facilitator=1", "K7Q2-M9XD"))
      .toBe("https://example.test/ai-2032/?seed=K7Q2-M9XD&cfg=eyJ3Ijp7fX0");
    expect(worldLink("https://example.test/", "", "K7Q2-M9XD")).toBe("https://example.test/?seed=K7Q2-M9XD");
    expect(worldLink("https://example.test/", "?facilitator=1&utm_source=chat", "K7Q2-M9XD")).toBe("https://example.test/?seed=K7Q2-M9XD");
  });

  test("Stop here offers the world to a friend, from the start, and says it is not saved progress", () => {
    const note = stopHereNote("K7Q2-M9XD");
    expect(note).toContain("K7Q2-M9XD");
    expect(note).toContain("from the first decision");
    expect(note).toContain("compare what you each chose");
    expect(note).toContain("already knowing how it began");
    expect(note).toContain("It is not saved progress");
    expect(forecastRecap(0.35)).toBe("You said 35%.");
  });

  test("no pause sentence gives a verdict, names an interrupt or gives odds", () => {
    const everySentence = [PAUSE_HEADING, remainingLine(8, 1), WHAT_NEXT_NOTE, forecastRecap(0.35), STILL_OPEN_NOTE, stopHereNote("K7Q2-M9XD"), ...THINK_IT_OVER];
    const interrupts = Object.values(content.scenarios).filter((scenario) => !content.sequence.includes(scenario.id));
    expect(interrupts.length).toBeGreaterThan(0);
    for (const sentence of everySentence) {
      expect(sentence, sentence).not.toMatch(verdict);
      expect(sentence, sentence).not.toMatch(/\b(crisis|interrupt|odds|probability)\b/i);
      for (const scenario of interrupts) expect(sentence, sentence).not.toContain(scenario.title);
    }
    // The questions to think over are open questions: nothing on the card answers or scores them.
    for (const question of THINK_IT_OVER) expect(question).toMatch(/\?$/);
    // The only percentage on the card is the player's own forecast.
    expect(everySentence.filter((sentence) => /%/.test(sentence))).toEqual([forecastRecap(0.35)]);
  });
});
```

Who backed what is not tested here: the card uses Phase 10's `whoBacksWhat` and `backersLine`, which Phase 10's tests already cover, including their hidden-information invariance.

**Step 2: Run it and watch it fail.**

```bash
npx vitest run tests/ui/play-copy.test.ts
```

Expected: the four tests under "the first-decision pause" fail, with `TypeError: remainingLine is not a function`, `TypeError: worldLink is not a function` and `TypeError: stopHereNote is not a function`. Every Phase 10 and Phase 11 test in the same file still passes (`Tests  4 failed | N passed`).

**Step 3: Implement.** Append the block below to the end of `src/ui/copy.ts`. It needs no new import. Its only helper, `percent`, comes from `./format`, and Phase 10's import line already brings it in. Check with `grep -n "percent" src/ui/copy.ts | head -1`. If the `./format` import lacks `percent`, add it to that import; never add a second import from `./format`. Do not declare `listOf`, `backersLine` or `whoBacksWhat`: Phase 10 already exports them from this file.

```ts
// ---------------------------------------------------------------- the first-decision pause (Phase 12)
// The five-minute taster (DECISIONS.md F6): turn 1 of the real game, then a one-time
// pause. None of these sentences states a simulated statistic, so none carries the
// prefix, and none takes hidden state. Who backed what comes from whoBacksWhat and
// backersLine (Phase 10, above).

/** Spec Section 4: "Each turn ... takes about three minutes". A design estimate; only the human playtest can confirm it. */
const MINUTES_PER_DECISION = 3;

export const PAUSE_HEADING = "That was your first decision";

/** "Keep going: 7 more decisions, about 20 minutes, then your debrief." Derived from the run length, never hard-coded. */
export function remainingLine(totalTurns: number, turnsPlayed: number): string {
  const left = Math.max(0, totalTurns - turnsPlayed);
  const minutes = Math.max(5, Math.round((left * MINUTES_PER_DECISION) / 5) * 5);
  return `Keep going: ${left} more decision${left === 1 ? "" : "s"}, about ${minutes} minutes, then your debrief.`;
}

/** Names no interrupt and no timing (turn 1 never rolls a world event, so nothing here says chance has played out). */
export const WHAT_NEXT_NOTE =
  "Later turns may bring the unexpected. At the end, a debrief shows the hidden world you were in and separates what you decided from what the dice delivered.";

/** The player's own number, in the forecast screen's words. Not a simulated statistic, so no prefix. */
export function forecastRecap(forecast: number): string {
  return `You said ${percent(forecast)}.`;
}

export const STILL_OPEN_NOTE = "Nobody knows the answer yet. If you keep going, the debrief at the end shows how it turned out.";

/** Open questions. Nothing answers or scores them (engagement handoff: "discover what might change your mind"). */
export const THINK_IT_OVER = [
  "What would you need to see to move your forecast up or down?",
  "Which adviser's concern weighed most with you, and what would change your mind about it?",
] as const;

/**
 * A seed link reproduces a world; it is not a saved-progress link (engagement handoff).
 * Offered for a friend, as the debrief's share control is (Phase 13, DECISIONS.md F8):
 * a player who reopens it knows how it began, and it is no rewind to one decision.
 */
export function stopHereNote(seedCode: string): string {
  return `Anyone who opens this link starts world ${seedCode} from the first decision, with the same hidden facts and the same dice. Send it to a friend and compare what you each chose. If you open it yourself, you start again from the first decision, already knowing how it began. It is not saved progress: your choices so far are not in it, and they are not sent anywhere.`;
}

/**
 * A link that reproduces this world from the start: `seed` set, a facilitator's `cfg`
 * kept, everything else (including `facilitator`) dropped. The debrief's share
 * control (Phase 13) imports this too.
 */
export function worldLink(base: string, search: string, seedCode: string): string {
  const params = new URLSearchParams();
  params.set("seed", seedCode);
  const cfg = new URLSearchParams(search).get("cfg");
  if (cfg) params.set("cfg", cfg);
  return `${base}?${params.toString()}`;
}
```

The Stop here note claims only what is true: the player's choices are held in memory and never leave the browser. It does not say that nothing about the game is sent. The world code and any `cfg` travel in the page address, which the browser sends to the host whenever a `?seed=` link is opened.

The note offers the link to a friend first, as the debrief's share control does in Phase 13 (row F8: the link "lets someone who has not seen the world play it blind", a player who replays it "will know what is coming", and nothing invites a rewind). Framing it as the player's own replay ("make the same choices and it plays out the same way", in an earlier draft) invited exactly the "try the other option" rewind that Back to the start drops the seed to avoid. `THINK_IT_OVER` is static copy: it reads no state, and nothing on the page records an answer.

**Step 4: Run it and watch it pass.**

```bash
npx vitest run tests/ui/play-copy.test.ts
npx tsc --noEmit
npx eslint src/ui/copy.ts tests/ui/play-copy.test.ts
```

Expected: every test in the file passes (the Phase 12 block adds 4); `tsc` and `eslint` print nothing.

**Step 5: Commit.**

```bash
git add src/ui/copy.ts tests/ui/play-copy.test.ts
git commit -m "feat(ui): copy builders and world link for the first-decision pause

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

### Task 12.2: Teach the e2e helpers about the pause

**Files:**
- Modify: `e2e/play.ts` (`LABEL`, `TurnPlan`, the end of `finishTurn`, a new `passThePause`, the start of `playUntil`)

This task changes test helpers only. No pause exists yet, so after the change every helper call still ends on the next briefing or the debrief. The check is that the whole existing e2e suite stays green.

**Step 1: Write the failing test.** None. Record the baseline instead (first check that `lsof -ti tcp:4173` prints nothing, as the preamble says):

```bash
lsof -ti tcp:4173
npm run e2e
```

Expected: `lsof` prints nothing; all tests pass: crisis 4, debrief 5, polish 8, regressions 2 (Phase 8), plus whatever Phases 9–11 added to `e2e/engagement.spec.ts`. Note the total.

**Step 2: Run it and watch it fail.** Not applicable: this task changes only helpers.

**Step 3: Implement.** Four edits in `e2e/play.ts`.

(a) In the `LABEL` object, add two entries directly after the `next` entry, as the last entries of the object. `keepGoing` is the contract's shared name; `pauseHeading` is added for the specs in this phase:

```ts
  next: /^(Next briefing|Read your debrief)$/,
  keepGoing: "Keep going",
  pauseHeading: "That was your first decision",
} as const;
```

After Phases 8 and 9 the object reads: `start: "Try your first decision"`, `continueToForecast`, `lockIn`, `decisionGroup`, `confirm`, `investGroup`, `investIn`, `newsHeading`, `next`, `keepGoing`, `pauseHeading`.

(b) In `interface TurnPlan`, after the `forecast?: number;` line, add:

```ts
  /** Leave the first-decision pause on screen instead of clicking Keep going. */
  stopAtPause?: boolean;
```

(c) In `finishTurn`, replace the statement that clicks the next button (Phase 8 form below; at HEAD it read `{ name: /^(Next briefing|Read your debrief)$/ }`):

```ts
  await page.getByRole("button", { name: LABEL.next }).click();
  return taken;
}
```

with:

```ts
  await page.getByRole("button", { name: LABEL.next }).click();
  await passThePause(page, plan.stopAtPause);
  return taken;
}

/**
 * After the news: waits for whichever comes next, the one-time first-decision pause
 * (after turn 1 only), the next briefing or the debrief. Clicks Keep going at the
 * pause unless told to stay. Returns whether the pause was on screen.
 */
export async function passThePause(page: Page, stay = false): Promise<boolean> {
  const keepGoing = page.getByRole("button", { name: LABEL.keepGoing });
  const briefing = page.getByRole("button", { name: LABEL.continueToForecast });
  await expect(keepGoing.or(briefing).or(page.getByTestId("debrief")).first()).toBeVisible();
  if (!(await keepGoing.isVisible())) return false;
  if (!stay) {
    await keepGoing.click();
    await expect(briefing).toBeVisible();
  }
  return true;
}
```

The `expect(...).toBeVisible()` is the waiting check the contract asks for. The `isVisible()` after it does not race, because by then one of the three is already on screen.

(d) In `playUntil`, make the first statement of the function body:

```ts
  await passThePause(page);
```

so the function now begins:

```ts
export async function playUntil(page: Page, title: string, plan: TurnPlan = {}) {
  await passThePause(page);
  for (let turn = 0; turn < 8; turn++) {
```

A caller that clicks Next briefing itself on turn 1 and then calls `playUntil` is then carried past the pause. The axe walk in `e2e/polish.spec.ts` does this. The two `e2e/regressions.spec.ts` tests reach turn 2 through `finishTurn`/`playTurn`, which pass the pause themselves.

**Step 4: Run it and watch it pass.**

```bash
npx tsc --noEmit
npx eslint e2e
lsof -ti tcp:4173
npm run e2e
```

Expected: `tsc`, `eslint` and `lsof` print nothing; every e2e test passes, the same count as the baseline in Step 1.

**Step 5: Commit.**

```bash
git add e2e/play.ts
git commit -m "test(e2e): helpers wait for and pass the first-decision pause

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

### Task 12.3: The pause stage, the card and Keep going

**Files:**
- Create: `src/ui/screens/FirstDecision.tsx`
- Modify: `src/ui/App.tsx` (imports; `type Stage`; a `PAUSE_STEPS` constant; a new pause branch before `const reporting = ...`; the News `onContinue`)
- Test: `e2e/engagement.spec.ts` (append three tests), `e2e/polish.spec.ts` (axe walk, keyboard test, phone test)

**Step 1: Write the failing tests.**

In `e2e/engagement.spec.ts`, make sure the imports include `expect, test` from `@playwright/test` and `finishTurn, LABEL, playTurn, scenarioTitle, startGame, toDecision` from `./play`. Add missing names to the existing import statements; do not add a second import from the same module. Then append:

```ts
// ---------------------------------------------------------------- Phase 12: the first-decision pause (the five-minute taster)

test("the first-decision pause appears exactly once, after turn 1 only", async ({ page }) => {
  await startGame(page, "PAUSE-ONCE");
  const keepGoing = page.getByRole("button", { name: LABEL.keepGoing });
  const pausedAfter: number[] = [];
  for (let turn = 1; turn <= 8; turn++) {
    await playTurn(page, { stopAtPause: true });
    if (await keepGoing.isVisible()) {
      pausedAfter.push(turn);
      await keepGoing.click();
    }
  }
  await expect(page.getByTestId("debrief")).toBeVisible();
  expect(pausedAfter).toEqual([1]);
});

test("the pause puts Keep going first, recaps turn 1 from what the player saw, and Keep going lands on turn 2's briefing", async ({ page }) => {
  await startGame(page, "PAUSE-KEEP");
  expect(await scenarioTitle(page)).toBe("The Attribution Gap");
  await toDecision(page, 35);
  expect(await finishTurn(page, { prefer: "B", stopAtPause: true })).toBe("B");

  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toHaveText(LABEL.pauseHeading);
  await expect(heading).toBeFocused();
  expect(await page.locator("main").getByRole("heading", { level: 2 }).allInnerTexts()).toEqual([
    "What happens next",
    "Your choice, and who backed each option",
    "Think it over",
  ]);
  await expect(page.getByText("Keep going: 7 more decisions, about 20 minutes, then your debrief.")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: LABEL.keepGoing })).toBeFocused();         // the first control after the heading

  // Every option alike, each with its backers; the player's own marked in words, not by colour alone.
  await expect(page.getByText("Option B (your choice).")).toBeVisible();
  await expect(page.getByText("Agent security standards for all government procurement.")).toBeVisible();
  await expect(page.getByText("No adviser backs this option.")).toBeVisible();
  await expect(page.getByText("Backed by Dr Maya Shah and Amelia Chen.")).toBeVisible();
  // Turn 1's question and forecast, read from the snapshot: the live view has already moved on to turn 2.
  await expect(page.getByText("Chance of a disruptive AI-enabled attack on UK critical infrastructure by the end of 2029.")).toBeVisible();
  await expect(page.getByText("You said 35%.")).toBeVisible();
  await expect(page.getByText("What would you need to see to move your forecast up or down?")).toBeVisible();

  await page.getByRole("button", { name: LABEL.keepGoing }).click();
  await expect(page.getByRole("button", { name: LABEL.continueToForecast })).toBeVisible();
  await expect(heading).toHaveText("The Open-Weight Release");
  await expect(heading).toBeFocused();
  await expect(page.getByText(/Turn 2 of 8/)).toBeVisible();
  await expect(page.locator('[aria-current="step"]')).toHaveText(/Briefing/);           // the pause did not move the next turn's rail
});

test("on a small phone, Keep going is inside the first screen of the pause", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await startGame(page, "PAUSE-FOLD");
  await playTurn(page, { stopAtPause: true });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(LABEL.pauseHeading);
  const box = await page.getByRole("button", { name: LABEL.keepGoing }).boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(667);
});
```

In `e2e/polish.spec.ts`, `LABEL` is already in the import from `./play` (Phase 8); add it if not. Then make three edits.

(a) Axe walk (the `for (const colorScheme of ["light", "dark"] as const)` test). Find the line `    await playUntil(page, "The Deepfake Election");`. It appears once, after the news scans ("news", then Phase 11's "news with the measures explained") and the click on the Next briefing button (`    await page.getByRole("button", { name: LABEL.next }).click();`). Directly above it, insert:

```ts
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(LABEL.pauseHeading);
    await expectNoSeriousViolations(page, "first-decision pause");
    await page.getByRole("button", { name: LABEL.keepGoing }).click();
```

(b) Keyboard test (`"a whole turn can be played with the keyboard alone"`). Replace its last three statements, as Phase 8's replacement script left them:

```ts
  await focusOn(LABEL.next);
  await press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText("The Attribution Gap");
```

with:

```ts
  await focusOn(LABEL.next);
  await press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(LABEL.pauseHeading);   // the one-time pause after turn 1
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await focusOn(/^Keep going$/);
  await press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText("The Attribution Gap");
```

Keep the literal `/^Keep going$/`: Phase 15's pre-flight check greps for `focusOn(/^Keep going`.

(c) Phone test (`"reduced motion is honoured, and no screen scrolls sideways on a phone"`). After the `/?seed=PHONE-2` navigation and the start click, replace:

```ts
  await playTurn(page);
  await playToDebrief(page);
  await overflows("debrief");
```

with:

```ts
  await playTurn(page, { stopAtPause: true });
  await overflows("first-decision pause");
  await page.getByRole("button", { name: LABEL.keepGoing }).click();
  await playToDebrief(page);
  await overflows("debrief");
```

**Step 2: Run them and watch them fail.**

```bash
lsof -ti tcp:4173
npx playwright test e2e/engagement.spec.ts e2e/polish.spec.ts
```

Expected: `lsof` prints nothing. Then these fail (the others pass):
- "the first-decision pause appears exactly once": `Expected: [1]`, `Received: []`.
- "the pause puts Keep going first…" and "on a small phone, Keep going…": `toHaveText` expected `"That was your first decision"`, received `"The Open-Weight Release"`.
- Both axe tests and the keyboard test: the same `toHaveText` failure.
- The phone test: `locator.click: Test timeout of 30000ms exceeded` on Keep going. It takes the full 30 seconds.

**Step 3: Implement.**

Create `src/ui/screens/FirstDecision.tsx`:

```tsx
import { Button } from "../components/Button";
import { consequencesOf } from "../consequences";
import { backersLine, forecastRecap, remainingLine, STILL_OPEN_NOTE, THINK_IT_OVER, WHAT_NEXT_NOTE, whoBacksWhat } from "../copy";
import { pub } from "../useGame";
import type { PublicScenario } from "../../content";
import type { DisplayedState } from "../../engine";

interface Props {
  /** The live view. At the pause it already shows turn 2, so it is read only through consequencesOf and for the seed code. */
  view: DisplayedState;
  /** The snapshot taken just before turn 1 resolved. Every fact about turn 1 comes from here. */
  before: DisplayedState;
  /** The scenario played on turn 1. */
  scenario: PublicScenario;
  /** The turn and scenario just reported, as App keeps them for the news screen. */
  resolved: { turn: number; scenarioId: string };
  onContinue: () => void;
}

/**
 * The five-minute taster (DECISIONS.md F6): a one-time pause after turn 1's consequences.
 * It is not a turn step. The choice comes first: Keep going plays on in the same game; Stop here
 * offers a link to play this world with a friend, from the start, which is not saved progress.
 * Below it: every option with its backers, then the question still open and two questions to
 * think over. The measured changes are not repeated: the consequences screen has just shown them.
 * Reads only displayed() snapshots and public content.
 */
export function FirstDecision({ view, before, scenario, resolved, onContinue }: Props) {
  const turn = consequencesOf(before, view, resolved, pub);
  const rows = whoBacksWhat(scenario, scenario.choices, pub.advisers);

  return (
    <div className="space-y-8">
      <section aria-labelledby="pause-next">
        <h2 id="pause-next" className="text-xl">What happens next</h2>
        <p className="mt-3 font-semibold">{remainingLine(pub.totalTurns, resolved.turn)}</p>
        <p className="mt-2 text-sm">{WHAT_NEXT_NOTE}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={onContinue}>Keep going</Button>
        </div>
      </section>

      <section aria-labelledby="pause-chose">
        <h2 id="pause-chose" className="text-xl">Your choice, and who backed each option</h2>
        <ul className="mt-3 space-y-3">
          {rows.map((row) => {
            const mine = row.id === turn.chose?.id;
            return (
              <li key={row.id} className={`border-l-2 pl-4 ${mine ? "border-ink" : "border-transparent"}`}>
                <span className="font-semibold">
                  Option {row.id}
                  {mine ? " (your choice)" : ""}.
                </span>{" "}
                {row.text}
                <span className="mt-0.5 block text-sm text-muted">{backersLine(row.backers)}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {turn.unknown && (
        <section aria-labelledby="pause-think">
          <h2 id="pause-think" className="text-xl">Think it over</h2>
          <p className="mt-3">{turn.unknown.question}</p>
          {turn.unknown.forecast !== null && <p className="mt-1 font-semibold">{forecastRecap(turn.unknown.forecast)}</p>}
          <p className="mt-2 text-sm">{STILL_OPEN_NOTE}</p>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            {THINK_IT_OVER.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
```

The player's option is marked by the words "(your choice)" and by an ink rule; the other rows carry a transparent rule of the same width, so every option's text lines up. Meaning is never carried by colour alone. The heading names both halves of the list ("Your choice, and who backed each option"), because the list shows all four options, not only the player's. Think it over puts `STILL_OPEN_NOTE` straight after the player's forecast, which it refers to, and the two open questions after it, as a plain bulleted list like the debrief's Talk it over (Phase 13). They carry no left rule, because on this card a rule marks the player's own option. On turn 1 `turn.unknown` is never null (only the final turn's is), and `turn.chose` is the option confirmed on turn 1. "Phase 11 shape" here means the `consequencesOf(before, view, resolved, pub)` call and the `chose.id`, `unknown.question` and `unknown.forecast` fields; if Phase 11 used other names, change them here.

Edit `src/ui/App.tsx` in five places.

(A) Imports. Replace `import { formatMonth } from "./format";` with the lines below. If that line lists more names after Phases 9–11, keep them all and only add the `./copy` line above it:

```tsx
import { PAUSE_HEADING } from "./copy";
import { formatMonth } from "./format";
```

Replace `import { Decision } from "./screens/Decision";` with:

```tsx
import { Decision } from "./screens/Decision";
import { FirstDecision } from "./screens/FirstDecision";
```

(B) Replace:

```tsx
/** The interface's own steps. "briefing" and "news" are reading steps the engine has no phase for. */
type Stage = "briefing" | "play" | "news" | "debrief";
```

with (Phase 14 anchors on this exact comment):

```tsx
/**
 * The interface's own steps. "briefing" and "news" are reading steps the engine has no phase for.
 * "pause" is the one-time stop after turn 1's news: the five-minute taster (DECISIONS.md section F).
 */
type Stage = "briefing" | "play" | "news" | "pause" | "debrief";
```

(C) Directly below the `const DEBRIEF_STEPS = ...` line, whatever its contents, add:

```tsx
const PAUSE_STEPS = ["Taking stock"] as const;
```

(D) Directly above the line `  const reporting = stage === "news" && resolved;`, insert:

```tsx
  // The pause is not a turn step: it has its own shell, rail and h1, so the next turn's clock and rail are untouched.
  const pausedOn = stage === "pause" && resolved ? pub.scenarios[resolved.scenarioId] : undefined;
  if (pausedOn && resolved && before) {
    return (
      <AppShell
        skip={{ href: "#main", label: "Skip to the main content" }}
        chrome={{ turn: resolved.turn, totalTurns: pub.totalTurns, dateLabel: formatMonth(pausedOn.date), seedCode: view.seedCode }}
        steps={PAUSE_STEPS}
        stepIndex={0}
        stepsLabel="Where you are"
      >
        <h1 ref={heading} tabIndex={-1} className="text-3xl outline-none sm:text-4xl">
          {PAUSE_HEADING}
        </h1>
        <div className="mt-6">
          <FirstDecision view={view} before={before} scenario={pausedOn} resolved={resolved} onContinue={() => setStage("briefing")} />
        </div>
      </AppShell>
    );
  }
```

If `grep -n figureId src/ui/shell/AppShell.tsx` found the prop in the pre-flight check, Phase 9 kept it. Add `` figureId={`Turn ${resolved.turn} · Taking stock`} `` after `stepsLabel`, following the wording Phase 9 gave the other branches.

This branch comes after every hook in `App`, so the rules of hooks hold. The pause h1 carries App's `heading` ref, so the existing effect keyed on `stepKey` focuses it. `stepKey` is `` `${view.turn}:${view.phase}:${stage}` ``, which becomes `"2:forecast:pause"` at the pause and `"2:forecast:briefing"` after Keep going. Each is a step change, so focus moves both times, and the `stepKey` code needs no edit. The turn branch below still computes `stepIndex` from `stage === "briefing"`, so turn 2's rail and any crisis clock start from their usual first step.

(E) In the `<News ... />` element, replace the expression:

```tsx
setStage(view.phase === "debrief" ? "debrief" : "briefing")
```

with:

```tsx
setStage(view.phase === "debrief" ? "debrief" : resolved.turn === 1 ? "pause" : "briefing")
```

If Phase 11 moved this choice out of the JSX, make the same change wherever News's `onContinue` picks between `"debrief"` and `"briefing"`. Turn 1 is always the first scripted scenario, and every game has at least three turns, so this pauses exactly once per game and never before the debrief.

**Step 4: Run them and watch them pass.**

```bash
npx tsc --noEmit
npx eslint src e2e tests
lsof -ti tcp:4173
npm run e2e
```

Expected: `tsc`, `eslint` and `lsof` print nothing; every e2e test passes: the baseline from Task 12.2 plus the three new engagement tests, with the edited axe, keyboard and phone tests. That includes `e2e/regressions.spec.ts`'s "the final turn never lists an investment step, even on its consequences", which reaches turn 7 through `playTurn` and so passes the pause inside `finishTurn`. The crisis spec is unchanged and still sees "6:00 remaining" on crisis briefings and "3:00 remaining" on crisis decisions.

Hidden-information check. Expected: no output.

```bash
grep -nE "view\.(current|truth|debrief|history)|halfWidth|visibleEffects|oddsAtTheTime|published|assumptionsOf|defaults|evidencePanel|\.unclear|\.measured|\.stance" src/ui/screens/FirstDecision.tsx
```

**Step 5: Commit.**

```bash
git add src/ui/screens/FirstDecision.tsx src/ui/App.tsx e2e/engagement.spec.ts e2e/polish.spec.ts
git commit -m "feat(ui): one-time pause after the first decision, with Keep going

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

### Task 12.4: Stop here: a link to the same world, not saved progress

**Files:**
- Modify: `src/ui/screens/FirstDecision.tsx` (imports, `Props`, a `revealPanel` callback ref, state, `copyLink`, the Stop here button and panel)
- Modify: `src/ui/App.tsx` (extract `backToStart` from the Debrief's `onRestart`; pass it to `FirstDecision`)
- Test: `e2e/engagement.spec.ts` (append five tests and a helper), `e2e/polish.spec.ts` (axe walk and phone test with Stop here open)

**Step 1: Write the failing tests.**

In `e2e/engagement.spec.ts`, make sure the imports also include `type Page` from `@playwright/test` and `playToDebrief` from `./play` (merge into the existing statements). Then append the block below. If an earlier phase already declared a function named `runSummaryJson` in this file, reuse it and drop this copy.

```ts
async function runSummaryJson(page: Page): Promise<string> {
  await page.getByRole("button", { name: "Show as JSON" }).click();
  return page.getByLabel("Run summary", { exact: true }).innerText();
}

test("Stop here offers a link to this world that keeps the edits, drops facilitator mode and sends nothing", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/?facilitator=1&seed=PAUSE-LINK");
  await page.getByText("Base odds of events").click();
  await page.locator("#event-infra-attack-whenTrue").fill("90");
  await expect(page.getByText(/1 number edited/)).toBeVisible();
  const participant = await page.getByTestId("participant-link").innerText();
  expect(new URL(participant).searchParams.get("cfg")).toBeTruthy();
  await page.goto(participant);
  await page.getByRole("button", { name: LABEL.start }).click();
  await playTurn(page, { stopAtPause: true });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(LABEL.pauseHeading);

  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  const stop = page.getByRole("button", { name: "Stop here" });
  await expect(stop).toHaveAttribute("aria-expanded", "false");
  await stop.click();
  await expect(stop).toHaveAttribute("aria-expanded", "true");
  const link = new URL(await page.getByTestId("world-link").innerText());
  expect(link.searchParams.get("seed")).toBe("PAUSE-LINK");
  expect(link.searchParams.get("cfg")).toBe(new URL(participant).searchParams.get("cfg"));
  expect(link.searchParams.has("facilitator")).toBe(false);
  await expect(page.getByText(/It is not saved progress/)).toBeVisible();

  await page.getByRole("button", { name: "Copy link to this world" }).click();
  await expect(page.getByText("Link copied.")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(link.toString());
  expect(requests).toEqual([]);                                                  // nothing was fetched or sent, not even from this site

  await expect(page.getByText("Back to the start opens the title page with a new world.")).toBeVisible();
  await page.getByRole("button", { name: "Back to the start" }).click();
  await expect(page.getByRole("button", { name: LABEL.start })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();         // a step change: focus on the title's h1
  const url = new URL(page.url());
  expect(url.searchParams.get("seed")).toBeNull();                              // like Play again: a new world next time
  expect(url.searchParams.get("cfg")).toBe(link.searchParams.get("cfg"));       // the edited assumptions stay
});

test("on a small phone, Stop here brings its panel into view", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await startGame(page, "PAUSE-REVEAL");
  await playTurn(page, { stopAtPause: true });
  await page.getByRole("button", { name: "Stop here" }).click();
  await expect(page.getByRole("button", { name: "Copy link to this world" })).toBeInViewport();
  await expect(page.getByRole("button", { name: "Stop here" })).toBeFocused();   // opening the panel leaves focus on the toggle
  await expect(page.getByRole("button", { name: "Stop here" })).toBeInViewport();
});

test("at 400% zoom, opening Stop here keeps the focused toggle on screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 256 });                       // 1280×1024 at 400%: WCAG reflow
  await startGame(page, "PAUSE-ZOOM");
  await playTurn(page, { stopAtPause: true });
  const stop = page.getByRole("button", { name: "Stop here" });
  await stop.focus();
  await page.keyboard.press("Enter");
  await expect(stop).toHaveAttribute("aria-expanded", "true");
  await expect(stop).toBeFocused();
  await expect(stop).toBeInViewport();
});

test("Keep going still works after opening Stop here", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await startGame(page, "PAUSE-CHANGE-MIND");
  await playTurn(page, { stopAtPause: true });
  const stop = page.getByRole("button", { name: "Stop here" });
  await stop.click();
  await expect(page.getByTestId("world-link")).toContainText("seed=PAUSE-CHANGE-MIND");
  await page.getByRole("button", { name: "Copy link to this world" }).click();
  await expect(page.getByText("Link copied.")).toBeVisible();
  await stop.click();                                                            // close the panel, then open it again
  await stop.click();
  await expect(page.getByTestId("world-link")).toBeVisible();
  await expect(page.getByText("Link copied.")).toHaveCount(0);                   // nothing copied since it reopened
  await page.getByRole("button", { name: LABEL.keepGoing }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The Open-Weight Release");
});

test("a run that pauses, opens Stop here and keeps going matches a replay from the world link", async ({ browser }) => {
  test.slow();                                                                   // two whole games
  const plan = { prefer: "B", track: "Diplomacy" as const, forecast: 35 };
  const runs: string[] = [];

  const kept = await (await browser.newContext()).newPage();
  await startGame(kept, "TASTER-SAME");
  await playTurn(kept, { ...plan, stopAtPause: true });
  await kept.getByRole("button", { name: "Stop here" }).click();
  const link = await kept.getByTestId("world-link").innerText();
  await kept.getByRole("button", { name: LABEL.keepGoing }).click();             // the player looked at Stop here, then went on
  await playToDebrief(kept, plan);
  runs.push(await runSummaryJson(kept));
  await kept.context().close();

  const replay = await (await browser.newContext()).newPage();
  await replay.goto(link);                                                       // what a friend, or the player later, opens
  await replay.getByRole("button", { name: LABEL.start }).click();
  await playToDebrief(replay, plan);
  runs.push(await runSummaryJson(replay));
  await replay.context().close();

  expect(runs[1]).toBe(runs[0]);
  expect(runs[0]).toContain("TASTER-SAME");
});
```

The last test is this phase's taster reproducibility gate (D7: "Continuing plays the same state"). Its first run uses the pause the way a hesitant player does: it stops, opens Stop here, reads the link and then keeps going. Its second run opens that link in a fresh browser context, as a friend would, and plays the same choices. The two run summaries must match. So a Keep going that changed game state, or a link that pointed at a different world, fails it. The existing polish reproducibility test (same seed, same actions, two games) stays as it is and must still pass. It now passes through the pause via `playToDebrief`.

Other notes on these tests:
- The request check has no filter: a static page makes no request at all between opening Stop here and "Link copied." (measured on a planning build), so any request, even to this site, fails the test.
- `backToStart` is shared with the debrief's Play again (edit (g) below), so the Stop here link test's last four assertions (start button visible, the title's h1 focused, `seed` null, `cfg` kept) cover Play again's URL behaviour too. No other e2e test clicks Play again and checks the URL.
- The 400% zoom test uses a 320×256 viewport, which is a 1280×1024 screen at 400% zoom (WCAG 2.2 reflow). The panel is taller than that viewport. Scrolling only the panel into view would put the focused Stop here button off the top of the screen (measured: `viewport ratio 0`), which is why `revealPanel` in Step 3 scrolls the toggle back into view afterwards.
- "Keep going still works after opening Stop here" also copies, closes and reopens the panel, and checks that "Link copied." is gone: the status line describes this opening of the panel, not an earlier one (the debrief's JSON toggle resets its copied state for the same reason, `src/ui/screens/Debrief.tsx:90` at `a11ef34`).

In `e2e/polish.spec.ts`, make two edits.

(a) In the axe walk, replace the line added in Task 12.3:

```ts
    await expectNoSeriousViolations(page, "first-decision pause");
```

with:

```ts
    await expectNoSeriousViolations(page, "first-decision pause");
    await page.getByRole("button", { name: "Stop here" }).click();
    await expectNoSeriousViolations(page, "first-decision pause with Stop here open");
```

(b) In the phone test, replace the line added in Task 12.3:

```ts
  await overflows("first-decision pause");
```

with:

```ts
  await overflows("first-decision pause");
  await page.getByRole("button", { name: "Stop here" }).click();
  await overflows("first-decision pause with Stop here open");
```

**Step 2: Run them and watch them fail.**

```bash
lsof -ti tcp:4173
npx playwright test e2e/engagement.spec.ts e2e/polish.spec.ts
```

Expected: `lsof` prints nothing. Then these fail:
- The Stop here link test: `toHaveAttribute` fails with "element(s) not found".
- "on a small phone, Stop here brings its panel into view", "Keep going still works after opening Stop here", both axe tests and the phone test: `locator.click: Test timeout of 30000ms exceeded` on Stop here.
- "at 400% zoom, opening Stop here keeps the focused toggle on screen": `locator.focus: Test timeout of 30000ms exceeded` on Stop here.
- "a run that pauses, opens Stop here and keeps going matches a replay from the world link": the same click timeout on Stop here, after about 90 seconds because of `test.slow()`.

The three Task 12.3 engagement tests and the rest of polish still pass.

**Step 3: Implement.**

In `src/ui/screens/FirstDecision.tsx`, five edits:

(a) Make `import { useState } from "react";` the first line of the file.

(b) Replace the `../copy` import:

```tsx
import { backersLine, forecastRecap, remainingLine, STILL_OPEN_NOTE, THINK_IT_OVER, WHAT_NEXT_NOTE, whoBacksWhat } from "../copy";
```

with:

```tsx
import {
  backersLine, forecastRecap, remainingLine, STILL_OPEN_NOTE, stopHereNote, THINK_IT_OVER, WHAT_NEXT_NOTE, whoBacksWhat, worldLink,
} from "../copy";
```

(c) At the end of `interface Props`, replace:

```tsx
  onContinue: () => void;
}
```

with:

```tsx
  onContinue: () => void;
  onRestart: () => void;
}

/** Brings the Stop here panel into view as it opens, without scrolling the focused toggle off screen (400% zoom). Instant, so reduced motion holds. */
const revealPanel = (panel: HTMLElement | null) => {
  if (!panel) return;
  panel.scrollIntoView({ block: "nearest" });
  document.querySelector<HTMLElement>('[aria-controls="stop-here"]')?.scrollIntoView({ block: "nearest" });
};
```

(d) Replace:

```tsx
export function FirstDecision({ view, before, scenario, resolved, onContinue }: Props) {
  const turn = consequencesOf(before, view, resolved, pub);
  const rows = whoBacksWhat(scenario, scenario.choices, pub.advisers);
```

with:

```tsx
export function FirstDecision({ view, before, scenario, resolved, onContinue, onRestart }: Props) {
  const [stopping, setStopping] = useState(false);
  const [copied, setCopied] = useState<"done" | "failed" | null>(null);
  const turn = consequencesOf(before, view, resolved, pub);
  const rows = whoBacksWhat(scenario, scenario.choices, pub.advisers);
  const link = worldLink(`${window.location.origin}${window.location.pathname}`, window.location.search, view.seedCode);

  async function copyLink() {
    // No network call: the link goes to the clipboard and nowhere else (DECISIONS.md, decision 11).
    try {
      await navigator.clipboard.writeText(link);
      setCopied("done");
    } catch {
      setCopied("failed");
    }
  }
```

(e) Replace the end of the first section:

```tsx
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={onContinue}>Keep going</Button>
        </div>
      </section>
```

with:

```tsx
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={onContinue}>Keep going</Button>
          <Button
            variant="quiet"
            aria-expanded={stopping}
            aria-controls={stopping ? "stop-here" : undefined}
            onClick={() => {
              setStopping(!stopping);
              setCopied(null);
            }}
          >
            Stop here
          </Button>
        </div>
      </section>

      {stopping && (
        <section id="stop-here" ref={revealPanel} aria-labelledby="stop-here-heading" className="border border-ink p-5">
          <h2 id="stop-here-heading" className="text-xl">Play the same world as a friend</h2>
          <p className="mt-2 text-sm">{stopHereNote(view.seedCode)}</p>
          <p className="mt-3 break-all font-mono text-xs" data-testid="world-link">{link}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={copyLink}>Copy link to this world</Button>
            <Button variant="quiet" onClick={onRestart}>Back to the start</Button>
          </div>
          <p className="mt-2 text-sm">Back to the start opens the title page with a new world.</p>
          <p className="mt-2 text-sm" aria-live="polite">
            {copied === "done" ? "Link copied." : copied === "failed" ? "Copying is blocked in this browser. Select the link above and copy it." : ""}
          </p>
        </section>
      )}
```

The panel opens directly under the two buttons, before the list of options, so its controls come next in tab order after Stop here. Keep going stays the first tab stop after the h1. `aria-controls` is set only while the panel exists, so axe finds no dangling reference. The link is shown as text (`break-all`, so nothing overflows at 360px) as well as copied, so a player whose browser blocks the clipboard can still take it.

The panel's heading, "Play the same world as a friend", is the phrase the title screen's seed disclosure uses (Phase 9, D3) and the debrief's share section repeats (Phase 13), so a friend who opens the link finds the same words. The line under the buttons says what Back to the start does, because in a panel about this world the label alone reads as "restart this world": it starts the next game in a new world, as Play again does. It is not a control, so the tab order stays Stop here, Copy link to this world, Back to the start (Phase 15's keyboard test walks exactly that).

`revealPanel` is a module-level callback ref, so it is stable across renders and runs once as the panel mounts. React has already set the toggle's `aria-controls="stop-here"` in the same commit, so the query finds it. It first scrolls the panel into view, then scrolls the toggle back into view. Both scroll only as far as needed, and without smooth scrolling, because `theme.css` sets none, and forces `scroll-behavior: auto` under reduced motion. Neither moves focus. On a 375×667 phone the second scroll does nothing (the toggle is already on screen). At 320×256 (400% zoom) the panel is taller than the screen, and the second scroll is what keeps the focused toggle visible. Without `revealPanel`, on a 375×667 phone the panel opens below the fold, and the "brings its panel into view" test fails with `viewport ratio 0`. With only the first scroll, the 400% zoom test fails the same way.

The toggle clears `copied` each time it opens or closes the panel, so "Link copied." never greets a reopened panel before anything has been copied in it.

In `src/ui/App.tsx`, three edits:

(f) Directly after the focus effect's closing line `  }, [stepKey]);`, add:

```tsx

  /** Play again on the debrief, and Back to the start on the pause: keep a facilitator's edited assumptions, drop the seed for a new world. */
  function backToStart() {
    const params = new URLSearchParams(window.location.search);
    params.delete("seed");
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
    reset();
  }
```

(g) In the Debrief branch, replace the inline handler:

```tsx
          onRestart={() => {
            // Play again keeps a facilitator's edited assumptions but drops the seed, for a new world.
            const params = new URLSearchParams(window.location.search);
            params.delete("seed");
            const query = params.toString();
            window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
            reset();
          }}
```

with:

```tsx
          onRestart={backToStart}
```

(h) In the pause branch from Task 12.3, replace:

```tsx
          <FirstDecision view={view} before={before} scenario={pausedOn} resolved={resolved} onContinue={() => setStage("briefing")} />
```

with:

```tsx
          <FirstDecision
            view={view}
            before={before}
            scenario={pausedOn}
            resolved={resolved}
            onContinue={() => setStage("briefing")}
            onRestart={backToStart}
          />
```

Back to the start drops the seed on purpose, as Play again does. If it kept the seed, the title would reopen with this world's code filled in, and the next "Try your first decision" would replay turn 1 of the same world. That is a one-click "try the other option" rewind, which F6 and F8 rule out. The player keeps the world by copying the link, which the panel shows first.

**Step 4: Run them and watch them pass.**

```bash
npx tsc --noEmit
npx eslint .
npm run test
lsof -ti tcp:4173
npm run e2e
```

Expected: `lsof` prints nothing; `tsc` and `eslint` print nothing; all Vitest suites pass; every e2e test passes. That includes the five new engagement tests, the polish reproducibility test and the axe and phone tests with Stop here open. `backToStart` is shared, so the Stop here test's last four assertions (start button visible, the title's h1 focused, `seed` null, `cfg` kept) cover Play again's URL behaviour too. No existing test clicks Play again and checks the URL.

Re-run the hidden-information check from Task 12.3, Step 4. Expected: no output.

**Step 5: Commit.**

```bash
git add src/ui/screens/FirstDecision.tsx src/ui/App.tsx e2e/engagement.spec.ts e2e/polish.spec.ts
git commit -m "feat(ui): Stop here offers a link to the same world, not saved progress

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

### Task 12.5: Record D7 as implemented in DECISIONS.md

**Files:**
- Modify: `DECISIONS.md` (row F6, which Phase 8 wrote for D7)

**Step 1: Write the failing test.**

```bash
grep -n "Implemented in Phase 12" DECISIONS.md
```

**Step 2: Run it and watch it fail.** Expected: no output, exit status 1.

**Step 3: Implement.** Find the row with `grep -n '^| F6 |' DECISIONS.md`. Phase 8 wrote it for D7; its Question cell reads "A five-minute introductory route". Replace that whole line with the row below. The number stays F6: F7 is the saved-progress row that optional Phase 14 cites. The table's columns are `| # | Question | Decision | Why |`. Keep the phrase "and offers Back to the start, which behaves like Play again" exactly as written: Phase 14 edits it.

```markdown
| F6 | The five-minute taster (the engagement handoff's "introductory route"; D7) | **Implemented in Phase 12.** The taster is turn 1 of the real game: Scenario 1, the real engine, the player's own seed, no separate content bundle. After turn 1's consequences every game pauses once on a UI-only `"pause"` stage (`src/ui/App.tsx`, `src/ui/screens/FirstDecision.tsx`). The card is short and puts the choice to go on first. What happens next says "Keep going: N more decisions, about M minutes, then your debrief" (derived from `totalTurns` and the spec's three minutes a turn), and Keep going and Stop here are the first two controls after the heading. Below them, Your choice, and who backed each option lists every option with the advisers who backed it (Phase 10's who-backs-what rows), marking the player's own in words, and Think it over repeats the forecast question and the player's own forecast and asks two open questions that are never answered or scored. The card does not repeat the measured changes, which the consequences screen has just shown. Keep going plays on in the same state. Stop here shows a link to play the same world with a friend, from the start (seed set, a facilitator's `cfg` kept, `facilitator` dropped), says that a player who reopens it already knows how it began and that it is not saved progress, copies it to the clipboard only, and offers Back to the start, which behaves like Play again. No engine or content change; B1's eight turns stand | (1) A separate short bundle does not work. The engine always inserts one interrupt or false alarm, so the shortest possible run is three turns (the schema needs a sequence of two or more). Drift, the endings and the E11 effects are tuned for eight turns. A naive two-scenario bundle measured Rule 7 pooled at 44.0% (permissive) and 41.6% (restrictive), over the 40% limit. And a seed maps to the same hidden world in any bundle, so a short debrief would spoil the full game. (2) Forecast and investment stay in the taster: the engine requires both on every non-final turn, and a defaulted forecast would be Brier-scored in the debrief as if the player had made it. (3) Under current content turn 1 never fires a world event, because initial event windows open at Scenario 2. Its consequences always show one headline, the player's own. So the pause never suggests that chance has played out; it says only that later turns "may bring the unexpected", and names no interrupt. (4) Information rule: the pause reads only `displayed()` snapshots and `publicContent()`, and takes every turn-1 fact from the snapshot kept before ADVANCE, because the live view is already turn 2. It shows no stated-minus-measured remainder (on turn 1 that would isolate Scenario 1's hidden cyber-balance effects), no estimate-band change (display noise is redrawn each turn) and no in-game "try the other option". For the same reason Back to the start drops the seed (a line under it says the title opens with a new world), and the link is offered for a friend, as the debrief offers it (F8), not as the player's own replay. (5) The card is where a newcomer decides whether to go on, so it is short: about 190 words, with Keep going on the first screen of a 375×667 phone. A draft that repeated the consequences screen ran to about 300 words, with Keep going nearly three phone screens down. Its one new element is Think it over. The rest restates what the two screens before it showed, so without the two open questions a newcomer who stops here would leave with nothing to argue about (the engagement handoff's "discover what might change your mind"). (6) Every option is shown alike, with its backers and without quoted reasoning, so the card does not set the advisers who backed the player's choice against those who did not (the engagement handoff warns against a correct expert and incorrect foils). The real-world evidence panel's text stays on the briefing, under its real-world label. (7) "About five minutes" for the opening, turn 1 and the pause, and "about 20 minutes" for the rest, are design estimates. Only the human playtest can confirm them, and it stays open. (8) Any later content change to make turn 1 eventful, such as a delay-0 event on a Scenario 1 option, belongs in section E with a balance rerun |
```

**Step 4: Run it and watch it pass.**

```bash
grep -c "Implemented in Phase 12" DECISIONS.md
grep -c "introductory route" DECISIONS.md
grep -c '^| F6 |' DECISIONS.md
```

Expected: `1`, `1` and `1`. Both the old and the new row contain "introductory route", so a `2` in the second check means the new row was added beside the old one instead of replacing it.

**Step 5: Commit.**

```bash
git add DECISIONS.md
git commit -m "docs: record the first-decision pause (D7) as implemented

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

### Phase 12 gate

Run the full local gate from the repository root. CI has never run on GitHub (D10), so this is the gate:

```bash
lsof -ti tcp:4173
npm run lint && npm run test && npm run balance && npm run build && npm run e2e
du -sk dist
```

`lsof` must print nothing before the gate runs. If it prints a process id, `kill <id>` and run the gate again: a stale preview server makes Playwright test an old bundle.

What must be true:
1. Lint, unit tests, balance, build and every e2e test pass. Balance output is unchanged from the Phase 11 gate, because this phase touches no engine or content file.
2. `du -sk dist` prints a number below `16384`.
3. The engine and content are untouched. Run `git log --oneline -8` and find the commit just before Task 12.1 (the last Phase 11 commit). Then run `git diff --stat <that-commit> -- src/engine src/content`. Expected: no output.
4. Hidden information. Expected: no output.

   ```bash
   grep -nE "view\.(current|truth|debrief|history)|halfWidth|visibleEffects|oddsAtTheTime|published|assumptionsOf|defaults|evidencePanel|\.unclear|\.measured|\.stance" src/ui/screens/FirstDecision.tsx
   ```
5. The taster reproducibility e2e passes: "a run that pauses, opens Stop here and keeps going matches a replay from the world link". So a run stopped at the pause, with Stop here opened, and then continued reproduces a replay of the same world from its link; Keep going only changes the interface stage (`App.tsx`), so it plays on in the same state. The original "the same seed code and the same actions reproduce an identical run, start to finish" passes too.
6. Axe reports zero serious violations on the pause, closed and with Stop here open, in light and dark. There is no horizontal overflow at 360px, closed or open. Keep going is the first tab stop after the h1 and sits inside the first screen at 375×667. The h1 is focused on the pause, on turn 2's briefing and, after Back to the start, on the title. Stop here's panel scrolls into view as it opens, and the focused Stop here button stays on screen at 375×667 and at 320×256 (400% zoom).
7. The crisis spec still sees "6:00 remaining" on crisis briefings and "3:00 remaining" on crisis decisions, so the pause did not shift `stepIndex`.

Then update `docs/plan.md`. In the Phase 12 entry Phase 8 wrote, change the phase line and its three existing sub-items ("A pause after turn 1's consequences…", "End-to-end helpers click through the pause", "Gate: all local gates green; a run that pauses and continues reproduces an uninterrupted run…") from `- [ ] ⬜` (or `- [ ] 🟨`) to `- [x] 🟩`. Every game now pauses, so no uninterrupted run exists to compare with; when ticking the third sub-item, replace that whole line with:

```markdown
  - [x] 🟩 Gate: all local gates green; a run stopped at the pause, with Stop here opened, and then continued reproduces a replay of the same world from its link (`e2e/engagement.spec.ts`). Keep going only changes the interface stage (`App.tsx`), so it plays on in the same state. Commit on the feature branch.
```

Do not add a sub-item. Then recompute the `**Overall Progress:**` line at the top of the file with Phase 8's denominator: 63 build steps, or 65 if the designer approved optional Phase 14. With Phases 8 to 12 all ticked, that is 57 of 63 (`90%`), or 57 of 65 (`88%`).

```bash
git add docs/plan.md
git commit -m "docs: Phase 12 gate green (first-decision pause)

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

Do not push. Phase 8's workflow rule in `CLAUDE.md` pushes the feature branch and opens the pull request at the Phase 15 gate, or earlier only if the designer asks. Nothing is deployed (D10).

There is no designer stop at this gate: continue to Phase 13. Report these as open and never claim them as done: whether a newcomer finishes the opening, turn 1 and the pause in about five minutes, and whether they choose to keep going past turn 1 (F6). Both are human-playtest items.


---

## Phase 13: A debrief for everyone

**Goal:** Reorder and soften the debrief for a general audience (contract decision D9). It opens with "At a glance" and a What if that starts on the most arguable decision and shows how the 1,000 replays ended. Decision quality versus luck stays open. The four reference panels start closed. The page ends with "Talk it over" prompts and a "Share your run" section that adds a link to the same world. It does all this without touching the engine, the content or any test contract.

**Handoff items addressed:** observation 9 (What if is last, 7.5 screens down at 726px); observation 6, debrief part (the rail cannot navigate and always claims "World"); observation 7, debrief part (confirm `48MM` and `720PT` are gone); the proposals "End with discussion and agency", "an easy way to replay one decision" (through What if, not a same-world rewind) and "Play the same scenario as a friend" (the seed link). The debrief map also lists a small bug: `WorldPanel` hard-codes 30/40/30.

**Depends on:**
- Phase 8: `data-testid="debrief"` on the Debrief root; `playToDebrief` waits on that test id; `LABEL` in `e2e/play.ts`; the section F rows in `DECISIONS.md`, with D9 as row **F8** (`| F8 | The order of the debrief (spec Section 11) | …`); the Phase 8–15 blocks in `docs/plan.md`.
- Phase 9: `e2e/engagement.spec.ts` exists; `LABEL.start` is "Try your first decision"; `state="48mm"` and the `· 720pt` figure ids are gone; `Plate` has no `figure` field and the Debrief header reads `{mark && <Figure {...mark} className="mb-6 max-w-[12rem]" />}`; `AppShell`'s `steps`, `stepIndex` and `stepsLabel` are optional and it has no `figureId`; the seed field sits in a `<details>`, open when `?seed=` is present, and its label still starts "Seed code"; `Title.tsx` has a `headingRef` prop documented as `/** App's step heading, so focus comes back to this h1 after Play again. */` (Task 13.7 renames the button in that comment).
- Phase 10, Task 10.8: `src/ui/shell/StepsRail.tsx` takes `hrefs?: readonly string[]`, never makes the current step a link, and gives each link an `unfold` click handler (`inline-flex min-h-6 … text-accent underline`, so 24px tall); `AppShell` takes `stepHrefs?: readonly string[]` and passes it to the rail as `hrefs`. Task 13.7 builds on this and changes only `unfold`. Phase 10's e2e test "the rail's past Briefing step opens the folded briefing" must keep passing.
- Phase 12: `worldLink(base: string, search: string, seedCode: string): string` in `src/ui/copy.ts`. It sets `seed`, keeps `cfg` and drops `facilitator`. `playToDebrief` clicks through the turn-1 pause card. `App.tsx` has a `backToStart()` function, with the doc comment `/** Play again on the debrief, and Back to the start on the pause: … */`, passed as `Debrief`'s `onRestart`. `DECISIONS.md`'s taster row (D7, row F6) says Back to the start "behaves like Play again".
- Decisions D9, D10 and D13.

**Ground rules for every task in this phase:**
- Work on the redesign branch (D10), never on `main`.
- Stop any `vite preview` already listening on port 4173 before running e2e. `playwright.config.ts` reuses an existing server, so a stale one would test an old build.
- Nothing here edits `src/engine/**` or `src/content/**`.
- Every new element reads `view.debrief`, `view.truth`, `view.history`, `rankings` or `published`, and renders only inside `Debrief` after its existing guard, `if (!debrief || !view.truth) return null;`. Nothing is added to the News screen.

**What must keep passing unchanged:**
- the six level-2 heading regexes in `e2e/debrief.spec.ts`;
- the test ids `brier`, `forecast-row`, `luck-tag` (exactly 8), `decision-review` and `what-if-result`;
- every `<p>` in the what-if result except the last starts with the prefix, and the last contains "This is the model's output, not a finding.";
- the strings "Rerun 1,000 games", "View assumptions" (unique), "Copy run summary", "Copied as text.", "Show as JSON", the exact label "Run summary", and the label "The decision to change";
- the clipboard summary format;
- no request leaves localhost;
- no element other than the eyebrow contains "your record";
- the reproducibility test;
- Phase 10's rail test ("the rail's past Briefing step opens the folded briefing") and Phase 12's pause and Stop here tests.

### Task 13.1: Debrief copy builders

**Files:**
- Modify: `src/ui/debrief/copy.ts` (the engine import at line 6, then new exports appended at the end of the file)
- Test: `tests/ui/copy.test.ts` (the imports at lines 2–3, the `everySentence` list at lines 20–26, the verdict test at lines 32–34, and new `describe` blocks appended at the end)

**Step 1: Write the failing test.**

In `tests/ui/copy.test.ts`, replace the two import lines under `import { describe, expect, test } from "vitest";`. If another phase has already added names to these imports, keep those names and add the new ones.

Old:
```ts
import { calibrationBins, causalSentence, outcomeSentence, PREFIX, runSummaryText, soundSentence, whatIfSentences } from "../../src/ui/debrief/copy";
import type { CounterfactualResult, RunSummary } from "../../src/engine";
```
New:
```ts
import {
  BRIER_GLOSS, calibrationBins, causalSentence, compositeSentence, DEFEND_PROMPT, DISCUSSION_PROMPTS, leastLikelyOutcome, linkSentence, outcomeSentence,
  pivotalDecision, pivotSentence, PREFIX, profileShareSentence, runSummaryText, soundSentence, standing, TALK_INTRO, tallySentence, tagText,
  TEASER, whatIfEndingCaption, whatIfEndingRows, whatIfSentences,
} from "../../src/ui/debrief/copy";
import { createGame, displayed, reduce, type CounterfactualResult, type GameState, type LuckLink, type RunSummary } from "../../src/engine";
import { loadContent } from "../../src/content";
```

Extend the copy-rules lists. Every new statistic sentence joins `everySentence`. Lines that state no simulated statistic (prompts, the Brier gloss, teasers and the profile-weights sentence) join a second list that is checked for verdict words only.

Old:
```ts
    outcomeSentence("An attack", 0.38, true), outcomeSentence("An attack", 0.38, false),
  ];
```
New:
```ts
    outcomeSentence("An attack", 0.38, true), outcomeSentence("An attack", 0.38, false),
    pivotSentence(-2.1), pivotSentence(1.5), pivotSentence(0),
    linkSentence(3, "The Biology Result", 0, 0.3), linkSentence(3, "The Biology Result", 0.3, 0.3), linkSentence(3, "The Biology Result", 0.4, 0.2),
    whatIfEndingCaption(1000),
    tallySentence(["Sound and fortunate", "Sound and unlucky", "Risky and fortunate", "Sound and fortunate"]),
    compositeSentence({ control: 61.7, prosperity: 48.2, legitimacy: 55 }),
  ];
  // Lines that state no simulated statistic, so they carry no prefix, but still never pass a verdict.
  const everyOtherLine = [
    ...DISCUSSION_PROMPTS, DEFEND_PROMPT, TALK_INTRO, BRIER_GLOSS, ...Object.values(TEASER),
    profileShareSentence({ benign: 30, contested: 40, hard: 30 }),
  ];
```

Old:
```ts
  test("no sentence tells the player a decision was right or wrong", () => {
    for (const sentence of everySentence) expect(sentence).not.toMatch(/\b(right|wrong|correct|incorrect|mistake|should have|good decision|bad decision)\b/i);
  });
```
New:
```ts
  test("no sentence tells the player a decision was right or wrong", () => {
    for (const sentence of [...everySentence, ...everyOtherLine]) {
      expect(sentence).not.toMatch(/\b(right|wrong|correct|incorrect|mistake|should have|good decision|bad decision)\b/i);
    }
  });
```

Append at the end of the file:
```ts

// ---------------------------------------------------------------- the debrief for everyone (Phase 13)

type Luck = { delta: number; links: LuckLink[] };
const link = (id: string, probability: number, happened: boolean): LuckLink => ({ kind: "event", id, probability, happened, impact: -3 });
const luck = (delta: number, links: LuckLink[] = []): Luck => ({ delta, links });
const TRACKS = ["evaluation", "provenance", "diplomacy", "defensiveCyber"] as const;

describe("a decision to argue about", () => {
  test("is the decision the dice went against most", () => {
    expect(pivotalDecision({ luck: [luck(0.5), luck(-1.2), luck(-3.4), luck(2.6)] })).toBe(2);
  });

  test("is the luckiest decision when no decision was unlucky", () => {
    expect(pivotalDecision({ luck: [luck(0.5), luck(0), luck(2.6), luck(1)] })).toBe(2);
  });

  test("breaks ties by taking the earlier decision, so it never depends on anything but the debrief", () => {
    expect(pivotalDecision({ luck: [luck(-2), luck(-2)] })).toBe(0);
    expect(pivotalDecision({ luck: [luck(0), luck(0)] })).toBe(0);
    expect(pivotalDecision({ luck: [] })).toBe(0);
  });

  test("is described by which way the dice fell, never by whether the choice was good", () => {
    expect(pivotSentence(-2.1)).toBe(`${PREFIX}, no other decision had its chance events go against you more than this one.`);
    expect(pivotSentence(1.5)).toBe(`${PREFIX}, none of your decisions was unlucky, and no other decision had its chance events go your way more than this one.`);
    expect(pivotSentence(0)).toContain("no decision was clearly lucky or unlucky");
  });

  test("on a real run, is the decision with the lowest luck delta", () => {
    const content = loadContent();
    let state: GameState = createGame("GLANCE-1", content);
    while (state.phase !== "debrief") {
      if (state.phase === "forecast") state = reduce(state, { type: "FORECAST", value: 0.5 }, content);
      else if (state.phase === "decide") state = reduce(state, { type: "DECIDE", choiceId: state.current!.choices.find((c) => c.status === "available")!.id }, content);
      else if (state.phase === "invest") state = reduce(state, { type: "INVEST", track: TRACKS.find((t) => state.tracks[t] < 3)! }, content);
      else state = reduce(state, { type: "ADVANCE" }, content);
    }
    const debrief = displayed(state).debrief!;
    const deltas = debrief.luck.map((l) => l.delta);
    const pivotal = deltas[pivotalDecision(debrief)]!;
    if (Math.min(...deltas) < 0) expect(pivotal).toBe(Math.min(...deltas));
    else expect(Math.abs(pivotal)).toBe(Math.max(...deltas.map(Math.abs)));
    expect(pivotalDecision(debrief)).toBe(pivotalDecision(structuredClone(debrief)));
    const outcome = leastLikelyOutcome(debrief);
    expect(outcome).not.toBeNull();
    expect(outcome!.link.probability).toBeGreaterThan(0);
    expect(outcome!.link.probability).toBeLessThan(1);
  });
});

describe("the least likely thing that happened", () => {
  test("is the happened link with the lowest odds, across every decision", () => {
    const outcome = leastLikelyOutcome({ luck: [luck(0, [link("a", 0.4, true), link("b", 0.1, false)]), luck(0, [link("c", 0.2, true)])] });
    expect(outcome).toEqual({ index: 1, link: link("c", 0.2, true) });
  });

  test("ignores certainties, which were never a matter of chance", () => {
    const outcome = leastLikelyOutcome({ luck: [luck(0, [link("scheduled", 1, true), link("a", 0.7, true)])] });
    expect(outcome?.link.id).toBe("a");
  });

  test("falls back to the likeliest thing that did not happen", () => {
    const outcome = leastLikelyOutcome({ luck: [luck(0, [link("a", 0.3, false)]), luck(0, [link("b", 0.8, false)])] });
    expect(outcome).toEqual({ index: 1, link: link("b", 0.8, false) });
  });

  test("is null when no decision was tied to a chance event", () => {
    expect(leastLikelyOutcome({ luck: [luck(0), luck(0)] })).toBeNull();
  });

  test("prefers an event to a hidden fact, which does not read as something that happened", () => {
    const fact: LuckLink = { kind: "fact", id: "f", when: [], probability: 0.1, happened: true, impact: -3 };
    expect(leastLikelyOutcome({ luck: [luck(0, [fact, link("a", 0.4, true)])] })?.link.id).toBe("a");
    expect(leastLikelyOutcome({ luck: [luck(0, [fact])] })?.link.id).toBe("f");
  });

  test("names the decision it was linked to with the change in odds, never as fate", () => {
    expect(linkSentence(3, "The Biology Result", 0, 0.3)).toBe(`${PREFIX}, your decision in turn 3, The Biology Result, raised its odds from 0% to 30%.`);
    expect(linkSentence(3, "The Biology Result", 0.4, 0.2)).toBe(`${PREFIX}, your decision in turn 3, The Biology Result, lowered its odds from 40% to 20%.`);
    expect(linkSentence(3, "The Biology Result", 0.3, 0.3)).toBe(`${PREFIX}, your decision in turn 3, The Biology Result, left its odds unchanged at 30%.`);
  });
});

describe("how the replays ended", () => {
  test("lists every ending either arm reached, most common first", () => {
    const rows = whatIfEndingRows({
      ...result,
      asPlayed: arm({ endings: { "dependent-state": 0.6, "the-fortress": 0.4 } }),
      changed: arm({ endings: { "dependent-state": 0.3, "responsible-ai-power": 0.7 } }),
    });
    expect(rows).toEqual([
      { endingId: "responsible-ai-power", asPlayed: 0, changed: 0.7 },
      { endingId: "dependent-state", asPlayed: 0.6, changed: 0.3 },
      { endingId: "the-fortress", asPlayed: 0.4, changed: 0 },
    ]);
  });

  test("is captioned as the model's output", () => {
    expect(whatIfEndingCaption(1000)).toBe(`${PREFIX}, how the 1,000 replays ended, with your choices and with the change`);
  });
});

describe("decision quality in plain words", () => {
  test("a standing is sound in the top two, and waits for the rankings", () => {
    const ranking = [{ choiceId: "B", expectedScore: 52 }, { choiceId: "A", expectedScore: 50 }, { choiceId: "C", expectedScore: 47 }];
    expect(standing(ranking, "A")).toEqual({ rank: 2, of: 3, sound: true });
    expect(standing(ranking, "C")).toEqual({ rank: 3, of: 3, sound: false });
    expect(standing(undefined, "A")).toBeNull();
    expect(standing(ranking, "Z")).toBeNull();
  });

  test("a tag reads as the spec's four tags do", () => {
    expect(tagText({ rank: 1, of: 4, sound: true }, false)).toBe("Sound and unlucky");
    expect(tagText({ rank: 4, of: 4, sound: false }, true)).toBe("Risky and fortunate");
  });

  test("the tally counts each tag in a fixed order and leaves out tags nobody earned", () => {
    expect(tallySentence(["Risky and unlucky", "Sound and fortunate", "Sound and fortunate"]))
      .toBe(`${PREFIX}, of your 3 decisions, 2 were sound and fortunate and 1 risky and unlucky.`);
    expect(tallySentence(["Sound and fortunate"])).toBe(`${PREFIX}, of your 1 decision, 1 was sound and fortunate.`);
  });

  test("the composites are named in words a newcomer can follow", () => {
    expect(compositeSentence({ control: 61.7, prosperity: 48.2, legitimacy: 55 })).toBe(
      `${PREFIX}, the country finished on 62 out of 100 for control (security, the state's capacity and low systemic AI risk), 48 for prosperity (economy, innovation and social stability) and 55 for legitimacy (public trust). Most endings depend on whether control and prosperity each reached 55.`,
    );
  });
});

describe("the world's odds are read from the published weights", () => {
  test("the bundled weights read 30, 40 and 30", () => {
    expect(profileShareSentence({ benign: 30, contested: 40, hard: 30 })).toBe(
      "The game draws a benign world 30% of the time, a contested one 40% and a hard one 30%, then draws each fact below from that world’s odds.",
    );
  });

  test("a facilitator's weights are shown as shares of their total", () => {
    expect(profileShareSentence({ benign: 50, contested: 40, hard: 30 })).toContain("a benign world 42% of the time, a contested one 33% and a hard one 25%");
  });
});

describe("talking it over", () => {
  test("the prompts are open questions, and none would be counted as a numbered decision line if copied", () => {
    expect(DISCUSSION_PROMPTS.length).toBeGreaterThanOrEqual(4);
    for (const prompt of DISCUSSION_PROMPTS) {
      expect(prompt.endsWith("?"), prompt).toBe(true);
      expect(prompt).not.toMatch(/^\d\./);
    }
    expect(DEFEND_PROMPT).toBe("Would you defend this choice, knowing how it turned out?");
  });
});
```

**Step 2: Run it and watch it fail.**
```bash
npx vitest run tests/ui/copy.test.ts
```
Expected: `FAIL tests/ui/copy.test.ts`, with `TypeError: pivotSentence is not a function` while the file is collected, and `Test Files 1 failed`.

**Step 3: Implement.** In `src/ui/debrief/copy.ts`, replace the engine import. The builders need the engine's `luckTag`, which is a value, and four more types.

Old:
```ts
import type { CounterfactualResult, DisplayedState, MetricKey } from "../../engine";
```
New:
```ts
import {
  luckTag,
  type CompositeKey,
  type CounterfactualResult,
  type DisplayedState,
  type LuckLink,
  type MetricKey,
  type OptionEstimate,
  type Profile,
} from "../../engine";
```

Append at the end of `src/ui/debrief/copy.ts`, after `runSummaryText`:
```ts

// ---------------------------------------------------------------- the debrief for everyone (DECISIONS.md, section F)

/**
 * The decision to argue about: the one the dice went against most, or, if luck
 * never went against the player, the one it favoured most. Read only from the
 * debrief summary, never from the worker's rankings, so it is fixed the moment
 * the debrief opens and identical on every replay of the same run.
 */
export function pivotalDecision(debrief: { luck: readonly { delta: number }[] }): number {
  const deltas = debrief.luck.map((entry) => entry.delta);
  if (deltas.length === 0) return 0;
  const lowest = Math.min(...deltas);
  if (lowest < 0) return deltas.indexOf(lowest);
  const largest = Math.max(...deltas.map(Math.abs));
  return Math.max(0, deltas.findIndex((delta) => Math.abs(delta) === largest));
}

/** Why that decision was picked: which way its dice fell, never whether it was a good choice. */
export function pivotSentence(delta: number): string {
  if (delta < 0) return `${PREFIX}, no other decision had its chance events go against you more than this one.`;
  if (delta > 0) return `${PREFIX}, none of your decisions was unlucky, and no other decision had its chance events go your way more than this one.`;
  return `${PREFIX}, the chance events tied to your decisions landed as their odds implied, so no decision was clearly lucky or unlucky.`;
}

export const DEFEND_PROMPT = "Would you defend this choice, knowing how it turned out?";

export interface NotableOutcome {
  /** The decision the chance event was tied to. */
  index: number;
  link: LuckLink;
}

/**
 * The least likely thing that happened: of every chance event tied to a decision,
 * the one that happened against the longest odds; hidden facts only when no event
 * was at stake. If nothing in that pool happened, the likeliest thing that did not.
 * Certainties are skipped.
 */
export function leastLikelyOutcome(debrief: { luck: readonly { links: readonly LuckLink[] }[] }): NotableOutcome | null {
  const chances = debrief.luck.flatMap((entry, index) =>
    entry.links.filter((link) => link.probability > 0 && link.probability < 1).map((link) => ({ index, link })));
  // An event reads as something that happened. A hidden fact is a state of the world, named in condition
  // language ("it is not the case that…"), so it is used only when no event was at stake.
  const events = chances.filter((chance) => chance.link.kind === "event");
  const pool = events.length > 0 ? events : chances;
  const happened = pool.filter((chance) => chance.link.happened);
  if (happened.length > 0) return happened.reduce((least, chance) => (chance.link.probability < least.link.probability ? chance : least));
  if (pool.length > 0) return pool.reduce((likeliest, chance) => (chance.link.probability > likeliest.link.probability ? chance : likeliest));
  return null;
}

/** Which decision a chance event was linked to, always with the change in odds that decision made, never as fate. */
export function linkSentence(turn: number, scenarioTitle: string, before: number, after: number): string {
  if (Math.round(before * 100) === Math.round(after * 100)) {
    return `${PREFIX}, your decision in turn ${turn}, ${scenarioTitle}, left its odds unchanged at ${percent(after)}.`;
  }
  return `${PREFIX}, your decision in turn ${turn}, ${scenarioTitle}, ${after > before ? "raised" : "lowered"} its odds from ${percent(before)} to ${percent(after)}.`;
}

/** The three composites in plain words, with the one rule that gives a newcomer a reference point (content/endings.json: 55). */
export function compositeSentence(composites: Record<CompositeKey, number>): string {
  const [control, prosperity, legitimacy] = [composites.control, composites.prosperity, composites.legitimacy].map(Math.round);
  return `${PREFIX}, the country finished on ${control} out of 100 for control (security, the state's capacity and low systemic AI risk), `
    + `${prosperity} for prosperity (economy, innovation and social stability) and ${legitimacy} for legitimacy (public trust). `
    + "Most endings depend on whether control and prosperity each reached 55.";
}

/** How often the game draws each kind of world, read from the weights in force, so a facilitator's edits show truthfully. */
export function profileShareSentence(weights: Record<Profile, number>): string {
  const total = weights.benign + weights.contested + weights.hard;
  const share = (weight: number) => `${Math.round((weight / total) * 100)}%`;
  return `The game draws a benign world ${share(weights.benign)} of the time, a contested one ${share(weights.contested)} and a hard one `
    + `${share(weights.hard)}, then draws each fact below from that world’s odds.`;
}

export interface EndingRow {
  endingId: string;
  /** Share of the replays, 0..1. */
  asPlayed: number;
  changed: number;
}

/** Every ending either arm of a what-if reached, most common first. */
export function whatIfEndingRows(result: CounterfactualResult): EndingRow[] {
  const ids = [...new Set([...Object.keys(result.asPlayed.endings), ...Object.keys(result.changed.endings)])];
  return ids
    .map((endingId) => ({ endingId, asPlayed: result.asPlayed.endings[endingId] ?? 0, changed: result.changed.endings[endingId] ?? 0 }))
    .sort((a, b) => Math.max(b.asPlayed, b.changed) - Math.max(a.asPlayed, a.changed) || a.endingId.localeCompare(b.endingId));
}

export function whatIfEndingCaption(runs: number): string {
  return `${PREFIX}, how the ${runs.toLocaleString("en-GB")} replays ended, with your choices and with the change`;
}

/** A decision's rank among the options open at the time. Null until the worker's rankings arrive. */
export interface Standing {
  rank: number;
  of: number;
  /** Among the two strongest options on what could have been known then (spec Section 11). */
  sound: boolean;
}

export function standing(ranking: readonly OptionEstimate[] | undefined, choiceId: string): Standing | null {
  if (!ranking) return null;
  const rank = ranking.findIndex((estimate) => estimate.choiceId === choiceId) + 1;
  return rank > 0 ? { rank, of: ranking.length, sound: rank <= 2 } : null;
}

/** "Sound and unlucky": one of the spec's four luck tags, capitalised for display. */
export function tagText(position: Standing, fortunate: boolean): string {
  return luckTag(position.sound, fortunate).replace(/^./, (first) => first.toUpperCase());
}

const TAG_ORDER = ["Sound and fortunate", "Sound and unlucky", "Risky and fortunate", "Risky and unlucky"];

/** How the tags added up across the run, in the spec's order, leaving out tags no decision earned. */
export function tallySentence(tags: readonly string[]): string {
  const counts = TAG_ORDER.map((tag) => ({ tag, count: tags.filter((t) => t === tag).length })).filter((c) => c.count > 0);
  const parts = counts.map((c, index) => `${c.count} ${index === 0 ? (c.count === 1 ? "was " : "were ") : ""}${c.tag.toLowerCase()}`);
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : (parts[0] ?? "");
  return `${PREFIX}, of your ${tags.length} decision${tags.length === 1 ? "" : "s"}, ${list}.`;
}

export const BRIER_GLOSS =
  "It is a forecast score. For each question it measures how far the chance you gave was from what happened, counting a big miss far more "
  + "than a small one, then averages the eight. Lower means closer. Answering 50% every time scores 0.250; being certain every time and "
  + "matching every outcome would score 0. With eight forecasts it is a rough measure.";

/** One line under each reference panel's heading while it is closed. Each promises only what its panel shows. */
export const TEASER = {
  world: "Which kind of world you drew, its five hidden facts, and how the reports you read lined up with them.",
  calibration: "How close your forecasts came to what happened, and how your advisers scored on the same questions.",
  record: "Where the country ended on every measure, including the true values of those you saw only as a range or a label, and further reading.",
  unseen: "Options that stayed locked to you, and the crises you did not meet.",
} as const;

export const TALK_INTRO = "Questions to think about on your own, or to talk over with someone who has played. Each has more than one reasonable answer.";

/** Open questions for the end of a run. Never numbered in the text, so none can be mistaken for a decision line in a copied summary. */
export const DISCUSSION_PROMPTS: readonly string[] = [
  "Which of your decisions would you defend even if it had ended badly, and why?",
  "What surprised you most about the world you were in?",
  "Did an adviser ever change your mind? Whose advice did you set aside, and why?",
  "Which mattered most to you: keeping the country safe, keeping the economy growing, or keeping the public's trust? Did your choices show it?",
  "Has playing changed what you think about AI's risks or its benefits?",
];
```

Notes on the design choices:
- `pivotalDecision` takes a structural `{ luck }`, so tests need no full `DebriefSummary`. The real `view.debrief` still type-checks. Ties go to the earlier decision (`indexOf`, `findIndex`), which keeps it deterministic. `pivotSentence` is worded so that it stays true on a tie ("no other decision had its chance events go against you more than this one"), because a tie makes "more than any other" false.
- `leastLikelyOutcome` skips links with probability 0 or 1. Real content has scheduled events linked at probability 1 with impact 0, such as `uplift-study-result`, and those were never a matter of chance.
- `leastLikelyOutcome` prefers events to hidden facts. The engine links a decision to hidden facts as well as events (`luckLinks` in `src/engine/scoring.ts`), and a fact's label is condition language from `describeConditions`, such as "it is not the case that the recording was authentic, and it is not the case that forensics finished before polling day" or "sandbagging cause is strategic". Followed by "It happened.", that reads badly as the first thing under the debrief heading. In a planning check of 1,200 simulated runs (first, last and mixed options, 400 seeds each), facts competing on equal terms won in 464 runs (39%). With events preferred, all 1,200 picked an event. A fact is used only when no event was at stake.
- `linkSentence` names the decision a chance event was linked to, always with the change in odds that decision made (CLAUDE.md: "Show causal links with the probability change they caused, not as fate"). It is needed because the engine's `freezeOdds` (`src/engine/reduce.ts`) links every decision to its scenario's forecast-resolution event whether or not the decision changed that event's odds. In the planning check, 459 of the 1,200 picked events had odds the linked decision left unchanged and 103 had odds it lowered. A bare "It was tied to your decision" would imply blame in those runs. `before` is 0 when the event was not yet in play, so "raised its odds from 0% to 30%" means the decision put it in play, exactly as `causalSentence` already says in the Quality panel.
- `compositeSentence` ends with the rule most endings use: four of the five endings in `src/content/endings.json` test `control` and `prosperity` against 55, each separately (legitimacy only decides the backlash paragraph, and the Unknown Frontier uses other conditions). That gives a newcomer a reference point for the three numbers. It is a rule, not a simulated statistic. `RecordPanel` already hard-codes the same 55 ("An ending needs 55 on a composite to count it as secured"); if the designer changes the threshold in the content, both hard-coded lines must change with it.
- `BRIER_GLOSS`, the teasers and the prompts avoid the verdict words, including "right": the gloss says "matching every outcome", not "being right". The gloss avoids "squared gaps" and the prompts avoid "keeping control", because the brief says not to assume familiarity with forecasting or policy.
- The run summary text and the `RunRecord` JSON are deliberately unchanged (decision 11, the reproducibility test). The prompts are not copied into the summary.

**Step 4: Run it and watch it pass.**
```bash
npx vitest run tests/ui/copy.test.ts && npx tsc --noEmit && npx eslint src/ui/debrief/copy.ts tests/ui/copy.test.ts
```
Expected: `Test Files 1 passed`, with 20 more tests than before this task (26 if no other phase has added tests to this file). `tsc` and `eslint` print nothing.

**Step 5: Commit.**
```bash
git add src/ui/debrief/copy.ts tests/ui/copy.test.ts
git commit -m "feat(debrief): copy builders for a debrief for everyone"
```

### Task 13.2: Collapsible panels, section ids and the new order

**Files:**
- Create: `src/ui/debrief/sections.ts`
- Create: `src/ui/debrief/Panel.tsx` (replaces the local `Panel` in `Debrief.tsx`)
- Modify: `src/ui/screens/Debrief.tsx` (the imports, the local `Panel` function, the doc comment, and the six `<Panel …>` lines)
- Modify: `e2e/play.ts` (append the `openPanel` and `openAllPanels` helpers)
- Modify: `e2e/debrief.spec.ts` (open Calibration before the Brier assertions)
- Modify: `e2e/polish.spec.ts` (open every panel before the debrief axe scan and before the 360px width check)
- Test: `e2e/engagement.spec.ts`

**Step 1: Write the failing test.**

Append to `e2e/play.ts`:
```ts

/** Opens one of the debrief's closed reference panels by its heading. */
export async function openPanel(page: Page, name: RegExp) {
  const toggle = page.getByRole("heading", { level: 2, name }).getByRole("button");
  if ((await toggle.getAttribute("aria-expanded")) === "false") await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
}

/** Opens every closed panel and disclosure in the debrief, so a scan or a width check sees all of it. */
export async function openAllPanels(page: Page) {
  const debrief = page.getByTestId("debrief");
  const closedPanels = debrief.locator('h2 > button[aria-expanded="false"]');
  while ((await closedPanels.count()) > 0) await closedPanels.first().click();
  const closedDetails = debrief.locator("details:not([open]) > summary");
  while ((await closedDetails.count()) > 0) await closedDetails.first().click();
}
```
`openAllPanels` only clicks `<details>` that are closed, so it never shuts "View assumptions" once a test has opened it.

In `e2e/engagement.spec.ts`, make sure the imports include `expect` and `test` from `@playwright/test`, and `openPanel`, `playToDebrief` and `startGame` from `./play`. Merge them into the existing import statements rather than adding a second import from the same module. Do not import `LABEL` yet: Task 13.4 adds it when a test first uses it, because `noUnusedLocals` makes an unused import a type error. Then append:
```ts

// ---------------------------------------------------------------- Phase 13: a debrief for everyone

test("the debrief's reference panels start closed with a teaser, and open from their heading", async ({ page }) => {
  await startGame(page, "PANELS-1");
  await playToDebrief(page);
  for (const name of [/The world you were in/, /Calibration/, /Governance record/, /What you never saw/]) {
    const heading = page.getByRole("heading", { level: 2, name });
    await expect(heading).toBeVisible();
    await expect(heading.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  }
  for (const name of [/What if/, /Decision quality versus luck/]) {
    await expect(page.getByRole("heading", { level: 2, name }).getByRole("button")).toHaveCount(0);    // always open: not toggles
  }

  const chart = page.getByRole("img", { name: /^Calibration chart/ });
  const teaser = page.getByText("How close your forecasts came to what happened");
  await expect(chart).toHaveCount(0);                                        // a closed panel renders nothing
  await expect(teaser).toBeVisible();
  await openPanel(page, /Calibration/);
  await expect(teaser).toHaveCount(0);
  await expect(chart).toBeVisible();
  expect((await chart.locator("svg").first().boundingBox())?.width).toBeGreaterThan(100);   // the chart measured a real box
});
```

In `e2e/debrief.spec.ts`, add `openPanel` to the import from `./play`. At HEAD that import reads `import { playTurn, startGame } from "./play";`, so it becomes `import { openPanel, playTurn, startGame } from "./play";`. Then:

Old:
```ts
  await scriptedRun(page, "DEBRIEF-2");
  const rows = page.getByTestId("forecast-row");
```
New:
```ts
  await scriptedRun(page, "DEBRIEF-2");
  await openPanel(page, /Calibration/);                                       // a reference panel, closed until wanted
  const rows = page.getByTestId("forecast-row");
```

In `e2e/polish.spec.ts`, add `openAllPanels` to the import from `./play`. Then:

Old (end of the axe walk):
```ts
    await page.getByText("View assumptions").click();
    await expectNoSeriousViolations(page, "debrief");
```
New:
```ts
    await page.getByText("View assumptions").click();
    await openAllPanels(page);                                               // scan every panel, not only the open ones
    await expectNoSeriousViolations(page, "debrief");
```
Old (end of the reduced-motion and phone test):
```ts
  await playToDebrief(page);
  await overflows("debrief");
```
New:
```ts
  await playToDebrief(page);
  await openAllPanels(page);
  await overflows("debrief");
```

**Step 2: Run it and watch it fail.**
```bash
npx tsc --noEmit && npx playwright test e2e/engagement.spec.ts -g "reference panels"
```
Expected: 1 failed. The failure is `expect(locator).toHaveAttribute(expected) failed … element(s) not found` for `getByRole('heading', { name: /The world you were in/, level: 2 }).getByRole('button')`: today's headings hold no button.

**Step 3: Implement.**

Create `src/ui/debrief/sections.ts`:
```ts
// The debrief's sections in reading order (DECISIONS.md, section F: the debrief order).
// Each id is the anchor the debrief rail links to, and each section's number is its
// place in this list, so a heading and its rail entry cannot drift apart.

export const DEBRIEF_SECTIONS = [
  { id: "panel-at-a-glance", rail: "At a glance" },
  { id: "panel-what-if", rail: "What if" },
  { id: "panel-quality", rail: "Quality" },
  { id: "panel-world", rail: "World" },
  { id: "panel-calibration", rail: "Calibration" },
  { id: "panel-record", rail: "Governance" },
  { id: "panel-unseen", rail: "Unseen" },
  { id: "panel-talk", rail: "Talk it over" },
  { id: "panel-share", rail: "Share" },
] as const;

export type DebriefSectionId = (typeof DEBRIEF_SECTIONS)[number]["id"];

/** A section's number in the reading order, as its heading and the rail both show it. */
export function sectionNumber(id: DebriefSectionId): number {
  return DEBRIEF_SECTIONS.findIndex((section) => section.id === id) + 1;
}
```

Create `src/ui/debrief/Panel.tsx`:
```tsx
import { useState, type ReactNode } from "react";
import type { DebriefSectionId } from "./sections";

interface Props {
  /** The section's anchor, from DEBRIEF_SECTIONS. */
  id: DebriefSectionId;
  number: number;
  title: string;
  /** A reference panel the player opens when they want it. */
  collapsible?: boolean;
  defaultOpen?: boolean;
  /** One line shown under the heading while the panel is closed. */
  teaser?: string;
  children: ReactNode;
}

/**
 * One debrief section. A collapsible panel follows the WAI accordion pattern: the
 * heading holds a button that says whether it is expanded and which region it
 * controls. A closed panel renders nothing inside that region, so a chart never
 * measures a hidden box and an accessibility scan sees only what is on screen.
 */
export function Panel({ id, number, title, collapsible = false, defaultOpen = true, teaser, children }: Props) {
  const [open, setOpen] = useState(!collapsible || defaultOpen);
  const bodyId = `${id}-body`;
  const label = (
    <>
      <span className="font-mono text-muted">{number}.</span> {title}
    </>
  );

  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-4 border-t border-rule pt-6">
      <h2 id={`${id}-heading`} className="text-2xl">
        {collapsible ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={() => setOpen((was) => !was)}
            className="flex min-h-11 w-full items-baseline justify-between gap-4 text-left"
          >
            <span>{label}</span>
            <span aria-hidden="true" className="shrink-0 font-mono text-base text-muted">
              {open ? "−" : "+"}
            </span>
          </button>
        ) : (
          label
        )}
      </h2>
      {!open && teaser && <p className="mt-1 text-sm text-muted">{teaser}</p>}
      <div id={bodyId} hidden={!open} className="mt-3">
        {open && children}
      </div>
    </section>
  );
}
```
Why it is built this way:
- The body `<div>` is always present, so `aria-controls` never points at a missing id. Its children mount only when the panel is open, which is why Recharts never measures a zero-width box.
- Keep the structure `section#<id> > h2 > button[aria-expanded]`. `openPanel` and `openAllPanels` find the toggle that way, and so does the rail in Task 13.7, which opens a closed panel by clicking `:scope > h2 > button[aria-expanded="false"]` inside the section its link points to.
- The state is shown by a plus sign when closed and a minus sign (U+2212, "−", not a hyphen and not an emoji, so decision 13 holds) when open. It is `aria-hidden`, and `aria-expanded` carries the state for assistive technology. Each heading's accessible name is therefore just the number and title, for example "5. Calibration: how close were your forecasts?". That keeps all six regexes in `debrief.spec.ts` matching, and a collapsed h2 stays visible. A symbol rather than the words "Show" and "Hide" avoids visible words that are missing from the button's name (WCAG 2.5.3, Label in Name), which axe's WCAG tags do not test.

In `src/ui/screens/Debrief.tsx`, make four edits.

(a) Replace the import block (lines 1–13 at HEAD).

Old:
```tsx
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ENDING_PLATES } from "../art/plates";
import { Button } from "../components/Button";
import { Figure } from "../components/Figure";
import { CalibrationPanel } from "../debrief/CalibrationPanel";
import { runSummary, runSummaryText } from "../debrief/copy";
import { NeverSawPanel } from "../debrief/NeverSawPanel";
import { QualityPanel } from "../debrief/QualityPanel";
import { RecordPanel } from "../debrief/RecordPanel";
import { WhatIfPanel } from "../debrief/WhatIfPanel";
import { WorldPanel } from "../debrief/WorldPanel";
import { pub, type Rankings, type WhatIfAnswer } from "../useGame";
import type { DisplayedState } from "../../engine";
```
New:
```tsx
import { useEffect, useRef, useState } from "react";
import { ENDING_PLATES } from "../art/plates";
import { Button } from "../components/Button";
import { Figure } from "../components/Figure";
import { CalibrationPanel } from "../debrief/CalibrationPanel";
import { runSummary, runSummaryText, TEASER } from "../debrief/copy";
import { NeverSawPanel } from "../debrief/NeverSawPanel";
import { Panel } from "../debrief/Panel";
import { QualityPanel } from "../debrief/QualityPanel";
import { RecordPanel } from "../debrief/RecordPanel";
import { sectionNumber, type DebriefSectionId } from "../debrief/sections";
import { WhatIfPanel } from "../debrief/WhatIfPanel";
import { WorldPanel } from "../debrief/WorldPanel";
import { pub, type Rankings, type WhatIfAnswer } from "../useGame";
import type { DisplayedState } from "../../engine";
```

(b) Delete the local `Panel` function, which is the whole block from `function Panel({ number, title, children }: …` to its closing `}` (HEAD lines 22–31). Put this in its place:
```tsx
/** A section's anchor and its number in the reading order. */
const section = (id: DebriefSectionId) => ({ id, number: sectionNumber(id) });
```

(c) In the doc comment above `export function Debrief`:

Old:
```tsx
 * (spec Section 11). Six panels, then a run summary the player may choose to share.
 */
```
New:
```tsx
 * (spec Section 11). The six panels come in the order of DECISIONS.md section F: what
 * the player can try first, the reference panels closed until wanted, then sharing.
 */
```

(d) Replace the six panel lines. This puts them in the D9 order. At a glance comes before What if in Task 13.6, so until then What if shows the number 2.

Old:
```tsx
      <Panel number={1} title="The world you were in"><WorldPanel view={view} /></Panel>
      <Panel number={2} title="Calibration"><CalibrationPanel view={view} /></Panel>
      <Panel number={3} title="Decision quality versus luck"><QualityPanel view={view} rankings={rankings} /></Panel>
      <Panel number={4} title="Governance record"><RecordPanel view={view} /></Panel>
      <Panel number={5} title="What you never saw"><NeverSawPanel view={view} /></Panel>
      <Panel number={6} title="What if"><WhatIfPanel view={view} whatIf={whatIf} /></Panel>
```
New:
```tsx
      <Panel {...section("panel-what-if")} title="What if you had chosen differently?">
        <WhatIfPanel view={view} whatIf={whatIf} />
      </Panel>
      <Panel {...section("panel-quality")} title="Decision quality versus luck">
        <QualityPanel view={view} rankings={rankings} />
      </Panel>
      <Panel {...section("panel-world")} title="The world you were in" collapsible defaultOpen={false} teaser={TEASER.world}>
        <WorldPanel view={view} />
      </Panel>
      <Panel {...section("panel-calibration")} title="Calibration: how close were your forecasts?" collapsible defaultOpen={false} teaser={TEASER.calibration}>
        <CalibrationPanel view={view} />
      </Panel>
      <Panel {...section("panel-record")} title="Governance record" collapsible defaultOpen={false} teaser={TEASER.record}>
        <RecordPanel view={view} />
      </Panel>
      <Panel {...section("panel-unseen")} title="What you never saw" collapsible defaultOpen={false} teaser={TEASER.unseen}>
        <NeverSawPanel view={view} />
      </Panel>
```

Leave the `<header>` block and the root `<div … data-testid="debrief">` exactly as Phases 8 and 9 left them.

**Step 4: Run it and watch it pass.**
```bash
npx tsc --noEmit && npx eslint src/ui e2e && npx playwright test e2e/engagement.spec.ts e2e/debrief.spec.ts e2e/polish.spec.ts
```
Expected: every test passes, including the new "reference panels" test, the six-heading test, the Brier test (which now opens Calibration first), both axe runs (which now open every panel), the 360px check, the facilitator test (What if is always open, so "View assumptions" is still reachable) and reproducibility.

**Step 5: Commit.**
```bash
git add src/ui/debrief/sections.ts src/ui/debrief/Panel.tsx src/ui/screens/Debrief.tsx e2e/play.ts e2e/debrief.spec.ts e2e/polish.spec.ts e2e/engagement.spec.ts
git commit -m "feat(debrief): collapsible reference panels in the agreed order"
```

### Task 13.3: Decision quality versus luck for newcomers

**Files:**
- Modify: `src/ui/debrief/QualityPanel.tsx` (whole component)
- Test: `e2e/engagement.spec.ts`

**Step 1: Write the failing test.** In `e2e/engagement.spec.ts`, add `openAllPanels` to the import from `./play` (Task 13.2 added it to `e2e/play.ts`), so the import includes `openAllPanels`, `openPanel`, `playToDebrief` and `startGame`. Then append:
```ts

test("each reviewed decision leads with what was chosen, keeps its tag in view and tucks the reasons behind a disclosure", async ({ page }) => {
  await startGame(page, "QUALITY-1");
  await playToDebrief(page);
  await expect(page.getByText("Weighing the options you had")).toHaveCount(0, { timeout: 10_000 });
  await expect(page.getByText(/^Under this game's assumptions, of your 8 decisions, /)).toBeVisible();   // the tally, once the rankings are in

  const reviews = page.getByTestId("decision-review");
  await expect(reviews).toHaveCount(8);
  const first = reviews.first();
  await expect(first.getByRole("heading", { level: 3 })).not.toHaveText(/^Turn \d/);                 // the option's own words, not "Turn 1, …: option A"
  await expect(first.getByText(/^Turn 1, .+: option [A-Z]$/)).toBeVisible();
  await expect(first.getByTestId("luck-tag")).toBeVisible();
  const why = first.locator("details");
  await expect(why).toHaveCount(1);
  await expect(why).not.toHaveAttribute("open");
  await why.locator("summary").click();
  await expect(why.locator("li").first()).toHaveText(/^(Under this game's assumptions|No chance event)/);

  await openAllPanels(page);                                                  // every "Why this tag" open
  const everything = (await reviews.allInnerTexts()).join(" ");
  expect(everything).toContain("Under this game's assumptions, the chance of");
  // Quoted labels name events and states of the world, such as “the authentication result was correct”, never the decision,
  // so they are set aside; every word the sentences add around them is checked.
  expect(everything.replace(/“[^”]*”/g, "“…”")).not.toMatch(/\b(right|wrong|correct|incorrect|mistake|should have)\b/i);
});
```
Why the last four lines: `debrief.spec.ts`'s verdict check reads `decision-review` with `allInnerTexts()`, and the text inside a closed `<details>` is not rendered, so once the causal and outcome sentences move behind "Why this tag" that check no longer reads them. These lines open every disclosure and read them again. The quoted labels are set aside because they are content, not verdicts. In the planning run, this seed took option E in The Deepfake Election, whose hidden-fact label is "it is not the case that the authentication result was correct" (`DRAW_LABEL` in `src/ui/format.ts`), and the check without the `replace` failed on exactly that word. `debrief.spec.ts` stays unchanged.

**Step 2: Run it and watch it fail.**
```bash
npx playwright test e2e/engagement.spec.ts -g "reviewed decision"
```
Expected: 1 failed. The failure is `expect(locator).toBeVisible() failed … element(s) not found` on the tally sentence.

**Step 3: Implement.** Replace the whole of `src/ui/debrief/QualityPanel.tsx`:
```tsx
import { causalSentence, outcomeSentence, soundSentence, standing, tagText, tallySentence } from "./copy";
import { describeConditions } from "../format";
import { pub, type Rankings } from "../useGame";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  /** Arrives from the worker shortly after the debrief opens. */
  rankings: Rankings | null;
}

/**
 * Decision quality separated from luck. For each decision: what was chosen, its
 * tag and how the option ranked, with the odds at the time and the outcomes drawn
 * one click away. The game never says a decision was right or wrong; it says how
 * the option ranked and how the dice fell.
 */
export function QualityPanel({ view, rankings }: Props) {
  const debrief = view.debrief!;
  const history = view.history ?? [];
  const positions = history.map((record, index) => standing(rankings?.[index], record.choiceId));
  const tags = positions.flatMap((position, index) => (position ? [tagText(position, debrief.luck[index]!.fortunate)] : []));

  return (
    <div className="space-y-4">
      <p>
        A decision is <strong>sound</strong> if it was among the two strongest options on what you could have known at the time, and{" "}
        <strong>risky</strong> otherwise. It was <strong>fortunate</strong> or <strong>unlucky</strong> according to how the chance events tied
        to it fell against their odds. A sound decision can end badly, and a risky one can be rescued by luck.
      </p>
      <ol className="space-y-5">
        {history.map((record, index) => {
          const scenario = pub.scenarios[record.scenarioId];
          const luck = debrief.luck[index]!;
          const position = positions[index];
          const chosen = scenario?.choices.find((c) => c.id === record.choiceId);
          const causes = record.oddsAtTheTime.filter((o) => Math.round(o.before * 100) !== Math.round(o.probability * 100));
          return (
            <li key={record.turn} className="border-l-2 border-rule pl-4" data-testid="decision-review">
              <h3 className="font-semibold">{chosen?.text ?? `Option ${record.choiceId}`}</h3>
              <p className="text-sm text-muted">
                Turn {record.turn}, {scenario?.title}: option {record.choiceId}
              </p>
              <p className="mt-1 font-mono text-lg" data-testid="luck-tag">
                {position ? tagText(position, luck.fortunate) : "Weighing the options you had…"}
              </p>
              {!record.succeeded && <p className="text-sm">The option did not take effect: its conditions were not met, and the cost was still paid.</p>}
              {position && <p className="mt-1 text-sm">{soundSentence(position.sound, position.rank, position.of)}</p>}
              <details className="mt-1 text-sm">
                <summary className="cursor-pointer py-1 font-semibold">
                  Why this tag<span className="sr-only">: turn {record.turn}</span>
                </summary>
                <ul className="mt-1 space-y-1">
                  {causes.map((o) => (
                    <li key={`cause-${o.eventId}`}>{causalSentence(pub.eventTitles[o.eventId] ?? o.eventId, o.before, o.probability)}</li>
                  ))}
                  {luck.links.map((link) => (
                    <li key={link.id}>
                      {outcomeSentence(link.kind === "event" ? pub.eventTitles[link.id] ?? link.id : describeConditions(link.when ?? []), link.probability, link.happened)}
                    </li>
                  ))}
                  {luck.links.length === 0 && <li>No chance event was tied to this decision, so luck played no part in it.</li>}
                </ul>
              </details>
            </li>
          );
        })}
      </ol>
      {/* After the list and in plain text, so it reads as a summary, not a score to beat. */}
      {history.length > 0 && tags.length === history.length && <p className="text-sm">{tallySentence(tags)}</p>}
    </div>
  );
}
```
Why this keeps the existing contracts:
- `soundSentence` stays visible, outside the `<details>`, so the `decision-review` innerText still contains the prefix (`debrief.spec.ts`, luck-tag test).
- The option text was already inside `decision-review`, so this adds no new words to that verdict check.
- The `py-1` on `<summary>` makes it about 30px tall, above the 24px target minimum.
- The sr-only turn number gives each "Why this tag" a distinct name.
- The engine's `luckTag` is now called through `tagText` in `copy.ts`, so this file no longer imports it.
- The tally comes after the list, in plain `text-sm` rather than bold above it. Above the list and in bold it read as a score to beat, which decision F1 rules out. It still appears only once every tag is in.

**Step 4: Run it and watch it pass.**
```bash
npx tsc --noEmit && npx eslint src/ui/debrief && npx playwright test e2e/engagement.spec.ts e2e/debrief.spec.ts
```
Expected: all pass, including "every decision gets one of the four luck tags, and never a verdict of right or wrong".

**Step 5: Commit.**
```bash
git add src/ui/debrief/QualityPanel.tsx e2e/engagement.spec.ts
git commit -m "feat(debrief): lead each reviewed decision with the option chosen"
```

### Task 13.4: A plain Brier gloss, a comparison rather than a ranking, and truthful world weights

**Files:**
- Modify: `src/ui/debrief/WorldPanel.tsx` (the import, the intro paragraph at HEAD lines 16–20, and the constants above it)
- Modify: `src/ui/debrief/CalibrationPanel.tsx` (the import at line 2, the `scores` list at lines 11–14, the Brier paragraph at lines 18–25 and the scores caption at line 76)
- Modify: `src/ui/debrief/Assumptions.tsx` (the first line of `Assumptions` at line 25, and the profile column header at line 68)
- Test: `e2e/engagement.spec.ts`

**Step 1: Write the failing test.** Add `LABEL` to the import from `./play` in `e2e/engagement.spec.ts`, unless an earlier phase already imports it there. Then append:
```ts

test("the world panel reads the draw odds from the weights in force, and the Brier score is explained in plain words", async ({ page }) => {
  await page.goto("/?facilitator=1&seed=WEIGHTS");
  await page.locator("#weight-benign").fill("50");                           // 50 / 40 / 30: shares of 42%, 33% and 25%
  await page.goto(await page.getByTestId("participant-link").innerText());
  await page.getByRole("button", { name: LABEL.start }).click();
  await playToDebrief(page);

  await openPanel(page, /The world you were in/);
  await expect(page.getByText(/a benign world 42% of the time, a contested one 33% and a hard one 25%/)).toBeVisible();
  await page.getByText("View assumptions").click();                            // the assumptions table shows the same shares
  await expect(page.getByRole("columnheader", { name: "Benign world (42%)" })).toBeVisible();
  await openPanel(page, /Calibration/);
  await expect(page.getByText(/Lower means closer\./)).toBeVisible();
  const scores = page.getByRole("table", { name: /^Forecast scores on the same questions/ });   // a comparison, not a ranking
  await expect(scores.getByRole("rowheader").first()).toHaveText("You");
  await expect(page.getByText("Brier scores, best first")).toHaveCount(0);
});
```

**Step 2: Run it and watch it fail.**
```bash
npx playwright test e2e/engagement.spec.ts -g "weights in force"
```
Expected: 1 failed on `a benign world 42% …` with `element(s) not found`, because the panel still prints the fixed "30% … 40% … 30%".

**Step 3: Implement.**

In `src/ui/debrief/WorldPanel.tsx`:

Old:
```tsx
import { FACT_LABEL, percent, PROFILE_LABEL } from "../format";
```
New:
```tsx
import { profileShareSentence } from "./copy";
import { FACT_LABEL, percent, PROFILE_LABEL } from "../format";
```
Old:
```tsx
  const odds = published.profiles[world.profile].facts;
```
New:
```tsx
  const odds = published.profiles[world.profile].facts;
  const { benign, contested, hard } = published.profiles;
```
Old:
```tsx
      <p>
        You were governing a <strong>{PROFILE_LABEL[world.profile].toLowerCase()}</strong>. The game draws a benign world 30% of the time, a
        contested one 40% and a hard one 30%, then draws each fact below from that world&rsquo;s odds. These percentages are design
        assumptions, not forecasts.
      </p>
```
New:
```tsx
      <p>
        You were governing a <strong>{PROFILE_LABEL[world.profile].toLowerCase()}</strong>.{" "}
        {profileShareSentence({ benign: benign.weight, contested: contested.weight, hard: hard.weight })} These percentages are design
        assumptions, not forecasts.
      </p>
```
`published` already reflects facilitator overrides (`useGame.ts:27-30`). Overridden weights need not sum to 100 (B41), which is why the builder normalises them.

In `src/ui/debrief/CalibrationPanel.tsx`:

Old:
```tsx
import { calibrationBins } from "./copy";
```
New:
```tsx
import { BRIER_GLOSS, calibrationBins } from "./copy";
```
Old:
```tsx
        . It is the average squared gap between each forecast and what happened: 0 is perfect, and always answering 50% scores 0.250.
        With eight forecasts it is a rough measure.
```
New:
```tsx
        . {BRIER_GLOSS}
```
The `<strong data-testid="brier">` element and its `toFixed(3)` content are unchanged.

The table of scores ranks the player against the four advisers, "best first". That is a leaderboard, which decision F1 and the spec's out-of-scope list ("Leaderboards", spec Section 13) both rule out; spec Section 11 asks only for "each adviser's score for comparison". Keep the player first and the advisers in their usual order.

Old:
```tsx
  const scores = [
    { name: "You", score: debrief.brier },
    ...ADVISER_ORDER.map((id) => ({ name: pub.advisers.find((a) => a.id === id)!.name, score: debrief.adviserBrier[id] ?? 0 })),
  ].sort((a, b) => a.score - b.score);
```
New:
```tsx
  // You first, then the advisers in their usual order: a comparison, not a ranking to climb.
  const scores = [
    { name: "You", score: debrief.brier },
    ...ADVISER_ORDER.map((id) => ({ name: pub.advisers.find((a) => a.id === id)!.name, score: debrief.adviserBrier[id] ?? 0 })),
  ];
```
Old:
```tsx
        <caption className="pb-1 text-left font-semibold">Brier scores, best first</caption>
```
New:
```tsx
        <caption className="pb-1 text-left font-semibold">Forecast scores on the same questions (lower is closer)</caption>
```
No earlier test depends on that order or caption: at HEAD, `grep -rn "best first" e2e tests` finds only an engine test about option rankings (Step 1's new test now names the old caption, to check it is gone).

In `src/ui/debrief/Assumptions.tsx`, the "View assumptions" table heads each profile column with its raw weight followed by `%`. With a facilitator's 50 / 40 / 30 it would print "Benign world (50%)" beside the world panel's 42%. Show each weight as its share of the total instead. With the bundled 30 / 40 / 30 the header reads exactly as before.

Old:
```tsx
export function Assumptions({ scenarioId }: { scenarioId: string }) {
  const options = published.options[scenarioId] ?? [];
```
New:
```tsx
export function Assumptions({ scenarioId }: { scenarioId: string }) {
  const options = published.options[scenarioId] ?? [];
  // A facilitator's weights need not sum to 100 (B41), so each profile is shown as its share of the total, as the world panel shows it.
  const totalWeight = PROFILES.reduce((sum, p) => sum + published.profiles[p].weight, 0);
```
Old:
```tsx
                  <th key={p} scope="col" className="py-1 pr-2 text-right font-normal">{PROFILE_LABEL[p]} ({published.profiles[p].weight}%)</th>
```
New:
```tsx
                  <th key={p} scope="col" className="py-1 pr-2 text-right font-normal">{PROFILE_LABEL[p]} ({Math.round((published.profiles[p].weight / totalWeight) * 100)}%)</th>
```
`applyOverrides` refuses a set of weights that are all zero (`src/content/overrides.ts:49`), so `totalWeight` is never 0, here or in `profileShareSentence`.

**Step 4: Run it and watch it pass.**
```bash
npx tsc --noEmit && npx eslint src/ui/debrief && npx playwright test e2e/engagement.spec.ts e2e/debrief.spec.ts e2e/polish.spec.ts
```
Expected: all pass. The Brier hand-calculation test still reads the same number from `data-testid="brier"`, and the facilitator test in `polish.spec.ts` still finds its edited event in "View assumptions".

**Step 5: Commit.**
```bash
git add src/ui/debrief/WorldPanel.tsx src/ui/debrief/CalibrationPanel.tsx src/ui/debrief/Assumptions.tsx e2e/engagement.spec.ts
git commit -m "fix(debrief): plain Brier gloss, adviser scores unranked, world odds from the weights in force"
```


### Task 13.5: What if starts on the decision to argue about, and shows how the replays ended

**Files:**
- Modify: `src/ui/debrief/WhatIfPanel.tsx` (whole component: controlled `changeAt`/`onChangeAt`, plainer intro, the endings table and a quieter live region)
- Modify: `src/ui/screens/Debrief.tsx` (hold the decision being changed; initialise it with `pivotalDecision`)
- Test: `e2e/engagement.spec.ts`

**Step 1: Write the failing test.** Append to `e2e/engagement.spec.ts`:
```ts

test("a what-if shows how the 1,000 replays ended, in a table captioned as the model's output", async ({ page }) => {
  await startGame(page, "WHATIF-1");
  await playToDebrief(page);
  await expect(page.getByText("Weighing the options you had")).toHaveCount(0, { timeout: 10_000 });
  await page.getByLabel("The decision to change").selectOption({ index: 2 });
  await page.getByRole("button", { name: "Rerun 1,000 games" }).click();

  const result = page.getByTestId("what-if-result");
  await expect(result).toBeVisible();
  const table = result.getByRole("table");
  await expect(table.locator("caption")).toHaveText(/^Under this game's assumptions, how the 1,000 replays ended/);
  await expect(table.getByRole("columnheader")).toHaveText(["Ending", "Your choices, replayed", "With the change"]);
  const rows = await table.locator("tbody tr").evaluateAll((trs) => trs.map((tr) => [...tr.querySelectorAll("td")].map((td) => td.textContent ?? "")));
  expect(rows.length).toBeGreaterThan(0);
  for (const column of [0, 1]) {
    const shares = rows.map((cells) => cells[column]!);
    for (const share of shares) expect(share).toMatch(/^\d{1,3}%$/);
    const total = shares.reduce((sum, share) => sum + Number.parseInt(share, 10), 0);
    expect(Math.abs(total - 100)).toBeLessThanOrEqual(rows.length);        // shares of the runs, give or take rounding
  }

  expect(await result.evaluate((el) => el.closest("[aria-live]") === null)).toBe(true);   // the table is not read out
  await expect(page.getByRole("status").filter({ hasText: /^Under this game's assumptions, choosing / })).toHaveCount(1);   // the headline is
  const sentences = await result.locator("p").allInnerTexts();                 // the table adds no paragraph
  for (const sentence of sentences.slice(0, -1)) expect(sentence.startsWith("Under this game's assumptions")).toBe(true);
  expect(sentences.at(-1)).toContain("This is the model's output, not a finding.");
  await expect(page.getByLabel("The decision to change")).toHaveValue("2");
});
```

**Step 2: Run it and watch it fail.**
```bash
npx playwright test e2e/engagement.spec.ts -g "replays ended"
```
Expected: 1 failed. The failure is `expect(locator).toHaveText(expected) failed … element(s) not found` on the table caption.

**Step 3: Implement.** Replace the whole of `src/ui/debrief/WhatIfPanel.tsx`:
```tsx
import { useState } from "react";
import { Assumptions } from "./Assumptions";
import { whatIfEndingCaption, whatIfEndingRows, whatIfMethod, whatIfSentences } from "./copy";
import { Button } from "../components/Button";
import { percent, PROFILE_LABEL } from "../format";
import { pub, WHAT_IF_RUNS, type WhatIfAnswer } from "../useGame";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  whatIf: (changeAt: number, newChoiceId: string) => Promise<WhatIfAnswer>;
  /** The decision to change, by its place in the history. The debrief holds it, so At a glance can choose it. */
  changeAt: number;
  onChangeAt: (index: number) => void;
}

/** Counterfactual reruns of any one decision, phrased as the model's output and never as a finding. */
export function WhatIfPanel({ view, whatIf, changeAt, onChangeAt }: Props) {
  const history = view.history ?? [];
  // The alternative picked, and for which decision: choosing another decision starts again from its first alternative.
  const [picked, setPicked] = useState<{ at: number; choiceId: string } | null>(null);
  const [answer, setAnswer] = useState<(WhatIfAnswer & { changeAt: number }) | null>(null);
  const [running, setRunning] = useState(false);

  const record = history[changeAt]!;
  const scenario = pub.scenarios[record.scenarioId]!;
  const alternatives = scenario.choices.filter((c) => c.id !== record.choiceId && !record.lockedChoiceIds.includes(c.id));
  const chosenAlternative = alternatives.find((c) => picked?.at === changeAt && c.id === picked.choiceId) ?? alternatives[0];

  async function run() {
    if (!chosenAlternative) return;
    setRunning(true);
    try {
      setAnswer({ ...(await whatIf(changeAt, chosenAlternative.id)), changeAt });
    } finally {
      setRunning(false);
    }
  }

  const shown = answer && answer.changeAt === changeAt && answer.result.newChoiceId === chosenAlternative?.id ? answer : null;
  const sentences = shown
    ? whatIfSentences(shown.result, scenario.title, scenario.choices.find((c) => c.id === record.choiceId)?.text ?? record.choiceId, chosenAlternative?.text ?? "")
    : [];

  return (
    <div className="space-y-4">
      <p>
        Pick one decision and something else you could have done. The game replays your whole run {WHAT_IF_RUNS.toLocaleString("en-GB")} times
        with fresh dice in the same kind of world, keeping every other decision as you made it, and compares the replays with and without the
        change. One game is a single roll of the dice; many replays show what a change tends to do.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="what-if-decision" className="block text-sm font-semibold">The decision to change</label>
          <select
            id="what-if-decision"
            className="mt-1 block w-full border border-rule bg-paper p-2"
            value={changeAt}
            onChange={(event) => onChangeAt(Number(event.target.value))}
          >
            {history.map((r, index) => (
              <option key={r.turn} value={index}>
                Turn {r.turn}: {pub.scenarios[r.scenarioId]?.title} (you chose {r.choiceId})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="what-if-option" className="block text-sm font-semibold">What you might have done instead</label>
          <select
            id="what-if-option"
            className="mt-1 block w-full border border-rule bg-paper p-2"
            value={chosenAlternative?.id ?? ""}
            onChange={(event) => setPicked({ at: changeAt, choiceId: event.target.value })}
          >
            {alternatives.map((c) => (
              <option key={c.id} value={c.id}>{c.id}. {c.text}</option>
            ))}
          </select>
        </div>
      </div>
      <Button onClick={run} disabled={running || !chosenAlternative}>
        {running ? "Rerunning…" : `Rerun ${WHAT_IF_RUNS.toLocaleString("en-GB")} games`}
      </Button>

      {/* Announce the run and its headline only; the full result, table included, is there to read, not to be read out. */}
      <p className="sr-only" role="status">
        {running ? `Rerunning ${WHAT_IF_RUNS.toLocaleString("en-GB")} games.` : (sentences[0] ?? "")}
      </p>
      <div>
        {shown && (
          <blockquote className="border-l-4 border-ink pl-4" data-testid="what-if-result" data-milliseconds={shown.milliseconds}>
            {sentences.map((sentence) => <p key={sentence} className="mt-1 first:mt-0">{sentence}</p>)}
            {/* A table, not paragraphs: every paragraph in the result is a prefixed sentence or the closing caveat. */}
            <table className="mt-3 w-full max-w-md text-sm">
              <caption className="pb-1 text-left font-semibold">{whatIfEndingCaption(shown.result.runs)}</caption>
              <thead>
                <tr className="border-b border-rule text-left text-muted">
                  <th scope="col" className="py-1 pr-2 font-normal">Ending</th>
                  <th scope="col" className="py-1 pr-2 text-right font-normal">Your choices, replayed</th>
                  <th scope="col" className="py-1 text-right font-normal">With the change</th>
                </tr>
              </thead>
              <tbody>
                {whatIfEndingRows(shown.result).map((row) => (
                  <tr key={row.endingId} className="border-b border-rule">
                    <th scope="row" className="py-1 pr-2 text-left font-normal">{pub.endings[row.endingId]?.title ?? row.endingId}</th>
                    <td className="py-1 pr-2 text-right font-mono">{percent(row.asPlayed)}</td>
                    <td className="py-1 text-right font-mono">{percent(row.changed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-sm text-muted">
              {whatIfMethod(shown.result, PROFILE_LABEL[shown.result.profile])} Computed in {(shown.milliseconds / 1000).toFixed(2)} seconds.
            </p>
          </blockquote>
        )}
      </div>

      <details className="border border-rule p-4">
        <summary className="cursor-pointer font-semibold">View assumptions</summary>
        <div className="mt-3">
          <Assumptions scenarioId={record.scenarioId} />
        </div>
      </details>
    </div>
  );
}
```
Notes:
- The picked alternative is stored with the decision it belongs to. Changing the decision, from the select or from At a glance, falls back to that decision's first alternative without a `setState` inside an effect, which the react-hooks 7 `set-state-in-effect` rule forbids.
- "Rerun 1,000 games", "View assumptions", the label "The decision to change" and the `what-if-result` test id are unchanged.
- The endings come from `CounterfactualResult.asPlayed.endings` and `changed.endings`, which the engine already computes as shares.
- The middle column is headed "Your choices, replayed", not "As you played". Under B39 that arm is 1,000 simulated replays of the player's decisions, not their one real game, and "As you played" beside their actual ending would read as their own result. The caption says "with your choices and with the change" for the same reason.
- The live region is now a visually hidden `role="status"` paragraph that says "Rerunning 1,000 games." while the worker runs and then the first result sentence. At HEAD the whole result sat inside `aria-live="polite"`; with the endings table and the method line, a screen reader would read out several hundred characters, every cell included. The status paragraph sits outside `data-testid="what-if-result"`, so the rule that every `<p>` in the result is a prefixed sentence or the closing caveat still holds.

In `src/ui/screens/Debrief.tsx`, make three edits.

Old:
```tsx
import { runSummary, runSummaryText, TEASER } from "../debrief/copy";
```
New:
```tsx
import { pivotalDecision, runSummary, runSummaryText, TEASER } from "../debrief/copy";
```
Old:
```tsx
  const [showJson, setShowJson] = useState(false);
  useEffect(() => { heading.current?.focus(); window.scrollTo(0, 0); }, []);
```
New:
```tsx
  const [showJson, setShowJson] = useState(false);
  // The decision the What if panel changes. It opens on the decision to argue about, the same one on every replay of this run.
  const [whatIfAt, setWhatIfAt] = useState(() => (view.debrief ? pivotalDecision(view.debrief) : 0));
  useEffect(() => { heading.current?.focus(); window.scrollTo(0, 0); }, []);
```
Old:
```tsx
        <WhatIfPanel view={view} whatIf={whatIf} />
```
New:
```tsx
        <WhatIfPanel view={view} whatIf={whatIf} changeAt={whatIfAt} onChangeAt={setWhatIfAt} />
```
The `useState` sits above the `if (!debrief || !view.truth) return null;` guard because hooks must run on every render. It reads `view.debrief` only when it exists.

**Step 4: Run it and watch it pass.**
```bash
npx tsc --noEmit && npx eslint src/ui && npx playwright test e2e/engagement.spec.ts e2e/debrief.spec.ts e2e/polish.spec.ts
```
Expected: all pass. That includes the 3-second budget test (the table is rendered from the same worker result, and the `<p>` rule holds) and the facilitator test, whose `selectOption({ index: 0 })` now drives the lifted state.

**Step 5: Commit.**
```bash
git add src/ui/debrief/WhatIfPanel.tsx src/ui/screens/Debrief.tsx e2e/engagement.spec.ts
git commit -m "feat(debrief): what-if opens on the decision to argue about and shows the endings"
```

### Task 13.6: At a glance, Talk it over and Share your run

**Files:**
- Create: `src/ui/debrief/AtAGlance.tsx`
- Create: `src/ui/debrief/TalkItOver.tsx`
- Modify: `src/ui/screens/Debrief.tsx` (whole file except the `<header>` block)
- Test: `e2e/engagement.spec.ts`

**Step 1: Write the failing test.** Append to `e2e/engagement.spec.ts`:
```ts

test("the debrief reads in the agreed order, each section numbered as the rail numbers it", async ({ page }) => {
  await startGame(page, "ORDER-1");
  await playToDebrief(page);
  const order = [/At a glance/, /What if/, /Decision quality versus luck/, /The world you were in/, /Calibration/, /Governance record/, /What you never saw/, /Talk it over/, /Share your run/];
  const titles = await page.getByTestId("debrief").locator("h2").allInnerTexts();
  expect(titles).toHaveLength(order.length);
  order.forEach((pattern, index) => {
    expect(titles[index]).toMatch(pattern);
    expect(titles[index]).toMatch(new RegExp(`^${index + 1}\\.`));
  });
  const prompts = await page.getByRole("region", { name: /Talk it over/ }).getByRole("listitem").allInnerTexts();
  expect(prompts.length).toBeGreaterThanOrEqual(4);
  for (const prompt of prompts) expect(prompt.trim().endsWith("?")).toBe(true);
});

test("At a glance picks a decision to argue about, and trying a different choice opens the what-if on it", async ({ page }) => {
  await startGame(page, "GLANCE-1");
  await playToDebrief(page);
  const glance = page.getByRole("region", { name: /At a glance/ });
  await expect(glance.getByRole("heading", { level: 3, name: "Your world" })).toBeVisible();
  await expect(glance.getByText(/^You were governing a (benign|contested|hard) world\.$/)).toBeVisible();
  await expect(glance.getByRole("heading", { level: 3, name: /^The (least likely thing that happened|likeliest thing that did not happen)$/ })).toBeVisible();
  await expect(glance.getByText("Would you defend this choice, knowing how it turned out?")).toBeVisible();
  await expect(glance.getByText(/^Under this game's assumptions, your decision in turn \d, .+, (raised|lowered|left) its odds/)).toBeVisible();
  expect(await glance.innerText()).not.toMatch(/your record/i);

  const pivotal = (await page.getByTestId("pivotal-decision").getAttribute("data-index"))!;
  const decision = page.getByLabel("The decision to change");
  await expect(decision).toHaveValue(pivotal);                               // the what-if opens on the same decision
  await decision.selectOption(pivotal === "0" ? "1" : "0");
  await glance.getByRole("button", { name: "Try a different choice here" }).click();
  await expect(decision).toHaveValue(pivotal);
  await expect(page.getByLabel("What you might have done instead")).toBeFocused();

  await expect(page.getByText("Weighing the options you had")).toHaveCount(0, { timeout: 10_000 });
  await expect(page.getByTestId("pivotal-decision").getByText(/^(Sound|Risky) and (fortunate|unlucky)$/)).toBeVisible();
  await expect(page.getByTestId("luck-tag")).toHaveCount(8);                // the glance adds no ninth tag
});

test("the link to this world opens the same world, gives nothing away and is sent nowhere", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await startGame(page, "SHARE-1");
  await playToDebrief(page);
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));

  await expect(page.getByRole("heading", { level: 2, name: /Share your run/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Play a new world" })).toBeVisible();
  await expect(page.getByText(/^Anyone who opens this link, or enters seed code SHARE-1, plays the same world/)).toBeVisible();
  await page.getByRole("button", { name: "Copy link to this world" }).click();
  await expect(page.getByText("Link to this world copied.")).toBeVisible();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  await expect(page.getByTestId("world-link")).toHaveText(link);              // shown as well as copied, for a blocked clipboard
  expect(new URL(link).searchParams.get("seed")).toBe("SHARE-1");
  expect(link).not.toContain("facilitator");
  expect(requests.filter((url) => !url.startsWith("http://localhost"))).toEqual([]);

  await page.goto(link);                                                     // what the friend opens: a fresh start in the same world
  await expect(page.getByLabel(/^Seed code/)).toHaveValue("SHARE-1");
  await expect(page.getByTestId("debrief")).toHaveCount(0);
});

test("with reduced motion, trying a different choice jumps to the what-if at once", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 360, height: 740 });
  await startGame(page, "GLANCE-2");
  await playToDebrief(page);
  await page.getByRole("button", { name: "Try a different choice here" }).click();
  const inView = await page.evaluate(() => {                                 // read once, no waiting: a smooth scroll would still be under way
    const box = document.getElementById("what-if-option")!.getBoundingClientRect();
    return box.top >= 0 && box.bottom <= window.innerHeight;
  });
  expect(inView).toBe(true);
  await expect(page.getByLabel("What you might have done instead")).toBeFocused();

  await expect(page.getByText("Weighing the options you had")).toHaveCount(0, { timeout: 10_000 });
  await page.getByRole("button", { name: "Rerun 1,000 games" }).click();
  await expect(page.getByTestId("what-if-result").getByRole("table")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);   // the endings table fits a phone
});
```
A trial of this code confirmed the reduced-motion test is decisive at 360×740. With `reduce`, the select is in view the moment the click returns. Without it, the smooth scroll leaves the select below the fold at that instant. Its last four lines are the only check of the endings table at 360px: the phone test in `polish.spec.ts` never runs a what-if. They wait for the rankings first because the worker answers requests in order, so a what-if sent earlier would queue behind the soundness rollouts.

Then extend Task 13.4's test. In the test "the world panel reads the draw odds from the weights in force, …", which plays through a facilitator's link, add this as its last line, directly before the closing `});`:
```ts
  await expect(page.getByText(/^Anyone who opens this link plays the same world/)).toBeVisible();   // edited odds travel only in the link
```
With a facilitator's edits the seed code alone draws a different world (`drawWorld` in `src/engine/seed.ts` reads the edited profile weights and fact odds, which only the link's `cfg` carries), so Share your run offers the seed code only when nothing is edited.

**Step 2: Run it and watch it fail.**
```bash
npx playwright test e2e/engagement.spec.ts -g "agreed order|At a glance picks|link to this world opens|reduced motion|weights in force"
```
The patterns are narrow on purpose: plain "link to this world" would also select Phase 12's passing test "Stop here offers a link to this world that keeps the edits, …".

Expected: 5 failed, and no other test selected. The order test fails on `toHaveLength(9)` because only 7 h2s exist (six panels plus the old "Your run summary"). The At a glance and link tests fail within 5 seconds with `element(s) not found`. The reduced-motion test fails with `Test timeout of 30000ms exceeded` while waiting to click "Try a different choice here", which does not exist yet. The weights test gets through everything Task 13.4 checks and then fails on its new last line with `element(s) not found`: the old summary paragraph begins "Nothing about your run has been sent anywhere."

**Step 3: Implement.**

Create `src/ui/debrief/AtAGlance.tsx`:
```tsx
import { compositeSentence, DEFEND_PROMPT, leastLikelyOutcome, linkSentence, outcomeSentence, pivotalDecision, pivotSentence, standing, tagText } from "./copy";
import { Button } from "../components/Button";
import { describeConditions, PROFILE_LABEL } from "../format";
import { pub, type Rankings } from "../useGame";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  /** Arrives from the worker shortly after the debrief opens. */
  rankings: Rankings | null;
  /** Opens the What if panel on this decision. */
  onTryAnother: (changeAt: number) => void;
}

/**
 * Three things a newcomer can take in before any reference panel: the world they
 * drew, the least likely thing that happened, and one decision to argue about. The
 * decision comes from the luck deltas alone, so it is there at once and does not
 * move when the soundness rankings arrive; only its tag appears later.
 */
export function AtAGlance({ view, rankings, onTryAnother }: Props) {
  const debrief = view.debrief!;
  const history = view.history ?? [];
  const pivotal = pivotalDecision(debrief);
  const record = history[pivotal];
  const luck = debrief.luck[pivotal];
  const scenario = record ? pub.scenarios[record.scenarioId] : undefined;
  const chosen = scenario?.choices.find((c) => c.id === record?.choiceId);
  const position = record ? standing(rankings?.[pivotal], record.choiceId) : null;
  const notable = leastLikelyOutcome(debrief);
  const notableRecord = notable ? history[notable.index] : undefined;
  // The odds that decision faced before and after it was made, so the link is shown with its change, never as fate.
  const notableOdds = notable?.link.kind === "event" ? notableRecord?.oddsAtTheTime.find((o) => o.eventId === notable.link.id) : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold">Your world</h3>
        <p className="mt-1">
          You were governing a <strong>{PROFILE_LABEL[view.truth!.world.profile].toLowerCase()}</strong>.
        </p>
        <p className="mt-1 text-sm text-muted">What that meant, fact by fact, is under &ldquo;The world you were in&rdquo; below.</p>
        <p className="mt-1 text-sm">{compositeSentence(debrief.composites)}</p>
      </div>

      {notable && (
        <div>
          <h3 className="font-semibold">{notable.link.happened ? "The least likely thing that happened" : "The likeliest thing that did not happen"}</h3>
          <p className="mt-1">
            {outcomeSentence(
              notable.link.kind === "event" ? pub.eventTitles[notable.link.id] ?? notable.link.id : describeConditions(notable.link.when ?? []),
              notable.link.probability,
              notable.link.happened,
            )}
          </p>
          {notableRecord && notableOdds && (
            <p className="mt-1 text-sm text-muted">
              {linkSentence(notableRecord.turn, pub.scenarios[notableRecord.scenarioId]?.title ?? notableRecord.scenarioId, notableOdds.before, notableOdds.probability)}
            </p>
          )}
        </div>
      )}

      {record && luck && (
        <div data-testid="pivotal-decision" data-index={pivotal}>
          <h3 className="font-semibold">A decision to argue about</h3>
          <p className="mt-1">
            Turn {record.turn}, {scenario?.title}: you chose &ldquo;{chosen?.text ?? record.choiceId}&rdquo;.
          </p>
          {position && <p className="mt-1 font-mono text-lg">{tagText(position, luck.fortunate)}</p>}
          <p className="mt-1 text-sm">{pivotSentence(luck.delta)}</p>
          <p className="mt-3 font-semibold">{DEFEND_PROMPT}</p>
          <Button variant="quiet" className="mt-3" onClick={() => onTryAnother(pivotal)}>
            Try a different choice here
          </Button>
        </div>
      )}
    </div>
  );
}
```
Four details matter here:
- The tag deliberately has no `data-testid="luck-tag"`, because `debrief.spec.ts` and the reproducibility test count exactly 8 of those.
- Nothing here contains "your record", so `getByText("Your record")` still finds only the eyebrow.
- "The least likely thing that happened" reuses `outcomeSentence`, so the probability is shown with its prefix. The line under it names the linked decision through `linkSentence`, with the odds before and after that decision from its `oddsAtTheTime`, never as a bare "tied to your decision": the engine links every decision to its forecast event even when the decision left the odds unchanged, and sometimes the decision lowered them. Every event link comes from `oddsAtTheTime` (`luckLinks` in `src/engine/scoring.ts`), so for an event the odds are always found; for the rare hidden-fact pick the line is left out.
- "You were governing a contested world" means little on its own, so a muted line points to the panel that explains the world fact by fact, and the composite sentence ends with the 55 rule as a reference point.

Create `src/ui/debrief/TalkItOver.tsx`:
```tsx
import { DISCUSSION_PROMPTS, TALK_INTRO } from "./copy";

/** Open questions to end on, for thinking alone or talking over with someone who has played. Never numbered, never scored. */
export function TalkItOver() {
  return (
    <div className="space-y-3">
      <p>{TALK_INTRO}</p>
      <ul className="list-disc space-y-2 pl-5">
        {DISCUSSION_PROMPTS.map((prompt) => (
          <li key={prompt}>{prompt}</li>
        ))}
      </ul>
    </div>
  );
}
```

Replace the whole of `src/ui/screens/Debrief.tsx` with the listing below, with one exception. **Keep your file's `<header>…</header>` block exactly as it is.** Phases 8 and 9 own it: the eyebrow "October 2032 · Your record" in a `text-xs` microlabel, and the ending mark as `{mark && <Figure {...mark} className="mb-6 max-w-[12rem]" />}` (Phase 9 removed `figure` from `Plate` and `Figure`, so the HEAD form `figure={mark.figure}` no longer compiles). The header shown is Phase 9's; if your file differs, keep yours. Before replacing, check `grep -n "export function worldLink" src/ui/copy.ts`. It should show `export function worldLink(base: string, search: string, seedCode: string): string`. If Phase 12 gave it another signature, adapt the one call that builds `link`.
```tsx
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ENDING_PLATES } from "../art/plates";
import { Button } from "../components/Button";
import { Figure } from "../components/Figure";
import { worldLink } from "../copy";
import { AtAGlance } from "../debrief/AtAGlance";
import { CalibrationPanel } from "../debrief/CalibrationPanel";
import { pivotalDecision, runSummary, runSummaryText, TEASER } from "../debrief/copy";
import { NeverSawPanel } from "../debrief/NeverSawPanel";
import { Panel } from "../debrief/Panel";
import { QualityPanel } from "../debrief/QualityPanel";
import { RecordPanel } from "../debrief/RecordPanel";
import { sectionNumber, type DebriefSectionId } from "../debrief/sections";
import { TalkItOver } from "../debrief/TalkItOver";
import { WhatIfPanel } from "../debrief/WhatIfPanel";
import { WorldPanel } from "../debrief/WorldPanel";
import { overrideCount, pub, type Rankings, type WhatIfAnswer } from "../useGame";
import type { DisplayedState } from "../../engine";

interface Props {
  view: DisplayedState;
  rankings: Rankings | null;
  whatIf: (changeAt: number, newChoiceId: string) => Promise<WhatIfAnswer>;
  onRestart: () => void;
}

/** A section's anchor and its number in the reading order. */
const section = (id: DebriefSectionId) => ({ id, number: sectionNumber(id) });

/**
 * The debrief separates what the player decided from what the dice delivered
 * (spec Section 11). The six panels come in the order of DECISIONS.md section F: what
 * the player can try first, the reference panels closed until wanted, then sharing.
 */
export function Debrief({ view, rankings, whatIf, onRestart }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState<"text" | "json" | "link" | "link-failed" | null>(null);
  const [showJson, setShowJson] = useState(false);
  // The decision the What if panel changes. It opens on the decision to argue about, the same one on every replay of this run.
  const [whatIfAt, setWhatIfAt] = useState(() => (view.debrief ? pivotalDecision(view.debrief) : 0));
  useEffect(() => { heading.current?.focus(); window.scrollTo(0, 0); }, []);

  const debrief = view.debrief;
  if (!debrief || !view.truth) return null;
  const ending = pub.endings[debrief.endingId];
  const summary = runSummary(view, (id) => pub.scenarios[id]?.title ?? id, ending?.title ?? debrief.endingId);
  const summaryText = showJson ? JSON.stringify(summary, null, 2) : runSummaryText(summary);
  const mark = ENDING_PLATES[debrief.endingId];
  // The seed and any facilitator edits, and nothing about how this run went.
  const link = worldLink(window.location.origin + window.location.pathname, window.location.search, view.seedCode);

  async function copy() {
    // No network call: the summary goes to the clipboard and nowhere else (DECISIONS.md, decision 11).
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(showJson ? "json" : "text");
    } catch {
      setCopied(null);
    }
  }

  async function copyLink() {
    // Also clipboard only. The link is shown on the page too, so a blocked clipboard still leaves a way to take it.
    try {
      await navigator.clipboard.writeText(link);
      setCopied("link");
    } catch {
      setCopied("link-failed");
    }
  }

  /** "Try a different choice here": open the what-if on that decision and go straight to the alternative. */
  function tryAnother(index: number) {
    // Render the new decision's alternatives before focus lands, so a screen reader announces the right option.
    flushSync(() => setWhatIfAt(index));
    const select = document.getElementById("what-if-option");
    if (!select) return;
    select.focus({ preventScroll: true });
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    select.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "center" });
  }

  return (
    <div className="space-y-8" data-testid="debrief">
      <header>
        {mark && <Figure {...mark} className="mb-6 max-w-[12rem]" />}
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">October 2032 &middot; Your record</p>
        <h1 ref={heading} tabIndex={-1} className="mt-2 text-4xl outline-none">{ending?.title}</h1>
        <p className="mt-6 text-lg">{ending?.text}</p>
        {debrief.backlash && <p className="mt-4">{pub.backlashText}</p>}
        <p className="mt-4 text-sm text-muted">
          What follows separates what you decided from what the dice delivered. Every simulated number is the output of this game&rsquo;s
          assumptions, which you can inspect, and none of it is a finding about the real world.
        </p>
      </header>

      <Panel {...section("panel-at-a-glance")} title="At a glance">
        <AtAGlance view={view} rankings={rankings} onTryAnother={tryAnother} />
      </Panel>
      <Panel {...section("panel-what-if")} title="What if you had chosen differently?">
        <WhatIfPanel view={view} whatIf={whatIf} changeAt={whatIfAt} onChangeAt={setWhatIfAt} />
      </Panel>
      <Panel {...section("panel-quality")} title="Decision quality versus luck">
        <QualityPanel view={view} rankings={rankings} />
      </Panel>
      <Panel {...section("panel-world")} title="The world you were in" collapsible defaultOpen={false} teaser={TEASER.world}>
        <WorldPanel view={view} />
      </Panel>
      <Panel {...section("panel-calibration")} title="Calibration: how close were your forecasts?" collapsible defaultOpen={false} teaser={TEASER.calibration}>
        <CalibrationPanel view={view} />
      </Panel>
      <Panel {...section("panel-record")} title="Governance record" collapsible defaultOpen={false} teaser={TEASER.record}>
        <RecordPanel view={view} />
      </Panel>
      <Panel {...section("panel-unseen")} title="What you never saw" collapsible defaultOpen={false} teaser={TEASER.unseen}>
        <NeverSawPanel view={view} />
      </Panel>

      <Panel {...section("panel-talk")} title="Talk it over">
        <TalkItOver />
      </Panel>

      <Panel {...section("panel-share")} title="Share your run">
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold">Play the same world as a friend</h3>
            <p className="mt-1 text-sm">
              {/* With a facilitator's edits the world is drawn from the edited odds, which only the link carries, so the code alone is not enough. */}
              Anyone who opens this link
              {overrideCount === 0 && (
                <>
                  , or enters seed code <span className="font-mono font-medium tracking-wider text-ink">{view.seedCode}</span>,
                </>
              )}{" "}
              plays the same world and faces the same dice. The link says nothing about how your run went, so they start fresh. If you play it
              again yourself, you will know what is coming.
            </p>
            <p className="mt-2 break-all font-mono text-xs" data-testid="world-link">{link}</p>
            <Button className="mt-3" onClick={copyLink}>Copy link to this world</Button>
          </div>
          <div>
            <h3 className="font-semibold">Your run summary</h3>
            <p className="mt-1 text-sm text-muted">
              Nothing about your run has been sent anywhere. The summary lists every decision and how this world turned out, so it gives the
              world away: share it with someone who has already played it, or keep it to compare notes.
            </p>
            <pre className="mt-3 max-h-64 overflow-auto border border-rule bg-canvas p-3 font-mono text-xs" tabIndex={0} aria-label="Run summary">{summaryText}</pre>
            <div className="mt-3 flex flex-wrap gap-3">
              <Button onClick={copy}>Copy run summary</Button>
              <Button variant="quiet" onClick={() => { setShowJson(!showJson); setCopied(null); }}>{showJson ? "Show as text" : "Show as JSON"}</Button>
            </div>
          </div>
          <p className="text-sm" aria-live="polite">
            {copied === "link"
              ? "Link to this world copied."
              : copied === "link-failed"
                ? "Copying is blocked in this browser. Select the link above and copy it."
                : copied ? `Copied as ${copied === "json" ? "JSON" : "text"}.` : ""}
          </p>
          <Button variant="quiet" onClick={onRestart}>Play a new world</Button>
        </div>
      </Panel>
    </div>
  );
}
```
What this listing does:
- **"Try a different choice here".** It sets the lifted `whatIfAt` inside `flushSync`, then focuses the existing `#what-if-option` element (What if is never collapsible, so it is always mounted). React 18 would otherwise apply the state change only after the click handler returns, so focus would land on a select still listing the previous decision's alternatives, and a screen reader would announce a stale option. `flushSync` comes from `react-dom`, an approved runtime dependency, and runs inside the event handler, not in an effect. The handler scrolls smoothly only when the player has not asked for reduced motion. CSS `scroll-behavior` cannot override an explicit `scrollIntoView({ behavior: "smooth" })`, which is why the component checks `matchMedia` itself.
- **Share your run.** The facilitator sentence becomes general copy. The seed code is offered only when no facilitator edit is in force (`overrideCount === 0`, exported by `useGame.ts` and already used by the title screen): the edited profile weights and fact odds travel only in the link's `cfg`, so the code alone would draw a different world. The summary is marked as giving the world away, and the link as not doing so. The h3 "Play the same world as a friend" matches the disclosure the friend will see on the title screen (Phase 9). The link is shown as text (`break-all`, so it never widens the page at 360px) as well as copied, and a blocked clipboard says so, as Phase 12's Stop here panel does; before, a failed copy did nothing visible and the link appeared nowhere. "Copy run summary", "Copied as text.", "Show as JSON" and `aria-label="Run summary"` are unchanged. "Play again" becomes "Play a new world". `App.tsx`'s `onRestart` behaviour is unchanged: it still drops the seed and keeps `cfg`.
- **Talk it over.** Its h2 matches none of the six panel regexes.

**Step 4: Run it and watch it pass.**
```bash
npx tsc --noEmit && npx eslint src/ui e2e && npm run e2e
```
Expected: the whole browser suite passes, including the four new tests, the extended weights test, "the run summary can be copied, and nothing is sent anywhere", the six-heading test and reproducibility. A trial of this code at 726×900 (on a scratch copy of HEAD with stand-ins for the earlier phases) moved the What if heading from 7.53 screens down to about 1.5. With the reference panels closed, the page ran to about 5.8 screens.

**Step 5: Commit.**
```bash
git add src/ui/debrief/AtAGlance.tsx src/ui/debrief/TalkItOver.tsx src/ui/screens/Debrief.tsx e2e/engagement.spec.ts
git commit -m "feat(debrief): At a glance, Talk it over and Share your run"
```

### Task 13.7: The debrief rail as a table of contents

Phase 10 Task 10.8 already made the rail link-capable: `StepsRail` takes `hrefs`, never makes the current step a link, and gives every link an `unfold` click handler; `AppShell` passes its `stepHrefs` through as `hrefs`. This task reuses all of that. It does **not** replace `StepsRail.tsx` and does **not** touch `AppShell.tsx`. It passes the debrief's anchors from `App.tsx`, with `stepIndex={-1}` so no section is marked current, and it extends `unfold` by one branch so that a rail link to a closed debrief panel opens it.

**Files:**
- Modify: `src/ui/shell/StepsRail.tsx` (only Phase 10's `unfold` function and its doc comment)
- Modify: `src/ui/App.tsx` (the `DEBRIEF_STEPS` constant, at HEAD line 22; the three rail props and the `status` prop of the debrief `AppShell`, at HEAD lines 65–67 and 69; the doc comment on Phase 12's `backToStart`)
- Modify: `src/ui/screens/Title.tsx` (the doc comment on Phase 9's `headingRef` prop)
- Test: `e2e/engagement.spec.ts`

**Step 1: Write the failing test.** Append to `e2e/engagement.spec.ts`:
```ts

test("the debrief rail links to every section, marks none as current, and opens a closed panel it points to", async ({ page }) => {
  await startGame(page, "RAIL-1");
  await playToDebrief(page);
  const rail = page.getByRole("navigation", { name: "In this debrief" });
  const links = rail.getByRole("link");
  await expect(links).toHaveCount(9);
  await expect(rail.locator("[aria-current]")).toHaveCount(0);               // a table of contents: no section is "current"
  await expect(page.getByRole("complementary", { name: "State of the nation" })).toHaveCount(0);   // the in-play estimates stay off the debrief
  for (let index = 0; index < 9; index++) {
    const link = links.nth(index);
    const number = String(index + 1);
    expect(await link.innerText()).toMatch(new RegExp(`^0?${number}`));
    const target = page.locator(`${await link.getAttribute("href")} > h2`);
    expect(await target.innerText()).toMatch(new RegExp(`^${number}\\.`));  // the rail and the heading agree
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(24);   // WCAG 2.2 target size
  }

  await rail.getByRole("link", { name: /Calibration/ }).click();
  await expect(page).toHaveURL(/#panel-calibration$/);
  const toggle = page.getByRole("heading", { level: 2, name: /Calibration/ }).getByRole("button");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("img", { name: /^Calibration chart/ })).toBeVisible();

  await toggle.click();                                                       // closed again from its heading
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await rail.getByRole("link", { name: /Calibration/ }).click();              // same hash: no hashchange event fires
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
});
```
The last four lines guard the case a `hashchange` listener would miss: the URL already ends in `#panel-calibration`, so following the same link again changes nothing the browser reports. The "State of the nation" line checks that the in-play status rail is gone from the debrief (edit (d) below).

**Step 2: Run it and watch it fail.**
```bash
npx playwright test e2e/engagement.spec.ts -g "rail links"
```
Expected: 1 failed, at `expect(links).toHaveCount(9)` with `Expected: 9` and `Received: 0`. The debrief rail is still labelled "Record contents", so no navigation named "In this debrief" exists.

**Step 3: Implement.**

Pre-flight. Confirm Phase 10's rail is in place:
```bash
grep -n "hrefs?: readonly string\[\]" src/ui/shell/StepsRail.tsx
grep -n "function unfold" src/ui/shell/StepsRail.tsx
grep -n "hrefs={stepHrefs}" src/ui/shell/AppShell.tsx
grep -n "stepHrefs?: readonly string\[\]" src/ui/shell/AppShell.tsx
```
Expected: each prints exactly one line. If any prints nothing, Phase 10 Task 10.8 has not landed: stop and finish it first. Do not add a second `stepHrefs` to `AppShell`.

With Phase 10's rail, `stepIndex={-1}` makes no step active, so every step with an anchor becomes a link and no `aria-current` is set. Each link is `inline-flex min-h-6`, 24px tall, which meets the WCAG 2.2 minimum target. Its accessible name is its number and label, for example "05Calibration", which `name: /Calibration/` matches. The links take Phase 10's `text-accent underline` look.

(a) In `src/ui/shell/StepsRail.tsx`, replace Phase 10's `unfold` and its doc comment.

Old:
```ts
/** A rail link to a folded <details> unfolds it, scrolls to it and moves focus to its summary. Any other target is left to the browser. */
function unfold(event: MouseEvent<HTMLAnchorElement>) {
  const id = event.currentTarget.hash.slice(1);
  const target = id ? document.getElementById(id) : null;
  if (!(target instanceof HTMLDetailsElement)) return;
  event.preventDefault();
  target.open = true;
  target.scrollIntoView({ block: "start" });
  target.querySelector<HTMLElement>(":scope > summary")?.focus({ preventScroll: true });
}
```
New:
```ts
/**
 * A rail link to a folded <details> unfolds it, scrolls to it and moves focus to its summary.
 * A link to a closed debrief panel (debrief/Panel.tsx) opens it through its own toggle, and the
 * browser then follows the link. This also works when the URL already carries that hash.
 */
function unfold(event: MouseEvent<HTMLAnchorElement>) {
  const id = event.currentTarget.hash.slice(1);
  const target = id ? document.getElementById(id) : null;
  if (target instanceof HTMLDetailsElement) {
    event.preventDefault();
    target.open = true;
    target.scrollIntoView({ block: "start" });
    target.querySelector<HTMLElement>(":scope > summary")?.focus({ preventScroll: true });
    return;
  }
  target?.querySelector<HTMLButtonElement>(':scope > h2 > button[aria-expanded="false"]')?.click();
}
```
If Phase 10's `unfold` reads differently, keep its `<details>` branch exactly as it is and add only the final line, for any target that is not a `<details>`.

Why a click rather than a listener in `Panel`: a `hashchange` listener cannot open a panel when the URL already ends in that panel's hash (for example, after the player opened Calibration from the rail and then closed it from its heading), because following the same fragment fires no `hashchange`. The click goes through the panel's own toggle, so React state, `aria-expanded` and the teaser stay in step, and it runs inside a click handler, not in an effect. The `aria-expanded="false"` selector means an open panel is never closed by the rail, and a section with no toggle (At a glance, What if, Quality, Talk it over, Share) is simply scrolled to. The `<details>` branch is untouched, so Phase 10's test still passes.

(b) In `src/ui/App.tsx`, add this import directly above the line that imports from `"./format"` (at HEAD `import { formatMonth } from "./format";`; Phase 12 may have put a `"./copy"` import just above it, and either position is fine):
```tsx
import { DEBRIEF_SECTIONS } from "./debrief/sections";
```

(c) Old:
```tsx
const DEBRIEF_STEPS = ["World", "Calibration", "Quality", "Governance", "Unseen", "What if"] as const;
```
New:
```tsx
/** The debrief's rail is a table of contents: one link per section, in reading order. */
const DEBRIEF_STEPS = DEBRIEF_SECTIONS.map((section) => section.rail);
const DEBRIEF_HREFS = DEBRIEF_SECTIONS.map((section) => `#${section.id}`);
```
Phase 12's `const PAUSE_STEPS = ["Taking stock"] as const;` stays directly below.

(d) Inside the `stage === "debrief"` `AppShell` (Phase 9 deleted its `figureId` line; nothing else in it changed):

Old:
```tsx
        steps={DEBRIEF_STEPS}
        stepIndex={0}
        stepsLabel="Record contents"
        status={<StatusPanel view={view} />}
```
New:
```tsx
        steps={DEBRIEF_STEPS}
        stepIndex={-1}
        stepsLabel="In this debrief"
        stepHrefs={DEBRIEF_HREFS}
```
This also drops the `status` line. On the debrief, the in-play status rail repeated the Political Capital left and the banded estimates beside the true values the debrief has just revealed, and below the `lg` breakpoint `AppShell` stacks it under the page, so the debrief ended on that rail instead of on Talk it over and Share your run (D9's order). `AppShell`'s `status` prop is optional, and `StatusPanel` stays imported for the turn shell, so nothing else changes. No test or later phase looks for the rail on the debrief; Phase 14's "State of the nation" check reads it on a decision screen. If the designer wants it back (review question 9), restore the line.

(e) The restart button is now "Play a new world" (Task 13.6), so bring the comment on Phase 12's `backToStart` into line.

Old:
```tsx
  /** Play again on the debrief, and Back to the start on the pause: keep a facilitator's edited assumptions, drop the seed for a new world. */
```
New:
```tsx
  /** "Play a new world" on the debrief, and Back to the start on the pause: keep a facilitator's edited assumptions, drop the seed for a new world. */
```
If Phase 12 worded that comment differently, change only "Play again" to "Play a new world" in it. Optional Phase 14 later replaces the whole of `backToStart`, doc comment included; it finds the function with `grep -n "function backToStart"`, so this one-line difference from the block it quotes does not stop it.

(f) In `src/ui/screens/Title.tsx`, Phase 9's doc comment on the `headingRef` prop still names the old button.

Old:
```tsx
  /** App's step heading, so focus comes back to this h1 after Play again. */
```
New:
```tsx
  /** App's step heading, so focus comes back to this h1 after "Play a new world" or Back to the start. */
```
If Phase 9 worded it differently, change only "Play again" in that comment. No later phase quotes this line (Phase 14 edits `Title.tsx`'s `Props` only at `onStart` and below).

Then check that no "Play again" is left in the three files:
```bash
grep -c "Play again" src/ui/App.tsx src/ui/screens/Debrief.tsx src/ui/screens/Title.tsx
```
Expected: `src/ui/App.tsx:0`, `src/ui/screens/Debrief.tsx:0` and `src/ui/screens/Title.tsx:0`. (Phase 9's e2e test "Play again brings focus back to the title heading" keeps its name; its button regex `/^Play (again|a new world)$/` already accepts the new label, and the gate's `git grep` looks only under `src`.)

The anchors only add a `#panel-…` fragment. `backToStart` rewrites the URL with a new query, which drops the fragment. `worldLink` builds from `origin + pathname + search`, so a copied or displayed link never carries one.

**Step 4: Run it and watch it pass.**
```bash
npx tsc --noEmit && npx eslint src/ui e2e && npm run e2e
```
Expected: the whole browser suite passes, including this rail test, Phase 10's "the rail's past Briefing step opens the folded briefing", the keyboard test (the rail sits before `<main>`, and focus moves to the h1 on each step) and both axe runs. A trial of this code on a scratch copy of HEAD, with Phase 10's rail in place and stand-ins for the other phases, passed the rail test, both axe runs with every panel open, the 360px width check and reproducibility. The 9-entry debrief rail measured 97px tall (three lines) at 375×667 and 69px (two lines) at 726×900. That is listed for the designer review below. After review, every revision in Tasks 13.1 to 13.7 was applied to the same scratch copy and run together: `tsc`, `eslint .` and Vitest clean (26 tests in `tests/ui/copy.test.ts`), and every browser test there passed (27 in that copy; your count is higher because the earlier phases add their own).

**Step 5: Commit.**
```bash
git add src/ui/shell/StepsRail.tsx src/ui/App.tsx src/ui/screens/Title.tsx e2e/engagement.spec.ts
git commit -m "feat(debrief): the debrief rail links to each section; no status rail on the debrief"
```

### Task 13.8: Log the debrief order as implemented

**Files:**
- Modify: `DECISIONS.md` (row F8, which Phase 8 wrote for D9; and one phrase in row F6, the taster row Phase 12 rewrote for D7)
- Test: none. This is documentation; Step 4's checks and the gate's full run are its check.

**Step 1: Find the rows.**
```bash
grep -n '^| F8 | The order of the debrief' DECISIONS.md
grep -n "behaves like Play again" DECISIONS.md
```
Expected: each prints exactly one line. The first is row F8 (Phase 8, D9). The second is the taster row, whose Decision cell ends "…offers Back to the start, which behaves like Play again. No engine or content change; …" (Phase 12, Task 12.5).

**Step 2: Confirm what they say.** Read row F8. If it still describes an order other than D9's (an early draft had quality first), this task replaces it anyway. If the first command printed nothing, find the debrief-order row with `grep -n "^| F" DECISIONS.md` and use its number; if there is none, append the row below at the end of section F, numbered one after the last F row. If the second command printed nothing, Phase 12 worded the taster row differently: find "Play again" in it with `grep -n "Play again" DECISIONS.md` and apply Step 3 (b) to that phrase only.

**Step 3: Implement.**

(a) Replace the whole of row F8 with:
```markdown
| F8 | The order of the debrief (spec Section 11) | **Implemented in Phase 13; awaiting the designer's review.** The debrief reads: the ending; **At a glance**, which shows the world drawn, the three composites in plain words, the least likely chance event that happened (with the change in odds its linked decision made, never a bare link) and one decision to argue about; **What if you had chosen differently?**, which opens on that decision, is reached from At a glance by "Try a different choice here", and shows how the 1,000 replays ended with and without the change; **Decision quality versus luck**, with each decision led by the option's own words, its tag and ranking in view, the odds and outcomes behind "Why this tag", and, after the list, a plain tally once the rankings arrive; then four reference panels, closed until opened and each with a one-line teaser: **The world you were in**, **Calibration** (the player's forecast score and each adviser's, in a fixed order rather than best first), **Governance record**, **What you never saw**; then **Talk it over**, open questions that are never numbered or scored; then **Share your run**, where "Copy link to this world" (the link is also shown as text, and the seed code is offered as well only when no facilitator edit is in force) sits beside "Copy run summary", both clipboard only (decision 11), and "Play again" becomes "Play a new world". The in-play status rail is not shown on the debrief. The decision to argue about is the one with the most negative luck delta, or the largest delta if none is negative, earliest on a tie. It comes from the debrief summary alone, so it never moves when the soundness rankings arrive and is identical on every replay of a run. All six of Section 11's panels keep their content and keep their titles as a prefix. Every section is numbered in reading order, and the debrief rail is now a list of links to those sections, 24px tall, with none marked current; a link to a closed panel opens it. The world panel and View assumptions show the profile weights in force as shares of their total instead of a fixed 30 / 40 / 30. **No same-world rewind is offered** | The strongest invitation to argue and experiment now comes first (engagement handoff, observation 9). In a trial build at 726px wide, the What if heading moved from 7.5 screens down to about 1.5. A rewind to decision N in the same world is technically possible without an engine change, because `useGame` keeps the state at every decision. But event rolls are keyed to the seed (decision 10), and by then the debrief has revealed the world and every hidden effect. A rewind would become a hindsight oracle that lets the player search for the choice that dodged this particular die. That turns one draw into a verdict, which B39 ("one game is a single draw") and the luck tags exist to prevent. What if compares the same 1,000 fresh worlds on both sides instead, and the seed link lets someone who has not seen the world play it blind. The seed has always let anyone, the player included, replay the whole world from the first decision (decision 10). The debrief offers the link for someone who has not played it, says that a player who replays it will know what is coming, and does not invite a rewind to one decision |
```

(b) In the taster row, replace the phrase:
```markdown
which behaves like Play again
```
with:
```markdown
which behaves like Play a new world
```
Optional Phase 14 later rewrites this same phrase; its instructions already allow for Phase 13 having changed it.

**Step 4: Check both rows.**
```bash
grep -n "No same-world rewind" DECISIONS.md
grep "No same-world rewind" DECISIONS.md | tr -cd '|' | wc -c | tr -d ' '
grep -c "behaves like Play a new world" DECISIONS.md
grep -c "behaves like Play again" DECISIONS.md
```
Expected, in order: one line (the row sits on a single line); `5` (a four-column row has five pipes, and the row text contains no other `|`; `tr -d ' '` strips the padding macOS `wc` adds); `1`; `0`.

**Step 5: Commit.**
```bash
git add DECISIONS.md
git commit -m "docs(decisions): the debrief order is implemented, with no same-world rewind"
```

### Phase 13 gate

**Run every gate locally** (D10: CI cannot run on GitHub until the billing block is fixed):
```bash
npm run lint && npm run test && npm run balance && npm run build && npm run e2e
du -sk dist
```
All of the following must be true:
- lint prints nothing;
- Vitest passes, with the 20 new tests from Task 13.1;
- balance passes unchanged, since no content or engine file changed;
- the build type-checks `src`, `tests` and `e2e`;
- the whole Playwright suite passes, including the nine new Phase 13 tests in `e2e/engagement.spec.ts`, the five in `debrief.spec.ts`, both axe runs (every debrief panel open), the 360px width check (every panel open), the endings table at 360px (the reduced-motion test) and reproducibility;
- `du -sk dist` prints under 16384.

**Targeted checks:**
```bash
git diff --stat "$(git log --format=%H --grep='copy builders for a debrief for everyone' -1)~1" HEAD -- src/engine src/content
grep -n -i "48mm\|720pt" src/ui/screens/Debrief.tsx src/ui/App.tsx
git grep -nE "import .*[{ ,](published|assumptionsOf)[ ,}]" -- src/ui
git grep -n "Play again" -- src
npx playwright test e2e/polish.spec.ts -g "reproduce"
```
Expected results, in order:
1. The diff prints nothing. It runs from the parent of Task 13.1's commit to HEAD, so an empty result means Phase 13 changed no engine or content file.
2. The `grep` prints nothing. That confirms Phase 9 removed the `48MM` and `720PT` debrief labels.
3. Exactly three lines, as at HEAD: `src/ui/debrief/Assumptions.tsx:2`, `src/ui/debrief/WorldPanel.tsx:2` and `src/ui/useGame.ts:16` (line numbers may have moved). No new debrief component and no play screen imports `published` or `assumptionsOf`. The pattern uses `[{ ,]` and `[ ,}]` rather than `\b` on purpose: macOS git's extended regular expressions have no `\b`, and with it this check prints nothing even at HEAD, so it could never fail.
4. Nothing: the button and both comments (on `backToStart` in `App.tsx` and on `headingRef` in `Title.tsx`) say "Play a new world" now (Task 13.6, and Task 13.7 (e) and (f)).
5. The reproducibility test passes.

**Update `docs/plan.md`.** The Phase 13 block Phase 8 added has three items; find it with `grep -n "Phase 13: A debrief for everyone" docs/plan.md`. Make these four line replacements, keeping the text after each marker as it is:
- `- [ ] ⬜ **Phase 13: A debrief for everyone**` becomes `- [ ] 🟨 **Phase 13: A debrief for everyone**`
- `  - [ ] ⬜ New order: At a glance, What if (preselected), …` becomes `  - [x] 🟩 New order: At a glance, What if (preselected), …`
- `  - [ ] ⬜ Existing panel headings, test ids and copy rules kept` becomes `  - [x] 🟩 Existing panel headings, test ids and copy rules kept`
- `  - [ ] ⬜ Gate: all local gates green. Stop for the designer's review.` becomes `  - [ ] 🟨 Gate: all local gates green (e2e <N> passed); awaiting the designer's review.`, with `<N>` the number `npm run e2e` printed.

Then, on the `**Overall Progress:**` line, add 2 to the done count before "of 63", recompute the percentage as done ÷ 63 rounded to the nearest whole number, and keep the rest of the line. With every earlier phase done, Phase 12's gate left this line reading `` `90%` of build steps (57 of 63) ``; change it to `` `94%` of build steps (59 of 63) ``. If your count differs, count the `[x]` build items instead of trusting the example. If the designer has approved optional Phase 14, the total is 65 instead, as Phase 14 set it (57 of 65 becomes 59 of 65, `91%`). Check with `grep -n -A 3 "Phase 13: A debrief for everyone" docs/plan.md` (two `[x] 🟩` items, the header and the gate item `🟨`). Then commit:
```bash
git add docs/plan.md
git commit -m "docs(plan): Phase 13 gate green; debrief awaiting designer review"
```

**STOP. Wait for the designer's review of the debrief before starting Phase 14 or 15.** Ask the designer to play one full run and look at the debrief at 375, 726 and 1280px, in light and dark. `npm run dev`, then open `/?seed=TEST-SEED1`. They should try "Try a different choice here", open each reference panel from its heading and from the rail, and copy both the link and the summary. Put these questions to them:
1. Is "the decision the dice went against most" the right decision to argue about? The alternative is to prefer a sound-but-unlucky or risky-but-fortunate tag. That needs the soundness rankings, which the worker sends a few seconds after the debrief opens. The pick would then appear late, and What if's starting decision would jump when they arrive.
2. The 9-entry debrief rail, which takes Phase 10's underlined accent links, wraps to three lines (about 97px) at 375px and two (about 69px) at 726px. Keep it, scroll it sideways on phones, or hide it below the desktop breakpoint?
3. Keep the term "Brier score" with its new plain gloss, or rename it "forecast score"? Tests depend on `data-testid="brier"`, not on the word. The adviser comparison under it no longer ranks the player "best first"; it lists You, then the advisers in their usual order. Keep the comparison unranked, restore the ranking, or drop the table?
4. Confirm that no same-world rewind is wanted. The optional "in your own world, with your dice" contrast line from the debrief investigation would need an engine change and an amendment to B39.
5. Are the five "Talk it over" prompts the right questions? Should the copied run summary gain them as unnumbered lines? The summary is unchanged today.
6. Content, outside this phase: the Unknown Frontier ending says "You did almost everything well". Is that a verdict the copy rules forbid? Relatedly, under "Why this tag" the hidden-fact label for option E in The Deepfake Election reads "it is not the case that the authentication result was correct" (`DRAW_LABEL` in `src/ui/format.ts`). It describes a tool's result, not the player's decision, so Task 13.3's verdict check sets quoted labels aside. Keep the wording?
7. Content, outside this phase: What if still offers options that were unaffordable at the time. The replay then falls back to the nearest stance (B38). Should they be hidden or labelled?
8. The tally in Decision quality versus luck ("of your 8 decisions, 5 were sound and fortunate …") sits after the per-decision list, in plain text, so it reads as a summary rather than a score to beat (F1 rules out scores to beat, and the engagement handoff says the game is "not a score-maximising exercise"). Keep it, drop it, or promote it?
9. The in-play status rail (Political Capital and the banded estimates) is no longer shown on the debrief, so on phones the page ends on Share your run rather than on estimates shown beside the true values. Keep it off the debrief?

When the designer approves, change row F8's "**Implemented in Phase 13; awaiting the designer's review.**" to "**Implemented in Phase 13; approved by the designer on <date>.**", mark the Phase 13 header and gate item in `docs/plan.md` `- [x] 🟩` (adding 1 to the Overall Progress done count and recomputing the percentage), and commit. Record every requested change as a follow-up task before continuing.


---

## Phase 14: OPTIONAL save and resume

**Goal:** A game in progress is kept in this browser as the seed code, any facilitator edits and the player's own actions (never the game state), and the title screen offers an opt-in "Continue your game" that rebuilds it exactly by replaying those actions through the session reducer.

**Handoff items addressed:** observation 10 (local save and resume for a 25-minute game); the constraints "Preserve the local, no-account nature of the experience" and "A seed link reproduces a world; it is not a saved-progress link". Contract decision D8 (`DECISIONS.md` F7).

**Depends on:**
- The designer's approval of D8 (Task 14.0). Spec Section 13 lists "saved games" as out of scope, and spec Section 14 and handoff Section 2 say "All state in memory". Without approval, skip this whole phase.
- Phase 8: `LABEL` in `e2e/play.ts`; `data-testid="debrief"` on the Debrief root; `DECISIONS.md` section F, with D8 as row **F7** and D7 as row **F6**; the Phase 8–15 blocks in `docs/plan.md`, including the line ``- [ ] ⬜ **Phase 14 (optional): Save and resume**, only if the designer approves `DECISIONS.md` F7``.
- Phase 9: `LABEL.start` is `"Try your first decision"`; the title's seed field sits in `<details …>` with the summary "Play the same world as a friend"; `e2e/engagement.spec.ts` exists.
- Phase 12: `Stage` includes `"pause"`; `src/ui/screens/FirstDecision.tsx` with "Keep going", "Stop here" and, in the Stop here panel, `stopHereNote(view.seedCode)` and "Back to the start"; `backToStart()` in `App.tsx`, used as both `Debrief`'s and `FirstDecision`'s `onRestart`; `stopHereNote` in `src/ui/copy.ts`; `LABEL.keepGoing` and `LABEL.pauseHeading`; `finishTurn` clicks through the pause after turn 1.
- Phase 13: the Debrief's restart button reads "Play a new world".

**What this phase decides** (logged in `DECISIONS.md` F7 by Task 14.6):
- **The offer is secondary to the main button.** "Continue your game: Turn N of 8, <scenario>" is a quiet button placed under "Try your first decision", beside a quiet "Forget this game", with "Saved in this browser only. A new game replaces it once you lock in its first forecast." under them. D3 makes the dilemma and the main button the first thing a newcomer sees. Measured on a dry run of Phase 9's title with the label "Continue your game: Turn 4 of 8, The Graduate Collapse", the main button ends at y = 575, 453 and 420 at 375×667, 726×900 and 1280×800. The continue button starts at y = 647, 505 and 472. At 726×900 and 1280×800 it is wholly in the first screen (it ends at 549 and 516). At 375×667 its label wraps to two lines and it ends at 705, so a phone player sees it begin and scrolls a little for the rest. The next bullet but one makes a missed offer harmless.
- **The game never resumes by itself.** A reload or a shared link opens the title screen, as `e2e/polish.spec.ts` expects (the seed round-trip reload and the phone test's `goto("/?seed=PHONE-2")`).
- **A new game replaces the kept one only once its first forecast is locked in.** Until then nothing is written, so a stray press of the main button, for example after an accidental reload that kept `?seed=` in the address, loses nothing: the title still offers the kept game next time. Two tabs share the one slot; what happens when both continue the same game is Task 14.0's question 3.
- **The page says it keeps the game before it stores anything, and the player can remove it.** On a title with no kept game, where the browser lets the page write, a line under the main button reads "This browser keeps your game as you play, so you can come back to it. Nothing is sent anywhere." Beside the continue offer, **Forget this game** removes the kept game; focus moves to a status line, "That game is no longer kept in this browser." The designer is asked whether this needs a consent banner (Task 14.0, question 2).
- **A finished game reopens only after a reload of the same tab.** Its debrief reveals the world's hidden facts, so it is never offered on a later visit, where the next person to open the same world on this device could see it before playing. It is kept in the tab's `sessionStorage`, which a reload keeps and a new tab or window does not, until **Play a new world** clears it.
- **Back to the start keeps the save.** Phase 12's **Back to the start** on the pause still drops the seed from the URL, but it keeps the saved game, so the title offers to continue it. Clearing the save there would contradict the note this phase adds to the Stop here panel: "This browser also keeps your game". The phase brief suggested clearing on Back to the start as well. This plan keeps the save instead and records the reason.
- **The save never names a scenario the player has not seen.** On a news or pause screen the engine has already moved to the next turn, which may be the unscheduled crisis or the false alarm. There the save's `at.scenarioId` is left empty (non-negotiable 6).
- **A save is offered only when it fits this page.** It must come from this build (`contentId`) and match this page's facilitator edits (`cfg`). A save made under other edits is not offered here and is left for the page that has them. A save that no longer replays to where it was made is never offered, and the next game overwrites it. Offering a save only reads storage; nothing is removed while a page renders.
- **Storage is used only where it can be written.** Where storage is blocked, full or read-only, the page neither keeps the game nor claims to: no notice, no offer and no note on the pause.
- **`SAVE_FORMAT` is bumped by hand.** `contentId` covers the content JSON but not the engine's code. A unit test therefore pins eleven replayed games on the engine fixture, which between them take every option in it, including the delayed event, the track change, the success check, the conditional effects, the option unlocked by preparation and every option of both interrupts. If an engine change alters any of them, the test fails and says to bump `SAVE_FORMAT`.

Window-free modules: `src/ui/session.ts` and `src/ui/save.ts` are the only modules besides `useGame.ts` that call the engine's runtime functions (`createGame`, `reduce`, `displayed`). They never import `./useGame` and never reach a component. `App.tsx` imports from `save.ts` only `makeSave`, `writeSave`, `clearSave`, `resumeLabel`, the `Stage` type and, only if Task 14.4b runs, `SAVE_KEY`. None of these returns game state.

Commit messages below follow Phase 12's style. Keep the attribution trailer the session requires.

### Task 14.0: Precondition: the designer approves D8 (`DECISIONS.md` F7)

**Files:**
- Modify: `docs/plan.md` (the Phase 14 block), on either answer
- Modify (only if the designer declines): `DECISIONS.md` (row F7)

**Step 1: Check whether approval is already recorded.**

```bash
grep -n "^| F7 |" DECISIONS.md
grep -n "Phase 14 (optional)" docs/plan.md
```

Expected: one F7 row whose Decision cell begins "Optional: built in Phase 14 only if the designer approves." (Phase 8 wrote it), and the Phase 14 block in `docs/plan.md`. If the designer's answers to all three questions in Step 2 are already written down, for example at the Phase 13 review, go to Step 3.

**Step 2: Ask the designer, and wait.** Send exactly this message and do nothing else in this phase until the designer answers all three questions:

> Phase 14 is optional, and I need three answers before building it.
>
> 1. Spec Section 13 lists "saved games" as out of scope, and spec Section 14 and handoff Section 2 say "All state in memory". Do you approve amending that, through `DECISIONS.md` F7 (as decision 13 amended Section 14), so that a game in progress is kept in the player's own browser? Only the seed code, any facilitator edits and the player's actions would be stored, never the hidden world. Nothing would be sent anywhere. The title screen would offer "Continue your game" and never resume by itself. A finished game would be kept only for a reload of its own tab, because its debrief shows the hidden world.
> 2. The game would be written to the browser's storage automatically after every step. The title screen would say so before anything is stored ("This browser keeps your game as you play, so you can come back to it. Nothing is sent anywhere.") and would offer "Forget this game" beside "Continue your game". UK PECR regulation 6 covers browser storage (ICO guidance on storage and access technologies). Are you content that this automatic save, with that notice and a way to remove it, needs no consent banner?
> 3. With a save, a player could open the game in a second tab, continue the same save there and try the other option in the same world before committing in the first tab. The seed link already allows this, but only by replaying every step from the first decision. Spec Section 11 keeps what-if reruns on fresh seeds, and D9 rules out a same-world rewind. Is this acceptable? If not, a tab whose game another tab moves on will go back to the title screen instead.
>
> Yes or no to each, please.

**Step 3: If the answers to questions 1 and 2 are both yes,** note the date and the answer to question 3; Task 14.4b and Task 14.6 need both. Record the commit you are starting from, which the gate needs:

```bash
git rev-parse HEAD
```

In `docs/plan.md`, change the Phase 14 line from `- [ ] ⬜ **Phase 14 (optional): Save and resume**` to `- [ ] 🟨 **Phase 14 (optional): Save and resume**` and leave the rest of that line as it is. The progress figure does not change yet. Commit the status change, so it is recorded before any code, then go to Task 14.1:

```bash
git add docs/plan.md
git commit -m "docs: Phase 14 (save and resume) approved, in progress

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

**Step 4: If the answer to question 1 or question 2 is no,** skip Tasks 14.1 to 14.6 and the gate. A save the designer will not have written automatically needs its own design, which this plan does not contain. Replace the three Phase 14 lines in `docs/plan.md` with this single line:

```markdown
- [x] ⬜ **Phase 14 (optional): Save and resume**: not built. The designer did not approve `DECISIONS.md` F7 (<date>)
```

In `DECISIONS.md` row F7, replace the words `Optional: built in Phase 14 only if the designer approves.` with `**Not approved by the designer on <date> (<reason>); not built.**`, where `<reason>` is `saved games stay out of scope` if question 1 was answered no, or `an automatic save would need consent` if only question 2 was. Put the real date in both places. The progress line does not change: Phase 8 left Phase 14 out of the count.

**Step 5: Commit** (the "no" path):

```bash
git add DECISIONS.md docs/plan.md
git commit -m "docs: Phase 14 (save and resume) not approved, not built

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

Then go on to Phase 15.

### Task 14.1: `src/ui/session.ts`: the session reducer, with an action log and replay

**Files:**
- Create: `src/ui/session.ts`
- Create: `tests/ui/play-live.ts` (a test helper, not a test file: Vitest collects only `*.test.ts`)
- Test: `tests/ui/session.test.ts`

**Step 1: Write the failing test.** Create `tests/ui/play-live.ts`:

```ts
// Plays real games through the session reducer the way App.tsx dispatches them,
// so the save and replay tests compare against sessions built live.

import type { Action, Content, GameState } from "../../src/engine";
import { mulberry32 } from "../../src/engine/rng";
import { EMPTY_SESSION, makeSessionReducer, type Session } from "../../src/ui/session";
import { nextAction, type Policy } from "../engine/fixture";

/** A seeded policy that varies the option, the track, the forecast and whether to buy analysis. */
export function randomPolicy(seed: number): Policy {
  let rng = seed + 1;
  const pick = <T,>(items: readonly T[]): T => {
    const draw = mulberry32(rng);
    rng = draw.state;
    return items[Math.floor(draw.value * items.length)]!;
  };
  return {
    choose: (_state, ids) => pick(ids),
    invest: (_state, tracks) => pick(tracks),
    forecast: pick([0, 0.07, 0.35, 0.5, 0.93, 1]),
    buyInfo: pick([true, false]),
  };
}

/** The actions App dispatches together: DECIDE then ADVANCE on the final turn, INVEST then ADVANCE otherwise. */
export function nextBatch(game: GameState, policy: Policy): Action[] {
  const action = nextAction(game, policy);
  if (action.type === "INVEST") return [action, { type: "ADVANCE" }];
  if (action.type === "DECIDE" && game.current?.isFinal) return [action, { type: "ADVANCE" }];
  return [action];
}

/** Plays a whole game through the session reducer, one batch at a time. Returns the session after START and after every batch. */
export function playLive(seedCode: string, policy: Policy, content: Content): Session[] {
  const reducer = makeSessionReducer(content);
  let session = reducer(EMPTY_SESSION, { type: "START", seedCode });
  const sessions = [session];
  while (session.game && session.game.phase !== "debrief") {
    session = reducer(session, { type: "ENGINE", actions: nextBatch(session.game, policy) });
    sessions.push(session);
  }
  return sessions;
}
```

Create `tests/ui/session.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { displayed, reduce, type Action } from "../../src/engine";
import { applyOverrides, loadContent } from "../../src/content";
import { EMPTY_SESSION, makeSessionReducer, replay } from "../../src/ui/session";
import { playLive, randomPolicy } from "./play-live";

const content = loadContent();

describe("replaying a session", () => {
  test.each([0, 1, 2, 3, 4, 5])("seed %i: replaying the log at every step rebuilds the live session exactly", (seed) => {
    const sessions = playLive(`SAVE-${seed}`, randomPolicy(seed), content);
    expect(sessions.at(-1)!.game!.phase).toBe("debrief");
    for (const live of sessions) {
      const rebuilt = replay(`SAVE-${seed}`, live.actions, content);
      expect(JSON.stringify(rebuilt)).toBe(JSON.stringify(live));
    }
  });

  test("keeps the bookkeeping useGame kept: the view before each ADVANCE and the state at each DECIDE", () => {
    const sessions = playLive("SAVE-DETAIL", randomPolicy(9), content);
    for (let i = 1; i < sessions.length; i++) {
      const previous = sessions[i - 1]!;
      const session = sessions[i]!;
      const batch = session.actions.slice(previous.actions.length);
      if (batch.at(-1)?.type !== "ADVANCE") continue;
      let game = previous.game!;
      for (const action of batch.slice(0, -1)) game = reduce(game, action, content);
      expect(session.before).toEqual(displayed(game));
    }
    const finished = sessions.at(-1)!;
    expect(finished.decisionStates).toHaveLength(8);
    expect(finished.decisionStates.every((state) => state.phase === "decide")).toBe(true);
  });

  test("a facilitator's edits replay too, when the same edited content is used", () => {
    const edited = applyOverrides(content, { weights: { benign: 0, contested: 0, hard: 100 } });
    const live = playLive("SAVE-EDITED", randomPolicy(3), edited).at(-1)!;
    expect(JSON.stringify(replay("SAVE-EDITED", live.actions, edited))).toBe(JSON.stringify(live));
  });

  test("START, RESTORE and RESET go through the same reducer", () => {
    const reducer = makeSessionReducer(content);
    const live = playLive("SAVE-RESTORE", randomPolicy(4), content)[9]!;
    const restored = reducer(EMPTY_SESSION, { type: "RESTORE", seedCode: "SAVE-RESTORE", actions: live.actions });
    expect(JSON.stringify(restored)).toBe(JSON.stringify(live));
    expect(reducer(restored, { type: "RESET" })).toEqual(EMPTY_SESSION);
    expect(reducer(EMPTY_SESSION, { type: "START", seedCode: "SAVE-RESTORE" }).actions).toEqual([]);
  });

  test("ENGINE before START changes nothing", () => {
    const reducer = makeSessionReducer(content);
    expect(reducer(EMPTY_SESSION, { type: "ENGINE", actions: [{ type: "FORECAST", value: 0.5 }] })).toBe(EMPTY_SESSION);
  });
});

describe("a log that cannot be replayed throws, for the caller to catch", () => {
  const opening: Action[] = [{ type: "FORECAST", value: 0.5 }];
  test.each<[string, Action[]]>([
    ["a decision before the forecast", [{ type: "DECIDE", choiceId: "A" }]],
    ["a forecast out of range", [{ type: "FORECAST", value: 1.5 }]],
    ["an option that does not exist", [...opening, { type: "DECIDE", choiceId: "Z" }]],
    ["an ADVANCE before the investment", [...opening, { type: "DECIDE", choiceId: "A" }, { type: "ADVANCE" }]],
    ["two forecasts in one turn", [...opening, ...opening]],
  ])("%s", (_name, actions) => {
    expect(() => replay("SAVE-BROKEN", actions, content)).toThrow();
  });

  test("anything after the final decision", () => {
    const finished = playLive("SAVE-OVER", randomPolicy(2), content).at(-1)!;
    expect(() => replay("SAVE-OVER", [...finished.actions, { type: "ADVANCE" }], content)).toThrow();
  });
});
```

The first test compares the whole session: the game, the view before the last ADVANCE, every decision state and the log. It checks after START and after every batch of a real eight-turn game (about 30 cut points per seed), across six seeds with varied forecasts, options, tracks and purchases. The second test pins the bookkeeping itself: without it, a bug shared by the live and replay paths would pass unnoticed. A trial showed that moving the `before` snapshot, or appending the decision state after `reduce`, fails only this test.

**Step 2: Run it and watch it fail.**

```bash
npx vitest run tests/ui/session.test.ts
```

Expected: `FAIL tests/ui/session.test.ts` with `Error: Cannot find module '../../src/ui/session'`, then `Test Files  1 failed (1)`.

**Step 3: Implement.** Create `src/ui/session.ts`. Its `apply` loop is the ENGINE branch of `useGame.ts`'s `sessionReducer` (lines 54–63 at HEAD), moved here unchanged, with the action log added:

```ts
// The play session: the engine's state plus what the interface keeps beside it.
// Window-free, so Vitest can run it in Node. A saved game is rebuilt by `replay`,
// which runs exactly the loop that built the session live (DECISIONS.md F7).

import { createGame, displayed, reduce, type Action, type Content, type DisplayedState, type GameState } from "../engine";

export interface Session {
  game: GameState | null;
  /** The view just before the last ADVANCE, so the news screen can show what changed. */
  before: DisplayedState | null;
  /** The state at the moment of each decision, for judging it on what was knowable then. */
  decisionStates: GameState[];
  /** Every engine action since the game began, in order. With the seed code, all a saved game needs. */
  actions: Action[];
}

export type SessionAction =
  | { type: "START"; seedCode: string }
  | { type: "RESET" }
  | { type: "ENGINE"; actions: Action[] }
  | { type: "RESTORE"; seedCode: string; actions: Action[] };

export const EMPTY_SESSION: Session = { game: null, before: null, decisionStates: [], actions: [] };

function apply(session: Session, actions: readonly Action[], content: Content): Session {
  let { game, before, decisionStates } = session;
  if (!game) return session;
  for (const action of actions) {
    if (action.type === "ADVANCE") before = displayed(game);
    if (action.type === "DECIDE") decisionStates = [...decisionStates, game];
    game = reduce(game, action, content);
  }
  return { game, before, decisionStates, actions: [...session.actions, ...actions] };
}

/** Rebuilds a session from a seed code and an action log. Throws, as `reduce` does, on an illegal log. */
export function replay(seedCode: string, actions: readonly Action[], content: Content): Session {
  return apply({ ...EMPTY_SESSION, game: createGame(seedCode, content) }, actions, content);
}

export function makeSessionReducer(content: Content) {
  return function sessionReducer(session: Session, event: SessionAction): Session {
    switch (event.type) {
      case "START":
        return replay(event.seedCode, [], content);
      case "RESET":
        return EMPTY_SESSION;
      case "ENGINE":
        return apply(session, event.actions, content);
      case "RESTORE":
        return replay(event.seedCode, event.actions, content);
    }
  };
}
```

**Step 4: Run it and watch it pass.**

```bash
npx vitest run tests/ui/session.test.ts
npx tsc --noEmit
npx eslint src/ui/session.ts tests/ui
```

Expected: `Test Files  1 passed (1)` and `Tests  16 passed (16)`, in well under a second. `tsc` and `eslint` print nothing.

**Step 5: Commit.**

```bash
git add src/ui/session.ts tests/ui/play-live.ts tests/ui/session.test.ts
git commit -m "feat(ui): session reducer in session.ts, with an action log and replay

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

### Task 14.2: `useGame.ts` runs the shared session reducer

**Files:**
- Modify: `src/ui/useGame.ts` (the header comment, lines 1–3; the engine import, lines 6–15; the `Session` block, lines 36–65; the `useReducer` call, line 77. Line numbers are at HEAD: if an earlier phase edited this file, match the quoted text)

**Step 1: No new test.** This task moves code without changing behaviour, and `useGame.ts` reads `window` when it loads, so Vitest cannot import it. Two existing checks already cover it. Task 14.1's tests pin the reducer. The e2e reproducibility test pins the live game.

**Step 2: Confirm the baseline passes.** Make sure nothing is serving port 4173 first. `playwright.config.ts` reuses a running server, and would then test a stale build.

```bash
lsof -ti tcp:4173
npx playwright test e2e/polish.spec.ts -g "reproduce an identical run"
```

Expected: `lsof` prints nothing, then `1 passed`.

**Step 3: Implement.** In `src/ui/useGame.ts`:

(a) Replace the header comment:

```ts
// The bridge between React and the engine. `useReducer` wraps the pure engine
// (handoff Section 2: no state library). The raw GameState never leaves this
// file: components receive only `displayed(state)` (handoff invariant 3).
```

with:

```ts
// The bridge between React and the engine. `useReducer` wraps the pure engine
// (handoff Section 2: no state library). The raw GameState stays in this file and
// in session.ts: components receive only `displayed(state)` (handoff invariant 3).
```

(b) Replace the engine import:

```ts
import {
  createGame,
  displayed,
  reduce,
  type Action,
  type CounterfactualResult,
  type DisplayedState,
  type GameState,
  type OptionEstimate,
} from "../engine";
```

with:

```ts
import { displayed, type Action, type CounterfactualResult, type OptionEstimate } from "../engine";
```

Then add this line directly after `import type { WorkerRequest, WorkerResponse } from "../workers/counterfactual.worker";`:

```ts
import { EMPTY_SESSION, makeSessionReducer } from "./session";
```

(c) Delete the whole block from `interface Session {` through the closing `}` of `function sessionReducer(...)`. At HEAD that is lines 36–65: `interface Session`, `type SessionAction`, `const EMPTY` and `function sessionReducer`. Put this in its place:

```ts
// The session reducer lives in session.ts, so a saved game is rebuilt by the same loop that played it.
const sessionReducer = makeSessionReducer(content);
```

(d) Replace:

```ts
  const [session, dispatch] = useReducer(sessionReducer, EMPTY);
```

with:

```ts
  const [session, dispatch] = useReducer(sessionReducer, EMPTY_SESSION);
```

If an earlier phase made `useGame.ts` use `createGame`, `reduce`, `DisplayedState` or `GameState` elsewhere, keep those names in the import. `tsc` reports whichever names are missing or unused.

**Step 4: Run it and watch it pass.**

```bash
npx tsc --noEmit
npx eslint src/ui
npm run test
lsof -ti tcp:4173
npx playwright test e2e/polish.spec.ts e2e/crisis.spec.ts
```

Expected: `tsc` and `eslint` print nothing; every Vitest file passes; `lsof` prints nothing; every polish and crisis test passes.

**Step 5: Commit.**

```bash
git add src/ui/useGame.ts
git commit -m "refactor(ui): useGame runs the session reducer from session.ts

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

### Task 14.3: `src/ui/save.ts`: what a save holds, storage, and the checks before resuming

**Files:**
- Create: `src/ui/save.ts`
- Test: `tests/ui/save.test.ts`

**Step 1: Write the failing test.** Create `tests/ui/save.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { displayed } from "../../src/engine";
import { applyOverrides, encodeOverrides, loadContent, publicContent } from "../../src/content";
import {
  clearSave, contentIdOf, fnv1a, makeSave, readSave, restore, resumeLabel, SAVE_FORMAT, SAVE_KEY, SAVE_KEYS, writeSave,
  type Place, type SaveFile, type SaveStorage, type Stage,
} from "../../src/ui/save";
import { replay, type Session } from "../../src/ui/session";
import { first, fixture } from "../engine/fixture";
import { playLive, randomPolicy } from "./play-live";

const content = loadContent();
const pub = publicContent(content);
const ids = { contentId: contentIdOf(content), cfg: "" };

/** An in-memory stand-in for window.localStorage. */
function memoryStorage(): SaveStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value); },
    removeItem: (key) => { data.delete(key); },
  };
}

/** Storage in a private window or under strict settings: every call throws. */
const blocked: SaveStorage = {
  getItem: () => { throw new Error("SecurityError"); },
  setItem: () => { throw new Error("QuotaExceededError"); },
  removeItem: () => { throw new Error("SecurityError"); },
};

// One real game, played the way App dispatches it. Index 0 is the first briefing.
const sessions = playLive("SAVE-TEST", randomPolicy(5), content);
const deciding = sessions.find((s) => s.game?.phase === "decide")!;
const afterTurnOne = sessions.find((s) => s.game?.turn === 2)!;
const afterTurnTwo = sessions.find((s) => s.game?.turn === 3)!;
const finished = sessions.at(-1)!;

/** The turn and scenario the news screen reports after the session's last ADVANCE, as App's `resolved` holds it. */
const reported = (session: Session): Place => ({ turn: session.before!.turn, scenarioId: session.before!.current!.scenarioId });
const saveOf = (session: Session, stage: Stage, resolved: Place | null = null): SaveFile =>
  makeSave(displayed(session.game!), session.actions, stage, resolved, ids);

/** Every key anywhere in a JSON value. */
function keysIn(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(keysIn);
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key, child]) => [key, ...keysIn(child)]);
  return [];
}

describe("what a save holds", () => {
  test("the player's own inputs and public labels, and nothing from the hidden world", () => {
    const hidden = ["world", "metrics", "truth", "queue", "oddsModifiers", "outcomes", "history", "debrief", "exact", "estimates", "flags", "rngState", "halfWidth", "oddsAtTheTime", "profile", "facts"];
    for (const session of sessions) {
      const stage: Stage = session.game!.phase === "debrief" ? "debrief" : "play";
      const save = JSON.parse(JSON.stringify(saveOf(session, stage)));
      expect(Object.keys(save).sort()).toEqual([...SAVE_KEYS].sort());
      for (const key of hidden) expect(keysIn(save), key).not.toContain(key);
    }
  });

  test("the top-level keys are exactly the eight in the design", () => {
    expect([...SAVE_KEYS].sort()).toEqual(["actions", "at", "cfg", "contentId", "resolved", "seedCode", "stage", "v"]);
  });

  test("a whole game's log stays small", () => {
    expect(JSON.stringify(saveOf(finished, "debrief")).length).toBeLessThan(4000);
  });
});

describe("reading and writing", () => {
  test("a save written is the save read back", () => {
    const storage = memoryStorage();
    const save = saveOf(afterTurnOne, "news", reported(afterTurnOne));
    writeSave(storage, save);
    expect(typeof storage.data.get(SAVE_KEY)).toBe("string");
    expect(readSave(storage)).toEqual(save);
  });

  test.each<[string, (save: Record<string, unknown>) => unknown]>([
    ["text that is not JSON", () => "{not json"],
    ["an unknown key", (save) => ({ ...save, world: { profile: "hard" } })],
    ["another format version", (save) => ({ ...save, v: 2 })],
    ["an unknown stage", (save) => ({ ...save, stage: "menu" })],
    ["a track that does not exist", (save) => ({ ...save, actions: [{ type: "FORECAST", value: 0.5 }, { type: "INVEST", track: "space" }] })],
    ["a forecast above 1", (save) => ({ ...save, actions: [{ type: "FORECAST", value: 2 }] })],
    ["an action with extra fields", (save) => ({ ...save, actions: [{ type: "ADVANCE", turn: 3 }] })],
  ])("rejects %s", (_name, tamper) => {
    const storage = memoryStorage();
    const tampered = tamper(JSON.parse(JSON.stringify(saveOf(deciding, "play"))));
    storage.setItem(SAVE_KEY, typeof tampered === "string" ? tampered : JSON.stringify(tampered));
    expect(readSave(storage)).toBeNull();
  });

  test("nothing saved reads as null", () => {
    expect(readSave(memoryStorage())).toBeNull();
    expect(readSave(null)).toBeNull();
  });

  test("storage that throws never breaks the game", () => {
    const save = saveOf(deciding, "play");
    expect(readSave(blocked)).toBeNull();
    expect(() => writeSave(blocked, save)).not.toThrow();
    expect(() => clearSave(blocked)).not.toThrow();
    expect(() => writeSave(null, save)).not.toThrow();
    expect(() => clearSave(null)).not.toThrow();
  });

  test("clearing removes this game's slot and nothing else", () => {
    const storage = memoryStorage();
    storage.setItem("another-app", "keep me");
    writeSave(storage, saveOf(deciding, "play"));
    clearSave(storage);
    expect(storage.data.has(SAVE_KEY)).toBe(false);
    expect(storage.data.get("another-app")).toBe("keep me");
  });
});

describe("the content id", () => {
  test("is stable for the same content and starts with the save format", () => {
    expect(contentIdOf(loadContent())).toBe(ids.contentId);
    expect(ids.contentId.startsWith(`${SAVE_FORMAT}-`)).toBe(true);
  });

  test("changes when any content changes", () => {
    const edited = structuredClone(content);
    edited.scenarios[0]!.briefing += " ";
    expect(contentIdOf(edited)).not.toBe(ids.contentId);
  });
});

describe("SAVE_FORMAT", () => {
  // The content id covers the JSON, not the engine's code. This pin covers the engine: if an
  // engine change makes the same actions replay differently, old saves must not replay at all.
  test("the engine replays a pinned game as before. If this fails, bump SAVE_FORMAT in src/ui/save.ts, then update the pin", () => {
    const actions = playLive("SAVE-PIN", { ...first, buyInfo: true }, fixture).at(-1)!.actions;
    const game = replay("SAVE-PIN", actions, fixture).game!;
    expect(`${SAVE_FORMAT}:${actions.length}:${fnv1a(JSON.stringify(game))}`).toBe("1:17:1al5syx");
  });
});

describe("restoring", () => {
  test.each<[string, Session, Stage, Place | null]>([
    ["the first briefing", sessions[0]!, "briefing", null],
    ["a decision in progress", deciding, "play", null],
    ["the news after turn 1", afterTurnOne, "news", reported(afterTurnOne)],
    ["the pause after turn 1", afterTurnOne, "pause", reported(afterTurnOne)],
    ["the briefing of turn 3", afterTurnTwo, "briefing", reported(afterTurnTwo)],
    ["the final news", finished, "news", reported(finished)],
    ["the debrief", finished, "debrief", reported(finished)],
  ])("%s comes back exactly as it was played", (_name, session, stage, resolved) => {
    const rebuilt = restore(saveOf(session, stage, resolved), content, ids);
    expect(JSON.stringify(rebuilt)).toBe(JSON.stringify(session));
  });

  test("a game under a facilitator's edits restores only on a page with the same edits", () => {
    const overrides = { weights: { benign: 0, contested: 100, hard: 0 } };
    const edited = applyOverrides(content, overrides);
    const editedIds = { contentId: ids.contentId, cfg: encodeOverrides(overrides) };
    const session = playLive("SAVE-EDITS", randomPolicy(6), edited)[5]!;
    const save = makeSave(displayed(session.game!), session.actions, "play", null, editedIds);
    expect(JSON.stringify(restore(save, edited, editedIds))).toBe(JSON.stringify(session));
    expect(restore(save, content, ids)).toBeNull();
  });

  test.each<[string, (save: SaveFile) => SaveFile]>([
    ["made by another build", (save) => ({ ...save, contentId: "1-other" })],
    ["made under other facilitator edits", (save) => ({ ...save, cfg: "eyJ3ZWlnaHRzIjp7fX0" })],
    ["an option that was never on offer", (save) => ({ ...save, actions: save.actions.map((a) => (a.type === "DECIDE" ? { ...a, choiceId: "Z" } : a)) })],
    ["a log cut short", (save) => ({ ...save, actions: save.actions.slice(0, -1) })],
    ["a different turn", (save) => ({ ...save, at: { ...save.at, turn: save.at.turn + 1 } })],
    ["a different scenario", (save) => ({ ...save, at: { ...save.at, scenarioId: "false-alarm" } })],
    ["the debrief before the game is over", (save) => ({ ...save, stage: "debrief" })],
    ["a briefing while an investment is due", (save) => ({ ...save, stage: "briefing" })],
    ["news with nothing to report", (save) => ({ ...save, stage: "news", resolved: null })],
  ])("returns null for a save %s", (_name, tamper) => {
    const investing = sessions.find((s) => s.game?.turn === 2 && s.game.phase === "invest")!;
    expect(restore(tamper(saveOf(investing, "play")), content, ids)).toBeNull();
  });

  test("returns null for news about the wrong turn, or a pause after any turn but the first", () => {
    expect(restore(saveOf(afterTurnTwo, "news", { ...reported(afterTurnTwo), turn: 1 }), content, ids)).toBeNull();
    expect(restore(saveOf(afterTurnTwo, "pause", reported(afterTurnTwo)), content, ids)).toBeNull();
  });
});

describe("the title screen's offer", () => {
  test("names the turn and scenario in play", () => {
    expect(resumeLabel(saveOf(deciding, "play"), pub)).toBe("Continue your game: Turn 1 of 8, The Attribution Gap");
  });

  test("on a news or pause screen, names the turn being reported", () => {
    expect(resumeLabel(saveOf(afterTurnOne, "news", reported(afterTurnOne)), pub)).toBe("Continue your game: Turn 1 of 8, The Attribution Gap");
    expect(resumeLabel(saveOf(afterTurnOne, "pause", reported(afterTurnOne)), pub)).toBe("Continue your game: Turn 1 of 8, The Attribution Gap");
  });

  test("on the next briefing, names the next turn", () => {
    const next = pub.scenarios[afterTurnOne.game!.current!.scenarioId]!.title;
    expect(resumeLabel(saveOf(afterTurnOne, "briefing", reported(afterTurnOne)), pub)).toBe(`Continue your game: Turn 2 of 8, ${next}`);
  });

  test("after the last decision, points to the debrief", () => {
    expect(resumeLabel(saveOf(finished, "debrief", reported(finished)), pub)).toBe("Continue your game: your debrief");
  });
});
```

The `SAVE_FORMAT` pin (`1:17:1al5syx`) was computed at HEAD `a11ef34`, on the engine fixture content (`tests/engine/fixture.ts`) rather than the real content, so tuning the JSON never trips it. Phases 8 to 13 change neither `src/engine` nor the fixture, so it holds. If it fails on the first run, check that with `git diff <Phase 8's base commit> -- src/engine tests/engine/fixture.ts`. Any engine change there is exactly what the bump is for.

**Step 2: Run it and watch it fail.**

```bash
npx vitest run tests/ui/save.test.ts
```

Expected: `FAIL tests/ui/save.test.ts` with `Error: Cannot find module '../../src/ui/save'`, then `Test Files  1 failed (1)`.

**Step 3: Implement.** Create `src/ui/save.ts`:

```ts
// Save and resume (DECISIONS.md F7). A game in progress is kept in this browser's
// local storage as what the player did, never as the game state: the seed code, any
// facilitator edits, the list of actions and which screen was showing. Resuming
// replays the actions through the session reducer, and the engine's determinism
// rebuilds the same game. Window-free: callers pass the storage in.

import { z } from "zod";
import { displayed, type Action, type Content, type DisplayedState, type Phase, type Track } from "../engine";
import type { PublicContent } from "../content";
import { replay, type Session } from "./session";

/** One slot, namespaced: the bundle uses relative paths, so other apps may share the origin. */
export const SAVE_KEY = "ai-2032:save:v1";

/** Bump by hand whenever an engine change could replay the same actions into a different game. */
export const SAVE_FORMAT = 1;

/** The interface's own steps. "briefing", "news" and "pause" are reading steps the engine has no phase for. */
export const STAGES = ["briefing", "play", "news", "pause", "debrief"] as const;
export type Stage = (typeof STAGES)[number];

const TRACKS = ["evaluation", "provenance", "diplomacy", "defensiveCyber"] as const satisfies readonly Track[];
const PHASES = ["forecast", "decide", "invest", "advance", "debrief"] as const satisfies readonly Phase[];

/** Mirrors the engine's Action union (src/engine/types.ts). The annotation makes tsc fail if the two drift apart. */
const actionSchema: z.ZodType<Action> = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("FORECAST"), value: z.number().min(0).max(1) }),
  z.strictObject({ type: z.literal("BUY_INFO") }),
  z.strictObject({ type: z.literal("DECIDE"), choiceId: z.string().min(1).max(16) }),
  z.strictObject({ type: z.literal("INVEST"), track: z.enum(TRACKS) }),
  z.strictObject({ type: z.literal("ADVANCE") }),
]);

const placeSchema = z.strictObject({ turn: z.number().int().min(1), scenarioId: z.string().min(1) });

const saveSchema = z.strictObject({
  v: z.literal(1),
  contentId: z.string().min(1),
  seedCode: z.string().min(1).max(256),
  cfg: z.string().max(8192),
  actions: z.array(actionSchema).max(200),
  stage: z.enum(STAGES),
  resolved: placeSchema.nullable(),
  at: z.strictObject({ turn: z.number().int().min(1), phase: z.enum(PHASES), scenarioId: z.string().min(1).nullable() }),
});

export type SaveFile = z.infer<typeof saveSchema>;
/** The turn and scenario a news or pause screen is reporting. */
export type Place = z.infer<typeof placeSchema>;
/** Every key a save holds at its top level. Nothing else is ever stored. */
export const SAVE_KEYS = Object.keys(saveSchema.shape);

/** The part of the Web Storage API a save needs. Tests pass an in-memory fake. */
export type SaveStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** What a save must match on this page: the build's content and the facilitator edits in the URL. */
export interface SaveIds {
  contentId: string;
  cfg: string;
}

/** 32-bit FNV-1a, in base 36. The engine's own hash is internal to src/engine, so the interface keeps its own. */
export function fnv1a(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

/** The bundled content's fingerprint, prefixed with SAVE_FORMAT, so a save replays only into the build that made it. */
export function contentIdOf(content: Content): string {
  return `${SAVE_FORMAT}-${fnv1a(JSON.stringify(content))}`;
}

/** What to store for the game on screen: the player's own inputs and public labels, nothing from the hidden world. */
export function makeSave(view: DisplayedState, actions: readonly Action[], stage: Stage, resolved: Place | null, ids: SaveIds): SaveFile {
  return {
    v: 1,
    contentId: ids.contentId,
    seedCode: view.seedCode,
    cfg: ids.cfg,
    actions: [...actions],
    stage,
    resolved: resolved ? { turn: resolved.turn, scenarioId: resolved.scenarioId } : null,
    at: { turn: view.turn, phase: view.phase, scenarioId: view.current?.scenarioId ?? null },
  };
}

// Storage can be missing, full or blocked (private windows, strict settings). The game
// must play the same without it, so every call swallows the error.

export function readSave(storage: SaveStorage | null): SaveFile | null {
  if (!storage) return null;
  try {
    const text = storage.getItem(SAVE_KEY);
    if (text === null) return null;
    const parsed = saveSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeSave(storage: SaveStorage | null, save: SaveFile): void {
  try {
    storage?.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // Not saved. The game goes on in memory.
  }
}

export function clearSave(storage: SaveStorage | null): void {
  try {
    storage?.removeItem(SAVE_KEY);
  } catch {
    // Nothing to clear, or storage is blocked.
  }
}

/** Whether the saved screen can show this state, so an edited save cannot open a screen with nothing on it. */
function fitsStage(save: SaveFile, session: Session): boolean {
  const phase = save.at.phase;
  const before = session.before;
  const reported = !!save.resolved && !!before?.current
    && save.resolved.turn === before.turn && save.resolved.scenarioId === before.current.scenarioId;
  switch (save.stage) {
    case "briefing":
      return phase === "forecast";
    case "play":
      return phase === "forecast" || phase === "decide" || phase === "invest";
    case "news":
      return (phase === "forecast" || phase === "debrief") && reported;
    case "pause":
      return phase === "forecast" && reported && save.resolved?.turn === 1;
    case "debrief":
      return phase === "debrief";
  }
}

/**
 * Rebuilds a saved game, or returns null when the save cannot be trusted: made by another
 * build or under other facilitator edits, an action log the engine rejects, or a log that
 * no longer lands on the turn, phase, scenario and screen it was saved at.
 */
export function restore(save: SaveFile, content: Content, ids: SaveIds): Session | null {
  if (save.contentId !== ids.contentId || save.cfg !== ids.cfg) return null;
  let session: Session;
  try {
    session = replay(save.seedCode, save.actions, content);
  } catch {
    return null;
  }
  if (!session.game) return null;
  const view = displayed(session.game);
  const landed = view.turn === save.at.turn && view.phase === save.at.phase
    && (view.current?.scenarioId ?? null) === save.at.scenarioId;
  return landed && fitsStage(save, session) ? session : null;
}

/** The title screen's offer: where the saved game stands, in public terms only. */
export function resumeLabel(save: SaveFile, pub: PublicContent): string {
  if (save.stage === "debrief") return "Continue your game: your debrief";
  // On a news or pause screen the player is still reading about the turn just resolved.
  const place = (save.stage === "news" || save.stage === "pause") && save.resolved
    ? save.resolved
    : { turn: save.at.turn, scenarioId: save.at.scenarioId ?? "" };
  const title = pub.scenarios[place.scenarioId]?.title;
  const where = `Turn ${place.turn} of ${pub.totalTurns}`;
  return title ? `Continue your game: ${where}, ${title}` : `Continue your game: ${where}`;
}
```

Notes on the design:
- The engine accepts `INVEST` with any track name (`reduce.ts:370`), so the schema's `z.enum(TRACKS)` is what keeps a hand-edited track out.
- The `"pause"` rule follows D7: the pause comes only after turn 1.
- After a non-final ADVANCE, `resolved` (App's `{turn, scenarioId}`) equals `before.turn` and `before.current.scenarioId`, because `before` is snapshotted just before ADVANCE. The same holds after the final ADVANCE, which does not increment the turn (`reduce.ts:307-309`).

**Step 4: Run it and watch it pass.**

```bash
npx vitest run tests/ui/save.test.ts tests/ui/session.test.ts
npx tsc --noEmit
npx eslint src/ui tests/ui
```

Expected: `Test Files  2 passed (2)` and `Tests  55 passed (55)` (39 in `save.test.ts`, 16 in `session.test.ts`). `tsc` and `eslint` print nothing.

**Step 5: Commit.**

```bash
git add src/ui/save.ts tests/ui/save.test.ts
git commit -m "feat(ui): save.ts, the save format with storage and restore checks

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

### Task 14.4: "Continue your game" on the title screen

**Files:**
- Modify: `src/ui/useGame.ts` (header comment; imports; new exports `storage`, `saveIds` and `savedGame()` after `published`; `resume` in the hook; the hook's return value)
- Create: `src/ui/components/SavedGame.tsx`
- Modify: `src/ui/screens/Title.tsx` (`Props`, the function signature, one line before `<details`)
- Modify: `src/ui/App.tsx` (imports; `type Stage`; the `useGame()` destructuring; a `saved` state; a save effect and `continueSaved()` after the `[stepKey]` effect; two `Title` props)
- Modify: `e2e/play.ts` (`LABEL.resume`)
- Test: `e2e/engagement.spec.ts` (append a `describe` block)

**Step 1: Write the failing test.**

(a) In `e2e/play.ts`, add one entry to `LABEL`, as its last entry, directly before `} as const;`. After Phase 12 the last entry is `pauseHeading`:

```ts
  resume: /^Continue your game/,
```

(b) In `e2e/engagement.spec.ts`, make sure the imports include `expect, test, type Page` from `@playwright/test` and `LABEL, playTurn, scenarioTitle, startGame, toDecision` from `./play`. Merge missing names into the existing import statements; do not add a second import from the same module, and do not add a name the file does not use. Add `import AxeBuilder from "@axe-core/playwright";` as the file's first import if it is not there. Then append at the end of the file:

```ts
// ---------------------------------------------------------------- Phase 14: save and resume (DECISIONS.md F7)

const SAVE_KEY = "ai-2032:save:v1";
const storedSave = (page: Page) => page.evaluate((key) => window.localStorage.getItem(key), SAVE_KEY);
/** Waits until the save in storage has caught up with the screen, so a reload cannot race the write. */
const savedStage = (page: Page) => expect.poll(async () => JSON.parse((await storedSave(page)) ?? "{}").stage as string | undefined);
const nationText = (page: Page) => page.getByRole("complementary", { name: "State of the nation" }).innerText();

test.describe("save and resume: continuing", () => {
  test("a game in progress is kept in this browser and continues exactly where it was, never on its own", async ({ page }) => {
    await startGame(page, "RESUME-1");
    await playTurn(page, { prefer: "B", forecast: 35 });
    await playTurn(page, { prefer: "A", forecast: 70, track: "Diplomacy" });
    await toDecision(page, 20);
    const title = await scenarioTitle(page);
    const nation = await nationText(page);
    await expect.poll(async () => JSON.parse((await storedSave(page)) ?? "{}").at?.phase).toBe("decide");

    await page.reload();
    await expect(page.getByRole("button", { name: LABEL.start })).toBeVisible();      // the title screen, not the game
    const resume = page.getByRole("button", { name: LABEL.resume });
    await expect(resume).toHaveText(`Continue your game: Turn 3 of 8, ${title}`);
    await expect(page.getByText("Saved in this browser only.")).toBeVisible();
    await resume.click();

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    await expect(page.getByRole("group", { name: LABEL.decisionGroup })).toBeVisible();
    expect(await nationText(page)).toBe(nation);
    expect(new URL(page.url()).searchParams.get("seed")).toBe("RESUME-1");
  });

  test("the stored save holds only the player's own inputs", async ({ page }) => {
    await startGame(page, "RESUME-KEYS");
    await playTurn(page, { forecast: 35 });
    await savedStage(page).toBe("briefing");
    const text = (await storedSave(page))!;
    const save = JSON.parse(text);
    expect(Object.keys(save).sort()).toEqual(["actions", "at", "cfg", "contentId", "resolved", "seedCode", "stage", "v"]);
    expect(text).not.toMatch(/"(world|metrics|truth|queue|oddsModifiers|outcomes|history|debrief|exact|estimates|flags|rngState)":/);
    expect(save.seedCode).toBe("RESUME-KEYS");
    expect(save.actions[0]).toEqual({ type: "FORECAST", value: 0.35 });
  });

  test("a seed link still opens the title, and starting that world replaces the kept game", async ({ page }) => {
    await startGame(page, "RESUME-OLD");
    await playTurn(page);
    await page.goto("/?seed=RESUME-NEW");
    await expect(page.getByLabel(/^Seed code/)).toHaveValue("RESUME-NEW");
    await expect(page.getByRole("button", { name: LABEL.resume })).toBeVisible();
    await page.getByRole("button", { name: LABEL.start }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("The Attribution Gap");
    await expect.poll(async () => JSON.parse((await storedSave(page)) ?? "{}").seedCode).toBe("RESUME-NEW");
  });

  test("a game played under a facilitator's edits is offered only on a page with the same edits", async ({ page }) => {
    // The same base64url form the facilitator panel writes (src/content/overrides.ts).
    const cfg = btoa(JSON.stringify({ weights: { benign: 0, contested: 0, hard: 100 } })).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
    await page.goto(`/?seed=RESUME-CFG&cfg=${cfg}`);
    await expect(page.getByText("This session uses edited assumptions.")).toBeVisible();
    await page.getByRole("button", { name: LABEL.start }).click();
    await playTurn(page);
    await savedStage(page).toBe("briefing");

    await page.goto("/");
    await expect(page.getByRole("button", { name: LABEL.start })).toBeVisible();
    await expect(page.getByRole("button", { name: LABEL.resume })).toHaveCount(0);
    await page.goto(`/?cfg=${cfg}`);
    await page.getByRole("button", { name: LABEL.resume }).click();
    await expect(page.getByRole("button", { name: LABEL.continueToForecast })).toBeVisible();
    expect(new URL(page.url()).searchParams.get("cfg")).toBe(cfg);
    expect(new URL(page.url()).searchParams.get("seed")).toBe("RESUME-CFG");
  });

  test("with storage blocked the game plays on and offers nothing to continue", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Blocked", "SecurityError"); } });
    });
    await startGame(page, "RESUME-BLOCKED");
    await playTurn(page);
    await page.reload();
    await expect(page.getByRole("button", { name: LABEL.start })).toBeVisible();
    await expect(page.getByRole("button", { name: LABEL.resume })).toHaveCount(0);
  });

  for (const colorScheme of ["light", "dark"] as const) {
    test(`the continue offer passes axe, fits a phone and keeps the main button in the first screen (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await startGame(page, "RESUME-AXE");
      await playTurn(page);
      await savedStage(page).toBe("briefing");
      await page.setViewportSize({ width: 360, height: 740 });
      await page.goto("/");
      await expect(page.getByRole("button", { name: LABEL.resume })).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id} (${v.nodes.length}) ${v.nodes[0]?.target}`)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

      await page.setViewportSize({ width: 375, height: 667 });                         // D3: the main button stays in the first screen
      const cta = await page.getByRole("button", { name: LABEL.start }).boundingBox();
      expect(cta!.y + cta!.height).toBeLessThanOrEqual(667);
    });
  }
});
```

After Phase 12, `playTurn` on turn 1 clicks "Keep going" at the pause. So after two `playTurn` calls the player is on turn 3's briefing, and after one on turn 2's.

**Step 2: Run it and watch it fail.** Make sure nothing serves port 4173 (`lsof -ti tcp:4173` prints nothing), then:

```bash
npx tsc --noEmit
npx playwright test e2e/engagement.spec.ts -g "save and resume: continuing"
```

Expected: `tsc` prints nothing. Six of the seven tests fail:
- "a game in progress…", "the stored save…", "a seed link…", "a game played under a facilitator's edits…" and both axe tests fail at the first `savedStage`/`expect.poll` or `LABEL.resume` check. The poll reports `Received: undefined`; the locator reports `element(s) not found`.
- "with storage blocked…" already passes. It guards against the new module-level storage access crashing the page.

**Step 3: Implement.**

(a) `src/ui/useGame.ts`. Replace the two header lines written in Task 14.2:

```ts
// (handoff Section 2: no state library). The raw GameState stays in this file and
// in session.ts: components receive only `displayed(state)` (handoff invariant 3).
```

with:

```ts
// (handoff Section 2: no state library). The raw GameState stays in this file and
// in session.ts and save.ts: components receive only `displayed(state)` (handoff invariant 3).
```

Replace the content import and the session import:

```ts
import { applyOverrides, assumptionsOf, countOverrides, decodeOverrides, loadContent, publicContent } from "../content";
import type { WorkerRequest, WorkerResponse } from "../workers/counterfactual.worker";
import { EMPTY_SESSION, makeSessionReducer } from "./session";
```

with:

```ts
import { applyOverrides, assumptionsOf, countOverrides, decodeOverrides, encodeOverrides, loadContent, publicContent } from "../content";
import type { WorkerRequest, WorkerResponse } from "../workers/counterfactual.worker";
import { clearSave, contentIdOf, readSave, restore, type SaveFile, type SaveIds, type SaveStorage } from "./save";
import { EMPTY_SESSION, makeSessionReducer } from "./session";
```

Directly after the line `export const published = assumptionsOf(content);`, add:

```ts

/** This browser's local storage, or null where it is blocked. It holds one save and nothing else (DECISIONS.md F7). */
export const storage: SaveStorage | null = (() => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
})();
/** A save resumes only on a page with the same build and the same facilitator edits. */
export const saveIds: SaveIds = { contentId: contentIdOf(bundled), cfg: encodeOverrides(overrides) };

/**
 * The saved game this page can offer to continue, if any. A save that no longer replays
 * is discarded; one made under other facilitator edits is left for the page that has them.
 */
export function savedGame(): SaveFile | null {
  const save = readSave(storage);
  if (!save || save.cfg !== saveIds.cfg) return null;
  if (restore(save, content, saveIds)) return save;
  clearSave(storage);
  return null;
}
```

`contentIdOf(bundled)` fingerprints the content before any facilitator edit; the edits are matched separately through `cfg`. `encodeOverrides(overrides)` is the normalised form, so a malformed `cfg` (which decodes to no edits) matches a page with none. Hashing the 73 KB of content takes under 1 ms.

Directly after the line `  const act = useCallback((...actions: Action[]) => dispatch({ type: "ENGINE", actions }), []);`, add:

```ts
  /** Rebuilds a saved game by replaying its actions. False, and nothing changes, when it no longer replays to where it was saved. */
  const resume = useCallback((save: SaveFile): boolean => {
    if (!restore(save, content, saveIds)) return false;
    setRankings(null);
    dispatch({ type: "RESTORE", seedCode: save.seedCode, actions: save.actions });
    return true;
  }, []);
```

The check runs before the dispatch, so the reducer's own replay cannot throw inside React. Replay costs a few milliseconds. When the resumed game is over, the existing soundness effect (keyed on `over` and `session.decisionStates`) reruns the luck-tag rollouts, and `whatIf` works because `session.game` is back.

Replace the return statement:

```ts
  return { view, before: session.before, rankings, start, reset, act, whatIf };
```

with:

```ts
  return { view, before: session.before, actions: session.actions, rankings, start, reset, act, resume, whatIf };
```

(If an earlier phase added names to this object, keep them and add `actions` and `resume`.)

(b) Create `src/ui/components/SavedGame.tsx`:

```tsx
import { Button } from "./Button";

interface Props {
  /** For example "Continue your game: Turn 3 of 8, The Biology Result". */
  label: string;
  onResume: () => void;
}

/** The title screen's quiet offer to continue the game kept in this browser. Never taken without a click. */
export function SavedGame({ label, onResume }: Props) {
  return (
    <div className="mt-5">
      <Button variant="quiet" className="text-left" aria-describedby="saved-game-note" onClick={onResume}>
        {label}
      </Button>
      <p id="saved-game-note" className="mt-2 text-sm text-muted">
        Saved in this browser only. Starting a new game replaces it.
      </p>
    </div>
  );
}
```

`Button` defaults to `type="button"`, so the offer never submits the title's start form, even when placed inside it. `min-h-11` keeps the target above 24px, and the label wraps at 360px without overflow (the axe test checks both).

(c) `src/ui/screens/Title.tsx`. Add the import directly after `import { Figure } from "../components/Figure";`:

```tsx
import { SavedGame } from "../components/SavedGame";
```

In `interface Props`, replace:

```tsx
  onStart: (seedCode: string) => void;
}
```

with:

```tsx
  onStart: (seedCode: string) => void;
  /** The offer to continue the game kept in this browser, or null when there is none. */
  resumable: string | null;
  onResume: () => void;
}
```

Replace:

```tsx
export function Title({ initialSeed, onStart }: Props) {
```

with:

```tsx
export function Title({ initialSeed, onStart, resumable, onResume }: Props) {
```

Then find the friend disclosure (`grep -n "<details" src/ui/screens/Title.tsx`: exactly one match, Phase 9's `<details className="mt-6 border-y border-rule py-2" open={Boolean(initialSeed)}>`). On the line directly above it, add:

```tsx
        {resumable && <SavedGame label={resumable} onResume={onResume} />}

```

Page order is now: the main button, "8 decisions, about 25 minutes…", the continue offer, then "Play the same world as a friend".

(d) `src/ui/App.tsx`.

Replace the useGame import:

```tsx
import { pub, useGame } from "./useGame";
```

with:

```tsx
import { makeSave, resumeLabel, writeSave, type Stage } from "./save";
import { pub, savedGame, saveIds, storage, useGame } from "./useGame";
```

If `eslint` asks for a different position, place the `./save` import with the other local imports.

Delete the `Stage` type and its doc comment, which Phase 12 left as:

```tsx
/**
 * The interface's own steps. "briefing" and "news" are reading steps the engine has no phase for.
 * "pause" is the one-time stop after turn 1's news: the five-minute taster (DECISIONS.md section F).
 */
type Stage = "briefing" | "play" | "news" | "pause" | "debrief";
```

`Stage` now comes from `save.ts`, whose `STAGES` list the save schema validates against. It has the same five members.

Replace:

```tsx
  const { view, before, rankings, start, reset, act, whatIf } = useGame();
```

with:

```tsx
  const { view, before, actions, rankings, start, reset, act, resume, whatIf } = useGame();
```

Directly after the line `  const [resolved, setResolved] = useState<{ turn: number; scenarioId: string } | null>(null);`, add:

```tsx
  /** The game kept in this browser, offered on the title screen. Read once, when the page opens; never resumed without a click. */
  const [saved, setSaved] = useState(savedGame);
```

Directly after the focus effect's closing line `  }, [stepKey]);` and before Phase 12's `backToStart` function, add:

```tsx

  // Keep the game in this browser after every step: the seed code, any edits and the actions, never the state (DECISIONS.md F7).
  useEffect(() => {
    if (view) writeSave(storage, makeSave(view, actions, stage, resolved, saveIds));
  }, [view, actions, stage, resolved]);

  /** Continue your game: replay the kept game and return to the screen it was saved on. */
  function continueSaved() {
    if (!saved || !resume(saved)) {
      setSaved(null);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    params.set("seed", saved.seedCode);
    params.delete("facilitator");
    window.history.replaceState(null, "", `?${params.toString()}`);
    setStage(saved.stage);
    setResolved(saved.resolved);
  }
```

In the `<Title` element, directly after `          initialSeed={seedFromUrl()}`, add:

```tsx
          resumable={saved ? resumeLabel(saved, pub) : null}
          onResume={continueSaved}
```

Why this shape:
- The save is read once, by the lazy initialiser `useState(savedGame)`.
- The effect only writes to storage and never calls `setState`, so `react-hooks/set-state-in-effect` has nothing to flag.
- Every other state change happens in click handlers.
- The effect writes only while `view` is non-null, so the title screen never overwrites a save.
- React batches `DECIDE`+`ADVANCE`, `setResolved` and `setStage` from one click into one render, so no half-updated state is ever written.
- `resume`, `setStage` and `setResolved` also land in one render. The existing `stepKey` effect then moves focus to the restored screen's h1. On the pause this is Phase 12's h1; on the debrief, `Debrief` manages its own focus.
- The seed goes back into the URL, so the header and Phase 12's world link are right.

**Step 4: Run it and watch it pass.**

```bash
npx tsc --noEmit
npx eslint .
npm run test
lsof -ti tcp:4173
npx playwright test e2e/engagement.spec.ts -g "save and resume: continuing"
npx playwright test e2e/polish.spec.ts
```

Expected:
- `tsc` and `eslint` print nothing, and every Vitest file passes.
- `7 passed` for the new block.
- Every polish test passes unchanged, notably these two. "The seed code round-trips through the URL": the reload shows the title with the seed prefilled, and the main button restarts the same world. "Reduced motion is honoured…": `goto("/?seed=PHONE-2")` shows a fresh title; the offer for the PHONE game is there too, but the test presses the main button.

**Step 5: Commit.**

```bash
git add src/ui/useGame.ts src/ui/components/SavedGame.tsx src/ui/screens/Title.tsx src/ui/App.tsx e2e/play.ts e2e/engagement.spec.ts
git commit -m "feat(ui): offer to continue a game kept in this browser

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

### Task 14.5: Pausing, finishing and starting again

**Files:**
- Modify: `src/ui/App.tsx` (the `./save` import; Phase 12's `backToStart`; its two call sites)
- Modify: `src/ui/copy.ts` (a `SAVED_HERE_NOTE` constant after `stopHereNote`)
- Modify: `src/ui/screens/FirstDecision.tsx` (imports; one line in the Stop here panel)
- Test: `e2e/engagement.spec.ts` (append a second `describe` block)

**Step 1: Write the failing test.** In `e2e/engagement.spec.ts`, make sure the `./play` import also includes `playToDebrief` (Phase 9 imported it already). Then append:

```ts
test.describe("save and resume: pausing and finishing", () => {
  /** Plays turn 1 through its news and stays on the first-decision pause (Phase 12). */
  async function toThePause(page: Page) {
    await toDecision(page, 35);
    await page.locator('input[name="choice"]:enabled').first().check();
    await page.getByRole("button", { name: LABEL.confirm }).click();
    await page.locator('input[name="track"]:enabled').first().check();
    await page.getByRole("button", { name: LABEL.investIn }).click();
    await expect(page.getByRole("heading", { name: LABEL.newsHeading })).toBeVisible();
    await page.getByRole("button", { name: LABEL.next }).click();
    await expect(page.getByRole("button", { name: LABEL.keepGoing })).toBeVisible();
  }

  test("the first-decision pause comes back after a reload, and Back to the start keeps the game", async ({ page }) => {
    await startGame(page, "RESUME-PAUSE");
    await toThePause(page);
    const pauseHeading = await scenarioTitle(page);
    await page.getByRole("button", { name: "Stop here" }).click();
    await expect(page.getByText(/kept in this browser/)).toBeVisible();
    await savedStage(page).toBe("pause");

    await page.reload();
    await page.getByRole("button", { name: "Continue your game: Turn 1 of 8, The Attribution Gap" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(pauseHeading);
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();

    await page.getByRole("button", { name: "Stop here" }).click();
    await page.getByRole("button", { name: "Back to the start" }).click();
    await expect(page.getByRole("button", { name: LABEL.start })).toBeVisible();
    await page.getByRole("button", { name: LABEL.resume }).click();
    await page.getByRole("button", { name: LABEL.keepGoing }).click();
    await expect(page.getByRole("button", { name: LABEL.continueToForecast })).toBeVisible();
    expect(await scenarioTitle(page)).not.toBe("The Attribution Gap");
  });

  test("a finished game reopens at its debrief until Play a new world", async ({ page }) => {
    await startGame(page, "RESUME-END");
    await playToDebrief(page);
    const ending = await page.getByRole("heading", { level: 1 }).innerText();
    await page.getByRole("button", { name: "Show as JSON" }).click();
    const summary = await page.getByLabel("Run summary", { exact: true }).innerText();
    await savedStage(page).toBe("debrief");

    await page.reload();
    await page.getByRole("button", { name: "Continue your game: your debrief" }).click();
    await expect(page.getByTestId("debrief")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(ending);
    await expect(page.getByText("Weighing the options you had")).toHaveCount(0, { timeout: 10_000 });
    await page.getByRole("button", { name: "Show as JSON" }).click();
    expect(await page.getByLabel("Run summary", { exact: true }).innerText()).toBe(summary);

    await page.getByRole("button", { name: "Play a new world" }).click();
    await expect(page.getByRole("button", { name: LABEL.start })).toBeVisible();
    await expect(page.getByRole("button", { name: LABEL.resume })).toHaveCount(0);
    expect(await storedSave(page)).toBeNull();
  });
});
```

The first test checks four things. Stage `"pause"` restores to Phase 12's card, using the `before` snapshot that replay rebuilds. Focus lands on the pause h1. Back to the start keeps the game. Keep going then plays on into turn 2. The second test checks that a finished game resumes with the same ending and the same run summary. The luck tags are recomputed from the replayed decision states. Play a new world then clears the save.

**Step 2: Run it and watch it fail.**

```bash
lsof -ti tcp:4173
npx playwright test e2e/engagement.spec.ts -g "save and resume: pausing and finishing"
```

Expected: both fail.
- The pause test fails at `getByText(/kept in this browser/)` with `element(s) not found`.
- The debrief test fails at `toHaveCount(0)` for `LABEL.resume`. The title still offers the save it read when the page opened, because Play a new world does not clear it yet.

**Step 3: Implement.**

(a) `src/ui/App.tsx`. Replace the save import added in Task 14.4:

```tsx
import { makeSave, resumeLabel, writeSave, type Stage } from "./save";
```

with:

```tsx
import { clearSave, makeSave, resumeLabel, writeSave, type Stage } from "./save";
```

Replace Phase 12's `backToStart` function, including its doc comment. Find it with `grep -n "function backToStart" src/ui/App.tsx`: exactly one match, and `grep -n "reset()" src/ui/App.tsx` finds exactly one call, inside it. Phase 12 wrote:

```tsx
  /** Play again on the debrief, and Back to the start on the pause: keep a facilitator's edited assumptions, drop the seed for a new world. */
  function backToStart() {
    const params = new URLSearchParams(window.location.search);
    params.delete("seed");
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
    reset();
  }
```

Replace it with:

```tsx
  /**
   * Back to the title, keeping a facilitator's edited assumptions and dropping the seed. Play a new world
   * forgets the kept game; Back to the start on the pause keeps it, so the title offers Continue your game.
   */
  function backToStart(forget: boolean) {
    const params = new URLSearchParams(window.location.search);
    params.delete("seed");
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
    if (forget) {
      clearSave(storage);
      setSaved(null);
    } else {
      setSaved(savedGame());
    }
    reset();
  }
```

`savedGame()` rereads storage here, so the title offers exactly what is stored, which is the pause the save effect has just written. Where storage is blocked it offers nothing, rather than an in-memory game the note would misdescribe.

Change the two call sites. In the Debrief branch, replace `          onRestart={backToStart}` with:

```tsx
          onRestart={() => backToStart(true)}
```

In the pause branch, inside `<FirstDecision … />`, replace `            onRestart={backToStart}` with:

```tsx
            onRestart={() => backToStart(false)}
```

If Phase 12 kept the Debrief's handler inline instead of sharing `backToStart`, do this instead. Put `clearSave(storage); setSaved(null);` directly before that handler's `reset();`. Put `setSaved(savedGame());` directly before the `reset();` in the pause's handler. `grep -n "reset()" src/ui/App.tsx` must then show that every `reset()` call is preceded by one of the two.

(b) `src/ui/copy.ts`. Directly after the closing `}` of `export function stopHereNote(seedCode: string): string { … }` (Phase 12), add:

```ts

/** Beside the world link when this browser keeps the game (DECISIONS.md F7): the link replays the world; the save continues this game. */
export const SAVED_HERE_NOTE =
  "Your game itself is kept in this browser. Come back to AI 2032 here and choose Continue your game to carry on where you stopped.";
```

The note contains no simulated statistic and none of the banned verdict words. `stopHereNote`'s own text ("…It is not saved progress: your choices so far are not in it…") stays as it is: it describes the link, which is still true, and Phase 12's copy test pins it.

(c) `src/ui/screens/FirstDecision.tsx`:
- In the `../copy` import, add `SAVED_HERE_NOTE` to the imported names.
- In the `../useGame` import (`import { pub } from "../useGame";`), add `storage`: `import { pub, storage } from "../useGame";`.
- In the Stop here panel, directly after the line `          <p className="mt-2 text-sm">{stopHereNote(view.seedCode)}</p>`, add:

```tsx
          {storage && <p className="mt-2 text-sm font-semibold">{SAVED_HERE_NOTE}</p>}
```

The note shows only where the browser gives the page storage. Where storage is blocked, the game is not kept, and the page does not claim it is.

**Step 4: Run it and watch it pass.**

```bash
npx tsc --noEmit
npx eslint .
npm run test
lsof -ti tcp:4173
npx playwright test e2e/engagement.spec.ts e2e/polish.spec.ts
```

Expected:
- `tsc` and `eslint` print nothing, and every Vitest file passes, including Phase 12's copy tests.
- Every engagement and polish test passes: the 9 in the two save-and-resume blocks and all of Phase 12's pause tests.
- Phase 12's "Stop here offers a link…" test still finds the title after Back to the start, with the seed dropped and `cfg` kept.
- Phase 12's "a run that pauses, opens Stop here and keeps going matches a replay from the world link" still passes. Starting the reopened world replaces the kept game, which does not change the run.
- The polish axe walk and phone test open Stop here, so they now also cover the new note in light and dark and at 360px.

Hidden-information check, unchanged from Phase 12. Expected: no output.

```bash
grep -nE "view\.(current|truth|debrief|history)|halfWidth|visibleEffects|oddsAtTheTime|published|assumptionsOf|defaults" src/ui/screens/FirstDecision.tsx
```

**Step 5: Commit.**

```bash
git add src/ui/App.tsx src/ui/copy.ts src/ui/screens/FirstDecision.tsx e2e/engagement.spec.ts
git commit -m "feat(ui): keep the game through the pause, forget it on Play a new world

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

### Task 14.6: Record the decision: `DECISIONS.md` and `README.md`

**Files:**
- Modify: `DECISIONS.md` (row F7; one phrase in row F6)
- Modify: `README.md` (line 5; the `src/ui/` row of "How the project is organised", line 69; the `npm run test` and `npm run e2e` rows of the command table, lines 18 and 25)

**Step 1: Write the failing test.**

```bash
grep -c "Approved by the designer on .*built in Phase 14" DECISIONS.md
grep -c "Continue your game" README.md
```

**Step 2: Run it and watch it fail.** Expected: `0` and `0`.

**Step 3: Implement.**

(a) `DECISIONS.md`. Find row F7 with `grep -n "^| F7 |" DECISIONS.md` (Phase 8 wrote it for D8; its Decision cell begins "Optional: built in Phase 14 only if the designer approves"). Replace the whole row with the row below. Keep the row's number; it is F7 in Phase 8's plan. Replace `<date>` with the approval date from Task 14.0.

```markdown
| F7 | Saved progress (spec Section 13 lists saved games as out of scope; spec Section 14 and handoff Section 2 keep all state in memory) | **Approved by the designer on <date>; built in Phase 14.** One game per browser is kept in `localStorage` under `ai-2032:save:v1` as `{ v, contentId, seedCode, cfg, actions, stage, resolved, at }`. These are the player's own inputs, the opaque seed code and public labels (the turn, the phase, the scenario id and the screen). The game state is never stored: no world, no true metrics, no queue, no odds, no outcomes. The save is rewritten after every step. Resuming replays the actions through the same session reducer (`src/ui/session.ts`), so determinism rebuilds the game, the view before the last turn resolved and every decision state exactly. The engine does not change. The title screen offers "Continue your game: Turn N of 8, <scenario>" (or "…: your debrief") as a quiet button under the main one, with "Saved in this browser only. Starting a new game replaces it." It appears only when the save replays on this build and was made under this page's facilitator edits (`cfg`). `contentId` is FNV-1a over the content plus a hand-bumped `SAVE_FORMAT`; a unit test pins one replayed game so that an engine change forces the bump. The game never resumes by itself. A save that no longer lands on the turn, phase, scenario and screen it recorded is discarded. Starting a new game replaces the save. A finished game reopens at its debrief until **Play a new world** clears it. **Back to the start** on the first-decision pause keeps it, and the Stop here panel says so. Storage errors are ignored, and without storage the game plays as before with no offer. There is one slot, so two tabs overwrite each other. A seed link still reproduces a world, not progress, and nothing is sent anywhere | A 25-minute game on a phone is often interrupted. Storing inputs rather than state keeps hidden values out of storage, where anyone can read them in the browser's developer tools, and needs no engine change. Opt-in resume keeps a reload and a shared link opening the title screen, as players and the seed round-trip test expect. Clearing the save on Back to the start would contradict the pause's note that the game is kept |
```

Then, in row F6 (the taster, D7, which Phase 12 rewrote), replace the phrase `and offers Back to the start, which behaves like Play again` with:

```markdown
and offers Back to the start, which returns to the title like Play a new world but keeps the saved game (F7)
```

If Phase 13 had already changed "Play again" to "Play a new world" in that phrase, match its current wording. `grep -n "Back to the start" DECISIONS.md` must then show the new wording in F6 and the mention in F7.

(b) `README.md`, line 5. Replace:

```markdown
Static single-page app: no backend, no accounts, no database, no analytics. Nothing a player does leaves their browser.
```

with:

```markdown
Static single-page app: no backend, no accounts, no database, no analytics. Nothing a player does leaves their browser. A game in progress is kept in that browser's own storage, as the seed code and the list of actions taken (never the hidden world), so a player can close the tab and later choose **Continue your game** on the title screen; starting a new game replaces it and **Play a new world** clears it.
```

(c) `README.md`, the `src/ui/` row of "How the project is organised". Replace:

```markdown
| `src/ui/` | React screens that render `displayed(state)`. The raw game state never leaves `useGame.ts` |
```

with:

```markdown
| `src/ui/` | React screens that render `displayed(state)`. The raw game state stays in `useGame.ts` and the two window-free modules it uses: `session.ts` (the session reducer, which also replays a saved game) and `save.ts` (what a save holds, and the checks before one is resumed) |
```

(d) `README.md`, command table. In the `npm run test` row, replace `Engine, content and copy-rule tests (Vitest)` with `Engine, content, copy-rule and save-and-replay tests (Vitest)`. In the `npm run e2e` row, replace `keyboard play, reproducibility.` with `keyboard play, reproducibility, save and resume.`. If an earlier phase reworded either cell, add the same words to its current list.

**Step 4: Run it and watch it pass.**

```bash
grep -c "Approved by the designer on .*built in Phase 14" DECISIONS.md
grep -c "^| F7 |" DECISIONS.md
grep -c "Continue your game" README.md
grep -n "Nothing a player does leaves their browser" README.md
```

Expected:
- `1`, `1` and `1`: the F7 row was replaced, not duplicated.
- The last `grep` shows line 5 still contains the sentence.
- `<date>` appears nowhere: `grep -n "<date>" DECISIONS.md` prints nothing.

**Step 5: Commit.**

```bash
git add DECISIONS.md README.md
git commit -m "docs: record save and resume (D8, F7) as approved and built

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

### Phase 14 gate

Stop any server on port 4173 first (`lsof -ti tcp:4173` must print nothing), then run the full local gate from the repository root (D10: CI has never run on GitHub):

```bash
npm run lint && npm run test && npm run balance && npm run build && npm run e2e
du -sk dist
```

What must be true:
1. **All gates pass.** Lint, every Vitest file (including `tests/ui/session.test.ts`, 16 tests, and `tests/ui/save.test.ts`, 39 tests), balance, the build and every e2e test pass. The e2e run includes the two save-and-resume blocks (9 tests) and all earlier specs unchanged. Balance output is identical to the Phase 13 gate, because this phase touches no content.
2. **Bundle size.** `du -sk dist` prints a number below `16384`.
3. **Engine and content untouched.** `git diff --stat <commit recorded in Task 14.0> -- src/engine src/content` prints nothing.
4. **Storage is used in one place.** `grep -rn "localStorage" src` shows only `src/ui/useGame.ts`. `grep -rn "ai-2032:save" src` shows only `src/ui/save.ts`.
5. **Hidden information stays out.** The unit test "the player's own inputs and public labels, and nothing from the hidden world" and the e2e test "the stored save holds only the player's own inputs" both pass. `grep -nE 'GameState|from "\.{1,2}/session"' src/ui/App.tsx src/ui/screens/*.tsx src/ui/components/*.tsx` prints nothing: no component touches the raw state or the session module.
6. **Never auto-resume.** The polish seed round-trip test and phone test pass unchanged. A reload or a seed link opens the title screen.

Then update `docs/plan.md`. In the Phase 14 block Phase 8 added, mark the phase line and both sub-items done:
- Change ``- [ ] 🟨 **Phase 14 (optional): Save and resume**, only if the designer approves `DECISIONS.md` F7`` to ``- [x] 🟩 **Phase 14 (optional): Save and resume**, approved by the designer on <date> (`DECISIONS.md` F7)``.
- Change the two sub-items from `- [ ] ⬜` to `- [x] 🟩`.

Phase 14 now counts toward progress: add its 2 steps to the total. Recompute the `**Overall Progress:**` line as checked build steps over all build steps. With Phase 8's counts and no lines added since, that is 62 of 65, or 95%; count the lines as they actually stand. Then commit the branch; do not push (the branch is pushed at the Phase 15 gate, or earlier if the designer asks). Per D10, do not merge and do not deploy.

```bash
git add docs/plan.md
git commit -m "docs: Phase 14 gate green (save and resume)

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

There is no designer stop at this gate: continue to Phase 15. Phase 15's extended axe, overflow and keyboard sweep should include the title with the continue offer and the Stop here panel with the new note. These items are open for people, never claimed as done: whether playtesters notice and use "Continue your game", and whether anyone finds keeping a game in the browser unwelcome on a shared device.


---

## Phase 15: Accessibility sweep, docs and handover

**Goal:** Prove that every state Phases 9 to 14 added meets the accessibility bar in light and dark, at desktop and phone width, by keyboard and under reduced motion; then hand the redesign over, with the README, `DECISIONS.md` and `docs/plan.md` brought up to date, a playtest and timing protocol written, the human-only items listed as open, and a pull request prepared for the designer.

**Handoff items addressed:** suggested next step 6 ("proceed with appropriate responsive, keyboard and accessibility checks"); step 5 (validate with newcomers: the protocol in Task 15.6); the constraints "Maintain reduced-motion support, keyboard operation and readable layouts at smaller widths" and "Preserve the local, no-account nature of the experience"; the audience clarification (README, Task 15.7). Contract non-negotiables 8 (accessibility) and 9 (no new dependencies), decision D10 (branch and pull request, every gate local).

**Depends on:** every earlier phase's gate being green, and the designer reviews at the Phase 11 and Phase 13 gates being done. By name:
- Phase 8: `LABEL` in `e2e/play.ts`; `data-testid="debrief"` on the Debrief root; waiting `finishTurn` and `playToDebrief`; `DECISIONS.md` decision 14 and section F with its bold status sentence; the Phase 8 to 15 blocks in `docs/plan.md` and the progress rule there (optional Phase 14 counts only if approved); the e2e baseline recorded there (`17 passed in <PW> s` before any change, `19 passed in <PW8> s` at the Phase 8 gate).
- Phase 9: `LABEL.start` is "Try your first decision"; the seed field sits in a `<details>` whose summary reads "Play the same world as a friend" and whose label starts "Seed code".
- Phase 10: the forecast's "Compare with your advisers" button and the sentence "You said N%. Your advisers range from A% to B%." (or "…all say N%."); `BriefingRecap`, a `<details id="briefing-recap">` at the foot of the forecast and decision steps.
- Phase 11: `ChoicePreview`, whose heading reads "If you choose option X" once an option is picked; `TrackLadder`; the four-part News; the `.bg-ink :focus-visible` rule and the sticky confirm bar's `scroll-padding-bottom` in `theme.css`.
- Phase 12: `LABEL.keepGoing` and `LABEL.pauseHeading` ("That was your first decision"); `TurnPlan.stopAtPause`; the "Stop here" toggle (`aria-expanded`) and its panel `#stop-here` with "Copy link to this world" and "Back to the start"; the keyboard test already walks Keep going; the phone test already checks the pause for sideways scroll.
- Phase 13: accordion panels (`h2 > button[aria-expanded]`); headings containing "At a glance" and "Talk it over"; `openAllPanels` in `e2e/play.ts`, imported by `e2e/polish.spec.ts`, and already called before the debrief axe scan and before `overflows("debrief")`.
- Phase 14, whichever way the designer decided. If built: `src/ui/save.ts`; `LABEL.resume` (`/^Continue your game/`) in `e2e/play.ts`; the title's "Continue your game" offer beside "Forget this game"; and Task 14.6's README sentences. Phase 14's own axe test on that offer (in `e2e/engagement.spec.ts`) still uses the old filter (WCAG tags only, serious and critical only) and runs only at 360 wide, so Task 15.2 adds a scan of the title with the continue offer at the B42 bar, at desktop and phone width. If declined: Task 14.0 already replaced the Phase 14 block in `docs/plan.md` with one "not built" line and marked `DECISIONS.md` F7 not approved.
- Phase 8 also rewrote the shared axe check `expectNoSeriousViolations` in `e2e/polish.spec.ts`. It keeps its name, but it now runs axe's `best-practice` rules as well as WCAG 2.2 AA and fails on a violation at any impact (`DECISIONS.md` B42 as Phase 8 amended it). Each failure line reads `<state>: <impact> <rule> (<count>) <selector>`, and the original walk is now called `axe finds no violations on any screen`. Every new axe test in this phase uses that check, so it holds the new states to the same bar.
- Pull request #2 (branch `fix/estimate-halfwidth-leak`, the `Estimate.halfWidth` fix, which adds `DECISIONS.md` B43) was merged into this branch (in Phase 8 Task 8.1 Step 2, or later if the designer chose to wait for it) only if it had merged on GitHub. `grep -c halfWidth src/engine/types.ts` prints `0` if it is in. Task 15.9 branches on this.

This phase changes no file under `src/engine/**` or `src/content/**`, adds no dependency, and adds no feature. Its only product change is whatever accessibility fix the new tests force (Tasks 15.2 to 15.5).

Conventions for every task in this phase:

- Run every command from the repository root (`git rev-parse --show-toplevel`). Shell variables do not carry from one command block to the next, so every block below that needs a variable sets it itself.
- `main` means GitHub's `main`: run `git fetch origin` and use `origin/main`. The worktree's local `main` may be stale (at planning time it was one commit ahead of GitHub's and did not include pull request #2).
- Before any Playwright run, `lsof -nP -iTCP:4173 -sTCP:LISTEN` must print nothing; stop any process it lists (`kill <PID>`). `npx playwright test <file>` builds the bundle first.
- Never use `git stash`. To undo a temporary edit, `git checkout -- <file>` on that file only, and only when `git status --short` showed it clean before the edit.
- Commit messages below give the subject and body. Add the attribution trailer your session requires.
- Planning measurements quoted below were taken on commit `a11ef34` on a 10-core Mac.

### Before you start

```bash
git branch --show-current
git status --short
lsof -nP -iTCP:4173 -sTCP:LISTEN
grep -n "keepGoing\|pauseHeading\|stopAtPause\|export async function openAllPanels" e2e/play.ts
grep -n "^import" e2e/polish.spec.ts
grep -n "async function expectNoSeriousViolations(page: Page, where: string)" e2e/polish.spec.ts
grep -n '"best-practice"' e2e/polish.spec.ts
grep -n "axe finds no violations on any screen" e2e/polish.spec.ts
grep -n 'focusOn(/^Keep going' e2e/polish.spec.ts
grep -n "Play the same world as a friend" src/ui/screens/Title.tsx
grep -n "Compare with your advisers" src/ui/screens/Forecast.tsx
grep -n "Your advisers range from\|Your advisers all say" src/ui/copy.ts
grep -n 'id="briefing-recap"' src/ui/components/BriefingRecap.tsx
grep -n "BriefingRecap" src/ui/screens/Decision.tsx
grep -n "If you choose option" src/ui/components/ChoicePreview.tsx
grep -n 'id="stop-here"\|Copy link to this world\|Back to the start' src/ui/screens/FirstDecision.tsx
grep -rn "At a glance\|Talk it over" src/ui/debrief src/ui/screens/Debrief.tsx | head -4
grep -n "bg-ink :focus-visible\|scroll-padding-bottom" src/ui/theme.css
test -f src/ui/save.ts && echo PHASE-14-RAN || echo PHASE-14-NOT-TAKEN
grep -n "resume: /^Continue your game/" e2e/play.ts
grep -c halfWidth src/engine/types.ts
grep -nE '^- \[.\] .*\*\*Phase (8|9|1[0-5])' docs/plan.md
```

Expected:

- The branch is the feature branch the redesign has used since Phase 8 (`redesign/public-engagement` if Phase 8 had to create one), never `main`. `git status --short` and `lsof` print nothing.
- Every `grep -n` prints at least one line, except `grep -n "resume: …"`, which prints a line only if Phase 14 was built (it must print one exactly when `PHASE-14-RAN` prints). `grep -c halfWidth` prints `0` if pull request #2 is in this branch and `1` if not; note which, for Task 15.9 and the completion report. If `"best-practice"` or `axe finds no violations on any screen` is missing, Phase 8's stricter axe check is not in place: stop and ask, because its gate was not met. The `./play` import in `e2e/polish.spec.ts` includes `LABEL`, `openAllPanels`, `playToDebrief`, `playTurn` and `startGame`, the five helpers this phase's blocks use; if one is missing, add it to that import statement (do not add a second import from `./play`). The keyboard test already contains Phase 12's Keep going line.
- `docs/plan.md` shows Phases 8 to 13 ticked `- [x] 🟩`, with the designer reviews at the Phase 11 and Phase 13 gates recorded, and the Phase 14 line either `- [x] 🟩` (built) or `- [x] ⬜ … not built` (declined). If it is still `- [ ] ⬜` or `- [ ] 🟨`, Phase 14 is undecided or unfinished: stop and ask the designer. Note which of `PHASE-14-RAN` or `PHASE-14-NOT-TAKEN` printed: Tasks 15.2, 15.7, 15.8 and 15.9 and the gate branch on it.

If a hook `grep` prints nothing, the earlier phase named it differently. Find the real name (for example `grep -rn "friend" src/ui/screens/Title.tsx`) and use it in the constants at the top of the Task 15.2 code, which is the only place each hook is spelled. If a whole feature is missing, stop and ask the designer: that phase's gate was not met.

Then run the full local gate once, unchanged, to confirm the previous gate still holds and to time the suite before this phase adds anything:

```bash
npm run lint && npm run test && npm run balance && npm run build && du -sk dist && /usr/bin/time -p npm run e2e
```

Expected: all green; `du -sk dist` under 16384. Write down `<N14>`, the count in Playwright's `N passed (…s)` line, and `<PW14>`, its seconds. This is the suite as Phases 9 to 14 left it.

### Task 15.1: Playwright timeout and server reuse

**Files:**
- Modify: `playwright.config.ts` (whole file; no other phase edits it)
- Modify: `DECISIONS.md` (one new row at the end of the section B table)
- Test: a shell check, then `npx playwright test --list`

Why, in two parts:

- **The timeout.** Several tests play one or two whole games (reproducibility, the facilitator link, both original axe walks, the taster replay), and the redesign added clicks to every turn: disclosures, a preview, the pause after turn 1. This phase adds walks that scan up to eleven states each. At `a11ef34` the slowest test took 5.4 s on the planning machine (10 cores, 5 workers), but a CI runner has two to four cores and Playwright uses half of them as workers, so the same test runs several times slower there. Playwright's default of 30 seconds would leave too little headroom; 60 seconds does, without letting a hang run for long.
- **Server reuse.** With `reuseExistingServer: true`, Playwright tests whatever is already listening on port 4173. A `vite preview` left running from an earlier session serves the bundle it was started with, so a run can pass against code that no longer exists. On CI that must never happen, so CI now always builds and serves afresh. Locally, reuse stays (it saves a build while iterating), and the stale-server check in the conventions above is the guard.

**Step 1: Write the failing test**

```bash
grep -c "timeout: 60_000\|reuseExistingServer: !process.env.CI" playwright.config.ts
```

**Step 2: Run it and watch it fail**

Expected: `0`.

**Step 3: Implement**

Replace the whole of `playwright.config.ts`. It currently reads (unchanged since `a11ef34`):

```ts
import { defineConfig, devices } from "@playwright/test";

// Browser tests run against the production bundle, which is what players get and
// what the 3-second counterfactual budget must be measured on.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL: "http://localhost:4173", ...devices["Desktop Chrome"] },
  webServer: {
    command: "npm run build && npm run preview -- --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
```

New:

```ts
import { defineConfig, devices } from "@playwright/test";

// Node supplies `process` when Playwright loads this file; the project has no
// @types/node (runtime and dev dependencies are fixed), as in scripts/balance.ts.
declare const process: { env: Record<string, string | undefined> };

// Browser tests run against the production bundle, which is what players get and
// what the 3-second counterfactual budget must be measured on.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: "list",
  // Several tests play one or two whole games, and the public-audience redesign
  // added clicks to every turn (disclosures, a preview, the pause card after
  // turn 1). The 30-second default left too little headroom.
  timeout: 60_000,
  use: { baseURL: "http://localhost:4173", ...devices["Desktop Chrome"] },
  webServer: {
    command: "npm run build && npm run preview -- --port 4173 --strictPort",
    url: "http://localhost:4173",
    // CI always builds and serves a fresh bundle. Locally, a preview server
    // already on port 4173 is reused, and it may be serving an old build: before
    // a gate run, `lsof -nP -iTCP:4173 -sTCP:LISTEN` must print nothing.
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

The `declare const process` line follows `scripts/balance.ts:26`: the project has no `@types/node` and may not add it (DECISIONS.md decision 8), and without the line `tsc` fails with `TS2591: Cannot find name 'process'` (checked during planning).

Add one row to `DECISIONS.md`, as the last row of the section B table: on a new line directly after the table's current last row and before the blank line that precedes `## C. Places where the spec's own tables break its rules`. Number it one above the highest B number in the file:

```bash
grep -oE '^\| B[0-9]+' DECISIONS.md | sed 's/| B//' | sort -n | tail -1
```

(At `a11ef34` this prints `42`, so the row would be B43; use whatever the command prints, plus one.)

```markdown
| B<n> | Playwright timeout and server reuse | A browser test may take 60 seconds (Playwright's default is 30). The preview server on port 4173 is reused only when not on CI; on CI the suite always builds and serves the bundle afresh. Before a local gate run, `lsof -nP -iTCP:4173 -sTCP:LISTEN` must print nothing | Several tests play one or two whole games, and the redesign added clicks to every turn. A preview left running from an earlier session serves an old bundle, so a local gate could pass against code that no longer exists |
```

**Step 4: Run it and watch it pass**

```bash
grep -c "timeout: 60_000\|reuseExistingServer: !process.env.CI" playwright.config.ts
npx tsc --noEmit
npx eslint playwright.config.ts
npx playwright test --list | tail -1
```

Expected: `2`; `tsc` and `eslint` print nothing; the last line is `Total: <N14> tests in <F> files`, the same count as before, which shows the config loads.

**Step 5: Commit**

```bash
git add playwright.config.ts DECISIONS.md
git commit -m "chore(e2e): 60-second test timeout; reuse a preview server only off CI" -m "Full-game tests and the redesign's extra clicks per turn left little headroom under the 30-second default. A reused preview could serve an old bundle, so CI now always builds afresh. Logged as DECISIONS.md B<n>. Suite before this phase's tests: <N14> passed in <PW14> s."
```

### Task 15.2: axe on the redesigned opening and first turn, light and dark

**Files:**
- Modify: `e2e/polish.spec.ts` (append one block at the end of the file)
- Modify, only if a test forces a fix: the `src/ui/**` file that renders the offending element
- Test: `e2e/polish.spec.ts`

The existing axe walk (`axe finds no violations on any screen`, as Phase 8 renamed it) starts at `/?facilitator=1`, commissions analysis before scanning the decision, scans the investment before a track is picked, and never opens the new disclosures. This block adds one walk a first-time visitor would take, from the bare title (no seed, no facilitator panel), through the friend disclosure and every new affordance on turn 1, to the pause card with Stop here open. It scans eleven states in each scheme: the title, the title with the friend disclosure open, the briefing, the forecast, the forecast with advisers compared, the decision with a preview, the decision with the briefing recap open, the investment ladder with a track picked, the consequences, the pause card, and the pause card with Stop here open. Some of these are also scanned by walks earlier phases extended; this is the one place that covers every state the phase brief lists, in one path a reviewer can read. Every scan uses Phase 8's shared check, so any violation at any impact fails, best-practice rules included (heading order, one h1, landmarks). If Phase 14 was built, a second block scans the title with the continue offer, at desktop and at phone width.

`settle` waits for any running transition to finish, so a fading element is never scored mid-fade. The hooks are named constants at the top of the block, the only place each is spelled.

**Step 1: Write the failing test**

Check the names the block defines are free (an earlier phase could have used one):

```bash
grep -nE "\b(FRIEND|COMPARE|COMPARED|RECAP|PREVIEW|STOP_PANEL|settle|openBriefingRecap|walkFirstTurn)\b" e2e/polish.spec.ts
```

Expected: no output. If a name is taken, give the new one a `sweep` prefix throughout this block.

Append to the end of `e2e/polish.spec.ts`, after the last test's closing `});`:

```ts
// ---------------------------------------------------------------- the public-audience redesign: the Phase 15 sweep
// Every state Phases 9 to 14 added, scanned by axe in light and dark; the new screens
// at phone width, where nothing may scroll sideways or move under reduced motion; the
// debrief as it opens, fully open and fully closed; focus rings and the pause card by keyboard.

/** Hooks the sweep steers by, confirmed before Task 15.1. If an earlier phase named one differently, change it here only. */
const FRIEND = "Play the same world as a friend";                // Phase 9: the title's seed disclosure
const COMPARE = "Compare with your advisers";                     // Phase 10: the forecast's reveal button
const COMPARED = /^You said \d+%\. Your advisers/;                // Phase 10: the sentence the reveal adds
const RECAP = "#briefing-recap";                                  // Phase 10: BriefingRecap's <details>
const PREVIEW = /^If you choose option [A-Z]$/;                   // Phase 11: ChoicePreview's heading once an option is picked
const STOP_PANEL = "#stop-here";                                  // Phase 12: the panel that Stop here opens

/**
 * Waits two frames, then for every running transition or finite animation to finish,
 * so axe never scores a half-faded element. An endless animation is skipped, not awaited.
 */
async function settle(page: Page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const finite = document.getAnimations().filter((animation) => animation.effect?.getComputedTiming().endTime !== Infinity);
    await Promise.all(finite.map((animation) => animation.finished.catch(() => undefined)));
  });
}

/** Opens the briefing recap on the current step. */
async function openBriefingRecap(page: Page) {
  const recap = page.locator(RECAP);
  await recap.locator(":scope > summary").click();
  await expect(recap).toHaveJSProperty("open", true);
}

/**
 * A first-time visitor's path: the bare title, the friend disclosure, then turn 1
 * with every new affordance used, ending on the pause card with Stop here open.
 * Calls `at` in each state.
 */
async function walkFirstTurn(page: Page, seedCode: string, at: (where: string) => Promise<void>) {
  await page.goto("/");                                                        // no seed, no facilitator panel
  await at("title");
  await page.locator("summary", { hasText: FRIEND }).click();
  await expect(page.getByLabel(/^Seed code/)).toBeVisible();
  await at("title with the friend disclosure open");
  await page.getByLabel(/^Seed code/).fill(seedCode);
  await page.getByRole("button", { name: LABEL.start }).click();
  await at("briefing");

  await page.getByRole("button", { name: LABEL.continueToForecast }).click();
  await at("forecast");
  await page.getByRole("button", { name: COMPARE }).click();
  await expect(page.getByText(COMPARED).first()).toBeVisible();
  await at("forecast with advisers revealed");

  await page.getByRole("button", { name: LABEL.lockIn }).click();
  await expect(page.getByRole("group", { name: LABEL.decisionGroup })).toBeVisible();
  await page.locator('input[name="choice"]:enabled').first().check();
  await expect(page.getByRole("heading", { name: PREVIEW })).toBeVisible();
  await at("decision with a preview");
  await openBriefingRecap(page);
  await at("decision with the briefing recap open");

  await page.getByRole("button", { name: LABEL.confirm }).click();
  await expect(page.getByRole("group", { name: LABEL.investGroup })).toBeVisible();
  await page.locator('input[name="track"]:enabled').first().check();
  await at("investment ladder");
  await page.getByRole("button", { name: LABEL.investIn }).click();

  await expect(page.getByRole("heading", { name: LABEL.newsHeading })).toBeVisible();
  await at("news");
  await page.getByRole("button", { name: LABEL.next }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(LABEL.pauseHeading);
  await at("pause card");
  await page.getByRole("button", { name: "Stop here" }).click();
  await expect(page.locator(STOP_PANEL)).toBeVisible();
  await at("pause card with Stop here open");
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe finds no violations on the redesigned opening and first turn (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await walkFirstTurn(page, "AXE-NEW1", async (where) => {
      await settle(page);
      await expectNoSeriousViolations(page, where);
    });
  });
}
```

Only if `PHASE-14-RAN` printed before Task 15.1, append this block as well. It uses `LABEL.resume`, which exists only when Phase 14 was built, so leave it out otherwise or the file will not compile:

```ts
// Phase 14's continue offer, at the B42 bar (Phase 14's own test uses the old serious-only filter, at 360 wide only).
for (const colorScheme of ["light", "dark"] as const) {
  test(`axe finds no violations on the title with the continue offer (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await startGame(page, "AXE-RESUME");
    await playTurn(page);                                                        // past the pause: the game is now kept
    await expect
      .poll(async () => JSON.parse((await page.evaluate(() => window.localStorage.getItem("ai-2032:save:v1"))) ?? "{}").stage)
      .toBe("briefing");                                                         // the save is written by an effect: wait for it
    await page.goto("/");
    await expect(page.getByRole("button", { name: LABEL.resume })).toBeVisible();
    await settle(page);
    await expectNoSeriousViolations(page, "title with the continue offer");
    await page.setViewportSize({ width: 360, height: 740 });
    await settle(page);
    await expectNoSeriousViolations(page, "phone title with the continue offer");
  });
}
```

Write down `<S>`, the number of tests this phase adds: 9 without the continue-offer block, 11 with it.

**Step 2: Run it and watch it fail**

```bash
npx tsc --noEmit && npx playwright test e2e/polish.spec.ts -g "opening and first turn|continue offer"
```

Two outcomes are possible:

- Failures of the form `Expected: []` / `Received: ["<state>: <impact> <rule> (<count>) <selector>"]`, for example `"decision with the briefing recap open: moderate heading-order (1) #briefing-recap h2"`. Each line is a real defect on a new state. Note them all and fix them in Step 3.
- `2 passed` (`4 passed` with the continue-offer block), because Phases 9 to 14 already met the bar. Then prove the walk can fail. On a clean tree (`git status --short` prints only `M e2e/polish.spec.ts`), break the light theme's muted text:

  ```bash
  printf '\n:root { --muted: #a09c94; }\n' >> src/ui/theme.css
  npx playwright test e2e/polish.spec.ts -g "opening and first turn .light."
  git checkout -- src/ui/theme.css
  ```

  Expected: `1 failed`, with at least one `…: serious color-contrast (…)` line in the received list, the first normally `title: serious color-contrast (…)` (`#a09c94` on the paper colour is about 2.5:1, and every screen has muted text). After the `git checkout`, `git status --short` shows only `M e2e/polish.spec.ts`.

**Step 3: Implement**

Fix every violation at its source, in the component that renders the node axe names. Never suppress a rule, never add `.disableRules()` or `.exclude()`, and never loosen a test. If a fix would break a non-negotiable or a decision in `DECISIONS.md`, stop and ask. The likely rules and their fixes in this codebase:

| axe rule | Likely cause here | Fix |
| --- | --- | --- |
| `color-contrast` | `text-muted` on an inverted (`bg-ink text-paper`) surface such as a selected card, ladder rung or consequences summary; text given `opacity-50` or `opacity-60`; muted text on `bg-canvas` in dark mode | Inside inverted surfaces use `opacity-80`, as `Decision.tsx` does (`<span className={on ? "opacity-80" : "text-muted"}>`); never put `text-muted` on `bg-ink`; do not lower the opacity of text a player must read |
| `target-size` (WCAG 2.2) | a `<summary>`, a text button, an adviser mark on the forecast scale or a ladder rung smaller than 24 × 24 px with a neighbour closer than 24 px | Give the control `py-2` or `min-h-6 min-w-6`; a mark that only shows a value gets `aria-hidden="true"` and no role or handler |
| `nested-interactive` | a clickable card (`onClick` or `role="button"`) around the native radio, or a button inside a `<summary>` | Keep the native radio with its `<label htmlFor>` as the only control; take the role and handler off the wrapper |
| `scrollable-region-focusable` | an `overflow-x-auto` wrapper added so a table fits at 360px | Make the wrapper a named, focusable region: `<div role="region" aria-label="<table name>, scrolls sideways" tabIndex={0} className="overflow-x-auto">`. The `role="region"` matters: an `aria-label` on a `<div>` with no role is itself flagged (`aria-prohibited-attr`) |
| `aria-allowed-attr`, `aria-prohibited-attr` | `aria-label` on a `<div>` or `<span>` with no role; `aria-expanded` on something that is not a button | Give the element a role (`role="region"`, `role="img"`) or move the attribute to the button |
| `duplicate-id-aria` | `BriefingContent` rendered inside the recap beside the step's own copy of the same ids | Derive those ids with React's `useId()` in `BriefingContent` |
| `heading-order`, `page-has-heading-one`, `region`, `landmark-unique` (best-practice rules, which Phase 8 turned on) | a heading inside the briefing recap or the Stop here panel that skips a level; a second `h1`; content outside a landmark; two landmarks with the same name | Start each inserted block one level below its parent heading (`h2` under the step's `h1`, `h3` inside an `h2` section); keep exactly one `h1`; keep everything inside `<main>` or another landmark; give each `section` with `aria-labelledby` its own heading |

After each fix: `npx playwright test e2e/polish.spec.ts -g "opening and first turn|continue offer"`.

**Step 4: Run it and watch it pass**

```bash
npx tsc --noEmit && npx eslint e2e src/ui
npx playwright test e2e/polish.spec.ts
```

Expected: `tsc` and `eslint` print nothing; every test in `e2e/polish.spec.ts` passes, including `axe finds no violations on the redesigned opening and first turn (light)` and `(dark)`, and, if Phase 14 was built, `axe finds no violations on the title with the continue offer (light)` and `(dark)`.

**Step 5: Commit**

```bash
git add e2e/polish.spec.ts
git status --short    # add every src/ui file Step 3 changed
git commit -m "test(e2e): axe the redesigned opening and first turn in light and dark" -m "A first-time visitor's walk: the bare title, the friend disclosure, the forecast with advisers compared, the decision with a preview and the briefing recap, the investment ladder, the consequences and the pause card with Stop here open, scanned in both schemes at the B42 bar (any impact, best-practice rules included). <If Phase 14 was built: Also the title with the continue offer, at desktop and phone width.> <List any fixes, or: No fixes were needed.>"
```

### Task 15.3: The phone walk: axe at 360 × 740, no sideways scroll, nothing moves under reduced motion

**Files:**
- Modify: `e2e/polish.spec.ts` (append one block; one line added to the test `reduced motion is honoured, and no screen scrolls sideways on a phone`)
- Modify, only if a test forces a fix: the `src/ui/**` file responsible
- Test: `e2e/polish.spec.ts`

The same walk runs at 360 × 740 with `reducedMotion: "reduce"`, in light and dark. Every state is checked for sideways scroll and for motion. Each state is also checked for sideways scroll at 320 px wide, the width WCAG 2.2's reflow criterion (1.4.10) is judged at, then the viewport goes back to 360 before the next check. The current UI already has no sideways scroll at 320 on any screen (measured at `a11ef34`), so this adds little run time and catches a redesign regression the 360 check would miss. Phase 11 already checks the forecast, the decision with a preview, the investment and the consequences at 360 px, and Phases 12 and 13 the pause card and the open debrief, all in light only; this walk adds the title's friend disclosure, the forecast with advisers compared, the decision with the recap open and the investment ladder with a track picked, and runs the whole path in dark as well. axe runs on the title, the decision with a preview, the consequences, the pause card and the pause card with Stop here open.

`expectNoMotion` fails if any element transitions or animates for 1 ms or more, if any Web Animation is running for 1 ms or more, or if `<html>` scrolls smoothly. It covers any CSS transition an earlier phase introduced, because the global rule in `theme.css` (`transition-duration: 0.01ms !important` under `prefers-reduced-motion: reduce`) must win over it. A side effect worth knowing: that rule gives every property on every element a 0.01 ms transition, which finishes within a frame. The motion check reads durations, not values, so it needs no wait; the focus-ring check in Task 15.5 reads the outline colour, so it waits two frames first. JavaScript motion (`scrollIntoView({ behavior: "smooth" })`, `element.animate`) is not visible to computed styles, so Step 1 also reviews the source.

**Step 1: Write the failing test**

List every motion source the redesign added:

```bash
grep -rnE "transition|animate|duration-|motion-safe|smooth|isAnimationActive" src/ui
```

At `a11ef34` this printed two lines: `src/ui/theme.css` (the `transition-duration: 0.01ms !important` line) and `src/ui/debrief/CalibrationPanel.tsx` (`isAnimationActive={false}`). Phase 13 adds a third, already gated: the `scrollIntoView({ behavior: still ? "auto" : "smooth", … })` behind "Try a different choice here". For every other hit: a Tailwind `transition*`, `duration-*` or `animate-*` class is covered by the global rule and by the test below, as long as the element is on a walked screen or the debrief. A JavaScript smooth scroll or `element.animate` must be gated in code:

```ts
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
```

and any new Recharts series must set `isAnimationActive={false}`. Fix any ungated hit in Step 3.

Check the new names are free:

```bash
grep -nE "\b(PHONE_AXE|expectNoSidewaysScroll|expectNoMotion)\b" e2e/polish.spec.ts
```

Expected: no output.

Append to the end of `e2e/polish.spec.ts`:

```ts
/** States scanned by axe on the phone walk; every state on it is checked for overflow and motion. */
const PHONE_AXE = new Set(["title", "decision with a preview", "news", "pause card", "pause card with Stop here open"]);

async function expectNoSidewaysScroll(page: Page, where: string) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, where).toBeLessThanOrEqual(0);
}

/** Under prefers-reduced-motion nothing may transition, animate or smooth-scroll for 1 ms or more. */
async function expectNoMotion(page: Page, where: string) {
  const moving = await page.evaluate(() => {
    const longest = (list: string) =>
      Math.max(...list.split(",").map((part) => parseFloat(part) * (part.trim().endsWith("ms") ? 0.001 : 1)));
    const found: string[] = [];
    for (const element of Array.from(document.querySelectorAll("body *"))) {
      const style = getComputedStyle(element);
      const animated = style.animationName !== "none" && longest(style.animationDuration) >= 0.001;
      if (animated || longest(style.transitionDuration) >= 0.001) {
        found.push(`${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""} "${element.getAttribute("class") ?? ""}"`);
      }
    }
    for (const animation of document.getAnimations()) {
      const duration = animation.effect?.getTiming().duration;
      if (typeof duration === "number" && duration >= 1) found.push(`a running animation of ${duration} ms`);
    }
    if (getComputedStyle(document.documentElement).scrollBehavior !== "auto") found.push("smooth scrolling on <html>");
    return found;
  });
  expect(moving, where).toEqual([]);
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`on a phone the redesigned screens pass axe, never scroll sideways and hold still under reduced motion (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.setViewportSize({ width: 360, height: 740 });
    await walkFirstTurn(page, "PHONE-NEW1", async (where) => {
      await expectNoSidewaysScroll(page, `phone ${where}`);
      await page.setViewportSize({ width: 320, height: 740 });                    // WCAG 2.2 reflow width (1.4.10)
      await expectNoSidewaysScroll(page, `320 ${where}`);
      await page.setViewportSize({ width: 360, height: 740 });
      await expectNoMotion(page, `phone ${where}`);
      if (PHONE_AXE.has(where)) await expectNoSeriousViolations(page, `phone ${where}`);
    });
  });
}
```

In the test `reduced motion is honoured, and no screen scrolls sideways on a phone`, after Phases 12 and 13 its last lines read:

```ts
  await playToDebrief(page);
  await openAllPanels(page);
  await overflows("debrief");
});
```

Replace the last two lines of that test, which occur once in the file:

```ts
  await overflows("debrief");
});
```

with:

```ts
  await overflows("debrief");
  await expectNoMotion(page, "debrief with every panel open");
});
```

**Step 2: Run it and watch it fail**

```bash
npx tsc --noEmit && npx playwright test e2e/polish.spec.ts -g "hold still under reduced motion|no screen scrolls sideways"
```

If it fails, each message names the state (`phone news`, or `320 news` for the reflow check, for example) and what went wrong: an overflow in pixels, an axe rule, or a list of moving elements. Fix them in Step 3. If it passes at once, prove the motion check can fail, on a tree where only `e2e/polish.spec.ts` is modified:

```bash
printf '\n@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition-duration: 0.3s !important; } }\n' >> src/ui/theme.css
npx playwright test e2e/polish.spec.ts -g "hold still under reduced motion .light."
git checkout -- src/ui/theme.css
```

Expected: `1 failed` at `phone title`, received a list of elements beginning `div#root ""` (every element now transitions for 0.3 s; the planning run listed 42 on the old title).

**Step 3: Implement**

- Sideways scroll: the usual causes are a flex or grid child without `min-w-0`; a long unbroken string (a seed link: use `break-all`, as the Stop here panel does); a negative margin such as a sticky bar's `-mx-4` wider than its parent's padding; a table (wrap it in `<div role="region" aria-label="<table name>, scrolls sideways" tabIndex={0} className="overflow-x-auto">`); a forecast mark positioned at `left: 100%` (clamp it inside the scale).
- axe: see the table in Task 15.2.
- Motion: gate JavaScript motion as shown in Step 1; never remove or weaken the reduced-motion rule in `theme.css`.

**Step 4: Run it and watch it pass**

```bash
npx tsc --noEmit && npx eslint e2e src/ui
npx playwright test e2e/polish.spec.ts
```

Expected: every test in the file passes, including both `on a phone the redesigned screens pass axe, never scroll sideways and hold still under reduced motion` tests and `reduced motion is honoured, and no screen scrolls sideways on a phone`.

**Step 5: Commit**

```bash
git add e2e/polish.spec.ts
git status --short    # add every src/ui file Step 3 changed
git commit -m "test(e2e): phone walk with axe, sideways-scroll and reduced-motion checks" -m "At 360 x 740 under reduced motion, in light and dark: no sideways scroll on the forecast, decision, investment, consequences or pause card, at 360 and at 320 wide (WCAG 1.4.10); axe on the title, decision, consequences and pause card; nothing transitions, animates or smooth-scrolls, including on the debrief with every panel open. <List any fixes, or: No fixes were needed.>"
```

### Task 15.4: The debrief as it opens, fully open and fully closed, light and dark

**Files:**
- Modify: `e2e/polish.spec.ts` (append one block)
- Modify, only if a test forces a fix: `src/ui/debrief/**` or `src/ui/screens/Debrief.tsx`
- Test: `e2e/polish.spec.ts`

Phase 13's edit to the existing axe walk scans the debrief with every panel open. This block also scans it as a player first sees it (the four reference panels closed, At a glance and Talk it over on screen) and with every panel closed, and opens every panel again to scan after a what-if run, in both schemes. `closeAllPanels` mirrors Phase 13's `openAllPanels`.

**Step 1: Write the failing test**

```bash
grep -nE "\bcloseAllPanels\b" e2e/polish.spec.ts e2e/play.ts
```

Expected: no output. (If Phase 13 added a `closeAllPanels` to `e2e/play.ts`, import it instead and leave the helper out of the block below.)

Append to the end of `e2e/polish.spec.ts`:

```ts
/** Closes every collapsible debrief panel: the mirror of openAllPanels in e2e/play.ts. */
async function closeAllPanels(page: Page) {
  const openPanels = page.getByTestId("debrief").locator('h2 > button[aria-expanded="true"]');
  for (let i = 0; i < 20 && (await openPanels.count()) > 0; i++) await openPanels.first().click();
  await expect(openPanels).toHaveCount(0);
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`axe finds no violations in the redesigned debrief, as it opens, fully open and fully closed (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await startGame(page, "AXE-DEBRIEF");
    await playToDebrief(page);
    await expect(page.getByText("Weighing the options you had")).toHaveCount(0, { timeout: 10_000 });
    await expect(page.getByRole("heading", { level: 2, name: /At a glance/ })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /Talk it over/ })).toBeVisible();
    const closed = page.getByTestId("debrief").locator('h2 > button[aria-expanded="false"]');
    expect(await closed.count(), "the reference panels start closed").toBeGreaterThan(0);
    await settle(page);
    await expectNoSeriousViolations(page, "debrief as it opens");

    await openAllPanels(page);
    await expect(page.getByRole("img", { name: /^Calibration chart/ })).toBeVisible();
    await page.getByRole("button", { name: "Rerun 1,000 games" }).click();
    await expect(page.getByTestId("what-if-result")).toBeVisible();
    await settle(page);
    await expectNoSeriousViolations(page, "debrief with every panel open");

    await closeAllPanels(page);
    await expect(page.getByRole("img", { name: /^Calibration chart/ })).toHaveCount(0);
    await settle(page);
    await expectNoSeriousViolations(page, "debrief with every panel closed");
  });
}
```

**Step 2: Run it and watch it fail**

```bash
npx tsc --noEmit && npx playwright test e2e/polish.spec.ts -g "redesigned debrief"
```

Failures name the state (`debrief as it opens`, `debrief with every panel open`, `debrief with every panel closed`), the impact and the rule. The likely ones are `serious color-contrast` on a panel's teaser or the muted "Show"/"Hide" word, `serious scrollable-region-focusable` on a table wrapper, and `moderate heading-order` where a panel's own headings skip a level under its `h2` toggle. If both tests pass at once, that is the expected outcome when Phase 13 met the bar; Task 15.2 already showed that the scan can fail.

**Step 3: Implement**

Fix each violation in the panel that renders it (table in Task 15.2). Keep every contract Phase 13 listed: the six heading regexes, the test ids, the what-if `<p>` structure, "View assumptions" unique, the clipboard format.

**Step 4: Run it and watch it pass**

```bash
npx tsc --noEmit && npx eslint e2e src/ui
npx playwright test e2e/polish.spec.ts e2e/debrief.spec.ts
```

Expected: every test passes, including both `axe finds no violations in the redesigned debrief, as it opens, fully open and fully closed` tests.

**Step 5: Commit**

```bash
git add e2e/polish.spec.ts
git status --short    # add every src/ui file Step 3 changed
git commit -m "test(e2e): axe the debrief as it opens, fully open and fully closed" -m "In light and dark, with At a glance and Talk it over on screen, after a what-if run with every panel open, and with every panel closed. <List any fixes, or: No fixes were needed.>"
```

### Task 15.5: Keyboard: focus rings on the new screens, and Stop here

**Files:**
- Modify: `e2e/polish.spec.ts` (append one block)
- Modify, only if a test forces a fix: `src/ui/theme.css` or the component responsible
- Test: `e2e/polish.spec.ts`

Phase 12 already extended the keyboard test through the pause card's Keep going. Two things are still unmeasured:

1. **Focus rings.** Non-negotiable 8 asks for a visible focus indicator with at least 3:1 contrast, and WCAG 2.2's 2.4.11 asks that a focused control is not hidden under something else. axe tests neither. Planning found a real case at `a11ef34`: the focus ring on the checked radio inside a selected option card (an inverted `bg-ink` card) measured **2.05:1 in light and 1.75:1 in dark**, because the navy ring is drawn on ink. Phase 11 added `.bg-ink :focus-visible { outline-color: var(--paper); }` and a `scroll-padding-bottom` for its sticky confirm bar; nothing tests either. The new check tabs through every control on six states of the phone walk, in both schemes, and fails on a missing outline, on a ring below 3:1 against the nearest opaque background behind it, or on a focused control whose centre sits under a sticky or fixed element.
2. **Stop here by keyboard.** The new test opens the panel with Enter, checks focus stays on the toggle, closes it with Space, reopens it, tabs to "Copy link to this world" and "Back to the start", and presses Enter to return to the title, where focus must land on the title's h1 (Phase 9 wired it to App's step-focus effect; Phase 12's test checks this only for a mouse click).

**Step 1: Write the failing test**

Confirm Phase 12's Keep going walk is in the keyboard test:

```bash
grep -n "LABEL.pauseHeading" e2e/polish.spec.ts | head -3
grep -n "Keep going" e2e/polish.spec.ts | head -3
```

Expected: the keyboard test (`a whole turn can be played with the keyboard alone`) asserts the pause heading and focuses Keep going. If it does not, replace that test's final statement,

```ts
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText("The Attribution Gap");
```

with Phase 12's version:

```ts
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(LABEL.pauseHeading);   // the one-time pause after turn 1
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await focusOn(/^Keep going$/);
  await press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText("The Attribution Gap");
```

Check the new names are free:

```bash
grep -nE "\b(FOCUS_CHECK|expectFocusRingsVisible|tabTo)\b" e2e/polish.spec.ts
```

Expected: no output.

Append to the end of `e2e/polish.spec.ts`:

```ts
/** States in the phone walk where the focus check tabs through every control. */
const FOCUS_CHECK = new Set([
  "title with the friend disclosure open",
  "forecast with advisers revealed",
  "decision with a preview",
  "investment ladder",
  "news",
  "pause card with Stop here open",
]);

/**
 * Tabs through up to `stops` controls from the step heading. Each focused control
 * must show an outline with at least 3:1 contrast against the ground behind it
 * (non-negotiable 8; WCAG 1.4.11) and must not sit under a sticky or fixed layer
 * such as the phone's confirm bar (WCAG 2.4.11). axe checks neither.
 */
async function expectFocusRingsVisible(page: Page, where: string, stops = 30) {
  const heading = page.getByRole("heading", { level: 1 });
  if ((await heading.getAttribute("tabindex")) !== null) await heading.focus();
  for (let stop = 1; stop <= stops; stop++) {
    await page.keyboard.press("Tab");
    const problem = await page.evaluate(async () => {
      // Two frames first: under reduced motion every property still takes a 0.01 ms transition.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const focused = document.activeElement;
      if (!(focused instanceof HTMLElement) || focused === document.body) return null;
      const name = (focused.innerText || focused.getAttribute("aria-label") || focused.id || focused.tagName).trim().slice(0, 40);

      const box = focused.getBoundingClientRect();
      let layer = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      while (layer && !layer.contains(focused)) {
        const position = getComputedStyle(layer).position;
        if (position === "sticky" || position === "fixed") return `"${name}" is hidden under a ${position} element`;
        layer = layer.parentElement;
      }

      const style = getComputedStyle(focused);
      if (style.outlineStyle === "none" || parseFloat(style.outlineWidth) < 2) return `"${name}" has no visible focus outline`;
      const pen = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
      const rgba = (colour: string) => {
        pen.clearRect(0, 0, 1, 1);
        pen.fillStyle = colour;
        pen.fillRect(0, 0, 1, 1);
        return Array.from(pen.getImageData(0, 0, 1, 1).data);
      };
      const luminance = (rgb: number[]) =>
        rgb.slice(0, 3).reduce((sum, value, i) => {
          const c = value / 255;
          return sum + (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][i]!;
        }, 0);
      let ground = rgba(getComputedStyle(document.body).backgroundColor);
      for (let host = focused.parentElement; host; host = host.parentElement) {
        const colour = rgba(getComputedStyle(host).backgroundColor);
        if (colour[3] === 255) {
          ground = colour;
          break;
        }
      }
      const [light, dark] = [luminance(rgba(style.outlineColor)), luminance(ground)].sort((a, b) => b - a);
      const ratio = (light! + 0.05) / (dark! + 0.05);
      return ratio < 3 ? `"${name}" focus ring contrast ${ratio.toFixed(2)}:1 (needs 3:1)` : null;
    });
    expect(problem, `${where}, tab stop ${stop}`).toBeNull();
  }
}

/** Presses Tab until the focused element's text (or aria-label) matches `name`. */
async function tabTo(page: Page, name: RegExp) {
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press("Tab");
    const label = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.innerText || document.activeElement?.getAttribute("aria-label") || "",
    );
    if (name.test(label)) return;
  }
  throw new Error(`Could not reach ${name} by keyboard`);
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`on a phone every focus ring on the redesigned screens shows at 3:1 and is never under the sticky bar (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.setViewportSize({ width: 360, height: 740 });
    await walkFirstTurn(page, "FOCUS-NEW1", async (where) => {
      if (FOCUS_CHECK.has(where)) await expectFocusRingsVisible(page, `phone ${where}`);
    });
  });
}

test("the pause card's Stop here opens, closes and leads back to the start from the keyboard alone", async ({ page }) => {
  await startGame(page, "KEYBOARD-PAUSE");
  await playTurn(page, { stopAtPause: true });
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toHaveText(LABEL.pauseHeading);
  await expect(heading).toBeFocused();

  const stop = page.getByRole("button", { name: "Stop here" });
  await tabTo(page, /^Stop here$/);
  await page.keyboard.press("Enter");
  await expect(stop).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(STOP_PANEL)).toBeVisible();
  await expect(stop).toBeFocused();                                            // opening the panel leaves focus where it was
  await page.keyboard.press("Space");
  await expect(stop).toHaveAttribute("aria-expanded", "false");                // and Space closes it again
  await expect(page.locator(STOP_PANEL)).toHaveCount(0);

  await page.keyboard.press("Enter");
  await tabTo(page, /^Copy link to this world$/);                               // the panel's controls come next in tab order
  await tabTo(page, /^Back to the start$/);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: LABEL.start })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();         // focus comes back to the title's h1, not <body>
});
```

**Step 2: Run it and watch it fail**

```bash
npx tsc --noEmit && npx playwright test e2e/polish.spec.ts -g "focus ring|Stop here opens"
```

If Phase 11's two `theme.css` rules are in place this passes (`3 passed`). Prove the ring check can fail, on a tree where only `e2e/polish.spec.ts` is modified:

```bash
printf '\n:focus-visible { outline-color: var(--accent) !important; }\n' >> src/ui/theme.css
npx playwright test e2e/polish.spec.ts -g "focus ring .* sticky bar .light."
git checkout -- src/ui/theme.css
```

Expected: `1 failed`, at `phone decision with a preview, tab stop <k>`, received `"choice-<X>" focus ring contrast 2.05:1 (needs 3:1)` (the checked radio in the selected card, with the navy ring back on ink).

**Step 3: Implement**

Only if Step 2 failed without the sabotage. Phase 11 already wrote both rules this check guards, in `src/ui/theme.css`: `.bg-ink :focus-visible { outline-color: var(--paper); }` directly after the `:focus-visible { … }` rule, and, for the Decision screen's confirm bar (sticky at every width when the viewport is at least 36rem tall),

```css
@media (min-height: 36rem) {
  [data-decision-bar] {
    position: sticky;
    bottom: 0;
    z-index: 10;
  }
  html:has([data-decision-bar]) {
    scroll-padding-bottom: 9rem;
  }
}
```

Find them with `grep -n "bg-ink :focus-visible\|data-decision-bar\|scroll-padding-bottom" src/ui/theme.css`. Change those rules; never add a second, competing one.

- A ring below 3:1 on an inverted surface other than `bg-ink`: add that surface's class to the existing rule's selector, for example `.bg-ink :focus-visible, .bg-accent :focus-visible { outline-color: var(--paper); }` (paper on ink is above 15:1 in both schemes; check the other surface the same way).
- A control hidden under the confirm bar: raise the `scroll-padding-bottom` in Phase 11's `html:has([data-decision-bar])` rule above to at least the bar's measured height plus 1rem. Measure the bar at the failing state with `document.querySelector("[data-decision-bar]").getBoundingClientRect().height` (Phase 11 measured 97px, about 6rem, with an option picked).
- No visible outline: an element with `outline-none` that can take keyboard focus. Remove `outline-none` (the h1s keep it: they take focus only from code, with `tabIndex={-1}`).
- Focus lost when Stop here is pressed: Phase 12's toggle stays in place, so focus should stay on it. If the test finds focus elsewhere, keep the button mounted and toggle `aria-expanded` rather than replacing it.

**Step 4: Run it and watch it pass**

```bash
npx tsc --noEmit && npx eslint e2e src/ui
npx playwright test e2e/polish.spec.ts
```

Expected: every test in the file passes, including `on a phone every focus ring on the redesigned screens shows at 3:1 and is never under the sticky bar (light)` and `(dark)`, `the pause card's Stop here opens, closes and leads back to the start from the keyboard alone`, and the existing keyboard test.

Then tick the first Phase 15 item in `docs/plan.md`. Phase 8 wrote it as:

```markdown
  - [ ] ⬜ Extended axe, overflow and keyboard walk over every new screen and state, in light and dark, at phone and desktop sizes
```

Replace that line with (use the B number from Task 15.1, and `<S>` from Task 15.2: 9, or 11 if Phase 14 was built):

```markdown
  - [x] 🟩 Extended axe, overflow and keyboard walk over every new screen and state, in light and dark, at phone and desktop sizes: <S> new tests in `e2e/polish.spec.ts` at the B42 bar, including reflow at 320 px, focus-ring contrast and the phone's sticky bar; Playwright timeout 60 s, preview reused only off CI (`DECISIONS.md` B<n>)
```

and change the Phase 15 heading line from `- [ ] ⬜ **Phase 15: Accessibility sweep, docs and handover**` to `- [ ] 🟨 **Phase 15: Accessibility sweep, docs and handover**`.

**Step 5: Commit**

```bash
git add e2e/polish.spec.ts docs/plan.md
git status --short    # add every src/ui file Step 3 changed
git commit -m "test(e2e): focus rings on the new screens, and Stop here by keyboard" -m "Tabbing through six states of the phone walk in light and dark, every focus ring shows at 3:1 against its ground and none sits under the sticky confirm bar; axe checks neither. Guards the selected-card ring that measured 2.05:1 and 1.75:1 before Phase 11. Stop here opens, closes and leads back to the start from the keyboard. <List any fixes, or: No fixes were needed.>"
```

### Task 15.6: The playtest and timing protocol

**Files:**
- Create: `docs/playtest.md`
- Test: a shell check of its required content

The spec budgets about three minutes a turn and 25 minutes overall, and a newcomer must finish without help in under 30 (spec Sections 1, 4 and 13; handoff definition of done). Reading speed, understanding and wanting to continue cannot be measured by the automated gates, so this file tells the designer how to measure them with people. The per-step budgets split the spec's three minutes as the planning maps did. The data sources respect the README's "no analytics": observation, the tester's own **Copy run summary**, what the pause card shows, and an interview.

Three design points behind the protocol:

- **The spec's "pushed a policy line" metric gets its own question.** The neutrality question asks whether the game portrayed AI as dangerous or safe, which is a belief about the technology. The spec's metric asks whether the game favoured a policy direction, and its remedy is to revisit the world-profile odds. A game can be even-handed about AI's dangers and still reward acting early and restrictively, so the two are asked and reported separately.
- **Nothing is asked before the tester chooses at the pause card.** Asking there first would prime the choice between Keep going and Stop here, which is check 4. A tester who stops still answers the neutrality, policy-line and approachability questions, and their turn-1 option and forecast are taken from the pause card, so the metrics are not drawn only from people who kept playing.
- **Phones need a real address, and each tester a fresh browser.** `npm run preview` listens only on the laptop itself (it prints "Network: use --host to expose"), so a phone cannot reach it without `--host`. A private window per tester stops one tester's seed code or kept game (if Phase 14 was built) reaching the next.

**Step 1: Write the failing test**

```bash
for s in "Did the game try to convince you AI is dangerous, or that it is safe?" "favour one kind of policy" "Most-chosen option share" "Completion rate" "Replay within a week" "defend despite a bad outcome" "moved away from 50%" "pushed a policy line" "Understands the dilemma" "Can explain the visible consequences" "Chooses without specialist knowledge" "Wants to continue" "about 3 minutes" "under 30 minutes" "about 5 minutes" "Copy run summary" "Keep going" "stop at any time" "npm run preview -- --host"; do grep -qF -- "$s" docs/playtest.md 2>/dev/null || echo "missing: $s"; done
```

**Step 2: Run it and watch it fail**

Expected: nineteen `missing:` lines (the file does not exist yet).

**Step 3: Implement**

Create `docs/playtest.md`:

```markdown
# Playtest and timing protocol

How to run the newcomer playtest (the playtest row in `DECISIONS.md` section F) and check the game against its time budget. Both need people: the automated gates cannot measure reading speed, understanding, or whether someone wants to keep playing. Until a round has been run and reported in [docs/plan.md](plan.md), these items stay open.

## Who

- Ten solo testers from the general public with no professional background in AI policy, government or forecasting. An informal group sharing one seed code is optional.
- Adults, until the designer decides the age range: the game includes an election deepfake and a biosecurity scenario.
- A mix of phones and laptops, with at least four on a phone.
- Nobody who has seen the redesign, read these documents or been told how the game works.

## Setting up a session

1. Before the round, ask the designer to approve a preview address for testers: an unlisted preview deployment of the branch under review, not a public release. Phone testers and the replay-within-a-week follow-up need it. Without one, run `npm run build && npm run preview -- --host` on a laptop, open the `Network` address it prints on phones on the same Wi-Fi, stop the server with Ctrl+C after the session, and report replay within a week as not measured. Never post either address publicly: no deploy of the redesign has been approved.
2. For each tester, open a new private (incognito) window at `/` with no seed code, and close every private window at the end of the session, so no earlier tester's seed code or kept game is offered. Once the game starts, note the seed code shown in the header.
3. Before starting, tell the tester that the game is fiction with invented numbers; that it touches on cyber attacks, an election deepfake and a biological threat, at policy level; and that they can stop at any time without saying why. Ask whether you may note what they say, keep their run summary and message them in a week. Keep record sheets under initials, and delete contact details after the follow-up.
4. Then say only: "This is a game about decisions on AI. Play it as you would at home. There is no time limit and no right answer. If a word puzzles you, say so; I will note it but will not explain it until the end." Keep the stopwatch out of the tester's sight. Do not explain terms; write down every word the tester raises.
5. Nothing is collected automatically: the game has no analytics and sends nothing anywhere. Your data are the timing sheet, what you observe, the turn-1 option and forecast shown on the pause card, the tester's own **Copy run summary** (ask them to paste it to you at the end) and the interview.

## Timing the game against its budget

The spec gives about three minutes a turn and 25 minutes overall, and a new player should finish without help in under 30 minutes (spec Sections 1, 4 and 13). Budgets per step:

| Step | Ends when the tester presses | Budget |
| --- | --- | --- |
| Title | Try your first decision | 1 minute |
| Briefing | Continue to your forecast | 60 to 75 seconds |
| Forecast | Lock in | 20 seconds |
| Decision, with any analysis | Confirm option | 45 seconds |
| Investment | Invest in | 15 seconds |
| Consequences | Next briefing (Read your debrief after the last decision) | 30 seconds |
| Pause card after turn 1 | Keep going | 30 seconds |
| One whole turn | | about 3 minutes |
| Title to the pause card (the taster) | | about 5 minutes |
| Title to the debrief | Read your debrief | about 25 minutes |
| The whole session, debrief included | the tester says they have finished | under 30 minutes |

How to time:

- Use a stopwatch with laps; a phone's clock app will do. Start it when the title screen appears and press lap each time the tester presses one of the buttons in the table. The last decision has no investment step.
- Do not ask the tester to think aloud: it slows reading. Ask questions only at the pause card, once the tester has chosen, and after the debrief, and pause the stopwatch while you do.
- Stop when the tester says they have finished with the debrief, and note how far into it they read.
- Note any interruption and subtract it.

A step is over budget when it takes more than one and a half times its budget for three or more of ten testers. The spec's remedy when completion is low is to shorten the briefings (spec Section 13). Log any change in `DECISIONS.md`.

## What to measure

### The spec's six playtest metrics (spec Section 13)

| Metric | Target | Where it comes from |
| --- | --- | --- |
| Most-chosen option share, per scenario | below 60% | the run summaries: each decision's line gives the option; for a tester who stopped at the pause, the turn-1 option you noted from the pause card |
| Completion rate | 80% or above | observation: the tester reached the debrief. A tester who chose Stop here counts as not completed |
| Replay within a week | 30% or above | a message seven days later to each tester who agreed to one: "Have you played again?" It needs the approved preview address (setup step 1); without one, report it as not measured |
| Testers who name a decision they would defend despite a bad outcome | 50% or above; two of five is the floor for a five-person round | interview question 1 |
| Forecast slider used meaningfully (not left at 50%) | 70% of forecasts | the run summaries: count the forecasts moved away from 50% (each decision's line gives "forecast N%"); for a tester who stopped, the turn-1 forecast you noted from the pause card |
| Testers who say the game pushed a policy line | below 20%, split evenly by direction | interview question 5: record the direction they name |

### The engagement handoff's four approachability checks

While the tester reads the pause card after turn 1, note the turn-1 option and forecast it shows under What you chose and Still open. Say nothing until the tester has pressed **Keep going** or **Stop here**, and record which (check 4). Then pause the stopwatch and ask checks 1 to 3, then: "If you had found this on your own at home, would you have kept going now?"

1. **Understands the dilemma.** "In your own words, what was that first decision trading off?" It passes if the answer names something gained and something risked.
2. **Can explain the visible consequences.** "What changed after your decision, and what is still unknown?" It passes if the answer names at least one measured change and one open question.
3. **Chooses without specialist knowledge.** It passes if the tester raised no unknown term before the first decision, and answers no to: "Was there a word you needed for that choice that you did not know?"
4. **Wants to continue.** It passes if the tester chose **Keep going** at the pause card. If they chose **Stop here**, ask "What made you stop?", then interview questions 4 to 8, and end the session. Their taster time still counts, and they count as not completed.

### Neutrality

Ask in exactly these words: "Did the game try to convince you AI is dangerous, or that it is safe?" Record dangerous, safe, neither or both, with the tester's own words. Report it on its own, as counts of dangerous, safe, neither and both. It is not the spec's policy-line metric, which has its own question (interview question 5): a game can be even-handed about AI's dangers and still favour one kind of policy.

## Interview after the debrief (about five minutes)

1. "Is there a decision you would defend even though it turned out badly?"
2. "Which decision would you argue about with a friend?"
3. "Did anything that looked dangerous turn out not to be, or the other way round?"
4. The neutrality question, above.
5. "Did the game seem to favour one kind of policy, for example acting early and restrictively, or waiting and staying open? If so, which?"
6. "Did it feel like a test with right answers, or a score to beat?" Record their words.
7. "Was there a word or a screen you did not understand?"
8. "Would you play again, or send it to someone?"

## Record sheet (one per tester)

| Field | Entry |
| --- | --- |
| Tester (initials), date, phone or laptop | |
| Agreed to: notes of what they say, keeping the run summary, a message in a week | |
| Seed code | |
| Laps: the title; then briefing, forecast, decision, investment and consequences for each turn; the pause card | |
| Title to the pause card; title to the debrief; the whole session | |
| Words the tester raised | |
| At the pause card: Keep going or Stop here; the turn-1 option and forecast it showed; the "at home" answer | |
| Checks 1 to 4: passed or not, with notes | |
| Neutrality answer, in their words | |
| Interview answers 1 to 8 (4 to 8 for a tester who stopped) | |
| Run summary, pasted (testers who reached the debrief) | |
| Replay within a week (the follow-up), or "not measured" | |

## Reporting

Report each metric as a count, for example "7 of 10", and count testers who stopped at the pause in every measure they answered, marked as stopped. Do not call a target met from fewer than ten testers, except the two-of-five floor. Record the results against the items in the "Owned by the designer, not the build" section of `docs/plan.md`, and log any change they lead to in `DECISIONS.md`. The items stay open until the designer reports them.
```

**Step 4: Run it and watch it pass**

Run the Step 1 check again. Expected: no output.

**Step 5: Commit**

```bash
git add docs/playtest.md
git commit -m "docs: add the playtest and timing protocol" -m "How to run the newcomer playtest and time each step against the spec's budget: consent and a fresh private window per tester, a preview address phones can reach, the spec's six metrics (the policy-line metric with its own question), the engagement handoff's four approachability checks asked only after the tester chooses at the pause, one neutrality question, an interview and a record sheet. No analytics: observation, the pause card, the tester's own run summary and an interview."
```

### Task 15.7: README for a general audience

**Files:**
- Modify: `README.md` (whole file: Phase 15 owns the handover text. Before it, Phase 9 changed one bullet under "Seed codes" and, if it ran, Phase 14's Task 14.6 changed four places; both are carried into the new text)
- Test: a shell check

The README still opens with the workshop framing ("That is what makes a workshop comparison fair", "paste it to a facilitator") and lists "the willingness-to-pay sessions" as open. It says nothing about how the game now opens, the pause card or sharing a world.

**Step 1: Write the failing test**

```bash
grep -n -i "workshop\|willingness" README.md
for s in "Try your first decision" "Keep going" "Stop here" "Play the same world as a friend" "At a glance" "Talk it over" "Share your run" "docs/playtest.md" "reproduces a world, not progress" "lsof -nP -iTCP:4173" "has never run"; do grep -qF -- "$s" README.md || echo "missing: $s"; done
```

**Step 2: Run it and watch it fail**

Expected: `grep` prints two lines (at `a11ef34` lines 38 and 84: the workshop sentence and the willingness-to-pay item), then ten `missing:` lines, one for every string except "Play the same world as a friend", which Phase 9 added.

**Step 3: Implement**

First see what earlier phases changed, and check the three behaviours the new text describes:

```bash
git fetch origin
git diff "$(git merge-base origin/main HEAD)" -- README.md
grep -n "Copy link to this world\|Back to the start\|not saved progress" src/ui/screens/FirstDecision.tsx src/ui/copy.ts
grep -n "Share your run\|Copy link to this world" src/ui/screens/Debrief.tsx
ls src/ui/*.ts
```

Carry into the new text any fact an earlier phase added that it lacks (Phase 9's bullet about the seed box is already in it). If Stop here or the debrief's share section behave differently from the sentences below, change those sentences to say what the code does. Then replace the whole of `README.md` with the text below. Replace `<K>` with the number `du -sk dist` printed before Task 15.1, in MB to one decimal place (1972 KB is about 1.9 MB).

````markdown
# AI 2032

A 25-minute browser game about the choices AI could force on a country. You run a small, fictional UK government unit from 2026 to 2032. Over eight decisions you judge how likely things are, hear advisers who disagree, choose a policy and decide what to prepare for. A debrief then separates what you decided from what the dice delivered.

It is for anyone curious about what AI could do for us and what it could do to us. You need no background in government, forecasting or AI policy. The game has no answer it wants you to reach, and it is built not to tell you what to think: in some of its hidden worlds caution pays, and in others it costs.

Static single-page app: no backend, no accounts, no database, no analytics. Nothing a player does leaves their browser.

## How a game goes

- **The opening.** The title screen starts with the dilemma and one button, **Try your first decision**. The notice that the unit and its advisers are fictional stays on this screen. Entering a seed code is tucked under **Play the same world as a friend**.
- **Each turn** takes you through five screens (the last decision has no investment). *Briefing:* the situation, what each adviser cares about and which option they back. *Forecast:* your own estimate on a slider first; **Compare with your advisers** then puts their four estimates on the same scale. *Decision:* you can commission analysis first; picking an option previews its stated effects and the Political Capital you would have left, and the briefing can be reopened; every option also has effects you cannot see. *Investment:* each track shows what its next level unlocks. *Consequences:* your decision, what the world noticed, what you can measure now and what is still unknown.
- **Two turns are crises:** less to read, no analysis to buy, and a simulated clock that moves with your steps, never with real time.
- **After the first turn** a pause card asks whether to go on. **Keep going** carries on with the same game. **Stop here** shows a link to the same world, which starts again from the first turn; it is not saved progress. You can copy the link or go back to the start.
- **The debrief** opens with the ending and **At a glance**, then **What if** (change one decision and the model replays the game 1,000 times, with fresh dice in the same kind of world), then **Decision quality versus luck**. The reference panels (the world you were in, calibration, the governance record, what you never saw) open when you want them. **Talk it over** suggests questions to discuss, **Share your run** copies a summary of your run or a link to the same world, and **Play a new world** starts again in a different one.

## Run, build, test

Requires Node 20 or later.

```bash
npm install
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run test` | Engine, content, copy-rule and interface-helper tests (Vitest) |
| `npm run lint` | ESLint, including the engine-isolation, banned-API and hidden-content rules |
| `npm run build` | Type check, then produce the static bundle in `dist/` |
| `npm run preview` | Serve the built bundle locally |
| `npm run balance` | The balance harness. Rule 7: plays 10,000 paired-seed games per world profile for three fixed strategies and fails if any gives the best ending score in more than 40% of runs, pooled across the profiles at their published weights. Rules 4 and 5: fails unless, in every scripted scenario, the waiting option and the most restrictive option are each the best choice in at least one world profile |
| `npm run balance -- --table` | Also print every option's value in every profile |
| `npm run balance -- --runs 2000 --value-runs 1000` | A quicker reading while tuning numbers |
| `npm run e2e` | Playwright browser tests against the production bundle: crisis turns, the debrief, the 3-second rerun budget, the opening's first screen, the pause after turn 1, accessibility (axe in light and dark on every screen and on the redesign's new states, the new screens also at phone width; focus-ring contrast on the new screens at phone width), keyboard play, no sideways scroll at 360px (the new screens also at 320px), reduced motion, reproducibility. First run `npx playwright install chromium` |

GitHub Actions has never run for this repository (the account's Actions billing blocks it), so run the whole gate locally before any merge:

```bash
npm run lint && npm run test && npm run balance && npm run build && npm run e2e
```

Locally, `npm run e2e` reuses a preview server already listening on port 4173, which may be serving an old build: `lsof -nP -iTCP:4173 -sTCP:LISTEN` must print nothing first. On CI the tests always build and serve afresh.

Balance is tuned in the JSON under `src/content/`, never in the engine. Every change is logged in `DECISIONS.md` section E.

## Deploying

`npm run build` writes a self-contained bundle to `dist/` (about <K> MB, well under the 16 MB limit). It uses relative paths, so it runs from any static host or sub-path. There is nothing to configure and no server to run.

## Sharing a world

Every game is fixed by a seed code, shown in the header and carried in the URL as `?seed=K7Q2-M9XD`.

- To play the same world as a friend, send them the link, or have them enter your code under **Play the same world as a friend** on the title screen. You face the same hidden world **and the same dice**: if you both cut the odds of an event, it fires for both of you or for neither, so your outcomes differ only where your decisions differ. That is what makes comparing notes afterwards fair.
- A seed link reproduces a world, not progress: it always starts at the first turn.
- The same seed code and the same actions always give the same run, start to finish.
- Codes are case-insensitive. The box is under **Play the same world as a friend** on the title screen, and opens by itself when the URL carries a code. Leave it blank and the game makes a new eight-character code (Crockford base32, so no I, L, O or U to misread).
- A code reveals nothing about the world behind it: it is hashed to a 32-bit number, and the profile and five latent facts are drawn from that.

## Facilitator panel

For anyone running a group session. Open the game with `?facilitator=1` to see **Facilitator settings** on the title screen. Every probability in the game is a design assumption, and a facilitator can edit two kinds:

- **How the hidden world is drawn:** the weight of each world profile (benign, contested, hard) and the odds of each of the five latent facts within each profile.
- **Base odds of events:** for example the chance of a disruptive infrastructure attack when offence leads.

Then:

- **Apply to this page** reloads with the edits in force.
- **Copy participant link** copies a link containing the seed code and the edits (`?seed=...&cfg=...`), without the facilitator flag. Everyone who opens it plays the same seed under the same edited assumptions, and sees a notice on the title screen saying the assumptions were edited.
- **Reset to the published assumptions** clears the edits.

Only changed numbers are encoded. A malformed or out-of-range `cfg` is ignored rather than breaking the game. What-if reruns and luck tags use the edited numbers, and the debrief's **View assumptions** tables show exactly what is in force, so a participant who disputes the model can change it and rerun.

## Sharing your run

There is no backend, so the debrief ends with **Share your run**. **Copy run summary** copies the seed code, every choice, forecast and investment, the Brier score and the ending, as text or JSON, to the clipboard and nowhere else. The player decides whether to share it, for example with a friend who played the same world or with someone running a playtest. The summary shows how that world turned out, so it spoils the world for anyone who has not played it yet; the link to the same world does not.

## How the project is organised

| Path | Contents |
| --- | --- |
| `src/engine/` | The game. Pure, deterministic TypeScript. No React, no DOM, no wall clock, no `Math.random` |
| `src/content/` | Scenarios, events, advisers and endings as JSON, validated by Zod at load. `index.ts` is the only door from the interface: it serves a public view with hidden effects stripped, and publishes the assumptions to the debrief |
| `src/ui/` | React screens that render `displayed(state)`, and pure, unit-tested helpers for what they say and preview (`copy.ts`, `preview.ts`, `preparation.ts`, `consequences.ts`). The raw game state never leaves `useGame.ts` |
| `src/workers/` | Web Worker for what-if reruns and luck-tag rollouts |
| `scripts/` | The balance harness |
| `tests/`, `e2e/` | Vitest suites for the engine, content, copy rules and interface helpers; Playwright suites for the browser gates |
| `docs/` | The design spec, the build handoff, the public-audience handoff, the implementation plans and the playtest protocol |

## Documents

- [docs/spec.md](docs/spec.md): Game Design Specification v2
- [docs/handoff.md](docs/handoff.md): the build handoff
- [docs/ui-engagement-handoff.md](docs/ui-engagement-handoff.md): why the interface was reworked for a general audience
- [docs/plan.md](docs/plan.md): the implementation plan, its progress, and the items only people can complete
- [docs/plans/2026-09-19-public-engagement-ui.md](docs/plans/2026-09-19-public-engagement-ui.md): the public-audience redesign, task by task
- [docs/playtest.md](docs/playtest.md): how to run the newcomer playtest and time each step
- [DECISIONS.md](DECISIONS.md): every choice made where the spec was silent, every number that is not in the spec, and the balance-tuning log, including why Rule 7 is judged across all worlds pooled

## Status

The seven build phases are complete. The public-audience redesign (Phases 8 to 15 in [docs/plan.md](docs/plan.md)) is built on a branch; [docs/plan.md](docs/plan.md) records the date and results of its last local gate run. It awaits the designer's review and has not been deployed. The parts that need people remain open: a newcomer playtest with ten members of the public, the under-30-minute and about-three-minutes-a-turn timing checks, the "would defend a decision despite its outcome" measure, and the designer's sign-off on the redesign's decisions (`DECISIONS.md` section F). See the end of [docs/plan.md](docs/plan.md) and [docs/playtest.md](docs/playtest.md).
````

Only if `PHASE-14-RAN` printed, make these five edits to the new text. They carry Task 14.6's sentences across, corrected to the rules Phase 14 actually built (a new game replaces the kept one only once its first forecast is locked in; **Forget this game** removes it; a finished game is kept only in that tab), and describe the save:

1. The opening paragraph. Replace

   ```markdown
   Static single-page app: no backend, no accounts, no database, no analytics. Nothing a player does leaves their browser.
   ```

   with Task 14.6's sentence, corrected:

   ```markdown
   Static single-page app: no backend, no accounts, no database, no analytics. Nothing a player does leaves their browser. A game in progress is kept in that browser's own storage, as the seed code and the list of actions taken (never the hidden world), so a player can close the tab and later choose **Continue your game** on the title screen; a new game replaces it once its first forecast is locked in, **Forget this game** removes it and **Play a new world** clears it.
   ```

2. The pause bullet under "How a game goes". Replace `it is not saved progress. You can copy the link or go back to the start.` with `it is not saved progress, though your game itself stays saved in this browser. You can copy the link or go back to the start.`

3. The command table. Replace `Engine, content, copy-rule and interface-helper tests (Vitest)` with `Engine, content, copy-rule, interface-helper and save-and-replay tests (Vitest)`, and `reduced motion, reproducibility. First run` with `reduced motion, reproducibility, save and resume. First run`.

4. The `src/ui/` row. Replace

   ```markdown
   The raw game state never leaves `useGame.ts` |
   ```

   with

   ```markdown
   The raw game state stays in `useGame.ts` and the two window-free modules it uses: `session.ts` (the session reducer, which also replays a saved game) and `save.ts` (what a save holds, and the checks before one is resumed) |
   ```

5. A new section. Directly before `## Facilitator panel`, insert:

   ```markdown
   ## Saving a game in progress

   If the browser allows it, a game in progress is kept in this browser's local storage under `ai-2032:save:v1`: the seed code, any edited assumptions and the list of actions taken, never the game's hidden state. The title screen says so before anything is kept, then offers **Continue your game**, which replays those actions to rebuild the same game exactly. The game never resumes by itself, and **Forget this game** removes the kept game. A new game replaces it once its first forecast is locked in, and **Back to the start** on the pause card keeps it. A finished game is kept only in that tab, so its debrief, which reveals the world, is never offered on a later visit; **Play a new world** clears it. There is one kept game per browser, so two tabs overwrite each other. Nothing is sent anywhere, and clearing the site's data removes it.

   ```

   Before inserting it, check each sentence against the code (`grep -n "Forget this game\|sessionStorage\|localStorage" src/ui/save.ts src/ui/App.tsx src/ui/screens/Title.tsx`) and change any sentence the code contradicts.

**Step 4: Run it and watch it pass**

```bash
grep -n -i "workshop\|willingness" README.md
for s in "Try your first decision" "Keep going" "Stop here" "Play the same world as a friend" "At a glance" "Talk it over" "Share your run" "docs/playtest.md" "reproduces a world, not progress" "lsof -nP -iTCP:4173" "has never run"; do grep -qF -- "$s" README.md || echo "missing: $s"; done
grep -n "<K>" README.md
for f in docs/spec.md docs/handoff.md docs/plan.md docs/playtest.md docs/ui-engagement-handoff.md docs/plans/2026-09-19-public-engagement-ui.md DECISIONS.md; do test -f "$f" || echo "missing file: $f"; done
grep -c "Continue your game" README.md
```

Expected: no output from any command except the last, which prints `2` if `PHASE-14-RAN` printed (the opening and the "Saving a game in progress" section) and `0` otherwise.

**Step 5: Commit**

```bash
git add README.md
git commit -m "docs(readme): rewrite for a general audience" -m "Who the game is for, how a game goes (the dilemma-first opening, the five screens of a turn, the pause after turn 1, the debrief), sharing a world as a link that reproduces a world rather than progress, the local gate and the stale-server check. The workshop framing and the willingness-to-pay item are gone."
```

### Task 15.8: DECISIONS.md: section F status, the sweep, the playtest and the commercial note

**Files:**
- Modify: `DECISIONS.md` (section F's bold status sentence; up to two new section F rows; one new section B row)
- Test: a shell check

Phase 8's section F has no row for how the game is tested with people now the audience is everyone, and none withdrawing the spec's commercial note, yet the README (Task 15.7) and `docs/plan.md` (Task 15.9) drop the willingness-to-pay sessions. These two rows record both, as proposals like every other row in the section. Row numbers in section F differ between phase drafts, so find rows by content, never by number.

**Step 1: Write the failing test**

```bash
awk '/^## F\./{f=1} f' DECISIONS.md | grep -c "Did the game try to convince you AI is dangerous, or that it is safe?"
awk '/^## F\./{f=1} f' DECISIONS.md | grep -c "willingness-to-pay"
grep -c "Accessibility sweep of the redesign" DECISIONS.md
awk '/^## F\./{f=1} f' DECISIONS.md | grep -m1 -n "^\*\*Status"
```

**Step 2: Run it and watch it fail**

Expected: `0`, `0`, `0`, then the status line Phase 8 wrote (or a later phase edited), beginning `**Status: proposed on 2026-09-19; awaiting designer sign-off.**`.

**Step 3: Implement**

(a) *The status sentence.* Collect what is on record: the dates of the designer reviews and anything the designer has confirmed in writing.

```bash
grep -n "designer" docs/plan.md | grep -i "phase 1[13]\|review"
git fetch origin
git log --oneline --grep="designer" origin/main..HEAD
```

Take confirmations only from what `DECISIONS.md` or `docs/plan.md` already records, or from the designer in this session; never infer one. Then replace only the bold first sentence of the paragraph under `## F. Public-audience redesign` (keep the rest of that paragraph) with:

```markdown
**Status on <YYYY-MM-DD>: built on the redesign branch and awaiting the designer's sign-off.** The designer reviewed the opening and a representative turn at the Phase 11 gate (<date>) and the debrief at the Phase 13 gate (<date>); changes asked for there are in the rows. Confirmed so far: <row numbers, or "none">. Not taken: <the saved-progress row's number if PHASE-14-NOT-TAKEN printed, otherwise "none">.
```

where `<YYYY-MM-DD>` is today (`date +%F`).

(b) *The playtest row.* Check whether section F already has a row whose Question cell is about testing with people:

```bash
awk '/^## F\./{f=1} f' DECISIONS.md | grep -n -iE '^\| F[0-9]+ \| [^|]*(playtest|tested with people|milestone M5)'
```

Expected: no output. Rows that mention a playtest only in their Decision or Why cells (Phase 8's adviser row and Phase 12's taster row both do) do not count: leave them alone and append the new row. If the command does print a row, replace that whole row with the one below, keeping its number. Otherwise append this row as the last row of the section F table, numbered one above the highest F number (`grep -oE '^\| F[0-9]+' DECISIONS.md | sed 's/| F//' | sort -n | tail -1`, plus one):

```markdown
| F<p> | How is the game tested with people, now the audience is everyone? | Spec milestone M5 becomes ten solo testers from the general public with no professional background in AI policy, government or forecasting; an informal group sharing one seed code is optional. Testers are told first that the game is fiction touching on cyber attacks, an election deepfake and a biological threat, agree to what is noted and kept, and may stop at any time. The spec's six playtest metrics stand (Section 13), and its "pushed a policy line" metric has its own question: whether the game seemed to favour one kind of policy. Four approachability checks are added from the engagement handoff: the tester can say in their own words what the first decision trades off; chooses without an unknown term in the way; after the first consequences can say what changed and what is still unknown; and chooses Keep going at the pause after turn 1. Nothing is asked at the pause until the tester has chosen, and a tester who stops there still answers the neutrality, policy and approachability questions. One neutrality question is asked in these words: "Did the game try to convince you AI is dangerous, or that it is safe?", and reported on its own. Each step is timed against the spec's budget of about three minutes a turn and 25 minutes overall, under 30 for a newcomer without help. The "defend a decision despite a bad outcome" target is the spec's 50%; two of five is the floor for a five-person round. Each tester plays in a fresh private window, at a preview address the designer approves; without one, replay within a week is not measured. The protocol is `docs/playtest.md`. Data come from observation, the pause card, the tester's own Copy run summary and an interview; nothing is collected automatically | The spec's criteria still test the learning; the added checks test approachability, which a workshop audience did not need. The neutrality question tests the handoff's "not a predetermined warning" in plain words. The spec's "pushed a policy line" metric keeps its own question, because a game can be even-handed about AI's dangers and still favour one kind of policy, and the spec's remedy for that (revisit world-profile odds) is different. Asking before the tester chooses at the pause would prime check 4, and counting only testers who reach the debrief would leave out the likeliest to feel pushed. The spec (50%) and the handoff's definition of done (two of five) disagree; the spec wins (CLAUDE.md), and two of five stays as the floor for a small round |
```

(c) *The commercial note.* If section F has no row about the commercial note (the `willingness-to-pay` count in Step 2 was `0`), append this row after the previous one, numbered one higher:

```markdown
| F<p+1> | The spec's commercial note and its three willingness-to-pay sessions | Withdrawn, if the designer agrees. There is no paid layer: seed codes, the facilitator panel and the run summary stay free, and the sessions leave the human-only list in `docs/plan.md` and the README | Follows from decision 14: AI 2032 is a personal, non-professional project. Decision 7's facilitator panel stays for anyone running a group, not as a paid tier |
```

(d) *The sweep.* Append this row as the last row of the section B table, as in Task 15.1, numbered one above the highest B number (the Task 15.1 row plus one). If `PHASE-14-NOT-TAKEN` printed, delete from it the two phrases `, the title with the continue offer` and the last sentence of its Why cell, which begins `Phase 14's own scan`:

```markdown
| B<n+1> | Accessibility sweep of the redesign | B42's bar extends to every state Phases 9 to 14 added. axe (any violation at any impact, best-practice rules included, fails the gate, as B42 says) runs in light and dark at 1280 wide on the bare title, the friend disclosure, the forecast with advisers compared, the decision with a preview and with the briefing recap open, the investment ladder, the consequences, the pause card and its Stop here panel, the title with the continue offer, and the debrief as it opens, fully open and fully closed; and at 360 × 740 on the title, the title with the continue offer, the decision, the consequences and the pause card. Every new screen is checked for sideways scroll at 360 and at 320, the width WCAG 2.2 judges reflow at (1.4.10). Under reduced motion nothing transitions, animates or smooth-scrolls for 1 ms or more. Tabbing through the new states on a phone, every focus ring shows at 3:1 against what is behind it and none sits under the sticky confirm bar | These states are where contrast, target-size, reflow and focus regressions appear. axe tests neither focus-ring contrast (WCAG 1.4.11) nor a focused control hidden under a sticky bar (WCAG 2.4.11), so the sweep measures both; planning found the selected-card ring at 2.05:1 (light) and 1.75:1 (dark) before Phase 11's fix. Phase 14's own scan of the continue offer used the old serious-only filter, so the sweep repeats it at this bar |
```

**Step 4: Run it and watch it pass**

```bash
awk '/^## F\./{f=1} f' DECISIONS.md | grep -c "Did the game try to convince you AI is dangerous, or that it is safe?"
awk '/^## F\./{f=1} f' DECISIONS.md | grep -c "willingness-to-pay"
grep -c "Accessibility sweep of the redesign" DECISIONS.md
awk -F'|' '/^\| (F[0-9]+|B[0-9]+) \|/ { if (NF != 6) print "bad row: " $2 }' DECISIONS.md
grep -n "<YYYY-MM-DD>\|<date>\|<p>\|<n+1>\|<row numbers" DECISIONS.md
```

Expected: `1`, `1` or more, `1`; the `awk` prints nothing (every row has four cells); the last `grep` prints nothing (no placeholder left).

**Step 5: Commit**

```bash
git add DECISIONS.md
git commit -m "docs(decisions): section F status, the playtest and commercial-note rows, the sweep" -m "Section F's status now records the Phase 11 and 13 reviews and what is confirmed. New proposed rows: how the game is tested with people (ten members of the public with consent, the spec's six metrics with the policy-line metric asked on its own, four approachability checks, a neutrality question, per-step timing) and the withdrawal of the commercial note. Section B records the accessibility sweep at the B42 bar."
```

### Task 15.9: docs/plan.md: progress, the open human items, the deferred list

**Files:**
- Modify: `docs/plan.md` (the Phase 15 block's second item; the progress line; everything from `## Owned by the designer, not the build` to the end of the file)
- Test: a shell check

**Step 1: Write the failing test**

```bash
grep -c "The three willingness-to-pay sessions" docs/plan.md
grep -c "Did the game try to convince you AI is dangerous, or that it is safe?" docs/plan.md
grep -c "^## Deferred, not in this plan" docs/plan.md
```

**Step 2: Run it and watch it fail**

Expected: `1`, `0`, `0`.

**Step 3: Implement**

(a) Tick the second Phase 15 item. Replace

```markdown
  - [ ] ⬜ README, `DECISIONS.md` and this plan updated; human-only items listed as open
```

with

```markdown
  - [x] 🟩 README, `DECISIONS.md` and this plan updated; human-only items listed as open; the playtest and timing protocol in `docs/playtest.md`; deferred work listed below
```

The Phase 14 block needs no edit here: Phase 14's gate ticked it, or its Task 14.0 replaced it with one "not built" line.

(b) Replace everything from the line `## Owned by the designer, not the build` to the end of the file. After Phase 8 it reads:

```markdown
## Owned by the designer, not the build

These parts of the definition of done cannot be passed by the builder and will be reported as open, never as done:

- The Phase 4 playtest (a person finishing a run without code or docs)
- Spec milestone M5: ten solo testers and one facilitated group of eight
- First-time completion in under 30 minutes, and two of five testers naming a decision they would defend despite its outcome
- The three willingness-to-pay sessions in the spec's commercial note
- Whether the spec's commercial note (a paid workshop layer, and the three willingness-to-pay sessions above) still applies now that the game is a personal project for everyone (`DECISIONS.md` decision 14)
- Sign-off of `DECISIONS.md` decision 14 and section F (the public-audience redesign)
- The design reviews at the Phase 11 and Phase 13 gates, and the decision on optional Phase 14
- Merging the redesign's pull request, and any deploy
```

and Phase 11 (Task 11.12) added a line beginning `- The Phase 11 newcomer check:`. Later phases may have added or reworded lines; read them first, and carry into the new text any open item it lacks. Then replace it all with the text below. In it:

- delete the line beginning `- Saved progress (only if Phase 14 was built)` if `PHASE-14-NOT-TAKEN` printed;
- fill the three `<date>`s and `<approved or not approved>` in the "For the record" paragraph from what `docs/plan.md` and `DECISIONS.md` already record (`grep -n "designer" docs/plan.md`; `grep -n "^| F7 \|Saved progress" DECISIONS.md`). Never infer a date; if one is not recorded, ask the user;
- in the deferred list, keep or drop the `Estimate.halfWidth` item by what `grep -c halfWidth src/engine/types.ts` prints: `0` means pull request #2 is in this branch, so delete that whole item (the one bullet whose bold title names `Estimate.halfWidth`); `1` means it is not, so keep the item as written.

The spec's commercial note is not dropped silently: the two commercial-note lines above are replaced by the sign-off line below, "including the proposed withdrawal of the spec's commercial note", which points at the proposed section F row from Task 15.8 and stays on this list for the designer's sign-off.

```markdown
## Owned by the designer, not the build

These parts of the definition of done cannot be passed by the builder and will be reported as open, never as done:

- The Phase 4 playtest (a person finishing a run without code or docs)
- The Phase 11 newcomer check: at least one person new to the game plays the opening and one turn, then answers the handoff's four questions: can they understand the dilemma, choose without specialist knowledge, explain the visible consequences, and do they want to continue? Open until run and written up.
- The newcomer playtest (spec milestone M5 for a general audience; the playtest row in `DECISIONS.md` section F; the protocol is `docs/playtest.md`): ten solo testers from the general public with no professional background in AI policy, government or forecasting. An informal group sharing one seed code is optional. It reports:
  - the spec's six metrics (Section 13): most-chosen option share per scenario below 60%; completion rate 80% or above; replay within a week 30% or above; testers who name a decision they would defend despite a bad outcome 50% or above, with two of five as the floor for a five-person round; the forecast slider used meaningfully (not left at 50%) in 70% of forecasts; testers who say the game pushed a policy line below 20%, split evenly by direction (its own question: whether the game seemed to favour one kind of policy)
  - the engagement handoff's four approachability checks: understands the dilemma; chooses without specialist knowledge; can explain the visible consequences; wants to continue (chooses Keep going at the pause after turn 1)
  - one neutrality question, asked in these words and reported on its own: "Did the game try to convince you AI is dangerous, or that it is safe?"
  - testers who choose Stop here at the pause still count: they answer the neutrality, policy and approachability questions, and their turn-1 option and forecast come from the pause card
  - per-step timing against the spec's budget: about 3 minutes a turn, about 5 minutes from the title to the pause card, about 25 minutes to the debrief, and under 30 minutes for a newcomer without help
- The age range for playtesters (the game includes an election deepfake and a biosecurity scenario)
- A preview address for playtesters, which only the designer can approve (no deploy is approved): phone testers need one, and so does the replay-within-a-week follow-up, which is reported as not measured without it
- Saved progress (only if Phase 14 was built): whether playtesters notice and use "Continue your game", and whether anyone finds a game kept in the browser unwelcome on a shared device
- Sign-off of each row in `DECISIONS.md` section F, including the proposed withdrawal of the spec's commercial note; confirmed rows move to section A
- The designer's answers on the deferred list below
- Merging the redesign's pull request, and any deploy

For the record, and the designer's rather than the build's: the review of the opening and one representative turn at the Phase 11 gate (<date>), the review of the debrief at the Phase 13 gate (<date>), and the decision on optional Phase 14 (<approved or not approved> on <date>).

## Deferred, not in this plan

Raised while planning the public-audience redesign and left out on purpose. Each needs the designer's decision before it becomes work.

- **Authored one-line adviser gists.** Advisers show only public fields today (D5): name, role, "Cares about", the option they back and their stance. A written gist per adviser per scenario is new content: it needs authoring, the copy-rule tests, and a check that no gist gives away an adviser's hidden bias, which `publicContent()` deliberately leaves out (`src/content/public.ts`). Wait until a playtest asks for it.
- **A chance event on turn 1.** Under current content no world event can fire on turn 1 (event windows open at Scenario 2), so the first consequences only ever report the player's own headline, and the pause card cannot yet show chance at work. Making turn 1 eventful is a content change (for example a delay-0 event on a Scenario 1 option) that needs a balance rerun and a section E entry in `DECISIONS.md`.
- **New everyday-stakes scenarios, such as hospitals or scams.** The engagement handoff's "use everyday stakes" is met here through framing only; the handoff itself says these are framing ideas, not claims that the scenarios exist. New scenarios mean new content with its real-world evidence, a balance rerun against Rules 4, 5 and 7, and a change to the eight-turn sequence (B1).
- **The `Estimate.halfWidth` field.** `displayed()` hands every component each estimate's unrounded half-width, 30 − 0.25 × the true State Capacity, so the hidden value can be read back exactly from the data. No screen renders it, and the redesign never reads it (non-negotiable 4). The band on screen is rounded outwards and narrows State Capacity only to within about 4 points, which is spec Section 5's intended signal, not a leak. The engine fix is pull request #2 (branch `fix/estimate-halfwidth-leak`, logged there as `DECISIONS.md` B43). Merge it to `main`, then merge `main` into this branch before this pull request, and renumber this branch's new B rows if they collide with its B43.
- **The Unknown Frontier's line "You did almost everything well".** It follows spec Section 10 ("The player did almost everything well"), but it reads as a verdict on the player's decisions, which the copy rules forbid for player-facing text. Changing it is an edit to `src/content/endings.json`. A question for the designer: does the copy rule apply to endings?
- **A same-world rewind.** Replaying one decision in the same world, after the debrief has revealed that world, would become a hindsight oracle that turns one draw into a verdict (B39; the debrief-order row in section F). What if across 1,000 fresh worlds, and the seed link for someone who has not played that world, stay the sanctioned ways to ask "what if".
- **Editable assumptions for ordinary players after the debrief.** The facilitator panel stays behind `?facilitator=1`, unchanged (decision 14). Offering "change the model and play again" to everyone is a new feature: it needs copy that keeps clear the numbers are assumptions, not findings, and a design for how an edited world is labelled when it is shared.
- **The Web Share API.** Sharing is clipboard only (decision 11), and the browser tests check that nothing is sent. A native share sheet would help on phones, but it changes that rule and cannot be tested in headless Chromium.
- **A Playwright mobile project.** The phone checks set a 360 × 740 viewport on desktop Chromium. A second project with a mobile device profile would add touch input and a mobile user agent, but would roughly double the e2e run time. Add it, scoped with tags, if a playtest finds a touch-only problem.
```

(c) Recount the progress line:

```bash
awk -v skip14="$([ -f src/ui/save.ts ] && echo 0 || echo 1)" '
  /^- \[.\] .*\*\*Phase 14/ { in14 = 1; next }
  /^- \[.\] / { in14 = 0 }
  /^  - \[[ x]\] / { if (in14 && skip14 == 1) next; total++; if ($0 ~ /^  - \[x\] 🟩/) done++ }
  END { printf "%d of %d (%d%%)\n", done, total, 100 * done / total }' docs/plan.md
```

`skip14` leaves out the Phase 14 sub-items unless Phase 14 was built, as Phase 8's rule says (after a decline there are none left anyway). On mocks of `docs/plan.md` this printed `41 of 63 (65%)` for Phase 8's own blocks (Phase 8's count), `63 of 63 (100%)` with every step ticked and Phase 14 declined, and `65 of 65 (100%)` with Phase 14 built. In the line starting `**Overall Progress:**`, replace the percentage and the `(D of T)` pair with what it printed; leave the rest of the line.

**Step 4: Run it and watch it pass**

```bash
grep -c "The three willingness-to-pay sessions" docs/plan.md
grep -c "Did the game try to convince you AI is dangerous, or that it is safe?" docs/plan.md
grep -c "^## Deferred, not in this plan" docs/plan.md
grep -c "^- \*\*" docs/plan.md
grep -n "<date>\|<approved or not approved>" docs/plan.md
grep -n "Phase 15" docs/plan.md
```

Expected: `0`, `1`, `1`; then `9` (the nine deferred items; no other line in the file starts with `- **`), or `8` if you dropped the `Estimate.halfWidth` item because pull request #2 is in; the placeholder `grep` prints nothing; the Phase 15 block shows its first two items `- [x] 🟩`, its gate item still `- [ ] ⬜` and its heading `🟨`.

**Step 5: Commit**

```bash
git add docs/plan.md
git commit -m "docs(plan): Phase 15 progress, the open human items and the deferred list" -m "The human-only items now describe a public playtest (ten testers, the spec's six metrics, four approachability checks, a neutrality question, per-step timing) and everything awaiting the designer, including the proposed withdrawal of the commercial note. Deferred work is listed with reasons."
```

### Task 15.10: Final gate from a clean clone, and the timing record

**Files:**
- Modify: `docs/plan.md` (the Phase 15 gate item's text; the progress line)
- Modify: `README.md` (the bundle size, only if it changed)
- Test: the full local gate

The definition of done asks for gates "reproducible from a clean checkout" (handoff Section 7). A clone also proves nothing depends on an ignored local file.

**Step 1: Write the failing test**

The gate itself. From the worktree root, clone the branch into a scratch directory. The commands run inside the clone in a subshell, `( cd … )`, so your own working directory stays the worktree. Every block below sets `CLEAN` itself, because shell variables do not carry between blocks:

```bash
CLEAN="${TMPDIR:-/tmp}/ai-2032-clean"
rm -rf "$CLEAN"
git clone --quiet --no-hardlinks --branch "$(git branch --show-current)" "$(git rev-parse --show-toplevel)" "$CLEAN"
( cd "$CLEAN" && npm ci && npx playwright install chromium )
```

**Step 2: Run it and watch it fail**

Nothing should fail; this step records numbers. First the gate, inside the clone:

```bash
CLEAN="${TMPDIR:-/tmp}/ai-2032-clean"
lsof -nP -iTCP:4173 -sTCP:LISTEN          # must print nothing; stop any process it lists
( cd "$CLEAN" && npm run lint && npm run test && npm run balance && npm run build && du -sk dist && PLAYWRIGHT_JSON_OUTPUT_NAME="$CLEAN/e2e.json" /usr/bin/time -p npm run e2e -- --reporter=list,json )
node -e '
const r = require(process.argv[1]);
const rows = [];
const walk = (s) => { (s.suites ?? []).forEach(walk); (s.specs ?? []).forEach((sp) => sp.tests.forEach((t) => t.results.forEach((res) => rows.push([res.duration, sp.title])))); };
r.suites.forEach(walk);
rows.sort((a, b) => b[0] - a[0]);
console.log(rows.slice(0, 3).map(([d, t]) => `${(d / 1000).toFixed(1)} s  ${t}`).join("\n"));
console.log(`${rows.length} tests: ${r.stats.expected} passed, ${r.stats.unexpected} failed, ${r.stats.flaky} flaky; wall clock ${(r.stats.duration / 1000).toFixed(1)} s`);
' "${TMPDIR:-/tmp}/ai-2032-clean/e2e.json"
```

Then the check that the branch changed no engine file, content JSON or dependency. Run it in the worktree, against GitHub's `main`, not in the clone: in the clone, `origin/main` is the worktree's local `main`, which may be stale, and if pull request #2 was merged in Phase 8 a stale `main` would list its engine files here although this branch is fine. The first line returns to the worktree the clone came from:

```bash
cd "$(git -C "${TMPDIR:-/tmp}/ai-2032-clean" config --get remote.origin.url)"
git fetch origin
git diff --stat origin/main...HEAD -- src/engine src/content/game.json src/content/events.json src/content/advisers.json src/content/endings.json src/content/scenarios package.json package-lock.json
```

Expected:

- lint exits 0; every Vitest suite passes (write down `<V15>`, the count in `Tests  N passed`); balance ends `Balance check passed.` with the pooled shares unchanged since Phase 8 (35.4% / 27.5% / 37.1%); the build succeeds; `du -sk dist` is below 16384 (about 1972 at `a11ef34`).
- `npm run e2e`: `<N15> passed`, where `<N15>` is `<N14>` + `<S>` (9, or 11 if Phase 14 was built; Task 15.2). `time -p` prints `real …`.
- The `node` summary prints the three slowest tests and the totals. No test should take more than 30 s, half the new limit. If one does, split it rather than raise the limit again.
- The `git diff --stat` prints nothing: the redesign changed no engine file, no content JSON and no dependency (non-negotiables 1 and 9; `src/content/public.ts` may differ, which D11 allows). The three dots compare `HEAD` with the point where it last met GitHub's `main`, so pull request #2's engine files, if merged in, are not listed. If a file is listed, do not change it: stop and ask.

(`npm run e2e -- --reporter=list,json` prints the usual list and also writes the JSON the summary reads. On the planning machine at `a11ef34` the same summary read `5.4 s` for each axe walk, `4.7 s` for reproducibility, and `17 tests … wall clock 10.4 s`.)

**Step 3: Implement**

In the worktree, record the numbers. If you are not sure which directory you are in, return to the worktree the clone came from first:

```bash
cd "$(git -C "${TMPDIR:-/tmp}/ai-2032-clean" config --get remote.origin.url)" && git rev-parse --show-toplevel
```

In `docs/plan.md`, replace the Phase 15 gate item

```markdown
  - [ ] ⬜ Gate: all local gates green; the pull request is ready for the designer. Stop at completion.
```

with

```markdown
  - [ ] 🟨 Gate from a clean clone on <YYYY-MM-DD>: all local gates green; unit tests <V15> passed; e2e <N15> passed in <PW15> s (Phase 8 baseline: 17 in <PW> s; Phase 8 gate: 19 in <PW8> s; before this phase: <N14> in <PW14> s); slowest test <T1> s; `dist` <K> KB. Next: the pull request for the designer. Stop at completion.
```

filling every `<…>` from Step 2 and from the Phase 8 lines above it in the same file. If `du -sk dist` moved the README's "about <K> MB" figure by 0.1 MB or more, update that sentence too. Recount the progress line with the Task 15.9 `awk` (it does not change here: this item is not yet ticked). Then remove the clone:

```bash
rm -rf "${TMPDIR:-/tmp}/ai-2032-clean"
```

**Step 4: Run it and watch it pass**

```bash
grep -n "Gate from a clean clone" docs/plan.md
grep -n "<V15>\|<N15>\|<PW15>\|<T1>\|<K>\|<YYYY-MM-DD>\|<PW>\|<PW8>\|<N14>\|<PW14>" docs/plan.md README.md
git status --short
```

Expected: one line; nothing; only `M docs/plan.md` (and `M README.md` if the size changed).

**Step 5: Commit**

```bash
git add docs/plan.md README.md
git commit -m "docs(plan): Phase 15 gate green from a clean clone" -m "lint, test, balance, build and e2e pass from a fresh clone of the branch. e2e: <N15> passed in <PW15> s (Phase 8 baseline 17 in <PW> s). dist <K> KB. No engine, content JSON or dependency change on the branch."
```

### Task 15.11: Screenshots and the pull request (ask first)

**Files:**
- Create, outside the repository: `$SHOTS/shots.config.ts`, `$SHOTS/shots.spec.ts`, `$SHOTS/out/*.png`, `$SHOTS/pr.md`
- Modify: `docs/plan.md` (tick the Phase 15 gate item once the pull request exists)

Nothing in this task is pushed, opened or published until the user says yes in chat (D10; the brief's handover). The designer approves the merge and any deploy; this task does neither.

**Step 1: Write the failing test**

Take the screenshots with a throwaway spec that lives outside the repository and borrows the repository's `node_modules` and `e2e/play.ts` helpers (checked during planning: Playwright resolves both through a `node_modules` symlink and an absolute import path). Use your session's scratchpad if it has one:

```bash
REPO="$(git rev-parse --show-toplevel)"
SHOTS="${TMPDIR:-/tmp}/ai-2032-shots"
rm -rf "$SHOTS" && mkdir -p "$SHOTS/out" && ln -s "$REPO/node_modules" "$SHOTS/node_modules"
cat > "$SHOTS/shots.config.ts" <<'EOF'
import { defineConfig, devices } from "@playwright/test";

// Throwaway, outside the repository: screenshots of the redesign for the pull request.
export default defineConfig({
  testDir: "__SHOTS__",
  outputDir: "__SHOTS__/results",
  timeout: 120_000,
  reporter: "list",
  use: { baseURL: "http://localhost:4173", ...devices["Desktop Chrome"] },
  webServer: {
    command: "npm run preview -- --port 4173 --strictPort",
    cwd: "__REPO__",
    url: "http://localhost:4173",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
EOF
cat > "$SHOTS/shots.spec.ts" <<'EOF'
import { expect, test, type Page } from "@playwright/test";
import { LABEL, playToDebrief } from "__REPO__/e2e/play";

// Eight screens of one world, at 375 x 667 and 1280 x 800, in light and dark: 32 images.
const OUT = "__SHOTS__/out";

async function shoot(page: Page, name: string, fullPage = true) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
}

for (const size of [{ name: "375", width: 375, height: 667 }, { name: "1280", width: 1280, height: 800 }]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`screenshots at ${size.name} (${colorScheme})`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
      const at = (screen: string) => `${size.name}-${colorScheme}-${screen}`;

      await page.goto("/");
      await shoot(page, at("1-title-first-screen"), false);                    // only what a new visitor sees first
      await page.goto("/?seed=SHOTS-001");                                        // the same world in all four sets
      await page.getByRole("button", { name: LABEL.start }).click();
      await shoot(page, at("2-briefing"));
      await page.getByRole("button", { name: LABEL.continueToForecast }).click();
      await page.getByRole("button", { name: "Compare with your advisers" }).click();
      await shoot(page, at("3-forecast-compared"));
      await page.getByRole("button", { name: LABEL.lockIn }).click();
      await page.locator('input[name="choice"]:enabled').first().check();
      await expect(page.getByRole("heading", { name: /^If you choose option/ })).toBeVisible();
      await shoot(page, at("4-decision-preview"));
      await page.getByRole("button", { name: LABEL.confirm }).click();
      await page.locator('input[name="track"]:enabled').first().check();
      await shoot(page, at("5-investment-ladder"));
      await page.getByRole("button", { name: LABEL.investIn }).click();
      await expect(page.getByRole("heading", { name: LABEL.newsHeading })).toBeVisible();
      await shoot(page, at("6-consequences"));
      await page.getByRole("button", { name: LABEL.next }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(LABEL.pauseHeading);
      await page.getByRole("button", { name: "Stop here" }).click();
      await shoot(page, at("7-pause-stop-here"));
      await page.getByRole("button", { name: LABEL.keepGoing }).click();
      await playToDebrief(page);
      await expect(page.getByText("Weighing the options you had")).toHaveCount(0, { timeout: 10_000 });
      await shoot(page, at("8-debrief"));
    });
  }
}
EOF
sed -i '' "s#__REPO__#$REPO#g; s#__SHOTS__#$SHOTS#g" "$SHOTS/shots.config.ts" "$SHOTS/shots.spec.ts"
ls "$SHOTS/out" | wc -l
```

(On Linux, `sed -i` takes no `''`.)

**Step 2: Run it and watch it fail**

Expected: `0` screenshots so far.

**Step 3: Implement**

Build, then take them (port 4173 free first):

```bash
npm run build
npx playwright test --config="${TMPDIR:-/tmp}/ai-2032-shots/shots.config.ts"
ls "${TMPDIR:-/tmp}/ai-2032-shots/out" | wc -l
```

Expected: `4 passed`, then `32` (eight screens × two widths × two schemes). Open a few and check them by eye: the title's button is on the first screen at 375 and 1280, dark mode is really dark, nothing is cut off at 375. Stop nothing: the config's own preview server exits with the run, and `lsof -nP -iTCP:4173 -sTCP:LISTEN` then prints nothing.

Write the pull request description to `${TMPDIR:-/tmp}/ai-2032-shots/pr.md`. Fill every `<…>` from Task 15.10 and from `git fetch origin && git log --oneline origin/main..HEAD`, keep the Phase 14 sentence that applies, and adjust each phase bullet to what the branch actually contains. The checklist is what the designer ticks while looking at the screenshots:

````markdown
## Summary

AI 2032 is now built for everyone, not for policy workshops (`DECISIONS.md` decision 14). This branch reworks the interface so a first-time visitor starts from a dilemma and one button, sees what their choice did and did not change, and ends on a debrief built to invite argument rather than a verdict. Whether newcomers find it so is the open playtest. The engine, the content JSON, the balance and the dependencies are unchanged.

- **The opening (Phase 9).** The title leads with the dilemma and one button, "Try your first decision", inside the first screen at 375 × 667, 726 × 900 and 1280 × 800. The seed code moves under "Play the same world as a friend". The print-production labels (720PT, 48MM, "Fig. NN") are gone.
- **Briefing and forecast (Phase 10).** Each adviser shows what they care about and which option they back, with a "Who backs what" split. The forecast asks for the player's own estimate first; "Compare with your advisers" then puts theirs on the same scale. The briefing can be reopened from the later steps.
- **Decision, investment and consequences (Phase 11).** Picking an option previews its stated effects and the Political Capital left. Each investment track shows its next unlock. The consequences screen has four parts: your decision, what the world noticed, what you can measure now, and what is still unknown. The Political Capital rules and track bonuses now come from public content.
- **The pause after turn 1 (Phase 12).** Every game pauses once after the first decision: Keep going, or Stop here with a link to the same world.
- **The debrief (Phase 13).** At a glance first, then What if (opened on the most arguable decision), Decision quality versus luck, the reference panels folded until wanted, Talk it over, and Share your run.
- **Save and resume (Phase 14).** <Keep one: "A game in progress is kept in this browser (the seed code and the player's actions, never the hidden world), with an opt-in Continue your game on the title." or "Not built: the designer did not approve saved progress.">
- **Safety net, accessibility and documents (Phases 8 and 15).** Two fixes with regression tests (a stale pick after commissioning analysis blanked the page; the final turn's steps rail), a test that `publicContent()` carries nothing hidden, a lint guard for play screens, a stricter axe check (any impact, best-practice rules included), an axe, sideways-scroll (360 and 320 px), reduced-motion and focus-ring sweep of every new state, a 60-second test timeout, a README for a general audience and a playtest protocol (`docs/playtest.md`).

## What did not change

- No file under `src/engine/` and no content JSON under `src/content/` changed. `src/content/public.ts` now also publishes the Political Capital rules and track bonuses, and nothing hidden.
- Balance: the pooled shares are still 35.4% / 27.5% / 37.1%.
- No new dependency. Still a static site: no backend, no accounts, no analytics.

## Decisions for the designer

`DECISIONS.md` section F lists every decision the redesign made, as proposals. Please say which rows you confirm, which to change and which to reject; confirmed rows then move to section A. The deferred work, with reasons, is at the end of `docs/plan.md`.

## How it was tested

GitHub Actions cannot run on this repository (a billing block), so the CI run on this pull request will fail within seconds without running anything. Every gate was run locally, from a clean clone, on <YYYY-MM-DD>:

- `npm run lint`: no problems
- `npm run test`: <V15> tests passed
- `npm run balance`: passed
- `npm run build`: `dist` is <K> KB (the limit is 16384)
- `npm run e2e`: <N15> passed in <PW15> s (17 in <PW> s before the redesign)

## Screenshots

Seed code `SHOTS-001`, at 375 × 667 and 1280 × 800, in light and dark. Each set has eight images named `<width>-<scheme>-<n>-<screen>.png`; the title is the first screen only, the rest are full pages.

Sets attached:

- [ ] 375 × 667, light
- [ ] 375 × 667, dark
- [ ] 1280 × 800, light
- [ ] 1280 × 800, dark

What to check in each set:

- [ ] 1, title: "Try your first decision" is visible without scrolling; the fictional-unit notice is there; no print labels
- [ ] 2, briefing: every adviser shows "Cares about" and the option they back; "Who backs what" lists every open option
- [ ] 3, forecast: the advisers' marks sit on the slider's own scale, with no average mark
- [ ] 4, decision: the preview names the option and the Political Capital left; on the phone the confirm bar sits at the foot
- [ ] 5, investment: each track shows its next unlock
- [ ] 6, consequences: the four parts, in the main column
- [ ] 7, pause card with Stop here open: the world link wraps inside the screen and says it is not saved progress
- [ ] 8, debrief: At a glance comes first; the four reference panels are folded
- [ ] Throughout: nothing is cut off or scrolls sideways at 375; dark mode is dark everywhere; no meaning is carried by colour alone
- [ ] Throughout: no shadows, gradients, emoji, badges, scores to beat or red/green good-bad colouring; square corners; the navy accent only on controls; no print-production labels (720PT, 48MM, "Fig. NN")

## Still open

Only people can close these; they are listed at the end of `docs/plan.md`:

- the newcomer playtest with ten members of the public (`docs/playtest.md`), including the neutrality question and per-step timing against the spec's budget
- the designer's sign-off on section F and answers on the deferred list
- merging this pull request, and any deploy (this pull request deploys nothing)

<The attribution line your session requires for pull requests, if any>
````

Then ask the user, in these words, and wait for a clear yes:

> The redesign branch `<branch>` passes every local gate from a clean clone (<N15> browser tests in <PW15> s). May I push it to `origin` (if an earlier gate already pushed it, this sends only the newer commits), open a pull request into `main` titled "Redesign AI 2032 for a general audience" with the description in `<path to pr.md>`, and then push one follow-up commit that records the pull request in `docs/plan.md`? Nothing will be merged or deployed. The 32 screenshots are in `<path to out>`; GitHub's command line cannot attach images, so they need dragging into the pull request by hand.

**Step 4: Run it and watch it pass**

Only after the user says yes:

```bash
git push -u origin "$(git branch --show-current)"
gh pr create --base main --head "$(git branch --show-current)" --title "Redesign AI 2032 for a general audience" --body-file "${TMPDIR:-/tmp}/ai-2032-shots/pr.md"
```

Expected: `gh` prints the pull request URL. If `gh` says a pull request for this branch already exists, do not open a second: update its description with `gh pr edit "$(git branch --show-current)" --body-file "${TMPDIR:-/tmp}/ai-2032-shots/pr.md"` and use its URL. GitHub will start CI and it will fail within seconds on the billing block, not on the code; say so to the user. Then, in `docs/plan.md`, change the gate item's `- [ ] 🟨 Gate from a clean clone` to `- [x] 🟩 Gate from a clean clone`, replace its closing `Next: the pull request for the designer. Stop at completion.` with `Pull request <URL> opened for the designer. Stop at completion.`, change the Phase 15 heading to `- [x] 🟩 **Phase 15: Accessibility sweep, docs and handover**`, and recount the progress line with the Task 15.9 `awk` (every counted step is now done: `T of T (100%)`).

**Step 5: Commit**

```bash
git add docs/plan.md
git commit -m "docs(plan): Phase 15 complete; pull request opened for the designer" -m "Pull request <URL>. The items only people can complete stay open."
git push
```

Tell the user where the screenshots are and ask them to attach them to the pull request against the checklist in its description. Do not merge.

### Deferred, not in this plan

Each of these came up while planning and was left out on purpose. They are listed in `docs/plan.md` by Task 15.9 so the designer can pick them up, except the `Estimate.halfWidth` item when pull request #2 is already in this branch.

- **Authored one-line adviser gists.** Advisers show only public fields today (D5): name, role, "Cares about", the option they back and their stance. A written gist per adviser per scenario is new content: it needs authoring, the copy-rule tests, and a check that no gist gives away an adviser's hidden bias, which `publicContent()` deliberately leaves out (`src/content/public.ts`). Wait until a playtest asks for it.
- **A chance event on turn 1.** Under current content no world event can fire on turn 1 (event windows open at Scenario 2), so the first consequences only ever report the player's own headline, and the pause card cannot yet show chance at work. Making turn 1 eventful is a content change (for example a delay-0 event on a Scenario 1 option) that needs a balance rerun and a section E entry in `DECISIONS.md`.
- **New everyday-stakes scenarios, such as hospitals or scams.** The engagement handoff's "use everyday stakes" is met here through framing only; the handoff itself says these are framing ideas, not claims that the scenarios exist. New scenarios mean new content with its real-world evidence, a balance rerun against Rules 4, 5 and 7, and a change to the eight-turn sequence (B1).
- **The `Estimate.halfWidth` field.** `displayed()` hands every component each estimate's unrounded half-width, 30 − 0.25 × the true State Capacity, so the hidden value can be read back exactly from the data. No screen renders it, and the redesign never reads it (non-negotiable 4). The band on screen is rounded outwards and narrows State Capacity only to within about 4 points, which is spec Section 5's intended signal, not a leak. The engine fix is pull request #2 (branch `fix/estimate-halfwidth-leak`, logged there as `DECISIONS.md` B43). Merge it to `main`, then merge `main` into this branch before this pull request, and renumber this branch's new B rows if they collide with its B43.
- **The Unknown Frontier's line "You did almost everything well".** It follows spec Section 10 ("The player did almost everything well"), but it reads as a verdict on the player's decisions, which the copy rules forbid for player-facing text. Changing it is an edit to `src/content/endings.json`. A question for the designer: does the copy rule apply to endings?
- **A same-world rewind.** Replaying one decision in the same world, after the debrief has revealed that world, would become a hindsight oracle that turns one draw into a verdict (B39; the debrief-order row in section F). What if across 1,000 fresh worlds, and the seed link for someone who has not played that world, stay the sanctioned ways to ask "what if".
- **Editable assumptions for ordinary players after the debrief.** The facilitator panel stays behind `?facilitator=1`, unchanged (decision 14). Offering "change the model and play again" to everyone is a new feature: it needs copy that keeps clear the numbers are assumptions, not findings, and a design for how an edited world is labelled when it is shared.
- **The Web Share API.** Sharing is clipboard only (decision 11), and the browser tests check that nothing is sent. A native share sheet would help on phones, but it changes that rule and cannot be tested in headless Chromium.
- **A Playwright mobile project.** The phone checks set a 360 × 740 viewport on desktop Chromium. A second project with a mobile device profile would add touch input and a mobile user agent, but would roughly double the e2e run time. Add it, scoped with tags, if a playtest finds a touch-only problem.

### Phase 15 gate

Task 15.10 ran these. To run them again, start from the worktree root with port 4173 free (`lsof -nP -iTCP:4173 -sTCP:LISTEN` prints nothing). The gate runs in a fresh clone, inside a subshell; the engine check runs in the worktree, against GitHub's `main`:

```bash
CLEAN="${TMPDIR:-/tmp}/ai-2032-clean"
rm -rf "$CLEAN"
git clone --quiet --no-hardlinks --branch "$(git branch --show-current)" "$(git rev-parse --show-toplevel)" "$CLEAN"
( cd "$CLEAN" && npm ci && npx playwright install chromium && npm run lint && npm run test && npm run balance && npm run build && du -sk dist && /usr/bin/time -p npm run e2e )
git fetch origin
git diff --stat origin/main...HEAD -- src/engine src/content/game.json src/content/events.json src/content/advisers.json src/content/endings.json src/content/scenarios package.json package-lock.json
rm -rf "$CLEAN"
```

What must be true:

1. Lint exits 0; every Vitest suite passes; balance prints `Balance check passed.` with pooled shares 35.4% / 27.5% / 37.1%; the build succeeds and `du -sk dist` is below 16384.
2. `npm run e2e` passes `<N14>` + 9 tests, or `<N14>` + 11 if Phase 14 was built. The new ones in `e2e/polish.spec.ts` are both `axe finds no violations on the redesigned opening and first turn` walks, both phone walks, both `axe finds no violations in the redesigned debrief…` scans, both focus-ring walks, `the pause card's Stop here opens, closes and leads back to the start from the keyboard alone`, and, if Phase 14 was built, both `axe finds no violations on the title with the continue offer` scans. Every axe scan uses Phase 8's check: any violation at any impact fails, best-practice rules included. No test takes more than 30 s. The duration is recorded in `docs/plan.md` beside the Phase 8 baseline.
3. The `git diff --stat` prints nothing: no engine, content JSON or dependency change on the whole branch (pull request #2's engine change, if merged in from GitHub's `main`, is not this branch's change and is not listed).
4. `grep -n -i "workshop\|willingness" README.md` prints nothing. `docs/playtest.md` exists. `DECISIONS.md` section F's status is dated and names what is confirmed; the playtest row carries the neutrality question and gives the policy-line metric its own question; section B has the Playwright and sweep rows; no row moved to section A without the designer's written confirmation.
5. `docs/plan.md`: Phase 15 is `🟩` once the pull request exists, the progress line is recounted, and the "Owned by the designer, not the build" list is open: nothing there is claimed as done.
6. The pull request exists only if the user said yes; nothing is merged or deployed.

**Stop and wait for the designer (completion).** Report, briefly: what the redesign changed, the gate numbers, the pull request link, where the screenshots are, and the open items from `docs/plan.md`. Ask the designer three things: which section F rows they confirm; whether to merge the pull request; and whether the questions in the deferred list (above all The Unknown Frontier's line) should become work. If `grep -c halfWidth src/engine/types.ts` still prints `1`, add a fourth: whether pull request #2 (the `Estimate.halfWidth` fix) merges to `main` first, so this branch can take it before its own pull request merges.

**After the designer replies, and only then:** for each row the designer confirms in writing, move it from section F to section A of `DECISIONS.md`:

1. Cut the row from the section F table.
2. Paste it as the last row of the section A table, renumbered to the next plain number (15, then 16, and so on): change its first cell from `F<k>` to that number, and add ` Confirmed by the designer on <YYYY-MM-DD> (was F<k>).` to the end of its Decision cell.
3. Update the section A heading's date list, which Phase 8 set to `## A. Confirmed with the designer (2026-09-18; decision 14 on 2026-09-19)`, for example `(2026-09-18; decision 14 on 2026-09-19; decisions 15 to 21 on <YYYY-MM-DD>)`.
4. In section F's status sentence, move those numbers from "awaiting" to "Moved to section A on <YYYY-MM-DD>: F<k> → <n>, …". If section F is then empty, replace its table with `All rows were confirmed and moved to section A on <YYYY-MM-DD>.`
5. Find references to the old numbers and update them: `grep -rnE "\bF[0-9]+\b" README.md docs/plan.md docs/playtest.md src e2e tests` (read each hit: many `F` matches are unrelated).
6. Check the table shape: `awk -F'|' '/^\| ([0-9]+|F[0-9]+|B[0-9]+) \|/ { if (NF != 6) print "bad row: " $2 }' DECISIONS.md` prints nothing.
7. Commit (`docs(decisions): move designer-confirmed rows to section A`), and push to the pull request branch only if the user agrees.

Rows the designer rejects stay in section F with their Decision cell ending "Rejected by the designer on <YYYY-MM-DD>", and the work they describe becomes a new task for the user to schedule, not something this plan undoes.


---

