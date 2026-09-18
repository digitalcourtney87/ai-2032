// Runs the debrief's heavy work off the main thread, so a thousand reruns never
// freeze the page (handoff Phase 6). The engine is pure, so the worker simply
// loads the same content and calls the same functions.

import { applyOverrides, loadContent, type Overrides } from "../content";
import { counterfactual, soundness, type CounterfactualResult, type DecisionRecord, type GameState, type OptionEstimate, type Profile } from "../engine";

export type WorkerRequest =
  | { id: number; kind: "configure"; overrides: Overrides }
  | { id: number; kind: "soundness"; decisionStates: GameState[]; rollouts: number }
  | { id: number; kind: "whatIf"; history: DecisionRecord[]; changeAt: number; newChoiceId: string; runs: number; profile: Profile; baseSeed: number };

export type WorkerResponse =
  | { id: number; kind: "soundness"; estimates: OptionEstimate[][] }
  | { id: number; kind: "whatIf"; result: CounterfactualResult; milliseconds: number }
  | { id: number; kind: "configured" }
  | { id: number; kind: "error"; message: string };

const bundled = loadContent();
let content = bundled;
const scope = self as unknown as { onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null; postMessage: (message: WorkerResponse) => void };

scope.onmessage = ({ data }) => {
  try {
    if (data.kind === "configure") {
      content = applyOverrides(bundled, data.overrides);
      scope.postMessage({ id: data.id, kind: "configured" });
    } else if (data.kind === "soundness") {
      scope.postMessage({ id: data.id, kind: "soundness", estimates: data.decisionStates.map((state) => soundness(state, data.rollouts, content)) });
    } else {
      const started = Date.now();
      const result = counterfactual(data.history, data.changeAt, data.newChoiceId, data.runs, content, { profile: data.profile, baseSeed: data.baseSeed });
      scope.postMessage({ id: data.id, kind: "whatIf", result, milliseconds: Date.now() - started });
    }
  } catch (error) {
    scope.postMessage({ id: data.id, kind: "error", message: error instanceof Error ? error.message : String(error) });
  }
};
