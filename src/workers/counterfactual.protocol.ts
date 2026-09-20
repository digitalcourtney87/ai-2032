// Message types for the debrief worker. This file must stay type-only: importing
// it must never construct a worker, load content, or touch globals.

import type { Overrides } from "../content";
import type { CounterfactualResult, DecisionRecord, GameState, OptionEstimate, Profile } from "../engine";

export type WorkerRequest =
  | { id: number; kind: "configure"; overrides: Overrides }
  | { id: number; kind: "soundness"; decisionStates: GameState[]; rollouts: number }
  | { id: number; kind: "whatIf"; history: DecisionRecord[]; changeAt: number; newChoiceId: string; runs: number; profile: Profile; baseSeed: number };

export type WorkerResponse =
  | { id: number; kind: "soundness"; estimates: OptionEstimate[][] }
  | { id: number; kind: "whatIf"; result: CounterfactualResult; milliseconds: number }
  | { id: number; kind: "configured" }
  | { id: number; kind: "error"; message: string };
