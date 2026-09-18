// Public engine API (handoff Section 3). Everything outside src/engine talks to
// the engine through this file and nothing else.
//
// Phase 0: typed stubs only. Each throws until Phase 1 implements it, which is
// what keeps the determinism test honestly red.

import type {
  Action,
  Content,
  CounterfactualResult,
  DecisionRecord,
  DisplayedState,
  GameState,
  SimResult,
  Strategy,
} from "./types";

export type * from "./types";

function notImplemented(name: string): never {
  throw new Error(`engine.${name} is not implemented yet`);
}

export function createGame(_seedCode: string, _content: Content): GameState {
  return notImplemented("createGame");
}

export function reduce(_state: GameState, _action: Action, _content: Content): GameState {
  return notImplemented("reduce");
}

export function displayed(_state: GameState): DisplayedState {
  return notImplemented("displayed");
}

export function simulate(_strategy: Strategy, _runs: number, _content: Content): SimResult {
  return notImplemented("simulate");
}

export function counterfactual(
  _history: DecisionRecord[],
  _changeAt: number,
  _newChoiceId: string,
  _runs: number,
  _content: Content,
): CounterfactualResult {
  return notImplemented("counterfactual");
}
