// Runs the debrief's heavy work off the main thread, so a thousand reruns never
// freeze the page (handoff Phase 6). The engine is pure, so the worker simply
// loads the same content and calls the same functions.

import { applyOverrides, loadContent } from "../content";
import { counterfactual, soundness } from "../engine";
import type { WorkerRequest, WorkerResponse } from "./counterfactual.protocol";

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
