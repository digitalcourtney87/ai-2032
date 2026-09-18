import { expect, test } from "vitest";
import { createGame, reduce, type Action, type Content } from "../../src/engine";

// Phase 0: the engine is a set of stubs, so this test is red. It is recorded as
// an expected failure (`test.fails`) so the suite stays green while the defect is
// visible. Phase 1 swaps in a real fixture and turns this into a plain `test`.
// See DECISIONS.md, "Phase 0 contradiction".
const content: Content = { scenarios: [] };
const actions: Action[] = [
  { type: "FORECAST", value: 0.4 },
  { type: "DECIDE", choiceId: "A" },
  { type: "INVEST", track: "evaluation" },
  { type: "ADVANCE" },
];

function play(seedCode: string): string {
  let state = createGame(seedCode, content);
  for (const action of actions) state = reduce(state, action, content);
  return JSON.stringify(state);
}

test.fails("the same seed and actions give a byte-identical final state across 100 runs", () => {
  const first = play("TEST-SEED");
  for (let run = 1; run < 100; run++) expect(play("TEST-SEED")).toBe(first);
});
