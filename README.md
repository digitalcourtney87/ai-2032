# AI 2032

A 25-minute browser decision game about governing frontier AI from a UK middle-power position, under uncertainty the game makes mechanical rather than narrative. The player forecasts, buys information, decides and invests across eight turns, then reads a debrief that separates what they decided from what the dice delivered.

Static single-page app: no backend, no accounts, no database, no analytics. Nothing a player does leaves their browser.

## Run, build, test

Requires Node 20 or later.

```bash
npm install
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run test` | Engine, content and copy-rule tests (Vitest) |
| `npm run lint` | ESLint, including the engine-isolation, banned-API and hidden-content rules |
| `npm run build` | Type check, then produce the static bundle in `dist/` |
| `npm run preview` | Serve the built bundle locally |
| `npm run balance` | The balance harness. Rule 7: plays 10,000 paired-seed games per world profile for three fixed strategies and fails if any gives the best ending score in more than 40% of runs, pooled across the profiles at their published weights. Rules 4 and 5: fails unless, in every scripted scenario, the waiting option and the most restrictive option are each the best choice in at least one world profile |
| `npm run balance -- --table` | Also print every option's value in every profile |
| `npm run balance -- --runs 2000 --value-runs 1000` | A quicker reading while tuning numbers |
| `npm run e2e` | Playwright browser tests against the production bundle: crisis turns, the debrief, the 3-second rerun budget, accessibility (axe), keyboard play, reproducibility. First run `npx playwright install chromium` |

Balance is tuned in the JSON under `src/content/`, never in the engine. Every change is logged in `DECISIONS.md` section E.

## Deploying

`npm run build` writes a self-contained bundle to `dist/` (about 2 MB, well under the 16 MB limit). It uses relative paths, so it runs from any static host or sub-path. There is nothing to configure and no server to run.

## Seed codes

Every game is fixed by a seed code, shown in the header and carried in the URL as `?seed=K7Q2-M9XD`.

- The same seed code and the same actions always give the same run, start to finish.
- Everyone who enters the same code plays the same hidden world **and faces the same dice**. If two players both cut the odds of an event, it fires for both or for neither; outcomes differ only where decisions differ. That is what makes a workshop comparison fair.
- Codes are case-insensitive. The box is under **Play the same world as a friend** on the title screen, and opens by itself when the URL carries a code. Leave it blank and the game makes a new eight-character code (Crockford base32, so no I, L, O or U to misread).
- A code reveals nothing about the world behind it: it is hashed to a 32-bit number, and the profile and five latent facts are drawn from that.

Share a run by sharing the URL.

## Facilitator panel

Open the game with `?facilitator=1` to see **Facilitator settings** on the title screen. Every probability in the game is a design assumption, and a facilitator can edit two kinds:

- **How the hidden world is drawn:** the weight of each world profile (benign, contested, hard) and the odds of each of the five latent facts within each profile.
- **Base odds of events:** for example the chance of a disruptive infrastructure attack when offence leads.

Then:

- **Apply to this page** reloads with the edits in force.
- **Copy participant link** copies a link containing the seed code and the edits (`?seed=...&cfg=...`), without the facilitator flag. Everyone who opens it plays the same seed under the same edited assumptions, and sees a notice on the title screen saying the assumptions were edited.
- **Reset to the published assumptions** clears the edits.

Only changed numbers are encoded. A malformed or out-of-range `cfg` is ignored rather than breaking the game. What-if reruns and luck tags use the edited numbers, and the debrief's **View assumptions** tables show exactly what is in force, so a participant who disputes the model can change it and rerun.

## Collecting run data

There is no backend, so the debrief ends with **Copy run summary**: the seed code, every choice, forecast and investment, the Brier score and the ending, as text or JSON. It goes to the clipboard and nowhere else; the player decides whether to paste it to a facilitator.

## How the project is organised

| Path | Contents |
| --- | --- |
| `src/engine/` | The game. Pure, deterministic TypeScript. No React, no DOM, no wall clock, no `Math.random` |
| `src/content/` | Scenarios, events, advisers and endings as JSON, validated by Zod at load. `index.ts` is the only door from the interface: it serves a public view with hidden effects stripped, and publishes the assumptions to the debrief |
| `src/ui/` | React screens that render `displayed(state)`. The raw game state never leaves `useGame.ts` |
| `src/workers/` | Web Worker for what-if reruns and luck-tag rollouts |
| `scripts/` | The balance harness |
| `tests/`, `e2e/` | Vitest suites for the engine, content and copy rules; Playwright suites for the browser gates |
| `docs/` | The design spec, the build handoff and the implementation plan |

## Documents

- [docs/spec.md](docs/spec.md): Game Design Specification v2
- [docs/handoff.md](docs/handoff.md): the build handoff
- [docs/plan.md](docs/plan.md): the implementation plan, its progress, and the items only people can complete
- [DECISIONS.md](DECISIONS.md): every choice made where the spec was silent, every number that is not in the spec, and the balance-tuning log, including why Rule 7 is judged across all worlds pooled

## Status

All seven build phases are complete and their automated gates pass. The parts of the definition of done that need people (a ten-tester playtest, the under-30-minute check, the "would defend a decision despite its outcome" measure, and the willingness-to-pay sessions) are open; see the end of [docs/plan.md](docs/plan.md).
