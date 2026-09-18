# AI 2032 - build guide for Claude Code

A browser game about governing frontier AI from a UK middle-power position.
The full design is in `docs/spec.md`; the build handoff is `docs/handoff.md`;
the agreed plan and its progress are in `docs/plan.md`; every choice made where
the spec was silent is in `DECISIONS.md`.
Read all four before writing code. Where spec and handoff disagree, the spec
wins - raise it. Where `DECISIONS.md` amends either, `DECISIONS.md` wins.

## The one rule that matters most
The engine is the game. It is pure TypeScript. It is deterministic.
Everything else renders it. If you are about to weaken any of those three
properties, stop and ask.

## Hard constraints
- No backend, no auth, no database. Static SPA only.
- `src/engine/**` and `src/content/**` must not import from `src/ui/**`.
- `src/ui/**` imports the engine only through `src/engine/index.ts`.
- No `Math.random`, `Date`, `crypto` or `performance` anywhere in `src/engine`.
  All randomness comes from the seeded mulberry32 generator in `src/engine/rng.ts`:
  sequential draws thread through `GameState.rngState`; event rolls and briefing
  signals are keyed draws derived from `(seed, id)` (DECISIONS.md, decision 10).
- Game content is JSON validated by Zod. No scenario-specific logic in the engine.
- True metric values never reach a component except through `displayed()`,
  and true systemicRisk/cooperation/stateCapacity only after the debrief.
- Runtime dependencies are fixed: react, react-dom, react-is, zod, recharts.
  Dev dependencies are listed in DECISIONS.md, decision 8. Ask before adding anything.

## Workflow
- Build in the seven phases in `docs/plan.md`. Each has an acceptance gate.
  Do not start a phase until the previous gate is green.
- Commit on `main` at each green gate without asking, and push the gate commit to GitHub
  (the designer authorised gate pushes on 2026-09-18). CI runs lint, tests, balance and build.
- Stop and wait for the designer at: the Phase 2 provisional-numbers sign-off,
  the Phase 4 human playtest, and completion.
- Update the status emojis and progress percentage in `docs/plan.md` as you go.
- Engine and content first. No UI until Phase 1 tests pass.
- When the spec is silent or contradictory, choose, log it in `DECISIONS.md`,
  and move on. Any number not in the spec goes in the provisional-numbers table.
  Tune balance in the JSON, never in the engine.

## Copy rules for any player-facing text
- British English.
- Prefix every simulated statistic with "Under this game's assumptions".
- Never tell the player a decision was right or wrong.
- Show causal links with the probability change they caused, not as fate.
- Biosecurity content stays at policy level: no technical specifics.

## Commands
- `npm run dev` - dev server
- `npm run test` - Vitest (engine + content)
- `npm run balance` - 10,000 runs per world profile. Fails if any fixed strategy
  tops 40% pooled across worlds (Rule 7), or if a scripted scenario's waiting or
  most restrictive option is never best in any profile (Rules 4 and 5).
  Add `-- --table` for every option's value
- `npm run e2e` - Playwright browser tests against the production bundle (crisis
  turns, debrief, 3-second budget, axe, keyboard, reproducibility)
- `npm run build` - type check, then static bundle (must stay under 16 MB)
- `npm run lint` - includes the engine-isolation and banned-API rules

## Definition of done
See section 7 of `docs/handoff.md`. In short: all gates green, balance passes,
a newcomer finishes in under 30 minutes, and the debrief makes them argue
about a decision rather than accept a verdict. The human-only items listed at
the end of `docs/plan.md` are reported as open, never claimed as done.
