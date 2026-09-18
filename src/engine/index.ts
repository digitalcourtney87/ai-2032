// Public engine API (handoff Section 3). Everything outside src/engine talks to
// the engine through this file and nothing else.

import type { Content, CounterfactualResult, DecisionRecord } from "./types";

export type * from "./types";
export { createGame, reduce } from "./reduce";
export { displayed } from "./display";
export { simulate } from "./simulate";

/** Arrives with the debrief in Phase 6. */
export function counterfactual(
  _history: DecisionRecord[],
  _changeAt: number,
  _newChoiceId: string,
  _runs: number,
  _content: Content,
): CounterfactualResult {
  throw new Error("engine.counterfactual is not implemented yet");
}
