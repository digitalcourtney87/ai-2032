# Plan execution handoff: public-engagement UI (Phases 8–15)

2026-09-19

## Purpose of the next session

Execute the implementation plan at `docs/plans/2026-09-19-public-engagement-ui.md`. The plan is complete, self-contained and committed on `main` (commit `96d6c72`). Nothing from it has been implemented yet — the codebase is unchanged since `a11ef34`.

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

- The planning session's worktree is `.claude/worktrees/ui-engagement-handoff-plan-7de72b` (branch `claude/ui-engagement-handoff-plan-7de72b`, now equal to `main`). You may work there or in the main checkout; its scratchpad drafts under `/private/tmp/` are disposable — the committed plan supersedes them.
- The plan was machine-drafted and adversarially reviewed but not machine-executed: where it and the code disagree, the code wins — follow the plan's own "stop and ask" escape hatches rather than forcing an anchor.
