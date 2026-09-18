# AI 2032

A 25-minute browser decision game about governing frontier AI from a UK middle-power position, under uncertainty the game makes mechanical rather than narrative. Static single-page app: no backend, no accounts, no database.

**Status:** under construction. Progress is tracked in [docs/plan.md](docs/plan.md).

## Run, build, test

Requires Node 20 or later.

```bash
npm install
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run test` | Run the engine and content test suites (Vitest) |
| `npm run lint` | ESLint, including the engine-isolation and banned-API rules |
| `npm run build` | Type check, then produce the static bundle in `dist/` |
| `npm run preview` | Serve the built bundle locally |

`npm run balance` (10,000 simulated games per world profile) arrives with Phase 3.

## How the project is organised

| Path | Contents |
| --- | --- |
| `src/engine/` | The game. Pure, deterministic TypeScript. No React, no DOM, no wall clock, no `Math.random` |
| `src/content/` | Scenarios, events, advisers and endings as JSON, validated by Zod at load |
| `src/ui/` | React screens that render `displayed(state)`. Imports the engine only through `src/engine/index.ts` |
| `src/workers/` | Web Worker for counterfactual reruns |
| `scripts/` | The balance harness |
| `tests/` | Engine and content tests |
| `docs/` | The design spec, the build handoff and the implementation plan |

## Documents

- [docs/spec.md](docs/spec.md): Game Design Specification v2
- [docs/handoff.md](docs/handoff.md): the build handoff
- [docs/plan.md](docs/plan.md): the agreed implementation plan and its progress
- [DECISIONS.md](DECISIONS.md): every choice made where the spec was silent, including all numbers that are not in the spec

The seed-code format and the facilitator panel are documented here once they exist (Phase 7).
