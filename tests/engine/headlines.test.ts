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
