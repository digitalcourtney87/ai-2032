# Plan execution handoff: public-engagement UI (Phases 8–15)

2026-09-19 (updated same day, after Phase 9)

## Current state — resume here

**Phases 8 and 9 are complete and committed on the feature branch `redesign/public-engagement`. The next session starts at Phase 10** ("Briefing and forecast"), beginning with its "Before Task 10.1" checklist (`git tag -f phase-10-start`, verify `continueToForecast` in `e2e/play.ts`, `e2e/engagement.spec.ts` exists).

Commits on the branch, oldest first: `36a7e50` (8.2 helpers/axe), `89f9774` (8.3–8.6 fixes and guards), `3426a90` (Phase 8 gate), `d8b5172` (9.1 print labels), `54a6c37` (9.2 12px labels), `1a90529` (9.3 dilemma-first opening), `ed5b215` (9.4 link-preview meta), `a67434a` (9.5 decisions record), `55153c2` (Phase 9 gate).

State at the Phase 9 gate: lint clean; `npm run test` 257 passed; `npm run balance` passed (35.4/27.5/37.1); `npm run build` → `dist` 1,976 KB; `npm run e2e` **29 passed**; no `Begin` in `src`/`e2e`; no `figureId`/`720pt`/`48mm` in `src`. Progress: 73% (46 of 63).

Notes a new session needs:

- Pull request #2 (`fix/estimate-halfwidth-leak`) was still **OPEN** when checked; the designer chose to start without it. The plan says to merge `origin/main` into the branch if it lands later — check `gh pr view 2 --json state --jq .state`.
- The leftover planning worktree `.claude/worktrees/ui-engagement-handoff-plan-7de72b` was **deleted** — its second tsconfig made `eslint .` fail on every file. Keep `.claude/worktrees/` free of tsconfig-bearing checkouts or lint breaks again.
- `docs/plan.md` and `DECISIONS.md` now carry the Phases 8–15 blocks and section F rows (Phase 8 Task 8.7); Phase 9's records are written (Task 9.5). Keep ticking status lines as you go.
- `e2e/play.ts` has the `LABEL` constants — `LABEL.start` is `"Try your first decision"`. `e2e/engagement.spec.ts` holds the Phase 9 tests. The debrief root has `data-testid="debrief"`.
- Two real bugs were fixed along the way: a stale selected-option crash after commissioning analysis, and the final turn's steps rail listing Investment. Regression tests live in `e2e/regressions.spec.ts`.
- The title h1 takes App's step-heading ref through a `headingRef` prop; the focus effect skips the title until a game has started. Phase 12 and 14 anchor on this.

## Purpose of the next session

Execute the implementation plan at `docs/plans/2026-09-19-public-engagement-ui.md`. The plan is complete, self-contained and committed on `main` (commit `96d6c72`). Phases 8–9 are done (see "Current state" above); the codebase baseline was `a11ef34`.

The plan implements the public-audience redesign briefed in `docs/ui-engagement-handoff.md`: the user's clarification there ("Everyone — it should be interesting to everyone") is the authoritative audience, superseding the spec's workshop framing.

## How the plan is organised

- **Phases 8–15**, continuing `docs/plan.md` (which ends at Phase 7). Each phase is a list of bite-sized TDD tasks (failing test → implement → pass → commit) ending at a gate.
- **The shared contract** at the top of the plan is required reading: decisions D1–D13 (logged into `DECISIONS.md` by Phase 8 as row 14 and section F rows F1–F12), the shared names later phases assume earlier ones created, and eleven non-negotiables every task must respect.
- Quoted line numbers and test counts were measured against `a11ef34`; each phase says when to re-measure or anchor on what an earlier phase wrote.

## Start here

1. Read `CLAUDE.md`, this handoff, and the plan's header + shared contract. Read a phase in full before starting it.
2. Work on a feature branch, never `main` (`DECISIONS.md` F9 once Phase 8 logs it). Phase 8 Task 8.1 Step 1 checks this and names the expected branch (`redesign/public-engagement`) if you are on `main`.
3. Phase 8 Task 8.1 Step 2 checks whether pull request #2 (`fix/estimate-halfwidth-leak`, removing `Estimate.halfWidth`) has merged; it handles either answer — do not copy that fix by hand.
4. Phase 8 Task 8.7 writes the Phases 8–15 blocks into `docs/plan.md` and the decisions into `DECISIONS.md`; after that, tick status lines as you go.

## Gates and git

- Every gate is **local**: `npm run lint && npm run test && npm run balance && npm run build && npm run e2e`. GitHub Actions has never run (billing block) — do not rely on it.
- Commit each green gate to the feature branch. **Do not push** until the Phase 15 gate, or earlier if the designer asks. Phase 15 opens the pull request only after the user says yes.
- Never use `git stash`; undo temporary edits with `git checkout -- <file>` only. Free port 4173 before any Playwright run.

## Stop and wait for the designer at

- **Phase 11 gate** — review of the opening and one representative turn.
- **Phase 13 gate** — review of the new debrief.
- **Phase 14** — optional save-and-resume; build only if the designer approves `DECISIONS.md` F7 (spec §13 lists saved games as out of scope).
- **Phase 15 / completion** — designer confirms section F rows, decides on merge, and the deferred-questions list.

Human-only items (newcomer playtest timing, whether anyone uses "Continue your game", the designer's sign-offs) are reported as open, never claimed as done.

## Cautions that shape every task

- The engine is untouched; no edits under `src/engine/**`. Content gains only the public fields Phase 11 specifies (`rules`, `trackBonuses`).
- Hidden information stays hidden: components render only `displayed()` and `publicContent()`; never render `Estimate.halfWidth`, estimate-band deltas, or a stated-minus-measured remainder; never name which interrupt comes or when.
- Copy rules: British English, "Under this game's assumptions" prefix on simulated figures, never tell the player a decision was right or wrong, biosecurity at policy level.
- Fixed dependencies — add nothing. Accessibility bar is axe-clean at any impact, light and dark, with heading order enforced.

## Useful context, not required

- The planning session's worktree `.claude/worktrees/ui-engagement-handoff-plan-7de72b` has been removed (it broke `eslint .`; see "Current state"). Its branch `claude/ui-engagement-handoff-plan-7de72b` still exists and equals `main`. Scratchpad drafts under `/private/tmp/` are disposable — the committed plan supersedes them.
- The plan was machine-drafted and adversarially reviewed but not machine-executed: where it and the code disagree, the code wins — follow the plan's own "stop and ask" escape hatches rather than forcing an anchor.
