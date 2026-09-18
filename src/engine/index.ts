// Public engine API (handoff Section 3). Everything outside src/engine talks to
// the engine through this file and nothing else.

import type { Content, CounterfactualResult, DecisionRecord, SimResult, Strategy } from "./types";

export type * from "./types";
export { createGame, reduce } from "./reduce";
export { displayed } from "./display";

function notImplemented(name: string): never {
  throw new Error(`engine.${name} is not implemented yet`);
}

/** Arrives with the balance harness in Phase 3. */
export function simulate(_strategy: Strategy, _runs: number, _content: Content): SimResult {
  return notImplemented("simulate");
}

/** Arrives with the debrief in Phase 6. */
export function counterfactual(
  _history: DecisionRecord[],
  _changeAt: number,
  _newChoiceId: string,
  _runs: number,
  _content: Content,
): CounterfactualResult {
  return notImplemented("counterfactual");
}
