# Cursor handoff: architecture reliability

## Start here

The user commissioned an architecture review, asked three **Sol** subagents to investigate the candidates, and requested an implementation plan. They then asked for this Cursor handoff and for all planning documents to be committed on `main`.

**Next session:** implement the mandatory tasks in [the architecture reliability plan](plans/2026-09-20-architecture-reliability.md). The plan is the execution source of truth; this handoff supplies conversation context, not a second specification.

**Starting code revision:** `9a1d07e` (`Merge branch 'redesign/public-engagement'`). The documentation commit containing this handoff follows that revision. No application code, content, tests or dependencies were changed during the review/planning work. No implementation tasks have been completed.

The user explicitly authorised committing these planning documents on `main`. That does not direct future implementation onto `main`: follow the plan's feature-branch workflow (`codex/` prefix) for code changes. Nothing in this session authorises merging or deployment. No push was requested.

## Read before editing

1. `CLAUDE.md` and any applicable `AGENTS.md` instructions.
2. `docs/plans/2026-09-20-architecture-reliability.md`, in full.
3. The project documents listed in that plan, especially `DECISIONS.md` and the relevant design-spec sections.

**Historical-document trap:** `docs/plan-execution-handoff.md` describes an earlier public-engagement redesign and still says to resume at Phase 10. That is not the next task here: the redesign was merged at the starting revision above. Similarly, old phase-specific restrictions do not replace the new plan's explicitly scoped engine work.

No `CONTEXT.md` or `docs/adr/` existed during the review. Existing terminology and decisions came from `README.md`, the spec and `DECISIONS.md`. Do not invent a parallel decision history or relitigate settled gameplay choices.

## What the investigations established

All three Sol investigations finished and were read-only. Detailed evidence, file anchors, tests and required changes are already in the plan.

- **Debrief lifecycle — first priority:** failure paths can leave calculation promises pending, soundness errors can be ignored, and What-if failures lack visible recovery. Preserve existing stale-result protections while giving one module ownership of worker readiness, request settlement and disposal.
- **Resolved turn — structural improvement:** no current player-visible defect was demonstrated. Current callers coordinate correctly, but turn identity and before/after snapshots belong together. Keep reading stages outside the engine and retain the useful `consequencesOf` privacy implementation.
- **Condition interpretation — accepted-content defect:** validation permits expressions that probability and luck interpret incorrectly. Safe in-memory examples proved nested hidden alternatives can lose luck links and repeated facts/draws can be treated as independent. These examples were not evidence of a defect in current authored scenarios.
- **Additional startup defect:** a shared configuration with all world-profile weights zero passes decoding but throws when applied during page startup. Invalid effective URL configuration should fall back atomically to published assumptions, while direct programmatic application remains strict.

The initial visual HTML report was a temporary review artifact, not the implementation contract. The committed plan supersedes it; no dependency on the temporary file is needed.

## Decisions made while planning

These are explicit defaults in the plan, **not separately approved gameplay changes**:

- One worker; user-triggered retry; no arbitrary timeout or automatic retry loop.
- Cancel obsolete work on reset/start/disposal; native failures invalidate the worker, and retry recreates and configures it.
- Visible recoverable failure states; never fabricate decision rankings or show a stale answer as a new result.
- Session owns coherent completed-turn facts; App retains briefing/news/pause/debrief reading stages.
- Enforce and centralise the supported condition subset now. Keep recursive truth-only expressions valid.

**Important tradeoff:** the condition subagent preferred full recursive probabilistic semantics plus frozen decision-time luck data. The plan deliberately chooses the smaller safe implementation: reject unsupported probability expressions, preserve current authored outputs and defer the full grammar extension. Section 7 records the extension requirements. Do not implement it incidentally or keep the unsafe expressions accepted while postponing their semantics.

The user requested a plan, not another design interview. The plan contains enough defaults to proceed. Ask only if a concrete contradiction or missing consequential decision emerges; do not reopen every listed tradeoff before starting.

## Execution and verification

Follow Tasks 0–9 in the plan. Establish the baseline first; use regression-first changes and reviewable commits. Avoid concurrent edits to `useGame.ts` across lifecycle and session work.

Do not weaken the fixed dependencies, deterministic engine, public display projections, hidden-information restrictions, paired-world comparison, authored balance or accessibility gates. The plan specifies exact focused checks and the full local completion gate.

No runtime test suite, build, balance gate or browser gate was run for this documentation-only delivery. The planning document's referenced paths, task sections and Markdown structure were checked. Subagents used source inspection and temporary/in-memory reproductions; those experiments are evidence to turn into committed regressions, not a substitute for execution gates.

The repository's documented GitHub Actions billing block means local gates matter. Check that port 4173 is free before the browser suite to avoid testing a stale build. Keep any isolated worktree outside the repository: nested checkouts previously interfered with lint.

Existing human-only playtest and design-review items remain open where the project records them. Do not mark them complete based on automated checks.

## Suggested skills

Use equivalent Cursor capabilities if a named skill is not available:

- `superpowers:executing-plans` — execute the committed plan task by task.
- `superpowers:test-driven-development` — regressions before behaviour changes.
- `codebase-design` — preserve the module/interface/seam/depth vocabulary and deletion test.
- `diagnosing-bugs` or `superpowers:systematic-debugging` — investigate any failed baseline or unexpected regression before changing code.
- `superpowers:verification-before-completion` — collect actual completion evidence.
- `code-review` or `review` — review implementation against project decisions and this plan.

The earlier request explicitly selected **Sol** for the three completed exploration subagents. It does not require parallel implementation or establish a model choice for the Cursor session. Use the user's configured Cursor model unless they direct otherwise.

## Expected final handback

Report implemented tasks, commits, focused and full-gate results, compatibility evidence, any genuinely outstanding blockers and deferred work. Distinguish implemented mandatory work from the optional condition-language expansion. Leave merge and deployment to the user's existing review workflow.
