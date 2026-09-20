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

`npm run build` writes a self-contained bundle to `dist/` (about 2.0 MB, well under the 16 MB limit). It uses relative paths, so it runs from any static host or sub-path. There is nothing to configure and no server to run.

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
| `src/ui/` | React screens that render `displayed(state)`, and pure, unit-tested helpers for what they say and preview (`copy.ts`, `preview.ts`, `preparation.ts`, `consequences.ts`). Raw game state stays inside `session.ts` and `useGame.ts` |
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
- [docs/plans/2026-09-20-architecture-reliability.md](docs/plans/2026-09-20-architecture-reliability.md): debrief-calculation recovery, effective configuration, condition contract and completed-turn ownership
- [docs/playtest.md](docs/playtest.md): how to run the newcomer playtest and time each step
- [DECISIONS.md](DECISIONS.md): every choice made where the spec was silent, every number that is not in the spec, and the balance-tuning log, including why Rule 7 is judged across all worlds pooled

## Status

The seven build phases are complete. The public-audience redesign (Phases 8 to 15 in [docs/plan.md](docs/plan.md)) is on `main`; it awaits the designer's review and has not been deployed. Architecture reliability (calculation recovery, invalid `cfg` fallback, the supported condition contract, and completed-turn ownership) is on `codex/architecture-reliability`; [the plan](docs/plans/2026-09-20-architecture-reliability.md) records its local gate. The parts that need people remain open: a newcomer playtest with ten members of the public, the under-30-minute and about-three-minutes-a-turn timing checks, the "would defend a decision despite its outcome" measure, and the designer's sign-off on the redesign's decisions (`DECISIONS.md` section F). See the end of [docs/plan.md](docs/plan.md) and [docs/playtest.md](docs/playtest.md).
